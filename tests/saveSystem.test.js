import { describe, it, expect, beforeEach } from 'vitest'
import { loadSave, writeSave, exportCode, importCode, DEFAULT_SAVE } from '../src/logic/saveSystem'

beforeEach(() => localStorage.clear())

describe('loadSave', () => {
  it('returns DEFAULT_SAVE when nothing stored', () => {
    expect(loadSave()).toEqual(DEFAULT_SAVE)
  })

  it('returns stored save when present', () => {
    const save = { ...DEFAULT_SAVE, totalHearts: 5 }
    localStorage.setItem('pixellearn_save', JSON.stringify(save))
    expect(loadSave().totalHearts).toBe(5)
  })
})

describe('writeSave', () => {
  it('persists save to localStorage', () => {
    const save = { ...DEFAULT_SAVE, totalHearts: 3 }
    writeSave(save)
    expect(JSON.parse(localStorage.getItem('pixellearn_save')).totalHearts).toBe(3)
  })
})

describe('exportCode / importCode', () => {
  it('round-trips save data', () => {
    const save = { ...DEFAULT_SAVE, totalHearts: 42 }
    const code = exportCode(save)
    expect(importCode(code).totalHearts).toBe(42)
  })

  it('returns null for invalid code', () => {
    expect(importCode('not-valid-base64!!!')).toBeNull()
  })
})
