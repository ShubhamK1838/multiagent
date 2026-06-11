import { useCallback, useEffect, useRef, useState } from 'react'
import { voiceApi } from '../services/api'
import { pickJarvisVoice, sanitizeForSpeech } from '../utils/speech'

/**
 * Speaks text through the neural TTS NIM (POST /voice/speak), playing clips from a FIFO queue so
 * streamed sentences are heard in order. Falls back to the browser SpeechSynthesis engine if the
 * NIM is disabled/unreachable (after the first failure it stays on the browser engine for the
 * session). Drop-in compatible with {@link useTTS} plus an {@link enqueue} for streaming.
 */
export function useNeuralTTS(enabled: boolean) {
  const supported = typeof window !== 'undefined'
  const [speaking, setSpeaking] = useState(false)

  const queueRef = useRef<string[]>([])
  const playingRef = useRef(false)
  const genRef = useRef(0)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const neuralBrokenRef = useRef(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // Pick a deep British-male browser voice for the fallback path.
  useEffect(() => {
    if (!supported || !('speechSynthesis' in window)) return
    const load = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) return
      voiceRef.current = pickJarvisVoice(voices)
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [supported])

  const playBrowser = (text: string) =>
    new Promise<void>(resolve => {
      if (!('speechSynthesis' in window)) return resolve()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.95
      u.pitch = 0.85
      u.volume = 1.0
      if (voiceRef.current) u.voice = voiceRef.current
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    })

  const playNeural = (text: string, gen: number) =>
    new Promise<void>((resolve, reject) => {
      voiceApi.speak(text)
        .then(blob => {
          // stop() may have been called while the synthesis request was in flight —
          // don't start playback for an utterance that was already cancelled.
          if (genRef.current !== gen) return resolve()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          currentAudioRef.current = audio
          const done = () => { URL.revokeObjectURL(url); resolve() }
          audio.onended = done
          audio.onpause = done           // stop() pauses → resolve so the pump can unwind
          audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('audio playback failed')) }
          audio.play().catch(reject)
        })
        .catch(reject)
    })

  const pump = useCallback(async () => {
    if (playingRef.current) return
    playingRef.current = true
    const myGen = genRef.current
    setSpeaking(true)
    try {
      while (queueRef.current.length > 0 && genRef.current === myGen) {
        const text = queueRef.current.shift()!
        if (!text.trim()) continue
        if (neuralBrokenRef.current) {
          await playBrowser(text)
        } else {
          try {
            await playNeural(text, myGen)
          } catch {
            neuralBrokenRef.current = true // NIM unavailable — use browser for the rest of the session
            await playBrowser(text)
          }
        }
      }
    } finally {
      playingRef.current = false
      currentAudioRef.current = null
      if (queueRef.current.length > 0) void pump()
      else setSpeaking(false)
    }
  }, [])

  /** Queue a sentence/chunk to be spoken after whatever is already queued (streaming). */
  const enqueue = useCallback((text: string) => {
    if (!enabled || !text) return
    const speakable = sanitizeForSpeech(text)
    if (!speakable) return
    queueRef.current.push(speakable)
    void pump()
  }, [enabled, pump])

  const stop = useCallback(() => {
    genRef.current++          // invalidate the running pump
    queueRef.current = []
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    if (supported && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    // playingRef is NOT cleared here: the cancelled pump is still unwinding and resets it
    // in its finally block. Clearing it early let a second pump start concurrently and
    // produced overlapping audio when stop() and enqueue() were called back-to-back.
    setSpeaking(false)
  }, [supported])

  /** Speak text immediately, replacing anything currently queued/playing. */
  const speak = useCallback((text: string) => {
    if (!enabled) return
    stop()
    // Safe to enqueue immediately: the old pump's finally block re-pumps the queue.
    enqueue(text)
  }, [enabled, stop, enqueue])

  return { speak, enqueue, stop, speaking, supported }
}
