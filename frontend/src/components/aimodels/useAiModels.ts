import { useCallback, useEffect, useState } from 'react'
import { aiModelApi } from '../../services/api'
import type { AiModel, AiModelInput } from '../../types'

export function useAiModels() {
  const [models, setModels] = useState<AiModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await aiModelApi.list()
      setModels(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load models')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const create = useCallback(async (input: AiModelInput) => {
    const created = await aiModelApi.create(input)
    setModels(prev => [created, ...prev])
    return created
  }, [])

  const update = useCallback(async (id: string, input: Partial<AiModelInput>) => {
    const updated = await aiModelApi.update(id, input)
    setModels(prev => prev.map(m => m.id === id ? updated : m))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await aiModelApi.delete(id)
    setModels(prev => prev.filter(m => m.id !== id))
  }, [])

  const promote = useCallback(async (id: string) => {
    const updated = await aiModelApi.setDefault(id)
    setModels(prev => prev.map(m => ({ ...m, default: m.id === updated.id })))
    return updated
  }, [])

  return { models, loading, error, refresh, create, update, remove, promote }
}
