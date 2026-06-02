import { useCallback, useEffect, useRef, useState } from 'react';

export function useTTS(enabled: boolean) {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      // Prefer a deep British-male voice for a JARVIS feel, then any en-GB,
      // then any English voice, then whatever is available.
      const jarvisName = /jarvis|daniel|george|arthur|oliver|ryan|google uk english male|alex|david/i;
      voiceRef.current =
        voices.find(v => jarvisName.test(v.name)) ??
        voices.find(v => v.lang === 'en-GB') ??
        voices.find(v => v.lang.startsWith('en')) ??
        voices[0] ??
        null;
    };
    loadVoice();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoice);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !enabled || !text.trim()) return;
      window.speechSynthesis.cancel();
      // Strip markdown syntax before speaking
      const clean = text.replace(/```[\s\S]*?```/g, 'code block').replace(/[*_`#>~\[\]()]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 0.95;
      utterance.pitch = 0.85;
      utterance.volume = 1.0;
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [supported, enabled]
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported };
}
