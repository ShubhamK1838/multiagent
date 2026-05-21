import { clsx } from 'clsx'

interface HudCornerProps {
  size?: number
  color?: string
  className?: string
}

export function HudCorner({ size = 12, color = 'currentColor', className }: HudCornerProps) {
  const s = size
  return (
    <span aria-hidden className={clsx('absolute inset-0 pointer-events-none', className)}>
      {/* top-left */}
      <svg className="absolute top-0 left-0" width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <path d={`M${s} 2 L2 2 L2 ${s}`} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
      {/* top-right */}
      <svg className="absolute top-0 right-0" width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <path d={`M0 2 L${s-2} 2 L${s-2} ${s}`} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
      {/* bottom-left */}
      <svg className="absolute bottom-0 left-0" width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <path d={`M${s} ${s-2} L2 ${s-2} L2 0`} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
      {/* bottom-right */}
      <svg className="absolute bottom-0 right-0" width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <path d={`M0 ${s-2} L${s-2} ${s-2} L${s-2} 0`} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    </span>
  )
}
