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
    // tileset_terrain is generated procedurally below
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

    // --- village buildings ---
    this.load.spritesheet('building_blue_house', 'assets/tilesets/buildings/blueHouse_0_0.png', {
      frameWidth: 100, frameHeight: 112,
    })
    this.load.spritesheet('building_red_house', 'assets/tilesets/buildings/redHouse_0_0.png', {
      frameWidth: 100, frameHeight: 112,
    })
    this.load.spritesheet('building_green_house', 'assets/tilesets/buildings/greenHouse_0_0.png', {
      frameWidth: 100, frameHeight: 112,
    })
    this.load.spritesheet('building_blue_shop', 'assets/tilesets/buildings/blueShop_0.png', {
      frameWidth: 120, frameHeight: 128,
    })
    this.load.spritesheet('building_red_shop', 'assets/tilesets/buildings/redShop_0.png', {
      frameWidth: 120, frameHeight: 128,
    })

    // --- improved terrain tileset (procedural) ---
    const tg = this.make.graphics({ x: 0, y: 0, add: false })
    // Tile 0: empty (transparent)
    // Tile 1: grass
    tg.fillStyle(0x4a7c3f)
    tg.fillRect(16, 0, 16, 16)
    // Add grass texture details
    tg.fillStyle(0x5a8c4a)
    tg.fillRect(18, 3, 2, 2); tg.fillRect(24, 8, 2, 2); tg.fillRect(20, 12, 2, 2)
    tg.fillStyle(0x3a6c30)
    tg.fillRect(22, 1, 1, 2); tg.fillRect(17, 7, 1, 3); tg.fillRect(28, 5, 1, 2); tg.fillRect(25, 13, 1, 2)

    // Tile 2: dirt
    tg.fillStyle(0x8b6b3d)
    tg.fillRect(32, 0, 16, 16)
    tg.fillStyle(0x9b7b4d)
    tg.fillRect(35, 2, 2, 2); tg.fillRect(40, 9, 3, 2); tg.fillRect(37, 13, 2, 1)
    tg.fillStyle(0x7b5b2d)
    tg.fillRect(38, 4, 1, 2); tg.fillRect(44, 7, 1, 1); tg.fillRect(33, 10, 2, 1)

    // Tile 3: path (lighter stone)
    tg.fillStyle(0x9e9e9e)
    tg.fillRect(48, 0, 16, 16)
    tg.fillStyle(0xaeaeae)
    tg.fillRect(50, 2, 3, 2); tg.fillRect(56, 8, 2, 3); tg.fillRect(52, 12, 2, 2)
    tg.fillStyle(0x8e8e8e)
    tg.fillRect(54, 4, 2, 1); tg.fillRect(49, 9, 1, 2)

    // Tile 4: water
    tg.fillStyle(0x2196f3)
    tg.fillRect(64, 0, 16, 16)
    tg.fillStyle(0x42a5f5)
    tg.fillRect(66, 3, 4, 1); tg.fillRect(70, 8, 3, 1); tg.fillRect(67, 12, 5, 1)
    tg.fillStyle(0x1976d2)
    tg.fillRect(72, 5, 3, 1); tg.fillRect(65, 10, 2, 1)

    // Tile 5: tree
    tg.fillStyle(0x2e5a1e)
    tg.fillRect(80, 0, 16, 16)
    // Tree trunk
    tg.fillStyle(0x5d4037)
    tg.fillRect(86, 10, 4, 6)
    // Tree canopy
    tg.fillStyle(0x1b5e20)
    tg.fillRect(83, 2, 10, 9)
    tg.fillStyle(0x2e7d32)
    tg.fillRect(84, 3, 8, 7)
    tg.fillStyle(0x43a047)
    tg.fillRect(86, 4, 4, 3)

    // Tile 6: collision (red, invisible anyway)
    tg.fillStyle(0xff0000)
    tg.fillRect(96, 0, 16, 16)

    tg.generateTexture('tileset_terrain', 112, 16)
    tg.destroy()

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
