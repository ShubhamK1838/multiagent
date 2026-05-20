import React, { useEffect, useState } from 'react'
import { toolApi } from '../../services/api'
import type { ToolDefinition } from '../../types'
import { Plus, Trash2, Toggle3dOff, ToggleRight, Edit2, X, Save } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    toolApi.list()
      .then(setTools)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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
    } catch (e: unknown) {
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
            <p className="text-xs text-gray-500 mt-1">{tools.length} tools registered</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY_TOOL })} className="btn-primary flex items-center gap-2">
            <Plus size={14} />
            Add Tool
          </button>
        </div>

        {error && (
          <div className="card p-4 mb-4 border-red-800 bg-red-900/20 text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {tools.map(tool => (
            <div key={tool.id} className={clsx('card p-4', !tool.enabled && 'opacity-60')}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-100">{tool.name}</span>
                    <span className={clsx(
                      'badge',
                      tool.toolType === 'BUILTIN' ? 'bg-purple-900/50 text-purple-300' :
                      tool.toolType === 'HTTP' ? 'bg-blue-900/50 text-blue-300' :
                      'bg-green-900/50 text-green-300'
                    )}>
                      {tool.toolType}
                    </span>
                    {tool.requiresConfirmation && (
                      <span className="badge bg-yellow-900/50 text-yellow-300">confirm</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{tool.description}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => handleToggle(tool)} className="btn-ghost p-1.5">
                    {tool.enabled
                      ? <ToggleRight size={16} className="text-green-400" />
                      : <Toggle3dOff size={16} className="text-gray-500" />}
                  </button>
                  <button onClick={() => setEditing(tool)} className="btn-ghost p-1.5">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(tool.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold font-mono">
                {editing.id ? 'Edit Tool' : 'New Tool'}
              </h2>
              <button onClick={() => setEditing(null)} className="btn-ghost p-1">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label block mb-1">Name</label>
                  <input
                    className="input font-mono"
                    value={editing.name ?? ''}
                    onChange={e => setEditing(s => ({ ...s!, name: e.target.value }))}
                    placeholder="tool_name"
                  />
                </div>
                <div>
                  <label className="label block mb-1">Type</label>
                  <select
                    className="input"
                    value={editing.toolType ?? 'HTTP'}
                    onChange={e => setEditing(s => ({ ...s!, toolType: e.target.value as ToolDefinition['toolType'] }))}
                  >
                    <option value="HTTP">HTTP</option>
                    <option value="BUILTIN">Built-in</option>
                    <option value="SCRIPT">Script</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label block mb-1">Description</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={editing.description ?? ''}
                  onChange={e => setEditing(s => ({ ...s!, description: e.target.value }))}
                  placeholder="What this tool does..."
                />
              </div>

              <div>
                <label className="label block mb-1">Parameters Schema (JSON)</label>
                <textarea
                  className="input font-mono resize-none text-xs"
                  rows={6}
                  value={JSON.stringify(editing.parametersSchema ?? {}, null, 2)}
                  onChange={e => {
                    try {
                      setEditing(s => ({ ...s!, parametersSchema: JSON.parse(e.target.value) }))
                    } catch {}
                  }}
                />
              </div>

              <div>
                <label className="label block mb-1">Handler Config (JSON)</label>
                <textarea
                  className="input font-mono resize-none text-xs"
                  rows={4}
                  value={JSON.stringify(editing.handlerConfig ?? {}, null, 2)}
                  onChange={e => {
                    try {
                      setEditing(s => ({ ...s!, handlerConfig: JSON.parse(e.target.value) }))
                    } catch {}
                  }}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.enabled ?? true}
                    onChange={e => setEditing(s => ({ ...s!, enabled: e.target.checked }))}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <span className="text-sm text-gray-400">Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.requiresConfirmation ?? false}
                    onChange={e => setEditing(s => ({ ...s!, requiresConfirmation: e.target.checked }))}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <span className="text-sm text-gray-400">Requires Confirmation</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-800">
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Save size={14} />
                Save Tool
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
