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
  /** When true, ignore recognition results (e.g. while JARVIS is speaking) to avoid self-echo. */
  paused?: boolean;
}

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

export const useVoiceRecognition = ({
  onCommand,
  lang = 'en-US',
  continuous = false,
  interimResults = true,
  handsFree = false,
  wakeWord = 'jarvis',
  onSpeechStart,
  paused = false,
}: UseVoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef('');

  const onCommandRef = useRef(onCommand);
  const onSpeechStartRef = useRef(onSpeechStart);
  const handsFreeRef = useRef(handsFree);
  const pausedRef = useRef(paused);
  const manualStopRef = useRef(false);
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onSpeechStartRef.current = onSpeechStart; }, [onSpeechStart]);
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

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
        if (pausedRef.current) { setTranscript(''); return; } // muted while JARVIS speaks
        setTranscript(interimStr || '');
        if (finalStr.trim()) {
          const stripped = extractCommand(finalStr, wakeWord.toLowerCase());
          const command = (stripped !== null ? stripped : finalStr).trim();
          // Ignore empty / wake-word-only / pure-noise results.
          if (command && /[a-z0-9]/i.test(command)) {
            onCommandRef.current(command);
          }
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
      // Hands-free keeps the mic alive: restart unless we stopped on purpose.
      if (handsFreeRef.current && !manualStopRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to the normal stop path if restart fails.
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
