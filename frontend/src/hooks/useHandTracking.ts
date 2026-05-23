import { useEffect, useRef, useState } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export type HandGesture = 'None' | 'Pinch'

export interface HandTrackingData {
  isActive: boolean
  gesture: HandGesture
  x: number // Normalized 0 to 1
  y: number // Normalized 0 to 1
  z: number // Approximate depth
}

// Singleton instances to avoid opening multiple webcams and models
let sharedVideo: HTMLVideoElement | null = null
let sharedLandmarker: HandLandmarker | null = null
let streamPromise: Promise<void> | null = null
let isInitializing = false

export function useHandTracking() {
  const reqRef = useRef<number>()

  const [isReady, setIsReady] = useState(false)

  // Use refs for high-frequency data instead of state to prevent 60fps re-renders
  const dataRef = useRef<HandTrackingData>({
    isActive: false,
    gesture: 'None',
    x: 0,
    y: 0,
    z: 0,
  })

  // Expose a snapshot for the UI, but we don't update it 60 times a second
  const [uiSnapshot, setUiSnapshot] = useState(dataRef.current)

  useEffect(() => {
    let active = true

    // Update UI snapshot occasionally (e.g. 10fps) for HUD
    const uiInterval = setInterval(() => {
      setUiSnapshot({ ...dataRef.current })
    }, 100)

    async function initSingleton() {
      if (!isInitializing && !sharedLandmarker) {
        isInitializing = true

        try {
          // 1. Setup Vision tasks
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
          )

          sharedLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: 1
          })

          // 2. Setup Webcam
          sharedVideo = document.createElement('video')
          sharedVideo.autoplay = true
          sharedVideo.playsInline = true

          streamPromise = navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 }
          }).then(stream => {
            if (sharedVideo) {
               sharedVideo.srcObject = stream
               return new Promise<void>((resolve) => {
                 if (sharedVideo) sharedVideo.onloadeddata = () => resolve()
               })
            }
          })

          await streamPromise
        } catch (err) {
          console.error('Error accessing webcam for hand tracking:', err)
        } finally {
          isInitializing = false
        }
      } else if (isInitializing) {
        // Wait for it to finish if another component started it
        while (isInitializing) {
           await new Promise(r => setTimeout(r, 100))
        }
      }

      if (!active) return

      if (sharedVideo && sharedLandmarker) {
        setIsReady(true)

        // 3. Start prediction loop
        let lastVideoTime = -1
        const loop = () => {
          if (!sharedVideo || !sharedLandmarker) return

          const startTimeMs = performance.now()
          if (sharedVideo.currentTime !== lastVideoTime) {
            lastVideoTime = sharedVideo.currentTime
            const results = sharedLandmarker.detectForVideo(sharedVideo, startTimeMs)

            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0]

              // Get Index finger tip (8) and Thumb tip (4)
              const indexTip = landmarks[8]
              const thumbTip = landmarks[4]

              // Calculate distance to detect a "Pinch" gesture
              const dx = indexTip.x - thumbTip.x
              const dy = indexTip.y - thumbTip.y
              const dz = indexTip.z - thumbTip.z
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

              // Map x coordinate: mirror it since webcam is mirrored
              const x = 1.0 - indexTip.x
              const y = indexTip.y
              const z = indexTip.z

              dataRef.current = {
                isActive: true,
                gesture: distance < 0.05 ? 'Pinch' : 'None',
                x,
                y,
                z,
              }
            } else {
              if (dataRef.current.isActive) {
                dataRef.current.isActive = false
                dataRef.current.gesture = 'None'
              }
            }
          }
          reqRef.current = requestAnimationFrame(loop)
        }
        loop()
      }
    }

    initSingleton()

    return () => {
      active = false
      clearInterval(uiInterval)
      if (reqRef.current) cancelAnimationFrame(reqRef.current)

      // Note: In a true singleton, we don't close the landmarker or webcam on unmount
      // if we expect other components to still use it. For this scope, it's safer
      // to keep them alive for the duration of the app session, or implement ref-counting.
    }
  }, [])

  return { isReady, dataRef, uiSnapshot }
}
