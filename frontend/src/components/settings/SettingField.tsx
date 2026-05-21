import React from 'react'
import type { SystemSetting } from '../../types'

interface SettingFieldProps {
  setting: SystemSetting
  value: string
  isDirty: boolean
  onChange: (key: string, value: string) => void
}

export function SettingField({ setting, value, isDirty, onChange }: SettingFieldProps) {
  return (
    <div className={`card p-4 ${isDirty ? 'border-violet-500/50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-mono text-xs font-semibold text-violet-300">
            {setting.settingKey}
          </span>
          <span className="ml-2 badge bg-gray-800 text-gray-500">{setting.settingType}</span>
        </div>
        {isDirty && <span className="badge bg-violet-900/50 text-violet-300">modified</span>}
      </div>

      {setting.description && (
        <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
      )}

      {renderInput(setting, value, onChange)}
    </div>
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
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={e => onChange(setting.settingKey, String(e.target.checked))}
          className="w-4 h-4 accent-violet-600"
        />
        <span className="text-sm text-gray-400">{value === 'true' ? 'Enabled' : 'Disabled'}</span>
      </label>
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
