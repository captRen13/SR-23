# SR-23 Modular Desktop Interface — Rainmeter 0.2.0

The SR-23 Windows HUD is being rebuilt as independent, draggable Rainmeter modules. It is designed to sit over the normal Windows desktop rather than replace it.

## Modules

- `Astra.ini`: central Astra identity and assistant-console visual shell. This is not yet connected to a live AI service.
- `Chronometer.ini`: Galactic Stardate, Galactic Standard Time, Earth UTC, and cycle progress.
- `Navigation.ini`: compact navigation rail.
- `Systems.ini`: engineering panel reserved for real Windows telemetry; no fake readings are shown.
- `SR-23.ini`: original monolithic prototype, retained for reference. Do not load it alongside the new modules unless you want the old layout too.
- `@Resources/Scripts/Chronometer.lua`: shared local chronometer engine.

## Install or update

1. Download the repository ZIP from GitHub and extract it.
2. Copy the `Rainmeter/SR-23` folder into `Documents\Rainmeter\Skins\`, replacing older copies when prompted.
3. Right-click the Rainmeter tray icon and choose **Manage**.
4. Click **Refresh all**.
5. Expand `SR-23` in the left-hand skin list.
6. Load `Astra.ini`, `Chronometer.ini`, `Navigation.ini`, and `Systems.ini` individually.
7. Drag each module into position. Each module can be moved, hidden, and loaded independently.

Expected folder structure:

```
Documents\Rainmeter\Skins\SR-23\
  Astra.ini
  Chronometer.ini
  Navigation.ini
  Systems.ini
  SR-23.ini
  @Resources\
    Scripts\
      Chronometer.lua
```

## Time model caveat

The chosen epoch is Galactic Epoch 000 at Apollo 8's launch, 1968-12-21 12:51:00 UTC. The current prototype also uses a provisional subdivision model (100,000 SI seconds per cycle; 100 cycles per group; 100 groups per block). Those subdivisions are implementation assumptions, not yet confirmed as final SRGS canon.

The chronometer uses the Windows system clock. It is not an independently synchronized time authority and does not currently implement leap-second or relativistic corrections.

## Current scope

The assistant console is a visual interface shell, not a working microphone, chat, or voice integration. Navigation, operations, knowledge, and engineering integrations will be developed separately. Crew and asset tracking remains out of scope until the core HUD is established.