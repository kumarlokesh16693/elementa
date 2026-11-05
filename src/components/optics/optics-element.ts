/**
 * ELEMENTA — Optics & Wave Phenomena
 * Custom Web Component:
 *   • WebGL (@nexus/3d): a real-time near-field ripple tank. Every slit is a
 *     coherent line source; the shared wave field is precomputed once per
 *     geometry as two arrays (Σ A cos kr, Σ A sin kr) so each frame only costs
 *     one multiply-add per vertex: y = fc·cos ωt + fs·sin ωt. Slit markers and
 *     the aperture wall are rebuilt on geometry changes and tinted with the
 *     wavelength.
 *   • 2D canvas overlay: the exact Fraunhofer figure for the same geometry —
 *     I(y) on a screen at distance L, the single-slit envelope, a colour-coded
 *     fringe strip, order ruler, fringe spacing / resolving-power readouts.
 *
 * Physics by @/lib/optics. The 3D field is a qualitative near-field view; the
 * overlay carries the exact far-field numbers.
 */

import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from '@nexus/3d'
import {
  envelopeZeroSin,
  firstOrderSin,
  fringeSpacingM,
  intensityAtScreen,
  resolvingPower,
  rayleighDeltaLambdaNm,
  spectralName,
  visibleOrders,
  wavelengthCss,
  wavelengthToRgb,
  type OpticsSystem,
  type SlitParams,
} from '@/lib/optics'

const COLS = 200
const ROWS = 80
const SURF_W = 12 // world x extent of the ripple tank
const DEPTH = 9 // world z extent (slit plane → screen side)
const SLIT_Z = -DEPTH / 2
const AMP_H = 1.4
const LAMBDA_WORLD = 0.42
const WALL_H = 1.15

export class ElementaOpticsElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private raf = 0
  private ro: ResizeObserver | null = null
  private group: Object3D | null = null
  private wallMesh: Mesh | null = null
  private markers: Mesh[] = []
  private overlay: HTMLCanvasElement | null = null
  private noteEl: HTMLElement | null = null
  private ready = false

  // field geometry (persistent; updated per frame)
  private surfMesh: Mesh | null = null
  private surfPos: Float32Array = new Float32Array(ROWS * COLS * 3)
  private surfCol: Float32Array = new Float32Array(ROWS * COLS * 3)
  private fc: Float32Array = new Float32Array(ROWS * COLS)
  private fs: Float32Array = new Float32Array(ROWS * COLS)
  private fieldScale = 1
  private slitXs: number[] = []
  private slitW = 0.12

  // public state (page-driven)
  public system: OpticsSystem = 'double'
  public lambdaNm = 550
  public aUm = 0.6
  public dUm = 3
  public nSlits = 2
  public screenL = 1.5
  public speed = 1
  public animating = true

  private fieldT = 0
  private lastTime = 0
  private lastSeed: string | null = null
  private lastGeoSig = ''

  static get observedAttributes(): string[] {
    return [
      'data-system', 'data-lambda', 'data-a', 'data-d', 'data-n',
      'data-l', 'data-speed', 'data-anim', 'data-reset',
    ]
  }

  connectedCallback(): void {
    if (this.ready) return
    this.initScene()
    this.readAttributes()
    this.rebuild(true)
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    if (!this.ready) return
    this.readAttributes()
    this.rebuild(false)
  }

  /* ------------------------------------------------------------------ */

  private initScene(): void {
    this.style.position = 'relative'
    this.style.display = 'block'
    this.style.width = '100%'
    this.style.height = '100%'

    // Physics-figure overlay first — it must render even when WebGL is
    // unavailable (GPU-blocked machines, headless browsers, crashes).
    const overlay = document.createElement('canvas')
    overlay.style.position = 'absolute'
    overlay.style.top = '10px'
    overlay.style.left = '10px'
    overlay.style.bottom = '10px'
    overlay.style.width = '55%'
    overlay.style.height = 'calc(100% - 20px)'
    overlay.style.pointerEvents = 'none'
    overlay.style.borderRadius = '12px'
    overlay.style.border = '1px solid rgba(255,255,255,0.10)'
    overlay.style.background = 'rgba(8,12,20,0.88)'
    overlay.style.zIndex = '2'
    this.appendChild(overlay)
    this.overlay = overlay

    // 3D tank (optional): a missing GL context degrades to the 2D figure.
    let renderer: WebGLRenderer | null = null
    let scene: Scene | null = null
    let camera: PerspectiveCamera | null = null
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.domElement.style.position = 'absolute'
      renderer.domElement.style.inset = '0'
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      renderer.domElement.style.touchAction = 'none'
      this.appendChild(renderer.domElement)
      this.renderer = renderer

      scene = new Scene()
      camera = new PerspectiveCamera(45, 1, 0.05, 400)
      camera.position.set(0, 8.6, 10.4)
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.target.set(0, 0, -0.6)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.minDistance = 6
      controls.maxDistance = 40
      controls.updateSphericalFromCamera()
      controls.update()
      this.scene = scene
      this.camera = camera
      this.controls = controls
    } catch {
      // WebGL blocked — keep the 2D physics figure fully functional.
      renderer = null
      scene = null
      camera = null
    }

    // Without a GL surface the figure takes the whole panel.
    if (!renderer) {
      overlay.style.width = 'calc(100% - 20px)'
      const note = document.createElement('div')
      note.textContent = 'WebGL unavailable — showing the exact far-field figure'
      note.style.cssText =
        'position:absolute;right:18px;bottom:14px;z-index:3;pointer-events:none;' +
        'font:10px ui-monospace,SFMono-Regular,Menlo,monospace;color:#71717a;' +
        'background:rgba(8,12,20,0.7);padding:3px 7px;border-radius:6px'
      this.appendChild(note)
      this.noteEl = note
    }

    const resize = () => {
      const w = this.clientWidth || 1
      const h = this.clientHeight || 1
      if (renderer && camera) {
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        // Frame the whole tank from any aspect ratio (phones included).
        if (this.controls) {
          const fit = Math.min(2.4, Math.max(1, 1.5 / camera.aspect))
          this.controls.setDistance(14 * fit)
        }
      }
      this.drawOverlay()
    }
    resize()
    this.ro = new ResizeObserver(resize)
    this.ro.observe(this)

    if (renderer && scene && camera) {
      const r = renderer
      const s = scene
      const c = camera
      const tick = (now: number) => {
        this.raf = requestAnimationFrame(tick)
        const dt = this.lastTime ? Math.min(0.05, (now - this.lastTime) / 1000) : 0
        this.lastTime = now
        this.advance(dt)
        if (this.controls) this.controls.update()
        r.render(s, c)
      }
      this.lastTime = 0
      this.raf = requestAnimationFrame(tick)
    }

    this.ready = true
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
    if (sys === 'single' || sys === 'double' || sys === 'grating') this.system = sys
    this.lambdaNm = Math.min(780, Math.max(380, p('lambda', this.lambdaNm)))
    this.aUm = Math.min(6, Math.max(0.05, p('a', this.aUm)))
    this.dUm = Math.min(30, Math.max(0.3, p('d', this.dUm)))
    // a slit cannot be wider than the spacing between slits
    if (this.system !== 'single') this.aUm = Math.min(this.aUm, this.dUm * 0.8)
    this.nSlits = Math.min(10, Math.max(1, Math.round(p('n', this.nSlits))))
    this.screenL = Math.min(4, Math.max(0.2, p('l', this.screenL)))
    this.speed = Math.min(3, Math.max(0, p('speed', this.speed)))
    const a = this.getAttribute('data-anim')
    if (a != null) {
      const t = a.trim().toLowerCase()
      this.animating = t !== 'false' && t !== '0'
    }
  }

  /** Geometry signature: everything that changes the wave field. */
  private geoSig(): string {
    const n = this.effectiveSlits()
    return `${this.system}|${this.lambdaNm.toFixed(1)}|${this.aUm.toFixed(3)}|${this.dUm.toFixed(3)}|${n}`
  }

  private effectiveSlits(): number {
    return this.system === 'single' ? 1 : this.system === 'double' ? 2 : this.nSlits
  }

  private params(): SlitParams {
    return { lambdaNm: this.lambdaNm, aUm: this.aUm, dUm: this.dUm, nSlits: this.effectiveSlits() }
  }

  /** Rebuild the field (and wall) when the optical geometry changed. */
  private rebuild(full: boolean): void {
    const sig = this.geoSig()
    const geoChanged = sig !== this.lastGeoSig
    const seedAttr = this.getAttribute('data-reset')
    const seedChanged = seedAttr != null && seedAttr !== this.lastSeed
    this.lastSeed = seedAttr

    if (full || geoChanged) {
      this.lastGeoSig = sig
      this.buildField()
      this.buildWall()
    } else if (seedChanged) {
      this.fieldT = 0
      this.updateField(true)
    }

    // draw once now — rAF may be throttled (hidden tab)
    this.updateField(true)
    this.drawOverlay()
  }

  /* ------------------------------------------------------------------ */

  private buildField(): void {
    const p = this.params()
    const n = p.nSlits
    const ratio = (this.dUm * 1000) / this.lambdaNm // physical d/λ

    // world slit spacing — keeps far-field fringe density in step with d/λ,
    // but never lets a large grating overflow the tank
    let dWorld = Math.min(4.2, Math.max(0.2, 0.38 * ratio))
    if (n > 1) dWorld = Math.min(dWorld, 7.4 / (n - 1))
    dWorld = Math.max(0.12, dWorld)

    const aWorld = Math.min(0.9, Math.max(0.02, 0.38 * (this.aUm * 1000) / this.lambdaNm))
    this.slitW = Math.min(0.5, Math.max(0.07, aWorld))

    const xs: number[] = []
    for (let j = 0; j < n; j++) xs.push((j - (n - 1) / 2) * dWorld)
    this.slitXs = xs

    // coherent sub-sources across each finite-width slit (3 per slit)
    const srcX: number[] = []
    const srcZ: number[] = []
    const subs = aWorld > 0.06 ? 3 : 1
    for (const x of xs) {
      for (let s = 0; s < subs; s++) {
        const t = subs === 1 ? 0 : (s / (subs - 1) - 0.5) * aWorld
        srcX.push(x + t)
        srcZ.push(SLIT_Z + 0.05)
      }
    }

    const k = (2 * Math.PI) / LAMBDA_WORLD
    const fc = this.fc
    const fs = this.fs
    const pos = this.surfPos
    let amax = 0

    for (let r = 0; r < ROWS; r++) {
      const z = SLIT_Z + (r / (ROWS - 1)) * DEPTH
      for (let c = 0; c < COLS; c++) {
        const x = -SURF_W / 2 + (c / (COLS - 1)) * SURF_W
        const i = r * COLS + c
        let sc = 0
        let ss = 0
        for (let j = 0; j < srcX.length; j++) {
          const dx = x - srcX[j]
          const dz = z - srcZ[j]
          const rr = Math.sqrt(dx * dx + dz * dz) + 0.05
          const amp = 1 / Math.sqrt(rr + 0.55)
          const ph = k * rr
          sc += amp * Math.cos(ph)
          ss += amp * Math.sin(ph)
        }
        fc[i] = sc
        fs[i] = ss
        const mag = Math.sqrt(sc * sc + ss * ss)
        if (mag > amax) amax = mag
        pos[i * 3 + 0] = x
        pos[i * 3 + 1] = 0
        pos[i * 3 + 2] = z
      }
    }
    this.fieldScale = amax > 1e-9 ? AMP_H / amax : 1

    const mesh = this.surfMesh
    if (!mesh) {
      const geo = new BufferGeometry()
      geo.setAttribute('position', { array: this.surfPos, itemSize: 3 })
      geo.setAttribute('color', { array: this.surfCol, itemSize: 3 })
      const idx: number[] = []
      for (let r = 0; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS - 1; c++) {
          const a = r * COLS + c
          idx.push(a, a + COLS, a + 1, a + 1, a + COLS, a + COLS + 1)
        }
      }
      geo.setIndex(idx)
      const mat = new MeshBasicMaterial()
      mat.side = 'double'
      this.surfMesh = new Mesh(geo, mat)
    }

    this.updateField(true)
  }

  private buildWall(): void {
    const scene = this.scene
    const group = this.group ?? new Object3D()
    if (!this.group) {
      group.name = 'optics-content'
      this.group = group
      scene?.add(group)
      if (this.surfMesh) group.add(this.surfMesh)
    }

    if (this.wallMesh) {
      group.remove(this.wallMesh)
      this.renderer?.releaseGeometry(this.wallMesh.geometry)
      this.wallMesh = null
    }
    for (const m of this.markers) {
      group.remove(m)
      this.renderer?.releaseGeometry(m.geometry)
    }
    this.markers = []

    // aperture wall (a single dark quad at the slit plane)
    const wallGeo = new BufferGeometry()
    const zW = SLIT_Z - 0.08
    const wPos = new Float32Array([
      -SURF_W / 2, -0.02, zW,
      SURF_W / 2, -0.02, zW,
      SURF_W / 2, WALL_H, zW,
      -SURF_W / 2, WALL_H, zW,
    ])
    wallGeo.setAttribute('position', { array: wPos, itemSize: 3 })
    wallGeo.setIndex([0, 1, 2, 0, 2, 3])
    const wallMat = new MeshBasicMaterial({ color: '#0d1526' })
    wallMat.side = 'double'
    this.wallMesh = new Mesh(wallGeo, wallMat)
    group.add(this.wallMesh)

    // slit markers, tinted with the wavelength (engine Color accepts hex only)
    const [r, g, b] = wavelengthToRgb(this.lambdaNm)
    const hex2 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
    const tint = `#${hex2(r)}${hex2(g)}${hex2(b)}`
    const zM = SLIT_Z - 0.03
    for (const x of this.slitXs) {
      const geo = new BufferGeometry()
      const hw = this.slitW / 2
      const y0 = 0.02
      const y1 = WALL_H * 0.82
      const pos = new Float32Array([
        x - hw, y0, zM,
        x + hw, y0, zM,
        x + hw, y1, zM,
        x - hw, y1, zM,
      ])
      geo.setAttribute('position', { array: pos, itemSize: 3 })
      geo.setIndex([0, 1, 2, 0, 2, 3])
      const mat = new MeshBasicMaterial({ color: tint })
      mat.side = 'double'
      const mesh = new Mesh(geo, mat)
      this.markers.push(mesh)
      group.add(mesh)
    }
  }

  /* ------------------------------------------------------------------ */

  private advance(dt: number): void {
    if (!this.animating || dt <= 0 || !this.surfMesh) return
    this.fieldT += dt * this.speed
    this.updateField(false)
  }

  /** Write surface heights + colours; static build and per-frame share this. */
  private updateField(_force: boolean): void {
    const mesh = this.surfMesh
    if (!mesh) return
    const pos = this.surfPos
    const col = this.surfCol
    const fc = this.fc
    const fs = this.fs
    const scale = this.fieldScale

    const wt = 2 * Math.PI * 0.5 * this.fieldT
    const cw = Math.cos(wt)
    const sw = Math.sin(wt)
    const [cr, cg, cb] = wavelengthToRgb(this.lambdaNm)
    // crest = the light's own colour; trough = a deep indigo counter-phase
    const tr = 0.36
    const tg = 0.16
    const tb = 0.62

    for (let i = 0; i < fc.length; i++) {
      const y = (fc[i] * cw + fs[i] * sw) * scale
      pos[i * 3 + 1] = y
      const s = Math.max(-1, Math.min(1, y / AMP_H))
      const a = Math.pow(Math.abs(s), 0.72)
      const base = 0.045
      if (s >= 0) {
        col[i * 3 + 0] = base + cr * a
        col[i * 3 + 1] = base + cg * a
        col[i * 3 + 2] = base + cb * a
      } else {
        col[i * 3 + 0] = base + tr * a
        col[i * 3 + 1] = base + tg * a
        col[i * 3 + 2] = base + tb * a
      }
    }

    const pAttr = mesh.geometry.getAttribute('position')
    const cAttr = mesh.geometry.getAttribute('color')
    if (pAttr) pAttr.needsUpdate = true
    if (cAttr) cAttr.needsUpdate = true
  }

  /* ------------------------------------------------------------------ */

  private drawOverlay(): void {
    const cv = this.overlay
    if (!cv) return
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

    const p = this.params()
    const N = p.nSlits
    const col = wavelengthCss(this.lambdaNm, 1)
    const dim = wavelengthCss(this.lambdaNm, 0.35)
    const faint = wavelengthCss(this.lambdaNm, 0.14)

    const mL = 46
    const mR = 12
    const mT = 40
    const pw = w - mL - mR
    const mainH = h * 0.40
    const stripY = mT + mainH + 16
    const stripH = 46

    // ---- header ----
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#e2e8f0'
    const title =
      this.system === 'single' ? 'Single slit'
      : this.system === 'double' ? 'Double slit'
      : `Grating · N = ${N}`
    ctx.fillText(title, mL, 12)
    ctx.textAlign = 'right'
    ctx.fillStyle = col
    ctx.fillText(`λ = ${Math.round(this.lambdaNm)} nm · ${spectralName(this.lambdaNm)}`, w - mR, 12)
    if (w >= 520) {
      ctx.fillStyle = '#64748b'
      ctx.fillText(
        this.system === 'single'
          ? `a = ${this.aUm.toFixed(2)} µm · L = ${this.screenL.toFixed(2)} m`
          : `a = ${this.aUm.toFixed(2)} µm · d = ${this.dUm.toFixed(2)} µm · L = ${this.screenL.toFixed(2)} m`,
        w - mR, 26,
      )
    }
    ctx.textAlign = 'left'

    // ---- screen coordinate range (sinθ ≤ 0.35 ⇒ y = L tanθ) ----
    const sinMax = 0.35
    const yMaxM = this.screenL * Math.tan(Math.asin(sinMax))
    const yMaxMm = yMaxM * 1000

    const xPx = (yMm: number): number => mL + ((yMm + yMaxMm) / (2 * yMaxMm)) * pw
    const iY = (I: number): number => mT + mainH * (1 - Math.min(1, Math.max(0, I)) * 0.96)

    // sample intensity once per pixel column
    const samples: number[] = []
    const envs: number[] = []
    for (let px = 0; px <= pw; px++) {
      const yMm = -yMaxMm + (px / pw) * 2 * yMaxMm
      const yM = yMm / 1000
      samples.push(intensityAtScreen(yM, this.screenL, p))
      const sin = yM / Math.sqrt(yM * yM + this.screenL * this.screenL)
      const beta = Math.PI * p.aUm * 1000 * sin / p.lambdaNm
      envs.push(Math.abs(beta) < 1e-9 ? 1 : Math.pow(Math.sin(beta) / beta, 2))
    }

    // ---- axes ----
    ctx.strokeStyle = 'rgba(148,163,184,0.22)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(mL, iY(0))
    ctx.lineTo(mL + pw, iY(0))
    ctx.moveTo(mL, mT)
    ctx.lineTo(mL, iY(0))
    ctx.stroke()

    // light horizontal grid at 0.5
    ctx.strokeStyle = 'rgba(148,163,184,0.10)'
    ctx.beginPath()
    ctx.moveTo(mL, iY(0.5))
    ctx.lineTo(mL + pw, iY(0.5))
    ctx.stroke()
    ctx.fillStyle = '#475569'
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textAlign = 'right'
    ctx.fillText('1', mL - 6, iY(1))
    ctx.fillText('½', mL - 6, iY(0.5))
    ctx.fillText('0', mL - 6, iY(0))
    ctx.textAlign = 'left'
    ctx.fillText('I/I₀', mL - 40, mT - 8)

    // ---- envelope (single-slit diffraction) ----
    ctx.strokeStyle = 'rgba(148,163,184,0.38)'
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    for (let px = 0; px <= pw; px++) {
      const y = iY(envs[px])
      if (px === 0) ctx.moveTo(mL + px, y)
      else ctx.lineTo(mL + px, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // ---- intensity curve ----
    ctx.beginPath()
    for (let px = 0; px <= pw; px++) {
      const y = iY(samples[px])
      if (px === 0) ctx.moveTo(mL + px, y)
      else ctx.lineTo(mL + px, y)
    }
    ctx.lineTo(mL + pw, iY(0))
    ctx.lineTo(mL, iY(0))
    ctx.closePath()
    ctx.fillStyle = faint
    ctx.fill()

    ctx.beginPath()
    for (let px = 0; px <= pw; px++) {
      const y = iY(samples[px])
      if (px === 0) ctx.moveTo(mL + px, y)
      else ctx.lineTo(mL + px, y)
    }
    ctx.strokeStyle = col
    ctx.lineWidth = 1.6
    ctx.stroke()

    // ---- x ticks (screen position, mm) ----
    const tickStep = niceStep((yMaxMm * (w < 520 ? 2 : 1)) / (w < 520 ? 5 : 4))
    ctx.fillStyle = '#64748b'
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textAlign = 'center'
    const startTick = Math.ceil(-yMaxMm / tickStep) * tickStep
    for (let yv = startTick; yv <= yMaxMm + 1e-9; yv += tickStep) {
      const px = xPx(yv)
      ctx.fillText(`${Math.round(yv)}`, px, iY(0) + 12)
    }
    ctx.fillText('y (mm)', mL + pw / 2, iY(0) + 26)

    // ---- fringe strip ----
    const stripBg = ctx.createLinearGradient(mL, 0, mL + pw, 0)
    for (let px = 0; px <= pw; px += 2) {
      const I = samples[Math.min(samples.length - 1, px)]
      stripBg.addColorStop(px / pw, wavelengthCss(this.lambdaNm, 0.03 + 0.97 * Math.pow(I, 1.7)))
    }
    ctx.fillStyle = stripBg
    ctx.fillRect(mL, stripY, pw, stripH)
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'
    ctx.strokeRect(mL + 0.5, stripY + 0.5, pw - 1, stripH - 1)
    ctx.fillStyle = '#475569'
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textAlign = 'left'
    ctx.fillText('screen', mL, stripY + stripH + 10)

    // ---- order ruler / envelope minima ----
    const orders = visibleOrders(p)
    const zeroSin = envelopeZeroSin(p)
    const thetaZero = zeroSin != null ? (Math.asin(zeroSin) * 180) / Math.PI : null
    const rulerY = stripY + stripH + 22
    ctx.strokeStyle = 'rgba(148,163,184,0.25)'
    ctx.beginPath()
    ctx.moveTo(mL, rulerY)
    ctx.lineTo(mL + pw, rulerY)
    ctx.stroke()

    const statY = rulerY + 36
    const narrow = w < 520
    const statFont = narrow ? 9 : 10
    ctx.textAlign = 'left'
    ctx.font = `${statFont}px ui-monospace, SFMono-Regular, Menlo, monospace`

    const drawStats = (lines: string[]): void => {
      ctx.font = `${statFont}px ui-monospace, SFMono-Regular, Menlo, monospace`
      for (let i = 0; i < lines.length; i++) {
        ctx.fillStyle = i === 0 ? '#a1a1aa' : '#71717a'
        ctx.fillText(lines[i], mL, statY + i * (statFont + 4))
      }
    }

    if (this.system === 'single') {
      // A single slit has no interference orders — mark the sinc² minima.
      ctx.textAlign = 'center'
      const pMax = Math.min(6, Math.floor((p.aUm * 1000) / this.lambdaNm))
      if (pMax === 0) {
        ctx.fillStyle = '#64748b'
        ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace'
        const lim = Math.round((Math.asin(sinMax) * 180) / Math.PI)
        ctx.fillText(`no envelope minima inside ±${lim}°`, mL + pw / 2, rulerY + 14)
      } else {
        for (let q = -pMax; q <= pMax; q++) {
          if (q === 0) continue
          const sin = (q * this.lambdaNm) / (p.aUm * 1000)
          if (Math.abs(sin) > sinMax) continue
          const yMm = this.screenL * Math.tan(Math.asin(sin)) * 1000
          const px = xPx(yMm)
          ctx.strokeStyle = 'rgba(148,163,184,0.5)'
          ctx.beginPath()
          ctx.moveTo(px, rulerY - 4)
          ctx.lineTo(px, rulerY + 4)
          ctx.stroke()
          ctx.fillStyle = '#94a3b8'
          ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
          ctx.fillText(`p=${q > 0 ? '+' : ''}${q}`, px, rulerY + 14)
        }
      }

      const lobeMm = zeroSin != null ? this.screenL * Math.tan(Math.asin(zeroSin)) * 1000 : null
      const line1 = [
        thetaZero != null ? `θ₀ = ${thetaZero.toFixed(2)}°` : 'no envelope zero',
        lobeMm != null ? `central lobe ±${lobeMm.toFixed(0)} mm` : 'lobe covers screen',
        `a/λ = ${((p.aUm * 1000) / this.lambdaNm).toFixed(2)}`,
      ].join('  ·  ')
      drawStats(narrow
        ? [
            thetaZero != null ? `θ₀ = ${thetaZero.toFixed(2)}°` : 'no envelope zero',
            lobeMm != null ? `central lobe ±${lobeMm.toFixed(0)} mm` : 'lobe covers screen',
            `a/λ = ${((p.aUm * 1000) / this.lambdaNm).toFixed(2)}  ·  sinc²(πa sinθ/λ)`,
          ]
        : [line1, 'I(θ) = sinc²(πa sinθ/λ)  ·  envelope zeros at a sinθ = pλ'])
    } else {
      ctx.textAlign = 'center'
      for (const m of orders) {
        const sin = (m * this.lambdaNm) / (p.dUm * 1000)
        if (Math.abs(sin) > sinMax) continue
        const yMm = this.screenL * Math.tan(Math.asin(sin)) * 1000
        const px = xPx(yMm)
        ctx.strokeStyle = m === 0 ? col : 'rgba(148,163,184,0.5)'
        ctx.beginPath()
        ctx.moveTo(px, rulerY - 4)
        ctx.lineTo(px, rulerY + 4)
        ctx.stroke()
        ctx.fillStyle = m === 0 ? col : '#94a3b8'
        ctx.fillText(m === 0 ? '0' : `m=${m > 0 ? '+' : ''}${m}`, px, rulerY + 14)
      }

      // ---- readouts ----
      const spacingMm = fringeSpacingM(p, this.screenL) * 1000
      const s1 = firstOrderSin(p)
      const theta1 = s1 != null ? (Math.asin(s1) * 180) / Math.PI : null
      const R = resolvingPower(p, 1)
      const dLam = rayleighDeltaLambdaNm(p, 1)
      const mMax = Math.max(...orders.map((m) => Math.abs(m)))

      ctx.textAlign = 'left'
      const dy = `Δy = ${spacingMm.toFixed(2)} mm`
      const th1 = theta1 != null ? `θ₁ = ${theta1.toFixed(2)}°` : 'θ₁ > 90° (no order)'
      const ord = `orders ±${mMax}`
      const env = thetaZero != null ? `envelope zero ${thetaZero.toFixed(2)}°` : 'envelope: no zero'
      const res = `R = N = ${R} @ m=1`
      const dl = Number.isFinite(dLam) ? `Δλ_R = ${dLam.toFixed(2)} nm` : ''

      drawStats(narrow
        ? [
            `${dy}  ·  ${th1}`,
            ord,
            [env, res].filter(Boolean).join('  ·  '),
            dl,
          ].filter(Boolean)
        : [`${dy}  ·  ${th1}  ·  ${ord}`, [env, res, dl].filter(Boolean).join('  ·  ')])
    }
  }

  /* ------------------------------------------------------------------ */

  private teardown(): void {
    cancelAnimationFrame(this.raf)
    this.ready = false
    this.lastGeoSig = ''
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
        this.group.traverse((obj) => {
          const renderable = obj as Mesh & { geometry?: BufferGeometry }
          if (renderable.geometry) this.renderer?.releaseGeometry(renderable.geometry)
        })
        this.scene?.remove(this.group)
        this.group = null
      }
      this.surfMesh = null
      this.wallMesh = null
      this.markers = []
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
    if (this.noteEl) {
      if (this.noteEl.parentElement === this) this.removeChild(this.noteEl)
      this.noteEl = null
    }
    this.scene = null
    this.camera = null
  }
}

/** 1 / 2 / 5 × 10ⁿ step for axis ticks. */
function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / pow
  const step = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10
  return step * pow
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-optics')) {
  customElements.define('elementa-optics', ElementaOpticsElement)
}
