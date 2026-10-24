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
