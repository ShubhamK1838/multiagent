import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useGestureDraggable } from '../../../hooks/useGestureDraggable'

export interface VizPanelBaseProps {
  id: string
  title: string
  accent: string
  accentRgb: string
  badge?: string
  onClose: () => void
  initialLeft?: number
  initialRight?: number
  initialTop: number
  width?: number
  maxHeight?: string
  footer?: React.ReactNode
  children: React.ReactNode
}

const CORNER_POSITIONS = [
  ['top-0 left-0', 'border-t border-l'],
  ['top-0 right-0', 'border-t border-r'],
  ['bottom-0 left-0', 'border-b border-l'],
  ['bottom-0 right-0', 'border-b border-r'],
] as const

// Holographic shimmer keyframes injected once
const SHIMMER_STYLE = `
@keyframes holo-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`
if (typeof document !== 'undefined' && !document.getElementById('holo-shimmer-style')) {
  const s = document.createElement('style')
  s.id = 'holo-shimmer-style'
  s.textContent = SHIMMER_STYLE
  document.head.appendChild(s)
}

// Materialize animation variants — scan-line reveal from top + spring in
const materializeVariants = {
  hidden: {
    opacity: 0,
    scaleY: 0.04,
    scaleX: 0.92,
    filter: 'brightness(4) saturate(0)',
  },
  visible: {
    opacity: 1,
    scaleY: 1,
    scaleX: 1,
    filter: 'brightness(1) saturate(1)',
    transition: {
      scaleY:  { type: 'spring', stiffness: 380, damping: 32, mass: 0.6 },
      scaleX:  { type: 'spring', stiffness: 300, damping: 26, delay: 0.04 },
      opacity: { duration: 0.06 },
      filter:  { duration: 0.25, delay: 0.05 },
    },
  },
  exit: {
    opacity: 0,
    scaleY: 0.04,
    scaleX: 0.92,
    filter: 'brightness(3) saturate(0)',
    transition: { duration: 0.18, ease: 'easeIn' },
  },
}

export const VizPanelBase: React.FC<VizPanelBaseProps> = ({
  id, title, accent, accentRgb, badge, onClose,
  initialLeft, initialRight, initialTop,
  width = 420, maxHeight = '78vh',
  footer, children,
}) => {
  const { ref, x, y } = useGestureDraggable(id)
  const panelRef = useRef<HTMLDivElement>(null)

  // Tilt effect — subtle 3-D perspective on mouse hover
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 25 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 25 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = panelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    rotateY.set(((e.clientX - cx) / rect.width) * 6)
    rotateX.set(-((e.clientY - cy) / rect.height) * 4)
  }
  const handleMouseLeave = () => { rotateX.set(0); rotateY.set(0) }

  const posStyle = initialRight !== undefined
    ? { right: initialRight, top: initialTop }
    : { left: initialLeft ?? 64, top: initialTop }

  return (
    <motion.div
      ref={ref}
      drag
      dragMomentum={false}
      variants={materializeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        position: 'fixed',
        ...posStyle,
        x, y,
        zIndex: 60,
        width,
        maxHeight,
        perspective: 800,
        rotateX,
        rotateY,
        transformOrigin: 'center center',
      }}
      className="pointer-events-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Holographic shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-sm overflow-hidden"
        style={{ zIndex: 70, mixBlendMode: 'screen' }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(105deg,
            transparent 30%,
            rgba(${accentRgb},0.06) 45%,
            rgba(168,85,247,0.04) 50%,
            rgba(${accentRgb},0.06) 55%,
            transparent 70%)`,
          backgroundSize: '200% 100%',
          animation: 'holo-shimmer 4s linear infinite',
        }} />
      </div>

      <div
        ref={panelRef}
        className="flex flex-col rounded-sm overflow-hidden w-full h-full"
        style={{
          background: 'linear-gradient(150deg, rgba(0,6,18,0.97) 0%, rgba(0,15,35,0.95) 100%)',
          border: `1px solid rgba(${accentRgb},0.22)`,
          boxShadow: `0 16px 60px rgba(0,0,0,0.7), 0 0 40px rgba(${accentRgb},0.06), inset 0 1px 0 rgba(${accentRgb},0.08)`,
          backdropFilter: 'blur(20px)',
          maxHeight,
        }}
      >
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{ background: `repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(${accentRgb},1) 2px,rgba(${accentRgb},1) 3px)` }}
        />

        {/* Corner bracket decorations */}
        {CORNER_POSITIONS.map(([pos, border]) => (
          <div
            key={pos}
            className={`absolute ${pos} w-3 h-3 ${border} pointer-events-none`}
            style={{ borderColor: `rgba(${accentRgb},0.40)` }}
          />
        ))}

        {/* Header */}
        <div
          className="relative flex items-center gap-2 px-3 py-2 shrink-0 cursor-grab active:cursor-grabbing"
          style={{ borderBottom: `1px solid rgba(${accentRgb},0.12)` }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            style={{ background: accent, boxShadow: `0 0 8px ${accent}cc, 0 0 16px ${accent}44` }}
          />
          <span
            className="text-[9px] font-mono uppercase tracking-[0.22em] flex-1 truncate min-w-0"
            style={{ color: `rgba(${accentRgb},0.80)` }}
          >
            {title}
          </span>
          {badge && (
            <span className="shrink-0 text-[8px] font-mono tabular-nums" style={{ color: `rgba(${accentRgb},0.35)` }}>
              {badge}
            </span>
          )}
          <button
            onClick={onClose}
            onPointerDown={e => e.stopPropagation()}
            className="shrink-0 w-5 h-5 flex items-center justify-center rounded-sm text-[9px] font-mono
                       hover:text-red-400/90 hover:bg-red-400/10 transition-colors"
            style={{ color: `rgba(${accentRgb},0.35)` }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-transparent"
          style={{ scrollbarColor: `rgba(${accentRgb},0.2) transparent` }}
          onPointerDown={e => e.stopPropagation()}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-3 py-1.5 shrink-0"
            style={{ borderTop: `1px solid rgba(${accentRgb},0.08)` }}
          >
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  )
}
