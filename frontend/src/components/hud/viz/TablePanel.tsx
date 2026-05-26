import React, { useState, useMemo } from 'react'
import { VizPanelBase } from './VizPanelBase'
import type { TableData } from '../../../types'

interface TablePanelProps {
  data: TableData
  onClose: () => void
}

type SortDir = 'asc' | 'desc' | null

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export const TablePanel: React.FC<TablePanelProps> = ({ data, onClose }) => {
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [filter, setFilter] = useState('')

  const handleSort = (colIdx: number) => {
    if (sortCol !== colIdx) { setSortCol(colIdx); setSortDir('asc'); return }
    if (sortDir === 'asc')  { setSortDir('desc'); return }
    setSortCol(null); setSortDir(null)
  }

  const filtered = useMemo(() => {
    const q = filter.toLowerCase()
    return q
      ? data.rows.filter(row => row.some(cell => cellText(cell).toLowerCase().includes(q)))
      : data.rows
  }, [data.rows, filter])

  const sorted = useMemo(() => {
    if (sortCol === null || sortDir === null) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : cellText(av).localeCompare(cellText(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortCol, sortDir])

  const badge = `${sorted.length}r · ${data.columns.length}c`
  const footer = (
    <span className="text-[8px] font-mono text-cyan-400/25 uppercase tracking-widest">
      click column header to sort
    </span>
  )

  return (
    <VizPanelBase
      id="viz-table"
      title={data.title} accent="#00d4ff" accentRgb="0,212,255"
      badge={badge} onClose={onClose}
      initialLeft={64} initialTop={110} width={520} maxHeight="72vh"
      footer={footer}
    >
      {/* Filter */}
      <div className="px-2 py-1.5 sticky top-0 z-10 bg-[rgba(0,6,18,0.97)]"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
        <input
          type="text" value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter rows..."
          className="w-full bg-cyan-950/30 border border-cyan-500/15 rounded-sm px-2 py-0.5
                     text-[10px] font-mono text-cyan-100/80 placeholder-cyan-700/50
                     outline-none focus:border-cyan-400/40 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
              {data.columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className="px-3 py-1.5 text-left cursor-pointer select-none whitespace-nowrap
                             text-cyan-400/60 hover:text-cyan-300/80 transition-colors"
                >
                  {col}
                  {sortCol === i && (
                    <span className="ml-1 text-cyan-400/80">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={data.columns.length} className="px-3 py-4 text-center text-cyan-400/30">
                  No rows match filter.
                </td>
              </tr>
            ) : (
              sorted.map((row, ri) => (
                <tr
                  key={ri}
                  className="hover:bg-cyan-400/5 transition-colors"
                  style={{ borderBottom: '1px solid rgba(0,212,255,0.05)' }}
                >
                  {data.columns.map((_, ci) => (
                    <td key={ci} className="px-3 py-1 text-cyan-100/70 whitespace-nowrap max-w-[200px] truncate">
                      {row[ci] === null || row[ci] === undefined
                        ? <span className="text-cyan-400/25 italic">null</span>
                        : typeof row[ci] === 'boolean'
                          ? <span className={row[ci] ? 'text-emerald-400/70' : 'text-red-400/60'}>{String(row[ci])}</span>
                          : typeof row[ci] === 'number'
                            ? <span className="text-blue-300/80 tabular-nums">{row[ci] as number}</span>
                            : typeof row[ci] === 'object'
                              ? <span className="text-amber-300/60 font-mono text-[9px]" title={JSON.stringify(row[ci], null, 2)}>{JSON.stringify(row[ci])}</span>
                              : String(row[ci])
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </VizPanelBase>
  )
}
