import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { RotateCcw } from 'lucide-react'
import { Toggle } from '../shared/Toggle'
import type { SystemSetting } from '../../types'

interface SettingFieldProps {
  setting: SystemSetting
  value: string
  isDirty: boolean
  onChange: (key: string, value: string) => void
  onReset?: (key: string) => void
}

export function SettingField({ setting, value, isDirty, onChange, onReset }: SettingFieldProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      className={clsx(
        'card p-4 transition-colors',
        isDirty && 'border-violet-500/60 shadow-lg shadow-violet-600/10'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1.5">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold text-violet-300 break-all">
            {setting.settingKey}
          </p>
          {setting.description && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{setting.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="badge bg-gray-800 text-gray-400 border border-gray-700">
            {setting.settingType.toLowerCase()}
          </span>
          {isDirty && (
            <>
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="badge bg-violet-500/15 text-violet-300 border border-violet-500/40"
              >
                modified
              </motion.span>
              {onReset && (
                <button
                  type="button"
                  onClick={() => onReset(setting.settingKey)}
                  className="btn-ghost p-1"
                  title="Reset to saved value"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-3">
        {renderInput(setting, value, onChange)}
      </div>
    </motion.div>
  )
}

function renderInput(
  setting: SystemSetting,
  value: string,
  onChange: (key: string, value: string) => void
) {
  if (setting.isSecret) {
    return (
      <input
        type="password"
        className="input font-mono text-sm"
        value="••••••••"
        disabled
        readOnly
      />
    )
  }

  if (setting.settingType === 'TEXT') {
    return (
      <textarea
        rows={4}
        className="input font-mono text-xs resize-y min-h-[6rem]"
        value={value}
        onChange={e => onChange(setting.settingKey, e.target.value)}
      />
    )
  }

  if (setting.settingType === 'BOOLEAN') {
    const enabled = value === 'true'
    return (
      <div className="flex items-center gap-3">
        <Toggle checked={enabled} onChange={next => onChange(setting.settingKey, String(next))} />
        <span className={clsx(
          'text-sm font-mono',
          enabled ? 'text-emerald-300' : 'text-gray-500'
        )}>
          {enabled ? 'enabled' : 'disabled'}
        </span>
      </div>
    )
  }

  if (setting.settingType === 'INTEGER' || setting.settingType === 'DECIMAL') {
    return (
      <input
        type="number"
        className="input font-mono text-sm"
        value={value}
        step={setting.settingType === 'DECIMAL' ? '0.01' : '1'}
        onChange={e => onChange(setting.settingKey, e.target.value)}
      />
    )
  }

  return (
    <input
      type="text"
      className="input font-mono text-sm"
      value={value}
      onChange={e => onChange(setting.settingKey, e.target.value)}
    />
  )
}
