import { useState } from 'react'
import { PhaserGame } from './game/PhaserGame'
import { HUD } from './ui/components/HUD/HUD'
import { TaskBubble } from './ui/components/TaskBubble/TaskBubble'
import { MayorHopMessage } from './ui/components/MayorHopMessage/MayorHopMessage'
import { UnlockModal } from './ui/components/UnlockModal/UnlockModal'
import { ParentSettings } from './ui/components/ParentSettings/ParentSettings'
import { DPad } from './ui/components/DPad/DPad'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PhaserGame />
      <HUD />
      <TaskBubble />
      <MayorHopMessage />
      <UnlockModal />
      <button
        onClick={() => setShowSettings(true)}
        style={{ position: 'fixed', top: 8, left: 8, zIndex: 10, fontFamily: 'Press Start 2P', fontSize: '8px', background: '#263238', border: '2px solid #455a64', color: '#cfd8dc', padding: '6px 10px', cursor: 'pointer', minHeight: 44 }}
      >
        Settings
      </button>
      {showSettings && <ParentSettings onClose={() => setShowSettings(false)} />}
      <DPad />
    </div>
  )
}
