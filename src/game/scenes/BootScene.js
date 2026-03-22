import { Scene } from 'phaser'
import { NPCS } from '../../data/npcs'

export class BootScene extends Scene {
  constructor() { super('BootScene') }

  preload() {
    // --- progress bar ---
    const { width, height } = this.scale
    const barW = Math.round(width * 0.6)
    const barH = 18
    const barX = (width - barW) / 2
    const barY = height / 2

    const bgBar = this.add.graphics()
    bgBar.fillStyle(0x222222)
    bgBar.fillRect(barX, barY, barW, barH)

    const fillBar = this.add.graphics()
    this.load.on('progress', (v) => {
      fillBar.clear()
      fillBar.fillStyle(0x4fc3f7)
      fillBar.fillRect(barX + 2, barY + 2, (barW - 4) * v, barH - 4)
    })
    this.load.on('complete', () => {
      bgBar.destroy()
      fillBar.destroy()
    })

    // --- tilemap & tileset ---
    this.load.tilemapTiledJSON('village', 'assets/maps/village.json')
    this.load.image('tileset_terrain', 'assets/maps/terrain-simple.png')
    this.load.image('tileset_collision', 'assets/maps/collision.png')

    // --- player spritesheet ---
    this.load.spritesheet('player', 'assets/sprites/player.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    // --- NPC spritesheets ---
    NPCS.forEach((npc) => {
      const filename = 'npc-' + npc.id
      this.load.spritesheet(npc.sprite, `assets/sprites/${filename}.png`, {
        frameWidth: 32,
        frameHeight: 32,
      })
    })

    // --- procedural padlock texture ---
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(0x757575)
    // lock body
    g.fillRect(8, 14, 16, 14)
    // shackle
    g.lineStyle(3, 0x757575)
    g.strokeCircle(16, 12, 6)
    g.generateTexture('padlock', 32, 32)
    g.destroy()
  }

  create() {
    this.scene.start('SplashScene')
  }
}
