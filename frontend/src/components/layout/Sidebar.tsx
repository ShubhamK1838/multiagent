import React from 'react'
import { MessageSquare, Wrench, Settings, Database, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { useConversations } from '../../hooks/useConversations'
import { formatDistanceToNow } from 'date-fns'

type View = 'chat' | 'tools' | 'settings' | 'rag'

interface SidebarProps {
  activeView: View
  onViewChange: (view: View) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { conversations, activeConversationId, setActiveConversation, createConversation } =
    useConversations()

  const handleNewChat = async () => {
    await createConversation()
    onViewChange('chat')
  }

  const navItems = [
    { id: 'chat' as View, icon: MessageSquare, label: 'Chat' },
    { id: 'tools' as View, icon: Wrench, label: 'Tools' },
    { id: 'settings' as View, icon: Settings, label: 'Settings' },
    { id: 'rag' as View, icon: Database, label: 'Knowledge' },
  ]

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-sm font-mono font-semibold text-violet-400">AI Framework</span>
        </div>
        <p className="text-xs text-gray-500 font-mono">v1.0.0</p>
      </div>

      <nav className="flex gap-1 p-2 border-b border-gray-800">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-colors',
              activeView === id
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            )}
          >
            <Icon size={16} />
            <span className="font-mono">{label}</span>
          </button>
        ))}
      </nav>

      {activeView === 'chat' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors border border-dashed border-gray-700 mb-2"
          >
            <Plus size={14} />
            <span className="font-mono">New Chat</span>
          </button>

          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => { setActiveConversation(conv.id); onViewChange('chat') }}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                activeConversationId === conv.id
                  ? 'bg-gray-800 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              )}
            >
              <div className="font-mono text-xs truncate">{conv.title || 'Untitled'}</div>
              <div className="text-xs text-gray-600 mt-0.5">
                {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
              </div>
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}
