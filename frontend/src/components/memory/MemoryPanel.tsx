import React, { useEffect, useState } from 'react'
import { memoryApi } from '../../services/api'
import type { ConversationSummary } from '../../types'

export const MemoryPanel: React.FC = () => {
  const [summaries, setSummaries] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setSummaries(await memoryApi.listSummaries())
    } catch {
      setError('Failed to load session memory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return }
    setClearing(true)
    try {
      await memoryApi.clearAll()
      setSummaries([])
      setConfirmClear(false)
    } catch {
      setError('Failed to clear memory.')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Session Memory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Auto-summaries injected into each new conversation so the AI remembers your past sessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleClear}
            disabled={clearing || summaries.length === 0}
            className={`px-3 py-1.5 text-sm rounded transition-colors disabled:opacity-40 ${
              confirmClear
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20'
            }`}
          >
            {confirmClear ? 'Confirm Wipe' : 'Wipe Memory'}
          </button>
          {confirmClear && (
            <button
              onClick={() => setConfirmClear(false)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <span className="text-sm">Loading memory...</span>
        </div>
      ) : summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-4xl mb-3">🧠</span>
          <p className="text-sm">No session memory yet.</p>
          <p className="text-xs mt-1 text-gray-400">Summaries are saved automatically after each conversation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map(s => (
            <SummaryCard key={s.id} summary={s} />
          ))}
        </div>
      )}
    </div>
  )
}

const SummaryCard: React.FC<{ summary: ConversationSummary }> = ({ summary }) => {
  const date = new Date(summary.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-start justify-between gap-4 mb-2">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed flex-1">{summary.summary}</p>
        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 mt-0.5">{date}</span>
      </div>

      {summary.keyPaths && summary.keyPaths.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {summary.keyPaths.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800"
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
