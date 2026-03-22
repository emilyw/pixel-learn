import { Scene } from 'phaser'

export class BootScene extends Scene {
  constructor() { super('BootScene') }

  preload() {
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
