import { Scene } from 'phaser'
import { Player } from '../entities/Player'
import { EventBus } from '../EventBus'
import { loadSave } from '../../logic/saveSystem'
import { NPCS } from '../../data/npcs'

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
      { key: 'building_blue_house',  x: 200, y: 130, scale: 0.5 },
      { key: 'building_red_house',   x: 360, y: 70,  scale: 0.5 },
      { key: 'building_green_house', x: 100, y: 200, scale: 0.5 },
      { key: 'building_blue_shop',   x: 420, y: 220, scale: 0.45 },
      { key: 'building_red_shop',    x: 300, y: 280, scale: 0.45 },
      { key: 'building_green_house', x: 550, y: 150, scale: 0.5 },
      { key: 'building_red_house',   x: 700, y: 100, scale: 0.5 },
      { key: 'building_blue_house',  x: 800, y: 250, scale: 0.5 },
    ]
    buildings.forEach(({ key, x, y, scale }) => {
      const b = this.add.sprite(x, y, key, 0)
      b.setScale(scale)
      b.setDepth(y)
      b.setOrigin(0.5, 1)
    })

    // --- player ---
    this.player = new Player(this, 480, 320)
    this.player.setDepth(100)
    this.physics.add.collider(this.player, collisionLayer)

    // --- player indicator arrow ---
    this._playerArrow = this.add.triangle(480, 320 - 14, 0, 8, 5, 0, 10, 8, 0xffeb3b)
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

    EventBus.emit('world-ready')
  }

  _spawnNPC(def, x, y) {
    const isUnlocked = this._save.unlockedNpcs.includes(def.id)
    const sprite = this.add.sprite(x, y, def.sprite, 8)

    if (isUnlocked) {
      if (def.tint != null) sprite.setTint(def.tint)
      sprite.setInteractive({ useHandCursor: true })
      sprite.on('pointerdown', () => this._onNPCClick(def, sprite))
    } else {
      sprite.setTint(0x555555)
      this.add.image(x, y - 20, 'padlock').setScale(0.6)
    }

    this._npcs[def.id] = { def, sprite }
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

    // Dynamic overlay for dots and viewport rect
    this._mmOverlay = this.add.graphics()
    this._mmOverlay.setScrollFactor(0)
    this._mmOverlay.setDepth(201)

    // Position in top-right (below HUD)
    const padding = 8
    mmBg.x = this.scale.width - MW - 2 - padding
    mmBg.y = 36
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
    }
  }
}
