import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { clsx } from 'clsx'
import { Bot, User } from 'lucide-react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  animate?: boolean
}

export function MessageBubble({ role, content, streaming, animate = true }: MessageBubbleProps) {
  const isUser = role === 'user'
  const initial = animate ? { opacity: 0, y: 8, scale: 0.98 } : false
  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      className={clsx('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div className={clsx(
        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
        isUser
          ? 'bg-violet-600 text-white'
          : 'bg-gray-700 text-violet-300'
      )}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className={clsx(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
        isUser
          ? 'bg-violet-600/15 border border-violet-500/30 text-gray-100 rounded-tr-md'
          : 'bg-gray-800/70 border border-gray-700 text-gray-100 rounded-tl-md'
      )}>
        {role === 'assistant' ? (
          <ReactMarkdown
            className="prose prose-invert prose-sm max-w-none"
            components={{
              code({ className, children }) {
                const match = /language-(\w+)/.exec(className || '')
                const isBlock = className?.includes('language-')
                return isBlock ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus as Record<string, React.CSSProperties>}
                    language={match?.[1] ?? 'text'}
                    PreTag="div"
                    className="rounded-lg !mt-2 !mb-2 text-xs"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-700/70 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-300">
                    {children}
                  </code>
                )
              },
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        )}
        {streaming && (
          <motion.span
            className="inline-block w-1.5 h-4 bg-violet-400 ml-0.5 align-middle"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    </motion.div>
  )
}
