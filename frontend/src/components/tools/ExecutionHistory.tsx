import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { toolApi } from '../../services/api'
import type { ToolExecution } from '../../types'
import { formatDistanceToNow } from 'date-fns'

interface ExecutionHistoryProps {
  toolName?: string
}

export function ExecutionHistory({ toolName }: ExecutionHistoryProps) {
  const [executions, setExecutions] = useState<ToolExecution[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = toolName
        ? await toolApi.getToolExecutions(toolName)
        : await toolApi.listExecutions()
      setExecutions(data)
    } catch {
      // silently fail — execution history is non-critical
    } finally {
      setLoading(false)
    }
  }, [toolName])

  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase"
          style={{ color: 'rgba(0,212,255,0.5)' }}
        >
          {toolName ? `${toolName} · executions` : 'RECENT EXECUTIONS'}
        </span>
        <button
          onClick={load}
          className="p-1.5 transition-colors"
          style={{ color: 'rgba(0,212,255,0.4)' }}
          title="Refresh"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {executions.length === 0 && !loading ? (
        <p className="text-[10px] font-mono text-center py-6 tracking-wider"
          style={{ color: 'rgba(0,212,255,0.2)' }}
        >
          NO EXECUTIONS RECORDED
        </p>
      ) : (
        <AnimatePresence initial={false}>
          {executions.map(ex => (
            <ExecutionRow
              key={ex.id}
              execution={ex}
              expanded={expanded === ex.id}
              onToggle={() => setExpanded(expanded === ex.id ? null : ex.id)}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}

function ExecutionRow({ execution: ex, expanded, onToggle }: {
  execution: ToolExecution
  expanded: boolean
  onToggle: () => void
}) {
  const Icon = ex.success ? CheckCircle : XCircle
  const iconColor = ex.success ? '#00ff88' : '#ff4444'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-2 transition-colors"
        style={{
          background: expanded ? 'rgba(0,212,255,0.04)' : 'transparent',
          border: '1px solid rgba(0,212,255,0.08)',
          borderBottom: expanded ? 'none' : '1px solid rgba(0,212,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <Icon size={11} style={{ color: iconColor, flexShrink: 0 }} />
          <span className="font-mono text-[11px] flex-1 truncate"
            style={{ color: 'rgba(0,212,255,0.7)' }}
          >
            {ex.toolName}
          </span>
          {ex.durationMs != null && (
            <span className="flex items-center gap-1 text-[9px] font-mono"
              style={{ color: 'rgba(0,212,255,0.3)' }}
            >
              <Clock size={8} />
              {ex.durationMs}ms
            </span>
          )}
          <span className="text-[9px] font-mono" style={{ color: 'rgba(0,212,255,0.25)' }}>
            {formatDistanceToNow(new Date(ex.executedAt), { addSuffix: true })}
          </span>
          {expanded ? <ChevronDown size={10} style={{ color: 'rgba(0,212,255,0.4)' }} />
                    : <ChevronRight size={10} style={{ color: 'rgba(0,212,255,0.3)' }} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
            style={{ border: '1px solid rgba(0,212,255,0.08)', borderTop: 'none' }}
          >
            <div className="px-3 py-2 space-y-2">
              {/* Input args */}
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-1"
                  style={{ color: 'rgba(0,212,255,0.35)' }}
                >INPUT</p>
                <pre className="text-[10px] font-mono overflow-x-auto"
                  style={{ color: 'rgba(0,212,255,0.5)' }}
                >
                  {JSON.stringify(ex.inputArgs, null, 2)}
                </pre>
              </div>
              {/* Result or Error */}
              {ex.success && ex.resultText && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest mb-1"
                    style={{ color: 'rgba(0,255,136,0.4)' }}
                  >RESULT</p>
                  <pre className="text-[10px] font-mono overflow-x-auto max-h-24"
                    style={{ color: 'rgba(0,255,136,0.7)' }}
                  >
                    {ex.resultText.slice(0, 500)}{ex.resultText.length > 500 ? '...' : ''}
                  </pre>
                </div>
              )}
              {!ex.success && ex.errorMessage && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest mb-1"
                    style={{ color: 'rgba(255,68,68,0.5)' }}
                  >ERROR</p>
                  <pre className="text-[10px] font-mono"
                    style={{ color: '#ff4444' }}
                  >
                    {ex.errorMessage}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
