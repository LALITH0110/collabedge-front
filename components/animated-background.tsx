"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    console.log("AnimatedBackground useEffect running")
    const canvas = canvasRef.current
    if (!canvas) {
      console.log("Canvas not found!")
      return
    }
    console.log("Canvas found:", canvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.log("Context not found!")
      return
    }
    console.log("Context found:", ctx)

    // Set canvas dimensions to fill the entire viewport with extra boundaries
    const resizeCanvas = () => {
      if (!canvas) return
      // Make canvas much larger than viewport to ensure coverage
      canvas.width = window.innerWidth * 1.5
      canvas.height = window.innerHeight * 1.5
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    
    // Test: Draw something immediately to verify canvas works
    console.log("Drawing test elements...")
    ctx.fillStyle = "red"
    ctx.fillRect(50, 50, 100, 100)
    ctx.fillStyle = "blue"
    ctx.beginPath()
    ctx.arc(200, 200, 50, 0, Math.PI * 2)
    ctx.fill()
    console.log("Test elements drawn")
    
    // Also resize when the document content changes (for dynamic content)
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })
    resizeObserver.observe(document.body)

    // Create particles
    const particlesArray: Particle[] = []
    const numberOfParticles = 100
    // More muted, dark theme colors
    const colors = ["#4f46e5", "#8b5cf6", "#3b82f6", "#06b6d4", "#14b8a6"]

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        // Safe to use canvas here since we already checked for null above
        this.x = Math.random() * (canvas?.width || window.innerWidth * 1.5)
        this.y = Math.random() * (canvas?.height || window.innerHeight * 1.5)
        this.size = Math.random() * 3 + 1
        this.speedX = Math.random() * 1 - 0.5
        this.speedY = Math.random() * 1 - 0.5
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (canvas) {
          if (this.x > canvas.width) this.x = 0
          else if (this.x < 0) this.x = canvas.width
          if (this.y > canvas.height) this.y = 0
          else if (this.y < 0) this.y = canvas.height
        }
      }

      draw() {
        if (!ctx) return
        // Make particles more visible
        ctx.globalAlpha = 0.9
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1.0
      }
    }

    function init() {
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle())
      }
    }

    let animationFrame = 0
    function animate() {
      if (!ctx || !canvas) return
      animationFrame++
      if (animationFrame % 60 === 0) {
        console.log("Animation running, frame:", animationFrame)
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update()
        particlesArray[i].draw()

        // Connect particles with lines
        for (let j = i; j < particlesArray.length; j++) {
          const dx = particlesArray[i].x - particlesArray[j].x
          const dy = particlesArray[i].y - particlesArray[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            // More subtle, darker connections
            ctx.strokeStyle = `rgba(80, 80, 200, ${0.15 - distance / 500})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particlesArray[i].x, particlesArray[i].y)
            ctx.lineTo(particlesArray[j].x, particlesArray[j].y)
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(animate)
    }

    init()
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      resizeObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed z-10 pointer-events-none bg-black" style={{ top: '0', left: '0', width: '100%', height: '100%'}} />
  //return <canvas ref={canvasRef} className="absolute -z-10 bg-black" style={{ height: '100%', minHeight: '100%', top: '0', right: '0', left: '-20px', width: 'calc(100% + 20px)' }} />
}