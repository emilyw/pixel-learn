import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import { loadSave } from '../../../logic/saveSystem'
import { getQuestTarget } from '../../../logic/sessionManager'
import styles from './HUD.module.css'

export function HUD() {
  const [save, setSave] = useState(loadSave)

  useEffect(() => {
    const refresh = () => setSave(loadSave())
    EventBus.on('save-updated', refresh)
    return () => EventBus.off('save-updated', refresh)
  }, [])

  const questTarget = getQuestTarget(save.skillLevel)

  return (
    <div className={styles.hud}>
      <div className={styles.hearts}>❤️ {save.totalHearts}</div>
      <div className={styles.quest}>
        Quest: {save.dailyQuestProgress}/{questTarget}
      </div>
    </div>
  )
}
