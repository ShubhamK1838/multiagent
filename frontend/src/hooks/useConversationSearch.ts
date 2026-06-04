import { useCallback, useEffect, useRef, useState } from 'react'
import { chatApi } from '../services/api'
import type { SearchResult } from '../types'

/** Debounced hybrid (keyword + semantic) search over all conversation messages. */
export function useConversationSearch(debounceMs = 300) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const run = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setResults(await chatApi.search(q.trim()))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => run(query), debounceMs)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query, debounceMs, run])

  const clear = useCallback(() => { setQuery(''); setResults([]) }, [])

  return { query, setQuery, results, loading, clear }
}
