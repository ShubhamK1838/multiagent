import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import {
  MessageSquare, Wrench, Settings, Database, Sparkles
} from 'lucide-react'

export type View = 'chat' | 'models' | 'tools' | 'settings' | 'rag'

interface TopNavProps {
  activeView: View
  onChange: (view: View) => void
}

const ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'chat',     label: 'Chat',      icon: MessageSquare },
  { id: 'models',   label: 'Models',    icon: Sparkles },
  { id: 'tools',    label: 'Tools',     icon: Wrench },
  { id: 'rag',      label: 'Knowledge', icon: Database },
  { id: 'settings', label: 'Settings',  icon: Settings },
]

export function TopNav({ activeView, onChange }: TopNavProps) {
  return (
    <header className="h-14 border-b border-gray-800 bg-gray-950/70 backdrop-blur-sm flex items-center px-4 gap-4 shrink-0 z-20">
      <div className="flex items-center gap-2 mr-4">
        <motion.div
          className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={14} />
        </motion.div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-100">AI Framework</p>
          <p className="text-[10px] font-mono text-gray-500">v1.0.0</p>
        </div>
      </div>

      <nav className="flex items-center gap-1">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeView === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={clsx(
                'relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                active ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {active && (
                <motion.span
                  layoutId="topnav-bg"
                  className="absolute inset-0 rounded-lg bg-violet-600/20 border border-violet-500/40 -z-10"
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                />
              )}
              <Icon size={14} />
              <span className="font-medium">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-500 font-mono">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          connected
        </span>
      </div>
    </header>
  )
}
