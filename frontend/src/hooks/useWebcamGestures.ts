import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export interface HandCursor {
  id: string;
  x: number;
  y: number;
  isPinching: boolean;
  isGrabbing: boolean;
  isActive: boolean;
}

export type GestureType =
  | 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'SWIPE_UP' | 'SWIPE_DOWN'
  | 'OPEN_PALM' | 'PINCH_DELETE' | 'TWO_HANDS_EXPAND'
  | 'NONE';

interface UseWebcamGesturesProps {
  onGesture?: (gesture: GestureType) => void;
  enabled?: boolean;
}

export function useWebcamGestures({ onGesture, enabled = true }: UseWebcamGesturesProps = {}) {
  const [cursors, setCursors] = useState<HandCursor[]>([]);
  const [isReady, setIsReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  
  // Gesture tracking state (for swipes)
  const gestureState = useRef({
    startX: 0,
    startY: 0,
    isTracking: false,
    startTime: 0,
    lastGestureTime: 0
  });

  // Extra state for new gestures
  const pinchStartTimeRef = useRef<number>(0);
  const twoHandsExpandRef = useRef<{ startDist: number; startTime: number } | null>(null);

  // Keep previous cursors for Hysteresis
  const prevCursorsRef = useRef<HandCursor[]>([]);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2 // Upgraded to track 2 hands!
        });
        
        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
        }
      } catch (err) {
        console.error("Failed to initialize MediaPipe HandLandmarker", err);
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, [enabled]);

  // Setup Webcam and rendering loop
  useEffect(() => {
    if (!enabled || !isReady) return;

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    videoRef.current = video;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        video.srcObject = stream;
        
        video.addEventListener('loadeddata', () => {
          predictWebcam();
        });
      } catch (err) {
        console.error("Webcam access denied or failed", err);
      }
    };

    let lastVideoTime = -1;
    const predictWebcam = () => {
      if (!videoRef.current || !landmarkerRef.current) return;
      
      const startTimeMs = performance.now();
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = landmarkerRef.current.detectForVideo(video, startTimeMs);
        processResults(results);
      }
      
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    };

    startCamera();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isReady, enabled]);

  // Process Hand Landmarks into Cursor and Gestures
  const processResults = useCallback((results: HandLandmarkerResult) => {
    if (!results.landmarks || results.landmarks.length === 0) {
      setCursors([]);
      prevCursorsRef.current = [];
      return;
    }

    // Use Anatomical Handedness for persistent identity
    const unsortedCursors: HandCursor[] = results.landmarks.map((hand, idx) => {
      // MediaPipe provides 'Left' or 'Right'
      const id = results.handedness[idx][0].categoryName;
      
      // Find previous state for THIS EXACT HAND, regardless of position
      const prev = prevCursorsRef.current.find(c => c.id === id);
      
      const targetX = (1 - hand[8].x) * window.innerWidth;
      const targetY = hand[8].y * window.innerHeight;

      let x = targetX;
      let y = targetY;

      if (prev) {
        // Dynamic Adaptive Smoothing
        // If grabbing, we want zero perceived lag, so we use high responsiveness (0.8).
        // If just hovering, we apply heavy smoothing (down to 0.15) for small jitters.
        const dist = Math.hypot(targetX - prev.x, targetY - prev.y);
        let dynamicSmoothing = prev.isGrabbing ? 0.8 : Math.min(0.8, Math.max(0.15, dist / 80));
        
        x = prev.x + (targetX - prev.x) * dynamicSmoothing;
        y = prev.y + (targetY - prev.y) * dynamicSmoothing;
      }

      const handScale = Math.hypot(hand[5].x - hand[0].x, hand[5].y - hand[0].y);
      const distPinch = Math.hypot(hand[8].x - hand[4].x, hand[8].y - hand[4].y);
      const distGrab = Math.hypot(hand[12].x - hand[0].x, hand[12].y - hand[0].y);

      // HYSTERESIS LOGIC
      let isPinching = prev?.isPinching ?? false;
      if (isPinching) {
        // Must open wide to break the pinch lock
        if (distPinch > handScale * 0.8) isPinching = false;
      } else {
        // Must close tight to trigger a pinch
        if (distPinch < handScale * 0.4) isPinching = true;
      }

      let isGrabbing = prev?.isGrabbing ?? false;
      if (isGrabbing) {
        // Must open hand wide to break the grab lock
        if (distGrab > handScale * 1.6) isGrabbing = false;
      } else {
        // Must close fist tight to trigger grab
        if (distGrab < handScale * 1.1) isGrabbing = true;
      }

      return {
        id,
        x, y,
        isPinching,
        isGrabbing,
        isActive: true
      };
    });

    // Sort by ID to ensure primary/secondary hands don't randomly swap
    // if both are present in the frame
    const newCursors = unsortedCursors.sort((a, b) => a.id.localeCompare(b.id));

    setCursors(newCursors);
    prevCursorsRef.current = newCursors;

    // Gesture Detection Logic (Swipes) — use primary hand (index 0)
    const primary = newCursors[0];
    const state = gestureState.current;
    const now = Date.now();

    if (now - state.lastGestureTime < 1000) return;

    // --- Swipe detection (grab + release + movement) ---
    if (primary.isGrabbing && !state.isTracking) {
      state.isTracking = true;
      state.startX = primary.x;
      state.startY = primary.y;
      state.startTime = now;
    } else if (!primary.isGrabbing && state.isTracking) {
      state.isTracking = false;
      const dx = primary.x - state.startX;
      const dy = primary.y - state.startY;
      const duration = now - state.startTime;

      if (duration < 600 && Math.max(Math.abs(dx), Math.abs(dy)) > 150) {
        let detected: GestureType;
        if (Math.abs(dx) > Math.abs(dy)) {
          detected = dx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
        } else {
          detected = dy > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP';
        }
        if (onGesture) {
          onGesture(detected);
          state.lastGestureTime = now;
        }
      }
    }

    // --- PINCH_DELETE: hold pinch > 1.5 s ---
    if (primary.isPinching) {
      if (pinchStartTimeRef.current === 0) {
        pinchStartTimeRef.current = now;
      } else if (now - pinchStartTimeRef.current > 1500) {
        if (onGesture) onGesture('PINCH_DELETE');
        pinchStartTimeRef.current = 0;
        state.lastGestureTime = now;
      }
    } else {
      pinchStartTimeRef.current = 0;
    }

    // --- OPEN_PALM: 4+ fingers extended, no pinch/grab ---
    if (!primary.isGrabbing && !primary.isPinching) {
      const hand = results.landmarks[0];
      if (hand) {
        // Finger extended = tip.y < pip.y (smaller y = higher in normalized space)
        const indexExtended = hand[8].y < hand[6].y;
        const middleExtended = hand[12].y < hand[10].y;
        const ringExtended   = hand[16].y < hand[14].y;
        const pinkyExtended  = hand[20].y < hand[18].y;
        const extendedCount  = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

        if (extendedCount >= 3 && now - state.lastGestureTime > 1500) {
          if (onGesture) {
            onGesture('OPEN_PALM');
            state.lastGestureTime = now;
          }
        }
      }
    }

    // --- TWO_HANDS_EXPAND: two open hands moving apart ---
    if (newCursors.length === 2) {
      const [a, b] = newCursors;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const exp = twoHandsExpandRef.current;

      if (!a.isGrabbing && !b.isGrabbing && !a.isPinching && !b.isPinching) {
        if (!exp) {
          twoHandsExpandRef.current = { startDist: dist, startTime: now };
        } else if (now - exp.startTime < 700 && dist - exp.startDist > 180) {
          if (onGesture) {
            onGesture('TWO_HANDS_EXPAND');
            state.lastGestureTime = now;
          }
          twoHandsExpandRef.current = null;
        } else if (now - exp.startTime >= 700) {
          twoHandsExpandRef.current = { startDist: dist, startTime: now };
        }
      } else {
        twoHandsExpandRef.current = null;
      }
    } else {
      twoHandsExpandRef.current = null;
    }
  }, [onGesture]);

  return { cursors, isReady };
}
