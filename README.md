# Storm Shelter (GeauxHack 2026, "Life in Space")

A browser 2D platformer in the style of "Natural Disaster Survival", set on the Moon and Mars.
Every round you get 20 seconds to explore, a voiced warning plays, then a radiation storm hits. Reach the
right shelter before your dose hits the limit. Doses and facts are real or clearly labeled as game values.

Run it: `npm install` then `npm run dev` (open the printed address). Tests and typecheck: `npm run validate`.

## Team guides
Each teammate has a step-by-step guide in [`docs/team/`](docs/team/00-START-HERE.md): start with `00-START-HERE.md`, then your own file (Jaydon: NOAA + ElevenLabs, Garri: dust storm + demo script, Zach: sound effects, Johnae: saved coins + art).

## Rules we follow
- **External APIs (max 2):** NOAA SWPC (space-weather data) and ElevenLabs (voice). Nothing else, and no backend.
  The project started on a hosted backend platform, but the organizers counted it as an API, so it was removed.
- **AI-assisted code:** every file Claude wrote or changed is logged in `docs/AI_USAGE.md`.
- **No AI-generated images or video.** All art is made by a human (see `docs/ART_GUIDE.md`). Until it is added, the game draws flat placeholder rectangles marked `TODO-ART`.
- **Font:** Bitcount (OFL-1.1), bundled via the npm package `@fontsource-variable/bitcount`.
- **Real vs tuned values:** `docs/DATA_SOURCES.md` lists the real facts; `src/game/tunables.ts` tags every number as GAME VALUE or REAL.

## How the game works (plain English)
1. **Start.** The page (`src/Play.tsx`) shows a "click to start" screen. A click is required because browsers block sound until the player interacts.
2. **The loop.** `src/game/Game.ts` runs 60 times a second: read the keyboard, move the player, advance the round clock, apply radiation, draw everything.
3. **A round** is a timer with five phases: INTERMISSION (8 s) -> EXPLORE (20 s) -> WARNING (12 s) -> DISASTER (40 s) -> RESULTS (8 s) -> next round.
4. **The map** is built from a *seed*: a number made by hashing the NOAA reading time + round number + body (Mars/Moon). Same seed = same map, always (`rng.ts`, `hash.ts`). The generator makes hills, a crater, ledges and shelters, then runs a search (BFS) to prove every shelter can be reached, otherwise it tries the next seed.
5. **Gravity.** Moon and Mars keep their real gravity ratio, so the Moon's jumps are higher; the map generator uses jump height so steps are always climbable.
6. **The warning.** At exactly 20 s a red banner and caption appear and a voice speaks (browser speech for now; ElevenLabs clips are coming).
7. **The storm.** Radiation ramps up for 8 s, holds, then eases. Dose per second = peak rate x ramp x shield factor of where you stand: outside 1.0, habitat 0.5, storm shelter 0.1. At 250 mSv you are "EVAC'D" (we never say "died").
8. **LIVE vs DRILL.** If NOAA's real S-level is 0 (the normal case), every storm is labeled a DRILL. Only a real S1 or higher is called LIVE. Right now the game uses saved real NOAA data (`src/data/noaa-sample/`).
9. **Results.** Survived or EVAC'D, dose vs limit, coins (+1 per second alive during warning/disaster, +10 for surviving, +5 per pickup), and one real fact with its source.

## What each file is for
| File | Purpose |
|---|---|
| `index.html`, `src/main.tsx` | Page shell; mounts the game page |
| `src/Play.tsx` | Canvas, click-to-start, banner, results card, mute (React) |
| `src/game/Game.ts` | The loop, input, round flow, drawing, HUD |
| `src/game/tunables.ts` | Every game number, tagged GAME VALUE or REAL |
| `src/game/world/rng.ts`, `src/shared/hash.ts` | Seeded random numbers and the text-to-number hash behind map seeds |
| `src/game/world/mapgen.ts`, `reachability.ts` | Build a level; prove it can be finished |
| `src/game/world/bodies.ts`, `tiles.ts` | Moon/Mars gravity and jump height; tile ids |
| `src/game/sim/*` | Physics, round timer, round planning, dose math, coin math |
| `src/data/*` | NOAA parsers, saved real samples, the cited fact list |
| `src/audio/lines.ts` | The sentences the voice says |
| `src/shared/contracts.ts` | Shared data shapes (types) |
| `*.test.ts` | Automatic tests (`npm test`) |
| `docs/` | AI usage log, plain-English walkthrough, data sources, art guide |

## Not done yet
Dust storm round, live NOAA fetch (currently saved samples), ElevenLabs baked voice and sound effects, real sound effects, human-made art, local coin saving, demo script.
