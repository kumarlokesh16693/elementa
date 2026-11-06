/**
 * ELEMENTA — 2D Bose–Einstein Condensate & Quantum Vortex Lab
 * Custom Web Component: <elementa-bec>
 *
 * Canvas-based real-time simulation and visualization of the Gross–Pitaevskii equation.
 * Features:
 *   - High-performance pixel rendering using OffscreenCanvas and putImageData
 *   - Hardware-accelerated bilinear upsampling to display canvas
 *   - 3 Visualization modes:
 *       • 'density': Inferno colormap of |ψ|²
 *       • 'phase': Cyclic HSV map of arg(ψ) showing phase singularities
 *       • 'combined': Density as luminance, phase as hue (reveals vortex lattices)
 *   - Vector overlay with detected vortices (topological charge +1/-1 in cyan/magenta)
 *   - Real-time scale bar in natural harmonic oscillator units (a_ho)
 *   - Interactive click-to-imprint vortex nucleation
 *   - CustomEvent 'bec-update' emitting live observables and FPS
 */

import {
  N,
  L,
  DX,
  createBecState,
  initGroundState,
  stepSSFM,
  addVortex,
  detectVortices,
  computeObservables,
  type BecState,
  type BecParams,
  type BecObservables,
  type TrapType,
} from '@/lib/bec'

// --- Colormap Precomputations ---

// Inferno Colormap 256 RGB LUT
// Anchors:
//   0   -> [0, 0, 4]
//   64  -> [61, 9, 107]
//   128 -> [188, 55, 84]
//   192 -> [249, 142, 9]
//   255 -> [252, 255, 164]
const INFERNO_LUT = new Uint8ClampedArray(256 * 3)

function buildInferno(): void {
  const anchors = [
    { p: 0, r: 0, g: 0, b: 4 },
    { p: 64, r: 61, g: 9, b: 107 },
    { p: 128, r: 188, g: 55, b: 84 },
    { p: 192, r: 249, g: 142, b: 9 },
    { p: 255, r: 252, g: 255, b: 164 },
  ]

  for (let i = 0; i < 256; i++) {
    let a0 = anchors[0]
    let a1 = anchors[1]
    for (let k = 0; k < anchors.length - 1; k++) {
      if (i >= anchors[k].p && i <= anchors[k + 1].p) {
        a0 = anchors[k]
        a1 = anchors[k + 1]
        break
      }
    }
    const span = a1.p - a0.p
    const t = span === 0 ? 0 : (i - a0.p) / span
    INFERNO_LUT[i * 3 + 0] = Math.round(a0.r + (a1.r - a0.r) * t)
    INFERNO_LUT[i * 3 + 1] = Math.round(a0.g + (a1.g - a0.g) * t)
    INFERNO_LUT[i * 3 + 2] = Math.round(a0.b + (a1.b - a0.b) * t)
  }
}
buildInferno()

// Cyclic HSV Colormap 512 entries for Hue ∈ [0, 2π)
const HSV_LUT = new Uint8ClampedArray(512 * 3)

function buildHsv(): void {
  for (let i = 0; i < 512; i++) {
    const h = (i / 512) * 6
    const x = 1 - Math.abs((h % 2) - 1)
    let r = 0,
      g = 0,
      b = 0
    if (h < 1) {
      r = 1
      g = x
      b = 0
    } else if (h < 2) {
      r = x
      g = 1
      b = 0
    } else if (h < 3) {
      r = 0
      g = 1
      b = x
    } else if (h < 4) {
      r = 0
      g = x
      b = 1
    } else if (h < 5) {
      r = x
      g = 0
      b = 1
    } else {
      r = 1
      g = 0
      b = x
    }
    HSV_LUT[i * 3 + 0] = Math.round(r * 255)
    HSV_LUT[i * 3 + 1] = Math.round(g * 255)
    HSV_LUT[i * 3 + 2] = Math.round(b * 255)
  }
}
buildHsv()

export type BecViewMode = 'density' | 'phase' | 'combined'

export class ElementaBecElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['mode', 'g', 'omega', 'trap', 'speed', 'paused']
  }

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null = null
  private offscreenCanvas: HTMLCanvasElement
  private offscreenCtx: CanvasRenderingContext2D | null = null
  private imageData: ImageData

  private state: BecState
  private params: BecParams
  private _mode: BecViewMode = 'combined'
  private _speed = 2
  private _paused = false

  get mode(): BecViewMode {
    return this._mode
  }
  set mode(m: BecViewMode) {
    if (['density', 'phase', 'combined'].includes(m)) {
      this._mode = m
    }
  }

  get speed(): number {
    return this._speed
  }
  set speed(s: number | string) {
    const val = typeof s === 'string' ? parseInt(s, 10) : s
    if (Number.isFinite(val) && val >= 1 && val <= 30) {
      this._speed = val
    }
  }

  get paused(): boolean {
    return this._paused
  }
  set paused(p: boolean | string) {
    this._paused = p === true || p === 'true'
  }

  get g(): number {
    return this.params.g
  }
  set g(val: number | string) {
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (Number.isFinite(num) && num >= 0) this.params.g = num
  }

  get omega(): number {
    return this.params.omega
  }
  set omega(val: number | string) {
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (Number.isFinite(num) && num >= 0) this.params.omega = num
  }

  get trap(): TrapType {
    return this.params.trap
  }
  set trap(t: TrapType) {
    if (['harmonic', 'double-well', 'ring', 'toroidal'].includes(t)) {
      if (this.params.trap !== t) {
        this.params.trap = t
        initGroundState(this.state, this.params, 50)
      }
    }
  }

  private rafId = 0
  private resizeObserver: ResizeObserver | null = null
  private displayMaxDensity = 0.25

  // Performance monitoring
  private lastTime = 0
  private frameCount = 0
  private fps = 60
  private stepsPerSec = 300
  private lastStatsEmit = 0

  constructor() {
    super()

    this.state = createBecState()
    this.params = {
      g: 5.0,
      omega: 0.0,
      trap: 'harmonic',
      dt: 0.005,
      mu: 1.0,
    }

    // Main display canvas
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'w-full h-full block cursor-crosshair select-none'

    // Offscreen 128×128 pixel buffer for SSFM output
    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCanvas.width = N
    this.offscreenCanvas.height = N
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')
    this.imageData = new ImageData(N, N)
  }

  connectedCallback(): void {
    if (!this.contains(this.canvas)) {
      this.replaceChildren(this.canvas)
    }

    this.ctx = this.canvas.getContext('2d', { alpha: false })
    this.updateFromAttributes()

    // Initialize ground state with optimized 50-step relaxation (~350ms)
    initGroundState(this.state, this.params, 50)

    // Canvas click to imprint vortex
    this.canvas.addEventListener('click', this.handleCanvasClick)

    // Resize handling
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas())
    this.resizeObserver.observe(this)
    this.resizeCanvas()

    this.lastTime = performance.now()
    this.lastStatsEmit = performance.now()
    this.startLoop()
  }

  disconnectedCallback(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    this.canvas.removeEventListener('click', this.handleCanvasClick)
  }

  attributeChangedCallback(name: string, oldVal: string, newVal: string): void {
    if (oldVal === newVal) return
    this.updateFromAttributes()
  }

  private updateFromAttributes(): void {
    const modeAttr = this.getAttribute('mode') as BecViewMode | null
    if (modeAttr && ['density', 'phase', 'combined'].includes(modeAttr)) {
      this.mode = modeAttr
    }

    const gAttr = this.getAttribute('g')
    if (gAttr != null) {
      const g = parseFloat(gAttr)
      if (Number.isFinite(g) && g >= 0) this.params.g = g
    }

    const omegaAttr = this.getAttribute('omega')
    if (omegaAttr != null) {
      const omega = parseFloat(omegaAttr)
      if (Number.isFinite(omega) && omega >= 0) this.params.omega = omega
    }

    const trapAttr = this.getAttribute('trap') as TrapType | null
    if (
      trapAttr &&
      ['harmonic', 'double-well', 'ring', 'toroidal'].includes(trapAttr)
    ) {
      if (this.params.trap !== trapAttr) {
        this.params.trap = trapAttr
        initGroundState(this.state, this.params, 50)
      }
    }

    const speedAttr = this.getAttribute('speed')
    if (speedAttr != null) {
      const speed = parseInt(speedAttr, 10)
      if (Number.isFinite(speed) && speed >= 1 && speed <= 30) {
        this.speed = speed
      }
    }

    const pausedAttr = this.getAttribute('paused')
    if (pausedAttr != null) {
      this.paused = pausedAttr === 'true'
    }
  }

  private resizeCanvas(): void {
    const rect = this.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(128, Math.floor(rect.width * dpr))
    const h = Math.max(128, Math.floor(rect.height * dpr))

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
  }

  private handleCanvasClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    // Map screen coordinate to physical box [-L/2, L/2]
    const u = px / rect.width
    const v = py / rect.height
    const x0 = -L / 2 + u * L
    const y0 = L / 2 - v * L // Canvas y is flipped relative to physical y

    // Imprint vortex with charge +1 (or -1 if shift key held)
    const charge = e.shiftKey ? -1 : 1
    addVortex(this.state, x0, y0, charge)
  }

  public reset(preset?: string): void {
    if (preset === 'ground') {
      this.params.g = 5.0
      this.params.omega = 0.0
      this.params.trap = 'harmonic'
    } else if (preset === 'vortex-lattice') {
      this.params.g = 10.0
      this.params.omega = 0.7
      this.params.trap = 'harmonic'
    } else if (preset === 'double-well') {
      this.params.g = 5.0
      this.params.omega = 0.0
      this.params.trap = 'double-well'
    } else if (preset === 'ring') {
      this.params.g = 5.0
      this.params.omega = 0.3
      this.params.trap = 'ring'
    } else if (preset === 'giant-vortex') {
      this.params.g = 15.0
      this.params.omega = 0.85
      this.params.trap = 'toroidal'
    }

    initGroundState(this.state, this.params, 50)

    if (preset === 'giant-vortex') {
      addVortex(this.state, 0, 0, 1)
      addVortex(this.state, 0, 0, 1)
      addVortex(this.state, 0, 0, 1)
    }
  }

  public addVortexAt(x = 0, y = 0, charge = 1): void {
    addVortex(this.state, x, y, charge)
  }

  public stir(steps = 220): void {
    this.state.stirSteps = steps
  }

  public setViewMode(m: BecViewMode): void {
    this.mode = m
    this.setAttribute('mode', m)
  }

  public getState(): BecState {
    return this.state
  }

  public getParams(): BecParams {
    return this.params
  }

  public getObservables(): BecObservables {
    return computeObservables(this.state, this.params)
  }

  private startLoop(): void {
    const loop = (now: number) => {
      this.rafId = requestAnimationFrame(loop)

      // Time step simulation
      if (!this.paused) {
        for (let s = 0; s < this.speed; s++) {
          stepSSFM(this.state, this.params)
        }
      }

      // Render frame
      this.renderFrame()

      // FPS and steps per second tracking
      this.frameCount++
      const elapsed = now - this.lastTime
      if (elapsed >= 500) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed)
        this.stepsPerSec = this.paused ? 0 : this.fps * this.speed
        this.frameCount = 0
        this.lastTime = now
      }

      // Emit observables every 120ms
      if (now - this.lastStatsEmit > 120) {
        this.lastStatsEmit = now
        const obs = computeObservables(this.state, this.params)
        const updateDetail = {
          observables: obs,
          fps: this.fps,
          stepsPerSec: this.stepsPerSec,
          time: this.state.time,
          stirring: this.state.stirSteps > 0,
        }
        this.dispatchEvent(
          new CustomEvent('becupdate', {
            bubbles: true,
            composed: true,
            detail: updateDetail,
          }),
        )
        this.dispatchEvent(
          new CustomEvent('bec-update', {
            bubbles: true,
            composed: true,
            detail: updateDetail,
          }),
        )
      }
    }

    this.rafId = requestAnimationFrame(loop)
  }

  private renderFrame(): void {
    if (!this.ctx || !this.offscreenCtx) return

    const density = this.state.density
    const phase = this.state.phase
    const pixels = this.imageData.data

    // Dynamic density normalization for rich contrast
    let peakDens = 0
    for (let i = 0; i < N * N; i++) {
      if (density[i] > peakDens) peakDens = density[i]
    }
    this.displayMaxDensity =
      this.displayMaxDensity * 0.96 + Math.max(0.08, peakDens) * 0.04

    const maxD = this.displayMaxDensity * 1.15
    const invMaxD = 1 / maxD

    const mode = this.mode

    // Populate offscreen 128×128 pixel buffer
    let ptr = 0
    for (let k = 0; k < N; k++) {
      // Invert row so y increases upwards on display
      const row = N - 1 - k
      const rowOffset = row * N

      for (let j = 0; j < N; j++) {
        const idx = rowOffset + j
        const dens = density[idx]
        const ph = phase[idx]

        if (mode === 'density') {
          // Inferno Colormap
          const normD = dens * invMaxD
          const cIdx = Math.min(255, Math.max(0, Math.floor(normD * 255)))
          const lutPtr = cIdx * 3
          pixels[ptr++] = INFERNO_LUT[lutPtr]
          pixels[ptr++] = INFERNO_LUT[lutPtr + 1]
          pixels[ptr++] = INFERNO_LUT[lutPtr + 2]
          pixels[ptr++] = 255
        } else if (mode === 'phase') {
          // Cyclic HSV Phase Map with vacuum fading
          const hNorm = (ph + Math.PI) / (2 * Math.PI)
          const hIdx = Math.min(511, Math.max(0, Math.floor(hNorm * 512)))
          const lutPtr = hIdx * 3

          // Fade smoothly to background in vacuum
          const fade = Math.min(1.0, Math.sqrt(dens / 0.003))
          pixels[ptr++] = Math.round(HSV_LUT[lutPtr] * fade + 7 * (1 - fade))
          pixels[ptr++] = Math.round(
            HSV_LUT[lutPtr + 1] * fade + 10 * (1 - fade),
          )
          pixels[ptr++] = Math.round(
            HSV_LUT[lutPtr + 2] * fade + 16 * (1 - fade),
          )
          pixels[ptr++] = 255
        } else {
          // Combined Mode: Density as luminance, Phase as Hue
          const hNorm = (ph + Math.PI) / (2 * Math.PI)
          const hIdx = Math.min(511, Math.max(0, Math.floor(hNorm * 512)))
          const lutPtr = hIdx * 3

          // Tone-mapped luminance (gamma 0.55 for vibrant vortex cores)
          const v = Math.min(1.0, Math.max(0.0, Math.pow(dens * invMaxD, 0.55)))

          pixels[ptr++] = Math.round(HSV_LUT[lutPtr] * v)
          pixels[ptr++] = Math.round(HSV_LUT[lutPtr + 1] * v)
          pixels[ptr++] = Math.round(HSV_LUT[lutPtr + 2] * v)
          pixels[ptr++] = 255
        }
      }
    }

    this.offscreenCtx.putImageData(this.imageData, 0, 0)

    // Hardware-accelerated bilinear upsampling to display canvas
    const dw = this.canvas.width
    const dh = this.canvas.height
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    this.ctx.drawImage(this.offscreenCanvas, 0, 0, dw, dh)

    // Render Vector Overlays: Vortices, Scale Bar, and Reticle
    this.renderOverlays(dw, dh)
  }

  private renderOverlays(w: number, h: number): void {
    const ctx = this.ctx
    if (!ctx) return

    // Subtle coordinate reticle at center
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
    ctx.restore()

    // Detect and draw quantum vortex cores
    const vortices = detectVortices(this.state)
    for (const v of vortices) {
      // Map physical coordinate (v.x, v.y) ∈ [-L/2, L/2] to canvas pixels
      const cx = ((v.x + L / 2) / L) * w
      const cy = ((L / 2 - v.y) / L) * h // y inverted in canvas

      ctx.save()
      const isPositive = v.charge > 0
      const color = isPositive ? '#22d3ee' : '#f43f5e' // Cyan (+) or Magenta/Rose (-)

      // Glowing outer ring
      ctx.shadowBlur = 8
      ctx.shadowColor = color
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, 7, 0, 2 * Math.PI)
      ctx.stroke()

      // Charge symbol (+ or −)
      ctx.fillStyle = color
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(isPositive ? '+' : '−', cx, cy)
      ctx.restore()
    }

    // Scale Bar in natural units (4 a_ho)
    const scaleLengthPhysical = 4.0 // 4 harmonic oscillator lengths
    const scaleLengthPx = (scaleLengthPhysical / L) * w
    const scaleX = 24
    const scaleY = h - 24

    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 2
    ctx.beginPath()
    // Main horizontal scale line
    ctx.moveTo(scaleX, scaleY)
    ctx.lineTo(scaleX + scaleLengthPx, scaleY)
    // Left and right vertical ticks
    ctx.moveTo(scaleX, scaleY - 5)
    ctx.lineTo(scaleX, scaleY + 5)
    ctx.moveTo(scaleX + scaleLengthPx, scaleY - 5)
    ctx.lineTo(scaleX + scaleLengthPx, scaleY + 5)
    ctx.stroke()

    // Scale label
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('4 a_ho', scaleX + scaleLengthPx / 2, scaleY - 8)
    ctx.restore()

    // Top Right Status Pill
    ctx.save()
    const badgeText = `${this.mode.toUpperCase()} · t = ${this.state.time.toFixed(1)}`
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1
    const textWidth = ctx.measureText(badgeText).width
    const bx = w - textWidth - 28
    const by = 16
    ctx.beginPath()
    ctx.roundRect(bx, by, textWidth + 16, 22, 6)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#cbd5e1'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, bx + 8, by + 11)
    ctx.restore()

    // Stirring active banner
    if (this.state.stirSteps > 0) {
      ctx.save()
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)'
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(16, 16, 110, 22, 6)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#fbbf24'
      ctx.font = 'bold 10px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⚡ STIRRING ACTIVE', 71, 27)
      ctx.restore()
    }
  }
}

if (!customElements.get('elementa-bec')) {
  customElements.define('elementa-bec', ElementaBecElement)
}
