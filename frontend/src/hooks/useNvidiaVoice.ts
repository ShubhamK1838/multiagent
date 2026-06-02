import { useState, useRef, useCallback, useEffect } from 'react';
import { voiceApi } from '../services/api';

interface UseNvidiaVoiceOptions {
  onCommand: (text: string) => void;
  /** Fired the moment recording starts — used for TTS barge-in. */
  onListenStart?: () => void;
}

// Encode mono Float32 PCM samples as a 16-bit WAV blob (what the Whisper NIM expects).
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([view], { type: 'audio/wav' });
}

// Average-downsample the first channel to the target rate (Whisper works at 16 kHz).
function downsampleMono(buffer: AudioBuffer, targetRate = 16000): Float32Array {
  const channel = buffer.getChannelData(0);
  if (buffer.sampleRate === targetRate) return channel;
  const ratio = buffer.sampleRate / targetRate;
  const newLen = Math.round(channel.length / ratio);
  const result = new Float32Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let sum = 0, count = 0;
    for (let j = start; j < end && j < channel.length; j++) { sum += channel[j]; count++; }
    result[i] = count ? sum / count : channel[start] || 0;
  }
  return result;
}

/**
 * Push-to-talk speech-to-text via a locally hosted NVIDIA Whisper NIM.
 * Records the mic, encodes WAV client-side, and posts to the backend, which
 * forwards to the NIM and returns the transcript.
 */
export const useNvidiaVoice = ({ onCommand, onListenStart }: UseNvidiaVoiceOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined';

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const onCommandRef = useRef(onCommand);
  const onListenStartRef = useRef(onListenStart);
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onListenStartRef.current = onListenStart; }, [onListenStart]);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const transcribeBlob = useCallback(async (recorded: Blob) => {
    setIsTranscribing(true);
    setTranscript('Transcribing…');
    let ctx: AudioContext | null = null;
    try {
      const arrayBuffer = await recorded.arrayBuffer();
      ctx = new AudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const wav = encodeWav(downsampleMono(audioBuffer), 16000);
      const text = await voiceApi.transcribe(wav);
      setTranscript(text);
      if (text.trim()) onCommandRef.current(text.trim());
    } catch (e) {
      console.error('NVIDIA transcription failed', e);
      setTranscript('Transcription failed');
    } finally {
      ctx?.close().catch(() => {});
      setIsTranscribing(false);
      // Briefly leave the transcript on screen, then clear it.
      setTimeout(() => setTranscript(''), 2500);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!supported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        cleanupStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];
        if (blob.size > 0) transcribeBlob(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsListening(true);
      onListenStartRef.current?.();
    } catch (e) {
      console.error('Failed to access microphone', e);
      setIsListening(false);
      cleanupStream();
    }
  }, [supported, cleanupStream, transcribeBlob]);

  const stopRecording = useCallback(() => {
    setIsListening(false);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop(); // triggers onstop → transcription
    }
    recorderRef.current = null;
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopRecording();
    else startRecording();
  }, [isListening, startRecording, stopRecording]);

  useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    cleanupStream();
  }, [cleanupStream]);

  return { isListening, isTranscribing, transcript, toggleListening, supported };
};
