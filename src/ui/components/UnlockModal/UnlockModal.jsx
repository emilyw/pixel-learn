import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import styles from './UnlockModal.module.css'

export function UnlockModal() {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)

  useEffect(() => {
    const onUnlocks = (unlocks) => {
      setQueue(u => [...u, ...unlocks])
    }
    EventBus.on('unlocks-pending', onUnlocks)
    return () => EventBus.off('unlocks-pending', onUnlocks)
  }, [])

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(q => q.slice(1))
      EventBus.emit('task-open')
    }
  }, [current, queue])

  function handleNext() {
    EventBus.emit('npc-unlocked', { npcId: current.npcId })
    setCurrent(null)
    if (queue.length === 0) {
      EventBus.emit('task-close')
    }
  }

  if (!current) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.emoji}>🔓</div>
        <div className={styles.title}>{current.name} is awake!</div>
        <div className={styles.sub}>{current.location} is now open!</div>
        <button className={styles.btn} onClick={handleNext}>Hooray!</button>
      </div>
    </div>
  )
}
