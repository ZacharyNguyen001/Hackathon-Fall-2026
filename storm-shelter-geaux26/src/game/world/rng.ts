import { fnv1a32 } from '../../shared/hash'

/** mulberry32: tiny seeded PRNG. Same seed -> same sequence. Returns floats in [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Map seed from the NOAA reading time + round number + body (CLAUDE.md section 4). */
export function seedFor(observedAt: string, roundNumber: number, body: string): number {
  return fnv1a32(`${observedAt}|${roundNumber}|${body}`)
}
