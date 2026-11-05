/**
 * Custom Element: <elementa-crystal-3d>
 *
 * Real-time WebGL 3D Crystal Lattice & Miller Plane Visualizer using @nexus/3d.
 * Renders multi-unit-cell supercells, atom spheres with CPK colors, unit cell bounding wireframes,
 * and dynamic semi-transparent Miller plane (hkl) slicing with surface intersection.
 */

import {
  AmbientLight,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from '@nexus/3d'
import { getCrystalStructureById } from '@/lib/crystallography/database'
import type { CrystalStructure } from '@/lib/crystallography/types'

export class ElementaCrystal3DElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private modelGroup: Object3D | null = null
  private millerPlaneMesh: Mesh | null = null
  private animId: number | null = null
  private resizeObserver: ResizeObserver | null = null

  static get observedAttributes(): string[] {
    return [
      'data-crystal',
      'data-style',
      'data-supercell',
      'data-miller-h',
      'data-miller-k',
      'data-miller-l',
      'data-show-plane',
      'data-rotate',
      'data-speed',
    ]
  }

  connectedCallback(): void {
    this.setupScene()
    this.renderLattice()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null): void {
    if (oldVal === newVal) return
    if (this.isConnected && this.renderer) {
      this.renderLattice()
    }
  }

  private setupScene(): void {
    if (this.renderer) return

    this.style.display = 'block'
    this.style.width = '100%'
    this.style.height = '100%'
    this.style.position = 'relative'
    this.style.overflow = 'hidden'

    const width = this.clientWidth || 400
    const height = this.clientHeight || 400

    this.scene = new Scene()
    this.camera = new PerspectiveCamera(45, width / height, 0.1, 100)
    this.camera.position.set(0, 1.8, 5.2)

    try {
      this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      this.appendChild(this.renderer.domElement)
    } catch (err) {
      console.warn('[elementa-crystal-3d] WebGL unavailable or limit reached:', err)
      this.renderer = null
      return
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.rotateSpeed = 0.8
    this.controls.zoomSpeed = 1.0

    // Multi-angle scientific lighting
    const amb = new AmbientLight(0xffffff, 0.7)
    this.scene.add(amb)

    const keyLight = new DirectionalLight(0xffffff, 0.9)
    keyLight.position.set(6, 10, 8)
    this.scene.add(keyLight)

    const fillLight = new DirectionalLight(0x38bdf8, 0.45)
    fillLight.position.set(-6, -4, -6)
    this.scene.add(fillLight)

    const rimLight = new DirectionalLight(0xfbbf24, 0.35)
    rimLight.position.set(0, -8, 6)
    this.scene.add(rimLight)

    this.modelGroup = new Object3D()
    this.scene.add(this.modelGroup)

    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(this)

    this.startAnimationLoop()
  }

  private teardown(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId)
      this.animId = null
    }
    this.resizeObserver?.disconnect()
    this.resizeObserver = null

    if (this.controls) {
      this.controls.dispose()
      this.controls = null
    }

    if (this.renderer) {
      this.renderer.dispose()
      if (this.renderer.domElement.parentNode === this) {
        this.removeChild(this.renderer.domElement)
      }
      this.renderer = null
    }

    this.scene = null
    this.camera = null
    this.modelGroup = null
  }

  private handleResize(): void {
    if (!this.renderer || !this.camera) return
    const width = this.clientWidth
    const height = this.clientHeight
    if (width === 0 || height === 0) return

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  private startAnimationLoop(): void {
    const loop = () => {
      this.animId = requestAnimationFrame(loop)

      const autoRotate = this.getAttribute('data-rotate') === 'true'
      const speed = Number(this.getAttribute('data-speed') ?? '1')

      if (autoRotate && this.modelGroup) {
        this.modelGroup.rotation.y += 0.006 * speed
      }

      this.controls?.update()
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    }
    loop()
  }

  private renderLattice(): void {
    if (!this.modelGroup) return

    // Clear previous objects
    while (this.modelGroup.children.length > 0) {
      const child = this.modelGroup.children[0]
      this.modelGroup.remove(child)
    }

    const crystalId = this.getAttribute('data-crystal') ?? 'fe-bcc'
    const style = (this.getAttribute('data-style') ?? 'ball-stick') as 'ball-stick' | 'space-filling' | 'wireframe'
    const supercell = Number(this.getAttribute('data-supercell') ?? '2') // 1 or 2
    const showPlane = this.getAttribute('data-show-plane') !== 'false'
    const h = Number(this.getAttribute('data-miller-h') ?? '1')
    const k = Number(this.getAttribute('data-miller-k') ?? '1')
    const l = Number(this.getAttribute('data-miller-l') ?? '0')

    const crystal: CrystalStructure | undefined = getCrystalStructureById(crystalId)
    if (!crystal) return

    const { a, b, c, alpha, beta, gamma } = crystal.lattice

    // Basis lattice vector calculations (Ångströms)
    const radA = (alpha * Math.PI) / 180
    const radB = (beta * Math.PI) / 180
    const radG = (gamma * Math.PI) / 180

    const vA = new Vector3(a, 0, 0)
    const vB = new Vector3(b * Math.cos(radG), b * Math.sin(radG), 0)
    const cx = c * Math.cos(radB)
    const cy = c * (Math.cos(radA) - Math.cos(radB) * Math.cos(radG)) / Math.sin(radG)
    const cz = Math.sqrt(Math.max(c * c - cx * cx - cy * cy, 0.01))
    const vC = new Vector3(cx, cy, cz)

    // Center the supercell around (0, 0, 0)
    const originOffset = new Vector3()
      .addScaledVector(vA, -supercell * 0.5)
      .addScaledVector(vB, -supercell * 0.5)
      .addScaledVector(vC, -supercell * 0.5)

    // 1. Build Unit Cell Bounding Wireframe
    const wireMat = new MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 })
    const wireThin = 0.02

    const addUnitCellBox = (nx: number, ny: number, nz: number) => {
      const base = new Vector3()
        .copy(originOffset)
        .addScaledVector(vA, nx)
        .addScaledVector(vB, ny)
        .addScaledVector(vC, nz)

      const p000 = base.clone()
      const p100 = base.clone().add(vA)
      const p010 = base.clone().add(vB)
      const p001 = base.clone().add(vC)
      const p110 = base.clone().add(vA).add(vB)
      const p101 = base.clone().add(vA).add(vC)
      const p011 = base.clone().add(vB).add(vC)
      const p111 = base.clone().add(vA).add(vB).add(vC)

      const edges: [Vector3, Vector3][] = [
        [p000, p100], [p000, p010], [p000, p001],
        [p100, p110], [p100, p101],
        [p010, p110], [p010, p011],
        [p001, p101], [p001, p011],
        [p110, p111], [p101, p111], [p011, p111],
      ]

      edges.forEach(([p1, p2]) => {
        const diff = new Vector3().subVectors(p2, p1)
        const len = diff.length()
        if (len < 1e-4) return
        const dir = diff.clone().normalize()
        const mid = new Vector3().addVectors(p1, p2).multiplyScalar(0.5)

        const geo = new CylinderGeometry(wireThin, wireThin, len, 8)
        const mesh = new Mesh(geo, wireMat)
        mesh.position.copy(mid)
        mesh.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir))
        this.modelGroup!.add(mesh)
      })
    }

    for (let ix = 0; ix < supercell; ix++) {
      for (let iy = 0; iy < supercell; iy++) {
        for (let iz = 0; iz < supercell; iz++) {
          addUnitCellBox(ix, iy, iz)
        }
      }
    }

    // 2. Render Lattice Atoms across Supercell
    const radiusMult = style === 'space-filling' ? 1.7 : style === 'wireframe' ? 0.35 : 0.85

    // Track placed atom positions to deduplicate corners/edges between cells
    const placedPositions: Vector3[] = []

    for (let ix = 0; ix < supercell; ix++) {
      for (let iy = 0; iy < supercell; iy++) {
        for (let iz = 0; iz < supercell; iz++) {
          crystal.basisAtoms.forEach((basis) => {
            const fracX = ix + basis.fracPos[0]
            const fracY = iy + basis.fracPos[1]
            const fracZ = iz + basis.fracPos[2]

            const pos = new Vector3()
              .copy(originOffset)
              .addScaledVector(vA, fracX)
              .addScaledVector(vB, fracY)
              .addScaledVector(vC, fracZ)

            // Avoid double-rendering overlapping boundary atoms
            const duplicate = placedPositions.some((p) => p.distanceTo(pos) < 0.15)
            if (duplicate) return
            placedPositions.push(pos)

            const baseR = basis.radius ?? 0.35
            const finalR = baseR * radiusMult
            const col = basis.color ?? '#38bdf8'

            const mat = new MeshStandardMaterial({
              color: new Color(col),
              roughness: 0.25,
              metalness: 0.35,
            })

            const geo = new SphereGeometry(finalR, 24, 24)
            const mesh = new Mesh(geo, mat)
            mesh.position.copy(pos)
            this.modelGroup!.add(mesh)
          })
        }
      }
    }

    // 3. Render Dynamic Miller Plane (h, k, l)
    if (showPlane && (h !== 0 || k !== 0 || l !== 0)) {
      // Normal vector in reciprocal space: N = h*b1 + k*b2 + l*b3
      // For orthogonal/cubic, N is parallel to h*vA/a^2 + k*vB/b^2 + l*vC/c^2
      const normal = new Vector3()
        .addScaledVector(vA, h / (a * a))
        .addScaledVector(vB, k / (b * b))
        .addScaledVector(vC, l / (c * c))
        .normalize()

      const planeSize = Math.max(a, b, c) * supercell * 1.5
      const planeGeo = new BoxGeometry(planeSize, planeSize, 0.02)
      const planeMat = new MeshStandardMaterial({
        color: new Color(0xfbbf24), // Vibrant Amber
        transparent: true,
        opacity: 0.42,
        roughness: 0.2,
        metalness: 0.1,
      })

      const planeMesh = new Mesh(planeGeo, planeMat)
      // Align plane normal with (h, k, l) direction
      const defaultNormal = new Vector3(0, 0, 1)
      planeMesh.quaternion.setFromUnitVectors(defaultNormal, normal)
      planeMesh.position.set(0, 0, 0)
      this.modelGroup!.add(planeMesh)

      // Add a thin border / indicator ring around the plane
      const normalArrow = new CylinderGeometry(0.03, 0.03, planeSize * 0.4, 8)
      const arrowMat = new MeshBasicMaterial({ color: 0xf59e0b })
      const arrowMesh = new Mesh(normalArrow, arrowMat)
      arrowMesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), normal)
      arrowMesh.position.set(0, 0, 0)
      this.modelGroup!.add(arrowMesh)
    }

    // 4. Auto-fit camera distance
    const extent = Math.max(a, b, c) * supercell
    const targetDist = Math.max(3.8, extent * 1.65)
    if (this.camera) {
      this.camera.position.set(targetDist * 0.45, targetDist * 0.35, targetDist * 0.95)
      this.camera.lookAt(0, 0, 0)
      this.controls?.update()
    }
  }
}

if (!customElements.get('elementa-crystal-3d')) {
  customElements.define('elementa-crystal-3d', ElementaCrystal3DElement)
}
