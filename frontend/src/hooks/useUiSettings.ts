import { useEffect, useState, useCallback } from 'react'
import { settingsApi } from '../services/api'
import type { SystemSetting } from '../types'

const REFRESH_INTERVAL_MS = 15_000

export function useUiSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const all = await settingsApi.getAll()
      const map = all
        .filter((s: SystemSetting) => s.category === 'UI')
        .reduce<Record<string, string>>((acc, s) => {
          acc[s.settingKey] = s.settingValue ?? ''
          return acc
        }, {})
      setSettings(map)
    } catch (err) {
      console.warn('Failed to load UI settings', err)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(load, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [load])

  const getBoolean = useCallback(
    (key: string, fallback = false) => {
      const raw = settings[key]
      if (raw == null) return fallback
      return raw.toLowerCase() === 'true'
    },
    [settings]
  )

  return { settings, getBoolean, refresh: load }
}
