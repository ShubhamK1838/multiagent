import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Plus, MessagesSquare, Trash2 } from 'lucide-react'
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
    <aside className="w-64 bg-gray-900/70 backdrop-blur-sm border-r border-gray-800 flex flex-col h-screen shrink-0">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <MessagesSquare size={14} className="text-violet-400" />
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-300">
          Conversations
        </span>
      </div>

      <div className="p-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm
                     text-gray-300 hover:text-white hover:bg-violet-600/15 hover:border-violet-500/40
                     border border-dashed border-gray-700 transition-colors"
        >
          <Plus size={14} />
          <span className="font-medium">New chat</span>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
        <AnimatePresence initial={false}>
          {conversations.map(conv => {
            const active = activeConversationId === conv.id
            return (
              <motion.div
                layout
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8, height: 0, marginTop: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                className={clsx(
                  'group relative rounded-lg transition-colors',
                  active ? 'bg-gray-800' : 'hover:bg-gray-800/60'
                )}
              >
                <button
                  onClick={() => setActiveConversation(conv.id)}
                  className={clsx(
                    'w-full text-left pl-3 pr-8 py-2 text-sm',
                    active ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {active && (
                      <motion.span
                        layoutId="conv-indicator"
                        className="w-1 h-4 bg-violet-500 rounded-full"
                      />
                    )}
                    <span className="truncate flex-1 text-xs">{conv.title || 'Untitled'}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 font-mono mt-0.5 ml-3">
                    {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                  </div>
                </button>

                <button
                  onClick={(e) => askDelete(e, conv)}
                  className={clsx(
                    'absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md',
                    'text-gray-500 hover:text-red-300 hover:bg-red-500/10',
                    'opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity'
                  )}
                  title="Delete chat"
                  aria-label="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {conversations.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-6 font-mono">No conversations yet</p>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this chat?"
        message={pendingDelete
          ? `"${pendingDelete.title || 'Untitled'}" and all of its messages will be permanently removed.`
          : ''}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </aside>
  )
}
