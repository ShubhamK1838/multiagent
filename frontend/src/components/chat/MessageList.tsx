import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { useUiSettings } from '../../hooks/useUiSettings'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'thinking'
  content: string
}

interface MessageListProps {
  messages: ChatMessage[]
  streamContent: string
  thinking: boolean
}

export function MessageList({ messages, streamContent, thinking }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)
  const { getBoolean } = useUiSettings()

  const showThinking = getBoolean('ui.show_thinking', true)
  const visibleMessages = messages.filter(m => showThinking || m.role !== 'thinking')

  useEffect(() => {
    if (!atBottom) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, streamContent, thinking, showThinking, atBottom])

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    setAtBottom(distance < 80)
  }

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  return (
    <div className="flex-1 min-h-0 relative">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="absolute inset-0 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                index={idx}
              />
            ))}

            {streamContent && (
              <MessageBubble
                key="streaming"
                role="assistant"
                content={streamContent}
                streaming
                animate={false}
              />
            )}

            {thinking && !streamContent && (
              <TypingIndicator key="thinking" />
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      <AnimatePresence>
        {!atBottom && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-gray-900/90 backdrop-blur border border-violet-500/30 text-violet-200 px-3 py-1.5 rounded-full text-xs font-mono shadow-lg shadow-black/40 hover:border-violet-500/60 hover:bg-gray-900"
            aria-label="Scroll to bottom"
          >
            <ArrowDown size={12} />
            New
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
