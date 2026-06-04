import React, { useMemo, useState } from 'react'
import { VizPanelBase } from './viz/VizPanelBase'
import type { SwarmState, SwarmAgent, SwarmTask, SwarmAgentStatus, SwarmTaskStatus } from '../../types'

interface AgentSwarmPanelProps {
  swarm: SwarmState
  onClose: () => void
}

type Tab = 'roster' | 'messages' | 'tasks' | 'graph'

const AGENT_STATUS_COLOR: Record<SwarmAgentStatus, string> = {
  idle: '#64748b', thinking: '#a78bfa', working: '#38bdf8',
  waiting: '#fbbf24', done: '#34d399', failed: '#f87171',
}
const TASK_STATUS_COLOR: Record<SwarmTaskStatus, string> = {
  pending: '#64748b', running: '#38bdf8', done: '#34d399',
  failed: '#f87171', retrying: '#fbbf24', skipped: '#475569',
}

const ACCENT = '#22d3ee'
const ACCENT_RGB = '34,211,238'

export const AgentSwarmPanel: React.FC<AgentSwarmPanelProps> = ({ swarm, onClose }) => {
  const [tab, setTab] = useState<Tab>('roster')

  const agents = useMemo(() => Object.values(swarm.agents), [swarm.agents])
  const tasks = useMemo(() => Object.values(swarm.tasks), [swarm.tasks])
  const doneCount = tasks.filter(t => t.status === 'done').length

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'roster', label: 'Agents', count: agents.length },
    { key: 'messages', label: 'Feed', count: swarm.messages.length },
    { key: 'tasks', label: 'Tasks', count: tasks.length },
    { key: 'graph', label: 'Graph' },
  ]

  return (
    <VizPanelBase
      id="viz-swarm"
      title="Agent Swarm"
      accent={ACCENT}
      accentRgb={ACCENT_RGB}
      badge={swarm.active ? 'LIVE' : `${doneCount}/${tasks.length || 0}`}
      onClose={onClose}
      initialLeft={64}
      initialTop={110}
      width={460}
      maxHeight="80vh"
    >
      <div className="flex flex-col">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-2 pt-2 sticky top-0 z-10"
             style={{ background: 'rgba(0,8,20,0.85)', backdropFilter: 'blur(8px)' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-2.5 py-1 rounded-t-sm text-[9px] font-mono uppercase tracking-widest transition-colors"
              style={{
                color: tab === t.key ? ACCENT : 'rgba(148,163,184,0.6)',
                borderBottom: `1px solid ${tab === t.key ? ACCENT : 'transparent'}`,
              }}
            >
              {t.label}{t.count != null ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {swarm.planSummary && (
          <div className="px-3 py-1.5 text-[10px] font-mono text-cyan-200/60 border-b border-cyan-500/10">
            ◈ {swarm.planSummary}
          </div>
        )}

        <div className="p-3">
          {tab === 'roster' && <RosterView agents={agents} />}
          {tab === 'messages' && <MessagesView swarm={swarm} />}
          {tab === 'tasks' && <TasksView tasks={tasks} />}
          {tab === 'graph' && <GraphView swarm={swarm} />}
        </div>
      </div>
    </VizPanelBase>
  )
}

// ── Roster ────────────────────────────────────────────────────────────────

const RosterView: React.FC<{ agents: SwarmAgent[] }> = ({ agents }) => {
  if (agents.length === 0) return <Empty label="No agents spawned yet" />
  return (
    <div className="grid grid-cols-2 gap-2">
      {agents.map(a => {
        const color = a.color || AGENT_STATUS_COLOR[a.status]
        return (
          <div key={a.id} className="p-2.5 rounded-sm"
               style={{ background: 'rgba(34,211,238,0.04)', border: `1px solid ${color}33` }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: AGENT_STATUS_COLOR[a.status], boxShadow: `0 0 6px ${AGENT_STATUS_COLOR[a.status]}` }} />
              <span className="text-[11px] font-mono text-cyan-50/90 truncate">{a.displayName}</span>
            </div>
            <div className="text-[8px] font-mono uppercase tracking-widest mt-1" style={{ color }}>{a.status}</div>
            <div className="text-[8px] font-mono text-slate-400/60 truncate mt-0.5">⌑ {a.model}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Messages ──────────────────────────────────────────────────────────────

const MessagesView: React.FC<{ swarm: SwarmState }> = ({ swarm }) => {
  if (swarm.messages.length === 0) return <Empty label="No internal messages yet" />
  return (
    <div className="flex flex-col gap-2">
      {swarm.messages.map(m => (
        <div key={m.id} className="text-[11px] font-mono leading-relaxed">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-cyan-300/90">{m.from}</span>
            {m.to && <span className="text-slate-500">→ {m.to}</span>}
            <span className="px-1.5 py-0.5 rounded-full text-[7px] uppercase tracking-widest"
                  style={{ color: 'rgba(168,85,247,0.9)', background: 'rgba(168,85,247,0.1)' }}>{m.type}</span>
          </div>
          <div className="text-slate-200/75 whitespace-pre-wrap pl-2 border-l border-cyan-500/15">
            {truncate(m.content, 400)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tasks ─────────────────────────────────────────────────────────────────

const TasksView: React.FC<{ tasks: SwarmTask[] }> = ({ tasks }) => {
  if (tasks.length === 0) return <Empty label="No tasks planned yet" />
  return (
    <div className="flex flex-col gap-1.5">
      {tasks.map(t => {
        const color = TASK_STATUS_COLOR[t.status]
        return (
          <div key={t.id} className="p-2 rounded-sm" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}33` }}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color }}>{t.status}</span>
              {t.role && <span className="text-[8px] font-mono text-slate-500">· {t.role}</span>}
              {t.attempt > 1 && <span className="text-[8px] font-mono text-amber-400/70">×{t.attempt}</span>}
            </div>
            <div className="text-[11px] font-mono text-cyan-50/85 mt-1">{truncate(t.goal, 200)}</div>
            {t.dependsOn.length > 0 && (
              <div className="text-[8px] font-mono text-slate-500/70 mt-0.5">depends on: {t.dependsOn.join(', ')}</div>
            )}
            {t.resultSnippet && (
              <div className="text-[9px] font-mono text-slate-400/60 mt-1 italic">{truncate(t.resultSnippet, 160)}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Graph (lightweight 2-D radial layout) ────────────────────────────────────

const GraphView: React.FC<{ swarm: SwarmState }> = ({ swarm }) => {
  const agents = Object.values(swarm.agents)
  if (agents.length === 0) return <Empty label="No agents to graph yet" />

  const size = 320
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 44

  const pos: Record<string, { x: number; y: number }> = {}
  agents.forEach((a, i) => {
    const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2
    pos[a.role] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
    pos[a.id] = pos[a.role]
  })

  // Recent directed edges from the message feed (skip broadcasts and unknown ends).
  const edges = swarm.messages.slice(-24).filter(m => m.to && pos[m.from] && pos[m.to])

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {edges.map((m, i) => {
          const a = pos[m.from], b = pos[m.to as string]
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                       stroke="rgba(34,211,238,0.18)" strokeWidth={1} />
        })}
        {agents.map(a => {
          const p = pos[a.role]
          const color = a.color || AGENT_STATUS_COLOR[a.status]
          return (
            <g key={a.id}>
              <circle cx={p.x} cy={p.y} r={a.status === 'working' || a.status === 'thinking' ? 11 : 8}
                      fill={`${AGENT_STATUS_COLOR[a.status]}22`} stroke={color} strokeWidth={1.5}>
                {(a.status === 'working' || a.status === 'thinking') && (
                  <animate attributeName="r" values="8;12;8" dur="1.6s" repeatCount="indefinite" />
                )}
              </circle>
              <text x={p.x} y={p.y + 22} textAnchor="middle"
                    className="font-mono" fontSize={8} fill="rgba(186,230,253,0.7)">
                {a.displayName}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Shared ──────────────────────────────────────────────────────────────────

const Empty: React.FC<{ label: string }> = ({ label }) => (
  <div className="py-8 text-center text-[10px] font-mono uppercase tracking-widest text-cyan-400/30">{label}</div>
)

function truncate(s: string, max: number): string {
  if (!s) return ''
  return s.length <= max ? s : s.slice(0, max) + '…'
}
