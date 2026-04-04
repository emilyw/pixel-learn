import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import { loadSave } from '../../../logic/saveSystem'
import { BOOKS } from '../../../data/books'
import styles from './DeliveryBanner.module.css'

export function DeliveryBanner() {
  const [mission, setMission] = useState(() => loadSave().activeMission)

  useEffect(() => {
    const onStart = ({ mission: m }) => setMission(m)
    const onComplete = () => setMission(null)
    const onSave = () => setMission(loadSave().activeMission)
    EventBus.on('mission-start', onStart)
    EventBus.on('mission-complete', onComplete)
    EventBus.on('save-updated', onSave)
    return () => {
      EventBus.off('mission-start', onStart)
      EventBus.off('mission-complete', onComplete)
      EventBus.off('save-updated', onSave)
    }
  }, [])

  if (!mission) return null

  const book = BOOKS.find(b => b.id === mission.bookId)
  const targetName = mission.targetNpcName || mission.requestingNpcName
  const bookTitle = book ? book.title : 'a book'

  return (
    <div className={styles.banner}>
      Deliver &quot;{bookTitle}&quot; to {targetName}!
    </div>
  )
}
