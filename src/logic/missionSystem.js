import { BOOKS, BOOK_UNLOCK_THRESHOLDS } from '../data/books'
import { NPCS } from '../data/npcs'

export function assignDelivery(save) {
  if (save.activeMission) return null

  const availableNpcs = NPCS.filter(n => save.unlockedNpcs.includes(n.id) && n.id !== 'mystery-hut')
  if (availableNpcs.length === 0) return null

  const availableBooks = BOOKS.filter(b =>
    save.unlockedBooks.includes(b.id) && (!save.borrowedBook || save.borrowedBook.id !== b.id)
  )
  if (availableBooks.length === 0) return null

  const npc = availableNpcs[Math.floor(Math.random() * availableNpcs.length)]
  const book = availableBooks[Math.floor(Math.random() * availableBooks.length)]

  return {
    mission: { type: 'deliver', bookId: book.id, targetNpcId: npc.id, targetNpcName: npc.name },
    book: { id: book.id, title: book.title },
  }
}

export function generateNpcRequest(save, npcId) {
  if (save.activeMission) return null
  if (save.borrowedBook) return null

  const availableBooks = BOOKS.filter(b => save.unlockedBooks.includes(b.id))
  if (availableBooks.length === 0) return null

  const book = availableBooks[Math.floor(Math.random() * availableBooks.length)]
  const npc = NPCS.find(n => n.id === npcId)
  if (!npc) return null

  return {
    mission: { type: 'fetch', bookId: book.id, bookTopic: book.title, requestingNpcId: npcId, requestingNpcName: npc.name },
    bookTopic: book.title,
  }
}

export function completeDelivery(save) {
  return {
    ...save,
    activeMission: null,
    borrowedBook: null,
    totalHearts: save.totalHearts + 3,
    dailyHeartsEarned: save.dailyHeartsEarned + 3,
    completedDeliveries: save.completedDeliveries + 1,
  }
}

export function checkBookUnlocks(save) {
  return BOOK_UNLOCK_THRESHOLDS
    .filter(t => save.totalHearts >= t.hearts && !save.unlockedBooks.includes(t.bookId))
    .map(t => t.bookId)
}
