/** FILE PURPOSE: fetch the CURRENT space weather from NOAA. Returns null if anything goes wrong. */
import type { SpaceWeather } from '../shared/contracts'
import { parseProtonFlux, parseScales } from './noaa'

const BASE = 'https://services.swpc.noaa.gov'

export async function fetchLiveWeather(): Promise<SpaceWeather | null> {
  try {
    const [scalesRes, protonRes] = await Promise.all([
      fetch(`${BASE}/products/noaa-scales.json`, { signal: AbortSignal.timeout(8000) }),
      fetch(`${BASE}/json/goes/primary/integral-protons-1-day.json`, { signal: AbortSignal.timeout(8000) }),
    ])
    if (!scalesRes.ok) return null
    const scales = parseScales(await scalesRes.json())
    const proton = protonRes.ok ? parseProtonFlux(await protonRes.json()) : null
    if (!scales) return null // without the S-level we can't trust anything
    return {
      sLevel: scales.sLevel,
      protonFlux10MeV: proton?.flux ?? null,
      kp: null,
      observedAt: scales.observedAt,
      fetchedAt: new Date().toISOString(),
      source: 'live',
    }
  } catch {
    return null // offline, timed out, or bad JSON
  }
}
