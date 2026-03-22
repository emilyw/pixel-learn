import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import { loadSave, writeSave } from '../../../logic/saveSystem'
import { addDailyHearts, incrementQuestProgress, isDailyCapped, getQuestTarget } from '../../../logic/sessionManager'
import { getNewUnlocks } from '../../../logic/progressionEngine'
import { selectWord } from '../../../logic/wordSelector'
import { isAudioEnabled } from '../../../logic/audioService'
import { generateNpcRequest } from '../../../logic/missionSystem'
import { BeginnerTask } from './BeginnerTask'
import { IntermediateTask } from './IntermediateTask'
import { AdvancedTask } from './AdvancedTask'
import styles from './TaskBubble.module.css'

import beginnerBank from '../../../data/words/beginner.json'
import intermediateBank from '../../../data/words/intermediate.json'
import advancedBank from '../../../data/words/advanced.json'

const BANKS = { beginner: beginnerBank, intermediate: intermediateBank, advanced: advancedBank }

const recentWords = {}

const HEARTS_BY_ATTEMPT = [3, 2, 1]

const PRAISE = [
  'Great job!', 'You got it!', 'Amazing!', 'Well done!', 'Awesome!',
  'Fantastic!', 'You\'re a star!', 'Brilliant!', 'Nailed it!', 'Super!',
  'Way to go!', 'Nice work!', 'Perfect!', 'Wow, so smart!', 'You rock!',
  'That\'s right!', 'Incredible!', 'Keep it up!', 'Wonderful!', 'Spot on!',
]

export function TaskBubble() {
  const [interaction, setInteraction] = useState(null)
  const [praise, setPraise] = useState(null)

  useEffect(() => {
    const handler = ({ npcId, npcName, screenX, screenY }) => {
      const save = loadSave()
      if (isDailyCapped(save)) return

      // 20% chance of book delivery request
      if (Math.random() < 0.2 && !save.activeMission && !save.borrowedBook) {
        const request = generateNpcRequest(save, npcId)
        if (request) {
          const updated = { ...save, activeMission: request.mission }
          writeSave(updated)
          EventBus.emit('save-updated')
          EventBus.emit('mission-start', { mission: request.mission })
          setInteraction({
            npcId, npcName, screenX, screenY,
            bookRequest: request.bookTopic,
          })
          EventBus.emit('task-open')
          return
        }
      }

      const bank = BANKS[save.skillLevel]
      const recent = recentWords[npcId] || []
      const wordEntry = selectWord(bank, npcId, recent)
      if (!wordEntry) return

      recentWords[npcId] = [wordEntry.word, ...recent].slice(0, 3)

      setInteraction({ npcId, npcName, screenX, screenY, wordEntry })
      EventBus.emit('task-open')
    }

    EventBus.on('npc-interact', handler)
    return () => EventBus.off('npc-interact', handler)
  }, [])

  function handleDismiss() {
    setInteraction(null)
    EventBus.emit('task-close')
  }

  function handleCorrect(attemptIndex) {
    const heartsEarned = HEARTS_BY_ATTEMPT[Math.min(attemptIndex, 2)]
    let save = loadSave()
    save = addDailyHearts(save, heartsEarned)
    save = incrementQuestProgress(save)

    const newUnlocks = getNewUnlocks(save)
    newUnlocks.forEach(u => {
      save.unlockedNpcs = [...save.unlockedNpcs, u.npcId]
      save.firedThresholds = [...save.firedThresholds, u.points]
    })

    const questTarget = getQuestTarget(save.skillLevel)
    if (save.dailyQuestProgress >= questTarget && !save.dailyQuestComplete) {
      save.dailyQuestComplete = true
      EventBus.emit('quest-complete')
    }

    if (isDailyCapped(save)) {
      EventBus.emit('daily-cap-reached')
    }

    writeSave(save)
    EventBus.emit('save-updated')

    if (newUnlocks.length > 0) {
      EventBus.emit('unlocks-pending', newUnlocks)
    }

    EventBus.emit('hearts-earned', { amount: heartsEarned, screenX: interaction.screenX, screenY: interaction.screenY })

    // Show random praise before closing
    const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)]
    setPraise({ npcName: interaction.npcName, msg })
    if (isAudioEnabled()) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(`${interaction.npcName} says: ${msg}`)
      utt.rate = 0.9
      utt.pitch = 1.1
      window.speechSynthesis.speak(utt)
    }
    setTimeout(() => {
      setPraise(null)
      setInteraction(null)
      EventBus.emit('task-close')
    }, 1500)
  }

  if (praise) {
    return (
      <div className={styles.overlay}>
        <div className={styles.bubble}>
          <div className={styles.npcHeader}>
            <span>{praise.npcName} says:</span>
          </div>
          <div className={styles.praise}>{praise.msg}</div>
        </div>
      </div>
    )
  }

  if (interaction?.bookRequest) {
    return (
      <div className={styles.overlay}>
        <div className={styles.bubble}>
          <div className={styles.npcHeader}>
            <span>{interaction.npcName} says:</span>
          </div>
          <div className={styles.praise}>
            Can you bring me a book about &quot;{interaction.bookRequest}&quot;?
          </div>
          <button className={styles.dismiss} onClick={handleDismiss} style={{ position: 'relative', width: '100%', marginTop: 8, fontSize: '8px', padding: '10px' }}>
            OK, I&apos;ll find it!
          </button>
        </div>
      </div>
    )
  }

  if (!interaction) return null

  const save = loadSave()

  return (
    <div className={styles.overlay}>
      <div className={styles.bubble}>
        <button className={styles.dismiss} onClick={handleDismiss}>&#x2715;</button>
        <div className={styles.npcHeader}>
          <span>{interaction.npcName} says:</span>
        </div>
        {save.skillLevel === 'beginner' && (
          <BeginnerTask wordEntry={interaction.wordEntry} onCorrect={handleCorrect} onDismiss={handleDismiss} />
        )}
        {save.skillLevel === 'intermediate' && (
          <IntermediateTask wordEntry={interaction.wordEntry} onCorrect={handleCorrect} />
        )}
        {save.skillLevel === 'advanced' && (
          <AdvancedTask wordEntry={interaction.wordEntry} onCorrect={handleCorrect} />
        )}
      </div>
    </div>
  )
}
