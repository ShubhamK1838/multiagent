import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, RefreshCw, Users, Pencil, Trash2 } from 'lucide-react'
import { useAgentDefinitions } from './useAgentDefinitions'
import { AgentRoleFormModal } from './AgentRoleFormModal'
import { PageHeader } from '../shared/PageHeader'
import { EmptyState } from '../shared/EmptyState'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { LoadingDots } from '../shared/LoadingDots'
import { aiModelApi } from '../../services/api'
import type { AgentDefinition, AgentDefinitionInput, AiModel } from '../../types'

export function AgentRolesPanel() {
  const { roles, loading, error, refresh, create, update, remove } = useAgentDefinitions()
  const [models, setModels] = useState<AiModel[]>([])
  const [editing, setEditing] = useState<AgentDefinition | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<AgentDefinition | null>(null)

  useEffect(() => {
    aiModelApi.listEnabled().then(setModels).catch(() => setModels([]))
  }, [])

  const modelName = (id: string | null) =>
    id ? (models.find(m => m.id === id)?.name ?? 'Unknown model') : 'Default model'

  const handleCreate = () => { setEditing(null); setShowForm(true) }
  const handleEdit = (r: AgentDefinition) => { setEditing(r); setShowForm(true) }

  const handleSubmit = async (input: AgentDefinitionInput) => {
    if (editing) await update(editing.id, input)
    else await create(input)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await remove(deleting.id)
    setDeleting(null)
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Agent Team"
          subtitle={`${roles.length} role${roles.length === 1 ? '' : 's'} · used when multi-agent mode is on`}
          actions={
            <>
              <button onClick={refresh} className="btn-ghost flex items-center gap-2" title="Refresh">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                <Plus size={14} /> Add role
              </button>
            </>
          }
        />

        {error && (
          <div className="card p-3 mb-4 border-red-500/40 bg-red-500/10 text-red-300 text-sm">{error}</div>
        )}

        {loading && roles.length === 0 ? (
          <div className="flex items-center justify-center py-16"><LoadingDots /></div>
        ) : roles.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="No agent roles yet"
            description="Add roles like Planner, Researcher, Executor, Critic, and Synthesizer to build your team."
            action={
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2 mx-auto">
                <Plus size={14} /> Add your first role
              </button>
            }
          />
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" layout>
            <AnimatePresence mode="popLayout">
              {roles.map(role => (
                <motion.div
                  key={role.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="card p-4 flex flex-col gap-2"
                  style={{ borderColor: role.enabled ? `${role.color ?? '#38bdf8'}55` : 'rgba(100,116,139,0.25)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: role.color ?? '#38bdf8' }} />
                    <span className="text-sm font-semibold text-gray-100 truncate flex-1">{role.displayName}</span>
                    {!role.enabled && <span className="text-[10px] font-mono text-gray-500 uppercase">off</span>}
                  </div>
                  <div className="text-[11px] font-mono text-gray-500">{role.roleKey}</div>
                  <p className="text-xs text-gray-400 line-clamp-3">{role.systemPrompt}</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 mt-1">
                    <span className="truncate">⌑ {modelName(role.modelId)}</span>
                    <span>· {role.maxIterations} it</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <button onClick={() => handleEdit(role)} className="btn-ghost p-1.5" title="Edit"><Pencil size={13} /></button>
                    <button onClick={() => setDeleting(role)} className="btn-ghost p-1.5 text-red-400/80 hover:text-red-300" title="Delete"><Trash2 size={13} /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AgentRoleFormModal
        open={showForm}
        editing={editing}
        models={models}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete this role?"
        message={deleting ? `"${deleting.displayName}" will be removed from the team.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
