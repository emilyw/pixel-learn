import { Scene } from 'phaser'
import { Player } from '../entities/Player'
import { EventBus } from '../EventBus'
import { loadSave } from '../../logic/saveSystem'
import { BOOKS } from '../../data/books'

export class LibraryScene extends Scene {
  constructor() { super('LibraryScene') }

  create() {
    const W = 480, H = 320
    this.physics.world.setBounds(40, 60, W - 80, H - 60)

    // --- floor ---
    this.add.rectangle(W / 2, H / 2, W, H, 0x8d6e63)

    // --- back wall ---
    this.add.rectangle(W / 2, 30, W, 60, 0x5d4037)

    // --- left bookshelf ---
    const leftShelf = this.add.rectangle(20, H / 2, 40, H - 60, 0x4e342e)
    leftShelf.setOrigin(0.5, 0.5)

    // --- right bookshelf ---
    const rightShelf = this.add.rectangle(W - 20, H / 2, 40, H - 60, 0x4e342e)
    rightShelf.setOrigin(0.5, 0.5)

    // --- desk ---
    this.add.rectangle(W / 2, 120, 80, 24, 0x5d4037)
    // desk front
    this.add.rectangle(W / 2, 132, 80, 4, 0x3e2723)

    // --- book spines on shelves ---
    const save = loadSave()
    this._renderBooks(save, 'left', 10, 70)
    this._renderBooks(save, 'right', W - 30, 70)

    // --- left shelf clickable zone ---
    const leftZone = this.add.rectangle(20, H / 2, 40, H - 60)
    leftZone.setInteractive({ useHandCursor: true })
    leftZone.on('pointerdown', () => {
      EventBus.emit('shelf-click', { side: 'left' })
      EventBus.emit('task-open')
    })

    // --- right shelf clickable zone ---
    const rightZone = this.add.rectangle(W - 20, H / 2, 40, H - 60)
    rightZone.setInteractive({ useHandCursor: true })
    rightZone.on('pointerdown', () => {
      EventBus.emit('shelf-click', { side: 'right' })
      EventBus.emit('task-open')
    })

    // --- librarian ---
    const librarian = this.add.rectangle(W / 2, 95, 24, 28, 0x8d6e63)
    librarian.setStrokeStyle(2, 0xd7ccc8)
    // librarian label
    this.add.text(W / 2, 75, 'Librarian', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1)

    const librarianZone = this.add.rectangle(W / 2, 95, 40, 40)
    librarianZone.setInteractive({ useHandCursor: true })
    librarianZone.on('pointerdown', () => {
      EventBus.emit('librarian-interact')
      EventBus.emit('task-open')
    })

    // --- player ---
    this.player = new Player(this, 240, 290)
    this.player.setDepth(10)

    // --- listen for events ---
    EventBus.on('task-open', () => this.player.setBlocked(true), this)
    EventBus.on('task-close', () => this.player.setBlocked(false), this)
    EventBus.on('borrow-book', () => this._refreshBooks(), this)
    EventBus.on('return-book', () => this._refreshBooks(), this)

    EventBus.on('dpad', ({ dir, active }) => {
      this.player.setDpad(dir, active)
    }, this)

    EventBus.emit('enter-library')
  }

  _renderBooks(save, side, x, startY) {
    const startId = side === 'left' ? 1 : 7
    const endId = side === 'left' ? 6 : 12

    for (let id = startId; id <= endId; id++) {
      const book = BOOKS.find(b => b.id === id)
      if (!book) continue
      const isUnlocked = save.unlockedBooks.includes(id)
      const yPos = startY + (id - startId) * 30
      const color = isUnlocked ? book.spineColor : 0x555555
      const spine = this.add.rectangle(x + 10, yPos, 20, 22, color)
      spine.setStrokeStyle(1, 0x333333)

      if (!isUnlocked) {
        this.add.text(x + 10, yPos, '🔒', { fontSize: '8px' }).setOrigin(0.5)
      }
    }
  }

  _refreshBooks() {
    const save = loadSave()
  }

  update() {
    this.player.update()

    // Exit zone: walk to bottom edge
    if (this.player.y > 310) {
      EventBus.emit('exit-library')
      this.scene.start('WorldScene', { returnTo: { x: 800, y: 266 } })
    }
  }
}
