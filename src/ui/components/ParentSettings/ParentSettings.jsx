import { useState } from 'react'
import { loadSave, writeSave, exportCode, importCode } from '../../../logic/saveSystem'
import { setAudioEnabled } from '../../../logic/audioService'
import { EventBus } from '../../../game/EventBus'
import styles from './ParentSettings.module.css'

export function ParentSettings({ onClose }) {
  const [save, setSave] = useState(loadSave)
  const [importInput, setImportInput] = useState('')
  const [importError, setImportError] = useState('')

  function update(patch) {
    const next = { ...save, ...patch }
    setSave(next)
    writeSave(next)
    EventBus.emit('save-updated')
    if ('audioEnabled' in patch) setAudioEnabled(patch.audioEnabled)
  }

  function handleImport() {
    const result = importCode(importInput.trim())
    if (!result) { setImportError('Invalid code'); return }
    if (!confirm('This will replace your current save. Continue?')) return
    writeSave(result)
    setSave(result)
    setImportError('')
    EventBus.emit('save-updated')
  }

  const skillLevels = ['beginner', 'intermediate', 'advanced']
  const capOptions = [5, 10, 15, 20]
  const audioOn = save.audioEnabled === null ? save.skillLevel !== 'advanced' : save.audioEnabled

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.title}>Parent Settings</div>

        <div className={styles.row}>
          <div className={styles.label}>Skill Level</div>
          <div className={styles.btnGroup}>
            {skillLevels.map(l => (
              <button key={l} className={`${styles.btn} ${save.skillLevel === l ? styles.active : ''}`}
                onClick={() => update({ skillLevel: l, audioEnabled: null })}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Read words aloud</div>
          <div className={styles.btnGroup}>
            <button className={`${styles.btn} ${audioOn ? styles.active : ''}`} onClick={() => update({ audioEnabled: true })}>On</button>
            <button className={`${styles.btn} ${!audioOn ? styles.active : ''}`} onClick={() => update({ audioEnabled: false })}>Off</button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Daily heart limit</div>
          <div className={styles.btnGroup}>
            {capOptions.map(c => (
              <button key={c} className={`${styles.btn} ${save.dailyHeartCap === c ? styles.active : ''}`}
                onClick={() => update({ dailyHeartCap: c })}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Today's progress</div>
          <div className={styles.stat}>Hearts today: {save.dailyHeartsEarned} / {save.dailyHeartCap}</div>
          <div className={styles.stat}>Total hearts: {save.totalHearts}</div>
          <button className={styles.btn} style={{ marginTop: 4 }}
            onClick={() => update({ dailyHeartsEarned: 0, dailyQuestProgress: 0, dailyQuestComplete: false })}>
            Reset Daily Progress
          </button>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Save code (copy to back up)</div>
          <div className={styles.saveCode}>{exportCode(save)}</div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Import save code</div>
          <input value={importInput} onChange={e => setImportInput(e.target.value)}
            placeholder="Paste code here"
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '10px', padding: '4px', background: '#0d1b2a', color: '#fff', border: '1px solid #455a64' }} />
          <button className={styles.btn} style={{ marginTop: 4 }} onClick={handleImport}>Import</button>
          {importError && <div style={{ color: '#ef5350', fontSize: '7px', marginTop: 4 }}>{importError}</div>}
        </div>

        <button className={styles.close} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
