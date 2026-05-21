import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

interface TypingIndicatorProps {
  label?: string
}

export function TypingIndicator({ label = 'thinking' }: TypingIndicatorProps) {
  return (
    <motion.div
      className="flex gap-3 mb-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 text-violet-300 border border-gray-700 flex items-center justify-center shrink-0"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(139,92,246,0)',
            '0 0 16px 2px rgba(139,92,246,0.4)',
            '0 0 0 0 rgba(139,92,246,0)',
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Bot size={14} />
      </motion.div>

      <div className="bg-gray-900/80 border border-gray-700 rounded-2xl rounded-tl-md px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-black/30">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full bg-violet-400"
            animate={{
              y: [0, -4, 0],
              opacity: [0.35, 1, 0.35],
            }}
            transition={{
              duration: 1.1,
              delay: i * 0.18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        <motion.span
          className="ml-1 text-[11px] font-mono uppercase tracking-wider text-gray-500"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {label}
        </motion.span>
      </div>
    </motion.div>
  )
}
