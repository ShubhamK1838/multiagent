import React, { useState } from 'react';

export const ArcReactorMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center">
            {/* Menu Items */}
            {isOpen && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {['Systems', 'Network', 'Security', 'AI Core'].map((label, idx) => {
                        const angle = (idx * Math.PI) / 2;
                        const radius = 100;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        return (
                            <button
                                key={label}
                                className="absolute bg-black border border-cyan-400 text-cyan-400 text-xs px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,255,255,0.3)] pointer-events-auto transition-transform hover:scale-110"
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Core Reactor */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-[0_0_30px_rgba(0,255,255,0.6)] ${isOpen ? 'border-cyan-300 scale-110' : 'border-cyan-600'}`}
                style={{
                    background: 'radial-gradient(circle, rgba(0,255,255,0.8) 0%, rgba(0,0,0,1) 70%)'
                }}
            >
                <div className={`w-10 h-10 bg-cyan-200 rounded-full shadow-[0_0_20px_#fff] ${isOpen ? 'animate-pulse' : ''}`}></div>
            </button>
        </div>
    );
};
