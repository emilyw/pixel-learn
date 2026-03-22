const RECENCY_LIMIT = 3

export function selectWord(bank, npcId, recentWords) {
  const eligible = bank.filter(w => w.npcIds.includes(npcId))
  if (eligible.length === 0) return null

  const exclusion = eligible.length <= RECENCY_LIMIT
    ? recentWords.slice(0, Math.max(0, eligible.length - 1))
    : recentWords.slice(0, RECENCY_LIMIT)

  const candidates = eligible.filter(w => !exclusion.includes(w.word))
  const pool = candidates.length > 0 ? candidates : eligible
  return pool[Math.floor(Math.random() * pool.length)]
}
