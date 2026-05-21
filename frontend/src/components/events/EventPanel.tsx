import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'
import { useChatStore } from '../../store/chatStore'
import type { AgentEvent, EventType } from '../../types'
import { formatDistanceToNow } from 'date-fns'
import {
  Brain, Wrench, CheckCircle, AlertCircle,
  FileInput, ChevronRight, Zap, Activity
} from 'lucide-react'
import { LoadingDots } from '../shared/LoadingDots'

interface EventPanelProps {
  conversationId: string | null
}

const EVENT_CONFIG: Record<EventType, { label: string; color: string; icon: React.ElementType }> = {
  THINKING:        { label: 'Thinking',  color: 'text-yellow-300',  icon: Brain },
  TOOL_CALL:       { label: 'Tool call', color: 'text-blue-300',    icon: Wrench },
  TOOL_RESULT:     { label: 'Result',    color: 'text-emerald-300', icon: CheckCircle },
  TOOL_ERROR:      { label: 'Error',     color: 'text-red-300',     icon: AlertCircle },
  FORM_REQUEST:    { label: 'Form',      color: 'text-purple-300',  icon: FileInput },
  FORM_RESOLVED:   { label: 'Form OK',   color: 'text-emerald-300', icon: CheckCircle },
  FORM_SUBMITTED:  { label: 'Submitted', color: 'text-emerald-300', icon: CheckCircle },
  TOKEN:           { label: 'Token',     color: 'text-gray-500',    icon: ChevronRight },
  STREAM_RESET:    { label: 'Reset',     color: 'text-gray-500',    icon: ChevronRight },
  RESPONSE_START:  { label: 'Start',     color: 'text-violet-300',  icon: Zap },
  RESPONSE_END:    { label: 'End',       color: 'text-violet-300',  icon: Zap },
  AGENT_START:     { label: 'Agent',     color: 'text-cyan-300',    icon: Zap },
  AGENT_END:       { label: 'Done',      color: 'text-cyan-300',    icon: CheckCircle },
  ERROR:           { label: 'Error',     color: 'text-red-300',     icon: AlertCircle },
  ITERATION_START: { label: 'Iter',      color: 'text-orange-300',  icon: ChevronRight },
  ITERATION_END:   { label: 'Iter',      color: 'text-orange-300',  icon: CheckCircle },
}

function EventItem({ event }: { event: AgentEvent }) {
  if (event.type === 'TOKEN') return null
  const config = EVENT_CONFIG[event.type] ?? { label: event.type, color: 'text-gray-400', icon: ChevronRight }
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="flex gap-2 py-2 border-b border-gray-800/60 last:border-0"
    >
      <Icon size={12} className={clsx('mt-0.5 shrink-0', config.color)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={clsx('text-xs font-mono font-semibold', config.color)}>
            {config.label}
          </span>
          <span className="text-[10px] text-gray-600 font-mono">
            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
          </span>
        </div>
        {event.content && event.type !== 'RESPONSE_START' && event.type !== 'RESPONSE_END' && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 break-words" title={event.content}>
            {event.content}
          </p>
        )}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {Object.entries(event.metadata).slice(0, 3).map(([k, v]) => (
              <span key={k} className="badge bg-gray-800/80 text-gray-400 border border-gray-700">
                {k}: {String(v).slice(0, 24)}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function EventPanel({ conversationId }: EventPanelProps) {
  const events = useChatStore(s => conversationId ? (s.events[conversationId] ?? []) : [])
  const isThinking = useChatStore(s => conversationId ? s.isThinking[conversationId] : false)

  const visibleEvents = events.filter(e => e.type !== 'TOKEN')

  return (
    <aside className="w-80 bg-gray-900/60 backdrop-blur-sm border-l border-gray-800 flex flex-col h-screen shrink-0">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-300">
          <Activity size={14} className="text-violet-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider">
            Activity
          </span>
        </div>
        {isThinking && (
          <div className="flex items-center gap-1.5 text-yellow-300">
            <LoadingDots color="bg-yellow-300" size={4} />
            <span className="text-[11px] font-mono">running</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {visibleEvents.length === 0 ? (
          <p className="text-xs text-gray-600 font-mono text-center py-10">
            No events yet.<br />Send a message to start.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {[...visibleEvents].reverse().map(event => (
              <EventItem key={event.id} event={event} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
        <span className="text-[11px] font-mono text-gray-600">
          {visibleEvents.length} event{visibleEvents.length === 1 ? '' : 's'}
        </span>
      </div>
    </aside>
  )
}
