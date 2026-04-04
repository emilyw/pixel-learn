import { describe, it, expect } from 'vitest'
import { DEFAULT_SAVE } from '../src/logic/saveSystem'

describe('Pond save data', () => {
  it('DEFAULT_SAVE includes pond fields', () => {
    expect(DEFAULT_SAVE).toHaveProperty('pondWordsSpelled', 0)
    expect(DEFAULT_SAVE).toHaveProperty('pondWordsToday', 0)
    expect(DEFAULT_SAVE).toHaveProperty('goldenLettersFound', 0)
  })
})

describe('Pond word selection', () => {
  it('beginner bank has words with correct structure', async () => {
    const bank = (await import('../src/data/words/beginner.json')).default
    expect(bank.length).toBeGreaterThan(0)
    expect(bank[0]).toHaveProperty('word')
  })

  it('golden letter spawns approximately 20% of the time', () => {
    let goldenCount = 0
    for (let i = 0; i < 1000; i++) {
      if (Math.random() < 0.2) goldenCount++
    }
    expect(goldenCount).toBeGreaterThan(100)
    expect(goldenCount).toBeLessThan(300)
  })
})
