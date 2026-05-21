import { KeyValueList } from '../shared/KeyValueList'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const BODY_METHODS: Set<Method> = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

interface HttpConfig {
  url?: string
  method?: Method
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  body?: string
  contentType?: string
  timeoutMs?: number
}

interface HttpConfigFormProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function HttpConfigForm({ config, onChange }: HttpConfigFormProps) {
  const c = config as HttpConfig
  const method = (c.method ?? 'GET') as Method
  const hasBody = BODY_METHODS.has(method)

  const update = (patch: Partial<HttpConfig>) =>
    onChange({ ...config, ...patch })

  return (
    <div className="space-y-4">
      <div>
        <label className="label block mb-1.5">URL <span className="text-red-300 normal-case">*</span></label>
        <div className="flex gap-2">
          <select
            className="input w-28 font-mono text-xs"
            value={method}
            onChange={e => update({ method: e.target.value as Method })}
          >
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            className="input flex-1 font-mono text-xs"
            value={c.url ?? ''}
            onChange={e => update({ url: e.target.value })}
            placeholder="https://api.example.com/v1/search?q=${query}"
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">
          Use <code className="px-1 bg-gray-800 rounded text-emerald-300">${'{'}param{'}'}</code> placeholders — they're filled with the parameter values the AI provides.
        </p>
      </div>

      <Section title="Headers" hint="Sent on every request. Values support placeholders too.">
        <KeyValueList
          value={c.headers ?? {}}
          onChange={headers => update({ headers })}
          keyPlaceholder="Authorization"
          valuePlaceholder="Bearer ${api_key}"
        />
      </Section>

      <Section title="Query parameters" hint="Appended to the URL. URL-encoded automatically.">
        <KeyValueList
          value={c.queryParams ?? {}}
          onChange={queryParams => update({ queryParams })}
          keyPlaceholder="q"
          valuePlaceholder="${query}"
        />
      </Section>

      {hasBody && (
        <div className="space-y-3">
          <div>
            <label className="label block mb-1.5">Content type</label>
            <input
              className="input font-mono text-xs"
              value={c.contentType ?? 'application/json'}
              onChange={e => update({ contentType: e.target.value })}
            />
          </div>
          <div>
            <label className="label block mb-1.5">Body</label>
            <textarea
              rows={5}
              className="input font-mono text-xs resize-y"
              value={c.body ?? ''}
              onChange={e => update({ body: e.target.value })}
              placeholder='{ "prompt": "${query}" }'
            />
            <p className="text-[11px] text-gray-500 mt-1.5">
              Placeholders are replaced before sending. Use valid JSON if the content type is application/json.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-wider text-gray-400">{title}</p>
        {hint && <p className="text-[10px] text-gray-600">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
