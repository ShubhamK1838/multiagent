import React, { useEffect, useState } from 'react'
import { settingsApi } from '../../services/api'
import { SettingField } from './SettingField'
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
    settingsApi.getAll().then(all => { setSettings(all); setEdits({}) })
  }

  useEffect(() => { load() }, [])

  const handleChange = (key: string, value: string) => {
    setEdits(prev => ({ ...prev, [key]: value }))
  }

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
            <p className="text-xs text-gray-500 mt-1">All configuration is stored in the database and applied at runtime</p>
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
                activeCategory === cat ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {categorySettings.map(setting => (
            <SettingField
              key={setting.id}
              setting={setting}
              value={edits[setting.settingKey] ?? setting.settingValue ?? ''}
              isDirty={setting.settingKey in edits}
              onChange={handleChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
