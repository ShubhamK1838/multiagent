import React from 'react'
import { clsx } from 'clsx'

interface FieldWrapperProps {
  title: string
  description?: string
  error?: string
  required: boolean
  children: React.ReactNode
  horizontal?: boolean
}

export function FieldWrapper({ title, description, error, required, children, horizontal }: FieldWrapperProps) {
  return (
    <div className={clsx('space-y-1.5', horizontal && 'flex items-center justify-between gap-4')}>
      <div className={horizontal ? 'flex-1' : undefined}>
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          {title}
          {required && <span className="text-violet-400 ml-1">*</span>}
        </label>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className={horizontal ? 'shrink-0' : undefined}>{children}</div>
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
    </div>
  )
}
