/**
 * FILE PURPOSE: moving the player. Each step: apply left/right speed, jump, gravity; then move sideways and up/down SEPARATELY and push the player out of any solid tile (AABB collision = a rectangle vs the tile grid).
 */
import { MAP_H, MAP_W, PLAYER_H, PLAYER_W, RUN_SPEED_PX, TILE_PX, JUMP_VELOCITY_PX } from '../tunables'
import { isSolid } from '../world/tiles'

export interface Body2D { x: number; y: number; vx: number; vy: number; onGround: boolean } // x,y = top-left, px

function solidAt(tiles: Uint8Array, px: number, py: number): boolean {
  const tx = Math.floor(px / TILE_PX), ty = Math.floor(py / TILE_PX)
  if (tx < 0 || tx >= MAP_W) return true // invisible walls at the screen edges
  if (ty < 0) return false
  if (ty >= MAP_H) return true
  return isSolid(tiles[ty * MAP_W + tx])
}
const boxHits = (tiles: Uint8Array, x: number, y: number) =>
  solidAt(tiles, x, y) || solidAt(tiles, x + PLAYER_W - 0.01, y) ||
  solidAt(tiles, x, y + PLAYER_H - 0.01) || solidAt(tiles, x + PLAYER_W - 0.01, y + PLAYER_H - 0.01) ||
  solidAt(tiles, x, y + PLAYER_H / 2) || solidAt(tiles, x + PLAYER_W - 0.01, y + PLAYER_H / 2)

/** Move one fixed step: horizontal then vertical, resolving AABB-vs-tile collisions separately. */
export function step(b: Body2D, tiles: Uint8Array, dt: number, move: number, jump: boolean, gravity: number, windAccel = 0) {
  b.vx = move * RUN_SPEED_PX + windAccel
  if (jump && b.onGround) { b.vy = -JUMP_VELOCITY_PX; b.onGround = false }
  b.vy += gravity * dt

  let nx = b.x + b.vx * dt
  if (boxHits(tiles, nx, b.y)) { // step to the wall edge instead of through it
    nx = b.vx > 0 ? Math.floor((nx + PLAYER_W) / TILE_PX) * TILE_PX - PLAYER_W - 0.01 : (Math.floor(nx / TILE_PX) + 1) * TILE_PX
  }
  b.x = nx

  let ny = b.y + b.vy * dt
  b.onGround = false
  if (boxHits(tiles, b.x, ny)) {
    if (b.vy > 0) { ny = Math.floor((ny + PLAYER_H) / TILE_PX) * TILE_PX - PLAYER_H - 0.01; b.onGround = true }
    else ny = (Math.floor(ny / TILE_PX) + 1) * TILE_PX
    b.vy = 0
  }
  b.y = ny
}
