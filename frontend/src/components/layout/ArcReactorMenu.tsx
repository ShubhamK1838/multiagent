import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type HudPanel = 'diagnostics' | 'terminal' | 'logs' | 'all';

interface ArcReactorMenuProps {
  visiblePanels: Set<string>;
  onTogglePanel: (panel: string) => void;
  onThemeToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  glow: string;
  action: () => void;
}

export const ArcReactorMenu: React.FC<ArcReactorMenuProps> = ({
  visiblePanels,
  onTogglePanel,
  onThemeToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  };

  const menuItems: MenuItem[] = [
    {
      id: 'diagnostics',
      label: 'SYSTEMS',
      icon: '⬡',
      color: '#00d4ff',
      glow: 'rgba(0,212,255,0.6)',
      action: () => { onTogglePanel('diagnostics'); setIsOpen(false); },
    },
    {
      id: 'logs',
      label: 'MATRIX',
      icon: '≡',
      color: '#a855f7',
      glow: 'rgba(168,85,247,0.6)',
      action: () => { onTogglePanel('logs'); setIsOpen(false); },
    },
    {
      id: 'theme',
      label: 'COMBAT',
      icon: '⚡',
      color: '#ef4444',
      glow: 'rgba(239,68,68,0.6)',
      action: () => { onThemeToggle(); setIsOpen(false); },
    },
  ];

  const RADIUS = 90;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center">
      {/* Orbital menu items */}
      <AnimatePresence>
        {isOpen && menuItems.map((item, idx) => {
          const angle = (idx / menuItems.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * RADIUS;
          const y = Math.sin(angle) * RADIUS;
          const active = visiblePanels.has(item.id);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x, y }}
              exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300, delay: idx * 0.05 }}
              className="absolute"
            >
              <button
                onClick={item.action}
                className="relative flex flex-col items-center gap-1 group"
              >
                <div
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg transition-all duration-200 hover:scale-110"
                  style={{
                    borderColor: item.color,
                    background: `radial-gradient(circle, ${active ? item.color + '30' : 'rgba(0,0,0,0.8)'} 0%, rgba(0,0,0,0.9) 100%)`,
                    boxShadow: active ? `0 0 20px ${item.glow}, inset 0 0 10px ${item.color}20` : `0 0 8px ${item.glow}40`,
                    color: item.color,
                  }}
                >
                  <span style={{ textShadow: `0 0 8px ${item.color}` }}>{item.icon}</span>
                </div>
                <span
                  className="text-[8px] font-mono font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: item.color }}
                >
                  {active ? '● ' : '○ '}{item.label}
                </span>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Rotating orbit ring */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute"
            style={{ width: RADIUS * 2 + 48, height: RADIUS * 2 + 48 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-full h-full rounded-full border border-cyan-500/20"
              style={{ borderStyle: 'dashed' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Core reactor button */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-16 h-16 rounded-full flex items-center justify-center z-10"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.9) 0%, rgba(0,40,60,1) 60%, rgba(0,0,0,1) 100%)',
          border: `2px solid ${isOpen ? '#00d4ff' : 'rgba(0,212,255,0.4)'}`,
          boxShadow: isOpen
            ? '0 0 40px rgba(0,212,255,0.8), 0 0 80px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,212,255,0.3)'
            : '0 0 20px rgba(0,212,255,0.4), inset 0 0 10px rgba(0,212,255,0.1)',
        }}
      >
        {/* Inner rings */}
        <div className="absolute inset-2 rounded-full border border-cyan-400/30" />
        <div className="absolute inset-3 rounded-full border border-cyan-400/20" />
        
        {/* Core glow */}
        <motion.div
          className="w-6 h-6 rounded-full bg-cyan-200"
          animate={{ 
            boxShadow: isOpen 
              ? ['0 0 15px #fff, 0 0 30px #00d4ff', '0 0 25px #fff, 0 0 50px #00d4ff', '0 0 15px #fff, 0 0 30px #00d4ff']
              : '0 0 10px #00d4ff80' 
          }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />

        {/* Pulse ring on click */}
        <AnimatePresence>
          {pulse && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full border border-cyan-400"
            />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
