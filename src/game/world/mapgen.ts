/**
 * FILE PURPOSE: builds one level from a seed. Steps: hills (smooth random heights) -> a crater -> flatten spots for the shelters (a near habitat, a far storm shelter, a Mars airlock) -> floating ledges -> solar pads (Mars) -> coins.
 * Then it CHECKS the level can be finished (reachability.ts). If not, it tries seed+1, up to 20 times, then uses a plain flat level. Same seed = same level.
 */
import type { Body, GameMap, Shelter } from '../../shared/contracts'
import {
  GROUND_MAX, GROUND_MIN, HEIGHT_CTRL_SPACING, MAP_H, MAP_W, MAX_MAP_RETRIES,
  SHIELD_HABITAT, SHIELD_STORM_SHELTER, SHIELD_OUTSIDE,
} from '../tunables'
import { mulberry32 } from './rng'
import { maxStepTiles } from './bodies'
import { isStanding, reachableCells } from './reachability'
import { T_GROUND, T_LEDGE } from './tiles'

const clampInt = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)))

/** Build the tile grid from a column-height array (height = solid tiles from the bottom). */
function heightsToTiles(h: number[]): Uint8Array {
  const tiles = new Uint8Array(MAP_W * MAP_H)
  for (let x = 0; x < MAP_W; x++)
    for (let y = MAP_H - h[x]; y < MAP_H; y++) tiles[y * MAP_W + x] = T_GROUND
  return tiles
}

/** Keep neighbouring columns within `step` of each other, never touching `locked` columns. */
function limitSteps(h: number[], step: number, locked: Set<number>) {
  for (let pass = 0; pass < 2; pass++) {
    for (let x = 1; x < MAP_W; x++)
      if (!locked.has(x)) h[x] = clampInt(h[x], h[x - 1] - step, h[x - 1] + step)
    for (let x = MAP_W - 2; x >= 0; x--)
      if (!locked.has(x)) h[x] = clampInt(h[x], h[x + 1] - step, h[x + 1] + step)
  }
}

function makeShelter(id: string, kind: Shelter['kind'], x: number, tw: number, th: number, h: number[]): Shelter {
  const factor = kind === 'storm_shelter' ? SHIELD_STORM_SHELTER : kind === 'habitat' ? SHIELD_HABITAT : SHIELD_HABITAT
  return { id, kind, tx: x, tw, th, ty: MAP_H - h[x] - th, shieldFactor: factor }
}

/** Generate one map. Deterministic for (seed, body). May fail the reachability check. */
function generateOnce(seed: number, body: Body): GameMap {
  const rng = mulberry32(seed)
  const step = maxStepTiles(body)
  const mirror = rng() < 0.5
  const mx = (x: number, w: number) => (mirror ? MAP_W - x - w : x) // mirror a footprint

  // 1. Heightmap: random control points, cosine-interpolated.
  const ctrl: number[] = []
  for (let i = 0; i <= Math.ceil(MAP_W / HEIGHT_CTRL_SPACING) + 1; i++)
    ctrl.push(GROUND_MIN + rng() * (GROUND_MAX - GROUND_MIN))
  const h: number[] = []
  for (let x = 0; x < MAP_W; x++) {
    const i = Math.floor(x / HEIGHT_CTRL_SPACING)
    const t = (x % HEIGHT_CTRL_SPACING) / HEIGHT_CTRL_SPACING
    const s = (1 - Math.cos(t * Math.PI)) / 2
    h.push(clampInt(ctrl[i] * (1 - s) + ctrl[i + 1] * s, GROUND_MIN, GROUND_MAX))
  }

  // 2. A crater: a smooth dip somewhere in the middle.
  const cx = 16 + Math.floor(rng() * 16)
  for (let dx = -3; dx <= 3; dx++) h[cx + dx] = Math.max(GROUND_MIN - 2, h[cx + dx] - (3 - Math.abs(dx)))

  // 3. Shelter footprints (flattened). Near habitat, far storm shelter, Mars airlock.
  const places: { id: string; kind: Shelter['kind']; x: number; tw: number; th: number }[] = []
  const habX = 9 + Math.floor(rng() * 3)
  places.push({ id: 'habitat', kind: 'habitat', x: mx(habX, 6), tw: 6, th: 4 })
  const stormX = 33 + Math.floor(rng() * 4)
  places.push({ id: 'storm', kind: 'storm_shelter', x: mx(stormX, 8), tw: 8, th: 5 })
  if (body === 'mars') places.push({ id: 'airlock', kind: 'airlock', x: mx(21, 4), tw: 4, th: 4 })

  const locked = new Set<number>()
  const spawnX = mirror ? MAP_W - 5 : 4
  for (let x = spawnX - 2; x <= spawnX + 2; x++) locked.add(x)
  for (const p of places) {
    const level = h[p.x + Math.floor(p.tw / 2)]
    for (let x = p.x; x < p.x + p.tw; x++) { h[x] = level; locked.add(x) }
  }
  const spawnLevel = h[spawnX]
  for (let x = spawnX - 2; x <= spawnX + 2; x++) h[x] = spawnLevel
  limitSteps(h, step, locked)

  const tiles = heightsToTiles(h)
  const shelters = places.map((p) => makeShelter(p.id, p.kind, p.x, p.tw, p.th, h))

  // 4. Two floating ledges, reachable by one max-height jump from the ground below.
  for (let i = 0; i < 2; i++) {
    const lx = 14 + Math.floor(rng() * 18) + i * 0
    const lw = 4
    if (shelters.some((s) => lx < s.tx + s.tw + 1 && lx + lw > s.tx - 1)) continue
    const topGround = Math.max(...h.slice(lx, lx + lw))
    const row = MAP_H - topGround - step
    if (row < 3) continue
    for (let x = lx; x < lx + lw; x++) tiles[row * MAP_W + x] = T_LEDGE
  }

  // 5. Solar pads on Mars (three tiles wide, sitting on the ground).
  const pads: GameMap['pads'] = []
  if (body === 'mars')
    for (const px of [mx(26, 3), mx(30, 3)]) pads.push({ tx: px, ty: MAP_H - h[px] - 1 })

  const spawn = { tx: spawnX, ty: MAP_H - h[spawnX] - 1 }

  // 6. Coins on reachable standing cells (picked by the seeded RNG).
  const reach = reachableCells(tiles, spawn, step)
  const cells = [...reach]
    .map((k) => k.split(',').map(Number))
    .filter(([x, y]) => !shelters.some((s) => x >= s.tx && x < s.tx + s.tw))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const coins: GameMap['coins'] = []
  const count = 3 + Math.floor(rng() * 4)
  for (let i = 0; i < count && cells.length; i++) {
    const [x, y] = cells.splice(Math.floor(rng() * cells.length), 1)[0]
    coins.push({ id: `c${i}`, tx: x, ty: y })
  }

  return { widthTiles: 48, heightTiles: 27, tiles, spawn, shelters, pads, coins, usedFallback: false }
}

/** True when the player can walk/jump from spawn to the floor of every shelter. */
export function mapIsReachable(map: GameMap, body: Body): boolean {
  if (!isStanding(map.tiles, map.spawn.tx, map.spawn.ty)) return false
  const reach = reachableCells(map.tiles, map.spawn, maxStepTiles(body))
  return map.shelters.every((s) => reach.has(`${s.tx + 1},${s.ty + s.th - 1}`))
}

/** Known-good flat layout, used if 20 seeds in a row fail. */
export function fallbackMap(body: Body): GameMap {
  const h = new Array(MAP_W).fill(6)
  const tiles = heightsToTiles(h)
  const shelters = [
    makeShelter('habitat', 'habitat', 10, 6, 4, h),
    makeShelter('storm', 'storm_shelter', 34, 8, 5, h),
  ]
  if (body === 'mars') shelters.push(makeShelter('airlock', 'airlock', 21, 4, 4, h))
  const pads = body === 'mars' ? [{ tx: 26, ty: MAP_H - 7 }, { tx: 30, ty: MAP_H - 7 }] : []
  return {
    widthTiles: 48, heightTiles: 27, tiles, spawn: { tx: 4, ty: MAP_H - 7 }, shelters, pads,
    coins: [{ id: 'c0', tx: 18, ty: MAP_H - 7 }, { id: 'c1', tx: 28, ty: MAP_H - 7 }, { id: 'c2', tx: 31, ty: MAP_H - 7 }],
    usedFallback: true,
  }
}

/** Try `seed`, then seed+1 ... up to MAX_MAP_RETRIES, then the fallback layout. */
export function generateMap(seed: number, body: Body): GameMap {
  for (let i = 0; i <= MAX_MAP_RETRIES; i++) {
    const map = generateOnce(seed + i, body)
    if (mapIsReachable(map, body)) return map
  }
  return fallbackMap(body)
}

export { SHIELD_OUTSIDE }
