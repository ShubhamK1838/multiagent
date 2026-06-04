import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../shared/Modal'
import { Save } from 'lucide-react'
import type { AgentDefinition, AgentDefinitionInput, AiModel } from '../../types'

interface AgentRoleFormModalProps {
  open: boolean
  editing: AgentDefinition | null
  models: AiModel[]
  onClose: () => void
  onSubmit: (input: AgentDefinitionInput) => Promise<unknown>
}

interface FormState {
  roleKey: string
  displayName: string
  systemPrompt: string
  modelId: string          // '' = default
  allowedTools: string     // comma-separated, '' = all
  maxIterations: number
  color: string
  enabled: boolean
}

const EMPTY: FormState = {
  roleKey: '', displayName: '', systemPrompt: '', modelId: '',
  allowedTools: '', maxIterations: 6, color: '#38bdf8', enabled: true,
}

export function AgentRoleFormModal({ open, editing, models, onClose, onSubmit }: AgentRoleFormModalProps) {
  const initial = useMemo<FormState>(() => {
    if (!editing) return EMPTY
    return {
      roleKey: editing.roleKey,
      displayName: editing.displayName,
      systemPrompt: editing.systemPrompt,
      modelId: editing.modelId ?? '',
      allowedTools: (editing.allowedTools ?? []).join(', '),
      maxIterations: editing.maxIterations,
      color: editing.color ?? '#38bdf8',
      enabled: editing.enabled,
    }
  }, [editing])

  const [state, setState] = useState<FormState>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setState(initial); setError(null) }, [initial, open])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState(prev => ({ ...prev, [key]: value }))

  const isValid = state.roleKey.trim().length > 0 && state.displayName.trim().length > 0

  const submit = async () => {
    if (!isValid) return
    setSubmitting(true)
    setError(null)
    try {
      const tools = state.allowedTools.split(',').map(t => t.trim()).filter(Boolean)
      const payload: AgentDefinitionInput = {
        roleKey: state.roleKey.trim(),
        displayName: state.displayName.trim(),
        systemPrompt: state.systemPrompt,
        modelId: state.modelId || null,
        allowedTools: tools.length > 0 ? tools : null,
        maxIterations: state.maxIterations,
        color: state.color || null,
        enabled: state.enabled,
      }
      await onSubmit(payload)
      onClose()
    } catch (e) {
      const message = e instanceof Error ? e.message
        : typeof e === 'object' && e && 'response' in e
        ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Save failed')
        : 'Save failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit agent role' : 'Add agent role'}
      subtitle={editing ? editing.roleKey : 'Define a new specialised agent'}
      width="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={!isValid || submitting} className="btn-primary flex items-center gap-2">
            <Save size={14} />
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create role'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5">Role key</label>
            <input
              className="input font-mono"
              value={state.roleKey}
              disabled={!!editing}
              onChange={e => update('roleKey', e.target.value.toUpperCase())}
              placeholder="RESEARCHER"
            />
            {editing && <p className="text-[11px] text-gray-600 mt-1">Role key is immutable.</p>}
          </div>
          <div>
            <label className="label block mb-1.5">Display name</label>
            <input
              className="input"
              value={state.displayName}
              onChange={e => update('displayName', e.target.value)}
              placeholder="Researcher"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5">Model</label>
            <select className="input" value={state.modelId} onChange={e => update('modelId', e.target.value)}>
              <option value="">Default model</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1.5">Max iterations</label>
              <input
                type="number" min={1} max={50}
                className="input font-mono"
                value={state.maxIterations}
                onChange={e => update('maxIterations', Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="label block mb-1.5">Color</label>
              <input
                type="color"
                className="input h-[38px] p-1"
                value={state.color}
                onChange={e => update('color', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label block mb-1.5">
            Allowed tools <span className="text-gray-600 normal-case">— comma-separated, blank = all tools</span>
          </label>
          <input
            className="input font-mono text-xs"
            value={state.allowedTools}
            onChange={e => update('allowedTools', e.target.value)}
            placeholder="list_files, render_table, render_chart"
          />
        </div>

        <div>
          <label className="label block mb-1.5">System prompt</label>
          <textarea
            rows={5}
            className="input resize-none text-sm"
            value={state.systemPrompt}
            onChange={e => update('systemPrompt', e.target.value)}
            placeholder="Describe this agent's role and objective…"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={e => update('enabled', e.target.checked)}
            className="w-4 h-4 accent-violet-500"
          />
          <span className="text-sm text-gray-300">Enabled — participates in the team</span>
        </label>
      </div>
    </Modal>
  )
}
