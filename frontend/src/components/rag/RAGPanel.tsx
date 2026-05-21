import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Search, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react'
import { ragApi } from '../../services/api'
import { PageHeader } from '../shared/PageHeader'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function RAGPanel() {
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [content, setContent] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const ingest = async () => {
    if (!title || !content) return
    setStatus('loading')
    try {
      await ragApi.ingest(title, content, source)
      setStatus('success')
      setMessage(`Document "${title}" ingested successfully`)
      setTitle(''); setSource(''); setContent('')
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Ingestion failed')
    }
  }

  const search = async () => {
    if (!query) return
    setStatus('loading')
    try {
      const data = await ragApi.search(query)
      setResults(data.results ?? '')
      setStatus('idle')
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Search failed')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Knowledge Base"
          subtitle="RAG · pgvector + Ollama embeddings"
        />

        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="card p-3 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-sm flex items-center gap-2"
            >
              <CheckCircle size={14} /> {message}
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="card p-3 border-red-500/40 bg-red-500/10 text-red-300 text-sm flex items-center gap-2"
            >
              <AlertCircle size={14} /> {message}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div className="card p-5 space-y-4" layout>
          <h2 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
            <Upload size={14} />
            Ingest document
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1.5">Title *</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title" />
            </div>
            <div>
              <label className="label block mb-1.5">Source URL</label>
              <input className="input" value={source} onChange={e => setSource(e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <div>
            <label className="label block mb-1.5">Content *</label>
            <textarea
              className="input resize-none font-mono text-xs"
              rows={8}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste document content here…"
            />
          </div>

          <button
            onClick={ingest}
            disabled={!title || !content || status === 'loading'}
            className="btn-primary flex items-center gap-2"
          >
            {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Ingest document
          </button>
        </motion.div>

        <motion.div className="card p-5 space-y-4" layout>
          <h2 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
            <Search size={14} />
            Test RAG search
          </h2>

          <div className="flex gap-2">
            <input
              className="input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search the knowledge base…"
              onKeyDown={e => e.key === 'Enter' && search()}
            />
            <button onClick={search} className="btn-secondary shrink-0 flex items-center gap-2">
              <Search size={14} />
              Search
            </button>
          </div>

          <AnimatePresence>
            {results !== null && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-gray-800/70 border border-gray-700 rounded-lg p-3"
              >
                <p className="label mb-2 flex items-center gap-1.5"><Database size={10} /> Results</p>
                <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">{results || 'No results found'}</pre>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
