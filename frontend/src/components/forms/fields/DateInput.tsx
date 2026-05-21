import React from 'react'
import type { FieldComponentType } from '../../../types/form'

interface DateInputProps {
  value: string
  onChange: (v: string) => void
  component: FieldComponentType
  hasError: boolean
}

export function DateInput({ value, onChange, component, hasError }: DateInputProps) {
  const typeMap: Partial<Record<FieldComponentType, string>> = {
    date: 'date',
    datetime: 'datetime-local',
    time: 'time',
  }
  return (
    <input
      type={typeMap[component] ?? 'date'}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`input w-full [color-scheme:dark] ${hasError ? 'border-red-500' : ''}`}
    />
  )
}
