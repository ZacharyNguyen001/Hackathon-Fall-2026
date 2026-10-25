/**
 * FILE PURPOSE: play a baked ElevenLabs clip; fall back to the browser's voice if the file is missing or slow.
 * Only one line speaks at a time. Starting a new line (or calling stopVoice) cancels the old one completely,
 * including its "too slow, use the browser voice" timer, so an old line can never be spoken late.
 */
const clips = new Map<string, HTMLAudioElement>() // clips downloaded ahead of time (see preloadVoice)
let current: HTMLAudioElement | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let latest = 0 // numbers each request; a request that is no longer the latest must do nothing

const urlFor = (id: string) => `${import.meta.env.BASE_URL}audio/voice/${id}.mp3` // BASE_URL keeps it working in a sub-folder

/** Start downloading all clips now (call after the click-to-start), so they are ready when the warning fires. */
export function preloadVoice(ids: string[]) {
  for (const id of ids) {
    if (clips.has(id)) continue
    const audio = new Audio(urlFor(id))
    audio.preload = 'auto'
    clips.set(id, audio)
  }
}

export function stopVoice() {
  latest++ // cancels any request that is still waiting
  if (timer) clearTimeout(timer)
  timer = null
  if (current) { current.onerror = null; current.onplaying = null; current.pause() }
  current = null
  if ('speechSynthesis' in window) speechSynthesis.cancel()
}

export function playLine(id: string, text: string) {
  stopVoice()
  const mine = latest
  let fellBack = false
  const fallback = () => {
    if (fellBack || mine !== latest) return // already handled, or a newer line replaced this one
    fellBack = true
    audio.pause() // never let the clip and the browser voice talk at the same time
    if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }
  const audio = clips.get(id) ?? new Audio(urlFor(id))
  audio.currentTime = 0
  current = audio
  audio.onerror = fallback // file missing
  audio.onplaying = () => { if (timer) clearTimeout(timer); timer = null }
  timer = setTimeout(fallback, 1500) // too slow to start: use the browser voice instead
  audio.play().catch(fallback) // e.g. the browser blocked audio
}
