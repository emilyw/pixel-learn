import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { loadSave, writeSave } from '../../logic/saveSystem'
import { addDailyHearts, incrementQuestProgress, isDailyCapped, getQuestTarget } from '../../logic/sessionManager'
import { getNewUnlocks } from '../../logic/progressionEngine'

// --- difficulty config per skill level ---
const DIFFICULTY = {
  beginner:     { fallSpeed: 35, maxSeeds: 1, spawnInterval: 1800, flashMs: 3000, correctProb: 0.65, forceAfter: 1, penaltyEnabled: false },
  intermediate: { fallSpeed: 55, maxSeeds: 2, spawnInterval: 1400, flashMs: 2000, correctProb: 0.50, forceAfter: 2, penaltyEnabled: true },
  advanced:     { fallSpeed: 80, maxSeeds: 3, spawnInterval: 1000, flashMs: 1500, correctProb: 0.40, forceAfter: 3, penaltyEnabled: true },
}

// --- zone coordinates ---
const GARDEN_BOUNDS = { x: 80, y: 280, width: 180, height: 70 }
const GARDEN_CENTER = { x: 170, y: 315 }
const GARDEN_EDGE   = { x: 72, y: 340 }
const SPROUT_POS    = { x: 68, y: 310 }
const POT_ROW_Y     = 340
const SEED_TOP_Y    = 280
const FALL_DISTANCE  = POT_ROW_Y - SEED_TOP_Y // 60px

// =========================================================================
// setupGarden — called once from WorldScene.create()
// =========================================================================
export function setupGarden(scene) {
  scene._gardenBounds = { ...GARDEN_BOUNDS }
  scene._gardenCenter = { ...GARDEN_CENTER }
  scene._gardenEdge   = { ...GARDEN_EDGE }
  scene._gardening    = false
  scene._gardenSeeds  = null
  scene._gardenPots   = null
  scene._gardenTimer  = null
  scene._gardenFlowers = []

  // Sprout NPC (uses Mossy sprite, tinted green)
  const sprout = scene.add.sprite(SPROUT_POS.x, SPROUT_POS.y, 'npc_mossy', 8)
  sprout.setTint(0x7cb342)
  sprout.setScale(0.7)
  sprout.setDepth(90)
  scene.add.text(SPROUT_POS.x, SPROUT_POS.y - 16, 'Sprout', {
    fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ffffff',
    stroke: '#000000', strokeThickness: 2,
  }).setOrigin(0.5, 1).setDepth(91)

  // Leaf emoji at exit point
  scene.add.text(GARDEN_EDGE.x, GARDEN_EDGE.y, '\uD83C\uDF3F', {
    fontSize: '10px',
  }).setOrigin(0.5).setDepth(89)

  // Sprout click interaction
  sprout.setInteractive({ useHandCursor: true })
  sprout.on('pointerdown', () => tryEnterGarden(scene))

  // Shutdown cleanup
  scene.events.on('shutdown', () => {
    if (scene._gardening) exitGarden(scene, false)
  })
}

// =========================================================================
// tryEnterGarden — guard checks before entering
// =========================================================================
export function tryEnterGarden(scene) {
  const save = loadSave()
  if (scene._gardening || scene._swimming || scene._chopping) return
  if (save.activeMission && save.activeMission.type !== 'garden') {
    _showSproutDialogue(scene, 'Finish what you\'re doing first, then come plant!')
    EventBus.emit('garden-denied', { reason: 'active-mission' })
    return
  }
  if (isDailyCapped(save)) {
    _showSproutDialogue(scene, 'You\'ve grown enough for today! Come back tomorrow.')
    EventBus.emit('garden-denied', { reason: 'daily-cap' })
    return
  }
  if (!scene._sproutVisited) {
    _showSproutDialogue(scene, 'Want to grow a word? Catch the right seeds in the pots!')
    scene._sproutVisited = true
  }
  enterGarden(scene, save)
}

// =========================================================================
// enterGarden — teleport, select word, flash, spawn pots, start seeds
// =========================================================================
export function enterGarden(scene, save) {
  scene._gardening = true
  scene.player.setBlocked(true)

  // Disable world collision
  if (scene._collider) scene._collider.active = false

  // Teleport to garden center
  scene.player.setPosition(GARDEN_CENTER.x, GARDEN_CENTER.y)
  if (scene._playerArrow) scene._playerArrow.setVisible(false)

  // Screen shake + "PLANT!" text
  scene.cameras.main.shake(50, 0.005)
  const plantText = scene.add.text(GARDEN_CENTER.x, GARDEN_CENTER.y - 20, 'PLANT!', {
    fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffffff',
    stroke: '#4caf50', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(105)
  scene.tweens.add({
    targets: plantText, alpha: 0, y: plantText.y - 30,
    duration: 1000, ease: 'Sine.easeOut',
    onComplete: () => plantText.destroy(),
  })

  // Apply garden mode (horizontal movement only, y locked)
  scene.player.setGardenMode(GARDEN_BOUNDS)
  scene.player.setDepth(100)

  // --- select word ---
  let gardenWord, gardenEmoji
  if (save.activeMission && save.activeMission.type === 'garden') {
    gardenWord = save.activeMission.word.toLowerCase()
    gardenEmoji = save.activeMission.emoji || ''
  } else {
    const bank = scene._wordBanks[save.skillLevel]
    const wordEntry = bank[Math.floor(Math.random() * bank.length)]
    gardenWord = wordEntry.word.toLowerCase()
    gardenEmoji = wordEntry.emoji || ''
  }
  scene._gardenWord = gardenWord
  scene._gardenEmoji = gardenEmoji
  scene._gardenLettersCollected = 0
  scene._gardenGoldenIndex = Math.random() < 0.2 ? Math.floor(Math.random() * gardenWord.length) : -1
  scene._gardenFoundGolden = false
  scene._gardenWrongCount = 0
  scene._gardenConsecutiveDistractors = 0
  scene._gardenFlowers = []

  const skill = save.skillLevel
  const cfg = DIFFICULTY[skill] || DIFFICULTY.beginner
  scene._gardenDifficulty = cfg

  // Emit event for React HUD
  EventBus.emit('garden-enter', { word: gardenWord, emoji: gardenEmoji, flashMs: cfg.flashMs })

  // Speak the word aloud
  try {
    if (save.audioEnabled) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(gardenWord)
      utt.rate = 0.8
      utt.pitch = 1.1
      window.speechSynthesis.speak(utt)
    }
  } catch (_) { /* speech not available */ }

  // Delay pot spawning + player unblock until after flash
  scene.time.delayedCall(cfg.flashMs, () => {
    _spawnPots(scene)
    _startSeedTimer(scene)
    scene.player.setBlocked(false)
  })
}

// =========================================================================
// completeGardenWord — celebration, scoring, save update
// =========================================================================
export function completeGardenWord(scene) {
  scene.player.setBlocked(true)

  // Stop seed spawning
  if (scene._gardenTimer) {
    scene._gardenTimer.remove()
    scene._gardenTimer = null
  }

  // Destroy remaining seeds
  if (scene._gardenSeeds) {
    scene._gardenSeeds.forEach(s => _destroySeed(scene, s))
    scene._gardenSeeds = []
  }

  // "Beautiful!" celebration text with bounce
  const celebText = scene.add.text(GARDEN_CENTER.x, GARDEN_CENTER.y - 20, 'Beautiful!', {
    fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffeb3b',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(110).setScale(0)

  scene.tweens.add({
    targets: celebText, scale: 1, y: celebText.y - 10,
    duration: 500, ease: 'Bounce.easeOut',
  })
  scene.tweens.add({
    targets: celebText, alpha: 0,
    duration: 500, delay: 1000,
    onComplete: () => celebText.destroy(),
  })

  // Bloom all pots
  if (scene._gardenPots) {
    scene._gardenPots.forEach(pot => {
      scene.tweens.add({
        targets: pot.bg, y: pot.y - 6,
        duration: 200, yoyo: true,
        ease: 'Bounce.easeOut',
      })
    })
  }

  // --- scoring ---
  let hearts
  let save = loadSave()
  if (save.activeMission && save.activeMission.type === 'garden') {
    // Mission mode: 3/2/1 based on wrong catches
    if (scene._gardenWrongCount <= 1) hearts = 3
    else if (scene._gardenWrongCount <= 3) hearts = 2
    else hearts = 1
    save.activeMission = null
  } else {
    hearts = 1
  }
  if (scene._gardenFoundGolden) hearts++

  // Update save stats
  save.plantsGrown = (save.plantsGrown || 0) + 1
  save.plantsGrownToday = (save.plantsGrownToday || 0) + 1
  if (scene._gardenFoundGolden) {
    save.goldenLettersFound = (save.goldenLettersFound || 0) + 1
  }

  save = addDailyHearts(save, hearts)
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

  writeSave(save)
  EventBus.emit('save-updated')

  EventBus.emit('hearts-earned', {
    amount: hearts,
    screenX: scene.scale.width / 2,
    screenY: scene.scale.height / 2,
  })

  if (newUnlocks.length > 0) {
    EventBus.emit('unlocks-pending', newUnlocks)
  }

  if (isDailyCapped(save)) {
    EventBus.emit('daily-cap-reached')
  }

  EventBus.emit('garden-word-complete', { word: scene._gardenWord, heartsEarned: hearts })

  scene.time.delayedCall(1200, () => {
    exitGarden(scene, true)
  })
}

// =========================================================================
// exitGarden — cleanup all garden objects
// =========================================================================
export function exitGarden(scene, completed) {
  // Stop seed timer
  if (scene._gardenTimer) {
    scene._gardenTimer.remove()
    scene._gardenTimer = null
  }

  // Destroy all seeds
  if (scene._gardenSeeds) {
    scene._gardenSeeds.forEach(s => _destroySeed(scene, s))
    scene._gardenSeeds = null
  }

  // Destroy pots
  if (scene._gardenPots) {
    scene._gardenPots.forEach(pot => {
      if (pot.bg && pot.bg.scene) pot.bg.destroy()
      if (pot.text && pot.text.scene) pot.text.destroy()
    })
    scene._gardenPots = null
  }

  // Destroy flowers
  if (scene._gardenFlowers) {
    scene._gardenFlowers.forEach(f => {
      if (f && f.scene) f.destroy()
    })
    scene._gardenFlowers = []
  }

  // Destroy ghost labels
  if (scene._gardenGhostLabels) {
    scene._gardenGhostLabels.forEach(l => {
      if (l && l.scene) l.destroy()
    })
    scene._gardenGhostLabels = null
  }

  // Clear garden mode
  scene.player.clearGardenMode()
  scene._gardening = false

  // Re-enable world collision
  if (scene._collider) scene._collider.active = true

  // Teleport to Sprout position
  scene.player.setPosition(SPROUT_POS.x, SPROUT_POS.y)
  scene.player.setBlocked(false)

  // Show arrow again
  if (scene._playerArrow) scene._playerArrow.setVisible(true)

  EventBus.emit('garden-exit', { completed })
}

// =========================================================================
// updateGarden — called from WorldScene.update() for exit proximity check
// =========================================================================
export function updateGarden(scene) {
  if (!scene._gardening) return

  // Seed catch detection
  if (scene._gardenSeeds) {
    for (let i = scene._gardenSeeds.length - 1; i >= 0; i--) {
      const seed = scene._gardenSeeds[i]
      if (seed.caught || seed.destroyed) continue
      _updateSeed(scene, seed)
    }
  }

  // Exit proximity check — leaf emoji at garden edge
  const exitDist = Phaser.Math.Distance.Between(
    scene.player.x, scene.player.y, GARDEN_EDGE.x, GARDEN_EDGE.y
  )
  if (exitDist < 12) {
    exitGarden(scene, false)
  }
}

// =========================================================================
// PRIVATE HELPERS
// =========================================================================

function _showSproutDialogue(scene, msg) {
  const dialogBg = scene.add.rectangle(GARDEN_CENTER.x, GARDEN_CENTER.y - 50, 200, 40, 0x000000, 0.8)
  dialogBg.setDepth(200).setStrokeStyle(1, 0x7cb342)
  const dialogText = scene.add.text(GARDEN_CENTER.x, GARDEN_CENTER.y - 50, msg, {
    fontFamily: '"Press Start 2P"', fontSize: '5px', color: '#ffffff',
    wordWrap: { width: 190 }, align: 'center',
  }).setOrigin(0.5).setDepth(201)
  scene.time.delayedCall(2500, () => {
    dialogBg.destroy()
    dialogText.destroy()
  })
}

// --- pot spawning ---
function _spawnPots(scene) {
  scene._gardenPots = []
  scene._gardenGhostLabels = []
  const word = scene._gardenWord
  const potCount = word.length
  const bounds = GARDEN_BOUNDS
  const spacing = bounds.width / (potCount + 1)

  for (let i = 0; i < potCount; i++) {
    const x = bounds.x + spacing * (i + 1)
    const y = POT_ROW_Y
    const isGolden = i === scene._gardenGoldenIndex

    // Pot visual (brown rectangle)
    const bg = scene.add.rectangle(x, y, 16, 14, isGolden ? 0xffd700 : 0x795548)
    bg.setStrokeStyle(1, isGolden ? 0xffab00 : 0x4e342e)
    bg.setDepth(94)

    // Ghost label showing the expected letter (faded)
    const ghost = scene.add.text(x, y - 10, word[i], {
      fontFamily: '"Press Start 2P"', fontSize: '7px',
      color: isGolden ? '#ffd700' : '#a5d6a7',
    }).setOrigin(0.5).setDepth(93).setAlpha(0.35)
    scene._gardenGhostLabels.push(ghost)

    // Letter text on pot (hidden until bloomed)
    const text = scene.add.text(x, y, '', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(96)
    text.setVisible(false)

    scene._gardenPots.push({ bg, text, x, y, index: i, letter: word[i], bloomed: false, isGolden })
  }

  scene._gardenSeeds = []
}

// --- seed timer ---
function _startSeedTimer(scene) {
  const cfg = scene._gardenDifficulty
  scene._gardenTimer = scene.time.addEvent({
    delay: cfg.spawnInterval,
    loop: true,
    callback: () => _spawnSeed(scene),
  })
  // Spawn first seed immediately
  _spawnSeed(scene)
}

// --- seed spawning ---
function _spawnSeed(scene) {
  if (!scene._gardening || !scene._gardenPots) return

  const cfg = scene._gardenDifficulty
  const word = scene._gardenWord
  const nextIndex = scene._gardenLettersCollected

  // If word is complete, don't spawn
  if (nextIndex >= word.length) return

  // Limit active seeds
  const activeSeeds = scene._gardenSeeds ? scene._gardenSeeds.filter(s => !s.caught && !s.destroyed) : []
  if (activeSeeds.length >= cfg.maxSeeds) return

  // Decide if this seed is correct
  const forceCorrect = scene._gardenConsecutiveDistractors >= cfg.forceAfter
  const isCorrect = forceCorrect || Math.random() < cfg.correctProb

  let letter, targetPotIndex
  if (isCorrect) {
    letter = word[nextIndex]
    targetPotIndex = nextIndex
    scene._gardenConsecutiveDistractors = 0
  } else {
    // Distractor: random letter not the target, aimed at a random non-target pot
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'
    do {
      letter = alphabet[Math.floor(Math.random() * 26)]
    } while (letter === word[nextIndex])
    // Pick a random pot that is NOT the target
    const otherPots = scene._gardenPots.filter((_, idx) => idx !== nextIndex && !scene._gardenPots[idx].bloomed)
    if (otherPots.length > 0) {
      const pick = otherPots[Math.floor(Math.random() * otherPots.length)]
      targetPotIndex = pick.index
    } else {
      targetPotIndex = nextIndex // fallback
    }
    scene._gardenConsecutiveDistractors++
  }

  // Target pot x position
  const targetPot = scene._gardenPots[targetPotIndex]
  if (!targetPot) return

  const startX = targetPot.x + (Math.random() - 0.5) * 8  // slight horizontal jitter
  const startY = SEED_TOP_Y

  const isGolden = isCorrect && nextIndex === scene._gardenGoldenIndex

  // Record player's pot index at spawn time for active/passive detection
  const playerPotAtSpawn = _getPlayerPotIndex(scene)

  // Create seed visual
  const seedBg = scene.add.rectangle(startX, startY, 12, 12, isGolden ? 0xffd700 : 0x66bb6a)
  seedBg.setStrokeStyle(1, isGolden ? 0xffab00 : 0x388e3c)
  seedBg.setDepth(97)

  const seedText = scene.add.text(startX, startY, letter, {
    fontFamily: '"Press Start 2P"', fontSize: '8px',
    color: isGolden ? '#3e2723' : '#ffffff',
  }).setOrigin(0.5).setDepth(98)

  // Shimmer for golden
  let shimmerTween = null
  if (isGolden) {
    shimmerTween = scene.tweens.add({
      targets: seedBg, alpha: 0.7,
      duration: 300, yoyo: true, repeat: -1,
    })
  }

  // Fall tween
  const fallDuration = (FALL_DISTANCE / cfg.fallSpeed) * 1000
  const fallTween = scene.tweens.add({
    targets: [seedBg, seedText],
    y: POT_ROW_Y,
    duration: fallDuration,
    ease: 'Linear',
    onComplete: () => _seedLanded(scene, seed),
  })

  const seed = {
    bg: seedBg,
    text: seedText,
    letter,
    isCorrect,
    isGolden,
    targetPotIndex,
    playerPotAtSpawn,
    fallTween,
    shimmerTween,
    caught: false,
    destroyed: false,
  }

  if (!scene._gardenSeeds) scene._gardenSeeds = []
  scene._gardenSeeds.push(seed)
}

// --- get which pot index the player is closest to ---
function _getPlayerPotIndex(scene) {
  if (!scene._gardenPots || scene._gardenPots.length === 0) return -1
  let closest = 0
  let minDist = Infinity
  scene._gardenPots.forEach((pot, i) => {
    const d = Math.abs(scene.player.x - pot.x)
    if (d < minDist) {
      minDist = d
      closest = i
    }
  })
  return closest
}

// --- seed update: check if seed reached pot row or player collision ---
function _updateSeed(scene, seed) {
  if (seed.caught || seed.destroyed) return

  // Check if seed is at pot row level
  const seedY = seed.bg.y
  if (seedY < POT_ROW_Y - 2) return  // still falling, wait for tween

  // Seed has reached pot row — handled by _seedLanded via tween onComplete
}

// --- seed landed at pot row ---
function _seedLanded(scene, seed) {
  if (seed.caught || seed.destroyed || !scene._gardening) return
  seed.caught = true

  // Determine which pot the seed landed on
  const landedPotIndex = seed.targetPotIndex
  const playerPotIndex = _getPlayerPotIndex(scene)

  // Check if player is at the pot where the seed landed
  const playerAtPot = playerPotIndex === landedPotIndex
  const pot = scene._gardenPots[landedPotIndex]

  if (!playerAtPot) {
    // Missed seed — bounces off, no penalty
    _bounceSeed(scene, seed)
    return
  }

  // Player is at this pot
  if (seed.isCorrect && landedPotIndex === scene._gardenLettersCollected) {
    // Correct seed at correct pot = bloom!
    _bloomPot(scene, seed, pot)
  } else {
    // Wrong seed caught — check active vs passive
    const playerMovedToIt = seed.playerPotAtSpawn !== playerPotIndex
    if (playerMovedToIt && scene._gardenDifficulty.penaltyEnabled) {
      // Active catch of wrong seed = wilt + penalty
      _wiltSeed(scene, seed, pot)
    } else {
      // Passive catch (player was already there) = bounces off, no penalty
      _bounceSeed(scene, seed)
    }
  }
}

// --- bloom animation: correct seed caught ---
function _bloomPot(scene, seed, pot) {
  const isGolden = seed.isGolden
  if (isGolden) scene._gardenFoundGolden = true

  // Stop seed tweens
  if (seed.fallTween) seed.fallTween.stop()
  if (seed.shimmerTween) seed.shimmerTween.stop()

  // Seed absorbs into pot
  scene.tweens.add({
    targets: [seed.bg, seed.text],
    scaleX: 0, scaleY: 0, alpha: 0,
    duration: 200,
    onComplete: () => {
      if (seed.bg && seed.bg.scene) seed.bg.destroy()
      if (seed.text && seed.text.scene) seed.text.destroy()
    },
  })

  // Pot blooms — green flash + flower emoji sprouts above
  pot.bloomed = true
  pot.bg.setFillStyle(0x4caf50)
  scene.tweens.add({
    targets: pot.bg,
    scaleY: 1.3,
    duration: 200,
    yoyo: true,
    onComplete: () => {
      pot.bg.setFillStyle(0x795548)
      pot.bg.setScale(1)
    },
  })

  // Flower emoji above pot
  const flowerEmojis = ['\uD83C\uDF3B', '\uD83C\uDF3A', '\uD83C\uDF37', '\uD83C\uDF38', '\uD83C\uDF3C']
  const flowerText = scene.add.text(pot.x, pot.y - 14,
    isGolden ? '\u2B50' : flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)], {
    fontSize: '10px',
  }).setOrigin(0.5).setDepth(99)
  scene._gardenFlowers.push(flowerText)

  // Hide ghost label for this pot
  if (scene._gardenGhostLabels && scene._gardenGhostLabels[pot.index]) {
    scene._gardenGhostLabels[pot.index].setVisible(false)
  }

  // Advance letter counter
  scene._gardenLettersCollected++
  EventBus.emit('garden-letter-collect', {
    letter: seed.letter,
    index: scene._gardenLettersCollected - 1,
    isGolden,
    isCorrect: true,
  })

  // Speak the letter
  try {
    const audioSave = loadSave()
    if (audioSave.audioEnabled) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(seed.letter)
      utt.rate = 0.9
      utt.pitch = 1.2
      window.speechSynthesis.speak(utt)
    }
  } catch (_) { /* speech not available */ }

  // Check if word is complete
  if (scene._gardenLettersCollected >= scene._gardenWord.length) {
    completeGardenWord(scene)
  }
}

// --- wilt animation: wrong seed caught actively ---
function _wiltSeed(scene, seed, pot) {
  scene._gardenWrongCount++

  EventBus.emit('garden-letter-collect', {
    letter: seed.letter,
    index: -1,
    isGolden: false,
    isCorrect: false,
  })

  // Red flash on pot
  const origColor = pot.isGolden ? 0xffd700 : 0x795548
  pot.bg.setFillStyle(0xd32f2f)
  scene.tweens.add({
    targets: pot.bg,
    scaleX: 0.8,
    duration: 100,
    yoyo: true,
    repeat: 2,
    onComplete: () => {
      pot.bg.setFillStyle(origColor)
      pot.bg.setScale(1)
    },
  })

  // Seed wilts and fades
  if (seed.fallTween) seed.fallTween.stop()
  if (seed.shimmerTween) seed.shimmerTween.stop()
  seed.bg.setFillStyle(0x8b4513)
  scene.tweens.add({
    targets: [seed.bg, seed.text],
    alpha: 0, y: seed.bg.y + 10,
    duration: 400,
    onComplete: () => {
      if (seed.bg && seed.bg.scene) seed.bg.destroy()
      if (seed.text && seed.text.scene) seed.text.destroy()
      seed.destroyed = true
    },
  })
}

// --- bounce animation: missed or passively caught wrong seed ---
function _bounceSeed(scene, seed) {
  if (seed.fallTween) seed.fallTween.stop()
  if (seed.shimmerTween) seed.shimmerTween.stop()

  // Bounce up then fade
  scene.tweens.add({
    targets: [seed.bg, seed.text],
    y: seed.bg.y - 15,
    alpha: 0,
    duration: 400,
    ease: 'Quad.easeOut',
    onComplete: () => {
      if (seed.bg && seed.bg.scene) seed.bg.destroy()
      if (seed.text && seed.text.scene) seed.text.destroy()
      seed.destroyed = true
    },
  })
}

// --- destroy a seed immediately ---
function _destroySeed(scene, seed) {
  if (seed.fallTween) seed.fallTween.stop()
  if (seed.shimmerTween) seed.shimmerTween.stop()
  if (seed.bg && seed.bg.scene) seed.bg.destroy()
  if (seed.text && seed.text.scene) seed.text.destroy()
  seed.destroyed = true
}
