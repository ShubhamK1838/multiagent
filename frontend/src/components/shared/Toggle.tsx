import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

/**
 * Pill toggle. Critical detail: framer-motion's animate={{ x }} writes the
 * full `transform` property each frame, which would overwrite any Tailwind
 * `-translate-y-1/2`. We center the thumb via numeric `top` instead so the
 * two systems don't fight.
 */
export function Toggle({ checked, onChange, label, disabled, size = 'md' }: ToggleProps) {
  const cfg = size === 'sm'
    ? { track: 'h-5 w-9',  thumbDim: 'h-3.5 w-3.5', top: 3,  off: 3,  on: 19 }
    : { track: 'h-6 w-11', thumbDim: 'h-4 w-4',     top: 4,  off: 4,  on: 24 }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        'relative inline-flex shrink-0 rounded-full transition-colors duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
        cfg.track,
        checked ? 'bg-violet-600' : 'bg-gray-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <motion.span
        className={clsx('absolute rounded-full bg-white shadow-md', cfg.thumbDim)}
        style={{ top: cfg.top, left: 0 }}
        animate={{ x: checked ? cfg.on : cfg.off }}
        transition={{ type: 'spring', damping: 24, stiffness: 420, mass: 0.6 }}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  )
}
