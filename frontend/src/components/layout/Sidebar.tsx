import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Plus, Trash2, Radio } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useConversations } from '../../hooks/useConversations'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import type { Conversation } from '../../types'

interface SidebarProps {
  onNewChat: () => void
}

export function Sidebar({ onNewChat }: SidebarProps) {
  const { conversations, activeConversationId, setActiveConversation, deleteConversation } = useConversations()
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const askDelete = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation()
    setPendingDelete(conv)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteConversation(pendingDelete.id)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <aside className="w-60 flex flex-col h-screen shrink-0"
      style={{ background: 'rgba(3, 15, 28, 0.9)', borderRight: '1px solid rgba(0,212,255,0.1)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        <Radio size={12} style={{ color: '#00d4ff' }} />
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase"
          style={{ color: 'rgba(0,212,255,0.6)' }}
        >
          MISSIONS LOG
        </span>
        <span className="ml-auto text-[10px] font-mono"
          style={{ color: 'rgba(0,212,255,0.3)' }}
        >
          [{conversations.length}]
        </span>
      </div>

      {/* New chat */}
      <div className="p-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-mono font-bold tracking-widest uppercase transition-all"
          style={{
            color: 'rgba(0,212,255,0.7)',
            border: '1px dashed rgba(0,212,255,0.25)',
          }}
        >
          <Plus size={12} />
          NEW MISSION
        </motion.button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        <AnimatePresence initial={false}>
          {conversations.map((conv, idx) => {
            const active = activeConversationId === conv.id
            return (
              <motion.div
                layout
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8, height: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                className={clsx('group relative transition-colors', active ? '' : '')}
                style={{
                  background: active ? 'rgba(0,212,255,0.06)' : 'transparent',
                  borderLeft: active ? '2px solid #00d4ff' : '2px solid transparent',
                }}
              >
                <button
                  onClick={() => setActiveConversation(conv.id)}
                  className="w-full text-left pl-3 pr-8 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px]"
                      style={{ color: active ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.2)' }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className={clsx('truncate flex-1 font-mono text-[11px]',
                      active ? 'text-cyan-200' : 'text-cyan-700 group-hover:text-cyan-500'
                    )}>
                      {conv.title || 'UNTITLED MISSION'}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono mt-0.5 pl-5"
                    style={{ color: 'rgba(0,212,255,0.25)' }}
                  >
                    {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true }).toUpperCase()}
                  </div>
                </button>

                <button
                  onClick={(e) => askDelete(e, conv)}
                  className={clsx(
                    'absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5',
                    'opacity-0 group-hover:opacity-100 transition-opacity'
                  )}
                  style={{ color: 'rgba(248,113,113,0.5)' }}
                  title="Abort mission"
                >
                  <Trash2 size={11} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {conversations.length === 0 && (
          <p className="text-[10px] font-mono text-center py-8 tracking-widest"
            style={{ color: 'rgba(0,212,255,0.2)' }}
          >
            NO MISSIONS LOGGED
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 font-mono text-[9px] tracking-widest"
        style={{ borderTop: '1px solid rgba(0,212,255,0.08)', color: 'rgba(0,212,255,0.2)' }}
      >
        STARK INDUSTRIES · AI CORE
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Abort this mission?"
        message={pendingDelete
          ? `"${pendingDelete.title || 'Untitled'}" and all messages will be permanently purged.`
          : ''}
        confirmLabel={deleting ? 'Purging…' : 'Abort'}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </aside>
  )
}
