import React from 'react'
import type { ToolDefinition } from '../../types'
import { X, Save } from 'lucide-react'

interface ToolFormProps {
  tool: Partial<ToolDefinition>
  onChange: (tool: Partial<ToolDefinition>) => void
  onSave: () => void
  onClose: () => void
}

export function ToolForm({ tool, onChange, onSave, onClose }: ToolFormProps) {
  const update = (patch: Partial<ToolDefinition>) => onChange({ ...tool, ...patch })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold font-mono">
            {tool.id ? 'Edit Tool' : 'New Tool'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1">Name</label>
              <input
                className="input font-mono"
                value={tool.name ?? ''}
                onChange={e => update({ name: e.target.value })}
                placeholder="tool_name"
              />
            </div>
            <div>
              <label className="label block mb-1">Type</label>
              <select
                className="input"
                value={tool.toolType ?? 'HTTP'}
                onChange={e => update({ toolType: e.target.value as ToolDefinition['toolType'] })}
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
              value={tool.description ?? ''}
              onChange={e => update({ description: e.target.value })}
              placeholder="What this tool does and when the AI should use it…"
            />
          </div>

          <div>
            <label className="label block mb-1">Parameters Schema (JSON Schema)</label>
            <textarea
              className="input font-mono resize-none text-xs"
              rows={6}
              value={JSON.stringify(tool.parametersSchema ?? {}, null, 2)}
              onChange={e => {
                try { update({ parametersSchema: JSON.parse(e.target.value) }) } catch {}
              }}
            />
          </div>

          <div>
            <label className="label block mb-1">Handler Config (JSON)</label>
            <textarea
              className="input font-mono resize-none text-xs"
              rows={4}
              value={JSON.stringify(tool.handlerConfig ?? {}, null, 2)}
              onChange={e => {
                try { update({ handlerConfig: JSON.parse(e.target.value) }) } catch {}
              }}
            />
            <p className="text-xs text-gray-600 mt-1 font-mono">
              HTTP: {'{url, method}'} · BUILTIN: {'{handler: "calculator" | "rag_search" | "ask_user"}'}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tool.enabled ?? true}
                onChange={e => update({ enabled: e.target.checked })}
                className="w-4 h-4 accent-violet-600"
              />
              <span className="text-sm text-gray-400">Enabled</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tool.requiresConfirmation ?? false}
                onChange={e => update({ requiresConfirmation: e.target.checked })}
                className="w-4 h-4 accent-violet-600"
              />
              <span className="text-sm text-gray-400">Requires Confirmation</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-800">
          <button onClick={onSave} className="btn-primary flex items-center gap-2">
            <Save size={14} />
            Save Tool
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  )
}
