/**
 * FILE PURPOSE: Moon vs Mars physics. Gravity keeps the REAL ratio between the two (1.62 vs 3.71) but is scaled for fun. From gravity we work out how many tiles high a jump reaches, so the map generator never builds a step the player can't climb.
 */
import { BASE_G_PX, JUMP_VELOCITY_PX, MARS_G_REAL, MOON_G_REAL, STEP_SAFETY, TILE_PX } from '../tunables'
import type { Body } from '../../shared/contracts'

/** Game gravity keeps the REAL Moon/Mars ratio; the absolute value is scaled for fun. */
export function gameGravity(body: Body): number {
  return body === 'mars' ? BASE_G_PX : BASE_G_PX * (MOON_G_REAL / MARS_G_REAL)
}

/** How many tiles high one jump reaches: v^2 / (2g) / tile size. */
export function jumpTiles(body: Body): number {
  const g = gameGravity(body)
  return (JUMP_VELOCITY_PX * JUMP_VELOCITY_PX) / (2 * g) / TILE_PX
}

/** Biggest step up the map generator may create (so every shelter stays reachable). */
export function maxStepTiles(body: Body): number {
  return Math.max(1, Math.floor(jumpTiles(body) * STEP_SAFETY))
}
