/**
 * Custom Element: <elementa-vibration-view>
 *
 * Imperative WebGL 3D renderer for Harmonic Molecular Vibrations & Normal Modes using @nexus/3d.
 * Features:
 * - Real-time harmonic dynamic atom displacement: r_i(t) = r_{i,0} + A * e_{i,k} * sin(omega * t)
 * - Dynamic bond length and orientation updating every frame
 * - Animated 3D displacement vector arrows (cylinder shaft + cone arrowhead)
 * - Ball-and-stick and space-filling representations
 * - OrbitControls for pan, zoom, and rotate with smooth damping
 * - Zero React dependencies, native Web Component for nexus-framework h()
 */

import {
  AmbientLight,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Mesh,
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
import {
  VIBRATIONAL_MOLECULES,
  type AtomVibration,
  type NormalMode,
  type Vector3D,
} from '@/lib/periodic/vibrations'

export class ElementaVibrationElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private rootGroup: Object3D | null = null
  private animId: number | null = null
  private resizeObserver: ResizeObserver | null = null

  // Atom & bond tracking
  private atomMeshes: Mesh[] = []
  private bondMeshes: { mesh: Mesh; atom1: number; atom2: number }[] = []
  private arrowGroups: Object3D[] = []

  private currentMoleculeId: string = 'h2o'
  private currentModeIndex: number = 0 // 0-based
  private amplitude: number = 1.0
  private speed: number = 1.0
  private isPaused: boolean = false
  private showVectors: boolean = true
  private styleMode: 'ball-stick' | 'space-filling' = 'ball-stick'

  private phase: number = 0
  private lastTime: number = performance.now()

  static get observedAttributes(): string[] {
    return [
      'data-molecule',
      'data-mode',
      'data-amplitude',
      'data-speed',
      'data-paused',
      'data-show-vectors',
      'data-style',
    ]
  }

  connectedCallback(): void {
    this.readAttributes()
    this.setupScene()
    this.buildMolecule()
    this.startLoop()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    const prevMol = this.currentMoleculeId
    const prevMode = this.currentModeIndex
    const prevStyle = this.styleMode

    this.readAttributes()

    if (this.isConnected) {
      if (prevMol !== this.currentMoleculeId || prevStyle !== this.styleMode) {
        this.buildMolecule()
      } else if (prevMode !== this.currentModeIndex) {
        this.updateModeVectors()
      }
    }
  }

  private readAttributes(): void {
    this.currentMoleculeId = this.getAttribute('data-molecule') || 'h2o'
    this.currentModeIndex = parseInt(this.getAttribute('data-mode') || '0', 10)
    this.amplitude = parseFloat(this.getAttribute('data-amplitude') || '1.0')
    this.speed = parseFloat(this.getAttribute('data-speed') || '1.0')
    this.isPaused = this.getAttribute('data-paused') === '1' || this.getAttribute('data-paused') === 'true'
    this.showVectors = this.getAttribute('data-show-vectors') !== '0' && this.getAttribute('data-show-vectors') !== 'false'
    this.styleMode = (this.getAttribute('data-style') as any) || 'ball-stick'
  }

  private setupScene(): void {
    this.teardown()

    const width = this.clientWidth || 480
    const height = this.clientHeight || 420

    this.scene = new Scene()
    this.scene.background = new Color('#060911')

    this.camera = new PerspectiveCamera(42, width / height, 0.1, 100)
    this.camera.position.set(0, 1.2, 5.0)

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    this.replaceChildren(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.rotateSpeed = 0.8
    this.controls.minDistance = 1.5
    this.controls.maxDistance = 14

    // Lighting
    const ambLight = new AmbientLight(0xffffff, 0.85)
    this.scene.add(ambLight)

    const dirLight1 = new DirectionalLight(0xffffff, 1.2)
    dirLight1.position.set(5, 8, 6)
    this.scene.add(dirLight1)

    const dirLight2 = new DirectionalLight(0x38bdf8, 0.6)
    dirLight2.position.set(-6, -4, -5)
    this.scene.add(dirLight2)

    this.rootGroup = new Object3D()
    this.scene.add(this.rootGroup)

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect
        if (w > 0 && h > 0 && this.renderer && this.camera) {
          this.camera.aspect = w / h
          this.camera.updateProjectionMatrix()
          this.renderer.setSize(w, h)
        }
      }
    })
    this.resizeObserver.observe(this)
  }

  private buildMolecule(): void {
    if (!this.rootGroup || !this.scene) return

    // Clear previous objects
    while (this.rootGroup.children.length > 0) {
      this.rootGroup.remove(this.rootGroup.children[0])
    }
    this.atomMeshes = []
    this.bondMeshes = []
    this.arrowGroups = []

    const mol = VIBRATIONAL_MOLECULES[this.currentMoleculeId] || VIBRATIONAL_MOLECULES.h2o
    const isSpaceFilling = this.styleMode === 'space-filling'

    // Build atoms
    mol.atoms.forEach((atom) => {
      const radius = isSpaceFilling ? atom.radius * 1.05 : atom.radius * 0.55
      const geom = new SphereGeometry(radius, 32, 32)
      const mat = new MeshStandardMaterial({
        color: new Color(atom.color),
        roughness: 0.28,
        metalness: 0.15,
      })
      const mesh = new Mesh(geom, mat)
      mesh.position.set(atom.x0, atom.y0, atom.z0)
      this.rootGroup!.add(mesh)
      this.atomMeshes.push(mesh)
    })

    // Build bonds (only for ball-and-stick)
    if (!isSpaceFilling) {
      mol.bonds.forEach(([idx1, idx2]) => {
        const a1 = mol.atoms[idx1]
        const a2 = mol.atoms[idx2]
        const v1 = new Vector3(a1.x0, a1.y0, a1.z0)
        const v2 = new Vector3(a2.x0, a2.y0, a2.z0)
        const dist = v1.distanceTo(v2)

        const geom = new CylinderGeometry(0.09, 0.09, dist, 16)
        const mat = new MeshStandardMaterial({
          color: new Color('#71717a'),
          roughness: 0.4,
          metalness: 0.2,
        })
        const mesh = new Mesh(geom, mat)
        this.positionCylinder(mesh, v1, v2)
        this.rootGroup!.add(mesh)
        this.bondMeshes.push({ mesh, atom1: idx1, atom2: idx2 })
      })
    }

    // Build displacement vector arrows for current mode
    this.buildVectorArrows(mol)

    // Center camera on molecule bounds
    this.adjustCamera(mol)
  }

  private buildVectorArrows(mol: typeof VIBRATIONAL_MOLECULES[string]): void {
    if (!this.rootGroup) return

    // Remove existing arrow groups
    this.arrowGroups.forEach((g) => this.rootGroup?.remove(g))
    this.arrowGroups = []

    const mode = mol.modes[this.currentModeIndex] || mol.modes[0]
    if (!mode) return

    mol.atoms.forEach((atom, idx) => {
      const disp = mode.displacements[idx] || { x: 0, y: 0, z: 0 }
      const mag = Math.sqrt(disp.x * disp.x + disp.y * disp.y + disp.z * disp.z)

      const arrowGroup = new Object3D()
      arrowGroup.visible = this.showVectors && mag > 0.01

      if (mag > 0.01) {
        const arrowLen = Math.max(0.4, mag * 1.8)
        const shaftLen = arrowLen * 0.72
        const headLen = arrowLen * 0.28
        const shaftRadius = 0.035
        const headRadius = 0.085

        const cyanColor = new Color('#06b6d4')
        const shaftMat = new MeshStandardMaterial({
          color: cyanColor,
          roughness: 0.2,
          metalness: 0.3,
        })
        const headMat = new MeshStandardMaterial({
          color: cyanColor,
          roughness: 0.2,
          metalness: 0.3,
        })

        // Cylinder shaft
        const shaftGeom = new CylinderGeometry(shaftRadius, shaftRadius, shaftLen, 12)
        const shaftMesh = new Mesh(shaftGeom, shaftMat)
        shaftMesh.position.set(0, shaftLen / 2, 0)
        arrowGroup.add(shaftMesh)

        // Cone head
        const headGeom = new ConeGeometry(headRadius, headLen, 16)
        const headMesh = new Mesh(headGeom, headMat)
        headMesh.position.set(0, shaftLen + headLen / 2, 0)
        arrowGroup.add(headMesh)

        // Orient arrow in direction of displacement vector
        const dir = new Vector3(disp.x, disp.y, disp.z).normalize()
        const defaultUp = new Vector3(0, 1, 0)
        const q = new Quaternion()
        q.setFromUnitVectors(defaultUp, dir)
        arrowGroup.quaternion.copy(q)
        arrowGroup.position.set(atom.x0, atom.y0, atom.z0)
      }

      this.rootGroup!.add(arrowGroup)
      this.arrowGroups.push(arrowGroup)
    })
  }

  private updateModeVectors(): void {
    const mol = VIBRATIONAL_MOLECULES[this.currentMoleculeId] || VIBRATIONAL_MOLECULES.h2o
    this.buildVectorArrows(mol)
  }

  private positionCylinder(cylinder: Mesh, p1: Vector3, p2: Vector3): void {
    const mid = new Vector3().addVectors(p1, p2).multiplyScalar(0.5)
    cylinder.position.copy(mid)

    const dir = new Vector3().subVectors(p2, p1)
    const len = dir.length()
    cylinder.scale.set(1, len, 1)

    dir.normalize()
    const up = new Vector3(0, 1, 0)
    const q = new Quaternion().setFromUnitVectors(up, dir)
    cylinder.quaternion.copy(q)
  }

  private adjustCamera(mol: typeof VIBRATIONAL_MOLECULES[string]): void {
    if (!this.camera || !this.controls) return
    let maxDist = 0
    mol.atoms.forEach((a) => {
      const d = Math.sqrt(a.x0 * a.x0 + a.y0 * a.y0 + a.z0 * a.z0)
      if (d > maxDist) maxDist = d
    })
    const camDist = Math.max(3.8, maxDist * 2.8)
    this.camera.position.set(0, camDist * 0.25, camDist)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  private startLoop(): void {
    const loop = (time: number) => {
      const dt = (time - this.lastTime) * 0.001
      this.lastTime = time

      if (!this.isPaused) {
        // Frequency multiplier proportional to mode wavenumber (scaled visually)
        const mol = VIBRATIONAL_MOLECULES[this.currentMoleculeId] || VIBRATIONAL_MOLECULES.h2o
        const mode = mol.modes[this.currentModeIndex] || mol.modes[0]
        const freqScale = Math.sqrt(mode.frequency / 1000) * 4.5
        this.phase += dt * this.speed * freqScale
      }

      this.updateHarmonicPositions()

      if (this.controls) this.controls.update()
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }

      this.animId = requestAnimationFrame(loop)
    }

    this.lastTime = performance.now()
    this.animId = requestAnimationFrame(loop)
  }

  private updateHarmonicPositions(): void {
    const mol = VIBRATIONAL_MOLECULES[this.currentMoleculeId] || VIBRATIONAL_MOLECULES.h2o
    const mode = mol.modes[this.currentModeIndex] || mol.modes[0]
    if (!mode) return

    const sinVal = Math.sin(this.phase)
    const cosVal = Math.cos(this.phase)
    const currentPositions: Vector3[] = []

    // Update atom meshes
    mol.atoms.forEach((atom, idx) => {
      const disp = mode.displacements[idx] || { x: 0, y: 0, z: 0 }
      const factor = this.amplitude * sinVal

      const curX = atom.x0 + disp.x * factor
      const curY = atom.y0 + disp.y * factor
      const curZ = atom.z0 + disp.z * factor

      const pos = new Vector3(curX, curY, curZ)
      currentPositions.push(pos)

      if (this.atomMeshes[idx]) {
        this.atomMeshes[idx].position.copy(pos)
      }

      // Update arrow group position & pulsating scale
      if (this.arrowGroups[idx]) {
        this.arrowGroups[idx].visible = this.showVectors
        this.arrowGroups[idx].position.copy(pos)

        // Pulsate arrow length with harmonic motion cos(phase)
        const scaleVal = Math.max(0.2, Math.abs(cosVal) * this.amplitude)
        this.arrowGroups[idx].scale.set(1, scaleVal, 1)

        // Point arrow in direction of motion (flips when velocity flips)
        const dir = new Vector3(disp.x, disp.y, disp.z)
        if (cosVal < 0) {
          dir.multiplyScalar(-1)
        }
        dir.normalize()
        const defaultUp = new Vector3(0, 1, 0)
        const q = new Quaternion()
        q.setFromUnitVectors(defaultUp, dir)
        this.arrowGroups[idx].quaternion.copy(q)
      }
    })

    // Update bonds
    this.bondMeshes.forEach(({ mesh, atom1, atom2 }) => {
      const p1 = currentPositions[atom1]
      const p2 = currentPositions[atom2]
      if (p1 && p2) {
        this.positionCylinder(mesh, p1, p2)
      }
    })
  }

  private teardown(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId)
      this.animId = null
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    this.scene = null
    this.camera = null
    this.controls = null
    this.rootGroup = null
    this.atomMeshes = []
    this.bondMeshes = []
    this.arrowGroups = []
  }
}

if (!customElements.get('elementa-vibration-view')) {
  customElements.define('elementa-vibration-view', ElementaVibrationElement)
}
