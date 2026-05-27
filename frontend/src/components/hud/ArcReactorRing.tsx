import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ArcReactorRingProps {
  active: boolean  // true while TTS is speaking or AI is processing
  size?: number
}

const RING_CONFIGS = [
  { delay: 0,    duration: 1.6, scale: [1, 1.8], color: 'rgba(0,212,255,0.6)' },
  { delay: 0.35, duration: 1.6, scale: [1, 2.2], color: 'rgba(0,212,255,0.35)' },
  { delay: 0.7,  duration: 1.6, scale: [1, 2.8], color: 'rgba(168,85,247,0.25)' },
]

export const ArcReactorRing: React.FC<ArcReactorRingProps> = ({ active, size = 32 }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
    {/* Static inner core */}
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size * 0.55,
        height: size * 0.55,
        background: active
          ? 'radial-gradient(circle, rgba(0,212,255,0.9) 0%, rgba(0,212,255,0.3) 60%, transparent 100%)'
          : 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, rgba(0,212,255,0.1) 60%, transparent 100%)',
        boxShadow: active ? '0 0 12px rgba(0,212,255,0.8), 0 0 4px rgba(0,212,255,1)' : 'none',
      }}
      animate={active ? { opacity: [0.7, 1, 0.7] } : { opacity: 0.5 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
    />

    {/* Expanding rings */}
    <AnimatePresence>
      {active && RING_CONFIGS.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: size,
            height: size,
            borderColor: ring.color,
            borderWidth: 1,
          }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: ring.scale, opacity: 0 }}
          transition={{
            repeat: Infinity,
            duration: ring.duration,
            delay: ring.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </AnimatePresence>

    {/* Hex segments rotating around */}
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute rounded-full border border-cyan-400/20"
          style={{ width: size * 1.05, height: size * 1.05 }}
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 360, opacity: [0, 0.6, 0.6, 0] }}
          exit={{ opacity: 0 }}
          transition={{ rotate: { repeat: Infinity, duration: 3, ease: 'linear' }, opacity: { duration: 0.3 } }}
        >
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <div
              key={deg}
              className="absolute w-1 h-1 rounded-full bg-cyan-400/50"
              style={{
                top: '50%', left: '50%',
                transform: `rotate(${deg}deg) translateX(${size * 0.52}px) translateY(-50%)`,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)
