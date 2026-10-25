/** FILE PURPOSE: remember total coins and total radiation dose between visits, using the browser's localStorage. */
export interface Totals { coins: number; roundsPlayed: number; roundsSurvived: number; careerDoseMSv: number }

/** The tiny part of localStorage we use. Tests can pass a fake one. */
export interface Store { getItem(key: string): string | null; setItem(key: string, value: string): void }

const KEY = 'storm-shelter:v1'
export const emptyTotals = (): Totals => ({ coins: 0, roundsPlayed: 0, roundsSurvived: 0, careerDoseMSv: 0 })

const isGoodNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0

export function loadTotals(store: Store | null): Totals {
  if (!store) return emptyTotals()
  try {
    const raw = store.getItem(KEY)
    if (!raw) return emptyTotals()
    const t = JSON.parse(raw)
    // Never trust saved data: if anything looks wrong, start fresh.
    if (isGoodNumber(t.coins) && isGoodNumber(t.roundsPlayed) && isGoodNumber(t.roundsSurvived) && isGoodNumber(t.careerDoseMSv)) return t
    console.warn('Saved game totals were invalid; starting with zero.')
    return emptyTotals()
  } catch (error) {
    console.warn('Could not read saved game totals; starting with zero.', error)
    return emptyTotals() // storage blocked or JSON broken
  }
}

export function addRound(
  store: Store | null,
  round: { coins: number; survived: boolean; doseMSv: number },
  currentTotals: Totals = loadTotals(store),
): Totals {
  const next: Totals = {
    coins: currentTotals.coins + Math.max(0, round.coins),
    roundsPlayed: currentTotals.roundsPlayed + 1,
    roundsSurvived: currentTotals.roundsSurvived + (round.survived ? 1 : 0),
    careerDoseMSv: currentTotals.careerDoseMSv + Math.max(0, round.doseMSv),
  }
  if (store) {
    try {
      store.setItem(KEY, JSON.stringify(next))
    } catch (error) {
      console.warn('Could not save game totals in this browser.', error)
    }
  }
  return next
}