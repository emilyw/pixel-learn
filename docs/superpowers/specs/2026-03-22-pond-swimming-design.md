# Pond Swimming Feature — Design Spec

## Overview
Players can swim in the village pond by interacting with Bubbles the frog NPC. After entering the water with a spectacular splash, they collect floating letter tiles to spell a word. Completing the word earns hearts. NPC villagers can also request pond missions ("find my word in the pond!").

## Entry

- **Trigger:** Player walks within proximity of a pond edge. A bouncing splash icon appears as a visual prompt. Player presses the interact button (single tap / spacebar).
- **Gatekeeper:** "Bubbles" the frog — a small frog sprite sitting on a lily pad at the pond edge. On interact:
  - First visit: "Want to go for a swim? Jump in and spell a word!"
  - Subsequent visits: Random encouraging line ("The water's great today!")
  - If daily capped: "You've earned enough hearts today! Come splash around tomorrow."
  - If active mission (non-pond): "Finish what you're doing first, then come swim!"
- **Guard checks (in order):**
  1. `_swimming` flag must be false
  2. `activeMission` must be null (unless it's a pond-type mission)
  3. `isDailyCapped` must be false
- **Entry sequence:**
  1. Player teleported to pond center
  2. Screen shake (50ms), splash particle burst, "SPLASH!" floating text, splash sound
  3. Player gets blue tint (`0x44aaff`), goggles overlay, angle wobble tween (±5°)
  4. Ripple particle emitter starts following player
  5. `setSwimBounds()` constrains movement to pond area
  6. `_swimming = true`
  7. Letter tiles spawn in the pond

## In-Pond Gameplay

- **Word selection:** A target word is picked from the player's current skill level word list (same source as NPC tasks).
- **Letter spawning:** The word's letters spawn as floating tiles scattered around the pond (e.g., "FROG" = F, R, O, G). Each tile bobs gently. 2–3 decoy letters (wrong letters) also spawn, slightly dimmer.
- **Word display:** Top-center HUD bar shows target word with blank slots (e.g., `_ _ _ _`), Press Start 2P font, fills in left-to-right.
- **Collection:** Player swims into a letter tile to collect it:
  - **Correct letter:** Pop/sparkle effect, letter fills into next correct slot, speak the letter aloud if voice is on.
  - **Wrong letter:** Gentle "bloop" sound, tile fades and respawns elsewhere after 2 seconds. No penalty.
- **Order:** Letters must be collected in order (left to right). Simple for young children.
- **Duration:** No fixed timer. Session ends when the word is spelled. Typically 15–30 seconds.
- **Words per swim:** One word per swim session. Short, sweet, done.
- **Rare golden letter:** 1 in 5 visits, one letter tile spawns as golden with shimmer effect. Collecting it awards +1 bonus heart.

## Visuals

- **Player in water:** Blue tint (`0x44aaff`), goggles overlay sprite, gentle angle wobble tween (±5°, 400ms loop), ripple particle emitter following player.
- **Letter tiles:** Pixel-art tiles on water surface, gentle bob tween. Correct letters bright white on blue. Decoys slightly transparent. Golden letter has shimmer/glow.
- **Splash entry:** Particle burst, brief screen shake, "SPLASH!" text in Press Start 2P.
- **Pond environment:** Existing water tiles. Lily pad sprite at edge for exit point. Bubbles (frog) on lily pad.
- **Effects:** Splash particles (entry), pop/sparkle (correct letter), bloop ripple (wrong letter), celebration sparkles (word complete).

## Exit

### Normal Exit (word completed)
1. Celebration effect plays (sparkles, chime, 1 second).
2. Heart award: "+1 ❤️" floats up (+1 bonus if golden letter found).
3. Player auto-swims to lily pad at pond edge.
4. Tint removed, goggles removed, wobble tween stops, ripple emitter stops.
5. Player placed on ground at pond edge. `_swimming = false`.

### Early Exit (swim to lily pad before completing)
1. No hearts awarded.
2. Same lily pad animation, no penalty, no shame messaging.
3. `_swimming = false`.

### Edge Cases
- **Tab close / scene transition:** `shutdown` event forces clean exit.
- **Task bubble opens mid-swim:** Defer exit until task closes.

## NPC Integration

### Bubbles the Frog
- Lightweight NPC at pond edge, no missions of its own, no unlock progression.
- Uses existing NPC spritesheet pattern (a frog-colored sprite, 32x32).
- Communicates guard states in friendly language.

### NPC-Requested Pond Missions
- Any unlocked NPC can assign a pond mission (same 20% chance system as book requests):
  - NPC dialogue: "I dropped my special word in the pond! Can you swim in and find it?"
  - Sets `activeMission = { type: 'pond', word: 'BLAZE', npcId: 'blaze', npcName: 'Blaze' }`
  - Player goes to pond, interacts with Bubbles. Entry sequence plays. Mission word is used instead of random.
  - Hearts: 3/2/1 based on wrong letters collected (0–1 wrong = 3, 2–3 wrong = 2, 4+ wrong = 1).
  - On completion, mission clears. No need to return to NPC — reward given immediately.

### Mayor Hop Daily Quest
- Daily quest can occasionally be pond-related: "Go for a swim and spell a word today!"
- Completion condition: `pondWordsToday >= 1`.

## Save Data Additions

Added to `DEFAULT_SAVE` in `saveSystem.js`:

```js
pondWordsSpelled: 0,       // lifetime count
pondWordsToday: 0,          // resets daily (for quest tracking)
goldenLettersFound: 0,      // lifetime count
```

Hearts go into existing `totalHearts` / `dailyHeartsEarned` and respect the daily cap. `pondWordsToday` resets via the existing daily reset logic in `sessionManager.js`.

## EventBus Events

| Event | Payload | Emitter | Listener |
|-------|---------|---------|----------|
| `pond-enter` | `{ word }` | WorldScene | React HUD (show word bar) |
| `pond-letter-collect` | `{ letter, index, isGolden, isCorrect }` | WorldScene | React HUD (update slots) |
| `pond-word-complete` | `{ word, heartsEarned }` | WorldScene | React HUD, SaveSystem |
| `pond-exit` | `{ completed: bool }` | WorldScene | React HUD (hide word bar) |
| `pond-denied` | `{ reason }` | WorldScene | React (show Bubbles dialogue) |

## New Files
- `src/ui/components/PondHUD/PondHUD.jsx` — React: word bar with letter slots during swimming
- `src/ui/components/PondHUD/PondHUD.module.css` — Styles for PondHUD

## Modified Files
- `src/game/scenes/WorldScene.js` — Pond proximity detection, entry/exit sequence, letter spawning/collision, Bubbles NPC, swim bounds, visual effects
- `src/game/entities/Player.js` — `setSwimBounds()` method, swim state
- `src/logic/saveSystem.js` — Add pond fields to DEFAULT_SAVE
- `src/App.jsx` — Mount PondHUD component
- `src/ui/components/TaskBubble/TaskBubble.jsx` — Add pond mission variant to NPC request branch

## Out of Scope (v1)
- Multiple ponds with unlock gates (15/30/55 hearts)
- Pond stamps / completion badges
- Multi-word sessions
- Bubbles quest line
- Current/drift mechanics
- Cooperative swim mode
