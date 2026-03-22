import { useState } from 'react'
import { PhaserGame } from './game/PhaserGame'
import { HUD } from './ui/components/HUD/HUD'
import { TaskBubble } from './ui/components/TaskBubble/TaskBubble'
import { MayorHopMessage } from './ui/components/MayorHopMessage/MayorHopMessage'
import { UnlockModal } from './ui/components/UnlockModal/UnlockModal'
import { ParentSettings } from './ui/components/ParentSettings/ParentSettings'
import { DPad } from './ui/components/DPad/DPad'
import { BookBrowser } from './ui/components/BookBrowser/BookBrowser'
import { BookReader } from './ui/components/BookReader/BookReader'
import { DeliveryBanner } from './ui/components/DeliveryBanner/DeliveryBanner'
import { PondHUD } from './ui/components/PondHUD/PondHUD'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <PhaserGame />
      <HUD />
      <TaskBubble />
      <MayorHopMessage />
      <UnlockModal />
      <BookBrowser />
      <BookReader />
      <DeliveryBanner />
      <PondHUD />
      <button
        onClick={() => setShowSettings(true)}
        style={{ position: 'fixed', top: `calc(8px + env(safe-area-inset-top, 0px))`, left: `calc(8px + env(safe-area-inset-left, 0px))`, zIndex: 10, fontFamily: 'Press Start 2P', fontSize: '8px', background: '#263238', border: '2px solid #455a64', color: '#cfd8dc', padding: '6px 10px', cursor: 'pointer', minHeight: 44 }}
      >
        Settings
      </button>
      {showSettings && <ParentSettings onClose={() => setShowSettings(false)} />}
      <DPad />
      <div className="rotate-hint">
        <span>📱</span>
        Rotate your device<br />to landscape mode
      </div>
    </div>
  )
}
