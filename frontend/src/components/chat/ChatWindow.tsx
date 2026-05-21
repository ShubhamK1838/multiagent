import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'
import { MessageList } from './MessageList'
import { DebugPanel } from './DebugPanel'
import { useChat } from '../../hooks/useChat'
import { useSSE } from '../../hooks/useSSE'
import { useUiSettings } from '../../hooks/useUiSettings'
import { EmptyState } from '../shared/EmptyState'

interface ChatWindowProps {
  conversationId: string | null
  onNewChat?: () => void
}

export function ChatWindow({ conversationId, onNewChat }: ChatWindowProps) {
  const [input, setInput] = useState('')
  const { convMessages, streamContent, thinking, sending, sendMessage } = useChat(conversationId)
  const { getBoolean } = useUiSettings()
  useSSE(conversationId)

  const debugEnabled = getBoolean('ui.debug_panel', true)

  const send = async () => {
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<Sparkles size={22} />}
          title="Start a new conversation"
          description="Pick an existing chat from the sidebar, or create a fresh one to begin."
          action={onNewChat && (
            <button onClick={onNewChat} className="btn-primary">
              New chat
            </button>
          )}
        />
      </div>
    )
  }

  const isBusy = sending || thinking
  const canSend = input.trim().length > 0 && !isBusy

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 relative">
      <MessageList messages={convMessages} streamContent={streamContent} thinking={thinking} />

      {debugEnabled && <DebugPanel conversationId={conversationId} />}

      <div className="px-4 py-3 border-t border-gray-800 bg-gray-950/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message AI… (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="input resize-none max-h-32 text-sm"
              style={{ height: 'auto' }}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 128) + 'px'
              }}
            />
            <motion.button
              whileHover={canSend ? { scale: 1.05 } : {}}
              whileTap={canSend ? { scale: 0.95 } : {}}
              onClick={send}
              disabled={!canSend}
              className="btn-primary shrink-0 h-10 w-10 p-0 flex items-center justify-center"
              aria-label="Send"
            >
              <Send size={14} />
            </motion.button>
          </div>
          <p className="text-[11px] text-gray-600 font-mono mt-2 text-center">
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  )
}
