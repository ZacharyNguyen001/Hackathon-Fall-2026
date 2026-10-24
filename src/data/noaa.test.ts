/**
 * FILE PURPOSE: automatic checks that the NOAA parsers read the saved real data and survive bad input. Run with `npm test`.
 */
import { describe, expect, it } from 'vitest'
import { parseProtonFlux, parseScales } from './noaa'
import { sampleWeather } from './sampleWeather'

describe('noaa parsers', () => {
  it('parses the real saved samples', () => {
    const w = sampleWeather()
    expect(w.sLevel).toBe(0); expect(w.protonFlux10MeV).toBeGreaterThan(0); expect(w.source).toBe('sample')
  })
  it('handles string scales and malformed input', () => {
    expect(parseScales({ '0': { DateStamp: 'd', TimeStamp: 't', S: { Scale: '3' } } })?.sLevel).toBe(3)
    for (const bad of [null, {}, [], 'x', { '0': { S: { Scale: null } } }, { '0': { DateStamp: 'd', TimeStamp: 't', S: { Scale: '9' } } }])
      expect(parseScales(bad)).toBeNull()
    for (const bad of [null, {}, [], [{ energy: '>=10 MeV', flux: 'x' }], [{ energy: '>=1 MeV', flux: 1, time_tag: 't' }]])
      expect(parseProtonFlux(bad)).toBeNull()
  })
})
