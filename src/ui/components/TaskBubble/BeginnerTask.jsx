import { useState, useEffect } from 'react'
import { speakWord } from '../../../logic/audioService'
import styles from './TaskBubble.module.css'

export function BeginnerTask({ wordEntry, onCorrect, onDismiss }) {
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('')
  const [glowing, setGlowing] = useState(false)
  const [wrongChoice, setWrongChoice] = useState(null)
  const [disabled, setDisabled] = useState([])

  const [choices] = useState(() => {
    const opts = [wordEntry.word, ...wordEntry.distractors.slice(0, 2)]
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]]
    }
    return opts
  })

  useEffect(() => { speakWord(wordEntry.word) }, [wordEntry.word])

  function handleChoice(choice) {
    if (choice === wordEntry.word) {
      onCorrect(attempt)
      return
    }

    const nextAttempt = attempt + 1
    setAttempt(nextAttempt)
    setWrongChoice(choice)
    setTimeout(() => setWrongChoice(null), 400)

    if (nextAttempt === 1) {
      setMessage("Oops! Try again!")
    } else if (nextAttempt === 2) {
      setMessage("Look carefully...")
      setGlowing(true)
      setTimeout(() => setGlowing(false), 1000)
    } else {
      setMessage("Tap the right one!")
      setGlowing(true)
      speakWord(wordEntry.word)
    }
  }

  return (
    <>
      <div className={styles.clue}>{wordEntry.emoji}</div>
      <div className={styles.choices}>
        {choices.map(c => (
          <button
            key={c}
            className={[
              styles.choiceBtn,
              c === wrongChoice ? styles.wrong : '',
              glowing && c === wordEntry.word ? styles.correct : '',
              disabled.includes(c) ? styles.disabled : '',
            ].join(' ')}
            onClick={() => handleChoice(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className={styles.message}>{message}</div>
    </>
  )
}
