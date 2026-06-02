import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

export type CoreState = 'idle' | 'thinking' | 'speaking'

interface ArcReactorCoreProps {
  state: CoreState
  combat?: boolean
}

// Per-state tuning. Durations are seconds-per-rotation (lower = faster).
const TUNING: Record<CoreState, {
  opacity: number; outer: number; mid: number; inner: number;
  corePulse: number; glow: number; ripple: boolean;
}> = {
  idle:     { opacity: 0.30, outer: 95, mid: 62, inner: 34, corePulse: 4.5, glow: 0.22, ripple: false },
  thinking: { opacity: 0.72, outer: 22, mid: 15, inner: 8,  corePulse: 1.5, glow: 0.62, ripple: true  },
  speaking: { opacity: 0.60, outer: 42, mid: 28, inner: 15, corePulse: 0.85, glow: 0.5, ripple: true  },
}

const CX = 200
const CY = 200

// A ring of radial tick marks; every `majorEvery`-th tick is longer/brighter.
const TickRing: React.FC<{ radius: number; count: number; len: number; majorEvery: number; color: string; width?: number }>
  = ({ radius, count, len, majorEvery, color, width = 1 }) => (
  <>
    {Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2
      const major = i % majorEvery === 0
      const r1 = radius
      const r2 = radius - (major ? len * 1.9 : len)
      return (
        <line
          key={i}
          x1={CX + Math.cos(a) * r1} y1={CY + Math.sin(a) * r1}
          x2={CX + Math.cos(a) * r2} y2={CY + Math.sin(a) * r2}
          stroke={color}
          strokeWidth={major ? width * 1.6 : width}
          opacity={major ? 0.9 : 0.45}
        />
      )
    })}
  </>
)

export const ArcReactorCore: React.FC<ArcReactorCoreProps> = ({ state, combat }) => {
  const t = TUNING[state]
  const C = combat
    ? { main: '#ff3b3b', accent: '#ff9d3b', rgb: '255,59,59', argb: '255,157,59' }
    : { main: '#00d4ff', accent: '#a855f7', rgb: '0,212,255', argb: '168,85,247' }

  // Triangular reactor coil (the iconic arc-reactor core shape).
  const triangle = useMemo(() => {
    const r = 52
    return [0, 120, 240]
      .map(deg => {
        const a = ((deg - 90) * Math.PI) / 180
        return `${CX + Math.cos(a) * r},${CY + Math.sin(a) * r}`
      })
      .join(' ')
  }, [])

  return (
    <div
      className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="relative"
        style={{ width: 'min(64vmin, 760px)', height: 'min(64vmin, 760px)' }}
        animate={{ opacity: t.opacity }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      >
        {/* Soft volumetric glow behind the core */}
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: '46%', height: '46%',
            translateX: '-50%', translateY: '-50%',
            background: `radial-gradient(circle, rgba(${C.rgb},${t.glow}) 0%, rgba(${C.rgb},${t.glow * 0.4}) 35%, transparent 70%)`,
            filter: 'blur(18px)',
          }}
          animate={{ scale: state === 'idle' ? [1, 1.05, 1] : [1, 1.18, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ repeat: Infinity, duration: t.corePulse, ease: 'easeInOut' }}
        />

        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
          <defs>
            <radialGradient id="arc-core-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="35%" stopColor={C.main} stopOpacity="0.9" />
              <stop offset="100%" stopColor={C.main} stopOpacity="0" />
            </radialGradient>
            <filter id="arc-core-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>

          {/* Outer slow rotating tick ring */}
          <motion.g
            style={{ originX: '200px', originY: '200px' }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: t.outer, ease: 'linear' }}
            filter="url(#arc-core-blur)"
          >
            <circle cx={CX} cy={CY} r={190} fill="none" stroke={`rgba(${C.rgb},0.25)`} strokeWidth={1} />
            <TickRing radius={188} count={72} len={6} majorEvery={6} color={C.main} />
          </motion.g>

          {/* Mid counter-rotating segmented ring */}
          <motion.g
            style={{ originX: '200px', originY: '200px' }}
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: t.mid, ease: 'linear' }}
          >
            <circle
              cx={CX} cy={CY} r={150} fill="none"
              stroke={C.main} strokeWidth={2}
              strokeDasharray="40 18 8 18" opacity={0.55}
            />
            <circle
              cx={CX} cy={CY} r={138} fill="none"
              stroke={`rgba(${C.argb},0.5)`} strokeWidth={1}
              strokeDasharray="2 10"
            />
          </motion.g>

          {/* Dashed accent ring */}
          <motion.g
            style={{ originX: '200px', originY: '200px' }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: t.mid * 1.7, ease: 'linear' }}
          >
            <circle
              cx={CX} cy={CY} r={116} fill="none"
              stroke={`rgba(${C.rgb},0.45)`} strokeWidth={1.5}
              strokeDasharray="1 14" strokeLinecap="round"
            />
          </motion.g>

          {/* Inner rotating reactor coil (triangle) */}
          <motion.g
            style={{ originX: '200px', originY: '200px' }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: t.inner, ease: 'linear' }}
          >
            <circle cx={CX} cy={CY} r={86} fill="none" stroke={`rgba(${C.rgb},0.4)`} strokeWidth={1} />
            <polygon
              points={triangle}
              fill="none"
              stroke={C.main}
              strokeWidth={2.5}
              strokeLinejoin="round"
              opacity={0.85}
              style={{ filter: `drop-shadow(0 0 6px rgba(${C.rgb},0.8))` }}
            />
            {[0, 120, 240].map(deg => {
              const a = ((deg - 90) * Math.PI) / 180
              return (
                <circle
                  key={deg}
                  cx={CX + Math.cos(a) * 52}
                  cy={CY + Math.sin(a) * 52}
                  r={5}
                  fill={C.accent}
                  style={{ filter: `drop-shadow(0 0 5px rgba(${C.argb},0.9))` }}
                />
              )
            })}
          </motion.g>

          {/* Central glowing orb */}
          <motion.circle
            cx={CX} cy={CY} r={34}
            fill="url(#arc-core-grad)"
            animate={{ r: state === 'idle' ? [32, 34, 32] : [31, 38, 31] }}
            transition={{ repeat: Infinity, duration: t.corePulse, ease: 'easeInOut' }}
          />
          <circle cx={CX} cy={CY} r={14} fill="#ffffff" opacity={0.9} style={{ filter: 'blur(2px)' }} />
        </svg>

        {/* Expanding energy ripples when active */}
        {t.ripple && [0, 0.9, 1.8].map((delay, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full border"
            style={{
              width: '52%', height: '52%',
              translateX: '-50%', translateY: '-50%',
              borderColor: i === 2 ? `rgba(${C.argb},0.4)` : `rgba(${C.rgb},0.5)`,
            }}
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.7, delay, ease: 'easeOut' }}
          />
        ))}
      </motion.div>
    </div>
  )
}
