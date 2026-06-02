import React from 'react'
import { VizPanelBase } from './VizPanelBase'
import type { RadarData } from '../../../types'

interface RadarPanelProps { data: RadarData; onClose: () => void }

const PALETTE = ['#00d4ff', '#a855f7', '#34d399', '#fbbf24', '#f97316']

const SIZE = 300
const C = SIZE / 2
const R = 110

function axisPoint(index: number, total: number, radius: number) {
  // start at top (-90°), clockwise
  const angle = (-90 + (360 / total) * index) * (Math.PI / 180)
  return { x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle) }
}

export const RadarPanel: React.FC<RadarPanelProps> = ({ data, onClose }) => {
  const axes = Array.isArray(data.axes) ? data.axes : []
  const series = Array.isArray(data.series)
    ? data.series.filter(s => s && Array.isArray(s.values))
    : []
  const n = axes.length
  const allValues = series.flatMap(s => s.values).filter(v => typeof v === 'number')
  const max = data.max ?? Math.max(1, ...allValues)

  const rings = [0.25, 0.5, 0.75, 1]

  return (
    <VizPanelBase
      id="viz-radar"
      title={data.title ?? 'Radar'} accent="#a855f7" accentRgb="168,85,247"
      badge={`${series.length} series`} onClose={onClose}
      initialRight={400} initialTop={110} width={360} maxHeight="74vh"
    >
      {n < 3 ? (
        <div className="p-4 text-[11px] font-mono text-violet-300/60">
          Radar needs at least 3 axes to render.
        </div>
      ) : (
      <div className="flex flex-col items-center p-3">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* grid rings */}
          {rings.map((rf, ri) => (
            <polygon
              key={ri}
              points={axes.map((_, i) => {
                const p = axisPoint(i, n, R * rf)
                return `${p.x},${p.y}`
              }).join(' ')}
              fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1}
            />
          ))}
          {/* spokes + labels */}
          {axes.map((label, i) => {
            const edge = axisPoint(i, n, R)
            const lbl = axisPoint(i, n, R + 18)
            return (
              <g key={i}>
                <line x1={C} y1={C} x2={edge.x} y2={edge.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="middle"
                      className="font-mono" style={{ fill: 'rgba(148,163,184,0.75)', fontSize: 8 }}>
                  {label}
                </text>
              </g>
            )
          })}
          {/* series polygons */}
          {series.map((s, si) => {
            const color = s.color ?? PALETTE[si % PALETTE.length]
            const pts = s.values.slice(0, n).map((v, i) => {
              const rf = max === 0 ? 0 : Math.max(0, Math.min(1, v / max))
              const p = axisPoint(i, n, R * rf)
              return `${p.x},${p.y}`
            }).join(' ')
            return (
              <polygon key={si} points={pts}
                       fill={color} fillOpacity={0.12}
                       stroke={color} strokeWidth={1.5}
                       style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
            )
          })}
        </svg>
        {/* legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
          {series.map((s, si) => {
            const color = s.color ?? PALETTE[si % PALETTE.length]
            return (
              <div key={si} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[9px] font-mono" style={{ color: 'rgba(148,163,184,0.8)' }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>
      )}
    </VizPanelBase>
  )
}
