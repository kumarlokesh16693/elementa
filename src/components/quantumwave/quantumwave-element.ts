/**
 * ELEMENTA — 1D Quantum Wave Laboratory
 * Custom Web Component:
 *   • WebGL (@nexus/3d): probability "waterfall" — a surface whose rows are the
 *     history of the evolving wave (Re ψ for packets; ψₙ·cos(ωt) for stationary
 *     states, whose displayed frequency rises with Eₙ). Behind it, the potential
 *     profile is extruded as a ribbon.
 *   • 2D canvas overlay: the textbook figure — V(x), energy levels, ψ / |ψ|²,
 *     live observables (⟨E⟩, Δx, Δp, ΔxΔp, barrier when present).
 *
 * Physics by @/lib/quantum (finite-difference eigen solver + Crank–Nicolson).
 */

import {
  AmbientLight,
  BufferGeometry,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from '@nexus/3d'
import { BloomPass, EffectComposer, RenderPass, VignettePass } from '@nexus/3d-post'
import {
  barrierTransmission,
  boundaryProbability,
  buildGrid,
  cnScratch,
  countNodes,
  discreteNorm,
  eigenPairs,
  eigenResidual,
  evolvePacket,
  evScale,
  isStateBound,
  makePacket,
  observables,
  regionProbs,
  renormalise,
  WavefunctionFFT,
  type Grid,
  type Observables,
  type Packet,
  type SystemKey,
} from '@/lib/quantum'

const N_GRID = 512
const COLS = 256
const ROWS = 88
const STRIDE = N_GRID / COLS

const SURF_W = 12 // world x extent of the waterfall
const WATER_D = 5.2 // world z extent (time direction)
const AMP_H = 2.1 // max wave height in world units
const V_RIBBON_H = 2.0 // potential ribbon height at max V
const RIBBON_Z = -(WATER_D / 2 + 0.42)

const EIGEN_LEVELS = 10

/** Precomputed colour LUT indexed by |s| bucket (s clamped to [-1, 1]) × sign.
 *  Replaces a Math.pow(|s|, 0.6) per vertex per frame (22,528 calls per rAF).
 *  Layout: [i * 6] .. [i * 6 + 2] = ψ > 0 (cyan ramp), [i * 6 + 3] .. [i * 6 + 5] = ψ < 0 (pink ramp). */
const LUT_LEVELS = 256
const LUT_MAX = LUT_LEVELS - 1
const COLOR_LUT = new Float32Array(LUT_LEVELS * 6)
for (let i = 0; i < LUT_LEVELS; i++) {
  const a = Math.pow(i / LUT_MAX, 0.6)
  const o = i * 6
  // ψ > 0 → cyan ramp (base 0.03/0.05/0.09, tint 0.13/0.83/0.93)
  COLOR_LUT[o] = 0.03 + 0.13 * a
  COLOR_LUT[o + 1] = 0.05 + 0.83 * a
  COLOR_LUT[o + 2] = 0.09 + 0.93 * a
  // ψ < 0 → pink ramp (tint 0.96/0.45/0.71)
  COLOR_LUT[o + 3] = 0.03 + 0.96 * a
  COLOR_LUT[o + 4] = 0.05 + 0.45 * a
  COLOR_LUT[o + 5] = 0.09 + 0.71 * a
}

/** Minimum interval between 2D-overlay redraws (the 3D surface stays at full rAF rate). */
const OVERLAY_INTERVAL = 1 / 30

export class ElementaQuantumWaveElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private raf = 0
  private ro: ResizeObserver | null = null
  private group: Object3D | null = null
  private overlay: HTMLCanvasElement | null = null
  private cameraReady = false
  private composer: EffectComposer | null = null

  // surface geometry (persistent; updated per frame)
  private surfMesh: Mesh | null = null
  private surfWireMesh: Mesh | null = null
  private ribbonMesh: Mesh | null = null
  private surfPos: Float32Array = new Float32Array(ROWS * COLS * 3)
  private surfCol: Float32Array = new Float32Array(ROWS * COLS * 3)
  private hist = new Float32Array(ROWS * COLS)
  private histMax = 0

  // Pre-allocated performance buffers (avoids GC churn per frame)
  private zeroBuffer = new Float64Array(N_GRID)
  private rhoBuffer = new Float64Array(COLS)
  private fft = new WavefunctionFFT()

  // solver state
  private grid: Grid | null = null
  private packet: Packet | null = null
  private scratch: ReturnType<typeof cnScratch> | null = null
  private eigenE: number[] = []
  private eigenBound: boolean[] = []
  private eigenResiduals: number[] = []
  private psiVectors: Float64Array[] | null = null
  private psi: Float64Array | null = null
  private psiNodes = 0
  private cachedEigenObs: Observables | null = null

  // last packet observables & numerical diagnostics
  private obs: Observables | null = null
  private obsLeft = 0
  private obsInside = 0
  private obsRight = 0
  private lastNormError = 0
  private lastBoundaryProb = 0
  private lastEDrift = 0
  private maxEDrift = 0
  private maxNormError = 0

  // public state (page-driven)
  public system: SystemKey = 'well'
  public width = 10
  public depth = 2
  public barrierWidth = 2
  public kappa = 0.6
  public nState = 1
  public mode: 'eigen' | 'packet' = 'eigen'
  public speed = 1
  public sigma = 1.6
  public packetE = 1
  public lengthNm = 1
  public animating = true
  public viewMode: 'split' | '3d' | '2d' = 'split'
  public fx = false
  private pillEl: HTMLDivElement | null = null
  private resetBtnEl: HTMLButtonElement | null = null

  private phaseT = 0
  private simT = 0
  private simAccumulator = 0
  private animClock = 0
  private lastOverlayDraw = -1
  private lastSeed: string | null = null
  private lastGeoSig = ''
  private lastPacketSig = ''
  private lastMode: 'eigen' | 'packet' = 'eigen'
  private lastNState = 1

  static get observedAttributes(): string[] {
    return [
      'data-system', 'data-width', 'data-depth', 'data-barrier-width', 'data-kappa',
      'data-n', 'data-mode', 'data-speed', 'data-sigma', 'data-energy', 'data-length',
      'data-anim', 'data-reset', 'data-view', 'data-fx',
    ]
  }

  connectedCallback(): void {
    if (this.renderer) return
    this.initScene()
    this.readAttributes()
    this.rebuild(true)
    this.updateLayout()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    if (!this.renderer) return
    this.readAttributes()
    this.rebuild(false)
  }

  public resetCamera(): void {
    if (!this.camera || !this.controls) return
    this.camera.position.set(-1.0, 5.8, 12.0)
    this.controls.target.set(0, 0.4, -0.6)
    if (typeof (this.controls as any).updateSphericalFromCamera === 'function') {
      (this.controls as any).updateSphericalFromCamera()
    }
    this.controls.update()
  }

  /* ------------------------------------------------------------------ */

  private initScene(): void {
    this.style.position = 'relative'
    this.style.display = 'block'
    this.style.width = '100%'
    this.style.height = '100%'

    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.touchAction = 'none'
    this.appendChild(renderer.domElement)
    this.renderer = renderer

    const scene = new Scene()
    const camera = new PerspectiveCamera(45, 1, 0.5, 400)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    this.scene = scene
    this.camera = camera
    this.controls = controls
    this.resetCamera()
    this.cameraReady = true

    scene.add(new AmbientLight(0xffffff, 0.7))

    // Physics-figure overlay (left side in split mode, or full width in 2D mode)
    const overlay = document.createElement('canvas')
    overlay.style.position = 'absolute'
    overlay.style.top = '10px'
    overlay.style.left = '10px'
    overlay.style.bottom = '10px'
    overlay.style.borderRadius = '12px'
    overlay.style.border = '1px solid rgba(255,255,255,0.10)'
    overlay.style.background = 'rgba(8,12,20,0.92)'
    overlay.style.zIndex = '2'
    this.appendChild(overlay)
    this.overlay = overlay

    // Floating view mode pills in top-right
    const pill = document.createElement('div')
    pill.style.cssText =
      'position:absolute;top:18px;right:18px;z-index:10;display:flex;gap:3px;' +
      'background:rgba(8,12,20,0.88);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);' +
      'border-radius:8px;padding:3px;box-shadow:0 4px 16px rgba(0,0,0,0.45);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;'

    const modes: { label: string; mode: 'split' | '3d' | '2d' }[] = [
      { label: '◨ Split', mode: 'split' },
      { label: '🌊 3D Waterfall', mode: '3d' },
      { label: '📊 2D Plot', mode: '2d' },
    ]
    for (const m of modes) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = m.label
      btn.dataset.mode = m.mode
      btn.style.cssText =
        'padding:3px 8px;font-size:10px;border-radius:5px;border:1px solid transparent;' +
        'cursor:pointer;transition:all 0.15s ease;font-family:inherit;'
      btn.onclick = () => {
        this.viewMode = m.mode
        this.updateLayout()
        this.dispatchEvent(new CustomEvent('viewchange', { detail: { view: m.mode }, bubbles: true }))
      }
      pill.appendChild(btn)
    }
    this.appendChild(pill)
    this.pillEl = pill

    // Reset camera button
    const resetBtn = document.createElement('button')
    resetBtn.type = 'button'
    resetBtn.textContent = '⟲ Reset angle'
    resetBtn.style.cssText =
      'position:absolute;bottom:18px;right:18px;z-index:9;padding:3px 8px;font-size:10px;' +
      'border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(8,12,20,0.8);' +
      'color:#a1a1aa;cursor:pointer;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;transition:all 0.15s ease;'
    resetBtn.onmouseenter = () => { resetBtn.style.color = '#f4f4f5'; resetBtn.style.borderColor = 'rgba(255,255,255,0.3)' }
    resetBtn.onmouseleave = () => { resetBtn.style.color = '#a1a1aa'; resetBtn.style.borderColor = 'rgba(255,255,255,0.15)' }
    resetBtn.onclick = () => {
      this.resetCamera()
    }
    this.appendChild(resetBtn)
    this.resetBtnEl = resetBtn

    this.ro = new ResizeObserver(() => {
      this.updateLayout()
    })
    this.ro.observe(this)

    const tick = (now: number) => {
      this.raf = requestAnimationFrame(tick)
      const dt = this.lastTime ? Math.min(0.05, (now - this.lastTime) / 1000) : 0
      this.lastTime = now
      this.advance(dt)
      if (this.controls) this.controls.update()
      if (this.composer) this.composer.render(dt)
      else renderer.render(scene, camera)
    }
    this.lastTime = 0
    this.raf = requestAnimationFrame(tick)
  }

  private lastTime = 0

  public updateLayout(): void {
    const w = this.clientWidth || 1
    const h = this.clientHeight || 1
    const renderer = this.renderer
    const camera = this.camera
    const overlay = this.overlay

    // Narrow mobile screens (<500px) fall back to 2D unless user chooses 3D
    const isNarrow = w < 500
    const mode = isNarrow ? (this.viewMode === '3d' ? '3d' : '2d') : this.viewMode

    const pad = 10
    const padY = 10
    const contentH = Math.max(100, h - padY * 2)

    if (mode === 'split') {
      const gap = 12
      const avail = Math.max(200, w - pad * 2 - gap)
      // 2D diagram gets ~49% of width (min 240px, ensuring right side gets >=160px)
      const leftW = Math.round(Math.min(Math.max(avail * 0.49, 240), Math.max(100, avail - 160)))
      const rightW = Math.max(100, avail - leftW)

      if (overlay) {
        overlay.style.display = 'block'
        overlay.style.left = `${pad}px`
        overlay.style.top = `${padY}px`
        overlay.style.width = `${leftW}px`
        overlay.style.height = `${contentH}px`
      }

      if (renderer && camera) {
        const dom = renderer.domElement
        dom.style.display = 'block'
        dom.style.left = `${pad + leftW + gap}px`
        dom.style.top = `${padY}px`
        dom.style.width = `${rightW}px`
        dom.style.height = `${contentH}px`
        dom.style.borderRadius = '12px'
        dom.style.border = '1px solid rgba(255,255,255,0.10)'
        dom.style.background = '#080c14'

        renderer.setSize(rightW, contentH, false)
        camera.aspect = rightW / contentH
        camera.updateProjectionMatrix()
        if (this.composer) {
          this.composer.setSize(renderer.domElement.width, renderer.domElement.height)
        }
        if (this.controls) {
          this.controls.update()
        }
      }
      if (this.resetBtnEl) this.resetBtnEl.style.display = 'block'
    } else if (mode === '3d') {
      const fullW = Math.max(100, w - pad * 2)

      if (overlay) {
        overlay.style.display = 'none'
      }

      if (renderer && camera) {
        const dom = renderer.domElement
        dom.style.display = 'block'
        dom.style.left = `${pad}px`
        dom.style.top = `${padY}px`
        dom.style.width = `${fullW}px`
        dom.style.height = `${contentH}px`
        dom.style.borderRadius = '12px'
        dom.style.border = '1px solid rgba(255,255,255,0.10)'
        dom.style.background = '#080c14'

        renderer.setSize(fullW, contentH, false)
        camera.aspect = fullW / contentH
        camera.updateProjectionMatrix()
        if (this.composer) {
          this.composer.setSize(renderer.domElement.width, renderer.domElement.height)
        }
        if (this.controls) {
          this.controls.update()
        }
      }
      if (this.resetBtnEl) this.resetBtnEl.style.display = 'block'
    } else {
      // 2D plot full view
      const fullW = Math.max(100, w - pad * 2)

      if (overlay) {
        overlay.style.display = 'block'
        overlay.style.left = `${pad}px`
        overlay.style.top = `${padY}px`
        overlay.style.width = `${fullW}px`
        overlay.style.height = `${contentH}px`
      }

      if (renderer) {
        renderer.domElement.style.display = 'none'
      }
      if (this.resetBtnEl) this.resetBtnEl.style.display = 'none'
    }

    this.updatePillUI(mode)
    this.drawOverlay()
  }

  private updatePillUI(activeMode: 'split' | '3d' | '2d'): void {
    if (!this.pillEl) return
    const btns = this.pillEl.querySelectorAll('button')
    btns.forEach((btn) => {
      const isAct = btn.dataset.mode === activeMode
      btn.style.background = isAct ? 'rgba(217,70,239,0.22)' : 'transparent'
      btn.style.color = isAct ? '#f0abfc' : '#94a3b8'
      btn.style.borderColor = isAct ? 'rgba(217,70,239,0.5)' : 'transparent'
    })
  }

  /* ------------------------------------------------------------------ */

  private readAttributes(): void {
    const p = (k: string, d: number): number => {
      const raw = this.getAttribute(`data-${k}`)
      if (raw == null || raw.trim() === '') return d
      const v = Number(raw)
      return Number.isFinite(v) ? v : d
    }
    const raw = (k: string, d: string): string => {
      const v = this.getAttribute(`data-${k}`)
      return v == null || v.trim() === '' ? d : v.trim()
    }

    const sys = raw('system', this.system)
    if (['well', 'finite', 'ho', 'barrier'].includes(sys)) this.system = sys as SystemKey
    this.width = Math.max(2, p('width', this.width))
    this.depth = Math.max(0.2, p('depth', this.depth))
    this.barrierWidth = Math.max(0.2, p('barrier-width', this.barrierWidth))
    this.kappa = Math.max(0.1, p('kappa', this.kappa))
    this.nState = Math.min(EIGEN_LEVELS, Math.max(1, Math.round(p('n', this.nState))))
    const m = raw('mode', this.mode)
    this.mode = m === 'packet' ? 'packet' : m === 'eigen' ? 'eigen' : this.mode
    this.speed = Math.max(0, Math.min(4, p('speed', this.speed)))
    this.sigma = Math.max(0.35, Math.min(4, p('sigma', this.sigma)))
    this.packetE = Math.max(0.05, p('energy', this.packetE))
    this.lengthNm = Math.max(0.05, p('length', this.lengthNm))
    const a = this.getAttribute('data-anim')
    if (a != null) {
      const t = a.trim().toLowerCase()
      this.animating = t !== 'false' && t !== '0'
    }
    const vm = raw('view', this.viewMode)
    if (['split', '3d', '2d'].includes(vm) && this.viewMode !== vm) {
      this.viewMode = vm as 'split' | '3d' | '2d'
      this.updateLayout()
    }
    const fxRaw = this.getAttribute('data-fx')
    if (fxRaw != null) {
      const t = fxRaw.trim().toLowerCase()
      this.fx = t !== 'false' && t !== '0' && t !== 'off'
    }
  }

  /** Lazily build (or release) the post-processing chain for the waterfall canvas. */
  private syncComposer(): void {
    const renderer = this.renderer
    if (!renderer || !this.scene || !this.camera) return

    if (this.fx && !this.composer) {
      try {
        const composer = new EffectComposer(renderer as never)
        composer.setSize(renderer.domElement.width, renderer.domElement.height)
        composer.addPass(new RenderPass(this.scene, this.camera))
        // Subtle neon glow on the wavefunction crests; threshold sits above the
        // dim base/wire colours so only the bright wavefront blooms.
        const bloom = new BloomPass(0.35, 0.5)
        composer.addPass(bloom)
        // Gentle framing vignette; soft so the dark app background stays clean.
        composer.addPass(new VignettePass(1.0, 0.55))
        this.composer = composer
      } catch {
        this.composer = null
        this.fx = false
      }
    } else if (!this.fx && this.composer) {
      this.composer.dispose()
      this.composer = null
    }
  }

  /** Geometry signature: everything that invalidates the solver. */
  private geoSig(): string {
    return `${this.system}|${this.width.toFixed(4)}|${this.depth.toFixed(4)}|${this.barrierWidth.toFixed(4)}|${this.kappa.toFixed(4)}`
  }

  /** Packet signature: parameters that define the initial wavepacket. */
  private packetSig(): string {
    return `${this.packetE.toFixed(4)}|${this.sigma.toFixed(4)}`
  }

  /** Re-solve and (optionally) rebuild the 3D furniture. */
  private rebuild(full: boolean): void {
    const sig = this.geoSig()
    const geoChanged = sig !== this.lastGeoSig
    const pktSig = this.packetSig()
    const packetChanged = pktSig !== this.lastPacketSig
    const seedAttr = this.getAttribute('data-reset')
    const seedChanged = seedAttr != null && seedAttr !== this.lastSeed
    this.lastSeed = seedAttr

    const modeChanged = this.mode !== this.lastMode
    const nStateChanged = this.nState !== this.lastNState
    this.lastMode = this.mode
    this.lastNState = this.nState

    if (full || geoChanged) {
      this.lastGeoSig = sig
      this.lastPacketSig = pktSig
      this.grid = buildGrid(
        {
          system: this.system,
          boxHalf: this.system === 'well' ? this.width / 2 : 22,
          width: this.width,
          depth: this.depth,
          barrierWidth: this.barrierWidth,
          kappa: this.kappa,
        },
        N_GRID,
      )
      const pairs = eigenPairs(this.grid, EIGEN_LEVELS, this.system)
      this.eigenE = pairs.energies
      this.psiVectors = pairs.vectors
      this.eigenBound = pairs.bound
      this.eigenResiduals = pairs.residuals
      this.scratch = cnScratch(N_GRID)
      this.reinitPacket()
      this.clearWaterfall()
      this.buildScene()
    } else if (packetChanged || seedChanged) {
      this.lastPacketSig = pktSig
      this.reinitPacket()
      this.clearWaterfall()
    }

    if (modeChanged || (this.mode === 'eigen' && nStateChanged)) {
      this.clearWaterfall()
    }

    // selected stationary state
    const idx = Math.min(EIGEN_LEVELS, Math.max(1, this.nState)) - 1
    const e = this.eigenE[idx]
    this.psi = Number.isFinite(e) ? (this.psiVectors ? this.psiVectors[idx] : null) : null
    this.psiNodes = this.psi ? countNodes(this.psi) : 0
    if (this.psi && this.grid) {
      this.cachedEigenObs = observables(this.psi, this.zeroBuffer, this.grid.x, this.grid.v, this.grid.h)
    } else {
      this.cachedEigenObs = null
    }

    // Pre-seed row 0 if empty so the initial profile is rendered immediately on the first frame
    if (this.histMax === 0) {
      if (this.mode === 'eigen' && this.psi) {
        this.pushRow((j) => (this.psi ? this.psi[j * STRIDE] : 0))
      } else if (this.mode === 'packet' && this.packet) {
        this.pushRow((j) => this.packet!.re[j * STRIDE])
      }
    }

    // draw once now — rAF may be throttled (hidden tab) so the figure shouldn't
    // wait for the first animate frame
    this.syncComposer()
    this.updateSurface(true)
    this.drawOverlay()
  }

  private reinitPacket(): void {
    const g = this.grid
    if (!g) return
    const x0 = -g.boxHalf * 0.62
    const k0 = Math.sqrt(Math.max(1e-4, this.packetE - 1 / (4 * this.sigma * this.sigma)))
    this.packet = makePacket(g, x0, this.sigma, k0)
    this.simT = 0
    this.simAccumulator = 0
    this.obs = null
    this.obsLeft = 0
    this.obsInside = 0
    this.obsRight = 0
    this.lastNormError = 0
    this.lastBoundaryProb = 0
    this.lastEDrift = 0
    this.maxEDrift = 0
    this.maxNormError = 0
  }

  private clearWaterfall(): void {
    this.hist.fill(0)
    this.histMax = 0
    this.phaseT = 0
  }

  /* ------------------------------------------------------------------ */

  private buildScene(): void {
    const scene = this.scene
    const renderer = this.renderer
    if (!scene || !renderer) return

    if (!this.cameraReady) {
      this.resetCamera()
      this.cameraReady = true
    }

    // Explicit persistent ownership: Detach the persistent surface mesh
    // before releasing transient scene elements to protect GPU vertex buffers.
    if (this.group) {
      if (this.surfMesh && this.surfMesh.parent === this.group) {
        this.group.remove(this.surfMesh)
      }
      if (this.surfWireMesh && this.surfWireMesh.parent === this.group) {
        this.group.remove(this.surfWireMesh)
      }
      scene.remove(this.group)
      this.releaseTree(this.group)
      this.group = null
      this.ribbonMesh = null
    }
    const group = new Object3D()
    group.name = 'quantum-content'
    group.position.set(0, 0, 0) // Centered in the 3D viewport
    this.group = group

    // Subtle coordinate orientation grid on the baseline
    const gridHelper = new GridHelper(16, 16, '#38bdf8', '#334155')
    gridHelper.position.set(0, -0.01, 0)
    if (gridHelper.material) {
      gridHelper.material.transparent = true
      gridHelper.material.opacity = 0.5
    }
    gridHelper.frustumCulled = false
    group.add(gridHelper)

    // --- Wavefunction History Waterfall Surface (persistent buffers) ---
    if (!this.surfMesh) {
      const geo = new BufferGeometry()
      geo.setAttribute('position', { array: this.surfPos, itemSize: 3 })
      geo.setAttribute('color', { array: this.surfCol, itemSize: 3 })
      const idx: number[] = []
      for (let r = 0; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS - 1; c++) {
          const a = r * COLS + c
          idx.push(a, a + 1, a + COLS, a + 1, a + COLS + 1, a + COLS)
        }
      }
      geo.setIndex(new Uint16Array(idx))
      const mat = new MeshBasicMaterial()
      mat.side = 'double'
      this.surfMesh = new Mesh(geo, mat)
    }
    const surf = this.surfMesh
    surf.frustumCulled = false
    surf.position.set(0, 0, 0)
    group.add(surf)

    // Subtle neon wireframe grid overlay for instant 3D topology & depth
    if (!this.surfWireMesh) {
      const wireMat = new MeshBasicMaterial({
        color: '#38bdf8',
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      })
      wireMat.side = 'double'
      this.surfWireMesh = new Mesh(this.surfMesh.geometry, wireMat)
      this.surfWireMesh.frustumCulled = false
    }
    this.surfWireMesh.position.set(0, 0, 0)
    group.add(this.surfWireMesh)

    // --- Potential ribbon at the back ---
    this.updateRibbon()

    scene.add(group)
    this.updateSurface(true)
  }

  private updateRibbon(): void {
    const g = this.grid
    const group = this.group
    if (!g || !group) return
    if (this.ribbonMesh) {
      group.remove(this.ribbonMesh)
      const r = this.renderer as (WebGLRenderer & { releaseGeometry?: (g: unknown) => void }) | null
      if (r && typeof r.releaseGeometry === 'function' && this.ribbonMesh.geometry) {
        r.releaseGeometry(this.ribbonMesh.geometry)
      } else if ((this.ribbonMesh.geometry as any)?.dispose) {
        (this.ribbonMesh.geometry as any).dispose()
      }
      ;(this.ribbonMesh.material as any)?.dispose?.()
      this.ribbonMesh = null
    }

    const geo = new BufferGeometry()
    const pos = new Float32Array(COLS * 2 * 3)
    const idx: number[] = []
    let minV = Infinity
    let maxV = -Infinity
    for (let c = 0; c < COLS; c++) {
      const v = g.v[c * STRIDE]
      if (v < minV) minV = v
      if (v > maxV) maxV = v
    }
    if (!Number.isFinite(minV)) minV = 0
    if (!Number.isFinite(maxV)) maxV = 1

    const vRange = Math.max(1e-6, maxV - minV)
    // Anchored to V = 0 reference plane
    const yBase = Math.max(0, -minV / vRange) * V_RIBBON_H + 0.02

    for (let c = 0; c < COLS; c++) {
      const xw = (g.x[c * STRIDE] / g.boxHalf) * (SURF_W / 2)
      const normV = Math.max(0, (g.v[c * STRIDE] - minV) / vRange)
      const yTop = normV * V_RIBBON_H + 0.02
      const yLow = Math.min(yTop, yBase)
      const yHigh = Math.max(yTop, yBase)

      pos[(c * 2) * 3 + 0] = xw
      pos[(c * 2) * 3 + 1] = yLow
      pos[(c * 2) * 3 + 2] = RIBBON_Z
      pos[(c * 2 + 1) * 3 + 0] = xw
      pos[(c * 2 + 1) * 3 + 1] = yHigh
      pos[(c * 2 + 1) * 3 + 2] = RIBBON_Z
    }
    for (let c = 0; c < COLS - 1; c++) {
      const a = c * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    geo.setAttribute('position', { array: pos, itemSize: 3 })
    geo.setIndex(new Uint16Array(idx))
    const mat = new MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.85 })
    mat.side = 'double'
    this.ribbonMesh = new Mesh(geo, mat)
    this.ribbonMesh.frustumCulled = false
    group.add(this.ribbonMesh)
  }

  private releaseTree(node: Object3D): void {
    const r = this.renderer as (WebGLRenderer & { releaseGeometry?: (g: unknown) => void }) | null
    node.traverse((child) => {
      if (child === this.surfMesh || child === this.surfWireMesh) return // Never dispose persistent surface geometry
      const mesh = child as unknown as { geometry?: BufferGeometry; material?: { dispose?: () => void } }
      if (mesh.geometry) {
        if (r && typeof r.releaseGeometry === 'function') {
          r.releaseGeometry(mesh.geometry)
        } else if ((mesh.geometry as any)?.dispose) {
          (mesh.geometry as any).dispose()
        }
      }
      if (mesh.material?.dispose) {
        mesh.material.dispose()
      }
    })
  }

  /* ------------------------------------------------------------------ */

  private advance(dt: number): void {
    if (!this.animating || dt <= 0 || !this.grid) return
    this.animClock += dt

    const mode = this.mode === 'eigen' && this.psi ? 'eigen' : 'packet'

    if (mode === 'eigen' && this.psi) {
      // Stationary state: illustrative phase visualization at frequency proportional to E_n
      this.phaseT += dt * this.speed
      const e = this.eigenE[Math.min(EIGEN_LEVELS, this.nState) - 1] || 0
      const e0 = this.eigenE[0] || 0
      const e8 = this.eigenE[Math.min(EIGEN_LEVELS, this.eigenE.length) - 1] || e0
      const rel = e8 > e0 ? (e - e0) / (e8 - e0) : 0
      const cyclesPerSec = 0.3 + 2.2 * rel // monotone in E_n, rescaled for human perception
      const arg = 2 * Math.PI * cyclesPerSec * this.phaseT
      const cosv = Math.cos(arg)
      this.pushRow((j) => (this.psi ? this.psi[j * STRIDE] * cosv : 0))
    } else if (this.packet && this.scratch) {
      // Fixed-timestep accumulator: frame-rate independent evolution; speed 0 freezes evolution
      if (this.speed > 0) {
        this.simAccumulator += dt * this.speed
        const dtSub = 0.005
        const maxSteps = 40
        let steps = 0

        while (this.simAccumulator >= dtSub && steps < maxSteps) {
          // Record discrete norm conservation before corrective renormalization
          const normBefore = discreteNorm(this.packet, this.grid.h)
          this.lastNormError = Math.abs(normBefore - 1.0)
          if (this.lastNormError > this.maxNormError) this.maxNormError = this.lastNormError

          evolvePacket(this.packet, this.grid, dtSub, this.scratch)
          renormalise(this.packet, this.grid.h)
          this.simAccumulator -= dtSub
          steps++
        }

        if (steps >= maxSteps) {
          this.simAccumulator = 0 // clamp accumulator to avoid backlog spiral
        }
        this.simT += dtSub * steps
      }

      this.obs = observables(this.packet.re, this.packet.im, this.grid.x, this.grid.v, this.grid.h)
      const drift = Math.abs((this.obs.energy - this.packet.initialEnergy) / Math.max(1e-12, this.packet.initialEnergy))
      this.lastEDrift = drift
      if (drift > this.maxEDrift) this.maxEDrift = drift
      this.lastBoundaryProb = boundaryProbability(this.packet, this.grid.h, 0.05)
      if (this.system === 'barrier') {
        const rp = regionProbs(this.packet.re, this.packet.im, this.grid.x, this.barrierWidth / 2, this.grid.h)
        this.obsLeft = rp.left
        this.obsInside = rp.inside
        this.obsRight = rp.right
      }
      this.pushRow((j) => this.packet!.re[j * STRIDE])
    }

    this.updateSurface(false)
    // The 2D overlay does its full axis/layout work every draw; ~30 Hz is
    // perceptually identical and roughly halves its cost in split mode. The
    // WebGL surface above still updates at the full rAF rate.
    if (this.animClock - this.lastOverlayDraw >= OVERLAY_INTERVAL) {
      this.lastOverlayDraw = this.animClock
      this.drawOverlay()
    }
  }

  private pushRow(fn: (j: number) => number): void {
    this.hist.copyWithin(COLS, 0, (ROWS - 1) * COLS)
    let rowMax = 0
    for (let j = 0; j < COLS; j++) {
      const val = fn(j)
      if (!Number.isFinite(val)) {
        this.hist[j] = 0
        continue
      }
      this.hist[j] = val
      const a = Math.abs(val)
      if (a > rowMax) rowMax = a
    }
    this.histMax = Math.max(this.histMax * 0.997, rowMax, 1e-6)
  }

  /** Write surface vertex positions/colours from the history buffer. */
  private updateSurface(_force: boolean): void {
    const pos = this.surfPos
    const col = this.surfCol
    const max = this.histMax
    const invMax = max > 1e-9 ? 1 / max : 0
    const dz = WATER_D / (ROWS - 1)
    for (let r = 0; r < ROWS; r++) {
      const z = WATER_D / 2 - r * dz
      const rowOff = r * COLS
      for (let c = 0; c < COLS; c++) {
        const i = rowOff + c
        const s = invMax > 0 ? Math.max(-1, Math.min(1, this.hist[i] * invMax)) : 0
        const y = s * AMP_H
        const x = (-SURF_W / 2 + (c / (COLS - 1)) * SURF_W)
        pos[i * 3 + 0] = x
        pos[i * 3 + 1] = y
        pos[i * 3 + 2] = z
        // colour: dark base → cyan (ψ>0) / pink (ψ<0), from the precomputed LUT
        const li = (Math.abs(s) * LUT_MAX + 0.5) | 0
        const lo = li * 6 + (s >= 0 ? 0 : 3)
        col[i * 3 + 0] = COLOR_LUT[lo]
        col[i * 3 + 1] = COLOR_LUT[lo + 1]
        col[i * 3 + 2] = COLOR_LUT[lo + 2]
      }
    }
    const mesh = this.surfMesh
    if (!mesh) return
    const pAttr = mesh.geometry.getAttribute('position')
    const cAttr = mesh.geometry.getAttribute('color')
    if (pAttr) {
      if (pAttr.array instanceof Float32Array && pAttr.array.buffer === pos.buffer) {
        pAttr.needsUpdate = true
      } else {
        mesh.geometry.setAttribute('position', { array: pos.slice(), itemSize: 3 })
      }
    }
    if (cAttr) {
      if (cAttr.array instanceof Float32Array && cAttr.array.buffer === col.buffer) {
        cAttr.needsUpdate = true
      } else {
        mesh.geometry.setAttribute('color', { array: col.slice(), itemSize: 3 })
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* 2D overlay: the physics figure                                      */

  private drawOverlay(): void {
    const cv = this.overlay
    if (!cv || !this.grid) return
    const w = cv.clientWidth || 0
    const h = cv.clientHeight || 0
    if (!w || !h) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
    }
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const g = this.grid
    const isCompact = w < 480
    const mL = isCompact ? 40 : 46
    const mR = 12
    const mT = 34
    const mB = 8
    const pw = w - mL - mR

    const xPx = (xv: number): number => mL + pw * (xv / g.boxHalf + 1) / 2

    // Signed energy window with support for negative and non-zero potential baselines
    let vMin = Infinity
    let vMax = -Infinity
    for (let c = 0; c < COLS; c++) {
      const v = g.v[c * STRIDE]
      if (v < vMin) vMin = v
      if (v > vMax && Number.isFinite(v)) vMax = v
    }
    if (!Number.isFinite(vMin)) vMin = 0
    if (!Number.isFinite(vMax)) vMax = 1
    let yMax = 0
    if (this.system === 'ho') {
      yMax = Math.max(1.1 * this.kappa * Math.min(6, 4), (this.eigenE[EIGEN_LEVELS - 1] || 1) * 1.3)
    } else if (this.system === 'finite') {
      yMax = Math.max(this.depth * 1.25, (this.eigenE[EIGEN_LEVELS - 1] || 0) * 1.25, 1)
    } else if (this.system === 'barrier') {
      const eNow = this.obs ? this.obs.energy : this.packetE
      yMax = Math.max(this.depth * 1.35, eNow * 1.7, 1)
    } else {
      yMax = Math.max((this.eigenE[EIGEN_LEVELS - 1] || 1) * 1.25, 1e-3)
    }
    yMax = Math.max(yMax, 1e-6)
    const yMin = Math.min(0, vMin)
    const eSpan = Math.max(1e-6, yMax - yMin)

    // Pre-calculate stats lines count for vertical budgeting
    const statsLinesCount = 3
    const lineSpacing = isCompact ? 12 : 14
    const statsH = statsLinesCount * lineSpacing + 4

    // Dynamic vertical budget for three synchronized scientific tiers:
    // Tier 1: Energy & potential landscape V(x) with stationary / evolving wave
    // Tier 2: Position space probability density |ψ(x)|²
    // Tier 3: Momentum space probability density |ϕ(p)|² (Cooley-Tukey FFT)
    const availH = Math.max(150, h - mT - statsH - mB)
    const mainH = Math.max(85, Math.floor(availH * 0.48))
    const stripsTotalH = availH - mainH
    const stripH = Math.max(22, Math.floor((stripsTotalH - 18) / 2))

    const strip1Y = mT + mainH + 10 + stripH // baseline for Position strip
    const strip2Y = strip1Y + 12 + stripH   // baseline for Momentum strip

    const yPx = (ev: number): number => {
      const norm = (ev - yMin) / eSpan
      return mT + mainH * (1 - Math.max(-0.06, Math.min(1.06, norm)))
    }

    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textBaseline = 'middle'

    // header
    const sysName =
      this.system === 'well' ? 'Infinite well'
      : this.system === 'finite' ? 'Finite well'
      : this.system === 'ho' ? 'Harmonic oscillator'
      : 'Rectangular barrier'
    const scale = evScale(this.lengthNm)
    const subtitle =
      this.mode === 'eigen'
        ? (isCompact ? `n = ${this.nState}` : `State n=${this.nState} · illustrative phase (ΔE monotone in Eₙ, not physical ωₙ)`)
        : (isCompact ? 'Wave Packet' : 'Wave Packet Evolution (C–N)')
    ctx.fillStyle = '#e2e8f0'
    ctx.textAlign = 'left'
    ctx.fillText(`${sysName} · ${subtitle}`, mL, 12)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#64748b'
    ctx.fillText(`L = ${this.lengthNm.toFixed(2)} nm`, w - mR, 12)
    if (!isCompact) {
      ctx.fillText(`ħ²/2mₑL² = ${scale.toFixed(3)} eV · natural units ħ = 2m = 1`, w - mR, 26)
    }
    ctx.textAlign = 'left'

    // baseline (V = 0 plane)
    ctx.strokeStyle = 'rgba(148,163,184,0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(mL, yPx(0))
    ctx.lineTo(mL + pw, yPx(0))
    ctx.stroke()

    // continuum threshold marker for finite wells
    if (this.system === 'finite') {
      const vCont = Math.min(g.v[0], g.v[g.n - 1])
      const yCont = yPx(vCont)
      ctx.strokeStyle = 'rgba(245,158,11,0.45)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(mL, yCont)
      ctx.lineTo(mL + pw, yCont)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f59e0b'
      ctx.textAlign = 'right'
      ctx.fillText(`Continuum limit V = ${vCont.toFixed(2)}`, mL + pw - 4, yCont - 7)
      ctx.textAlign = 'left'
    }

    // potential shading + curve
    const drawPotential = () => {
      ctx.beginPath()
      for (let c = 0; c < COLS; c++) {
        const xv = g.x[c * STRIDE]
        const vv = g.v[c * STRIDE]
        const px = xPx(xv)
        const py = yPx(Math.min(vv, yMax * 1.05))
        if (c === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.6
      ctx.stroke()
      // fill between V and baseline for wells/barriers
      if (this.system === 'barrier' || this.system === 'finite') {
        ctx.lineTo(mL + pw, yPx(0))
        ctx.lineTo(mL, yPx(0))
        ctx.closePath()
        ctx.fillStyle = 'rgba(148,163,184,0.10)'
        ctx.fill()
      }
    }
    drawPotential()

    // energy levels (stationary eigenstates for all systems, or packet baseline)
    if (this.mode === 'eigen' || this.system !== 'barrier') {
      for (let k = 0; k < EIGEN_LEVELS; k++) {
        const e = this.eigenE[k]
        if (!Number.isFinite(e) || e > yMax) continue
        const selected = k + 1 === this.nState && this.mode === 'eigen'
        const isBound = this.eigenBound[k] ?? true

        if (selected) {
          ctx.strokeStyle = '#22d3ee'
          ctx.setLineDash([])
          ctx.lineWidth = 1.8
        } else if (isBound) {
          ctx.strokeStyle = 'rgba(34,211,238,0.32)'
          ctx.setLineDash([4, 4])
          ctx.lineWidth = 1
        } else {
          ctx.strokeStyle = 'rgba(148,163,184,0.22)'
          ctx.setLineDash([2, 4])
          ctx.lineWidth = 1
        }

        ctx.beginPath()
        ctx.moveTo(mL, yPx(e))
        ctx.lineTo(mL + pw, yPx(e))
        ctx.stroke()

        if (selected) {
          ctx.fillStyle = '#22d3ee'
          ctx.textAlign = 'left'
          const boundTag = this.system === 'finite' ? (isBound ? ' [Bound]' : ' [Box Continuum]') : this.system === 'barrier' ? (isBound ? ' [Tunnel]' : ' [Box Continuum]') : ''
          ctx.fillText(`E${this.nState} = ${e.toFixed(3)} (${(e * scale).toFixed(3)} eV)${boundTag}`, mL + 4, yPx(e) - 9)
        }
      }
      ctx.setLineDash([])
    } else if (this.obs) {
      // packet energy marker (barrier system)
      ctx.strokeStyle = 'rgba(251,191,36,0.75)'
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      const eNow = Math.min(this.obs.energy, yMax)
      ctx.moveTo(mL, yPx(eNow))
      ctx.lineTo(mL + pw, yPx(eNow))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#fbbf24'
      ctx.textAlign = 'left'
      ctx.fillText(`⟨E⟩ = ${this.obs.energy.toFixed(3)}`, mL + 4, yPx(eNow) + 10)
    }

    // eigen ψₙ (scaled about its level) / packet Re ψ (scaled about ⟨E⟩)
    const mode = this.mode === 'eigen' && this.psi ? 'eigen' : 'packet'
    if (mode === 'eigen' && this.psi) {
      let pk = 0
      for (let j = 0; j < N_GRID; j++) if (Math.abs(this.psi[j]) > pk) pk = Math.abs(this.psi[j])
      pk = Math.max(pk, 1e-12)
      const anchor = this.eigenE[Math.min(EIGEN_LEVELS, this.nState) - 1] || 0
      const amp = eSpan * 0.24
      ctx.beginPath()
      for (let c = 0; c < COLS; c++) {
        const j = c * STRIDE
        const val = anchor + (this.psi[j] / pk) * amp
        const px = xPx(g.x[j])
        const py = yPx(val)
        if (c === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#67e8f9'
      ctx.lineWidth = 1.8
      ctx.stroke()
      // zero nodes ticks
      ctx.fillStyle = 'rgba(103,232,249,0.7)'
      ctx.fillText(`${this.psiNodes} node${this.psiNodes === 1 ? '' : 's'}`, mL + 4, yPx(anchor) + 11)
    } else if (this.packet) {
      let pk = 0
      const re = this.packet.re
      for (let j = 0; j < N_GRID; j++) if (Math.abs(re[j]) > pk) pk = Math.abs(re[j])
      pk = Math.max(pk, 1e-12)
      const anchor = this.system === 'barrier' && this.obs ? Math.min(this.obs.energy, yMax * 0.62) : (this.obs ? Math.min(this.obs.energy, yMax * 0.62) : yMax * 0.45)
      const amp = eSpan * 0.28
      ctx.beginPath()
      for (let c = 0; c < COLS; c++) {
        const j = c * STRIDE
        const val = anchor + (re[j] / pk) * amp
        const px = xPx(g.x[j])
        const py = yPx(val)
        if (c === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#67e8f9'
      ctx.lineWidth = 1.8
      ctx.stroke()
    }

    // --- 1. Position Probability Strip |ψ(x)|² ---
    ctx.strokeStyle = 'rgba(148,163,184,0.22)'
    ctx.beginPath()
    ctx.moveTo(mL, strip1Y - stripH)
    ctx.lineTo(mL, strip1Y)
    ctx.lineTo(mL + pw, strip1Y)
    ctx.stroke()

    ctx.fillStyle = '#fbbf24'
    ctx.font = isCompact ? '8.5px ui-monospace, SFMono-Regular, Menlo, monospace' : '9.5px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textAlign = 'right'
    ctx.fillText('|ψ|²', mL - 5, strip1Y - stripH / 2)
    ctx.textAlign = 'left'

    const rho = this.rhoBuffer
    let rhoMax = 0
    for (let c = 0; c < COLS; c++) {
      const j = c * STRIDE
      const val = mode === 'eigen' && this.psi ? this.psi[j] * this.psi[j] : this.packet ? this.packet.re[j] ** 2 + this.packet.im[j] ** 2 : 0
      rho[c] = val
      if (val > rhoMax) rhoMax = val
    }
    rhoMax = Math.max(rhoMax, 1e-24)

    ctx.beginPath()
    ctx.moveTo(xPx(g.x[0]), strip1Y)
    for (let c = 0; c < COLS; c++) {
      const px = xPx(g.x[c * STRIDE])
      const py = strip1Y - (rho[c] / rhoMax) * (stripH - 2)
      ctx.lineTo(px, py)
    }
    ctx.lineTo(xPx(g.x[N_GRID - 1]), strip1Y)
    ctx.closePath()
    ctx.fillStyle = 'rgba(251,191,36,0.38)'
    ctx.fill()
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 1.2
    ctx.stroke()

    // Position Expectation & Uncertainty Tick
    const meanX = mode === 'eigen' ? (this.cachedEigenObs?.meanX ?? 0) : (this.obs?.meanX ?? 0)
    const dx = mode === 'eigen' ? (this.cachedEigenObs?.dx ?? 0) : (this.obs?.dx ?? 0)
    const pxMeanX = xPx(meanX)
    if (pxMeanX >= mL && pxMeanX <= mL + pw) {
      ctx.strokeStyle = 'rgba(251,191,36,0.7)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pxMeanX, strip1Y - stripH * 0.45)
      ctx.lineTo(pxMeanX, strip1Y)
      ctx.stroke()
      if (!isCompact && w > 420) {
        ctx.fillStyle = 'rgba(251,191,36,0.75)'
        ctx.font = '8px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`⟨x⟩=${meanX.toFixed(2)}`, mL + pw, strip1Y - stripH + 8)
        ctx.textAlign = 'left'
      }
    }

    // --- 2. Momentum Space Strip |ϕ(p)|² (Cooley–Tukey FFT) ---
    ctx.strokeStyle = 'rgba(148,163,184,0.22)'
    ctx.beginPath()
    ctx.moveTo(mL, strip2Y - stripH)
    ctx.lineTo(mL, strip2Y)
    ctx.lineTo(mL + pw, strip2Y)
    ctx.stroke()

    ctx.fillStyle = '#c084fc'
    ctx.font = isCompact ? '8.5px ui-monospace, SFMono-Regular, Menlo, monospace' : '9.5px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textAlign = 'right'
    ctx.fillText('|ϕ|²', mL - 5, strip2Y - stripH / 2)
    ctx.textAlign = 'left'

    // Compute FFT in real time (in-place Cooley-Tukey, 25 microseconds execution)
    const psiRe = mode === 'eigen' && this.psi ? this.psi : (this.packet ? this.packet.re : this.zeroBuffer)
    const psiIm = mode === 'eigen' ? null : (this.packet ? this.packet.im : null)
    const fftRes = this.fft.compute(psiRe, psiIm, g.h)
    const fftPower = this.fft.power
    const fftK = this.fft.k

    // Dynamic zoom for momentum window to capture active spectral peaks cleanly
    const kDisp = Math.max(
      3.2,
      Math.min(
        fftRes.kMax * 0.95,
        Math.max(Math.abs(fftRes.peakK) * 2.2, (fftRes.deltaK || 1) * 4.5, 3.5),
      ),
    )
    const kPx = (kv: number): number => mL + pw * ((kv + kDisp) / (2 * kDisp))

    // Dotted zero-momentum axis (p = 0)
    const p0X = kPx(0)
    ctx.strokeStyle = 'rgba(192,132,252,0.30)'
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(p0X, strip2Y - stripH)
    ctx.lineTo(p0X, strip2Y)
    ctx.stroke()
    ctx.setLineDash([])

    // Axis limit numbers
    ctx.fillStyle = 'rgba(148,163,184,0.6)'
    ctx.font = '8px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.fillText(`-${kDisp.toFixed(1)}`, mL, strip2Y + 8)
    ctx.textAlign = 'center'
    ctx.fillText('p=0', p0X, strip2Y + 8)
    ctx.textAlign = 'right'
    ctx.fillText(`+${kDisp.toFixed(1)}`, mL + pw, strip2Y + 8)
    ctx.textAlign = 'left'

    // Plot momentum probability density |ϕ(k)|²
    const pMax = Math.max(fftRes.maxPower, 1e-24)
    ctx.beginPath()
    ctx.moveTo(mL, strip2Y)
    let started = false
    for (let m = 0; m < N_GRID; m++) {
      const km = fftK[m]
      if (km < -kDisp || km > kDisp) continue
      const px = kPx(km)
      const py = strip2Y - (fftPower[m] / pMax) * (stripH - 2)
      if (!started) {
        ctx.lineTo(px, strip2Y)
        ctx.lineTo(px, py)
        started = true
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.lineTo(mL + pw, strip2Y)
    ctx.closePath()
    ctx.fillStyle = 'rgba(192,132,252,0.32)'
    ctx.fill()
    ctx.strokeStyle = '#c084fc'
    ctx.lineWidth = 1.2
    ctx.stroke()

    // Momentum Expectation & Uncertainty Tick
    const meanP = fftRes.meanK
    const pxMeanP = kPx(meanP)
    if (pxMeanP >= mL && pxMeanP <= mL + pw) {
      ctx.strokeStyle = 'rgba(192,132,252,0.85)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pxMeanP, strip2Y - stripH * 0.45)
      ctx.lineTo(pxMeanP, strip2Y)
      ctx.stroke()
      if (!isCompact && w > 420) {
        ctx.fillStyle = 'rgba(192,132,252,0.85)'
        ctx.font = '8px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`⟨p⟩=${meanP.toFixed(2)}`, mL + pw, strip2Y - stripH + 8)
        ctx.textAlign = 'left'
      }
    }

    // --- 3. Stats block with live numerical diagnostics & Heisenberg uncertainty ---
    const lines: string[] = []
    if (mode === 'eigen' && this.psi && this.grid) {
      const stateIdx = Math.min(EIGEN_LEVELS, this.nState) - 1
      const e = this.eigenE[stateIdx] || 0
      const ob = this.cachedEigenObs ?? observables(this.psi, this.zeroBuffer, g.x, g.v, g.h)
      const isBound = this.eigenBound[stateIdx] ?? true
      const res = this.eigenResiduals[stateIdx] ?? 0

      if (isCompact) {
        lines.push(`ψ${this.nState}: E=${e.toFixed(3)} nat (${(e * scale).toFixed(3)} eV) [${isBound ? 'Bound' : 'Continuum'}]`)
        lines.push(`nodes ${this.psiNodes} · Δx=${ob.dx.toFixed(2)} · Δp=${ob.dp.toFixed(2)}`)
        lines.push(`ΔxΔp/(ħ/2)=${(ob.dxTimesDp / 0.5).toFixed(2)} · res=${res.toExponential(1)}`)
      } else {
        lines.push(`ψ${this.nState}: E = ${e.toFixed(4)} nat = ${(e * scale).toFixed(3)} eV   [${isBound ? 'Bound' : 'Continuum / Box'}]`)
        lines.push(`nodes ${this.psiNodes}   ⟨x⟩ = ${ob.meanX.toFixed(2)}   Δx = ${ob.dx.toFixed(3)}   ⟨p⟩ = ${ob.meanP.toFixed(4)}   Δp = ${ob.dp.toFixed(3)}`)
        lines.push(`Δx·Δp/(ħ/2) = ${(ob.dxTimesDp / 0.5).toFixed(3)} (Heisenberg ≥ 1)   ||(H−E)ψ||₂ = ${res.toExponential(2)}`)
      }
    } else if (this.packet && this.obs) {
      const o = this.obs
      const drift = Math.abs((o.energy - this.packet.initialEnergy) / Math.max(1e-12, this.packet.initialEnergy))
      this.lastEDrift = drift
      if (drift > this.maxEDrift) this.maxEDrift = drift
      if (isCompact) {
        lines.push(`t=${this.simT.toFixed(2)} · ⟨E⟩=${o.energy.toFixed(2)} (${(o.energy * scale).toFixed(2)} eV) · ΔE drift ${(this.lastEDrift * 100).toFixed(2)}%`)
        lines.push(`⟨x⟩=${o.meanX.toFixed(1)} · Δx=${o.dx.toFixed(2)} · ΔxΔp/(ħ/2)=${(o.dxTimesDp / 0.5).toFixed(2)}`)
        if (this.system === 'barrier') {
          lines.push(`trans ${this.obsRight.toFixed(2)} · ref ${this.obsLeft.toFixed(2)} · T=${barrierTransmission(this.packet.initialEnergy, this.depth, this.barrierWidth).toFixed(2)}`)
        }
      } else {
        lines.push(`t = ${this.simT.toFixed(2)}  ⟨E⟩ = ${o.energy.toFixed(3)} (${(o.energy * scale).toFixed(2)} eV)`)
        const drift = Math.abs((o.energy - this.packet.initialEnergy) / Math.max(1e-12, this.packet.initialEnergy))
        this.lastEDrift = drift
        if (drift > this.maxEDrift) this.maxEDrift = drift
        const boundWarn = this.lastBoundaryProb > 0.005 ? `  ⚠️ boundary mass ${(this.lastBoundaryProb * 100).toFixed(2)}%` : ''
        lines.push(`ΔE drift ${(this.lastEDrift * 100).toFixed(3)}%  worst ${(this.maxEDrift * 100).toFixed(2)}%   pre-renorm norm err = ${this.lastNormError.toExponential(2)} / worst ${this.maxNormError.toExponential(2)}${boundWarn}`)
        lines.push(`⟨x⟩ = ${o.meanX.toFixed(2)}   Δx = ${o.dx.toFixed(2)}   ⟨p⟩ = ${o.meanP.toFixed(3)}   Δp = ${o.dp.toFixed(3)}   ΔxΔp/(ħ/2) = ${(o.dxTimesDp / 0.5).toFixed(2)}`)
        if (this.system === 'barrier') {
          const T = barrierTransmission(this.packet.initialEnergy, this.depth, this.barrierWidth)
          lines.push(`transmitted ${this.obsRight.toFixed(3)}   inside ${this.obsInside.toFixed(4)}   reflected ${this.obsLeft.toFixed(3)}`)
          lines.push(`T(E₀) analytic = ${T.toFixed(4)}   (spread shifts the measured fraction)`)
        }
      }
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = isCompact ? '9px ui-monospace, SFMono-Regular, Menlo, monospace' : '10.5px ui-monospace, SFMono-Regular, Menlo, monospace'
    let ly = strip2Y + 16
    for (const line of lines) {
      ctx.fillText(line, mL, ly)
      ly += isCompact ? 12 : 14
    }

    // x ticks
    ctx.fillStyle = '#64748b'
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
    const tick = Math.max(1, Math.round(g.boxHalf / 2))
    for (let xv = -Math.floor(g.boxHalf / tick) * tick; xv <= g.boxHalf; xv += tick) {
      const px = xPx(xv)
      ctx.fillText(String(Math.round(xv)), px - 6, yPx(0) + 10)
    }
  }

  /* ------------------------------------------------------------------ */

  private teardown(): void {
    cancelAnimationFrame(this.raf)
    this.lastTime = 0
    if (this.composer) {
      try {
        this.composer.dispose()
      } catch {
        /* context may already be lost */
      }
      this.composer = null
    }
    if (this.ro) {
      this.ro.disconnect()
      this.ro = null
    }
    if (this.controls) {
      this.controls.dispose()
      this.controls = null
    }
    if (this.renderer) {
      if (this.group) {
        if (this.surfMesh && this.surfMesh.parent === this.group) {
          this.group.remove(this.surfMesh)
        }
        if (this.surfWireMesh && this.surfWireMesh.parent === this.group) {
          this.group.remove(this.surfWireMesh)
        }
        this.scene?.remove(this.group)
        this.releaseTree(this.group)
        this.group = null
      }
      if (this.surfWireMesh) {
        ;(this.surfWireMesh.material as any)?.dispose?.()
        this.surfWireMesh = null
      }
      if (this.surfMesh) {
        const r = this.renderer as (WebGLRenderer & { releaseGeometry?: (g: unknown) => void }) | null
        if (r && typeof r.releaseGeometry === 'function' && this.surfMesh.geometry) {
          r.releaseGeometry(this.surfMesh.geometry)
        } else if ((this.surfMesh.geometry as any)?.dispose) {
          (this.surfMesh.geometry as any).dispose()
        }
        ;(this.surfMesh.material as any)?.dispose?.()
        this.surfMesh = null
      }
      this.ribbonMesh = null
      this.renderer.dispose()
      if (this.renderer.domElement.parentElement === this) {
        this.removeChild(this.renderer.domElement)
      }
      this.renderer = null
    }
    if (this.overlay && this.overlay.parentElement === this) {
      this.removeChild(this.overlay)
      this.overlay = null
    }
    if (this.pillEl && this.pillEl.parentElement === this) {
      this.removeChild(this.pillEl)
      this.pillEl = null
    }
    if (this.resetBtnEl && this.resetBtnEl.parentElement === this) {
      this.removeChild(this.resetBtnEl)
      this.resetBtnEl = null
    }
    this.scene = null
    this.camera = null
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-quantumwave')) {
  customElements.define('elementa-quantumwave', ElementaQuantumWaveElement)
}
