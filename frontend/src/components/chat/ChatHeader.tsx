import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Hash, Activity } from 'lucide-react'
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
      className="border-b border-gray-800 bg-gray-950/70 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 shrink-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Hash size={12} className="text-gray-600 shrink-0" />
        <h2 className="text-sm font-semibold text-gray-100 truncate">
          {conversation?.title || 'Untitled conversation'}
        </h2>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono">
        {model && (
          <div className="chip border-violet-500/30 bg-violet-500/5 text-violet-300">
            <Cpu size={11} />
            <span className="truncate max-w-[14rem]">{model.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-gray-500">
          <Activity size={11} className={isThinking ? 'text-yellow-300 animate-pulse' : 'text-emerald-400'} />
          <span>{isThinking ? 'running' : 'idle'}</span>
        </div>
      </div>
    </motion.header>
  )
}
