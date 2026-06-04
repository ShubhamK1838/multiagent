import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../shared/Modal'
import type { AiModel, AiModelInput, AiModelProvider } from '../../types'
import { Eye, EyeOff, Save, Sparkles } from 'lucide-react'

interface ModelFormModalProps {
  open: boolean
  editing: AiModel | null
  onClose: () => void
  onSubmit: (input: AiModelInput) => Promise<unknown>
}

interface FormState {
  name: string
  provider: AiModelProvider
  modelId: string
  baseUrl: string
  apiKey: string
  awsRegion: string
  temperature: number
  maxTokens: number
  enabled: boolean
  description: string
  costPerMillionInputTokens: string
  costPerMillionOutputTokens: string
}

const EMPTY: FormState = {
  name: '',
  provider: 'OPENAI',
  modelId: '',
  baseUrl: '',
  apiKey: '',
  awsRegion: '',
  temperature: 0.7,
  maxTokens: 4096,
  enabled: true,
  description: '',
  costPerMillionInputTokens: '',
  costPerMillionOutputTokens: '',
}

function optStr(options: Record<string, unknown> | undefined, key: string): string {
  const v = options?.[key]
  return v == null ? '' : String(v)
}

export function ModelFormModal({ open, editing, onClose, onSubmit }: ModelFormModalProps) {
  const initial = useMemo<FormState>(() => {
    if (!editing) return EMPTY
    return {
      name: editing.name,
      provider: editing.provider,
      modelId: editing.modelId,
      baseUrl: editing.baseUrl ?? '',
      apiKey: '',
      awsRegion: editing.awsRegion ?? '',
      temperature: editing.temperature,
      maxTokens: editing.maxTokens,
      enabled: editing.enabled,
      description: editing.description ?? '',
      costPerMillionInputTokens: optStr(editing.options, 'costPerMillionInputTokens'),
      costPerMillionOutputTokens: optStr(editing.options, 'costPerMillionOutputTokens'),
    }
  }, [editing])

  const [state, setState] = useState<FormState>(initial)
  const [showKey, setShowKey] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setState(initial); setError(null) }, [initial, open])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState(prev => ({ ...prev, [key]: value }))

  const isValid = (() => {
    if (!state.name.trim() || !state.modelId.trim()) return false
    if (state.provider === 'OPENAI') return !!state.baseUrl.trim()
    if (state.provider === 'BEDROCK') return !!state.awsRegion.trim()
    return true // OLLAMA
  })()

  const submit = async () => {
    if (!isValid) return
    setSubmitting(true)
    setError(null)
    try {
      // Preserve any existing options and merge in pricing (omit keys when left blank).
      const options: Record<string, unknown> = { ...(editing?.options ?? {}) }
      const setOrDelete = (key: string, raw: string) => {
        const n = Number(raw)
        if (raw.trim() !== '' && Number.isFinite(n)) options[key] = n
        else delete options[key]
      }
      setOrDelete('costPerMillionInputTokens', state.costPerMillionInputTokens)
      setOrDelete('costPerMillionOutputTokens', state.costPerMillionOutputTokens)

      const payload: AiModelInput = {
        name: state.name.trim(),
        provider: state.provider,
        modelId: state.modelId.trim(),
        baseUrl: state.provider === 'BEDROCK' ? null : (state.baseUrl.trim() || null),
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        isEnabled: state.enabled,
        description: state.description.trim() || null,
        options,
      }
      if (state.provider === 'OPENAI' && state.apiKey.trim()) payload.apiKey = state.apiKey.trim()
      if (state.provider === 'BEDROCK') payload.awsRegion = state.awsRegion.trim()
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
      title={editing ? 'Edit model' : 'Add AI model'}
      subtitle={editing ? editing.name : 'Register a new chat model'}
      width="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            onClick={submit}
            disabled={!isValid || submitting}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={14} />
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create model'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3">
            {error}
          </div>
        )}

        <div>
          <label className="label block mb-1.5">Display name</label>
          <input
            autoFocus
            className="input"
            value={state.name}
            onChange={e => update('name', e.target.value)}
            placeholder="e.g. GPT-4o (production)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5">Provider</label>
            <select
              className="input"
              value={state.provider}
              onChange={e => update('provider', e.target.value as AiModelProvider)}
            >
              <option value="OPENAI">OpenAI-compatible</option>
              <option value="OLLAMA">Ollama (local)</option>
              <option value="BEDROCK">AWS Bedrock</option>
            </select>
          </div>
          <div>
            <label className="label block mb-1.5">Model identifier</label>
            <input
              className="input font-mono"
              value={state.modelId}
              onChange={e => update('modelId', e.target.value)}
              placeholder={
                state.provider === 'OPENAI'  ? 'gpt-4o' :
                state.provider === 'BEDROCK' ? 'anthropic.claude-3-5-sonnet-20240620-v1:0' :
                'llama3.1:8b'
              }
            />
          </div>
        </div>

        {state.provider === 'OPENAI' && (
          <div>
            <label className="label block mb-1.5">Base URL</label>
            <input
              className="input font-mono text-xs"
              value={state.baseUrl}
              onChange={e => update('baseUrl', e.target.value)}
              placeholder="https://api.openai.com"
            />
          </div>
        )}

        {state.provider === 'OLLAMA' && (
          <div>
            <label className="label block mb-1.5">
              Base URL <span className="text-gray-600 normal-case">— optional, defaults to http://localhost:11434</span>
            </label>
            <input
              className="input font-mono text-xs"
              value={state.baseUrl}
              onChange={e => update('baseUrl', e.target.value)}
              placeholder="http://localhost:11434"
            />
          </div>
        )}

        {state.provider === 'BEDROCK' && (
          <div>
            <label className="label block mb-1.5">AWS region</label>
            <input
              className="input font-mono text-xs"
              value={state.awsRegion}
              onChange={e => update('awsRegion', e.target.value)}
              placeholder="us-east-1"
            />
            <p className="text-[11px] text-gray-500 mt-1.5">
              Credentials are read from the AWS default chain (env vars, <code>~/.aws/credentials</code>, or IAM role).
            </p>
          </div>
        )}

        {state.provider === 'OPENAI' && (
          <div>
            <label className="label block mb-1.5">API key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                className="input font-mono text-xs pr-10"
                value={state.apiKey}
                onChange={e => update('apiKey', e.target.value)}
                placeholder={editing?.hasApiKey ? '•••••••• (leave blank to keep current key)' : 'sk-…'}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-300"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5">
              Temperature <span className="text-violet-300 normal-case">{state.temperature.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0} max={2} step={0.05}
              value={state.temperature}
              onChange={e => update('temperature', Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-1">
              <span>focused</span>
              <span>creative</span>
            </div>
          </div>
          <div>
            <label className="label block mb-1.5">Max tokens</label>
            <input
              type="number"
              min={1} max={200000}
              className="input font-mono"
              value={state.maxTokens}
              onChange={e => update('maxTokens', Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5">
              Input price <span className="text-gray-600 normal-case">— $ / 1M tokens</span>
            </label>
            <input
              type="number" min={0} step="0.01"
              className="input font-mono"
              value={state.costPerMillionInputTokens}
              onChange={e => update('costPerMillionInputTokens', e.target.value)}
              placeholder="e.g. 2.50"
            />
          </div>
          <div>
            <label className="label block mb-1.5">
              Output price <span className="text-gray-600 normal-case">— $ / 1M tokens</span>
            </label>
            <input
              type="number" min={0} step="0.01"
              className="input font-mono"
              value={state.costPerMillionOutputTokens}
              onChange={e => update('costPerMillionOutputTokens', e.target.value)}
              placeholder="e.g. 10.00"
            />
          </div>
        </div>

        <div>
          <label className="label block mb-1.5">Description</label>
          <textarea
            rows={2}
            className="input resize-none text-sm"
            value={state.description}
            onChange={e => update('description', e.target.value)}
            placeholder="A short note about this model — provider, intended use, etc."
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={e => update('enabled', e.target.checked)}
            className="w-4 h-4 accent-violet-500"
          />
          <span className="text-sm text-gray-300">Enabled — available to the agent</span>
        </label>

        {!editing && (
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-violet-500/5 border border-violet-500/20 rounded-lg p-3">
            <Sparkles size={12} className="text-violet-400 mt-0.5 shrink-0" />
            <span>New models are added as non-default. Use <b>Set default</b> on the card to make this model active.</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
