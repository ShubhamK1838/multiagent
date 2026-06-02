import React from 'react'
import { VizPanelBase } from './VizPanelBase'
import type { AnswerCardData } from '../../../types'

interface AnswerCardPanelProps { data: AnswerCardData; onClose: () => void }

export const AnswerCardPanel: React.FC<AnswerCardPanelProps> = ({ data, onClose }) => (
  <VizPanelBase
    id="viz-answer"
    title={data.title ?? 'Answer'} accent="#00d4ff" accentRgb="0,212,255"
    badge="ANSWER" onClose={onClose}
    initialLeft={64} initialTop={110} width={440} maxHeight="78vh"
  >
    <div className="p-4 flex flex-col gap-4">
      {/* summary */}
      {data.summary && <p className="text-[13px] font-mono text-cyan-50/90 leading-relaxed">{data.summary}</p>}

      {/* highlights */}
      {data.highlights && data.highlights.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {data.highlights.map((h, i) => (
            <div key={i} className="p-2.5 rounded-sm"
                 style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <div className="text-[8px] font-mono uppercase tracking-widest text-cyan-400/50 truncate">{h.label}</div>
              <div className="text-[16px] font-mono font-semibold text-cyan-100/90 mt-0.5 tabular-nums truncate">{h.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* sections */}
      {data.sections && data.sections.map((s, i) => (
        <div key={i}>
          {s.heading && (
            <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-1.5">{s.heading}</div>
          )}
          <p className="text-[12px] font-mono text-slate-200/80 leading-relaxed whitespace-pre-wrap">{s.body}</p>
        </div>
      ))}

      {/* tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {data.tags.map((t, i) => (
            <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                  style={{ color: 'rgba(168,85,247,0.9)', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  </VizPanelBase>
)
