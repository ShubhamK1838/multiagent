import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Info, Settings as SettingsIcon, ListTree, Code2 } from 'lucide-react'
import { Modal } from '../shared/Modal'
import { Toggle } from '../shared/Toggle'
import { AnimatedTabs } from '../shared/AnimatedTabs'
import { HttpConfigForm } from './HttpConfigForm'
import { BuiltinConfigForm } from './BuiltinConfigForm'
import { ParametersBuilder } from './ParametersBuilder'
import type { ToolDefinition } from '../../types'

interface ToolFormProps {
  tool: Partial<ToolDefinition>
  onChange: (tool: Partial<ToolDefinition>) => void
  onSave: () => void
  onClose: () => void
}

type Tab = 'basic' | 'config' | 'params' | 'advanced'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'basic',    label: 'Basic',      icon: Info },
  { id: 'config',   label: 'Handler',    icon: SettingsIcon },
  { id: 'params',   label: 'Parameters', icon: ListTree },
  { id: 'advanced', label: 'Raw JSON',   icon: Code2 },
]

export function ToolForm({ tool, onChange, onSave, onClose }: ToolFormProps) {
  const [tab, setTab] = useState<Tab>('basic')

  const update = (patch: Partial<ToolDefinition>) => onChange({ ...tool, ...patch })

  return (
    <Modal
      open
      onClose={onClose}
      title={tool.id ? 'Edit tool' : 'New tool'}
      subtitle={tool.id ? tool.name : 'Register a tool the agent can call'}
      width="xl"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={onSave} className="btn-primary flex items-center gap-2">
            <Save size={14} />
            Save tool
          </button>
        </>
      }
    >
      <div className="space-y-5 relative z-20">
        <AnimatedTabs
          options={TABS.map(t => ({ id: t.id, label: t.label }))}
          value={tab}
          onChange={setTab}
          layoutId="tool-form-tab"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'basic'    && <BasicTab    tool={tool} update={update} />}
            {tab === 'config'   && <ConfigTab   tool={tool} update={update} />}
            {tab === 'params'   && <ParamsTab   tool={tool} update={update} />}
            {tab === 'advanced' && <AdvancedTab tool={tool} update={update} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  )
}

interface TabProps {
  tool: Partial<ToolDefinition>
  update: (patch: Partial<ToolDefinition>) => void
}

function BasicTab({ tool, update }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label block mb-1.5">Name <span className="text-red-400 normal-case">*</span></label>
          <input
            className="input font-mono"
            value={tool.name ?? ''}
            onChange={e => update({ name: e.target.value })}
            placeholder="web_search"
          />
          <p className="text-[10px] text-jarvis-cyan/50 mt-1 uppercase tracking-wider">Snake_case identifier — what the AI calls.</p>
        </div>
        <div>
          <label className="label block mb-1.5">Type</label>
          <select
            className="input"
            value={tool.toolType ?? 'HTTP'}
            onChange={e => update({ toolType: e.target.value as ToolDefinition['toolType'] })}
          >
            <option value="HTTP">HTTP (REST API)</option>
            <option value="BUILTIN">Built-in</option>
            <option value="SCRIPT">Script</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label block mb-1.5">Description <span className="text-red-400 normal-case">*</span></label>
        <textarea
          className="input resize-none"
          rows={3}
          value={tool.description ?? ''}
          onChange={e => update({ description: e.target.value })}
          placeholder="What this tool does and when the AI should call it. The model reads this verbatim."
        />
      </div>

      <div className="flex flex-wrap items-center gap-6 p-4 border border-jarvis-cyan/20 bg-jarvis-cyan/5">
        <label className="flex items-center gap-3 cursor-pointer">
          <Toggle
            checked={tool.enabled ?? true}
            onChange={(next) => update({ enabled: next })}
          />
          <span className="text-xs font-mono tracking-wider uppercase text-jarvis-cyan">Enabled (Available to agent)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <Toggle
            checked={tool.requiresConfirmation ?? false}
            onChange={(next) => update({ requiresConfirmation: next })}
          />
          <span className="text-xs font-mono tracking-wider uppercase text-jarvis-cyan">Requires confirmation</span>
        </label>
      </div>
    </div>
  )
}

function ConfigTab({ tool, update }: TabProps) {
  const config = (tool.handlerConfig as Record<string, unknown>) ?? {}
  const setConfig = (next: Record<string, unknown>) => update({ handlerConfig: next })
  const type = tool.toolType ?? 'HTTP'

  if (type === 'HTTP') {
    return <HttpConfigForm config={config} onChange={setConfig} />
  }
  if (type === 'BUILTIN') {
    return <BuiltinConfigForm config={config} onChange={setConfig} />
  }
  return (
    <div className="border border-dashed border-jarvis-cyan/40 bg-jarvis-cyan/5 p-4 text-xs text-jarvis-cyan/70 font-mono text-center uppercase tracking-wider">
      No structured editor for <span className="text-jarvis-cyan font-bold">{type}</span> tools yet — use the
      <span className="text-jarvis-cyan font-bold"> Raw JSON </span> tab to configure it.
    </div>
  )
}

function ParamsTab({ tool, update }: TabProps) {
  const schema = (tool.parametersSchema as Record<string, unknown>) ?? { type: 'object', properties: {}, required: [] }
  return (
    <ParametersBuilder
      schema={schema}
      onChange={(next) => update({ parametersSchema: next })}
    />
  )
}

function AdvancedTab({ tool, update }: TabProps) {
  return (
    <div className="space-y-4">
      <JsonField
        label="Parameters Schema (JSON Schema)"
        value={tool.parametersSchema ?? {}}
        onChange={parametersSchema => update({ parametersSchema })}
        rows={8}
      />
      <JsonField
        label="Handler Config (JSON)"
        value={tool.handlerConfig ?? {}}
        onChange={handlerConfig => update({ handlerConfig })}
        rows={8}
      />
      <p className="text-[10px] text-jarvis-cyan/50 font-mono uppercase tracking-wider">
        Edits made on the other tabs are reflected here in real time.
      </p>
    </div>
  )
}

interface JsonFieldProps {
  label: string
  value: unknown
  onChange: (next: Record<string, unknown>) => void
  rows: number
}

function JsonField({ label, value, onChange, rows }: JsonFieldProps) {
  const [draft, setDraft] = useState(() => JSON.stringify(value ?? {}, null, 2))
  const [error, setError] = useState<string | null>(null)

  const onBlur = () => {
    try {
      const parsed = JSON.parse(draft)
      if (typeof parsed !== 'object' || parsed === null) {
        setError('Must be a JSON object')
        return
      }
      setError(null)
      onChange(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  return (
    <div>
      <label className="label block mb-1.5">{label}</label>
      <textarea
        rows={rows}
        className="input font-mono resize-y text-xs bg-jarvis-panel border border-jarvis-cyan/30"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={onBlur}
        style={{ color: '#00ff88' }}
      />
      {error && <p className="text-[10px] text-red-400 font-mono mt-1 uppercase tracking-wider">{error}</p>}
    </div>
  )
}
