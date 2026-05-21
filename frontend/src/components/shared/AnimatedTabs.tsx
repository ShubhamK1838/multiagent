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
    <div className="inline-flex gap-1 bg-gray-900/80 backdrop-blur-sm rounded-xl p-1 border border-gray-800">
      {options.map(opt => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={clsx(
              'relative px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors duration-150 z-10',
              active ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-violet-600 -z-10"
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
