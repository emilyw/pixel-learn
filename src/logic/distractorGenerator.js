const VOWELS = ['a', 'e', 'i', 'o', 'u']
const COMMON_CONSONANTS = ['b', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w']

export function generateIntermediateOptions(word, missingIndex) {
  const correct = word[missingIndex]
  const isVowel = VOWELS.includes(correct)
  const pool = isVowel ? VOWELS : COMMON_CONSONANTS
  const others = pool.filter(l => l !== correct)

  const distractors = []
  while (distractors.length < 2) {
    const pick = others[Math.floor(Math.random() * others.length)]
    if (!distractors.includes(pick)) distractors.push(pick)
  }

  const options = [correct, ...distractors]
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]]
  }
  return options
}
