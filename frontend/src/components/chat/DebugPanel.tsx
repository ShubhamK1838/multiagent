import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import {
  Brain, Wrench, CheckCircle, AlertCircle, ChevronDown, Bug, Copy, Check
} from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import type { AgentEvent, EventType } from '../../types'

interface DebugPanelProps {
  conversationId: string
}

const RELEVANT: EventType[] = ['THINKING', 'TOOL_CALL', 'TOOL_RESULT', 'TOOL_ERROR', 'ERROR']

const STYLE: Record<string, { label: string; icon: typeof Brain; color: string; bg: string }> = {
  THINKING:    { label: 'Reasoning',  icon: Brain,       color: 'text-yellow-300',  bg: 'bg-yellow-500/10 border-yellow-500/30' },
  TOOL_CALL:   { label: 'Tool call',  icon: Wrench,      color: 'text-blue-300',    bg: 'bg-blue-500/10 border-blue-500/30' },
  TOOL_RESULT: { label: 'Result',     icon: CheckCircle, color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  TOOL_ERROR:  { label: 'Tool error', icon: AlertCircle, color: 'text-red-300',     bg: 'bg-red-500/10 border-red-500/30' },
  ERROR:       { label: 'Error',      icon: AlertCircle, color: 'text-red-300',     bg: 'bg-red-500/10 border-red-500/30' },
}

export function DebugPanel({ conversationId }: DebugPanelProps) {
  const allEvents = useChatStore(s => s.events[conversationId] ?? [])
  const [open, setOpen] = useState(false)

  const events = useMemo(
    () => allEvents.filter(e => RELEVANT.includes(e.type)),
    [allEvents]
  )

  return (
    <div className="shrink-0 border-t border-gray-800 bg-gray-950/60 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between gap-2 text-left group py-1"
        >
          <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-400 group-hover:text-gray-200">
            <Bug size={12} className="text-violet-400" />
            Debug
            <span className="text-gray-600 normal-case lowercase">
              {events.length} entr{events.length === 1 ? 'y' : 'ies'}
            </span>
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={14} className="text-gray-500" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="debug-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-gray-600 font-mono py-3 text-center">
                    No tool calls or reasoning recorded yet.
                  </p>
                ) : (
                  events.map(ev => <DebugEntry key={ev.id} event={ev} />)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function DebugEntry({ event }: { event: AgentEvent }) {
  const s = STYLE[event.type] ?? STYLE.THINKING
  const Icon = s.icon
  const [copied, setCopied] = useState(false)

  const body = useMemo(() => formatBody(event), [event])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* ignore */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={clsx('rounded-lg border px-3 py-2 text-xs', s.bg)}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={clsx('flex items-center gap-1.5 font-mono font-semibold', s.color)}>
          <Icon size={11} />
          {s.label}
          {event.metadata?.toolName ? (
            <span className="text-gray-400 ml-1 normal-case lowercase">
              · {String(event.metadata.toolName)}
            </span>
          ) : null}
        </span>
        <button
          onClick={copy}
          className="text-gray-500 hover:text-gray-300 transition-colors p-0.5"
          title="Copy"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>
      <pre className="font-mono text-[11px] text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
{body}
      </pre>
    </motion.div>
  )
}

function formatBody(event: AgentEvent): string {
  const parts: string[] = []
  if (event.content) parts.push(event.content)
  if (event.metadata && Object.keys(event.metadata).length > 0) {
    try {
      parts.push(JSON.stringify(event.metadata, null, 2))
    } catch {
      parts.push(String(event.metadata))
    }
  }
  return parts.join('\n') || '(empty)'
}
