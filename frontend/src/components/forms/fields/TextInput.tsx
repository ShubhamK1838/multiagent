import type { FieldComponentType } from '../../../types/form'

interface TextInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minLength?: number
  maxLength?: number
  pattern?: string
  component: FieldComponentType
  hasError: boolean
}

export function TextInput({ value, onChange, placeholder, minLength, maxLength, pattern, component, hasError }: TextInputProps) {
  const typeMap: Partial<Record<FieldComponentType, string>> = {
    text: 'text', email: 'email', url: 'url', tel: 'tel', password: 'password'
  }
  return (
    <input
      type={typeMap[component] ?? 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      minLength={minLength}
      maxLength={maxLength}
      pattern={pattern}
      className={`input w-full ${hasError ? 'border-red-500 focus:border-red-500' : ''}`}
    />
  )
}
