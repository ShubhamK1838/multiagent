import React, { useEffect, useState } from 'react'
import { toolApi } from '../../services/api'
import { ToolForm } from './ToolForm'
import type { ToolDefinition } from '../../types'
import { Plus } from 'lucide-react'
import { clsx } from 'clsx'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    toolApi.list().then(setTools).catch(e => setError(e instanceof Error ? e.message : 'Load failed'))
  }, [])

  const handleSave = async () => {
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

  const handleToggle = async (tool: ToolDefinition) => {
    const updated = await toolApi.toggle(tool.id)
    setTools(ts => ts.map(t => t.id === updated.id ? updated : t))
  }

  const handleDelete = async (id: string) => {
    await toolApi.delete(id)
    setTools(ts => ts.filter(t => t.id !== id))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-100 font-mono">Tool Registry</h1>
            <p className="text-xs text-gray-500 mt-1">{tools.length} tools registered · dynamically loaded by agent</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY_TOOL })} className="btn-primary flex items-center gap-2">
            <Plus size={14} />
            Add Tool
          </button>
        </div>

        {error && (
          <div className="card p-3 mb-4 border-red-800 bg-red-900/20 text-red-400 text-sm font-mono">{error}</div>
        )}

        <div className="space-y-3">
          {tools.map(tool => (
            <ToolRow
              key={tool.id}
              tool={tool}
              onEdit={setEditing}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {editing && (
        <ToolForm
          tool={editing}
          onChange={setEditing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

interface ToolRowProps {
  tool: ToolDefinition
  onEdit: (t: ToolDefinition) => void
  onToggle: (t: ToolDefinition) => void
  onDelete: (id: string) => void
}

function ToolRow({ tool, onEdit, onToggle, onDelete }: ToolRowProps) {
  return (
    <div className={clsx('card p-4', !tool.enabled && 'opacity-60')}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-gray-100">{tool.name}</span>
            <span className={clsx(
              'badge',
              tool.toolType === 'BUILTIN' ? 'bg-purple-900/50 text-purple-300' :
              tool.toolType === 'HTTP' ? 'bg-blue-900/50 text-blue-300' :
              'bg-green-900/50 text-green-300'
            )}>
              {tool.toolType}
            </span>
            <span className={clsx('badge', tool.enabled ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-500')}>
              {tool.enabled ? 'enabled' : 'disabled'}
            </span>
            {tool.requiresConfirmation && (
              <span className="badge bg-yellow-900/50 text-yellow-300">confirm</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{tool.description}</p>
        </div>

        <div className="flex items-center gap-1 ml-4 shrink-0">
          <button
            onClick={() => onToggle(tool)}
            className={clsx('btn-ghost p-1.5 text-xs font-mono', tool.enabled ? 'text-green-400' : 'text-gray-500')}
          >
            {tool.enabled ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => onEdit(tool)} className="btn-ghost p-1.5 text-xs font-mono">EDIT</button>
          <button onClick={() => onDelete(tool.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300 text-xs font-mono">DEL</button>
        </div>
      </div>
    </div>
  )
}
