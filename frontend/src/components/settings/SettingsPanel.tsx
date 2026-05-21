import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Save, RefreshCw, Search, Check } from 'lucide-react'
import { settingsApi } from '../../services/api'
import { SettingField } from './SettingField'
import { PageHeader } from '../shared/PageHeader'
import { AnimatedTabs } from '../shared/AnimatedTabs'
import { EmptyState } from '../shared/EmptyState'
import type { SystemSetting } from '../../types'

type Category = 'LLM' | 'AGENT' | 'RAG' | 'UI' | 'GENERAL'
const CATEGORIES: Category[] = ['LLM', 'AGENT', 'RAG', 'UI', 'GENERAL']

export function SettingsPanel() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category>('LLM')
  const [query, setQuery] = useState('')

  const load = async () => {
    const data = await settingsApi.getAll()
    setSettings(data)
    setEdits({})
  }

  useEffect(() => { void load() }, [])

  const tabOptions = useMemo(
    () => CATEGORIES.map(c => ({
      id: c,
      label: c,
      count: settings.filter(s => s.category === c).length,
    })),
    [settings]
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return settings
      .filter(s => s.category === activeCategory)
      .filter(s => !q || s.settingKey.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q))
  }, [settings, activeCategory, query])

  const hasEdits = Object.keys(edits).length > 0

  const handleChange = (key: string, value: string) =>
    setEdits(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!hasEdits) return
    setSaving(true)
    try {
      await settingsApi.bulkUpdate(edits)
      setSavedFlash(true)
      await load()
      setTimeout(() => setSavedFlash(false), 1800)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="System Settings"
          subtitle="Stored in PostgreSQL · applied at runtime without a restart"
          actions={
            <>
              <button onClick={load} className="btn-ghost flex items-center gap-2" title="Reset">
                <RefreshCw size={14} />
              </button>
              <button
                onClick={handleSave}
                disabled={!hasEdits || saving}
                className="btn-primary flex items-center gap-2"
              >
                {savedFlash ? <Check size={14} /> : <Save size={14} />}
                {savedFlash ? 'Saved' : saving ? 'Saving…' : `Save ${hasEdits ? `(${Object.keys(edits).length})` : ''}`}
              </button>
            </>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <AnimatedTabs
            options={tabOptions}
            value={activeCategory}
            onChange={setActiveCategory}
            layoutId="settings-tab"
          />
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="input pl-9"
              placeholder="Filter…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Save size={20} />}
            title="Nothing here"
            description={query
              ? 'No settings match your filter.'
              : `No settings registered in the "${activeCategory}" category.`}
          />
        ) : (
          <motion.div className="space-y-3" layout>
            <AnimatePresence initial={false}>
              {visible.map(s => (
                <SettingField
                  key={s.id}
                  setting={s}
                  value={edits[s.settingKey] ?? s.settingValue ?? ''}
                  isDirty={s.settingKey in edits}
                  onChange={handleChange}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
