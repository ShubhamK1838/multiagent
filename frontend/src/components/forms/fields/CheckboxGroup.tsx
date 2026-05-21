import React from 'react'
import type { FieldOption } from '../../../types/form'
import { clsx } from 'clsx'

interface CheckboxGroupProps {
  value: string[]
  onChange: (v: string[]) => void
  options: FieldOption[]
}

export function CheckboxGroup({ value, onChange, options }: CheckboxGroupProps) {
  const toggle = (optValue: string) => {
    onChange(
      value.includes(optValue)
        ? value.filter(v => v !== optValue)
        : [...value, optValue]
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(opt => {
        const checked = value.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left',
              checked
                ? 'bg-violet-600/20 border-violet-500 text-violet-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            )}
          >
            <div className={clsx(
              'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
              checked ? 'bg-violet-600 border-violet-500' : 'border-gray-600'
            )}>
              {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-white"><path d="M1 4l3 3 5-6"/></svg>}
            </div>
            <span className="font-mono text-xs">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
