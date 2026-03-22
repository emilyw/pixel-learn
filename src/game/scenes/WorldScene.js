import Phaser, { Scene } from 'phaser'
import { Player } from '../entities/Player'
import { EventBus } from '../EventBus'
import { loadSave, writeSave } from '../../logic/saveSystem'
import { completeDelivery } from '../../logic/missionSystem'
import { NPCS } from '../../data/npcs'
import { isDailyCapped, addDailyHearts, incrementQuestProgress } from '../../logic/sessionManager'
import beginnerBank from '../../data/words/beginner.json'
import intermediateBank from '../../data/words/intermediate.json'
import advancedBank from '../../data/words/advanced.json'

export class WorldScene extends Scene {
  constructor() { super('WorldScene') }

  create() {
    this.physics.world.setBounds(0, 0, 960, 640)

    // --- tilemap ---
    const map = this.make.tilemap({ key: 'village' })
    const tileset = map.addTilesetImage('terrain', 'tileset_terrain')

    map.createLayer('Ground', tileset)
    map.createLayer('Paths', tileset)
    map.createLayer('Water', tileset)
    map.createLayer('Decorations', tileset)

    const collisionLayer = map.createLayer('Collision', tileset)
    collisionLayer.setVisible(false)
    collisionLayer.setCollisionByExclusion([-1])

    // --- village buildings ---
    const buildings = [
      { key: 'building_blue_house',  x: 200, y: 130, scale: 0.5, name: 'Town Hall' },
      { key: 'building_red_house',   x: 360, y: 70,  scale: 0.5, name: 'Fire Station' },
      { key: 'building_green_house', x: 100, y: 200, scale: 0.5, name: 'Garden House' },
      { key: 'building_blue_shop',   x: 420, y: 220, scale: 0.45, name: 'Book Shop' },
      { key: 'building_red_shop',    x: 300, y: 280, scale: 0.45, name: 'Bakery' },
      { key: 'building_green_house', x: 550, y: 150, scale: 0.5, name: 'School' },
      { key: 'building_red_house',   x: 700, y: 100, scale: 0.5, name: 'Gym' },
      { key: 'building_blue_house',  x: 800, y: 250, scale: 0.5, name: 'Library' },
    ]
    buildings.forEach(({ key, x, y, scale, name }) => {
      const b = this.add.sprite(x, y, key, 0)
      b.setScale(scale)
      b.setDepth(y)
      b.setOrigin(0.5, 1)
      // Building name sign on top of building
      const buildingH = key.includes('shop') ? 128 * scale : 112 * scale
      const sign = this.add.text(x, y - buildingH - 2, name, {
        fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#3e2723',
        backgroundColor: '#d7ccc8', padding: { x: 3, y: 2 },
        wordWrap: { width: 80 }, align: 'center',
      })
      sign.setOrigin(0.5, 1)
      sign.setDepth(y + 1)
    })

    // --- player ---
    const data = this.scene.settings.data || {}
    const startX = data.returnTo ? data.returnTo.x : 480
    const startY = data.returnTo ? data.returnTo.y : 320
    this.player = new Player(this, startX, startY)
    this.player.setDepth(100)
    this._collider = this.physics.add.collider(this.player, collisionLayer)

    // --- player indicator arrow ---
    this._playerArrow = this.add.triangle(startX, startY - 14, 0, 8, 5, 0, 10, 8, 0xffeb3b)
    this._playerArrow.setOrigin(0.5, 1)
    this._playerArrow.setDepth(101)
    this._arrowBob = 0
    this.tweens.add({
      targets: this,
      _arrowBob: -4,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.cameras.main.setBounds(0, 0, 960, 640)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    // --- NPCs ---
    this._save = loadSave()
    this._npcs = {}

    // Build a lookup of NPC positions from the tilemap object layer
    const npcPositions = {}
    const npcLayer = map.getObjectLayer('npcs')
    if (npcLayer) {
      npcLayer.objects.forEach((obj) => {
        npcPositions[obj.name] = { x: obj.x, y: obj.y }
      })
    }

    NPCS.forEach((def) => {
      // Use tilemap position if available, otherwise fall back to def
      const pos = npcPositions[def.id] || { x: def.x, y: def.y }
      this._spawnNPC(def, pos.x, pos.y)
    })

    EventBus.on('task-open',  () => this.player.setBlocked(true),  this)
    EventBus.on('task-close', () => this.player.setBlocked(false), this)

    EventBus.on('npc-unlocked', ({ npcId }) => this._unlockNPC(npcId), this)

    EventBus.on('dpad', ({ dir, active }) => {
      this.player.setDpad(dir, active)
    }, this)

    // --- mini map ---
    this._createMiniMap(map)

    // --- night cutscene on daily cap ---
    EventBus.on('daily-cap-reached', () => this._playNightCutscene(), this)

    EventBus.emit('world-ready')

    // --- library door zone ---
    const doorZone = this.add.zone(800, 250, 32, 16)
    this.physics.add.existing(doorZone, true)
    this.physics.add.overlap(this.player, doorZone, () => {
      EventBus.emit('enter-library')
      this.scene.start('LibraryScene')
    })

    // --- delivery missions ---
    EventBus.on('mission-start', ({ mission }) => {
      this._activeMission = mission
    }, this)

    this._activeMission = loadSave().activeMission

    // --- pond swimming ---
    this._wordBanks = { beginner: beginnerBank, intermediate: intermediateBank, advanced: advancedBank }

    // Right pond: tiles (45,25)-(50,28) → pixels (720,400)-(816,464) — largest pond
    // Swim bounds padded for playable area
    this._pondBounds = { x: 720, y: 400, width: 96, height: 64 }
    this._pondCenter = { x: 768, y: 432 }
    this._pondEdge = { x: 712, y: 440 } // lily pad / exit point (left edge)
    this._swimming = false
    this._letterTiles = null

    // Bubbles the frog - sits just outside pond collision at left edge
    const bubbles = this.add.sprite(712, 410, 'npc_mayor_hop', 8)
    bubbles.setTint(0x4caf50)
    bubbles.setScale(0.7)
    bubbles.setDepth(90)
    this.add.text(712, 394, 'Bubbles', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(91)

    // Lily pad visual at exit point
    this.add.circle(this._pondEdge.x, this._pondEdge.y, 8, 0x4caf50).setDepth(89).setAlpha(0.8)
    this.add.circle(this._pondEdge.x + 2, this._pondEdge.y - 1, 6, 0x66bb6a).setDepth(89).setAlpha(0.7)

    // Bubbles click interaction
    bubbles.setInteractive({ useHandCursor: true })
    bubbles.on('pointerdown', () => this._tryEnterPond())

    // Shutdown cleanup
    this.events.on('shutdown', () => {
      if (this._swimming) this._exitPond(false)
    })
  }

  _spawnNPC(def, x, y) {
    const isUnlocked = this._save.unlockedNpcs.includes(def.id)
    const sprite = this.add.sprite(x, y, def.sprite, 8)

    // Name label above head
    const nameLabel = this.add.text(x, y - 24, def.name, {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    })
    nameLabel.setOrigin(0.5, 1)
    nameLabel.setDepth(99)

    if (isUnlocked) {
      if (def.tint != null) sprite.setTint(def.tint)
      sprite.setInteractive({ useHandCursor: true })
      sprite.on('pointerdown', () => this._onNPCClick(def, sprite))
    } else {
      sprite.setTint(0x555555)
      nameLabel.setAlpha(0.5)
      this.add.image(x, y - 20, 'padlock').setScale(0.6)
    }

    this._npcs[def.id] = { def, sprite, nameLabel }
  }

  _onNPCClick(def, sprite) {
    const cam = this.cameras.main
    const screenX = (sprite.x - cam.scrollX) * cam.zoom
    const screenY = (sprite.y - cam.scrollY) * cam.zoom

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
    if (entry.def.tint != null) entry.sprite.setTint(entry.def.tint)
    entry.sprite.setInteractive({ useHandCursor: true })
    entry.sprite.on('pointerdown', () => this._onNPCClick(entry.def, entry.sprite))
    if (entry.nameLabel) entry.nameLabel.setAlpha(1)
  }

  _playNightCutscene() {
    const { width, height } = this.scale

    // Block player movement
    this.player.setBlocked(true)

    // Add Zzz above each NPC
    const zzzTexts = []
    Object.values(this._npcs).forEach(({ sprite }) => {
      const zzz = this.add.text(sprite.x, sprite.y - 30, 'Zzz', {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aaaaff',
        stroke: '#000000', strokeThickness: 2,
      })
      zzz.setOrigin(0.5, 1)
      zzz.setDepth(102)
      zzz.setAlpha(0)
      zzzTexts.push(zzz)

      // Float and fade in
      this.tweens.add({
        targets: zzz, alpha: 1, y: sprite.y - 40,
        duration: 800, ease: 'Sine.easeOut',
      })
      // Bobbing loop
      this.tweens.add({
        targets: zzz, y: sprite.y - 44,
        duration: 1000, yoyo: true, repeat: -1, delay: 800,
        ease: 'Sine.easeInOut',
      })
    })

    // Dark overlay — covers the whole world, not just camera
    const nightOverlay = this.add.rectangle(480, 320, 960, 640, 0x0a0a2e)
    nightOverlay.setDepth(150)
    nightOverlay.setAlpha(0)

    // Fade to night
    this.tweens.add({
      targets: nightOverlay, alpha: 0.6,
      duration: 2000, ease: 'Sine.easeInOut',
    })

    // After night settles, show moon & stars cutscene
    this.time.delayedCall(2500, () => {
      // Full-screen cutscene overlay (fixed to camera)
      const cutsceneBg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a2e)
      cutsceneBg.setScrollFactor(0)
      cutsceneBg.setDepth(300)
      cutsceneBg.setAlpha(0)

      // Moon
      const moon = this.add.circle(width / 2, height / 2 - 20, 30, 0xfffde7)
      moon.setScrollFactor(0)
      moon.setDepth(301)
      moon.setAlpha(0)
      moon.setScale(0.3)

      // Moon crater details
      const crater1 = this.add.circle(width / 2 - 8, height / 2 - 26, 5, 0xfff9c4)
      const crater2 = this.add.circle(width / 2 + 10, height / 2 - 14, 4, 0xfff9c4)
      const crater3 = this.add.circle(width / 2 + 2, height / 2 - 30, 3, 0xfff9c4)
      ;[crater1, crater2, crater3].forEach(c => {
        c.setScrollFactor(0); c.setDepth(302); c.setAlpha(0); c.setScale(0.3)
      })

      // Stars
      const starPositions = [
        { x: 60, y: 40 }, { x: 140, y: 80 }, { x: 320, y: 30 },
        { x: 400, y: 90 }, { x: 100, y: 150 }, { x: 350, y: 140 },
        { x: 200, y: 60 }, { x: 440, y: 50 }, { x: 50, y: 120 },
        { x: 280, y: 100 }, { x: 420, y: 160 }, { x: 160, y: 180 },
      ]
      const stars = starPositions.map(({ x, y }) => {
        const size = 1 + Math.random() * 2
        const star = this.add.circle(x, y, size, 0xffffff)
        star.setScrollFactor(0)
        star.setDepth(301)
        star.setAlpha(0)
        return star
      })

      // "Good night!" text
      const goodNight = this.add.text(width / 2, height / 2 + 50, 'Good night!', {
        fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#fff9c4',
        stroke: '#1a1a4e', strokeThickness: 3,
      })
      goodNight.setOrigin(0.5)
      goodNight.setScrollFactor(0)
      goodNight.setDepth(303)
      goodNight.setAlpha(0)

      // Animate cutscene in
      this.tweens.add({
        targets: cutsceneBg, alpha: 1,
        duration: 1000, ease: 'Sine.easeInOut',
      })
      this.tweens.add({
        targets: [moon, crater1, crater2, crater3],
        alpha: 1, scale: 1,
        duration: 1500, delay: 500, ease: 'Back.easeOut',
      })
      // Twinkle stars in one by one
      stars.forEach((star, i) => {
        this.tweens.add({
          targets: star, alpha: { from: 0, to: 0.5 + Math.random() * 0.5 },
          duration: 400, delay: 800 + i * 120, ease: 'Sine.easeInOut',
        })
        // Twinkle effect
        this.tweens.add({
          targets: star, alpha: 0.3,
          duration: 600 + Math.random() * 800,
          yoyo: true, repeat: -1,
          delay: 2000 + Math.random() * 1000,
          ease: 'Sine.easeInOut',
        })
      })
      // Good night text
      this.tweens.add({
        targets: goodNight, alpha: 1,
        duration: 1000, delay: 2500, ease: 'Sine.easeInOut',
      })
    })
  }

  _createMiniMap(map) {
    const MW = 120, MH = 80
    const scaleX = MW / 960, scaleY = MH / 640

    // Color lookup for tile GIDs (1-based: 1=empty, 2=grass, 3=dirt, 4=path, 5=water, 6=tree)
    const tileColors = {
      2: 0x4a7c3f, // grass
      3: 0x8b6b3d, // dirt
      4: 0x9e9e9e, // path
      5: 0x2196f3, // water
      6: 0x1b5e20, // tree
    }

    // Draw terrain base once
    const g = this.add.graphics()
    g.setScrollFactor(0)
    g.setDepth(200)

    // Background
    g.fillStyle(0x111111, 0.85)
    g.fillRect(0, 0, MW + 2, MH + 2)

    // Sample each tile position from all layers
    const layers = ['Ground', 'Paths', 'Water', 'Decorations']
    for (let ty = 0; ty < 40; ty++) {
      for (let tx = 0; tx < 60; tx++) {
        let color = 0x4a7c3f // default grass
        for (const name of layers) {
          const layer = map.getLayer(name)
          if (!layer) continue
          const tile = layer.data[ty]?.[tx]
          if (tile && tile.index > 0 && tileColors[tile.index]) {
            color = tileColors[tile.index]
          }
        }
        const px = 1 + Math.floor(tx * (MW / 60))
        const py = 1 + Math.floor(ty * (MH / 40))
        const pw = Math.max(1, Math.ceil(MW / 60))
        const ph = Math.max(1, Math.ceil(MH / 40))
        g.fillStyle(color)
        g.fillRect(px, py, pw, ph)
      }
    }

    // Border
    g.lineStyle(1, 0x555555)
    g.strokeRect(0, 0, MW + 2, MH + 2)

    // Generate terrain as a static texture
    g.generateTexture('minimap_bg', MW + 2, MH + 2)
    g.destroy()

    // Static terrain image
    const mmBg = this.add.image(0, 0, 'minimap_bg')
    mmBg.setOrigin(0, 0)
    mmBg.setScrollFactor(0)
    mmBg.setDepth(200)
    mmBg.setAlpha(0.8)

    // Dynamic overlay for dots and viewport rect
    this._mmOverlay = this.add.graphics()
    this._mmOverlay.setScrollFactor(0)
    this._mmOverlay.setDepth(201)
    this._mmOverlay.setAlpha(0.8)

    // Position in top-right (near top)
    const padding = 8
    mmBg.x = this.scale.width - MW - 2 - padding
    mmBg.y = 8
    this._mmBgX = mmBg.x
    this._mmBgY = mmBg.y
    this._mmW = MW
    this._mmH = MH
    this._mmScaleX = scaleX
    this._mmScaleY = scaleY
  }

  update() {
    this.player.update()
    if (this._playerArrow) {
      this._playerArrow.x = this.player.x
      this._playerArrow.y = this.player.y - 14 + (this._arrowBob || 0)
    }

    // Check delivery completion
    if (this._activeMission) {
      const targetId = this._activeMission.targetNpcId || this._activeMission.requestingNpcId
      const target = this._npcs[targetId]
      if (target) {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, target.sprite.x, target.sprite.y
        )
        if (dist < 30) {
          let save = loadSave()
          save = completeDelivery(save)
          writeSave(save)
          EventBus.emit('mission-complete', { mission: this._activeMission, hearts: 3 })
          EventBus.emit('save-updated')
          this._activeMission = null
        }
      }
    }

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

      // Early exit: swim to lily pad area
      if (this._pondLettersCollected < this._pondWord.length) {
        const edgeDist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, this._pondEdge.x, this._pondEdge.y
        )
        if (edgeDist < 12) {
          this._exitPond(false)
        }
      }
    }

    // Update mini map overlay
    if (this._mmOverlay) {
      const ov = this._mmOverlay
      ov.clear()
      const ox = this._mmBgX + 1
      const oy = this._mmBgY + 1

      // Camera viewport rectangle
      const cam = this.cameras.main
      ov.lineStyle(1, 0xffffff, 0.7)
      ov.strokeRect(
        ox + cam.scrollX * this._mmScaleX,
        oy + cam.scrollY * this._mmScaleY,
        cam.width * this._mmScaleX,
        cam.height * this._mmScaleY
      )

      // NPC dots
      Object.values(this._npcs).forEach(({ def, sprite }) => {
        const isUnlocked = this._save.unlockedNpcs.includes(def.id)
        ov.fillStyle(isUnlocked ? 0xffffff : 0x888888)
        ov.fillCircle(
          ox + sprite.x * this._mmScaleX,
          oy + sprite.y * this._mmScaleY,
          1.5
        )
      })

      // Player dot (yellow, larger)
      ov.fillStyle(0xffeb3b)
      ov.fillCircle(
        ox + this.player.x * this._mmScaleX,
        oy + this.player.y * this._mmScaleY,
        2.5
      )

      // Mission target blinking dot
      if (this._activeMission) {
        const targetId = this._activeMission.targetNpcId || this._activeMission.requestingNpcId
        const target = this._npcs[targetId]
        if (target) {
          const blink = Math.sin(this.time.now / 300) > 0
          if (blink) {
            ov.fillStyle(0xff5722)
            ov.fillCircle(
              ox + target.sprite.x * this._mmScaleX,
              oy + target.sprite.y * this._mmScaleY,
              3
            )
          }
        }
      }
    }
  }

  _tryEnterPond() {
    const save = loadSave()
    if (this._swimming) return
    if (save.activeMission && save.activeMission.type !== 'pond') {
      this._showBubblesDialogue('Finish what you\'re doing first, then come swim!')
      EventBus.emit('pond-denied', { reason: 'active-mission' })
      return
    }
    if (isDailyCapped(save)) {
      this._showBubblesDialogue('You\'ve earned enough hearts today! Come splash around tomorrow.')
      EventBus.emit('pond-denied', { reason: 'daily-cap' })
      return
    }
    // Show welcome message
    if (!this._bubblesVisited) {
      this._showBubblesDialogue('Want to go for a swim? Jump in and spell a word!')
      this._bubblesVisited = true
    }
    this._enterPond(save)
  }

  _showBubblesDialogue(msg) {
    // Floating dialogue near Bubbles
    const dialogBg = this.add.rectangle(768, 385, 200, 40, 0x000000, 0.8)
    dialogBg.setDepth(200).setStrokeStyle(1, 0x4caf50)
    const dialogText = this.add.text(768, 385, msg, {
      fontFamily: '"Press Start 2P"', fontSize: '5px', color: '#ffffff',
      wordWrap: { width: 190 }, align: 'center',
    }).setOrigin(0.5).setDepth(201)
    this.time.delayedCall(2500, () => {
      dialogBg.destroy()
      dialogText.destroy()
    })
  }

  _enterPond(save) {
    this._swimming = true
    this.player.setBlocked(true)

    // Disable world collision so player can swim freely in pond
    if (this._collider) this._collider.active = false

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
    let pondWord, pondEmoji
    if (save.activeMission && save.activeMission.type === 'pond') {
      pondWord = save.activeMission.word
      pondEmoji = save.activeMission.emoji || ''
    } else {
      const bank = this._wordBanks[save.skillLevel]
      const wordEntry = bank[Math.floor(Math.random() * bank.length)]
      pondWord = wordEntry.word.toUpperCase()
      pondEmoji = wordEntry.emoji || ''
    }
    this._pondWord = pondWord
    this._pondEmoji = pondEmoji
    this._pondLettersCollected = 0
    this._pondGoldenIndex = Math.random() < 0.2 ? Math.floor(Math.random() * this._pondWord.length) : -1
    this._pondFoundGolden = false
    this._pondWrongLetters = 0

    // Flash duration: shorter for harder words
    const flashMs = save.skillLevel === 'beginner' ? 3000
      : save.skillLevel === 'intermediate' ? 2000 : 1500

    // Emit event for React HUD — word shown briefly then hidden
    EventBus.emit('pond-enter', { word: this._pondWord, emoji: pondEmoji, flashMs })

    // Speak the word aloud
    try {
      if (save.audioEnabled) {
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(this._pondWord.toLowerCase())
        utt.rate = 0.8
        utt.pitch = 1.1
        window.speechSynthesis.speak(utt)
      }
    } catch (_) { /* speech not available */ }

    // Delay letter tile spawning + player unblock until after flash
    this.time.delayedCall(flashMs, () => {
      this._spawnLetterTiles()
      this.player.setBlocked(false)
    })
  }

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
    // All tiles look the same — no visual hint which are correct
    const bg = this.add.rectangle(x, y, 18, 18, isGolden ? 0xffd700 : 0x1565c0)
    bg.setStrokeStyle(1, isGolden ? 0xffab00 : 0x0d47a1)
    bg.setDepth(95)

    const text = this.add.text(x, y, letter, {
      fontFamily: '"Press Start 2P"', fontSize: '9px',
      color: isGolden ? '#3e2723' : '#ffffff',
    }).setOrigin(0.5).setDepth(96)

    const bobTween = this.tweens.add({
      targets: [bg, text], y: y - 3,
      duration: 800 + Math.random() * 400,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    })

    let shimmerTween = null
    if (isGolden) {
      shimmerTween = this.tweens.add({
        targets: bg, alpha: 0.7,
        duration: 500, yoyo: true, repeat: -1,
      })
    }

    return { bg, text, letter, index, isCorrect, isGolden, bobTween, shimmerTween, collected: false }
  }

  _collectLetter(tile) {
    if (tile.collected) return
    tile.collected = true

    if (tile.isCorrect && tile.index === this._pondLettersCollected) {
      // Correct letter in order
      tile.bobTween.stop()
      if (tile.shimmerTween) tile.shimmerTween.stop()

      this.tweens.add({
        targets: [tile.bg, tile.text], scaleX: 1.5, scaleY: 1.5, alpha: 0,
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

      // Speak the letter aloud if voice is on
      try {
        const audioSave = loadSave()
        if (audioSave.audioEnabled) {
          window.speechSynthesis.cancel()
          const utt = new SpeechSynthesisUtterance(tile.letter)
          utt.rate = 0.9
          utt.pitch = 1.2
          window.speechSynthesis.speak(utt)
        }
      } catch (_) { /* speech not available */ }

      if (this._pondLettersCollected >= this._pondWord.length) {
        this._completePondWord()
      }
    } else {
      // Wrong letter or out of order
      this._pondWrongLetters++
      EventBus.emit('pond-letter-collect', {
        letter: tile.letter,
        index: tile.index,
        isGolden: false,
        isCorrect: false,
      })

      tile.bobTween.stop()
      this.tweens.add({
        targets: [tile.bg, tile.text], alpha: 0,
        duration: 300,
        onComplete: () => {
          this.time.delayedCall(2000, () => {
            if (!this._swimming) return
            const b = this._pondBounds
            const nx = b.x + 10 + Math.random() * (b.width - 20)
            const ny = b.y + 10 + Math.random() * (b.height - 20)
            tile.bg.setPosition(nx, ny)
            tile.text.setPosition(nx, ny)
            tile.bg.setAlpha(1)
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

  _completePondWord() {
    this.player.setBlocked(true)

    const celebText = this.add.text(this._pondCenter.x, this._pondCenter.y - 20, 'Well done!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffeb3b',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(110)
    this.tweens.add({
      targets: celebText, alpha: 0, y: celebText.y - 30,
      duration: 1500, onComplete: () => celebText.destroy(),
    })

    // Calculate hearts
    let hearts
    let save = loadSave()
    if (save.activeMission && save.activeMission.type === 'pond') {
      // Mission: 3/2/1 based on wrong letters collected
      if (this._pondWrongLetters <= 1) hearts = 3
      else if (this._pondWrongLetters <= 3) hearts = 2
      else hearts = 1
      save.activeMission = null
    } else {
      hearts = 1
    }
    if (this._pondFoundGolden) hearts++

    save.pondWordsSpelled = (save.pondWordsSpelled || 0) + 1
    save.pondWordsToday = (save.pondWordsToday || 0) + 1
    if (this._pondFoundGolden) {
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

    EventBus.emit('pond-word-complete', { word: this._pondWord, heartsEarned: hearts })

    this.time.delayedCall(1200, () => {
      this._exitPond(true)
    })
  }

  _exitPond(completed) {
    // Clean up letter tiles
    if (this._letterTiles) {
      this._letterTiles.forEach(tile => {
        if (tile.bobTween) tile.bobTween.stop()
        if (tile.shimmerTween) tile.shimmerTween.stop()
        if (tile.bg && !tile.bg.scene) return
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

    // Re-enable world collision
    if (this._collider) this._collider.active = true

    // Move to pond edge
    this.player.setPosition(this._pondEdge.x, this._pondEdge.y)
    this.player.setBlocked(false)

    // Show arrow again
    if (this._playerArrow) this._playerArrow.setVisible(true)

    EventBus.emit('pond-exit', { completed })
  }
}
