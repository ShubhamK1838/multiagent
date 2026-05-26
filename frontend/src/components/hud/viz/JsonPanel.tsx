import React, { useState } from 'react'
import { VizPanelBase } from './VizPanelBase'
import type { JsonData } from '../../../types'

interface JsonPanelProps {
  data: JsonData
  onClose: () => void
}

// ── Recursive JSON tree node ───────────────────────────────────────────────

interface JsonNodeProps {
  value: unknown
  depth: number
  keyName?: string
}

const JsonNode: React.FC<JsonNodeProps> = ({ value, depth, keyName }) => {
  const [collapsed, setCollapsed] = useState(depth >= 2)

  const keyLabel = keyName !== undefined
    ? <span className="text-amber-300/70 mr-1">"{keyName}":</span>
    : null

  if (value === null) {
    return (
      <div className="flex items-center">
        {keyLabel}
        <span className="text-red-400/60 font-mono text-[10px]">null</span>
      </div>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center">
        {keyLabel}
        <span className={`font-mono text-[10px] ${value ? 'text-emerald-400/80' : 'text-red-400/70'}`}>
          {String(value)}
        </span>
      </div>
    )
  }

  if (typeof value === 'number') {
    return (
      <div className="flex items-center">
        {keyLabel}
        <span className="text-blue-300/80 font-mono text-[10px] tabular-nums">{value}</span>
      </div>
    )
  }

  if (typeof value === 'string') {
    return (
      <div className="flex items-start min-w-0">
        {keyLabel}
        <span className="text-emerald-300/70 font-mono text-[10px] break-all">"{value}"</span>
      </div>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className="flex items-center">
          {keyLabel}
          <span className="text-cyan-400/40 font-mono text-[10px]">[]</span>
        </div>
      )
    }
    return (
      <div>
        <div className="flex items-center">
          {keyLabel}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-cyan-400/60 hover:text-cyan-300 font-mono text-[10px] transition-colors flex items-center gap-1"
          >
            <span className="text-[7px]">{collapsed ? '▶' : '▼'}</span>
            <span className="text-cyan-400/40">[ {value.length} ]</span>
          </button>
        </div>
        {!collapsed && (
          <div className="ml-4 border-l border-cyan-400/10 pl-2">
            {value.map((item, i) => (
              <JsonNode key={i} value={item} depth={depth + 1} keyName={String(i)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as object)
    if (keys.length === 0) {
      return (
        <div className="flex items-center">
          {keyLabel}
          <span className="text-amber-400/40 font-mono text-[10px]">{'{}'}</span>
        </div>
      )
    }
    return (
      <div>
        <div className="flex items-center">
          {keyLabel}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-amber-400/60 hover:text-amber-300 font-mono text-[10px] transition-colors flex items-center gap-1"
          >
            <span className="text-[7px]">{collapsed ? '▶' : '▼'}</span>
            <span className="text-amber-400/40">{'{ '}{keys.length}{'}'}</span>
          </button>
        </div>
        {!collapsed && (
          <div className="ml-4 border-l border-amber-400/10 pl-2">
            {keys.map(k => (
              <JsonNode
                key={k}
                value={(value as Record<string, unknown>)[k]}
                depth={depth + 1}
                keyName={k}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {keyLabel}
      <span className="text-cyan-100/50 font-mono text-[10px]">{String(value)}</span>
    </div>
  )
}

// ── Panel ──────────────────────────────────────────────────────────────────

export const JsonPanel: React.FC<JsonPanelProps> = ({ data, onClose }) => {
  const keyCount = data.data !== null && typeof data.data === 'object' && !Array.isArray(data.data)
    ? Object.keys(data.data as object).length
    : Array.isArray(data.data)
      ? (data.data as unknown[]).length
      : null

  const badge = keyCount !== null ? `${keyCount} keys` : undefined

  const footer = (
    <span className="text-[8px] font-mono text-amber-400/25 uppercase tracking-widest">
      click to expand / collapse
    </span>
  )

  return (
    <VizPanelBase
      id="viz-json"
      title={data.title} accent="#fbbf24" accentRgb="251,191,36"
      badge={badge} onClose={onClose}
      initialLeft={500} initialTop={110} width={400} maxHeight="72vh"
      footer={footer}
    >
      <div className="px-3 py-2 font-mono text-[10px]">
        <JsonNode value={data.data} depth={0} />
      </div>
    </VizPanelBase>
  )
}
