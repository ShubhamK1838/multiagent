import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServerLogPanel } from './ServerLogPanel';
import { useUiSettings } from '../hooks/useUiSettings';

interface SystemHealth {
  status: string;
  memoryUsagePercent: number;
  systemLoadAverage: number;
  availableProcessors?: number;
  postgresStatus?: string;
  postgresLatencyMs?: number;
  ollamaStatus?: string;
  ollamaLatencyMs?: number;
  freeMemoryMB?: number;
  totalMemoryMB?: number;
}

interface OperationStatus {
  id: string;
  toolName: string;
  status: string;
  progressMessage: string;
}

// Sparkline data - keep last N samples
function useSparkline(value: number, maxSamples = 20) {
  const [history, setHistory] = useState<number[]>([]);
  useEffect(() => {
    setHistory(prev => {
      const next = [...prev, value];
      return next.length > maxSamples ? next.slice(-maxSamples) : next;
    });
  }, [value]);
  return history;
}

function Sparkline({ values, color = '#00d4ff', height = 28 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return <div style={{ height }} />;
  const max = Math.max(...values, 1);
  const w = 100 / (values.length - 1);
  const points = values.map((v, i) => `${i * w},${height - (v / max) * height}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <polygon points={`0,${height} ${points} 100,${height}`} fill={color} opacity="0.08" />
    </svg>
  );
}

function RingMeter({ percent, color = '#00d4ff', size = 52, label }: { percent: number; color?: string; size?: number; label: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x={size/2} y={size/2 + 3} textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">
          {Math.round(percent)}%
        </text>
      </svg>
      <span className="text-[8px] text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StatusPill({ label, status, latency }: { label: string; status?: string; latency?: number }) {
  const online = status === 'ONLINE';
  return (
    <div className="flex items-center justify-between text-[10px] py-1.5 px-2 rounded border border-white/5 bg-white/3">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        {latency !== undefined && <span className="text-gray-600">{latency}ms</span>}
        <span className={`flex items-center gap-1 font-bold ${online ? 'text-emerald-400' : 'text-red-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-500'} ${online ? 'animate-pulse' : ''}`} />
          {status || 'N/A'}
        </span>
      </div>
    </div>
  );
}

export const DiagnosticsHUD: React.FC = () => {
  const { getBoolean } = useUiSettings();
  const showServerLogs = getBoolean('hud.server_logs_visible', true);

  const [health, setHealth] = useState<SystemHealth>({
    status: 'ONLINE',
    memoryUsagePercent: 0,
    systemLoadAverage: 0,
  });
  const [activeOperations, setActiveOperations] = useState<Record<string, OperationStatus>>({});
  const loadHistory = useSparkline(health.systemLoadAverage);
  const memHistory = useSparkline(health.memoryUsagePercent);

  // Fetch health
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const r = await fetch('/api/diagnostics/health');
        const data = await r.json();
        setHealth({
          status: data.status || 'ONLINE',
          memoryUsagePercent: data.memoryUsagePercent || 0,
          systemLoadAverage: Math.min((data.systemLoadAverage / (data.availableProcessors || 4)) * 100, 100),
          availableProcessors: data.availableProcessors,
          postgresStatus: data.postgresStatus,
          postgresLatencyMs: data.postgresLatencyMs,
          ollamaStatus: data.ollamaStatus,
          ollamaLatencyMs: data.ollamaLatencyMs,
          freeMemoryMB: data.freeMemoryMB,
          totalMemoryMB: data.totalMemoryMB,
        });
      } catch { /* silent */ }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 5000);
    return () => clearInterval(id);
  }, []);

  // Operations SSE
  useEffect(() => {
    const es = new EventSource('/api/diagnostics/operations/stream');

    const handleUpdate = (type: string) => (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (!data?.operation) return;
      if (type === 'REMOVED') {
        setTimeout(() => {
          setActiveOperations(prev => {
            const copy = { ...prev };
            delete copy[data.operation.id];
            return copy;
          });
        }, 3000);
        // Show as completed briefly
        setActiveOperations(prev => ({ ...prev, [data.operation.id]: data.operation }));
      } else {
        setActiveOperations(prev => ({ ...prev, [data.operation.id]: data.operation }));
      }
    };

    es.addEventListener('ADDED', handleUpdate('ADDED'));
    es.addEventListener('UPDATED', handleUpdate('UPDATED'));
    es.addEventListener('REMOVED', handleUpdate('REMOVED'));
    return () => es.close();
  }, []);

  const memPct = health.memoryUsagePercent;
  const memColor = memPct > 80 ? '#ef4444' : memPct > 60 ? '#f59e0b' : '#00d4ff';
  const loadColor = health.systemLoadAverage > 80 ? '#ef4444' : health.systemLoadAverage > 50 ? '#f59e0b' : '#00ff88';

  return (
    <div className="flex flex-col gap-3 bg-black/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-4 font-mono text-cyan-400 shadow-[0_0_25px_rgba(0,212,255,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2">
        <h3 className="text-[10px] uppercase tracking-widest text-cyan-500">Core Diagnostics</h3>
        <span className={`text-[9px] font-bold ${health.status === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'}`}>
          {health.status}
        </span>
      </div>

      {/* Ring meters */}
      <div className="flex items-center justify-around py-1">
        <RingMeter percent={memPct} color={memColor} label="Memory" />
        <RingMeter percent={health.systemLoadAverage} color={loadColor} label="CPU Load" />
      </div>

      {/* Memory sparkline */}
      <div>
        <div className="flex justify-between text-[9px] text-gray-600 mb-1">
          <span>MEM TREND</span>
          <span>{health.freeMemoryMB !== undefined ? `${health.freeMemoryMB}MB free` : ''}</span>
        </div>
        <Sparkline values={memHistory} color={memColor} height={24} />
      </div>

      {/* Load sparkline */}
      <div>
        <div className="flex justify-between text-[9px] text-gray-600 mb-1">
          <span>LOAD TREND</span>
          <span>{health.availableProcessors ? `${health.availableProcessors} cores` : ''}</span>
        </div>
        <Sparkline values={loadHistory} color={loadColor} height={24} />
      </div>

      {/* Service statuses */}
      <div className="space-y-1.5 border-t border-cyan-500/10 pt-2">
        <StatusPill label="DB LINK (POSTGRES)" status={health.postgresStatus} latency={health.postgresLatencyMs} />
        <StatusPill label="NEURAL NET (OLLAMA)" status={health.ollamaStatus} latency={health.ollamaLatencyMs} />
      </div>

      {/* Active operations */}
      {Object.keys(activeOperations).length > 0 && (
        <div className="border-t border-cyan-500/10 pt-2">
          <div className="text-[9px] text-cyan-700 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span>Active Operations</span>
            <span className="bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">
              {Object.keys(activeOperations).length}
            </span>
          </div>
          <div className="space-y-1.5">
            {Object.values(activeOperations).map(op => (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] bg-cyan-900/10 border border-cyan-500/15 p-2 rounded-lg"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-cyan-300 truncate mr-2">{op.toolName}</span>
                  <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    op.status === 'RUNNING' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                    op.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {op.status}
                  </span>
                </div>
                {op.progressMessage && (
                  <div className="text-gray-500 truncate text-[9px]" title={op.progressMessage}>
                    {op.progressMessage}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {/* ── Server Log Panel (controlled by hud.server_logs_visible setting) ── */}
      <AnimatePresence>
        {showServerLogs && (
          <motion.div
            key="server-logs"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-cyan-500/10 overflow-hidden"
          >
            {/* Section label */}
            <div className="px-2 pt-2 pb-1 flex items-center gap-2">
              <span className="text-[9px] font-mono tracking-widest text-cyan-700 uppercase">Server Logs</span>
              <span className="flex-1 h-px bg-cyan-500/10" />
            </div>
            <ServerLogPanel maxLines={80} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
