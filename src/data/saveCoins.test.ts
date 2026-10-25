import { describe, expect, it } from 'vitest'
import { addRound, emptyTotals, loadTotals, type Store } from './saveCoins'

function makeStore(initial: string | null = null): Store {
  let value = initial
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next },
  }
}

describe('local game totals', () => {
  it('starts with zero totals when nothing has been saved', () => {
    expect(loadTotals(makeStore())).toEqual(emptyTotals())
  })

  it('loads valid totals from browser storage', () => {
    const saved = { coins: 25, roundsPlayed: 2, roundsSurvived: 1, careerDoseMSv: 12 }
    expect(loadTotals(makeStore(JSON.stringify(saved)))).toEqual(saved)
  })

  it('adds round rewards and stores the updated totals', () => {
    const store = makeStore()
    const saved = addRound(store, { coins: 20, survived: true, doseMSv: 3 })

    expect(saved).toEqual({ coins: 20, roundsPlayed: 1, roundsSurvived: 1, careerDoseMSv: 3 })
    expect(loadTotals(store)).toEqual(saved)
  })

  it('continues updating the in-memory total if browser storage is unavailable', () => {
    expect(addRound(null, { coins: 10, survived: false, doseMSv: 2 }, emptyTotals()))
      .toEqual({ coins: 10, roundsPlayed: 1, roundsSurvived: 0, careerDoseMSv: 2 })
  })
})