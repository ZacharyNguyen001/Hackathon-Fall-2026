# Demo run sheet (8 minutes: pitch + live demo)

Pick ONE person to drive the game and ONE to talk. Rehearse it twice.

## Before you present (pre-flight, 10 minutes early)
- [ ] Open the **hosted** game (not localhost) in a fresh browser window. Zoom 100%, window large.
- [ ] Sound on and volume checked. Click once on the page so the browser allows audio.
- [ ] The HUD line says `live` (or `sample` if the internet is bad; see "If something breaks").
- [ ] `git status` is clean and the running build is the `submission` tag.
- [ ] A **60-second screen recording** of a full round is saved on every laptop (backup).
- [ ] Do **not** use `?fast=1` for the real demo (it is a test shortcut and changes the pacing).
- [ ] Join the video call 15 minutes early if remote judges.

## Script (times are targets)
| Time | Do | Say |
|---|---|---|
| 0:00 | Show the click-to-start screen | "Storm Shelter: a Roblox-style survival round game on the Moon and Mars, built on real space-weather data." The prompt was *Life in Space*. |
| 1:00 | Click start. Walk around, grab a coin, find the shelters | "You get 20 seconds to explore. You can already see shelters but not what's coming. Each map is built from the NOAA reading plus the round number, so the same reading gives the same map." |
| 2:00 | Point at the HUD line | "This is NOAA's real proton flux right now: S0, so the sun is quiet. We never fake it: it says **DRILL**, not LIVE. If NOAA ever reports S1 or higher, the round becomes a **LIVE STORM**." |
| 2:30 | The warning plays (t=20 s). Point at the banner/caption | "Mission control is an ElevenLabs voice, pre-generated so there is no key in the browser. The caption is always on screen, for judges with bad audio. The 12-second lead is a game value; we don't claim real warning times." |
| 3:00 | Run to a shelter. Watch the dose bar and Geiger clicks | "Dose = storm strength x where you stand. Outside 1.0, habitat 0.5 (real: aluminum shielding cuts solar-particle dose about half), storm shelter 0.1 (a game value). The close shelter is weak, the far one is strong; that choice is the game. 250 mSv is the real crew design limit for one event. At that you're **EVAC'D**." |
| 4:30 | Results card: dose, coins, fact + source | "Every fact has a source. The 600 mSv NASA career limit is only *proposed*, and we say so." Open **real vs tuned** if present. |
| 5:30 | Next round (Moon): note higher jumps | "Moon and Mars keep their real gravity ratio, 1.62 vs 3.71, so you jump higher on the Moon. A search proves every shelter is reachable." |
| 6:30 | Slide/talk | Two outside services only (NOAA data, ElevenLabs voice + sound effects), no backend. Tests cover the map, dose and parsers. AI-assisted code is logged in `docs/AI_USAGE.md`; all art is hand-drawn by <artist name>. |
| 7:30 | Questions | |

## If something breaks
- **Sound doesn't play:** captions still show; say so, keep going. (Browser voice is the fallback.)
- **NOAA offline / slow:** the HUD says `sample`. Say "this is a saved real reading; the game falls back to it on purpose" and carry on.
- **Game freezes / page crashes:** reload and click start again, or play the backup recording.

## Likely judge questions
1. **Is this real data?** The storm level and flux come from NOAA SWPC. Limits and shielding figures are from NASA/NASEM sources listed in `docs/DATA_SOURCES.md`. Everything else is labeled as a game value.
2. **Why is it always a drill?** The sun is usually quiet (S0). Showing a drill as live would be dishonest, so it is labeled.
3. **Why no backend/leaderboard?** Our two allowed outside services are NOAA and ElevenLabs. Coins are saved on the player's device.
4. **How was AI used?** Claude Code helped write code; every file is in `docs/AI_USAGE.md` and teammates reviewed them. ElevenLabs made the voice and sound effects. **No** AI-generated images.
5. **How do you know every map is beatable?** A breadth-first search checks every shelter is reachable from spawn; if not it tries the next seed, then a flat fallback.
