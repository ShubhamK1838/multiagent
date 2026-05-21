import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Terminal } from 'lucide-react'
import { MessageList } from './MessageList'
import { DebugPanel } from './DebugPanel'
import { ChatHeader } from './ChatHeader'
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
  const [sendBurst, setSendBurst] = useState(0)
  const [inputFocused, setInputFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { convMessages, streamContent, thinking, sending, sendMessage } = useChat(conversationId)
  const { getBoolean } = useUiSettings()
  useSSE(conversationId)

  const debugEnabled = getBoolean('ui.debug_panel', true)

  const send = async () => {
    if (!input.trim()) return
    const text = input
    setInput('')
    setSendBurst(b => b + 1)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ background: 'rgba(2,11,24,0.98)' }}
      >
        <EmptyState
          icon={<Sparkles size={22} />}
          title="AWAITING MISSION PARAMETERS"
          description="Select an existing operation from the sidebar or initialize a new session."
          action={onNewChat && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 mx-auto px-4 py-2 text-xs font-mono tracking-widest uppercase"
              style={{
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.3)',
                color: '#00d4ff',
              }}
            >
              <Terminal size={14} />
              INITIALIZE SESSION
            </button>
          )}
        />
      </div>
    )
  }

  const isBusy = sending || thinking
  const canSend = input.trim().length > 0 && !isBusy
  const borderColor = inputFocused
    ? 'rgba(0,212,255,0.5)'
    : canSend
    ? 'rgba(0,212,255,0.3)'
    : 'rgba(0,212,255,0.1)'
  const glowShadow = inputFocused
    ? '0 0 20px -4px rgba(0,212,255,0.3)'
    : canSend
    ? '0 0 12px -6px rgba(0,212,255,0.2)'
    : 'none'

  return (
    <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
      <ChatHeader conversationId={conversationId} />

      <div className="flex-1 flex flex-col min-h-0 relative">
        <MessageList messages={convMessages} streamContent={streamContent} thinking={thinking} />
      </div>

      {debugEnabled && <DebugPanel conversationId={conversationId} />}

      <div
        className="shrink-0 px-4 py-3"
        style={{
          background: 'rgba(2,11,24,0.97)',
          borderTop: '1px solid rgba(0,212,255,0.1)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* HUD input container */}
          <div
            className="relative"
            style={{
              border: `1px solid ${borderColor}`,
              background: 'rgba(0,212,255,0.02)',
              boxShadow: glowShadow,
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            {/* HUD corner brackets */}
            <svg className="absolute top-0 left-0 w-3 h-3 pointer-events-none" viewBox="0 0 12 12">
              <path d="M10 2 L2 2 L2 10" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="1.5"/>
            </svg>
            <svg className="absolute top-0 right-0 w-3 h-3 pointer-events-none" viewBox="0 0 12 12">
              <path d="M2 2 L10 2 L10 10" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="1.5"/>
            </svg>
            <svg className="absolute bottom-0 left-0 w-3 h-3 pointer-events-none" viewBox="0 0 12 12">
              <path d="M2 2 L2 10 L10 10" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="1.5"/>
            </svg>
            <svg className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none" viewBox="0 0 12 12">
              <path d="M10 2 L10 10 L2 10" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="1.5"/>
            </svg>

            <div className="flex gap-2 items-end p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={isBusy ? 'PROCESSING REQUEST...' : 'ENTER QUERY...'}
                disabled={isBusy}
                rows={1}
                className="flex-1 bg-transparent border-0 outline-none text-sm font-mono resize-none max-h-40 py-2 px-1"
                style={{
                  color: 'rgba(180,240,255,0.9)',
                  caretColor: '#00d4ff',
                  height: 'auto',
                }}
                onInput={e => {
                  const t = e.currentTarget
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 160) + 'px'
                }}
              />
              <motion.button
                whileHover={canSend ? { scale: 1.06 } : {}}
                whileTap={canSend ? { scale: 0.94 } : {}}
                onClick={send}
                disabled={!canSend}
                className="shrink-0 h-9 w-9 flex items-center justify-center relative overflow-visible"
                style={{
                  background: canSend ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
                  border: `1px solid ${canSend ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.1)'}`,
                  color: canSend ? '#00d4ff' : 'rgba(0,212,255,0.2)',
                  boxShadow: canSend ? '0 0 12px -2px rgba(0,212,255,0.3)' : 'none',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
                aria-label="Transmit"
              >
                <Send size={14} />
                <AnimatePresence>
                  {sendBurst > 0 && (
                    <motion.span
                      key={sendBurst}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ color: '#00d4ff' }}
                      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      animate={{ opacity: 0, x: 28, y: -28, scale: 0.6 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.55, ease: 'easeOut' }}
                    >
                      <Send size={14} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[9px] font-mono tracking-wider" style={{ color: 'rgba(0,212,255,0.25)' }}>
              <span style={{ color: 'rgba(0,212,255,0.4)' }}>ENTER</span> · TRANSMIT
              {'  '}
              <span style={{ color: 'rgba(0,212,255,0.4)' }}>SHIFT+ENTER</span> · NEWLINE
            </p>
            <p className="text-[9px] font-mono tabular-nums" style={{ color: 'rgba(0,212,255,0.25)' }}>
              {input.length} {input.length === 1 ? 'CHAR' : 'CHARS'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
