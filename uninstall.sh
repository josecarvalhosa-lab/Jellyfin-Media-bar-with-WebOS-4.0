#!/bin/sh
set -eu

WEB_DIR="${JELLYFIN_WEB_DIR:-/usr/share/jellyfin/web}"
INDEX="$WEB_DIR/index.html"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root (or with sudo)." >&2
  exit 1
fi

if [ ! -f "$INDEX" ]; then
  echo "Jellyfin web index not found: $INDEX" >&2
  exit 1
fi

python3 - "$INDEX" <<'PY'
from pathlib import Path
import re
import sys

p = Path(sys.argv[1])
s = p.read_text()

s = re.sub(r'\s*<link[^>]+lg-b8-media-bar\.css\?v=\d+[^>]*>\s*', '\n', s)
s = re.sub(r'\s*<script[^>]+lg-b8-media-bar\.js\?v=\d+[^>]*></script>\s*', '\n', s)

p.write_text(s)
PY

rm -f "$WEB_DIR/lg-b8-media-bar.js" "$WEB_DIR/lg-b8-media-bar.css"

echo "LG/webOS media bar removed."
echo "Restart or fully reopen Jellyfin clients if needed."
