import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VoiceCommander } from './VoiceCommander';
import { ArcReactorRing } from './ArcReactorRing';

interface HudControlBarProps {
  onResetLayout: () => void;
  onVoiceCommand: (text: string) => void;
  isAiProcessing?: boolean;
  onSubmitTextCommand: (text: string) => void;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  proactiveEnabled: boolean;
  onToggleProactive: () => void;
  vizMode: boolean;
  onToggleViz: () => void;
  swarmMode: boolean;
  onToggleSwarm: () => void;
  handsFree: boolean;
  onToggleHandsFree: () => void;
  onVoiceStart?: () => void;
  onListeningChange?: (listening: boolean) => void;
  /** Mute the always-on listener while JARVIS is speaking (avoids self-echo). */
  voicePaused?: boolean;
}

// A single pill toggle: lit (accent glow + pulsing dot) when active, dim otherwise.
const ToggleChip: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
  color: string;
}> = ({ active, onClick, label, title, color }) => (
  <button
    onClick={onClick}
    title={title}
    style={active ? { background: `${color}22`, borderColor: color, color } : undefined}
    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono tracking-wider transition-colors ${
      active ? '' : 'border-transparent bg-transparent text-gray-500 hover:text-gray-300'
    }`}
  >
    <motion.span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ background: active ? color : '#4b5563', boxShadow: active ? `0 0 8px ${color}` : undefined }}
      animate={active ? { opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1.6 }}
    />
    <span>{label}</span>
  </button>
);

export const HudControlBar: React.FC<HudControlBarProps> = ({
  onResetLayout,
  onVoiceCommand,
  isAiProcessing,
  onSubmitTextCommand,
  ttsEnabled,
  onToggleTTS,
  proactiveEnabled,
  onToggleProactive,
  vizMode,
  onToggleViz,
  swarmMode,
  onToggleSwarm,
  handsFree,
  onToggleHandsFree,
  onVoiceStart,
  onListeningChange,
  voicePaused,
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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-2xl px-4 pointer-events-none">

      {/* Top Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto w-full flex items-center bg-black/60 border border-cyan-500/40 rounded-full shadow-[0_0_15px_rgba(0,212,255,0.15)] backdrop-blur-md px-4 py-1.5 transition-colors focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
      >
        <div className="relative flex items-center justify-center">
          <ArcReactorRing active={!!isAiProcessing || ttsEnabled} size={28} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
            <VoiceCommander onCommand={onVoiceCommand} isProcessing={isAiProcessing} handsFree={handsFree} onSpeechStart={onVoiceStart} onListeningChange={onListeningChange} paused={voicePaused} />
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

      {/* Control cluster */}
      <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-black/60 border border-cyan-500/30 rounded-full shadow-[0_0_15px_rgba(0,212,255,0.1)] backdrop-blur-md">

        <button
          onClick={onResetLayout}
          className="text-[10px] uppercase font-mono tracking-widest text-cyan-500/80 hover:text-cyan-300 transition-colors px-2"
          title="Reset all panels to their default layout"
        >
          Reset
        </button>

        <div className="w-px h-3 bg-cyan-500/20 mx-0.5" />

        <ToggleChip
          active={handsFree}
          onClick={onToggleHandsFree}
          label="LISTEN"
          color="#22d3ee"
          title={handsFree ? 'Always-on listening ON — speak any time, no wake word needed' : 'Enable always-on listening (continuous, no wake word)'}
        />
        <ToggleChip
          active={vizMode}
          onClick={onToggleViz}
          label="VIZ"
          color="#00d4ff"
          title={vizMode ? 'Auto-visualize on — answers render as HUD panels' : 'Auto-visualize off'}
        />
        <ToggleChip
          active={swarmMode}
          onClick={onToggleSwarm}
          label="SWARM"
          color="#a78bfa"
          title={swarmMode ? 'Multi-agent mode on — a team collaborates' : 'Multi-agent mode off — single agent'}
        />
        <ToggleChip
          active={ttsEnabled}
          onClick={onToggleTTS}
          label="VOICE"
          color="#34d399"
          title={ttsEnabled ? 'Voice output on' : 'Voice output muted'}
        />
        <ToggleChip
          active={proactiveEnabled}
          onClick={onToggleProactive}
          label="WATCH"
          color="#fbbf24"
          title={proactiveEnabled ? 'Proactive monitoring on' : 'Proactive monitoring off'}
        />
      </div>
    </div>
  );
};
