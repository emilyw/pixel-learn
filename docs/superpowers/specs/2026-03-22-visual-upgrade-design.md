# Visual Upgrade Design Spec

## Goal

Replace all placeholder colored rectangles with real pixel art: a tilemap-based village, animated player sprite, and distinct NPC character sprites. The game should look like a proper Minecraft-style pixel art town.

## Asset Packs

All free, CC0 licensed. Primary source: Kevin's Mom's House (itch.io).

| Pack | Size | Content | License |
|------|------|---------|---------|
| kevins-moms-house/fantasy_ | 16x16 | Multi-biome terrain (forest, taiga, swamp, tundra, desert, cave) | CC0 |
| kevins-moms-house/forestVillage_ | 16x16 | Village buildings, structures | CC0 |
| kevins-moms-house/playerSprites_ | 32x32 | 6 animated humanoid characters (human/elf/dwarf, m/f) | CC0 |
| kevins-moms-house/forestSprites_ | 32x32 | Forest creatures/characters | CC0 |
| kevins-moms-house/caveSprites_ | 32x32 | Cave creatures/characters | CC0 |
| kevins-moms-house/taigaSprites_ | 32x32 | Taiga creatures/characters | CC0 |
| kevins-moms-house/desertSprites_ | 32x32 | Desert creatures/characters | CC0 |

Note: franopx/rpg-village-tileset was considered but dropped — its license is "free/permissive" without confirmed CC0 status. The Kevin's Mom's House packs provide sufficient building/decoration variety.

## Asset Directory Structure

```
public/assets/
  tilesets/
    fantasy.png
    forest-village.png
  sprites/
    player.png
    npc-mayor-hop.png
    npc-blaze.png
    npc-biscuit.png
    npc-doodle.png
    npc-mittens.png
    npc-professor-hoot.png
    npc-coach-roar.png
    npc-mossy.png
    npc-clover.png
    npc-ripple.png
    npc-mystery.png
    forest-creatures.png
    cave-creatures.png
    taiga-creatures.png
    desert-creatures.png
  maps/
    village.json
```

File naming convention: hyphens in filenames (e.g., `npc-mayor-hop.png`), underscores in Phaser texture keys (e.g., `npc_mayor_hop`) to match existing `npcs.js` conventions.

## Tilemap System

### Tool: Tiled Map Editor

Use [Tiled](https://www.mapeditor.org/) (free, open-source) to design the village map. Export as JSON for Phaser's native tilemap loader.

### Map Dimensions

- 60 x 40 tiles at 16x16 pixels = 960 x 640 pixels
- Matches existing world bounds exactly

### Tilemap Layers (bottom to top)

1. **Ground** — grass, dirt, sand base terrain
2. **Paths** — stone/dirt walkways connecting locations
3. **Water** — pond/stream areas (collision-blocked)
4. **Buildings** — houses, shops, mystery hut (tile objects)
5. **Decorations** — trees, flowers, bushes, fences, signs
6. **Collision** — invisible layer, rendered with `layer.setVisible(false)`. Uses a dedicated tileset with a single opaque tile to mark unwalkable areas. Phaser's `setCollisionByExclusion([-1])` enables collision on all non-empty tiles in this layer.

### Village Layout

- **Center:** Town square with Mayor Hop. Paths radiate outward to all areas.
- **Left:** Market area — Biscuit's bakery, Doodle's shop
- **Top:** Residential area — Mittens' house, Clover's garden
- **Right:** Academy area — Professor Hoot's tower, Coach Roar's training ground
- **Bottom:** Forest edge — Mossy's grove, Ripple's pond
- **Corner:** Mystery Hut — tucked away, partially hidden by trees
- **Near center:** Blaze's forge — distinct red/orange tones

### NPC Spawn Points

Defined as an Object Layer in Tiled named `npcs`. Each object has:
- `name`: NPC id using hyphens to match `npcs.js` (e.g., `mayor-hop`, `professor-hoot`)
- `x`, `y`: pixel position on map

WorldScene reads NPC positions from the map object layer. The data merge works as follows:

1. WorldScene calls `this.map.getObjectLayer('npcs').objects` to get spawn positions
2. It builds a position map keyed by hyphenated id: `{ 'mayor-hop': { x: 120, y: 200 }, ... }`
3. It iterates the NPCS array from `npcs.js`, looking up each NPC's position from the map
4. If a map position exists, it overrides the NPC's default position; otherwise falls back to the `npcs.js` default

This means `npcs.js` retains `x` and `y` as fallback defaults, but the tilemap object layer is the primary source of positions.

## Character System

### Player

- Change `Player.js` from `Phaser.GameObjects.Rectangle` to `Phaser.GameObjects.Sprite`
- Use `scene.physics.add.sprite(x, y, 'player')` pattern instead of creating a Rectangle and calling `scene.physics.add.existing(this)`. The constructor creates the sprite, adds it to physics, then configures the body.
- Physics body sized smaller than the 32x32 frame: `this.body.setSize(16, 20)` with `this.body.setOffset(8, 12)` so collision uses the character's feet, not the full frame
- Load one playerSprites_ spritesheet
- Create walk animations: 4 directions (up/down/left/right), 4 frames each
- Idle frame when stationary
- Keep existing movement logic: WASD/arrows/dpad, speed 80, diagonal normalization, blocked state

### NPCs

Each NPC gets a specific sprite assignment. The implementer should download the asset packs and assign sprites based on what's available, using this strategy:

- **playerSprites_ bases** (6 humanoid characters): Use these as the primary NPC sprites. Each NPC gets a different base character. Apply `setTint()` with the NPC's identity color to differentiate.
- **Creature sprites** (forest/cave/taiga/desert packs): Review these packs for any creatures that could represent specific NPCs. If a good match exists, use the creature sprite instead of a tinted humanoid.
- The player character uses one playerSprites_ base that is NOT assigned to any NPC.

**Concrete NPC-to-sprite mapping** (to be finalized when assets are downloaded — the implementer selects the best match from available sprites):

| NPC | Primary Strategy | Tint Color |
|-----|-----------------|------------|
| Mayor Hop | humanoid or creature sprite | 0x4caf50 (green) |
| Blaze | humanoid or creature sprite | 0xef5350 (red) |
| Biscuit | humanoid or creature sprite | 0xf48fb1 (pink) |
| Doodle | humanoid or creature sprite | 0xff8f00 (orange) |
| Mittens | humanoid or creature sprite | 0x9c27b0 (purple) |
| Professor Hoot | humanoid or creature sprite | 0xff8f00 (amber) |
| Coach Roar | humanoid or creature sprite | 0x795548 (brown) |
| Mossy | humanoid or creature sprite | 0x69f0ae (mint) |
| Clover | humanoid or creature sprite | 0xf5f5f5 (white) |
| Ripple | humanoid or creature sprite | 0x26c6da (teal) |
| Mystery Hut | N/A — this is a building tile, not a character sprite | 0x37474f |

NPCs are static: idle animation only, no wandering AI.

**Locked NPCs:** greyed out via `setTint(0x555555)` (works on sprites). Padlock icon overlaid (same behavior as now).

### Not In Scope

- No NPC pathfinding or wandering
- No dialogue portraits or speech bubbles from NPCs
- No equipment/costume system
- No player character selection screen

## Code Changes

### Modified Files

#### `src/game/scenes/BootScene.js`
- Remove all `this.make.graphics()` + `generateTexture()` calls
- Replace with `this.load.image()` for tilesets
- Replace with `this.load.spritesheet()` for character spritesheets
- Load tilemap JSON via `this.load.tilemapTiledJSON('village', 'assets/maps/village.json')`
- Add a loading progress bar: listen to `this.load.on('progress', ...)` and render a simple fill rectangle showing load percentage. Target audience is children on potentially slow connections.

#### `src/game/scenes/WorldScene.js`
- Remove `this.add.image(480, 320, 'world_bg')`
- Create tilemap via `this.make.tilemap({ key: 'village' })`
- Add tileset images to tilemap
- Create layers: ground, paths, water, buildings, decorations
- Create collision layer, call `collisionLayer.setVisible(false)` and `collisionLayer.setCollisionByExclusion([-1])`
- Read NPC spawn positions from map object layer `npcs` (see data merge flow in Tilemap section)
- Change `_spawnNPC()` to use `this.add.sprite()` instead of `this.add.image()` for NPCs that have animations
- Add `this.physics.add.collider(this.player, collisionLayer)`
- Update `_unlockNPC()` to work with sprite objects (same API — `clearTint()`, `setInteractive()`, `on('pointerdown')` all work on sprites)

#### `src/game/entities/Player.js`
- Change from `Phaser.GameObjects.Rectangle` to `Phaser.GameObjects.Sprite`
- Use `scene.physics.add.sprite()` pattern with explicit body sizing (`setSize(16, 20)`, `setOffset(8, 12)`)
- Add animation creation in constructor (walk-up, walk-down, walk-left, walk-right, idle)
- Play appropriate animation based on movement direction in `update()`
- Stop animation (idle frame) when not moving
- Keep all existing movement, dpad, and blocked logic

#### `src/data/npcs.js`
- Update `sprite` field for each NPC to reference actual spritesheet key
- Add `frame` or `animConfig` field per NPC for sprite selection
- Keep `x` and `y` as fallback defaults (tilemap object layer is primary source)

### Added Files

- `public/assets/tilesets/*.png` — tileset images from asset packs
- `public/assets/sprites/*.png` — character spritesheets from asset packs
- `public/assets/maps/village.json` — Tiled map export

### Unchanged

All React UI components remain untouched:
- HUD, TaskBubble, MayorHopMessage, UnlockModal, ParentSettings, DPad
- SplashScene (no visual changes — text-based title screen)
- saveSystem, sessionManager, progressionEngine, wordSelector, audioService
- EventBus contract stays identical: `npc-interact` fires with `{ npcId, npcName, screenX, screenY }`

## Integration Contract

The visual upgrade is fully contained in the Phaser layer. React overlay components are unaffected because:

1. EventBus events keep the same shape
2. Save system data format is unchanged
3. NPC ids remain the same
4. Screen coordinate calculation in `_onNPCClick()` works the same with sprites as with images

## Technical Notes

- Tile size 16x16 for terrain, 32x32 for characters — this is standard practice; characters are larger than terrain tiles
- `pixelArt: true` already set in Phaser config — spritesheets will render crisp
- Camera follow, bounds, and scale mode (FIT, CENTER_BOTH) all stay the same
- Physics body on player explicitly sized to 16x20 with offset 8,12 for foot-based collision
- Loading progress bar in BootScene handles slow connections gracefully
