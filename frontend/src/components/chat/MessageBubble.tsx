import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { clsx } from 'clsx'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export function MessageBubble({ role, content, streaming }: MessageBubbleProps) {
  return (
    <div className={clsx('flex gap-3 mb-4', role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
      <div className={clsx(
        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0',
        role === 'user' ? 'bg-violet-600 text-white' : 'bg-gray-700 text-green-400'
      )}>
        {role === 'user' ? 'U' : 'AI'}
      </div>

      <div className={clsx(
        'max-w-[80%] rounded-xl px-4 py-3 text-sm',
        role === 'user'
          ? 'bg-violet-600/20 border border-violet-500/30 text-gray-100'
          : 'bg-gray-800 border border-gray-700 text-gray-100'
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
                  <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono text-green-400">
                    {children}
                  </code>
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
        {streaming && (
          <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  )
}
