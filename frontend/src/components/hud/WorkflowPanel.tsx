import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkflows } from '../../hooks/useWorkflows'
import { useChatStore } from '../../store/chatStore'
import { useGestureDraggable } from '../../hooks/useGestureDraggable'

interface WorkflowPanelProps {
  onClose: () => void
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ onClose }) => {
  const { ref, x, y } = useGestureDraggable('viz-workflows');
  const { workflows, loading, error, refresh, runWorkflow, deleteWorkflow } = useWorkflows()
  const conversationId = useChatStore(s => s.activeConversationId)
  const [runningName, setRunningName] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleRun = async (name: string) => {
    setRunningName(name)
    try {
      await runWorkflow(name, conversationId ?? undefined)
    } finally {
      setRunningName(null)
    }
  }

  const handleDelete = async (name: string) => {
    if (confirmDelete !== name) { setConfirmDelete(name); return }
    setDeletingName(name)
    try {
      await deleteWorkflow(name)
      setConfirmDelete(null)
    } finally {
      setDeletingName(null)
    }
  }

  return (
    <motion.div
      ref={ref}
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        position: 'fixed',
        right: 20,
        top: 110,
        x,
        y,
        zIndex: 60,
        width: 380,
        maxHeight: '75vh',
        background: 'linear-gradient(150deg, rgba(0,6,18,0.97) 0%, rgba(0,12,5,0.95) 100%)',
        border: '1px solid rgba(52,211,153,0.22)',
        boxShadow: '0 16px 60px rgba(0,0,0,0.7), 0 0 40px rgba(52,211,153,0.04)',
        backdropFilter: 'blur(20px)',
      }}
      className="flex flex-col rounded-sm overflow-hidden pointer-events-auto"
    >
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(52,211,153,1) 2px,rgba(52,211,153,1) 3px)' }} />

      {/* Corner brackets */}
      {[['top-0 left-0','border-t border-l'],['top-0 right-0','border-t border-r'],
        ['bottom-0 left-0','border-b border-l'],['bottom-0 right-0','border-b border-r']
      ].map(([pos, b]) => (
        <div key={pos} className={`absolute ${pos} w-3 h-3 ${b} border-emerald-400/30 pointer-events-none`} />
      ))}

      {/* Header */}
      <div className="relative flex items-center gap-2 px-3 py-2 shrink-0 cursor-grab active:cursor-grabbing"
        style={{ borderBottom: '1px solid rgba(52,211,153,0.12)' }}>
        <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
          animate={{ opacity: [0.5,1,0.5] }} transition={{ repeat: Infinity, duration: 2.5 }}
          style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
        <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-emerald-400/80 flex-1 truncate">
          Saved Workflows
        </span>
        <span className="text-[8px] font-mono text-emerald-400/35">{workflows.length} wf</span>
        <button onClick={refresh} onPointerDown={e => e.stopPropagation()}
          className="shrink-0 px-1.5 py-0.5 text-[8px] font-mono text-emerald-400/40 hover:text-emerald-300/70 transition-colors">↻</button>
        <button onClick={onClose} onPointerDown={e => e.stopPropagation()}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded-sm text-emerald-500/35 hover:text-red-400/90 hover:bg-red-400/10 transition-colors text-[9px] font-mono">✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto py-1.5 px-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-emerald-900/40"
        onPointerDown={e => e.stopPropagation()}>
        {loading ? (
          <p className="text-[10px] font-mono text-emerald-400/35 px-1 py-4 text-center">Loading...</p>
        ) : error ? (
          <p className="text-[10px] font-mono text-red-400/60 px-1 py-4">{error}</p>
        ) : workflows.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[10px] font-mono text-emerald-400/30">No workflows saved yet.</p>
            <p className="text-[9px] font-mono text-emerald-400/20 mt-1">Ask the AI to save a workflow after a multi-step task.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {workflows.map(({ workflow, steps }) => (
              <motion.div
                key={workflow.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="mb-2 rounded-sm border border-emerald-500/15 bg-emerald-950/20 p-2.5"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-emerald-100/90 font-medium truncate">{workflow.name}</p>
                    {workflow.description && (
                      <p className="text-[10px] font-mono text-emerald-400/50 truncate mt-0.5">{workflow.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[8px] font-mono text-emerald-400/30">{steps.length} steps</span>
                      <span className="text-[8px] font-mono text-emerald-400/30">↺ {workflow.runCount}×</span>
                      {workflow.lastRunAt && (
                        <span className="text-[8px] font-mono text-emerald-400/25">
                          {new Date(workflow.lastRunAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRun(workflow.name)}
                      disabled={runningName === workflow.name}
                      className="px-2 py-1 text-[9px] font-mono rounded-sm border border-emerald-500/30 text-emerald-300/80 hover:bg-emerald-500/15 hover:border-emerald-400/50 transition-colors disabled:opacity-40"
                    >
                      {runningName === workflow.name ? '...' : '▶ RUN'}
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.name)}
                      disabled={deletingName === workflow.name}
                      className={`px-2 py-1 text-[9px] font-mono rounded-sm border transition-colors disabled:opacity-40 ${
                        confirmDelete === workflow.name
                          ? 'border-red-400/50 text-red-300/80 bg-red-500/10'
                          : 'border-red-500/20 text-red-400/50 hover:border-red-400/40 hover:text-red-300/70'
                      }`}
                    >
                      {confirmDelete === workflow.name ? 'CONFIRM' : '✕'}
                    </button>
                    {confirmDelete === workflow.name && (
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-1.5 py-1 text-[9px] font-mono text-emerald-400/40 hover:text-emerald-300/70 transition-colors"
                      >✕</button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 shrink-0 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(52,211,153,0.08)' }}>
        <span className="text-[8px] font-mono text-emerald-400/25 uppercase tracking-widest">
          ask AI to save workflow
        </span>
      </div>
    </motion.div>
  )
}
