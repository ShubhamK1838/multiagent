import React, { useEffect, useState } from 'react'
import { settingsApi } from '../../services/api'
import type { SystemSetting } from '../../types'
import { Save, RefreshCw } from 'lucide-react'

const CATEGORIES = ['LLM', 'AGENT', 'RAG', 'GENERAL']

export function SettingsPanel() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeCategory, setActiveCategory] = useState('LLM')

  const load = () => {
    settingsApi.getAll().then(all => {
      setSettings(all)
      setEdits({})
    })
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.bulkUpdate(edits)
      setSaved(true)
      setEdits({})
      load()
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const categorySettings = settings.filter(s => s.category === activeCategory)
  const hasEdits = Object.keys(edits).length > 0

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-100 font-mono">System Settings</h1>
            <p className="text-xs text-gray-500 mt-1">Configure everything from here</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost flex items-center gap-2">
              <RefreshCw size={14} />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasEdits || saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={14} />
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {categorySettings.map(setting => {
            const currentValue = edits[setting.settingKey] ?? setting.settingValue ?? ''
            const isDirty = setting.settingKey in edits

            return (
              <div key={setting.id} className={`card p-4 ${isDirty ? 'border-violet-500/50' : ''}`}>
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

                {setting.settingType === 'TEXT' ? (
                  <textarea
                    rows={4}
                    className="input font-mono text-xs resize-none"
                    value={setting.isSecret ? '••••••••' : currentValue}
                    disabled={setting.isSecret}
                    onChange={e => setEdits(prev => ({ ...prev, [setting.settingKey]: e.target.value }))}
                  />
                ) : setting.settingType === 'BOOLEAN' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentValue === 'true'}
                      onChange={e => setEdits(prev => ({ ...prev, [setting.settingKey]: String(e.target.checked) }))}
                      className="w-4 h-4 accent-violet-600"
                    />
                    <span className="text-sm text-gray-400">{currentValue === 'true' ? 'Enabled' : 'Disabled'}</span>
                  </label>
                ) : (
                  <input
                    type={setting.isSecret ? 'password' : 'text'}
                    className="input font-mono text-sm"
                    value={currentValue}
                    disabled={setting.isSecret}
                    onChange={e => setEdits(prev => ({ ...prev, [setting.settingKey]: e.target.value }))}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
