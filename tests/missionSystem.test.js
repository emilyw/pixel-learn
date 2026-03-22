import { describe, it, expect } from 'vitest'
import { assignDelivery, generateNpcRequest, completeDelivery, checkBookUnlocks } from '../src/logic/missionSystem'
import { DEFAULT_SAVE } from '../src/logic/saveSystem'

describe('assignDelivery', () => {
  it('returns a mission with a book and target NPC', () => {
    const save = { ...DEFAULT_SAVE, totalHearts: 5 }
    const result = assignDelivery(save)
    expect(result).not.toBeNull()
    expect(result.mission).toHaveProperty('type', 'deliver')
    expect(result.mission).toHaveProperty('bookId')
    expect(result.mission).toHaveProperty('targetNpcId')
    expect(result.mission).toHaveProperty('targetNpcName')
    expect(result.book).toHaveProperty('id')
    expect(result.book).toHaveProperty('title')
  })

  it('returns null when activeMission already set', () => {
    const save = { ...DEFAULT_SAVE, activeMission: { type: 'deliver', bookId: 1, targetNpcId: 'blaze', targetNpcName: 'Blaze' } }
    expect(assignDelivery(save)).toBeNull()
  })

  it('picks from unlocked NPCs only', () => {
    const save = { ...DEFAULT_SAVE }
    const result = assignDelivery(save)
    expect(save.unlockedNpcs).toContain(result.mission.targetNpcId)
  })
})

describe('generateNpcRequest', () => {
  it('returns a fetch mission for the requesting NPC', () => {
    const save = { ...DEFAULT_SAVE }
    const result = generateNpcRequest(save, 'blaze')
    expect(result).not.toBeNull()
    expect(result.mission.type).toBe('fetch')
    expect(result.mission.requestingNpcId).toBe('blaze')
    expect(result).toHaveProperty('bookTopic')
  })

  it('returns null when activeMission already set', () => {
    const save = { ...DEFAULT_SAVE, activeMission: { type: 'deliver' } }
    expect(generateNpcRequest(save, 'blaze')).toBeNull()
  })

  it('returns null when already borrowing a book', () => {
    const save = { ...DEFAULT_SAVE, borrowedBook: { id: 1, title: 'Test' } }
    expect(generateNpcRequest(save, 'blaze')).toBeNull()
  })
})

describe('completeDelivery', () => {
  it('clears mission, adds 3 hearts, increments deliveries', () => {
    const save = {
      ...DEFAULT_SAVE,
      activeMission: { type: 'deliver', bookId: 1 },
      borrowedBook: { id: 1, title: 'Test' },
      totalHearts: 5,
      completedDeliveries: 0,
    }
    const result = completeDelivery(save)
    expect(result.activeMission).toBeNull()
    expect(result.borrowedBook).toBeNull()
    expect(result.totalHearts).toBe(8)
    expect(result.completedDeliveries).toBe(1)
  })
})

describe('checkBookUnlocks', () => {
  it('returns empty when no new unlocks', () => {
    const save = { ...DEFAULT_SAVE, totalHearts: 0 }
    expect(checkBookUnlocks(save)).toEqual([])
  })

  it('returns newly unlockable book IDs', () => {
    const save = { ...DEFAULT_SAVE, totalHearts: 20, unlockedBooks: [1, 2, 3, 4] }
    const unlocks = checkBookUnlocks(save)
    expect(unlocks).toContain(5)
    expect(unlocks).toContain(6)
    expect(unlocks).not.toContain(7)
  })
})
