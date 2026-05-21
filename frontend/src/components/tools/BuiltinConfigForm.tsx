interface BuiltinConfigFormProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

const BUILTIN_HANDLERS: { id: string; label: string; description: string }[] = [
  { id: 'calculator',  label: 'Calculator',     description: 'Evaluate math expressions like "(2+3)*4".' },
  { id: 'rag_search',  label: 'RAG Search',     description: 'Vector-similarity search over the knowledge base.' },
  { id: 'ask_user',    label: 'Ask User (form)', description: 'Pause the agent and request structured input from the user.' },
]

export function BuiltinConfigForm({ config, onChange }: BuiltinConfigFormProps) {
  const current = (config.handler as string) ?? ''

  return (
    <div className="space-y-3">
      <label className="label block">Built-in handler</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {BUILTIN_HANDLERS.map(h => {
          const active = current === h.id
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onChange({ ...config, handler: h.id })}
              className={[
                'text-left rounded-lg border p-3 transition-all',
                active
                  ? 'border-violet-500/60 bg-violet-500/10 text-gray-100 shadow-lg shadow-violet-600/15'
                  : 'border-gray-800 bg-gray-900/40 text-gray-300 hover:border-gray-700',
              ].join(' ')}
            >
              <p className="text-sm font-semibold">{h.label}</p>
              <p className="text-[11px] font-mono text-gray-500 mt-0.5">{h.id}</p>
              <p className="text-xs text-gray-400 mt-1.5">{h.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
