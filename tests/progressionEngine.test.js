import { describe, it, expect } from 'vitest'
import { getNewUnlocks, UNLOCK_THRESHOLDS } from '../src/logic/progressionEngine'

describe('getNewUnlocks', () => {
  it('returns empty array when no new thresholds crossed', () => {
    const save = { totalHearts: 5, firedThresholds: [] }
    expect(getNewUnlocks(save)).toEqual([])
  })

  it('returns Coach Roar unlock at 10 hearts', () => {
    const save = { totalHearts: 10, firedThresholds: [] }
    const unlocks = getNewUnlocks(save)
    expect(unlocks).toHaveLength(1)
    expect(unlocks[0].npcId).toBe('coach-roar')
  })

  it('returns multiple unlocks when jumping over thresholds', () => {
    const save = { totalHearts: 36, firedThresholds: [] }
    const unlocks = getNewUnlocks(save)
    expect(unlocks.map(u => u.npcId)).toEqual(['coach-roar', 'mossy', 'clover'])
  })

  it('skips already-fired thresholds', () => {
    const save = { totalHearts: 25, firedThresholds: [10, 20] }
    expect(getNewUnlocks(save)).toEqual([])
  })
})
