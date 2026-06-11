import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeContext'
import { sanitizeForSpeech } from '../../utils/speech'

interface LiveCaptionsProps {
  /** The text JARVIS is currently speaking. */
  text: string
  /** Whether TTS is actively playing. */
  active: boolean
}

/**
 * Subtitle-style live captions of what JARVIS is saying, revealed with a
 * typewriter effect while TTS is active. The reveal cadence approximates
 * speech pace; the caption stays visible until speech ends.
 */
export const LiveCaptions: React.FC<LiveCaptionsProps> = ({ text, active }) => {
  const { theme } = useTheme()
  const combat = theme === 'combat'
  const [shown, setShown] = useState('')
  const idxRef = useRef(0)

  useEffect(() => {
    idxRef.current = 0
    setShown('')
    const full = sanitizeForSpeech(text)
    if (!full) return
    const id = setInterval(() => {
      idxRef.current += 1
      setShown(full.slice(0, idxRef.current))
      if (idxRef.current >= full.length) clearInterval(id)
    }, 45)
    return () => clearInterval(id)
  }, [text])

  const color = combat ? '#ff6b6b' : '#7dd3fc'
  const show = active && shown.length > 0

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute left-1/2 bottom-24 z-[40] -translate-x-1/2 w-auto max-w-[60%] pointer-events-none"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="px-5 py-3 rounded-lg text-center text-sm leading-relaxed font-light backdrop-blur-sm"
            style={{
              color,
              background: combat ? 'rgba(30,0,0,0.5)' : 'rgba(0,16,32,0.5)',
              border: `1px solid ${color}33`,
              textShadow: `0 0 8px ${color}66`,
            }}
          >
            {shown}
            <span
              className="inline-block w-[7px] h-[1em] ml-0.5 align-middle animate-pulse"
              style={{ background: color, opacity: 0.8 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
