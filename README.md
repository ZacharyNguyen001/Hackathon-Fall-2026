TODO: reformat to organizer template

# Storm Shelter (GeauxHack 2026, "Life in Space")

A browser 2D platformer in the style of "Natural Disaster Survival", set on the Moon and Mars.
Every round you get 20 seconds to explore, a voiced warning plays, then a radiation storm hits. Reach the
right shelter before your dose hits the limit. Doses and facts are real or clearly labeled as game values.

Run it: `npm install` then `npm run dev` (open the printed address). Tests and typecheck: `npm run validate`.

## Team
Jaydon, Zach and Johnae. (Garri was on the team at the start and left during the event; his dust-storm and demo-script tasks were retired.)

## Live demo
https://zacharynguyen001.github.io/Hackathon-Fall-2026/

## ElevenLabs (API 2)
- **What we generated:** 12 voice lines baked so far (8 more, a drill notice and the 7 fact cards, are in the code and waiting to be baked) (mission-control warnings S1-S5 for drill and live, EVAC, all-clear) and 5 sound effects (Geiger click, klaxon, coin, jump, Moon suit hum). The Mars wind loop is a NASA recording, not AI-generated.
- **Why it is baked ahead of time:** the site is static (no backend), so baking keeps the API key out of the browser, adds no delay at the moment of the warning, and works offline. Fallback if a clip is missing or slow: the browser's built-in voice, and the caption is always shown.
- **Voice:** [VOICE NAME — Jaydon fill in] (a premade library voice; no cloning).
- **How to re-bake:** put `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in a git-ignored `.env.bake.local`, then run
  `node --env-file=.env.bake.local --experimental-strip-types scripts/bake-audio.ts` (voice, into `public/audio/voice/`) and
  `node --env-file=.env.bake.local --experimental-strip-types scripts/bake-sfx.ts` (effects, into `public/audio/sfx/`).
  Both scripts skip files that already exist (delete an mp3 to regenerate it), then commit the mp3 files.

## External APIs
Exactly two: **NOAA SWPC** (space-weather data, fetched from the browser) and **ElevenLabs** (voice and sound effects, baked ahead of time). GitHub Actions and GitHub Pages are CI/hosting for the static site, not APIs the game calls. `src/rules.test.ts` fails if any other web address appears in our code.

## Project history note
We started from the `create-deepspace` scaffold (commit 9f04037, boilerplate). We removed it in 3ab1517 and the final project uses no backend.

## AI usage summary
Claude Code helped write much of the code and docs. Every AI-assisted file and change is listed, with the real commit time and a reviewer column, in [`docs/AI_USAGE.md`](docs/AI_USAGE.md), along with every ElevenLabs-generated audio file. No images or video were AI-generated; all art is hand-drawn by Johnae Avery.

## Who did what
Drafted from the git history and `docs/team/` assignments.

| Person | Work |
|---|---|
| Jaydon | Game engine, round flow, map generation, dose model, live NOAA data, ElevenLabs voice (bake script + playback), lead, repo docs |
| Zach | Sound effects (bake script, player, game hooks), merging, GitHub Pages deploy |
| Johnae | All art (sprites, palettes, ground tiles), saved coins and career dose |
| Garri | Left the team during the event |

Confirmed by team: ____

## Team guides
Each teammate has a step-by-step guide in [`docs/team/`](docs/team/00-START-HERE.md): start with `00-START-HERE.md`, then your own file (Jaydon: NOAA + ElevenLabs, Zach: sound effects, Johnae: saved coins + art).

## Rules we follow
- **External APIs (max 2):** NOAA SWPC (space-weather data) and ElevenLabs (voice). Nothing else, and no backend.
  The project started on a hosted backend platform, but the organizers counted it as an API, so it was removed.
- **AI-assisted code:** every file Claude wrote or changed is logged in `docs/AI_USAGE.md`.
- **No AI-generated images or video.** All art is hand-made by a human (Johnae Avery, see `docs/ART_GUIDE.md`). Where a picture is missing the game falls back to a flat placeholder shape.
- **Font:** Bitcount (OFL-1.1), bundled via the npm package `@fontsource-variable/bitcount`.
- **Real vs tuned values:** `docs/DATA_SOURCES.md` lists the real facts; `src/game/tunables.ts` tags every number as GAME VALUE or REAL.

## How the game works (plain English)
1. **Start.** The page (`src/Play.tsx`) shows a "click to start" screen. A click is required because browsers block sound until the player interacts.
2. **The loop.** `src/game/Game.ts` runs 60 times a second: read the keyboard, move the player, advance the round clock, apply radiation, draw everything.
3. **A round** is a timer with five phases: INTERMISSION (8 s) -> EXPLORE (20 s) -> WARNING (12 s) -> DISASTER (40 s) -> RESULTS (8 s) -> next round.
4. **The map** is built from a *seed*: a number made by hashing the NOAA reading time + round number + body (Mars/Moon). Same seed = same map, always (`rng.ts`, `hash.ts`). The generator makes hills, a crater, ledges and shelters, then runs a search (BFS) to prove every shelter can be reached, otherwise it tries the next seed.
5. **Gravity.** Moon and Mars keep their real gravity ratio, so the Moon's jumps are higher; the map generator uses jump height so steps are always climbable.
6. **The warning.** At exactly 20 s a red banner and caption appear and a voice speaks: a pre-baked ElevenLabs clip, with the browser's built-in voice as the fallback if the file is missing or slow. The caption is always shown.
7. **The storm.** Radiation ramps up for 8 s, holds, then eases. Dose per second = peak rate x ramp x shield factor of where you stand: outside 1.0, habitat 0.5, storm shelter 0.1. At 250 mSv you are "EVAC'D" (we never say "died").
8. **LIVE vs DRILL.** If NOAA's real S-level is 0 (the normal case), every storm is labeled a DRILL. Only a real S1 or higher is called LIVE. The game fetches NOAA's live data in the browser (at most every 5 minutes). If that fails (offline, NOAA down) it uses real responses we saved (`src/data/noaa-sample/`). The HUD always says `live` or `sample` and shows when NOAA made the reading.
9. **Results.** Survived or EVAC'D, dose vs limit, coins (+1 per second alive during warning/disaster, +10 for surviving, +5 per pickup), and one real fact with its source. A "What's real vs. tuned?" button lists which numbers are real, proposed, or tuned for gameplay.
10. **Saving.** Total coins and career radiation dose are saved in the browser (`localStorage`) on this device only. There is no server, account or global leaderboard.

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
| `src/audio/voice.ts`, `sfx.ts` | Play the baked voice clips (with browser-voice fallback) and the sound effects |
| `src/data/liveWeather.ts`, `saveCoins.ts` | Fetch live NOAA data; save totals on this device |
| `src/art/*` | Hand-made sprites and palettes (human-authored only) |
| `scripts/bake-audio.ts`, `bake-sfx.ts` | Run locally with a git-ignored key to make the ElevenLabs audio files |

## Build and host
Pushing to `main` publishes the site to GitHub Pages through `.github/workflows/deploy.yml` (repo owner: Settings -> Pages -> Source = **GitHub Actions**, once). The hosted copy is always built from the committed code; for submission, make sure the last push to `main` is the commit tagged `submission`.

`npm install`, then `npm run build` makes the static site in `dist/` (paths are relative, so it works from any folder). The live demo must be built from the tagged commit (`submission`).

## Credits
- **Voice and sound effects:** generated with ElevenLabs (premade library voice, no cloning), baked ahead of time by the scripts in `scripts/`. Logged in `docs/AI_USAGE.md`.
- **`mars-wind-loop.mp3`:** Mars ambience, a NASA recording (not AI-generated). Source page and usage terms: https://science.nasa.gov/resource/perseverance-rovers-supercam-records-wind-on-mars https://www.nasa.gov/nasa-brand-center/images-and-media/
- **Art (sprites and palettes):** Johnae Avery, drawn by hand.
- **Font:** Bitcount (OFL-1.1) via `@fontsource-variable/bitcount`.
- **Space-weather data:** NOAA Space Weather Prediction Center (SWPC).
