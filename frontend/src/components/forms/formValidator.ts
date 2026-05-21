import type { ParsedField } from '../../types/form'

export function validateForm(
  fields: ParsedField[],
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const value = values[field.key]
    const isEmpty = value === undefined || value === null || value === '' ||
      (Array.isArray(value) && value.length === 0)

    if (field.required && isEmpty) {
      errors[field.key] = `${field.title} is required`
      continue
    }

    if (isEmpty) continue

    if (typeof value === 'string') {
      if (field.minLength && value.length < field.minLength) {
        errors[field.key] = `Minimum ${field.minLength} characters required`
      } else if (field.maxLength && value.length > field.maxLength) {
        errors[field.key] = `Maximum ${field.maxLength} characters allowed`
      } else if (field.pattern && !new RegExp(field.pattern).test(value)) {
        errors[field.key] = `Invalid format`
      }
    }

    if (typeof value === 'number') {
      if (field.min !== undefined && value < field.min) {
        errors[field.key] = `Minimum value is ${field.min}`
      } else if (field.max !== undefined && value > field.max) {
        errors[field.key] = `Maximum value is ${field.max}`
      }
    }
  }

  return errors
}
