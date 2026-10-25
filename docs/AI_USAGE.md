# AI usage log (Claude Code)

| date-time | file | what Claude did | human reviewer |
|---|---|---|---|
| 2026-10-24 11:38 | .gitignore, storm-shelter-geaux26/.gitignore | Added .env* and macOS ignores | TBD |
| 2026-10-24 11:38 | src/game/tunables.ts | Wrote all game constants, each tagged GAME VALUE or REAL | TBD |
| 2026-10-24 11:38 | src/shared/hash.ts, src/shared/contracts.ts | Wrote FNV-1a hash and the shared types | TBD |
| 2026-10-24 11:38 | src/game/world/{rng,tiles,bodies,mapgen,reachability}.ts + mapgen.test.ts | Seeded RNG, map generator with BFS reachability + retry/fallback, tests | TBD |
| 2026-10-24 11:38 | src/game/sim/{dose,coins,planRound,roundMachine,physics}.ts + sim.test.ts | Radiation dose, coin math, round planner, phase timer, AABB physics, tests | TBD |
| 2026-10-24 11:38 | src/data/{noaa,sampleWeather,facts}.ts, noaa-sample/*.json, noaa.test.ts | Defensive NOAA parsers, saved real samples, cited facts, tests | TBD |
| 2026-10-24 11:38 | src/audio/lines.ts | Warning / evac / all-clear text templates | TBD |
| 2026-10-24 11:38 | src/game/Game.ts, src/Play.tsx | Canvas game loop, input, placeholder-rect rendering (TODO-ART), HUD, results card | TBD |
| 2026-10-24 11:38 | docs/*.md, README.md | Docs and API-decision note | TBD |
| 2026-10-24 11:44 | package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx, src/Play.tsx | Moved the app to the repo root as a plain Vite+React+TS project; removed the DeepSpace scaffold | TBD |
| 2026-10-24 13:02 | docs/team/*.md, docs/ART_GUIDE.md, README.md | Wrote beginner step-by-step guides for each teammate (docs only, no game code) | TBD |
| 2026-10-24 16:43 | CLAUDE.md, README.md, docs/team/*, docs/ART_GUIDE.md, docs/DEMO_RUN_SHEET.md | Retired the dust storm and Garri's guide (docs only); wrote the demo run sheet | TBD |
| 2026-10-24 20:29 | src/game/world/mapgen.ts, src/shared/contracts.ts, src/audio/lines.ts, src/game/Game.ts | Removed the solar pads and dust_storm type (dust storm retired); fixed ?fast=1 dose scaling; Geiger click uses the sound file first; HUD shows the NOAA reading time; results show career dose and whether saving works | TBD |
| 2026-10-24 20:29 | src/audio/voice.ts | Rewrote so an old line's timer can't speak late and the clip and browser voice can't overlap; added preloading | TBD |
| 2026-10-24 20:29 | src/Play.tsx | Results card shows saved totals and career dose vs the proposed limit; added the "What's real vs. tuned?" panel; buttons release focus so Space still jumps | TBD |
| 2026-10-24 20:29 | src/rules.test.ts, vite.config.ts | Added the test that allows only NOAA and ElevenLabs web addresses; relative base path for hosting anywhere | TBD |
| 2026-10-24 20:29 | README.md, docs/EXPLAIN.md, docs/DEMO_RUN_SHEET.md | Brought docs up to date with the merged code | TBD |
| 2026-10-24 20:35 | .github/workflows/deploy.yml, scripts/bake-sfx.ts, README.md | Added GitHub Pages deploy workflow (CI config); removed the mars-wind-loop prompt from the SFX script (it is a NASA recording); README NASA credit placeholder | TBD |

## ElevenLabs audio

| date-time | file | what ElevenLabs AI did | human reviewer |
|---|---|---|---|
| 2026-10-24 04:45 | klaxon.mp3, geiger-click.mp3 | Sound effects for the klaxon warning and the geiger counter clicks | TBD |
| 2026-10-24 05:25 | jump.mp3, moon-suit-hum-loop.mp3 | Sound effects for when the player character jumps | TBD |
| 2026-10-24 07:25 | coin.mp3 | Sound effect for picking up the coins around the level | TBD |
