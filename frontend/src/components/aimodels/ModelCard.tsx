import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Check, Edit3, Trash2, Star, KeyRound, Link2 } from 'lucide-react'
import type { AiModel } from '../../types'
import { ProviderBadge } from './ProviderBadge'

interface ModelCardProps {
  model: AiModel
  onEdit: (m: AiModel) => void
  onDelete: (m: AiModel) => void
  onPromote: (m: AiModel) => void
  busy?: boolean
}

export function ModelCard({ model, onEdit, onDelete, onPromote, busy }: ModelCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', damping: 22, stiffness: 240 }}
      whileHover={{ y: -2 }}
      className={clsx(
        'card p-5 card-hover relative overflow-hidden',
        model.default && 'border-violet-500/60 shadow-lg shadow-violet-600/10',
        !model.enabled && 'opacity-60'
      )}
    >
      {model.default && (
        <motion.div
          className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg bg-violet-600 text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1"
          initial={{ x: 50 }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <Star size={10} fill="currentColor" />
          Default
        </motion.div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-100 truncate text-base">{model.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <ProviderBadge provider={model.provider} size="sm" />
            <span className={clsx('badge', model.enabled
              ? 'bg-green-500/10 text-green-300 border border-green-500/30'
              : 'bg-gray-800 text-gray-500 border border-gray-700')}>
              {model.enabled ? 'enabled' : 'disabled'}
            </span>
          </div>
        </div>
      </div>

      <p className="font-mono text-xs text-violet-300/90 truncate" title={model.modelId}>
        {model.modelId}
      </p>

      {model.description && (
        <p className="text-xs text-gray-400 mt-2 line-clamp-2">{model.description}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-400">
        <div className="flex items-center gap-1.5">
          <Link2 size={10} className="text-gray-500" />
          <span className="truncate" title={model.baseUrl ?? '(provider default)'}>
            {model.baseUrl ? prettyHost(model.baseUrl) : 'provider default'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <KeyRound size={10} className={model.hasApiKey ? 'text-emerald-400' : 'text-gray-600'} />
          <span>{model.hasApiKey ? 'API key set' : 'no key'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-500 font-mono">
        <span>temp {model.temperature}</span>
        <span className="text-gray-700">·</span>
        <span>{model.maxTokens.toLocaleString()} tokens</span>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800">
        <button
          onClick={() => onPromote(model)}
          disabled={model.default || !model.enabled || busy}
          className="btn-ghost flex items-center gap-1.5 text-xs disabled:opacity-30"
          title={model.default ? 'Already the default' : 'Make this the default model'}
        >
          <Check size={12} />
          {model.default ? 'Default' : 'Set default'}
        </button>
        <div className="flex-1" />
        <button onClick={() => onEdit(model)} className="btn-ghost p-1.5" title="Edit"><Edit3 size={14} /></button>
        <button
          onClick={() => onDelete(model)}
          disabled={model.default}
          className="btn-ghost p-1.5 text-red-400 hover:text-red-300 disabled:opacity-30"
          title={model.default ? 'Promote another model first' : 'Delete'}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  )
}

function prettyHost(url: string): string {
  try {
    const u = new URL(url)
    return u.host
  } catch {
    return url
  }
}
