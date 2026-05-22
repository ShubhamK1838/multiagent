import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Edit3, Trash2, Power, History, Crosshair } from 'lucide-react'
import { toolApi } from '../../services/api'
import { ToolForm } from './ToolForm'
import { ExecutionHistory } from './ExecutionHistory'
import { PageHeader } from '../shared/PageHeader'
import { EmptyState } from '../shared/EmptyState'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import type { ToolDefinition } from '../../types'

const EMPTY_TOOL: Partial<ToolDefinition> = {
  name: '',
  description: '',
  toolType: 'HTTP',
  parametersSchema: { type: 'object', properties: {}, required: [] },
  handlerConfig: {},
  enabled: true,
  requiresConfirmation: false,
}

type View = 'arsenal' | 'execlog'

export function ToolManager() {
  const [tools, setTools] = useState<ToolDefinition[]>([])
  const [editing, setEditing] = useState<Partial<ToolDefinition> | null>(null)
  const [deleting, setDeleting] = useState<ToolDefinition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('arsenal')

  useEffect(() => {
    toolApi.list()
      .then(setTools)
      .catch(e => setError(e instanceof Error ? e.message : 'Load failed'))
  }, [])

  const save = async () => {
    if (!editing) return
    try {
      if (editing.id) {
        const updated = await toolApi.update(editing.id, editing)
        setTools(ts => ts.map(t => t.id === updated.id ? updated : t))
      } else {
        const created = await toolApi.create(editing)
        setTools(ts => [created, ...ts])
      }
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const toggle = async (tool: ToolDefinition) => {
    try {
      const updated = await toolApi.toggle(tool.id)
      setTools(ts => ts.map(t => t.id === updated.id ? updated : t))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toggle failed')
    }
  }

  const removeConfirmed = async () => {
    if (!deleting) return
    try {
      await toolApi.delete(deleting.id)
      setTools(ts => ts.filter(t => t.id !== deleting.id))
    } finally {
      setDeleting(null)
    }
  }

  const tabs = [
    { id: 'arsenal' as View, label: 'ARSENAL', Icon: Crosshair },
    { id: 'execlog' as View, label: 'EXEC LOG', Icon: History },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="ARSENAL"
          subtitle={`${tools.length} TOOL${tools.length === 1 ? '' : 'S'} · DYNAMICALLY LOADED`}
          actions={
            <button
              onClick={() => setEditing({ ...EMPTY_TOOL })}
              className="flex items-center gap-2 px-3 py-2 text-[11px] font-mono font-bold tracking-widest uppercase transition-all"
              style={{
                color: 'rgba(0,212,255,0.8)',
                border: '1px solid rgba(0,212,255,0.3)',
                background: 'rgba(0,212,255,0.05)',
              }}
            >
              <Plus size={12} />
              REGISTER TOOL
            </button>
          }
        />

        {/* View tabs */}
        <div className="flex items-center gap-0 mb-6"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}
        >
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className="relative flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-bold tracking-widest uppercase transition-colors"
              style={{ color: view === id ? '#00d4ff' : 'rgba(0,212,255,0.3)' }}
            >
              <Icon size={11} />
              {label}
              {view === id && (
                <motion.div
                  layoutId="tool-view-indicator"
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: '#00d4ff' }}
                />
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="px-3 py-2 mb-4 text-xs font-mono"
            style={{ color: '#ff4444', border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.05)' }}
          >
            ERROR: {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'arsenal' ? (
            <motion.div key="arsenal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {tools.length === 0 ? (
                <EmptyState
                  icon={<Plus size={22} />}
                  title="NO TOOLS REGISTERED"
                  description="Register a built-in, HTTP, or script tool the agent can call."
                  action={
                    <button
                      onClick={() => setEditing({ ...EMPTY_TOOL })}
                      className="flex items-center gap-2 px-3 py-2 text-[11px] font-mono font-bold tracking-widest uppercase mx-auto transition-all"
                      style={{
                        color: 'rgba(0,212,255,0.8)',
                        border: '1px solid rgba(0,212,255,0.3)',
                        background: 'rgba(0,212,255,0.05)',
                      }}
                    >
                      <Plus size={12} />
                      REGISTER FIRST TOOL
                    </button>
                  }
                />
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {tools.map(tool => (
                      <ToolRow
                        key={tool.id}
                        tool={tool}
                        onEdit={setEditing}
                        onToggle={toggle}
                        onDelete={setDeleting}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="execlog" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ExecutionHistory />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {editing && (
        <ToolForm
          tool={editing}
          onChange={setEditing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="DECOMMISSION TOOL?"
        message={deleting ? `"${deleting.name}" will be permanently removed from the arsenal.` : ''}
        confirmLabel="DECOMMISSION"
        destructive
        onConfirm={removeConfirmed}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

interface ToolRowProps {
  tool: ToolDefinition
  onEdit: (t: ToolDefinition) => void
  onToggle: (t: ToolDefinition) => void
  onDelete: (t: ToolDefinition) => void
}

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  BUILTIN: { color: '#7b2fff', bg: 'rgba(123,47,255,0.08)' },
  HTTP:    { color: '#0080ff', bg: 'rgba(0,128,255,0.08)' },
  SCRIPT:  { color: '#00ff88', bg: 'rgba(0,255,136,0.08)' },
}

function ToolRow({ tool, onEdit, onToggle, onDelete }: ToolRowProps) {
  const typeStyle = TYPE_COLORS[tool.toolType] ?? { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      className="relative"
      style={{
        background: tool.enabled ? 'rgba(7,21,32,0.8)' : 'rgba(7,21,32,0.4)',
        border: '1px solid rgba(0,212,255,0.1)',
        opacity: tool.enabled ? 1 : 0.4, // changed from 0.55 to avoid full disabled look
      }}
    >
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-sm font-semibold" style={{ color: '#00d4ff' }}>
              {tool.name}
            </span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5"
              style={{ color: typeStyle.color, background: typeStyle.bg, border: `1px solid ${typeStyle.color}33` }}
            >
              {tool.toolType}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5"
              style={{
                color: tool.enabled ? '#00ff88' : 'rgba(0,212,255,0.3)',
                background: tool.enabled ? 'rgba(0,255,136,0.06)' : 'rgba(0,212,255,0.03)',
                border: `1px solid ${tool.enabled ? 'rgba(0,255,136,0.25)' : 'rgba(0,212,255,0.1)'}`,
              }}
            >
              {tool.enabled ? 'ACTIVE' : 'OFFLINE'}
            </span>
            {tool.requiresConfirmation && (
              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5"
                style={{ color: '#ffcc00', background: 'rgba(255,204,0,0.06)', border: '1px solid rgba(255,204,0,0.25)' }}
              >
                CONFIRM
              </span>
            )}
          </div>
          <p className="text-xs font-mono" style={{ color: 'rgba(0,212,255,0.4)' }}>
            {tool.description}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggle(tool)}
            className="p-1.5 transition-colors"
            style={{ color: tool.enabled ? '#00ff88' : 'rgba(0,212,255,0.3)' }}
            title={tool.enabled ? 'Disable' : 'Enable'}
          >
            <Power size={13} />
          </button>
          <button
            onClick={() => onEdit(tool)}
            className="p-1.5 transition-colors"
            style={{ color: 'rgba(0,212,255,0.4)' }}
            title="Edit"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={() => onDelete(tool)}
            className="p-1.5 transition-colors"
            style={{ color: 'rgba(255,68,68,0.4)' }}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
