import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceRecognitionOptions {
  onCommand: (text: string) => void;
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export const useVoiceRecognition = ({
  onCommand,
  lang = 'en-US',
  continuous = false,
  interimResults = true,
}: UseVoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef('');

  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalStr += result[0].transcript;
        } else {
          interimStr += result[0].transcript;
        }
      }

      if (finalStr) {
        fullTranscriptRef.current += (fullTranscriptRef.current ? ' ' : '') + finalStr.trim();
      }

      const displayTranscript = fullTranscriptRef.current + (interimStr ? (fullTranscriptRef.current ? ' ' : '') + interimStr : '');
      setTranscript(displayTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
         setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalCommand = fullTranscriptRef.current.trim();
      if (finalCommand) {
        onCommandRef.current(finalCommand);
      }
      fullTranscriptRef.current = '';
      setTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        // Prevent onend from firing onCommand during unmount
        recognitionRef.current.onend = null; 
        recognitionRef.current.stop();
      }
    };
  }, [continuous, interimResults, lang]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      // Stopping will naturally trigger onend, which handles submitting the command
      recognitionRef.current.stop();
    } else {
      fullTranscriptRef.current = '';
      setTranscript('');
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition', e);
        setIsListening(false);
      }
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    toggleListening,
    supported,
  };
};
