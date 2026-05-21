import React, { useState } from 'react'
import type { FormSchema } from '../../types/form'
import { parseSchema } from './schemaParser'
import { validateForm } from './formValidator'
import { FormField } from './FormField'
import { Send, X } from 'lucide-react'

interface DynamicFormRendererProps {
  schema: FormSchema
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  submitting?: boolean
}

export function DynamicFormRenderer({ schema, onSubmit, onCancel, submitting }: DynamicFormRendererProps) {
  const fields = parseSchema(schema)

  const initialValues = Object.fromEntries(
    fields.map(f => [f.key, f.defaultValue ?? (f.component === 'checkboxes' ? [] : f.component === 'toggle' ? false : '')])
  )

  const [values, setValues] = useState<Record<string, unknown>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleChange = (key: string, value: unknown) => {
    setValues(prev => ({ ...prev, [key]: value }))
    if (touched[key]) {
      const fieldErrors = validateForm(fields.filter(f => f.key === key), { [key]: value })
      setErrors(prev => ({ ...prev, ...fieldErrors, ...(fieldErrors[key] ? {} : { [key]: '' }) }))
    }
  }

  const handleBlur = (key: string) => {
    setTouched(prev => ({ ...prev, [key]: true }))
    const fieldErrors = validateForm(fields.filter(f => f.key === key), { [key]: values[key] })
    setErrors(prev => ({ ...prev, ...fieldErrors }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched = Object.fromEntries(fields.map(f => [f.key, true]))
    setTouched(allTouched)
    const allErrors = validateForm(fields, values)
    setErrors(allErrors)
    if (Object.keys(allErrors).length === 0) {
      onSubmit(values)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {schema.description && (
        <p className="text-sm text-gray-400 border-l-2 border-violet-500 pl-3">{schema.description}</p>
      )}

      {fields.map(field => (
        <div key={field.key} onBlur={() => handleBlur(field.key)}>
          <FormField
            field={field}
            value={values[field.key]}
            error={errors[field.key]}
            onChange={value => handleChange(field.key, value)}
          />
        </div>
      ))}

      <div className="flex gap-3 pt-2 border-t border-gray-800">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Send size={13} />
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex items-center gap-2">
          <X size={13} />
          Cancel
        </button>
      </div>
    </form>
  )
}
