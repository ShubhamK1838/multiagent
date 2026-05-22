import { useState, useEffect } from 'react';

export const useVoiceActivation = (wakeWord: string, onWake: () => void) => {
    const [isListening, setIsListening] = useState(false);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setSupported(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase();

            if (transcript.includes(wakeWord.toLowerCase())) {
                onWake();
            }
        };

        if (isListening) {
            recognition.start();
        } else {
            recognition.stop();
        }

        return () => {
            recognition.stop();
        };
    }, [isListening, wakeWord, onWake]);

    return { isListening, setIsListening, supported };
};
