import { motion } from 'framer-motion'

interface ArcReactorProps {
  size?: number
  className?: string
}

export function ArcReactor({ size = 28, className }: ArcReactorProps) {
  return (
    <motion.div
      className={className}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg width={size} height={size} viewBox="0 0 28 28">
        {/* Outer glow ring */}
        <circle cx="14" cy="14" r="12" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.4" />
        {/* Rotating outer dashes */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '14px', originY: '14px' }}
        >
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <line
              key={angle}
              x1="14" y1="3" x2="14" y2="6"
              stroke="#00d4ff"
              strokeWidth="1.5"
              transform={`rotate(${angle} 14 14)`}
              opacity="0.8"
            />
          ))}
        </motion.g>
        {/* Mid ring */}
        <circle cx="14" cy="14" r="8" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.6" />
        {/* Counter-rotating inner segments */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '14px', originY: '14px' }}
        >
          {[0, 120, 240].map((angle) => (
            <path
              key={angle}
              d="M14 7 A7 7 0 0 1 20 14"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1"
              transform={`rotate(${angle} 14 14)`}
              opacity="0.7"
            />
          ))}
        </motion.g>
        {/* Core dot */}
        <circle cx="14" cy="14" r="3" fill="#00d4ff" opacity="0.9" />
        <circle cx="14" cy="14" r="2" fill="white" opacity="0.6" />
        {/* Core pulse */}
        <motion.circle
          cx="14" cy="14" r="3"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="1"
          animate={{ r: [3, 6, 3], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
    </motion.div>
  )
}
