import React from 'react'
import { clsx } from 'clsx'

interface ToggleInputProps {
  value: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function ToggleInput({ value, onChange, label }: ToggleInputProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex items-center gap-3 group"
    >
      <div className={clsx(
        'relative w-11 h-6 rounded-full transition-colors duration-200',
        value ? 'bg-violet-600' : 'bg-gray-700'
      )}>
        <div className={clsx(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
          value ? 'translate-x-5' : 'translate-x-0'
        )} />
      </div>
      {label && (
        <span className={clsx('text-sm font-mono', value ? 'text-violet-300' : 'text-gray-500')}>
          {value ? 'Enabled' : 'Disabled'}
        </span>
      )}
    </button>
  )
}
