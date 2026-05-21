import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { FileText, FileUp, X } from 'lucide-react'

interface FileDropzoneProps {
  onFile: (file: File, text: string) => void
  disabled?: boolean
  accept?: string
  maxBytes?: number
}

const DEFAULT_ACCEPT = '.txt,.md,.json,.csv,.html,.xml,.yml,.yaml,.log,text/*'
const DEFAULT_MAX = 5 * 1024 * 1024

export function FileDropzone({ onFile, disabled, accept = DEFAULT_ACCEPT, maxBytes = DEFAULT_MAX }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<{ name: string; bytes: number } | null>(null)

  const readFile = useCallback((file: File) => {
    setError(null)
    if (file.size > maxBytes) {
      setError(`File exceeds the ${(maxBytes / 1024 / 1024).toFixed(0)} MB limit`)
      return
    }
    const reader = new FileReader()
    reader.onerror = () => setError('Failed to read file')
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setActive({ name: file.name, bytes: file.size })
      onFile(file, text)
    }
    reader.readAsText(file)
  }, [maxBytes, onFile])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    e.target.value = ''
  }

  const clear = () => {
    setActive(null)
    setError(null)
  }

  return (
    <div className="space-y-2">
      <motion.div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        animate={{
          borderColor: dragging ? 'rgba(139, 92, 246, 0.6)' : 'rgb(55 65 81)',
          backgroundColor: dragging ? 'rgba(139, 92, 246, 0.08)' : 'rgba(17, 24, 39, 0.4)',
        }}
        className={clsx(
          'cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all',
          disabled && 'opacity-50 cursor-not-allowed',
          dragging && 'scale-[1.01]'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onSelect}
          disabled={disabled}
        />

        <motion.div
          className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-cyan-400/20 border border-violet-500/30 text-violet-300"
          animate={dragging ? { y: [-2, 2, -2] } : {}}
          transition={dragging ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : {}}
        >
          <FileUp size={18} />
        </motion.div>

        <p className="text-sm text-gray-300 font-medium">
          {dragging ? 'Drop to upload' : 'Drop a file here or click to browse'}
        </p>
        <p className="text-xs text-gray-500 font-mono mt-1">
          .txt · .md · .json · .csv · .html · .xml — up to {(maxBytes / 1024 / 1024).toFixed(0)} MB
        </p>
      </motion.div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-lg border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-sm"
          >
            <FileText size={14} className="text-violet-300 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-gray-100">{active.name}</p>
              <p className="text-[10px] font-mono text-gray-500">
                {(active.bytes / 1024).toFixed(1)} KB loaded
              </p>
            </div>
            <button onClick={clear} className="btn-ghost p-1" title="Clear">
              <X size={12} />
            </button>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm px-3 py-2"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
