let enabled = true

export function setAudioEnabled(val) {
  enabled = val
}

export function isAudioEnabled() {
  return enabled && 'speechSynthesis' in window
}

export function speakWord(word) {
  if (!isAudioEnabled()) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(word)
  utt.rate = 0.85
  utt.pitch = 1.1
  window.speechSynthesis.speak(utt)
}

export function speakLetter(letter) {
  if (!isAudioEnabled()) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(letter)
  utt.rate = 0.8
  window.speechSynthesis.speak(utt)
}

export function initAudioFromSave(save) {
  const defaultOn = save.skillLevel !== 'advanced'
  const on = save.audioEnabled === null ? defaultOn : save.audioEnabled
  setAudioEnabled(on)
}
