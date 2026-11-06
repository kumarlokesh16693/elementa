/**
 * ELEMENTA — 3D Electromagnetic Field Visualizer
 * Custom Web Component rendering E/B fields, field lines, EM waves and
 * Lorentz-force particle trajectories using @nexus/3d WebGL.
 */

import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Line,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from '@nexus/3d'
import {
  C,
  add,
  cross,
  dbI,
  eFieldPoint,
  emWave,
  mag,
  mul,
  norm,
  rk4Step,
  sub,
  type FieldConfig,
  type ParticleState,
  type Vec3,
} from '@/lib/em'
import { createGlowPost, type GlowPost } from '@/lib/postfx'

const ARROW_HEAD_LEN = 0.14
const ARROW_HEAD_WID = 0.07

const E_COLOR = '#22d3ee' // cyan — electric field
const B_COLOR = '#f472b6' // pink — magnetic field
const E_WAVE_COLOR = '#34d399' // green — EM wave E
const B_WAVE_COLOR = '#fbbf24' // amber — EM wave B
const PARTICLE_COLOR = '#ef4444' // red — charged particle
const TRAJECTORY_COLOR = '#94a3b8' // slate — trajectory
const AXIS_COLOR = '#475569' // slate-600

const LOBE_VERT = `
precision highp float;
attribute vec3 aPosition;
attribute vec3 aColor;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
varying vec3 vColor;
varying vec3 vViewDir;
void main(){
  vec4 wp = uModelMatrix * vec4(aPosition, 1.0);
  vViewDir = normalize(uCameraPosition - wp.xyz);
  vColor = aColor;
  gl_Position = uProjectionMatrix * uViewMatrix * wp;
}
`

const LOBE_FRAG = `
precision mediump float;
varying vec3 vColor;
varying vec3 vViewDir;
void main(){
  float rim = pow(1.0 - max(dot(normalize(vColor), vViewDir), 0.0), 2.0);
  vec3 col = vColor * (0.5 + 0.5 * 0.6) + vColor * rim * 0.35;
  gl_FragColor = vec4(col, 0.95);
}
`

/** Build an arrow geometry: shaft + head, from `from` to `to`. */
function arrowGeometry(from: Vec3, to: Vec3, headLen: number, headWid: number): BufferGeometry {
  const dir = norm(sub(to, from))
  const d = mag(sub(to, from))
  const headStart = add(from, mul(dir, Math.max(0, d - headLen)))

  // Perpendicular basis for head
  const ref = Math.abs(dir.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 }
  const side = norm(cross(dir, ref))
  const up = norm(cross(side, dir))

  const positions: number[] = []
  const colors: number[] = []

  const push = (p: Vec3, c: Vec3) => {
    positions.push(p.x, p.y, p.z)
    colors.push(c.x, c.y, c.z)
  }

  const c = { x: 0.5, y: 0.5, z: 0.5 }
  // Shaft
  push(from, c)
  push(headStart, c)

  // Head — three edges around the cone
  const tip = to
  const hW = headWid
  const p1 = add(headStart, mul(side, hW))
  const p2 = add(headStart, mul(up, hW))
  const p3 = add(headStart, mul(side, -hW))
  const p4 = add(headStart, mul(up, -hW))

  push(headStart, c)
  push(tip, c)
  push(p1, c)
  push(headStart, c)
  push(tip, c)
  push(p2, c)
  push(headStart, c)
  push(tip, c)
  push(p3, c)
  push(headStart, c)
  push(tip, c)
  push(p4, c)

  const geo = new BufferGeometry()
  geo.setAttribute('position', { array: new Float32Array(positions), itemSize: 3 })
  geo.setAttribute('color', { array: new Float32Array(colors), itemSize: 3 })
  return geo
}

export class ElementaEMFieldElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private raf = 0
  private ro: ResizeObserver | null = null

  // Config
  public config: FieldConfig = {
    preset: 'point-charge',
    charge: 1.0,
    current: 1.0,
    loops: 1,
    radius: 1.0,
    frequency: 5.0,
    e0: 1.0,
    particleQ: 1.0,
    particleM: 1.0,
    particleV0: { x: 0, y: 0, z: 0 },
    time: 0,
  }

  // Render scales (visualization scaling — not physical SI)
  private scale = 1.0 // world units per "field unit"
  private arrowScale = 0.5
  private gridN = 8 // samples per axis
  private gridExtent = 4.0
  private glow: GlowPost | null = null
  private fx = false

  static get observedAttributes(): string[] {
    return ['data-preset', 'data-charge', 'data-current', 'data-loops', 'data-radius',
      'data-frequency', 'data-e0', 'data-particle-q', 'data-particle-m',
      'data-particle-vx', 'data-particle-vy', 'data-particle-vz', 'data-time', 'data-scale', 'data-fx']
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

  /** Build or release the glow post chain for the field scene. */
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
      const v = Number(this.getAttribute(`data-${k}`))
      return Number.isFinite(v) ? v : d
    }
    const s = (k: string, d: string): string => {
      const v = this.getAttribute(`data-${k}`)
      return v != null ? v : d
    }
    this.config = {
      preset: s('preset', this.config.preset) as FieldConfig['preset'],
      charge: p('charge', this.config.charge),
      current: p('current', this.config.current),
      loops: p('loops', this.config.loops),
      radius: p('radius', this.config.radius),
      frequency: p('frequency', this.config.frequency),
      e0: p('e0', this.config.e0),
      particleQ: p('particle-q', this.config.particleQ),
      particleM: p('particle-m', this.config.particleM),
      particleV0: {
        x: p('particle-vx', this.config.particleV0.x),
        y: p('particle-vy', this.config.particleV0.y),
        z: p('particle-vz', this.config.particleV0.z),
      },
      time: p('time', this.config.time),
    }
    const scale = p('scale', this.scale)
    this.scale = scale > 0 ? scale : 1
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
    camera.position.set(6, 4, 7)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08

    scene.add(new AmbientLight(0xffffff, 0.5))
    const key = new DirectionalLight(0xffffff, 0.9)
    key.position.set(5, 8, 5)
    scene.add(key)
    const fill = new DirectionalLight(0x88aaff, 0.35)
    fill.position.set(-5, -3, -6)
    scene.add(fill)

    this.scene = scene
    this.camera = camera
    this.controls = controls

    const resize = () => {
      const w = this.clientWidth || 1
      const h = this.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
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

    // Clear previous content (keep lights)
    const lights = scene.children.filter((c) =>
      c instanceof AmbientLight || c instanceof DirectionalLight,
    )
    scene.children.length = 0
    lights.forEach((l) => scene.add(l))

    const group = new Object3D()
    group.name = 'em-content'

    const cfg = this.config
    const s = this.scale

    // Coordinate axes
    this.addAxes(group, 3 * s)

    if (cfg.preset === 'point-charge' || cfg.preset === 'dipole') {
      this.buildElectrostatics(group, cfg, s)
    } else if (cfg.preset === 'solenoid') {
      this.buildMagnetostatics(group, cfg, s)
    } else if (cfg.preset === 'em-wave') {
      this.buildEMWave(group, cfg, s)
    } else if (cfg.preset === 'lorentz') {
      this.buildLorentz(group, cfg, s)
    }

    scene.add(group)

    // Camera framing
    const extent = this.gridExtent * s
    camera.position.set(extent * 0.7, extent * 0.5, extent * 0.9)
    camera.near = 0.01
    camera.far = extent * 40
    camera.updateProjectionMatrix()
    controls.target.set(0, 0, 0)
    controls.minDistance = extent * 0.5
    controls.maxDistance = extent * 20
    controls.update()
  }

  /* ---------------- coordinate axes ---------------- */

  private addAxes(group: Object3D, len: number): void {
    const mat = new MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.5 })
    for (const axis of [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)]) {
      const g = new BufferGeometry()
      g.setAttribute('position', {
        array: new Float32Array([0, 0, 0, axis.x * len, axis.y * len, axis.z * len]),
        itemSize: 3,
      })
      group.add(new Line(g, mat))
    }
  }

  /* ---------------- arrow helper ---------------- */

  private addArrow(group: Object3D, from: Vec3, to: Vec3, colorHex: string, headLen: number, headWid: number): void {
    const geo = arrowGeometry(from, to, headLen, headWid)
    const colors = geo.getAttribute('color')!.array as Float32Array
    const c = new Color(colorHex)
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = c.r
      colors[i + 1] = c.g
      colors[i + 2] = c.b
    }
    const mat = new ShaderMaterial({ uniforms: {}, vertexShader: LOBE_VERT, fragmentShader: LOBE_FRAG })
    group.add(new LineSegments(geo, mat))
  }

  /* ---------------- electrostatics ---------------- */

  private buildElectrostatics(group: Object3D, cfg: FieldConfig, s: number): void {
    const q = cfg.charge
    const isDipole = cfg.preset === 'dipole'

    const eField = (r: Vec3): Vec3 => {
      let E = { x: 0, y: 0, z: 0 }
      if (isDipole) {
        const a = 0.6 * s
        const p1 = { x: -a, y: 0, z: 0 }
        const p2 = { x: a, y: 0, z: 0 }
        E = add(E, eFieldPoint(q, p1, r))
        E = add(E, eFieldPoint(-q, p2, r))
      } else {
        E = add(E, eFieldPoint(q, { x: 0, y: 0, z: 0 }, r))
      }
      return E
    }

    // Draw charge(s)
    const chargeMat = new MeshBasicMaterial({ color: q >= 0 ? '#fbbf24' : '#38bdf8' })
    const positions: number[] = []
    const chargeGeom = new SphereGeometry(0.12 * s, 12, 12)
    if (isDipole) {
      for (const x of [-0.6 * s, 0.6 * s]) {
        const g = new BufferGeometry()
        g.setAttribute('position', {
          array: new Float32Array([
            ...chargeGeom.getAttribute('position')!.array as Float32Array,
          ].flatMap((v, i, arr) => {
            // offset each vertex — simpler: just draw a sphere at origin then position mesh
            return v
          })),
          itemSize: 3,
        })
        // We'll just add two meshes instead
      }
    }
    // Simpler: draw charge meshes directly
    if (isDipole) {
      for (const x of [-0.6 * s, 0.6 * s]) {
        const m = new Mesh(new SphereGeometry(0.12 * s, 12, 12), chargeMat)
        m.position.set(x, 0, 0)
        group.add(m)
      }
      // +/- labels via small colored text not available; use color only
    } else {
      const m = new Mesh(new SphereGeometry(0.15 * s, 14, 14), chargeMat)
      m.position.set(0, 0, 0)
      group.add(m)
    }

    // Field vectors on a grid
    const N = this.gridN
    const ext = this.gridExtent * s
    const step = (2 * ext) / (N - 1)
    const arrowBase = 0.18 * s
    const arrowMax = 0.45 * s

    // Find max field magnitude for normalization
    let maxE = 1e-12
    const samples: Array<{ r: Vec3; E: Vec3 }> = []
    for (let i = 0; i < N; i++) {
      const x = -ext + i * step
      for (let j = 0; j < N; j++) {
        const y = -ext + j * step
        for (let k = 0; k < N; k++) {
          const z = -ext + k * step
          const r = { x, y, z }
          const E = eField(r)
          const mE = mag(E)
          if (mE > maxE) maxE = mE
          samples.push({ r, E })
        }
      }
    }

    for (const sm of samples) {
      const len = Math.min(arrowMax, arrowBase + (mag(sm.E) / maxE) * (arrowMax - arrowBase))
      const dir = norm(sm.E)
      const to = add(sm.r, mul(dir, len))
      // Skip arrows too close to charge (singularity)
      if (mag(sub(sm.r, { x: 0, y: 0, z: 0 })) < 0.35 * s) continue
      this.addArrow(group, sm.r, to, E_COLOR, 0.1 * s, 0.05 * s)
    }

    // Field lines — trace from seed points around charge
    if (!isDipole) {
      this.addFieldLines(group, eField, s, q)
    } else {
      this.addFieldLines(group, eField, s, q)
    }
  }

  private addFieldLines(group: Object3D, eField: (r: Vec3) => Vec3, s: number, q: number): void {
    const ext = this.gridExtent * s
    const dt = 0.15 * s
    const maxSteps = 60
    const stopDist = 0.25 * s

    // Seed points on a sphere around origin
    const seeds: Vec3[] = []
    const rings = 3
    const perRing = 8
    for (let ring = 1; ring <= rings; ring++) {
      const r = (ring / rings) * (ext * 0.55)
      for (let i = 0; i < perRing; i++) {
        const theta = (Math.PI * i) / perRing
        const phi = (2 * Math.PI * i) / perRing
        seeds.push({
          x: r * Math.sin(theta) * Math.cos(phi),
          y: r * Math.sin(theta) * Math.sin(phi),
          z: r * Math.cos(theta),
        })
      }
    }

    for (const seed of seeds) {
      const pts: number[] = []
      let r = { ...seed }
      let dir = norm(eField(r))
      if (q < 0) dir = mul(dir, -1) // field lines go into negative charge

      for (let step = 0; step < maxSteps; step++) {
        pts.push(r.x, r.y, r.z)
        const E = eField(r)
        let n = norm(E)
        if (q < 0) n = mul(n, -1)
        const next = add(r, mul(n, dt))
        if (mag(next) < stopDist || mag(next) > ext * 1.1) break
        r = next
      }
      if (pts.length >= 6) {
        const geo = new BufferGeometry()
        geo.setAttribute('position', { array: new Float32Array(pts), itemSize: 3 })
        const mat = new MeshBasicMaterial({ color: E_COLOR, transparent: true, opacity: 0.35 })
        group.add(new Line(geo, mat))
      }
    }
  }

  /* ---------------- magnetostatics ---------------- */

  private buildMagnetostatics(group: Object3D, cfg: FieldConfig, s: number): void {
    const I = cfg.current
    const R = cfg.radius * s
    const nLoops = Math.max(1, Math.round(cfg.loops))
    const loopSep = (R * 0.9) / Math.max(1, nLoops - 1)

    // B-field via Biot-Savart summation over loops
    const bField = (r: Vec3): Vec3 => {
      let B = { x: 0, y: 0, z: 0 }
      const turns = 24
      for (let li = 0; li < nLoops; li++) {
        const z0 = (li - (nLoops - 1) / 2) * loopSep
        for (let ti = 0; ti < turns; ti++) {
          const t1 = (2 * Math.PI * ti) / turns
          const t2 = (2 * Math.PI * (ti + 1)) / turns
          const p1 = { x: R * Math.cos(t1), y: R * Math.sin(t1), z: z0 }
          const p2 = { x: R * Math.cos(t2), y: R * Math.sin(t2), z: z0 }
          const dl = sub(p2, p1)
          const mid = add(p1, mul(dl, 0.5))
          B = add(B, dbI(I, dl, mid, r))
        }
      }
      return B
    }

    // Draw current loops
    const loopMat = new MeshBasicMaterial({ color: B_COLOR })
    for (let li = 0; li < nLoops; li++) {
      const z0 = (li - (nLoops - 1) / 2) * loopSep
      const pts: number[] = []
      const turns = 48
      for (let ti = 0; ti <= turns; ti++) {
        const t = (2 * Math.PI * ti) / turns
        pts.push(R * Math.cos(t), R * Math.sin(t), z0)
      }
      const geo = new BufferGeometry()
      geo.setAttribute('position', { array: new Float32Array(pts), itemSize: 3 })
      group.add(new Line(geo, loopMat))
    }

    // Draw B field vectors on a grid in the yz-plane (x=0) and xz-plane (y=0)
    const N = this.gridN
    const ext = this.gridExtent * s
    const step = (2 * ext) / (N - 1)
    const arrowBase = 0.12 * s
    const arrowMax = 0.35 * s

    let maxB = 1e-12
    const samples: Array<{ r: Vec3; B: Vec3 }> = []
    const planes = [
      { nx: 1, ny: 0, nz: 0 }, // yz plane (x varies is fixed 0) -> we sample y,z
      { nx: 0, ny: 1, nz: 0 }, // xz plane
    ]
    for (const pl of planes) {
      for (let i = 0; i < N; i++) {
        const a = -ext + i * step
        for (let j = 0; j < N; j++) {
          const b = -ext + j * step
          const r: Vec3 = { x: 0, y: 0, z: 0 }
          // plane 1: x=0, y=a, z=b
          if (pl.nx === 1) { r.y = a; r.z = b }
          else { r.x = a; r.z = b }
          const B = bField(r)
          const mB = mag(B)
          if (mB > maxB) maxB = mB
          samples.push({ r, B })
        }
      }
    }

    for (const sm of samples) {
      const len = Math.min(arrowMax, arrowBase + (mag(sm.B) / maxB) * (arrowMax - arrowBase))
      if (len < 0.02 * s) continue
      const dir = norm(sm.B)
      const to = add(sm.r, mul(dir, len))
      this.addArrow(group, sm.r, to, B_COLOR, 0.08 * s, 0.04 * s)
    }

    // Field lines around solenoid axis
    this.addFieldLines(group, bField, s, 1)
  }

  /* ---------------- EM wave ---------------- */

  private buildEMWave(group: Object3D, cfg: FieldConfig, s: number): void {
    const f = cfg.frequency
    const E0 = cfg.e0 * s
    // Physical wavelength is c/f — usually astronomical for lab frequencies.
    // Use a display-scaled wavelength so the wave actually oscillates across
    // the viewport, while keeping frequency as the animation driver.
    const lamPhys = C / f
    const displayLam = Math.min(lamPhys, 6 * s) // cap for visualization
    const k = (2 * Math.PI) / displayLam
    const omega = k * C // angular frequency consistent with display k
    const t = cfg.time
    const B0 = E0 / C

    // Draw E and B field vectors at points along z-axis
    const N = 24
    const zExtent = 3 * displayLam
    const step = (2 * zExtent) / (N - 1)

    const Epts: number[] = []
    const Bpts: number[] = []
    const Ec: number[] = []
    const Bc: number[] = []

    const eC = new Color(E_WAVE_COLOR)
    const bC = new Color(B_WAVE_COLOR)

    // Scale vectors for display
    const disp = 0.55 * s

    for (let i = 0; i < N; i++) {
      const z = -zExtent + i * step
      const phase = k * z - omega * t
      const sPhase = Math.sin(phase)
      const Ex = E0 * sPhase
      const By = B0 * sPhase

      // E field along x at this z point
      const eStart = { x: z - Ex * 0.5 * disp, y: 0, z: 0 }
      const eEnd = { x: z + Ex * 0.5 * disp, y: 0, z: 0 }
      // B field along y
      const bStart = { x: z, y: -By * 0.5 * disp, z: 0 }
      const bEnd = { x: z, y: By * 0.5 * disp, z: 0 }

      Epts.push(eStart.x, eStart.y, eStart.z, eEnd.x, eEnd.y, eEnd.z)
      Ec.push(eC.r, eC.g, eC.b, eC.r, eC.g, eC.b)

      Bpts.push(bStart.x, bStart.y, bStart.z, bEnd.x, bEnd.y, bEnd.z)
      Bc.push(bC.r, bC.g, bC.b, bC.r, bC.g, bC.b)
    }

    const eGeo = new BufferGeometry()
    eGeo.setAttribute('position', { array: new Float32Array(Epts), itemSize: 3 })
    eGeo.setAttribute('color', { array: new Float32Array(Ec), itemSize: 3 })
    group.add(new LineSegments(eGeo, new ShaderMaterial({ uniforms: {}, vertexShader: LOBE_VERT, fragmentShader: LOBE_FRAG })))

    const bGeo = new BufferGeometry()
    bGeo.setAttribute('position', { array: new Float32Array(Bpts), itemSize: 3 })
    bGeo.setAttribute('color', { array: new Float32Array(Bc), itemSize: 3 })
    group.add(new LineSegments(bGeo, new ShaderMaterial({ uniforms: {}, vertexShader: LOBE_VERT, fragmentShader: LOBE_FRAG })))

    // Draw the sinusoidal envelopes (E and B wave shapes)
    const envM = 64
    const envE: number[] = []
    const envB: number[] = []
    for (let i = 0; i <= envM; i++) {
      const z = -zExtent + (2 * zExtent * i) / envM
      const phase = k * z - omega * t
      const sPhase = Math.sin(phase)
      envE.push(z, E0 * sPhase * disp * 0.5, 0)   // E along x → drawn as y-offset for visibility
      envB.push(z, B0 * sPhase * disp * 0.5, 0)   // B along y
    }
    const envEGeo = new BufferGeometry()
    envEGeo.setAttribute('position', { array: new Float32Array(envE), itemSize: 3 })
    group.add(new Line(envEGeo, new MeshBasicMaterial({ color: E_WAVE_COLOR })))
    const envBGeo = new BufferGeometry()
    envBGeo.setAttribute('position', { array: new Float32Array(envB), itemSize: 3 })
    group.add(new Line(envBGeo, new MeshBasicMaterial({ color: B_WAVE_COLOR })))

    // Propagation direction arrow (along z)
    const zArrow = arrowGeometry(
      { x: -zExtent, y: 0, z: 0 },
      { x: zExtent, y: 0, z: 0 },
      0.3 * s, 0.15 * s,
    )
    const zColors = zArrow.getAttribute('color')!.array as Float32Array
    for (let i = 0; i < zColors.length; i += 3) {
      zColors[i] = 0.8
      zColors[i + 1] = 0.8
      zColors[i + 2] = 0.8
    }
    group.add(new LineSegments(zArrow, new ShaderMaterial({ uniforms: {}, vertexShader: LOBE_VERT, fragmentShader: LOBE_FRAG })))
  }

  /* ---------------- Lorentz force ---------------- */

  private buildLorentz(group: Object3D, cfg: FieldConfig, s: number): void {
    const q = cfg.particleQ
    const m = Math.max(cfg.particleM, 1e-6)
    const v0 = cfg.particleV0

    // Uniform fields: E along y, B along z
    const E = { x: 0, y: cfg.e0 * s, z: 0 }
    const B = { x: 0, y: 0, z: 1.0 }

    const eField = (r: Vec3): Vec3 => E
    const bField = (r: Vec3): Vec3 => B

    // Draw uniform field as a few sample arrows
    const N = 5
    const ext = 2.5 * s
    for (let i = 0; i < N; i++) {
      const x = -ext + i * (2 * ext / (N - 1))
      for (let j = 0; j < N; j++) {
        const y = -ext + j * (2 * ext / (N - 1))
        const z = 0
        const r = { x, y, z }
        this.addArrow(group, r, add(r, mul(E, 0.12 * s)), E_COLOR, 0.08 * s, 0.04 * s)
        this.addArrow(group, r, add(r, mul(B, 0.12 * s)), B_COLOR, 0.08 * s, 0.04 * s)
      }
    }

    // Integrate trajectory
    const dt = 0.02
    const maxSteps = 400
    const state: ParticleState = { r: { x: -2 * s, y: 0, z: 0 }, v: { ...v0 } }
    // Scale v0 for visualization
    state.v = mul(state.v, 2 * s)

    const traj: number[] = [state.r.x, state.r.y, state.r.z]
    for (let i = 0; i < maxSteps; i++) {
      const next = rk4Step(state, dt, q, m, eField, bField)
      traj.push(next.r.x, next.r.y, next.r.z)
      if (mag(next.r) > 8 * s) break
      state.r = next.r
      state.v = next.v
    }

    const trajGeo = new BufferGeometry()
    trajGeo.setAttribute('position', { array: new Float32Array(traj), itemSize: 3 })
    const trajMat = new MeshBasicMaterial({ color: TRAJECTORY_COLOR, transparent: true, opacity: 0.5 })
    group.add(new Line(trajGeo, trajMat))

    // Draw particle at current position (end of trajectory)
    const pMat = new MeshBasicMaterial({ color: PARTICLE_COLOR })
    const particle = new Mesh(new SphereGeometry(0.1 * s, 10, 10), pMat)
    particle.position.set(state.r.x, state.r.y, state.r.z)
    group.add(particle)

    // Velocity arrow
    const vArrow = arrowGeometry(
      state.r,
      add(state.r, mul(norm(state.v), 0.6 * s)),
      0.1 * s, 0.05 * s,
    )
    const vColors = vArrow.getAttribute('color')!.array as Float32Array
    for (let i = 0; i < vColors.length; i += 3) {
      vColors[i] = 1
      vColors[i + 1] = 1
      vColors[i + 2] = 1
    }
    group.add(new LineSegments(vArrow, new ShaderMaterial({ uniforms: {}, vertexShader: LOBE_VERT, fragmentShader: LOBE_FRAG })))
  }

  /* ---------------- lifecycle ---------------- */

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
      this.renderer.dispose()
      if (this.renderer.domElement.parentElement === this) {
        this.removeChild(this.renderer.domElement)
      }
      this.renderer = null
    }
    this.scene = null
    this.camera = null
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-em-field')) {
  customElements.define('elementa-em-field', ElementaEMFieldElement)
}
