import React, { useEffect, useRef, useCallback } from 'react'

export interface RibbonEvent {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  color?: string
}

interface DataStreamRibbonProps {
  events: RibbonEvent[]
  onComplete: (id: string) => void
}

interface Particle {
  t: number       // 0 → 1 along the bezier
  speed: number
  size: number
  color: string
  ribbonId: string
}

interface ActiveRibbon {
  id: string
  fromX: number; fromY: number
  toX: number; toY: number
  cx1: number; cy1: number  // bezier control points
  cx2: number; cy2: number
  color: string
  startMs: number
  duration: number
  particles: Particle[]
}

function bezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}

export const DataStreamRibbon: React.FC<DataStreamRibbonProps> = ({ events, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ribbonsRef = useRef<ActiveRibbon[]>([])
  const rafRef = useRef<number>(0)

  const spawnRibbon = useCallback((ev: RibbonEvent) => {
    const dx = ev.toX - ev.fromX
    const dy = ev.toY - ev.fromY
    // Arc control points — bow outward for visual elegance
    const midX = (ev.fromX + ev.toX) / 2
    const midY = (ev.fromY + ev.toY) / 2
    const perp = Math.hypot(dx, dy) * 0.35
    const angle = Math.atan2(dy, dx) - Math.PI / 2
    const cx1 = midX + Math.cos(angle) * perp - dx * 0.1
    const cy1 = midY + Math.sin(angle) * perp - dy * 0.1
    const cx2 = midX + Math.cos(angle) * perp + dx * 0.1
    const cy2 = midY + Math.sin(angle) * perp + dy * 0.1

    const color = ev.color ?? '#00d4ff'
    const particles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      t: -i * 0.06,
      speed: 0.012 + Math.random() * 0.006,
      size: 2 + Math.random() * 2.5,
      color,
      ribbonId: ev.id,
    }))

    ribbonsRef.current.push({
      id: ev.id, fromX: ev.fromX, fromY: ev.fromY,
      toX: ev.toX, toY: ev.toY, cx1, cy1, cx2, cy2,
      color, startMs: performance.now(), duration: 900,
      particles,
    })
  }, [])

  useEffect(() => {
    for (const ev of events) {
      if (!ribbonsRef.current.find(r => r.id === ev.id)) {
        spawnRibbon(ev)
      }
    }
  }, [events, spawnRibbon])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const now = performance.now()
      const completed: string[] = []

      for (const ribbon of ribbonsRef.current) {
        const age = now - ribbon.startMs
        const progress = Math.min(age / ribbon.duration, 1)
        const ribbonAlpha = progress < 0.15 ? progress / 0.15 : progress > 0.75 ? (1 - progress) / 0.25 : 1

        // Draw bezier path (faint guide)
        ctx.beginPath()
        ctx.moveTo(ribbon.fromX, ribbon.fromY)
        ctx.bezierCurveTo(ribbon.cx1, ribbon.cy1, ribbon.cx2, ribbon.cy2, ribbon.toX, ribbon.toY)
        ctx.strokeStyle = ribbon.color + Math.round(ribbonAlpha * 0x22).toString(16).padStart(2, '0')
        ctx.lineWidth = 1
        ctx.stroke()

        // Draw particles along the bezier
        let allDone = true
        for (const p of ribbon.particles) {
          p.t += p.speed
          if (p.t < 0) { allDone = false; continue }
          if (p.t > 1) continue
          allDone = false
          const px = bezierPoint(p.t, ribbon.fromX, ribbon.cx1, ribbon.cx2, ribbon.toX)
          const py = bezierPoint(p.t, ribbon.fromY, ribbon.cy1, ribbon.cy2, ribbon.toY)
          const grd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3)
          const hex = ribbon.color
          grd.addColorStop(0, hex + 'ff')
          grd.addColorStop(0.4, hex + '88')
          grd.addColorStop(1, hex + '00')
          ctx.beginPath()
          ctx.arc(px, py, p.size * 3, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
        }

        if (allDone || progress >= 1) completed.push(ribbon.id)
      }

      for (const id of completed) {
        ribbonsRef.current = ribbonsRef.current.filter(r => r.id !== id)
        onComplete(id)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [onComplete])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 45 }}
    />
  )
}
