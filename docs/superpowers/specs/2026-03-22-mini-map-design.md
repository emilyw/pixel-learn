# Mini Map Feature — Design Spec

## Overview
Add a mini map to the pixel-learn game so kids can see their position in the village at a glance.

## Requirements

- **Rendering:** Phaser `RenderTexture` in WorldScene, fixed to camera (scrollFactor 0)
- **Size:** 120x80px (1:8 scale of the 960x640 world)
- **Position:** Top-right corner, below the HUD hearts display (~40px from top)
- **Appearance:**
  - Semi-transparent (alpha 0.85)
  - 1px dark gray border
  - Terrain colors from tilemap: grass=green, water=blue, paths/dirt=brown/gray, trees=dark green
  - Player = bright yellow dot (3px)
  - Unlocked NPCs = white dots (2px)
  - Locked NPCs = gray dots (2px)
  - Camera viewport = white rectangle outline
- **Performance:** Terrain base drawn once on create. Only dots and viewport rect update per frame.
- **Implementation:** Built entirely in Phaser (not React), since it reads game state directly.

## Out of Scope
- Tap-to-move via mini map
- Zoom controls
- Fog of war
