/* eslint-disable no-await-in-loop */
// FILE PURPOSE: run on YOUR computer. Asks ElevenLabs to make each sound effect and saves the mp3 for the game.
// Run: node --env-file=.env.bake.local --experimental-strip-types scripts/bake-sfx.ts
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const key = process.env.ELEVENLABS_API_KEY
if (!key) throw new Error('Missing ELEVENLABS_API_KEY in .env.bake.local')

const SOUNDS = [
  { file: 'geiger-click', text: 'single short geiger counter click', seconds: 0.5, loop: false },
  { file: 'klaxon', text: 'space station emergency klaxon alarm, three short blasts', seconds: 3, loop: false },
  { file: 'coin', text: 'quiet and soft retro 8-bit coin pickup blip', seconds: 0.5, loop: false },
  { file: 'jump', text: 'soft retro 8-bit jump boing', seconds: 0.5, loop: false },
  // NOTE: mars-wind-loop.mp3 is a NASA recording, not generated. Do not add it here, or this script could replace it with an AI sound.
  { file: 'moon-suit-hum-loop', text: 'quiet ambient electrical hum inside a spacesuit helmet, seamless', seconds: 10, loop: true },
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