import { AnimatePresence, motion } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import type { AgentEvent, EventType } from '../../types'
import { formatDistanceToNow } from 'date-fns'

interface EventPanelProps {
  conversationId: string | null
}

const EVENT_CONFIG: Record<EventType, { label: string; color: string; dimColor: string }> = {
  THINKING:        { label: 'PROC',     color: '#ffd700',              dimColor: 'rgba(255,215,0,0.5)' },
  TOOL_CALL:       { label: 'EXEC',     color: '#0080ff',              dimColor: 'rgba(0,128,255,0.5)' },
  TOOL_RESULT:     { label: 'RESULT',   color: '#00d4ff',              dimColor: 'rgba(0,212,255,0.5)' },
  TOOL_ERROR:      { label: 'ERROR',    color: '#ff4444',              dimColor: 'rgba(255,68,68,0.5)' },
  FORM_REQUEST:    { label: 'FORM',     color: '#7b2fff',              dimColor: 'rgba(123,47,255,0.5)' },
  FORM_RESOLVED:   { label: 'RESOLVED', color: '#00ff88',             dimColor: 'rgba(0,255,136,0.5)' },
  FORM_SUBMITTED:  { label: 'SUBMIT',  color: '#00ff88',              dimColor: 'rgba(0,255,136,0.5)' },
  TOKEN:           { label: 'TOKEN',   color: 'rgba(0,212,255,0.2)',  dimColor: 'rgba(0,212,255,0.1)' },
  STREAM_RESET:    { label: 'RESET',   color: 'rgba(0,212,255,0.3)',  dimColor: 'rgba(0,212,255,0.15)' },
  RESPONSE_START:  { label: 'START',   color: '#7b2fff',              dimColor: 'rgba(123,47,255,0.5)' },
  RESPONSE_END:    { label: 'END',     color: '#7b2fff',              dimColor: 'rgba(123,47,255,0.5)' },
  AGENT_START:     { label: 'AGENT',   color: '#00d4ff',              dimColor: 'rgba(0,212,255,0.5)' },
  AGENT_END:       { label: 'DONE',    color: '#00d4ff',              dimColor: 'rgba(0,212,255,0.5)' },
  ERROR:           { label: 'ERROR',   color: '#ff4444',              dimColor: 'rgba(255,68,68,0.5)' },
  ITERATION_START:  { label: 'ITER',   color: '#ff8800',              dimColor: 'rgba(255,136,0,0.5)' },
  ITERATION_END:    { label: 'ITER',   color: '#ff8800',              dimColor: 'rgba(255,136,0,0.5)' },
  PROACTIVE_ALERT:  { label: 'ALERT',  color: '#fbbf24',              dimColor: 'rgba(251,191,36,0.5)' },
  COORDINATION_PLAN:{ label: 'PLAN',   color: '#22d3ee',              dimColor: 'rgba(34,211,238,0.5)' },
  AGENT_SPAWNED:    { label: 'SPAWN',  color: '#a78bfa',              dimColor: 'rgba(167,139,250,0.5)' },
  AGENT_STATUS:     { label: 'STATUS', color: '#38bdf8',              dimColor: 'rgba(56,189,248,0.5)' },
  AGENT_MESSAGE:    { label: 'MSG',    color: '#a78bfa',              dimColor: 'rgba(167,139,250,0.5)' },
  TASK_CREATED:     { label: 'TASK',   color: '#34d399',              dimColor: 'rgba(52,211,153,0.5)' },
  TASK_UPDATED:     { label: 'TASK',   color: '#34d399',              dimColor: 'rgba(52,211,153,0.5)' },
}

function EventItem({ event }: { event: AgentEvent }) {
  if (event.type === 'TOKEN') return null
  const config = EVENT_CONFIG[event.type] ?? {
    label: event.type,
    color: 'rgba(0,212,255,0.6)',
    dimColor: 'rgba(0,212,255,0.3)',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="py-2"
      style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}
    >
      <div className="flex items-center gap-2 mb-0.5">
        {/* Type chip */}
        <span
          className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5"
          style={{
            color: config.color,
            background: `${config.color}11`,
            border: `1px solid ${config.color}33`,
          }}
        >
          {config.label}
        </span>
        <span className="text-[9px] font-mono" style={{ color: 'rgba(0,212,255,0.25)' }}>
          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
        </span>
      </div>
      {event.content && event.type !== 'RESPONSE_START' && event.type !== 'RESPONSE_END' && (
        <p
          className="text-[10px] font-mono mt-0.5 line-clamp-2 break-words pl-0.5"
          style={{ color: 'rgba(0,212,255,0.45)' }}
          title={event.content}
        >
          {event.content}
        </p>
      )}
      {event.metadata && Object.keys(event.metadata).length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {Object.entries(event.metadata).slice(0, 3).map(([k, v]) => (
            <span
              key={k}
              className="text-[9px] font-mono px-1.5 py-0.5"
              style={{
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.1)',
                color: 'rgba(0,212,255,0.4)',
              }}
            >
              {k}: {String(v).slice(0, 24)}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export function EventPanel({ conversationId }: EventPanelProps) {
  const events = useChatStore(s => conversationId ? (s.events[conversationId] ?? []) : [])
  const isThinking = useChatStore(s => conversationId ? s.isThinking[conversationId] : false)

  const visibleEvents = events.filter(e => e.type !== 'TOKEN')

  return (
    <aside
      className="w-80 flex flex-col h-screen shrink-0"
      style={{
        background: 'rgba(3,15,28,0.9)',
        borderLeft: '1px solid rgba(0,212,255,0.1)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}
      >
        <div className="flex items-center gap-2">
          {/* Radio pulse icon */}
          <div className="relative w-3.5 h-3.5 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid rgba(0,212,255,0.4)' }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#00d4ff' }}
            />
          </div>
          <span
            className="text-[10px] font-mono font-bold tracking-widest uppercase"
            style={{ color: 'rgba(0,212,255,0.7)' }}
          >
            MISSION LOG
          </span>
        </div>
        {isThinking && (
          <div className="flex items-center gap-1.5">
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#00ff88' }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            />
            <span
              className="text-[9px] font-mono tracking-widest uppercase"
              style={{ color: '#00ff88' }}
            >
              ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {visibleEvents.length === 0 ? (
          <p
            className="text-[10px] font-mono tracking-wider text-center py-10"
            style={{ color: 'rgba(0,212,255,0.2)' }}
          >
            NO EVENTS LOGGED<br />
            <span style={{ color: 'rgba(0,212,255,0.12)' }}>AWAITING TRANSMISSION...</span>
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {[...visibleEvents].reverse().map(event => (
              <EventItem key={event.id} event={event} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 flex items-center justify-between shrink-0"
        style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}
      >
        <span
          className="text-[9px] font-mono tracking-widest uppercase"
          style={{ color: 'rgba(0,212,255,0.25)' }}
        >
          {visibleEvents.length} EVENT{visibleEvents.length === 1 ? '' : 'S'} LOGGED
        </span>
      </div>
    </aside>
  )
}
