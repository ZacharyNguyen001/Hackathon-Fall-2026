/**
 * FILE PURPOSE: every number that tunes the game, in one place. Each is tagged GAME VALUE (we chose it for fun) or REAL: source (a real figure).
 * If you want the game easier or harder, change it here. No other file should hide magic numbers.
 */
/**
 * Every game number lives here. Each is tagged:
 *   GAME VALUE  = tuned for fun, not real
 *   REAL: <src> = a real figure (source in docs/DATA_SOURCES.md)
 */

// ---- Screen ----
export const TILE_PX = 8 // GAME VALUE
export const MAP_W = 48 // GAME VALUE (tiles)
export const MAP_H = 27 // GAME VALUE (tiles)
export const LOGICAL_W = MAP_W * TILE_PX // 384
export const LOGICAL_H = MAP_H * TILE_PX // 216

// ---- Round timing (seconds) ----
export const INTERMISSION_S = 8 // GAME VALUE
export const EXPLORE_S = 20 // GAME VALUE
export const WARNING_S = 12 // GAME VALUE (NOT a real flare-to-arrival time)
export const DISASTER_S = 40 // GAME VALUE
export const RESULTS_S = 8 // GAME VALUE

// ---- Physics ----
export const MOON_G_REAL = 1.62 // REAL: general knowledge (m/s^2)
export const MARS_G_REAL = 3.71 // REAL: general knowledge (m/s^2)
export const BASE_G_PX = 600 // GAME VALUE (px/s^2 on Mars; Moon keeps the real ratio)
export const JUMP_VELOCITY_PX = 175 // GAME VALUE
export const RUN_SPEED_PX = 70 // GAME VALUE
export const STEP_SAFETY = 0.8 // GAME VALUE (map steps use 80% of jump height)
export const PLAYER_W = 5 // GAME VALUE (px)
export const PLAYER_H = 10 // GAME VALUE (px)

// ---- Solar storm ----
export const RAMP_UP_S = 8 // GAME VALUE
export const HOLD_S = 20 // GAME VALUE
export const EASE_S = 12 // GAME VALUE (8 + 20 + 12 = DISASTER_S)
export const PEAK_RATE_MSV_PER_S: Record<number, number> = { 1: 2, 2: 4, 3: 7, 4: 11, 5: 16 } // GAME VALUE
export const DOSE_SCALE = 1.5 // GAME VALUE (so S3 outside is EVAC'D)
export const SHIELD_OUTSIDE = 1.0 // GAME VALUE
export const SHIELD_HABITAT = 0.5 // REAL: Al/polyethylene cuts SPE dose ~50% (NASA OCHMO)
export const SHIELD_STORM_SHELTER = 0.1 // GAME VALUE (real: 10-20 cm water-equivalent, no single factor)
export const SPE_LIMIT_MSV = 250 // REAL: crew design limit for a single SPE (< 250 mSv)
export const CAREER_LIMIT_MSV = 600 // REAL, PROPOSED (NASEM 2021) - always say "proposed"
export const DRILL_LEVELS = [2, 3, 4, 5] // GAME VALUE
export const GEIGER_BASE_HZ = 1 // GAME VALUE
export const GEIGER_MAX_HZ = 25 // GAME VALUE

// ---- Coins ----
export const SURVIVAL_BONUS = 10 // GAME VALUE
export const PICKUP_COINS = 5 // GAME VALUE
export const MAX_PICKUPS_PER_MAP = 6 // GAME VALUE
export const COIN_RADIUS_PX = 5 // GAME VALUE

// ---- Map generation ----
export const HEIGHT_CTRL_SPACING = 6 // GAME VALUE (columns between height control points)
export const GROUND_MIN = 4 // GAME VALUE (tiles above bottom)
export const GROUND_MAX = 9 // GAME VALUE
export const MAX_MAP_RETRIES = 20 // GAME VALUE
