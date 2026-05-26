import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { VizPanelBase } from './VizPanelBase'
import type { CodeData } from '../../../types'

interface CodePanelProps {
  data: CodeData
  onClose: () => void
}

const CODE_STYLE = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: 'transparent',
    margin: 0,
    padding: '8px 12px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineHeight: 1.6,
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    background: 'transparent',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
}

export const CodePanel: React.FC<CodePanelProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false)
  const lineCount = data.code.split('\n').length

  const handleCopy = () => {
    navigator.clipboard.writeText(data.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const badge = `${data.language} · ${lineCount}L`

  const footer = (
    <div className="flex items-center justify-between">
      <span className="text-[8px] font-mono text-emerald-400/25 uppercase tracking-widest">
        {lineCount} lines
      </span>
      <button
        onClick={handleCopy}
        className="text-[8px] font-mono text-emerald-400/40 hover:text-emerald-300/70 transition-colors uppercase tracking-widest"
      >
        {copied ? '✓ copied' : 'copy'}
      </button>
    </div>
  )

  return (
    <VizPanelBase
      id="viz-code"
      title={data.title} accent="#4ade80" accentRgb="74,222,128"
      badge={badge} onClose={onClose}
      initialRight={20} initialTop={300} width={520} maxHeight="70vh"
      footer={footer}
    >
      <SyntaxHighlighter
        language={data.language}
        style={CODE_STYLE}
        showLineNumbers
        lineNumberStyle={{ color: 'rgba(74,222,128,0.2)', fontSize: 9, minWidth: 32 }}
        wrapLongLines={false}
      >
        {data.code}
      </SyntaxHighlighter>
    </VizPanelBase>
  )
}
