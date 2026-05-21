import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Send, Sparkles, Terminal, ChevronRight } from 'lucide-react'
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
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <TerminalGrid />
        <EmptyState
          icon={<Sparkles size={22} />}
          title="Start a new conversation"
          description="Pick an existing chat from the sidebar, or spin up a fresh one to begin."
          action={onNewChat && (
            <button onClick={onNewChat} className="btn-primary flex items-center gap-2 mx-auto">
              <Terminal size={14} />
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
    <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
      <ChatHeader conversationId={conversationId} />

      <div className="flex-1 flex flex-col min-h-0 relative">
        <TerminalGrid />
        <MessageList messages={convMessages} streamContent={streamContent} thinking={thinking} />
      </div>

      {debugEnabled && <DebugPanel conversationId={conversationId} />}

      <div className="shrink-0 px-4 py-3 border-t border-gray-800 bg-gray-950/70 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={false}
            animate={{
              borderColor: canSend ? 'rgb(139 92 246 / 0.45)' : 'rgb(55 65 81)',
              boxShadow: canSend
                ? '0 0 24px -8px rgba(139,92,246,0.45)'
                : '0 0 0 0 rgba(0,0,0,0)',
            }}
            transition={{ duration: 0.18 }}
            className="flex gap-2 items-end rounded-xl bg-gray-900/70 border p-2"
          >
            <ChevronRight size={14} className={clsx(
              'shrink-0 mb-2.5 transition-colors',
              canSend ? 'text-violet-400' : 'text-gray-600'
            )} />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={isBusy ? 'Agent is thinking…' : 'Message AI'}
              disabled={isBusy}
              rows={1}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-100 placeholder-gray-600 resize-none max-h-40 py-2"
              style={{ height: 'auto' }}
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
              className={clsx(
                'shrink-0 h-9 w-9 rounded-lg flex items-center justify-center transition-colors relative overflow-visible',
                canSend
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              )}
              aria-label="Send"
            >
              <Send size={14} />
              <AnimatePresence>
                {sendBurst > 0 && (
                  <motion.span
                    key={sendBurst}
                    className="absolute inset-0 flex items-center justify-center text-violet-300 pointer-events-none"
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
          </motion.div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-gray-600 font-mono">
              <kbd className="text-gray-500">enter</kbd> send · <kbd className="text-gray-500">shift+enter</kbd> newline
            </p>
            <p className="text-[10px] text-gray-600 font-mono tabular-nums">
              {input.length} {input.length === 1 ? 'char' : 'chars'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TerminalGrid() {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      }}
      animate={{ opacity: [0.03, 0.06, 0.03] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
