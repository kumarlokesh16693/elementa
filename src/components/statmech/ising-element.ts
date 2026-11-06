/**
 * ELEMENTA — Statistical Mechanics & Phase Transitions Lab
 * Custom Web Component: <elementa-ising>
 *
 * Real-time 2D Ising Model simulation and high-performance pixel rendering.
 * Features:
 *   - Direct ImageData pixel manipulation using 128×128 OffscreenCanvas.
 *   - Fast crisp upscaling to responsive display canvas with image-rendering: pixelated.
 *   - Interactive domain painting:
 *       • Left-click & drag: paint Spin +1 (Seed Up domain)
 *       • Right-click / Shift+Click & drag: paint Spin -1 (Seed Down domain)
 *   - Dual event dispatch: 'statmechupdate' and 'statmech-update' for seamless framework binding.
 *   - Themes: 'amber-navy' (default), 'cyan-dark', 'emerald-obsidian', 'monochrome'.
 *   - Public control methods: resetRandom(), alignUp(), alignDown(), checkerboard(), domainWall(), anneal().
 */

import {
  L,
  N_SPINS,
  createStatMechState,
  stepMonteCarloSweep,
  accumulateObservables,
  setLatticeRandom,
  setLatticeAllUp,
  setLatticeAllDown,
  setLatticeCheckerboard,
  setLatticeDomainWall,
  type StatMechState,
  type StatMechParams,
  type StatMechObservables,
} from '@/lib/statmech'

export type IsingTheme =
  | 'amber-navy'
  | 'cyan-dark'
  | 'emerald-obsidian'
  | 'monochrome'

interface ThemeColors {
  up: [number, number, number] // [r, g, b]
  down: [number, number, number]
}

const THEME_PALETTES: Record<IsingTheme, ThemeColors> = {
  'amber-navy': {
    up: [251, 191, 36], // Amber-400
    down: [12, 18, 32], // Deep Navy
  },
  'cyan-dark': {
    up: [34, 211, 238], // Cyan-400
    down: [8, 14, 26], // Midnight
  },
  'emerald-obsidian': {
    up: [52, 211, 153], // Emerald-400
    down: [6, 18, 14], // Dark Pine
  },
  'monochrome': {
    up: [244, 244, 245], // Zinc-100
    down: [15, 17, 23], // Jet Black
  },
}

export class ElementaIsingElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return [
      'temperature',
      'field',
      'coupling',
      'sweeps-per-frame',
      'sweepsperframe',
      'paused',
      'theme',
    ]
  }

  private state: StatMechState
  private params: StatMechParams
  private isPaused: boolean = false
  private currentTheme: IsingTheme = 'amber-navy'

  // Canvas elements
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null = null
  private offscreenCanvas: HTMLCanvasElement
  private offscreenCtx: CanvasRenderingContext2D | null = null
  private imageData: ImageData

  // Animation & FPS tracking
  private rafId: number = 0
  private lastTime: number = 0
  private frameCount: number = 0
  private fps: number = 60
  private sweepsPerSec: number = 0
  private lastStatsEmit: number = 0

  // Interactive brush state
  private isPointerDown: boolean = false
  private brushSpinValue: number = 1
  private brushRadius: number = 3

  // Simulated Annealing
  private annealingActive: boolean = false
  private annealTargetT: number = 0.1
  private annealStepCount: number = 0

  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()

    this.state = createStatMechState()
    this.params = {
      temperature: 2.269185,
      field: 0.0,
      coupling: 1.0,
      sweepsPerFrame: 5,
    }

    // Main display canvas
    this.canvas = document.createElement('canvas')
    this.canvas.className =
      'w-full h-full block cursor-crosshair select-none rounded-lg'
    this.canvas.style.imageRendering = 'pixelated'

    // Offscreen 128×128 pixel buffer
    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCanvas.width = L
    this.offscreenCanvas.height = L
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
      willReadFrequently: false,
    })
    this.imageData = new ImageData(L, L)

    // Bind event listeners
    this.handlePointerDown = this.handlePointerDown.bind(this)
    this.handlePointerMove = this.handlePointerMove.bind(this)
    this.handlePointerUp = this.handlePointerUp.bind(this)
    this.handleContextMenu = this.handleContextMenu.bind(this)
  }

  connectedCallback(): void {
    if (!this.contains(this.canvas)) {
      this.replaceChildren(this.canvas)
    }

    this.ctx = this.canvas.getContext('2d', { alpha: false })
    this.updateFromAttributes()

    // Add pointer listeners for domain seeding
    this.canvas.addEventListener('pointerdown', this.handlePointerDown)
    window.addEventListener('pointermove', this.handlePointerMove)
    window.addEventListener('pointerup', this.handlePointerUp)
    this.canvas.addEventListener('contextmenu', this.handleContextMenu)

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

    this.canvas.removeEventListener('pointerdown', this.handlePointerDown)
    window.removeEventListener('pointermove', this.handlePointerMove)
    window.removeEventListener('pointerup', this.handlePointerUp)
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu)
  }

  attributeChangedCallback(name: string, oldVal: string, newVal: string): void {
    if (oldVal === newVal) return
    this.updateFromAttributes()
  }

  private updateFromAttributes(): void {
    const tempAttr = this.getAttribute('temperature')
    if (tempAttr != null) {
      const t = parseFloat(tempAttr)
      if (Number.isFinite(t) && t > 0) this.params.temperature = t
    }

    const fieldAttr = this.getAttribute('field')
    if (fieldAttr != null) {
      const h = parseFloat(fieldAttr)
      if (Number.isFinite(h)) this.params.field = h
    }

    const coupAttr = this.getAttribute('coupling')
    if (coupAttr != null) {
      const j = parseFloat(coupAttr)
      if (Number.isFinite(j)) this.params.coupling = j
    }

    const spfAttr =
      this.getAttribute('sweeps-per-frame') ??
      this.getAttribute('sweepsperframe')
    if (spfAttr != null) {
      const spf = parseInt(spfAttr, 10)
      if (Number.isFinite(spf) && spf >= 1 && spf <= 50) {
        this.params.sweepsPerFrame = spf
      }
    }

    const pausedAttr = this.getAttribute('paused')
    if (pausedAttr != null) {
      this.isPaused = pausedAttr === 'true' || pausedAttr === ''
    }

    const themeAttr = this.getAttribute('theme') as IsingTheme | null
    if (themeAttr && THEME_PALETTES[themeAttr]) {
      this.currentTheme = themeAttr
    }
  }

  private resizeCanvas(): void {
    const rect = this.getBoundingClientRect()
    const width = Math.max(128, Math.floor(rect.width))
    const height = Math.max(128, Math.floor(rect.height))

    const dpr = window.devicePixelRatio || 1
    const targetW = Math.floor(width * dpr)
    const targetH = Math.floor(height * dpr)

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW
      this.canvas.height = targetH
    }
  }

  // --- Pointer & Brushing Handlers ---

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault() // Prevent menu to allow smooth right-click painting
  }

  private handlePointerDown(e: PointerEvent): void {
    this.isPointerDown = true
    // Right button (button === 2) or shift key paints spin -1; otherwise spin +1
    this.brushSpinValue = e.button === 2 || e.shiftKey ? -1 : 1
    this.paintBrushAtEvent(e)
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isPointerDown) return
    this.paintBrushAtEvent(e)
  }

  private handlePointerUp(): void {
    this.isPointerDown = false
  }

  private paintBrushAtEvent(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top

    if (
      clientX < 0 ||
      clientX > rect.width ||
      clientY < 0 ||
      clientY > rect.height
    ) {
      return
    }

    // Map client coordinates to lattice [0, L-1]
    const latticeX = Math.floor((clientX / rect.width) * L)
    const latticeY = Math.floor((clientY / rect.height) * L)

    const r = this.brushRadius
    const r2 = r * r
    const spins = this.state.spins
    const val = this.brushSpinValue as -1 | 1

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r2) {
          // Periodic wrapping for brush painting
          const gx = (latticeX + dx + L) % L
          const gy = (latticeY + dy + L) % L
          spins[gy * L + gx] = val
        }
      }
    }
  }

  // --- Animation Loop ---

  private startLoop(): void {
    const loop = (now: number) => {
      this.rafId = requestAnimationFrame(loop)

      // Annealing progression
      if (this.annealingActive) {
        this.annealStepCount++
        if (this.params.temperature > this.annealTargetT) {
          this.params.temperature = Math.max(
            this.annealTargetT,
            this.params.temperature * 0.992,
          )
        } else {
          this.annealingActive = false
        }
      }

      // Monte Carlo simulation step
      if (!this.isPaused) {
        stepMonteCarloSweep(this.state, this.params, this.params.sweepsPerFrame)
      }

      // Render frame
      this.renderFrame()

      // FPS & Sweep rate tracking
      this.frameCount++
      const elapsed = now - this.lastTime
      if (elapsed >= 500) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed)
        this.sweepsPerSec = this.isPaused
          ? 0
          : this.fps * this.params.sweepsPerFrame
        this.frameCount = 0
        this.lastTime = now
      }

      // Emit observables every 100ms
      if (now - this.lastStatsEmit > 100) {
        this.lastStatsEmit = now
        const obs = accumulateObservables(this.state, this.params)
        this.emitStats(obs)
      }
    }

    this.rafId = requestAnimationFrame(loop)
  }

  private renderFrame(): void {
    if (!this.ctx || !this.offscreenCtx) return

    const spins = this.state.spins
    const pixels = this.imageData.data
    const palette = THEME_PALETTES[this.currentTheme] || THEME_PALETTES['amber-navy']
    const up = palette.up
    const down = palette.down

    // Fast zero-allocation pixel rendering
    let ptr = 0
    for (let i = 0; i < N_SPINS; i++) {
      const s = spins[i]
      if (s === 1) {
        pixels[ptr++] = up[0]
        pixels[ptr++] = up[1]
        pixels[ptr++] = up[2]
        pixels[ptr++] = 255
      } else {
        pixels[ptr++] = down[0]
        pixels[ptr++] = down[1]
        pixels[ptr++] = down[2]
        pixels[ptr++] = 255
      }
    }

    // Blit to offscreen canvas
    this.offscreenCtx.putImageData(this.imageData, 0, 0)

    // Upscale to display canvas
    const dw = this.canvas.width
    const dh = this.canvas.height
    this.ctx.imageSmoothingEnabled = false
    this.ctx.drawImage(this.offscreenCanvas, 0, 0, L, L, 0, 0, dw, dh)
  }

  private emitStats(obs: StatMechObservables): void {
    const detail = {
      ...obs,
      fps: this.fps,
      sweepsPerSec: this.sweepsPerSec,
      temperature: this.params.temperature,
      field: this.params.field,
      coupling: this.params.coupling,
      isPaused: this.isPaused,
      annealing: this.annealingActive,
      hysteresisHistory: this.state.hysteresisHistory,
    }

    // Dispatch both lowercase and kebab-case for total compatibility
    this.dispatchEvent(
      new CustomEvent('statmechupdate', {
        bubbles: true,
        composed: true,
        detail,
      }),
    )
    this.dispatchEvent(
      new CustomEvent('statmech-update', {
        bubbles: true,
        composed: true,
        detail,
      }),
    )
  }

  // --- Public Getters & Setters ---

  get temperature(): number {
    return this.params.temperature
  }
  set temperature(val: number) {
    if (Number.isFinite(val) && val > 0) {
      this.params.temperature = val
    }
  }

  get field(): number {
    return this.params.field
  }
  set field(val: number) {
    if (Number.isFinite(val)) {
      this.params.field = val
    }
  }

  get coupling(): number {
    return this.params.coupling
  }
  set coupling(val: number) {
    if (Number.isFinite(val)) {
      this.params.coupling = val
    }
  }

  get sweepsPerFrame(): number {
    return this.params.sweepsPerFrame
  }
  set sweepsPerFrame(val: number) {
    if (Number.isFinite(val) && val >= 1) {
      this.params.sweepsPerFrame = Math.min(50, Math.floor(val))
    }
  }

  get paused(): boolean {
    return this.isPaused
  }
  set paused(val: boolean) {
    this.isPaused = Boolean(val)
  }

  get theme(): IsingTheme {
    return this.currentTheme
  }
  set theme(val: IsingTheme) {
    if (THEME_PALETTES[val]) {
      this.currentTheme = val
    }
  }

  // --- Public Control Methods ---

  public resetRandom(): void {
    this.annealingActive = false
    setLatticeRandom(this.state)
  }

  public alignUp(): void {
    this.annealingActive = false
    setLatticeAllUp(this.state)
  }

  public alignDown(): void {
    this.annealingActive = false
    setLatticeAllDown(this.state)
  }

  public checkerboard(): void {
    this.annealingActive = false
    setLatticeCheckerboard(this.state)
  }

  public domainWall(): void {
    this.annealingActive = false
    setLatticeDomainWall(this.state)
  }

  public anneal(fromT: number = 5.0, toT: number = 0.1): void {
    this.params.temperature = fromT
    this.annealTargetT = toT
    this.annealStepCount = 0
    this.annealingActive = true
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused
    return this.isPaused
  }
}

// Register custom web component
if (
  typeof window !== 'undefined' &&
  !customElements.get('elementa-ising')
) {
  customElements.define('elementa-ising', ElementaIsingElement)
}
