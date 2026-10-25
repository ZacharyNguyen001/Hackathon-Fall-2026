/**
 * FILE PURPOSE: guards the hackathon "max 2 external APIs" rule. It scans our own source files for web addresses
 * and fails if any host other than NOAA or ElevenLabs shows up. Run with `npm test`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ALLOWED_HOSTS = ['services.swpc.noaa.gov', 'api.elevenlabs.io']

/** Every text file under `dir` (skips the art folder, which holds PNG images, and node_modules). */
function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'art' || name === 'node_modules' ? [] : listFiles(path)
    return /\.(ts|tsx|css|html)$/.test(name) ? [path] : []
  })
}

describe('external services', () => {
  it('only talks to NOAA and ElevenLabs', () => {
    const files = [...listFiles('src'), ...listFiles('scripts'), 'index.html', 'vite.config.ts']
    const found = new Set<string>()
    for (const file of files) {
      for (const m of readFileSync(file, 'utf-8').matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) found.add(m[1].toLowerCase())
    }
    const unexpected = [...found].filter((h) => !ALLOWED_HOSTS.includes(h))
    expect(unexpected).toEqual([])
  })
})
