# Tree Cutting Mini-Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a whack-a-mole style tree chopping mini-game where letters pop up on stumps briefly and the child must chop the correct next letter under time pressure.

**Architecture:** Timber the Beaver NPC triggers entry into a bounded chopping zone (same pattern as Bubbles/pond). 6 stumps in a 3x2 grid show letters on timed cycles. ChopHUD React component mirrors PondHUD for memory flash display. Hearts awarded on completion through WorldScene directly.

**Tech Stack:** Phaser 3 (game engine), React 18 (HUD overlay), EventBus (communication), Web Speech API (letter speech)

**Spec:** `docs/superpowers/specs/2026-03-23-tree-cutting-design.md`

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/logic/saveSystem.js` | Modify | Add `treesChopped`, `treesChoppedToday` to DEFAULT_SAVE |
| `src/logic/sessionManager.js` | Modify | Add `treesChoppedToday: 0` to daily reset |
| `src/game/entities/Player.js` | Modify | Add `setChopMode(bounds)` / `clearChopMode()` (brown tint + bounds) |
| `src/ui/components/ChopHUD/ChopHUD.jsx` | Create | React HUD component (clone of PondHUD with chop-* events) |
| `src/ui/components/ChopHUD/ChopHUD.module.css` | Create | Styles (brown/wood theme, same structure as PondHUD) |
| `src/App.jsx` | Modify | Mount `<ChopHUD />` |
| `src/game/scenes/WorldScene.js` | Modify | Add Timber NPC, chop zone, stump mechanics, entry/exit/completion |
| `src/ui/components/TaskBubble/TaskBubble.jsx` | Modify | Add 20% chop mission branch |
| `tests/treeCutting.test.js` | Create | Save data + daily reset tests |

---

### Task 1: Add tree cutting save data fields

**Files:**
- Modify: `src/logic/saveSystem.js`
- Modify: `src/logic/sessionManager.js`
- Create: `tests/treeCutting.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/treeCutting.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { DEFAULT_SAVE } from '../src/logic/saveSystem'
import { checkDailyReset } from '../src/logic/sessionManager'

describe('Tree cutting save data', () => {
  it('DEFAULT_SAVE includes tree cutting fields', () => {
    expect(DEFAULT_SAVE).toHaveProperty('treesChopped', 0)
    expect(DEFAULT_SAVE).toHaveProperty('treesChoppedToday', 0)
  })

  it('checkDailyReset resets treesChoppedToday', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', treesChoppedToday: 5 }
    const reset = checkDailyReset(save, '2026-01-02')
    expect(reset.treesChoppedToday).toBe(0)
  })

  it('checkDailyReset preserves treesChoppedToday on same day', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', treesChoppedToday: 5 }
    const reset = checkDailyReset(save, '2026-01-01')
    expect(reset.treesChoppedToday).toBe(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/treeCutting.test.js`
Expected: FAIL — `treesChopped` and `treesChoppedToday` not in DEFAULT_SAVE

- [ ] **Step 3: Add fields to DEFAULT_SAVE**

In `src/logic/saveSystem.js`, add after the `goldenLettersFound` line (line 22):

```javascript
  treesChopped: 0,
  treesChoppedToday: 0,
```

- [ ] **Step 4: Add treesChoppedToday to daily reset**

In `src/logic/sessionManager.js`, add `treesChoppedToday: 0` to the reset object in `checkDailyReset` (after `pondWordsToday: 0` on line 13):

```javascript
    treesChoppedToday: 0,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/treeCutting.test.js`
Expected: All 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/logic/saveSystem.js src/logic/sessionManager.js tests/treeCutting.test.js
git commit -m "feat(chop): add tree cutting save data fields and daily reset"
```

---

### Task 2: Add chop mode to Player entity

**Files:**
- Modify: `src/game/entities/Player.js`

- [ ] **Step 1: Add setChopMode and clearChopMode methods**

In `src/game/entities/Player.js`, add after `clearSwimMode()` (after line 58):

```javascript
  setChopMode(bounds) {
    this._chopping = true
    this._chopBounds = bounds
    this.setTint(0x8D6E63)
  }

  clearChopMode() {
    this._chopping = false
    this._chopBounds = null
    this.clearTint()
  }
```

- [ ] **Step 2: Add bounds clamping in update()**

In the `update()` method, add after the swim bounds clamping block (after line 89):

```javascript
    // Clamp to chop bounds if chopping
    if (this._chopping && this._chopBounds) {
      const b = this._chopBounds
      this.x = Phaser.Math.Clamp(this.x, b.x, b.x + b.width)
      this.y = Phaser.Math.Clamp(this.y, b.y, b.y + b.height)
    }
```

- [ ] **Step 3: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/game/entities/Player.js
git commit -m "feat(chop): add chop mode to Player entity with bounds clamping"
```

---

### Task 3: Create ChopHUD React component

**Files:**
- Create: `src/ui/components/ChopHUD/ChopHUD.jsx`
- Create: `src/ui/components/ChopHUD/ChopHUD.module.css`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create ChopHUD.module.css**

Create `src/ui/components/ChopHUD/ChopHUD.module.css`:

```css
.container {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(93, 64, 55, 0.9);
  border: 2px solid #8d6e63;
  border-radius: 8px;
}

.emoji {
  font-size: 20px;
  margin-right: 4px;
}

.slot {
  width: 28px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #a1887f;
  border-radius: 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #ffffff;
  transition: background 0.3s, border-color 0.3s;
}

.flash {
  background: rgba(255, 235, 59, 0.4);
  border-color: #ffeb3b;
  color: #ffeb3b;
}

.filled {
  background: rgba(76, 175, 80, 0.6);
  border-color: #66bb6a;
}

.golden {
  background: rgba(255, 215, 0, 0.6);
  border-color: #ffd700;
  color: #3e2723;
}
```

- [ ] **Step 2: Create ChopHUD.jsx**

Create `src/ui/components/ChopHUD/ChopHUD.jsx`:

```jsx
import { useState, useEffect, useRef } from 'react'
import { EventBus } from '../../../game/EventBus'
import styles from './ChopHUD.module.css'

export function ChopHUD() {
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

    EventBus.on('chop-enter', onEnter)
    EventBus.on('chop-letter-collect', onCollect)
    EventBus.on('chop-exit', onExit)
    EventBus.on('chop-word-complete', onExit)

    return () => {
      EventBus.off('chop-enter', onEnter)
      EventBus.off('chop-letter-collect', onCollect)
      EventBus.off('chop-exit', onExit)
      EventBus.off('chop-word-complete', onExit)
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
```

- [ ] **Step 3: Mount ChopHUD in App.jsx**

In `src/App.jsx`, add import after PondHUD import (line 12):

```javascript
import { ChopHUD } from './ui/components/ChopHUD/ChopHUD'
```

Add `<ChopHUD />` after `<PondHUD />` (after line 27):

```jsx
      <ChopHUD />
```

- [ ] **Step 4: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/ChopHUD/ChopHUD.jsx src/ui/components/ChopHUD/ChopHUD.module.css src/App.jsx
git commit -m "feat(chop): create ChopHUD React component with memory flash"
```

---

### Task 4: Add Timber NPC and chop zone setup in WorldScene

**Files:**
- Modify: `src/game/scenes/WorldScene.js`

This task adds the Timber NPC sprite, chop zone bounds, and dialogue method to `create()`. No gameplay logic yet.

- [ ] **Step 1: Add Timber NPC and zone bounds in create()**

In `src/game/scenes/WorldScene.js`, add after the pond shutdown cleanup block (after line 166, before the closing `}` of `create()`):

```javascript
    // --- tree cutting (chop) ---
    // Bottom-left tree cluster: tiles (7-9, 28-29) → pixels (112-144, 448-464)
    this._chopBounds = { x: 112, y: 400, width: 96, height: 64 }
    this._chopCenter = { x: 160, y: 432 }
    this._chopEdge = { x: 104, y: 440 }
    this._chopping = false
    this._chopStumps = null
    this._chopCycleTimer = null

    // Timber the Beaver - standalone NPC (not in NPCS array)
    const timber = this.add.sprite(104, 440, 'npc_coach_roar', 8)
    timber.setTint(0x8D6E63)
    timber.setScale(0.7)
    timber.setDepth(90)
    this.add.text(104, 424, 'Timber', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(91)

    // Axe visual at exit point
    this.add.text(this._chopEdge.x + 24, this._chopEdge.y, '🪓', {
      fontSize: '10px',
    }).setOrigin(0.5).setDepth(89)

    // Timber click interaction
    timber.setInteractive({ useHandCursor: true })
    timber.on('pointerdown', () => this._tryEnterChop())

    // Shutdown cleanup for chop
    this.events.on('shutdown', () => {
      if (this._chopping) this._exitChop(false)
    })
```

- [ ] **Step 2: Add _showTimberDialogue method**

Add after `_showBubblesDialogue` method (after line 560):

```javascript
  _showTimberDialogue(msg) {
    const dialogBg = this.add.rectangle(160, 385, 200, 40, 0x000000, 0.8)
    dialogBg.setDepth(200).setStrokeStyle(1, 0x8D6E63)
    const dialogText = this.add.text(160, 385, msg, {
      fontFamily: '"Press Start 2P"', fontSize: '5px', color: '#ffffff',
      wordWrap: { width: 190 }, align: 'center',
    }).setOrigin(0.5).setDepth(201)
    this.time.delayedCall(2500, () => {
      dialogBg.destroy()
      dialogText.destroy()
    })
  }
```

- [ ] **Step 3: Add _tryEnterChop guard method**

Add after `_showTimberDialogue`:

```javascript
  _tryEnterChop() {
    const save = loadSave()
    if (this._chopping || this._swimming) return
    if (save.activeMission && save.activeMission.type !== 'chop') {
      this._showTimberDialogue('Finish what you\'re doing first, then come chop!')
      return
    }
    if (isDailyCapped(save)) {
      this._showTimberDialogue('You\'ve chopped enough for today! Come back tomorrow.')
      return
    }
    if (!this._timberVisited) {
      this._showTimberDialogue('Want to chop some wood? Letters pop up on the stumps — chop them in order!')
      this._timberVisited = true
    }
    this._enterChop(save)
  }
```

- [ ] **Step 4: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds (methods exist but `_enterChop` is not yet defined — add a stub):

Add temporary stubs after `_tryEnterChop`:

```javascript
  _enterChop(save) {
    // TODO: implement in Task 5
  }

  _exitChop(completed) {
    // TODO: implement in Task 7
  }
```

- [ ] **Step 5: Commit**

```bash
git add src/game/scenes/WorldScene.js
git commit -m "feat(chop): add Timber NPC, chop zone bounds, and guard checks"
```

---

### Task 5: Implement chop zone entry and stump spawning

**Files:**
- Modify: `src/game/scenes/WorldScene.js`

- [ ] **Step 1: Implement _enterChop method**

Replace the `_enterChop` stub with the full implementation:

```javascript
  _enterChop(save) {
    this._chopping = true
    this.player.setBlocked(true)

    // Disable world collision
    if (this._collider) this._collider.active = false

    // Teleport to chop zone center
    this.player.setPosition(this._chopCenter.x, this._chopCenter.y)
    if (this._playerArrow) this._playerArrow.setVisible(false)

    // Screen shake + chop text
    this.cameras.main.shake(50, 0.005)
    const chopText = this.add.text(this._chopCenter.x, this._chopCenter.y - 20, 'CHOP!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffffff',
      stroke: '#8d6e63', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(105)
    this.tweens.add({
      targets: chopText, alpha: 0, y: chopText.y - 30,
      duration: 1000, ease: 'Sine.easeOut',
      onComplete: () => chopText.destroy(),
    })

    // Apply chop mode (brown tint + bounds)
    this.player.setChopMode(this._chopBounds)
    this.player.setDepth(100)

    // Select word
    let chopWord, chopEmoji
    if (save.activeMission && save.activeMission.type === 'chop') {
      chopWord = save.activeMission.word.toLowerCase()
      chopEmoji = save.activeMission.emoji || ''
    } else {
      const bank = this._wordBanks[save.skillLevel]
      const wordEntry = bank[Math.floor(Math.random() * bank.length)]
      chopWord = wordEntry.word.toLowerCase()
      chopEmoji = wordEntry.emoji || ''
    }
    this._chopWord = chopWord
    this._chopEmoji = chopEmoji
    this._chopLettersCollected = 0
    this._chopGoldenIndex = Math.random() < 0.1 ? Math.floor(Math.random() * chopWord.length) : -1
    this._chopFoundGolden = false
    this._chopWrongCount = 0
    this._chopCyclesMissed = 0

    // Flash duration by skill level
    const flashMs = save.skillLevel === 'beginner' ? 3000
      : save.skillLevel === 'intermediate' ? 2000 : 1500

    EventBus.emit('chop-enter', { word: chopWord, emoji: chopEmoji, flashMs })

    // Speak the word
    try {
      if (save.audioEnabled) {
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(chopWord)
        utt.rate = 0.8
        utt.pitch = 1.1
        window.speechSynthesis.speak(utt)
      }
    } catch (_) { /* speech not available */ }

    // After flash, spawn stumps and start cycle
    this.time.delayedCall(flashMs, () => {
      this._spawnStumps()
      this._startStumpCycle()
      this.player.setBlocked(false)
    })
  }
```

- [ ] **Step 2: Implement _spawnStumps method**

Add after `_enterChop`:

```javascript
  _spawnStumps() {
    this._chopStumps = []
    const bounds = this._chopBounds
    const cols = 3, rows = 2
    const spacingX = 28, spacingY = 24
    const startX = bounds.x + (bounds.width - (cols - 1) * spacingX) / 2
    const startY = bounds.y + (bounds.height - (rows - 1) * spacingY) / 2

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX
        const y = startY + r * spacingY
        const stump = this._createStump(x, y)
        this._chopStumps.push(stump)
      }
    }
  }

  _createStump(x, y) {
    const bg = this.add.rectangle(x, y, 14, 14, 0x5d4037)
    bg.setStrokeStyle(1, 0x3e2723)
    bg.setDepth(95)

    const text = this.add.text(x, y, '', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(96)
    text.setVisible(false)

    return { bg, text, x, y, active: false, letter: null, popTween: null, hideTween: null }
  }
```

- [ ] **Step 3: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/game/scenes/WorldScene.js
git commit -m "feat(chop): implement chop zone entry and stump grid spawning"
```

---

### Task 6: Implement stump pop-up cycle and letter chopping

**Files:**
- Modify: `src/game/scenes/WorldScene.js`

This is the core gameplay mechanic — the timed pop-up cycle and proximity-based chopping.

- [ ] **Step 1: Implement _startStumpCycle method**

Add after `_createStump`:

```javascript
  _startStumpCycle() {
    const save = loadSave()
    const skill = save.skillLevel
    const popDuration = skill === 'beginner' ? 2000 : skill === 'intermediate' ? 1500 : 1200
    const cycleInterval = skill === 'beginner' ? 2500 : skill === 'intermediate' ? 2000 : 1500
    const activeCount = skill === 'advanced' ? 3 : 2

    this._chopPopDuration = popDuration
    this._chopActiveCount = activeCount

    this._chopCycleTimer = this.time.addEvent({
      delay: cycleInterval,
      loop: true,
      callback: () => this._runStumpCycle(),
    })

    // Run first cycle immediately
    this._runStumpCycle()
  }

  _runStumpCycle() {
    if (!this._chopping || !this._chopStumps) return

    // Hide any currently active stumps
    this._chopStumps.forEach(s => {
      if (s.active) this._hideStumpLetter(s)
    })

    // Pick idle stumps
    const idle = this._chopStumps.filter(s => !s.active)
    if (idle.length === 0) return

    const count = Math.min(this._chopActiveCount, idle.length)
    const chosen = []

    // Shuffle idle stumps
    const shuffled = [...idle].sort(() => Math.random() - 0.5)

    // Determine if correct letter should appear (60% chance, or forced after 2 misses)
    const nextLetter = this._chopWord[this._chopLettersCollected]
    const forceCorrect = this._chopCyclesMissed >= 2
    const showCorrect = forceCorrect || Math.random() < 0.6

    if (showCorrect && count > 0) {
      // First stump gets the correct letter
      const isGolden = this._chopLettersCollected === this._chopGoldenIndex
      this._showStumpLetter(shuffled[0], nextLetter, true, isGolden)
      chosen.push(shuffled[0])
      this._chopCyclesMissed = 0
    } else {
      this._chopCyclesMissed++
    }

    // Fill remaining slots with decoys
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'
    for (let i = chosen.length; i < count; i++) {
      const stump = shuffled[i]
      if (!stump) break
      let decoy
      do {
        decoy = alphabet[Math.floor(Math.random() * 26)]
      } while (decoy === nextLetter)
      this._showStumpLetter(stump, decoy, false, false)
    }

    // Auto-hide after pop duration
    this.time.delayedCall(this._chopPopDuration, () => {
      if (!this._chopping) return
      this._chopStumps.forEach(s => {
        if (s.active) this._hideStumpLetter(s)
      })
    })
  }
```

- [ ] **Step 2: Add show/hide stump letter methods**

```javascript
  _showStumpLetter(stump, letter, isCorrect, isGolden) {
    stump.active = true
    stump.letter = letter
    stump.isCorrect = isCorrect
    stump.isGolden = isGolden

    // Visual: brighten stump
    stump.bg.setFillStyle(isGolden ? 0xffd700 : 0x8d6e63)
    stump.bg.setStrokeStyle(1, isGolden ? 0xffab00 : 0x6d4c41)

    // Show letter with pop-up scale tween
    stump.text.setText(letter)
    stump.text.setVisible(true)
    stump.text.setScale(0)
    stump.text.setAlpha(1)
    stump.text.setColor(isGolden ? '#3e2723' : '#ffffff')

    stump.popTween = this.tweens.add({
      targets: stump.text,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    })

    // Pulse glow on stump
    stump.pulseTween = this.tweens.add({
      targets: stump.bg,
      alpha: 0.7,
      duration: 400,
      yoyo: true,
      repeat: -1,
    })
  }

  _hideStumpLetter(stump) {
    if (!stump.active) return
    stump.active = false

    // Stop tweens
    if (stump.popTween) { stump.popTween.stop(); stump.popTween = null }
    if (stump.pulseTween) { stump.pulseTween.stop(); stump.pulseTween = null }

    // Scale down letter
    stump.hideTween = this.tweens.add({
      targets: stump.text,
      scale: 0,
      duration: 150,
      onComplete: () => {
        stump.text.setVisible(false)
        stump.text.setText('')
        stump.hideTween = null
      },
    })

    // Reset stump appearance
    stump.bg.setFillStyle(0x5d4037)
    stump.bg.setStrokeStyle(1, 0x3e2723)
    stump.bg.setAlpha(1)
    stump.letter = null
    stump.isCorrect = false
    stump.isGolden = false
  }
```

- [ ] **Step 3: Add _chopStump method for proximity collection**

```javascript
  _chopStump(stump) {
    if (!stump.active) return

    const nextLetter = this._chopWord[this._chopLettersCollected]

    if (stump.isCorrect && stump.letter === nextLetter) {
      // Correct chop!
      const isGolden = stump.isGolden
      if (isGolden) this._chopFoundGolden = true

      // Stop stump tweens
      if (stump.popTween) stump.popTween.stop()
      if (stump.pulseTween) stump.pulseTween.stop()
      stump.active = false

      // Wood chip particles
      for (let p = 0; p < 4; p++) {
        const chip = this.add.rectangle(stump.x, stump.y, 4, 3, 0xa1887f)
        chip.setDepth(97)
        this.tweens.add({
          targets: chip,
          x: stump.x + (Math.random() - 0.5) * 30,
          y: stump.y - 10 - Math.random() * 15,
          alpha: 0, angle: Math.random() * 360,
          duration: 400 + Math.random() * 200,
          onComplete: () => chip.destroy(),
        })
      }

      // Split animation: squish + green flash
      stump.bg.setFillStyle(0x4caf50)
      this.tweens.add({
        targets: stump.bg,
        scaleX: 0.5,
        duration: 150,
        yoyo: true,
        onComplete: () => {
          stump.bg.setFillStyle(0x5d4037)
          stump.bg.setStrokeStyle(1, 0x3e2723)
          stump.bg.setAlpha(1)
          stump.bg.setScale(1)
        },
      })

      // Letter flies up and fades
      this.tweens.add({
        targets: stump.text,
        y: stump.y - 20, alpha: 0, scale: 1.5,
        duration: 400,
        onComplete: () => {
          stump.text.setVisible(false)
          stump.text.setPosition(stump.x, stump.y)
          stump.text.setScale(1)
          stump.text.setAlpha(1)
          stump.text.setText('')
        },
      })

      stump.letter = null
      stump.isCorrect = false
      stump.isGolden = false

      this._chopLettersCollected++
      EventBus.emit('chop-letter-collect', {
        letter: nextLetter,
        index: this._chopLettersCollected - 1,
        isGolden,
        isCorrect: true,
      })

      // Speak the letter
      try {
        const audioSave = loadSave()
        if (audioSave.audioEnabled) {
          window.speechSynthesis.cancel()
          const utt = new SpeechSynthesisUtterance(nextLetter)
          utt.rate = 0.9
          utt.pitch = 1.2
          window.speechSynthesis.speak(utt)
        }
      } catch (_) { /* speech not available */ }

      if (this._chopLettersCollected >= this._chopWord.length) {
        this._completeChopWord()
      }
    } else {
      // Wrong chop
      this._chopWrongCount++
      EventBus.emit('chop-letter-collect', {
        letter: stump.letter,
        index: -1,
        isGolden: false,
        isCorrect: false,
      })

      // Red shake animation
      const origX = stump.bg.x
      stump.bg.setFillStyle(0xd32f2f)
      this.tweens.add({
        targets: [stump.bg, stump.text],
        x: origX + 3,
        duration: 50,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          stump.bg.x = origX
          stump.text.x = origX
          if (stump.active) {
            stump.bg.setFillStyle(stump.isGolden ? 0xffd700 : 0x8d6e63)
          }
        },
      })
    }
  }
```

- [ ] **Step 4: Add proximity checks in update()**

In the `update()` method, find the existing pond proximity checks. Add after them (before the closing `}` of `update()`):

```javascript
    // --- chop stump proximity ---
    if (this._chopping && this._chopStumps) {
      this._chopStumps.forEach(stump => {
        if (!stump.active) return
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, stump.x, stump.y)
        if (dist < 18) {
          this._chopStump(stump)
        }
      })

      // Early exit via axe sprite
      if (this._chopEdge) {
        const exitDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this._chopEdge.x + 24, this._chopEdge.y)
        if (exitDist < 12) {
          this._exitChop(false)
        }
      }
    }
```

- [ ] **Step 5: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/game/scenes/WorldScene.js
git commit -m "feat(chop): implement stump pop-up cycle and letter chopping mechanics"
```

---

### Task 7: Implement chop word completion and exit

**Files:**
- Modify: `src/game/scenes/WorldScene.js`

- [ ] **Step 1: Implement _completeChopWord method**

Add after `_chopStump`:

```javascript
  _completeChopWord() {
    this.player.setBlocked(true)

    // Stop the cycle timer
    if (this._chopCycleTimer) {
      this._chopCycleTimer.remove()
      this._chopCycleTimer = null
    }

    // Hide all active stumps
    if (this._chopStumps) {
      this._chopStumps.forEach(s => {
        if (s.active) this._hideStumpLetter(s)
      })
    }

    // "Timber!" celebration text
    const timberText = this.add.text(this._chopCenter.x, this._chopCenter.y - 30, 'Timber!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffeb3b',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(110).setScale(0)

    this.tweens.add({
      targets: timberText, scale: 1, y: timberText.y - 10,
      duration: 500, ease: 'Bounce.easeOut',
    })
    this.tweens.add({
      targets: timberText, alpha: 0,
      duration: 500, delay: 1000,
      onComplete: () => timberText.destroy(),
    })

    // Stumps celebration bounce
    if (this._chopStumps) {
      this._chopStumps.forEach(s => {
        this.tweens.add({
          targets: s.bg, y: s.y - 6,
          duration: 200, yoyo: true,
          ease: 'Bounce.easeOut',
        })
      })
    }

    // Calculate hearts
    let hearts
    let save = loadSave()
    if (save.activeMission && save.activeMission.type === 'chop') {
      if (this._chopWrongCount <= 1) hearts = 3
      else if (this._chopWrongCount <= 3) hearts = 2
      else hearts = 1
      save.activeMission = null
    } else {
      hearts = 1
    }
    if (this._chopFoundGolden) hearts++

    save.treesChopped = (save.treesChopped || 0) + 1
    save.treesChoppedToday = (save.treesChoppedToday || 0) + 1
    if (this._chopFoundGolden) {
      save.goldenLettersFound = (save.goldenLettersFound || 0) + 1
    }

    save = addDailyHearts(save, hearts)
    save = incrementQuestProgress(save)
    writeSave(save)
    EventBus.emit('save-updated')
    EventBus.emit('hearts-earned', {
      amount: hearts,
      screenX: this.scale.width / 2,
      screenY: this.scale.height / 2,
    })

    // Check daily cap
    if (isDailyCapped(save)) {
      EventBus.emit('daily-cap-reached')
    }

    EventBus.emit('chop-word-complete', { word: this._chopWord, heartsEarned: hearts })

    this.time.delayedCall(1200, () => {
      this._exitChop(true)
    })
  }
```

- [ ] **Step 2: Implement _exitChop method**

Add after `_completeChopWord`:

```javascript
  _exitChop(completed) {
    // Stop cycle timer
    if (this._chopCycleTimer) {
      this._chopCycleTimer.remove()
      this._chopCycleTimer = null
    }

    // Destroy all stumps
    if (this._chopStumps) {
      this._chopStumps.forEach(stump => {
        if (stump.popTween) stump.popTween.stop()
        if (stump.pulseTween) stump.pulseTween.stop()
        if (stump.hideTween) stump.hideTween.stop()
        if (stump.bg && stump.bg.scene) stump.bg.destroy()
        if (stump.text && stump.text.scene) stump.text.destroy()
      })
      this._chopStumps = null
    }

    // Clear chop mode
    this.player.clearChopMode()
    this._chopping = false

    // Re-enable collision
    if (this._collider) this._collider.active = true

    // Move player to Timber's position
    this.player.setPosition(this._chopEdge.x, this._chopEdge.y)
    this.player.setBlocked(false)

    // Show arrow again
    if (this._playerArrow) this._playerArrow.setVisible(true)

    EventBus.emit('chop-exit', { completed })
  }
```

- [ ] **Step 3: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/game/scenes/WorldScene.js
git commit -m "feat(chop): implement word completion, scoring, and zone exit cleanup"
```

---

### Task 8: Add chop mission variant to TaskBubble

**Files:**
- Modify: `src/ui/components/TaskBubble/TaskBubble.jsx`

- [ ] **Step 1: Add 20% chop mission branch**

In `src/ui/components/TaskBubble/TaskBubble.jsx`, find the pond mission block (lines 57-77). Add after it (before `const bank = BANKS[save.skillLevel]` on line 79):

```javascript
      // 20% chance of chop mission request
      if (Math.random() < 0.2 && !save.activeMission) {
        const bank = BANKS[save.skillLevel]
        const wordEntry = bank[Math.floor(Math.random() * bank.length)]
        const chopMission = {
          type: 'chop',
          word: wordEntry.word.toLowerCase(),
          emoji: wordEntry.emoji || '',
          npcId,
          npcName,
        }
        const updated = { ...save, activeMission: chopMission }
        writeSave(updated)
        EventBus.emit('save-updated')
        setInteraction({
          npcId, npcName, screenX, screenY,
          chopRequest: wordEntry.word,
        })
        EventBus.emit('task-open')
        return
      }
```

- [ ] **Step 2: Add chop request rendering**

Find the `if (interaction?.pondRequest)` block (lines 178-195). Add after it:

```jsx
  if (interaction?.chopRequest) {
    return (
      <div className={styles.overlay}>
        <div className={styles.bubble}>
          <div className={styles.npcHeader}>
            <span>{interaction.npcName} says:</span>
          </div>
          <div className={styles.praise}>
            Can you chop me some wood with &quot;{interaction.chopRequest}&quot; carved in it?
          </div>
          <button className={styles.dismiss} onClick={handleDismiss}
            style={{ position: 'relative', width: '100%', marginTop: 8, fontSize: '8px', padding: '10px' }}>
            OK, I&apos;ll go chop!
          </button>
        </div>
      </div>
    )
  }
```

- [ ] **Step 3: Verify build passes**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/ui/components/TaskBubble/TaskBubble.jsx
git commit -m "feat(chop): add 20% chop mission variant to NPC interactions"
```

---

### Task 9: Final testing, build verification, and push

**Files:**
- All modified files

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (including new treeCutting tests)

- [ ] **Step 2: Run production build**

Run: `npx vite build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Manual smoke test checklist**

Verify in browser (`npx vite dev`):
- [ ] Timber NPC visible near bottom-left trees with brown tint and "Timber" label
- [ ] Clicking Timber shows welcome dialogue first time
- [ ] Second click enters chop zone with "CHOP!" text and screen shake
- [ ] Player teleported with brown tint, bounded to zone
- [ ] ChopHUD appears with word + emoji (yellow flash, then blanks)
- [ ] Stumps show letters on timed cycle (2 at a time for beginner)
- [ ] Walking to correct letter chops it (green flash, letter fills in HUD)
- [ ] Walking to wrong letter shakes stump (red flash)
- [ ] All letters spelled shows "Timber!" celebration
- [ ] Hearts awarded and save updated
- [ ] Player exits zone, collision re-enabled
- [ ] Early exit via axe sprite works
- [ ] Daily cap check works (blocks entry when capped)

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "feat(chop): tree cutting mini-game complete"
```

- [ ] **Step 5: Push to remote**

```bash
git push origin feat/library
```
