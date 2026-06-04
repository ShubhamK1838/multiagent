/**
 * ServerLogPanel
 *
 * Single-Responsibility: subscribes to the /api/diagnostics/logs SSE endpoint
 * and renders color-coded log lines in real time.
 *
 * It owns no state other than the log buffer and connection status.
 * The decision of WHEN to render it belongs to the parent (DiagnosticsHUD).
 *
 * SOLID compliance:
 *  S – displays server logs and nothing else
 *  O – log line appearance can be extended via the LOG_LEVEL_STYLE registry
 *  I – exposes only `maxLines` and `className` props; nothing extraneous
 *  D – depends on the /api/diagnostics/logs SSE contract, not a concrete service class
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogLine {
  id: string;
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

// ─── Style registry (Open/Closed: add new levels without touching render logic) ──

const LOG_LEVEL_STYLE: Record<string, { text: string; badge: string; row: string }> = {
  TOOL:  { text: 'text-violet-300', badge: 'bg-violet-500/15 text-violet-400', row: 'border-violet-500/10' },
  AGENT: { text: 'text-cyan-300',   badge: 'bg-cyan-500/10 text-cyan-400',    row: 'border-cyan-500/10'   },
  WARN:  { text: 'text-amber-300',  badge: 'bg-amber-500/15 text-amber-400',  row: 'border-amber-500/10'  },
  ERROR: { text: 'text-red-300',    badge: 'bg-red-500/15 text-red-400',      row: 'border-red-500/10'    },
  INFO:  { text: 'text-emerald-300',badge: 'bg-emerald-500/10 text-emerald-400', row: 'border-emerald-500/10' },
};

const DEFAULT_STYLE = LOG_LEVEL_STYLE.INFO;

function styleFor(level: string) {
  return LOG_LEVEL_STYLE[level?.toUpperCase()] ?? DEFAULT_STYLE;
}

// ─── Log line parser ──────────────────────────────────────────────────────────

function parseLine(raw: string): LogLine {
  // Expected: [HH:mm:ss.SSS] [LEVEL] [SOURCE] message
  const match = raw.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/);
  if (match) {
    return {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: match[1],
      level: match[2],
      source: match[3],
      message: match[4],
    };
  }
  return {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: '',
    level: 'INFO',
    source: 'SYS',
    message: raw,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ServerLogPanelProps {
  /** Maximum number of lines to keep in memory (ring buffer). Default: 80 */
  maxLines?: number;
  /** Extra CSS classes for the outer container */
  className?: string;
}

export const ServerLogPanel: React.FC<ServerLogPanelProps> = ({
  maxLines = 80,
  className = '',
}) => {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false); // avoid stale closure in onmessage

  // Keep ref in sync with state so the SSE handler sees current value
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Append a parsed line respecting the ring-buffer limit
  const appendLine = useCallback((raw: string) => {
    if (pausedRef.current) return;
    const parsed = parseLine(raw);
    setLines(prev => {
      const next = [...prev, parsed];
      return next.length > maxLines ? next.slice(-maxLines) : next;
    });
  }, [maxLines]);

  // SSE subscription
  useEffect(() => {
    const es = new EventSource('/api/diagnostics/logs');

    es.onopen = () => setConnected(true);

    es.onmessage = (e: MessageEvent) => appendLine(e.data);

    es.onerror = () => {
      setConnected(false);
      es.close();
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [appendLine]);

  // Auto-scroll to bottom whenever new lines arrive (unless paused)
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, paused]);

  const handleClear = () => setLines([]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* ── Sub-header ── */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          {/* Live / Paused indicator */}
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              !connected ? 'bg-red-500' : paused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase">
            {!connected ? 'disconnected' : paused ? 'paused' : 'live'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={() => setPaused(p => !p)}
            title={paused ? 'Resume scroll' : 'Pause scroll'}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
              paused
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {paused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            title="Clear log buffer"
            className="text-[9px] font-mono text-gray-700 hover:text-red-400 transition-colors px-1"
          >
            CLR
          </button>
        </div>
      </div>

      {/* ── Log lines ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-px p-1 scrollbar-none"
        style={{ maxHeight: '180px' }}
      >
        <AnimatePresence initial={false}>
          {lines.map(line => {
            const s = styleFor(line.level);
            return (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1 }}
                className={`flex items-start gap-1.5 text-[9px] leading-relaxed px-1.5 py-0.5 rounded border ${s.row} bg-black/20`}
              >
                {/* Timestamp */}
                {line.timestamp && (
                  <span className="shrink-0 text-gray-700 tabular-nums w-[68px]">{line.timestamp}</span>
                )}

                {/* Level badge */}
                <span className={`shrink-0 font-bold px-1 rounded ${s.badge} w-[34px] text-center`}>
                  {line.level.substring(0, 4)}
                </span>

                {/* Source */}
                <span className="shrink-0 text-gray-600 w-[52px] truncate" title={line.source}>
                  {line.source}
                </span>

                {/* Message */}
                <span className={`flex-1 min-w-0 truncate ${s.text}`} title={line.message}>
                  {line.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {lines.length === 0 && (
          <p className="text-center text-[9px] text-gray-800 font-mono pt-4">
            {connected ? 'Awaiting events…' : 'Backend offline'}
          </p>
        )}
      </div>
    </div>
  );
};
