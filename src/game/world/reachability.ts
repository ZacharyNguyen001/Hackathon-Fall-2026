/**
 * FILE PURPOSE: answers 'can the player get from spawn to every shelter?'. It does a breadth-first search (BFS): start at spawn, repeatedly visit every spot you can walk or jump to from the spots you already found, and see whether the shelters are among them.
 */
import { MAP_H, MAP_W } from '../tunables'
import { isSolid } from './tiles'

const at = (tiles: Uint8Array, x: number, y: number) =>
  x < 0 || x >= MAP_W || y >= MAP_H ? 1 : y < 0 ? 0 : tiles[y * MAP_W + x]

/** A "standing cell": empty, 2 tiles of headroom, solid underfoot. */
export function isStanding(tiles: Uint8Array, x: number, y: number): boolean {
  return !isSolid(at(tiles, x, y)) && !isSolid(at(tiles, x, y - 1)) && isSolid(at(tiles, x, y + 1))
}

/**
 * Breadth-first search from the spawn cell.
 * From a cell you may move up to 2 columns sideways, rising at most `maxStep` tiles
 * (a jump) or dropping any amount. Returns a Set of "x,y" keys that can be reached.
 */
export function reachableCells(
  tiles: Uint8Array,
  start: { tx: number; ty: number },
  maxStep: number,
): Set<string> {
  const seen = new Set<string>([`${start.tx},${start.ty}`])
  const queue = [{ x: start.tx, y: start.ty }]
  while (queue.length) {
    const cur = queue.shift()!
    for (let dx = -2; dx <= 2; dx++) {
      const nx = cur.x + dx
      if (dx === 0 || nx < 0 || nx >= MAP_W) continue
      for (let ny = cur.y - maxStep; ny < MAP_H; ny++) {
        if (ny < 0 || !isStanding(tiles, nx, ny)) continue
        const key = `${nx},${ny}`
        if (seen.has(key)) continue
        seen.add(key)
        queue.push({ x: nx, y: ny })
      }
    }
  }
  return seen
}
