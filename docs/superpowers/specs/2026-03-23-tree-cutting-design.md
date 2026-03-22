# Tree Cutting Mini-Game Design Spec

## Overview

A whack-a-mole style chopping mini-game in the pixel-learn word-learning game. An NPC named **Timber the Beaver** sits near a forest area. The child enters a chopping zone where 6 tree stumps are arranged in a 3x2 grid. Letters pop up on random stumps for a short duration, then disappear. The child must walk to and chop the correct next letter in the word before it vanishes. Combines speed, memory, and spelling.

**Educational value:** Memory-based spelling under time pressure — genuinely different from the calm, exploratory pond mini-game.

## NPC: Timber the Beaver

- **Sprite:** Existing NPC sprite (e.g. `npc_coach_roar`) tinted brown (`0x8D6E63`), scaled 0.7
- **Position:** Near bottom-left tree cluster, approximately pixel (104, 440)
- **Availability:** Unlocked from start (not gated by progression). **Timber is NOT added to the NPCS array or the unlock system.** It is a standalone sprite in WorldScene, identical to how Bubbles the Frog is implemented for the pond.
- **Dialogue:**
  - First visit: "Want to chop some wood? Letters pop up on the stumps — chop them in order to spell the word!"
  - Active mission (non-chop): "Finish what you're doing first, then come chop!"
  - Daily capped: "You've chopped enough for today! Come back tomorrow."

## Gameplay Flow

1. Player approaches Timber and interacts (click/tap or proximity)
2. **Guard checks:**
   - If `isDailyCapped(save)`: show "You've chopped enough for today!" dialogue, return
   - If `save.activeMission && save.activeMission.type !== 'chop'`: show "Finish what you're doing first!" dialogue, return
   - If `save.activeMission?.type === 'chop'`: use the mission word
   - Otherwise: select random word from skill-level bank for free-play
3. Word selected from skill-level word bank (beginner/intermediate/advanced), lowercase
4. **Memory flash:** Word + emoji displayed in ChopHUD for a brief period (varies by skill level), then disappears — child must remember the word
5. **Zone entry:** Player teleported into bounded chopping zone. "CHOP!" floating text appears with camera shake (mirrors pond's "SPLASH!" entry)
6. **6 tree stumps** appear in a 3x2 grid layout within the zone
7. **Pop-up cycle begins:**
   - Every cycle interval, a random stump shows a letter (pop-up scale tween)
   - Letter stays visible for pop-up duration, then hides (scale-down tween)
   - 2 stumps active simultaneously (3 for advanced)
   - Mix of correct next letter and decoy letters
   - The correct next letter is **guaranteed to appear at least once every 3 cycles** (not pure random)
8. Player walks to a stump showing a letter — **auto-chop on proximity** (distance < 18px, slightly larger than pond's 14px to account for time pressure)
9. **Correct letter** (matches next letter in word): stump split animation, letter fills in HUD, chop sound via Web Speech API
10. **Wrong letter:** stump shakes (red flash), wrong counter increments
11. **Missed letter** (disappears before player reaches it): no penalty, will cycle back
12. When all letters are spelled correctly: "Timber!" celebration, hearts awarded
13. After 1200ms delay, player exits zone

## Difficulty Scaling

| Skill Level  | Flash Time | Pop-up Duration | Active Stumps | Cycle Interval |
|-------------|-----------|----------------|---------------|---------------|
| Beginner     | 3000ms    | 2000ms          | 2             | 2500ms         |
| Intermediate | 2000ms    | 1500ms          | 2             | 2000ms         |
| Advanced     | 1500ms    | 1200ms          | 3             | 1500ms         |

**Cycle timing:** Each cycle waits for the previous pop-up duration to fully elapse before starting. Cycles do NOT overlap — at most `activeStumps` count are showing letters at any time. The cycle interval is measured from the START of a pop-up (so gap between pop-ups = interval - duration).

## ChopHUD (React Component)

A React overlay component following the same pattern as `PondHUD`.

- **Position:** Fixed, top-center, z-index 8
- **Content:** Emoji (if available) + letter slots (one per letter in word)
- **Memory flash:** All letters shown with yellow highlight during flash period, then replaced with underscores
- **Filled slots:** Turn green when correctly chopped
- **Golden slots:** Turn gold when golden letter collected
- **Styling:** Same CSS structure as PondHUD (`.container`, `.slot`, `.flash`, `.filled`, `.golden`)

### Events Consumed
- `chop-enter` `{ word, emoji, flashMs }` — show HUD with word
- `chop-letter-collect` `{ letter, index, isGolden, isCorrect }` — fill slot
- `chop-exit` — hide HUD
- `chop-word-complete` — hide HUD

## Stump Mechanics

### Layout
- 6 stumps in a 3x2 grid within the bounded zone
- Spacing: ~28px horizontal, ~24px vertical between stump centers
- Each stump is a Phaser sprite (brown circle/square, 12x12px)

### States
- **Idle:** Dark brown, no letter, not interactive
- **Active:** Lighter color, letter text visible above stump, subtle pulse/glow tween
- **Chopped (correct):** Brief split animation (scale X squish + particles), then returns to idle
- **Chopped (wrong):** Red flash + shake tween, returns to idle

### Pop-up Algorithm
1. Each cycle: select `activeStumps` count of stumps that are currently idle
2. **3-cycle guarantee:** If the correct next letter has not appeared in the previous 2 consecutive cycles, it MUST appear in the next cycle. Otherwise, there is a 60% chance the correct letter appears in any given cycle.
3. Other stumps show random decoy letters from the lowercase alphabet
4. After pop-up duration, letter hides (scale-down tween)
5. Next cycle starts only after current pop-up duration fully elapses
6. Cycle repeats until word is complete

## Bounded Zone

- **Bounds:** Approximately 96x64px rectangle near the bottom-left tree cluster
- **Entry:** Player teleported to zone center, collision layer disabled (`this._collider.active = false`). Player movement constrained to bounds via `Phaser.Math.Clamp` in `update()` (same pattern as pond's `setSwimMode`). Player moves at normal speed.
- **Player tint:** Brown (`0x8D6E63`) while in chopping zone
- **Exit:** Player moved to Timber's position, collision re-enabled, tint cleared
- **Exit trigger:** A small "axe" or "path" sprite at zone edge, proximity < 12px for early exit
- **Free-play:** Timber is always available for free-play. The player can walk up and chop a random word at any time, regardless of missions.

### Exit Cleanup (`_exitChop`)
On exit (both completion and early exit), the following must be cleaned up:
- Destroy all 6 stump sprites and their letter text objects
- Stop the `this.time.addEvent()` stump cycle timer (`this._chopCycleTimer.remove()`)
- Stop all active pop-up/hide tweens on stumps
- Clear player bounds constraint and brown tint
- Re-enable collision layer (`this._collider.active = true`)
- Move player to Timber's position
- Emit `chop-exit` event

## Scoring

### Hearts Earned (same as pond)
- **Mission mode** (NPC requested): 0-1 wrong = 3 hearts, 2-3 wrong = 2 hearts, 4+ wrong = 1 heart
- **Free-play mode**: 1 heart per word
- **Golden letter bonus:** At entry, one random letter index in the word is selected as golden (10% chance, decided once at entry — same as pond). If that letter's stump is collected correctly, +1 bonus heart. Golden stumps have a distinct gold glow.

### Daily Cap Behavior
Hearts are always awarded on completion regardless of whether it pushes past the daily cap (matching pond behavior). After awarding hearts, if `isDailyCapped(save)` becomes true, emit `daily-cap-reached` event. This is important because chop awards hearts directly in WorldScene (not through TaskBubble), so the chop completion code must handle this emission.

### Mission Variant
- In TaskBubble.jsx, the probability chain is: 20% book → 20% pond → **20% chop** → normal word task. Each roll is independent on the remaining probability space.
- Mission stored in `save.activeMission` with `type: 'chop'`
- Same structure as pond missions: `{ type: 'chop', word, emoji, npcId, npcName }`
- Dialogue: "Can you chop me some wood with [word] carved in it?"
- Accept button: "OK, I'll go chop!"

## Visual Feedback

- **Letter pop-up:** Stump brightens, letter text scales from 0→1 with bounce easing
- **Letter hide:** Letter scales from 1→0, stump returns to dark brown
- **Correct chop:** Brown rectangle particles (wood chips), stump briefly squishes (scaleX: 0.5 then back), green flash on stump
- **Wrong chop:** Red tint flash (200ms), horizontal shake tween (x ±3px, 3 cycles)
- **Word complete:** "Timber!" text drops from above with bounce, all stumps do a simultaneous bounce tween
- **Speech:** Letter spoken aloud via Web Speech API on correct collect (same as pond)

## Save Data

Added to `DEFAULT_SAVE` in `saveSystem.js`:
```javascript
treesChopped: 0,       // lifetime word completions at stumps
treesChoppedToday: 0,  // daily counter, reset by checkDailyReset
```

Added to `checkDailyReset` in `sessionManager.js`:
```javascript
treesChoppedToday: 0,
```

## EventBus Events

| Event | Payload | Emitter | Consumer |
|-------|---------|---------|----------|
| `chop-enter` | `{ word, emoji, flashMs }` | WorldScene | ChopHUD |
| `chop-letter-collect` | `{ letter, index, isGolden, isCorrect }` | WorldScene | ChopHUD |
| `chop-word-complete` | `{}` | WorldScene | ChopHUD |
| `chop-exit` | `{}` | WorldScene | ChopHUD |

## Integration Points

### WorldScene.js
- New methods: `_tryEnterChop()`, `_enterChop(save)`, `_spawnStumps()`, `_startStumpCycle()`, `_chopStump(stump)`, `_completeChopWord()`, `_exitChop(completed)`
- Timber NPC sprite setup in `create()`
- Proximity check in `update()` for stump chopping and early exit
- Stump cycle managed by `this.time.addEvent()` (Phaser timer)

### TaskBubble.jsx
- New mission type `'chop'` alongside existing `'pond'` type
- 20% chance branch for chop mission requests
- Dialogue: "Can you chop me some wood with [word] carved in it?"
- Accept button: "OK, I'll go chop!"

### App.jsx
- Mount `<ChopHUD />` component

### File Structure
- `src/ui/components/ChopHUD/ChopHUD.jsx` — React component
- `src/ui/components/ChopHUD/ChopHUD.module.css` — Styles

## Architecture Note: WorldScene Size

WorldScene.js is already ~845 lines and growing. The tree cutting methods add ~200+ more lines. This is noted but accepted for now — extracting mini-games into separate scene classes would be a larger refactor that isn't necessary for this feature. If a third mini-game is added, extraction should be considered.
