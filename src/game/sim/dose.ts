/**
 * FILE PURPOSE: the radiation math. `ramp` is how strong the storm is over time (ramps up, holds, eases). `doseRate` = peak rate x ramp x shield factor (outside 1.0, habitat 0.5, storm shelter 0.1). `isEvac` is true at 250 mSv.
 */
import { DOSE_SCALE, EASE_S, HOLD_S, PEAK_RATE_MSV_PER_S, RAMP_UP_S, SPE_LIMIT_MSV } from '../tunables'

/** Storm intensity 0..1 at `t` seconds into the disaster: ramps up, holds, eases. */
export function ramp(t: number): number {
  if (t <= 0) return 0
  if (t < RAMP_UP_S) return t / RAMP_UP_S
  if (t < RAMP_UP_S + HOLD_S) return 1
  return Math.max(0, 1 - (t - RAMP_UP_S - HOLD_S) / EASE_S)
}

/** mSv per game-second = PEAK_RATE[level] x DOSE_SCALE x ramp(t) x shieldFactor. */
export function doseRate(level: number, t: number, shieldFactor: number): number {
  return (PEAK_RATE_MSV_PER_S[level] ?? 0) * DOSE_SCALE * ramp(t) * shieldFactor
}

export const isEvac = (doseMSv: number) => doseMSv >= SPE_LIMIT_MSV
