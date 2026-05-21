import { useRef, useState } from 'react'
import Form, { IChangeEvent } from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { Send, Loader2 } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { formApi } from '../../services/api'
import { Modal } from '../shared/Modal'

export function FormModal() {
  const { pendingForm, setPendingForm } = useChatStore()
  const formRef = useRef<Form>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (submitting) return
    setError(null)
    setPendingForm(null)
  }

  const triggerSubmit = () => {
    submitButtonRef.current?.click()
  }

  const handleSubmit = async (data: IChangeEvent) => {
    if (!pendingForm) return
    setSubmitting(true)
    setError(null)
    try {
      const formData = (data.formData ?? {}) as Record<string, unknown>
      await formApi.submit(pendingForm.id, formData)
      setPendingForm(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const reason = readReason(pendingForm?.schema)

  return (
    <Modal
      open={!!pendingForm}
      onClose={close}
      title="AI needs more info"
      subtitle="Fill out the form to continue the conversation"
      width="md"
      footer={
        <>
          <button onClick={close} disabled={submitting} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={triggerSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </>
      }
    >
      {pendingForm && (
        <div className="rjsf-dark">
          {reason && (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 text-violet-100 text-sm p-3 mb-4">
              {reason}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 mb-4">
              {error}
            </div>
          )}

          <Form
            ref={formRef}
            schema={pendingForm.schema as never}
            validator={validator}
            onSubmit={handleSubmit}
            showErrorList={false}
            liveValidate={false}
          >
            <button ref={submitButtonRef} type="submit" className="hidden" aria-hidden />
          </Form>
        </div>
      )}
    </Modal>
  )
}

/**
 * The ask_user tool may include a top-level `description` or a custom
 * `reason` field on the schema. Surface it as a friendly prompt.
 */
function readReason(schema: unknown): string | null {
  if (!schema || typeof schema !== 'object') return null
  const s = schema as Record<string, unknown>
  const description = typeof s.description === 'string' ? s.description : null
  const reason = typeof s.reason === 'string' ? s.reason : null
  return reason ?? description
}
