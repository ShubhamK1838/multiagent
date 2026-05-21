
interface TextareaInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  hasError: boolean
}

export function TextareaInput({ value, onChange, placeholder, maxLength, hasError }: TextareaInputProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className={`input w-full resize-none ${hasError ? 'border-red-500' : ''}`}
      />
      {maxLength && (
        <div className="text-right text-xs text-gray-600 mt-1 font-mono">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  )
}
