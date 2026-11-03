/**
 * Custom Element: <elementa-vsepr-view>
 *
 * Imperative WebGL 3D renderer for VSEPR molecular geometry using @nexus/3d.
 * Enables zero-React rendering in nexus-framework h() virtual DOM.
 */

import {
  AmbientLight,
  BufferGeometry,
  Color,
  ConeGeometry,
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
import {
  computeVseprCoordinates,
  getCpkColor,
  getCovalentRadius,
  type Molecule3DGeometry,
} from '@/lib/periodic/vsepr'

export class ElementaVseprElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private molGroup: Object3D | null = null
  private animId: number | null = null
  private resizeObserver: ResizeObserver | null = null

  static get observedAttributes(): string[] {
    return [
      'data-central',
      'data-ligand',
      'data-bp',
      'data-lp',
      'data-angle',
      'data-show-lp',
      'data-show-dipole',
      'data-show-poly',
      'data-style',
      'data-rotate',
    ]
  }

  connectedCallback(): void {
    this.setupScene()
    this.updateMolecule()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.updateMolecule()
    }
  }

  private setupScene(): void {
    this.teardown()

    const width = this.clientWidth || 400
    const height = this.clientHeight || 400

    this.scene = new Scene()
    this.scene.background = new Color('#060911')

    this.camera = new PerspectiveCamera(42, width / height, 0.1, 100)
    this.camera.position.set(0, 1.2, 5.2)

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    this.replaceChildren(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.rotateSpeed = 0.8
    this.controls.minDistance = 1.5
    this.controls.maxDistance = 12

    // Lighting
    const ambLight = new AmbientLight(0xffffff, 0.8)
    this.scene.add(ambLight)

    const dirLight1 = new DirectionalLight(0xffffff, 1.1)
    dirLight1.position.set(5, 8, 6)
    this.scene.add(dirLight1)

    const dirLight2 = new DirectionalLight(0x38bdf8, 0.45)
    dirLight2.position.set(-5, -4, -4)
    this.scene.add(dirLight2)

    this.molGroup = new Object3D()
    this.scene.add(this.molGroup)

    // Resize Observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect
        if (cr.width > 0 && cr.height > 0 && this.camera && this.renderer) {
          this.camera.aspect = cr.width / cr.height
          this.camera.updateProjectionMatrix()
          this.renderer.setSize(cr.width, cr.height)
        }
      }
    })
    this.resizeObserver.observe(this)

    // Animation Loop
    const animate = () => {
      const autoRotate = this.getAttribute('data-rotate') !== 'false'
      if (autoRotate && this.molGroup) {
        this.molGroup.rotation.y += 0.006
      }
      if (this.controls) this.controls.update()
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
      this.animId = requestAnimationFrame(animate)
    }
    animate()
  }

  private updateMolecule(): void {
    if (!this.molGroup) return

    // Clear previous children
    while (this.molGroup.children.length > 0) {
      const child = this.molGroup.children[0]
      this.molGroup.remove(child)
    }

    const centralZ = Number(this.getAttribute('data-central') ?? '8')
    const ligandZ = Number(this.getAttribute('data-ligand') ?? '1')
    const bp = Number(this.getAttribute('data-bp') ?? '2')
    const lp = Number(this.getAttribute('data-lp') ?? '2')
    const customAngle = this.hasAttribute('data-angle')
      ? Number(this.getAttribute('data-angle'))
      : undefined
    const showLonePairs = this.getAttribute('data-show-lp') !== 'false'
    const showDipole = this.getAttribute('data-show-dipole') !== 'false'
    const showPolyhedron = this.getAttribute('data-show-poly') === 'true'
    const modelStyle = (this.getAttribute('data-style') ?? 'ball-stick') as
      | 'ball-stick'
      | 'space-filling'
      | 'wireframe'

    const geometry: Molecule3DGeometry = computeVseprCoordinates(
      centralZ,
      ligandZ,
      bp,
      lp,
      customAngle,
    )

    // Central Atom
    const cRadius = getCovalentRadius(geometry.centralAtom.z)
    const cpkC = getCpkColor(geometry.centralAtom.z)
    const centralSphereRadius =
      modelStyle === 'space-filling' ? cRadius * 1.5 : modelStyle === 'wireframe' ? 0.22 : 0.42

    const centralMat = new MeshStandardMaterial({
      color: new Color(cpkC),
      roughness: 0.25,
      metalness: 0.15,
    })
    const centralMesh = new Mesh(new SphereGeometry(centralSphereRadius, 32, 32), centralMat)
    this.molGroup.add(centralMesh)

    // Ligands and Bonds
    const lRadius = geometry.ligands.length > 0 ? getCovalentRadius(geometry.ligands[0].z) : 0.8
    const cpkL = geometry.ligands.length > 0 ? getCpkColor(geometry.ligands[0].z) : '#94a3b8'
    const ligandSphereRadius =
      modelStyle === 'space-filling' ? lRadius * 1.4 : modelStyle === 'wireframe' ? 0.18 : 0.32

    const ligandMat = new MeshStandardMaterial({
      color: new Color(cpkL),
      roughness: 0.25,
      metalness: 0.15,
    })

    const bondMat = new MeshStandardMaterial({
      color: new Color('#71717a'),
      roughness: 0.3,
      metalness: 0.1,
    })

    const upAxis = new Vector3(0, 1, 0)

    geometry.ligands.forEach((lig) => {
      const pos = new Vector3(lig.position.x, lig.position.y, lig.position.z)

      // Ligand atom sphere
      const ligMesh = new Mesh(new SphereGeometry(ligandSphereRadius, 28, 28), ligandMat)
      ligMesh.position.copy(pos)
      this.molGroup!.add(ligMesh)

      // Bond Cylinder
      if (modelStyle !== 'space-filling') {
        const bondLen = pos.length()
        const bondRadius = modelStyle === 'wireframe' ? 0.02 : 0.065
        const bondGeom = new CylinderGeometry(bondRadius, bondRadius, bondLen, 16)
        const bondMesh = new Mesh(bondGeom, bondMat)

        const mid = pos.clone().multiplyScalar(0.5)
        bondMesh.position.copy(mid)

        const quat = new Quaternion().setFromUnitVectors(upAxis, pos.clone().normalize())
        bondMesh.quaternion.copy(quat)
        this.molGroup!.add(bondMesh)
      }
    })

    // Lone Pairs
    if (showLonePairs && geometry.lonePairs.length > 0) {
      const lpMat = new MeshStandardMaterial({
        color: new Color('#f59e0b'),
        transparent: true,
        opacity: 0.42,
        roughness: 0.1,
        metalness: 0.05,
      })

      geometry.lonePairs.forEach((lpItem) => {
        const pos = new Vector3(lpItem.position.x, lpItem.position.y, lpItem.position.z)
        const lpGeom = new SphereGeometry(0.32, 24, 24)
        const lpMesh = new Mesh(lpGeom, lpMat)

        lpMesh.scale.set(0.7, 1.35, 0.7)
        const quat = new Quaternion().setFromUnitVectors(upAxis, pos.clone().normalize())
        lpMesh.quaternion.copy(quat)

        const centerOffset = pos.clone().normalize().multiplyScalar(pos.length() * 0.95)
        lpMesh.position.copy(centerOffset)
        this.molGroup!.add(lpMesh)
      })
    }

    // Dipole Moment Vector Arrow
    if (showDipole && geometry.isPolar && geometry.dipoleMagnitudeDebye > 0.05) {
      const dipVec = new Vector3(
        geometry.netDipole.x,
        geometry.netDipole.y,
        geometry.netDipole.z,
      ).normalize()
      const arrowLen = Math.min(2.5, 0.8 + geometry.dipoleMagnitudeDebye * 0.6)

      const arrowMat = new MeshStandardMaterial({
        color: new Color('#eab308'),
        roughness: 0.2,
        metalness: 0.4,
      })

      const shaftRadius = 0.05
      const headRadius = 0.14
      const headLength = 0.35
      const shaftLen = arrowLen - headLength

      const shaftGeom = new CylinderGeometry(shaftRadius, shaftRadius, shaftLen, 16)
      const shaftMesh = new Mesh(shaftGeom, arrowMat)
      const headGeom = new ConeGeometry(headRadius, headLength, 16)
      const headMesh = new Mesh(headGeom, arrowMat)

      const arrowGroup = new Object3D()
      shaftMesh.position.y = shaftLen / 2
      headMesh.position.y = shaftLen + headLength / 2
      arrowGroup.add(shaftMesh)
      arrowGroup.add(headMesh)

      const quat = new Quaternion().setFromUnitVectors(upAxis, dipVec)
      arrowGroup.quaternion.copy(quat)
      this.molGroup.add(arrowGroup)
    }

    // Polyhedron Wireframe
    if (showPolyhedron && geometry.ligands.length >= 3) {
      const positions: number[] = []
      const lPts = geometry.ligands.map((l) => new Vector3(l.position.x, l.position.y, l.position.z))

      for (let i = 0; i < lPts.length; i++) {
        for (let j = i + 1; j < lPts.length; j++) {
          positions.push(lPts[i].x, lPts[i].y, lPts[i].z)
          positions.push(lPts[j].x, lPts[j].y, lPts[j].z)
        }
      }

      const polyGeom = new BufferGeometry()
      polyGeom.setAttribute(
        'position',
        new (window as any).Float32Array(positions),
      )
      const polyMat = new MeshBasicMaterial({
        color: new Color('#38bdf8'),
        transparent: true,
        opacity: 0.35,
      })
      const lines = new LineSegments(polyGeom, polyMat)
      this.molGroup.add(lines)
    }
  }

  private teardown(): void {
    if (this.animId != null) {
      cancelAnimationFrame(this.animId)
      this.animId = null
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.controls) {
      this.controls.dispose()
      this.controls = null
    }
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    this.scene = null
    this.camera = null
    this.molGroup = null
  }
}

if (!customElements.get('elementa-vsepr-view')) {
  customElements.define('elementa-vsepr-view', ElementaVseprElement)
}
