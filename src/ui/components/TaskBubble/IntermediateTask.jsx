import { useState, useEffect } from 'react'
import { generateIntermediateOptions } from '../../../logic/distractorGenerator'
import { speakWord, speakLetter } from '../../../logic/audioService'
import styles from './TaskBubble.module.css'

export function IntermediateTask({ wordEntry, onCorrect }) {
  const [missingIdx] = useState(() => Math.floor(Math.random() * wordEntry.word.length))
  const [options, setOptions] = useState(() => generateIntermediateOptions(wordEntry.word, missingIdx))
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('')
  const [wrongChoice, setWrongChoice] = useState(null)
  const [eliminated, setEliminated] = useState([])
  const [glowing, setGlowing] = useState(false)

  const correct = wordEntry.word[missingIdx]
  const display = wordEntry.word.split('').map((l, i) => i === missingIdx ? '_' : l).join(' ')

  useEffect(() => { speakWord(wordEntry.word) }, [wordEntry.word])

  function handleChoice(letter) {
    if (letter === correct) { onCorrect(attempt); return }

    const next = attempt + 1
    setAttempt(next)
    setWrongChoice(letter)
    setTimeout(() => setWrongChoice(null), 400)

    if (next === 1) {
      setMessage("Almost! Try again!")
    } else if (next === 2) {
      const wrong = options.filter(o => o !== correct && o !== letter)
      setEliminated(e => [...e, wrong[0]])
      setMessage("One less to pick from!")
    } else {
      setGlowing(true)
      speakWord(wordEntry.word)
      setMessage("Tap the right letter!")
    }
  }

  return (
    <>
      <div className={styles.clue}>{wordEntry.emoji}</div>
      <div style={{ textAlign: 'center', fontFamily: 'Press Start 2P', fontSize: '14px', color: '#fff', letterSpacing: '4px', marginBottom: '10px' }}>
        {display}
      </div>
      <div className={styles.choices}>
        {options.map(l => (
          <button
            key={l}
            className={[
              styles.choiceBtn,
              l === wrongChoice ? styles.wrong : '',
              glowing && l === correct ? styles.correct : '',
              eliminated.includes(l) ? styles.disabled : '',
            ].join(' ')}
            onClick={() => !eliminated.includes(l) && handleChoice(l)}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className={styles.message}>{message}</div>
    </>
  )
}
