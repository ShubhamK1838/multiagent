import Form, { IChangeEvent } from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { useChatStore } from '../../store/chatStore'
import { formApi } from '../../services/api'
import { Modal } from '../shared/Modal'

export function FormModal() {
  const { pendingForm, setPendingForm } = useChatStore()

  const handleSubmit = async (data: IChangeEvent) => {
    if (!pendingForm) return
    const formData = (data.formData ?? {}) as Record<string, unknown>
    try {
      await formApi.submit(pendingForm.id, formData)
      setPendingForm(null)
    } catch (e) {
      console.error('Form submit failed', e)
    }
  }

  return (
    <Modal
      open={!!pendingForm}
      onClose={() => setPendingForm(null)}
      title="AI needs more info"
      subtitle="Please fill out the form below"
      width="md"
    >
      {pendingForm && (
        <div className="rjsf-dark">
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
      )}
    </Modal>
  )
}
