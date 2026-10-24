import type { Phase } from '../../shared/contracts'
import { DISASTER_S, EXPLORE_S, INTERMISSION_S, RESULTS_S, WARNING_S } from '../tunables'

const ORDER: Phase[] = ['INTERMISSION', 'EXPLORE', 'WARNING', 'DISASTER', 'RESULTS']
const LENGTH: Record<Phase, number> = {
  INTERMISSION: INTERMISSION_S, EXPLORE: EXPLORE_S, WARNING: WARNING_S, DISASTER: DISASTER_S, RESULTS: RESULTS_S,
}

/** Pure timer: call tick(dt) with simulation seconds; it reports phase changes. */
export class RoundMachine {
  phase: Phase = 'INTERMISSION'
  elapsed = 0 // seconds spent in the current phase
  constructor(private speed = 1) {}

  /** Returns the new phase if one just started, else null. */
  tick(dt: number): Phase | null {
    this.elapsed += dt * this.speed
    if (this.elapsed < LENGTH[this.phase]) return null
    this.elapsed -= LENGTH[this.phase]
    this.phase = ORDER[(ORDER.indexOf(this.phase) + 1) % ORDER.length]
    return this.phase
  }
  get remaining() { return LENGTH[this.phase] - this.elapsed }
}
