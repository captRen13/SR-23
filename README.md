# Star Runner 2.1 — Mission Control

Star Runner 2.1 expands the SR-23 Chronometer into a mobile-first mission operations interface while preserving the SRGS 1.0 timekeeping rules.

## Release 2.1.0
- Galactic Stardate and Galactic Standard Time chronometer
- Galactic timeline navigator and Earth-to-Galactic converter
- Mission register with create, status update, and delete actions
- Departure countdowns and Galactic departure timestamps
- Mission records currently stored locally in the browser on the current device
- Service worker registration, offline app-shell fallback, cache versioning, and update awareness

## Phase 4A — Local data foundation
- `Core/SR-Data-Store.js`: versioned IndexedDB foundation with stores for vessels, crew, missions, calendar, and system metadata
- Legacy mission migration validates existing records and copies them into IndexedDB transactionally
- The original `star-runner-missions-v1` localStorage record is deliberately retained as a recovery copy
- The IndexedDB module is cached by the service worker; application integration is a subsequent implementation step

## Files
- `index.html`: application interface and chronometer logic
- `manifest.json`: installable web-app metadata
- `sw.js`: versioned offline caching and update lifecycle
- `Core/SRGS-Core.js`: shared Galactic Standard time calculation engine
- `Core/SR-Data-Store.js`: local-first structured data foundation
- `Widgets/SR-23-Chronometer.js`: companion Scriptable widget
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
The current Mission Register continues to use browser local storage until the IndexedDB integration step is completed. The Phase 4A migration foundation does not delete or modify the original localStorage records. Clearing website data or switching browsers/devices can remove or make local records unavailable. Do not enter sensitive or classified information.

## Deploy with GitHub Pages
The project is designed to publish from the repository root using GitHub Pages. After deployment, open the Pages URL in Safari and use Share → Add to Home Screen. Open the app once while online to install the current offline app shell.

GitHub Pages is a public static website. Never commit private, personal, operationally sensitive, or classified information.
