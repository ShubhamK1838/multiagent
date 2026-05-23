import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TickerData {
  uptime?: string;
  activeConversations?: number;
  activeOperations?: number;
  jvmHeapMb?: number;
  availableProcessors?: number;
}

export const TickerTape: React.FC = () => {
  const [stats, setStats] = useState<TickerData>({});
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const tick = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch('/api/diagnostics/ticker');
        const data = await r.json();
        setStats(data);
      } catch { /* silent */ }
    };
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, []);

  const segments = [
    { tag: 'SYS', text: `Uptime: ${stats.uptime || '00:00:00'} · Cores: ${stats.availableProcessors ?? '—'} · Heap: ${stats.jvmHeapMb ?? '—'}MB` },
    { tag: 'NET', text: `All network channels nominal · Firewall active · Encryption: AES-256` },
    { tag: 'INTEL', text: `Active conversations: ${stats.activeConversations ?? 0} · Active operations: ${stats.activeOperations ?? 0}` },
    { tag: 'SEC', text: `Perimeter secure · No anomalies detected · Clearance Level 1 active` },
    { tag: 'TIME', text: currentTime },
  ];

  const content = segments.map(s => `[${s.tag}] ${s.text}`).join('   ·   ');

  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-black/90 border-t border-cyan-500/30 flex items-center overflow-hidden z-50">
      {/* Left badge */}
      <div className="shrink-0 flex items-center gap-2 px-3 border-r border-cyan-500/20 h-full bg-cyan-950/40">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[9px] font-mono font-bold text-cyan-400 tracking-widest">JARVIS</span>
      </div>

      {/* Scrolling content */}
      <div className="flex-1 overflow-hidden relative">
        <motion.div
          className="flex whitespace-nowrap font-mono text-[10px] text-cyan-600"
          animate={{ x: ['100vw', '-100%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        >
          <span className="pr-16">{content}</span>
          <span className="pr-16">{content}</span>
        </motion.div>
      </div>

      {/* Right — live clock */}
      <div className="shrink-0 px-3 border-l border-cyan-500/20 h-full flex items-center bg-cyan-950/40">
        <span className="font-mono text-[10px] text-cyan-400 tabular-nums">{currentTime}</span>
      </div>
    </div>
  );
};
