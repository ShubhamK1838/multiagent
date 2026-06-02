import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VoiceCommander } from './VoiceCommander';
import { ArcReactorRing } from './ArcReactorRing';

interface HudControlBarProps {
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
  onResetLayout: () => void;
  onAskAI: () => void;
  onClear: () => void;
  onVoiceCommand: (text: string) => void;
  isAiProcessing?: boolean;
  gesturesEnabled: boolean;
  onToggleGestures: () => void;
  onSubmitTextCommand: (text: string) => void;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  proactiveEnabled: boolean;
  onToggleProactive: () => void;
  vizMode: boolean;
  onToggleViz: () => void;
  handsFree: boolean;
  onToggleHandsFree: () => void;
  onVoiceStart?: () => void;
  onListeningChange?: (listening: boolean) => void;
}

export const HudControlBar: React.FC<HudControlBarProps> = ({
  isDrawingMode,
  onToggleDrawingMode,
  onResetLayout,
  onAskAI,
  onClear,
  onVoiceCommand,
  isAiProcessing,
  gesturesEnabled,
  onToggleGestures,
  onSubmitTextCommand,
  ttsEnabled,
  onToggleTTS,
  proactiveEnabled,
  onToggleProactive,
  vizMode,
  onToggleViz,
  handsFree,
  onToggleHandsFree,
  onVoiceStart,
  onListeningChange
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isAiProcessing) {
      onSubmitTextCommand(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-2xl px-4">
      
      {/* Top Input Bar */}
      <form 
        onSubmit={handleSubmit}
        className="w-full flex items-center bg-black/60 border border-cyan-500/40 rounded-full shadow-[0_0_15px_rgba(0,212,255,0.15)] backdrop-blur-md px-4 py-1.5 transition-colors focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
      >
        <div className="relative flex items-center justify-center">
          <ArcReactorRing active={!!isAiProcessing || ttsEnabled} size={28} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
            <VoiceCommander onCommand={onVoiceCommand} isProcessing={isAiProcessing} handsFree={handsFree} onSpeechStart={onVoiceStart} onListeningChange={onListeningChange} />
          </div>
        </div>
        <div className="w-px h-5 bg-cyan-500/30 mx-3" />
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="System Core Direct Input..."
          disabled={isAiProcessing}
          className="flex-1 bg-transparent border-none outline-none text-cyan-100 text-xs font-mono tracking-wide placeholder-cyan-800 disabled:opacity-50"
        />
        {isAiProcessing && (
           <motion.div 
             animate={{ rotate: 360 }} 
             transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
             className="w-3 h-3 border-t border-r border-violet-400 rounded-full ml-3"
           />
        )}
      </form>

      {/* Control Buttons */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-black/60 border border-cyan-500/30 rounded-full shadow-[0_0_15px_rgba(0,212,255,0.1)] backdrop-blur-md">
        
        <button
          onClick={onResetLayout}
          className="text-[10px] uppercase font-mono tracking-widest text-cyan-500 hover:text-cyan-300 transition-colors px-2"
        >
          Reset Layout
        </button>

        <div className="w-px h-3 bg-cyan-500/30 mx-1" />

        {/* Hands-free wake-word Toggle */}
        <button
          onClick={onToggleHandsFree}
          title={handsFree ? 'Disable hands-free wake word ("Jarvis ...")' : 'Enable hands-free wake word ("Jarvis ...")'}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
            handsFree
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,212,255,0.4)]'
              : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <motion.span
            className={`w-2 h-2 rounded-full ${handsFree ? 'bg-cyan-400' : 'bg-gray-600'}`}
            animate={handsFree ? { opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />
          <span className="text-[10px] font-mono tracking-wider">WAKE</span>
        </button>

        <div className="w-px h-3 bg-cyan-500/30 mx-1" />

        {/* Proactive Mode Toggle */}
        <button
          onClick={onToggleProactive}
          title={proactiveEnabled ? 'Disable proactive monitoring' : 'Enable proactive monitoring'}
          className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${
            proactiveEnabled
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
              : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <motion.span
            className="text-[10px]"
            animate={proactiveEnabled ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >⚡</motion.span>
        </button>

        <div className="w-px h-3 bg-cyan-500/30 mx-1" />

        {/* Auto-Visualize Toggle */}
        <button
          onClick={onToggleViz}
          title={vizMode ? 'Disable auto-visualize (answers render as HUD panels)' : 'Enable auto-visualize (answers render as HUD panels)'}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
            vizMode
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,212,255,0.4)]'
              : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <motion.span
            className={`w-2 h-2 rounded-full ${vizMode ? 'bg-cyan-400' : 'bg-gray-600'}`}
            animate={vizMode ? { opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />
          <span className="text-[10px] font-mono tracking-wider">VIZ</span>
        </button>

        <div className="w-px h-3 bg-cyan-500/30 mx-1" />

        {/* TTS Toggle */}
        <button
          onClick={onToggleTTS}
          title={ttsEnabled ? 'Mute voice output' : 'Enable voice output'}
          className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${
            ttsEnabled
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
              : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          {ttsEnabled ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>

        <div className="w-px h-3 bg-cyan-500/30 mx-1" />

        {/* Drawing Mode Toggle */}
        <button 
          onClick={onToggleDrawingMode}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
            isDrawingMode 
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
              : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isDrawingMode ? 'bg-[#00ff88] animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-[10px] font-mono tracking-wider">CANVAS</span>
        </button>

        {/* Tools that appear when Canvas is active */}
        {isDrawingMode && (
          <>
            <div className="w-px h-3 bg-cyan-500/30 mx-1" />
            
            <button
              onClick={onToggleGestures}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
                gesturesEnabled 
                  ? 'bg-violet-500/20 border-violet-400 text-violet-300' 
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-[10px] font-mono tracking-wider">GESTURES</span>
            </button>
            
            <button
              onClick={onClear}
              className="text-[10px] uppercase font-mono tracking-widest text-red-400 hover:text-red-300 transition-colors px-2"
            >
              Clear
            </button>
            
            <button 
              onClick={onAskAI}
              disabled={isAiProcessing}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider transition-colors ${
                isAiProcessing
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 cursor-wait'
                : 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-800/60 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
              }`}
            >
              <span className="text-sm leading-none mb-0.5">✧</span>
              VISION AI
            </button>
          </>
        )}
      </div>
    </div>
  );
};
