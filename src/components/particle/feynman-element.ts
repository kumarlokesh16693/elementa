/**
 * ELEMENTA — Particle Physics & Feynman Diagram Studio
 * Custom Web Component: <elementa-feynman>
 *
 * Canvas-based vector renderer for Feynman diagrams:
 *   - Directed fermion lines with arrows (flow forwards for particles, backwards for antiparticles)
 *   - Sinusoidal undulating paths for photons
 *   - Coiled cycloid helices for gluons
 *   - Dashed and wavy lines for weak gauge bosons (W±, Z⁰)
 *   - Dashed cyan paths for Higgs bosons
 *   - Glowing interactive vertex nodes with conservation status indicators
 *   - Hover tooltips and vertex inspection dispatching both lowercase and kebab-case events
 */

import {
  FEYNMAN_PRESETS,
  type FeynmanPreset,
  type FeynmanVertex,
  type FeynmanLeg,
  getParticle,
  checkVertexConservation,
  type VertexConservationResult,
} from '@/lib/particle'

export class ElementaFeynmanElement extends HTMLElement {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private preset: FeynmanPreset = FEYNMAN_PRESETS.ee_to_mumu
  private selectedChannel: string = 's-channel'
  private hoveredVertexId: string | null = null
  private selectedVertexId: string | null = null
  private hoveredLegId: string | null = null
  private animFrameId: number | null = null
  private animTime: number = 0
  private isAnimating: boolean = true

  // Canvas bounds cache
  private dpr: number = 1
  private width: number = 700
  private height: number = 440

  static get observedAttributes(): string[] {
    return ['preset', 'channel', 'animating']
  }

  connectedCallback(): void {
    this.innerHTML = `
      <div class="relative w-full h-full flex flex-col select-none overflow-hidden rounded-xl bg-[#090d16] border border-white/10 shadow-2xl">
        <canvas class="w-full h-full block cursor-default"></canvas>
      </div>
    `
    this.canvas = this.querySelector('canvas')
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d')
      this.setupEventListeners()
      this.resize()
    }

    const presetAttr = this.getAttribute('preset')
    if (presetAttr && FEYNMAN_PRESETS[presetAttr]) {
      this.preset = FEYNMAN_PRESETS[presetAttr]
      this.selectedChannel = this.preset.defaultChannel
    }

    window.addEventListener('resize', this.onResize)
    this.startAnimation()
  }

  disconnectedCallback(): void {
    window.removeEventListener('resize', this.onResize)
    this.stopAnimation()
  }

  attributeChangedCallback(name: string, _oldVal: string, newVal: string): void {
    if (name === 'preset' && newVal && FEYNMAN_PRESETS[newVal]) {
      this.setPreset(newVal)
    } else if (name === 'channel' && newVal) {
      this.setChannel(newVal)
    } else if (name === 'animating') {
      this.isAnimating = newVal !== 'false'
    }
  }

  private onResize = (): void => {
    this.resize()
    this.render()
  }

  public resize(): void {
    if (!this.canvas) return
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = window.devicePixelRatio || 1
    this.width = Math.max(rect.width, 320)
    this.height = Math.max(rect.height, 280)

    this.canvas.width = this.width * this.dpr
    this.canvas.height = this.height * this.dpr
    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0)
      this.ctx.scale(this.dpr, this.dpr)
    }
  }

  public setPreset(presetId: string, channel?: string): void {
    const p = FEYNMAN_PRESETS[presetId]
    if (!p) return
    this.preset = p
    this.selectedChannel = channel ?? p.defaultChannel
    this.selectedVertexId = null
    this.hoveredVertexId = null
    this.hoveredLegId = null

    this.dispatchCustomEvent('presetchange', { preset: p, channel: this.selectedChannel })
    this.dispatchCustomEvent('preset-change', { preset: p, channel: this.selectedChannel })
    this.render()
  }

  public setChannel(channel: string): void {
    this.selectedChannel = channel
    this.render()
  }

  public setSelectedVertex(vertexId: string | null): void {
    this.selectedVertexId = vertexId
    this.render()
  }

  public toggleAnimation(active?: boolean): void {
    this.isAnimating = active !== undefined ? active : !this.isAnimating
    if (this.isAnimating && !this.animFrameId) {
      this.startAnimation()
    }
  }

  private startAnimation(): void {
    const loop = (ts: number) => {
      this.animTime = ts * 0.001
      this.render()
      if (this.isAnimating) {
        this.animFrameId = requestAnimationFrame(loop)
      } else {
        this.animFrameId = null
      }
    }
    this.animFrameId = requestAnimationFrame(loop)
  }

  private stopAnimation(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  private dispatchCustomEvent(name: string, detail: any): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private setupEventListeners(): void {
    if (!this.canvas) return

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = this.canvas!.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      let hoveredVertex: FeynmanVertex | null = null
      let hoveredLeg: FeynmanLeg | null = null

      // Check vertex hit (radius ~22px)
      for (const v of this.preset.vertices) {
        const vx = v.position.x * this.width
        const vy = v.position.y * this.height
        const dist = Math.hypot(mx - vx, my - vy)
        if (dist <= 22) {
          hoveredVertex = v
          break
        }
      }

      // If no vertex hovered, check leg hit (within 14px of line segment)
      if (!hoveredVertex) {
        for (const leg of this.preset.legs) {
          if (!leg.startPos || !leg.endPos) continue
          const x1 = leg.startPos.x * this.width
          const y1 = leg.startPos.y * this.height
          const x2 = leg.endPos.x * this.width
          const y2 = leg.endPos.y * this.height
          const d = this.distanceToSegment(mx, my, x1, y1, x2, y2)
          if (d <= 14) {
            hoveredLeg = leg
            break
          }
        }
      }

      const prevHoverV = this.hoveredVertexId
      const prevHoverL = this.hoveredLegId

      this.hoveredVertexId = hoveredVertex ? hoveredVertex.id : null
      this.hoveredLegId = hoveredLeg ? hoveredLeg.id : null

      this.canvas!.style.cursor = hoveredVertex || hoveredLeg ? 'pointer' : 'default'

      if (prevHoverV !== this.hoveredVertexId || prevHoverL !== this.hoveredLegId) {
        if (hoveredVertex) {
          const cons = checkVertexConservation(hoveredVertex.incomingParticles, hoveredVertex.outgoingParticles)
          this.dispatchCustomEvent('vertexhover', { vertex: hoveredVertex, conservation: cons })
          this.dispatchCustomEvent('vertex-hover', { vertex: hoveredVertex, conservation: cons })
        }
        this.render()
      }
    })

    this.canvas.addEventListener('click', (e: MouseEvent) => {
      const rect = this.canvas!.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      let clickedVertex: FeynmanVertex | null = null
      for (const v of this.preset.vertices) {
        const vx = v.position.x * this.width
        const vy = v.position.y * this.height
        if (Math.hypot(mx - vx, my - vy) <= 24) {
          clickedVertex = v
          break
        }
      }

      if (clickedVertex) {
        this.selectedVertexId = clickedVertex.id
        const cons = checkVertexConservation(clickedVertex.incomingParticles, clickedVertex.outgoingParticles)
        this.dispatchCustomEvent('vertexselect', { vertex: clickedVertex, conservation: cons })
        this.dispatchCustomEvent('vertex-select', { vertex: clickedVertex, conservation: cons })
      } else {
        this.selectedVertexId = null
        this.dispatchCustomEvent('vertexselect', { vertex: null })
        this.dispatchCustomEvent('vertex-select', { vertex: null })
      }
      this.render()
    })

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredVertexId = null
      this.hoveredLegId = null
      this.canvas!.style.cursor = 'default'
      this.render()
    })
  }

  private distanceToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)
    if (l2 === 0) return Math.hypot(px - x1, py - y1)
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)))
  }

  // --------------------------------------------------------------------------
  // Vector Rendering Pipeline
  // --------------------------------------------------------------------------

  public render(): void {
    if (!this.ctx || !this.canvas) return
    const ctx = this.ctx
    const W = this.width
    const H = this.height

    ctx.clearRect(0, 0, W, H)

    // 1. Quantum Space-Time Background Grid & Axis
    this.drawBackgroundGrid(ctx, W, H)

    // 2. Draw Feynman Legs (Propagators and external lines)
    for (const leg of this.preset.legs) {
      this.drawLeg(ctx, leg, W, H)
    }

    // 3. Draw Feynman Vertices (Glowing nodes & conservation checks)
    for (const v of this.preset.vertices) {
      this.drawVertex(ctx, v, W, H)
    }

    // 4. Overlays & Annotations
    this.drawHeaderInfo(ctx, W, H)
  }

  private drawBackgroundGrid(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    // Subtle space-time coordinate grid
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)'
    ctx.lineWidth = 1

    const step = 36
    for (let x = 0; x <= W; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y <= H; y += step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    // Time arrow at bottom left (Feynman time flow left -> right)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)'
    ctx.lineWidth = 1.2

    const ax1 = 20
    const ax2 = 110
    const ay = H - 22
    ctx.beginPath()
    ctx.moveTo(ax1, ay)
    ctx.lineTo(ax2, ay)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(ax2, ay)
    ctx.lineTo(ax2 - 6, ay - 3)
    ctx.lineTo(ax2 - 6, ay + 3)
    ctx.closePath()
    ctx.fill()

    ctx.font = '9.5px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('Time t →', ax1, ay - 11)

    // Space indicator
    const sy2 = H - 70
    ctx.beginPath()
    ctx.moveTo(ax1, ay)
    ctx.lineTo(ax1, sy2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(ax1, sy2)
    ctx.lineTo(ax1 - 3, sy2 + 6)
    ctx.lineTo(ax1 + 3, sy2 + 6)
    ctx.closePath()
    ctx.fill()
    ctx.fillText('Space x ↑', ax1 + 6, sy2 + 6)

    ctx.restore()
  }

  private drawLeg(
    ctx: CanvasRenderingContext2D,
    leg: FeynmanLeg,
    W: number,
    H: number,
  ): void {
    if (!leg.startPos || !leg.endPos) return

    const x1 = leg.startPos.x * W
    const y1 = leg.startPos.y * H
    const x2 = leg.endPos.x * W
    const y2 = leg.endPos.y * H

    const isHovered = this.hoveredLegId === leg.id
    const isPropagator = leg.role === 'propagator'
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy)
    if (len < 1) return

    const ux = dx / len
    const uy = dy / len
    const nx = -uy
    const ny = ux

    ctx.save()

    // Select color palette by particle style
    let strokeColor = '#94a3b8'
    let glowColor = 'transparent'

    if (leg.style === 'fermion') {
      strokeColor = isHovered ? '#67e8f9' : '#38bdf8'
      glowColor = isHovered ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.15)'
    } else if (leg.style === 'photon') {
      strokeColor = isHovered ? '#fef08a' : '#facc15'
      glowColor = isHovered ? 'rgba(250, 204, 21, 0.5)' : 'rgba(250, 204, 21, 0.2)'
    } else if (leg.style === 'weak') {
      strokeColor = isHovered ? '#c4b5fd' : '#a78bfa'
      glowColor = isHovered ? 'rgba(167, 139, 250, 0.5)' : 'rgba(167, 139, 250, 0.2)'
    } else if (leg.style === 'gluon') {
      strokeColor = isHovered ? '#fdba74' : '#fb923c'
      glowColor = isHovered ? 'rgba(251, 146, 60, 0.5)' : 'rgba(251, 146, 60, 0.2)'
    } else if (leg.style === 'higgs') {
      strokeColor = isHovered ? '#6ee7b7' : '#34d399'
      glowColor = isHovered ? 'rgba(52, 211, 153, 0.5)' : 'rgba(52, 211, 153, 0.2)'
    }

    ctx.strokeStyle = strokeColor
    ctx.lineWidth = isHovered ? 2.8 : isPropagator ? 2.4 : 2.0
    ctx.shadowColor = glowColor
    ctx.shadowBlur = isHovered ? 12 : isPropagator ? 8 : 4

    // 1. Draw Path Geometry
    if (leg.style === 'fermion') {
      // Straight line
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()

      // Arrow indicator for fermion flow
      const arrowForward = leg.arrowForward !== false
      const midT = 0.52
      const mx = x1 + ux * len * midT
      const my = y1 + uy * len * midT
      const arrowDirX = arrowForward ? ux : -ux
      const arrowDirY = arrowForward ? uy : -uy
      const arrowNormX = -arrowDirY
      const arrowNormY = arrowDirX
      const arrowSize = 8

      ctx.fillStyle = strokeColor
      ctx.beginPath()
      ctx.moveTo(mx + arrowDirX * arrowSize, my + arrowDirY * arrowSize)
      ctx.lineTo(
        mx - arrowDirX * arrowSize + arrowNormX * (arrowSize * 0.7),
        my - arrowDirY * arrowSize + arrowNormY * (arrowSize * 0.7),
      )
      ctx.lineTo(
        mx - arrowDirX * arrowSize - arrowNormX * (arrowSize * 0.7),
        my - arrowDirY * arrowSize - arrowNormY * (arrowSize * 0.7),
      )
      ctx.closePath()
      ctx.fill()
    } else if (leg.style === 'photon') {
      // Sinusoidal Wavy Line
      const wavelength = 18
      const nWaves = Math.max(3, Math.round(len / wavelength))
      const amp = isHovered ? 7.5 : 6.0
      const phase = this.isAnimating ? this.animTime * 4.0 : 0

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      const steps = nWaves * 16
      for (let s = 1; s <= steps; s++) {
        const t = s / steps
        const env = Math.sin(Math.PI * t) // zero at endpoints
        const wave = Math.sin(t * nWaves * Math.PI * 2 - phase) * amp * env
        const px = x1 + ux * (t * len) + nx * wave
        const py = y1 + uy * (t * len) + ny * wave
        ctx.lineTo(px, py)
      }
      ctx.stroke()
    } else if (leg.style === 'weak') {
      // Dashed Sinusoidal Wavy Line for Heavy Vector Bosons (W/Z)
      const wavelength = 22
      const nWaves = Math.max(2, Math.round(len / wavelength))
      const amp = 6.0
      ctx.setLineDash([6, 3])

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      const steps = nWaves * 14
      for (let s = 1; s <= steps; s++) {
        const t = s / steps
        const env = Math.sin(Math.PI * t)
        const wave = Math.sin(t * nWaves * Math.PI * 2) * amp * env
        const px = x1 + ux * (t * len) + nx * wave
        const py = y1 + uy * (t * len) + ny * wave
        ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])
    } else if (leg.style === 'gluon') {
      // Coiled Curly Springs (Cycloid Helix)
      const nLoops = Math.max(3, Math.round(len / 20))
      const r = isHovered ? 6.5 : 5.5
      const steps = nLoops * 24

      ctx.beginPath()
      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        const angle = t * nLoops * Math.PI * 2
        // Cycloid displacement
        const along = t * len + Math.cos(angle) * r
        const across = Math.sin(angle) * r
        const px = x1 + ux * along + nx * across
        const py = y1 + uy * along + ny * across
        if (s === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    } else if (leg.style === 'higgs') {
      // Dashed scalar line
      ctx.setLineDash([7, 4])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Animated energy packet along propagator
    if (this.isAnimating && isPropagator) {
      const pulseT = (this.animTime * 0.8) % 1.0
      const pulseX = x1 + ux * (pulseT * len)
      const pulseY = y1 + uy * (pulseT * len)
      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = strokeColor
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(pulseX, pulseY, 3.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // 2. Draw Leg Particle Pill Label
    const labelT = isPropagator ? 0.5 : 0.65
    let lx = x1 + ux * (labelT * len) + nx * 16
    let ly = y1 + uy * (labelT * len) + ny * 16

    // Bound inside canvas margins
    lx = Math.max(35, Math.min(W - 35, lx))
    ly = Math.max(25, Math.min(H - 25, ly))

    ctx.shadowBlur = 0
    this.drawLegBadge(ctx, leg, lx, ly, strokeColor, isHovered)

    ctx.restore()
  }

  private drawLegBadge(
    ctx: CanvasRenderingContext2D,
    leg: FeynmanLeg,
    x: number,
    y: number,
    tint: string,
    isHovered: boolean,
  ): void {
    const text = leg.label
    ctx.font = isHovered
      ? 'bold 11px ui-monospace, monospace'
      : '10.5px ui-monospace, monospace'

    const metrics = ctx.measureText(text)
    const paddingX = 7
    const paddingY = 3.5
    const bw = metrics.width + paddingX * 2
    const bh = 18

    const bx = x - bw / 2
    const by = y - bh / 2

    // Pill background
    ctx.fillStyle = isHovered ? 'rgba(15, 23, 42, 0.95)' : 'rgba(9, 13, 22, 0.85)'
    ctx.strokeStyle = isHovered ? tint : 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1

    ctx.beginPath()
    ctx.roundRect(bx, by, bw, bh, 5)
    ctx.fill()
    ctx.stroke()

    // Text
    ctx.fillStyle = isHovered ? '#ffffff' : tint
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y + 0.5)
  }

  private drawVertex(
    ctx: CanvasRenderingContext2D,
    vertex: FeynmanVertex,
    W: number,
    H: number,
  ): void {
    const x = vertex.position.x * W
    const y = vertex.position.y * H

    const isHovered = this.hoveredVertexId === vertex.id
    const isSelected = this.selectedVertexId === vertex.id
    const cons = checkVertexConservation(vertex.incomingParticles, vertex.outgoingParticles)

    ctx.save()

    // 1. Halo Glow Ring
    const haloRadius = isSelected ? 22 : isHovered ? 18 : 14
    const ringColor = !cons.valid
      ? 'rgba(239, 68, 68, 0.8)' // Red for conservation violation
      : isSelected
        ? 'rgba(56, 189, 248, 0.9)'
        : isHovered
          ? 'rgba(56, 189, 248, 0.6)'
          : 'rgba(52, 211, 153, 0.4)'

    ctx.strokeStyle = ringColor
    ctx.lineWidth = isSelected ? 2.5 : 1.5
    ctx.shadowColor = ringColor
    ctx.shadowBlur = isSelected ? 18 : isHovered ? 12 : 6

    ctx.beginPath()
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2)
    ctx.stroke()

    // 2. Vertex Central Core Node
    const coreRadius = isSelected ? 6.5 : isHovered ? 5.5 : 4.5
    ctx.fillStyle = !cons.valid ? '#ef4444' : isSelected ? '#38bdf8' : '#e2e8f0'
    ctx.beginPath()
    ctx.arc(x, y, coreRadius, 0, Math.PI * 2)
    ctx.fill()

    // 3. Vertex Label & Coupling Text Badge
    const labelY = y < H * 0.4 ? y + 26 : y - 26
    ctx.shadowBlur = 0
    ctx.font = 'bold 10px ui-monospace, monospace'
    const labelText = vertex.label
    const coupText = vertex.couplingLabel
    const combined = `${labelText} [${coupText}]`
    const met = ctx.measureText(combined)

    const bw = met.width + 12
    const bh = 18
    const bx = x - bw / 2
    const by = labelY - bh / 2

    ctx.fillStyle = 'rgba(10, 15, 24, 0.92)'
    ctx.strokeStyle = isSelected
      ? 'rgba(56, 189, 248, 0.6)'
      : !cons.valid
        ? 'rgba(239, 68, 68, 0.6)'
        : 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1

    ctx.beginPath()
    ctx.roundRect(bx, by, bw, bh, 4)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = !cons.valid ? '#fca5a5' : isSelected ? '#7dd3fc' : '#cbd5e1'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(combined, x, labelY)

    ctx.restore()
  }

  private drawHeaderInfo(ctx: CanvasRenderingContext2D, W: number, _H: number): void {
    ctx.save()

    // Top process title badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(16, 14, Math.min(W - 32, 420), 40, 8)
    ctx.fill()
    ctx.stroke()

    ctx.font = 'bold 12px ui-monospace, monospace'
    ctx.fillStyle = '#f1f5f9'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(this.preset.name, 26, 20)

    ctx.font = '10.5px ui-monospace, monospace'
    ctx.fillStyle = '#38bdf8'
    ctx.fillText(this.preset.equation, 26, 36)

    // Channel indicator badge at top right
    const chanText = `Channel: ${this.selectedChannel}`
    ctx.font = 'bold 10px ui-monospace, monospace'
    const cMet = ctx.measureText(chanText)
    const cbw = cMet.width + 16
    const cbx = W - cbw - 16
    const cby = 16

    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)'
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'
    ctx.beginPath()
    ctx.roundRect(cbx, cby, cbw, 22, 6)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#7dd3fc'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(chanText, cbx + cbw / 2, cby + 11)

    ctx.restore()
  }
}

if (!customElements.get('elementa-feynman')) {
  customElements.define('elementa-feynman', ElementaFeynmanElement)
}
