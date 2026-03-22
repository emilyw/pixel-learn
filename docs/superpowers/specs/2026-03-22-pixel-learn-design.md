# pixel-learn — Design Spec
**Date:** 2026-03-22
**Status:** Approved

---

## Overview

**pixel-learn** is a browser-based word-learning game for children aged 5–10. Set in a Minecraft-inspired pixel art fantasy village, the player's character roams a hand-crafted world freely, meets 10 unique NPC characters, and completes word tasks (spelling and reading) to earn rewards and unlock new content.

**Core goals:**
- Teach words — reading recognition, spelling, vocabulary — in a fun, low-pressure environment
- Works on laptop browsers and iPhone Safari
- Parent controls skill level; child plays independently
- No login, no backend, no friction to start

---

## Visual Aesthetic

- **Full pixel art** throughout — sprites, tiles, characters, UI elements
- **Minecraft-style blocky aesthetic** — square-headed characters, chunky block UI, hard pixel edges (no anti-aliasing)
- **Pixel font** — Press Start 2P or equivalent bitmap font for all in-game text
- **Phaser config**: `pixelArt: true` — nearest-neighbour scaling, crisp at all sizes
- **Base resolution**: 480×320, scaled up to fill screen
- **Character sprites**: 32×32 base, scaled up 2–3×, blocky square-headed Minecraft-style bodies

---

## Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Game engine | Phaser 3 | World rendering, movement, sprites, tilemaps, touch input |
| UI layer | React | Task bubbles, HUD, parent settings, menus |
| Build tool | Vite | Fast dev server, bundles both Phaser + React |
| Audio | Web Speech API | Text-to-speech for words and letters |
| Storage | localStorage | Progress, hearts, unlocks, skill level |

### Project Structure

```
pixel-learn/
  src/
    game/           ← Phaser scenes
      BootScene.js  ← asset preloading
      WorldScene.js ← main game world, character movement, NPC interaction
    ui/             ← React components
      TaskBubble/   ← floating word challenge UI
      HUD/          ← hearts counter
      ParentSettings/ ← skill level picker, audio toggle
      UnlockModal/  ← unlock celebration screen
    assets/
      sprites/      ← pixel art character + world sprites
      tilemaps/     ← Tiled JSON tilemaps + tilesets
      audio/        ← sound effects (oops, success, fanfare)
    data/
      words/        ← word banks per skill level (JSON)
        beginner.json
        intermediate.json
        advanced.json
```

**Word bank JSON schema** (same structure for all three files):

```json
[
  {
    "word": "cat",
    "emoji": "🐱",
    "npcIds": ["frog-fisher", "dragon-librarian"],
    "distractors": ["bat", "hat", "rat"]
  }
]
```

- `word` — the target word (lowercase)
- `emoji` — picture clue shown in the task bubble
- `npcIds` — which NPCs can present this word (used for thematic filtering at runtime)
- `distractors` — for Beginner level, wrong choices shown alongside the correct word. At least 2 required. Should be phonetically/visually similar to encourage careful reading

Intermediate wrong letter options are generated at runtime by picking letters that are phonetically plausible for the missing position (vowels for vowel slots, common consonants otherwise) — not stored in the word bank.

**Word selection per NPC interaction:**
1. Filter word bank by the NPC's `npcIds`
2. Exclude the last 3 words shown to this NPC (tracked in session memory, not persisted)
3. Pick randomly from the remaining eligible words
4. If fewer than 3 words are eligible (small NPC word list), recency exclusion is shortened to avoid exhausting the list

```
  public/
  index.html
```

### Phaser + React Integration

Phaser mounts to a `<canvas>` element. React renders a transparent `<div>` overlay on top. Phaser emits custom events (e.g. `npc-interact`, `task-complete`) that React listens to in order to show/hide UI components. This keeps the two layers fully decoupled.

---

## Game World

### Map

- **Style**: Winding countryside — organic S-curve paths branching naturally through the landscape. No straight lines.
- **Movement**: Player roams freely anywhere on the map. Paths are decorative guides, not movement constraints.
- **Camera**: Follows the player; world is larger than the screen (scrollable).
- **Tilemap**: Built in Tiled (free editor), exported as JSON, loaded by Phaser. New areas extend the map file — no code changes needed to expand the world.
- **Decorations**: Trees, flowers, mushrooms, butterflies, fences — static sprites layered over the tilemap.

### 10 Locations & NPCs

| # | Location | NPC | Name | Word Theme |
|---|----------|-----|------|------------|
| 1 | 🏘️ Town Square | Frog Mayor | **Mayor Hop** | Greeting words |
| 2 | 📚 Library | Dragon Librarian | **Blaze** | General words (hub) |
| 3 | 🍞 Bakery | Pig Baker | **Biscuit** | Food words |
| 4 | ⚽ Sports Centre | Bear Coach | **Coach Roar** | Action words |
| 5 | 🎨 Art Studio | Owl Artist | **Doodle** | Colour & shape words |
| 6 | 🌿 Garden | Slime Gardener | **Mossy** | Nature words |
| 7 | 🏠 Villager House 1 | Cat Villager | **Mittens** | Family & home words |
| 8 | 🏠 Villager House 2 | Rabbit Villager | **Clover** | Family & home words |
| 9 | 🌊 Pond | Frog Fisher | **Ripple** | Animal words |
| 10 | ⭐ School | Owl Teacher | **Professor Hoot** | Numbers & letter words |
| 🔒 | 🍄 Mystery Hut | Unknown (unlockable) | **???** | Surprise words |

- **Character style**: Fantasy village mix — dragons, owls, bears, slimes — each with bold solid colours and a unique accessory (hat, crown, scarf, backpack)
- **Locked locations**: Shown with a pixel padlock overlay and greyed-out sprites until unlocked

---

## Word Learning Mechanic

### Skill Levels (parent-set)

| Level | Age | Challenge Type |
|-------|-----|----------------|
| Beginner | 5–6 | Tap the correct word from 3 picture choices (1 correct + 2 distractors from word bank) |
| Intermediate | 7–8 | Fill in exactly 1 missing letter chosen from 3 options (correct + 2 phonetically plausible wrong letters generated at runtime) |
| Advanced | 9–10 | Arrange all scrambled letter tiles into the correct order. Answer auto-submits when the last tile is placed — no submit button needed |

### Task Flow

1. Player taps/clicks an NPC
2. Floating speech bubble appears above the NPC (world stays fully visible)
3. Bubble shows: NPC character portrait + request text + picture clue (emoji/sprite) + word challenge
4. Player completes the challenge
5. Correct: NPC happy dance + ❤️ floats up to HUD
6. Incorrect: see retry mechanic below

### Task UI — Floating Bubble

- Rendered as a React component overlaid on the Phaser canvas
- Pixel art styled — blocky borders, pixel font, hard edges
- Speech bubble tail points to the NPC's position in the world. The `npc-interact` Phaser event payload includes `{ npcId, screenX, screenY }` where `screenX/screenY` are **viewport-relative pixels** (matching the CSS coordinate space React uses), accounting for canvas scaling. React positions the bubble tail at these coordinates
- Picture clue shown prominently (important for pre-readers at Beginner level)
- Tap targets minimum 44×44px (Apple HIG minimum) — applies to letter tiles, choice buttons, and D-pad buttons
- **Dismissal**: tapping outside the bubble or pressing Escape closes it without penalty
- **Player movement while bubble is open**: the D-pad and keyboard movement are **disabled** while a task bubble is open — the player cannot move until the bubble is dismissed or the task is completed. This applies on both desktop and mobile
- **One active task at a time**: a second NPC cannot be interacted with while a bubble is open

### Audio

- **Web Speech API** reads the word aloud and each letter when tapped
- **Default by skill level**: on for Beginner, on for Intermediate, off for Advanced. When the parent changes skill level, audio resets to the new level's default. The stored setting overrides the default once the parent explicitly toggles it
- **iOS Safari**: Web Speech API requires a user gesture before audio can play. On first load, a "Tap to Start" splash screen (required anyway for Phaser) fulfils this gesture requirement. All subsequent TTS calls are safe after that point

---

## Retry Mechanic

Encourages learning without allowing pure guessing to bypass the game. Behaviour differs by skill level.

### Beginner (tap correct picture from 2–3 choices)

| Attempt | Response |
|---------|----------|
| 1st wrong | Wrong choice shakes + red flash. brief shake animation before retry. *"Oops! Try again!"* |
| 2nd wrong | Correct choice highlighted with a gentle glow for 1 second, then glow fades — child must still tap it |
| 3rd wrong | Correct choice stays highlighted, NPC says the word aloud, child taps it to confirm |

### Intermediate (fill in missing letter from A/B/C options)

| Attempt | Response |
|---------|----------|
| 1st wrong | Wrong letter shakes + red flash. brief shake animation before retry. *"Almost! Try again!"* |
| 2nd wrong | One wrong option is eliminated (greyed out), leaving fewer choices |
| 3rd wrong | Correct letter highlighted, NPC says the full word aloud, child taps it to confirm |

### Advanced (arrange scrambled letter tiles)

Answer auto-submits on last tile placed.

| Attempt | Response |
|---------|----------|
| 1st wrong | Tiles shake + red flash, reset to scrambled. brief shake animation before retry. *"Almost! Try again!"* |
| 2nd wrong | First letter tile snaps into correct slot automatically; remaining tiles stay scrambled |
| 3rd wrong | All tiles animate into correct order with audio spelling each letter. Then tiles reset to scrambled one final time and child must place them all again to confirm. No lockout on this confirmation — child can take as long as needed |

### Reward Tiers (all levels)

| Result | Reward |
|--------|--------|
| Correct on 1st try | ❤️❤️❤️ (3 hearts) |
| Correct on 2nd try (after hint) | ❤️❤️ (2 hearts) |
| Correct on 3rd try (after reveal confirm) | ❤️ (1 heart) |

- Hearts stored as plain integers in localStorage
- Unlock threshold currency: 1 ❤️ = 1 unlock point (simplified — hearts are the only currency, stars removed)

Kids who guess randomly earn hearts slowly; kids who engage earn hearts quickly.

---

## Progression & Unlocks

### Initial World State

6 of the 10 NPCs are active at the start. 4 NPCs and the Mystery Hut start locked:

| Starts active | Starts locked |
|--------------|---------------|
| Mayor Hop (Town Square) | Coach Roar (Sports Centre) |
| Blaze (Library) | Mossy (Garden) |
| Biscuit (Bakery) | Clover (House 2) |
| Doodle (Art Studio) | Ripple (Pond) |
| Mittens (House 1) | 🍄 Mystery Hut |
| Professor Hoot (School) | |

Locked NPCs appear as sleeping/greyed-out sprites at their location with a pixel padlock. Locked locations (Mystery Hut) are visible but inaccessible.

### Unlock Thresholds (cumulative unlock points)

Unlock points accumulate and are never spent — thresholds are checked against the total.

| Points | Unlock |
|--------|--------|
| 10 pts | Bear Coach (Sports Centre) wakes up |
| 20 pts | Slime Gardener (Garden) wakes up |
| 35 pts | Rabbit Villager (House 2) wakes up |
| 50 pts | Frog Fisher (Pond) wakes up |
| 70 pts | 🍄 Mystery Hut unlocks |

(1 ❤️ = 1 unlock point)

Each threshold is checked independently — earning 35 pts unlocks all thresholds at or below 35 that haven't fired yet. Unlock animations play **sequentially** (one finishes before the next starts). Gameplay is paused (player cannot move, D-pad disabled) during the unlock sequence. After all animations complete, gameplay resumes normally.

### Unlock Moment

- Pixel padlock break animation + particle burst
- Fanfare sound effect
- NPC "wakes up" animation (stretches, opens eyes, waves)
- Brief text: *"[Name] is ready to play!"*

### HUD Display

Hearts display in the HUD as a **pixel heart icon + numeric count** (e.g. ❤️ 12). Individual heart sprites are not drawn for each heart — a count handles unlimited accumulation cleanly. Sits top-right, always visible.

### Persistence

- All unlock points, hearts (integer), and unlock states stored in localStorage
- **Save code**: base64-encoded JSON of the full save state, human-readable enough to copy-paste. Shown in parent settings. Importing overwrites current save (with confirmation prompt)

---

## Screen Time & Session Flow

### Daily Heart Cap

- Parent sets a daily heart goal in settings (default: 10 ❤️). Once the child earns that many hearts in a day, the session ends
- When the cap is reached, Mayor Hop appears in the centre of the town square, does a big wave animation, and says: *"Amazing work today! I'm so proud of you. Time to rest — come back tomorrow for more adventures!"*
- All NPCs visually go to sleep (eyes closed, Zzz sprites float above them). The world stays visible but no NPC can be interacted with
- The game does not force-close — the child can still walk around and look at the world, but tasks are disabled
- Daily heart count resets at midnight (local device time). Stored in localStorage alongside the date

### Daily Quest

- Each day, a small quest is assigned on first load: *"Help [N] villagers today"* (N = 2 for Beginner, 3 for Intermediate, 4 for Advanced)
- Quest progress shown as a simple pixel banner at the top of the screen: e.g. *"Today's Quest: 1 / 3 villagers helped"* — increments each time a task is completed with any NPC
- When the quest is completed, Mayor Hop appears and celebrates: *"You did it! You helped all your friends today — you're a star!"* + confetti particle burst
- Quest completion does **not** end the session — the child can keep playing until the daily heart cap is reached
- Quest resets daily alongside the heart count

### Mayor Hop — Welcome Back

- On each new session start (after the daily reset), Mayor Hop appears on the title/splash screen and says: *"Welcome back, adventurer! Your friends missed you. Ready to learn some new words?"*
- If it is the very first time playing (no localStorage save), Mayor Hop gives a short intro tour: introduces himself, points to the map, explains hearts

---

## Parent Settings

Accessible from the main menu (pause/title screen only — not during active gameplay). Settings take effect immediately on save.

- Skill level picker (Beginner / Intermediate / Advanced) — changing level resets audio toggle to the new level's default
- Audio toggle (TTS on/off) — overrides the level default once explicitly set
- Daily heart cap (5 / 10 / 15 / 20 ❤️, default 10)
- Words practised list (read-only)
- Hearts earned today + total (read-only)
- Save code — copy (export) or paste (import with confirmation prompt)

---

## Platform & Hosting

- **Responsive**: Phaser `Scale.FIT` mode — canvas scales to fill any screen
- **Mobile controls**: Virtual pixel-art D-pad bottom-left on touch devices. Arrow keys + WASD on desktop. D-pad buttons minimum 44×44px at rendered size
- **iOS Safari specifics**:
  - `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">` prevents pinch-zoom
  - `touch-action: none` on the canvas prevents iOS scroll interference
  - "Tap to Start" splash screen on first load satisfies the required user gesture for Web Speech API and Phaser audio context
  - Virtual keyboard will not appear (no text `<input>` elements — all letter input is tap-based)
- **No install**: pure static web app
- **Hosting**: GitHub Pages or Netlify (free tier, no backend needed)
- **No login required**

---

## Agent Development Team

The game will be built by a team of specialised agents:

| Agent | Role |
|-------|------|
| UX Designer | Designs the pixel art world, character sprites, and UI mockups |
| Architect | Designs the Phaser + React project structure and data flow |
| Senior Engineer | Implements the game |
| QA | Launches and tests the game in a real browser |
| 5-year-old Critic | Plays the game and gives feedback from a young child's perspective |
| 10-year-old Critic | Plays the game and gives feedback from an older child's perspective |

---

## Out of Scope (v1)

- Backend / user accounts
- Multiplayer
- More than 10 locations (map is designed to expand)
- Custom word lists (parent-defined)
- Achievements / badges beyond hearts
