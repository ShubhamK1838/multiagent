import type { FieldOption } from '../../../types/form'

interface SelectInputProps {
  value: string
  onChange: (v: string) => void
  options: FieldOption[]
  placeholder?: string
  hasError: boolean
}

export function SelectInput({ value, onChange, options, placeholder, hasError }: SelectInputProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`input w-full ${hasError ? 'border-red-500' : ''}`}
    >
      <option value="">{placeholder ?? 'Select an option…'}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
