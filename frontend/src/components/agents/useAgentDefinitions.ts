import { useCallback, useEffect, useState } from 'react'
import { agentDefinitionApi } from '../../services/api'
import type { AgentDefinition, AgentDefinitionInput } from '../../types'

export function useAgentDefinitions() {
  const [roles, setRoles] = useState<AgentDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRoles(await agentDefinitionApi.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load agent roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const create = useCallback(async (input: AgentDefinitionInput) => {
    const created = await agentDefinitionApi.create(input)
    setRoles(prev => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, input: AgentDefinitionInput) => {
    const updated = await agentDefinitionApi.update(id, input)
    setRoles(prev => prev.map(r => (r.id === id ? updated : r)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await agentDefinitionApi.delete(id)
    setRoles(prev => prev.filter(r => r.id !== id))
  }, [])

  return { roles, loading, error, refresh, create, update, remove }
}
