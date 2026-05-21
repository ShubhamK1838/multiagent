import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'
import {
  Save, RefreshCw, Search, Check, Sparkles, Bot, Database,
  Layout, SlidersHorizontal, type LucideIcon
} from 'lucide-react'
import { settingsApi } from '../../services/api'
import { SettingField } from './SettingField'
import { PageHeader } from '../shared/PageHeader'
import { EmptyState } from '../shared/EmptyState'
import type { SystemSetting } from '../../types'

type Category = 'LLM' | 'AGENT' | 'RAG' | 'UI' | 'GENERAL'

interface CategoryDef {
  id: Category
  label: string
  icon: LucideIcon
  description: string
  accent: string
}

const CATEGORIES: CategoryDef[] = [
  { id: 'LLM',     label: 'Language Model', icon: Sparkles, accent: 'text-violet-300',  description: 'Default model behavior, prompts and token limits.' },
  { id: 'AGENT',   label: 'Agent',          icon: Bot,      accent: 'text-cyan-300',    description: 'Iteration limits, streaming, and tool-call behavior.' },
  { id: 'RAG',     label: 'Knowledge',      icon: Database, accent: 'text-emerald-300', description: 'Retrieval-augmented generation and embedding options.' },
  { id: 'UI',      label: 'Interface',      icon: Layout,   accent: 'text-pink-300',    description: 'Toggle the chat side-panels and visual elements.' },
  { id: 'GENERAL', label: 'General',        icon: SlidersHorizontal, accent: 'text-amber-300', description: 'Miscellaneous configuration and feature flags.' },
]

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

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    settings.forEach(s => { counts[s.category] = (counts[s.category] ?? 0) + 1 })
    return counts
  }, [settings])

  const activeDef = CATEGORIES.find(c => c.id === activeCategory)!

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return settings
      .filter(s => s.category === activeCategory)
      .filter(s => !q || s.settingKey.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q))
      .sort((a, b) => a.settingKey.localeCompare(b.settingKey))
  }, [settings, activeCategory, query])

  const dirtyCount = Object.keys(edits).length
  const hasEdits = dirtyCount > 0

  const handleChange = (key: string, value: string) =>
    setEdits(prev => ({ ...prev, [key]: value }))

  const resetField = (key: string) =>
    setEdits(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })

  const resetAll = () => setEdits({})

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
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Settings"
            subtitle="Stored in PostgreSQL · applied at runtime without a restart"
          />

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 mt-2">
            <CategorySidebar
              activeCategory={activeCategory}
              onChange={setActiveCategory}
              counts={countsByCategory}
            />

            <section className="min-w-0">
              <CategoryHeader def={activeDef} count={countsByCategory[activeCategory] ?? 0} />

              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  className="input pl-9"
                  placeholder={`Search in ${activeDef.label.toLowerCase()}…`}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>

              {visible.length === 0 ? (
                <EmptyState
                  icon={<activeDef.icon size={20} />}
                  title={query ? 'No matches' : 'No settings in this category'}
                  description={query
                    ? 'Try a different query or clear the search.'
                    : 'This category is empty for now. Add settings via a Flyway migration.'}
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
                        onReset={resetField}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>
          </div>
        </div>
      </div>

      <SaveBar
        dirtyCount={dirtyCount}
        saving={saving}
        savedFlash={savedFlash}
        onSave={handleSave}
        onDiscard={resetAll}
        onReload={load}
      />
    </div>
  )
}

interface CategorySidebarProps {
  activeCategory: Category
  onChange: (c: Category) => void
  counts: Record<string, number>
}

function CategorySidebar({ activeCategory, onChange, counts }: CategorySidebarProps) {
  return (
    <aside className="space-y-1 lg:sticky lg:top-2 self-start">
      {CATEGORIES.map(cat => {
        const active = cat.id === activeCategory
        const Icon = cat.icon
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={clsx(
              'relative w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              active
                ? 'bg-gray-800/80 text-gray-100'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
            )}
          >
            {active && (
              <motion.span
                layoutId="cat-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-violet-500"
              />
            )}
            <Icon size={14} className={clsx('shrink-0', active ? cat.accent : 'text-gray-500')} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{cat.label}</p>
              <p className="text-[10px] font-mono text-gray-600">{cat.id}</p>
            </div>
            <span className="text-[11px] font-mono text-gray-500 shrink-0">
              {counts[cat.id] ?? 0}
            </span>
          </button>
        )
      })}
    </aside>
  )
}

function CategoryHeader({ def, count }: { def: CategoryDef; count: number }) {
  const Icon = def.icon
  return (
    <motion.div
      key={def.id}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="card p-4 mb-4 flex items-center gap-3"
    >
      <div className={clsx('w-10 h-10 rounded-lg border flex items-center justify-center',
        def.accent,
        'bg-gray-900 border-gray-800'
      )}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-100">{def.label}</p>
        <p className="text-xs text-gray-500">{def.description}</p>
      </div>
      <span className="badge bg-gray-800 border border-gray-700 text-gray-400">{count} setting{count === 1 ? '' : 's'}</span>
    </motion.div>
  )
}

interface SaveBarProps {
  dirtyCount: number
  saving: boolean
  savedFlash: boolean
  onSave: () => void
  onDiscard: () => void
  onReload: () => void
}

function SaveBar({ dirtyCount, saving, savedFlash, onSave, onDiscard, onReload }: SaveBarProps) {
  const visible = dirtyCount > 0 || savedFlash
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="card px-4 py-2.5 flex items-center gap-3 shadow-2xl shadow-black/40 border-violet-500/30">
            {savedFlash ? (
              <span className="flex items-center gap-2 text-sm text-emerald-300">
                <Check size={14} />
                All changes saved
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2 text-sm text-gray-300">
                  <motion.span
                    className="w-2 h-2 rounded-full bg-violet-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  {dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}
                </span>
                <button onClick={onReload} className="btn-ghost p-1.5" title="Reload from server">
                  <RefreshCw size={13} />
                </button>
                <button onClick={onDiscard} className="btn-ghost text-xs">Discard</button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-1.5 text-sm"
                >
                  <Save size={13} />
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
