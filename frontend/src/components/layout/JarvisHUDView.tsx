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
import { proactiveModeApi, settingsApi } from '../../services/api';
import type { AgentEvent } from '../../types';
import { GestureRegistryProvider, useGestureRegistry } from '../../contexts/GestureRegistryContext';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { NeuralPulseBackground } from '../hud/NeuralPulseBackground';
import { ArcReactorCore } from '../hud/ArcReactorCore';
import { DataStreamRibbon } from '../hud/DataStreamRibbon';
import type { RibbonEvent } from '../hud/DataStreamRibbon';
import { VoiceVisualizer } from '../hud/VoiceVisualizer';
import { BootSequence } from '../hud/BootSequence';
import { LiveCaptions } from '../hud/LiveCaptions';

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


const HudCrashFallback: React.FC = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 z-[200]">
    <div className="text-cyan-400/80 font-mono text-sm tracking-[0.3em] uppercase">
      HUD render fault
    </div>
    <div className="text-cyan-500/50 font-mono text-xs max-w-sm text-center leading-relaxed">
      A panel failed to render and was isolated. Reload the core interface to continue.
    </div>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-1.5 rounded-full border border-cyan-500/40 text-cyan-300 font-mono text-[10px]
                 uppercase tracking-widest hover:bg-cyan-500/10 transition-colors"
    >
      Reboot Core
    </button>
  </div>
);

export const JarvisHUDView: React.FC = () => (
  <GestureRegistryProvider>
    <ErrorBoundary fallback={<HudCrashFallback />}>
      <JarvisHUDContent />
    </ErrorBoundary>
  </GestureRegistryProvider>
);

const JarvisHUDContent: React.FC = () => {
  const { registry } = useGestureRegistry();
  const { theme } = useTheme();
  const { layout, updatePanelPosition, updatePanelSize, togglePanelVisibility, bringToFront, resetLayout } = useHudLayout();
  const { getBoolean } = useUiSettings();
  
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [gesturesEnabled, setGesturesEnabled] = useState(getBoolean('ui.gestures.enabled', true));
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const { speak, stop: stopTTS, speaking } = useTTS(ttsEnabled);
  const [annotations, setAnnotations] = useState<AIAnnotation[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [canvasData, setCanvasData] = useState<string>('');
  const [clearCount, setClearCount] = useState(0);
  const [injectedShape, setInjectedShape] = useState<any>(null);
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [proactiveEnabled, setProactiveEnabled] = useState(false);
  const [vizMode, setVizMode] = useState(true);
  const [ribbons, setRibbons] = useState<RibbonEvent[]>([]);
  const [captionText, setCaptionText] = useState('');
  const [listening, setListening] = useState(false);
  const { panels: vizPanels, dispatch: vizDispatch, dismiss: vizDismiss } = useVizPanels();
  const commandBarRef = useRef<HTMLDivElement>(null);

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

  // Sync the proactive toggle with the backend's actual state on mount.
  useEffect(() => {
    proactiveModeApi.getStatus()
      .then(s => setProactiveEnabled(s.enabled))
      .catch(() => { /* backend may be offline; leave default */ });
  }, []);

  // Sync the auto-visualize toggle with the persisted backend setting on mount.
  useEffect(() => {
    settingsApi.getAll()
      .then(all => {
        const s = all.find(x => x.settingKey === 'ui.auto_visualize');
        if (s) setVizMode(String(s.settingValue).toLowerCase() === 'true');
      })
      .catch(() => { /* backend may be offline; leave default */ });
  }, []);

  const { sendMessage, streamContent, convMessages, thinking, sending } = useChat(conversationId);

  const lastSpokenCountRef = useRef(0);
  const spokenConvRef = useRef<string | null>(null);

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
    // Spawn a data stream ribbon on every tool call
    if (event.type === 'TOOL_CALL') {
      const fromEl = commandBarRef.current
      const toX = Math.random() * (window.innerWidth * 0.6) + window.innerWidth * 0.2
      const toY = Math.random() * (window.innerHeight * 0.5) + 120
      const fromX = fromEl ? fromEl.getBoundingClientRect().left + fromEl.getBoundingClientRect().width / 2 : window.innerWidth / 2
      const fromY = fromEl ? fromEl.getBoundingClientRect().bottom : 80
      setRibbons(prev => [...prev, { id: event.id, fromX, fromY, toX, toY }])
    }
    if (event.type === 'TOOL_RESULT' && event.metadata?.frontend_event) {
      try {
        handleFrontendEvent(event.metadata.frontend_event as string, JSON.parse(event.content || '{}'));
      } catch (e) {
        console.error("Failed to parse frontend event payload", e);
      }
    }
  });

  // Speak each new final AI message. When the conversation changes, sync the
  // baseline to its existing history so we don't read stale messages aloud.
  useEffect(() => {
    const aiMessages = convMessages.filter(m => m.role === 'assistant');
    if (spokenConvRef.current !== conversationId) {
      spokenConvRef.current = conversationId ?? null;
      lastSpokenCountRef.current = aiMessages.length;
      return;
    }
    if (!thinking && !sending && aiMessages.length > lastSpokenCountRef.current) {
      lastSpokenCountRef.current = aiMessages.length;
      const content = aiMessages[aiMessages.length - 1]?.content ?? '';
      setCaptionText(content);
      speak(content);
    }
  }, [convMessages, thinking, sending, speak, conversationId]);

  // Track dragging physics (layout panels + registry panels)
  const dragState = useRef<{
    panelId: string | null,
    registryId: string | null,
    offsetX: number,
    offsetY: number,
    initialWidth: number,
    initialHeight: number,
    lastX: number,
    lastY: number,
  }>({ panelId: null, registryId: null, offsetX: 0, offsetY: 0, initialWidth: 0, initialHeight: 0, lastX: 0, lastY: 0 });

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
    if (!dragState.current.panelId && !dragState.current.registryId) {
      // Check layout panels first
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
      // Then check gesture registry (viz panels, diagram, workflow)
      if (!dragState.current.panelId) {
        for (const [id, entry] of registry.current.entries()) {
          const rect = entry.getRect();
          if (rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            dragState.current.registryId = id;
            dragState.current.lastX = x;
            dragState.current.lastY = y;
            break;
          }
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

    if (dragState.current.registryId) {
      const entry = registry.current.get(dragState.current.registryId);
      if (entry) {
        entry.nudge(x - dragState.current.lastX, y - dragState.current.lastY);
        dragState.current.lastX = x;
        dragState.current.lastY = y;
      }
    }
  }, [layout.panels, bringToFront, updatePanelPosition, togglePanelVisibility, registry]);

  const handleDragEnd = useCallback(() => {
    dragState.current.panelId = null;
    dragState.current.registryId = null;
    dragState.current.initialWidth = 0;
    dragState.current.initialHeight = 0;
    dragState.current.lastX = 0;
    dragState.current.lastY = 0;
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

  // Flick/throw: animate a registry panel off-screen with velocity
  const handleFlick = useCallback((vx: number, vy: number, x: number, y: number) => {
    // Find which panel is at (x, y) in registry
    for (const [, entry] of registry.current.entries()) {
      const rect = entry.getRect();
      if (rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        // Throw it off-screen via rapid nudge
        const THROW_DIST = 1200;
        const spd = Math.hypot(vx, vy);
        const nx = vx / spd, ny = vy / spd;
        entry.nudge(nx * THROW_DIST, ny * THROW_DIST);
        break;
      }
    }
  }, [registry]);

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

  // Barge-in: silence JARVIS the moment the user starts speaking.
  const handleVoiceStart = useCallback(() => {
    stopTTS();
  }, [stopTTS]);

  const handleToggleProactive = useCallback(async () => {
    try {
      const result = await proactiveModeApi.toggle();
      setProactiveEnabled(result.enabled);
    } catch (e) {
      console.error('Failed to toggle proactive mode', e);
    }
  }, []);

  // Toggle auto-visualize mode — optimistic flip + persist to backend so the
  // agent's system prompt picks it up on the next turn.
  const handleToggleViz = useCallback(async () => {
    const next = !vizMode;
    setVizMode(next);
    try {
      await settingsApi.update('ui.auto_visualize', String(next));
    } catch (e) {
      console.error('Failed to persist auto-visualize setting', e);
      setVizMode(!next); // revert on failure
    }
  }, [vizMode]);

  const isCombat = theme === 'combat';
  const panels = layout.panels || {};

  const isGlobalProcessing = isAiProcessing || sending || thinking;
  const coreState: 'idle' | 'thinking' | 'speaking' =
    isGlobalProcessing ? 'thinking' : speaking ? 'speaking' : 'idle';

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: isCombat
          ? 'radial-gradient(ellipse at center, rgba(60,0,0,0.8) 0%, rgba(2,0,6,1) 100%)'
          : 'radial-gradient(ellipse at center, rgba(0,10,30,0.9) 0%, rgba(2,11,24,1) 100%)',
      }}
    >
      {/* Neural pulse background — activates when AI is thinking */}
      <NeuralPulseBackground isThinking={isGlobalProcessing} />

      {/* Central arc reactor core — reacts to JARVIS state, sits behind panels */}
      <ArcReactorCore state={coreState} combat={isCombat} />

      {/* Audio-reactive radial waveform ringing the core while JARVIS speaks or listens */}
      <VoiceVisualizer active={speaking || listening} />

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
        onFlick={handleFlick}
        enabled={gesturesEnabled && isDrawingMode}
        smartShapes={getBoolean('ui.gestures.smart_shapes', true)}
        injectedShape={injectedShape}
      />

      {/* Data stream ribbons — animate from command bar to result panels on tool calls */}
      <DataStreamRibbon
        events={ribbons}
        onComplete={id => setRibbons(prev => prev.filter(r => r.id !== id))}
      />

      {/* HUD Control Bar */}
      <div ref={commandBarRef} className="absolute top-0 left-0 right-0 z-[51] pointer-events-none" style={{ height: 80 }} />
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
        vizMode={vizMode}
        onToggleViz={handleToggleViz}
        handsFree={handsFree}
        onToggleHandsFree={() => setHandsFree(p => !p)}
        onVoiceStart={handleVoiceStart}
        onListeningChange={setListening}
      />

      {/* Live subtitle captions of JARVIS's speech */}
      <LiveCaptions text={captionText} active={speaking} />

      {/* One-time boot-up sequence overlay */}
      <BootSequence />
    </div>
  );
};
