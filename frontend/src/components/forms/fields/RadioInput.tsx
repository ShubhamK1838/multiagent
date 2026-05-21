import type { FieldOption } from '../../../types/form'
import { clsx } from 'clsx'

interface RadioInputProps {
  value: string
  onChange: (v: string) => void
  options: FieldOption[]
}

export function RadioInput({ value, onChange, options }: RadioInputProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-mono border transition-all',
            value === opt.value
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-violet-500 hover:text-gray-200'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
