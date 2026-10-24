/**
 * FILE PURPOSE: the exact sentences the mission-control voice and captions say (warning, evac, all-clear). Later the bake script uses these same sentences to make ElevenLabs audio files.
 */
import type { RoundPlan } from '../shared/contracts'

/** Text for the mission-control voice and the on-screen caption (whitelisted templates). */
export function warningLine(plan: Pick<RoundPlan, 'level' | 'isDrill'>): string {
  const drill = plan.isDrill ? ' This is a drill.' : ''
  return `Warning. Solar radiation storm, level S${plan.level}.${drill} Get to a storm shelter now.`
}
export const evacLine = 'Crew member evacuated. Radiation limit exceeded.'
export const allClearLine = 'All clear. Radiation levels are falling.'
