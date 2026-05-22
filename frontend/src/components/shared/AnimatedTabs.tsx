import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export interface TabOption<T extends string> {
  id: T
  label: string
  count?: number
}

interface AnimatedTabsProps<T extends string> {
  options: TabOption<T>[]
  value: T
  onChange: (id: T) => void
  layoutId?: string
}

export function AnimatedTabs<T extends string>({ options, value, onChange, layoutId = 'tab-indicator' }: AnimatedTabsProps<T>) {
  return (
    <div className="inline-flex gap-1 bg-jarvis-panel backdrop-blur-sm rounded-none p-1 border border-jarvis-cyan/20">
      {options.map(opt => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={clsx(
              'relative px-4 py-1.5 rounded-none text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 z-10',
              active ? 'text-white' : 'text-jarvis-cyan/60 hover:text-jarvis-cyan'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-none border border-jarvis-cyan bg-jarvis-cyan/20 -z-10"
                style={{ boxShadow: 'inset 0 0 10px rgba(0,212,255,0.2)' }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              />
            )}
            <span className="relative">
              {opt.label}
              {typeof opt.count === 'number' && (
                <span className={clsx('ml-1.5 text-[10px] opacity-80')}>
                  {opt.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
