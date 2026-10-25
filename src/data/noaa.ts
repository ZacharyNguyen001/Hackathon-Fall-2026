/**
 * FILE PURPOSE: reads NOAA's JSON safely. NOAA sometimes sends missing or odd values, so each parser returns null instead of crashing when the data looks wrong.
 */
import type { SpaceWeather } from '../shared/contracts'

/** Parse noaa-scales.json. Returns S-level + time, or null if the shape is wrong. */
export function parseScales(raw: unknown): { sLevel: SpaceWeather['sLevel']; observedAt: string } | null {
  const cur = (raw as any)?.['0']
  const s = Number(cur?.S?.Scale) // NOAA sends the scale as a string ("0")
  if (!cur || !Number.isInteger(s) || s < 0 || s > 5 || !cur.DateStamp || !cur.TimeStamp) return null
  return { sLevel: s as SpaceWeather['sLevel'], observedAt: `${cur.DateStamp}T${cur.TimeStamp}Z` }
}

/** Newest ">=10 MeV" proton flux (pfu) from integral-protons-*.json, or null. */
export function parseProtonFlux(raw: unknown): { flux: number; time: string } | null {
  if (!Array.isArray(raw)) return null
  let best: { flux: number; time: string } | null = null
  for (const r of raw) {
    if (r?.energy !== '>=10 MeV' || typeof r.flux !== 'number' || typeof r.time_tag !== 'string') continue
    if (!best || r.time_tag > best.time) best = { flux: r.flux, time: r.time_tag }
  }
  return best
}
