import React from 'react'

interface RangeInputProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}

export function RangeInput({ value, onChange, min = 0, max = 100, step = 1 }: RangeInputProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          type="range"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1 accent-violet-500 cursor-pointer"
        />
        <span className="text-sm font-mono text-violet-300 w-12 text-right">{value}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-600 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
