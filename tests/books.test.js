import { describe, it, expect } from 'vitest'
import { BOOKS, BOOK_UNLOCK_THRESHOLDS } from '../src/data/books'

describe('BOOKS', () => {
  it('has 12 books', () => {
    expect(BOOKS).toHaveLength(12)
  })

  it('each book has required fields', () => {
    BOOKS.forEach(book => {
      expect(book).toHaveProperty('id')
      expect(book).toHaveProperty('title')
      expect(book).toHaveProperty('spineColor')
      expect(book).toHaveProperty('story')
      expect(book).toHaveProperty('puzzleWords')
      expect(book.puzzleWords.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('has unique IDs', () => {
    const ids = BOOKS.map(b => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('BOOK_UNLOCK_THRESHOLDS', () => {
  it('has 8 thresholds for books 5-12', () => {
    expect(BOOK_UNLOCK_THRESHOLDS).toHaveLength(8)
  })

  it('thresholds are in ascending order', () => {
    for (let i = 1; i < BOOK_UNLOCK_THRESHOLDS.length; i++) {
      expect(BOOK_UNLOCK_THRESHOLDS[i].hearts).toBeGreaterThan(BOOK_UNLOCK_THRESHOLDS[i - 1].hearts)
    }
  })
})
