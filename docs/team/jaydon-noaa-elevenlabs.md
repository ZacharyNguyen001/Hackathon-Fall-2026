# Jaydon: live NOAA data + ElevenLabs voice

Read `00-START-HERE.md` first. Branch names: `jaydon/noaa`, then `jaydon/voice`.

**Your two outside services are exactly our two allowed APIs.** Be careful: nothing else may be added.

## Part A. Live NOAA data (do this first, about 1 hour)

### What's the goal?
Right now the game reads *saved* NOAA files (`src/data/sampleWeather.ts`). You make it read the real, current numbers from the internet, and fall back to the saved ones if the internet or NOAA fails. The HUD already prints `live` or `sample` for you.

NOAA lets browsers call it directly (we checked: it sends `access-control-allow-origin: *`), so we need **no server**.

### What already exists (reuse it, don't rewrite)
- `src/data/noaa.ts` has `parseScales()` and `parseProtonFlux()`. They already handle missing or weird data by returning `null`.
- `src/data/sampleWeather.ts` gives the offline fallback.
- `Game.ts` stores the weather in `this.weather` and reads it when a round loads.

### Step 1: create `src/data/liveWeather.ts`
```ts
/** FILE PURPOSE: fetch the CURRENT space weather from NOAA. Returns null if anything goes wrong. */
import type { SpaceWeather } from '../shared/contracts'
import { parseProtonFlux, parseScales } from './noaa'

const BASE = 'https://services.swpc.noaa.gov'

export async function fetchLiveWeather(): Promise<SpaceWeather | null> {
  try {
    const [scalesRes, protonRes] = await Promise.all([
      fetch(`${BASE}/products/noaa-scales.json`, { signal: AbortSignal.timeout(8000) }),
      fetch(`${BASE}/json/goes/primary/integral-protons-1-day.json`, { signal: AbortSignal.timeout(8000) }),
    ])
    if (!scalesRes.ok) return null
    const scales = parseScales(await scalesRes.json())
    const proton = protonRes.ok ? parseProtonFlux(await protonRes.json()) : null
    if (!scales) return null // without the S-level we can't trust anything
    return {
      sLevel: scales.sLevel,
      protonFlux10MeV: proton?.flux ?? null,
      kp: null,
      observedAt: scales.observedAt,
      fetchedAt: new Date().toISOString(),
      source: 'live',
    }
  } catch {
    return null // offline, timed out, or bad JSON
  }
}
```
Plain English: `fetch` asks the internet for a file; `await` waits for the answer; `try/catch` means "if anything breaks, give up quietly and return null".

### Step 2: add `setWeather` to `src/game/Game.ts`
Next to `setMuted(...)` add:
```ts
setWeather(w: SpaceWeather) { this.weather = w } // the NEXT round uses this reading (and gets a new map seed)
```

### Step 3: use it in `src/Play.tsx`
1. Import: `import { fetchLiveWeather } from './data/liveWeather'`
2. Add state: `const [weather, setWeather] = useState(sampleWeather())`
3. A `useEffect` that fetches once and then every 5 minutes (**never faster, be kind to NOAA**):
```tsx
useEffect(() => {
  let stopped = false
  const refresh = async () => {
    const w = await fetchLiveWeather()
    if (w && !stopped) { setWeather(w); gameRef.current?.setWeather(w) }
  }
  refresh()
  const id = setInterval(refresh, 5 * 60 * 1000)
  return () => { stopped = true; clearInterval(id) }
}, [])
```
4. In `begin()` change `sampleWeather()` to `weather`.

### Done when
- With internet: the HUD line says `live` and shows today's real flux (if the sun is quiet it will say DRILL, and that's correct).
- Chrome DevTools -> Network -> set **Offline**, reload: it says `sample` and the game still plays.
- `npm run validate` passes.
- Add a test (optional but great): `liveWeather.test.ts` can pass a fake `fetch`. Ask Claude for help.

## Part B. ElevenLabs voice (about 3 hours)

### Why "baked"?
An API key in browser code is public to everyone. We have no server, so the game cannot call ElevenLabs while people play. Instead **you run a script on your computer once**; it asks ElevenLabs to speak each sentence and saves `.mp3` files into the project. The game just plays those files. (This is allowed: the audio is generated with ElevenLabs. Mention it in the pitch!)

### Step 1: accounts and key
1. Claim the ElevenLabs Creator coupon (ElevenLabs Discord, coupon-codes channel, same email as registration).
2. In ElevenLabs create an **API key** (Developers -> API Keys). Allow Text to Speech and Sound Effects.
3. Pick a **premade voice** from the Voice Library (do NOT clone anyone's voice). Copy its **voice id**.
4. In the repo root create a file named `.env.bake.local`:
   ```
   ELEVENLABS_API_KEY=paste_key_here
   ELEVENLABS_VOICE_ID=paste_voice_id_here
   ```
5. **Check git will ignore it:** `git check-ignore -v .env.bake.local` must print a line. If it prints nothing, STOP and ask for help.
   If a key ever gets pasted into a chat or commit, delete it in ElevenLabs and make a new one.

### Step 2: list the sentences in `src/audio/lines.ts`
`lines.ts` already has `warningLine`, `evacLine`, `allClearLine`. Add at the bottom:
```ts
/** Every clip the bake script makes. id = mp3 file name (without .mp3). */
export function warningClipId(plan: { level: number; isDrill: boolean }) {
  return `solar-warning-s${plan.level}-${plan.isDrill ? 'drill' : 'live'}`
}
export const VOICE_LINES: { id: string; text: string }[] = [
  ...[1, 2, 3, 4, 5].flatMap((level) =>
    [true, false].map((isDrill) => ({ id: warningClipId({ level, isDrill }), text: warningLine({ level, isDrill }) })),
  ),
  { id: 'evac', text: evacLine },
  { id: 'all-clear', text: allClearLine },
  // Garri will send the dust-storm sentences: add { id: 'dust-warning-1', text: '...' } etc.
]
```
Keep sentences short and in the same tone. You choose the final wording (you own this file).

### Step 3: write `scripts/bake-audio.ts`
```ts
// FILE PURPOSE: run on YOUR computer. Asks ElevenLabs to speak each line and saves mp3 files the game plays.
// Run: node --env-file=.env.bake.local --experimental-strip-types scripts/bake-audio.ts
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { VOICE_LINES } from '../src/audio/lines.ts'

const key = process.env.ELEVENLABS_API_KEY
const voice = process.env.ELEVENLABS_VOICE_ID
if (!key || !voice) throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in .env.bake.local')

const OUT = 'public/audio/voice'
mkdirSync(OUT, { recursive: true })

for (const line of VOICE_LINES) {
  const file = `${OUT}/${line.id}.mp3`
  if (existsSync(file)) { console.log('skip (exists)', line.id); continue } // saves credits on re-runs
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: line.text, model_id: 'eleven_multilingual_v2', output_format: 'mp3_44100_128' }),
  })
  if (!res.ok) { console.error('FAILED', line.id, res.status, await res.text()); continue }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  console.log('saved', file)
}
```
Notes: `res.arrayBuffer()` is the raw audio bytes. The `xi-api-key` header is how ElevenLabs knows it's you. To redo a clip, delete its mp3 and run again.
Run it, listen to the files, then **commit the mp3s** (`git add public/audio/voice`).
Check the exact request shape in ElevenLabs' docs if it ever errors: https://elevenlabs.io/docs/api-reference/text-to-speech/convert

### Step 4: play the files: `src/audio/voice.ts`
```ts
/** FILE PURPOSE: play a baked ElevenLabs clip; fall back to the browser's voice if the file is missing or slow. */
let current: HTMLAudioElement | null = null

export function stopVoice() { current?.pause(); current = null; speechSynthesis.cancel() }

export function playLine(id: string, text: string) {
  stopVoice()
  let fellBack = false
  const fallback = () => {
    if (fellBack) return
    fellBack = true
    if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }
  const audio = new Audio(`${import.meta.env.BASE_URL}audio/voice/${id}.mp3`) // BASE_URL keeps it working if the site is hosted in a sub-folder
  current = audio
  audio.onerror = fallback                     // file missing
  const timer = setTimeout(fallback, 1500)     // too slow to start: use the browser voice
  audio.onplaying = () => clearTimeout(timer)
  audio.play().catch(fallback)                 // e.g. browser blocked audio
}
```
(If the clip starts late after the fallback already spoke, they could overlap; that's rare and fine. Ask Claude if you want to tidy it.)

### Step 5: hook into `src/game/Game.ts`
Find `private say(text: string)` (search `say(`). Change it to take an id:
```ts
private say(id: string, text: string) {
  if (this.ui.muted) return
  playLine(id, text)
}
```
and import `playLine, stopVoice` from `../audio/voice` and `warningClipId` from `../audio/lines`. Update the call sites (search for `this.say(`):
- warning: `this.say(warningClipId(this.plan), line)`
- evac: `this.say('evac', evacLine)`
- all clear: `this.say('all-clear', allClearLine)`
- In `setMuted`, replace `speechSynthesis.cancel()` with `stopVoice()`; same in `stop()`.
Garri will add a dust call; tell them to use `this.say('dust-warning-1', line)`.

### Done when
- The warning at 20 seconds plays the ElevenLabs voice and the banner/caption still appear.
- Rename one mp3: the browser voice speaks instead (nothing crashes).
- Mute silences everything.
- Search for leaked keys: `git grep -n "xi-api-key"` should show **only** `scripts/bake-audio.ts`, and your real key must appear nowhere (`git grep -n "sk_"` prints nothing).
- `npm run validate` passes, `AI_USAGE.md` updated.

## Optional extras (only if everything else is done)
- Space-weather "briefing" line in the lobby: the live numbers can't be baked, so use `speechSynthesis` with text built from the current reading.
- Help Zach: the same bake-script pattern works for sound effects (`https://api.elevenlabs.io/v1/sound-generation`).

## Prompts for you
> Read CLAUDE.md and docs/team/jaydon-noaa-elevenlabs.md. I'm a beginner. Help me with Part A step <N> only. Explain it first, then show small code pieces and what each line does.

> My bake script printed `<paste output>`. What does it mean and what's the smallest fix? Do not print or ask for my API key.
