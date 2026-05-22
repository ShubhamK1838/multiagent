import React, { useEffect, useState } from 'react';

export const MatrixLogStream: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const eventSource = new EventSource('/api/diagnostics/logs');

        eventSource.onmessage = (event) => {
            setLogs(prev => {
                const updated = [...prev, event.data];
                if (updated.length > 20) return updated.slice(updated.length - 20);
                return updated;
            });
        };

        eventSource.onerror = () => {
            eventSource.close();
        };

        return () => eventSource.close();
    }, []);

    return (
        <div className="bg-black border border-green-500/30 p-2 rounded w-full max-w-md h-48 overflow-hidden font-mono text-[10px] text-green-500 shadow-[inset_0_0_20px_rgba(0,255,0,0.1)] pointer-events-auto">
            <div className="flex flex-col-reverse h-full">
                {logs.map((log, idx) => (
                    <div key={idx} className="opacity-80 hover:opacity-100 truncate">
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};
