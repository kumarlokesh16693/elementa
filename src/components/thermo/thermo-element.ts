/**
 * ELEMENTA — 3D Piston-Cylinder & PV Diagram Visualizer
 * Custom Web Component rendering an ideal-gas piston-cylinder with
 * animated gas molecules plus a live 2D P–V diagram overlay.
 */

import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  Points,
  Scene,
  WebGLRenderer,
} from '@nexus/3d'
import { createGlowPost, type GlowPost } from '@/lib/postfx'
import {
  computeCycle,
  pressure,
  type Cycle,
  type Process,
} from '@/lib/thermo'

const CYLINDER_COLOR = '#8aa0b8'
const PISTON_COLOR = '#54687a'
const BASE_COLOR = '#93a7bd'

/** Process colors shared with the 2D P–V diagram. */
const PROC_COLORS: Record<Process, string> = {
  isobaric: '#fbbf24',
  isochoric: '#38bdf8',
  isothermal: '#22d3ee',
  adiabatic: '#c084fc',
}

const V_SCALE_MAX = 0.1 // m³ that maps to full piston travel
const PISTON_TRAVEL = 3.2 // world units of piston travel above the base

interface CycleTrace {
  pts: { P: number; V: number; T: number; label: string }[]
  procs: Process[]
}

export class ElementaThermoElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private raf = 0
  private ro: ResizeObserver | null = null
  private currentGroup: Object3D | null = null
  private pvCanvas: HTMLCanvasElement | null = null
  private cameraReady = false

  // Simulation state
  public n = 1.0 // moles
  public T = 300.0 // K
  public V = 0.0224 // m³
  public gamma = 1.4
  public cycle: Cycle = 'carnot'
  public Th = 600.0 // K hot reservoir
  public Tc = 300.0 // K cold reservoir
  public cutoff = 1.5 // Diesel cutoff ratio
  public showCycle = true
  public showParticles = true
  public autoCycle = false
  public cyclePhase = 0 // 0..1 animation through cycle
  private glow: GlowPost | null = null
  private fx = false

  static get observedAttributes(): string[] {
    return [
      'data-n', 'data-t', 'data-v', 'data-gamma', 'data-cycle', 'data-th',
      'data-tc', 'data-cutoff', 'data-show-cycle', 'data-show-particles',
      'data-auto-cycle', 'data-cycle-phase', 'data-fx',
    ]
  }

  connectedCallback(): void {
    if (this.renderer) return
    this.initScene()
    this.readAttributes()
    this.build()
    this.syncGlow()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    this.readAttributes()
    this.syncGlow()
    if (this.isConnected && this.renderer) this.build()
  }

  /** Build or release the glow post chain for the engine. */
  private syncGlow(): void {
    if (this.fx) {
      if ((!this.glow || !this.glow.active) && this.renderer && this.scene && this.camera) {
        this.glow = createGlowPost(this.renderer, this.scene, this.camera)
      }
    } else if (this.glow) {
      this.glow.dispose()
      this.glow = null
    }
  }

  private readAttributes(): void {
    const p = (k: string, d: number): number => {
      const raw = this.getAttribute(`data-${k}`)
      if (raw == null || raw.trim() === '') return d
      const v = Number(raw)
      return Number.isFinite(v) ? v : d
    }
    const s = (k: string, d: string): string => {
      const v = this.getAttribute(`data-${k}`)
      return v != null ? v : d
    }
    // Boolean attributes: the vDOM renders `true` as an empty attribute
    // (attr="") and `false` by omitting it entirely. Treat presence as true
    // unless explicitly "false"/"0".
    const b = (k: string, d: boolean): boolean => {
      const v = this.getAttribute(`data-${k}`)
      if (v == null) return d
      const t = v.trim().toLowerCase()
      if (t === 'false' || t === '0') return false
      return true
    }
    const positive = (key: string, fallback: number): number => {
      const value = p(key, fallback)
      return value > 0 ? value : fallback
    }
    this.n = positive('n', 1)
    this.T = positive('t', 300)
    this.V = positive('v', 0.0224)
    const gamma = p('gamma', 1.4)
    this.gamma = gamma > 1 ? gamma : 1.4
    this.cycle = s('cycle', this.cycle) as Cycle
    this.Th = positive('th', 600)
    this.Tc = positive('tc', 300)
    this.cutoff = positive('cutoff', 1.5)
    this.showCycle = b('show-cycle', true)
    this.showParticles = b('show-particles', true)
    this.autoCycle = b('auto-cycle', false)
    this.cyclePhase = p('cycle-phase', this.cyclePhase)
    const fxRaw = this.getAttribute('data-fx')
    if (fxRaw != null) {
      const t = fxRaw.trim().toLowerCase()
      this.fx = t !== 'false' && t !== '0' && t !== 'off'
    }
  }

  private initScene(): void {
    this.style.position = 'relative'
    this.style.display = 'block'
    this.style.width = '100%'
    this.style.height = '100%'

    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.inset = '0'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.touchAction = 'none'
    this.appendChild(renderer.domElement)
    this.renderer = renderer

    const scene = new Scene()
    const camera = new PerspectiveCamera(45, 1, 0.01, 1000)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08

    scene.add(new AmbientLight(0xffffff, 0.55))
    const key = new DirectionalLight(0xffffff, 0.9)
    key.position.set(5, 8, 5)
    scene.add(key)
    const fill = new DirectionalLight(0x88aaff, 0.35)
    fill.position.set(-5, -3, -6)
    scene.add(fill)

    this.scene = scene
    this.camera = camera
    this.controls = controls

    // 2D P–V diagram overlay (top-right corner, above the WebGL canvas).
    const pv = document.createElement('canvas')
    pv.style.position = 'absolute'
    pv.style.top = '10px'
    pv.style.right = '10px'
    pv.style.pointerEvents = 'none'
    pv.style.borderRadius = '10px'
    pv.style.border = '1px solid rgba(255,255,255,0.10)'
    pv.style.background = 'rgba(8,12,20,0.88)'
    pv.style.zIndex = '2'
    this.appendChild(pv)
    this.pvCanvas = pv

    const resize = () => {
      const w = this.clientWidth || 1
      const h = this.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      this.drawPVDiagram()
      if (this.glow?.active) {
        this.glow.setSize(renderer.domElement.width, renderer.domElement.height)
      }
    }
    resize()
    this.ro = new ResizeObserver(resize)
    this.ro.observe(this)

    const tick = () => {
      this.raf = requestAnimationFrame(tick)
      if (this.controls) this.controls.update()
      if (this.glow?.active) this.glow.render()
      else renderer.render(scene, camera)
    }
    tick()
  }

  private build(): void {
    const scene = this.scene
    const camera = this.camera
    const controls = this.controls
    const renderer = this.renderer
    if (!scene || !camera || !controls || !renderer) return

    const cycle = computeCycle(
      this.cycle,
      this.n,
      this.V * 0.4,
      this.V * 2.2,
      this.Th,
      this.Tc,
      this.gamma,
      this.cutoff,
    )

    // --- Piston position -------------------------------------------------
    // When animating, follow the cycle's own volume range; otherwise follow
    // the state volume slider (0 .. V_SCALE_MAX).
    let pistonFraction: number
    if (this.autoCycle) {
      const vNow = this.interpolateCycleVolume(cycle.points)
      let cMin = Infinity
      let cMax = -Infinity
      for (const pt of cycle.points) {
        if (pt.V < cMin) cMin = pt.V
        if (pt.V > cMax) cMax = pt.V
      }
      const span = cMax - cMin
      pistonFraction = span > 0 ? (vNow - cMin) / span : 0.5
    } else {
      pistonFraction = this.V / V_SCALE_MAX
    }
    pistonFraction = Math.max(0.03, Math.min(0.97, pistonFraction))
    const pistonY = 0.2 + pistonFraction * PISTON_TRAVEL

    const group = new Object3D()
    group.name = 'thermo-content'

    // --- Cylinder base ---
    const base = new Mesh(
      new BoxGeometry(6, 0.4, 6),
      new MeshBasicMaterial({ color: BASE_COLOR }),
    )
    base.position.set(0, -0.2, 0)
    group.add(base)

    // --- Cylinder walls (three sides, open top/front) ---
    const wallMat = new MeshBasicMaterial({
      color: CYLINDER_COLOR,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })
    const wallH = 4.2
    const wallY = wallH / 2 - 0.2
    const left = new Mesh(new BoxGeometry(0.18, wallH, 6), wallMat)
    left.position.set(-2.9, wallY, 0)
    group.add(left)
    const right = new Mesh(new BoxGeometry(0.18, wallH, 6), wallMat)
    right.position.set(2.9, wallY, 0)
    group.add(right)
    const back = new Mesh(new BoxGeometry(6, wallH, 0.18), wallMat)
    back.position.set(0, wallY, -2.9)
    group.add(back)

    // --- Piston plate + rod ---
    const piston = new Mesh(
      new BoxGeometry(5.6, 0.3, 5.6),
      new MeshBasicMaterial({ color: PISTON_COLOR }),
    )
    piston.position.set(0, pistonY + 0.15, 0)
    group.add(piston)
    const rod = new Mesh(
      new BoxGeometry(0.24, 1.4, 0.24),
      new MeshBasicMaterial({ color: '#64748b' }),
    )
    rod.position.set(0, pistonY + 0.3 + 0.7, -2.4)
    group.add(rod)

    // --- Gas molecules ---
    if (this.showParticles) {
      const count = 140
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      const yLo = 0.1
      const yHi = Math.max(yLo + 0.15, pistonY - 0.12)
      const radius = 2.35
      for (let i = 0; i < count; i++) {
        const r = radius * Math.sqrt(Math.random())
        const theta = Math.random() * 2 * Math.PI
        positions[i * 3] = r * Math.cos(theta)
        positions[i * 3 + 1] = yLo + Math.random() * (yHi - yLo)
        positions[i * 3 + 2] = r * Math.sin(theta)
        // Bright cyan, slightly varied so the cloud reads as depth.
        const bright = 0.75 + Math.random() * 0.25
        colors[i * 3] = 0.133 * bright
        colors[i * 3 + 1] = 0.827 * bright
        colors[i * 3 + 2] = 0.922 * bright
      }
      const geo = new BufferGeometry()
      geo.setAttribute('position', { array: positions, itemSize: 3 })
      geo.setAttribute('color', { array: colors, itemSize: 3 })
      const mat = new MeshBasicMaterial({ transparent: true, opacity: 0.95 })
      // The engine clamps point sprites to 1.5–3.5 screen pixels; request
      // the maximum so the molecules stay visible in the chamber.
      ;(mat as unknown as { size: number }).size = 3.5
      group.add(new Points(geo, mat))
    }

    // Swap in the new content, releasing the previous GPU buffers.
    if (this.currentGroup) {
      this.currentGroup.traverse((obj) => {
        const renderable = obj as Mesh & { geometry?: BufferGeometry }
        if (renderable.geometry) renderer.releaseGeometry(renderable.geometry)
      })
      scene.remove(this.currentGroup)
    }
    scene.add(group)
    this.currentGroup = group

    // Frame the cylinder once; never fight the user's orbit afterwards.
    if (!this.cameraReady) {
      camera.position.set(11, 8, 14)
      camera.near = 0.01
      camera.far = 400
      camera.updateProjectionMatrix()
      controls.target.set(0, 1.6, 0)
      controls.minDistance = 5
      controls.maxDistance = 55
      controls.update()
      this.cameraReady = true
    }

    this.drawPVDiagram()
  }

  /** Volume of the ideal gas at a given point along the animated cycle. */
  private interpolateCycleVolume(points: CycleTrace['pts']): number {
    const progress = ((this.cyclePhase % 1) + 1) % 1
    const segPos = progress * points.length
    const seg = Math.floor(segPos) % points.length
    const frac = segPos - Math.floor(segPos)
    const a = points[seg]
    const b = points[(seg + 1) % points.length]
    return a.V + (b.V - a.V) * frac
  }

  /** Pressure along a sampled process between two cycle states. */
  private pressureAlong(
    proc: Process,
    p1: { P: number; V: number },
    v: number,
    gamma: number,
  ): number {
    if (proc === 'isobaric') return p1.P
    if (proc === 'isothermal') return (p1.P * p1.V) / v // P·V = const
    if (proc === 'adiabatic') return p1.P * Math.pow(p1.V / v, gamma)
    return p1.P // isochoric handled by the caller (single V)
  }

  /** Draw the 2D P–V diagram overlay. */
  private drawPVDiagram(): void {
    const canvas = this.pvCanvas
    if (!canvas) return
    if (!this.showCycle) {
      canvas.style.display = 'none'
      return
    }
    canvas.style.display = 'block'

    const cssW = 300
    const cssH = 216
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr
      canvas.height = cssH * dpr
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)

    const cycle = computeCycle(
      this.cycle,
      this.n,
      this.V * 0.4,
      this.V * 2.2,
      this.Th,
      this.Tc,
      this.gamma,
      this.cutoff,
    )
    const pts = cycle.points
    const g = Math.max(1.001, this.gamma)

    // Sample each process into a polyline.
    const samplesPer = 26
    const paths: { proc: Process; xy: [number, number][] }[] = []
    let minV = Infinity
    let maxV = -Infinity
    let minP = Infinity
    let maxP = -Infinity
    for (let i = 0; i < 4; i++) {
      const p1 = pts[i]
      const p2 = pts[(i + 1) % 4]
      const proc = cycle.processes[i]
      const xy: [number, number][] = []
      if (proc === 'isochoric') {
        xy.push([p1.V, p1.P], [p1.V, p2.P])
      } else {
        for (let s = 0; s <= samplesPer; s++) {
          const t = s / samplesPer
          const v = p1.V + (p2.V - p1.V) * t
          const pr = this.pressureAlong(proc, p1, v, g)
          xy.push([v, pr])
        }
      }
      for (const [v, pr] of xy) {
        if (v < minV) minV = v
        if (v > maxV) maxV = v
        if (pr < minP) minP = pr
        if (pr > maxP) maxP = pr
      }
      paths.push({ proc, xy })
    }

    // Plot geometry (small margin so edge labels are not clipped).
    const padL = 52
    const padR = 14
    const padT = 34
    const padB = 30
    const plotW = cssW - padL - padR
    const plotH = cssH - padT - padB
    const spanV0 = maxV - minV || 1
    const spanP0 = maxP - minP || 1
    // Expand the data range by 4% on each side for breathing room.
    minV -= spanV0 * 0.04
    maxV += spanV0 * 0.04
    minP -= spanP0 * 0.06
    maxP += spanP0 * 0.06
    const spanV = maxV - minV || 1
    const spanP = maxP - minP || 1
    const px = (v: number): number => padL + ((v - minV) / spanV) * plotW
    const py = (pr: number): number => padT + plotH - ((pr - minP) / spanP) * plotH

    // Title.
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '600 10px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`${cycle.name.toUpperCase()} CYCLE`, 10, 9)

    // Axes.
    ctx.strokeStyle = 'rgba(148,163,184,0.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL, padT)
    ctx.lineTo(padL, padT + plotH)
    ctx.lineTo(padL + plotW, padT + plotH)
    ctx.stroke()

    // Axis ticks + labels.
    ctx.fillStyle = '#71717a'
    ctx.font = '9px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let i = 0; i <= 3; i++) {
      const v = minV + (spanV * i) / 3
      const x = px(v)
      ctx.fillText(v.toExponential(1), x, padT + plotH + 4)
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + plotH)
      ctx.stroke()
    }
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 3; i++) {
      const pr = minP + (spanP * i) / 3
      const y = py(pr)
      ctx.fillText(pr.toExponential(1), padL - 5, y)
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
      ctx.stroke()
    }

    // Axis titles.
    ctx.fillStyle = '#71717a'
    ctx.font = '9px ui-monospace, monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText('V (m³)', padL + plotW, cssH - 2)
    ctx.save()
    ctx.translate(10, padT)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText('P (Pa)', 0, 0)
    ctx.restore()

    // Cycle path, colored per process.
    ctx.lineWidth = 2
    for (const { proc, xy } of paths) {
      ctx.strokeStyle = PROC_COLORS[proc]
      ctx.beginPath()
      xy.forEach(([v, pr], i) => {
        const x = px(v)
        const y = py(pr)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    // State markers.
    ctx.font = '600 9px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    for (const pt of pts) {
      const x = px(pt.V)
      const y = py(pt.P)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e4e4e7'
      ctx.fillText(pt.label, x, y - 5)
    }

    // Animated position marker.
    if (this.autoCycle) {
      const progress = ((this.cyclePhase % 1) + 1) % 1
      const segPos = progress * 4
      const seg = Math.floor(segPos) % 4
      const frac = segPos - Math.floor(segPos)
      const a = pts[seg]
      const b = pts[(seg + 1) % 4]
      const v = a.V + (b.V - a.V) * frac
      const pr = this.pressureAlong(cycle.processes[seg], a, v, g)
      const x = px(v)
      const y = py(pr)
      ctx.fillStyle = 'rgba(34,211,238,0.30)'
      ctx.beginPath()
      ctx.arc(x, y, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(x, y, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Legend.
    const legend: [Process, string][] = [
      ['isothermal', 'isoT'],
      ['adiabatic', 'adiab'],
      ['isobaric', 'isoP'],
      ['isochoric', 'isoV'],
    ]
    ctx.font = '8.5px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    let lx = 10
    const ly = cssH - 9
    for (const [proc, label] of legend) {
      ctx.strokeStyle = PROC_COLORS[proc]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(lx, ly)
      ctx.lineTo(lx + 10, ly)
      ctx.stroke()
      ctx.fillStyle = '#71717a'
      ctx.fillText(label, lx + 13, ly)
      lx += 13 + ctx.measureText(label).width + 8
    }
  }

  private teardown(): void {
    cancelAnimationFrame(this.raf)
    if (this.glow) {
      this.glow.dispose()
      this.glow = null
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
      if (this.currentGroup) {
        this.currentGroup.traverse((obj) => {
          const renderable = obj as Mesh & { geometry?: BufferGeometry }
          if (renderable.geometry) this.renderer?.releaseGeometry(renderable.geometry)
        })
        this.scene?.remove(this.currentGroup)
        this.currentGroup = null
      }
      this.renderer.dispose()
      if (this.renderer.domElement.parentElement === this) {
        this.removeChild(this.renderer.domElement)
      }
      this.renderer = null
    }
    if (this.pvCanvas && this.pvCanvas.parentElement === this) {
      this.removeChild(this.pvCanvas)
      this.pvCanvas = null
    }
    this.scene = null
    this.camera = null
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-thermo')) {
  customElements.define('elementa-thermo', ElementaThermoElement)
}
