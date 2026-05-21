import { motion } from 'framer-motion'

interface LoadingDotsProps {
  color?: string
  size?: number
}

export function LoadingDots({ color = 'bg-violet-400', size = 6 }: LoadingDotsProps) {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Loading">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className={`rounded-full ${color}`}
          style={{ width: size, height: size }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.05, 0.8],
          }}
          transition={{
            duration: 1.1,
            delay: i * 0.15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  )
}
