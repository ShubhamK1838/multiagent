import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi } from '../services/api';
import { useHudConversation } from '../hooks/useHudConversation';
import type { AgentEvent } from '../types';

interface TerminalLine {
  id: string;
  type: 'user' | 'assistant' | 'thinking' | 'tool_call' | 'tool_result' | 'system' | 'error' | 'token';
  text: string;
  timestamp: string;
  streaming?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  user: 'text-white',
  assistant: 'text-cyan-300',
  thinking: 'text-amber-400',
  tool_call: 'text-violet-400',
  tool_result: 'text-emerald-400',
  system: 'text-cyan-600',
  error: 'text-red-400',
  token: 'text-cyan-200',
};

const TYPE_PREFIX: Record<string, string> = {
  user: '>>',
  assistant: 'AI',
  thinking: '💭',
  tool_call: '⚙',
  tool_result: '✓',
  system: '///',
  error: '✖',
  token: 'AI',
};

function formatTime() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const ConversationalTerminal: React.FC = () => {
  const { conversationId, loading, resetConversation } = useHudConversation();
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Append a line
  const addLine = (type: TerminalLine['type'], text: string) => {
    setLines(prev => [...prev, { id: crypto.randomUUID(), type, text, timestamp: formatTime() }]);
  };

  // Boot message
  useEffect(() => {
    if (!loading && conversationId) {
      addLine('system', `J.A.R.V.I.S. HUD Terminal initialized`);
      addLine('system', `Session: ${conversationId.substring(0, 8)}... — Type a command to begin`);
    }
  }, [loading, conversationId]);

  // Subscribe to SSE for this conversation
  useEffect(() => {
    if (!conversationId) return;

    let streamingLine: string = '';

    const es = new EventSource(`/api/v1/chat/conversations/${conversationId}/events`);
    esRef.current = es;

    const handleType = (type: string) => (e: MessageEvent) => {
      const event: AgentEvent = JSON.parse(e.data);
      switch (type) {
        case 'AGENT_START':
          setIsProcessing(true);
          streamingLine = '';
          setStreamBuffer('');
          break;
        case 'TOKEN':
          streamingLine += event.content || '';
          setStreamBuffer(streamingLine);
          break;
        case 'AGENT_END':
          setIsProcessing(false);
          if (streamingLine.trim()) {
            addLine('assistant', streamingLine);
            streamingLine = '';
            setStreamBuffer('');
          } else if (event.content?.trim()) {
            addLine('assistant', event.content);
          }
          break;
        case 'THINKING':
          if (event.content?.trim()) {
            addLine('thinking', event.content.substring(0, 200) + (event.content.length > 200 ? '...' : ''));
          }
          break;
        case 'TOOL_CALL': {
          const tool = event.metadata?.tool as string || event.content || 'unknown';
          addLine('tool_call', `Invoking: ${tool}`);
          break;
        }
        case 'TOOL_RESULT':
          addLine('tool_result', (event.content || '').substring(0, 200));
          break;
        case 'TOOL_ERROR':
          addLine('error', `Tool error: ${event.content}`);
          break;
        case 'ERROR':
          setIsProcessing(false);
          addLine('error', event.content || 'Unknown error');
          break;
        default:
          break;
      }
    };

    const types = ['AGENT_START', 'AGENT_END', 'TOKEN', 'THINKING', 'TOOL_CALL', 'TOOL_RESULT', 'TOOL_ERROR', 'ERROR'];
    types.forEach(t => es.addEventListener(t, handleType(t)));

    return () => { es.close(); esRef.current = null; };
  }, [conversationId]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines, streamBuffer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId || isProcessing) return;

    const msg = input.trim();
    setInput('');
    addLine('user', msg);

    try {
      await chatApi.sendMessage(conversationId, msg);
    } catch {
      addLine('error', 'Failed to send command — check backend connection');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,212,255,0.1)] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/20 bg-black/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[10px] text-cyan-500 tracking-widest uppercase ml-2">J.A.R.V.I.S. Terminal</span>
        </div>
        <div className="flex items-center gap-3">
          {isProcessing && (
            <span className="flex items-center gap-1.5 text-[9px] text-amber-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              PROCESSING
            </span>
          )}
          <button
            onClick={resetConversation}
            className="text-[9px] text-cyan-700 hover:text-cyan-400 transition-colors tracking-widest"
            title="New Session"
          >
            NEW SESSION
          </button>
        </div>
      </div>

      {/* Log area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex gap-2 text-[11px] leading-relaxed ${TYPE_COLORS[line.type] || 'text-cyan-400'}`}
            >
              <span className="text-[9px] text-cyan-900 shrink-0 pt-0.5">{line.timestamp}</span>
              <span className="shrink-0 w-5 text-center opacity-70">{TYPE_PREFIX[line.type]}</span>
              <span className="break-words min-w-0">{line.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming token buffer */}
        {streamBuffer && (
          <div className="flex gap-2 text-[11px] text-cyan-200">
            <span className="text-[9px] text-cyan-900 shrink-0 pt-0.5">{formatTime()}</span>
            <span className="shrink-0 w-5 text-center opacity-70">AI</span>
            <span className="break-words min-w-0">
              {streamBuffer}
              <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-0.5 animate-pulse" />
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2 border-t border-cyan-500/20 bg-black/40">
        <span className="text-cyan-500 text-sm">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading || isProcessing}
          placeholder={loading ? 'Initializing...' : isProcessing ? 'Processing...' : 'Enter command...'}
          className="flex-1 bg-transparent border-none outline-none text-cyan-100 text-[11px] placeholder-cyan-900 caret-cyan-400"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || isProcessing || !input.trim()}
          className="text-[9px] text-cyan-700 hover:text-cyan-400 disabled:opacity-30 transition-colors tracking-widest"
        >
          SEND
        </button>
      </form>
    </div>
  );
};
