/**
 * FILE PURPOSE: turn any piece of text into one repeatable number.
 *
 * WHY WE NEED IT
 * The map must be random-looking but REPEATABLE: the same NOAA reading + same round number +
 * same body must always build the same map. A computer's random numbers need a starting number
 * (a "seed"). We build the seed from text like "2026-10-24T16:06:00Z|1|mars", so we need a way to
 * squash text into a number. That is what a hash does.
 *
 * HOW IT WORKS (FNV-1a, a very small, well-known hash)
 *  1. Start with a fixed number (0x811c9dc5).
 *  2. For each character in the text: mix the character's code into the number with XOR (^),
 *     then multiply by a fixed prime (0x01000193). Multiplying scrambles the bits so that even
 *     a one-letter change in the text gives a completely different number.
 *  3. `Math.imul` is a multiply that wraps around at 32 bits (like a car odometer rolling over),
 *     which keeps the result a normal 32-bit number.
 *  4. `>>> 0` turns the result into a positive whole number between 0 and 4,294,967,295.
 *
 * It is NOT secure (not for passwords). It only needs to be fast, stable, and well mixed.
 */
export function fnv1a32(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
