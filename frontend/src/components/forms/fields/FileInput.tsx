import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

interface FileInputProps {
  onChange: (v: string) => void
  accept?: string
  hasError: boolean
  value?: string
}

export function FileInput({ onChange, accept, hasError }: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-4 cursor-pointer text-center transition-colors ${
        dragging ? 'border-violet-500 bg-violet-600/10' :
        hasError ? 'border-red-500 bg-red-900/10' :
        'border-gray-700 hover:border-gray-500 bg-gray-800/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {fileName ? (
        <div className="flex items-center justify-center gap-2 text-sm font-mono text-violet-300">
          <Upload size={14} />
          <span>{fileName}</span>
          <button type="button" onClick={e => { e.stopPropagation(); setFileName(null); onChange('') }}>
            <X size={14} className="text-gray-500 hover:text-red-400" />
          </button>
        </div>
      ) : (
        <div className="text-gray-500 text-sm font-mono">
          <Upload size={20} className="mx-auto mb-1" />
          <p>Click or drag file here</p>
        </div>
      )}
    </div>
  )
}
