import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'

interface KeyValueListProps {
  value: Record<string, string>
  onChange: (next: Record<string, string>) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  hint?: string
}

interface Row {
  k: string
  v: string
}

export function KeyValueList({
  value, onChange, keyPlaceholder = 'key', valuePlaceholder = 'value', hint
}: KeyValueListProps) {
  const rows: Row[] = Object.entries(value).map(([k, v]) => ({ k, v: v ?? '' }))

  const commit = (next: Row[]) => {
    const obj: Record<string, string> = {}
    next.forEach(r => {
      if (r.k.trim()) obj[r.k] = r.v
    })
    onChange(obj)
  }

  const updateRow = (index: number, patch: Partial<Row>) => {
    const next = rows.slice()
    next[index] = { ...next[index], ...patch }
    commit(next)
  }

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index)
    commit(next)
  }

  const addRow = () => commit([...rows, { k: '', v: '' }])

  return (
    <div className="space-y-2">
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <AnimatePresence initial={false}>
        {rows.map((row, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <input
              className="input font-mono text-xs flex-1"
              placeholder={keyPlaceholder}
              value={row.k}
              onChange={e => updateRow(i, { k: e.target.value })}
            />
            <input
              className="input font-mono text-xs flex-[2]"
              placeholder={valuePlaceholder}
              value={row.v}
              onChange={e => updateRow(i, { v: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="btn-ghost p-1.5 text-gray-500 hover:text-red-300"
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
        className="text-xs font-mono text-violet-300 hover:text-violet-200 flex items-center gap-1 px-2 py-1 rounded border border-dashed border-gray-700 hover:border-violet-500/40"
      >
        <Plus size={12} /> Add row
      </button>
    </div>
  )
}
