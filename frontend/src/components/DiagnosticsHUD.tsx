import React, { useEffect, useState } from 'react';

interface SystemHealth {
    status: string;
    memoryUsagePercent: number;
    systemLoadAverage: number;
}

export const DiagnosticsHUD: React.FC = () => {
    const [health, setHealth] = useState<SystemHealth>({
        status: 'ONLINE',
        memoryUsagePercent: 0,
        systemLoadAverage: 0
    });

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const response = await fetch('/api/diagnostics/health');
                const data = await response.json();
                setHealth({
                    status: data.status || 'ONLINE',
                    memoryUsagePercent: data.memoryUsagePercent || 0,
                    systemLoadAverage: data.systemLoadAverage || 0
                });
            } catch (error) {
                console.error("Failed to fetch diagnostics", error);
            }
        };

        fetchHealth();
        const interval = setInterval(fetchHealth, 5000);
        return () => clearInterval(interval);
    }, []);

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

                <div className="pt-2 border-t border-cyan-500/30 flex justify-between items-center text-xs">
                    <span>Network Sec</span>
                    <span className="text-green-400 animate-pulse">SECURE</span>
                </div>
            </div>
        </div>
    );
};
