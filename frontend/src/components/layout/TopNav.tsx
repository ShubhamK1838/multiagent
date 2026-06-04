import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { MessageSquare, Wrench, Settings, Database, Sparkles, Eye, Brain, Users, BarChart3 } from 'lucide-react'
import { ArcReactor } from '../shared/ArcReactor'

export type View = 'chat' | 'models' | 'tools' | 'settings' | 'rag' | 'hud' | 'memory' | 'agents' | 'usage'

interface TopNavProps {
  activeView: View
  onChange: (view: View) => void
}

const ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'chat',     label: 'COMMS',    icon: MessageSquare },
  { id: 'models',   label: 'NEURAL',   icon: Sparkles },
  { id: 'tools',    label: 'ARSENAL',  icon: Wrench },
  { id: 'memory',   label: 'MEMORY',   icon: Brain },
  { id: 'agents',   label: 'AGENTS',   icon: Users },
  { id: 'usage',    label: 'USAGE',    icon: BarChart3 },
  { id: 'settings', label: 'SYSTEMS',  icon: Settings },
  { id: 'rag',      label: 'KNOWLEDGE',icon: Database },
  { id: 'hud',      label: 'HUD CORE', icon: Eye },
]

export function TopNav({ activeView, onChange }: TopNavProps) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="relative h-12 border-b flex items-center px-4 gap-4 shrink-0 z-20 overflow-hidden"
      style={{ background: 'rgba(2, 11, 24, 0.95)', borderColor: 'rgba(0,212,255,0.15)' }}
    >
      {/* Bottom gradient line */}
      <span aria-hidden className="live-gradient absolute left-0 right-0 bottom-0 h-[1px] opacity-60" />

      {/* JARVIS Logo */}
      <div className="flex items-center gap-2.5 mr-4">
        <ArcReactor size={26} />
        <div className="leading-tight">
          <p className="text-xs font-mono font-bold tracking-[0.2em]" style={{ color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
            J.A.R.V.I.S.
          </p>
          <p className="text-[9px] font-mono" style={{ color: 'rgba(0,212,255,0.4)' }}>
            v4.7.0 · ONLINE
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-0.5">
        {ITEMS.map(({ id, label, icon: RawIcon }) => {
          const Icon = RawIcon as React.ComponentType<{ size?: number | string }>
          const active = activeView === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={clsx(
                'relative flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest transition-colors',
                active ? 'text-cyan-300' : 'text-cyan-800 hover:text-cyan-500'
              )}
            >
              {active && (
                <motion.span
                  layoutId="topnav-bg"
                  className="absolute inset-0 -z-10"
                  style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                />
              )}
              <Icon size={12} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Right status */}
      <div className="ml-auto flex items-center gap-4 font-mono text-[10px]">
        <span style={{ color: 'rgba(0,212,255,0.4)' }}>
          <span style={{ color: 'rgba(0,212,255,0.25)' }}>SYS:</span>
          <span style={{ color: '#00ff88' }}> ONLINE</span>
        </span>
        <span style={{ color: 'rgba(0,212,255,0.5)' }}>
          {time}
        </span>
        <span className="flex items-center gap-1.5">
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#00ff88' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span style={{ color: 'rgba(0,255,136,0.7)' }}>CONN</span>
        </span>
      </div>
    </header>
  )
}
