import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import { loadSave, writeSave } from '../../../logic/saveSystem'
import { assignDelivery } from '../../../logic/missionSystem'
import { BOOKS } from '../../../data/books'
import styles from './BookBrowser.module.css'

export function BookBrowser() {
  const [view, setView] = useState(null) // null | 'shelf' | 'librarian'
  const [shelfSide, setShelfSide] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onShelf = ({ side }) => {
      setShelfSide(side)
      setView('shelf')
      setMessage('')
    }
    const onLibrarian = () => {
      setView('librarian')
      setMessage('')
    }
    EventBus.on('shelf-click', onShelf)
    EventBus.on('librarian-interact', onLibrarian)
    return () => {
      EventBus.off('shelf-click', onShelf)
      EventBus.off('librarian-interact', onLibrarian)
    }
  }, [])

  function handleClose() {
    setView(null)
    EventBus.emit('task-close')
  }

  function handleBorrow(book) {
    const save = loadSave()
    if (save.borrowedBook) {
      setMessage('You already have a book!')
      return
    }
    const updated = { ...save, borrowedBook: { id: book.id, title: book.title } }
    writeSave(updated)
    EventBus.emit('borrow-book', { bookId: book.id, title: book.title })
    EventBus.emit('save-updated')
    setMessage(`Borrowed "${book.title}"!`)
  }

  function handleReturn() {
    const save = loadSave()
    if (!save.borrowedBook) return
    const updated = { ...save, borrowedBook: null }
    writeSave(updated)
    EventBus.emit('return-book', { bookId: save.borrowedBook.id })
    EventBus.emit('save-updated')
    setMessage('Book returned!')
  }

  function handleDelivery() {
    const save = loadSave()
    const result = assignDelivery(save)
    if (!result) {
      setMessage(save.activeMission ? 'You already have a delivery!' : 'No deliveries right now.')
      return
    }
    const updated = {
      ...save,
      borrowedBook: result.book,
      activeMission: result.mission,
    }
    writeSave(updated)
    EventBus.emit('save-updated')
    EventBus.emit('mission-start', { mission: result.mission })
    setMessage(`Deliver "${result.book.title}" to ${result.mission.targetNpcName}!`)
  }

  function handleRead(book) {
    EventBus.emit('read-book', { bookId: book.id })
    setView(null)
  }

  if (!view) return null

  const save = loadSave()

  if (view === 'librarian') {
    return (
      <div className={styles.overlay}>
        <div className={styles.panel}>
          <div className={styles.title}>Librarian</div>
          <button className={styles.menuBtn} disabled={!!save.borrowedBook} onClick={() => { setView('shelf'); setShelfSide('left') }}>
            Browse Books
          </button>
          <button className={styles.menuBtn} disabled={!save.borrowedBook} onClick={handleReturn}>
            Return Book {save.borrowedBook ? `"${save.borrowedBook.title}"` : ''}
          </button>
          <button className={styles.menuBtn} onClick={handleDelivery}>
            Any Deliveries?
          </button>
          {save.borrowedBook && (
            <button className={styles.menuBtn} onClick={() => handleRead(BOOKS.find(b => b.id === save.borrowedBook.id))}>
              Read "{save.borrowedBook.title}"
            </button>
          )}
          {message && <div className={styles.message}>{message}</div>}
          <button className={styles.close} onClick={handleClose}>Close</button>
        </div>
      </div>
    )
  }

  // Shelf view
  const startId = shelfSide === 'left' ? 1 : 7
  const endId = shelfSide === 'left' ? 6 : 12
  const shelfBooks = BOOKS.filter(b => b.id >= startId && b.id <= endId)

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.title}>{shelfSide === 'left' ? 'Left' : 'Right'} Bookshelf</div>
        <div className={styles.bookList}>
          {shelfBooks.map(book => {
            const unlocked = save.unlockedBooks.includes(book.id)
            const isBorrowed = save.borrowedBook?.id === book.id
            return (
              <div
                key={book.id}
                className={`${styles.bookItem} ${!unlocked ? styles.locked : ''}`}
                onClick={() => unlocked && !isBorrowed && handleBorrow(book)}
              >
                <div className={styles.bookSpine} style={{ backgroundColor: unlocked ? `#${book.spineColor.toString(16).padStart(6, '0')}` : '#555' }} />
                <div className={styles.bookTitle}>
                  {unlocked ? book.title : '🔒 Locked'}
                  {isBorrowed && ' (borrowed)'}
                </div>
              </div>
            )
          })}
        </div>
        {message && <div className={styles.message}>{message}</div>}
        <button className={styles.close} onClick={handleClose}>Close</button>
      </div>
    </div>
  )
}
