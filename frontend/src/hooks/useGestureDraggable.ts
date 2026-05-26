import { useRef, useEffect } from 'react'
import { useMotionValue } from 'framer-motion'
import { useGestureRegistry } from '../contexts/GestureRegistryContext'

export function useGestureDraggable(id: string) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const { register, unregister } = useGestureRegistry()

  useEffect(() => {
    register(id, {
      getRect: () => ref.current?.getBoundingClientRect() ?? null,
      nudge: (dx, dy) => { x.set(x.get() + dx); y.set(y.get() + dy) },
    })
    return () => unregister(id)
  }, [id, register, unregister, x, y])

  return { ref, x, y }
}
