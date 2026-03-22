export function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export function checkDailyReset(save, today = todayString()) {
  if (save.dailyDate === today) return save
  return {
    ...save,
    dailyDate: today,
    dailyHeartsEarned: 0,
    dailyQuestProgress: 0,
    dailyQuestComplete: false,
    pondWordsToday: 0,
  }
}

export function getQuestTarget(skillLevel) {
  return { beginner: 2, intermediate: 3, advanced: 4 }[skillLevel] ?? 3
}

export function addDailyHearts(save, amount) {
  return {
    ...save,
    dailyHeartsEarned: save.dailyHeartsEarned + amount,
    totalHearts: save.totalHearts + amount,
  }
}

export function incrementQuestProgress(save) {
  return { ...save, dailyQuestProgress: save.dailyQuestProgress + 1 }
}

export function isDailyCapped(save) {
  return save.dailyHeartsEarned >= save.dailyHeartCap
}
