import { useCallback, useEffect, useState } from 'react'
import { usageApi } from '../services/api'
import type { UsageSummary, ConversationUsage } from '../types'

export function useTokenUsage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [conversations, setConversations] = useState<ConversationUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, c] = await Promise.all([usageApi.summary(), usageApi.byConversation()])
      setSummary(s)
      setConversations(c)
    } catch {
      setError('Failed to load usage data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { summary, conversations, loading, error, refresh }
}
