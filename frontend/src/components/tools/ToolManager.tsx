import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Plus, Edit3, Trash2, Power } from 'lucide-react'
import { toolApi } from '../../services/api'
import { ToolForm } from './ToolForm'
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

export function ToolManager() {
  const [tools, setTools] = useState<ToolDefinition[]>([])
  const [editing, setEditing] = useState<Partial<ToolDefinition> | null>(null)
  const [deleting, setDeleting] = useState<ToolDefinition | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    toolApi.list().then(setTools).catch(e => setError(e instanceof Error ? e.message : 'Load failed'))
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
    const updated = await toolApi.toggle(tool.id)
    setTools(ts => ts.map(t => t.id === updated.id ? updated : t))
  }

  const removeConfirmed = async () => {
    if (!deleting) return
    await toolApi.delete(deleting.id)
    setTools(ts => ts.filter(t => t.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Tool Registry"
          subtitle={`${tools.length} tool${tools.length === 1 ? '' : 's'} · dynamically loaded by the agent`}
          actions={
            <button onClick={() => setEditing({ ...EMPTY_TOOL })} className="btn-primary flex items-center gap-2">
              <Plus size={14} />
              Add tool
            </button>
          }
        />

        {error && (
          <div className="card p-3 mb-4 border-red-500/40 bg-red-500/10 text-red-300 text-sm">{error}</div>
        )}

        {tools.length === 0 ? (
          <EmptyState
            icon={<Plus size={22} />}
            title="No tools yet"
            description="Register a built-in or HTTP tool that the agent can call."
            action={
              <button onClick={() => setEditing({ ...EMPTY_TOOL })} className="btn-primary flex items-center gap-2 mx-auto">
                <Plus size={14} />
                Add tool
              </button>
            }
          />
        ) : (
          <motion.div className="space-y-3" layout>
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
          </motion.div>
        )}
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
        title="Delete this tool?"
        message={deleting ? `"${deleting.name}" will be removed permanently.` : ''}
        confirmLabel="Delete"
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

const TYPE_STYLES: Record<ToolDefinition['toolType'], string> = {
  BUILTIN: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  HTTP:    'bg-blue-500/10 text-blue-300 border-blue-500/30',
  SCRIPT:  'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
}

function ToolRow({ tool, onEdit, onToggle, onDelete }: ToolRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      className={clsx('card p-4 card-hover', !tool.enabled && 'opacity-60')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-gray-100">{tool.name}</span>
            <span className={clsx('badge border', TYPE_STYLES[tool.toolType])}>
              {tool.toolType}
            </span>
            <span className={clsx('badge border',
              tool.enabled
                ? 'bg-green-500/10 text-green-300 border-green-500/30'
                : 'bg-gray-800 text-gray-500 border-gray-700'
            )}>
              {tool.enabled ? 'enabled' : 'disabled'}
            </span>
            {tool.requiresConfirmation && (
              <span className="badge bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">confirm</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{tool.description}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onToggle(tool)} className="btn-ghost p-1.5" title="Toggle">
            <Power size={14} className={tool.enabled ? 'text-emerald-400' : 'text-gray-500'} />
          </button>
          <button onClick={() => onEdit(tool)} className="btn-ghost p-1.5" title="Edit"><Edit3 size={14} /></button>
          <button onClick={() => onDelete(tool)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
