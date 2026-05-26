import React, { useMemo } from 'react'
import { VizPanelBase } from './VizPanelBase'
import type { DiffData } from '../../../types'

interface DiffPanelProps {
  data: DiffData
  onClose: () => void
}

type LineType = 'added' | 'removed' | 'equal'

interface DiffLine {
  text: string
  type: LineType
  lineNo?: number
}

// LCS-based line diff (O(m*n) — appropriate for code files)
function computeDiff(before: string, after: string): DiffLine[] {
  const aLines = before.split('\n')
  const bLines = after.split('\n')
  const m = aLines.length
  const n = bLines.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = aLines[i - 1] === bLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      result.unshift({ text: aLines[i - 1], type: 'equal' })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ text: bLines[j - 1], type: 'added' })
      j--
    } else {
      result.unshift({ text: aLines[i - 1], type: 'removed' })
      i--
    }
  }
  return result
}

const LINE_STYLES: Record<LineType, { bg: string; sigil: string; textColor: string }> = {
  added:   { bg: 'rgba(52,211,153,0.08)',  sigil: '+', textColor: 'rgba(134,239,172,0.9)' },
  removed: { bg: 'rgba(239,68,68,0.08)',   sigil: '-', textColor: 'rgba(252,165,165,0.9)' },
  equal:   { bg: 'transparent',            sigil: ' ', textColor: 'rgba(203,213,225,0.55)' },
}

export const DiffPanel: React.FC<DiffPanelProps> = ({ data, onClose }) => {
  const lines = useMemo(() => computeDiff(data.before, data.after), [data.before, data.after])

  const added   = lines.filter(l => l.type === 'added').length
  const removed = lines.filter(l => l.type === 'removed').length
  const badge   = `+${added} −${removed}`

  const footer = (
    <div className="flex items-center gap-4">
      <span className="text-[8px] font-mono text-emerald-400/50">+{added} added</span>
      <span className="text-[8px] font-mono text-red-400/50">−{removed} removed</span>
    </div>
  )

  return (
    <VizPanelBase
      title={data.title} accent="#f97316" accentRgb="249,115,22"
      badge={badge} onClose={onClose}
      initialLeft={64} initialTop={400} width={600} maxHeight="70vh"
      footer={footer}
    >
      <div className="font-mono text-[10px] overflow-x-auto">
        {lines.map((line, i) => {
          const s = LINE_STYLES[line.type]
          return (
            <div
              key={i}
              className="flex items-start min-w-0 px-2 py-[1px] leading-relaxed"
              style={{ background: s.bg }}
            >
              <span className="shrink-0 w-4 select-none opacity-60" style={{ color: s.textColor }}>
                {s.sigil}
              </span>
              <span
                className="whitespace-pre min-w-0 break-all"
                style={{ color: s.textColor }}
              >
                {line.text || ' '}
              </span>
            </div>
          )
        })}
      </div>
    </VizPanelBase>
  )
}
