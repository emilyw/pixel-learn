import Phaser from 'phaser'

export class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 8)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.body.setCollideWorldBounds(true)
    this.body.setSize(16, 20)
    this.body.setOffset(8, 12)

    this.speed = 80
    this._keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT')
    this._dpad = { up: false, down: false, left: false, right: false }
    this._blocked = false

    // --- animations ---
    if (!scene.anims.exists('player_idle')) {
      scene.anims.create({
        key: 'player_idle',
        frames: [{ key: 'player', frame: 8 }],
        frameRate: 1,
        repeat: 0,
      })
    }

    if (!scene.anims.exists('player_run')) {
      scene.anims.create({
        key: 'player_run',
        frames: scene.anims.generateFrameNumbers('player', { start: 16, end: 21 }),
        frameRate: 10,
        repeat: -1,
      })
    }

    this.play('player_idle')
  }

  setDpad(direction, active) {
    this._dpad[direction] = active
  }

  setBlocked(val) {
    this._blocked = val
    if (val) this.body.setVelocity(0, 0)
  }

  setSwimMode(bounds) {
    this._swimming = true
    this._swimBounds = bounds
    this.setTint(0x44aaff)
  }

  clearSwimMode() {
    this._swimming = false
    this._swimBounds = null
    this.clearTint()
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

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }

    this.body.setVelocity(vx, vy)

    // animation & flip
    if (vx !== 0) {
      this.play('player_run', true)
      this.setFlipX(vx < 0)
    } else {
      this.play('player_idle', true)
    }

    // Clamp to swim bounds if swimming
    if (this._swimming && this._swimBounds) {
      const b = this._swimBounds
      this.x = Phaser.Math.Clamp(this.x, b.x, b.x + b.width)
      this.y = Phaser.Math.Clamp(this.y, b.y, b.y + b.height)
    }
  }
}
