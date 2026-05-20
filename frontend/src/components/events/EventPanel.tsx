import React from 'react'
import { clsx } from 'clsx'
import { useChatStore } from '../../store/chatStore'
import type { AgentEvent, EventType } from '../../types'
import { formatDistanceToNow } from 'date-fns'
import {
  Brain, Wrench, CheckCircle, AlertCircle,
  FileInput, ChevronRight, Loader2, Zap
} from 'lucide-react'

interface EventPanelProps {
  conversationId: string | null
}

const EVENT_CONFIG: Record<EventType, { label: string; color: string; icon: React.ElementType }> = {
  THINKING: { label: 'Thinking', color: 'text-yellow-400', icon: Brain },
  TOOL_CALL: { label: 'Tool Call', color: 'text-blue-400', icon: Wrench },
  TOOL_RESULT: { label: 'Result', color: 'text-green-400', icon: CheckCircle },
  TOOL_ERROR: { label: 'Error', color: 'text-red-400', icon: AlertCircle },
  FORM_REQUEST: { label: 'Form', color: 'text-purple-400', icon: FileInput },
  FORM_RESOLVED: { label: 'Form OK', color: 'text-green-400', icon: CheckCircle },
  TOKEN: { label: 'Token', color: 'text-gray-500', icon: ChevronRight },
  RESPONSE_START: { label: 'Start', color: 'text-violet-400', icon: Zap },
  RESPONSE_END: { label: 'End', color: 'text-violet-400', icon: Zap },
  AGENT_START: { label: 'Agent', color: 'text-cyan-400', icon: Zap },
  AGENT_END: { label: 'Done', color: 'text-cyan-400', icon: CheckCircle },
  ERROR: { label: 'Error', color: 'text-red-400', icon: AlertCircle },
  ITERATION_START: { label: 'Iter', color: 'text-orange-400', icon: ChevronRight },
  ITERATION_END: { label: 'Iter', color: 'text-orange-400', icon: CheckCircle },
}

function EventItem({ event }: { event: AgentEvent }) {
  if (event.type === 'TOKEN') return null

  const config = EVENT_CONFIG[event.type] ?? { label: event.type, color: 'text-gray-400', icon: ChevronRight }
  const Icon = config.icon

  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/50 last:border-0">
      <Icon size={12} className={clsx('mt-0.5 shrink-0', config.color)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={clsx('text-xs font-mono font-semibold', config.color)}>
            {config.label}
          </span>
          <span className="text-xs text-gray-600 font-mono">
            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
          </span>
        </div>
        {event.content && event.type !== 'RESPONSE_START' && event.type !== 'RESPONSE_END' && (
          <p className="text-xs text-gray-400 font-mono mt-0.5 truncate" title={event.content}>
            {event.content.length > 120 ? event.content.slice(0, 120) + '…' : event.content}
          </p>
        )}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(event.metadata).slice(0, 3).map(([k, v]) => (
              <span key={k} className="badge bg-gray-800 text-gray-400">
                {k}: {String(v).slice(0, 20)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function EventPanel({ conversationId }: EventPanelProps) {
  const events = useChatStore(s => conversationId ? (s.events[conversationId] ?? []) : [])
  const isThinking = useChatStore(s => conversationId ? s.isThinking[conversationId] : false)

  const visibleEvents = events.filter(e => e.type !== 'TOKEN')

  return (
    <aside className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col h-screen">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
          Agent Events
        </span>
        {isThinking && (
          <div className="flex items-center gap-1.5 text-yellow-400">
            <Loader2 size={12} className="animate-spin" />
            <span className="text-xs font-mono">running</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0">
        {visibleEvents.length === 0 ? (
          <p className="text-xs text-gray-600 font-mono text-center py-8">
            No events yet.<br />Send a message to start.
          </p>
        ) : (
          [...visibleEvents].reverse().map(event => (
            <EventItem key={event.id} event={event} />
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-800">
        <span className="text-xs font-mono text-gray-600">
          {visibleEvents.length} events
        </span>
      </div>
    </aside>
  )
}
