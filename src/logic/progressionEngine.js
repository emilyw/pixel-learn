export const UNLOCK_THRESHOLDS = [
  { points: 10, npcId: 'coach-roar',     name: 'Coach Roar',     location: 'Sports Centre' },
  { points: 20, npcId: 'mossy',          name: 'Mossy',          location: 'Garden' },
  { points: 35, npcId: 'clover',         name: 'Clover',         location: 'Villager House 2' },
  { points: 50, npcId: 'ripple',         name: 'Ripple',         location: 'Pond' },
  { points: 70, npcId: 'mystery-hut',   name: 'Mystery Hut',    location: 'Mystery Hut' },
]

export function getNewUnlocks(save) {
  return UNLOCK_THRESHOLDS.filter(t =>
    save.totalHearts >= t.points && !save.firedThresholds.includes(t.points)
  )
}
