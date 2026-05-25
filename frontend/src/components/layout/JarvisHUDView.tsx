import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DiagnosticsHUD } from '../DiagnosticsHUD';
import { MatrixLogStream } from '../MatrixLogStream';
import { ArcReactorMenu } from './ArcReactorMenu';
import { useTheme } from '../../contexts/ThemeContext';
import { useHudLayout } from '../../hooks/useHudLayout';
import { useUiSettings } from '../../hooks/useUiSettings';
import { DraggablePanel } from './DraggablePanel';
import { GestureCanvas, AIAnnotation } from '../hud/GestureCanvas';
import type { GestureType } from '../../hooks/useWebcamGestures';
import { HudControlBar } from '../hud/HudControlBar';
import { useHudConversation } from '../../hooks/useHudConversation';
import { useChat } from '../../hooks/useChat';
import { useSSE } from '../../hooks/useSSE';
import type { AgentEvent } from '../../types';
import Markdown from 'react-markdown';

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
  const [gesturesEnabled, setGesturesEnabled] = useState(getBoolean('ui.gestures.enabled', true));
  const [annotations, setAnnotations] = useState<AIAnnotation[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [canvasData, setCanvasData] = useState<string>('');
  const [clearCount, setClearCount] = useState(0);
  const [injectedShape, setInjectedShape] = useState<any>(null);
  
  const { conversationId } = useHudConversation();
  const { sendMessage, streamContent, convMessages, thinking, sending } = useChat(conversationId);
  const [aiOverlayText, setAiOverlayText] = useState('');
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFrontendEvent = useCallback((eventName: string, payload: any) => {
    if (eventName === 'draw_ui_shape') {
      setInjectedShape(payload);
      setTimeout(() => setInjectedShape(null), 100);
    }
  }, []);

  useSSE(conversationId, (event: AgentEvent) => {
    if (event.type === 'TOOL_RESULT' && event.metadata?.frontend_event) {
      try {
        handleFrontendEvent(event.metadata.frontend_event as string, JSON.parse(event.content || '{}'));
      } catch (e) {
        console.error("Failed to parse frontend event payload", e);
      }
    } else if (event.type === 'TOOL_CALL') {
      const tool = event.metadata?.tool as string || event.content || 'unknown tool';
      setAiOverlayText(`> Executing sub-routine: ${tool}...`);
      resetOverlayTimer();
    }
  });

  const resetOverlayTimer = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => {
      setAiOverlayText('');
    }, 30000); // Vanish after 30 seconds
  }, []);

  // Update text when streaming
  useEffect(() => {
    if (streamContent) {
      setAiOverlayText(streamContent);
      resetOverlayTimer();
    }
  }, [streamContent, resetOverlayTimer]);

  // Update text when the final message is pushed
  useEffect(() => {
    const aiMessages = convMessages.filter(m => m.role === 'assistant');
    const lastAiMsg = aiMessages[aiMessages.length - 1];
    if (lastAiMsg && !streamContent && !thinking && !sending) {
      setAiOverlayText(lastAiMsg.content);
      resetOverlayTimer();
    }
  }, [convMessages, streamContent, thinking, sending, resetOverlayTimer]);

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
        if (layout.panels.diagnostics?.visible) togglePanelVisibility('diagnostics');
        break;
      case 'SWIPE_RIGHT':
        if (!layout.panels.diagnostics?.visible) togglePanelVisibility('diagnostics');
        break;
    }
  }, [layout.panels.diagnostics?.visible, togglePanelVisibility]);

  // Handle panel physical dragging via webcam
  const handlePanelDrag = useCallback((x: number, y: number) => {
    if (!dragState.current.panelId) {
      for (const [id, panel] of Object.entries(layout.panels || {})) {
        if (!panel?.visible) continue;
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

    if (dragState.current.panelId) {
      const TRASH_ZONE_SIZE = 150;
      if (x > window.innerWidth - TRASH_ZONE_SIZE && y > window.innerHeight - TRASH_ZONE_SIZE) {
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

  const handleTextCommand = useCallback((text: string) => {
    if (text.trim()) {
      setAiOverlayText(''); // clear previous response immediately when user asks a new question
      sendMessage(text.trim());
    }
  }, [sendMessage]);

  const handleVoiceCommand = useCallback((text: string) => {
    handleTextCommand(text);
  }, [handleTextCommand]);

  const isCombat = theme === 'combat';
  const panels = layout.panels || {};

  const visiblePanelKeys = new Set(Object.entries(panels).filter(([_, p]) => p?.visible).map(([k]) => k));

  const isGlobalProcessing = isAiProcessing || sending || thinking;

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

      {/* Floating AI Response Overlay */}
      <AnimatePresence>
        {(aiOverlayText || isGlobalProcessing) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-2xl w-full"
          >
            <div className="bg-black/70 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,212,255,0.2)]">
              <div className="flex items-center gap-3 mb-3 border-b border-cyan-500/30 pb-2">
                {isGlobalProcessing ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shadow-[0_0_10px_rgba(251,191,36,1)]" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,212,255,1)]" />
                )}
                <span className="text-cyan-300 text-xs font-mono tracking-widest uppercase">
                  {isGlobalProcessing ? 'J.A.R.V.I.S. is Processing...' : 'J.A.R.V.I.S. Response'}
                </span>
              </div>
              <div className="prose prose-invert prose-cyan max-w-none font-mono text-sm leading-relaxed overflow-hidden text-ellipsis">
                <Markdown>{aiOverlayText || '*Analyzing data matrices...*'}</Markdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main HUD Free Layout */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <AnimatePresence>
          {panels.diagnostics?.visible && (
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

          {panels.logs?.visible && (
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
        enabled={gesturesEnabled && isDrawingMode}
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
        isAiProcessing={isGlobalProcessing}
        gesturesEnabled={gesturesEnabled}
        onToggleGestures={() => setGesturesEnabled(p => !p)}
        onSubmitTextCommand={handleTextCommand}
      />
    </div>
  );
};
