/**
 * FILE PURPOSE: decides what the next round is: Mars or Moon (they alternate), and the storm level. If NOAA says the real sun is quiet (S0) the round is ALWAYS labeled a DRILL; only a real S1+ reading is called LIVE.
 */
import type { Body, RoundPlan, SpaceWeather } from '../../shared/contracts'
import { DRILL_LEVELS } from '../tunables'
import { seedFor } from '../world/rng'

/**
 * Pick the body, level and live/drill flag for a round.
 * Live storm only if NOAA says S>=1; otherwise it is ALWAYS a drill (never shown as live).
 * Slice 1: solar storm only. Round 1 = Mars, then alternate.
 */
export function planRound(roundNumber: number, weather: SpaceWeather, seedOverride?: number): RoundPlan {
  const body: Body = roundNumber % 2 === 1 ? 'mars' : 'moon'
  const isDrill = weather.sLevel < 1
  const level = isDrill ? DRILL_LEVELS[(roundNumber - 1) % DRILL_LEVELS.length] // S2 -> S3 -> S4 -> S5 -> S2 ... : weather.sLevel
  return {
    roundId: `r${roundNumber}-${weather.observedAt}`,
    roundNumber,
    body,
    disaster: 'solar_storm',
    level,
    isDrill,
    seed: seedOverride ?? seedFor(weather.observedAt, roundNumber, body),
  }
}
