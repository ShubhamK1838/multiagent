import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { LoadingDots } from '../shared/LoadingDots'

interface TypingIndicatorProps {
  label?: string
}

export function TypingIndicator({ label = 'Thinking' }: TypingIndicatorProps) {
  return (
    <motion.div
      className="flex gap-3 mb-4"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center text-violet-300">
        <Bot size={14} />
      </div>
      <div className="bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-3 flex items-center gap-2">
        <LoadingDots />
        <span className="text-xs font-mono text-gray-400 ml-1">{label}…</span>
      </div>
    </motion.div>
  )
}
