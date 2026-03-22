import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import styles from './PondHUD.module.css'

export function PondHUD() {
  const [word, setWord] = useState(null)
  const [filled, setFilled] = useState([])
  const [goldenIndices, setGoldenIndices] = useState([])

  useEffect(() => {
    const onEnter = ({ word }) => {
      setWord(word)
      setFilled([])
      setGoldenIndices([])
    }
    const onCollect = ({ letter, index, isGolden, isCorrect }) => {
      if (!isCorrect) return
      setFilled(prev => [...prev, { letter, index, isGolden }])
      if (isGolden) setGoldenIndices(prev => [...prev, index])
    }
    const onExit = () => {
      setWord(null)
      setFilled([])
      setGoldenIndices([])
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
    }
  }, [])

  if (!word) return null

  const letters = word.split('')

  return (
    <div className={styles.container}>
      {letters.map((letter, i) => {
        const entry = filled.find(f => f.index === i)
        const isFilled = !!entry
        const isGolden = goldenIndices.includes(i)
        const cls = [styles.slot]
        if (isFilled) cls.push(styles.filled)
        if (isFilled && isGolden) cls.push(styles.golden)
        return (
          <div key={i} className={cls.join(' ')}>
            {isFilled ? letter : '_'}
          </div>
        )
      })}
    </div>
  )
}
