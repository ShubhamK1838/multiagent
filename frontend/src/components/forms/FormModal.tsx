import React from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { useChatStore } from '../../store/chatStore'
import { formApi } from '../../services/api'
import { X, Send } from 'lucide-react'

export function FormModal() {
  const { pendingForm, setPendingForm } = useChatStore()

  if (!pendingForm) return null

  const handleSubmit = async ({ formData }: { formData: Record<string, unknown> }) => {
    try {
      await formApi.submit(pendingForm.id, formData)
      setPendingForm(null)
    } catch (e) {
      console.error('Form submit failed', e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-100">AI Needs More Information</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">Please fill out the form below</p>
          </div>
          <button onClick={() => setPendingForm(null)} className="btn-ghost p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 rjsf-dark">
          <Form
            schema={pendingForm.schema as never}
            validator={validator}
            onSubmit={handleSubmit}
            uiSchema={{
              'ui:submitButtonOptions': {
                submitText: 'Submit',
                props: { className: 'btn-primary mt-4 flex items-center gap-2' }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
