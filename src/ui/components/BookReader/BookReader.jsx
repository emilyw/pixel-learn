import { useState, useEffect, useCallback } from 'react'
import { EventBus } from '../../../game/EventBus'
import { loadSave, writeSave } from '../../../logic/saveSystem'
import { addDailyHearts, incrementQuestProgress } from '../../../logic/sessionManager'
import { BOOKS } from '../../../data/books'
import { speakWord, isAudioEnabled } from '../../../logic/audioService'
import styles from './BookReader.module.css'

const HEARTS_BY_ATTEMPT = [3, 2, 1]

export function BookReader() {
  const [bookId, setBookId] = useState(null)
  const [currentWord, setCurrentWord] = useState(0)
  const [filledWords, setFilledWords] = useState([])
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('')
  const [wrongChoice, setWrongChoice] = useState(null)
  const [done, setDone] = useState(false)
  const [choices, setChoices] = useState([])

  const generateChoices = useCallback((correctWord) => {
    const distractors = BOOKS
      .flatMap(b => b.puzzleWords)
      .filter(w => w !== correctWord)
    const shuffled = distractors.sort(() => Math.random() - 0.5).slice(0, 2)
    return [correctWord, ...shuffled].sort(() => Math.random() - 0.5)
  }, [])

  useEffect(() => {
    const onRead = ({ bookId: id }) => {
      setBookId(id)
      setCurrentWord(0)
      setFilledWords([])
      setAttempt(0)
      setMessage('')
      setDone(false)
      setWrongChoice(null)
      const book = BOOKS.find(b => b.id === id)
      if (book && book.puzzleWords.length > 0) {
        setChoices(generateChoices(book.puzzleWords[0]))
      }
    }
    EventBus.on('read-book', onRead)
    return () => EventBus.off('read-book', onRead)
  }, [generateChoices])

  if (!bookId) return null

  const book = BOOKS.find(b => b.id === bookId)
  if (!book) return null

  const puzzleWords = book.puzzleWords
  const allFilled = filledWords.length >= puzzleWords.length

  function handleChoice(choice) {
    const correctWord = puzzleWords[currentWord]
    if (choice === correctWord) {
      const newFilled = [...filledWords, correctWord]
      setFilledWords(newFilled)

      if (isAudioEnabled()) speakWord(correctWord)

      if (newFilled.length >= puzzleWords.length) {
        // All words filled — book complete
        const heartsEarned = HEARTS_BY_ATTEMPT[Math.min(attempt, 2)]
        let save = loadSave()
        save = addDailyHearts(save, heartsEarned)
        save = incrementQuestProgress(save)
        if (!save.booksRead.includes(bookId)) {
          save = { ...save, booksRead: [...save.booksRead, bookId] }
        }
        writeSave(save)
        EventBus.emit('save-updated')
        setMessage(`You earned ${heartsEarned} heart${heartsEarned > 1 ? 's' : ''}!`)
        setDone(true)
      } else {
        const nextWord = currentWord + 1
        setCurrentWord(nextWord)
        setAttempt(0)
        setMessage('Correct!')
        setChoices(generateChoices(puzzleWords[nextWord]))
      }
    } else {
      setAttempt(attempt + 1)
      setWrongChoice(choice)
      setTimeout(() => setWrongChoice(null), 400)
      setMessage(attempt === 0 ? 'Try again!' : 'Look carefully...')
    }
  }

  function handleDone() {
    setBookId(null)
    EventBus.emit('book-read-done')
    EventBus.emit('task-close')
  }

  // Render story with blanks
  const storyParts = book.story.split('___')

  return (
    <div className={styles.overlay}>
      <div className={styles.book}>
        <div className={styles.bookTitle}>{book.title}</div>
        <div className={styles.story}>
          {storyParts.map((part, i) => (
            <span key={i}>
              {part}
              {i < storyParts.length - 1 && (
                <span className={`${styles.blank} ${filledWords[i] ? styles.filled : ''}`}>
                  {filledWords[i] || (i === currentWord ? '???' : '___')}
                </span>
              )}
            </span>
          ))}
        </div>
        {!allFilled && (
          <div className={styles.choices}>
            {choices.map(c => (
              <button
                key={c}
                className={`${styles.choiceBtn} ${c === wrongChoice ? styles.wrong : ''}`}
                onClick={() => handleChoice(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className={styles.message}>{message}</div>
        {done && (
          <button className={styles.doneBtn} onClick={handleDone}>
            Done!
          </button>
        )}
      </div>
    </div>
  )
}
