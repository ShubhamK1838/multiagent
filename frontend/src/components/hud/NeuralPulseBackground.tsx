import React, { useEffect, useRef } from 'react'

interface NeuralPulseBackgroundProps {
  isThinking: boolean
}

interface Node { x: number; y: number; vx: number; vy: number }
interface Pulse { fromIdx: number; toIdx: number; t: number; speed: number; color: string }

const THINKING_COLORS = ['#00d4ff', '#a855f7', '#3b82f6']
const IDLE_COLORS     = ['#00d4ff33', '#a855f733']
const NODE_COUNT = 28

function seedNodes(w: number, h: number): Node[] {
  return Array.from({ length: NODE_COUNT }, (_, i) => ({
    x: (((i * 2654435761) % w + w) % w),
    y: (((i * 1234567891) % h + h) % h),
    vx: (Math.sin(i * 1.3) * 0.18),
    vy: (Math.cos(i * 0.9) * 0.18),
  }))
}

export const NeuralPulseBackground: React.FC<NeuralPulseBackgroundProps> = ({ isThinking }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef  = useRef<{
    nodes: Node[]
    pulses: Pulse[]
    raf: number
    thinking: boolean
    lastSpawn: number
  }>({ nodes: [], pulses: [], raf: 0, thinking: false, lastSpawn: 0 })

  useEffect(() => {
    stateRef.current.thinking = isThinking
  }, [isThinking])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = window.innerWidth, h = window.innerHeight

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w; canvas.height = h
      if (stateRef.current.nodes.length === 0) {
        stateRef.current.nodes = seedNodes(w, h)
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const EDGE_DIST = 200
    const MAX_PULSES = 18

    const spawnPulse = () => {
      const { nodes, pulses, thinking } = stateRef.current
      if (pulses.length >= MAX_PULSES) return
      const fromIdx = Math.floor(Math.random() * nodes.length)
      // find a neighbour
      let bestDist = Infinity, toIdx = -1
      for (let i = 0; i < nodes.length; i++) {
        if (i === fromIdx) continue
        const d = Math.hypot(nodes[i].x - nodes[fromIdx].x, nodes[i].y - nodes[fromIdx].y)
        if (d < EDGE_DIST && d < bestDist) { bestDist = d; toIdx = i }
      }
      if (toIdx === -1) return
      const colors = thinking ? THINKING_COLORS : IDLE_COLORS
      pulses.push({
        fromIdx, toIdx, t: 0,
        speed: thinking ? 0.006 + Math.random() * 0.008 : 0.003 + Math.random() * 0.003,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const draw = (ts: number) => {
      const { nodes, pulses, thinking, lastSpawn } = stateRef.current
      ctx.clearRect(0, 0, w, h)

      // Move nodes slowly
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      }

      // Spawn pulses
      const spawnInterval = thinking ? 120 : 500
      if (ts - lastSpawn > spawnInterval) {
        spawnPulse()
        stateRef.current.lastSpawn = ts
      }

      // Edges
      const edgeAlpha = thinking ? 0.12 : 0.04
      ctx.lineWidth = 0.5
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)
          if (d < EDGE_DIST) {
            const alpha = edgeAlpha * (1 - d / EDGE_DIST)
            ctx.strokeStyle = `rgba(0,212,255,${alpha})`
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Nodes
      const nodeAlpha = thinking ? 0.55 : 0.18
      const nodeR = thinking ? 2.5 : 1.5
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, nodeR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,212,255,${nodeAlpha})`
        ctx.fill()
      }

      // Pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]
        p.t += p.speed
        if (p.t >= 1) { pulses.splice(i, 1); continue }
        const from = nodes[p.fromIdx], to = nodes[p.toIdx]
        const px = from.x + (to.x - from.x) * p.t
        const py = from.y + (to.y - from.y) * p.t
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 8)
        grd.addColorStop(0, p.color.replace(/33$/, '') + 'dd')
        grd.addColorStop(1, p.color.replace(/33$/, '') + '00')
        ctx.beginPath()
        ctx.arc(px, py, 8, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
      }

      stateRef.current.raf = requestAnimationFrame(draw)
    }

    stateRef.current.raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(stateRef.current.raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1, opacity: 0.9 }}
    />
  )
}
