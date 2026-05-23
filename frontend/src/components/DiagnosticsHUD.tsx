import React, { useEffect, useState } from 'react';

interface SystemHealth {
    status: string;
    memoryUsagePercent: number;
    systemLoadAverage: number;
    postgresStatus?: string;
    postgresLatencyMs?: number;
    ollamaStatus?: string;
    ollamaLatencyMs?: number;
}

interface OperationStatus {
    id: string;
    toolName: string;
    status: string;
    progressMessage: string;
}

export const DiagnosticsHUD: React.FC = () => {
    const [health, setHealth] = useState<SystemHealth>({
        status: 'ONLINE',
        memoryUsagePercent: 0,
        systemLoadAverage: 0
    });
    const [activeOperations, setActiveOperations] = useState<Record<string, OperationStatus>>({});
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const response = await fetch('/api/diagnostics/health');
                const data = await response.json();
                setHealth({
                    status: data.status || 'ONLINE',
                    memoryUsagePercent: data.memoryUsagePercent || 0,
                    systemLoadAverage: data.systemLoadAverage || 0,
                    postgresStatus: data.postgresStatus,
                    postgresLatencyMs: data.postgresLatencyMs,
                    ollamaStatus: data.ollamaStatus,
                    ollamaLatencyMs: data.ollamaLatencyMs
                });
            } catch (error) {
                console.error("Failed to fetch diagnostics", error);
            }
        };

        fetchHealth();
        const interval = setInterval(fetchHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const eventSource = new EventSource('/api/diagnostics/operations/stream');

        eventSource.addEventListener('ADDED', (e) => {
            const data = JSON.parse(e.data);
            setActiveOperations(prev => ({...prev, [data.operation.id]: data.operation}));
        });

        eventSource.addEventListener('UPDATED', (e) => {
            const data = JSON.parse(e.data);
            setActiveOperations(prev => ({...prev, [data.operation.id]: data.operation}));
        });

        eventSource.addEventListener('REMOVED', (e) => {
            const data = JSON.parse(e.data);
            setActiveOperations(prev => ({...prev, [data.operation.id]: data.operation}));
            // Remove after showing completion for a few seconds
            setTimeout(() => {
                setActiveOperations(prev => {
                    const newOps = {...prev};
                    delete newOps[data.operation.id];
                    return newOps;
                });
            }, 3000);
        });

        return () => eventSource.close();
    }, []);

    const toggleExpand = (metric: string) => {
        if (expandedMetric === metric) {
            setExpandedMetric(null);
        } else {
            setExpandedMetric(metric);
        }
    };

    return (
        <div className="bg-black/80 border border-cyan-500/50 p-4 rounded-lg font-mono text-cyan-400 w-64 shadow-[0_0_15px_rgba(0,255,255,0.2)] pointer-events-auto">
            <h3 className="text-xs uppercase tracking-widest border-b border-cyan-500/30 pb-1 mb-3">Core Diagnostics</h3>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span>Core Temp / Mem</span>
                        <span>{health.memoryUsagePercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-gray-900 w-full rounded overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${health.memoryUsagePercent > 80 ? 'bg-red-500' : 'bg-cyan-400'}`}
                            style={{ width: `${health.memoryUsagePercent}%` }}
                        ></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span>System Load</span>
                        <span>{health.systemLoadAverage.toFixed(2)}</span>
                    </div>
                    <div className="h-4 w-full flex items-end gap-1">
                        {[...Array(10)].map((_, i) => {
                            const h = Math.random() * 100;
                            return (
                                <div key={i} className="flex-1 bg-cyan-500/50" style={{ height: `${h}%` }}></div>
                            )
                        })}
                    </div>
                </div>

                <div className="pt-2 border-t border-cyan-500/30 text-xs">
                    <div
                        className="flex justify-between items-center cursor-pointer hover:text-cyan-200 transition-colors"
                        onClick={() => toggleExpand('postgres')}
                    >
                        <span>DB Link (PG)</span>
                        <span className={health.postgresStatus === 'ONLINE' ? 'text-green-400' : 'text-red-500'}>
                            {health.postgresStatus || 'UNKNOWN'}
                        </span>
                    </div>
                    {expandedMetric === 'postgres' && (
                        <div className="mt-1 pl-2 border-l border-cyan-500/30 text-gray-400">
                            Latency: {health.postgresLatencyMs !== undefined ? `${health.postgresLatencyMs}ms` : 'N/A'}
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-cyan-500/30 text-xs">
                    <div
                        className="flex justify-between items-center cursor-pointer hover:text-cyan-200 transition-colors"
                        onClick={() => toggleExpand('ollama')}
                    >
                        <span>Neural Net (LLM)</span>
                        <span className={health.ollamaStatus === 'ONLINE' ? 'text-green-400' : 'text-red-500'}>
                            {health.ollamaStatus || 'UNKNOWN'}
                        </span>
                    </div>
                    {expandedMetric === 'ollama' && (
                        <div className="mt-1 pl-2 border-l border-cyan-500/30 text-gray-400">
                            Latency: {health.ollamaLatencyMs !== undefined ? `${health.ollamaLatencyMs}ms` : 'N/A'}
                        </div>
                    )}
                </div>

                {Object.keys(activeOperations).length > 0 && (
                    <div className="pt-3 border-t border-cyan-500/30">
                        <h4 className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-2">Active Operations</h4>
                        <div className="space-y-2">
                            {Object.values(activeOperations).map(op => (
                                <div key={op.id} className="text-[10px] bg-cyan-900/20 p-1.5 rounded border border-cyan-500/20">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold">{op.toolName}</span>
                                        <span className={
                                            op.status === 'RUNNING' ? 'text-cyan-400 animate-pulse' :
                                            op.status === 'COMPLETED' ? 'text-green-400' : 'text-red-500'
                                        }>{op.status}</span>
                                    </div>
                                    <div className="text-gray-400 truncate" title={op.progressMessage}>
                                        {op.progressMessage}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
