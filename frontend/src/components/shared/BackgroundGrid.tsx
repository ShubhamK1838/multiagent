import { useEffect, useRef } from 'react'
import { useUiSettings } from '../../hooks/useUiSettings'

export function BackgroundGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { settings } = useUiSettings()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const lineWidth = parseFloat(settings['ui.grid_line_width'] || '0.3')

    const initCanvas = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      return { width, height }
    }

    let { width, height } = initCanvas()
    const resize = () => { const d = initCanvas(); width = d.width; height = d.height }
    window.addEventListener('resize', resize)

    const gridSize = 40
    const CYAN = '#00d4ff'
    const BLUE = '#0080ff'
    const VIOLET = '#7b2fff'
    const colors = [CYAN, BLUE, VIOLET, '#00ff88', '#ff6b35']

    // Radar sweep state
    let radarAngle = 0
    const radarRadius = Math.max(width, height) * 0.7

    class DataBeam {
      isVertical: boolean
      pos: number
      current: number
      length: number
      speed: number
      dir: number
      color: string
      life: number
      maxLife: number

      constructor(w: number, h: number) {
        this.isVertical = Math.random() > 0.5
        this.dir = Math.random() > 0.5 ? 1 : -1
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.speed = 1 + Math.random() * 2.5
        this.length = 60 + Math.random() * 120
        this.life = 0
        this.maxLife = 180 + Math.random() * 280

        if (this.isVertical) {
          this.pos = Math.floor(Math.random() * Math.ceil(w / gridSize)) * gridSize
          this.current = this.dir === 1 ? -this.length : h + this.length
        } else {
          this.pos = Math.floor(Math.random() * Math.ceil(h / gridSize)) * gridSize
          this.current = this.dir === 1 ? -this.length : w + this.length
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        const progress = this.life / this.maxLife
        const alpha = Math.sin(progress * Math.PI) * 0.85
        ctx.globalAlpha = Math.max(0, alpha)
        ctx.beginPath()

        if (this.isVertical) {
          const tail = this.current - this.length * this.dir
          const g = ctx.createLinearGradient(0, tail, 0, this.current)
          g.addColorStop(0, 'rgba(0,0,0,0)')
          g.addColorStop(1, this.color)
          ctx.strokeStyle = g
          ctx.lineWidth = lineWidth
          ctx.shadowColor = this.color
          ctx.shadowBlur = lineWidth * 12
          ctx.moveTo(this.pos, tail)
          ctx.lineTo(this.pos, this.current)
        } else {
          const tail = this.current - this.length * this.dir
          const g = ctx.createLinearGradient(tail, 0, this.current, 0)
          g.addColorStop(0, 'rgba(0,0,0,0)')
          g.addColorStop(1, this.color)
          ctx.strokeStyle = g
          ctx.lineWidth = lineWidth
          ctx.shadowColor = this.color
          ctx.shadowBlur = lineWidth * 12
          ctx.moveTo(tail, this.pos)
          ctx.lineTo(this.current, this.pos)
        }
        ctx.stroke()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      update() { this.current += this.speed * this.dir; this.life++ }
    }

    let beams: DataBeam[] = []
    let frame = 0

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // 1. Base grid — very faint cyan
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      for (let x = 0; x < width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height) }
      for (let y = 0; y < height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y) }
      ctx.stroke()

      // 2. Radar sweep (subtle)
      radarAngle += 0.003
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate(radarAngle)
      const sweepArc = ctx.createRadialGradient(0, 0, 0, 0, 0, radarRadius)
      sweepArc.addColorStop(0, 'rgba(0,212,255,0.0)')
      sweepArc.addColorStop(0.6, 'rgba(0,212,255,0.02)')
      sweepArc.addColorStop(1, 'rgba(0,212,255,0.0)')
      ctx.fillStyle = sweepArc
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, radarRadius, -0.15, 0.15)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // 3. Grid node pulses at intersections (occasional)
      if (frame % 90 === 0) {
        const nx = Math.floor(Math.random() * Math.ceil(width / gridSize)) * gridSize
        const ny = Math.floor(Math.random() * Math.ceil(height / gridSize)) * gridSize
        ctx.beginPath()
        ctx.arc(nx, ny, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,212,255,0.6)'
        ctx.shadowColor = CYAN
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // 4. Traveling data beams
      const targetBeams = Math.floor((width * height) / 90000) + 5
      if (beams.length < targetBeams && Math.random() < 0.06) {
        beams.push(new DataBeam(width, height))
      }
      beams.forEach(b => { b.update(); b.draw(ctx) })
      beams = beams.filter(b => b.life < b.maxLife)

      frame++
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationFrameId) }
  }, [settings])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      }}
    />
  )
}
