# Jellyfin Media Bar for webOS 4.x

A lightweight, static media bar for older LG webOS clients that cannot reliably run modern JavaScript used by newer Jellyfin UI customisations.

This project was built and tested on an **LG OLED55B8PLA (webOS 4.x)** with **Jellyfin 12.1.0**.

> This is an unofficial community customisation. It is not an official Jellyfin plugin.

## What it does

- Adds a large static featured-media bar to the Jellyfin home screen on detected LG/webOS clients.
- Uses backdrop images only — **no trailer or video background**.
- Shows:
  - title
  - community rating
  - production year
  - official age rating
- Adds two buttons:
  - **Play** — uses Jellyfin's native `.btnPlay` flow so playback remains handled by the client.
  - **Information** — opens the normal Jellyfin details page.
- Keeps the initial focus on **Home** so the app opens at the top of the page instead of jumping to the first media card.
- Uses a short startup mask to hide the temporary details-page transition used to trigger native playback.
- Caches the last shown item in `localStorage` so subsequent app launches can show a backdrop sooner.
- Activates only when an LG/webOS user agent is detected, leaving normal desktop/mobile browser behaviour unchanged.

## Why this exists

Older LG TVs use an older embedded browser engine. In our test setup, Media Bar Enhanced 3.8.0 contained JavaScript syntax that the LG B8 browser could not parse, so the media bar did not render correctly even though its CSS was loaded.

Rather than patching a large modern bundle, this project uses deliberately conservative JavaScript syntax (`var`, classic functions, Promise chains) and a small amount of CSS.

## Tested setup

- TV: LG OLED55B8PLA
- webOS: 4.x generation
- Jellyfin Server/Web: 12.1.0
- Media Bar Enhanced: 3.8.0 present during testing
- Home Screen Sections: 3.0.2.0 present during testing

Other LG/webOS models may work, but have not been verified.

## Files

```text
lg-b8-media-bar.js   Client logic
lg-b8-media-bar.css  Styling
install.sh           Installs the files and injects references into index.html
uninstall.sh         Removes this customisation
```

## Installation

### Automatic

Run as root on the Jellyfin server:

```bash
git clone https://github.com/josecarvalhosa-lab/Jellyfin-Media-bar-with-WebOS-4.0.git
cd Jellyfin-Media-bar-with-WebOS-4.0
chmod +x install.sh uninstall.sh
sudo ./install.sh
```

Then fully close and reopen the Jellyfin app on the TV.

### Manual

1. Back up Jellyfin's web index:

```bash
cp -a /usr/share/jellyfin/web/index.html /root/index.html.before-lg-webos-media-bar
```

2. Copy the files:

```bash
cp lg-b8-media-bar.js /usr/share/jellyfin/web/
cp lg-b8-media-bar.css /usr/share/jellyfin/web/
chmod 644 /usr/share/jellyfin/web/lg-b8-media-bar.js
chmod 644 /usr/share/jellyfin/web/lg-b8-media-bar.css
```

3. Add these lines immediately before `</head>` in `/usr/share/jellyfin/web/index.html`:

```html
<link rel="stylesheet" href="lg-b8-media-bar.css?v=1">
<script defer="defer" src="lg-b8-media-bar.js?v=1"></script>
```

4. Fully close and reopen the Jellyfin app on the TV.

## Uninstall

```bash
sudo ./uninstall.sh
```

This removes only the two injected references and the two custom files.

## Jellyfin updates

A Jellyfin update may replace `/usr/share/jellyfin/web/index.html`. If that happens, run `install.sh` again.

The installer creates a timestamped backup of `index.html` before changing it.

## Configuration

The default visual values are intentionally close to the setup tested on the LG B8:

- media bar height: `760px`
- image frame width: `70%`
- image quality: `1920px / quality 85`
- rotation interval: `12 seconds`

These can be changed directly in the CSS/JS files.

## Security / privacy

No server address, user name, library ID, API key, or access token is hard-coded.

The script reads the active Jellyfin client's existing session information from `window.ApiClient` and only talks back to the same Jellyfin server already in use.

## Notes

The **Play** button intentionally opens the item's details page internally and then triggers Jellyfin's visible native `.btnPlay` button. A temporary full-screen backdrop mask hides most of that transition. This method was used because sending a remote `PlayNow` command to the LG session was accepted by the server but did not start playback on the tested TV.

## License

No license has been added yet. Add one before encouraging broad redistribution if you want to define reuse/modification terms.
