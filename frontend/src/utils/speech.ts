/**
 * Shared helpers for the JARVIS voice pipeline (TTS sanitation, streaming sentence
 * chunking, browser voice selection). Used by useNeuralTTS, LiveCaptions, and the HUD.
 */

/** Prefer a deep British-male voice for a JARVIS feel, then any en-GB, then any English. */
export function pickJarvisVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const jarvisName = /jarvis|daniel|george|arthur|oliver|ryan|google uk english male|alex|david/i
  return (
    voices.find(v => jarvisName.test(v.name)) ??
    voices.find(v => v.lang === 'en-GB') ??
    voices.find(v => v.lang.startsWith('en')) ??
    voices[0] ??
    null
  )
}

/**
 * Convert markdown-ish model output into plain speakable text: code blocks collapse to a
 * spoken placeholder, links keep their label, URLs/emoji/markup characters are dropped.
 * Applied to BOTH the neural NIM path and the browser fallback so neither reads asterisks
 * or raw URLs aloud.
 */
export function sanitizeForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, 'a link')
    .replace(/^[ \t]*(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_#>~|]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Index just past the last completed sentence, so streaming TTS only speaks finished
 * sentences. A boundary is `.`/`!`/`?` followed by whitespace or end-of-text (so decimals
 * like "3.14" don't split), or a newline. Never cuts inside an unclosed ``` fence — the
 * block is held back until it closes, then collapsed to "code block" by the sanitizer.
 * Returns 0 when no complete sentence exists yet.
 */
export function lastSpeakableBoundary(text: string): number {
  const fenceCount = text.match(/```/g)?.length ?? 0
  const searchEnd = fenceCount % 2 === 1 ? text.lastIndexOf('```') : text.length
  const region = text.slice(0, searchEnd)
  const boundary = /[.!?](?=\s|$)|\n/g
  let last = 0
  for (let m = boundary.exec(region); m !== null; m = boundary.exec(region)) {
    last = m.index + m[0].length
  }
  return last
}
