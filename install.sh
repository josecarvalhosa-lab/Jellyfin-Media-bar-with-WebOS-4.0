#!/bin/sh
set -eu

WEB_DIR="${JELLYFIN_WEB_DIR:-/usr/share/jellyfin/web}"
INDEX="$WEB_DIR/index.html"
JS_SRC="./lg-b8-media-bar.js"
CSS_SRC="./lg-b8-media-bar.css"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$INDEX.before-lg-webos-media-bar.$STAMP"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root (or with sudo)." >&2
  exit 1
fi

if [ ! -f "$INDEX" ]; then
  echo "Jellyfin web index not found: $INDEX" >&2
  echo "Set JELLYFIN_WEB_DIR if your Jellyfin web directory is elsewhere." >&2
  exit 1
fi

if [ ! -f "$JS_SRC" ] || [ ! -f "$CSS_SRC" ]; then
  echo "Run this installer from the repository directory." >&2
  exit 1
fi

cp -a "$INDEX" "$BACKUP"
echo "Backup created: $BACKUP"

cp "$JS_SRC" "$WEB_DIR/lg-b8-media-bar.js"
cp "$CSS_SRC" "$WEB_DIR/lg-b8-media-bar.css"
chmod 644 "$WEB_DIR/lg-b8-media-bar.js" "$WEB_DIR/lg-b8-media-bar.css"

python3 - "$INDEX" <<'PY'
from pathlib import Path
import re
import sys

p = Path(sys.argv[1])
s = p.read_text()

css = '<link rel="stylesheet" href="lg-b8-media-bar.css?v=1">'
js = '<script defer="defer" src="lg-b8-media-bar.js?v=1"></script>'

# Remove previous copies so reinstalling is idempotent.
s = re.sub(r'\s*<link[^>]+lg-b8-media-bar\.css\?v=\d+[^>]*>\s*', '\n', s)
s = re.sub(r'\s*<script[^>]+lg-b8-media-bar\.js\?v=\d+[^>]*></script>\s*', '\n', s)

marker = '</head>'
if marker not in s:
    raise SystemExit('ERROR: </head> not found in index.html')

inject = '    ' + css + '\n    ' + js + '\n'
s = s.replace(marker, inject + marker, 1)
p.write_text(s)
PY

echo "Installed:"
echo "  $WEB_DIR/lg-b8-media-bar.js"
echo "  $WEB_DIR/lg-b8-media-bar.css"
echo
echo "Fully close and reopen the Jellyfin app on the TV."
