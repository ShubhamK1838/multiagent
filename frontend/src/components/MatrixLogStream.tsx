import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogLine {
  id: string;
  raw: string;
  level: string;
  source: string;
  message: string;
  timestamp: string;
}

function parseLine(raw: string): LogLine {
  // Expected format: [HH:mm:ss.SSS] [LEVEL] [SOURCE] message
  const match = raw.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/);
  if (match) {
    return { id: crypto.randomUUID(), raw, level: match[2], source: match[3], message: match[4], timestamp: match[1] };
  }
  return { id: crypto.randomUUID(), raw, level: 'INFO', source: 'SYS', message: raw, timestamp: '' };
}

function levelColor(level: string): string {
  switch (level.toUpperCase()) {
    case 'TOOL':  return 'text-violet-400';
    case 'AGENT': return 'text-cyan-300';
    case 'WARN':  return 'text-amber-400';
    case 'ERROR': return 'text-red-400';
    default:      return 'text-emerald-400';
  }
}

function levelBg(level: string): string {
  switch (level.toUpperCase()) {
    case 'TOOL':  return 'bg-violet-500/10 border-violet-500/20';
    case 'AGENT': return 'bg-cyan-500/5 border-cyan-500/10';
    case 'WARN':  return 'bg-amber-500/10 border-amber-500/20';
    case 'ERROR': return 'bg-red-500/10 border-red-500/20';
    default:      return 'bg-emerald-500/5 border-emerald-500/10';
  }
}

export const MatrixLogStream: React.FC = () => {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource('/api/diagnostics/logs');

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      const parsed = parseLine(event.data);
      setLogs(prev => {
        const updated = [...prev, parsed];
        return updated.length > 120 ? updated.slice(-120) : updated;
      });
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
    };

    return () => es.close();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black/60 backdrop-blur-md border border-green-500/20 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,255,100,0.05)] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-green-500/20 bg-black/40 shrink-0">
        <span className="text-[10px] text-green-500 tracking-widest uppercase">System Matrix Log</span>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[9px] text-green-700">{connected ? 'LIVE' : 'DISCONNECTED'}</span>
        </div>
      </div>

      {/* Log lines */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className={`flex gap-1.5 text-[10px] leading-snug px-2 py-0.5 rounded border ${levelBg(log.level)}`}
            >
              {log.timestamp && (
                <span className="text-[9px] text-gray-700 shrink-0">{log.timestamp}</span>
              )}
              <span className={`shrink-0 font-bold w-10 ${levelColor(log.level)}`}>
                {log.level.substring(0, 5)}
              </span>
              <span className="text-gray-500 shrink-0 w-20 truncate" title={log.source}>
                {log.source}
              </span>
              <span className={`flex-1 truncate ${levelColor(log.level)} opacity-90`} title={log.message}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {!connected && logs.length === 0 && (
          <div className="text-center text-green-900 text-[10px] pt-8">
            Awaiting backend connection...
          </div>
        )}
      </div>
    </div>
  );
};
