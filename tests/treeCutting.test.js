import { describe, it, expect } from 'vitest'
import { DEFAULT_SAVE } from '../src/logic/saveSystem'
import { checkDailyReset } from '../src/logic/sessionManager'

describe('Tree cutting save data', () => {
  it('DEFAULT_SAVE includes tree cutting fields', () => {
    expect(DEFAULT_SAVE).toHaveProperty('treesChopped', 0)
    expect(DEFAULT_SAVE).toHaveProperty('treesChoppedToday', 0)
  })

  it('checkDailyReset resets treesChoppedToday', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', treesChoppedToday: 5 }
    const reset = checkDailyReset(save, '2026-01-02')
    expect(reset.treesChoppedToday).toBe(0)
  })

  it('checkDailyReset preserves treesChoppedToday on same day', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', treesChoppedToday: 5 }
    const reset = checkDailyReset(save, '2026-01-01')
    expect(reset.treesChoppedToday).toBe(5)
  })
})
