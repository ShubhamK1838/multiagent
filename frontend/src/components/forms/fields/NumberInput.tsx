import React from 'react'

interface NumberInputProps {
  value: number | ''
  onChange: (v: number | '') => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  hasError: boolean
}

export function NumberInput({ value, onChange, min, max, step, placeholder, hasError }: NumberInputProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      min={min}
      max={max}
      step={step ?? 'any'}
      placeholder={placeholder}
      className={`input w-full ${hasError ? 'border-red-500' : ''}`}
    />
  )
}
