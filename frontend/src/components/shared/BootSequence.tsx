import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArcReactor } from './ArcReactor'

interface BootSequenceProps {
  onComplete: () => void
}

const BOOT_LINES = [
  'INITIALIZING J.A.R.V.I.S. v4.7.0...',
  'LOADING NEURAL SUBSYSTEMS...',
  'CONNECTING TO AI CORE...',
  'CALIBRATING KNOWLEDGE BASE...',
  'ESTABLISHING SECURE CHANNELS...',
  'ALL SYSTEMS NOMINAL.',
  'GOOD DAY.',
]

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const addLine = () => {
      if (i < BOOT_LINES.length) {
        setVisibleLines(prev => [...prev, BOOT_LINES[i]])
        i++
        setTimeout(addLine, i === BOOT_LINES.length ? 600 : 280)
      } else {
        setTimeout(() => setDone(true), 400)
        setTimeout(onComplete, 900)
      }
    }
    setTimeout(addLine, 200)
  }, [onComplete])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: '#020b18' }}
        >
          {/* scan line */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px)',
            }}
          />

          <ArcReactor size={72} className="mb-8" />

          <h1 className="text-cyan-400 font-mono text-xl font-bold tracking-[0.3em] mb-2">
            J.A.R.V.I.S.
          </h1>
          <p className="text-cyan-600 font-mono text-xs tracking-widest mb-8">
            JUST A RATHER VERY INTELLIGENT SYSTEM
          </p>

          <div className="w-80 space-y-1">
            <AnimatePresence>
              {visibleLines.map((line, idx) => (
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-mono text-xs tracking-wider"
                  style={{ color: idx === visibleLines.length - 1 ? '#00d4ff' : 'rgba(0,212,255,0.5)' }}
                >
                  <span className="text-cyan-600 mr-2">&gt;&gt;</span>{line}
                </motion.p>
              ))}
            </AnimatePresence>
            {visibleLines.length > 0 && (
              <motion.span
                className="inline-block w-2 h-3 bg-cyan-400 ml-5"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </div>

          {/* Progress bar */}
          <div className="w-80 mt-6 h-px bg-cyan-900">
            <motion.div
              className="h-full bg-cyan-400"
              initial={{ width: '0%' }}
              animate={{ width: `${(visibleLines.length / BOOT_LINES.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="font-mono text-[10px] text-cyan-700 mt-2 tracking-widest">
            {Math.round((visibleLines.length / BOOT_LINES.length) * 100)}% LOADED
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
