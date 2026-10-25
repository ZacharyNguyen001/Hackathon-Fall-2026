/**
 * FILE PURPOSE: automatic checks for dose, coins, round timer, round planning and physics. Run with `npm test`.
 */
import { describe, expect, it } from 'vitest'
import { doseRate, isEvac, ramp } from './dose'
import { computeCoins } from './coins'
import { RoundMachine } from './roundMachine'
import { planRound } from './planRound'
import { step, type Body2D } from './physics'
import { generateMap } from '../world/mapgen'
import { gameGravity } from '../world/bodies'
import { MAP_H, MAP_W } from '../tunables'
import { seedFor } from '../world/rng'

const quiet = { sLevel: 0, protonFlux10MeV: 0.3, kp: null, observedAt: 't', fetchedAt: 't', source: 'sample' } as const

describe('dose', () => {
  it('ramps up, holds, eases', () => {
    expect(ramp(0)).toBe(0); expect(ramp(4)).toBe(0.5); expect(ramp(15)).toBe(1); expect(ramp(40)).toBe(0)
  })
  it('shield factors scale the rate', () => {
    expect(doseRate(3, 15, 0.5)).toBeCloseTo(doseRate(3, 15, 1) / 2)
    expect(doseRate(3, 15, 0.1)).toBeCloseTo(doseRate(3, 15, 1) / 10)
  })
  it('EVAC at 250 mSv', () => { expect(isEvac(249)).toBe(false); expect(isEvac(250)).toBe(true) })
})

describe('coins', () => {
  it('adds up and caps', () => {
    expect(computeCoins({ survived: true, secondsAlive: 52, pickups: 2 })).toBe(10 + 52 + 10)
    expect(computeCoins({ survived: false, secondsAlive: 999, pickups: 99 })).toBe(52 + 30)
  })
})

describe('round machine', () => {
  it('walks the phases in order with exact lengths', () => {
    const m = new RoundMachine(); const seen: string[] = []
    for (let i = 0; i < 96 * 60 + 5; i++) { const p = m.tick(1 / 60); if (p) seen.push(p) }
    expect(seen.slice(0, 5)).toEqual(['EXPLORE', 'WARNING', 'DISASTER', 'RESULTS', 'INTERMISSION'])
  })
})

describe('planRound', () => {
  it('is a drill when the sun is quiet and live when S>=1', () => {
    expect(planRound(1, quiet).isDrill).toBe(true)
    const live = planRound(1, { ...quiet, sLevel: 3 })
    expect(live.isDrill).toBe(false); expect(live.level).toBe(3)
  })
  it('round 1 seed comes from the weather reading (observedAt), not a fixed number', () => {
    expect(planRound(1, quiet).seed).toBe(seedFor('t', 1, 'mars'))
    expect(planRound(1, { ...quiet, observedAt: 'u' }).seed).not.toBe(planRound(1, quiet).seed)
  })
  it('drill levels cycle S2, S3, S4, S5, then back to S2', () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => planRound(n, quiet).level)).toEqual([2, 3, 4, 5, 2, 3])
  })
  it('a debug seed override still wins', () => {
    expect(planRound(1, quiet, 123).seed).toBe(123)
  })
})

describe('physics', () => {
  it('player falls, lands on the ground, and can jump', () => {
    const map = generateMap(42, 'mars'); const g = gameGravity('mars')
    const b: Body2D = { x: map.spawn.tx * 8 + 1, y: map.spawn.ty * 8 - 10, vx: 0, vy: 0, onGround: false }
    for (let i = 0; i < 120; i++) step(b, map.tiles, 1 / 60, 0, false, g)
    expect(b.onGround).toBe(true)
    const y0 = b.y
    step(b, map.tiles, 1 / 60, 0, true, g)
    expect(b.y).toBeLessThan(y0)
    expect(b.x).toBeGreaterThan(0); expect(b.y).toBeLessThan(MAP_H * 8); expect(b.x).toBeLessThan(MAP_W * 8)
  })
})

describe('full-storm dose (integrated over the 40 s disaster)', () => {
  const total = (level: number, shield: number) => {
    let d = 0
    for (let t = 0; t < 40; t += 1 / 60) d += doseRate(level, t, shield) / 60
    return d
  }
  it('S3 outside is EVAC; habitat and storm shelter survive', () => {
    expect(isEvac(total(3, 1))).toBe(true)
    expect(isEvac(total(3, 0.5))).toBe(false)
    expect(isEvac(total(3, 0.1))).toBe(false)
  })
  it('S5 habitat is EVAC but storm shelter survives (the shelter choice matters)', () => {
    expect(isEvac(total(5, 0.5))).toBe(true)
    expect(isEvac(total(5, 0.1))).toBe(false)
  })
})
