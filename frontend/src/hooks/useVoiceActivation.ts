import { useState, useEffect, useRef } from 'react';

export const useVoiceActivation = (wakeWord: string, onWake: () => void) => {
    const [isListening, setIsListening] = useState(false);
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    const onWakeRef = useRef(onWake);
    useEffect(() => {
        onWakeRef.current = onWake;
    }, [onWake]);

    const wakeWordRef = useRef(wakeWord);
    useEffect(() => {
        wakeWordRef.current = wakeWord;
    }, [wakeWord]);

    const isListeningRef = useRef(isListening);
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

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

            if (transcript.includes(wakeWordRef.current.toLowerCase())) {
                onWakeRef.current();
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Wake word speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            if (isListeningRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    setIsListening(false);
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    useEffect(() => {
        if (!recognitionRef.current) return;

        if (isListening) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error('Failed to start wake word recognition', e);
                setIsListening(false);
            }
        } else {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    return { isListening, setIsListening, supported };
};
