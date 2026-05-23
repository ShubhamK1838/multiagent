import React, { useState, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DiagnosticsHUD } from '../DiagnosticsHUD';
import { ConversationalTerminal, TerminalRef } from '../ConversationalTerminal';
import { MatrixLogStream } from '../MatrixLogStream';
import { ArcReactorMenu } from './ArcReactorMenu';
import { useTheme } from '../../contexts/ThemeContext';
import { useHudLayout } from '../../hooks/useHudLayout';
import { useUiSettings } from '../../hooks/useUiSettings';
import { DraggablePanel } from './DraggablePanel';
import { GestureCanvas, AIAnnotation } from '../hud/GestureCanvas';
import type { GestureType } from '../../hooks/useWebcamGestures';
import { HudControlBar } from '../hud/HudControlBar';

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


export const JarvisHUDView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { layout, updatePanelPosition, updatePanelSize, togglePanelVisibility, bringToFront, resetLayout } = useHudLayout();
  const { getBoolean } = useUiSettings();
  
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [annotations, setAnnotations] = useState<AIAnnotation[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [canvasData, setCanvasData] = useState<string>('');
  const [clearCount, setClearCount] = useState(0);
  const [injectedShape, setInjectedShape] = useState<any>(null);
  
  const terminalRef = useRef<TerminalRef>(null);

  const handleFrontendEvent = useCallback((eventName: string, payload: any) => {
    if (eventName === 'draw_ui_shape') {
      setInjectedShape(payload);
      // We clear the state after a tiny delay so the exact same shape could be drawn again if needed
      setTimeout(() => setInjectedShape(null), 100);
    }
  }, []);

  // Track dragging physics
  const dragState = useRef<{
    panelId: string | null,
    offsetX: number,
    offsetY: number,
    initialWidth: number,
    initialHeight: number
  }>({ panelId: null, offsetX: 0, offsetY: 0, initialWidth: 0, initialHeight: 0 });

  // Handle webcam gestures
  const handleGesture = useCallback((gesture: GestureType) => {
    switch (gesture) {
      case 'SWIPE_LEFT':
        if (layout.panels.diagnostics.visible) togglePanelVisibility('diagnostics');
        break;
      case 'SWIPE_RIGHT':
        if (!layout.panels.diagnostics.visible) togglePanelVisibility('diagnostics');
        break;
      // You can add more gesture mapping here
    }
  }, [layout.panels.diagnostics.visible, togglePanelVisibility]);

  // Handle panel physical dragging via webcam
  const handlePanelDrag = useCallback((x: number, y: number) => {
    // If not dragging any panel yet, check if we are hovering over a panel's title bar
    if (!dragState.current.panelId) {
      for (const [id, panel] of Object.entries(layout.panels)) {
        if (!panel.visible) continue;
        // Relaxed rule: Check if hand is anywhere inside the panel
        if (x >= panel.x && x <= panel.x + panel.width && y >= panel.y && y <= panel.y + panel.height) {
          dragState.current.panelId = id;
          dragState.current.offsetX = panel.x - x;
          dragState.current.offsetY = panel.y - y;
          dragState.current.initialWidth = panel.width;
          dragState.current.initialHeight = panel.height;
          bringToFront(id);
          break;
        }
      }
    }

    // If we have locked onto a panel, move it
    if (dragState.current.panelId) {
      const TRASH_ZONE_SIZE = 150;
      if (x > window.innerWidth - TRASH_ZONE_SIZE && y > window.innerHeight - TRASH_ZONE_SIZE) {
        // Instantly close the panel!
        togglePanelVisibility(dragState.current.panelId);
        dragState.current.panelId = null;
        dragState.current.initialWidth = 0;
        dragState.current.initialHeight = 0;
      } else {
        const newX = x + dragState.current.offsetX;
        const newY = y + dragState.current.offsetY;
        updatePanelPosition(dragState.current.panelId, newX, newY);
      }
    }
  }, [layout.panels, bringToFront, updatePanelPosition]);

  const handleDragEnd = useCallback(() => {
    dragState.current.panelId = null;
    dragState.current.initialWidth = 0;
    dragState.current.initialHeight = 0;
  }, []);

  const handlePanelScale = useCallback((scaleFactor: number) => {
    if (dragState.current.panelId) {
      const panel = layout.panels[dragState.current.panelId];
      if (panel) {
        // Clamp scale to prevent it from getting too small or too huge
        let newWidth = dragState.current.initialWidth * scaleFactor;
        let newHeight = dragState.current.initialHeight * scaleFactor;
        newWidth = Math.max(200, Math.min(newWidth, window.innerWidth - 40));
        newHeight = Math.max(100, Math.min(newHeight, window.innerHeight - 40));
        updatePanelSize(dragState.current.panelId, newWidth, newHeight);
      }
    }
  }, [layout.panels, updatePanelSize]);

  const handleClearCanvas = () => {
    setClearCount(c => c + 1);
    setAnnotations([]);
  };

  const handleAskAI = async () => {
    if (!canvasData) return;
    setIsAiProcessing(true);
    try {
      const response = await fetch('/api/ai/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: canvasData,
          uiState: JSON.stringify(layout.panels),
          intent: 'Please analyze my drawing on this HUD'
        })
      });
      
      if (!response.ok) throw new Error('Vision API failed');
      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        setAnnotations(parsed);
      } catch (e) {
        setAnnotations([{ x: window.innerWidth / 2 - 100, y: 100, text: 'AI responded, but format was invalid.', color: '#ef4444' }]);
      }
    } catch (e) {
      console.error(e);
      setAnnotations([{ x: window.innerWidth / 2 - 100, y: 100, text: 'Vision Error', color: '#ef4444' }]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleVoiceCommand = useCallback((text: string) => {
    if (terminalRef.current) {
      // Ensure terminal is visible if they speak a command
      if (!layout.panels.terminal.visible) {
        togglePanelVisibility('terminal');
      }
      terminalRef.current.submitCommand(text);
    }
  }, [layout.panels.terminal.visible, togglePanelVisibility]);

  const isCombat = theme === 'combat';
  const panels = layout.panels;

  const visiblePanelKeys = new Set(Object.entries(panels).filter(([_, p]) => p.visible).map(([k]) => k));

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

      {/* Main HUD Free Layout */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <AnimatePresence>
          {panels.diagnostics.visible && (
            <DraggablePanel
              key="diagnostics"
              title="Diagnostics"
              {...panels.diagnostics}
              onPositionChange={updatePanelPosition}
              onFocus={bringToFront}
            >
              <DiagnosticsHUD />
            </DraggablePanel>
          )}

          {panels.terminal.visible && (
            <DraggablePanel
              key="terminal"
              title="Terminal"
              {...panels.terminal}
              onPositionChange={updatePanelPosition}
              onFocus={bringToFront}
            >
              <div className="h-full flex flex-col p-1">
                <ConversationalTerminal 
                  ref={terminalRef}
                  canvasData={canvasData}
                  onFrontendEvent={handleFrontendEvent}
                />
              </div>
            </DraggablePanel>
          )}

          {panels.logs.visible && (
            <DraggablePanel
              key="logs"
              title="Matrix Log"
              {...panels.logs}
              onPositionChange={updatePanelPosition}
              onFocus={bringToFront}
            >
              <MatrixLogStream />
            </DraggablePanel>
          )}
        </AnimatePresence>
      </div>

      {/* ARC Reactor Menu — centered at bottom */}
      <div className="pointer-events-auto z-50">
        <ArcReactorMenu
          visiblePanels={visiblePanelKeys}
          onTogglePanel={togglePanelVisibility}
          onThemeToggle={toggleTheme}
        />
      </div>

      {/* Drawing Canvas Overlay */}
      <GestureCanvas
        isDrawingMode={isDrawingMode}
        annotations={annotations}
        onCanvasData={setCanvasData}
        clearCount={clearCount}
        onGesture={handleGesture}
        onPanelDrag={handlePanelDrag}
        onPanelScale={handlePanelScale}
        onDragEnd={handleDragEnd}
        enabled={getBoolean('ui.gestures.enabled', true)}
        smartShapes={getBoolean('ui.gestures.smart_shapes', true)}
        injectedShape={injectedShape}
      />

      {/* HUD Control Bar */}
      <HudControlBar
        isDrawingMode={isDrawingMode}
        onToggleDrawingMode={() => setIsDrawingMode(!isDrawingMode)}
        onResetLayout={resetLayout}
        onAskAI={handleAskAI}
        onClear={handleClearCanvas}
        onVoiceCommand={handleVoiceCommand}
        isAiProcessing={isAiProcessing}
      />
    </div>
  );
};
