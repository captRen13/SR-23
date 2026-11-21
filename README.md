# Star Runner 2.1 — Mission Control

Star Runner 2.1 expands the SR-23 Chronometer into a mobile-first mission operations interface while preserving the SRGS 1.0 timekeeping rules.

## Release 2.1.0
- Galactic Stardate and Galactic Standard Time chronometer
- Galactic timeline navigator and Earth-to-Galactic converter
- Mission register with create, status update, and delete actions
- Departure countdowns and Galactic departure timestamps
- Mission records stored locally in the browser on the current device
- Service worker registration, offline app-shell fallback, cache versioning, and update awareness

## Files
- `index.html`: application interface and chronometer logic
- `manifest.json`: installable web-app metadata
- `sw.js`: versioned offline caching and update lifecycle
- `SR-23-Stardate-Widget.js`: companion Scriptable widget
- `Rainmeter/`: desktop companion assets
- `icon-192.png`, `icon-512.png`: application icons

## SRGS 1.0 timekeeping rules
Epoch: 1968-12-21 12:51:00 UTC (Apollo 8 launch)
- 1 Galactic Cycle = 100,000 SI seconds
- 100 Cycles = 1 Group
- 100 Groups = 1 Block
- Clock format: Interval.Segment.Unit.Tick
- Stardate format: Block.Group.Cycle (zero-based)

The application derives elapsed time from the device system clock. It is not synchronized to an external time authority and does not implement relativistic corrections or leap-second-aware UTC/TAI conversion.

## Mission data and privacy
Mission records are saved in browser local storage on the device. They are not sent to GitHub or a remote server. Clearing website data or switching browsers/devices can remove or make those records unavailable. Do not enter sensitive or classified information.

## Deploy with GitHub Pages
The project is designed to publish from the repository root using GitHub Pages. After deployment, open the Pages URL in Safari and use Share → Add to Home Screen. Open the app once while online to install the current offline app shell.

GitHub Pages is a public static website. Never commit private, personal, operationally sensitive, or classified information.
