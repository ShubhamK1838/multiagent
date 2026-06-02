import React, { useEffect, useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

interface VoiceVisualizerProps {
  /** Whether JARVIS is currently producing voice (speaking). */
  active: boolean
}

/**
 * A radial audio waveform that rings the arc reactor and reacts to JARVIS's
 * voice. The Web Speech synthesis API does not expose an analysable audio
 * stream, so while `active` is true we synthesize a speech-like amplitude
 * envelope (syllable rhythm + jitter) and render it as 60fps canvas bars.
 * When inactive the bars decay smoothly to zero.
 *
 * Drawing happens entirely on canvas via requestAnimationFrame, so it triggers
 * no React re-renders.
 */
export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const combat = theme === 'combat'

  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const BARS = 84
    const bars = new Array(BARS).fill(0)
    let level = 0
    let phase = 0
    let raf = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const main = combat ? '#ff3b3b' : '#00d4ff'
    const accent = combat ? '#ff9d3b' : '#a855f7'

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const cx = w / 2
      const cy = h / 2
      ctx.clearRect(0, 0, w, h)

      phase += 0.09
      let target = 0
      if (activeRef.current) {
        const syllable = Math.max(0, Math.sin(phase * 1.7) * 0.5 + 0.5)
        target = Math.min(1, syllable * 0.7 + Math.random() * 0.45)
      }
      // Fast attack while speaking, slow release when idle.
      level += (target - level) * (activeRef.current ? 0.4 : 0.07)

      const baseR = Math.min(w, h) * 0.27
      const maxLen = Math.min(w, h) * 0.17

      for (let i = 0; i < BARS; i++) {
        // Voice-like spectrum: louder in the centre bands, quieter at edges.
        const center = 1 - Math.abs(i - BARS / 2) / (BARS / 2)
        const barTarget = activeRef.current
          ? Math.random() * level * (0.35 + center * 0.9)
          : 0
        bars[i] += (barTarget - bars[i]) * 0.35

        const a = (i / BARS) * Math.PI * 2 - Math.PI / 2
        const len = bars[i] * maxLen
        const r1 = baseR
        const r2 = baseR + len
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2)
        ctx.strokeStyle = i % 6 === 0 ? accent : main
        ctx.globalAlpha = 0.2 + bars[i] * 0.8
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Inner amplitude ring that breathes with the overall level.
      if (level > 0.01) {
        ctx.beginPath()
        ctx.arc(cx, cy, baseR - 8 - level * 5, 0, Math.PI * 2)
        ctx.strokeStyle = main
        ctx.globalAlpha = 0.12 + level * 0.5
        ctx.lineWidth = 1.5 + level * 2.5
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [combat])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 z-[3] w-full h-full pointer-events-none"
    />
  )
}
