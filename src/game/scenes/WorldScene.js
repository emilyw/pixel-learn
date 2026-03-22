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

    // --- player ---
    this.player = new Player(this, 480, 320)
    this.physics.add.collider(this.player, collisionLayer)

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

  update() {
    this.player.update()
  }
}
