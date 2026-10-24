# How it works (plain English)

## Slice 1: single-player round on a fixed Mars map
- `src/Play.tsx` shows the canvas and the menus. A click starts the game (browsers need a click before they allow audio).
- `src/game/Game.ts` owns the canvas. It runs a 60-steps-per-second loop, reads the keyboard, moves the player, draws everything.
- Each round: `planRound` picks Mars/Moon and a drill level -> `generateMap` builds terrain from a seed -> the round timer (`RoundMachine`) moves through EXPLORE (20 s) -> WARNING (12 s) -> DISASTER (40 s) -> RESULTS (8 s).
- At the start of WARNING a banner and a spoken line appear (browser speech for now).
- During DISASTER radiation ramps up, holds, then eases (`dose.ts`). Dose = peak rate x ramp x shield factor of where you stand. 250 mSv = EVAC'D.
- `generateMap` (mapgen.ts) makes hills, a crater, ledges, 2-3 shelters; `reachability.ts` walks the map (BFS) to prove you can get to every shelter, else it tries the next seed (max 20), then a flat fallback.
- Weather: the game uses saved real NOAA files (`src/data/noaa-sample/`). Quiet sun (S0) = DRILL, never shown as live.
- All art is flat placeholder rectangles marked `TODO-ART (human)`.
