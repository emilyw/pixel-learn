import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkDailyReset, getQuestTarget, addDailyHearts, incrementQuestProgress } from '../src/logic/sessionManager'
import { DEFAULT_SAVE } from '../src/logic/saveSystem'

describe('checkDailyReset', () => {
  it('resets daily fields when date has changed', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', dailyHeartsEarned: 8, dailyQuestProgress: 2 }
    const result = checkDailyReset(save, '2026-01-02')
    expect(result.dailyHeartsEarned).toBe(0)
    expect(result.dailyQuestProgress).toBe(0)
    expect(result.dailyDate).toBe('2026-01-02')
  })

  it('does not reset when date matches', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', dailyHeartsEarned: 5 }
    expect(checkDailyReset(save, '2026-01-01').dailyHeartsEarned).toBe(5)
  })
})

describe('getQuestTarget', () => {
  it('returns 2 for beginner', () => expect(getQuestTarget('beginner')).toBe(2))
  it('returns 3 for intermediate', () => expect(getQuestTarget('intermediate')).toBe(3))
  it('returns 4 for advanced', () => expect(getQuestTarget('advanced')).toBe(4))
})

describe('addDailyHearts', () => {
  it('adds hearts to daily and total', () => {
    const save = { ...DEFAULT_SAVE, dailyHeartsEarned: 3, totalHearts: 10 }
    const result = addDailyHearts(save, 2)
    expect(result.dailyHeartsEarned).toBe(5)
    expect(result.totalHearts).toBe(12)
  })
})

describe('incrementQuestProgress', () => {
  it('increments quest progress', () => {
    const save = { ...DEFAULT_SAVE, dailyQuestProgress: 1 }
    expect(incrementQuestProgress(save).dailyQuestProgress).toBe(2)
  })
})
