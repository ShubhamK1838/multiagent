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
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-2.5 flex items-center gap-3 shrink-0"
      style={{
        background: 'rgba(2,11,24,0.95)',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-[9px] font-mono font-bold tracking-widest uppercase shrink-0"
          style={{ color: 'rgba(0,212,255,0.5)' }}
        >
          MISSION:
        </span>
        <h2 className="text-sm font-mono font-semibold truncate" style={{ color: 'rgba(180,240,255,0.9)' }}>
          {conversation?.title || 'UNTITLED OPERATION'}
        </h2>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 shrink-0">
        {model && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono"
            style={{
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.15)',
              color: 'rgba(0,212,255,0.7)',
            }}
          >
            <span className="tracking-widest uppercase" style={{ color: 'rgba(0,212,255,0.4)' }}>
              NEURAL CORE:
            </span>
            <span className="truncate max-w-[14rem]">{model.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isThinking ? '#00ff88' : 'rgba(0,212,255,0.4)' }}
            animate={isThinking ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={isThinking ? { duration: 0.8, repeat: Infinity } : {}}
          />
          <span
            className="tracking-widest uppercase"
            style={{ color: isThinking ? '#00ff88' : 'rgba(0,212,255,0.5)' }}
          >
            {isThinking ? 'ENGAGED' : 'STANDBY'}
          </span>
        </div>
      </div>
    </motion.header>
  )
}
