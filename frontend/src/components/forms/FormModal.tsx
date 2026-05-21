import { useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import { formApi } from '../../services/api'
import { DynamicFormRenderer } from './DynamicFormRenderer'
import type { FormSchema } from '../../types/form'
import { X, FileInput } from 'lucide-react'

export function FormModal() {
  const { pendingForm, setPendingForm } = useChatStore()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!pendingForm) return null

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true)
    setError(null)
    try {
      await formApi.submit(pendingForm.id, data)
      setPendingForm(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const schema = pendingForm.schema as unknown as FormSchema
  const title = schema.title ?? 'Input Required'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center">
              <FileInput size={13} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-100">{title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">AI needs your input to continue</p>
            </div>
          </div>
          <button onClick={() => setPendingForm(null)} className="btn-ghost p-1.5 rounded-lg">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm font-mono">
              {error}
            </div>
          )}
          <DynamicFormRenderer
            schema={schema}
            onSubmit={handleSubmit}
            onCancel={() => setPendingForm(null)}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  )
}
