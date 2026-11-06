import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  Points,
  Quaternion,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from '@nexus/3d'
import { getElement } from '@/lib/periodic'
import type { ElementData } from '@/lib/periodic/types'
import { createGlowPost, type GlowPost } from '@/lib/postfx'

interface SpinEntry {
  group: Object3D
  rate: number
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

function buildAtom(
  group: Object3D,
  el: ElementData,
  accent: string,
  massA?: number | null,
): { spins: SpinEntry[]; maxRing: number } {
  const nominalMass = massA != null && massA > el.number ? massA : Math.round(el.mass)
  const neutronCount = Math.max(0, nominalMass - el.number)
  const total = el.number + neutronCount

  const nucleonR = Math.min(0.3, 0.95 / Math.cbrt(total))
  const ballR = Math.max(nucleonR * 1.15, nucleonR * 1.55 * Math.cbrt(total))

  const positions: Vector3[] = []
  for (let i = 0; i < total; i++) {
    const y = 1 - (2 * (i + 0.5)) / total
    const rad = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = GOLDEN * i
    const r = ballR * Math.cbrt((i + 0.5) / total)
    positions.push(
      new Vector3(Math.cos(theta) * rad * r, y * r, Math.sin(theta) * rad * r),
    )
  }

  const geo = new SphereGeometry(1, 12, 10)
  const matP = new MeshStandardMaterial({
    color: new Color(accent),
    emissive: new Color(accent),
    emissiveIntensity: 0.35,
    roughness: 0.35,
    metalness: 0.15,
  })
  const matN = new MeshStandardMaterial({ color: 0x5b6675, roughness: 0.55, metalness: 0.1 })

  const protons: Matrix4[] = []
  const neutrons: Matrix4[] = []
  const m = new Matrix4()
  const q = new Quaternion()
  const sc = new Vector3(nucleonR, nucleonR, nucleonR)
  for (let i = 0; i < total; i++) {
    const idx = (i * 7919) % total
    m.compose(positions[idx], q, sc)
    if (idx < el.number) protons.push(m.clone())
    else neutrons.push(m.clone())
  }

  const makeInstanced = (mats: Matrix4[], mat: MeshStandardMaterial) => {
    const im = new InstancedMesh(geo, mat, mats.length)
    mats.forEach((mtx, i) => im.setMatrixAt(i, mtx))
    im.instanceMatrixNeedsUpdate = true
    im.frustumCulled = false
    return im
  }
  if (protons.length) group.add(makeInstanced(protons, matP))
  if (neutrons.length) group.add(makeInstanced(neutrons, matN))

  const shells = el.shells
  const shellCount = shells.length
  const firstRing = ballR + 1.05
  const gap = shellCount > 1 ? 0.8 : 0
  const electronGeo = new SphereGeometry(0.085, 10, 8)
  const electronMat = new MeshBasicMaterial({ color: 0x7dd3fc })
  const spins: SpinEntry[] = []
  let maxRing = firstRing

  for (let i = 0; i < shellCount; i++) {
    const r = firstRing + i * gap
    maxRing = r

    const plane = new Object3D()
    plane.rotation.x = ((((i * 47) % 90) - 45) * Math.PI) / 180 * 0.9
    plane.rotation.y = (((i * 61) % 180) * Math.PI) / 180
    plane.rotation.z = ((((i * 23) % 60) - 30) * Math.PI) / 180 * 0.4
    group.add(plane)

    const ring = new Mesh(
      new TorusGeometry(r, 0.012, 6, 128),
      new MeshBasicMaterial({
        color: new Color(accent),
        transparent: true,
        opacity: 0.32,
      }),
    )
    plane.add(ring)

    const spin = new Object3D()
    plane.add(spin)
    const count = shells[i]
    for (let j = 0; j < count; j++) {
      const a = (2 * Math.PI * j) / count
      const e = new Mesh(electronGeo, electronMat)
      e.position.set(r * Math.cos(a), r * Math.sin(a), 0)
      spin.add(e)
    }
    const dir = i % 2 === 0 ? 1 : -1
    spins.push({ group: spin, rate: dir * (0.9 / (1 + i * 0.3)) })
  }

  return { spins, maxRing }
}

export class ElementaBohr3DElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private atomGroup: Object3D | null = null
  private spins: SpinEntry[] = []
  private ro: ResizeObserver | null = null
  private raf = 0
  private last = performance.now()

  public z = 6
  public accent = '#fbbf24'
  public speed = 1
  public paused = false
  public massA: number | null = null
  private glow: GlowPost | null = null
  private fx = false

  static get observedAttributes(): string[] {
    return ['data-z', 'data-accent', 'data-speed', 'data-paused', 'data-a', 'data-mass', 'data-fx']
  }

  connectedCallback(): void {
    if (this.renderer) return
    this.readAttrs()
    this.initScene()
    this.rebuild()
    this.syncGlow()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    this.readAttrs()
    this.syncGlow()
    if (this.isConnected && this.renderer) {
      this.rebuild()
    }
  }

  /** Build or release the glow post chain for the Bohr atom. */
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

  private readAttrs(): void {
    if (this.hasAttribute('data-z')) this.z = Number(this.getAttribute('data-z'))
    if (this.hasAttribute('data-accent')) this.accent = this.getAttribute('data-accent') ?? '#fbbf24'
    if (this.hasAttribute('data-speed')) this.speed = Number(this.getAttribute('data-speed') ?? 1)
    if (this.hasAttribute('data-paused')) this.paused = this.getAttribute('data-paused') === 'true'
    if (this.hasAttribute('data-a')) this.massA = Number(this.getAttribute('data-a'))
    else if (this.hasAttribute('data-mass')) this.massA = Number(this.getAttribute('data-mass'))
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

    const scene = new Scene()
    const camera = new PerspectiveCamera(45, 1, 0.1, 300)
    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.inset = '0'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.touchAction = 'none'
    this.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 4
    controls.maxDistance = 60

    scene.add(new AmbientLight(0xffffff, 0.55))
    const key = new DirectionalLight(0xffffff, 1.1)
    key.position.set(5, 8, 6)
    scene.add(key)
    const rim = new DirectionalLight(0x88aaff, 0.35)
    rim.position.set(-6, -4, -5)
    scene.add(rim)

    const starCount = 420
    const pos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const uz = Math.random() * 2 - 1
      const phi = Math.random() * Math.PI * 2
      const st = Math.sqrt(1 - uz * uz)
      const radius = 60 + Math.random() * 60
      pos[i * 3] = st * Math.cos(phi) * radius
      pos[i * 3 + 1] = uz * radius
      pos[i * 3 + 2] = st * Math.sin(phi) * radius
    }
    const starGeo = new BufferGeometry()
    starGeo.setAttribute('position', { array: pos, itemSize: 3 })
    const starMat = new MeshBasicMaterial({ color: 0x3b4a63, transparent: true, opacity: 0.8 })
    ;(starMat as unknown as { size: number }).size = 1.4
    scene.add(new Points(starGeo, starMat))

    const atomGroup = new Object3D()
    scene.add(atomGroup)

    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.controls = controls
    this.atomGroup = atomGroup

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

    this.last = performance.now()
    const tick = () => {
      this.raf = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = Math.min((now - this.last) / 1000, 0.05)
      this.last = now
      if (!this.paused && this.atomGroup) {
        const sp = this.speed
        for (const s of this.spins) s.group.rotation.z += s.rate * sp * dt
        this.atomGroup.rotation.y += 0.25 * dt
      }
      controls.update()
      if (this.glow?.active) this.glow.render(dt)
      else renderer.render(scene, camera)
    }
    tick()
  }

  private rebuild(): void {
    const el = getElement(this.z)
    if (!el || !this.atomGroup || !this.camera || !this.controls || !this.renderer) return

    // Dispose old children
    this.atomGroup.traverse((obj) => {
      const mesh = obj as Mesh
      if (mesh.geometry) this.renderer?.releaseGeometry(mesh.geometry)
    })
    while (this.atomGroup.children.length) {
      this.atomGroup.remove(this.atomGroup.children[0])
    }

    const res = buildAtom(this.atomGroup, el, this.accent, this.massA)
    this.spins = res.spins
    const dist = Math.max(6, res.maxRing * 2.3 + 1.6)
    this.camera.position.set(0, dist * 0.32, dist)
    this.camera.lookAt(0, 0, 0)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
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
      this.renderer.dispose()
      if (this.renderer.domElement.parentElement === this) {
        this.removeChild(this.renderer.domElement)
      }
      this.renderer = null
    }
    this.scene = null
    this.camera = null
    this.atomGroup = null
    this.spins = []
    if (this.childNodes.length > 0) this.replaceChildren()
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-bohr-3d')) {
  customElements.define('elementa-bohr-3d', ElementaBohr3DElement)
}
