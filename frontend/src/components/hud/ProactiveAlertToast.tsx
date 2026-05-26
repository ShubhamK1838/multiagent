import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ProactiveAlertToastProps {
  alerts: string[]
  onDismiss: (index: number) => void
}

const ALERT_DURATION = 8000

const SingleAlert: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / ALERT_DURATION) * 100)
      setProgress(remaining)
      if (remaining === 0) {
        clearInterval(timer)
        onDismiss()
      }
    }, 50)
    return () => clearInterval(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, x: -40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="relative overflow-hidden rounded-sm pointer-events-auto"
      style={{
        width: 320,
        background: 'linear-gradient(135deg, rgba(0,6,18,0.97) 0%, rgba(20,10,0,0.95) 100%)',
        border: '1px solid rgba(251,191,36,0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(251,191,36,0.05)',
      }}
    >
      {/* Countdown border */}
      <div
        className="absolute top-0 left-0 h-[2px] bg-amber-400/70 transition-none"
        style={{ width: `${progress}%` }}
      />

      <div className="flex items-start gap-3 px-3 py-3">
        <span className="text-amber-400 text-sm shrink-0 mt-0.5">⚡</span>
        <p className="flex-1 text-[11px] font-mono text-amber-100/85 leading-relaxed">{message}</p>
        <button
          onClick={onDismiss}
          className="shrink-0 text-amber-500/40 hover:text-amber-300/80 transition-colors text-[10px] font-mono mt-0.5"
        >
          ✕
        </button>
      </div>

      {/* Corner brackets */}
      {[['top-0 left-0', 'border-t border-l'], ['top-0 right-0', 'border-t border-r'],
        ['bottom-0 left-0', 'border-b border-l'], ['bottom-0 right-0', 'border-b border-r']
      ].map(([pos, b]) => (
        <div key={pos} className={`absolute ${pos} w-2 h-2 ${b} border-amber-400/25 pointer-events-none`} />
      ))}
    </motion.div>
  )
}

export const ProactiveAlertToast: React.FC<ProactiveAlertToastProps> = ({ alerts, onDismiss }) => {
  return (
    <div
      className="fixed top-16 left-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 320 }}
    >
      <AnimatePresence mode="popLayout">
        {alerts.map((alert, i) => (
          <SingleAlert key={`${i}-${alert.slice(0, 20)}`} message={alert} onDismiss={() => onDismiss(i)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
