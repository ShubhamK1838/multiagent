import React from 'react';
import { motion } from 'framer-motion';
import { VoiceCommander } from './VoiceCommander';

interface HudControlBarProps {
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
  onResetLayout: () => void;
  onAskAI: () => void;
  onClear: () => void;
  onVoiceCommand: (text: string) => void;
  isAiProcessing?: boolean;
}

export const HudControlBar: React.FC<HudControlBarProps> = ({
  isDrawingMode,
  onToggleDrawingMode,
  onResetLayout,
  onAskAI,
  onClear,
  onVoiceCommand,
  isAiProcessing
}) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-black/60 border border-cyan-500/30 rounded-full shadow-[0_0_20px_rgba(0,212,255,0.15)] backdrop-blur-md">
      
      {/* Layout Controls */}
      <button 
        onClick={onResetLayout}
        className="text-[10px] uppercase font-mono tracking-widest text-cyan-500 hover:text-cyan-300 transition-colors px-2"
      >
        Reset Layout
      </button>

      <div className="w-px h-4 bg-cyan-500/30" />

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
          <div className="w-px h-4 bg-cyan-500/30" />
          
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
            {isAiProcessing ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-2.5 h-2.5 border-t border-r border-violet-400 rounded-full"
                />
                ANALYZING...
              </>
            ) : (
              <>
                <span className="text-lg leading-none mb-0.5">✧</span>
                ASK A.I.
              </>
            )}
          </button>
          
          <div className="w-px h-4 bg-cyan-500/30 mx-1" />
          <VoiceCommander onCommand={onVoiceCommand} isProcessing={isAiProcessing} />
        </>
      )}
    </div>
  );
};
