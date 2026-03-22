import { describe, it, expect } from 'vitest'
import { selectWord } from '../src/logic/wordSelector'

const bank = [
  { word: 'cat', emoji: '🐱', npcIds: ['ripple', 'blaze'], distractors: ['bat', 'hat'] },
  { word: 'dog', emoji: '🐶', npcIds: ['ripple'],          distractors: ['fog', 'log'] },
  { word: 'fish', emoji: '🐟', npcIds: ['ripple'],         distractors: ['dish', 'wish'] },
  { word: 'bird', emoji: '🐦', npcIds: ['ripple'],         distractors: ['word', 'herd'] },
]

describe('selectWord', () => {
  it('only selects words matching the npcId', () => {
    const word = selectWord(bank, 'blaze', [])
    expect(word.word).toBe('cat')
  })

  it('excludes recently shown words', () => {
    const word = selectWord(bank, 'ripple', ['cat', 'dog', 'fish'])
    expect(word.word).toBe('bird')
  })

  it('relaxes exclusion when list is too small', () => {
    const word = selectWord(bank, 'blaze', ['cat', 'cat', 'cat'])
    expect(word.word).toBe('cat')
  })

  it('returns null when no words exist for npcId', () => {
    expect(selectWord(bank, 'unknown-npc', [])).toBeNull()
  })
})
