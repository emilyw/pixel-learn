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

    this.add.image(480, 320, 'world_bg')

    this.player = new Player(this, 480, 320)

    this.cameras.main.setBounds(0, 0, 960, 640)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    this._save = loadSave()
    this._npcs = {}
    NPCS.forEach(def => this._spawnNPC(def))

    EventBus.on('task-open',  () => this.player.setBlocked(true),  this)
    EventBus.on('task-close', () => this.player.setBlocked(false), this)

    EventBus.on('npc-unlocked', ({ npcId }) => this._unlockNPC(npcId), this)

    EventBus.on('dpad', ({ dir, active }) => {
      this.player.setDpad(dir, active)
    }, this)

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
    entry.sprite.setInteractive({ useHandCursor: true })
    entry.sprite.on('pointerdown', () => this._onNPCClick(entry.def, entry.sprite))
  }

  update() {
    this.player.update()
  }
}
