# Zach: sound effects (Moon and Mars) + merging + hosting

Read `00-START-HERE.md` first. Branch name: `zach/sfx`. You are also the repo owner, so you **merge pull requests** and own the hosting question.

## Part A. Sound effects (about 3 to 4 hours)

### What exists now
- A synthesized "click" beep in `Game.ts` (`private click()`): that's the Geiger counter. It is a placeholder.
- Voice is Jaydon's job. You do the *effects* and *ambience*.
- `Game.ts` already has `this.audio` (a Web Audio `AudioContext`, created when the player clicks "start") and `this.ui.muted`.

### Be honest about the Moon (this is a great pitch point)
Sound can't travel through empty space, so the Moon has **no wind or ambient noise**. On the Moon the player only hears what is *inside the suit or radio*: the Geiger counter, radio beeps, the suit's own hum. Mars has a thin atmosphere and does have wind. Do **not** put numbers or claims about Mars sounds in the game text unless the fact is first added, with a source, to `docs/DATA_SOURCES.md` (CLAUDE.md section 7).

### Sound list (put the files in `public/audio/sfx/`, keep each under about 200 KB)
| File | When it plays |
|---|---|
| `geiger-click.mp3` | each Geiger click (very short, about 0.1 s) |
| `klaxon.mp3` | when the warning fires |
| `coin.mp3` | coin pickup |
| `jump.mp3` | player jumps |
| `airlock.mp3` | optional, entering the airlock |
| `mars-wind-loop.mp3` | looping ambience on Mars rounds |
| `moon-suit-hum-loop.mp3` | looping quiet hum on Moon rounds |

### Where the sound can come from (pick what fits; credit everything in the README)
1. **ElevenLabs sound effects** (best fit; AI-generated *audio* is allowed). It counts as our API #2 (ElevenLabs), so you don't add a new service. Use the script below.
2. **Real NASA recordings of Mars wind** from Perseverance. Download by hand, **read NASA's media-usage rules first**, and credit NASA in the README. A downloaded file is not an API.
3. Record your own sounds (foley).

### Step 1: generate with ElevenLabs (optional route)
You need your own key in `.env.bake.local` (same file name Jaydon uses; each of you has your own copy, never shared; check `git check-ignore -v .env.bake.local` prints a line). You only need `ELEVENLABS_API_KEY=...` for this script.

Create `scripts/bake-sfx.ts`:
```ts
// FILE PURPOSE: run on YOUR computer. Asks ElevenLabs to make each sound effect and saves the mp3 for the game.
// Run: node --env-file=.env.bake.local --experimental-strip-types scripts/bake-sfx.ts
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const key = process.env.ELEVENLABS_API_KEY
if (!key) throw new Error('Missing ELEVENLABS_API_KEY in .env.bake.local')

const SOUNDS = [
  { file: 'geiger-click', text: 'single short geiger counter click', seconds: 0.5, loop: false },
  { file: 'klaxon', text: 'space station emergency klaxon alarm, three short blasts', seconds: 3, loop: false },
  { file: 'coin', text: 'bright retro 8-bit coin pickup blip', seconds: 0.5, loop: false },
  { file: 'jump', text: 'soft retro 8-bit jump boing', seconds: 0.5, loop: false },
  { file: 'mars-wind-loop', text: 'thin low wind blowing over a quiet dusty desert, seamless', seconds: 10, loop: true },
  { file: 'moon-suit-hum-loop', text: 'very quiet electrical hum inside a spacesuit helmet, seamless', seconds: 10, loop: true },
]

const OUT = 'public/audio/sfx'
mkdirSync(OUT, { recursive: true })
for (const s of SOUNDS) {
  const path = `${OUT}/${s.file}.mp3`
  if (existsSync(path)) { console.log('skip (exists)', s.file); continue } // saves credits
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: s.text, duration_seconds: s.seconds, loop: s.loop, prompt_influence: 0.5 }),
  })
  if (!res.ok) { console.error('FAILED', s.file, res.status, await res.text()); continue }
  writeFileSync(path, Buffer.from(await res.arrayBuffer()))
  console.log('saved', path)
}
```
Listen to every file. Don't like one? Delete it, tweak its `text`, run again. (Request format: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert). Commit the mp3s.

### Step 2: create `src/audio/sfx.ts`
```ts
/** FILE PURPOSE: load and play the sound effects with the Web Audio API. A missing file never crashes the game. */
const buffers = new Map<string, AudioBuffer>()
let ctx: AudioContext | null = null
let master: GainNode | null = null          // one volume knob for everything (mute = 0)
let loopSource: AudioBufferSourceNode | null = null

const NAMES = ['geiger-click', 'klaxon', 'coin', 'jump', 'airlock', 'mars-wind-loop', 'moon-suit-hum-loop']

export async function loadSfx(audioCtx: AudioContext) {
  ctx = audioCtx
  master = ctx.createGain()
  master.connect(ctx.destination)
  await Promise.all(NAMES.map(async (name) => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}audio/sfx/${name}.mp3`)
      if (!res.ok) return                    // file not made yet: skip it
      buffers.set(name, await ctx!.decodeAudioData(await res.arrayBuffer()))
    } catch { /* ignore: the game works without this sound */ }
  }))
}

/** Returns false if there is no such sound, so the caller can use a fallback beep. */
export function playSfx(name: string, volume = 1): boolean {
  const buf = buffers.get(name)
  if (!ctx || !master || !buf) return false
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  gain.gain.value = volume
  src.buffer = buf
  src.connect(gain); gain.connect(master)
  src.start()
  return true
}

export function startLoop(name: string, volume = 0.4) {
  stopLoop()
  const buf = buffers.get(name)
  if (!ctx || !master || !buf) return
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  gain.gain.value = volume
  src.buffer = buf; src.loop = true
  src.connect(gain); gain.connect(master)
  src.start()
  loopSource = src
}
export function stopLoop() { loopSource?.stop(); loopSource = null }
export function setSfxMuted(muted: boolean) { if (master) master.gain.value = muted ? 0 : 1 }
```

### Step 3: hooks in `src/game/Game.ts` (search for the words in quotes)
Add `import { loadSfx, playSfx, startLoop, stopLoop, setSfxMuted } from '../audio/sfx'` at the top, then:
1. In `start()` after `this.audio = new AudioContext()`: `void loadSfx(this.audio)`.
2. In `stop()`: call `stopLoop()`.
3. In `setMuted(m)`: add `setSfxMuted(m)` (and `stopLoop()` is not needed, because the master volume handles it).
4. In `private click()`: first line `if (this.ui.muted) return`, then `if (playSfx('geiger-click', 0.6)) return`, and keep the old beep code as the fallback below.
5. Coin pickup, in `movePlayer` where it says `this.got.add(c.id)`: put `playSfx('coin')` on the next line (put both inside braces `{ }` for the `if`).
6. Jump: in `movePlayer`, before the call to `step(...)`: `const wasOnGround = this.player.onGround`. After it: `if (jump && wasOnGround && !this.player.onGround) playSfx('jump', 0.7)`.
7. Warning: in `enterPhase`, inside `if (p === 'WARNING') {...}` add `playSfx('klaxon', 0.7)`.
8. Ambience: in `enterPhase` add
   ```ts
   if (p === 'EXPLORE') startLoop(this.plan.body === 'mars' ? 'mars-wind-loop' : 'moon-suit-hum-loop')
   if (p === 'RESULTS') stopLoop()
   ```
9. Airlock sound (optional): when `this.shield` changes into an airlock, play `airlock`. Do it last.

### Done when
- Each sound plays at the right moment. Mars rounds have wind, Moon rounds have only the suit hum.
- **Mute silences everything**, even loops.
- Rename one mp3 and reload: the game still runs (Geiger falls back to the beep).
- `npm run validate` passes. Update `AI_USAGE.md`. Credit any NASA/recorded audio in the README.

## Part B. Zach's owner jobs
- **Merging:** merge pull requests one at a time, in the order in `00-START-HERE.md`. After each merge, tell the others to `git pull`. Before merging run: `git switch <branch> && npm install && npm run validate && npm run dev` and play one round.
- **Hosting (must be decided Saturday):** the build is a plain static site. `npm run build` makes `dist/`. Ask the organizers (Discord) that a static host is acceptable. If you use **GitHub Pages**: in `vite.config.ts` set `base: '/Hackathon-Fall-2026/'`, then every file path in code must use `import.meta.env.BASE_URL` (the guides already do). Test with `npm run build && npm run preview`.
- **The rule that matters:** the live demo must match the public repo. Publish only from committed code.
- **Final tag (before Sunday 12:00):** `git switch main && git pull && git tag submission && git push --tags`.
- **Credits:** make sure the README lists the font (Bitcount, OFL), any NASA/recorded audio, and the human artist.

## Prompts for you
> Read CLAUDE.md and docs/team/zach-sound-effects.md. I'm a beginner. Help me with Part A step <N> only. Explain first, then show small pieces of code and say exactly where each goes in the file.

> Explain what `AudioContext`, `decodeAudioData` and `createBufferSource` mean in plain English, using my `src/audio/sfx.ts`.
