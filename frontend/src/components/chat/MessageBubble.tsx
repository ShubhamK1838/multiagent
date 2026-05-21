import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { clsx } from 'clsx'
import { Bot, BrainCircuit, ChevronRight } from 'lucide-react'

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
  const initial = animate ? { opacity: 0, y: 8, scale: 0.98 } : false

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 24,
        stiffness: 320,
        delay: animate ? Math.min(index * 0.04, 0.4) : 0,
      }}
      className={clsx('flex gap-3 mb-4 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <Avatar role={role} streaming={streaming} />

      <div className={clsx(
        'max-w-[82%] text-sm relative',
        'rounded-2xl px-4 py-3 transition-shadow duration-200',
        isUser  && 'bg-gradient-to-br from-violet-600/20 to-violet-700/10 border border-violet-500/40 text-gray-50 rounded-tr-md shadow-lg shadow-violet-600/5 group-hover:shadow-violet-500/15',
        isThinking && 'bg-gray-900/40 border border-dashed border-gray-700 text-gray-400 rounded-tl-md italic',
        !isUser && !isThinking && 'bg-gray-900/80 border border-gray-700 text-gray-100 rounded-tl-md shadow-lg shadow-black/30 group-hover:border-gray-600',
      )}>
        {/* Subtle corner accent for techie feel */}
        {!isThinking && (
          <span className={clsx(
            'absolute w-2 h-2 border-violet-400/50',
            isUser
              ? 'top-1 right-1 border-t-2 border-r-2 rounded-tr-sm'
              : 'top-1 left-1 border-t-2 border-l-2 rounded-tl-sm'
          )} />
        )}

        {isThinking && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">
            <BrainCircuit size={11} />
            reasoning
          </div>
        )}

        {(role === 'assistant' || role === 'thinking') ? (
          <ReactMarkdown
            className={clsx(
              'prose prose-sm max-w-none prose-invert prose-p:my-2 prose-pre:my-2',
              isThinking ? 'text-gray-400' : 'text-gray-100'
            )}
            components={{
              code({ className, children }) {
                const match = /language-(\w+)/.exec(className || '')
                const isBlock = className?.includes('language-')
                return isBlock ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus as Record<string, React.CSSProperties>}
                    language={match?.[1] ?? 'text'}
                    PreTag="div"
                    className="rounded-lg !mt-2 !mb-2 text-xs border border-gray-800"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-800/80 border border-gray-700 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-300">
                    {children}
                  </code>
                )
              },
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>
        )}

        {streaming && (
          <motion.span
            className="inline-block w-[3px] h-4 bg-violet-400 ml-0.5 align-middle rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"
            animate={{ opacity: [1, 0.1, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    </motion.div>
  )
}

interface AvatarProps {
  role: MessageBubbleProps['role']
  streaming?: boolean
}

function Avatar({ role, streaming }: AvatarProps) {
  if (role === 'user') {
    return (
      <motion.div
        whileHover={{ scale: 1.06 }}
        transition={{ type: 'spring', damping: 18, stiffness: 380 }}
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-500 to-violet-700 text-white font-mono text-[10px] font-bold shadow-md shadow-violet-600/30"
      >
        YOU
      </motion.div>
    )
  }
  if (role === 'thinking') {
    return (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gray-900 text-gray-500 border border-gray-800">
        <ChevronRight size={14} />
      </div>
    )
  }
  return (
    <motion.div
      animate={streaming ? {
        boxShadow: [
          '0 0 0 0 rgba(139,92,246,0)',
          '0 0 14px 1px rgba(139,92,246,0.5)',
          '0 0 0 0 rgba(139,92,246,0)',
        ],
      } : {}}
      transition={streaming ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
      whileHover={{ scale: 1.06 }}
      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-gray-700 to-gray-800 text-violet-300 border border-gray-700 shadow-md shadow-black/40"
    >
      <Bot size={14} />
    </motion.div>
  )
}
