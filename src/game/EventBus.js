import Phaser from 'phaser'

// Singleton EventEmitter shared between Phaser and React
export const EventBus = new Phaser.Events.EventEmitter()
