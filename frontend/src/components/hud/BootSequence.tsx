import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeContext'

const LINES = [
  'INITIALIZING J.A.R.V.I.S. CORE',
  'CALIBRATING NEURAL INTERFACE',
  'MOUNTING SENSOR ARRAY',
  'ESTABLISHING SECURE UPLINK',
  'ALL SYSTEMS ONLINE',
]

const SESSION_KEY = 'jarvis_booted'

/**
 * A one-time JARVIS-style boot overlay shown when the HUD first mounts in a
 * session. Reveals system-check lines one by one with a scanning sweep, then
 * fades away. Persists a sessionStorage flag so it does not replay every time
 * the user navigates back to the HUD.
 */
export const BootSequence: React.FC = () => {
  const { theme } = useTheme()
  const combat = theme === 'combat'
  const [done, setDone] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1'
  )
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    if (done) return
    let i = 0
    const id = setInterval(() => {
      i += 1
      setVisibleLines(i)
      if (i >= LINES.length) {
        clearInterval(id)
        setTimeout(() => {
          try {
            sessionStorage.setItem(SESSION_KEY, '1')
          } catch {
            /* sessionStorage may be unavailable */
          }
          setDone(true)
        }, 700)
      }
    }, 420)
    return () => clearInterval(id)
  }, [done])

  const color = combat ? '#ff3b3b' : '#00d4ff'

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: combat ? 'rgba(8,0,0,0.94)' : 'rgba(0,6,16,0.95)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Scanning sweep line */}
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              boxShadow: `0 0 12px ${color}`,
            }}
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="text-3xl font-bold tracking-[0.4em] mb-8 select-none"
            style={{ color, textShadow: `0 0 20px ${color}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            J.A.R.V.I.S.
          </motion.div>

          <div className="font-mono text-[11px] space-y-1.5 w-[300px]">
            {LINES.map((line, i) => (
              <motion.div
                key={line}
                className="flex items-center justify-between tracking-wider"
                initial={{ opacity: 0, x: -8 }}
                animate={i < visibleLines ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
                style={{ color }}
              >
                <span>{line}</span>
                <span className="opacity-70">{i < visibleLines ? 'OK' : '··'}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
