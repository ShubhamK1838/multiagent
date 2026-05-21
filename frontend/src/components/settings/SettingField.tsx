import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import type { SystemSetting } from '../../types'

interface SettingFieldProps {
  setting: SystemSetting
  value: string
  isDirty: boolean
  onChange: (key: string, value: string) => void
}

export function SettingField({ setting, value, isDirty, onChange }: SettingFieldProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 240 }}
      className={clsx('card p-4 transition-colors', isDirty && 'border-violet-500/60 shadow-lg shadow-violet-600/10')}
    >
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="min-w-0">
          <span className="font-mono text-xs font-semibold text-violet-300 break-all">{setting.settingKey}</span>
          <span className="ml-2 badge bg-gray-800 text-gray-400 border border-gray-700">{setting.settingType}</span>
        </div>
        {isDirty && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="badge bg-violet-500/15 text-violet-300 border border-violet-500/40 shrink-0"
          >
            modified
          </motion.span>
        )}
      </div>

      {setting.description && (
        <p className="text-xs text-gray-500 mb-2.5 leading-relaxed">{setting.description}</p>
      )}

      {renderInput(setting, value, onChange)}
    </motion.div>
  )
}

function renderInput(
  setting: SystemSetting,
  value: string,
  onChange: (key: string, value: string) => void
) {
  if (setting.isSecret) {
    return <input type="password" className="input font-mono text-sm" value="••••••••" disabled />
  }

  if (setting.settingType === 'TEXT') {
    return (
      <textarea
        rows={4}
        className="input font-mono text-xs resize-none"
        value={value}
        onChange={e => onChange(setting.settingKey, e.target.value)}
      />
    )
  }

  if (setting.settingType === 'BOOLEAN') {
    const enabled = value === 'true'
    return (
      <button
        onClick={() => onChange(setting.settingKey, String(!enabled))}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          enabled ? 'bg-violet-600' : 'bg-gray-700'
        )}
        type="button"
      >
        <motion.span
          layout
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
        <span className="sr-only">{enabled ? 'Enabled' : 'Disabled'}</span>
      </button>
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
