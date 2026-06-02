import React from 'react'
import { VizPanelBase } from './VizPanelBase'
import type { GaugeData, GaugeItem } from '../../../types'

interface GaugePanelProps { data: GaugeData; onClose: () => void }

const DEFAULT_COLOR = '#00d4ff'

// 270° sweep dial (-225° start → +45° end)
const START_ANGLE = -225
const SWEEP = 270

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg)
  const e = polar(cx, cy, r, endDeg)
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

const Dial: React.FC<{ item: GaugeItem }> = ({ item }) => {
  const min = item.min ?? 0
  const max = item.max ?? 100
  const color = item.color ?? DEFAULT_COLOR
  const clamped = Math.max(min, Math.min(max, item.value))
  const frac = max === min ? 0 : (clamped - min) / (max - min)
  const valueAngle = START_ANGLE + SWEEP * frac

  const size = 120
  const c = size / 2
  const r = 48

  return (
    <div className="flex flex-col items-center p-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* track */}
        <path
          d={arcPath(c, c, r, START_ANGLE, START_ANGLE + SWEEP)}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} strokeLinecap="round"
        />
        {/* value arc */}
        <path
          d={arcPath(c, c, r, START_ANGLE, valueAngle)}
          fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        <text x={c} y={c - 2} textAnchor="middle" className="font-mono"
              style={{ fill: color, fontSize: 22, fontWeight: 600 }}>
          {item.value}
        </text>
        {item.unit && (
          <text x={c} y={c + 14} textAnchor="middle" className="font-mono"
                style={{ fill: 'rgba(148,163,184,0.7)', fontSize: 9 }}>
            {item.unit}
          </text>
        )}
      </svg>
      <div className="text-[9px] font-mono uppercase tracking-widest text-center mt-1"
           style={{ color: 'rgba(148,163,184,0.7)' }}>
        {item.label}
      </div>
    </div>
  )
}

export const GaugePanel: React.FC<GaugePanelProps> = ({ data, onClose }) => {
  const gauges = Array.isArray(data.gauges) ? data.gauges.filter(g => g && typeof g.value === 'number') : []
  return (
    <VizPanelBase
      id="viz-gauge"
      title={data.title ?? 'Gauges'} accent="#00d4ff" accentRgb="0,212,255"
      badge={`${gauges.length} dials`} onClose={onClose}
      initialRight={20} initialTop={110} width={360} maxHeight="72vh"
    >
      <div className="grid grid-cols-2 gap-1 p-2">
        {gauges.map((g, i) => <Dial key={i} item={g} />)}
      </div>
    </VizPanelBase>
  )
}
