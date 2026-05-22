import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { Toggle } from '../shared/Toggle'

type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'

interface ParameterRow {
  name: string
  type: JsonSchemaType
  description: string
  required: boolean
}

interface ParametersBuilderProps {
  schema: Record<string, unknown>
  onChange: (schema: Record<string, unknown>) => void
}

const TYPES: JsonSchemaType[] = ['string', 'number', 'integer', 'boolean', 'object', 'array']

export function ParametersBuilder({ schema, onChange }: ParametersBuilderProps) {
  const rows = useMemo<ParameterRow[]>(() => {
    const props = (schema.properties as Record<string, Record<string, unknown>> | undefined) ?? {}
    const required = (schema.required as string[] | undefined) ?? []
    return Object.entries(props).map(([name, p]) => ({
      name,
      type: (p.type as JsonSchemaType) ?? 'string',
      description: (p.description as string) ?? '',
      required: required.includes(name),
    }))
  }, [schema])

  const commit = (next: ParameterRow[]) => {
    const properties: Record<string, Record<string, string>> = {}
    const required: string[] = []
    next.forEach(r => {
      if (!r.name.trim()) return
      properties[r.name] = { type: r.type, description: r.description }
      if (r.required) required.push(r.name)
    })
    onChange({ type: 'object', properties, required })
  }

  const updateRow = (index: number, patch: Partial<ParameterRow>) => {
    const next = rows.slice()
    next[index] = { ...next[index], ...patch }
    commit(next)
  }

  const removeRow = (index: number) => commit(rows.filter((_, i) => i !== index))

  const addRow = () => commit([...rows, { name: '', type: 'string', description: '', required: false }])

  return (
    <div className="space-y-2 relative z-20">
      <p className="text-xs text-jarvis-cyan/70 font-mono">
        Parameters the AI will fill when calling this tool. Use the names as
        <code className="ml-1 px-1 bg-jarvis-cyan/10 border border-jarvis-cyan/30 text-jarvis-cyan font-bold">${'{'}name{'}'}</code>
        placeholders in the URL, headers, query params, or body.
      </p>

      <AnimatePresence initial={false}>
        {rows.length > 0 && (
          <motion.div
            layout
            className="hidden sm:grid grid-cols-[1fr_120px_2fr_80px_28px] gap-2 px-1 text-[10px] font-mono text-jarvis-cyan/80 uppercase tracking-[0.1em]"
          >
            <span>Name</span>
            <span>Type</span>
            <span>Description</span>
            <span className="text-center">Required</span>
            <span />
          </motion.div>
        )}

        {rows.map((row, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-[1fr_120px_2fr_80px_28px] gap-2 items-center"
          >
            <input
              className="input font-mono text-xs"
              placeholder="param_name"
              value={row.name}
              onChange={e => updateRow(i, { name: e.target.value })}
            />
            <select
              className="input text-xs"
              value={row.type}
              onChange={e => updateRow(i, { type: e.target.value as JsonSchemaType })}
            >
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              className="input text-xs"
              placeholder="What this parameter is for…"
              value={row.description}
              onChange={e => updateRow(i, { description: e.target.value })}
            />
            <div className="flex justify-center">
              <Toggle
                checked={row.required}
                onChange={(next) => updateRow(i, { required: next })}
                size="sm"
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="btn-ghost p-1.5 text-jarvis-cyan/60 hover:text-red-400 justify-self-center"
              title="Remove"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={addRow}
        className="text-xs font-mono font-bold uppercase tracking-wider text-jarvis-cyan hover:text-white flex items-center gap-1 px-3 py-1.5 border border-dashed border-jarvis-cyan/40 hover:border-jarvis-cyan bg-jarvis-cyan/5 hover:bg-jarvis-cyan/20 transition-all duration-200 mt-2"
      >
        <Plus size={12} /> Add parameter
      </button>
    </div>
  )
}
