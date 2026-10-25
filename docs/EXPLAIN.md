# How it works (plain English)

## The page and the loop
- `src/main.tsx` mounts `src/Play.tsx`. Play.tsx shows the canvas, the "click to start" screen (browsers need a click before they allow sound), the red warning banner, the results card and the mute button.
- `src/game/Game.ts` owns the canvas and runs a 60-steps-per-second loop: read the keyboard, move the player, advance the round clock, apply radiation, draw. It tells React only when something changes (phase, banner, results).
- The tile renderer picks the Mars or Moon ground and ledge images. It draws a 32 × 8 ledge sprite once across each continuous row of ledge tiles; if the image has not loaded, it draws the existing flat-color tile fallback.

## A round
- `planRound` picks Mars or Moon (they alternate) and a drill level. The `RoundMachine` timer walks EXPLORE (20 s) -> WARNING (12 s) -> DISASTER (40 s) -> RESULTS (8 s) -> INTERMISSION (8 s).
- `generateMap` builds the level from a seed (hills, a crater, ledges, shelters, coins). `reachability.ts` runs a breadth-first search to prove every shelter can be reached; if not it tries the next seed (max 20), then a flat fallback. Mars also gets an airlock, which works like another habitat.
- `physics.ts` moves the player and pushes them out of solid tiles. `bodies.ts` keeps the real Moon:Mars gravity ratio, which sets jump height.
- During DISASTER, `dose.ts` computes radiation: peak rate x ramp x shield factor of where you stand (outside 1.0, habitat/airlock 0.5, storm shelter 0.1). At 250 mSv you are EVAC'D. `?fast=1` speeds the round up for testing and scales the dose by the same amount.
- `coins.ts` turns the round into coins (+1 per second alive in warning/disaster, +10 for surviving, +5 per pickup, capped).

## Real data
- `liveWeather.ts` fetches NOAA's current S-level and proton flux straight from the browser (CORS is open) when the page loads and then at most every 5 minutes. `noaa.ts` parses the JSON defensively and returns null for anything odd. If the fetch fails, `sampleWeather.ts` uses real responses we saved in `noaa-sample/`.
- The HUD says DRILL when the real sun is quiet (S0). Only a real S1 or higher is called LIVE. It also shows `live`/`sample` and the time NOAA made the reading.
- The map seed is a hash of that reading time + round number + body, so the same reading gives the same map. This includes round 1 (it uses the live reading if it has arrived when you click Start, otherwise the saved sample's time). `?seed=<number>` is a debug-only override for round 1.
- `facts.ts` holds the only real-world facts the results card may show, each with a source and a status (real / derived / proposed). The "What's real vs. tuned?" button on the results card lists which numbers are real, proposed or tuned.

## Sound
- `scripts/bake-audio.ts` and `bake-sfx.ts` (run on a teammate's computer with a git-ignored ElevenLabs key) create the mp3 files in `public/audio/`. The key never reaches the browser.
- `voice.ts` plays a baked clip for each warning / evac / all-clear line. If the clip is missing, errors, or does not start within 1.5 s, it uses the browser's built-in voice. Clips are preloaded after the click-to-start. Only one voice line plays at a time.
- New voice lines: a drill notice at the start of each drill round's EXPLORE phase, and the round's fact card read aloud 3 s into RESULTS. Both show a caption at the bottom of the screen and use the same `playLine` fallback chain. Drill levels now cycle S2, S3, S4, S5, then repeat.
- `sfx.ts` plays the effects (Geiger click, klaxon, coin, jump) and the looping Mars wind / Moon suit hum. Mute silences everything.

## Saving and art
- `saveCoins.ts` keeps total coins and career dose in the browser's `localStorage`, with safe fallbacks if storage is blocked.
- `src/art/` holds the hand-made sprites and palettes. `spriteLoader.ts` draws them, and the game falls back to flat shapes if a picture is missing.

## Guardrail
- `src/rules.test.ts` fails if any web address other than NOAA or ElevenLabs appears in our code (our "max 2 outside services" rule).
