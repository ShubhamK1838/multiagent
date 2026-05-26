import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../../types';

interface HudMessageFeedProps {
  messages: Message[];
  streamContent: string;
  thinking: boolean;
}

const MAX_VISIBLE = 30;

// ── Shared glass bubble container ────────────────────────────────────────────
interface GlassBubbleProps {
  children: React.ReactNode;
  variant: 'ai' | 'user';
  isLatest?: boolean;
  isStreaming?: boolean;
}

const GlassBubble: React.FC<GlassBubbleProps> = ({ children, variant, isLatest, isStreaming }) => {
  const isAI = variant === 'ai';

  return (
    <div
      className={`relative overflow-hidden rounded-sm ${isAI ? 'rounded-tl-none' : 'rounded-tr-none'}`}
      style={{
        background: isAI
          ? 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(0,30,60,0.55) 100%)'
          : 'linear-gradient(135deg, rgba(0,80,180,0.10) 0%, rgba(0,10,30,0.55) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: isAI
          ? `1px solid rgba(0,212,255,${isLatest ? '0.35' : '0.18'})`
          : '1px solid rgba(0,128,255,0.18)',
        borderLeft: isAI
          ? `3px solid rgba(0,212,255,${isLatest ? '0.95' : '0.45'})`
          : undefined,
        borderRight: !isAI
          ? '3px solid rgba(0,128,255,0.6)'
          : undefined,
        boxShadow: isLatest
          ? '0 4px 30px rgba(0,0,0,0.45), 0 0 20px rgba(0,212,255,0.10), inset 0 0 24px rgba(0,212,255,0.05)'
          : '0 4px 20px rgba(0,0,0,0.35), inset 0 0 16px rgba(0,212,255,0.03)',
      }}
    >
      {/* Scan lines — assistant only */}
      {isAI && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.7) 2px, rgba(0,212,255,0.7) 3px)',
          }}
        />
      )}

      {/* Subtle breathing glow for latest message */}
      {isLatest && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, 0.06, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          style={{ background: 'rgba(0,212,255,0.18)' }}
        />
      )}

      {/* Corner HUD brackets */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-jarvis-cyan opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-jarvis-cyan opacity-30 pointer-events-none" />

      {/* Active stream indicator */}
      {isStreaming && (
        <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
          />
        </div>
      )}

      <div className="relative px-4 py-3">
        {children}
      </div>
    </div>
  );
};

// ── Streaming cursor ──────────────────────────────────────────────────────────
const StreamCursor: React.FC = () => (
  <motion.span
    animate={{ opacity: [1, 0, 1] }}
    transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
    className="inline-block w-[5px] h-[11px] ml-0.5 align-middle rounded-sm bg-cyan-400"
    style={{ boxShadow: '0 0 6px rgba(0,212,255,0.9)' }}
  />
);

// ── Thinking dots ─────────────────────────────────────────────────────────────
const ThinkingDots: React.FC = () => (
  <GlassBubble variant="ai">
    <div className="flex items-center gap-1.5 py-0.5">
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1.1, delay, ease: 'easeInOut' }}
          className="w-1.5 h-1.5 rounded-full bg-amber-400"
          style={{ boxShadow: '0 0 5px rgba(251,191,36,0.7)' }}
        />
      ))}
    </div>
  </GlassBubble>
);

// ── Raw streaming text — no markdown parsing cost per token ──────────────────
const StreamingText: React.FC<{ content: string }> = ({ content }) => (
  <p className="text-[11px] font-mono leading-relaxed text-cyan-50/90 whitespace-pre-wrap break-words">
    {content}
    <StreamCursor />
  </p>
);

// ── Markdown renderer for completed messages ──────────────────────────────────
const HudMarkdown: React.FC<{ content: string }> = ({ content }) => (
  <div className="text-[11px] font-mono leading-relaxed text-cyan-50/90">
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 text-cyan-50/90">{children}</p>,
        ul: ({ children }) => <ul className="list-none mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-cyan-50/80">{children}</ol>,
        li: ({ children }) => (
          <li className="flex items-start gap-1.5 text-cyan-50/85">
            <span className="text-cyan-400/60 mt-0.5 shrink-0">⯈</span>
            <span>{children}</span>
          </li>
        ),
        strong: ({ children }) => (
          <strong className="text-cyan-300 font-semibold tracking-wide">{children}</strong>
        ),
        em: ({ children }) => <em className="text-cyan-200/80 not-italic">{children}</em>,
        // Suppress headings — show as bold inline text instead
        h1: ({ children }) => <strong className="text-cyan-300 font-semibold">{children} </strong>,
        h2: ({ children }) => <strong className="text-cyan-300 font-semibold">{children} </strong>,
        h3: ({ children }) => <strong className="text-cyan-200/90 font-medium">{children} </strong>,
        h4: ({ children }) => <strong className="text-cyan-200/80">{children} </strong>,
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className ?? '');
          if (match) {
            return (
              <div className="my-2 relative border border-cyan-500/20 bg-black/40 rounded-sm overflow-hidden">
                <div className="absolute top-0 right-0 px-1.5 py-0.5 text-[8px] font-mono text-cyan-400 bg-cyan-950/60 border-b border-l border-cyan-500/20">
                  {match[1].toUpperCase()}
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus as Record<string, React.CSSProperties>}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    background: 'transparent',
                    fontSize: '0.68rem',
                    padding: '1.25rem 0.6rem 0.6rem',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          }
          return (
            <code className="px-1 py-0.5 bg-cyan-950/50 text-cyan-300 border border-cyan-500/20 rounded-sm text-[0.85em]">
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-cyan-500/40 pl-2 my-1 text-cyan-200/70 italic">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a href={href} className="text-cyan-400 underline decoration-cyan-500/40 underline-offset-2 hover:text-cyan-300 transition-colors">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const HudMessageFeed: React.FC<HudMessageFeedProps> = ({
  messages,
  streamContent,
  thinking,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamContent, thinking]);

  const visible = messages.slice(-MAX_VISIBLE).filter(m => m.content?.trim());
  const hasContent = visible.length > 0 || !!streamContent || thinking;

  if (!hasContent) return null;

  return (
    <div
      className="fixed top-20 right-4 z-50 w-[370px] max-h-[65vh] flex flex-col gap-2
                 overflow-y-auto overflow-x-hidden pointer-events-auto
                 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-900/40"
    >
      {/* Fade mask — indicates scrollable history above */}
      <div className="sticky top-0 h-5 w-full pointer-events-none z-10
                      bg-gradient-to-b from-[rgba(2,11,24,0.85)] to-transparent" />

      <AnimatePresence initial={false}>
        {visible.map((msg, idx) => {
          const isLastAI =
            msg.role === 'assistant' && !streamContent && idx === visible.length - 1;

          return (
            <motion.div
              key={msg.id ?? idx}
              layout
              initial={{ opacity: 0, x: 28, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div className={msg.role === 'user' ? 'max-w-[85%]' : 'w-full'}>
                {msg.role === 'user' ? (
                  <GlassBubble variant="user">
                    <p className="text-[11px] font-mono text-blue-100/80 leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </GlassBubble>
                ) : (
                  <GlassBubble variant="ai" isLatest={isLastAI}>
                    <HudMarkdown content={msg.content} />
                  </GlassBubble>

                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Live streaming bubble — raw text, no markdown re-parsing per token */}
      {streamContent && (
        <motion.div
          key="stream"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex justify-start"
        >
          <div className="w-full">
            <GlassBubble variant="ai" isLatest isStreaming>
              <StreamingText content={streamContent} />
            </GlassBubble>
          </div>
        </motion.div>
      )}

      {/* Thinking indicator */}
      {thinking && !streamContent && (
        <motion.div
          key="thinking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ThinkingDots />
        </motion.div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
