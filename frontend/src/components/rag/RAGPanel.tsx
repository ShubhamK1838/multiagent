import React, { useState } from 'react'
import { ragApi } from '../../services/api'
import { Upload, Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function RAGPanel() {
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [content, setContent] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleIngest = async () => {
    if (!title || !content) return
    setStatus('loading')
    try {
      await ragApi.ingest(title, content, source)
      setStatus('success')
      setMessage(`Document "${title}" ingested successfully`)
      setTitle(''); setSource(''); setContent('')
    } catch (e: unknown) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Ingestion failed')
    }
  }

  const handleSearch = async () => {
    if (!query) return
    setStatus('loading')
    try {
      const data = await ragApi.search(query)
      setResults(data.results)
      setStatus('idle')
    } catch (e: unknown) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Search failed')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-100 font-mono">Knowledge Base</h1>
          <p className="text-xs text-gray-500 mt-1">RAG with pgvector + Ollama embeddings</p>
        </div>

        {status !== 'idle' && status !== 'loading' && (
          <div className={`card p-3 flex items-center gap-2 text-sm font-mono
            ${status === 'success' ? 'border-green-800 bg-green-900/20 text-green-400' : 'border-red-800 bg-red-900/20 text-red-400'}`}
          >
            {status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message}
          </div>
        )}

        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold font-mono text-violet-400 flex items-center gap-2">
            <Upload size={14} />
            Ingest Document
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1">Title *</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title" />
            </div>
            <div>
              <label className="label block mb-1">Source URL</label>
              <input className="input" value={source} onChange={e => setSource(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className="label block mb-1">Content *</label>
            <textarea
              className="input resize-none font-mono text-xs"
              rows={8}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste document content here..."
            />
          </div>

          <button
            onClick={handleIngest}
            disabled={!title || !content || status === 'loading'}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Ingest Document
          </button>
        </div>

        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold font-mono text-cyan-400 flex items-center gap-2">
            <Search size={14} />
            Test RAG Search
          </h2>

          <div className="flex gap-2">
            <input
              className="input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search the knowledge base..."
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="btn-secondary shrink-0 flex items-center gap-2">
              <Search size={14} />
              Search
            </button>
          </div>

          {results !== null && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="label mb-2">Results</p>
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">{results || 'No results found'}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
