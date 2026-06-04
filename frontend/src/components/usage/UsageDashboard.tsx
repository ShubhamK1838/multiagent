import { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { RefreshCw, Coins, Hash, Activity, MessageSquare } from 'lucide-react'
import { PageHeader } from '../shared/PageHeader'
import { EmptyState } from '../shared/EmptyState'
import { LoadingDots } from '../shared/LoadingDots'
import { useTokenUsage } from '../../hooks/useTokenUsage'

const COLORS = ['#00d4ff', '#a855f7', '#34d399', '#fbbf24', '#f97316', '#ef4444', '#3b82f6', '#ec4899']

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(0,6,18,0.95)',
  border: '1px solid rgba(0,212,255,0.25)',
  borderRadius: 2,
  fontSize: 11,
  fontFamily: 'monospace',
  color: '#e2e8f0',
}
const axisStyle = { fontSize: 10, fontFamily: 'monospace', fill: 'rgba(0,212,255,0.4)' }
const gridStyle = { stroke: 'rgba(0,212,255,0.08)' }

const fmtInt = (n: number) => n.toLocaleString('en-US')
const fmtCost = (n: number) => `$${(n ?? 0).toFixed(n != null && n < 1 ? 4 : 2)}`

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub?: string
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{label}</p>
        <p className="text-lg font-semibold text-gray-100 truncate">{value}</p>
        {sub && <p className="text-[10px] font-mono text-gray-600 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export function UsageDashboard() {
  const { summary, conversations, loading, error, refresh } = useTokenUsage()

  const dailyData = useMemo(
    () => (summary?.daily ?? []).map(d => ({
      name: d.day.slice(5), // MM-DD
      cost: Number(d.totalCost ?? 0),
      tokens: d.totalTokens,
    })),
    [summary],
  )

  const modelData = useMemo(
    () => (summary?.byModel ?? []).map(m => ({
      name: m.modelName || 'unknown',
      tokens: m.totalTokens,
      cost: Number(m.totalCost ?? 0),
    })),
    [summary],
  )

  const totals = summary?.totals
  const hasData = !!totals && totals.calls > 0

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Token Usage"
          subtitle={totals ? `${fmtInt(totals.totalTokens)} tokens · ${fmtCost(Number(totals.totalCost))} · ${fmtInt(totals.calls)} calls` : 'LLM consumption & estimated cost'}
          actions={
            <button onClick={refresh} className="btn-ghost flex items-center gap-2" title="Refresh">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          }
        />

        {error && (
          <div className="card p-3 mb-4 border-red-500/40 bg-red-500/10 text-red-300 text-sm">{error}</div>
        )}

        {loading && !summary ? (
          <div className="flex items-center justify-center py-16"><LoadingDots /></div>
        ) : !hasData ? (
          <EmptyState
            icon={<Coins size={22} />}
            title="No usage recorded yet"
            description="Send a few chat messages, then return here. Set per-model pricing in the AI Models panel to see cost in dollars."
          />
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={<Coins size={18} />} label="Total cost" value={fmtCost(Number(totals!.totalCost))}
                sub="estimated from pricing" />
              <StatCard icon={<Hash size={18} />} label="Total tokens" value={fmtInt(totals!.totalTokens)}
                sub={`${fmtInt(totals!.promptTokens)} in · ${fmtInt(totals!.completionTokens)} out`} />
              <StatCard icon={<Activity size={18} />} label="LLM calls" value={fmtInt(totals!.calls)} />
              <StatCard icon={<MessageSquare size={18} />} label="Models used" value={fmtInt(modelData.length)} />
            </div>

            {/* Cost over time */}
            <div className="card p-4 mb-6">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mb-3">Cost over time (30 days)</p>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="usage-cost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridStyle} />
                    <XAxis dataKey="name" tick={axisStyle} />
                    <YAxis tick={axisStyle} />
                    <Tooltip contentStyle={TOOLTIP_STYLE}
                      formatter={(v) => fmtCost(Number(v))} />
                    <Area type="monotone" dataKey="cost" stroke="#00d4ff" strokeWidth={1.5} fill="url(#usage-cost)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tokens per model */}
            <div className="card p-4 mb-6">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mb-3">Tokens per model</p>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelData}>
                    <CartesianGrid {...gridStyle} />
                    <XAxis dataKey="name" tick={axisStyle} />
                    <YAxis tick={axisStyle} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmtInt(Number(v))} />
                    <Bar dataKey="tokens" radius={[2, 2, 0, 0]}>
                      {modelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Per-conversation table */}
            <div className="card p-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mb-3">Top conversations</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-mono uppercase tracking-wider text-gray-500 border-b border-cyan-500/10">
                      <th className="text-left py-2 pr-4">Conversation</th>
                      <th className="text-right py-2 px-4">Calls</th>
                      <th className="text-right py-2 px-4">Tokens</th>
                      <th className="text-right py-2 pl-4">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.map((c, i) => (
                      <tr key={c.conversationId ?? i} className="border-b border-cyan-500/5 hover:bg-cyan-500/5">
                        <td className="py-2 pr-4 text-gray-300 truncate max-w-xs">{c.title}</td>
                        <td className="py-2 px-4 text-right font-mono text-gray-400">{fmtInt(c.calls)}</td>
                        <td className="py-2 px-4 text-right font-mono text-gray-400">{fmtInt(c.totalTokens)}</td>
                        <td className="py-2 pl-4 text-right font-mono text-cyan-300">{fmtCost(Number(c.totalCost))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
