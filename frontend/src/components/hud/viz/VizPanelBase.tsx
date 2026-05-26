import React from 'react'
import { motion } from 'framer-motion'

export interface VizPanelBaseProps {
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

export const VizPanelBase: React.FC<VizPanelBaseProps> = ({
  title, accent, accentRgb, badge, onClose,
  initialLeft, initialRight, initialTop,
  width = 420, maxHeight = '78vh',
  footer, children,
}) => {
  const posStyle = initialRight !== undefined
    ? { right: initialRight, top: initialTop }
    : { left: initialLeft ?? 64, top: initialTop }

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        position: 'fixed',
        ...posStyle,
        zIndex: 60,
        width,
        maxHeight,
        background: 'linear-gradient(150deg, rgba(0,6,18,0.97) 0%, rgba(0,15,35,0.95) 100%)',
        border: `1px solid rgba(${accentRgb},0.20)`,
        boxShadow: `0 16px 60px rgba(0,0,0,0.7), 0 0 40px rgba(${accentRgb},0.04)`,
        backdropFilter: 'blur(20px)',
      }}
      className="flex flex-col rounded-sm overflow-hidden pointer-events-auto"
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
          style={{ borderColor: `rgba(${accentRgb},0.30)` }}
        />
      ))}

      {/* Header — draggable handle */}
      <div
        className="relative flex items-center gap-2 px-3 py-2 shrink-0 cursor-grab active:cursor-grabbing"
        style={{ borderBottom: `1px solid rgba(${accentRgb},0.12)` }}
      >
        <motion.div
          className="w-1.5 h-1.5 rounded-full shrink-0"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{ background: accent, boxShadow: `0 0 6px ${accent}cc` }}
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

      {/* Optional footer */}
      {footer && (
        <div
          className="px-3 py-1.5 shrink-0"
          style={{ borderTop: `1px solid rgba(${accentRgb},0.08)` }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  )
}
