import React, { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { Loader2 } from 'lucide-react'

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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map(msg => (
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}

      {streamContent && (
        <MessageBubble role="assistant" content={streamContent} streaming />
      )}

      {thinking && !streamContent && (
        <div className="flex gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center text-xs font-mono font-bold text-green-400">
            AI
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-yellow-400">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs font-mono">Thinking…</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
