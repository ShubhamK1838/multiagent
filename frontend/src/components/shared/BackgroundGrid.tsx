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
    
    // Dynamic settings from database
    const lineWidth = parseFloat(settings['ui.grid_line_width'] || '0.2')
    const gridOpacity = settings['ui.grid_opacity'] || '0.015'

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

    const resize = () => {
      const dims = initCanvas()
      width = dims.width
      height = dims.height
    }
    window.addEventListener('resize', resize)

    const gridSize = 32
    // Cyberpunk/synthwave color palette for the beams
    const colors = ['#8b5cf6', '#22d3ee', '#ec4899', '#10b981', '#f59e0b']
    
    class GlowLine {
      isVertical: boolean
      pos: number
      start: number
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
        this.speed = 1.5 + Math.random() * 2 // Speed of the beam
        this.length = 80 + Math.random() * 150 // Length of the tail
        this.life = 0
        this.maxLife = 200 + Math.random() * 300

        if (this.isVertical) {
          const cols = Math.ceil(w / gridSize)
          this.pos = Math.floor(Math.random() * cols) * gridSize
          // Start slightly off screen
          this.start = this.dir === 1 ? -this.length : h + this.length
        } else {
          const rows = Math.ceil(h / gridSize)
          this.pos = Math.floor(Math.random() * rows) * gridSize
          this.start = this.dir === 1 ? -this.length : w + this.length
        }
        this.current = this.start
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Smooth fade in and out using a sine wave
        const progress = this.life / this.maxLife
        const alpha = Math.sin(progress * Math.PI) * 0.9 // Max opacity 0.9

        ctx.globalAlpha = Math.max(0, alpha)
        
        ctx.beginPath()
        
        if (this.isVertical) {
          const tailEnd = this.current - this.length * this.dir
          const gradient = ctx.createLinearGradient(0, tailEnd, 0, this.current)
          gradient.addColorStop(0, 'rgba(0,0,0,0)')
          gradient.addColorStop(1, this.color)
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = lineWidth
          ctx.moveTo(this.pos, tailEnd)
          ctx.lineTo(this.pos, this.current)
        } else {
          const tailEnd = this.current - this.length * this.dir
          const gradient = ctx.createLinearGradient(tailEnd, 0, this.current, 0)
          gradient.addColorStop(0, 'rgba(0,0,0,0)')
          gradient.addColorStop(1, this.color)
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = lineWidth
          ctx.moveTo(tailEnd, this.pos)
          ctx.lineTo(this.current, this.pos)
        }
        
        // Add a neon glow effect to the line
        ctx.shadowColor = this.color
        ctx.shadowBlur = Math.max(2, lineWidth * 15)
        ctx.stroke()
        
        // Reset shadow and alpha for other drawing operations
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      update() {
        this.current += this.speed * this.dir
        this.life++
      }
    }

    let lines: GlowLine[] = []

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // 1. Draw base faint grid
      ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`
      ctx.lineWidth = lineWidth
      ctx.beginPath()
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()

      // 2. Randomly spawn new traveling lines
      // Keep about 10-20 lines on screen depending on screen size
      const targetLines = Math.floor((width * height) / 100000) + 5
      
      if (lines.length < targetLines && Math.random() < 0.05) {
         lines.push(new GlowLine(width, height))
      }

      // 3. Update and draw traveling lines
      lines.forEach(line => {
        line.update()
        line.draw(ctx)
      })

      // 4. Remove dead lines (either faded out or off screen)
      lines = lines.filter(l => l.life < l.maxLife)

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [settings]) // Re-run when settings change

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        // Fades out the grid edges so it blends nicely into the deep background
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      }}
    />
  )
}
