import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Terminal, XCircle } from 'lucide-react'
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
  const { convMessages, streamContent, thinking, sending, cancelling, sendMessage, cancelExecution } = useChat(conversationId)
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
        className="flex-1 flex items-center justify-center relative overflow-hidden bg-jarvis-bg"
      >
        <div className="absolute inset-0 scanline-overlay opacity-20 pointer-events-none" />

        {/* Decorative background circle */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full border border-jarvis-cyan/10 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 border border-jarvis-cyan/30 bg-jarvis-bg transform rotate-45" />
          <div className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 border border-jarvis-cyan/30 bg-jarvis-bg transform rotate-45" />
          <div className="absolute top-1/2 left-0 w-4 h-4 -translate-x-1/2 -translate-y-1/2 border border-jarvis-cyan/30 bg-jarvis-bg transform rotate-45" />
          <div className="absolute top-1/2 right-0 w-4 h-4 translate-x-1/2 -translate-y-1/2 border border-jarvis-cyan/30 bg-jarvis-bg transform rotate-45" />
        </motion.div>

        <EmptyState
          icon={
            <div className="relative">
              <Sparkles size={32} className="text-jarvis-cyan animate-pulse" />
              <motion.div
                className="absolute inset-0 border border-jarvis-cyan rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          }
          title="SYSTEM STANDBY"
          description="Awaiting mission parameters. Initialize a new session to begin."
          action={onNewChat && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-3 mt-4 mx-auto px-6 py-3 text-xs font-mono font-bold tracking-[0.2em] uppercase relative overflow-hidden group"
              style={{
                background: 'rgba(0,212,255,0.05)',
                border: '1px solid rgba(0,212,255,0.4)',
                color: '#00d4ff',
                boxShadow: 'inset 0 0 20px rgba(0,212,255,0.1), 0 0 15px rgba(0,212,255,0.2)'
              }}
            >
              <div className="absolute inset-0 bg-jarvis-cyan/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              <Terminal size={16} />
              INITIALIZE PROTOCOL
            </button>
          )}
        />
      </div>
    )
  }

  const isBusy = sending || thinking
  const canSend = input.trim().length > 0 && !isBusy
  const borderColor = inputFocused
    ? 'rgba(0,212,255,0.8)'
    : canSend
    ? 'rgba(0,212,255,0.4)'
    : 'rgba(0,212,255,0.2)'
  const glowShadow = inputFocused
    ? '0 0 20px -2px rgba(0,212,255,0.4)'
    : canSend
    ? '0 0 15px -4px rgba(0,212,255,0.3)'
    : 'none'

  return (
    <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-jarvis-bg">
      <ChatHeader conversationId={conversationId} />

      <div className="flex-1 flex flex-col min-h-0 relative">
        <MessageList messages={convMessages} streamContent={streamContent} thinking={thinking} />
      </div>

      {debugEnabled && <DebugPanel conversationId={conversationId} />}

      <div
        className="shrink-0 px-6 py-4 relative z-20"
        style={{
          background: 'rgba(2,11,24,0.98)',
          borderTop: '1px solid rgba(0,212,255,0.2)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          {/* HUD input container */}
          <div
            className="relative"
            style={{
              border: `1px solid ${borderColor}`,
              background: 'rgba(0,212,255,0.02)',
              boxShadow: glowShadow,
              transition: 'all 0.3s ease',
            }}
          >
            {/* HUD corner brackets */}
            <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-jarvis-cyan" style={{ opacity: inputFocused || canSend ? 1 : 0.5 }} />
            <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-jarvis-cyan" style={{ opacity: inputFocused || canSend ? 1 : 0.5 }} />
            <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-jarvis-cyan" style={{ opacity: inputFocused || canSend ? 1 : 0.5 }} />
            <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-jarvis-cyan" style={{ opacity: inputFocused || canSend ? 1 : 0.5 }} />

            {/* Decorative data stream text top right */}
            <div className="absolute -top-5 right-0 data-stream-text opacity-70">
              SYS.INPUT.READY // {new Date().getTime().toString().slice(-6)}
            </div>

            <div className="flex gap-3 items-end p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={isBusy ? 'AWAITING PROCESS COMPLETION...' : 'ENTER COMMAND PARAMETERS...'}
                disabled={isBusy}
                rows={1}
                className="flex-1 bg-transparent border-0 outline-none text-sm font-mono resize-none max-h-40 py-2 px-2"
                style={{
                  color: '#e0f8ff',
                  caretColor: '#00d4ff',
                  height: 'auto',
                }}
                onInput={e => {
                  const t = e.currentTarget
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 160) + 'px'
                }}
              />

              <div className="flex flex-col gap-2 shrink-0">
                {isBusy && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelExecution}
                    disabled={cancelling}
                    className="h-10 w-12 flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: 'rgba(255,68,68,0.1)',
                      border: '1px solid rgba(255,68,68,0.4)',
                      color: '#ff4444',
                      boxShadow: '0 0 10px rgba(255,68,68,0.2)',
                      cursor: cancelling ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title="Cancel Execution"
                  >
                    <XCircle size={16} className={cancelling ? 'opacity-50' : ''} />
                  </motion.button>
                )}

                <motion.button
                  whileHover={canSend ? { scale: 1.05 } : {}}
                  whileTap={canSend ? { scale: 0.95 } : {}}
                  onClick={send}
                  disabled={!canSend}
                  className="h-10 w-12 flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: canSend ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
                    border: `1px solid ${canSend ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.2)'}`,
                    color: canSend ? '#00d4ff' : 'rgba(0,212,255,0.3)',
                    boxShadow: canSend ? '0 0 15px rgba(0,212,255,0.4), inset 0 0 10px rgba(0,212,255,0.2)' : 'none',
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                  aria-label="Transmit"
                >
                  {/* Button scanline effect */}
                  {canSend && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-jarvis-cyan/20 to-transparent translate-y-[-100%] animate-[scan_2s_ease-in-out_infinite]" />}

                  <Send size={16} className="relative z-10" />

                  <AnimatePresence>
                    {sendBurst > 0 && (
                      <motion.span
                        key={sendBurst}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                        style={{ color: '#ffffff' }}
                        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        animate={{ opacity: 0, x: 30, y: -30, scale: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      >
                        <Send size={16} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-[10px] font-mono tracking-[0.1em] text-jarvis-cyan opacity-60">
              <span className="opacity-100 font-bold">ENTER</span> TO TRANSMIT
              {'  '}//{'  '}
              <span className="opacity-100 font-bold">SHIFT+ENTER</span> FOR NEWLINE
            </p>
            <div className="flex gap-4">
              <p className="text-[10px] font-mono tabular-nums text-jarvis-cyan opacity-60 tracking-wider">
                LEN: {String(input.length).padStart(4, '0')}
              </p>
              <p className="text-[10px] font-mono text-jarvis-cyan opacity-60 tracking-wider">
                {inputFocused ? 'STS: ONLINE' : 'STS: IDLE'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
