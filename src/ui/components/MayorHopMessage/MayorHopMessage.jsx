import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import { loadSave, writeSave } from '../../../logic/saveSystem'
import { isAudioEnabled } from '../../../logic/audioService'
import styles from './MayorHopMessage.module.css'

const MESSAGES = {
  'welcome-back': "Welcome back, adventurer! Your friends missed you. Ready to learn some new words?",
  intro:          "Hi! I'm Mayor Hop! This is our village. Help your friends by learning new words and earn hearts! Let's go!",
  'quest-complete': "You did it! You helped all your friends today — you're a star!",
  'daily-cap':    "Amazing work today! I'm so proud of you. Time to rest — come back tomorrow for more adventures!",
}

export function MayorHopMessage() {
  const [messageType, setMessageType] = useState(null)

  useEffect(() => {
    function speak(type) {
      if (isAudioEnabled() && MESSAGES[type]) {
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(MESSAGES[type])
        utt.rate = 0.85
        utt.pitch = 1.1
        window.speechSynthesis.speak(utt)
      }
    }
    const onMayor = ({ type }) => { setMessageType(type); speak(type) }
    const onQuest = () => { setMessageType('quest-complete'); speak('quest-complete') }
    const onCap = () => { setMessageType('daily-cap'); speak('daily-cap') }
    EventBus.on('show-mayor-message', onMayor)
    EventBus.on('quest-complete', onQuest)
    EventBus.on('daily-cap-reached', onCap)
    return () => {
      EventBus.off('show-mayor-message', onMayor)
      EventBus.off('quest-complete', onQuest)
      EventBus.off('daily-cap-reached', onCap)
    }
  }, [])

  function handleClose() {
    if (messageType === 'intro') {
      const save = loadSave()
      writeSave({ ...save, isFirstPlay: false })
      EventBus.emit('save-updated')
    }
    setMessageType(null)
    EventBus.emit('task-close')
  }

  if (!messageType) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.npc}>🐸</div>
        <div className={styles.text}>{MESSAGES[messageType]}</div>
        <button className={styles.btn} onClick={handleClose}>
          {messageType === 'daily-cap' ? 'See you tomorrow!' : 'OK!'}
        </button>
      </div>
    </div>
  )
}
