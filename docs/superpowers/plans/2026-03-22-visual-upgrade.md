# Visual Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace placeholder colored rectangles with real pixel art — tilemap village, animated player, distinct NPC sprites.

**Architecture:** Download CC0 asset packs from Kevin's Mom's House (itch.io). Create a Tiled tilemap for the village (60x40 at 16x16). Swap the Player from Rectangle to Sprite with walk animations. Swap NPC images to sprites with idle animations. Add tilemap collision layer. All changes contained in the Phaser layer — React UI untouched.

**Tech Stack:** Phaser 3, Tiled Map Editor, Vite, CC0 pixel art asset packs (16x16 tilesets, 32x32 character sprites)

**Spec:** `docs/superpowers/specs/2026-03-22-visual-upgrade-design.md`

---

## File Structure

### New Files
- `public/assets/tilesets/fantasy.png` — Kevin's Mom's House fantasy_ terrain tileset
- `public/assets/tilesets/forest-village.png` — Kevin's Mom's House forestVillage_ buildings tileset
- `public/assets/sprites/player.png` — Player character spritesheet (one character from playerSprites_)
- `public/assets/sprites/npc-*.png` — One spritesheet per NPC (selected from playerSprites_ or creature packs)
- `public/assets/sprites/padlock.png` — Padlock icon (generated or from pack)
- `public/assets/maps/village.json` — Tiled map export
- `public/assets/maps/collision.png` — Single-tile tileset for collision layer (1x1 opaque pixel, scaled)

### Modified Files
- `src/game/scenes/BootScene.js` — Replace texture generation with asset loading + progress bar
- `src/game/scenes/WorldScene.js` — Replace flat background with tilemap, add collision, read NPC positions from map
- `src/game/entities/Player.js` — Replace Rectangle with Sprite, add walk animations
- `src/data/npcs.js` — Update sprite keys, add animation config

### Unchanged Files
- All React UI components (HUD, TaskBubble, MayorHopMessage, UnlockModal, ParentSettings, DPad)
- `src/game/scenes/SplashScene.js`
- `src/game/PhaserGame.jsx`
- `src/game/EventBus.js`
- All logic modules (saveSystem, sessionManager, progressionEngine, wordSelector, audioService, distractorGenerator)
- All test files

---

## Task 1: Download and Organize Asset Packs

**Files:**
- Create: `public/assets/tilesets/fantasy.png`
- Create: `public/assets/tilesets/forest-village.png`
- Create: `public/assets/sprites/player.png`
- Create: `public/assets/sprites/npc-mayor-hop.png` (and all other NPC sprites)
- Create: `public/assets/sprites/padlock.png`
- Create: `public/assets/maps/collision.png`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p public/assets/tilesets public/assets/sprites public/assets/maps
```

- [ ] **Step 2: Download asset packs**

Download these packs from itch.io (all free, CC0):
1. https://kevins-moms-house.itch.io/fantasy — terrain tilesets
2. https://kevins-moms-house.itch.io/village — village buildings
3. https://kevins-moms-house.itch.io/playersprites — character spritesheets
4. https://kevins-moms-house.itch.io/fantasy (forestSprites_, caveSprites_, taigaSprites_, desertSprites_ are part of the fantasy_ collection or separate packs from same creator)

Extract each ZIP locally.

- [ ] **Step 3: Select and copy tileset images**

From the extracted packs:
- Copy the main forest/grass terrain tileset to `public/assets/tilesets/fantasy.png`
- Copy the village buildings tileset to `public/assets/tilesets/forest-village.png`

These should be the full tileset PNG sheets (not individual tiles). Note the tile dimensions — they should be 16x16 grids.

- [ ] **Step 4: Select player character spritesheet**

From `playerSprites_`, choose ONE character (e.g., human male). Copy its spritesheet to `public/assets/sprites/player.png`.

Note the frame dimensions:
- Frame size: likely 32x32 pixels
- Animation layout: rows for directions (down, left, right, up), columns for frames
- Open the PNG in an image viewer and count frames per row and row count

Record these values — they'll be needed for `BootScene.js` spritesheet loading config.

- [ ] **Step 5: Select and copy NPC spritesheets**

For each of the 10 NPCs + mystery hut, select a distinct sprite from the available packs:
- Use different character bases from `playerSprites_` (human/elf/dwarf, m/f) — 6 available
- Use creature sprites from `forestSprites_`, `caveSprites_`, `taigaSprites_`, `desertSprites_` for remaining NPCs
- Each NPC must be visually distinct

Copy each selected spritesheet to `public/assets/sprites/npc-<id>.png`:
- `npc-mayor-hop.png`, `npc-blaze.png`, `npc-biscuit.png`, `npc-doodle.png`
- `npc-mittens.png`, `npc-professor-hoot.png`, `npc-coach-roar.png`
- `npc-mossy.png`, `npc-clover.png`, `npc-ripple.png`, `npc-mystery.png`

- [ ] **Step 6: Create padlock sprite**

If the asset packs include a lock/padlock icon, copy it to `public/assets/sprites/padlock.png`.

If not, create a simple 16x16 padlock PNG using any image editor (or keep the generated one for now — BootScene can still generate just the padlock texture as a fallback).

- [ ] **Step 7: Create collision tileset**

Create `public/assets/maps/collision.png` — a tiny 16x16 solid-color image (e.g., red). This is used in Tiled as the collision layer tileset. It won't be visible in-game.

```bash
# Using ImageMagick if available:
convert -size 16x16 xc:red public/assets/maps/collision.png
# Or create manually in any image editor
```

- [ ] **Step 8: Verify file structure**

```bash
ls -la public/assets/tilesets/
ls -la public/assets/sprites/
ls -la public/assets/maps/
```

Expected: tileset PNGs, ~12 sprite PNGs (player + 11 NPCs), collision.png, no village.json yet (that's Task 2).

- [ ] **Step 9: Commit**

```bash
git add public/assets/
git commit -m "assets: add pixel art tilesets and character spritesheets from CC0 packs"
```

---

## Task 2: Create Village Tilemap in Tiled

**Files:**
- Create: `public/assets/maps/village.json`
- Reference: `public/assets/tilesets/fantasy.png`, `public/assets/tilesets/forest-village.png`

- [ ] **Step 1: Install Tiled Map Editor**

Download from https://www.mapeditor.org/ (free, open-source). Available on macOS, Windows, Linux.

- [ ] **Step 2: Create new map**

In Tiled:
- File → New Map
- Orientation: Orthogonal
- Tile layer format: CSV
- Tile render order: Right Down
- Map size: 60 tiles wide × 40 tiles tall
- Tile size: 16 × 16 px

- [ ] **Step 3: Import tilesets**

In Tiled:
- Map → New Tileset (for each):
  1. Name: `fantasy`, Source: `public/assets/tilesets/fantasy.png`, Tile width: 16, Tile height: 16
  2. Name: `forest-village`, Source: `public/assets/tilesets/forest-village.png`, Tile width: 16, Tile height: 16
  3. Name: `collision`, Source: `public/assets/maps/collision.png`, Tile width: 16, Tile height: 16
- **Important:** Set "Embed in map" for all tilesets so the JSON export is self-contained.

- [ ] **Step 4: Create tile layers**

Create these layers in order (bottom to top):
1. `Ground` — Tile Layer
2. `Paths` — Tile Layer
3. `Water` — Tile Layer
4. `Buildings` — Tile Layer
5. `Decorations` — Tile Layer
6. `Collision` — Tile Layer

- [ ] **Step 5: Paint the village**

Using the tilesets, paint the village following this layout:

**Ground layer:** Fill with grass tiles. Add dirt patches, sand near water.

**Paths layer:** Create stone/dirt paths from center outward:
- Central town square area (~10x10 tiles in the center)
- Paths radiating to: left (market), top (residential), right (academy), bottom (forest edge)

**Water layer:** Small pond in bottom-right area (Ripple's location). Optional stream.

**Buildings layer:**
- **Center:** Town hall / Mayor Hop's building
- **Left:** Two small shops (Biscuit's bakery, Doodle's shop)
- **Top:** Houses (Mittens' house, Clover's garden area)
- **Right:** Tower structure (Professor Hoot), training ground (Coach Roar)
- **Bottom-left:** Grove area with Mossy
- **Bottom-right:** Pond area with Ripple
- **Far corner (top-right or bottom-right):** Mystery Hut, partially hidden by trees
- **Near center:** Blaze's forge building

**Decorations layer:** Trees along edges, flowers in gardens, fences around buildings, shop signs.

**Collision layer:** Paint collision tiles over:
- All building tiles (walls, roofs)
- Water tiles
- Dense tree trunks (not canopies)
- Map edges if needed

- [ ] **Step 6: Create NPC object layer**

In Tiled:
- Layer → New → Object Layer, name it `npcs`
- Place point objects for each NPC at their intended position:

| Object Name | Approximate Position | Location |
|-------------|---------------------|----------|
| `mayor-hop` | Center of town square | Town hall entrance |
| `blaze` | Near center | By the forge |
| `biscuit` | Left area | Outside bakery |
| `doodle` | Left area | Outside shop |
| `mittens` | Top area | Near house |
| `professor-hoot` | Right area | Near tower |
| `coach-roar` | Right area | Training ground |
| `mossy` | Bottom-left | In the grove |
| `clover` | Top area | In the garden |
| `ripple` | Bottom-right | By the pond |
| `mystery-hut` | Corner | By the mystery hut |

Each object should have:
- Type: (leave empty or set to `npc`)
- Name: the NPC id with hyphens (e.g., `mayor-hop`)

- [ ] **Step 7: Export as JSON**

File → Export As → `public/assets/maps/village.json`
- Format: JSON map files (*.json)
- Ensure tilesets are embedded (not external .tsj files)

- [ ] **Step 8: Verify JSON structure**

Open `village.json` and confirm:
- `width: 60`, `height: 40`, `tilewidth: 16`, `tileheight: 16`
- Layers array contains: Ground, Paths, Water, Buildings, Decorations, Collision
- One object layer named `npcs` with 11 objects
- Tilesets array references the correct images

- [ ] **Step 9: Commit**

```bash
git add public/assets/maps/village.json
git commit -m "assets: add Tiled village tilemap with NPC spawn points"
```

---

## Task 3: Rewrite BootScene — Asset Loading with Progress Bar

**Files:**
- Modify: `src/game/scenes/BootScene.js`

- [ ] **Step 1: Run existing tests to establish baseline**

```bash
npx vitest run
```

Expected: All 22 tests pass. No tests directly cover BootScene, but confirm nothing is broken before changes.

- [ ] **Step 2: Rewrite BootScene.js**

Replace the entire file content:

```js
import { Scene } from 'phaser'
import { NPCS } from '../../data/npcs'

export class BootScene extends Scene {
  constructor() { super('BootScene') }

  preload() {
    // --- progress bar ---
    const { width, height } = this.scale
    const barW = width * 0.6
    const barH = 12
    const barX = (width - barW) / 2
    const barY = height / 2
    const border = this.add.rectangle(barX + barW / 2, barY, barW + 4, barH + 4, 0x222222)
    const fill = this.add.rectangle(barX + 1, barY, 0, barH, 0x4fc3f7).setOrigin(0, 0.5)
    this.load.on('progress', p => { fill.width = barW * p })
    this.load.on('complete', () => { border.destroy(); fill.destroy() })

    // --- tilesets ---
    this.load.image('tileset_fantasy', 'assets/tilesets/fantasy.png')
    this.load.image('tileset_forest_village', 'assets/tilesets/forest-village.png')

    // --- tilemap ---
    this.load.tilemapTiledJSON('village', 'assets/maps/village.json')

    // --- player spritesheet ---
    // IMPORTANT: adjust frameWidth/frameHeight to match the actual spritesheet dimensions
    this.load.spritesheet('player', 'assets/sprites/player.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    // --- NPC spritesheets ---
    NPCS.forEach(npc => {
      const filename = npc.id  // e.g. 'mayor-hop'
      this.load.spritesheet(npc.sprite, `assets/sprites/npc-${filename}.png`, {
        frameWidth: 32,
        frameHeight: 32,
      })
    })

    // --- padlock ---
    this.load.image('padlock', 'assets/sprites/padlock.png')

    // --- collision tileset (loaded as image for tilemap) ---
    this.load.image('tileset_collision', 'assets/maps/collision.png')
  }

  create() {
    this.scene.start('SplashScene')
  }
}
```

**Notes for implementer:**
- The `frameWidth` and `frameHeight` values (32x32) must match the actual sprite dimensions in the downloaded PNGs. Open the spritesheets and verify. If the player spritesheet has 48x48 frames, update accordingly.
- The `assets/` path works because Vite serves `public/` at the root. So `public/assets/foo.png` is accessible as `assets/foo.png`.
- NPC sprite keys remain `npc_mayor_hop` etc. (from `npcs.js` `sprite` field), but filenames use hyphens (from `npc.id`).

- [ ] **Step 3: Run existing tests**

```bash
npx vitest run
```

Expected: All 22 tests still pass. BootScene has no test coverage, so existing tests shouldn't be affected.

- [ ] **Step 4: Test locally in browser**

```bash
npm run dev
```

Open http://localhost:5173 — the game will likely show a loading bar then fail or show a blank scene because WorldScene still expects the old textures. That's expected. Confirm:
- Loading bar appears and fills
- No console errors about missing load methods
- SplashScene may fail (it uses generated textures) — that's OK, we'll fix it in Task 5

- [ ] **Step 5: Commit**

```bash
git add src/game/scenes/BootScene.js
git commit -m "feat: rewrite BootScene to load real assets with progress bar"
```

---

## Task 4: Rewrite Player as Animated Sprite

**Files:**
- Modify: `src/game/entities/Player.js`

- [ ] **Step 1: Rewrite Player.js**

Replace the entire file:

```js
import Phaser from 'phaser'

export class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.body.setCollideWorldBounds(true)
    this.body.setSize(16, 20)
    this.body.setOffset(8, 12)

    this.speed = 80
    this._keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT')
    this._dpad = { up: false, down: false, left: false, right: false }
    this._blocked = false

    this._createAnimations(scene)
  }

  _createAnimations(scene) {
    // IMPORTANT: adjust frame numbers to match actual spritesheet layout.
    // Common layout: row 0 = down, row 1 = left, row 2 = right, row 3 = up
    // Each row has ~4-6 frames. Verify by opening the spritesheet PNG.
    //
    // Example assumes 6 columns per row (frames 0-5 = row 0, 6-11 = row 1, etc.)
    // Adjust the start/end values based on actual spritesheet.
    const framesPerRow = 6  // UPDATE THIS based on actual spritesheet
    const rate = 8

    const dirs = [
      { key: 'walk-down',  row: 0 },
      { key: 'walk-left',  row: 1 },
      { key: 'walk-right', row: 2 },
      { key: 'walk-up',    row: 3 },
    ]

    dirs.forEach(({ key, row }) => {
      if (scene.anims.exists(key)) return
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers('player', {
          start: row * framesPerRow,
          end: row * framesPerRow + 3,
        }),
        frameRate: rate,
        repeat: -1,
      })
    })

    if (!scene.anims.exists('idle')) {
      scene.anims.create({
        key: 'idle',
        frames: [{ key: 'player', frame: 0 }],
        frameRate: 1,
      })
    }
  }

  setDpad(direction, active) {
    this._dpad[direction] = active
  }

  setBlocked(val) {
    this._blocked = val
    if (val) this.body.setVelocity(0, 0)
  }

  update() {
    if (this._blocked) {
      this.play('idle', true)
      return
    }

    const k = this._keys
    const d = this._dpad
    let vx = 0, vy = 0

    if (k.LEFT.isDown  || k.A.isDown  || d.left)  vx = -this.speed
    if (k.RIGHT.isDown || k.D.isDown  || d.right) vx =  this.speed
    if (k.UP.isDown    || k.W.isDown  || d.up)    vy = -this.speed
    if (k.DOWN.isDown  || k.S.isDown  || d.down)  vy =  this.speed

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }

    this.body.setVelocity(vx, vy)

    // Play animation based on direction
    if (vx < 0) this.play('walk-left', true)
    else if (vx > 0) this.play('walk-right', true)
    else if (vy < 0) this.play('walk-up', true)
    else if (vy > 0) this.play('walk-down', true)
    else this.play('idle', true)
  }
}
```

**Notes for implementer:**
- The `framesPerRow` value and row-to-direction mapping MUST be verified against the actual downloaded spritesheet. Open `player.png`, count frames per row, and update.
- `body.setSize(16, 20)` and `body.setOffset(8, 12)` gives foot-based collision. Adjust if the character sprite has different proportions.
- The `scene.anims.exists()` guard prevents duplicate animation errors if the scene restarts.

- [ ] **Step 2: Run existing tests**

```bash
npx vitest run
```

Expected: All 22 tests pass. Player has no direct test coverage.

- [ ] **Step 3: Commit**

```bash
git add src/game/entities/Player.js
git commit -m "feat: rewrite Player as animated Sprite with walk cycle"
```

---

## Task 5: Rewrite WorldScene — Tilemap + Collision + NPC Sprites

**Files:**
- Modify: `src/game/scenes/WorldScene.js`

- [ ] **Step 1: Rewrite WorldScene.js**

Replace the entire file:

```js
import { Scene } from 'phaser'
import { Player } from '../entities/Player'
import { EventBus } from '../EventBus'
import { loadSave } from '../../logic/saveSystem'
import { NPCS } from '../../data/npcs'

export class WorldScene extends Scene {
  constructor() { super('WorldScene') }

  create() {
    // --- tilemap ---
    this.map = this.make.tilemap({ key: 'village' })
    const tsFantasy = this.map.addTilesetImage('fantasy', 'tileset_fantasy')
    const tsVillage = this.map.addTilesetImage('forest-village', 'tileset_forest_village')
    const tsCollision = this.map.addTilesetImage('collision', 'tileset_collision')
    const allTilesets = [tsFantasy, tsVillage]

    // Create visible layers
    this.map.createLayer('Ground', allTilesets)
    this.map.createLayer('Paths', allTilesets)
    this.map.createLayer('Water', allTilesets)
    this.map.createLayer('Buildings', allTilesets)
    this.map.createLayer('Decorations', allTilesets)

    // Collision layer — invisible, blocks movement
    const collisionLayer = this.map.createLayer('Collision', [tsCollision])
    collisionLayer.setVisible(false)
    collisionLayer.setCollisionByExclusion([-1])

    // --- physics world bounds ---
    this.physics.world.setBounds(0, 0, 960, 640)

    // --- player ---
    this.player = new Player(this, 480, 320)
    this.physics.add.collider(this.player, collisionLayer)

    // --- camera ---
    this.cameras.main.setBounds(0, 0, 960, 640)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    // --- NPC positions from tilemap object layer ---
    this._npcPositions = {}
    const npcLayer = this.map.getObjectLayer('npcs')
    if (npcLayer) {
      npcLayer.objects.forEach(obj => {
        this._npcPositions[obj.name] = { x: obj.x, y: obj.y }
      })
    }

    // --- spawn NPCs ---
    this._save = loadSave()
    this._npcs = {}
    NPCS.forEach(def => this._spawnNPC(def))

    // --- events ---
    EventBus.on('task-open',  () => this.player.setBlocked(true),  this)
    EventBus.on('task-close', () => this.player.setBlocked(false), this)
    EventBus.on('npc-unlocked', ({ npcId }) => this._unlockNPC(npcId), this)
    EventBus.on('dpad', ({ dir, active }) => {
      this.player.setDpad(dir, active)
    }, this)

    EventBus.emit('world-ready')
  }

  _spawnNPC(def) {
    const pos = this._npcPositions[def.id] || { x: def.x, y: def.y }
    const isUnlocked = this._save.unlockedNpcs.includes(def.id)
    const sprite = this.add.sprite(pos.x, pos.y, def.sprite, 0)

    if (isUnlocked) {
      if (def.tint) sprite.setTint(def.tint)
      sprite.setInteractive({ useHandCursor: true })
      sprite.on('pointerdown', () => this._onNPCClick(def, sprite))
    } else {
      sprite.setTint(0x555555)
      this.add.image(pos.x, pos.y - 20, 'padlock').setScale(0.6)
    }

    this._npcs[def.id] = { def, sprite }
  }

  _onNPCClick(def, sprite) {
    const cam = this.cameras.main
    const screenX = (sprite.x - cam.scrollX) * cam.zoom
    const screenY = (sprite.y - cam.scrollY) * cam.zoom

    const canvas = this.game.canvas
    const scaleX = canvas.clientWidth  / this.scale.width
    const scaleY = canvas.clientHeight / this.scale.height
    const rect = canvas.getBoundingClientRect()

    EventBus.emit('npc-interact', {
      npcId: def.id,
      npcName: def.name,
      screenX: rect.left + screenX * scaleX,
      screenY: rect.top  + screenY * scaleY,
    })
  }

  _unlockNPC(npcId) {
    const entry = this._npcs[npcId]
    if (!entry) return
    entry.sprite.clearTint()
    if (entry.def.tint) entry.sprite.setTint(entry.def.tint)
    entry.sprite.setInteractive({ useHandCursor: true })
    entry.sprite.on('pointerdown', () => this._onNPCClick(entry.def, entry.sprite))
  }

  update() {
    this.player.update()
  }
}
```

**Notes for implementer:**
- The tileset names in `addTilesetImage('fantasy', 'tileset_fantasy')` — the first argument must match the tileset name used in Tiled (Step 3 of Task 2), the second matches the load key in BootScene.
- If Tiled embeds tilesets with different names, update these strings to match.
- The collision layer uses `[tsCollision]` only — it doesn't need the visual tilesets.
- `_spawnNPC` changed from `this.add.image()` to `this.add.sprite()` to support animations.
- NPC tinting for locked NPCs now only uses `setTint(0x555555)` (removed the separate `if (!isUnlocked)` and `if (isUnlocked)` blocks into a single if/else).
- `_onNPCClick` and `_unlockNPC` are identical to the original — the API is the same for images and sprites.

- [ ] **Step 2: Run existing tests**

```bash
npx vitest run
```

Expected: All 22 tests pass. WorldScene has no direct test coverage.

- [ ] **Step 3: Commit**

```bash
git add src/game/scenes/WorldScene.js
git commit -m "feat: rewrite WorldScene with tilemap, collision layer, and sprite NPCs"
```

---

## Task 6: Update NPC Data

**Files:**
- Modify: `src/data/npcs.js`

- [ ] **Step 1: Update npcs.js with tint colors**

Add a `tint` field to each NPC so WorldScene can apply identity colors. This makes NPCs visually distinct even when sharing similar humanoid sprite bases.

Replace the file:

```js
export const NPCS = [
  { id: 'mayor-hop',      name: 'Mayor Hop',      sprite: 'npc_mayor_hop',      tint: 0x4caf50, startLocked: false, x: 240, y: 160 },
  { id: 'blaze',          name: 'Blaze',           sprite: 'npc_blaze',          tint: 0xef5350, startLocked: false, x: 120, y: 80  },
  { id: 'biscuit',        name: 'Biscuit',         sprite: 'npc_biscuit',        tint: 0xf48fb1, startLocked: false, x: 360, y: 100 },
  { id: 'doodle',         name: 'Doodle',          sprite: 'npc_doodle',         tint: 0xff8f00, startLocked: false, x: 80,  y: 200 },
  { id: 'mittens',        name: 'Mittens',         sprite: 'npc_mittens',        tint: 0x9c27b0, startLocked: false, x: 160, y: 260 },
  { id: 'professor-hoot', name: 'Professor Hoot',  sprite: 'npc_professor_hoot', tint: 0xff8f00, startLocked: false, x: 400, y: 240 },
  { id: 'coach-roar',     name: 'Coach Roar',      sprite: 'npc_coach_roar',     tint: 0x795548, startLocked: true,  x: 320, y: 60  },
  { id: 'mossy',          name: 'Mossy',           sprite: 'npc_mossy',          tint: 0x69f0ae, startLocked: true,  x: 60,  y: 140 },
  { id: 'clover',         name: 'Clover',          sprite: 'npc_clover',         tint: 0xf5f5f5, startLocked: true,  x: 200, y: 280 },
  { id: 'ripple',         name: 'Ripple',          sprite: 'npc_ripple',         tint: 0x26c6da, startLocked: true,  x: 420, y: 180 },
  { id: 'mystery-hut',    name: '???',             sprite: 'npc_mystery',        tint: null,     startLocked: true,  x: 280, y: 300 },
]
```

**Notes:**
- `tint: null` on mystery-hut means no tint applied (it's a building, not a character).
- Each NPC gets a unique per-file spritesheet (`npc-mayor-hop.png`, etc.). The creature spritesheets from the biome packs (forestSprites_, caveSprites_, etc.) are extracted per-NPC — each NPC's selected creature/character is saved as its own `npc-*.png` file. This means the bulk creature spritesheet files (`forest-creatures.png` etc.) are NOT loaded at runtime — they're source material used during asset selection in Task 1.
- The tint colors differentiate NPCs that may share similar sprite bases.

- [ ] **Step 2: Run tests**

```bash
npx vitest run
```

Expected: All 22 tests pass.

- [ ] **Step 3: Commit (only if changes were made)**

```bash
git add src/data/npcs.js
git commit -m "chore: verify NPC sprite keys match new asset loading"
```

---

## Task 7: Integration Testing and Polish

**Files:**
- Possibly modify: `src/game/scenes/BootScene.js`, `src/game/scenes/WorldScene.js`, `src/game/entities/Player.js`

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Open http://localhost:5173

- [ ] **Step 2: Verify loading screen**

- [ ] Loading bar should appear and fill as assets load
- [ ] Once complete, SplashScene should show "TAP TO START"
- [ ] No console errors

- [ ] **Step 3: Verify tilemap rendering**

After tapping to start:
- [ ] Village tilemap renders (grass, paths, buildings, trees)
- [ ] No visual artifacts or misaligned tiles
- [ ] Camera follows player correctly
- [ ] World bounds work (player can't leave 960x640 area)

- [ ] **Step 4: Verify player**

- [ ] Player sprite visible and correctly sized
- [ ] Walk animations play when moving (up/down/left/right)
- [ ] Idle animation plays when stationary
- [ ] WASD and arrow keys work
- [ ] Diagonal movement normalized (not faster)
- [ ] Collision with buildings/water works (player stops, doesn't pass through)

- [ ] **Step 5: Verify NPCs**

- [ ] All 6 unlocked NPCs visible with correct sprites
- [ ] Unlocked NPCs are clickable (hand cursor)
- [ ] Clicking an NPC opens the task bubble at correct screen position
- [ ] All 4 locked NPCs + mystery hut visible but greyed out
- [ ] Padlock icons appear on locked NPCs
- [ ] Locked NPCs are not clickable

- [ ] **Step 6: Verify mobile**

Open dev tools → toggle device toolbar (mobile view):
- [ ] D-pad appears on touch devices
- [ ] D-pad controls player movement
- [ ] D-pad hidden during tasks

- [ ] **Step 7: Verify game flow**

- [ ] Complete a task with an NPC — hearts awarded correctly
- [ ] HUD updates (heart count, quest progress)
- [ ] Mayor Hop messages appear at correct times
- [ ] Unlock modal appears when reaching heart thresholds
- [ ] After unlocking, previously locked NPC becomes colored and clickable

- [ ] **Step 8: Fix any issues found**

Common issues to watch for:
- **Tileset name mismatch:** The first arg to `addTilesetImage()` must match the name in the Tiled JSON. Open `village.json`, find the `tilesets` array, check each tileset's `name` field.
- **Wrong frame dimensions:** If sprites look garbled, the `frameWidth`/`frameHeight` in BootScene doesn't match the actual spritesheet. Open the PNG, measure a single frame.
- **Animation frame numbers wrong:** If walk animation looks wrong, open the spritesheet, count frames per row, update `framesPerRow` in Player.js.
- **Collision too tight/loose:** Adjust `body.setSize()` and `body.setOffset()` in Player.js.

- [ ] **Step 9: Run production build**

```bash
npx vite build --base=/pixel-learn/
```

Expected: Build succeeds. Check `dist/assets/` contains the tileset and sprite images.

- [ ] **Step 10: Run all tests**

```bash
npx vitest run
```

Expected: All 22 tests pass.

- [ ] **Step 11: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish visual upgrade integration issues"
```

---

## Progress Tracker

| Task | Description | Status |
|------|-------------|--------|
| 1 | Download and organize asset packs | ⬜ |
| 2 | Create village tilemap in Tiled | ⬜ |
| 3 | Rewrite BootScene — asset loading + progress bar | ⬜ |
| 4 | Rewrite Player as animated Sprite | ⬜ |
| 5 | Rewrite WorldScene — tilemap + collision + NPC sprites | ⬜ |
| 6 | Update NPC data | ⬜ |
| 7 | Integration testing and polish | ⬜ |
