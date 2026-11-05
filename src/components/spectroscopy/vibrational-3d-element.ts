/**
 * Custom Element: <elementa-vibrational-3d>
 *
 * Real-time WebGL 3D Animated Vibrational Normal Mode Visualizer using @nexus/3d.
 * Dynamically oscillates atomic coordinates along normal mode eigenvectors,
 * updating bond cylinder stretch/compression in real time.
 */

import {
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
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
import { getSpectroscopyMoleculeById } from '@/lib/spectroscopy/database'
import type { SpectroscopyMolecule, VibrationalMode } from '@/lib/spectroscopy/types'

export class ElementaVibrational3DElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private modelGroup: Object3D | null = null
  private animId: number | null = null
  private resizeObserver: ResizeObserver | null = null

  // Animated elements references
  private atomMeshes: Mesh[] = []
  private bondMeshes: { mesh: Mesh; from: number; to: number; order: number }[] = []
  private currentMode: VibrationalMode | null = null
  private molecule: SpectroscopyMolecule | null = null
  private animTime = 0

  static get observedAttributes(): string[] {
    return [
      'data-molecule',
      'data-mode',
      'data-amplitude',
      'data-speed',
      'data-style',
      'data-rotate',
    ]
  }

  connectedCallback(): void {
    this.setupScene()
    this.setupMolecule()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null): void {
    if (oldVal === newVal) return
    if (this.isConnected && this.renderer) {
      this.setupMolecule()
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
    this.camera.position.set(0, 1.2, 4.2)

    try {
      this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      this.appendChild(this.renderer.domElement)
    } catch (err) {
      console.warn('[elementa-vibrational-3d] WebGL unavailable or limit reached:', err)
      this.renderer = null
      return
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.rotateSpeed = 0.8
    this.controls.zoomSpeed = 1.0

    // Lighting setup
    const amb = new AmbientLight(0xffffff, 0.7)
    this.scene.add(amb)

    const keyLight = new DirectionalLight(0xffffff, 0.95)
    keyLight.position.set(6, 8, 7)
    this.scene.add(keyLight)

    const fillLight = new DirectionalLight(0x38bdf8, 0.45)
    fillLight.position.set(-6, -4, -5)
    this.scene.add(fillLight)

    const rimLight = new DirectionalLight(0xfbbf24, 0.3)
    rimLight.position.set(0, -6, 5)
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

  private setupMolecule(): void {
    if (!this.modelGroup) return

    // Clear previous geometry
    while (this.modelGroup.children.length > 0) {
      const child = this.modelGroup.children[0]
      this.modelGroup.remove(child)
    }
    this.atomMeshes = []
    this.bondMeshes = []

    const molId = this.getAttribute('data-molecule') ?? 'h2o'
    const modeId = this.getAttribute('data-mode') ?? ''
    const style = (this.getAttribute('data-style') ?? 'ball-stick') as 'ball-stick' | 'space-filling' | 'wireframe'

    this.molecule = getSpectroscopyMoleculeById(molId) ?? null
    if (!this.molecule) return

    this.currentMode =
      this.molecule.modes.find((m) => m.id === modeId) ?? this.molecule.modes[0] ?? null

    const radiusMult = style === 'space-filling' ? 1.6 : style === 'wireframe' ? 0.35 : 0.85
    const bondRadius = style === 'wireframe' ? 0.025 : 0.075

    // 1. Create Atom Meshes
    this.molecule.atoms3D.forEach((atom) => {
      const baseR = atom.radius ?? 0.35
      const finalR = baseR * radiusMult
      const col = atom.color ?? '#94a3b8'

      const mat = new MeshStandardMaterial({
        color: new Color(col),
        roughness: 0.22,
        metalness: 0.18,
      })

      const geo = new SphereGeometry(finalR, 24, 24)
      const mesh = new Mesh(geo, mat)
      mesh.position.set(...atom.position)
      this.modelGroup!.add(mesh)
      this.atomMeshes.push(mesh)
    })

    // 2. Create Bond Meshes
    if (style !== 'space-filling') {
      const bondMat = new MeshStandardMaterial({
        color: new Color('#71717a'),
        roughness: 0.35,
        metalness: 0.15,
      })

      this.molecule.bonds3D.forEach((bond) => {
        const atomA = this.molecule!.atoms3D[bond.from]
        const atomB = this.molecule!.atoms3D[bond.to]
        if (!atomA || !atomB) return

        const pA = new Vector3(...atomA.position)
        const pB = new Vector3(...atomB.position)
        const diff = new Vector3().subVectors(pB, pA)
        const len = diff.length()
        if (len < 1e-4) return

        const geo = new CylinderGeometry(bondRadius, bondRadius, len, 12)
        const mesh = new Mesh(geo, bondMat)
        const mid = new Vector3().addVectors(pA, pB).multiplyScalar(0.5)
        mesh.position.copy(mid)
        mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), diff.normalize())
        this.modelGroup!.add(mesh)

        this.bondMeshes.push({
          mesh,
          from: bond.from,
          to: bond.to,
          order: bond.order ?? 1,
        })
      })
    }

    // Auto-fit camera
    let maxDist = 1.0
    this.molecule.atoms3D.forEach((atom) => {
      const d = Math.sqrt(atom.position[0] ** 2 + atom.position[1] ** 2 + atom.position[2] ** 2)
      if (d > maxDist) maxDist = d
    })
    const targetDist = Math.max(3.2, maxDist * 3.0)
    if (this.camera) {
      this.camera.position.set(0, targetDist * 0.25, targetDist)
      this.camera.lookAt(0, 0, 0)
      this.controls?.update()
    }
  }

  private startAnimationLoop(): void {
    const loop = () => {
      this.animId = requestAnimationFrame(loop)

      const autoRotate = this.getAttribute('data-rotate') === 'true'
      const speed = Number(this.getAttribute('data-speed') ?? '1')
      const amplitude = Number(this.getAttribute('data-amplitude') ?? '0.45')

      // Advance oscillation phase
      this.animTime += 0.05 * speed
      const phase = Math.sin(this.animTime) * amplitude

      if (autoRotate && this.modelGroup) {
        this.modelGroup.rotation.y += 0.005 * speed
      }

      // Update Atom Positions along Normal Mode Eigenvector
      if (this.molecule && this.currentMode && this.atomMeshes.length === this.molecule.atoms3D.length) {
        const upAxis = new Vector3(0, 1, 0)

        this.atomMeshes.forEach((mesh, idx) => {
          const eqPos = this.molecule!.atoms3D[idx].position
          const disp = this.currentMode!.displacementVectors[idx] ?? [0, 0, 0]

          mesh.position.set(
            eqPos[0] + disp[0] * phase,
            eqPos[1] + disp[1] * phase,
            eqPos[2] + disp[2] * phase
          )
        })

        // Dynamically stretch/re-orient bonds
        this.bondMeshes.forEach((b) => {
          const mA = this.atomMeshes[b.from]
          const mB = this.atomMeshes[b.to]
          if (!mA || !mB) return

          const pA = mA.position
          const pB = mB.position
          const diff = new Vector3().subVectors(pB, pA)
          const len = diff.length()
          if (len < 1e-4) return

          const mid = new Vector3().addVectors(pA, pB).multiplyScalar(0.5)
          b.mesh.position.copy(mid)
          b.mesh.quaternion.setFromUnitVectors(upAxis, diff.clone().normalize())
          // Scale cylinder length dynamically along Y-axis!
          const origLen = new Vector3(...this.molecule!.atoms3D[b.to].position)
            .distanceTo(new Vector3(...this.molecule!.atoms3D[b.from].position))
          if (origLen > 1e-4) {
            b.mesh.scale.set(1, len / origLen, 1)
          }
        })
      }

      this.controls?.update()
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    }
    loop()
  }
}

if (!customElements.get('elementa-vibrational-3d')) {
  customElements.define('elementa-vibrational-3d', ElementaVibrational3DElement)
}
