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
