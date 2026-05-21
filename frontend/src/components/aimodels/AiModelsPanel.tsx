import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, RefreshCw, Search, Sparkles } from 'lucide-react'
import { ModelCard } from './ModelCard'
import { ModelFormModal } from './ModelFormModal'
import { useAiModels } from './useAiModels'
import { PageHeader } from '../shared/PageHeader'
import { EmptyState } from '../shared/EmptyState'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { LoadingDots } from '../shared/LoadingDots'
import type { AiModel, AiModelInput } from '../../types'

export function AiModelsPanel() {
  const { models, loading, error, refresh, create, update, remove, promote } = useAiModels()
  const [editing, setEditing] = useState<AiModel | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<AiModel | null>(null)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return models
    return models.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.modelId.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q)
    )
  }, [models, query])

  const handleCreate = () => { setEditing(null); setShowForm(true) }
  const handleEdit = (m: AiModel) => { setEditing(m); setShowForm(true) }

  const handleSubmit = async (input: AiModelInput) => {
    if (editing) await update(editing.id, input)
    else await create(input)
  }

  const handlePromote = async (m: AiModel) => {
    setBusyId(m.id)
    try { await promote(m.id) } finally { setBusyId(null) }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await remove(deleting.id)
    setDeleting(null)
  }

  const defaultModel = models.find(m => m.default)

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="AI Models"
          subtitle={`${models.length} model${models.length === 1 ? '' : 's'} registered`}
          actions={
            <>
              <button onClick={refresh} className="btn-ghost flex items-center gap-2" title="Refresh">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                <Plus size={14} />
                Add model
              </button>
            </>
          }
        />

        {defaultModel && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 mb-6 border-violet-500/40 bg-violet-500/5 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Active model</p>
              <p className="text-sm font-semibold text-gray-100 truncate">{defaultModel.name}</p>
            </div>
            <span className="text-xs font-mono text-violet-300/80 hidden sm:block truncate">{defaultModel.modelId}</span>
          </motion.div>
        )}

        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Search by name, model id, or provider…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {error && (
          <div className="card p-3 mb-4 border-red-500/40 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && models.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <LoadingDots />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={22} />}
            title={query ? 'No models match your search' : 'No AI models yet'}
            description={query
              ? 'Try a different query, or clear the filter.'
              : 'Add an OpenAI-compatible or Ollama model to start chatting.'}
            action={!query && (
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2 mx-auto">
                <Plus size={14} />
                Add your first model
              </button>
            )}
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filtered.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onEdit={handleEdit}
                  onDelete={setDeleting}
                  onPromote={handlePromote}
                  busy={busyId === model.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <ModelFormModal
        open={showForm}
        editing={editing}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete this model?"
        message={deleting
          ? `"${deleting.name}" will be removed from the registry. This can't be undone.`
          : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
