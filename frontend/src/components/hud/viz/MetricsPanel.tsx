import React from 'react'
import { VizPanelBase } from './VizPanelBase'
import type { MetricsData, MetricItem } from '../../../types'

interface MetricsPanelProps {
  data: MetricsData
  onClose: () => void
}

const TREND_CONFIG = {
  up:   { symbol: '↑', color: 'rgba(52,211,153,0.9)' },
  down: { symbol: '↓', color: 'rgba(239,68,68,0.8)' },
  flat: { symbol: '→', color: 'rgba(148,163,184,0.6)' },
}

const MetricCard: React.FC<{ item: MetricItem }> = ({ item }) => {
  const trend = item.trend ? TREND_CONFIG[item.trend] : null

  return (
    <div
      className="p-3 rounded-sm"
      style={{
        background: 'rgba(59,130,246,0.05)',
        border: '1px solid rgba(59,130,246,0.15)',
      }}
    >
      <div className="text-[9px] font-mono text-blue-400/50 uppercase tracking-widest truncate mb-1">
        {item.label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[22px] font-mono font-semibold text-blue-100/90 tabular-nums leading-none">
          {item.value}
        </span>
        {item.unit && (
          <span className="text-[10px] font-mono text-blue-400/50">{item.unit}</span>
        )}
        {trend && (
          <span className="text-[12px] font-mono ml-auto" style={{ color: trend.color }}>
            {trend.symbol}
          </span>
        )}
      </div>
    </div>
  )
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ data, onClose }) => {
  const badge = `${data.metrics.length} metrics`

  return (
    <VizPanelBase
      id="viz-metrics"
      title={data.title} accent="#3b82f6" accentRgb="59,130,246"
      badge={badge} onClose={onClose}
      initialRight={440} initialTop={110} width={360} maxHeight="72vh"
    >
      <div className="grid grid-cols-2 gap-2 p-3">
        {data.metrics.map((item, i) => (
          <MetricCard key={i} item={item} />
        ))}
      </div>
    </VizPanelBase>
  )
}
