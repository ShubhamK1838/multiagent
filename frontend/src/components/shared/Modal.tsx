import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title?: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  width?: 'sm' | 'md' | 'lg' | 'xl'
}

const WIDTH_CLASSES: Record<NonNullable<ModalProps['width']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, title, subtitle, onClose, children, footer, width = 'lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className={`card w-full ${WIDTH_CLASSES[width]} max-h-[90vh] flex flex-col overflow-hidden bg-jarvis-bg border border-jarvis-cyan/30`}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
          >
            {/* HUD scanline overlay for the modal */}
            <div className="absolute inset-0 scanline-overlay opacity-20 pointer-events-none z-[-1]" />

            {(title || subtitle) && (
              <div className="flex items-start justify-between p-5 border-b border-jarvis-cyan/20 relative">
                <div className="min-w-0">
                  {title && <h2 className="text-base font-bold text-jarvis-cyan tracking-wider uppercase">{title}</h2>}
                  {subtitle && <p className="text-xs text-jarvis-cyan/60 mt-0.5 font-mono tracking-wide">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="text-jarvis-cyan/50 hover:text-jarvis-cyan p-1.5 transition-colors" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 relative z-10">
              {children}
            </div>

            {footer && (
              <div className="flex justify-end gap-3 p-4 border-t border-jarvis-cyan/20 bg-jarvis-cyan/5 relative z-10">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
