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

export const drillNoticeLine = 'This is a drill. The real sun is quiet right now.'

/**
 * The 7 fact cards, written for speech (units spelled out so the voice reads them well). Same claims as src/data/facts.ts,
 * keyed by the fact id. NOTE: no import from facts.ts here, because the bake script runs this file directly in Node.
 * src/audio/lines.test.ts checks every fact has a spoken version.
 */
export const FACT_SPOKEN: Record<string, string> = {
  'spe-limit': 'The crew design limit for a single solar particle event is under 250 millisieverts.',
  'career': 'NASA has proposed a career radiation limit of under 600 millisieverts. It is a proposal, not yet adopted.',
  'shield': 'Aluminum or polyethylene shielding cuts solar particle event dose by about 50 percent, but galactic cosmic rays by only about 7 percent.',
  'water': 'Storm shelters with about 10 to 20 centimeters of water-equivalent shielding are the answer to solar particle events.',
  'sscale': 'NOAA S1 begins at 10 particle flux units of 10 mega-electron-volt protons, and each level is 10 times higher. At S3 and above, EVA astronauts should avoid exposure.',
  'rad-surface': 'Curiosity measured about 0.67 millisieverts per day on the Martian surface and about 1.8 millisieverts per day in cruise.',
  'artemis-turn': 'On Artemis I, rotating the spacecraft 90 degrees cut the Van Allen belt dose rate about in half.',
}
export const factClipId = (factId: string) => `fact-${factId}`

/** Every clip the bake script makes. id = mp3 file name (without .mp3). */
export function warningClipId(plan: { level: number; isDrill: boolean }) {
  return `solar-warning-s${plan.level}-${plan.isDrill ? 'drill' : 'live'}`
}
export const VOICE_LINES: { id: string; text: string }[] = [
  ...[1, 2, 3, 4, 5].flatMap((level) =>
    [true, false].map((isDrill) => ({ id: warningClipId({ level, isDrill }), text: warningLine({ level, isDrill }) })),
  ),
  { id: 'evac', text: evacLine },
  { id: 'all-clear', text: allClearLine },
  { id: 'drill-notice', text: drillNoticeLine },
  ...Object.entries(FACT_SPOKEN).map(([factId, text]) => ({ id: factClipId(factId), text })),
]