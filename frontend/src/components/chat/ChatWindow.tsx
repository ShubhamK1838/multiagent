import React, { useState } from 'react'
import { MessageList } from './MessageList'
import { useChat } from '../../hooks/useChat'
import { useSSE } from '../../hooks/useSSE'
import { Send, Loader2 } from 'lucide-react'

interface ChatWindowProps {
  conversationId: string | null
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [input, setInput] = useState('')
  const { convMessages, streamContent, thinking, sending, sendMessage } = useChat(conversationId)
  useSSE(conversationId)

  const handleSend = async () => {
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-mono text-violet-400">∞</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-200 mb-2">AI Framework</h2>
          <p className="text-sm text-gray-500 font-mono">Select a conversation or start a new chat</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <MessageList messages={convMessages} streamContent={streamContent} thinking={thinking} />

      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="input resize-none max-h-32 font-mono text-sm"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 128) + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || thinking}
            className="btn-primary shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending || thinking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-xs text-gray-600 font-mono mt-2">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  )
}
