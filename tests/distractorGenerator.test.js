import { describe, it, expect } from 'vitest'
import { generateIntermediateOptions } from '../src/logic/distractorGenerator'

describe('generateIntermediateOptions', () => {
  it('returns 3 options including the correct letter', () => {
    const options = generateIntermediateOptions('cat', 1)
    expect(options).toHaveLength(3)
    expect(options).toContain('a')
  })

  it('returns unique options', () => {
    const options = generateIntermediateOptions('cat', 1)
    expect(new Set(options).size).toBe(3)
  })
})
