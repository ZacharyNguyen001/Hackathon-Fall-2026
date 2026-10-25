# AI usage log (Claude Code)

Times are real commit times from `git log` (CDT, 2026-10-24). "commit" lets a reviewer open the exact change with `git show <hash>`.
Reviewer cells are `____` until a human has read the code and can explain it.
Where a row says "adapted from Claude-written snippets in the planning guides (commit 29e8353; the guides were later deleted)", the teammate copied and adapted a snippet Claude wrote in that planning guide (we compared the final file to the snippet; they match closely).

**No images or video were AI-generated. All art (sprites, palettes, tiles) is hand-drawn by Johnae Avery.** Claude never touched sprite data. The one edit near `src/art/` is a one-line import cleanup in `sprites.ts` (see the final-fixes section).

## Code and docs

| date-time | commit | file | what Claude did | human reviewer |
|---|---|---|---|---|
| 2026-10-24 11:40 | 9f04037 | `.gitignore` | Added .env* and macOS ignores | Jaydon |
| 2026-10-24 11:40 | 9f04037 | `storm-shelter-geaux26/.gitignore` (removed in 3ab1517) | Scaffold ignore file (boilerplate from the create-deepspace scaffold) | Jaydon |
| 2026-10-24 11:40 | 9f04037 | `src/game/tunables.ts` (first written as `storm-shelter-geaux26/src/game/tunables.ts`, moved in 3ab1517) | Wrote all game constants, each tagged GAME VALUE or REAL | Johnae |
| 2026-10-24 11:40 | 9f04037 | `src/shared/hash.ts`, `src/shared/contracts.ts` (same move) | FNV-1a hash and the shared types | Johnae |
| 2026-10-24 11:40 | 9f04037 | `src/game/world/{rng,tiles,bodies,mapgen,reachability}.ts`, `mapgen.test.ts` (same move) | Seeded RNG, map generator with BFS reachability + retry/fallback, tests | Jaydon |
| 2026-10-24 11:40 | 9f04037 | `src/game/sim/{dose,coins,planRound,roundMachine,physics}.ts`, `sim.test.ts` (same move) | Radiation dose, coin math, round planner, phase timer, AABB physics, tests | Johnae |
| 2026-10-24 11:40 | 9f04037 | `src/data/{noaa,sampleWeather,facts}.ts`, `noaa-sample/*.json`, `noaa.test.ts` (same move) | Defensive NOAA parsers, saved real samples, cited facts, tests | Jaydon |
| 2026-10-24 11:40 | 9f04037 | `src/audio/lines.ts` (same move) | Warning / evac / all-clear text templates | Jaydon |
| 2026-10-24 11:40 | 9f04037 | `src/game/Game.ts`, `src/Play.tsx` (first written as `storm-shelter-geaux26/src/pages/play.tsx`, moved in 3ab1517) | Canvas game loop, input, placeholder-rect rendering, HUD, results card | Johnae |
| 2026-10-24 11:40 | 9f04037 | `CLAUDE.md`, `README.md`, `docs/{AI_USAGE,DATA_SOURCES,EXPLAIN}.md` | Project rules, docs and API-decision note | Jaydon |
| 2026-10-24 11:40 | 9f04037 | `storm-shelter-geaux26/**` scaffold (removed in 3ab1517), `.agents/skills/deepspace/**` (removed in 3ab1517) | Boilerplate from the `create-deepspace` scaffold; not game code, deleted because the organizers counted the backend as an API | Jaydon |
| 2026-10-24 11:44 | 3ab1517 | `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/Play.tsx` | Moved the app to the repo root as a plain Vite+React+TS project; removed the DeepSpace scaffold | ____ |
| 2026-10-24 12:06 | fcbfaa4 | `src/**/*.ts(x)` (header comments only), `docs/ART_GUIDE.md`, `README.md`, `CLAUDE.md` | Added "FILE PURPOSE" headers, README walkthrough, art guide; removed DeepSpace mentions from CLAUDE.md | Johnae |
| 2026-10-24 13:02 | 29e8353 | the per-teammate planning guides (all deleted later), `docs/ART_GUIDE.md`, `README.md` | Wrote beginner step-by-step planning guides for each teammate (docs only); the guides were removed from the repo on the final-fixes branch | Zachary |
| 2026-10-24 15:55 | cff9968 | `src/data/liveWeather.ts` | Live NOAA fetch. Adapted from Claude-written snippets in the planning guides (commit 29e8353, since deleted) | ____ |
| 2026-10-24 15:55 | cff9968 | `scripts/bake-audio.ts` | ElevenLabs text-to-speech bake script. Adapted from Claude-written snippets in the planning guides (commit 29e8353, since deleted) | Zachary |
| 2026-10-24 15:55 | cff9968 | `src/audio/voice.ts` (first version) | Play baked clip, fall back to browser voice. Adapted from Claude-written snippets in the planning guides (commit 29e8353, since deleted); rewritten by Claude in a8bcd96 (next section) | Jaydon |
| 2026-10-24 15:55 | cff9968 | `src/Play.tsx`, `src/game/Game.ts`, `src/audio/lines.ts` | Teammate-added hooks: NOAA refresh every 5 min (`fetchLiveWeather`, `setWeather`), `say()` -> `playLine`, `warningClipId` / `VOICE_LINES`. From the planning guides (commit 29e8353, since deleted) | Jaydon |
| 2026-10-24 16:21 | ab1fe42 | `scripts/bake-sfx.ts` | ElevenLabs sound-effects bake script. Adapted from Claude-written snippets in the planning guides (commit 29e8353, since deleted) | Zachary |
| 2026-10-24 16:21 | dd1e5e9 | `src/audio/sfx.ts` | Web Audio sound-effect player and loops. Adapted from Claude-written snippets in the planning guides (commit 29e8353, since deleted) | Zachary |
| 2026-10-24 16:43 | 158465b | `CLAUDE.md`, `README.md`, `docs/ART_GUIDE.md`, `docs/DEMO_RUN_SHEET.md` | Retired the dust storm and Garri's guide (docs only); wrote the demo run sheet | Jaydon |
| 2026-10-24 16:55 | bceda96, ed21f54 | `src/game/Game.ts` | Teammate-added sfx hooks (loadSfx, Geiger click, klaxon, loops). From the planning guides (commit 29e8353, since deleted) | Johnae |
| 2026-10-24 18:36 | d146843 | `src/game/Game.ts` | Teammate-added coin and jump sound hooks. From the planning guides (commit 29e8353, since deleted) | Jaydon, Johnae, Zach |
| 2026-10-24 19:57 | 7a95994 | `src/data/saveCoins.ts`, `saveCoins.test.ts` | Save coins and career dose in `localStorage`. Adapted from Claude-written snippets in the planning guides (commit 29e8353, since deleted) | Johnae |
| 2026-10-24 19:57 | 7a95994 | `src/game/spriteLoader.ts` | Loads the hand-made PNGs. Adapted from Claude-written snippets in the planning guides (commit 29e8353, since deleted) | Johnae |
| 2026-10-24 19:57 | 7a95994 | `src/game/sim/coins.ts` | Adds accumulation of coin pickup plus bonuses from seconds alive and survival (commit 29e8353, since deleted) | Johane |
| 2026-10-24 19:57 | 7a95994 | `src/game/Game.ts`, `src/Play.tsx` | Teammate-added hooks: sprite drawing with placeholder fallback, saved totals (`addRound`, `loadTotals`) and the results-card totals. From the planning guides (commit 29e8353, since deleted) | Johnae |
| 2026-10-24 20:29 | a8bcd96 | `src/game/world/mapgen.ts`, `src/shared/contracts.ts`, `src/audio/lines.ts`, `src/game/Game.ts` | Removed the solar pads and dust_storm type (dust storm retired); fixed ?fast=1 dose scaling; Geiger click uses the sound file first; HUD shows the NOAA reading time; results show career dose and whether saving works | Johnae |
| 2026-10-24 20:29 | a8bcd96 | `src/audio/voice.ts` | Rewrote so an old line's timer can't speak late and the clip and browser voice can't overlap; added preloading | Jaydon |
| 2026-10-24 20:29 | a8bcd96 | `src/Play.tsx` | Results card shows saved totals and career dose vs the proposed limit; "What's real vs. tuned?" panel; buttons release focus so Space still jumps | Jaydon |
| 2026-10-24 20:29 | a8bcd96 | `src/rules.test.ts`, `vite.config.ts` | Test that allows only NOAA and ElevenLabs web addresses; relative base path for hosting | ____ |
| 2026-10-24 20:29 | a8bcd96 | `README.md`, `docs/EXPLAIN.md`, `docs/DEMO_RUN_SHEET.md` | Brought docs up to date with the merged code | Zachary |
| 2026-10-24 20:35 | d9283b2 | `.github/workflows/deploy.yml` | GitHub Pages deploy workflow (CI config, no theme content) | Zachary |
| 2026-10-24 20:35 | d9283b2 | `scripts/bake-sfx.ts`, `README.md` | Removed the mars-wind-loop prompt from the SFX script (it is a NASA recording); README NASA credit placeholder | Zachary |
| 2026-10-24 21:05 | cbda5b3 | `src/game/Game.ts`, `src/Play.tsx`, `src/game/tunables.ts`, `src/game/sim/sim.test.ts`, `docs/EXPLAIN.md`, `docs/DEMO_RUN_SHEET.md` | Round 1 now seeded from the NOAA reading (removed `DEV_SEED`); added debug-only `?seed=<n>` (shows DEBUG SEED); tests for seed-from-weather | Johnae |
| 2026-10-24 21:05 | 3d58965 | `docs/AI_USAGE.md`, `docs/ART_GUIDE.md`, `docs/DATA_SOURCES.md`, `docs/DEMO_RUN_SHEET.md`, `CLAUDE.md`, `README.md` | Rebuilt the AI log; fixed stale docs and CLAUDE.md sections 4/5/9; README sections; fetched and added primary-source links | Zachary |
| 2026-10-24 21:05 | 3d58965 | `src/art/sprites.ts` | **One-time exception, needs Johnae's review:** removed the unused `solar-pad.png` import and the `solarPad` entry. No sprite data or PNG was touched; the PNG file stays | Johnae |
| 2026-10-24 21:07 | 267e059 | `src/game/sim/planRound.ts`, `sim.test.ts` | Drill levels cycle S2 -> S3 -> S4 -> S5 -> S2 | Johnae |
| 2026-10-24 21:08 | a955fff | `src/audio/lines.ts`, `lines.test.ts`, `src/game/Game.ts`, `src/Play.tsx`, `src/game/tunables.ts` | Added the drill-notice line and 7 fact-card lines (spoken at 3 s into RESULTS) with captions; plays through the existing voice fallback chain. The 8 new mp3s were baked afterwards by Jaydon | Johnae |
| 2026-10-24 (final-fixes) | final-fixes | the per-teammate planning guides (deleted), `README.md`, `docs/ART_GUIDE.md`, `docs/AI_USAGE.md` | Removed the planning guides and every reference to them | Zachary |
| 2026-10-25 10:20 | working tree | `src/game/Game.ts` | Draw the human-made Mars/Moon 32 × 8 ledge sprites once across each contiguous ledge row, retaining the color fallback; updated the walkthrough | Johnae |
| 2026-10-25 10:20 | working tree | `docs/EXPLAIN.md`, `docs/AI_USAGE.md` | Documented ledge sprite rendering and logged this change | Johnae |

## Audio generated with ElevenLabs

Made locally by a human running the bake scripts with their own key; the mp3 files are committed. The key is never in the repo or the browser.

### Voice (12 clips, plus the 8 below = 20 total) — `scripts/bake-audio.ts`, model `eleven_multilingual_v2`, committed in 629a161 (2026-10-24 16:06)
`solar-warning-s1-drill`, `-s1-live`, `-s2-drill`, `-s2-live`, `-s3-drill`, `-s3-live`, `-s4-drill`, `-s4-live`, `-s5-drill`, `-s5-live`, `evac`, `all-clear` (all `.mp3` in `public/audio/voice/`). Text comes from `src/audio/lines.ts`.

### 8 more voice clips (baked afterwards by Jaydon, same script and model)
`drill-notice`, `fact-spe-limit`, `fact-career`, `fact-shield`, `fact-water`, `fact-sscale`, `fact-rad-surface`, `fact-artemis-turn` (same script, `eleven_multilingual_v2`).

### Sound effects (5) — `scripts/bake-sfx.ts`, endpoint `/v1/sound-generation`
| file | first added | regenerated | human reviewer |
|---|---|---|---|
| `geiger-click.mp3` | ab1fe42 (16:21) | - | Zachary |
| `klaxon.mp3` | ab1fe42 (16:21) | 7a76e65 (17:07) | Zachary |
| `jump.mp3` | ab1fe42 (16:21) | f9321c9 (18:07) | Zachary |
| `moon-suit-hum-loop.mp3` | ab1fe42 (16:21) | f9321c9 (18:07) | Zachary |
| `coin.mp3` | ab1fe42 (16:21) | c1fa62a (19:11) | Zachary |

### NOT AI-generated
- `public/audio/sfx/mars-wind-loop.mp3`: a NASA Perseverance SuperCam wind recording. Source and usage terms are linked in the README credits.
