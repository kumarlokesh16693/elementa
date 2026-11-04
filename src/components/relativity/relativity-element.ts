/**
 * ELEMENTA — Special Relativity Visualizer
 * Custom Web Component rendering a relativistic light clock (time dilation)
 * with a length-contracting rod, plus a 2D spacetime diagram overlay
 * (light cone, worldlines, primed axes).
 */

import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  DirectionalLight,
  Line,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from '@nexus/3d'
import { C, lorentzFactor } from '@/lib/relativity'

const CARRIAGE_COLOR = '#475569'
const MIRROR_COLOR = '#94a3b8'
const ROD_STATIC_COLOR = '#e4e4e7'
const ROD_MOVING_COLOR = '#22d3ee'
const PHOTON_COLOR = '#ffffff'
const TRAIL_COLOR = '#22d3ee'

const CLOCK_HEIGHT = 2.6 // world units between mirrors
const CARRIAGE_HALF = 1.3
const TRAVEL_LIMIT = 5.5 // x bounds for the carriage (keeps it in frame)
const WORLD_SPEED = 1.7 // world units/s at β = 1
const PHASE_PERIOD = 0.95 // seconds per bounce at β = 0
const TRAIL_MAX = 220
const ROD_SCALE = 0.09 // metres → world units
const X_MAX = 4e8 // spacetime diagram extent (m)

export class ElementaRelativityElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private raf = 0
  private ro: ResizeObserver | null = null
  private currentGroup: Object3D | null = null
  private diagramCanvas: HTMLCanvasElement | null = null
  private cameraReady = false

  // Animated objects (rebuilt with the scene, advanced by the tick loop)
  private carriage: Object3D | null = null
  private photon: Mesh | null = null
  private movingRod: Mesh | null = null
  private trailLine: Line | null = null

  // Animation state (persists across rebuilds)
  private clockX = -TRAVEL_LIMIT
  private photonPhase = 0
  private lastTime = 0
  private trail = new Float32Array(TRAIL_MAX * 3)
  private trailCount = 0

  // Simulation state
  public beta = 0.8
  public properLength = 12 // m
  public showTrail = true
  public showRods = true
  public animating = true

  static get observedAttributes(): string[] {
    return ['data-beta', 'data-proper-length', 'data-show-trail', 'data-show-rods', 'data-animate']
  }

  connectedCallback(): void {
    if (this.renderer) return
    this.initScene()
    this.readAttributes()
    this.build()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    this.readAttributes()
    if (this.isConnected && this.renderer) this.build()
  }

  private readAttributes(): void {
    const p = (k: string, d: number): number => {
      const raw = this.getAttribute(`data-${k}`)
      if (raw == null || raw.trim() === '') return d
      const v = Number(raw)
      return Number.isFinite(v) ? v : d
    }
    // Boolean attributes: the vDOM renders `true` as an empty attribute and
    // omits `false` entirely, so presence means true unless "false"/"0".
    const b = (k: string, d: boolean): boolean => {
      const v = this.getAttribute(`data-${k}`)
      if (v == null) return d
      const t = v.trim().toLowerCase()
      if (t === 'false' || t === '0') return false
      return true
    }
    const beta = p('beta', this.beta)
    this.beta = Math.max(0, Math.min(0.999, beta))
    const len = p('proper-length', this.properLength)
    this.properLength = len > 0 ? len : this.properLength
    this.showTrail = b('show-trail', true)
    this.showRods = b('show-rods', true)
    this.animating = b('animate', true)
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

    scene.add(new AmbientLight(0xffffff, 0.6))
    const key = new DirectionalLight(0xffffff, 0.85)
    key.position.set(6, 9, 6)
    scene.add(key)
    const fill = new DirectionalLight(0x88aaff, 0.3)
    fill.position.set(-6, -3, -7)
    scene.add(fill)

    this.scene = scene
    this.camera = camera
    this.controls = controls

    // Spacetime diagram overlay (top-right corner).
    const diagram = document.createElement('canvas')
    diagram.style.position = 'absolute'
    diagram.style.top = '10px'
    diagram.style.right = '10px'
    diagram.style.pointerEvents = 'none'
    diagram.style.borderRadius = '10px'
    diagram.style.border = '1px solid rgba(255,255,255,0.10)'
    diagram.style.background = 'rgba(8,12,20,0.88)'
    diagram.style.zIndex = '2'
    this.appendChild(diagram)
    this.diagramCanvas = diagram

    const resize = () => {
      const w = this.clientWidth || 1
      const h = this.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      this.drawDiagram()
    }
    resize()
    this.ro = new ResizeObserver(resize)
    this.ro.observe(this)

    const tick = (now: number) => {
      this.raf = requestAnimationFrame(tick)
      const dt = this.lastTime ? Math.min(0.05, (now - this.lastTime) / 1000) : 0
      this.lastTime = now
      this.advance(dt)
      if (this.controls) this.controls.update()
      renderer.render(scene, camera)
    }
    this.raf = requestAnimationFrame(tick)
  }

  /** Advance the light clock, photon trail, and contracting rod. */
  private advance(dt: number): void {
    if (!this.animating || dt <= 0) return

    // Carriage sweeps left→right at a speed proportional to β.
    this.clockX += this.beta * WORLD_SPEED * dt
    if (this.clockX > TRAVEL_LIMIT) {
      this.clockX = -TRAVEL_LIMIT
      // Drop the trail: otherwise a single segment would stretch across the
      // whole scene connecting the wrap point to the previous pass.
      this.trailCount = 0
    }

    // Photon bounce: the round-trip period stretches by γ (time dilation).
    // Centre travels from just above the bottom mirror to just below the
    // top mirror (mirror half-height + photon radius = 0.16 clearance).
    const gamma = lorentzFactor(this.beta)
    this.photonPhase += dt / (gamma * PHASE_PERIOD)
    const tri = 1 - Math.abs(2 * (((this.photonPhase % 1) + 1) % 1) - 1)
    const photonY = 0.44 + tri * (CLOCK_HEIGHT - 0.32)

    if (this.carriage) this.carriage.position.x = this.clockX
    // Photon and rod are children of the carriage: keep them at local x = 0
    // so they inherit the carriage transform exactly once.
    if (this.photon) this.photon.position.set(0, photonY, 0)

    // Push the photon world-line into the rolling trail.
    if (this.trailCount < TRAIL_MAX) {
      const i = this.trailCount * 3
      this.trail[i] = this.clockX
      this.trail[i + 1] = photonY
      this.trail[i + 2] = 0
      this.trailCount++
    } else {
      this.trail.copyWithin(0, 3)
      const i = (TRAIL_MAX - 1) * 3
      this.trail[i] = this.clockX
      this.trail[i + 1] = photonY
      this.trail[i + 2] = 0
    }
    if (this.trailLine && this.showTrail) {
      const attr = this.trailLine.geometry.getAttribute('position')
      if (attr) {
        // Keep the whole buffer valid: points past the head repeat the last
        // real point, producing zero-length (invisible) segments. Copy all
        // three components — filling with a single scalar would smear the
        // x value into y/z and draw a bogus line toward (x, x, x).
        const head = Math.max(0, this.trailCount - 1) * 3
        for (let i = this.trailCount * 3; i < TRAIL_MAX * 3; i += 3) {
          this.trail[i] = this.trail[head]
          this.trail[i + 1] = this.trail[head + 1]
          this.trail[i + 2] = this.trail[head + 2]
        }
        attr.array.set(this.trail)
        attr.needsUpdate = true
      }
    }
  }

  private build(): void {
    const scene = this.scene
    const camera = this.camera
    const controls = this.controls
    const renderer = this.renderer
    if (!scene || !camera || !controls || !renderer) return

    const gamma = lorentzFactor(this.beta)
    const group = new Object3D()
    group.name = 'relativity-content'

    // --- Moving carriage (light clock platform) ---
    this.carriage = new Object3D()
    const deck = new Mesh(
      new BoxGeometry(CARRIAGE_HALF * 2, 0.14, 2.2),
      new MeshBasicMaterial({ color: CARRIAGE_COLOR }),
    )
    deck.position.set(0, 0.1, 0)
    this.carriage.add(deck)

    // Mirrors.
    const mirrorMat = new MeshBasicMaterial({ color: MIRROR_COLOR })
    const bottom = new Mesh(new BoxGeometry(1.5, 0.1, 1.5), mirrorMat)
    bottom.position.set(0, 0.28, 0)
    this.carriage.add(bottom)
    const top = new Mesh(new BoxGeometry(1.5, 0.1, 1.5), mirrorMat)
    top.position.set(0, 0.28 + CLOCK_HEIGHT, 0)
    this.carriage.add(top)

    // Side rails linking the mirrors.
    const railMat = new MeshBasicMaterial({ color: '#64748b' })
    for (const sx of [-0.72, 0.72]) {
      const rail = new Mesh(new BoxGeometry(0.07, CLOCK_HEIGHT, 0.07), railMat)
      rail.position.set(sx, 0.33 + CLOCK_HEIGHT / 2, 0)
      this.carriage.add(rail)
    }

    // Photon.
    this.photon = new Mesh(
      new SphereGeometry(0.11, 16, 12),
      new MeshBasicMaterial({ color: PHOTON_COLOR }),
    )
    this.photon.position.set(0, 0.34, 0)
    this.carriage.add(this.photon)

    // Contracting rod mounted on the carriage (along the motion axis).
    const rodLen = Math.max(0.3, (this.properLength * ROD_SCALE) / gamma)
    this.movingRod = new Mesh(
      new BoxGeometry(rodLen, 0.14, 0.14),
      new MeshBasicMaterial({ color: ROD_MOVING_COLOR }),
    )
    this.movingRod.position.set(0, 0.62, -0.85)
    if (this.showRods) this.carriage.add(this.movingRod)

    this.carriage.position.x = this.clockX
    group.add(this.carriage)

    // --- Static reference rod (proper length L₀) ---
    if (this.showRods) {
      const refLen = Math.max(0.3, this.properLength * ROD_SCALE)
      const ref = new Mesh(
        new BoxGeometry(refLen, 0.14, 0.14),
        new MeshBasicMaterial({ color: ROD_STATIC_COLOR, transparent: true, opacity: 0.75 }),
      )
      ref.position.set(0, 0.62, 2.4)
      group.add(ref)

      // Ground scale marks every 5 m of proper length.
      const markMat = new MeshBasicMaterial({ color: '#334155' })
      const marks = Math.floor(this.properLength / 5)
      for (let i = 1; i <= marks; i++) {
        const mark = new Mesh(new BoxGeometry(0.03, 0.04, 0.5), markMat)
        mark.position.set(-refLen / 2 + (i * 5 * ROD_SCALE), 0.03, 2.4)
        group.add(mark)
      }
    }

    // --- Photon trail (rolling world-line in space) ---
    const trailGeo = new BufferGeometry()
    trailGeo.setAttribute('position', { array: this.trail.slice(), itemSize: 3 })
    // The renderer draws gl.LINES as vertex *pairs*; an index of sequential
    // pairs is required or every other segment of the polyline is skipped.
    const trailIndices: number[] = []
    for (let i = 0; i < TRAIL_MAX - 1; i++) trailIndices.push(i, i + 1)
    trailGeo.setIndex(trailIndices)
    const trailMat = new MeshBasicMaterial({
      color: TRAIL_COLOR,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
    this.trailLine = new Line(trailGeo, trailMat)
    this.trailLine.visible = this.showTrail
    group.add(this.trailLine)

    // --- Floor ---
    const floor = new Mesh(
      new BoxGeometry(16, 0.1, 7),
      new MeshBasicMaterial({ color: '#0f172a' }),
    )
    floor.position.set(0, -0.05, 0.6)
    group.add(floor)

    // Swap in the new content, releasing previous GPU buffers.
    if (this.currentGroup) {
      this.currentGroup.traverse((obj) => {
        const renderable = obj as Mesh & { geometry?: BufferGeometry }
        if (renderable.geometry) renderer.releaseGeometry(renderable.geometry)
      })
      scene.remove(this.currentGroup)
    }
    scene.add(group)
    this.currentGroup = group

    if (!this.cameraReady) {
      camera.position.set(12.5, 8, 15.5)
      camera.near = 0.01
      camera.far = 400
      camera.updateProjectionMatrix()
      controls.target.set(0, 1.7, 0.5)
      controls.minDistance = 5
      controls.maxDistance = 55
      controls.update()
      this.cameraReady = true
    }

    this.drawDiagram()
  }

  /** Draw the 2D spacetime diagram overlay (x vs ct). */
  private drawDiagram(): void {
    const canvas = this.diagramCanvas
    if (!canvas) return

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

    const padL = 34
    const padR = 14
    const padT = 30
    const padB = 30
    const plotW = cssW - padL - padR
    const plotH = cssH - padT - padB
    const cx = padL + plotW / 2
    const cy = padT + plotH / 2
    const scale = Math.min(plotW, plotH) / 2 / X_MAX

    // World → canvas. y flips: +ct points up.
    const wx = (x: number): number => cx + x * scale
    const wy = (ct: number): number => cy - ct * scale

    // Title.
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '600 10px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('SPACETIME  x, ct', 10, 9)

    // Grid.
    ctx.strokeStyle = 'rgba(148,163,184,0.10)'
    ctx.lineWidth = 1
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue
      const off = i * (X_MAX / 2.5) * scale
      ctx.beginPath()
      ctx.moveTo(cx + off, padT)
      ctx.lineTo(cx + off, padT + plotH)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(padL, cy + off)
      ctx.lineTo(padL + plotW, cy + off)
      ctx.stroke()
    }

    // Axes.
    ctx.strokeStyle = 'rgba(148,163,184,0.5)'
    ctx.beginPath()
    ctx.moveTo(padL, cy)
    ctx.lineTo(padL + plotW, cy)
    ctx.moveTo(cx, padT)
    ctx.lineTo(cx, padT + plotH)
    ctx.stroke()

    // Light cone (45° in these units).
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(wx(-X_MAX), wy(-X_MAX))
    ctx.lineTo(wx(X_MAX), wy(X_MAX))
    ctx.moveTo(wx(-X_MAX), wy(X_MAX))
    ctx.lineTo(wx(X_MAX), wy(-X_MAX))
    ctx.stroke()
    ctx.setLineDash([])

    // Stationary observer worldline (vertical through the event).
    ctx.strokeStyle = '#e4e4e7'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, padT)
    ctx.lineTo(cx, padT + plotH)
    ctx.stroke()

    // Moving observer worldline: x = β·ct.
    const beta = this.beta
    ctx.strokeStyle = '#a78bfa'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(wx(-beta * X_MAX), wy(-X_MAX))
    ctx.lineTo(wx(beta * X_MAX), wy(X_MAX))
    ctx.stroke()

    // Primed axes: ct′ along the worldline, x′ with ct = β·x.
    ctx.strokeStyle = 'rgba(167,139,250,0.55)'
    ctx.lineWidth = 1.2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(wx(-X_MAX), wy(-beta * X_MAX))
    ctx.lineTo(wx(X_MAX), wy(beta * X_MAX))
    ctx.stroke()
    ctx.setLineDash([])

    // Origin event.
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
    ctx.fill()

    // Axis labels.
    ctx.fillStyle = '#71717a'
    ctx.font = '9px ui-monospace, monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText('ct (10⁸ m)', padL + plotW, padT + plotH + 4)
    ctx.textAlign = 'left'
    ctx.fillText('x', padL + 2, cy + 4)

    // β label on the moving worldline.
    ctx.fillStyle = '#a78bfa'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    const labelX = wx(beta * X_MAX * 0.72)
    const labelY = wy(X_MAX * 0.72)
    if (labelX < padL + plotW - 26 && labelY > padT + 10) {
      ctx.fillText(`β=${beta.toFixed(2)}`, labelX + 4, labelY)
    }

    // Legend.
    ctx.font = '8.5px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const legend: [string, string][] = [
      ['#22d3ee', 'light'],
      ['#e4e4e7', 'rest'],
      ['#a78bfa', "moving + ct′"],
    ]
    let lx = 10
    const ly = cssH - 9
    for (const [color, label] of legend) {
      ctx.strokeStyle = color
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
    if (this.diagramCanvas && this.diagramCanvas.parentElement === this) {
      this.removeChild(this.diagramCanvas)
      this.diagramCanvas = null
    }
    this.scene = null
    this.camera = null
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-relativity')) {
  customElements.define('elementa-relativity', ElementaRelativityElement)
}
