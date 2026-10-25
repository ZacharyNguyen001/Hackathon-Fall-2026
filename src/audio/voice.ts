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