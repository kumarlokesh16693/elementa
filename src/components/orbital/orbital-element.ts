import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Line,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from '@nexus/3d'
import {
  gradedAxis,
  orbitalExtent,
  psiAt,
  radialR,
  realYlm,
  type RealOrbital,
} from '@/lib/orbital'
import { createGlowPost, type GlowPost } from '@/lib/postfx'
import { surfaceNets } from './surfaceNets'

const POS_HEX = '#fbbf24'
const NEG_HEX = '#2dd4bf'

const LOBE_VERT = `
precision highp float;
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vViewDir;
void main(){
  vec4 wp = uModelMatrix * vec4(aPosition, 1.0);
  vNormal = normalize(mat3(uModelMatrix) * aNormal);
  vViewDir = normalize(uCameraPosition - wp.xyz);
  vColor = aColor;
  gl_Position = uProjectionMatrix * uViewMatrix * wp;
}
`

const LOBE_FRAG = `
precision mediump float;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vViewDir;
void main(){
  float ndv = dot(vNormal, vViewDir);
  float lambert = smoothstep(-0.7, 1.0, ndv);
  float rim = pow(1.0 - max(ndv, 0.0), 2.2);
  vec3 col = vColor * (0.32 + 0.68 * lambert) + vColor * rim * 0.35;
  gl_FragColor = vec4(col, 1.0);
}
`

export class ElementaOrbitalViewElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private currentGroup: Object3D | null = null
  private ro: ResizeObserver | null = null
  private raf = 0
  private computeTimer: any = null
  private busyEl: HTMLDivElement | null = null

  // Orbital parameters
  public orbital: RealOrbital = { n: 1, l: 0, m: 0, sin: false }
  public zEff = 1.0
  public mode: 'surface' | 'cloud' = 'surface'
  public iso = 0.176
  public gridN = 84
  public autoRotate = true
  public speed = 1
  public fx = false
  private glow: GlowPost | null = null

  static get observedAttributes(): string[] {
    return ['data-n', 'data-l', 'data-m', 'data-sin', 'data-zeff', 'data-mode', 'data-iso', 'data-rotate', 'data-speed', 'data-fx']
  }

  connectedCallback(): void {
    if (this.renderer) return
    this.initScene()
    this.rebuild()
    this.syncGlow()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    this.readAttributes()
    this.syncGlow()
    if (this.isConnected && this.renderer) {
      this.scheduleRebuild()
    }
  }

  /** Build or release the glow post chain for the orbital view. */
  private syncGlow(): void {
    const renderer = this.renderer
    const scene = this.scene
    const camera = this.camera
    if (this.fx) {
      if ((!this.glow || !this.glow.active) && renderer && scene && camera) {
        // Slightly higher threshold than the wave lab: orbitals have large
        // bright surfaces, and we only want the crest lines to bloom.
        this.glow = createGlowPost(renderer, scene, camera, {
          bloomThreshold: 0.42,
          bloomIntensity: 0.5,
        })
      }
    } else if (this.glow) {
      this.glow.dispose()
      this.glow = null
    }
  }

  private readAttributes(): void {
    const n = Number(this.getAttribute('data-n') ?? this.orbital.n)
    const l = Number(this.getAttribute('data-l') ?? this.orbital.l)
    const m = Number(this.getAttribute('data-m') ?? this.orbital.m)
    const sinAttr = this.getAttribute('data-sin')
    const sin = sinAttr != null ? sinAttr === '1' || sinAttr === 'true' : this.orbital.sin
    this.orbital = { n, l, m, sin }

    if (this.hasAttribute('data-zeff')) {
      this.zEff = Number(this.getAttribute('data-zeff'))
    }
    if (this.hasAttribute('data-mode')) {
      this.mode = (this.getAttribute('data-mode') as 'surface' | 'cloud') ?? 'surface'
    }
    if (this.hasAttribute('data-iso')) {
      this.iso = Number(this.getAttribute('data-iso'))
    }
    if (this.hasAttribute('data-rotate')) {
      this.autoRotate = this.getAttribute('data-rotate') === 'true'
    }
    if (this.hasAttribute('data-speed')) {
      this.speed = Number(this.getAttribute('data-speed'))
    }
    if (this.hasAttribute('data-fx')) {
      const t = (this.getAttribute('data-fx') ?? '').trim().toLowerCase()
      this.fx = t !== 'false' && t !== '0' && t !== 'off'
    }
  }

  private initScene(): void {
    this.readAttributes()
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
    const camera = new PerspectiveCamera(42, 1, 0.01, 2000)
    camera.position.set(9, 5.5, 10.5)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08

    scene.add(new AmbientLight(0xffffff, 0.6))
    const key = new DirectionalLight(0xffffff, 1.05)
    key.position.set(6, 9, 7)
    scene.add(key)
    const rim = new DirectionalLight(0x88aaff, 0.3)
    rim.position.set(-7, -5, -6)
    scene.add(rim)

    this.scene = scene
    this.camera = camera
    this.controls = controls

    this.busyEl = document.createElement('div')
    this.busyEl.className = 'pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-zinc-400 backdrop-blur-sm'
    this.busyEl.textContent = 'computing ψ…'
    this.busyEl.style.display = 'none'
    this.appendChild(this.busyEl)

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
      if (this.autoRotate && this.controls && this.camera) {
        const t = this.controls.target
        const dx = this.camera.position.x - t.x
        const dz = this.camera.position.z - t.z
        const radius = Math.max(Math.hypot(dx, dz, this.camera.position.y - t.y), 1e-4)
        const len = Math.hypot(dx, dz) || 1
        const theta = 0.55 * Math.max(0.05, this.speed) * 0.016
        const cos = Math.cos(theta)
        const sin = Math.sin(theta)
        this.camera.position.x = t.x + ((dx * cos - dz * sin) / len) * radius
        this.camera.position.z = t.z + ((dx * sin + dz * cos) / len) * radius
      }
      if (this.controls) this.controls.update()
      if (this.glow?.active) this.glow.render()
      else renderer.render(scene, camera)
    }
    tick()
  }

  public scheduleRebuild(): void {
    if (this.busyEl) this.busyEl.style.display = 'block'
    if (this.computeTimer) clearTimeout(this.computeTimer)
    this.computeTimer = setTimeout(() => {
      this.rebuild()
    }, 20)
  }

  private rebuild(): void {
    const scene = this.scene
    const camera = this.camera
    const controls = this.controls
    const renderer = this.renderer
    if (!scene || !camera || !controls || !renderer) return

    const { n, l, m, sin } = this.orbital
    const zEff = this.zEff
    const extent = orbitalExtent(n, l, zEff)
    const group = new Object3D()

    const posColor = new Color(POS_HEX)
    const negColor = new Color(NEG_HEX)

    // Axes
    const axisMat = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })
    for (const axis of [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)]) {
      const e = extent * 0.92
      const g = new BufferGeometry()
      g.setAttribute('position', {
        array: new Float32Array([
          -axis.x * e, -axis.y * e, -axis.z * e,
          axis.x * e, axis.y * e, axis.z * e,
        ]),
        itemSize: 3,
      })
      group.add(new Line(g, axisMat))
    }

    if (this.mode === 'surface') {
      const N = this.gridN
      const ax = gradedAxis(N, extent)
      const field = new Float32Array(N * N * N)
      let maxAbs = 1e-12
      let idx = 0
      for (let k = 0; k < N; k++) {
        const Zd = ax[k]
        for (let j = 0; j < N; j++) {
          const Yd = ax[j]
          for (let i = 0; i < N; i++) {
            const val = psiAt(n, l, m, sin, zEff, ax[i], Zd, Yd)
            field[idx++] = Math.abs(val)
            const a = Math.abs(val)
            if (a > maxAbs) maxAbs = a
          }
        }
      }

      const res = surfaceNets(field, N, N, N, ax, ax, ax, this.iso * maxAbs)
      const colors = new Float32Array(res.vertexCount * 3)
      for (let vI = 0; vI < res.vertexCount; vI++) {
        const px = res.positions[vI * 3]
        const py = res.positions[vI * 3 + 1]
        const pz = res.positions[vI * 3 + 2]
        const psi = psiAt(n, l, m, sin, zEff, px, pz, py)
        const base = psi >= 0 ? posColor : negColor
        colors[vI * 3] = base.r
        colors[vI * 3 + 1] = base.g
        colors[vI * 3 + 2] = base.b
      }

      const geo = new BufferGeometry()
      geo.setAttribute('position', { array: res.positions, itemSize: 3 })
      geo.setAttribute('color', { array: colors, itemSize: 3 })
      geo.setIndex({ array: res.indices as unknown as Uint32Array, itemSize: 1 })
      geo.computeVertexNormals()

      const lobe = new Mesh(
        geo,
        new ShaderMaterial({
          uniforms: {},
          vertexShader: LOBE_VERT,
          fragmentShader: LOBE_FRAG,
        }),
      )
      group.add(lobe)

      const dist = extent * 2.6 + 0.4
      camera.position.set(dist * 0.62, dist * 0.38, dist * 0.72)
      camera.near = Math.max(0.005, extent * 0.01)
      camera.far = extent * 30
      camera.updateProjectionMatrix()
    } else {
      // Cloud mode
      const R_MAX = extent * 1.03
      const BINS = 4096
      const dr = R_MAX / BINS
      const cdf = new Float64Array(BINS)
      let acc = 0
      for (let i = 0; i < BINS; i++) {
        const r = (i + 0.5) * dr
        const rho = (2 * zEff * r) / n
        const Rv = Math.exp(-rho / 2) * Math.pow(rho, l)
        acc += r * r * Rv * Rv * dr
        cdf[i] = acc
      }
      const total = acc
      const sampleR = () => {
        const u = Math.random() * total
        let lo = 0
        let hi = BINS - 1
        while (lo < hi) {
          const mid = (lo + hi) >> 1
          if (cdf[mid] < u) lo = mid + 1
          else hi = mid
        }
        return (lo + 0.5) * dr
      }

      let maxY2 = 1e-12
      for (let ti = 0; ti <= 180; ti++) {
        const theta = (ti / 180) * Math.PI
        for (let p2 = 0; p2 <= 360; p2 += 2) {
          const phi = (p2 / 360) * Math.PI
          const y = realYlm(l, m, sin, theta, phi)
          const y2 = y * y
          if (y2 > maxY2) maxY2 = y2
        }
      }

      const target = this.gridN >= 96 ? 34000 : 22000
      const positions = new Float32Array(target * 3)
      const colors = new Float32Array(target * 3)
      let count = 0
      let psiMaxSeen = 1e-12
      let guard = 0

      while (count < target && guard < target * 60) {
        guard++
        const r = sampleR()
        const uz = Math.random() * 2 - 1
        const phi = Math.random() * Math.PI * 2
        const st = Math.sqrt(1 - uz * uz)
        const y = realYlm(l, m, sin, Math.acos(uz), phi)
        if (Math.random() * maxY2 > y * y) continue
        const psi = radialR(n, l, r, zEff) * y
        const aPsi = Math.abs(psi)
        if (aPsi > psiMaxSeen) psiMaxSeen = aPsi

        const i3 = count * 3
        positions[i3] = st * Math.cos(phi) * r
        positions[i3 + 1] = uz * r
        positions[i3 + 2] = st * Math.sin(phi) * r
        const base = psi >= 0 ? posColor : negColor
        const bright = 0.15 + 0.85 * Math.pow(aPsi / psiMaxSeen, 0.55)
        colors[i3] = base.r * bright
        colors[i3 + 1] = base.g * bright
        colors[i3 + 2] = base.b * bright
        count++
      }

      const geo = new BufferGeometry()
      geo.setAttribute('position', { array: positions.slice(0, count * 3), itemSize: 3 })
      geo.setAttribute('color', { array: colors.slice(0, count * 3), itemSize: 3 })
      const cloudMat = new MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false })
      ;(cloudMat as unknown as { size: number }).size = Math.max(1.5, extent / 32)
      const cloud = new Points(geo, cloudMat)
      group.add(cloud)

      const dist = extent * 2.6 + 0.4
      camera.position.set(dist * 0.62, dist * 0.38, dist * 0.72)
      camera.near = Math.max(0.005, extent * 0.01)
      camera.far = extent * 30
      camera.updateProjectionMatrix()
    }

    scene.add(group)
    if (this.currentGroup) {
      this.currentGroup.traverse((obj) => {
        const renderable = obj as Mesh & { geometry?: BufferGeometry }
        if (renderable.geometry) renderer.releaseGeometry(renderable.geometry)
      })
      scene.remove(this.currentGroup)
    }
    this.currentGroup = group

    controls.target.set(0, 0, 0)
    controls.minDistance = extent * 0.7
    controls.maxDistance = extent * 8
    controls.update()

    if (this.busyEl) this.busyEl.style.display = 'none'
  }

  private teardown(): void {
    if (this.computeTimer) clearTimeout(this.computeTimer)
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
    this.currentGroup = null
    if (this.busyEl && this.busyEl.parentElement === this) {
      this.removeChild(this.busyEl)
    }
    this.busyEl = null
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-orbital-view')) {
  customElements.define('elementa-orbital-view', ElementaOrbitalViewElement)
}

// 2D Nodal Cross-Section Element
const S_CROSS = 288

export class ElementaCrossSectionElement extends HTMLElement {
  private canvas: HTMLCanvasElement | null = null

  static get observedAttributes(): string[] {
    return ['data-n', 'data-l', 'data-m', 'data-sin', 'data-zeff', 'data-extent']
  }

  connectedCallback(): void {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      this.canvas.width = S_CROSS
      this.canvas.height = S_CROSS
      this.canvas.className = 'block h-auto w-full max-w-[288px] rounded border border-white/10'
      this.appendChild(this.canvas)
    }
    this.renderSlice()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.renderSlice()
    }
  }

  private renderSlice(): void {
    if (!this.canvas) return
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    const n = Number(this.getAttribute('data-n') ?? 1)
    const l = Number(this.getAttribute('data-l') ?? 0)
    const m = Number(this.getAttribute('data-m') ?? 0)
    const sin = this.getAttribute('data-sin') === '1' || this.getAttribute('data-sin') === 'true'
    const zEff = Number(this.getAttribute('data-zeff') ?? 1)
    const extent = Number(this.getAttribute('data-extent') ?? 5)

    const vals = new Float32Array(S_CROSS * S_CROSS)
    let maxAbs = 1e-12
    for (let iy = 0; iy < S_CROSS; iy++) {
      const z = extent * (1 - (2 * (iy + 0.5)) / S_CROSS)
      for (let ix = 0; ix < S_CROSS; ix++) {
        const x = extent * ((2 * (ix + 0.5)) / S_CROSS - 1)
        const psi = psiAt(n, l, m, sin, zEff, x, 0, z)
        const i2 = iy * S_CROSS + ix
        vals[i2] = psi
        const a = Math.abs(psi)
        if (a > maxAbs) maxAbs = a
      }
    }

    const img = ctx.createImageData(S_CROSS, S_CROSS)
    const bg = [8, 11, 18]
    const pos = [251, 191, 36]
    const neg = [45, 212, 191]
    for (let i = 0; i < S_CROSS * S_CROSS; i++) {
      const t = Math.pow(Math.min(1, Math.abs(vals[i]) / maxAbs), 0.55)
      const c = vals[i] >= 0 ? pos : neg
      const w = t > 0.85 ? ((t - 0.85) / 0.15) * 0.85 : 0
      const o = i * 4
      img.data[o] = bg[0] + (c[0] - bg[0]) * t + (255 - c[0]) * w
      img.data[o + 1] = bg[1] + (c[1] - bg[1]) * t + (255 - c[1]) * w
      img.data[o + 2] = bg[2] + (c[2] - bg[2]) * t + (255 - c[2]) * w
      img.data[o + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-cross-section')) {
  customElements.define('elementa-cross-section', ElementaCrossSectionElement)
}
