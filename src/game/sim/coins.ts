/**
 * FILE PURPOSE: how many coins a round is worth: +1 per second alive during warning+disaster, +10 for surviving, +5 per pickup, with caps. A pure function so it is easy to test.
 */
import { DISASTER_S, MAX_PICKUPS_PER_MAP, PICKUP_COINS, SURVIVAL_BONUS, WARNING_S } from '../tunables'

/** +1 per second alive in WARNING+DISASTER, +10 if survived, +5 per pickup (capped). */
export function computeCoins(r: { survived: boolean; secondsAlive: number; pickups: number }): number {
  const seconds = Math.floor(Math.min(Math.max(r.secondsAlive, 0), WARNING_S + DISASTER_S))
  const pickups = Math.min(Math.max(r.pickups, 0), MAX_PICKUPS_PER_MAP)
  return (r.survived ? SURVIVAL_BONUS : 0) + seconds + PICKUP_COINS * pickups
}
