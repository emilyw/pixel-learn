import { useState, useEffect, useRef } from 'react'
import { EventBus } from '../../../game/EventBus'
import styles from './PondHUD.module.css'

export function PondHUD() {
  const [word, setWord] = useState(null)
  const [emoji, setEmoji] = useState('')
  const [flashing, setFlashing] = useState(false)
  const [filled, setFilled] = useState([])
  const [goldenIndices, setGoldenIndices] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    const onEnter = ({ word, emoji, flashMs }) => {
      setWord(word)
      setEmoji(emoji || '')
      setFilled([])
      setGoldenIndices([])
      // Show the word briefly
      setFlashing(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setFlashing(false), flashMs || 2000)
    }
    const onCollect = ({ letter, index, isGolden, isCorrect }) => {
      if (!isCorrect) return
      setFilled(prev => [...prev, { letter, index, isGolden }])
      if (isGolden) setGoldenIndices(prev => [...prev, index])
    }
    const onExit = () => {
      setWord(null)
      setEmoji('')
      setFlashing(false)
      setFilled([])
      setGoldenIndices([])
      if (timerRef.current) clearTimeout(timerRef.current)
    }

    EventBus.on('pond-enter', onEnter)
    EventBus.on('pond-letter-collect', onCollect)
    EventBus.on('pond-exit', onExit)
    EventBus.on('pond-word-complete', onExit)

    return () => {
      EventBus.off('pond-enter', onEnter)
      EventBus.off('pond-letter-collect', onCollect)
      EventBus.off('pond-exit', onExit)
      EventBus.off('pond-word-complete', onExit)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!word) return null

  const letters = word.split('')

  return (
    <div className={styles.container}>
      {emoji && <div className={styles.emoji}>{emoji}</div>}
      {letters.map((letter, i) => {
        const entry = filled.find(f => f.index === i)
        const isFilled = !!entry
        const isGolden = goldenIndices.includes(i)
        const cls = [styles.slot]
        if (flashing) cls.push(styles.flash)
        if (isFilled) cls.push(styles.filled)
        if (isFilled && isGolden) cls.push(styles.golden)
        return (
          <div key={i} className={cls.join(' ')}>
            {flashing ? letter : (isFilled ? letter : '_')}
          </div>
        )
      })}
    </div>
  )
}
