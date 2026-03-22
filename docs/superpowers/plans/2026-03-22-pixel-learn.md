# pixel-learn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based pixel art word-learning game for ages 5–10 using Phaser 3 + React + Vite, deployable as a static site.

**Architecture:** Phaser 3 renders the game world on a `<canvas>`; React overlays a transparent `<div>` for all UI (task bubbles, HUD, settings). The two layers communicate via a shared EventBus — Phaser emits events, React listens and updates. All game state (hearts, unlocks, save) lives in localStorage via a `saveSystem` module.

**Tech Stack:** Phaser 3, React 18, Vite, Vitest, Web Speech API, localStorage

---

## Progress Tracker

Update this table as tasks complete. Check the box and add the date.

| Task | Description | Status | Done |
|------|-------------|--------|------|
| 1 | Project scaffold (Vite + React + Phaser) | ⬜ Pending | |
| 2 | EventBus + PhaserGame component | ⬜ Pending | |
| 3 | Save system (localStorage + save codes) | ⬜ Pending | |
| 4 | Session manager (daily cap + quest) | ⬜ Pending | |
| 5 | Progression engine (unlock thresholds) | ⬜ Pending | |
| 6 | Word selector + distractor generator | ⬜ Pending | |
| 7 | Word bank data files + NPC definitions | ⬜ Pending | |
| 8 | Audio service (Web Speech API) | ⬜ Pending | |
| 9 | Phaser scenes: Boot + Splash | ⬜ Pending | |
| 10 | World scene: map, player, camera | ⬜ Pending | |
| 11 | React overlay + HUD | ⬜ Pending | |
| 12 | Task bubble: Beginner level | ⬜ Pending | |
| 13 | Task bubble: Intermediate + Advanced | ⬜ Pending | |
| 14 | Mayor Hop messages + daily cap + quest | ⬜ Pending | |
| 15 | Unlock modal | ⬜ Pending | |
| 16 | Parent settings screen | ⬜ Pending | |
| 17 | Mobile D-pad | ⬜ Pending | |
| 18 | Full test suite + smoke test | ⬜ Pending | |
| 19 | Deploy to GitHub Pages | ⬜ Pending | |

---

## File Map

```
pixel-learn/
  src/
    game/
      scenes/
        BootScene.js        ← preload all assets
        SplashScene.js      ← "Tap to Start" + Mayor Hop intro/welcome
        WorldScene.js       ← tilemap, player movement, camera, NPC click
      entities/
        Player.js           ← player sprite, WASD/arrow movement, D-pad input
        NPC.js              ← NPC sprite, idle animation, locked state, click handler
      systems/
        UnlockSystem.js     ← checks heart thresholds, fires unlock events
        SessionSystem.js    ← daily cap tracking, quest tracking, midnight reset
      EventBus.js           ← Phaser EventEmitter singleton shared with React
      PhaserGame.jsx        ← React component that mounts the Phaser game instance
    ui/
      components/
        TaskBubble/
          TaskBubble.jsx        ← container: positions bubble, renders correct variant
          TaskBubble.module.css ← pixel art bubble styles
          BeginnerTask.jsx      ← 3-choice picture tap
          IntermediateTask.jsx  ← fill-in-missing-letter
          AdvancedTask.jsx      ← scrambled tile arrangement
        HUD/
          HUD.jsx               ← hearts icon + count, always visible
          QuestBanner.jsx       ← "Today's Quest: N/M villagers helped"
          HUD.module.css
        MayorHopMessage/
          MayorHopMessage.jsx   ← full-screen NPC message overlay (welcome, cap, quest)
          MayorHopMessage.module.css
        UnlockModal/
          UnlockModal.jsx       ← sequential unlock celebration overlay
          UnlockModal.module.css
        ParentSettings/
          ParentSettings.jsx    ← settings screen (skill, audio, cap, save code)
          ParentSettings.module.css
      App.jsx                   ← root React component, renders overlay + PhaserGame
    logic/
      wordSelector.js           ← word bank filtering + recency exclusion
      saveSystem.js             ← localStorage read/write + base64 save code
      progressionEngine.js      ← unlock threshold checks from heart total
      sessionManager.js         ← daily cap + quest state + midnight reset
      audioService.js           ← Web Speech API wrapper
      distractorGenerator.js    ← Intermediate: generate phonetic wrong letters
    data/
      words/
        beginner.json           ← word bank for Beginner
        intermediate.json       ← word bank for Intermediate
        advanced.json           ← word bank for Advanced
      npcs.js                   ← NPC definitions: id, name, sprite, position, wordTheme
    assets/
      sprites/                  ← PNG pixel art sprites (player, NPCs, tiles, UI)
      tilemaps/                 ← Tiled JSON map + tileset PNGs
      audio/                    ← oops.mp3, success.mp3, fanfare.mp3, unlock.mp3
    main.jsx                    ← React root, mounts <App />
    index.css                   ← global: pixel font import, touch-action: none, reset
  public/
    index.html                  ← viewport meta, no-zoom, app mount point
  tests/
    wordSelector.test.js
    saveSystem.test.js
    progressionEngine.test.js
    sessionManager.test.js
    distractorGenerator.test.js
  vite.config.js
  package.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `public/index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite + React project**

```bash
cd /Users/emsot/Projects/kids-games/pixel-learn
npm create vite@latest . -- --template react
```

Expected: `package.json`, `src/`, `public/` created.

- [ ] **Step 2: Install dependencies**

```bash
npm install phaser
npm install -D vitest @vitest/ui jsdom
```

- [ ] **Step 3: Configure Vite**

Replace `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  base: './', // relative paths for GitHub Pages
})
```

- [ ] **Step 4: Update `public/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>pixel-learn</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Set up global CSS in `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #000;
  overflow: hidden;
  font-family: 'Press Start 2P', monospace;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

canvas {
  display: block;
  touch-action: none; /* prevents iOS scroll on canvas */
}
```

- [ ] **Step 6: Wire up `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

- [ ] **Step 7: Add vitest script to `package.json`**

In the `scripts` section, add:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: blank page at `http://localhost:5173` with no console errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + Phaser project"
```

---

## Task 2: EventBus + PhaserGame Component

**Files:**
- Create: `src/game/EventBus.js`, `src/game/PhaserGame.jsx`, `src/App.jsx`

- [ ] **Step 1: Create `src/game/EventBus.js`**

This is the Phaser→React communication bridge. Phaser scenes emit events here; React components listen here.

```js
import Phaser from 'phaser'

// Singleton EventEmitter shared between Phaser and React
export const EventBus = new Phaser.Events.EventEmitter()
```

- [ ] **Step 2: Create `src/game/PhaserGame.jsx`**

```jsx
import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { SplashScene } from './scenes/SplashScene'
import { WorldScene } from './scenes/WorldScene'

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 320,
  pixelArt: true,
  backgroundColor: '#2d5a27',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, SplashScene, WorldScene],
}

export function PhaserGame() {
  const gameRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (gameRef.current) return
    gameRef.current = new Phaser.Game({ ...config, parent: containerRef.current })
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
}
```

- [ ] **Step 3: Create stub `src/App.jsx`**

```jsx
import { PhaserGame } from './game/PhaserGame'

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PhaserGame />
      {/* React UI overlay goes here in later tasks */}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add EventBus and PhaserGame component"
```

---

## Task 3: Save System

**Files:**
- Create: `src/logic/saveSystem.js`, `tests/saveSystem.test.js`

The save system is pure logic — no Phaser dependency. Test it first.

- [ ] **Step 1: Write failing tests**

Create `tests/saveSystem.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { loadSave, writeSave, exportCode, importCode, DEFAULT_SAVE } from '../src/logic/saveSystem'

beforeEach(() => localStorage.clear())

describe('loadSave', () => {
  it('returns DEFAULT_SAVE when nothing stored', () => {
    expect(loadSave()).toEqual(DEFAULT_SAVE)
  })

  it('returns stored save when present', () => {
    const save = { ...DEFAULT_SAVE, totalHearts: 5 }
    localStorage.setItem('pixellearn_save', JSON.stringify(save))
    expect(loadSave().totalHearts).toBe(5)
  })
})

describe('writeSave', () => {
  it('persists save to localStorage', () => {
    const save = { ...DEFAULT_SAVE, totalHearts: 3 }
    writeSave(save)
    expect(JSON.parse(localStorage.getItem('pixellearn_save')).totalHearts).toBe(3)
  })
})

describe('exportCode / importCode', () => {
  it('round-trips save data', () => {
    const save = { ...DEFAULT_SAVE, totalHearts: 42 }
    const code = exportCode(save)
    expect(importCode(code).totalHearts).toBe(42)
  })

  it('returns null for invalid code', () => {
    expect(importCode('not-valid-base64!!!')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- saveSystem
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/logic/saveSystem.js`**

```js
const KEY = 'pixellearn_save'

export const DEFAULT_SAVE = {
  totalHearts: 0,
  unlockedNpcs: ['mayor-hop', 'blaze', 'biscuit', 'doodle', 'mittens', 'professor-hoot'],
  firedThresholds: [],
  skillLevel: 'beginner',       // 'beginner' | 'intermediate' | 'advanced'
  audioEnabled: null,           // null = use skill-level default, true/false = explicit override
  dailyHeartCap: 10,
  // daily reset fields
  dailyDate: '',                // ISO date string of last reset
  dailyHeartsEarned: 0,
  dailyQuestProgress: 0,
  dailyQuestComplete: false,
  isFirstPlay: true,
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SAVE }
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SAVE }
  }
}

export function writeSave(save) {
  localStorage.setItem(KEY, JSON.stringify(save))
}

export function exportCode(save) {
  return btoa(JSON.stringify(save))
}

export function importCode(code) {
  try {
    return { ...DEFAULT_SAVE, ...JSON.parse(atob(code)) }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- saveSystem
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: save system with localStorage and base64 save codes"
```

---

## Task 4: Session Manager (Daily Cap + Quest)

**Files:**
- Create: `src/logic/sessionManager.js`, `tests/sessionManager.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/sessionManager.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkDailyReset, getQuestTarget, addDailyHearts, incrementQuestProgress } from '../src/logic/sessionManager'
import { DEFAULT_SAVE } from '../src/logic/saveSystem'

describe('checkDailyReset', () => {
  it('resets daily fields when date has changed', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', dailyHeartsEarned: 8, dailyQuestProgress: 2 }
    const result = checkDailyReset(save, '2026-01-02')
    expect(result.dailyHeartsEarned).toBe(0)
    expect(result.dailyQuestProgress).toBe(0)
    expect(result.dailyDate).toBe('2026-01-02')
  })

  it('does not reset when date matches', () => {
    const save = { ...DEFAULT_SAVE, dailyDate: '2026-01-01', dailyHeartsEarned: 5 }
    expect(checkDailyReset(save, '2026-01-01').dailyHeartsEarned).toBe(5)
  })
})

describe('getQuestTarget', () => {
  it('returns 2 for beginner', () => expect(getQuestTarget('beginner')).toBe(2))
  it('returns 3 for intermediate', () => expect(getQuestTarget('intermediate')).toBe(3))
  it('returns 4 for advanced', () => expect(getQuestTarget('advanced')).toBe(4))
})

describe('addDailyHearts', () => {
  it('adds hearts to daily and total', () => {
    const save = { ...DEFAULT_SAVE, dailyHeartsEarned: 3, totalHearts: 10 }
    const result = addDailyHearts(save, 2)
    expect(result.dailyHeartsEarned).toBe(5)
    expect(result.totalHearts).toBe(12)
  })
})

describe('incrementQuestProgress', () => {
  it('increments quest progress', () => {
    const save = { ...DEFAULT_SAVE, dailyQuestProgress: 1 }
    expect(incrementQuestProgress(save).dailyQuestProgress).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- sessionManager
```

- [ ] **Step 3: Implement `src/logic/sessionManager.js`**

```js
export function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export function checkDailyReset(save, today = todayString()) {
  if (save.dailyDate === today) return save
  return {
    ...save,
    dailyDate: today,
    dailyHeartsEarned: 0,
    dailyQuestProgress: 0,
    dailyQuestComplete: false,
  }
}

export function getQuestTarget(skillLevel) {
  return { beginner: 2, intermediate: 3, advanced: 4 }[skillLevel] ?? 3
}

export function addDailyHearts(save, amount) {
  return {
    ...save,
    dailyHeartsEarned: save.dailyHeartsEarned + amount,
    totalHearts: save.totalHearts + amount,
  }
}

export function incrementQuestProgress(save) {
  return { ...save, dailyQuestProgress: save.dailyQuestProgress + 1 }
}

export function isDailyCapped(save) {
  return save.dailyHeartsEarned >= save.dailyHeartCap
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- sessionManager
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: session manager for daily cap and quest tracking"
```

---

## Task 5: Progression Engine (Unlocks)

**Files:**
- Create: `src/logic/progressionEngine.js`, `tests/progressionEngine.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/progressionEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getNewUnlocks, UNLOCK_THRESHOLDS } from '../src/logic/progressionEngine'

describe('getNewUnlocks', () => {
  it('returns empty array when no new thresholds crossed', () => {
    const save = { totalHearts: 5, firedThresholds: [] }
    expect(getNewUnlocks(save)).toEqual([])
  })

  it('returns Coach Roar unlock at 10 hearts', () => {
    const save = { totalHearts: 10, firedThresholds: [] }
    const unlocks = getNewUnlocks(save)
    expect(unlocks).toHaveLength(1)
    expect(unlocks[0].npcId).toBe('coach-roar')
  })

  it('returns multiple unlocks when jumping over thresholds', () => {
    const save = { totalHearts: 36, firedThresholds: [] }
    const unlocks = getNewUnlocks(save)
    expect(unlocks.map(u => u.npcId)).toEqual(['coach-roar', 'mossy', 'clover'])
  })

  it('skips already-fired thresholds', () => {
    const save = { totalHearts: 25, firedThresholds: [10, 20] }
    expect(getNewUnlocks(save)).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- progressionEngine
```

- [ ] **Step 3: Implement `src/logic/progressionEngine.js`**

```js
// Thresholds in ascending order. points = totalHearts (1 heart = 1 point).
export const UNLOCK_THRESHOLDS = [
  { points: 10, npcId: 'coach-roar',     name: 'Coach Roar',     location: 'Sports Centre' },
  { points: 20, npcId: 'mossy',          name: 'Mossy',          location: 'Garden' },
  { points: 35, npcId: 'clover',         name: 'Clover',         location: 'Villager House 2' },
  { points: 50, npcId: 'ripple',         name: 'Ripple',         location: 'Pond' },
  { points: 70, npcId: 'mystery-hut',   name: 'Mystery Hut',    location: 'Mystery Hut' },
]

/**
 * Returns array of threshold objects that should now fire,
 * in ascending order (for sequential animation).
 */
export function getNewUnlocks(save) {
  return UNLOCK_THRESHOLDS.filter(t =>
    save.totalHearts >= t.points && !save.firedThresholds.includes(t.points)
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- progressionEngine
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: progression engine with unlock threshold checks"
```

---

## Task 6: Word Selector + Distractor Generator

**Files:**
- Create: `src/logic/wordSelector.js`, `src/logic/distractorGenerator.js`
- Create: `tests/wordSelector.test.js`, `tests/distractorGenerator.test.js`

- [ ] **Step 1: Write failing tests for wordSelector**

Create `tests/wordSelector.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { selectWord } from '../src/logic/wordSelector'

const bank = [
  { word: 'cat', emoji: '🐱', npcIds: ['ripple', 'blaze'], distractors: ['bat', 'hat'] },
  { word: 'dog', emoji: '🐶', npcIds: ['ripple'],          distractors: ['fog', 'log'] },
  { word: 'fish', emoji: '🐟', npcIds: ['ripple'],         distractors: ['dish', 'wish'] },
  { word: 'bird', emoji: '🐦', npcIds: ['ripple'],         distractors: ['word', 'herd'] },
]

describe('selectWord', () => {
  it('only selects words matching the npcId', () => {
    const word = selectWord(bank, 'blaze', [])
    expect(word.word).toBe('cat') // only match for blaze
  })

  it('excludes recently shown words', () => {
    const word = selectWord(bank, 'ripple', ['cat', 'dog', 'fish'])
    expect(word.word).toBe('bird')
  })

  it('relaxes exclusion when list is too small', () => {
    // Only 1 word for blaze — recency cannot exclude it
    const word = selectWord(bank, 'blaze', ['cat', 'cat', 'cat'])
    expect(word.word).toBe('cat')
  })

  it('returns null when no words exist for npcId', () => {
    expect(selectWord(bank, 'unknown-npc', [])).toBeNull()
  })
})
```

- [ ] **Step 2: Write failing tests for distractorGenerator**

Create `tests/distractorGenerator.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { generateIntermediateOptions } from '../src/logic/distractorGenerator'

describe('generateIntermediateOptions', () => {
  it('returns 3 options including the correct letter', () => {
    const options = generateIntermediateOptions('cat', 1) // missing index 1 = 'a'
    expect(options).toHaveLength(3)
    expect(options).toContain('a')
  })

  it('returns unique options', () => {
    const options = generateIntermediateOptions('cat', 1)
    expect(new Set(options).size).toBe(3)
  })
})
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm test -- wordSelector distractorGenerator
```

- [ ] **Step 4: Implement `src/logic/wordSelector.js`**

```js
const RECENCY_LIMIT = 3

export function selectWord(bank, npcId, recentWords) {
  const eligible = bank.filter(w => w.npcIds.includes(npcId))
  if (eligible.length === 0) return null

  // Relax exclusion if it would exhaust the list
  const exclusion = eligible.length <= RECENCY_LIMIT
    ? recentWords.slice(0, Math.max(0, eligible.length - 1))
    : recentWords.slice(0, RECENCY_LIMIT)

  const candidates = eligible.filter(w => !exclusion.includes(w.word))
  const pool = candidates.length > 0 ? candidates : eligible
  return pool[Math.floor(Math.random() * pool.length)]
}
```

- [ ] **Step 5: Implement `src/logic/distractorGenerator.js`**

```js
const VOWELS = ['a', 'e', 'i', 'o', 'u']
const COMMON_CONSONANTS = ['b', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w']

export function generateIntermediateOptions(word, missingIndex) {
  const correct = word[missingIndex]
  const isVowel = VOWELS.includes(correct)
  const pool = isVowel ? VOWELS : COMMON_CONSONANTS
  const others = pool.filter(l => l !== correct)

  const distractors = []
  while (distractors.length < 2) {
    const pick = others[Math.floor(Math.random() * others.length)]
    if (!distractors.includes(pick)) distractors.push(pick)
  }

  // Shuffle correct into a random position
  const options = [correct, ...distractors]
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]]
  }
  return options
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm test -- wordSelector distractorGenerator
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: word selector and distractor generator"
```

---

## Task 7: Word Bank Data Files + NPC Definitions

**Files:**
- Create: `src/data/words/beginner.json`, `src/data/words/intermediate.json`, `src/data/words/advanced.json`
- Create: `src/data/npcs.js`

- [ ] **Step 1: Create `src/data/words/beginner.json`**

Beginner words: short CVC words (3 letters), themed by NPC. Include at least 5 words per NPC.

```json
[
  { "word": "cat",  "emoji": "🐱", "npcIds": ["ripple", "mittens"], "distractors": ["bat", "hat"] },
  { "word": "dog",  "emoji": "🐶", "npcIds": ["ripple", "mittens"], "distractors": ["fog", "log"] },
  { "word": "fish", "emoji": "🐟", "npcIds": ["ripple"],            "distractors": ["dish", "wish"] },
  { "word": "frog", "emoji": "🐸", "npcIds": ["ripple", "mayor-hop"], "distractors": ["blog", "clog"] },
  { "word": "bird", "emoji": "🐦", "npcIds": ["ripple", "doodle"],  "distractors": ["word", "nerd"] },
  { "word": "cake", "emoji": "🎂", "npcIds": ["biscuit"],           "distractors": ["lake", "rake"] },
  { "word": "bread","emoji": "🍞", "npcIds": ["biscuit"],           "distractors": ["read", "dead"] },
  { "word": "pie",  "emoji": "🥧", "npcIds": ["biscuit"],           "distractors": ["tie", "lie"] },
  { "word": "milk", "emoji": "🥛", "npcIds": ["biscuit"],           "distractors": ["silk", "bilk"] },
  { "word": "egg",  "emoji": "🥚", "npcIds": ["biscuit"],           "distractors": ["leg", "peg"] },
  { "word": "red",  "emoji": "🔴", "npcIds": ["doodle"],            "distractors": ["bed", "fed"] },
  { "word": "blue", "emoji": "🔵", "npcIds": ["doodle"],            "distractors": ["clue", "glue"] },
  { "word": "star", "emoji": "⭐", "npcIds": ["doodle", "professor-hoot"], "distractors": ["scar", "bar"] },
  { "word": "ball", "emoji": "⚽", "npcIds": ["coach-roar"],        "distractors": ["tall", "wall"] },
  { "word": "run",  "emoji": "🏃", "npcIds": ["coach-roar"],        "distractors": ["sun", "fun"] },
  { "word": "jump", "emoji": "🦘", "npcIds": ["coach-roar"],        "distractors": ["bump", "dump"] },
  { "word": "tree", "emoji": "🌲", "npcIds": ["mossy"],             "distractors": ["free", "knee"] },
  { "word": "sun",  "emoji": "☀️", "npcIds": ["mossy", "doodle"],   "distractors": ["fun", "run"] },
  { "word": "rose", "emoji": "🌹", "npcIds": ["mossy"],             "distractors": ["nose", "hose"] },
  { "word": "home", "emoji": "🏠", "npcIds": ["mittens", "clover"], "distractors": ["dome", "foam"] },
  { "word": "mum",  "emoji": "👩", "npcIds": ["mittens", "clover"], "distractors": ["gum", "bum"] },
  { "word": "dad",  "emoji": "👨", "npcIds": ["mittens", "clover"], "distractors": ["bad", "had"] },
  { "word": "one",  "emoji": "1️⃣", "npcIds": ["professor-hoot"],   "distractors": ["ton", "son"] },
  { "word": "two",  "emoji": "2️⃣", "npcIds": ["professor-hoot"],   "distractors": ["too", "who"] },
  { "word": "hi",   "emoji": "👋", "npcIds": ["mayor-hop"],         "distractors": ["by", "my"] },
  { "word": "yes",  "emoji": "✅", "npcIds": ["mayor-hop"],         "distractors": ["yet", "yew"] },
  { "word": "book", "emoji": "📚", "npcIds": ["blaze"],             "distractors": ["cook", "look"] },
  { "word": "read", "emoji": "📖", "npcIds": ["blaze"],             "distractors": ["bead", "lead"] }
]
```

- [ ] **Step 2: Create `src/data/words/intermediate.json`**

Intermediate words: 4–5 letter words. Distractors not used at runtime (generated), but include for possible future use.

```json
[
  { "word": "cloud",  "emoji": "☁️",  "npcIds": ["mossy", "doodle"],           "distractors": [] },
  { "word": "plant",  "emoji": "🌱",  "npcIds": ["mossy"],                      "distractors": [] },
  { "word": "grape",  "emoji": "🍇",  "npcIds": ["biscuit"],                    "distractors": [] },
  { "word": "storm",  "emoji": "⛈️",  "npcIds": ["mossy", "blaze"],             "distractors": [] },
  { "word": "chess",  "emoji": "♟️",  "npcIds": ["blaze", "professor-hoot"],    "distractors": [] },
  { "word": "flame",  "emoji": "🔥",  "npcIds": ["blaze"],                      "distractors": [] },
  { "word": "swim",   "emoji": "🏊",  "npcIds": ["coach-roar", "ripple"],       "distractors": [] },
  { "word": "score",  "emoji": "🏆",  "npcIds": ["coach-roar"],                 "distractors": [] },
  { "word": "brush",  "emoji": "🖌️",  "npcIds": ["doodle"],                     "distractors": [] },
  { "word": "shape",  "emoji": "🔷",  "npcIds": ["doodle", "professor-hoot"],   "distractors": [] },
  { "word": "house",  "emoji": "🏠",  "npcIds": ["mittens", "clover"],          "distractors": [] },
  { "word": "hello",  "emoji": "👋",  "npcIds": ["mayor-hop"],                  "distractors": [] },
  { "word": "water",  "emoji": "💧",  "npcIds": ["ripple", "mossy"],            "distractors": [] },
  { "word": "seven",  "emoji": "7️⃣",  "npcIds": ["professor-hoot"],             "distractors": [] },
  { "word": "eight",  "emoji": "8️⃣",  "npcIds": ["professor-hoot"],             "distractors": [] }
]
```

- [ ] **Step 3: Create `src/data/words/advanced.json`**

Advanced words: 5–7 letter words. Scrambling handled at runtime.

```json
[
  { "word": "forest",   "emoji": "🌲", "npcIds": ["mossy"],                      "distractors": [] },
  { "word": "library",  "emoji": "📚", "npcIds": ["blaze"],                      "distractors": [] },
  { "word": "garden",   "emoji": "🌻", "npcIds": ["mossy"],                      "distractors": [] },
  { "word": "kitchen",  "emoji": "🍳", "npcIds": ["biscuit"],                    "distractors": [] },
  { "word": "dragon",   "emoji": "🐉", "npcIds": ["blaze"],                      "distractors": [] },
  { "word": "rocket",   "emoji": "🚀", "npcIds": ["professor-hoot"],             "distractors": [] },
  { "word": "village",  "emoji": "🏘️", "npcIds": ["mayor-hop"],                  "distractors": [] },
  { "word": "school",   "emoji": "🏫", "npcIds": ["professor-hoot"],             "distractors": [] },
  { "word": "basket",   "emoji": "🧺", "npcIds": ["biscuit", "mittens"],         "distractors": [] },
  { "word": "penguin",  "emoji": "🐧", "npcIds": ["ripple"],                     "distractors": [] },
  { "word": "rainbow",  "emoji": "🌈", "npcIds": ["doodle", "mossy"],            "distractors": [] },
  { "word": "thunder",  "emoji": "⛈️", "npcIds": ["coach-roar"],                 "distractors": [] },
  { "word": "blanket",  "emoji": "🛏️", "npcIds": ["mittens", "clover"],          "distractors": [] },
  { "word": "captain",  "emoji": "⚓", "npcIds": ["ripple"],                     "distractors": [] },
  { "word": "morning",  "emoji": "🌅", "npcIds": ["mayor-hop"],                  "distractors": [] }
]
```

- [ ] **Step 4: Create `src/data/npcs.js`**

```js
// NPC definitions. `id` matches npcIds in word banks and save state.
// `position` is world tile coordinates (set after tilemap is built in Task 9).
export const NPCS = [
  { id: 'mayor-hop',      name: 'Mayor Hop',      sprite: 'npc_mayor_hop',     startLocked: false, x: 240, y: 160 },
  { id: 'blaze',          name: 'Blaze',           sprite: 'npc_blaze',         startLocked: false, x: 120, y: 80  },
  { id: 'biscuit',        name: 'Biscuit',         sprite: 'npc_biscuit',       startLocked: false, x: 360, y: 100 },
  { id: 'doodle',         name: 'Doodle',          sprite: 'npc_doodle',        startLocked: false, x: 80,  y: 200 },
  { id: 'mittens',        name: 'Mittens',         sprite: 'npc_mittens',       startLocked: false, x: 160, y: 260 },
  { id: 'professor-hoot', name: 'Professor Hoot',  sprite: 'npc_professor_hoot',startLocked: false, x: 400, y: 240 },
  { id: 'coach-roar',     name: 'Coach Roar',      sprite: 'npc_coach_roar',    startLocked: true,  x: 320, y: 60  },
  { id: 'mossy',          name: 'Mossy',           sprite: 'npc_mossy',         startLocked: true,  x: 60,  y: 140 },
  { id: 'clover',         name: 'Clover',          sprite: 'npc_clover',        startLocked: true,  x: 200, y: 280 },
  { id: 'ripple',         name: 'Ripple',          sprite: 'npc_ripple',        startLocked: true,  x: 420, y: 180 },
  { id: 'mystery-hut',   name: '???',             sprite: 'npc_mystery',       startLocked: true,  x: 280, y: 300 },
]
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: word bank data files and NPC definitions"
```

---

## Task 8: Audio Service

**Files:**
- Create: `src/logic/audioService.js`

No unit tests — Web Speech API is a browser API. Manual test in Task 13.

- [ ] **Step 1: Create `src/logic/audioService.js`**

```js
let enabled = true

export function setAudioEnabled(val) {
  enabled = val
}

export function isAudioEnabled() {
  return enabled && 'speechSynthesis' in window
}

export function speakWord(word) {
  if (!isAudioEnabled()) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(word)
  utt.rate = 0.85   // slightly slower for kids
  utt.pitch = 1.1
  window.speechSynthesis.speak(utt)
}

export function speakLetter(letter) {
  if (!isAudioEnabled()) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(letter)
  utt.rate = 0.8
  window.speechSynthesis.speak(utt)
}

export function initAudioFromSave(save) {
  const defaultOn = save.skillLevel !== 'advanced'
  const on = save.audioEnabled === null ? defaultOn : save.audioEnabled
  setAudioEnabled(on)
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: audio service wrapping Web Speech API"
```

---

## Task 9: Phaser Scenes — Boot + Splash

**Files:**
- Create: `src/game/scenes/BootScene.js`, `src/game/scenes/SplashScene.js`

- [ ] **Step 1: Create placeholder pixel art assets**

For now, create 32×32 coloured placeholder PNGs using a script or use solid-colour data URIs. Real pixel art is added by the UX designer in a later pass. The engineering tasks use coloured rectangles as stand-ins.

Create `src/assets/sprites/` directory and note: all sprite keys used in code must exist in BootScene. For the initial build, load coloured rectangles via Phaser's graphics API so we have zero external asset dependencies.

- [ ] **Step 2: Create `src/game/scenes/BootScene.js`**

```js
import { Scene } from 'phaser'

export class BootScene extends Scene {
  constructor() { super('BootScene') }

  preload() {
    // Placeholder sprites — replace with real pixel art assets
    // Each NPC is a 32x32 coloured square for now
    const colours = {
      player:          0x4fc3f7,
      npc_mayor_hop:   0x4caf50,
      npc_blaze:       0xef5350,
      npc_biscuit:     0xf48fb1,
      npc_doodle:      0xff8f00,
      npc_mittens:     0x9c27b0,
      npc_professor_hoot: 0xff8f00,
      npc_coach_roar:  0x795548,
      npc_mossy:       0x69f0ae,
      npc_clover:      0xf5f5f5,
      npc_ripple:      0x4caf50,
      npc_mystery:     0x37474f,
      padlock:         0x757575,
    }

    Object.entries(colours).forEach(([key, colour]) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false })
      g.fillStyle(colour)
      g.fillRect(0, 0, 32, 32)
      g.generateTexture(key, 32, 32)
      g.destroy()
    })

    // Tilemap placeholder — a 480×320 green rectangle
    const bg = this.make.graphics({ add: false })
    bg.fillStyle(0x2d5a27)
    bg.fillRect(0, 0, 960, 640)
    bg.generateTexture('world_bg', 960, 640)
    bg.destroy()
  }

  create() {
    this.scene.start('SplashScene')
  }
}
```

- [ ] **Step 3: Create `src/game/scenes/SplashScene.js`**

```js
import { Scene } from 'phaser'
import { EventBus } from '../EventBus'
import { loadSave, writeSave } from '../../logic/saveSystem'
import { checkDailyReset } from '../../logic/sessionManager'
import { initAudioFromSave } from '../../logic/audioService'

export class SplashScene extends Scene {
  constructor() { super('SplashScene') }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1b3a1b)

    // Title text
    this.add.text(width / 2, height / 2 - 60, 'pixel-learn', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Press Start 2P',
    }).setOrigin(0.5)

    // Tap to start
    const tapText = this.add.text(width / 2, height / 2 + 20, 'TAP TO START', {
      fontSize: '10px',
      color: '#a5d6a7',
      fontFamily: 'Press Start 2P',
    }).setOrigin(0.5)

    // Blink animation
    this.tweens.add({ targets: tapText, alpha: 0, duration: 600, yoyo: true, repeat: -1 })

    // Load save + daily reset on first interaction (satisfies iOS gesture requirement)
    this.input.once('pointerdown', () => {
      const raw = loadSave()
      const save = checkDailyReset(raw)
      writeSave(save)
      initAudioFromSave(save)

      // Tell React overlay which message to show
      if (save.isFirstPlay) {
        EventBus.emit('show-mayor-message', { type: 'intro' })
      } else {
        EventBus.emit('show-mayor-message', { type: 'welcome-back' })
      }

      this.scene.start('WorldScene')
    })
  }
}
```

- [ ] **Step 4: Verify in browser — tap to start works**

```bash
npm run dev
```

Open `http://localhost:5173`. Should see "pixel-learn / TAP TO START" blinking. Tapping should transition (WorldScene will be blank until Task 10).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: BootScene and SplashScene with daily reset on start"
```

---

## Task 10: World Scene — Map, Player, Camera

**Files:**
- Create: `src/game/scenes/WorldScene.js`, `src/game/entities/Player.js`

- [ ] **Step 1: Create `src/game/entities/Player.js`**

```js
import Phaser from 'phaser'

export class Player extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 20, 28, 0x4fc3f7)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setCollideWorldBounds(true)
    this.speed = 80
    this._keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT')
    this._dpad = { up: false, down: false, left: false, right: false }
    this._blocked = false
  }

  setDpad(direction, active) {
    this._dpad[direction] = active
  }

  setBlocked(val) {
    this._blocked = val
    if (val) this.body.setVelocity(0, 0)
  }

  update() {
    if (this._blocked) return
    const k = this._keys
    const d = this._dpad
    let vx = 0, vy = 0

    if (k.LEFT.isDown  || k.A.isDown  || d.left)  vx = -this.speed
    if (k.RIGHT.isDown || k.D.isDown  || d.right) vx =  this.speed
    if (k.UP.isDown    || k.W.isDown  || d.up)    vy = -this.speed
    if (k.DOWN.isDown  || k.S.isDown  || d.down)  vy =  this.speed

    // Normalise diagonal movement
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }

    this.body.setVelocity(vx, vy)
  }
}
```

- [ ] **Step 2: Create `src/game/scenes/WorldScene.js`**

```js
import { Scene } from 'phaser'
import { Player } from '../entities/Player'
import { EventBus } from '../EventBus'
import { loadSave } from '../../logic/saveSystem'
import { NPCS } from '../../data/npcs'

export class WorldScene extends Scene {
  constructor() { super('WorldScene') }

  create() {
    const { width, height } = this.scale
    this.physics.world.setBounds(0, 0, 960, 640)

    // Placeholder world background (2× screen size = scrollable world)
    this.add.image(480, 320, 'world_bg')

    // Player
    this.player = new Player(this, 480, 320)

    // Camera follows player, bounded to world
    this.cameras.main.setBounds(0, 0, 960, 640)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    // Spawn NPCs
    this._save = loadSave()
    this._npcs = {}
    NPCS.forEach(def => this._spawnNPC(def))

    // Listen for block/unblock from React (task bubble open/close)
    EventBus.on('task-open',  () => this.player.setBlocked(true),  this)
    EventBus.on('task-close', () => this.player.setBlocked(false), this)

    // Listen for unlock events
    EventBus.on('npc-unlocked', ({ npcId }) => this._unlockNPC(npcId), this)

    // Emit ready so React can set up
    EventBus.emit('world-ready')
  }

  _spawnNPC(def) {
    const isUnlocked = this._save.unlockedNpcs.includes(def.id)
    const tint = isUnlocked ? 0xffffff : 0x555555
    const sprite = this.add.image(def.x, def.y, def.sprite).setTint(tint)

    if (isUnlocked) {
      sprite.setInteractive({ useHandCursor: true })
      sprite.on('pointerdown', () => this._onNPCClick(def, sprite))
    }

    if (!isUnlocked) {
      this.add.image(def.x, def.y - 20, 'padlock').setScale(0.6)
    }

    this._npcs[def.id] = { def, sprite }
  }

  _onNPCClick(def, sprite) {
    // Convert world position to screen (viewport-relative) for bubble tail
    const cam = this.cameras.main
    const screenX = (sprite.x - cam.scrollX) * cam.zoom
    const screenY = (sprite.y - cam.scrollY) * cam.zoom

    // Scale to account for Phaser Scale.FIT canvas scaling
    const canvas = this.game.canvas
    const scaleX = canvas.clientWidth  / this.scale.width
    const scaleY = canvas.clientHeight / this.scale.height
    const rect = canvas.getBoundingClientRect()

    EventBus.emit('npc-interact', {
      npcId: def.id,
      npcName: def.name,
      screenX: rect.left + screenX * scaleX,
      screenY: rect.top  + screenY * scaleY,
    })
  }

  _unlockNPC(npcId) {
    const entry = this._npcs[npcId]
    if (!entry) return
    entry.sprite.clearTint()
    entry.sprite.setInteractive({ useHandCursor: true })
    entry.sprite.on('pointerdown', () => this._onNPCClick(entry.def, entry.sprite))
  }

  update() {
    this.player.update()
  }
}
```

- [ ] **Step 3: Enable Phaser Arcade physics in PhaserGame.jsx**

Add `physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } }` to the Phaser config object in `src/game/PhaserGame.jsx`.

- [ ] **Step 4: Verify in browser**

Player (blue rectangle) should appear, WASD/arrows should move it, camera should follow. NPCs (coloured rectangles) should be visible.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: world scene with player movement, camera, and NPC placement"
```

---

## Task 11: React App Overlay + HUD

**Files:**
- Create: `src/ui/components/HUD/HUD.jsx`, `src/ui/components/HUD/HUD.module.css`, `src/ui/components/HUD/QuestBanner.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/ui/components/HUD/HUD.module.css`**

```css
.hud {
  position: fixed;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  pointer-events: none;
  z-index: 10;
}

.hearts {
  background: rgba(0,0,0,0.6);
  border: 2px solid #ef5350;
  padding: 4px 8px;
  color: #ef5350;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  image-rendering: pixelated;
}

.quest {
  background: rgba(0,0,0,0.6);
  border: 2px solid #fff9c4;
  padding: 4px 8px;
  color: #fff9c4;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  max-width: 200px;
  text-align: right;
}
```

- [ ] **Step 2: Create `src/ui/components/HUD/HUD.jsx`**

```jsx
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
```

- [ ] **Step 3: Update `src/App.jsx` to include HUD**

```jsx
import { PhaserGame } from './game/PhaserGame'
import { HUD } from './ui/components/HUD/HUD'

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PhaserGame />
      {/* Overlay */}
      <HUD />
    </div>
  )
}
```

- [ ] **Step 4: Verify HUD appears in browser**

`❤️ 0` and `Quest: 0/2` should appear top-right over the game canvas.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: HUD overlay showing hearts and quest progress"
```

---

## Task 12: Task Bubble — Beginner Level

**Files:**
- Create: `src/ui/components/TaskBubble/TaskBubble.jsx`, `TaskBubble.module.css`, `BeginnerTask.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/ui/components/TaskBubble/TaskBubble.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.bubble {
  position: absolute;
  background: #1a1a2e;
  border: 3px solid #69f0ae;
  padding: 12px;
  width: 260px;
  transform: translateX(-50%);
  pointer-events: all;
  image-rendering: pixelated;
}

/* Tail pointing down toward NPC */
.bubble::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 12px solid #69f0ae;
}

.npcHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #a5d6a7;
}

.emoji { font-size: 28px; }

.clue {
  text-align: center;
  font-size: 32px;
  margin-bottom: 10px;
}

.dismiss {
  position: absolute;
  top: 6px;
  right: 8px;
  background: none;
  border: none;
  color: #555;
  font-size: 14px;
  cursor: pointer;
  pointer-events: all;
}

.choices {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.choiceBtn {
  background: #1565c0;
  border: 2px solid #42a5f5;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  padding: 8px 12px;
  min-width: 44px;
  min-height: 44px;
  cursor: pointer;
  image-rendering: pixelated;
}

.choiceBtn:hover { background: #1976d2; }
.choiceBtn.correct { border-color: #69f0ae; animation: glow 1s ease-in-out; }
.choiceBtn.wrong   { animation: shake 0.3s ease-in-out; }
.choiceBtn.disabled { opacity: 0.35; pointer-events: none; }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-4px); }
  75%      { transform: translateX(4px); }
}

@keyframes glow {
  0%,100% { box-shadow: none; }
  50%     { box-shadow: 0 0 8px #69f0ae; }
}

.message {
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #ffeb3b;
  text-align: center;
  margin-top: 6px;
  min-height: 14px;
}
```

- [ ] **Step 2: Create `src/ui/components/TaskBubble/BeginnerTask.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { speakWord } from '../../../logic/audioService'
import styles from './TaskBubble.module.css'

export function BeginnerTask({ wordEntry, onCorrect, onDismiss }) {
  const [attempt, setAttempt] = useState(0)  // 0-indexed
  const [message, setMessage] = useState('')
  const [glowing, setGlowing] = useState(false)
  const [wrongChoice, setWrongChoice] = useState(null)
  const [disabled, setDisabled] = useState([])

  // Build 3 choices: correct word + 2 distractors, shuffled
  const [choices] = useState(() => {
    const opts = [wordEntry.word, ...wordEntry.distractors.slice(0, 2)]
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]]
    }
    return opts
  })

  useEffect(() => { speakWord(wordEntry.word) }, [wordEntry.word])

  function handleChoice(choice) {
    if (choice === wordEntry.word) {
      onCorrect(attempt)
      return
    }

    const nextAttempt = attempt + 1
    setAttempt(nextAttempt)
    setWrongChoice(choice)
    setTimeout(() => setWrongChoice(null), 400)

    if (nextAttempt === 1) {
      setMessage("Oops! Try again!")
    } else if (nextAttempt === 2) {
      setMessage("Look carefully...")
      setGlowing(true)
      setTimeout(() => setGlowing(false), 1000)
    } else {
      // 3rd wrong: keep correct highlighted, speak word
      setMessage("Tap the right one!")
      setGlowing(true)
      speakWord(wordEntry.word)
    }
  }

  return (
    <>
      <div className={styles.clue}>{wordEntry.emoji}</div>
      <div className={styles.choices}>
        {choices.map(c => (
          <button
            key={c}
            className={[
              styles.choiceBtn,
              c === wrongChoice ? styles.wrong : '',
              glowing && c === wordEntry.word ? styles.correct : '',
              disabled.includes(c) ? styles.disabled : '',
            ].join(' ')}
            onClick={() => handleChoice(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className={styles.message}>{message}</div>
    </>
  )
}
```

- [ ] **Step 3: Create `src/ui/components/TaskBubble/TaskBubble.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import { loadSave, writeSave } from '../../../logic/saveSystem'
import { addDailyHearts, incrementQuestProgress, isDailyCapped, getQuestTarget } from '../../../logic/sessionManager'
import { getNewUnlocks } from '../../../logic/progressionEngine'
import { selectWord } from '../../../logic/wordSelector'
import { BeginnerTask } from './BeginnerTask'
import styles from './TaskBubble.module.css'

// Load word banks (imported as JSON via Vite)
import beginnerBank from '../../../data/words/beginner.json'
import intermediateBank from '../../../data/words/intermediate.json'
import advancedBank from '../../../data/words/advanced.json'

const BANKS = { beginner: beginnerBank, intermediate: intermediateBank, advanced: advancedBank }

// Per-NPC recent word memory (session only)
const recentWords = {}

// Hearts awarded by attempt number (0-indexed)
const HEARTS_BY_ATTEMPT = [3, 2, 1]

export function TaskBubble() {
  const [interaction, setInteraction] = useState(null) // { npcId, npcName, screenX, screenY, wordEntry }

  useEffect(() => {
    EventBus.on('npc-interact', ({ npcId, npcName, screenX, screenY }) => {
      const save = loadSave()
      if (isDailyCapped(save)) return // no tasks if daily cap reached

      const bank = BANKS[save.skillLevel]
      const recent = recentWords[npcId] || []
      const wordEntry = selectWord(bank, npcId, recent)
      if (!wordEntry) return

      // Update recency list
      recentWords[npcId] = [wordEntry.word, ...recent].slice(0, 3)

      setInteraction({ npcId, npcName, screenX, screenY, wordEntry })
      EventBus.emit('task-open')
    })

    return () => EventBus.off('npc-interact')
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

    // Check unlocks
    const newUnlocks = getNewUnlocks(save)
    newUnlocks.forEach(u => {
      save.unlockedNpcs = [...save.unlockedNpcs, u.npcId]
      save.firedThresholds = [...save.firedThresholds, u.points]
    })

    // Check quest completion
    const questTarget = getQuestTarget(save.skillLevel)
    if (save.dailyQuestProgress >= questTarget && !save.dailyQuestComplete) {
      save.dailyQuestComplete = true
      EventBus.emit('quest-complete')
    }

    // Check daily cap
    if (isDailyCapped(save)) {
      EventBus.emit('daily-cap-reached')
    }

    writeSave(save)
    EventBus.emit('save-updated')

    // Fire unlocks after save
    if (newUnlocks.length > 0) {
      EventBus.emit('unlocks-pending', newUnlocks)
    }

    // Float hearts up (visual feedback)
    EventBus.emit('hearts-earned', { amount: heartsEarned, screenX: interaction.screenX, screenY: interaction.screenY })

    setInteraction(null)
    EventBus.emit('task-close')
  }

  if (!interaction) return null

  const save = loadSave()
  const bubbleTop = Math.max(20, interaction.screenY - 220)

  return (
    <div className={styles.overlay}>
      <div className={styles.bubble} style={{ left: interaction.screenX, top: bubbleTop }}>
        <button className={styles.dismiss} onClick={handleDismiss}>✕</button>
        <div className={styles.npcHeader}>
          <span>{interaction.npcName} says:</span>
        </div>
        <BeginnerTask
          wordEntry={interaction.wordEntry}
          onCorrect={handleCorrect}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  )
}
```

Note: `IntermediateTask` and `AdvancedTask` are wired in Task 13. For now TaskBubble always renders BeginnerTask.

- [ ] **Step 4: Add TaskBubble to `src/App.jsx`**

```jsx
import { PhaserGame } from './game/PhaserGame'
import { HUD } from './ui/components/HUD/HUD'
import { TaskBubble } from './ui/components/TaskBubble/TaskBubble'

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PhaserGame />
      <HUD />
      <TaskBubble />
    </div>
  )
}
```

- [ ] **Step 5: Manual test — click an NPC**

Click any unlocked NPC rectangle. A bubble should appear above it. Clicking the correct word should dismiss the bubble and increment the HUD heart count. Clicking a wrong word should shake it.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: task bubble with Beginner word challenge and heart rewards"
```

---

## Task 13: Task Bubble — Intermediate + Advanced Levels

**Files:**
- Create: `src/ui/components/TaskBubble/IntermediateTask.jsx`, `AdvancedTask.jsx`
- Modify: `src/ui/components/TaskBubble/TaskBubble.jsx`

- [ ] **Step 1: Create `IntermediateTask.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { generateIntermediateOptions } from '../../../logic/distractorGenerator'
import { speakWord, speakLetter } from '../../../logic/audioService'
import styles from './TaskBubble.module.css'

export function IntermediateTask({ wordEntry, onCorrect }) {
  // Pick a random missing index
  const [missingIdx] = useState(() => Math.floor(Math.random() * wordEntry.word.length))
  const [options, setOptions] = useState(() => generateIntermediateOptions(wordEntry.word, missingIdx))
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('')
  const [wrongChoice, setWrongChoice] = useState(null)
  const [eliminated, setEliminated] = useState([])
  const [glowing, setGlowing] = useState(false)

  const correct = wordEntry.word[missingIdx]
  const display = wordEntry.word.split('').map((l, i) => i === missingIdx ? '_' : l).join(' ')

  useEffect(() => { speakWord(wordEntry.word) }, [wordEntry.word])

  function handleChoice(letter) {
    if (letter === correct) { onCorrect(attempt); return }

    const next = attempt + 1
    setAttempt(next)
    setWrongChoice(letter)
    setTimeout(() => setWrongChoice(null), 400)

    if (next === 1) {
      setMessage("Almost! Try again!")
    } else if (next === 2) {
      // Eliminate one wrong option
      const wrong = options.filter(o => o !== correct && o !== letter)
      setEliminated(e => [...e, wrong[0]])
      setMessage("One less to pick from!")
    } else {
      setGlowing(true)
      speakWord(wordEntry.word)
      setMessage("Tap the right letter!")
    }
  }

  return (
    <>
      <div className={styles.clue}>{wordEntry.emoji}</div>
      <div style={{ textAlign: 'center', fontFamily: 'Press Start 2P', fontSize: '14px', color: '#fff', letterSpacing: '4px', marginBottom: '10px' }}>
        {display}
      </div>
      <div className={styles.choices}>
        {options.map(l => (
          <button
            key={l}
            className={[
              styles.choiceBtn,
              l === wrongChoice ? styles.wrong : '',
              glowing && l === correct ? styles.correct : '',
              eliminated.includes(l) ? styles.disabled : '',
            ].join(' ')}
            onClick={() => !eliminated.includes(l) && handleChoice(l)}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className={styles.message}>{message}</div>
    </>
  )
}
```

- [ ] **Step 2: Create `AdvancedTask.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { speakWord, speakLetter } from '../../../logic/audioService'
import styles from './TaskBubble.module.css'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function AdvancedTask({ wordEntry, onCorrect }) {
  const letters = wordEntry.word.split('')
  const [tiles, setTiles] = useState(() => shuffle(letters.map((l, i) => ({ l, id: i }))))
  const [placed, setPlaced] = useState([])    // ordered placed letters
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('')
  const [shaking, setShaking] = useState(false)
  const [revealedFirst, setRevealedFirst] = useState(false)
  const [confirmMode, setConfirmMode] = useState(false)

  useEffect(() => { speakWord(wordEntry.word) }, [wordEntry.word])

  function placeTile(tile) {
    const newPlaced = [...placed, tile]
    setPlaced(newPlaced)
    setTiles(t => t.filter(t => t.id !== tile.id))
    speakLetter(tile.l)

    // Auto-submit when all placed
    if (newPlaced.length === letters.length) {
      const answer = newPlaced.map(t => t.l).join('')
      if (answer === wordEntry.word) {
        onCorrect(attempt)
      } else {
        handleWrong(newPlaced)
      }
    }
  }

  function handleWrong(currentPlaced) {
    const next = attempt + 1
    setAttempt(next)
    setShaking(true)
    setTimeout(() => setShaking(false), 400)

    if (next === 1) {
      setMessage("Almost! Try again!")
      setTiles(shuffle([...currentPlaced, ...tiles]))
      setPlaced([])
    } else if (next === 2 && !revealedFirst) {
      setRevealedFirst(true)
      setMessage("Here's a hint...")
      const firstCorrect = { l: wordEntry.word[0], id: 999 }
      const remaining = shuffle(currentPlaced.filter(t => t.l !== wordEntry.word[0]))
      setPlaced([firstCorrect])
      setTiles(remaining)
    } else {
      // 3rd wrong: animate reveal then reset for confirm
      setMessage("Watch carefully...")
      speakWord(wordEntry.word)
      letters.forEach((l, i) => setTimeout(() => speakLetter(l), i * 300))
      setTimeout(() => {
        setConfirmMode(true)
        setMessage("Now you try!")
        setTiles(shuffle(letters.map((l, i) => ({ l, id: i }))))
        setPlaced([])
      }, letters.length * 300 + 500)
    }
  }

  return (
    <>
      <div className={styles.clue}>{wordEntry.emoji}</div>
      {/* Placed slots */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', minHeight: '44px', marginBottom: '8px' }}>
        {placed.map((t, i) => (
          <div key={i} style={{ width: 30, height: 44, background: '#4caf50', border: '2px solid #2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Press Start 2P', fontSize: '12px', color: '#fff' }}>
            {t.l.toUpperCase()}
          </div>
        ))}
        {Array.from({ length: letters.length - placed.length }).map((_, i) => (
          <div key={`empty-${i}`} style={{ width: 30, height: 44, border: '2px dashed #69f0ae' }} />
        ))}
      </div>
      {/* Tile bank */}
      <div className={styles.choices} style={{ animation: shaking ? 'shake 0.3s' : 'none' }}>
        {tiles.map(tile => (
          <button key={tile.id} className={styles.choiceBtn} onClick={() => placeTile(tile)}>
            {tile.l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className={styles.message}>{message}</div>
    </>
  )
}
```

- [ ] **Step 3: Wire skill level into TaskBubble.jsx**

Replace the hardcoded `<BeginnerTask>` render in `TaskBubble.jsx` with:

```jsx
import { IntermediateTask } from './IntermediateTask'
import { AdvancedTask } from './AdvancedTask'

// Inside the return, replace <BeginnerTask ... /> with:
{save.skillLevel === 'beginner' && (
  <BeginnerTask wordEntry={interaction.wordEntry} onCorrect={handleCorrect} onDismiss={handleDismiss} />
)}
{save.skillLevel === 'intermediate' && (
  <IntermediateTask wordEntry={interaction.wordEntry} onCorrect={handleCorrect} />
)}
{save.skillLevel === 'advanced' && (
  <AdvancedTask wordEntry={interaction.wordEntry} onCorrect={handleCorrect} />
)}
```

- [ ] **Step 4: Manual test all three levels**

In browser console: `localStorage.setItem('pixellearn_save', JSON.stringify({...JSON.parse(localStorage.getItem('pixellearn_save')||'{}'), skillLevel:'intermediate'}))` then reload. Click NPCs and verify fill-in-the-blank appears. Repeat for `advanced`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Intermediate and Advanced task variants wired into TaskBubble"
```

---

## Task 14: Mayor Hop Messages + Daily Cap + Quest Complete

**Files:**
- Create: `src/ui/components/MayorHopMessage/MayorHopMessage.jsx`, `MayorHopMessage.module.css`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `MayorHopMessage.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
}

.card {
  background: #1b3a1b;
  border: 4px solid #69f0ae;
  padding: 24px;
  max-width: 320px;
  text-align: center;
  image-rendering: pixelated;
}

.npc { font-size: 48px; margin-bottom: 12px; }

.text {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #e8f5e9;
  line-height: 1.8;
  margin-bottom: 16px;
}

.btn {
  background: #4caf50;
  border: 3px solid #2e7d32;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  padding: 10px 20px;
  cursor: pointer;
  min-height: 44px;
}
```

- [ ] **Step 2: Create `MayorHopMessage.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import { loadSave, writeSave } from '../../../logic/saveSystem'
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
    EventBus.on('show-mayor-message', ({ type }) => setMessageType(type))
    EventBus.on('quest-complete',   () => setMessageType('quest-complete'))
    EventBus.on('daily-cap-reached', () => setMessageType('daily-cap'))
    return () => {
      EventBus.off('show-mayor-message')
      EventBus.off('quest-complete')
      EventBus.off('daily-cap-reached')
    }
  }, [])

  function handleClose() {
    if (messageType === 'intro') {
      // Mark first play done
      const save = loadSave()
      writeSave({ ...save, isFirstPlay: false })
      EventBus.emit('save-updated')
    }
    setMessageType(null)
    EventBus.emit('task-close') // re-enable player movement
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
```

- [ ] **Step 3: Add to `App.jsx`**

```jsx
import { MayorHopMessage } from './ui/components/MayorHopMessage/MayorHopMessage'
// Add <MayorHopMessage /> to the overlay div
```

- [ ] **Step 4: Manual test**

Clear localStorage and reload. Should see Mayor Hop intro message. Accept it, earn hearts via NPC tasks, verify quest-complete message at threshold and daily cap message when hearts hit the cap.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Mayor Hop messages for welcome, intro, quest complete, and daily cap"
```

---

## Task 15: Unlock Modal

**Files:**
- Create: `src/ui/components/UnlockModal/UnlockModal.jsx`, `UnlockModal.module.css`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `UnlockModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 25;
}

.card {
  background: #0d1b2a;
  border: 4px solid #ffd700;
  padding: 24px;
  text-align: center;
  image-rendering: pixelated;
  animation: popIn 0.3s ease-out;
}

@keyframes popIn {
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.emoji { font-size: 48px; margin-bottom: 12px; }

.title {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #ffd700;
  margin-bottom: 8px;
}

.sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #b0bec5;
  margin-bottom: 16px;
}

.btn {
  background: #ffd700;
  border: 3px solid #f57f17;
  color: #1a1a1a;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  padding: 10px 20px;
  cursor: pointer;
  min-height: 44px;
}
```

- [ ] **Step 2: Create `UnlockModal.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { EventBus } from '../../../game/EventBus'
import styles from './UnlockModal.module.css'

export function UnlockModal() {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)

  useEffect(() => {
    EventBus.on('unlocks-pending', (unlocks) => {
      setQueue(u => [...u, ...unlocks])
    })
    return () => EventBus.off('unlocks-pending')
  }, [])

  // Show next from queue when current is null
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(q => q.slice(1))
      EventBus.emit('task-open') // block player during animation
    }
  }, [current, queue])

  function handleNext() {
    // Tell Phaser to wake up this NPC
    EventBus.emit('npc-unlocked', { npcId: current.npcId })
    setCurrent(null)
    if (queue.length === 0) {
      EventBus.emit('task-close') // all done, unblock player
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
```

- [ ] **Step 3: Add to `App.jsx`**

```jsx
import { UnlockModal } from './ui/components/UnlockModal/UnlockModal'
// Add <UnlockModal /> to overlay div
```

- [ ] **Step 4: Manual test**

In browser console, set `totalHearts` to 9 then do a task to reach 10. Unlock modal should appear for Coach Roar, then dismiss and the NPC should un-grey.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: sequential unlock modal with NPC wake-up"
```

---

## Task 16: Parent Settings Screen

**Files:**
- Create: `src/ui/components/ParentSettings/ParentSettings.jsx`, `ParentSettings.module.css`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `ParentSettings.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.panel {
  background: #1a1a2e;
  border: 4px solid #42a5f5;
  padding: 20px;
  width: 320px;
  max-height: 80vh;
  overflow-y: auto;
  font-family: 'Press Start 2P', monospace;
}

.title {
  font-size: 11px;
  color: #42a5f5;
  margin-bottom: 16px;
  text-align: center;
}

.row {
  margin-bottom: 14px;
}

.label {
  font-size: 7px;
  color: #90a4ae;
  margin-bottom: 6px;
}

.btnGroup { display: flex; gap: 6px; flex-wrap: wrap; }

.btn {
  background: #263238;
  border: 2px solid #455a64;
  color: #cfd8dc;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  padding: 8px 10px;
  cursor: pointer;
  min-height: 44px;
}

.btn.active {
  background: #1565c0;
  border-color: #42a5f5;
  color: #fff;
}

.stat {
  font-size: 8px;
  color: #e8f5e9;
}

.close {
  width: 100%;
  margin-top: 16px;
  background: #4caf50;
  border: 3px solid #2e7d32;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  padding: 10px;
  cursor: pointer;
  min-height: 44px;
}

.saveCode {
  font-size: 7px;
  color: #69f0ae;
  word-break: break-all;
  background: #0d1b2a;
  padding: 6px;
  margin-top: 4px;
  max-height: 60px;
  overflow: auto;
}
```

- [ ] **Step 2: Create `ParentSettings.jsx`**

```jsx
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
                {c} ❤️
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Today's progress</div>
          <div className={styles.stat}>Hearts today: {save.dailyHeartsEarned} / {save.dailyHeartCap}</div>
          <div className={styles.stat}>Total hearts: {save.totalHearts}</div>
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
```

- [ ] **Step 3: Add settings toggle button + mount in `App.jsx`**

```jsx
import { useState } from 'react'
import { ParentSettings } from './ui/components/ParentSettings/ParentSettings'

// In App(), add:
const [showSettings, setShowSettings] = useState(false)

// In return:
<button
  onClick={() => setShowSettings(true)}
  style={{ position: 'fixed', top: 8, left: 8, zIndex: 10, fontFamily: 'Press Start 2P', fontSize: '8px', background: '#263238', border: '2px solid #455a64', color: '#cfd8dc', padding: '6px 10px', cursor: 'pointer', minHeight: 44 }}
>
  ⚙️
</button>
{showSettings && <ParentSettings onClose={() => setShowSettings(false)} />}
```

- [ ] **Step 4: Manual test**

Open settings, change skill level, close, click an NPC — verify the correct task type appears. Change daily heart cap, verify it takes effect.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: parent settings screen with skill level, audio, daily cap, and save codes"
```

---

## Task 17: Mobile D-Pad

**Files:**
- Create: `src/ui/components/DPad/DPad.jsx`, `DPad.module.css`
- Modify: `src/App.jsx`, `src/game/EventBus.js` (no changes needed — use existing EventBus)

- [ ] **Step 1: Create `DPad.module.css`**

```css
.dpad {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 10;
  display: grid;
  grid-template-columns: 44px 44px 44px;
  grid-template-rows: 44px 44px 44px;
  gap: 4px;
}

.btn {
  background: rgba(0,0,0,0.5);
  border: 2px solid rgba(255,255,255,0.3);
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  border-radius: 4px;
  touch-action: none;
}

.btn:active { background: rgba(255,255,255,0.2); }
.empty { background: transparent; border: none; pointer-events: none; }
```

- [ ] **Step 2: Create `DPad.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { EventBus } from '../../../game/EventBus'
import styles from './DPad.module.css'

const DIRS = ['up', 'down', 'left', 'right']

export function DPad() {
  const [touch, setTouch] = useState(false)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    // Only show on touch devices
    setTouch('ontouchstart' in window)
    // Capture listener refs so we only remove these specific listeners, not all listeners for the event
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
      {btn('up',    '▲', 2, 1)}
      {btn('left',  '◀', 1, 2)}
      <div className={`${styles.btn} ${styles.empty}`} style={{ gridColumn: 2, gridRow: 2 }} />
      {btn('right', '▶', 3, 2)}
      {btn('down',  '▼', 2, 3)}
    </div>
  )
}
```

- [ ] **Step 3: Connect D-pad events to Player in `WorldScene.js`**

In `WorldScene.create()`, add:

```js
EventBus.on('dpad', ({ dir, active }) => {
  this.player.setDpad(dir, active)
}, this)
```

- [ ] **Step 4: Add `<DPad />` to `App.jsx`**

```jsx
import { DPad } from './ui/components/DPad/DPad'
// Add <DPad /> to overlay div
```

- [ ] **Step 5: Manual test on iPhone**

Open dev server on local network (`npm run dev -- --host`), open on iPhone Safari. D-pad should appear. Buttons should move the player.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: touch D-pad for mobile with task-bubble lockout"
```

---

## Task 18: Run All Tests + Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests PASS (wordSelector, saveSystem, progressionEngine, sessionManager, distractorGenerator).

- [ ] **Step 2: Manual smoke test — full game loop**

Open `http://localhost:5173`. Verify:
- [ ] Tap to Start loads, Mayor Hop intro appears
- [ ] Player moves with WASD/arrows
- [ ] Clicking an NPC shows correct task type (change via settings)
- [ ] Correct answer awards 3/2/1 hearts
- [ ] HUD updates after each task
- [ ] Quest banner increments
- [ ] Daily cap triggers Mayor Hop goodbye at 10 hearts
- [ ] Unlock modal appears at 10 hearts, NPC un-greys
- [ ] Parent settings: all controls work, save code exports/imports

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: full test suite passing, manual smoke test complete"
```

---

## Task 19: Deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create GitHub Actions deploy workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 2: Add build script check to package.json**

Verify `"build": "vite build"` exists in scripts. Run it locally first:

```bash
npm run build
```

Expected: `dist/` directory created with no errors.

- [ ] **Step 3: Create GitHub public repo and push**

```bash
cd /Users/emsot/Projects/kids-games
gh repo create pixel-learn --public --source=pixel-learn --remote=origin --push
```

- [ ] **Step 4: Enable GitHub Pages in repo settings**

Go to GitHub repo → Settings → Pages → Source: `gh-pages` branch. Wait ~2 minutes for deploy.

- [ ] **Step 5: Verify live URL**

Open `https://<username>.github.io/pixel-learn`. Game should load and be playable.

- [ ] **Step 6: Commit workflow file**

```bash
git add .github/
git commit -m "feat: GitHub Actions deploy to GitHub Pages"
git push
```

---

## Notes for the Agent Team

**UX Designer:** Replace placeholder coloured rectangles in `BootScene.js` with real 32×32 pixel art sprites. All sprite keys are listed in `BootScene.js`. The tilemap (`world_bg`) should be replaced with a proper Tiled JSON tilemap loaded via `this.load.tilemapTiledJSON()`.

**QA:** Use Task 18 smoke test checklist. Also test on iPhone Safari — verify D-pad appears, TTS fires on first interaction, no viewport scaling issues.

**5-year-old Critic:** Play as Beginner. Can you tell what the NPC wants? Is the emoji clue clear? Are the buttons big enough to tap?

**10-year-old Critic:** Play as Advanced. Is the scramble too easy or too hard? Do the hints feel fair?
