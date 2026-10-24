/** Handoff types shared by the game, UI and (later) audio/data code. */
export type Body = 'moon' | 'mars'
export type DisasterKind = 'solar_storm' | 'dust_storm' | 'co2_leak' | 'blackout'
export type Phase = 'INTERMISSION' | 'EXPLORE' | 'WARNING' | 'DISASTER' | 'RESULTS'

export interface SpaceWeather {
  sLevel: 0 | 1 | 2 | 3 | 4 | 5
  protonFlux10MeV: number | null
  kp: number | null
  observedAt: string
  fetchedAt: string
  source: 'live' | 'sample'
}

export interface RoundPlan {
  roundId: string
  roundNumber: number
  body: Body
  disaster: DisasterKind
  level: number
  isDrill: boolean
  seed: number
}

export interface Shelter {
  id: string
  tx: number
  ty: number
  tw: number
  th: number
  kind: 'habitat' | 'storm_shelter' | 'airlock'
  shieldFactor: number
}

export interface GameMap {
  widthTiles: 48
  heightTiles: 27
  tiles: Uint8Array
  spawn: { tx: number; ty: number }
  shelters: Shelter[]
  pads: { tx: number; ty: number }[]
  coins: { id: string; tx: number; ty: number }[]
  usedFallback: boolean
}

export interface RoundReport {
  roundId: string
  body: Body
  disaster: DisasterKind
  level: number
  isDrill: boolean
  survived: boolean
  secondsAlive: number
  doseMSv: number
  pickups: number
}
