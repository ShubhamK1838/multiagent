import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DiagnosticsHUD } from '../DiagnosticsHUD';
import { useTheme } from '../../contexts/ThemeContext';
import { useHudLayout } from '../../hooks/useHudLayout';
import { useUiSettings } from '../../hooks/useUiSettings';
import { DraggablePanel } from './DraggablePanel';
import { GestureCanvas, AIAnnotation } from '../hud/GestureCanvas';
import type { GestureType } from '../../hooks/useWebcamGestures';
import { HudControlBar } from '../hud/HudControlBar';
import { useChat } from '../../hooks/useChat';
import { useChatStore } from '../../store/chatStore';
import { useConversations } from '../../hooks/useConversations';
import { useSSE } from '../../hooks/useSSE';
import { useTTS } from '../../hooks/useTTS';
import { HudMessageFeed } from '../hud/HudMessageFeed';
import { DiagramPanel } from '../hud/DiagramPanel';
import type { DiagramData } from '../hud/DiagramPanel';
import { ProactiveAlertToast } from '../hud/ProactiveAlertToast';
import { WorkflowPanel } from '../hud/WorkflowPanel';
import { VizPanelHost } from '../hud/viz';
import { useVizPanels } from '../../hooks/useVizPanels';
import { proactiveModeApi } from '../../services/api';
import type { AgentEvent } from '../../types';

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
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const { speak, stop: stopTTS } = useTTS(ttsEnabled);
  const [annotations, setAnnotations] = useState<AIAnnotation[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [canvasData, setCanvasData] = useState<string>('');
  const [clearCount, setClearCount] = useState(0);
  const [injectedShape, setInjectedShape] = useState<any>(null);
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [proactiveEnabled, setProactiveEnabled] = useState(false);
  const { panels: vizPanels, dispatch: vizDispatch, dismiss: vizDismiss } = useVizPanels();

  const conversationId = useChatStore(state => state.activeConversationId);
  const proactiveAlerts = useChatStore(state => state.proactiveAlerts);
  const dismissProactiveAlert = useChatStore(state => state.dismissProactiveAlert);
  const { createConversation } = useConversations();

  // If no conversation is active when the HUD opens, create one automatically
  // so the HUD is always ready to use without requiring a chat-tab visit first.
  useEffect(() => {
    if (!conversationId) {
      createConversation('J.A.R.V.I.S.');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { sendMessage, streamContent, convMessages, thinking, sending } = useChat(conversationId);

  const lastSpokenCountRef = useRef(0);

  const handleFrontendEvent = useCallback((eventName: string, payload: unknown) => {
    if (eventName === 'draw_ui_shape') {
      setInjectedShape(payload);
      setTimeout(() => setInjectedShape(null), 100);
    } else if (eventName === 'render_diagram') {
      setDiagram(payload as DiagramData);
    } else {
      vizDispatch(eventName, payload);
    }
  }, [vizDispatch]);

  useSSE(conversationId, (event: AgentEvent) => {
    if (event.type === 'TOOL_RESULT' && event.metadata?.frontend_event) {
      try {
        handleFrontendEvent(event.metadata.frontend_event as string, JSON.parse(event.content || '{}'));
      } catch (e) {
        console.error("Failed to parse frontend event payload", e);
      }
    }
  });

  // Speak each new final AI message
  useEffect(() => {
    const aiMessages = convMessages.filter(m => m.role === 'assistant');
    if (!thinking && !sending && aiMessages.length > lastSpokenCountRef.current) {
      lastSpokenCountRef.current = aiMessages.length;
      speak(aiMessages[aiMessages.length - 1]?.content ?? '');
    }
  }, [convMessages, thinking, sending, speak]);

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
      case 'OPEN_PALM':
        if (!layout.panels.diagnostics?.visible) togglePanelVisibility('diagnostics');
        break;
      case 'TWO_HANDS_EXPAND':
        resetLayout();
        break;
      case 'PINCH_DELETE':
        stopTTS();
        break;
    }
  }, [layout.panels, togglePanelVisibility, resetLayout, stopTTS]);

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
    if (text.trim() && conversationId) sendMessage(text.trim());
  }, [sendMessage, conversationId]);

  const handleVoiceCommand = useCallback((text: string) => {
    handleTextCommand(text);
  }, [handleTextCommand]);

  const handleToggleProactive = useCallback(async () => {
    try {
      const result = await proactiveModeApi.toggle();
      setProactiveEnabled(result.enabled);
    } catch (e) {
      console.error('Failed to toggle proactive mode', e);
    }
  }, []);

  const isCombat = theme === 'combat';
  const panels = layout.panels || {};

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

      {/* Message Feed — top-right corner */}
      <HudMessageFeed
        messages={convMessages}
        streamContent={streamContent}
        thinking={thinking}
      />

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

        </AnimatePresence>
      </div>

      {/* Diagram Panel — rendered on screen when AI calls render_diagram */}
      <AnimatePresence>
        {diagram && (
          <DiagramPanel
            key="diagram"
            data={diagram}
            onClose={() => setDiagram(null)}
          />
        )}
      </AnimatePresence>

      {/* Visualization panels — table, chart, code, json, diff, metrics */}
      <VizPanelHost panels={vizPanels} onDismiss={vizDismiss} />

      {/* Proactive Alert Toasts */}
      <ProactiveAlertToast alerts={proactiveAlerts} onDismiss={dismissProactiveAlert} />

      {/* Workflow Panel */}
      <AnimatePresence>
        {panels.workflows?.visible && (
          <WorkflowPanel key="workflows" onClose={() => togglePanelVisibility('workflows')} />
        )}
      </AnimatePresence>

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
        ttsEnabled={ttsEnabled}
        onToggleTTS={() => setTtsEnabled(p => !p)}
        proactiveEnabled={proactiveEnabled}
        onToggleProactive={handleToggleProactive}
      />
    </div>
  );
};
