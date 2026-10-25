# Garri: dust storm round + demo script

Read `00-START-HERE.md` first. Branch names: `garri/dust-storm`, then `garri/demo-script`.

## Part A. The Mars dust storm (about 4 to 5 hours)

### The idea in one paragraph
On some Mars rounds the disaster is a dust storm instead of radiation. Dust darkens the sky (a number called **optical depth, tau**, goes up). You can only see a circle around yourself that shrinks. Your suit battery drains while you are outside. Solar pads recharge it, but pads get weaker as the dust thickens (sunlight left is about `exp(-tau)`). Wind pushes you sideways. The only fully safe place is the **airlock** (it has a backup battery). If the battery hits 0 you are **EVAC'D**.

### What already exists (look at it first, don't rewrite)
- `src/game/sim/dose.ts`: your dust file will look like this one (small, pure functions, no drawing).
- `src/game/sim/dose.test.ts` doesn't exist, but `src/game/sim/sim.test.ts` shows how tests look.
- `src/game/sim/physics.ts`: `step(b, tiles, dt, move, jump, gravity, windAccel)` **already accepts wind**. It is added to the player's sideways speed (pixels per second).
- `src/game/world/mapgen.ts`: Mars maps already have 2 solar pads (`map.pads`) and an airlock (`map.shelters` with `kind: 'airlock'`).
- `src/game/Game.ts`: `applyRadiation(dt)` is the model for your `applyDust(dt)`.

### Step 1: add numbers to the BOTTOM of `src/game/tunables.ts`
All are GAME VALUES (we made them up for fun, and the game says so):
```ts
// ---- Dust storm (Garri) ----
export const TAU_START = 0.5 // GAME VALUE: optical depth at the start
export const TAU_PEAK: Record<number, number> = { 1: 3, 2: 4, 3: 5 } // GAME VALUE: by dust level
export const DUST_RAMP_S = 25 // GAME VALUE: seconds for tau to climb from start to peak
export const SUIT_START = 100 // GAME VALUE: full suit battery
export const SUIT_DRAIN_PER_S = 3.5 // GAME VALUE
export const PAD_RATE_PER_S = 12 // GAME VALUE: recharge at a pad when tau is 0
export const AIRLOCK_RECHARGE_PER_S = 5 // GAME VALUE
export const VIS_MAX_PX = 400 // GAME VALUE: see-everything radius
export const VIS_MIN_PX = 28 // GAME VALUE
export const VIS_K = 0.9 // GAME VALUE: how fast sight shrinks as tau rises
export const WIND_MAX_PX_S = 40 // GAME VALUE: wind push in pixels/second at the peak
export const GUST_MAX_PX_S = 25 // GAME VALUE: extra random gust
export const GUST_INTERVAL_S = 2 // GAME VALUE: a new gust strength every 2 seconds
```
(Pads help only while `PAD_RATE_PER_S * exp(-tau) > SUIT_DRAIN_PER_S`, which is tau under about 1.2. That's the fun: pads stop working as the storm grows.)

### Step 2: create `src/game/sim/dust.ts`
Start it with a "FILE PURPOSE" comment like the other files. Functions (all pure: numbers in, numbers out):
```ts
import { TAU_START, TAU_PEAK, DUST_RAMP_S, VIS_MAX_PX, VIS_MIN_PX, VIS_K, SUIT_DRAIN_PER_S,
         PAD_RATE_PER_S, AIRLOCK_RECHARGE_PER_S, WIND_MAX_PX_S, GUST_MAX_PX_S, GUST_INTERVAL_S } from '../tunables'
import { mulberry32 } from '../world/rng'

const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t) } // 0..1 ease

/** Optical depth at t seconds into the disaster. */
export function tau(t: number, level: number): number {
  return TAU_START + ((TAU_PEAK[level] ?? 3) - TAU_START) * smooth(t / DUST_RAMP_S)
}
/** Fraction of direct sunlight reaching the ground. A "direct-beam approximation" (say that on the results card). */
export function sunlight(tauNow: number): number { return Math.exp(-tauNow) }

/** How far (px) the player can see. */
export function visibilityRadius(tauNow: number): number {
  return Math.min(VIS_MAX_PX, Math.max(VIS_MIN_PX, VIS_MAX_PX * Math.exp(-VIS_K * (tauNow - TAU_START))))
}
/** Suit battery change per second. */
export function powerRate(where: 'outside' | 'pad' | 'airlock', tauNow: number): number {
  if (where === 'airlock') return AIRLOCK_RECHARGE_PER_S
  if (where === 'pad') return PAD_RATE_PER_S * sunlight(tauNow) - SUIT_DRAIN_PER_S
  return -SUIT_DRAIN_PER_S
}
/** Sideways push (px/s). dir is +1 (east) or -1 (west). Gust strength comes from the seed, so every run of one seed matches. */
export function windPush(t: number, level: number, seed: number, dir: 1 | -1): number {
  const progress = (tau(t, level) - TAU_START) / ((TAU_PEAK[level] ?? 3) - TAU_START) // 0..1
  const gust = mulberry32(seed + Math.floor(t / GUST_INTERVAL_S))() * GUST_MAX_PX_S
  return dir * (WIND_MAX_PX_S * progress + gust)
}
export const isPowerOut = (power: number) => power <= 0
```
Test it in `src/game/sim/dust.test.ts` (copy the style of `sim.test.ts`). Check: tau starts at 0.5 and ends at the peak; `visibilityRadius` gets smaller as tau grows; `powerRate('pad', 0.5)` is positive but `powerRate('pad', 3)` is negative; `windPush` with the same seed gives the same answer twice.

### Step 3: decide which rounds are dust rounds
In `src/game/sim/planRound.ts` Mars rounds are the odd rounds (1, 3, 5, ...). Make round 3, 7, 11... dust:
```ts
const isDust = body === 'mars' && roundNumber % 4 === 3
```
and for the returned plan: `disaster: isDust ? 'dust_storm' : 'solar_storm'`, and for dust `level` = `Math.min(3, Math.ceil(roundNumber / 4))` and `isDrill: false`.
Careful: the existing code works out `isDrill` and `level` for solar; keep that for solar rounds. Update the existing tests in `sim.test.ts` if they break.

**Honest labeling:** NOAA has no Mars dust data, so a dust round is never a "DRILL" or "LIVE". The HUD must say **SIMULATED** (see step 5). Don't let it claim anything real.

### Step 4: pitch shortcut `?demo=dust`
In `Game.ts` inside `loadRound()`, after `this.plan = planRound(...)` add:
```ts
const demo = new URLSearchParams(window.location.search).get('demo')
if (demo === 'dust' && this.roundNumber === 1) this.plan = { ...this.plan, body: 'mars', disaster: 'dust_storm', level: 2, isDrill: false }
```
Now `http://localhost:5173/?demo=dust&fast=1` starts with a dust storm.

### Step 5: the hooks in `src/game/Game.ts` (this is the biggest part, go slow)
1. Imports: from `./sim/dust` and the new tunables.
2. New field: `private suitPower = SUIT_START`. In `loadRound()` reset it: `this.suitPower = SUIT_START`.
3. Change the line in `update()`: `if (phase === 'DISASTER') this.applyRadiation(dt)` to
   ```ts
   if (phase === 'DISASTER') {
     if (this.plan.disaster === 'dust_storm') this.applyDust(dt)
     else this.applyRadiation(dt)
   }
   ```
4. Write `private applyDust(dt: number)` next to `applyRadiation`: 
   - `const t = this.machine.elapsed; const tauNow = tau(t, this.plan.level)`
   - Work out `where`: standing in a shelter with `kind === 'airlock'` -> `'airlock'`; feet on a pad -> `'pad'`; else `'outside'`. (Copy how `movePlayer` loops over `this.map.shelters`. For pads: the player's center x is within `p.tx*TILE_PX` to `(p.tx+3)*TILE_PX` and `Math.abs(this.player.y + PLAYER_H - (p.ty + 1) * TILE_PX) < 3`.)
   - `this.suitPower = Math.min(SUIT_START, this.suitPower + powerRate(where, tauNow) * dt)` (if alive).
   - If `isPowerOut(this.suitPower)` and still alive: `this.alive = false`, set the banner to "EVAC'D: suit power", call `this.push()`. (Voice: ask Jaydon for an `evac-power` clip.)
5. Wind: in `movePlayer`, `step(...)` has a last parameter `windAccel`. During a dust disaster pass `windPush(this.machine.elapsed, this.plan.level, this.plan.seed, dir)` where `dir = this.plan.seed % 2 === 0 ? 1 : -1`; otherwise pass 0. No wind outside the DISASTER phase.
6. Drawing in `render()` (before `this.drawHud()`), only for dust DISASTER. The "hole in the darkness" trick:
   ```ts
   if (this.plan.disaster === 'dust_storm' && this.machine.phase === 'DISASTER') {
     const px = this.player.x + PLAYER_W / 2, py = this.player.y + PLAYER_H / 2
     c.fillStyle = 'rgba(70,35,15,0.93)'
     c.beginPath()
     c.rect(0, 0, LOGICAL_W, LOGICAL_H)                       // the whole screen...
     c.arc(px, py, visibilityRadius(tau(this.machine.elapsed, this.plan.level)), 0, Math.PI * 2) // ...minus a circle
     c.fill('evenodd')                                         // 'evenodd' = fill everything except where the shapes overlap
   }
   ```
   Also don't draw the red radiation tint on dust rounds (the existing `if (this.machine.phase === 'DISASTER')` tint block should only run for solar).
7. HUD in `drawHud()`: for dust show `SIMULATED DUST STORM (game values)` instead of the DRILL/LIVE line; show a **suit power bar** instead of the dose bar, and `tau` as text, e.g. `tau 2.3  sun ${Math.round(sunlight(t)*100)}%`.
8. Warning text: ask Jaydon to add a `dust-warning-<level>` line to `src/audio/lines.ts` (you write the sentence, e.g. "Warning. Dust storm approaching. Get to the airlock now.") and use it where the warning fires (`enterPhase('WARNING')`). Until his voice work is merged, fall back to the existing banner + `this.say(...)`.

### Step 6: the results card and a fact
- The `Results` interface (top of `Game.ts`) and the card in `src/Play.tsx` (search `Real fact`) print `S{level} - dose ...`. Add `disaster: DisasterKind` and `suitPower: number` to `Results`, fill them in `finishRound()`, and make the card say "SIMULATED dust storm - suit power left X%" for dust. Keep the Play.tsx change tiny and tell Jaydon/Johnae which lines you changed.
- Add this fact to `src/data/facts.ts` (it's in CLAUDE.md section 6): `{ id: 'opportunity', status: 'real', source: 'Planetary Society', text: "In the 2018 dust storm, Opportunity's solar array output fell from about 645 Wh to about 22 Wh per sol and the rover went silent." }`. Add the same row to `docs/DATA_SOURCES.md`. On dust rounds show this fact (`FACTS.find(f => f.id === 'opportunity')`).
- Say honestly on the card: "Sunlight ~ exp(-tau) is a direct-beam approximation. All other dust numbers are game values."

### Done when
- `?demo=dust&fast=1`: the circle of sight shrinks, wind pushes you, pads give power early and stop helping later, the airlock keeps you alive, and standing outside drains you to EVAC'D.
- A normal run alternates solar rounds and (every 4th round on Mars) dust rounds.
- `npm run validate` passes, `AI_USAGE.md` updated, no new outside services.

## Part B. The demo script: `docs/DEMO_SCRIPT.md`
You present for 8 minutes: pitch + demo. Write the file with these headings and fill them in with your own words (ask Claude to tighten, not to invent facts):

1. **Hook (0:00 to 1:00)**: "What if the next big solar storm hits while astronauts are outside?" One sentence on the game.
2. **Live demo, solar round (1:00 to 3:00)**: point at the HUD: DRILL vs LIVE, the real NOAA reading and its timestamp, the warning voice (ElevenLabs), the shelter choice (habitat 50% vs storm shelter 10%), the dose bar, EVAC'D.
3. **Dust round (3:00 to 4:30)**: open `/?demo=dust`. Explain tau, shrinking sight, pads vs airlock. Say "simulated".
4. **Real vs tuned (4:30 to 5:30)**: show the results card fact + source. Say plainly: 250 mSv limit is real, the 600 mSv career limit is only *proposed*, the 12-second warning lead is a game value.
5. **How it works (5:30 to 6:30)**: 2 outside services (NOAA data, ElevenLabs voice); map seeded from the NOAA reading; a search proves every shelter is reachable; unit tests; pure code that's easy to explain.
6. **Honesty (6:30 to 7:00)**: AI-assisted code is logged in `docs/AI_USAGE.md`; all art is hand-drawn; we dropped a backend to stay within the 2-API rule.
7. **Buffer / questions (7:00 to 8:00)**.

Also include:
- **Who says what** (assign a speaker per section).
- **Backup plan:** a 60-second screen recording saved on every teammate's laptop; how to show the offline fallback (DevTools -> Network -> Offline).
- **Pre-flight checklist:** sound on and volume checked, captions visible, `git status` clean, the tagged commit is what's running, browser zoom at 100%, join the video call 15 minutes early.
- **Likely judge questions** with answers (Why drills? Why no backend? How do you know the map is beatable? What's real?).

## Prompts for you
> Read CLAUDE.md and docs/team/garri-dust-storm-and-demo.md. I'm a beginner. Help me with Part A step <N> only. Explain first, then give small pieces of code and say exactly which file and line to put them in.

> Here's my `applyDust` function: <paste>. Explain what it does line by line, then check it against the guide for mistakes.
