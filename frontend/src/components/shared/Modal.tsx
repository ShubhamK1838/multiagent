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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className={`card w-full ${WIDTH_CLASSES[width]} max-h-[90vh] flex flex-col overflow-hidden`}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between p-5 border-b border-gray-800">
                <div className="min-w-0">
                  {title && <h2 className="text-base font-semibold text-gray-100">{title}</h2>}
                  {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-mono">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              {children}
            </div>

            {footer && (
              <div className="flex justify-end gap-3 p-4 border-t border-gray-800 bg-gray-900/40">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
