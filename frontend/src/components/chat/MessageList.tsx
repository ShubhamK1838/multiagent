import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface MessageListProps {
  messages: ChatMessage[]
  streamContent: string
  thinking: boolean
}

export function MessageList({ messages, streamContent, thinking }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, streamContent, thinking])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
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
  )
}
