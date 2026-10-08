import { useEffect, useRef } from 'react'

/**
 * ArenaBackdrop — a living engineering-canvas behind the landing hero.
 *
 * Why this, and not another gradient blob:
 * DevArena is GitHub history turned into live 1v1 battles. So the backdrop
 * fuses the two native textures of the product:
 *
 *  1. A faint GitHub contribution field (small squares that breathe like
 *     recent pushes, brightening gently near the cursor).
 *  2. Slow "duel arcs" — two hairline trajectories sweeping across the
 *     viewport with a travelling pulse, like two rivals meeting mid-arena.
 *  3. Drifting code tokens (`{}`, `=>`, `</>`) rising like embers at ~4%
 *     opacity. Barely there, but the page never feels frozen.
 *
 * Everything is drawn on a single 2D canvas at devicePixelRatio, paused
 * off-screen / on hidden tabs, and frozen to one static frame when the
 * user prefers reduced motion.
 */
export function ArenaBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const raw = canvas.getContext('2d')
    if (!raw) return
    const ctx: CanvasRenderingContext2D = raw

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let raf = 0
    let running = true
    let visible = true

    // Cursor in CSS pixels, eased toward the real pointer for a heavy,
    // premium lag instead of 1:1 tracking.
    const mouse = { x: -9999, y: -9999, ex: -9999, ey: -9999 }

    const TOKENS = ['{}', '<>', '=>', ';', 'fn', '()', '?.', '++', '</>', '01', 'if', '&&']
    interface Token {
      x: number
      y: number
      speed: number
      char: string
      size: number
      alpha: number
      wobble: number
      phase: number
    }
    let tokens: Token[] = []

    interface Cell {
      col: number
      row: number
      hot: boolean
      phase: number
      speed: number
    }
    let cells: Cell[] = []
    let cols = 0
    let rows = 0

    const CELL = 26
    const DOT = 3

    // Deterministic hash so the heat field looks hand-placed and stable
    // across resizes instead of reshuffling randomly.
    const hash = (x: number, y: number) => {
      let h = x * 374761393 + y * 668265263
      h = (h ^ (h >> 13)) * 1274126177
      return ((h ^ (h >> 16)) >>> 0) / 4294967295
    }

    const seedField = () => {
      cols = Math.ceil(width / CELL)
      rows = Math.ceil(height / CELL)
      cells = []
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          const h = hash(c, r)
          // Sparse "streaks": a few diagonal bands read as real activity.
          const band = (c * 0.7 + r * 1.3) % 9
          const hot = h > 0.86 || (band < 1.1 && h > 0.55)
          if (h < 0.42 && !hot) continue // leave breathing room — not a full grid
          cells.push({
            col: c,
            row: r,
            hot,
            phase: h * Math.PI * 2,
            speed: 0.25 + h * 0.7,
          })
        }
      }
      tokens = Array.from({ length: Math.min(30, Math.floor(width / 48)) }, (_, i) => {
        const h = hash(i, 7)
        const h2 = hash(i, 91)
        return {
          x: h * width,
          y: h2 * height,
          speed: 6 + h * 14,
          char: TOKENS[i % TOKENS.length],
          size: 11 + h2 * 7,
          alpha: 0.025 + h * 0.035,
          wobble: 8 + h2 * 18,
          phase: h * Math.PI * 2,
        }
      })
    }

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seedField()
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
        if (visible && running && !reduceMotion) {
          cancelAnimationFrame(raf)
          raf = requestAnimationFrame(frame)
        }
      },
      { threshold: 0 },
    )
    observer.observe(wrap)

    const onVis = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else {
        running = true
        if (visible && !reduceMotion) raf = requestAnimationFrame(frame)
        else if (reduceMotion) draw(0)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    const EMERALD = '0, 212, 170'
    const VIOLET = '124, 92, 255'

    function drawArc(
      t: number,
      duration: number,
      offset: number,
      color: string,
      yBase: number,
      amp: number,
    ) {
      const p = ((t / duration + offset) % 1 + 1) % 1
      const x0 = -40
      const x1 = width + 40
      const y0 = height * yBase - amp
      const y1 = height * yBase + amp
      const cx = width * 0.5
      const cy = height * yBase - amp * 1.6

      // Faint full trajectory
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.quadraticCurveTo(cx, cy, x1, y1)
      ctx.strokeStyle = `rgba(${color}, 0.10)`
      ctx.lineWidth = 1
      ctx.stroke()

      // Head position on the same quadratic curve
      const qx = (1 - p) * (1 - p) * x0 + 2 * (1 - p) * p * cx + p * p * x1
      const qy = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * cy + p * p * y1

      // Trail: last ~18% of the path
      ctx.beginPath()
      for (let i = 18; i >= 0; i -= 1) {
        const pp = p - i * 0.008
        if (pp < 0) continue
        const px = (1 - pp) * (1 - pp) * x0 + 2 * (1 - pp) * pp * cx + pp * pp * x1
        const py = (1 - pp) * (1 - pp) * y0 + 2 * (1 - pp) * pp * cy + pp * pp * y1
        if (i === 18) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      const trail = ctx.createLinearGradient(qx - 140, qy, qx, qy)
      trail.addColorStop(0, `rgba(${color}, 0)`)
      trail.addColorStop(1, `rgba(${color}, 0.5)`)
      ctx.strokeStyle = trail
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Head dot with soft halo
      const halo = ctx.createRadialGradient(qx, qy, 0, qx, qy, 14)
      halo.addColorStop(0, `rgba(${color}, 0.85)`)
      halo.addColorStop(0.35, `rgba(${color}, 0.25)`)
      halo.addColorStop(1, `rgba(${color}, 0)`)
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(qx, qy, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255,255,255, 0.9)`
      ctx.beginPath()
      ctx.arc(qx, qy, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }

    function draw(now: number) {
      const t = now / 1000
      ctx.clearRect(0, 0, width, height)

      // Ease the cursor — heavy, premium lag.
      mouse.ex += (mouse.x - mouse.ex) * 0.06
      mouse.ey += (mouse.y - mouse.ey) * 0.06

      // --- 1. Contribution field -----------------------------------------
      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i]
        const x = cell.col * CELL + CELL / 2
        const y = cell.row * CELL + CELL / 2
        const breathe = 0.5 + 0.5 * Math.sin(t * cell.speed + cell.phase)
        const dx = x - mouse.ex
        const dy = y - mouse.ey
        const dist = Math.sqrt(dx * dx + dy * dy)
        const near = Math.max(0, 1 - dist / 220)

        if (cell.hot) {
          const a = 0.05 + breathe * 0.10 + near * 0.35
          ctx.fillStyle =
            breathe > 0.72
              ? `rgba(${EMERALD}, ${Math.min(0.5, a).toFixed(3)})`
              : `rgba(232, 234, 242, ${Math.min(0.28, 0.04 + breathe * 0.06 + near * 0.25).toFixed(3)})`
          const s = DOT + (breathe > 0.8 ? 1.4 : 0) + near * 1.6
          roundRect(x - s / 2, y - s / 2, s, s, 1)
          ctx.fill()
        } else {
          const a = 0.028 + breathe * 0.02 + near * 0.14
          ctx.fillStyle = `rgba(154, 161, 181, ${Math.min(0.2, a).toFixed(3)})`
          roundRect(x - DOT / 2, y - DOT / 2, DOT, DOT, 1)
          ctx.fill()
        }
      }

      // --- 2. Duel arcs ----------------------------------------------------
      drawArc(t, 13, 0, EMERALD, 0.38, 90)
      drawArc(t, 19, 0.45, VIOLET, 0.62, 110)

      // --- 3. Rising code tokens -------------------------------------------
      ctx.textBaseline = 'middle'
      for (let i = 0; i < tokens.length; i += 1) {
        const tk = tokens[i]
        const rise = (t * tk.speed) % (height + 60)
        const y = height + 30 - rise + Math.sin(t * 0.6 + tk.phase) * 6
        const x = tk.x + Math.sin(t * 0.4 + tk.phase) * tk.wobble
        // Tokens lean away from the cursor a touch — subtle parallax.
        const px = x + (x - mouse.ex) * 0.012
        ctx.font = `500 ${tk.size}px "JetBrains Mono", ui-monospace, monospace`
        ctx.fillStyle = `rgba(232, 234, 242, ${tk.alpha.toFixed(3)})`
        ctx.fillText(tk.char, px, y)
      }

      // --- 4. Occasional vertical verify sweep ------------------------------
      const sweepP = (t % 14) / 14
      if (sweepP < 0.12) {
        const sy = sweepP / 0.12 * height
        const grad = ctx.createLinearGradient(0, sy - 70, 0, sy)
        grad.addColorStop(0, 'rgba(0, 212, 170, 0)')
        grad.addColorStop(1, 'rgba(0, 212, 170, 0.07)')
        ctx.fillStyle = grad
        ctx.fillRect(0, sy - 70, width, 70)
        ctx.fillStyle = 'rgba(0, 212, 170, 0.20)'
        ctx.fillRect(0, sy, width, 1)
      }
    }

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }

    let last = performance.now()
    function frame(now: number) {
      if (!running || !visible || document.hidden) return
      // Clamp to ~60fps work; canvas is cheap but the tab may be busy.
      if (now - last < 12) {
        raf = requestAnimationFrame(frame)
        return
      }
      last = now
      draw(now)
      raf = requestAnimationFrame(frame)
    }

    if (reduceMotion) {
      draw(1200)
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Engineering grid — static, hairline, fades toward edges */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(232 234 242 / 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgb(232 234 242 / 0.045) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 78%)',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Cinematic vignette + top/bottom blends so content stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 32%, transparent 40%, rgb(7 8 13 / 0.55) 100%), linear-gradient(to bottom, rgb(7 8 13 / 0.7), transparent 22%, transparent 62%, rgb(7 8 13) 100%)',
        }}
      />
      {/* Film grain — kills the flat digital look */}
      <div className="landing-grain absolute inset-0 opacity-[0.5]" />
    </div>
  )
}
