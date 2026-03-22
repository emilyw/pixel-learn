const KEY = 'pixellearn_save'

export const DEFAULT_SAVE = {
  totalHearts: 0,
  unlockedNpcs: ['mayor-hop', 'blaze', 'biscuit', 'doodle', 'mittens', 'professor-hoot'],
  firedThresholds: [],
  skillLevel: 'beginner',
  audioEnabled: null,
  dailyHeartCap: 10,
  dailyDate: '',
  dailyHeartsEarned: 0,
  dailyQuestProgress: 0,
  dailyQuestComplete: false,
  isFirstPlay: true,
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SAVE }
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SAVE }
  }
}

export function writeSave(save) {
  localStorage.setItem(KEY, JSON.stringify(save))
}

export function exportCode(save) {
  return btoa(JSON.stringify(save))
}

export function importCode(code) {
  try {
    return { ...DEFAULT_SAVE, ...JSON.parse(atob(code)) }
  } catch {
    return null
  }
}
