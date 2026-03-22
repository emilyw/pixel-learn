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

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }

    this.body.setVelocity(vx, vy)
  }
}
