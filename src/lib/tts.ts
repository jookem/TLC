let _voice: SpeechSynthesisVoice | null = null
let _voiceReady = false

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  // Priority order: prefer natural-sounding US English voices
  const candidates = [
    voices.find(v => v.lang === 'en-US' && /google/i.test(v.name)),
    voices.find(v => v.lang === 'en-US' && /samantha|zira|david|mark|aria|guy|jenny|ana/i.test(v.name)),
    voices.find(v => v.lang === 'en-US'),
    voices.find(v => v.lang.startsWith('en')),
  ]

  return candidates.find(Boolean) ?? null
}

function getVoice(): SpeechSynthesisVoice | null {
  if (_voiceReady) return _voice
  _voice = pickVoice()
  _voiceReady = !!_voice
  return _voice
}

// Voices load asynchronously — cache when they arrive
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    _voice = pickVoice()
    _voiceReady = true
  })
}

export function speak(text: string) {
  if (!text || !window.speechSynthesis) return
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9

  const voice = getVoice()
  if (voice) utterance.voice = voice

  window.speechSynthesis.speak(utterance)
}
