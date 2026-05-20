import React, { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import { MessageBubble } from './MessageBubble'
import { useSSE } from '../../hooks/useSSE'
import { chatApi } from '../../services/api'
import { Send, Loader2 } from 'lucide-react'

interface ChatWindowProps {
  conversationId: string | null
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, streamingContent, isThinking, addMessage } = useChatStore()
  useSSE(conversationId)

  const convMessages = conversationId ? (messages[conversationId] ?? []) : []
  const streamContent = conversationId ? (streamingContent[conversationId] ?? '') : ''
  const thinking = conversationId ? isThinking[conversationId] : false

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convMessages, streamContent])

  const handleSend = async () => {
    if (!input.trim() || !conversationId || sending) return

    const message = input.trim()
    setInput('')
    setSending(true)

    addMessage(conversationId, {
      id: Date.now().toString(),
      role: 'user',
      content: message
    })

    try {
      await chatApi.sendMessage(conversationId, message)
    } catch (e) {
      console.error('Failed to send message', e)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {convMessages.map(msg => (
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

      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
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
        <p className="text-xs text-gray-600 font-mono mt-2">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  )
}
