# Pond Swimming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pond swimming mini-game where players collect floating letter tiles to spell words, earning hearts.

**Architecture:** Bubbles the frog NPC sits at the first pond edge in WorldScene. On interact, the player enters a swim mode within WorldScene (no scene transition). Letter tiles spawn as physics sprites in the pond area. A React PondHUD shows the target word with blank slots. Collection triggers EventBus events that React listens to.

**Tech Stack:** Phaser 3 (swim bounds, letter tile sprites, particle effects), React (PondHUD overlay), EventBus (Phaser↔React), saveSystem (pond stats), Web Speech API (letter speech).

**Spec:** `docs/superpowers/specs/2026-03-22-pond-swimming-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/logic/saveSystem.js` | Modify | Add `pondWordsSpelled`, `pondWordsToday`, `goldenLettersFound` to DEFAULT_SAVE |
| `src/game/entities/Player.js` | Modify | Add `setSwimMode()` and `clearSwimMode()` methods for swim bounds + visual effects |
| `src/game/scenes/WorldScene.js` | Modify | Add Bubbles NPC, pond interaction zone, swim entry/exit sequence, letter tile spawning/collision, swim gameplay loop |
| `src/ui/components/PondHUD/PondHUD.jsx` | Create | React word bar with letter slots during swimming |
| `src/ui/components/PondHUD/PondHUD.module.css` | Create | Styles for PondHUD |
| `src/App.jsx` | Modify | Mount PondHUD component |
| `src/ui/components/TaskBubble/TaskBubble.jsx` | Modify | Add pond mission variant to NPC request system |
| `tests/pondSwimming.test.js` | Create | Tests for pond save data and word selection logic |

---

### Task 1: Add pond save data fields

**Files:**
- Modify: `src/logic/saveSystem.js:1-20`
- Create: `tests/pondSwimming.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/pondSwimming.test.js
import { describe, it, expect } from 'vitest'
import { DEFAULT_SAVE } from '../src/logic/saveSystem'

describe('Pond save data', () => {
  it('DEFAULT_SAVE includes pond fields', () => {
    expect(DEFAULT_SAVE).toHaveProperty('pondWordsSpelled', 0)
    expect(DEFAULT_SAVE).toHaveProperty('pondWordsToday', 0)
    expect(DEFAULT_SAVE).toHaveProperty('goldenLettersFound', 0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pondSwimming.test.js`
Expected: FAIL — `pondWordsSpelled` not found on DEFAULT_SAVE

- [ ] **Step 3: Add pond fields to DEFAULT_SAVE**

In `src/logic/saveSystem.js`, add after `booksRead: []`:

```js
pondWordsSpelled: 0,
pondWordsToday: 0,
goldenLettersFound: 0,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/pondSwimming.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/logic/saveSystem.js tests/pondSwimming.test.js
git commit -m "feat(pond): add pond swimming save data fields"
```

---

### Task 2: Add swim mode to Player entity

**Files:**
- Modify: `src/game/entities/Player.js`

The Player needs `setSwimMode(bounds)` and `clearSwimMode()` methods. Swim mode:
- Applies a blue tint (`0x44aaff`)
- Constrains movement to a rectangular swim bounds area using `Phaser.Math.Clamp` in `update()`
- Stores `_swimBounds` rect and `_swimming` flag

- [ ] **Step 1: Add `setSwimMode` and `clearSwimMode` methods**

After the `setBlocked` method in Player.js, add:

```js
setSwimMode(bounds) {
  this._swimming = true
  this._swimBounds = bounds // { x, y, width, height }
  this.setTint(0x44aaff)
}

clearSwimMode() {
  this._swimming = false
  this._swimBounds = null
  this.clearTint()
}
```

- [ ] **Step 2: Add swim bounds clamping in `update()`**

At the end of the `update()` method, after velocity is set, add:

```js
// Clamp to swim bounds if swimming
if (this._swimming && this._swimBounds) {
  const b = this._swimBounds
  this.x = Phaser.Math.Clamp(this.x, b.x, b.x + b.width)
  this.y = Phaser.Math.Clamp(this.y, b.y, b.y + b.height)
}
```

- [ ] **Step 3: Run all tests to verify nothing breaks**

Run: `npx vitest run`
Expected: All existing tests still pass

- [ ] **Step 4: Commit**

```bash
git add src/game/entities/Player.js
git commit -m "feat(pond): add swim mode to Player entity"
```

---

### Task 3: Add Bubbles NPC and pond interaction zone in WorldScene

**Files:**
- Modify: `src/game/scenes/WorldScene.js`

Bubbles the frog sits at the edge of the first pond (tile position 5,4 → pixel 80,64). The pond area is tiles (5,4) to (9,6) → pixels (80,64) to (160,112). Bubbles sits on the left edge at approximately (72, 80).

When the player gets close to Bubbles and clicks/taps, check guard conditions and either enter swim mode or show a denial message.

- [ ] **Step 1: Add Bubbles frog sprite at pond edge**

In `WorldScene.create()`, after the library door zone section, add:

```js
// --- Bubbles the frog (pond gatekeeper) ---
// First pond: tiles (5,4)-(9,6) → pixels (80,64)-(160,112)
this._pondBounds = { x: 80, y: 64, width: 80, height: 48 }
this._pondCenter = { x: 120, y: 88 }
this._pondEdge = { x: 72, y: 100 } // lily pad exit point

const bubbles = this.add.sprite(72, 80, 'npc_mayor_hop', 8)
bubbles.setTint(0x4caf50)
bubbles.setScale(0.7)
bubbles.setDepth(90)
this.add.text(72, 64, 'Bubbles', {
  fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ffffff',
  stroke: '#000000', strokeThickness: 2,
}).setOrigin(0.5, 1).setDepth(91)

// Interaction zone around Bubbles
const bubblesZone = this.add.zone(72, 80, 40, 40)
this.physics.add.existing(bubblesZone, true)
this._bubblesZone = bubblesZone
this._swimming = false

this.physics.add.overlap(this.player, bubblesZone, () => {
  if (this._swimming || this._bubblesTriggered) return
  this._bubblesTriggered = true
  this._tryEnterPond()
})
```

- [ ] **Step 2: Add `_tryEnterPond()` method**

```js
_tryEnterPond() {
  const save = loadSave()

  // Guard checks
  if (this._swimming) {
    this._bubblesTriggered = false
    return
  }
  if (save.activeMission && save.activeMission.type !== 'pond') {
    EventBus.emit('pond-denied', { reason: 'active-mission' })
    this._bubblesTriggered = false
    return
  }
  if (isDailyCapped(save)) {
    EventBus.emit('pond-denied', { reason: 'daily-cap' })
    this._bubblesTriggered = false
    return
  }

  this._enterPond(save)
}
```

Import `isDailyCapped` from `../../logic/sessionManager` at the top of the file (it's already used in TaskBubble so it exists).

- [ ] **Step 3: Run the app to verify Bubbles appears**

Run: `npm run dev`
Navigate to the pond area. Bubbles frog should be visible at the pond edge.

- [ ] **Step 4: Commit**

```bash
git add src/game/scenes/WorldScene.js
git commit -m "feat(pond): add Bubbles frog NPC and pond interaction zone"
```

---

### Task 4: Implement pond entry sequence and letter tile spawning

**Files:**
- Modify: `src/game/scenes/WorldScene.js`

This is the core swim gameplay. On entry:
1. Teleport player to pond center
2. Screen shake + splash effects
3. Apply swim mode to player
4. Select a word, spawn letter tiles + decoys
5. Emit `pond-enter` event for React HUD

Word selection reuses the same word banks from `src/data/words/`. Pick a random word from the player's skill level bank.

- [ ] **Step 1: Add `_enterPond()` method**

```js
_enterPond(save) {
  this._swimming = true
  this.player.setBlocked(true)

  // Teleport to pond center
  this.player.setPosition(this._pondCenter.x, this._pondCenter.y)
  if (this._playerArrow) this._playerArrow.setVisible(false)

  // Screen shake + splash
  this.cameras.main.shake(50, 0.005)

  // Splash text
  const splashText = this.add.text(this._pondCenter.x, this._pondCenter.y - 20, 'SPLASH!', {
    fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffffff',
    stroke: '#2196f3', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(105)
  this.tweens.add({
    targets: splashText, alpha: 0, y: splashText.y - 30,
    duration: 1000, ease: 'Sine.easeOut',
    onComplete: () => splashText.destroy(),
  })

  // Apply swim mode
  this.player.setSwimMode(this._pondBounds)
  this.player.setDepth(100)

  // Wobble tween
  this._wobbleTween = this.tweens.add({
    targets: this.player, angle: 5,
    duration: 400, yoyo: true, repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // Select word
  const banks = {
    beginner: require('../../data/words/beginner.json'),
    intermediate: require('../../data/words/intermediate.json'),
    advanced: require('../../data/words/advanced.json'),
  }

  // Note: use dynamic import or pre-loaded data. Since this is Vite,
  // import the banks at top of file instead:
  // import beginnerBank from '../../data/words/beginner.json'
  // import intermediateBank from '../../data/words/intermediate.json'
  // import advancedBank from '../../data/words/advanced.json'

  const bank = this._wordBanks[save.skillLevel]
  const wordEntry = bank[Math.floor(Math.random() * bank.length)]
  this._pondWord = wordEntry.word.toUpperCase()
  this._pondLettersCollected = 0
  this._pondGoldenIndex = Math.random() < 0.2 ? Math.floor(Math.random() * this._pondWord.length) : -1
  this._pondFoundGolden = false

  // Spawn letter tiles
  this._spawnLetterTiles()

  // Unblock player for swimming
  this.player.setBlocked(false)

  // Emit event for React HUD
  EventBus.emit('pond-enter', { word: this._pondWord })
}
```

At the top of the file, add the word bank imports:

```js
import beginnerBank from '../../data/words/beginner.json'
import intermediateBank from '../../data/words/intermediate.json'
import advancedBank from '../../data/words/advanced.json'
```

In `create()`, store the banks:

```js
this._wordBanks = { beginner: beginnerBank, intermediate: intermediateBank, advanced: advancedBank }
```

- [ ] **Step 2: Add `_spawnLetterTiles()` method**

```js
_spawnLetterTiles() {
  this._letterTiles = []
  const word = this._pondWord
  const bounds = this._pondBounds
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  // Spawn correct letters scattered in pond
  for (let i = 0; i < word.length; i++) {
    const letter = word[i]
    const x = bounds.x + 10 + Math.random() * (bounds.width - 20)
    const y = bounds.y + 10 + Math.random() * (bounds.height - 20)
    const isGolden = i === this._pondGoldenIndex

    const tile = this._createLetterTile(x, y, letter, i, true, isGolden)
    this._letterTiles.push(tile)
  }

  // Spawn 2-3 decoy letters
  const decoyCount = 2 + Math.floor(Math.random() * 2)
  for (let i = 0; i < decoyCount; i++) {
    let decoyLetter
    do {
      decoyLetter = alphabet[Math.floor(Math.random() * 26)]
    } while (word.includes(decoyLetter))

    const x = bounds.x + 10 + Math.random() * (bounds.width - 20)
    const y = bounds.y + 10 + Math.random() * (bounds.height - 20)
    const tile = this._createLetterTile(x, y, decoyLetter, -1, false, false)
    this._letterTiles.push(tile)
  }
}

_createLetterTile(x, y, letter, index, isCorrect, isGolden) {
  // Background rectangle
  const bg = this.add.rectangle(x, y, 18, 18, isGolden ? 0xffd700 : 0x1565c0)
  bg.setStrokeStyle(1, isGolden ? 0xffab00 : 0x0d47a1)
  bg.setDepth(95)
  bg.setAlpha(isCorrect ? 1 : 0.6)

  // Letter text
  const text = this.add.text(x, y, letter, {
    fontFamily: '"Press Start 2P"', fontSize: '9px',
    color: isGolden ? '#3e2723' : '#ffffff',
  }).setOrigin(0.5).setDepth(96)

  // Bob tween
  const bobTween = this.tweens.add({
    targets: [bg, text], y: y - 3,
    duration: 800 + Math.random() * 400,
    yoyo: true, repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // Golden shimmer
  let shimmerTween = null
  if (isGolden) {
    shimmerTween = this.tweens.add({
      targets: bg, alpha: 0.7,
      duration: 500, yoyo: true, repeat: -1,
    })
  }

  return { bg, text, letter, index, isCorrect, isGolden, bobTween, shimmerTween, collected: false }
}
```

- [ ] **Step 3: Add letter collection check in `update()`**

In the `update()` method, add after the delivery completion check:

```js
// Pond letter collection
if (this._swimming && this._letterTiles) {
  this._letterTiles.forEach(tile => {
    if (tile.collected) return
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, tile.bg.x, tile.bg.y
    )
    if (dist < 14) {
      this._collectLetter(tile)
    }
  })
}
```

- [ ] **Step 4: Add `_collectLetter()` method**

```js
_collectLetter(tile) {
  if (tile.collected) return
  tile.collected = true

  if (tile.isCorrect && tile.index === this._pondLettersCollected) {
    // Correct letter in order
    tile.bobTween.stop()
    if (tile.shimmerTween) tile.shimmerTween.stop()

    // Pop effect
    this.tweens.add({
      targets: [tile.bg, tile.text], scale: 1.5, alpha: 0,
      duration: 300, ease: 'Back.easeIn',
      onComplete: () => { tile.bg.destroy(); tile.text.destroy() },
    })

    const isGolden = tile.isGolden
    if (isGolden) this._pondFoundGolden = true

    this._pondLettersCollected++
    EventBus.emit('pond-letter-collect', {
      letter: tile.letter,
      index: tile.index,
      isGolden,
      isCorrect: true,
    })

    // Check word complete
    if (this._pondLettersCollected >= this._pondWord.length) {
      this._completePondWord()
    }
  } else {
    // Wrong letter or out of order — bloop, fade, respawn
    EventBus.emit('pond-letter-collect', {
      letter: tile.letter,
      index: tile.index,
      isGolden: false,
      isCorrect: false,
    })

    // Fade out
    tile.bobTween.stop()
    this.tweens.add({
      targets: [tile.bg, tile.text], alpha: 0,
      duration: 300,
      onComplete: () => {
        // Respawn at new position after 2 seconds
        this.time.delayedCall(2000, () => {
          if (!this._swimming) return
          const b = this._pondBounds
          const nx = b.x + 10 + Math.random() * (b.width - 20)
          const ny = b.y + 10 + Math.random() * (b.height - 20)
          tile.bg.setPosition(nx, ny)
          tile.text.setPosition(nx, ny)
          tile.bg.setAlpha(tile.isCorrect ? 1 : 0.6)
          tile.text.setAlpha(1)
          tile.collected = false
          tile.bobTween = this.tweens.add({
            targets: [tile.bg, tile.text], y: ny - 3,
            duration: 800 + Math.random() * 400,
            yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut',
          })
        })
      },
    })
  }
}
```

- [ ] **Step 5: Run the app to test letter spawning**

Run: `npm run dev`
Walk to pond, interact with Bubbles, verify letters appear and can be collected.

- [ ] **Step 6: Commit**

```bash
git add src/game/scenes/WorldScene.js
git commit -m "feat(pond): implement pond entry sequence and letter tile spawning"
```

---

### Task 5: Implement pond exit (completion and early exit)

**Files:**
- Modify: `src/game/scenes/WorldScene.js`

Two exit paths:
1. **Word completed:** Celebration effect, award hearts, auto-swim to edge, clean up
2. **Early exit (swim to lily pad):** No hearts, clean up

The lily pad is at `_pondEdge` position. If the player swims near it before completing the word, trigger early exit.

- [ ] **Step 1: Add `_completePondWord()` method**

```js
_completePondWord() {
  this.player.setBlocked(true)

  // Celebration text
  const celebText = this.add.text(this._pondCenter.x, this._pondCenter.y - 20, 'Well done!', {
    fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffeb3b',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(110)
  this.tweens.add({
    targets: celebText, alpha: 0, y: celebText.y - 30,
    duration: 1500, onComplete: () => celebText.destroy(),
  })

  // Calculate hearts
  let hearts = 1
  if (this._pondFoundGolden) hearts++

  // Update save
  let save = loadSave()
  save.pondWordsSpelled = (save.pondWordsSpelled || 0) + 1
  save.pondWordsToday = (save.pondWordsToday || 0) + 1
  if (this._pondFoundGolden) {
    save.goldenLettersFound = (save.goldenLettersFound || 0) + 1
  }

  // Add hearts via sessionManager
  save = addDailyHearts(save, hearts)
  save = incrementQuestProgress(save)
  writeSave(save)
  EventBus.emit('save-updated')
  EventBus.emit('hearts-earned', {
    amount: hearts,
    screenX: this.scale.width / 2,
    screenY: this.scale.height / 2,
  })

  EventBus.emit('pond-word-complete', { word: this._pondWord, heartsEarned: hearts })

  // Auto-swim to edge after delay
  this.time.delayedCall(1200, () => {
    this._exitPond(true)
  })
}
```

Import `addDailyHearts` and `incrementQuestProgress` from `../../logic/sessionManager` at the top.

- [ ] **Step 2: Add `_exitPond()` method**

```js
_exitPond(completed) {
  // Clean up letter tiles
  if (this._letterTiles) {
    this._letterTiles.forEach(tile => {
      if (tile.bobTween) tile.bobTween.stop()
      if (tile.shimmerTween) tile.shimmerTween.stop()
      if (tile.bg) tile.bg.destroy()
      if (tile.text) tile.text.destroy()
    })
    this._letterTiles = null
  }

  // Stop wobble
  if (this._wobbleTween) {
    this._wobbleTween.stop()
    this.player.angle = 0
  }

  // Clear swim mode
  this.player.clearSwimMode()
  this._swimming = false
  this._bubblesTriggered = false

  // Move to pond edge
  this.player.setPosition(this._pondEdge.x, this._pondEdge.y)
  this.player.setBlocked(false)

  // Show arrow again
  if (this._playerArrow) this._playerArrow.setVisible(true)

  EventBus.emit('pond-exit', { completed })
}
```

- [ ] **Step 3: Add early exit check in `update()`**

In the `update()` method, after the letter collection check, add:

```js
// Early exit: swim to lily pad area
if (this._swimming && this._pondLettersCollected < this._pondWord.length) {
  const edgeDist = Phaser.Math.Distance.Between(
    this.player.x, this.player.y, this._pondEdge.x, this._pondEdge.y
  )
  if (edgeDist < 12) {
    this._exitPond(false)
  }
}
```

- [ ] **Step 4: Add lily pad visual at pond edge**

In `create()`, after the Bubbles sprite, add:

```js
// Lily pad at exit point
this.add.circle(this._pondEdge.x, this._pondEdge.y, 8, 0x4caf50)
  .setDepth(89).setAlpha(0.8)
this.add.circle(this._pondEdge.x + 2, this._pondEdge.y - 1, 6, 0x66bb6a)
  .setDepth(89).setAlpha(0.7)
```

- [ ] **Step 5: Handle scene shutdown cleanup**

Add to `create()`:

```js
this.events.on('shutdown', () => {
  if (this._swimming) this._exitPond(false)
})
```

- [ ] **Step 6: Run the app and test full swim cycle**

Run: `npm run dev`
Test: Enter pond → collect all letters → verify hearts awarded and exit. Also test early exit via lily pad.

- [ ] **Step 7: Commit**

```bash
git add src/game/scenes/WorldScene.js
git commit -m "feat(pond): implement pond exit, word completion, and heart awards"
```

---

### Task 6: Create PondHUD React component

**Files:**
- Create: `src/ui/components/PondHUD/PondHUD.jsx`
- Create: `src/ui/components/PondHUD/PondHUD.module.css`

The PondHUD shows a word bar at top-center with blank letter slots that fill in as the player collects correct letters.

- [ ] **Step 1: Create PondHUD.module.css**

```css
.container {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 8;
  display: flex;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(13, 71, 161, 0.9);
  border: 2px solid #1565c0;
  border-radius: 8px;
}

.slot {
  width: 28px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #42a5f5;
  border-radius: 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #ffffff;
}

.slot.filled {
  background: rgba(76, 175, 80, 0.6);
  border-color: #66bb6a;
}

.slot.golden {
  background: rgba(255, 215, 0, 0.6);
  border-color: #ffd700;
  color: #3e2723;
}
```

- [ ] **Step 2: Create PondHUD.jsx**

```jsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/components/PondHUD/PondHUD.jsx src/ui/components/PondHUD/PondHUD.module.css
git commit -m "feat(pond): create PondHUD React component"
```

---

### Task 7: Mount PondHUD in App and wire pond denial dialogue

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add PondHUD import and mount**

In `src/App.jsx`, add import:

```js
import { PondHUD } from './ui/components/PondHUD/PondHUD'
```

Mount `<PondHUD />` after `<DeliveryBanner />` in the JSX.

- [ ] **Step 2: Run the app end-to-end**

Run: `npm run dev`
Test the full flow: walk to pond → interact with Bubbles → word bar appears → collect letters → word completes → hearts awarded → HUD disappears.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pond): mount PondHUD in App"
```

---

### Task 8: Add pond mission variant to NPC request system

**Files:**
- Modify: `src/ui/components/TaskBubble/TaskBubble.jsx`

NPC-requested pond missions: any unlocked NPC has a chance to say "I dropped my special word in the pond! Can you swim in and find it?" This sets `activeMission = { type: 'pond', word, npcId, npcName }`.

When the player enters the pond with an active pond mission, the mission word is used instead of a random word.

- [ ] **Step 1: Add pond mission generation in TaskBubble**

In `TaskBubble.jsx`, after the book request branch (line ~55), add a pond request branch:

```js
// 10% chance of pond mission request (after book check)
if (Math.random() < 0.1 && !save.activeMission) {
  const bank = BANKS[save.skillLevel]
  const wordEntry = bank[Math.floor(Math.random() * bank.length)]
  const pondMission = {
    type: 'pond',
    word: wordEntry.word.toUpperCase(),
    npcId,
    npcName,
  }
  const updated = { ...save, activeMission: pondMission }
  writeSave(updated)
  EventBus.emit('save-updated')
  setInteraction({
    npcId, npcName, screenX, screenY,
    pondRequest: wordEntry.word,
  })
  EventBus.emit('task-open')
  return
}
```

- [ ] **Step 2: Add pond request rendering**

After the `bookRequest` render block, add:

```jsx
if (interaction?.pondRequest) {
  return (
    <div className={styles.overlay}>
      <div className={styles.bubble}>
        <div className={styles.npcHeader}>
          <span>{interaction.npcName} says:</span>
        </div>
        <div className={styles.praise}>
          I dropped my special word in the pond! Can you swim in and find it?
        </div>
        <button className={styles.dismiss} onClick={handleDismiss}
          style={{ position: 'relative', width: '100%', marginTop: 8, fontSize: '8px', padding: '10px' }}>
          OK, I&apos;ll go swimming!
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update WorldScene to use mission word**

In `WorldScene._enterPond()`, before selecting a random word, check for active pond mission:

```js
// Check for pond mission word
let pondWord
if (save.activeMission && save.activeMission.type === 'pond') {
  pondWord = save.activeMission.word
} else {
  const bank = this._wordBanks[save.skillLevel]
  const wordEntry = bank[Math.floor(Math.random() * bank.length)]
  pondWord = wordEntry.word.toUpperCase()
}
this._pondWord = pondWord
```

In `_completePondWord()`, clear the pond mission if active:

```js
if (save.activeMission && save.activeMission.type === 'pond') {
  save.activeMission = null
}
```

And award hearts based on mission: 3 hearts for mission (instead of 1), plus golden bonus:

```js
let hearts
if (save.activeMission && save.activeMission.type === 'pond') {
  hearts = 3
  save.activeMission = null
} else {
  hearts = 1
}
if (this._pondFoundGolden) hearts++
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/TaskBubble/TaskBubble.jsx src/game/scenes/WorldScene.js
git commit -m "feat(pond): add NPC pond mission requests"
```

---

### Task 9: Add pond daily reset and integration tests

**Files:**
- Modify: `tests/pondSwimming.test.js`
- Check: `src/logic/sessionManager.js` (verify daily reset includes pondWordsToday)

- [ ] **Step 1: Check sessionManager for daily reset logic**

Read `src/logic/sessionManager.js` and find where `dailyHeartsEarned` is reset. Add `pondWordsToday: 0` to that same reset block.

- [ ] **Step 2: Add pondWordsToday to daily reset**

In `sessionManager.js`, in the daily reset function, add:

```js
save.pondWordsToday = 0
```

- [ ] **Step 3: Write integration tests**

Add to `tests/pondSwimming.test.js`:

```js
describe('Pond word selection', () => {
  it('picks a word from the correct skill level bank', () => {
    // Verify beginner bank has words
    const bank = require('../src/data/words/beginner.json')
    expect(bank.length).toBeGreaterThan(0)
    expect(bank[0]).toHaveProperty('word')
  })

  it('golden letter spawns with 20% probability', () => {
    // Statistical test: run 1000 times, expect ~200 golden
    let goldenCount = 0
    for (let i = 0; i < 1000; i++) {
      if (Math.random() < 0.2) goldenCount++
    }
    expect(goldenCount).toBeGreaterThan(100)
    expect(goldenCount).toBeLessThan(300)
  })
})
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/logic/sessionManager.js tests/pondSwimming.test.js
git commit -m "feat(pond): add daily reset for pondWordsToday and integration tests"
```

---

### Task 10: Final integration testing and cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Manual testing checklist**

Run: `npm run dev`

Test the following:
- Walk to pond → Bubbles visible with name label
- Approach Bubbles → swim entry triggers
- Letters spawn in pond with bobbing animation
- Collecting correct letter in order → fills HUD slot
- Collecting wrong letter → fades and respawns
- Collecting all letters → celebration, hearts awarded, exit
- Swimming to lily pad → early exit, no hearts
- PondHUD appears/disappears correctly
- Golden letter (may need multiple attempts) → extra heart

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "feat(pond): final integration fixes"
```

- [ ] **Step 5: Push to remote**

```bash
git push origin feat/library
```
