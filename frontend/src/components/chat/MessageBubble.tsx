import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

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
  const initial = animate ? { opacity: 0, y: 8 } : false

  if (isThinking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 px-4 py-3"
      >
        <motion.div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ border: '1px solid rgba(0,212,255,0.4)' }}
          animate={{ borderColor: ['rgba(0,212,255,0.2)', 'rgba(0,212,255,0.8)', 'rgba(0,212,255,0.2)'] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: '#00d4ff' }}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
        <span className="text-xs font-mono tracking-widest" style={{ color: 'rgba(0,212,255,0.5)' }}>
          PROCESSING...
        </span>
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full"
            style={{ background: 'rgba(0,212,255,0.5)' }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        damping: 24,
        stiffness: 280,
        delay: animate ? Math.min(index * 0.04, 0.4) : 0,
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}
    >
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Label */}
        <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span
            className="text-[9px] font-mono font-bold tracking-widest uppercase"
            style={{ color: isUser ? 'rgba(0,128,255,0.6)' : 'rgba(0,212,255,0.6)' }}
          >
            {isUser ? 'USER INPUT' : 'J.A.R.V.I.S.'}
          </span>
          {streaming && (
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#00d4ff' }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}
        </div>

        {/* Bubble */}
        <div
          className="relative px-4 py-3 text-sm font-mono leading-relaxed"
          style={{
            background: isUser ? 'rgba(0, 128, 255, 0.06)' : 'rgba(0, 212, 255, 0.04)',
            borderLeft: isUser ? 'none' : '2px solid rgba(0,212,255,0.4)',
            borderRight: isUser ? '2px solid rgba(0,128,255,0.4)' : 'none',
            color: isUser ? 'rgba(200, 230, 255, 0.9)' : 'rgba(180, 240, 255, 0.85)',
          }}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>
          ) : (
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? '')
                  const isBlock = !!match
                  if (isBlock) {
                    return (
                      <SyntaxHighlighter
                        style={oneDark as Record<string, React.CSSProperties>}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: '8px 0',
                          borderRadius: 0,
                          border: '1px solid rgba(0,212,255,0.15)',
                          background: 'rgba(2,11,24,0.9)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    )
                  }
                  return (
                    <code
                      style={{
                        background: 'rgba(0,212,255,0.08)',
                        color: '#00d4ff',
                        padding: '1px 4px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.85em',
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-none mb-2 space-y-1">{children}</ul>,
                li: ({ children }) => (
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'rgba(0,212,255,0.4)' }}>›</span>
                    <span>{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong style={{ color: '#00d4ff', fontWeight: 700 }}>{children}</strong>
                ),
                h1: ({ children }) => (
                  <h1 className="text-base font-bold mb-2" style={{ color: '#00d4ff' }}>{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold mb-1.5" style={{ color: '#00d4ff' }}>{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'rgba(0,212,255,0.8)' }}>{children}</h3>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          )}
          {streaming && (
            <motion.span
              className="inline-block w-2 h-3.5 ml-0.5"
              style={{ background: '#00d4ff' }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
