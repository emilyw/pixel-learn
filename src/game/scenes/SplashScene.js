import { Scene } from 'phaser'
import { EventBus } from '../EventBus'
import { loadSave, writeSave } from '../../logic/saveSystem'
import { checkDailyReset } from '../../logic/sessionManager'
import { initAudioFromSave } from '../../logic/audioService'

export class SplashScene extends Scene {
  constructor() { super('SplashScene') }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x1b3a1b)

    this.add.text(width / 2, height / 2 - 60, 'pixel-learn', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Press Start 2P',
    }).setOrigin(0.5)

    const tapText = this.add.text(width / 2, height / 2 + 20, 'TAP TO START', {
      fontSize: '10px',
      color: '#a5d6a7',
      fontFamily: 'Press Start 2P',
    }).setOrigin(0.5)

    this.tweens.add({ targets: tapText, alpha: 0, duration: 600, yoyo: true, repeat: -1 })

    this.input.once('pointerdown', () => {
      const raw = loadSave()
      const save = checkDailyReset(raw)
      writeSave(save)
      initAudioFromSave(save)

      if (save.isFirstPlay) {
        EventBus.emit('show-mayor-message', { type: 'intro' })
      } else {
        EventBus.emit('show-mayor-message', { type: 'welcome-back' })
      }

      this.scene.start('WorldScene')
    })
  }
}
