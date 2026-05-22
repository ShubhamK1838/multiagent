import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'thinking'
  content: string
  streaming?: boolean
  animate?: boolean
  index?: number
}

export function MessageBubble({ role, content, streaming, animate = true, index = 0 }: MessageBubbleProps) {
  const isUser = role === 'user'
  const isThinking = role === 'thinking'
  const initial = animate ? { opacity: 0, y: 10, scale: 0.98 } : false

  if (isThinking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-4 px-6 py-4"
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-jarvis-cyan"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ borderTopColor: 'transparent' }}
          />
          <motion.div
            className="absolute inset-1 rounded-full border border-jarvis-blue opacity-50"
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ borderBottomColor: 'transparent' }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-jarvis-cyan glow-cyan"
            animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-mono tracking-[0.2em] text-jarvis-cyan opacity-80">
            PROCESSING
          </span>
          <div className="flex gap-1 mt-1">
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1 bg-jarvis-cyan"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300,
        delay: animate ? Math.min(index * 0.05, 0.3) : 0,
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-6 py-3 relative`}
    >
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1.5 z-10`}>
        {/* HUD Label */}
        <div className={`flex items-center gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-jarvis-cyan opacity-80 uppercase">
              {isUser ? 'AUTHORIZATION: STARK' : 'J.A.R.V.I.S. SYSTEM'}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
               <span className="text-[8px] font-mono text-jarvis-cyan opacity-50">
                  {new Date().toLocaleTimeString('en-US', { hour12: false })}
               </span>
               <div className="w-4 h-px bg-jarvis-cyan opacity-30" />
            </div>
          </div>
          {streaming && (
            <motion.div
              className="w-2 h-2 bg-jarvis-cyan glow-cyan"
              style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
              animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        {/* Message Container */}
        <div className="relative mt-1 group">
          {/* Decorative Corner Brackets (Jarvis style) */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-jarvis-cyan opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-jarvis-cyan opacity-40 group-hover:opacity-100 transition-opacity" />

          <div
            className="px-5 py-4 text-[13px] font-mono leading-relaxed relative overflow-hidden"
            style={{
              background: isUser ? 'rgba(0, 128, 255, 0.08)' : 'rgba(0, 212, 255, 0.05)',
              border: `1px solid ${isUser ? 'rgba(0,128,255,0.2)' : 'rgba(0,212,255,0.2)'}`,
              color: isUser ? '#c8e6ff' : '#b4f0ff',
              boxShadow: isUser
                ? 'inset 0 0 20px rgba(0, 128, 255, 0.05)'
                : 'inset 0 0 20px rgba(0, 212, 255, 0.05)',
            }}
          >
            {/* Scanline background for assistant messages */}
            {!isUser && <div className="absolute inset-0 scanline-overlay opacity-30 pointer-events-none" />}

            {isUser ? (
              <p className="whitespace-pre-wrap break-words leading-relaxed relative z-10">{content}</p>
            ) : (
              <div className="relative z-10">
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className ?? '')
                      const isBlock = !!match
                      if (isBlock) {
                        return (
                          <div className="my-3 relative border border-jarvis-cyan/30 bg-jarvis-bg/90 p-1">
                            {/* Code block HUD decorations */}
                            <div className="absolute top-0 right-0 px-2 py-0.5 text-[8px] font-mono text-jarvis-cyan bg-jarvis-cyan/10 border-b border-l border-jarvis-cyan/30">
                              {match[1].toUpperCase()}
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus as Record<string, React.CSSProperties>}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                background: 'transparent',
                                fontSize: '0.75rem',
                                padding: '1.5rem 0.75rem 0.75rem 0.75rem',
                              }}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        )
                      }
                      return (
                        <code
                          className="px-1.5 py-0.5 bg-jarvis-cyan/10 text-jarvis-cyan border border-jarvis-cyan/20 rounded-sm font-mono text-[0.85em]"
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    },
                    p: ({ children }) => <p className="mb-3 last:mb-0 text-jarvis-text">{children}</p>,
                    ul: ({ children }) => <ul className="list-none mb-3 space-y-1.5">{children}</ul>,
                    li: ({ children }) => (
                      <li className="flex items-start gap-2 text-jarvis-text">
                        <span className="text-jarvis-cyan opacity-60 mt-0.5">⯈</span>
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-jarvis-cyan font-bold tracking-wide">{children}</strong>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-sm font-bold mb-3 text-jarvis-cyan uppercase tracking-widest border-b border-jarvis-cyan/20 pb-1 inline-block">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-[13px] font-bold mb-2 text-jarvis-cyan tracking-wider">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs font-semibold mb-2 text-jarvis-cyan opacity-90">{children}</h3>
                    ),
                    a: ({ children, href }) => (
                      <a href={href} className="text-jarvis-blue hover:text-jarvis-cyan underline decoration-jarvis-blue/50 underline-offset-2 transition-colors">
                        {children}
                      </a>
                    )
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
            {streaming && (
              <motion.span
                className="inline-block w-1.5 h-3.5 ml-1 bg-jarvis-cyan align-middle relative z-10"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
