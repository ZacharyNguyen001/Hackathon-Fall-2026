/**
 * FILE PURPOSE: builds a SpaceWeather reading from the REAL NOAA responses we saved in src/data/noaa-sample/. It is the offline fallback and is always labeled 'sample' in the HUD.
 */
import type { SpaceWeather } from '../shared/contracts'
import scales from './noaa-sample/noaa-scales.json'
import protons from './noaa-sample/integral-protons-10mev.json'
import { parseProtonFlux, parseScales } from './noaa'

/** Real NOAA responses saved during the hackathon: the offline fallback. */
export function sampleWeather(): SpaceWeather {
  const s = parseScales(scales)
  const p = parseProtonFlux(protons)
  return {
    sLevel: s?.sLevel ?? 0,
    protonFlux10MeV: p?.flux ?? null,
    kp: null,
    observedAt: s?.observedAt ?? '2026-10-24T16:06:00Z',
    fetchedAt: s?.observedAt ?? '2026-10-24T16:06:00Z',
    source: 'sample',
  }
}
