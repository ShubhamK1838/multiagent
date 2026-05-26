import React from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { VizPanelBase } from './VizPanelBase'
import type { ChartData } from '../../../types'

interface ChartPanelProps {
  data: ChartData
  onClose: () => void
}

const DEFAULT_COLORS = [
  '#a855f7', '#00d4ff', '#34d399', '#fbbf24',
  '#f97316', '#ef4444', '#3b82f6', '#ec4899',
]

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(0,6,18,0.95)',
  border: '1px solid rgba(168,85,247,0.25)',
  borderRadius: 2,
  fontSize: 10,
  fontFamily: 'monospace',
  color: '#e2e8f0',
}

function toRechartsData(data: ChartData): Record<string, string | number>[] {
  return data.labels.map((label, i) => {
    const row: Record<string, string | number> = { name: label }
    data.datasets.forEach(ds => { row[ds.label] = ds.data[i] ?? 0 })
    return row
  })
}

function toPieData(data: ChartData): { name: string; value: number }[] {
  const ds = data.datasets[0]
  if (!ds) return []
  return data.labels.map((label, i) => ({ name: label, value: ds.data[i] ?? 0 }))
}

const axisStyle = { fontSize: 9, fontFamily: 'monospace', fill: 'rgba(0,212,255,0.35)' }
const gridStyle = { stroke: 'rgba(0,212,255,0.08)' }

export const ChartPanel: React.FC<ChartPanelProps> = ({ data, onClose }) => {
  const badge = `${data.type.toUpperCase()} · ${data.labels.length} pts`

  const renderChart = () => {
    const color = (i: number) => data.datasets[i]?.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]

    switch (data.type) {
      case 'bar': {
        const chartData = toRechartsData(data)
        return (
          <BarChart data={chartData}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {data.datasets.length > 1 && <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />}
            {data.datasets.map((ds, i) => (
              <Bar key={ds.label} dataKey={ds.label} fill={color(i)} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        )
      }
      case 'line': {
        const chartData = toRechartsData(data)
        return (
          <LineChart data={chartData}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {data.datasets.length > 1 && <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />}
            {data.datasets.map((ds, i) => (
              <Line key={ds.label} type="monotone" dataKey={ds.label}
                stroke={color(i)} strokeWidth={1.5} dot={{ r: 2, fill: color(i) }} />
            ))}
          </LineChart>
        )
      }
      case 'area': {
        const chartData = toRechartsData(data)
        return (
          <AreaChart data={chartData}>
            <defs>
              {data.datasets.map((ds, i) => (
                <linearGradient key={ds.label} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color(i)} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color(i)} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {data.datasets.length > 1 && <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />}
            {data.datasets.map((ds, i) => (
              <Area key={ds.label} type="monotone" dataKey={ds.label}
                stroke={color(i)} strokeWidth={1.5}
                fill={`url(#grad-${i})`} />
            ))}
          </AreaChart>
        )
      }
      case 'pie': {
        const pieData = toPieData(data)
        return (
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name"
              cx="50%" cy="50%" outerRadius={110}
              label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: 'rgba(0,212,255,0.2)', strokeWidth: 0.5 }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                  stroke="rgba(0,6,18,0.8)" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        )
      }
    }
  }

  return (
    <VizPanelBase
      id="viz-chart"
      title={data.title} accent="#a855f7" accentRgb="168,85,247"
      badge={badge} onClose={onClose}
      initialLeft={Math.max(64, Math.round((window.innerWidth - 480) / 2))}
      initialTop={80} width={480} maxHeight="70vh"
    >
      <div className="px-2 py-3" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </VizPanelBase>
  )
}
