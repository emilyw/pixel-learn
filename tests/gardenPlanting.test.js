import { describe, it, expect } from 'vitest'
import { DEFAULT_SAVE } from '../src/logic/saveSystem'
import { checkDailyReset } from '../src/logic/sessionManager'

describe('Garden planting save data', () => {
  it('DEFAULT_SAVE includes garden planting fields', () => {
    expect(DEFAULT_SAVE).toHaveProperty('plantsGrown', 0)
    expect(DEFAULT_SAVE).toHaveProperty('plantsGrownToday', 0)
  })

  it('checkDailyReset resets plantsGrownToday', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', plantsGrownToday: 5 }
    const reset = checkDailyReset(save, '2026-01-02')
    expect(reset.plantsGrownToday).toBe(0)
  })

  it('checkDailyReset preserves plantsGrownToday on same day', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', plantsGrownToday: 5 }
    const reset = checkDailyReset(save, '2026-01-01')
    expect(reset.plantsGrownToday).toBe(5)
  })
})
