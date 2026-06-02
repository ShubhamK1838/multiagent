import React from 'react'
import { VizPanelBase } from './VizPanelBase'
import type { TimelineData, TimelineEvent } from '../../../types'

interface TimelinePanelProps { data: TimelineData; onClose: () => void }

const STATUS_CONFIG = {
  done:    { color: '#34d399', glow: '52,211,153',  label: 'DONE' },
  active:  { color: '#00d4ff', glow: '0,212,255',   label: 'ACTIVE' },
  pending: { color: '#64748b', glow: '100,116,139', label: 'PENDING' },
} as const

const EventRow: React.FC<{ ev: TimelineEvent; last: boolean }> = ({ ev, last }) => {
  const cfg = STATUS_CONFIG[ev.status ?? 'pending']
  const pulsing = ev.status === 'active'
  return (
    <div className="relative flex gap-3 pl-1">
      {/* track + node */}
      <div className="relative flex flex-col items-center">
        <span
          className="w-3 h-3 rounded-full shrink-0 mt-1 z-10"
          style={{
            background: cfg.color,
            boxShadow: `0 0 8px rgba(${cfg.glow},0.8)`,
            animation: pulsing ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }}
        />
        {!last && <span className="flex-1 w-px my-1" style={{ background: `rgba(${cfg.glow},0.25)` }} />}
      </div>
      {/* content */}
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono tabular-nums px-1.5 py-0.5 rounded-sm"
                style={{ color: cfg.color, background: `rgba(${cfg.glow},0.12)` }}>
            {ev.time}
          </span>
          <span className="text-[7px] font-mono uppercase tracking-widest"
                style={{ color: `rgba(${cfg.glow},0.6)` }}>{cfg.label}</span>
        </div>
        <div className="text-[12px] font-mono text-slate-100/90 mt-1 truncate">{ev.title}</div>
        {ev.description && (
          <div className="text-[10px] font-mono text-slate-400/70 mt-0.5 leading-relaxed">{ev.description}</div>
        )}
      </div>
    </div>
  )
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({ data, onClose }) => {
  const events = Array.isArray(data.events) ? data.events.filter(e => e && e.title) : []
  return (
    <VizPanelBase
      id="viz-timeline"
      title={data.title ?? 'Timeline'} accent="#34d399" accentRgb="52,211,153"
      badge={`${events.length} events`} onClose={onClose}
      initialLeft={64} initialTop={110} width={380} maxHeight="74vh"
    >
      <div className="p-3">
        {events.map((ev, i) => (
          <EventRow key={i} ev={ev} last={i === events.length - 1} />
        ))}
      </div>
    </VizPanelBase>
  )
}
