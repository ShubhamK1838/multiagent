import React, { createContext, useContext, useRef, useCallback } from 'react'

export interface GestureEntry {
  getRect: () => DOMRect | null
  nudge: (dx: number, dy: number) => void
}

interface GestureRegistryValue {
  register: (id: string, entry: GestureEntry) => void
  unregister: (id: string) => void
  registry: React.MutableRefObject<Map<string, GestureEntry>>
}

const GestureRegistryContext = createContext<GestureRegistryValue | null>(null)

export const GestureRegistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const registry = useRef<Map<string, GestureEntry>>(new Map())

  const register = useCallback((id: string, entry: GestureEntry) => {
    registry.current.set(id, entry)
  }, [])

  const unregister = useCallback((id: string) => {
    registry.current.delete(id)
  }, [])

  return (
    <GestureRegistryContext.Provider value={{ register, unregister, registry }}>
      {children}
    </GestureRegistryContext.Provider>
  )
}

export function useGestureRegistry(): GestureRegistryValue {
  const ctx = useContext(GestureRegistryContext)
  if (!ctx) throw new Error('useGestureRegistry must be used within GestureRegistryProvider')
  return ctx
}
