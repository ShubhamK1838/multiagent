import React, { useState } from 'react';

export const BiometricLogin: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
    const [scanProgress, setScanProgress] = useState(0);
    const [status, setStatus] = useState('AWAITING BIOMETRIC SCAN');

    const handleLogin = async () => {
        if (!window.PublicKeyCredential) {
            setStatus('WebAuthn not supported by this browser.');
            return;
        }

        setScanProgress(50);
        setStatus('INITIATING NATIVE FACE ID / BIOMETRICS...');

        try {
            // First we would fetch a challenge from the server
            // For now, we mock the challenge buffer
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            // Attempt to trigger native face/fingerprint scan
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    // In a real app, you would pass the registered credential IDs here:
                    // allowCredentials: [{ type: 'public-key', id: new Uint8Array(16) }],
                    timeout: 60000,
                    userVerification: "required" // Force biometric check
                }
            });

            if (credential) {
                setScanProgress(100);
                setStatus('IDENTITY VERIFIED: T. STARK');
                setTimeout(onAuthenticated, 1500);
            }
        } catch (err) {
            console.error(err);
            setScanProgress(0);
            setStatus('SCAN FAILED OR CANCELLED');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center font-mono text-cyan-400 p-8 border border-cyan-500/30 rounded-lg bg-black/90 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <div className="relative w-48 h-48 mb-6 cursor-pointer" onClick={handleLogin}>
                {/* Simulated Retina/Fingerprint Graphic */}
                <div className={`absolute inset-0 border-4 rounded-full border-dashed animate-spin-slow ${scanProgress > 0 ? 'border-cyan-400' : 'border-gray-700'}`}></div>
                <div className="absolute inset-4 border-2 rounded-full border-cyan-500/50"></div>

                {/* Scan line */}
                {scanProgress > 0 && scanProgress < 100 && (
                    <div
                        className="absolute left-0 right-0 h-1 bg-cyan-300 shadow-[0_0_10px_#fff]"
                        style={{ top: `${scanProgress}%`, transition: 'top 0.3s ease-out' }}
                    ></div>
                )}

                <div className="absolute inset-0 flex items-center justify-center text-xs text-center px-4 opacity-50 hover:opacity-100">
                    {scanProgress === 0 ? "CLICK TO INITIATE SCAN" : ""}
                </div>
            </div>

            <div className={`text-sm tracking-widest text-center ${scanProgress >= 100 ? 'text-green-400' : scanProgress === 0 ? 'text-cyan-400' : 'text-cyan-400 animate-pulse'}`}>
                {status}
            </div>
            {scanProgress > 0 && scanProgress < 100 && (
                <div className="w-full h-1 bg-gray-800 mt-4 rounded overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${scanProgress}%` }}></div>
                </div>
            )}
        </div>
    );
};
