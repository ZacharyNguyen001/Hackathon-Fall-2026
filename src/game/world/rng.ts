/**
 * FILE PURPOSE: a seeded random number generator, so "random" maps are repeatable.
 *
 * `Math.random()` gives different numbers every run, so we could never rebuild the same map
 * (or test it). A seeded generator is a little machine: give it the same seed and it produces
 * the same list of numbers every time. Look at how it's used in mapgen.ts: `const rng = mulberry32(seed)`
 * then each `rng()` call returns the next number between 0 (included) and 1 (not included).
 *
 * mulberry32 is a tiny public-domain generator. The steps inside are bit-mixing (shifts `>>>`,
 * XOR `^`, and 32-bit multiplies `Math.imul`) that scramble the state so the output looks random.
 * You do not need to memorize the math; what matters: same seed in -> same numbers out.
 */
import { fnv1a32 } from '../../shared/hash'

/** Returns a function; each call gives the next pseudo-random float in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0 // the generator's memory. It changes on every call.
  return () => {
    a = (a + 0x6d2b79f5) >>> 0 // step the memory forward by a fixed odd number
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1) // scramble the bits
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61) // scramble again
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 // divide by 2^32 to get a number from 0 up to (not including) 1
  }
}

/**
 * Map seed = hash of "NOAA reading time | round number | body".
 * Same reading + same round + same body -> same seed -> same map.
 * A new NOAA reading (every few minutes) or a new round gives a different map.
 */
export function seedFor(observedAt: string, roundNumber: number, body: string): number {
  return fnv1a32(`${observedAt}|${roundNumber}|${body}`)
}
