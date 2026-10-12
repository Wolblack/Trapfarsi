# TRAPFARSI

**Music, with intention.** A responsive music-discovery interface with a glass/neumorphic visual system.

## Run locally

No build step or package manager is required.

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. For installable/offline behavior, serve the folder over HTTPS or localhost (service workers do not work from most `file://` URLs).

Example local server with Python:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Current features

- Responsive Discover, New Releases, Artists, Library, Search, Album Details, and Now Playing views.
- Release filters and search.
- Browser-local saved library and search history.
- Import local audio files to play them through the player; files are not uploaded.
- Queue, play/pause, next/previous, seek, volume, and mini-player controls.
- Installable web-app manifest and a small offline app shell for the core interface.

## Important limitations

- The release catalogue, artist details, and artwork are demonstration/editorial data. They are not a verified music database.
- Local audio files are available only in the current browser session. They are not uploaded, streamed to other users, or synced between devices.
- This repository does not include licensed commercial music, user accounts, cloud sync, payments, or a production backend.
- Offline caching covers the app shell. Remote fonts and remote artwork may not load without an internet connection.
- GitHub Pages is static hosting; account-based services and server-side features require a backend and separate deployment.

## Deployment

The site can be hosted on GitHub Pages from the repository's `main` branch. Keep paths relative (for example `./manifest.json` and `./sw.js`) so the project works under the `/Trapfarsi/` subpath.

## Privacy

Imported audio uses browser object URLs and is not transmitted by this application. Browser-local library/search data is stored in localStorage. Do not import sensitive files on a shared device.
