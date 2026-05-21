import React from 'react'
import { clsx } from 'clsx'
import { Cloud, HardDrive } from 'lucide-react'
import type { AiModelProvider } from '../../types'

interface ProviderBadgeProps {
  provider: AiModelProvider
  size?: 'sm' | 'md'
}

const STYLES: Record<AiModelProvider, { label: string; icon: React.ElementType; cls: string }> = {
  OPENAI: { label: 'OpenAI-compat', icon: Cloud, cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  OLLAMA: { label: 'Ollama',        icon: HardDrive, cls: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
}

export function ProviderBadge({ provider, size = 'md' }: ProviderBadgeProps) {
  const s = STYLES[provider] ?? STYLES.OPENAI
  const Icon = s.icon
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border font-mono', padding, s.cls)}>
      <Icon size={size === 'sm' ? 10 : 12} />
      {s.label}
    </span>
  )
}
