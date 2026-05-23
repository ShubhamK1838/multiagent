import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface VoiceCommanderProps {
  onCommand: (text: string) => void;
  isProcessing?: boolean;
}

export const VoiceCommander: React.FC<VoiceCommanderProps> = ({ onCommand, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        currentTranscript += result[0].transcript;
        if (result.isFinal) {
          isFinal = true;
        }
      }

      setTranscript(currentTranscript);

      if (isFinal) {
        const finalCommand = currentTranscript.trim();
        if (finalCommand) {
          onCommand(finalCommand);
        }
        setTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // Automatically restart if we are supposed to be listening
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
  }, [onCommand, isListening]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
      setTranscript('');
    } else {
      setIsListening(true);
      setTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
    return null; // Don't render if not supported
  }

  return (
    <div className="relative flex items-center">
      {transcript && (
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="absolute right-full mr-3 whitespace-nowrap bg-black/80 border border-cyan-500/50 text-cyan-300 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-widest max-w-[300px] overflow-hidden text-ellipsis shadow-[0_0_15px_rgba(0,212,255,0.2)]"
        >
          {transcript}
        </motion.div>
      )}

      <button
        onClick={toggleListening}
        className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
          isListening 
            ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
            : 'bg-black/40 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-900/30'
        } border`}
      >
        {isListening && (
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-red-500/30"
          />
        )}
        {isProcessing ? (
           <motion.div 
             animate={{ rotate: 360 }} 
             transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
             className="w-3 h-3 border-t border-r border-violet-400 rounded-full"
           />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isListening ? '#ef4444' : '#06b6d4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>
    </div>
  );
};
