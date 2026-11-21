# SR-23 Chronometer — SRGS 1.0 prototype

## Files
- `index.html`: clock, calendar, and system information
- `manifest.json`: installable web-app metadata
- `sw.js`: offline caching service worker
- `icon-192.png`, `icon-512.png`: app icons

## Calendar and clock rules
Epoch: 1968-12-21 12:51:00 UTC (Apollo 8 launch)
1 Galactic Cycle = 100,000 SI seconds
100 Cycles = 1 Group
100 Groups = 1 Block
Clock format: Interval.Segment.Unit.Tick
- 10 intervals per cycle, 10,000 seconds each
- 100 segments per interval, 100 seconds each
- 100 units per segment, 1 second each
- 100 ticks per unit, 0.01 seconds each

Stardate format: Block.Group.Cycle (zero-based).
The app calculates elapsed time from the device's current system timestamp. This prototype is not synchronized to an external time authority and does not implement relativistic corrections or leap-second-aware UTC/TAI conversion.

## Publish using GitHub Pages from an iPhone
1. Extract this ZIP in the iPhone Files app.
2. In Safari, sign in to GitHub and create a new public repository named `sr23-chronometer`.
3. Upload the five files from the extracted folder (`index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`) to the repository's root.
4. Open the repository Settings → Pages.
5. Under Build and deployment, choose Deploy from a branch; select `main` and `/ (root)`, then Save.
6. Wait for GitHub Pages to publish. The site URL will look like `https://YOUR-USERNAME.github.io/sr23-chronometer/`.
7. Open that URL in Safari on your iPhone, tap Share → Add to Home Screen → Add.

For offline caching, open the published site once while online, then launch it from the Home Screen. iOS may suspend web apps in the background; the clock recalculates when reopened.

GitHub Pages is a public static website. Do not put private information in this repository.
