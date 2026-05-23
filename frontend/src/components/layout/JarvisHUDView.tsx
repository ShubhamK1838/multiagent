import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiagnosticsHUD } from '../DiagnosticsHUD';
import { ConversationalTerminal } from '../ConversationalTerminal';
import { MatrixLogStream } from '../MatrixLogStream';
import { ArcReactorMenu } from './ArcReactorMenu';
import { useTheme } from '../../contexts/ThemeContext';

// Hex grid SVG background
const HexBackground: React.FC = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="hex" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
        <polygon
          points="14,2 42,2 56,26 42,50 14,50 0,26"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="0.8"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex)" />
  </svg>
);

// Scanline overlay
const Scanlines: React.FC = () => (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.025]"
    style={{
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.4) 2px, rgba(0,212,255,0.4) 3px)',
    }}
  />
);

// Corner bracket decoration
const CornerBrackets: React.FC = () => (
  <>
    {[['top-0 left-0', 'border-t border-l'], ['top-0 right-0', 'border-t border-r'],
      ['bottom-8 left-0', 'border-b border-l'], ['bottom-8 right-0', 'border-b border-r']].map(([pos, border]) => (
      <div key={pos} className={`absolute ${pos} w-8 h-8 ${border} border-cyan-400/30 pointer-events-none`} />
    ))}
  </>
);

// Panel wrapper with glass effect
const HudPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.25 }}
    className={`${className} h-full`}
  >
    {children}
  </motion.div>
);

export const JarvisHUDView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [visiblePanels, setVisiblePanels] = useState(new Set(['diagnostics', 'terminal', 'logs']));

  const togglePanel = (panel: string) => {
    setVisiblePanels(prev => {
      const next = new Set(prev);
      if (next.has(panel)) {
        next.delete(panel);
      } else {
        next.add(panel);
      }
      return next;
    });
  };

  const isCombat = theme === 'combat';

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: isCombat
          ? 'radial-gradient(ellipse at center, rgba(60,0,0,0.8) 0%, rgba(2,0,6,1) 100%)'
          : 'radial-gradient(ellipse at center, rgba(0,10,30,0.9) 0%, rgba(2,11,24,1) 100%)',
      }}
    >
      {/* Background effects */}
      <HexBackground />
      <Scanlines />
      <CornerBrackets />

      {/* Combat mode vignette */}
      {isCombat && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0.15) 100%)' }} />
      )}

      {/* Main HUD Grid — 3 columns, full height */}
      <div className="absolute inset-0 p-4 grid gap-3"
        style={{ gridTemplateColumns: '280px 1fr 300px', gridTemplateRows: '1fr' }}>

        {/* LEFT COLUMN: Diagnostics */}
        <AnimatePresence>
          {visiblePanels.has('diagnostics') && (
            <HudPanel key="diag">
              <DiagnosticsHUD />
            </HudPanel>
          )}
          {!visiblePanels.has('diagnostics') && (
            <div key="diag-placeholder" />
          )}
        </AnimatePresence>

        {/* CENTER COLUMN: Terminal */}
        <AnimatePresence>
          {visiblePanels.has('terminal') && (
            <HudPanel key="terminal">
              <div className="h-full flex flex-col">
                <ConversationalTerminal />
              </div>
            </HudPanel>
          )}
          {!visiblePanels.has('terminal') && (
            <div key="term-placeholder" className="flex items-center justify-center">
              <div className="text-cyan-900 font-mono text-xs tracking-widest text-center">
                <div className="text-4xl mb-2 opacity-30">◈</div>
                <div>TERMINAL OFFLINE</div>
                <div className="text-[9px] mt-1 opacity-50">Click COMMS to restore</div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* RIGHT COLUMN: Matrix Log */}
        <AnimatePresence>
          {visiblePanels.has('logs') && (
            <HudPanel key="logs">
              <MatrixLogStream />
            </HudPanel>
          )}
          {!visiblePanels.has('logs') && (
            <div key="logs-placeholder" />
          )}
        </AnimatePresence>
      </div>

      {/* ARC Reactor Menu — centered at bottom */}
      <ArcReactorMenu
        visiblePanels={visiblePanels}
        onTogglePanel={togglePanel}
        onThemeToggle={toggleTheme}
      />
    </div>
  );
};
