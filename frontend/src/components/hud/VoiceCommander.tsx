import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useNvidiaVoice } from '../../hooks/useNvidiaVoice';

interface VoiceCommanderProps {
  onCommand: (text: string) => void;
  isProcessing?: boolean;
  handsFree?: boolean;
  onSpeechStart?: () => void;
  onListeningChange?: (listening: boolean) => void;
  /** Mute the always-on listener (e.g. while JARVIS is speaking) to avoid self-echo. */
  paused?: boolean;
}

export const VoiceCommander: React.FC<VoiceCommanderProps> = ({ onCommand, isProcessing, handsFree, onSpeechStart, onListeningChange, paused }) => {
  // Hands-free runs the on-device browser engine in always-on mode (continuous, no wake word).
  // The manual mic button uses high-accuracy NVIDIA Whisper push-to-talk.
  const browser = useVoiceRecognition({ onCommand, handsFree, onSpeechStart, paused });
  const nvidia = useNvidiaVoice({ onCommand, onListenStart: onSpeechStart });

  const isListening = handsFree ? browser.isListening : nvidia.isListening;

  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  const transcript = handsFree ? browser.transcript : nvidia.transcript;
  const toggleListening = handsFree ? browser.toggleListening : nvidia.toggleListening;
  const supported = handsFree ? browser.supported : nvidia.supported;
  const busy = isProcessing || (!handsFree && nvidia.isTranscribing);

  if (!supported) {
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
        {busy ? (
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
