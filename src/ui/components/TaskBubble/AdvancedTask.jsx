import { useState, useEffect } from 'react'
import { speakWord, speakLetter } from '../../../logic/audioService'
import styles from './TaskBubble.module.css'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function AdvancedTask({ wordEntry, onCorrect }) {
  const letters = wordEntry.word.split('')
  const [tiles, setTiles] = useState(() => shuffle(letters.map((l, i) => ({ l, id: i }))))
  const [placed, setPlaced] = useState([])
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('')
  const [shaking, setShaking] = useState(false)
  const [revealedFirst, setRevealedFirst] = useState(false)
  const [confirmMode, setConfirmMode] = useState(false)

  useEffect(() => { speakWord(wordEntry.word) }, [wordEntry.word])

  function placeTile(tile) {
    const newPlaced = [...placed, tile]
    setPlaced(newPlaced)
    setTiles(t => t.filter(t => t.id !== tile.id))
    speakLetter(tile.l)

    if (newPlaced.length === letters.length) {
      const answer = newPlaced.map(t => t.l).join('')
      if (answer === wordEntry.word) {
        onCorrect(attempt)
      } else {
        handleWrong(newPlaced)
      }
    }
  }

  function handleWrong(currentPlaced) {
    const next = attempt + 1
    setAttempt(next)
    setShaking(true)
    setTimeout(() => setShaking(false), 400)

    if (next === 1) {
      setMessage("Almost! Try again!")
      setTiles(shuffle([...currentPlaced, ...tiles]))
      setPlaced([])
    } else if (next === 2 && !revealedFirst) {
      setRevealedFirst(true)
      setMessage("Here's a hint...")
      const firstCorrect = { l: wordEntry.word[0], id: 999 }
      const remaining = shuffle(currentPlaced.filter(t => t.l !== wordEntry.word[0]))
      setPlaced([firstCorrect])
      setTiles(remaining)
    } else {
      setMessage("Watch carefully...")
      speakWord(wordEntry.word)
      letters.forEach((l, i) => setTimeout(() => speakLetter(l), i * 300))
      setTimeout(() => {
        setConfirmMode(true)
        setMessage("Now you try!")
        setTiles(shuffle(letters.map((l, i) => ({ l, id: i }))))
        setPlaced([])
      }, letters.length * 300 + 500)
    }
  }

  return (
    <>
      <div className={styles.clue}>{wordEntry.emoji}</div>
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', minHeight: '44px', marginBottom: '8px' }}>
        {placed.map((t, i) => (
          <div key={i} style={{ width: 30, height: 44, background: '#4caf50', border: '2px solid #2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Press Start 2P', fontSize: '12px', color: '#fff' }}>
            {t.l.toUpperCase()}
          </div>
        ))}
        {Array.from({ length: letters.length - placed.length }).map((_, i) => (
          <div key={`empty-${i}`} style={{ width: 30, height: 44, border: '2px dashed #69f0ae' }} />
        ))}
      </div>
      <div className={styles.choices} style={{ animation: shaking ? 'shake 0.3s' : 'none' }}>
        {tiles.map(tile => (
          <button key={tile.id} className={styles.choiceBtn} onClick={() => placeTile(tile)}>
            {tile.l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className={styles.message}>{message}</div>
    </>
  )
}
