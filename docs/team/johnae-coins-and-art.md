# Johnae: save coins on this device + all the art + the art loader

Read `00-START-HERE.md` first. Branch names: `johnae/coins` (do this FIRST, it's the smallest and gets merged first), then `johnae/art`.

## Part A. Coins saved on this device (about 2 hours)

### The idea
Today the results card says "(not saved - local only)" and the total is forgotten when you close the page. You make the game remember totals in the browser's `localStorage` (a small notebook the browser keeps for our website). There are no accounts and no server; each person's totals stay on their own device. That is fine and honest: say "saved on this device".

### What already exists
- `Results` (top of `src/game/Game.ts`) holds `survived`, `doseMSv`, `coins`, `pickups`... for the round that just ended.
- `src/Play.tsx` shows the results card when `ui.phase === 'RESULTS'` (search for `Coins this round`).
- `computeCoins` in `src/game/sim/coins.ts` already works out the coins for one round.
- The "career dose" idea: `CAREER_LIMIT_MSV` (600) is in `tunables.ts`. It is a **proposed** NASA limit, so always write the word "proposed".

### Step 1: create `src/data/saveCoins.ts`
```ts
/** FILE PURPOSE: remember total coins and total radiation dose between visits, using the browser's localStorage. */
export interface Totals { coins: number; roundsPlayed: number; roundsSurvived: number; careerDoseMSv: number }

/** The tiny part of localStorage we use. Tests can pass a fake one. */
export interface Store { getItem(key: string): string | null; setItem(key: string, value: string): void }

const KEY = 'storm-shelter:v1'
export const emptyTotals = (): Totals => ({ coins: 0, roundsPlayed: 0, roundsSurvived: 0, careerDoseMSv: 0 })

const isGoodNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0

export function loadTotals(store: Store): Totals {
  try {
    const raw = store.getItem(KEY)
    if (!raw) return emptyTotals()
    const t = JSON.parse(raw)
    // Never trust saved data: if anything looks wrong, start fresh.
    if (isGoodNumber(t.coins) && isGoodNumber(t.roundsPlayed) && isGoodNumber(t.roundsSurvived) && isGoodNumber(t.careerDoseMSv)) return t
    return emptyTotals()
  } catch {
    return emptyTotals() // storage blocked or JSON broken
  }
}

export function addRound(store: Store, round: { coins: number; survived: boolean; doseMSv: number }): Totals {
  const t = loadTotals(store)
  const next: Totals = {
    coins: t.coins + Math.max(0, round.coins),
    roundsPlayed: t.roundsPlayed + 1,
    roundsSurvived: t.roundsSurvived + (round.survived ? 1 : 0),
    careerDoseMSv: t.careerDoseMSv + Math.max(0, round.doseMSv),
  }
  try { store.setItem(KEY, JSON.stringify(next)) } catch { /* private window: just don't save */ }
  return next
}
```
Why `try/catch` everywhere? Some browsers (private windows, strict settings) block `localStorage` and throw an error. The game must still work.

### Step 2: write the test `src/data/saveCoins.test.ts` (copy the style of `src/data/noaa.test.ts`)
Make a fake store: `const fake = () => { const m = new Map<string,string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } }`. Test: empty start; adding two rounds adds up; garbage saved text resets to empty; a store whose `setItem` throws doesn't crash.

### Step 3: use it in `src/Play.tsx`
1. Imports: `import { addRound, loadTotals, emptyTotals, type Totals } from './data/saveCoins'` and `CAREER_LIMIT_MSV` from `./game/tunables`.
2. State and a "saved this round already" flag:
   ```tsx
   const [totals, setTotals] = useState<Totals>(() => { try { return loadTotals(localStorage) } catch { return emptyTotals() } })
   const savedThisRound = useRef(false)
   ```
3. An effect that saves exactly **once** per round:
   ```tsx
   useEffect(() => {
     if (ui.phase !== 'RESULTS') { savedThisRound.current = false; return }
     if (ui.results && !savedThisRound.current) {
       savedThisRound.current = true
       try { setTotals(addRound(localStorage, ui.results)) } catch { /* storage blocked */ }
     }
   }, [ui.phase, ui.results])
   ```
   (Why the flag? React can run effects again, e.g. when the mute button is pressed, and we must not count a round twice.)
4. On the results card, replace `(not saved - local only)` with `Total coins: {totals.coins} (saved on this device)` and add a line `Career dose: {Math.round(totals.careerDoseMSv)} mSv (NASA's proposed career limit is {CAREER_LIMIT_MSV} mSv)`.
5. Optional: show the totals on the "click to start" screen, plus a small "Reset saved totals" button that calls `localStorage.removeItem('storm-shelter:v1')` inside `try/catch` and `setTotals(emptyTotals())`.

### Done when
- Finish a round, refresh the page, finish another: the total goes up and doesn't reset.
- In a private/incognito window the game still works.
- `npm run validate` passes. `AI_USAGE.md` updated. Pull request to Zach.

## Part B. The art (you are the artist!)

### Rules (these are strict and can disqualify the team)
- You draw every pixel **by hand** in a pixel-art program (free: Piskel at piskelapp.com, LibreSprite, or Aseprite). **No AI image generators or "AI assist" features, no AI upscaling, and don't trace or copy sprites from other games.**
- Put **your name in a comment at the top** of `palettes.ts` and `sprites.ts`.
- Claude will not create or edit anything inside `src/art/`. You make those files.

### Sizes (1 art pixel = 1 game pixel; the whole screen is only 384 x 216 and gets zoomed in)
Save as **PNG with a transparent background**. Use these **exact file names** in the folder `src/art/`:

| File name | Size (px) | What it is |
|---|---|---|
| `player.png` | 8 x 12 | The astronaut. The real hitbox is 5 x 10, so draw the feet at the very bottom, centered. |
| `habitat.png` | 48 x 32 | Habitat module (aluminum walls, 50% protection) |
| `storm-shelter.png` | 64 x 40 | Storm shelter (water-walled, the best protection) |
| `airlock.png` | 32 x 32 | Mars airlock (a third shelter, 50% protection like the habitat) |
| `coin.png` | 8 x 8 | Coin pickup |
| `ground-mars.png` | 8 x 8 | Mars ground tile (optional) |
| `ground-moon.png` | 8 x 8 | Moon ground tile (optional) |
| `ledge-mars.png` | 8 x 8 | Floating ledge tile, Mars (optional) |
| `ledge-moon.png` | 8 x 8 | Floating ledge tile, Moon (optional) |

Tip: make the three shelters easy to tell apart at a glance, because choosing the right one is the whole game.

### `src/art/palettes.ts` (colors for sky, ground and ledge)
```ts
// Author: <your name>  (hand-chosen colors)
export const PALETTES = {
  mars: { sky: '#2a1410', ground: '#a8532c', ledge: '#c27a4b' }, // <- replace with your colors
  moon: { sky: '#0b0b12', ground: '#8a8a8a', ledge: '#b0b0b0' },
}
```
(These are the current placeholder values; change them to colors you like. If you draw ground tiles, the palette colors act as the fallback.)

### `src/art/sprites.ts` (lists your pictures)
Only import files that **exist**, or the build fails. Add the optional tile lines when you've drawn them.
```ts
// Author: <your name>
import player from './player.png'
import habitat from './habitat.png'
import stormShelter from './storm-shelter.png'
import airlock from './airlock.png'
import coin from './coin.png'
// import groundMars from './ground-mars.png'   <- uncomment when the file exists, and add it below

export const SPRITES: Record<string, string> = { player, habitat, stormShelter, airlock, coin }
```
(The name before the `=` of each import is the sprite's name used by the game: `player`, `habitat`, `stormShelter`, `airlock`, `coin`, `groundMars`, `groundMoon`, `ledgeMars`, `ledgeMoon`.)

## Part C. The loader (so the game draws your pictures) (about 2 hours)
Do this on branch `johnae/art` after you have at least `player.png`. The rule is: **if a picture is missing or not loaded yet, the game keeps drawing the old rectangle**, so nothing ever breaks.

### Step 1: create `src/game/spriteLoader.ts`
```ts
/** FILE PURPOSE: load the hand-made pictures from src/art and hand them to the renderer. */
const images = new Map<string, HTMLImageElement>()

export function loadSprites(urls: Record<string, string>) {
  for (const [name, url] of Object.entries(urls)) {
    const img = new Image()
    img.src = url
    images.set(name, img)
  }
}

/** The picture if it has finished loading, else null (the caller draws a placeholder). */
export function sprite(name: string): HTMLImageElement | null {
  const img = images.get(name)
  return img && img.complete && img.naturalWidth > 0 ? img : null
}
```

### Step 2: use your palettes in `src/game/Game.ts`
Delete the `const PALETTE = {...}` block (and its TODO-ART comment), add `import { PALETTES } from '../art/palettes'` and `import { SPRITES } from '../art/sprites'` and `import { loadSprites, sprite } from './spriteLoader'`, and replace `PALETTE[this.plan.body]` with `PALETTES[this.plan.body]`. In the `constructor`, after `this.ctx = ...` add `loadSprites(SPRITES)`.

### Step 3: draw the pictures in `render()` (search `TODO-ART`)
Pattern for every item: "if there is a picture, draw it, else draw the old rectangle."
- **Shelters:** inside `for (const s of this.map.shelters)`:
  ```ts
  const name = s.kind === 'storm_shelter' ? 'stormShelter' : s.kind   // 'habitat' | 'airlock' | 'stormShelter'
  const img = sprite(name)
  if (img) { c.drawImage(img, s.tx * TILE_PX, s.ty * TILE_PX); continue }
  // ...the old rectangle code stays below as the fallback
  ```
- **Coins:** `sprite('coin')` drawn at `(k.tx * TILE_PX, k.ty * TILE_PX)`.
- **Player:** `sprite('player')` drawn at `(Math.round(this.player.x) - 1, Math.round(this.player.y) - 2)` (the picture is a bit bigger than the hitbox). When EVAC'D set `c.globalAlpha = 0.4` before drawing and `c.globalAlpha = 1` after.
- **Tiles:** pick `sprite(t === 1 ? (body === 'mars' ? 'groundMars' : 'groundMoon') : (body === 'mars' ? 'ledgeMars' : 'ledgeMoon'))`, else use the palette color.
- Remove each `TODO-ART` comment once its rectangle is replaced (leave the rectangles as the fallback).

### Step 4: finish
- Update `docs/ART_GUIDE.md` if you changed any size, and add "Art by <your name>, hand-drawn in <program>" to `README.md`.

### Done when
- Your sprites show in the game; temporarily rename one PNG and the build tells you (import error), and a sprite that hasn't loaded yet falls back to its rectangle.
- No placeholder rectangles are visible on screen in normal play.
- `npm run validate` passes. `AI_USAGE.md` updated (note: Claude only helped explain/type the loader code, **never the art**).

## Prompts for you
> Read CLAUDE.md and docs/team/johnae-coins-and-art.md. I'm a beginner. Help me with Part <A/C> step <N> only. Explain it first, then show small pieces of code and say exactly which file and line they go in. Do not create or edit anything in src/art.

> Explain `localStorage`, `JSON.parse` and `try/catch` in plain English using my `src/data/saveCoins.ts`.

> My pixel art is 8x12. Why does it look blurry in the game and how do I make it crisp? (Hint: look for `imageSmoothingEnabled` in Game.ts.)
