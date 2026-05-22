import React from 'react';

export const TickerTape: React.FC = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-cyan-500/50 h-8 flex items-center overflow-hidden z-50">
            <div className="flex whitespace-nowrap animate-ticker font-mono text-xs text-cyan-500">
                <span className="mx-4 text-cyan-300 font-bold">[INTEL]</span>
                <span>Global node sync complete... Server US-EAST ping 12ms... No anomalies detected in Sector 4... Protocol Alpha standing by...</span>
                <span className="mx-4 text-cyan-300 font-bold">[NEWS]</span>
                <span>Stark Industries stock up 4.2%... New arc reactor shipment delayed...</span>
                <span className="mx-4 text-cyan-300 font-bold">[SEC]</span>
                <span>Firewall repelled 12 unauthorized access attempts in the last hour...</span>
            </div>
            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(100vw); }
                    100% { transform: translateX(-100%); }
                }
                .animate-ticker {
                    animation: ticker 25s linear infinite;
                }
            `}</style>
        </div>
    );
};
