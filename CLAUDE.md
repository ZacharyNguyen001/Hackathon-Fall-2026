<!--
MERGE NOTE: `npm create deepspace` already generates a CLAUDE.md (and AGENTS.md) that point
Claude at the DeepSpace skill in .agents/skills/deepspace/. KEEP those scaffold lines at the
top of the file and paste everything below this comment underneath them. Do not delete AGENTS.md.
-->

# Storm Shelter — GeauxHack 2026 (working title)

A browser-based, Roblox "Natural Disaster Survival"–style round game set on the Moon and Mars.
Each round: a new map is generated from live space-weather data, players get 20 seconds to
explore, then a voiced warning fires and a disaster hits. Survive by reaching the right shelter.
Earn coins for every second you stay alive. Every number shown to the player is either real
(cited) or clearly labeled as a game value.

Prompt we are answering (GeauxHack 2026, "Life in Space"): build an app, game, simulation, or
tool that models how humans survive in hostile off-Earth environments using real space-mission
data, environmental readings, habitat metrics, or other information about living beyond Earth.

Tracks we are entering: the main GeauxHack bracket + **Best Use of DeepSpace** + **Best Project
Built with ElevenLabs**. Team of 4. Hard deadline: **Sunday Oct 25, 12:00 PM CDT** (no code
changes after that, ever — it is a disqualification).

---

## 0. Hard rules (violating these disqualifies the team — never break them)

1. **Max 2 external APIs.** Ours are exactly:
   - **API 1 — NOAA SWPC** (`services.swpc.noaa.gov`, keyless JSON). All SWPC endpoints count as this one API.
   - **API 2 — ElevenLabs** (text-to-speech, plus optional sound-effects generation).
   - **DeepSpace** is our backend-as-a-service (auth, records, real-time, cron, secrets, files, deploy). The rules exempt APIs "absolutely necessary to integrate a backend-as-a-service" (their example: Supabase). The team must get an organizer to confirm this in Discord and paste the answer into the README. Until confirmed, treat it as exempt but do not add anything else.
   - **Do NOT add any other third-party data/AI service.** That includes: Claude/OpenAI/any LLM (directly OR through DeepSpace's AI chat / `integration.post` proxy), DeepSpace's weather or search integrations, NASA DONKI, Curiosity REMS, Open Notify, Google Fonts CDN, image CDNs, analytics, error-reporting SaaS. If a feature seems to need a third API, stop and tell the human instead of adding it.
   - npm libraries bundled into the app are not APIs and are fine, but ask before adding any dependency.
2. **Only code written during the hackathon.** Boilerplate (the `create-deepspace` scaffold, CI config, doc examples for SDK usage) is exempt but must not contain theme content. Never copy game code from external repos, tutorials, gists, or prior projects, and never fetch external code to imitate. Reading official SDK/API docs for signatures and request shapes is fine.
3. **No AI-generated images or video, in any capacity.** This is absolute. Claude must NOT:
   - write sprite pixel grids, sprite string-arrays, SVG illustrations, icon art, logos, or tile art;
   - generate or edit PNG/GIF/WebP/SVG assets;
   - "draw" characters or objects procedurally to stand in as final art.
   Claude MAY write: the renderer that draws human-made sprites, the procedural terrain generator (terrain cells filled with flat colors from a human-chosen palette), and **placeholder rectangles** clearly marked `// TODO-ART (human)`. All sprite data lives in `src/art/` and is authored by a human whose name goes in the file header. If asked to make art, refuse and leave a TODO for the team's artist. (AI-generated **audio** — ElevenLabs voice and sound effects — is allowed; the ban covers image and video only.)
4. **Document all AI-assisted code.** Every time Claude creates or meaningfully edits a file, append a line to `docs/AI_USAGE.md`: `| date-time | file | what Claude did | human reviewer |`. The README must summarize this.
5. **Every team member must be able to explain every line.** Write plain, short, commented code. No clever metaprogramming. After each milestone, update `docs/EXPLAIN.md` with a plain-English walkthrough of the new code (what each file does, how data flows).
6. **The live demo must equal what's in the public GitHub repo at submission.** Deploy only from committed code. Tag the final commit `submission`.
7. **Never commit secrets.** `.dev.vars`, `.env*`, and any key must stay out of git. Keys go in the DeepSpace secrets store (`npx deepspace secrets set ...`). Never put the ElevenLabs key in client code.

---

## 1. The game

### Core loop (Roblox-style rounds, one fixed screen, no camera movement)

```
INTERMISSION (8 s) → MAP_LOAD → EXPLORE (20 s) → WARNING (12 s lead) → DISASTER (40 s) → RESULTS (8 s) → next round
```

- **INTERMISSION:** leaderboard, coin total, "next site: Mars / Moon", and the live space-weather panel ("Real sun right now: S0 · ≥10 MeV proton flux 0.4 pfu · S1 starts at 10 pfu").
- **MAP_LOAD:** generate a new single-screen map from a seed derived from the latest NOAA record + round number (see §4). Body alternates Moon/Mars by round.
- **EXPLORE (20 s):** free roam. Find shelters, grab coin pickups (+5 each). Shelters are visible; the disaster type is NOT shown yet (that's the Roblox tension).
- **WARNING:** at exactly t = 20 s the ElevenLabs "mission control" voice plays, with an on-screen banner + caption. Example: "Warning. Solar radiation storm, level S3. Get to a storm shelter now." The 12-second lead is a **game value** (we must not cite real flare-to-arrival warning times — see §7).
- **DISASTER (40 s):** hazard ramps up; the player survives by being in the right place. +1 coin per second alive during WARNING + DISASTER.
- **RESULTS:** survived or "EVAC'D" (we never say "died"), dose received vs limit, coins earned, and one **real-data fact card** with its source.

The whole world is one screen. Logical resolution **384 × 216** (16:9), **8 px tiles → 48 × 27 tiles**, scaled up by the largest integer that fits the window, `imageSmoothingEnabled = false` for crisp 8-bit pixels. Each round swaps the map, palette and hazards — the view never scrolls.

### Disasters

**MVP (must ship): A and B. Stretch: C, then D.**

**A. Solar particle event / radiation storm** (Moon or Mars) — uses live NOAA data.
- Level: if the live NOAA S-scale is ≥ 1 → **LIVE STORM** at that level. If it's S0 (the usual case) → **DRILL** at a level that ramps by round (S2 → S3 → S4 → S5), and the HUD says "DRILL — real sun is quiet right now (S0, flux X pfu)". Never present a drill as live.
- Radiation is not a wall: intensity **ramps up over ~8 s, holds at peak, then eases** (sky tint + Geiger-click rate follow it).
- Dose per game-second = `PEAK_RATE[level] × ramp(t) × shieldFactor(location)`.
  - `PEAK_RATE` (game values, tune freely, mSv per game-second): S1 2, S2 4, S3 7, S4 11, S5 16.
  - `shieldFactor`: outside 1.0 · habitat module / rover (aluminum walls) **0.5** (real: Al/polyethylene cuts SPE dose ~50%) · storm shelter (water-walled) **0.1** (game value; real sources say 10–20 cm water-equivalent shelters are the answer to SPEs but give no single factor).
  - The close shelter is usually a thin habitat (0.5); the far one is a storm shelter (0.1). That choice is the gameplay.
- EVAC'D when round dose ≥ **250 mSv** (real: crew design limit for a single SPE is under 250 mSv).
- Show a "career dose" across rounds vs the **proposed** 600 mSv NASA career limit (always say "proposed").

**B. Mars dust storm** (Mars only).
- Optical depth τ ramps from ~0.5 to ~5 during the disaster (game values).
- Visibility radius shrinks with τ (dark overlay with a circular cutout around the player).
- Sunlight reaching solar pads ≈ `exp(−τ)` (labeled "direct-beam approximation" in UI/debrief).
- Suit power: drains while outside; recharges at solar pads at `PAD_RATE × exp(−τ)`, so pads become useless as the storm builds. Inside the battery-backed habitat airlock = safe.
- Wind: horizontal push that ramps with τ, with random gusts (seeded).
- EVAC'D when suit power hits 0.
- Debrief fact: Opportunity's array output fell from ~645 Wh to ~22 Wh per sol in the 2018 storm and the rover went silent.

**C. (Stretch) Habitat CO₂ scrubber failure** — interior map. CO₂ (mmHg) rises; alarm tiers at **2 / 4 / 5.3 mmHg**. Sprinting raises your CO₂ output (real: ~5.2 g/min exercising vs ~0.7 g/min at rest). Survive by carrying the spare part to the scrubber or reaching the backup module.

**D. (Stretch) Solar conjunction blackout** — no voice warning from Earth this round ("comms blackout"); only the onboard Geiger counter warns you. Ties in the delay/isolation problem.

### Bodies (map look + physics)

| | Moon | Mars |
|---|---|---|
| Disasters | A (C stretch) | A, B (C, D stretch) |
| Gravity | 1.62 m/s² | 3.71 m/s² |
| Game gravity | `BASE_G × 1.62/3.71` | `BASE_G` |
| Palette | human-chosen grays | human-chosen rust/ochre |

Keep the **ratio** of real gravities; the absolute value is scaled for fun (say so in the debrief). The map generator must use each body's jump height for reachability. Note for the pitch: NOAA's proton readings come from near-Earth satellites, so they are most directly representative of the Moon; on Mars we treat them as "relayed alerts."

### Coins
- +1 per second alive during WARNING + DISASTER, +10 survival bonus, +5 per pickup.
- Coins are awarded **only by the server action** (§3), which validates and caps them. The client only reports what happened.
- Stretch: spend coins on suit color palettes (palettes chosen by the human artist).

### Controls
Arrows / A-D to move, W / Up / Space to jump. "Click to start" screen is required (it also unlocks browser audio — autoplay is blocked until a user gesture). Mute toggle. Captions for every voice line (remote judges may have bad audio). Touch buttons are a stretch.

---

## 2. Tech stack and architecture

- **DeepSpace scaffold** (Vite + React + TypeScript frontend, Hono worker on Cloudflare, Durable Objects). Node 22.15+ on the 22 line, or Node 24/26.
- **Game engine: plain Canvas 2D + TypeScript, no game framework.** Fixed-timestep loop (60 Hz update, render on `requestAnimationFrame`), AABB-vs-tile collision. Chosen so beginners can read and explain every line. Do not add Phaser/Pixi unless the team asks.
- **The game loop runs outside React.** React renders the page, menus, leaderboard and overlay HUD; the canvas owns the world. Communicate through a tiny event emitter / store, not React state per frame.
- **Pure logic is DOM-free** (`src/game/sim/**`, `src/game/world/**`, `src/data/**`) so it can be unit-tested and reasoned about.
- **Font:** a pixel font installed from npm (e.g. `@fontsource/press-start-2p`) and bundled — never the Google Fonts CDN (that would be an extra external API). Credit it in the README.

### Folder layout (proposal — confirm in plan mode)

```
src/
  pages/
    index.tsx                     # static landing page
    (app)/play.tsx                # the game (guests can play; sign in to save coins)
    (app)/leaderboard.tsx         # live leaderboard
  game/
    engine/   loop.ts input.ts render.ts audio.ts events.ts
    world/    rng.ts mapgen.ts reachability.ts tiles.ts bodies.ts
    sim/      roundMachine.ts player.ts physics.ts dose.ts dust.ts coins.ts
    disasters/ solarStorm.ts dustStorm.ts (co2.ts, blackout.ts stretch)
    tunables.ts                   # EVERY game value lives here, commented "GAME VALUE" or "REAL: source"
  data/
    facts.ts                      # cited real numbers (§6) used by UI + fact cards
    noaa.ts                       # NOAA parsing (pure functions, defensive)
    noaa-sample/                  # saved real NOAA JSON for offline fallback
  audio/
    lines.ts                      # whitelisted voice line templates
    voice.ts                      # client playback + fallback chain
  art/                            # HUMAN-MADE ONLY: sprites.ts, palettes.ts (author name in header)
  schemas/ *.ts  + schemas.ts     # DeepSpace collections
  cron.ts                         # NOAA pull (+ briefing voice generation)
worker.ts                         # Hono routes / server actions (voice, finishRound)
public/audio/fallback/*.mp3       # pre-baked ElevenLabs clips + SFX
scripts/bake-audio.ts             # local script: generates fallback clips with ElevenLabs
docs/ AI_USAGE.md EXPLAIN.md DATA_SOURCES.md DEMO_SCRIPT.md
README.md                         # organizer template (get the link from organizers)
```

### Handoff contracts (agree on these first, stub them, then everyone works in parallel)

```ts
export type Body = 'moon' | 'mars';
export type DisasterKind = 'solar_storm' | 'dust_storm' | 'co2_leak' | 'blackout';

export interface SpaceWeather {            // written by cron, read by everyone
  sLevel: 0 | 1 | 2 | 3 | 4 | 5;           // NOAA S-scale, current
  protonFlux10MeV: number | null;          // latest GOES >=10 MeV integral flux, pfu
  kp: number | null;                       // optional
  observedAt: string;                      // ISO time of the NOAA reading
  fetchedAt: string;                       // ISO time we fetched it
  source: 'live' | 'sample';               // 'sample' = offline fallback file
}

export interface RoundPlan {
  roundId: string; roundNumber: number; body: Body; disaster: DisasterKind;
  level: number;          // S-level for solar, intensity 1-3 for dust
  isDrill: boolean;       // true unless driven by a live NOAA S>=1
  seed: number;
}

export interface Shelter { id: string; tx: number; ty: number; tw: number; th: number;
  kind: 'habitat' | 'storm_shelter' | 'airlock'; shieldFactor: number; }

export interface GameMap { widthTiles: 48; heightTiles: 27; tiles: Uint8Array;
  spawn: { tx: number; ty: number }; shelters: Shelter[];
  pads: { tx: number; ty: number }[]; coins: { tx: number; ty: number }[]; }

export interface PlayerSnapshot { x: number; y: number; insideShelterId: string | null;
  alive: boolean; doseMSv: number; suitPower: number; coinsThisRound: number; }

export interface RoundReport {            // client -> finishRound server action
  roundId: string; body: Body; disaster: DisasterKind; level: number; isDrill: boolean;
  survived: boolean; secondsAlive: number; doseMSv: number; pickups: number;
}

export type VoiceLineId =
  | 'solar_warning' | 'dust_warning' | 'all_clear' | 'evac' | 'briefing' | 'drill_notice';
export interface VoiceRequest { lineId: VoiceLineId; vars: Record<string, string | number>; }
export interface VoiceResponse { url: string; cached: boolean; caption: string; }
```

---

## 3. DeepSpace (we are competing for "Best Use of DeepSpace")

DeepSpace judging: product value, execution/judgment (including sensible handling of data,
permissions, errors), and whether DeepSpace contributes meaningfully. Our use must be real, not decorative:

| DeepSpace feature | What we use it for |
|---|---|
| **Auth** | Sign in to save coins/career dose; guests can play without saving. |
| **Records + permissions** | `players`, `runs`, `spaceWeather`, `voiceClips` collections (below). |
| **Real-time sync** | Leaderboard and space-weather panel update live for everyone. |
| **Scheduled jobs (CronRoom)** | Pull NOAA every 5 min into `spaceWeather`; when the storm band changes, generate a fresh voiced "space weather briefing" once and cache it. |
| **Server actions / worker routes** | `finishRound` (validates + awards coins), `voice` (ElevenLabs proxy with whitelist + cache + rate limit). |
| **Secrets store** | `ELEVENLABS_API_KEY` (and optional `ELEVENLABS_VOICE_ID`). |
| **Files** | Cached ElevenLabs audio, so each unique line is generated once. |
| **Deploy** | Public demo at `<our-app>.app.space`. |
| **Stretch: presence** | Shared live rounds with other players as ghosts (§8). |

### Collections (proposal — verify permission syntax against the DeepSpace skill/docs)

- `players` — `{ displayName, coins, careerDoseMSv, roundsPlayed, roundsSurvived, bestStreak, suitPalette }`. Readable by members (leaderboard). **No client create/update** — only the `finishRound` server action writes it. Never store emails here.
- `runs` — one per finished round: `{ userId, roundId, body, disaster, level, isDrill, survived, secondsAlive, doseMSv, coinsEarned }`. Written only by `finishRound`; members read their own.
- `spaceWeather` — record `current` + recent history. Written only by cron. Readable by everyone.
- `voiceClips` — `{ lineKey (hash of text+voice+model), text, fileUrl, voiceId, model }`. Written only by the worker.

### `finishRound` server action (anti-cheat with sensible caps)
- Requires sign-in. Reject duplicate `roundId` for the same user.
- `secondsAlive` ≤ round length; `coins = (survived ? 10 : 0) + floor(secondsAlive during warning+disaster) + 5 × min(pickups, MAX_PICKUPS_PER_MAP)`.
- Clamp `doseMSv` to [0, 1000]. Add to `careerDoseMSv`, write a `runs` row, update `players` — atomically if the SDK allows.
- Return the updated totals. Client shows server totals, not its own math.

### Rules of thumb
- Before writing any DeepSpace code, read `.agents/skills/deepspace/` and `AGENTS.md`, and check signatures in the docs (https://docs.deep.space). Do not guess SDK APIs.
- Pages that use `useQuery`/`useMutations` must live under `src/pages/(app)/`. Gated pages go under the existing `src/pages/(app)/(protected)/` — never create a top-level `(protected)` folder.
- Every data-backed view handles loading / error-with-retry / empty / success.
- Deploy requires a clean committed worktree: `git add -A && git commit -m "..." && npx deepspace deploy`.
- **One app owner** (agree before deploying); teammates are added as collaborators. Credits are per person, not pooled.
- Do not use DeepSpace's `integration.post(...)` proxy, AI chat, or AI SDK for any provider — that would add an external API. (Exception to check: if `npx deepspace integrations list` shows an ElevenLabs integration, we may route ElevenLabs through it; it is still our API #2 either way.)

---

## 4. NOAA SWPC (API 1)

- Fetched **server-side only** (in `src/cron.ts`, every 5 minutes), never from the browser — avoids CORS issues and hammering NOAA.
- Endpoints (verify the live JSON shape with `curl` before writing the parser; SWPC formats change):
  - `https://services.swpc.noaa.gov/products/noaa-scales.json` → current R/S/G scales; key `"0"` is current, `S.Scale` is the S-level.
  - `https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json` → latest entry where `energy` is `">=10 MeV"`; `flux` in pfu.
  - Optional: `https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json` (Kp; handle both array-of-arrays and array-of-objects).
- Parsing is defensive: if anything is missing or malformed, keep the previous good record and log. If there is no good record at all, load `src/data/noaa-sample/*.json` (real responses saved during the hackathon) and mark `source: 'sample'`. The UI always shows the reading's timestamp and whether it is live or a saved sample.
- **Map seed:** `seed = hash32(\`${spaceWeather.observedAt}|${roundNumber}|${body}\`)` using a small seeded PRNG (mulberry32). Same NOAA reading + same round number → same map (needed for the multiplayer stretch).
- NOAA S-scale definition (for HUD + debrief): S1 starts at 10 pfu of ≥10 MeV protons, each level is 10× higher (S2 100, S3 1,000, S4 10,000, S5 100,000). At S3+, EVA astronauts should avoid radiation exposure → our "go to shelter" rule.

### Map generator requirements
- Heightmap terrain across 48 columns (smoothed value noise / midpoint displacement), craters, a few floating ledges, 2–3 shelters (at least one near and one far from spawn), solar pads on Mars, 3–6 coin pickups.
- **Reachability guarantee:** max step height < the body's jump height in tiles; run a BFS from spawn over walkable tiles and confirm every shelter (and the airlock on Mars) is reachable. If not, retry with `seed + 1` up to 20 times, then fall back to a known-good flat-ish layout.
- Generation must be deterministic for a given seed and run in < 5 ms.

---

## 5. ElevenLabs (API 2 — we are competing for "Best Project Built with ElevenLabs")

Voice is central to the experience, not a garnish: mission-control warnings, the drill notice,
all-clear, EVAC callout, and the live space-weather briefing generated from real NOAA numbers.

- **Key handling:** `npx deepspace secrets set ELEVENLABS_API_KEY=...` (then restart dev / redeploy). Only the worker reads it. Never ship it to the browser, never log it.
- **Request (verify in the ElevenLabs API docs before coding):** `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` with header `xi-api-key`, JSON `{ text, model_id }`, returns `audio/mpeg`. Use a low-latency model (a Flash model) for live lines; a more expressive model is fine for pre-baked clips. Sound effects (Geiger clicks, wind, klaxon) can come from the ElevenLabs sound-effects endpoint in the bake script.
- **Whitelist, don't accept free text.** The client sends `{ lineId, vars }`; the worker builds the sentence from templates in `src/audio/lines.ts` and validates vars (S-level 1–5, direction "east"/"west", numbers rounded). This prevents abuse and keeps the set of lines small and cacheable.
- **Cache:** `lineKey = hash(text + voiceId + modelId)`. If a `voiceClips` record exists, return its file URL. Otherwise generate, store the audio via DeepSpace files, write the record, return it.
- **Rate limit:** live generation only for signed-in users, max a few new generations per user per round; guests get cached or pre-baked clips only. Disable the trigger while a request is in flight.
- **Fallback chain (client, `src/audio/voice.ts`):** cached/live clip → pre-baked mp3 in `public/audio/fallback/` → browser `speechSynthesis` → caption only. The game must never wait on audio: the banner and caption appear at t = 20 s regardless; audio plays when ready (timeout ~1.5 s, then fall back).
- **Pre-bake script** (`scripts/bake-audio.ts`, run locally with the key in a local, git-ignored env var): generates every fixed line (each S-level warning, dust warning, all-clear, EVAC, drill notice) and the SFX into `public/audio/fallback/`. Commit the mp3s.
- **Briefing:** when the cron sees the S-level or flux band change, it generates one briefing ("Space weather update from NOAA. Solar radiation storm level S0. Proton flux 0.4 particle flux units. The sun is quiet. Today's storms are drills.") and caches it; the lobby plays it.
- Use premade/library voices only. Don't clone or imitate a real person's voice.
- Stretch: multilingual warnings (same templates, translated text, multilingual model).

---

## 6. Real data we may show (and its sources)

Put these in `src/data/facts.ts` as `{ id, value, unit, text, source, status: 'real' | 'derived' | 'proposed' }`
and in `docs/DATA_SOURCES.md`. Fact cards and the debrief may only use entries from this table.

**Radiation**
- GCR dose-equivalent rates: ISS ~0.68 mSv/day; Artemis I Orion near the Moon 0.96–1.24 mSv/day; Mars transit ~1.58 mSv/day; Mars surface ~0.65 mSv/day (Artemis I paper).
- Curiosity RAD: ~1.8 mSv/day in cruise, ~0.67 mSv/day on the surface; ~0.66 Sv for round-trip transit; ~1 Sv total with a 500-day stay (SwRI).
- NASA career limit: under 600 mSv — **proposed**, reviewed by the National Academies (NASEM 2021), who noted a Mars mission could exceed it by up to 150%.
- Crew design limit for a single SPE: under 250 mSv.
- Aluminum/polyethylene shielding cuts SPE dose ~50% but GCR only ~7%; storm shelters of ~10–20 cm water-equivalent are the answer to SPEs; each transit day avoided saves ~1.5 mSv (NASA OCHMO brief).
- Artemis I: rotating the spacecraft 90° cut the Van Allen belt dose rate about in half.
- NOAA S-scale: S1 at 10 pfu (≥10 MeV), ×10 per level; S3+ → EVA astronauts avoid exposure (NOAA SWPC).
- Non-cancer effects (heart, brain) are real but NASA has no accepted risk model for them.

**Life support**
- 82 kg planning astronaut: ~0.89 kg O₂/day, ~1.08 kg CO₂ exhaled/day, ~2.79 kg drinking water/day, ~5 kg total water per person-day (Ewert & Stromgren, NASA).
- CO₂ output ~5.2 g/min during aerobic exercise vs ~0.7 g/min at rest.
- ISS water recovery ~98% since the Brine Processor Assembly (2023); 93–94% before.
- Oxygen recovery from CO₂ (Sabatier) ~50%; NASA goal for future systems ≥75%.
- ISS oxygen generator's first cell stack failed in 2010 after ~233 days vs a 5-year rating.
- CO₂: headaches reported at 2–5 mmHg; ISS flight rule 4 mmHg; ground studies found reduced complex decision-making below 2 mmHg (Scully et al., NASA).
- MOXIE (Perseverance): 122 g O₂ total, peak 12 g/hr at 98%+ purity. **Derived** (our arithmetic): ~22 kWh/day to make one person's 0.89 kg O₂ at that efficiency.
- Opportunity, 2018 dust storm: array output fell from ~645 Wh to ~22 Wh per sol; the rover went silent (Planetary Society).
- Surface sunlight ≈ exp(−opacity) for the direct beam — **derived approximation**.

**Delay and isolation**
- Mars one-way signal delay ~3–22 min (round trip ~6–44 min); NASA puts it ~15–21 min while at Mars.
- Each crewed Mars mission faces one solar-conjunction disruption of ~2–3 weeks.
- Moon: 4–15 s including relay overhead (NASA HRP) — say "including relay overhead."
- HERA analog with 180 s delay: 1 of 5 teams completed message routing vs 4 of 5 with no delay.
- Mars-500: one crewman's sleep cycle drifted to ~25 h.
- NASA modeling: ~6% medical evacuation / 0.6% crew loss for an accelerated 426-day Mars mission vs 29% / 1.6% for a 923-day mission (no resupply).

**General knowledge (fine to use, verify before putting on a slide):** Moon gravity 1.62 m/s², Mars 3.71 m/s².

---

## 7. Never cite / never claim

- Real flare-to-particle-arrival warning times (our 12 s lead is a game value — label it).
- The 600 mSv limit as formally adopted (it's **proposed**).
- ISS yearly dose totals, Artemis II dose data, CHAPEA results, specific plant yields.
- ISS life-support breakdowns other than the 2010 oxygen generator failure.
- Kilopower / exploration-atmosphere figures (secondary sources).
- A bare light-time for the Moon (we only have NASA's 4–15 s including overhead).
- Any number not in §6. If a teammate wants a new fact, it needs a primary source added to `docs/DATA_SOURCES.md` first.

In-game, every tuned value is labeled. The debrief has a "What's real vs. tuned" toggle. Judges
respond well to honest uncertainty — it is part of the pitch, not a weakness.

---

## 8. Scope, stretch and cut order

**MVP (must be done by the Saturday-night freeze):**
1. Canvas engine: fixed-timestep loop, input, tile collision, player with jump, integer-scaled pixel render.
2. Seeded map generator with reachability check; Moon and Mars palettes/gravity.
3. Round state machine with all phases and timers.
4. Disaster A (solar storm) with live/drill logic and dose model; Disaster B (dust storm).
5. NOAA cron → `spaceWeather` record → live panel; offline sample fallback.
6. ElevenLabs: worker voice route with whitelist + cache; pre-baked fallback pack; captions.
7. Coins + `finishRound` server action + `players`/`runs` + live leaderboard.
8. Results screen with real-data fact cards and real-vs-tuned labels.
9. Human-made sprites in (player, shelters, pads, coin); placeholders gone.
10. Deployed on `app.space`, README/AI_USAGE/DATA_SOURCES complete.

**Stretch, in order:** (S1) CO₂ round · (S2) shared live rounds: round index = `floor((serverNow − EPOCH) / ROUND_MS)` + seed from the shared NOAA record so every client gets the same map at the same time with no game server, other players drawn as ghosts via DeepSpace presence at ~10 Hz · (S3) coin shop for suit palettes · (S4) blackout round · (S5) multilingual voice · (S6) touch controls.

**If behind, cut in this order:** S-anything → dust storm visuals polish → Moon (Mars only) → terrain variety (hills only) → career dose display.
**Never cut:** live NOAA (with sample fallback), ElevenLabs voice, DeepSpace auth + coins + leaderboard, honest labeling. Those are what the three judging panels are scoring.

---

## 9. Team roles (fill in names)

| # | Role | Owns | Owner |
|---|---|---|---|
| 1 | Game | engine, physics, map gen + reachability, round machine, coin pickups | ____ |
| 2 | Hazards + data | NOAA cron/parser/sample, dose model, dust model, `facts.ts`, `tunables.ts` | ____ |
| 3 | Backend + voice | DeepSpace schemas/permissions, `finishRound`, voice route + cache, bake script, leaderboard | ____ |
| 4 | Art, HUD, pitch | **all sprites (hand-made)**, palettes, HUD/menus/debrief UI, voice line writing + voice choice, README, Devpost, demo script, slides | ____ |

Role 4 also keeps the README honest: every AI-assisted file listed, both external APIs named, DeepSpace exemption confirmation pasted in, art credited to humans, font and any boilerplate sources credited.

---

## 10. Timeline (CDT)

| When | Gate |
|---|---|
| Sat, ASAP | Ask organizers on Discord to confirm DeepSpace is BaaS-exempt from the 2-API limit; get the README template link. Each member claims DeepSpace credits via the referral link (code GEAUXHACK2026) and the ElevenLabs Creator coupon (ElevenLabs Discord → coupon-codes, same email as GDG registration). Agree on the app owner. Public GitHub repo created, all 4 added. Scaffold + first deploy of a blank page. |
| Sat 12 PM | Player runs and jumps on a generated map. Cron writes a real `spaceWeather` record. Contracts (§2) stubbed. |
| Sat 4 PM | Full round loop with solar storm + dose + coins locally. Voice route returns real ElevenLabs audio. |
| Sat 8 PM | Dust storm round. `finishRound` + live leaderboard. Fallback audio baked. Human sprites in. (Optional: 8 PM Copilot presentation workshop.) |
| **Sat 11:59 PM** | **Select DeepSpace AND ElevenLabs on Devpost** (sponsor deadline; also team/bracket change deadline — the rules doc says "Saturday, October 25th"; Saturday is the 24th, so treat it as tonight). MVP feature freeze. README + Devpost draft exist. |
| Sun 9:00 AM | Book a presentation slot the moment booking opens (first-come). Fresh-clone test of the public repo, deploy from it. |
| Sun 11:00 AM | Submit on Devpost (title, description with team name, public repo link, DeepSpace + ElevenLabs prizes, public/private presentation choice). Tag `submission`. |
| **Sun 12:00 PM** | **Hard deadline. No code changes after this.** |
| Sun 12:15 PM+ | Presentations (8 min, pitch + demo). Check in ~15 min early. Be ready to join a video call for remote judges. |

---

## 11. How Claude should work in this repo

- Start every session by reading this file, `AGENTS.md`, and the DeepSpace skill. Check §0 before every change.
- Prefer small vertical slices that run end-to-end over large half-finished systems. After each slice: run typecheck/lint, run tests for pure logic, update `docs/AI_USAGE.md` and `docs/EXPLAIN.md`, and make a small commit with a clear message.
- Put every game value in `src/game/tunables.ts` with a `// GAME VALUE` or `// REAL: <source>` comment. No magic numbers elsewhere.
- Unit-test the pure functions: PRNG determinism, map reachability, dose math, dust power, coin calculation, NOAA parser (including malformed input). Use whatever test runner the scaffold ships; if none fits, ask before adding Vitest.
- Never add a dependency, an external service, or a new collection without saying so and getting a yes.
- When a DeepSpace or ElevenLabs detail is uncertain, read the docs or run `npx deepspace ... --help` / `npx deepspace integrations info` — do not invent signatures.
- Never run `secrets get --plain` into output, never print keys, never commit `.dev.vars`.
- Do not create or modify anything in `src/art/` except the loader/renderer code paths explicitly assigned; sprite data is human-only.
- If a request would break a §0 rule, say which rule and propose an alternative.
- Keep the user-facing tone fun but honest: "EVAC'D", "DRILL", "LIVE", "tuned for gameplay".
