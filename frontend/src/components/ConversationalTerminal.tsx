import React, { useState } from 'react';
import { useVoiceActivation } from '../hooks/useVoiceActivation';

export const ConversationalTerminal: React.FC = () => {
    const [input, setInput] = useState('');
    const [log, setLog] = useState<{sender: string, text: string}[]>([]);

    const handleWake = () => {
        setLog(prev => [...prev, { sender: 'system', text: 'Wake word detected. Listening...' }]);
    };

    const { isListening, setIsListening, supported } = useVoiceActivation('hey jarvis', handleWake);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setLog(prev => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');

        try {
            const res = await fetch('/api/ai/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: userMessage })
            });
            const data = await res.json();
            setLog(prev => [...prev, { sender: 'ai', text: data.response }]);
        } catch (err) {
            setLog(prev => [...prev, { sender: 'system', text: 'Error connecting to AI Core.' }]);
        }
    };

    return (
        <div className="bg-black/80 border border-cyan-500/50 p-4 rounded-lg font-mono text-cyan-400 max-w-md w-full shadow-[0_0_15px_rgba(0,255,255,0.2)] pointer-events-auto">
            <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-4">
                <h3 className="text-sm tracking-widest uppercase">J.A.R.V.I.S. Terminal</h3>
                <button
                    onClick={() => setIsListening(!isListening)}
                    className={`px-2 py-1 text-xs rounded ${isListening ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}
                    disabled={!supported}
                >
                    {supported ? (isListening ? 'Mic Active' : 'Mic Off') : 'Mic Unsupported'}
                </button>
            </div>

            <div className="h-48 overflow-y-auto mb-4 space-y-2 text-sm">
                {log.map((entry, idx) => (
                    <div key={idx} className={entry.sender === 'user' ? 'text-white' : entry.sender === 'system' ? 'text-yellow-400' : 'text-cyan-300'}>
                        <span className="opacity-50 mr-2">[{entry.sender}]</span>
                        {entry.text}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <span className="text-cyan-500 mt-1">&gt;</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-cyan-100 placeholder-cyan-800"
                    placeholder="Enter command..."
                />
            </form>
        </div>
    );
};
