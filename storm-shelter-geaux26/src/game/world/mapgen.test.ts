import { describe, expect, it } from 'vitest'
import { fallbackMap, generateMap, mapIsReachable } from './mapgen'
import { mulberry32, seedFor } from './rng'
import { jumpTiles } from './bodies'

describe('rng', () => {
  it('is deterministic', () => {
    const a = mulberry32(5), b = mulberry32(5)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('seedFor depends on all three inputs', () => {
    expect(seedFor('t', 1, 'mars')).toBe(seedFor('t', 1, 'mars'))
    expect(seedFor('t', 1, 'mars')).not.toBe(seedFor('t', 2, 'mars'))
  })
})

describe('bodies', () => {
  it('Moon jumps higher than Mars by the real gravity ratio', () => {
    expect(jumpTiles('moon') / jumpTiles('mars')).toBeCloseTo(3.71 / 1.62, 5)
  })
})

describe('mapgen', () => {
  it('is deterministic', () => {
    expect(generateMap(42, 'mars').tiles).toEqual(generateMap(42, 'mars').tiles)
  })
  it('fallback map is reachable', () => {
    expect(mapIsReachable(fallbackMap('mars'), 'mars')).toBe(true)
    expect(mapIsReachable(fallbackMap('moon'), 'moon')).toBe(true)
  })
  it('every generated map is reachable (200 seeds x 2 bodies)', () => {
    for (let s = 1; s <= 200; s++)
      for (const body of ['mars', 'moon'] as const)
        expect(mapIsReachable(generateMap(s, body), body)).toBe(true)
  })
  it('has a near and a far shelter, and Mars has an airlock', () => {
    const m = generateMap(7, 'mars')
    expect(m.shelters.map((s) => s.kind).sort()).toEqual(['airlock', 'habitat', 'storm_shelter'])
  })
})
