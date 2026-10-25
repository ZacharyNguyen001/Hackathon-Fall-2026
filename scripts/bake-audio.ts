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