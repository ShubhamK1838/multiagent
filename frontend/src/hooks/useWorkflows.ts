import { useState, useEffect, useCallback } from 'react'
import { workflowApi } from '../services/api'
import type { WorkflowWithSteps } from '../types'

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowWithSteps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setWorkflows(await workflowApi.list())
    } catch {
      setError('Failed to load workflows.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const runWorkflow = useCallback(async (name: string, conversationId?: string) => {
    const result = await workflowApi.run(name, conversationId)
    return result.result
  }, [])

  const deleteWorkflow = useCallback(async (name: string) => {
    await workflowApi.delete(name)
    setWorkflows(prev => prev.filter(w => w.workflow.name !== name))
  }, [])

  return { workflows, loading, error, refresh, runWorkflow, deleteWorkflow }
}
