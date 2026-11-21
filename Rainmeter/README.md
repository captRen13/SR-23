# SR-23 Command HUD — Rainmeter 0.1.0

The first Windows desktop HUD for the Star Runner. This is a separate desktop skin; it does not replace the existing GitHub Pages Chronometer.

## Included
- `SR-23.ini`: Rainmeter command-deck layout.
- `@Resources/Scripts/Chronometer.lua`: live SRGS 1.0 time engine.
- Live Galactic Stardate, Galactic Standard Time, cycle progress, UTC, and elapsed SI seconds.
- Clearly marked placeholders for Pilot's Log, Engineering, and Communications. No fake telemetry or location data is displayed.

## Install
1. Install Rainmeter for Windows from https://www.rainmeter.net/.
2. Download this repository folder (or the repository ZIP).
3. Copy the `SR-23` folder into `Documents\Rainmeter\Skins\`.
4. Open Rainmeter → Manage.
5. Expand `SR-23`, select `SR-23.ini`, and click Load.
6. Right-click the skin → Settings → Position → Center on screen if needed.

Expected folder structure:

```
Documents\Rainmeter\Skins\SR-23\
  SR-23.ini
  @Resources\
    Scripts\
      Chronometer.lua
```

## Time model
- Galactic Epoch 000: 1968-12-21 12:51:00 UTC (Apollo 8).
- 1 Galactic Cycle: 100,000 SI seconds.
- 100 Cycles: 1 Group.
- 100 Groups: 1 Block.
- Stardate: Block.Group.Cycle.
- GST: Interval.Segment.Unit.Tick.

The skin uses the Windows system clock's Unix timestamp and formats it as UTC. It is a local-device chronometer, not an independently synchronized time authority. Windows clock accuracy, leap-second handling, and relativistic corrections are outside this prototype.

## Current scope
This is the first HUD shell. The existing mobile-friendly Chronometer at https://captren13.github.io/SR-23/ remains intact. Next modules can add a persistent Pilot's Log, Windows performance telemetry, and navigation tools. Crew and asset tracking is intentionally excluded from this first HUD release.

## Visual direction
Industrial spacecraft instrumentation: near-black panels, restrained copper/amber accents, muted steel text, and high-contrast chronometric readouts.
