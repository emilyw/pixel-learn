#!/usr/bin/env node
/**
 * Generate village.json using terrain-simple.png (7 tiles at 16x16).
 * Tile GIDs (1-based): 1=empty, 2=grass, 3=dirt, 4=path, 5=water, 6=tree, 7=collision
 */

const MAP_W = 60
const MAP_H = 40
const EMPTY = 0
const GRASS = 2
const DIRT = 3
const PATH = 4
const WATER = 5
const TREE = 6
const COLLISION = 7

let seed = 42
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
function chance(p) { return rand() < p }
function pick(arr) { return arr[Math.floor(rand() * arr.length)] }

function emptyLayer(id, name) {
  return { id, name, type: 'tilelayer', visible: true, opacity: 1,
    x: 0, y: 0, width: MAP_W, height: MAP_H,
    data: new Array(MAP_W * MAP_H).fill(0) }
}

function set(layer, x, y, gid) {
  if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) layer.data[y * MAP_W + x] = gid
}
function get(layer, x, y) {
  if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) return layer.data[y * MAP_W + x]
  return 0
}

const ground = emptyLayer(1, 'Ground')
const paths = emptyLayer(2, 'Paths')
const water = emptyLayer(3, 'Water')
const decorations = emptyLayer(4, 'Decorations')
const collision = emptyLayer(5, 'Collision')
collision.visible = false

// 1) Fill ground with grass
for (let i = 0; i < MAP_W * MAP_H; i++) ground.data[i] = GRASS

// 2) Connected road network
// Draw a road segment between two tile positions (1 tile wide with stone accents)
function road(x1, y1, x2, y2) {
  // Horizontal segment
  const sx = Math.min(x1, x2), ex = Math.max(x1, x2)
  const sy = Math.min(y1, y2), ey = Math.max(y1, y2)
  for (let x = sx; x <= ex; x++) {
    set(paths, x, y1, chance(0.2) ? PATH : DIRT)
  }
  // Vertical segment
  for (let y = sy; y <= ey; y++) {
    set(paths, x2, y, chance(0.2) ? PATH : DIRT)
  }
}

// Main horizontal road (wider, 3 tiles)
for (let x = 3; x < MAP_W - 3; x++) {
  for (let dy = -1; dy <= 1; dy++) set(paths, x, 20 + dy, chance(0.2) ? PATH : DIRT)
}
// Main vertical road (wider, 3 tiles)
for (let y = 3; y < MAP_H - 3; y++) {
  for (let dx = -1; dx <= 1; dx++) set(paths, 30 + dx, y, chance(0.2) ? PATH : DIRT)
}

// Branch roads connecting to building/NPC areas
// To blue house area (200,130 → tile 12,8)
road(12, 8, 12, 20)
// To red house area (360,70 → tile 22,4)
road(22, 4, 30, 4)
// To green house area (100,200 → tile 6,12)
road(3, 12, 6, 12)
// To blue shop area (420,220 → tile 26,14)
road(26, 14, 30, 14)
// To red shop area (300,280 → tile 18,17)
road(18, 17, 18, 20)
// To green house east (550,150 → tile 34,9)
road(30, 9, 34, 9)
// To red house east (700,100 → tile 43,6)
road(34, 6, 43, 6)
// To blue house far east (800,250 → tile 50,15)
road(43, 15, 50, 15)
// Lower area connections
road(15, 20, 15, 32)
road(15, 28, 30, 28)
// Right side lower connection
road(30, 28, 45, 28)
road(50, 15, 50, 20)

// 3) Water ponds
function placePond(cx, cy, w, h) {
  for (let y = cy; y < cy + h; y++) {
    for (let x = cx; x < cx + w; x++) {
      set(water, x, y, WATER)
      set(collision, x, y, COLLISION)
    }
  }
}
placePond(5, 4, 5, 3)     // top-left pond
placePond(45, 25, 6, 4)   // right pond
placePond(20, 32, 5, 3)   // bottom pond

// 4) Trees — border and scattered
function placeTree(x, y) {
  if (get(water, x, y) || get(paths, x, y)) return
  set(decorations, x, y, TREE)
  set(collision, x, y, COLLISION)
}

// Dense border trees
for (let x = 0; x < MAP_W; x++) {
  placeTree(x, 0); placeTree(x, 1)
  placeTree(x, MAP_H - 1); placeTree(x, MAP_H - 2)
}
for (let y = 2; y < MAP_H - 2; y++) {
  placeTree(0, y); placeTree(1, y)
  placeTree(MAP_W - 1, y); placeTree(MAP_W - 2, y)
}

// Scattered interior trees (clusters)
const treeClusters = [
  [12, 6], [14, 7], [13, 5],
  [40, 5], [41, 6], [42, 4],
  [8, 28], [9, 29], [7, 29],
  [48, 15], [49, 16], [47, 14],
  [22, 8], [23, 7],
  [36, 30], [37, 31], [38, 30],
  [55, 10], [56, 11],
  [10, 17], [11, 16],
  [52, 33], [53, 34],
  [25, 15], [26, 14],
]
treeClusters.forEach(([x, y]) => placeTree(x, y))

// 5) Border collision (in addition to trees)
for (let x = 0; x < MAP_W; x++) {
  set(collision, x, 0, COLLISION); set(collision, x, 1, COLLISION)
  set(collision, x, MAP_H - 1, COLLISION); set(collision, x, MAP_H - 2, COLLISION)
}
for (let y = 0; y < MAP_H; y++) {
  set(collision, 0, y, COLLISION); set(collision, 1, y, COLLISION)
  set(collision, MAP_W - 1, y, COLLISION); set(collision, MAP_W - 2, y, COLLISION)
}

// 6) NPC positions — ensure all are on walkable tiles
function isWalkable(px, py) {
  const tx = Math.floor(px / 16)
  const ty = Math.floor(py / 16)
  if (tx < 2 || tx >= MAP_W - 2 || ty < 2 || ty >= MAP_H - 2) return false
  if (get(collision, tx, ty)) return false
  if (get(water, tx, ty)) return false
  if (get(decorations, tx, ty) === TREE) return false
  return true
}

function safePos(x, y) {
  // If position is walkable, use it. Otherwise search nearby.
  if (isWalkable(x, y)) return { x, y }
  for (let r = 1; r < 6; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const nx = x + dx * 16, ny = y + dy * 16
        if (isWalkable(nx, ny)) return { x: nx, y: ny }
      }
    }
  }
  return { x, y } // fallback
}

const rawNpcs = [
  { id: 1,  name: 'mayor-hop',      x: 240, y: 320 },
  { id: 2,  name: 'blaze',          x: 160, y: 176 },
  { id: 3,  name: 'biscuit',        x: 400, y: 160 },
  { id: 4,  name: 'doodle',         x: 112, y: 320 },
  { id: 5,  name: 'mittens',        x: 240, y: 432 },
  { id: 6,  name: 'professor-hoot', x: 448, y: 320 },
  { id: 7,  name: 'coach-roar',     x: 480, y: 144 },
  { id: 8,  name: 'mossy',          x: 112, y: 240 },
  { id: 9,  name: 'clover',         x: 240, y: 448 },
  { id: 10, name: 'ripple',         x: 560, y: 240 },
  { id: 11, name: 'mystery-hut',    x: 480, y: 448 },
]
const npcObjects = rawNpcs.map(npc => {
  const pos = safePos(npc.x, npc.y)
  return { ...npc, x: pos.x, y: pos.y }
})

const map = {
  compressionlevel: -1, height: MAP_H, width: MAP_W,
  infinite: false, orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.10.2', tileheight: 16, tilewidth: 16,
  type: 'map', version: '1.10', nextlayerid: 8, nextobjectid: 12,
  tilesets: [{
    columns: 7, firstgid: 1, image: 'terrain-simple.png',
    imageheight: 16, imagewidth: 112,
    margin: 0, name: 'terrain', spacing: 0,
    tilecount: 7, tileheight: 16, tilewidth: 16,
  }],
  layers: [
    ground, paths, water, decorations, collision,
    {
      id: 6, name: 'npcs', type: 'objectgroup',
      visible: true, opacity: 1, x: 0, y: 0, draworder: 'topdown',
      objects: npcObjects.map(npc => ({
        ...npc, width: 0, height: 0, rotation: 0,
        type: '', visible: true, point: true,
      })),
    },
  ],
}

const fs = require('fs')
const path = require('path')
const outPath = path.join(__dirname, '..', 'public', 'assets', 'maps', 'village.json')
fs.writeFileSync(outPath, JSON.stringify(map, null, 2))
console.log(`Generated ${outPath}`)
