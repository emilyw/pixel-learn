import { useEffect, useState } from 'react'
import { EventBus } from '../../../game/EventBus'
import styles from './DPad.module.css'

export function DPad() {
  const [touch, setTouch] = useState(false)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    setTouch('ontouchstart' in window)
    const onOpen  = () => setBlocked(true)
    const onClose = () => setBlocked(false)
    EventBus.on('task-open',  onOpen)
    EventBus.on('task-close', onClose)
    return () => { EventBus.off('task-open', onOpen); EventBus.off('task-close', onClose) }
  }, [])

  if (!touch || blocked) return null

  function press(dir)   { EventBus.emit('dpad', { dir, active: true  }) }
  function release(dir) { EventBus.emit('dpad', { dir, active: false }) }

  function btn(dir, label, col, row) {
    return (
      <div key={dir}
        className={styles.btn}
        style={{ gridColumn: col, gridRow: row }}
        onTouchStart={e => { e.preventDefault(); press(dir) }}
        onTouchEnd={e => { e.preventDefault(); release(dir) }}
      >
        {label}
      </div>
    )
  }

  return (
    <div className={styles.dpad}>
      {btn('up',    '\u25B2', 2, 1)}
      {btn('left',  '\u25C0', 1, 2)}
      <div className={`${styles.btn} ${styles.empty}`} style={{ gridColumn: 2, gridRow: 2 }} />
      {btn('right', '\u25B6', 3, 2)}
      {btn('down',  '\u25BC', 2, 3)}
    </div>
  )
}
