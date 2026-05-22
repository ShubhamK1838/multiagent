import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { aiModelApi } from '../../services/api'
import { useChatStore } from '../../store/chatStore'
import type { AiModel } from '../../types'

interface ChatHeaderProps {
  conversationId: string
}

export function ChatHeader({ conversationId }: ChatHeaderProps) {
  const conversation = useChatStore(s => s.conversations.find(c => c.id === conversationId))
  const isThinking = useChatStore(s => !!s.isThinking[conversationId])
  const [model, setModel] = useState<AiModel | null>(null)

  useEffect(() => {
    let cancelled = false
    aiModelApi.getDefault()
      .then(m => { if (!cancelled) setModel(m) })
      .catch(() => { /* no default configured */ })
    return () => { cancelled = true }
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-6 py-3 flex items-center gap-4 shrink-0 relative overflow-hidden"
      style={{
        background: 'rgba(2,11,24,0.95)',
        borderBottom: '1px solid rgba(0,212,255,0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Decorative scanline for header */}
      <div className="absolute inset-0 scanline-overlay opacity-20" />

      <div className="flex items-center gap-3 min-w-0 relative z-10">
        <div className="flex flex-col">
          <span
            className="text-[8px] font-mono font-bold tracking-[0.2em] uppercase shrink-0"
            style={{ color: 'rgba(0,212,255,0.5)' }}
          >
            ACTIVE PROTOCOL
          </span>
          <h2 className="text-sm font-mono font-bold truncate tracking-widest uppercase mt-0.5" style={{ color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.4)' }}>
            {conversation?.title || 'UNTITLED OPERATION'}
          </h2>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4 shrink-0 relative z-10">
        {model && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono relative overflow-hidden"
            style={{
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: 'rgba(0,212,255,0.8)',
            }}
          >
            {/* HUD corner accents for model badge */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-jarvis-cyan" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-jarvis-cyan" />

            <span className="tracking-[0.15em] uppercase opacity-60">
              CORE:
            </span>
            <span className="truncate max-w-[14rem] font-bold">{model.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 border border-jarvis-cyan/20 bg-jarvis-cyan/5">
          <div className="relative flex items-center justify-center w-3 h-3">
            <motion.div
              className="absolute inset-0 rounded-full border border-jarvis-cyan"
              style={{ borderTopColor: 'transparent', opacity: isThinking ? 1 : 0.3 }}
              animate={isThinking ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-jarvis-cyan rounded-full"
              animate={isThinking ? { opacity: [1, 0.4, 1], scale: [1, 1.2, 1] } : { opacity: 0.5, scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <span
            className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase"
            style={{
              color: isThinking ? '#00d4ff' : 'rgba(0,212,255,0.5)',
              textShadow: isThinking ? '0 0 8px rgba(0,212,255,0.6)' : 'none'
            }}
          >
            {isThinking ? 'ENGAGED' : 'STANDBY'}
          </span>
        </div>
      </div>
    </motion.header>
  )
}
