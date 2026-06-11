import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DiagnosticsHUD } from '../DiagnosticsHUD';
import { useTheme } from '../../contexts/ThemeContext';
import { useHudLayout } from '../../hooks/useHudLayout';
import { DraggablePanel } from './DraggablePanel';
import { HudControlBar } from '../hud/HudControlBar';
import { useChat } from '../../hooks/useChat';
import { useChatStore } from '../../store/chatStore';
import { useConversations } from '../../hooks/useConversations';
import { useSSE } from '../../hooks/useSSE';
import { useNeuralTTS } from '../../hooks/useNeuralTTS';
import { HudMessageFeed } from '../hud/HudMessageFeed';
import { DiagramPanel } from '../hud/DiagramPanel';
import type { DiagramData } from '../hud/DiagramPanel';
import { ProactiveAlertToast } from '../hud/ProactiveAlertToast';
import { WorkflowPanel } from '../hud/WorkflowPanel';
import { VizPanelHost } from '../hud/viz';
import { useVizPanels } from '../../hooks/useVizPanels';
import { AgentSwarmPanel } from '../hud/AgentSwarmPanel';
import { useAgentSwarm } from '../../hooks/useAgentSwarm';
import { chatApi, proactiveModeApi, settingsApi } from '../../services/api';
import type { AgentEvent } from '../../types';
import { GestureRegistryProvider } from '../../contexts/GestureRegistryContext';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { NeuralPulseBackground } from '../hud/NeuralPulseBackground';
import { ArcReactorCore } from '../hud/ArcReactorCore';
import { DataStreamRibbon } from '../hud/DataStreamRibbon';
import type { RibbonEvent } from '../hud/DataStreamRibbon';
import { VoiceVisualizer } from '../hud/VoiceVisualizer';
import { BootSequence } from '../hud/BootSequence';
import { LiveCaptions } from '../hud/LiveCaptions';
import { lastSpeakableBoundary } from '../../utils/speech';

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

// Short acknowledgments spoken the instant a turn starts, to kill dead-air while the model works.
const ACK_PHRASES = ['On it.', 'Right away, sir.', 'One moment.', 'Of course, sir.', 'Certainly, sir.'];
const pickAck = () => ACK_PHRASES[Math.floor(Math.random() * ACK_PHRASES.length)];

// Holding phrases spoken while the model is still silent — cloud-queue first-token latency can
// exceed 30 seconds, and dead air reads as a crash. Armed once per turn at AGENT_START and
// cancelled for good at the first streamed token, so tool iterations don't replay them.
const FILLER_PHRASES = ['Still on it, sir.', 'This one needs a moment.', 'Nearly there, sir.'];
const FILLER_DELAYS_MS = [15_000, 40_000];

export const JarvisHUDView: React.FC = () => (
  <GestureRegistryProvider>
    <ErrorBoundary fallback={<HudCrashFallback />}>
      <JarvisHUDContent />
    </ErrorBoundary>
  </GestureRegistryProvider>
);

const JarvisHUDContent: React.FC = () => {
  const { theme } = useTheme();
  const { layout, updatePanelPosition, togglePanelVisibility, bringToFront, resetLayout } = useHudLayout();

  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const { enqueue: enqueueTTS, stop: stopTTS, speaking } = useNeuralTTS(ttsEnabled);
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [proactiveEnabled, setProactiveEnabled] = useState(false);
  const [vizMode, setVizMode] = useState(true);
  const [swarmMode, setSwarmMode] = useState(false);
  const [swarmDismissed, setSwarmDismissed] = useState(false);
  const [ribbons, setRibbons] = useState<RibbonEvent[]>([]);
  const [captionText, setCaptionText] = useState('');
  const [listening, setListening] = useState(false);
  const { panels: vizPanels, dispatch: vizDispatch, dismiss: vizDismiss } = useVizPanels();
  const { swarm, handleEvent: handleSwarmEvent } = useAgentSwarm();
  const commandBarRef = useRef<HTMLDivElement>(null);

  const conversationId = useChatStore(state => state.activeConversationId);
  const proactiveAlerts = useChatStore(state => state.proactiveAlerts);
  const dismissProactiveAlert = useChatStore(state => state.dismissProactiveAlert);
  const { createConversation } = useConversations();

  // If no conversation is active when the HUD opens, create one automatically
  // so the HUD is always ready to use without requiring a chat-tab visit first.
  useEffect(() => {
    if (!conversationId) {
      createConversation('J.A.R.V.I.S.').catch(() => { /* will retry on first command */ });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync the proactive toggle with the backend's actual state on mount.
  useEffect(() => {
    proactiveModeApi.getStatus()
      .then(s => setProactiveEnabled(s.enabled))
      .catch(() => { /* backend may be offline; leave default */ });
  }, []);

  // Sync the auto-visualize and multi-agent toggles with persisted backend settings on mount.
  useEffect(() => {
    settingsApi.getAll()
      .then(all => {
        const viz = all.find(x => x.settingKey === 'ui.auto_visualize');
        if (viz) setVizMode(String(viz.settingValue).toLowerCase() === 'true');
        const multi = all.find(x => x.settingKey === 'agent.multi.enabled');
        if (multi) setSwarmMode(String(multi.settingValue).toLowerCase() === 'true');
      })
      .catch(() => { /* backend may be offline; leave default */ });
  }, []);

  const { sendMessage, streamContent, convMessages, thinking, sending } = useChat(conversationId);

  const lastSpokenCountRef = useRef(0);
  const spokenConvRef = useRef<string | null>(null);
  // How many chars of the current answer have already been spoken (streaming TTS).
  const spokenLenRef = useRef(0);
  // True from AGENT_START until the first streamed token of the turn — the window in which
  // holding phrases may fire. A ref mirrors it so the per-token SSE handler can disarm it
  // without a state write per token.
  const [awaitingFirstToken, setAwaitingFirstToken] = useState(false);
  const awaitingFirstTokenRef = useRef(false);

  const handleFrontendEvent = useCallback((eventName: string, payload: unknown) => {
    if (eventName === 'render_diagram') {
      setDiagram(payload as DiagramData);
    } else {
      vizDispatch(eventName, payload);
    }
  }, [vizDispatch]);

  useSSE(conversationId, (event: AgentEvent) => {
    // Feed multi-agent ("swarm") observability state.
    handleSwarmEvent(event);
    if (event.type === 'AGENT_START') {
      setSwarmDismissed(false);
      spokenLenRef.current = 0;
      awaitingFirstTokenRef.current = true;
      setAwaitingFirstToken(true);
      // Instant verbal acknowledgment — kills the dead-air while the model spins up.
      if (ttsEnabled) {
        stopTTS();
        enqueueTTS(pickAck());
      }
    }
    if (event.type === 'TOKEN' && awaitingFirstTokenRef.current) {
      awaitingFirstTokenRef.current = false;
      setAwaitingFirstToken(false);
    }
    if ((event.type === 'AGENT_END' || event.type === 'ERROR') && awaitingFirstTokenRef.current) {
      awaitingFirstTokenRef.current = false;
      setAwaitingFirstToken(false);
    }
    if (event.type === 'STREAM_RESET') {
      // Tool-call iterations restart the token stream; restart the spoken-text pointer with
      // it, or the next iteration's sentences are sliced at a stale offset.
      spokenLenRef.current = 0;
    }
    // Speak proactive alerts aloud as well as showing the toast.
    if (event.type === 'PROACTIVE_ALERT' && ttsEnabled && event.content) {
      enqueueTTS(event.content);
    }

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

  // Streaming TTS: speak complete sentences as the answer streams in, so JARVIS starts talking
  // almost immediately instead of waiting for the whole response.
  useEffect(() => {
    if (!ttsEnabled || !streamContent) return;
    setCaptionText(streamContent);
    const boundary = lastSpeakableBoundary(streamContent);
    if (boundary > spokenLenRef.current) {
      const chunk = streamContent.slice(spokenLenRef.current, boundary);
      if (chunk.trim()) enqueueTTS(chunk);
      spokenLenRef.current = boundary;
    }
  }, [streamContent, ttsEnabled, enqueueTTS]);

  // Spoken holding phrases while the model has produced nothing yet (slow first token).
  // Once per turn: tool iterations clear the stream but never re-arm these.
  const fillerIdxRef = useRef(0);
  useEffect(() => {
    if (!ttsEnabled || !awaitingFirstToken) return;
    const timers = FILLER_DELAYS_MS.map(delay =>
      window.setTimeout(() => {
        enqueueTTS(FILLER_PHRASES[fillerIdxRef.current++ % FILLER_PHRASES.length]);
      }, delay));
    return () => timers.forEach(t => window.clearTimeout(t));
  }, [ttsEnabled, awaitingFirstToken, enqueueTTS]);

  // When a final AI message lands, speak only the tail that streaming didn't already cover (and
  // the whole thing for non-streamed turns). On conversation switch, sync the baseline so we
  // don't read stale history aloud.
  useEffect(() => {
    const aiMessages = convMessages.filter(m => m.role === 'assistant');
    if (spokenConvRef.current !== conversationId) {
      spokenConvRef.current = conversationId ?? null;
      lastSpokenCountRef.current = aiMessages.length;
      spokenLenRef.current = 0;
      return;
    }
    if (!thinking && !sending && aiMessages.length > lastSpokenCountRef.current) {
      lastSpokenCountRef.current = aiMessages.length;
      const content = aiMessages[aiMessages.length - 1]?.content ?? '';
      setCaptionText(content);
      const remainder = content.slice(spokenLenRef.current);
      if (ttsEnabled && remainder.trim()) enqueueTTS(remainder);
      spokenLenRef.current = 0; // reset for the next turn
    }
  }, [convMessages, thinking, sending, enqueueTTS, ttsEnabled, conversationId]);

  // Submit a command (from the text bar or voice). Guarantees an active conversation first, so a
  // recognized command is never silently dropped because the HUD hadn't created one yet (or the
  // backend was briefly unreachable on mount).
  const submitCommand = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (conversationId) {
      sendMessage(trimmed);
      return;
    }

    // No active conversation yet — create one and send directly to it. SSE re-subscribes when the
    // new conversation becomes active (a render later); the answer still arrives on it.
    try {
      const conv = await createConversation('J.A.R.V.I.S.');
      useChatStore.getState().addMessage(conv.id, {
        id: Date.now().toString(), role: 'user', content: trimmed,
      });
      await chatApi.sendMessage(conv.id, trimmed);
    } catch (e) {
      console.error('Failed to send command', e);
      setCaptionText('Unable to reach the core — is the backend running?');
    }
  }, [conversationId, sendMessage, createConversation]);

  // Barge-in: silence JARVIS the moment the user starts speaking.
  // NOTE: we intentionally do NOT cancel the in-flight run here. In hands-free mode the mic stays
  // open, so JARVIS's own TTS (and ambient noise) echoes back and fires onspeechstart — auto-
  // cancelling would kill the very turn that's producing the answer. True barge-in-to-cancel needs
  // the mic muted while TTS plays; until then, only stop speech.
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

  // Toggle multi-agent ("swarm") mode — persist agent.multi.enabled so the dispatcher routes
  // the next turn through the agent team instead of the single agent.
  const handleToggleSwarm = useCallback(async () => {
    const next = !swarmMode;
    setSwarmMode(next);
    try {
      await settingsApi.update('agent.multi.enabled', String(next));
    } catch (e) {
      console.error('Failed to persist multi-agent setting', e);
      setSwarmMode(!next); // revert on failure
    }
  }, [swarmMode]);

  const isCombat = theme === 'combat';
  const panels = layout.panels || {};

  const isGlobalProcessing = sending || thinking;
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

      {/* Multi-agent swarm panel — roster, internal feed, task board, graph */}
      <AnimatePresence>
        {swarmMode && !swarmDismissed && Object.keys(swarm.agents).length > 0 && (
          <AgentSwarmPanel key="swarm" swarm={swarm} onClose={() => setSwarmDismissed(true)} />
        )}
      </AnimatePresence>

      {/* Proactive Alert Toasts */}
      <ProactiveAlertToast alerts={proactiveAlerts} onDismiss={dismissProactiveAlert} />

      {/* Workflow Panel */}
      <AnimatePresence>
        {panels.workflows?.visible && (
          <WorkflowPanel key="workflows" onClose={() => togglePanelVisibility('workflows')} />
        )}
      </AnimatePresence>

      {/* Data stream ribbons — animate from command bar to result panels on tool calls */}
      <DataStreamRibbon
        events={ribbons}
        onComplete={id => setRibbons(prev => prev.filter(r => r.id !== id))}
      />

      {/* HUD Control Bar */}
      <div ref={commandBarRef} className="absolute top-0 left-0 right-0 z-[51] pointer-events-none" style={{ height: 80 }} />
      <HudControlBar
        onResetLayout={resetLayout}
        onVoiceCommand={submitCommand}
        isAiProcessing={isGlobalProcessing}
        onSubmitTextCommand={submitCommand}
        ttsEnabled={ttsEnabled}
        onToggleTTS={() => setTtsEnabled(p => !p)}
        proactiveEnabled={proactiveEnabled}
        onToggleProactive={handleToggleProactive}
        vizMode={vizMode}
        onToggleViz={handleToggleViz}
        swarmMode={swarmMode}
        onToggleSwarm={handleToggleSwarm}
        handsFree={handsFree}
        onToggleHandsFree={() => setHandsFree(p => !p)}
        onVoiceStart={handleVoiceStart}
        onListeningChange={setListening}
        voicePaused={speaking}
      />

      {/* Live subtitle captions of JARVIS's speech */}
      <LiveCaptions text={captionText} active={speaking} />

      {/* One-time boot-up sequence overlay */}
      <BootSequence />
    </div>
  );
};
