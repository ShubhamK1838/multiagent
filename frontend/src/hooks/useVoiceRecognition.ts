import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceRecognitionOptions {
  onCommand: (text: string) => void;
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  /** When true, listens continuously and sends every finalized utterance (always-on). */
  handsFree?: boolean;
  /** Wake word — stripped from the start of a command if present, but no longer required. */
  wakeWord?: string;
  /** Fired when the user starts speaking — used for TTS barge-in. */
  onSpeechStart?: () => void;
  /** Fired when the user barges in with the wake word while JARVIS is speaking. */
  onInterrupt?: () => void;
  /** When true, ignore recognition results (e.g. while JARVIS is speaking) to avoid self-echo. */
  paused?: boolean;
}

// After TTS stops, results that finalize within this window are still JARVIS's own last
// words echoing back through the mic — discard them instead of executing them as commands.
const ECHO_TAIL_GRACE_MS = 1200;

// Pure "stop talking" phrases following the wake word in a barge-in ("jarvis, stop") —
// stripped so they silence speech without being forwarded as a command.
const STOP_PHRASE_RE = /^(?:stop(?: talking| it)?|cancel(?: that)?|be quiet|quiet|enough|never ?mind|shut up)\b[\s,.!?]*/i;

// Strip a leading wake word (e.g. "hey jarvis, ...") and return the remaining command.
function extractCommand(text: string, wakeWord: string): string | null {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(wakeWord);
  if (idx === -1) return null;
  let rest = text.slice(idx + wakeWord.length);
  // Drop a leading filler/punctuation after the wake word ("jarvis, ..." / "jarvis please ...")
  rest = rest.replace(/^[\s,.!?:;-]+/, '').replace(/^(please|can you|could you)\s+/i, '');
  return rest.trim();
}

// A barge-in like "jarvis stop" carries no command; "jarvis, what's the weather" does.
// Returns the command portion ('' when the barge-in was only a stop request).
function extractBargeInCommand(text: string, wakeWord: string): string {
  const afterWake = extractCommand(text, wakeWord) ?? text;
  return afterWake.replace(STOP_PHRASE_RE, '').trim();
}

export const useVoiceRecognition = ({
  onCommand,
  lang = 'en-US',
  continuous = false,
  interimResults = true,
  handsFree = false,
  wakeWord = 'jarvis',
  onSpeechStart,
  onInterrupt,
  paused = false,
}: UseVoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef('');

  const onCommandRef = useRef(onCommand);
  const onSpeechStartRef = useRef(onSpeechStart);
  const onInterruptRef = useRef(onInterrupt);
  const handsFreeRef = useRef(handsFree);
  const pausedRef = useRef(paused);
  const manualStopRef = useRef(false);
  // When the user barged in via interim results while JARVIS was still speaking, the final
  // result that follows is the user's real utterance — it must bypass the echo-tail guard.
  const bargeInArmedRef = useRef(false);
  // Timestamp of the last paused→unpaused transition (TTS finished), for the echo-tail guard.
  const unpausedAtRef = useRef(0);
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onSpeechStartRef.current = onSpeechStart; }, [onSpeechStart]);
  useEffect(() => { onInterruptRef.current = onInterrupt; }, [onInterrupt]);
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);
  useEffect(() => {
    if (pausedRef.current && !paused) unpausedAtRef.current = Date.now();
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    // Hands-free needs continuous capture so the mic never auto-closes between commands.
    recognition.continuous = continuous || handsFree;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onspeechstart = () => {
      if (pausedRef.current) return; // ignore our own TTS echo while JARVIS is speaking
      onSpeechStartRef.current?.();
    };

    recognition.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalStr += result[0].transcript;
        } else {
          interimStr += result[0].transcript;
        }
      }

      // Hands-free: always-on listening — send every finalized utterance. The wake word is no
      // longer required; if the user happens to say it, it's stripped off the front.
      if (handsFreeRef.current) {
        const wake = wakeWord.toLowerCase();

        if (pausedRef.current) {
          // JARVIS is speaking, so most of what the mic hears is its own TTS echo. The one
          // thing we still listen for is a wake-word barge-in ("Jarvis…", "Jarvis stop",
          // "Jarvis, what about…"): silence the speech immediately and, if a command
          // follows the wake word, execute it.
          const heard = `${finalStr} ${interimStr}`.toLowerCase();
          if (heard.includes(wake)) {
            onInterruptRef.current?.();
            if (finalStr.trim()) {
              bargeInArmedRef.current = false;
              const command = extractBargeInCommand(finalStr, wake);
              if (command && /[a-z0-9]/i.test(command)) onCommandRef.current(command);
            } else {
              bargeInArmedRef.current = true; // the full utterance finalizes in a moment
            }
          }
          setTranscript('');
          return;
        }

        setTranscript(interimStr || '');
        if (finalStr.trim()) {
          if (bargeInArmedRef.current) {
            // This final is the barge-in utterance heard while JARVIS was still talking.
            bargeInArmedRef.current = false;
            const command = extractBargeInCommand(finalStr, wake);
            if (command && /[a-z0-9]/i.test(command)) onCommandRef.current(command);
          } else if (Date.now() - unpausedAtRef.current >= ECHO_TAIL_GRACE_MS) {
            const stripped = extractCommand(finalStr, wake);
            const command = (stripped !== null ? stripped : finalStr).trim();
            // Ignore empty / wake-word-only / pure-noise results.
            if (command && /[a-z0-9]/i.test(command)) {
              onCommandRef.current(command);
            }
          }
          // else: discard — JARVIS's own last words finalizing just after TTS stopped.
          fullTranscriptRef.current = '';
          setTranscript('');
        }
        return;
      }

      if (finalStr) {
        fullTranscriptRef.current += (fullTranscriptRef.current ? ' ' : '') + finalStr.trim();
      }
      const displayTranscript = fullTranscriptRef.current + (interimStr ? (fullTranscriptRef.current ? ' ' : '') + interimStr : '');
      setTranscript(displayTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Hands-free keeps the mic alive: restart unless we stopped on purpose. Chrome
      // occasionally throws InvalidStateError on an immediate restart, so retry once
      // shortly after instead of letting always-on listening die silently.
      if (handsFreeRef.current && !manualStopRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          setTimeout(() => {
            if (!handsFreeRef.current || manualStopRef.current) return;
            try { recognition.start(); } catch { setIsListening(false); }
          }, 300);
          return;
        }
      }

      setIsListening(false);
      if (!handsFreeRef.current) {
        const finalCommand = fullTranscriptRef.current.trim();
        if (finalCommand) {
          onCommandRef.current(finalCommand);
        }
      }
      fullTranscriptRef.current = '';
      setTranscript('');
    };

    recognitionRef.current = recognition;

    // Auto-start when hands-free is enabled.
    if (handsFree) {
      manualStopRef.current = false;
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start hands-free recognition', e);
      }
    }

    return () => {
      manualStopRef.current = true;
      recognition.onend = null; // Prevent onend from firing/restarting during unmount
      recognition.onresult = null;
      recognition.onerror = null;
      try { recognition.stop(); } catch { /* already stopped */ }
    };
  }, [continuous, interimResults, lang, handsFree, wakeWord]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current || handsFreeRef.current) return; // hands-free manages itself

    if (isListening) {
      // Stopping will naturally trigger onend, which handles submitting the command
      recognitionRef.current.stop();
    } else {
      fullTranscriptRef.current = '';
      setTranscript('');
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition', e);
        setIsListening(false);
      }
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    toggleListening,
    supported,
  };
};
