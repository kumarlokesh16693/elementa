/**
 * 3D Nuclear Reactor Fuel Core & Control Rod Assembly WebGL Component
 * Renders fuel rod array, moveable control rod cluster,
 * illustrative fuel temperature colors, and a schematic blue glow effect.
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  OrbitControls,
  Object3D,
  Mesh,
  CylinderGeometry,
  BoxGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  Color,
  PointLight,
  AmbientLight,
  DirectionalLight,
  Vector3,
} from '@nexus/3d'

export class ElementaReactor3DElement extends HTMLElement {
  private container: HTMLDivElement | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private renderer: WebGLRenderer | null = null
  private controls: OrbitControls | null = null
  private animFrameId: number | null = null

  // 3D Model Groups
  private coreGroup: Object3D | null = null
  private controlRodGroup: Object3D | null = null
  private cherenkovLight: PointLight | null = null
  private fuelMeshList: { mesh: Mesh; baseMaterial: MeshStandardMaterial }[] = []

  // Current animation values
  private currentInsertion = 35.0 // %
  private targetInsertion = 35.0
  private currentFlux = 1.0

  static get observedAttributes(): string[] {
    return ['data-insertion', 'data-flux', 'data-temp', 'data-scram']
  }

  connectedCallback(): void {
    if (this.scene) return
    this.init3D()
    this.buildReactorCore()
    this.startLoop()
  }

  disconnectedCallback(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
    if (this.renderer) {
      this.renderer.dispose()
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement)
      }
      this.renderer = null
    }
    this.scene = null
    this.camera = null
    this.controls = null
  }

  attributeChangedCallback(name: string, _oldVal: string, newVal: string): void {
    if (name === 'data-insertion') {
      this.targetInsertion = Math.max(0, Math.min(100, parseFloat(newVal) || 0))
    } else if (name === 'data-flux') {
      this.currentFlux = Math.max(0, parseFloat(newVal) || 0)
      this.updateCherenkovAndFuelColors()
    } else if (name === 'data-scram') {
      if (newVal === 'true') {
        this.targetInsertion = 100.0 // Fast drop
      }
    }
  }

  private init3D(): void {
    const width = this.clientWidth || 600
    const height = this.clientHeight || 450

    this.scene = new Scene()
    this.scene.background = new Color('#050811')

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 100)
    this.camera.position.set(0, 4.5, 7.5)

    try {
      this.renderer = new WebGLRenderer({ antialias: true, alpha: false })
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      this.appendChild(this.renderer.domElement)
    } catch (err) {
      console.warn('[elementa-reactor-3d] WebGL init failed:', err)
      return
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 2.5
    this.controls.maxDistance = 15.0
    this.controls.target.set(0, 0.5, 0)
    this.controls.update()

    // Lighting
    const amb = new AmbientLight(0xffffff, 0.35)
    this.scene.add(amb)

    const dir1 = new DirectionalLight(0xffffff, 0.75)
    dir1.position.set(5, 10, 7)
    this.scene.add(dir1)

    const dir2 = new DirectionalLight(0x94a3b8, 0.4)
    dir2.position.set(-5, -5, -5)
    this.scene.add(dir2)

    // Cherenkov Blue Point Light inside the core
    this.cherenkovLight = new PointLight(0x00d7ff, 2.5, 12)
    this.cherenkovLight.position.set(0, 0, 0)
    this.scene.add(this.cherenkovLight)

    window.addEventListener('resize', this.onResize)
  }

  private onResize = (): void => {
    if (!this.renderer || !this.camera) return
    const w = this.clientWidth || 600
    const h = this.clientHeight || 450
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private buildReactorCore(): void {
    if (!this.scene) return

    this.coreGroup = new Object3D()
    this.scene.add(this.coreGroup)

    this.controlRodGroup = new Object3D()
    this.scene.add(this.controlRodGroup)

    this.fuelMeshList = []

    // 1. Grid of Fuel Pins (7x7 array)
    const gridSize = 7
    const pinSpacing = 0.34
    const pinHeight = 3.8
    const pinRadius = 0.075

    const fuelPinGeo = new CylinderGeometry(pinRadius, pinRadius, pinHeight, 16)
    const upperNozzleMat = new MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 })

    // Bottom tie plate / lower core support
    const bottomPlateGeo = new BoxGeometry(2.8, 0.15, 2.8)
    const bottomPlate = new Mesh(bottomPlateGeo, upperNozzleMat)
    bottomPlate.position.set(0, -pinHeight / 2 - 0.08, 0)
    this.coreGroup.add(bottomPlate)

    // Grid spacer plates (3 spacers along height)
    ;[-1.0, 0.0, 1.0].forEach((yPos) => {
      const spacerGeo = new BoxGeometry(2.7, 0.05, 2.7)
      const spacerMat = new MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.7,
        roughness: 0.3,
        transparent: true,
        opacity: 0.65,
      })
      const spacer = new Mesh(spacerGeo, spacerMat)
      spacer.position.set(0, yPos, 0)
      this.coreGroup?.add(spacer)
    })

    // Top nozzle plate
    const topPlateGeo = new BoxGeometry(2.8, 0.15, 2.8)
    const topPlate = new Mesh(topPlateGeo, upperNozzleMat)
    topPlate.position.set(0, pinHeight / 2 + 0.08, 0)
    this.coreGroup.add(topPlate)

    // Instantiate fuel rods with control rod guide thimbles at designated positions
    const isGuideTube = (r: number, c: number): boolean => {
      // Symmetrical guide tube pattern (like standard 17x17 assembly)
      return (
        (r === 1 && c === 1) || (r === 1 && c === 5) ||
        (r === 5 && c === 1) || (r === 5 && c === 5) ||
        (r === 3 && c === 3) ||
        (r === 1 && c === 3) || (r === 3 && c === 1) || (r === 3 && c === 5) || (r === 5 && c === 3)
      )
    }

    const controlRodPins: Vector3[] = []

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = (c - (gridSize - 1) / 2) * pinSpacing
        const z = (r - (gridSize - 1) / 2) * pinSpacing

        if (isGuideTube(r, c)) {
          // Guide tube hollow cylinder
          const thimbleMat = new MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 })
          const thimbleGeo = new CylinderGeometry(pinRadius * 1.25, pinRadius * 1.25, pinHeight + 0.1, 16)
          const thimbleMesh = new Mesh(thimbleGeo, thimbleMat)
          thimbleMesh.position.set(x, 0, z)
          this.coreGroup.add(thimbleMesh)
          controlRodPins.push(new Vector3(x, 0, z))
        } else {
          // Fuel pin (Zircaloy cladding containing UO2 pellets)
          const fuelMat = new MeshStandardMaterial({
            color: 0x38bdf8,
            metalness: 0.35,
            roughness: 0.4,
          })
          const mesh = new Mesh(fuelPinGeo, fuelMat)
          mesh.position.set(x, 0, z)
          this.coreGroup.add(mesh)
          this.fuelMeshList.push({ mesh, baseMaterial: fuelMat })
        }
      }
    }

    // 2. Control Rod Spider Assembly (absorber rods + upper cross-spider)
    const rodRadius = pinRadius * 0.95
    const rodLength = pinHeight * 0.98
    const controlRodGeo = new CylinderGeometry(rodRadius, rodRadius, rodLength, 14)
    const controlRodMat = new MeshStandardMaterial({
      color: 0x991b1b, // Dark crimson B4C neutron poison
      metalness: 0.8,
      roughness: 0.25,
    })

    controlRodPins.forEach((pos) => {
      const rod = new Mesh(controlRodGeo, controlRodMat)
      rod.position.set(pos.x, 0, pos.z)
      this.controlRodGroup!.add(rod)
    })

    // Upper spider hub & drive rod
    const spiderMat = new MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
    const hubGeo = new BoxGeometry(2.5, 0.18, 2.5)
    const hub = new Mesh(hubGeo, spiderMat)
    hub.position.set(0, rodLength / 2 + 0.1, 0)
    this.controlRodGroup.add(hub)

    const driveShaftGeo = new CylinderGeometry(0.08, 0.08, 2.5, 12)
    const driveShaft = new Mesh(driveShaftGeo, spiderMat)
    driveShaft.position.set(0, rodLength / 2 + 1.35, 0)
    this.controlRodGroup.add(driveShaft)

    this.updateRodPosition()
    this.updateCherenkovAndFuelColors()
  }

  private updateRodPosition(): void {
    if (!this.controlRodGroup) return
    // At 100% insertion, rods are fully inside core (y = 0)
    // At 0% insertion, rods are lifted out above the core (y = 3.6)
    const travelDistance = 3.7
    const targetY = (1 - this.currentInsertion / 100) * travelDistance
    this.controlRodGroup.position.y = targetY
  }

  private updateCherenkovAndFuelColors(): void {
    const flux = this.currentFlux

    // 1. Cherenkov Glow Light
    if (this.cherenkovLight) {
      this.cherenkovLight.intensity = Math.min(6.0, flux * 3.5)
    }

    // 2. Dynamic Fuel Cladding Thermal Colors
    // Cool cyan/blue at low power -> Warm white/yellow at full rated power -> Red/orange in overload
    let r = 0.22, g = 0.74, b = 0.97
    if (flux > 0.3) {
      const t = Math.min(1.0, (flux - 0.3) / 0.7)
      // Lerp to amber-yellow (1.0, 0.75, 0.2)
      r = 0.22 + t * (1.0 - 0.22)
      g = 0.74 + t * (0.75 - 0.74)
      b = 0.97 - t * 0.75
    }
    if (flux > 1.0) {
      // Supercritical overload: fiery orange/crimson
      const tOver = Math.min(1.0, (flux - 1.0) / 0.5)
      r = 1.0
      g = 0.75 - tOver * 0.55
      b = 0.22 - tOver * 0.22
    }

    const col = new Color(r, g, b)
    this.fuelMeshList.forEach(({ baseMaterial }) => {
      baseMaterial.color.copy(col)
    })
  }

  private startLoop(): void {
    const render = () => {
      this.animFrameId = requestAnimationFrame(render)

      // Smoothly interpolate control rod movement towards target
      if (Math.abs(this.currentInsertion - this.targetInsertion) > 0.05) {
        this.currentInsertion += (this.targetInsertion - this.currentInsertion) * 0.1
        this.updateRodPosition()
      }

      // Gentle continuous rotation
      if (this.coreGroup) {
        this.coreGroup.rotation.y += 0.002
      }
      if (this.controlRodGroup) {
        this.controlRodGroup.rotation.y += 0.002
      }

      this.controls?.update()
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    }
    render()
  }
}

if (!customElements.get('elementa-reactor-3d')) {
  customElements.define('elementa-reactor-3d', ElementaReactor3DElement)
}
