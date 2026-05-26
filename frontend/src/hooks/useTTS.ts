import { useCallback, useEffect, useRef } from 'react';

export function useTTS(enabled: boolean) {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find(v => /daniel|alex|david/i.test(v.name)) ??
        voices.find(v => v.lang.startsWith('en') && !v.localService === false) ??
        voices.find(v => v.lang.startsWith('en')) ??
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
      window.speechSynthesis.speak(utterance);
    },
    [supported, enabled]
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { speak, stop, supported };
}
