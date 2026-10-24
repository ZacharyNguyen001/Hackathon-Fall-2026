# Hackathon-Fall-2026
(add any usage of apis or whatever we need that can clarify stuff for submission here as well, claude)

## Storm Shelter (GeauxHack 2026)
Browser 2D platformer: survive Moon/Mars radiation storms. 

**External APIs (max 2):** NOAA SWPC (space-weather data) and ElevenLabs (voice). DeepSpace was counted as an API by the organizers, so the game does not use DeepSpace services; the repo started from the `create-deepspace` scaffold (boilerplate).
**AI-assisted code:** logged in `docs/AI_USAGE.md`. **No AI-generated images/video**; all sprites are human-made (`src/art/`).
**Font:** Bitcount (OFL-1.1) via `@fontsource-variable/bitcount`, bundled.
**Real vs tuned values:** `docs/DATA_SOURCES.md`, `src/game/tunables.ts`.
