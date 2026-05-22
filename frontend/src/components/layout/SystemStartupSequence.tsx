import React, { useState, useEffect } from 'react';

export const SystemStartupSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        const sequence = [
            "Initializing J.A.R.V.I.S. Core...",
            "Loading arc reactor diagnostics...",
            "Connecting to global network nodes...",
            "Verifying security clearance...",
            "All systems online."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < sequence.length) {
                setLines(prev => [...prev, sequence[i]]);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 1000);
            }
        }, 800);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center font-mono text-cyan-400">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-8"></div>
            <div className="h-40 flex flex-col items-start justify-end w-64">
                {lines.map((line, idx) => (
                    <div key={idx} className="animate-pulse">{`> ${line}`}</div>
                ))}
            </div>
        </div>
    );
};
