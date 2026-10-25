/**
 * FILE PURPOSE: checks the voice line list is complete and has no duplicate clip names. Run with `npm test`.
 */
import { describe, expect, it } from 'vitest'
import { FACTS } from '../data/facts'
import { FACT_SPOKEN, VOICE_LINES, factClipId } from './lines'

describe('voice lines', () => {
  it('every fact card has a spoken version and a clip', () => {
    for (const f of FACTS) {
      expect(FACT_SPOKEN[f.id], f.id).toBeTruthy()
      expect(VOICE_LINES.some((l) => l.id === factClipId(f.id))).toBe(true)
    }
  })
  it('has a drill notice and no duplicate clip ids', () => {
    expect(VOICE_LINES.some((l) => l.id === 'drill-notice')).toBe(true)
    const ids = VOICE_LINES.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
