/**
 * Custom Element: <elementa-compound-3d>
 *
 * Real-time WebGL 3D molecular and crystal structure visualizer using @nexus/3d.
 * Renders ball-and-stick, space-filling, and wireframe representations with CPK coloration.
 */

import {
  AmbientLight,
  Color,
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
import { getCompoundById } from '@/lib/synthesizer/engine'
import type { Compound } from '@/lib/synthesizer/types'
import { createGlowPost, type GlowPost } from '@/lib/postfx'

export class ElementaCompound3DElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private modelGroup: Object3D | null = null
  private animId: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private glow: GlowPost | null = null
  private fx = false

  static get observedAttributes(): string[] {
    return ['data-compound', 'data-style', 'data-rotate', 'data-speed', 'data-fx']
  }

  connectedCallback(): void {
    this.setupScene()
    this.renderCompound()
    this.syncGlow()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null): void {
    if (oldVal === newVal) return
    if (name === 'data-fx') {
      const t = (newVal ?? '').trim().toLowerCase()
      this.fx = t !== 'false' && t !== '0' && t !== 'off'
      this.syncGlow()
    }
    if (this.isConnected && this.renderer) {
      this.renderCompound()
    }
  }

  /** Build or release the glow post chain. */
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
    this.camera.position.set(0, 1.2, 3.8)

    try {
      this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      this.appendChild(this.renderer.domElement)
    } catch (err) {
      console.warn('[elementa-compound-3d] WebGL context unavailable or limit exceeded:', err)
      this.renderer = null
      return
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.rotateSpeed = 0.8
    this.controls.zoomSpeed = 1.0

    // Lighting setup
    const amb = new AmbientLight(0xffffff, 0.65)
    this.scene.add(amb)

    const keyLight = new DirectionalLight(0xffffff, 0.95)
    keyLight.position.set(5, 8, 6)
    this.scene.add(keyLight)

    const fillLight = new DirectionalLight(0x38bdf8, 0.4)
    fillLight.position.set(-5, -4, -4)
    this.scene.add(fillLight)

    const rimLight = new DirectionalLight(0xfbbf24, 0.3)
    rimLight.position.set(0, -6, 4)
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
    if (this.glow) {
      this.glow.dispose()
      this.glow = null
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
    if (this.glow?.active) {
      this.glow.setSize(this.renderer.domElement.width, this.renderer.domElement.height)
    }
  }

  private startAnimationLoop(): void {
    const loop = () => {
      this.animId = requestAnimationFrame(loop)

      const autoRotate = this.getAttribute('data-rotate') !== 'false'
      const speed = Number(this.getAttribute('data-speed') ?? '1')

      if (autoRotate && this.modelGroup) {
        this.modelGroup.rotation.y += 0.008 * speed
      }

      this.controls?.update()
      if (this.renderer && this.scene && this.camera) {
        if (this.glow?.active) this.glow.render()
        else this.renderer.render(this.scene, this.camera)
      }
    }
    loop()
  }

  private renderCompound(): void {
    if (!this.modelGroup) return

    // Clear previous geometry
    while (this.modelGroup.children.length > 0) {
      const child = this.modelGroup.children[0]
      this.modelGroup.remove(child)
    }

    const compoundId = this.getAttribute('data-compound') ?? 'H2O'
    const style = (this.getAttribute('data-style') ?? 'ball-stick') as 'ball-stick' | 'space-filling' | 'wireframe'
    const compound: Compound | undefined = getCompoundById(compoundId)

    if (!compound || compound.atoms3D.length === 0) return

    const upAxis = new Vector3(0, 1, 0)
    const atomRadiusMult = style === 'space-filling' ? 1.6 : style === 'wireframe' ? 0.35 : 0.85
    const bondRadius = style === 'wireframe' ? 0.025 : 0.075

    // Calculate centroid of the compound to ensure perfect centering for lattices (e.g. NaCl) and asymmetric molecules
    const centroid = new Vector3(0, 0, 0)
    compound.atoms3D.forEach((a) => {
      centroid.add(new Vector3(a.position[0], a.position[1], a.position[2]))
    })
    centroid.divideScalar(compound.atoms3D.length)

    // 1. Render Atoms (centered at origin)
    compound.atoms3D.forEach((atom) => {
      const baseR = atom.radius ?? 0.35
      const finalR = baseR * atomRadiusMult
      const col = atom.color ?? '#94a3b8'

      const mat = new MeshStandardMaterial({
        color: new Color(col),
        roughness: 0.22,
        metalness: 0.18,
      })

      const geo = new SphereGeometry(finalR, 28, 28)
      const mesh = new Mesh(geo, mat)
      mesh.position.set(
        atom.position[0] - centroid.x,
        atom.position[1] - centroid.y,
        atom.position[2] - centroid.z,
      )
      this.modelGroup!.add(mesh)
    })

    // 2. Render Bonds (centered at origin)
    if (style !== 'space-filling') {
      const bondMat = new MeshStandardMaterial({
        color: new Color('#71717a'),
        roughness: 0.35,
        metalness: 0.15,
      })

      compound.bonds3D.forEach((bond) => {
        const atomA = compound.atoms3D[bond.from]
        const atomB = compound.atoms3D[bond.to]
        if (!atomA || !atomB) return

        const pA = new Vector3(
          atomA.position[0] - centroid.x,
          atomA.position[1] - centroid.y,
          atomA.position[2] - centroid.z,
        )
        const pB = new Vector3(
          atomB.position[0] - centroid.x,
          atomB.position[1] - centroid.y,
          atomB.position[2] - centroid.z,
        )
        const diff = new Vector3().subVectors(pB, pA)
        const len = diff.length()
        if (len < 1e-4) return

        const dir = diff.clone().normalize()
        const mid = new Vector3().addVectors(pA, pB).multiplyScalar(0.5)

        const order = bond.order ?? 1

        if (order === 1) {
          const geo = new CylinderGeometry(bondRadius, bondRadius, len, 16)
          const mesh = new Mesh(geo, bondMat)
          mesh.position.copy(mid)
          mesh.quaternion.copy(new Quaternion().setFromUnitVectors(upAxis, dir))
          this.modelGroup!.add(mesh)
        } else {
          // Double or triple bond offset
          const perp = new Vector3(0, 1, 0).cross(dir).normalize()
          if (perp.length() < 0.1) perp.set(1, 0, 0).cross(dir).normalize()
          const offsets = order === 2 ? [-0.07, 0.07] : [-0.09, 0, 0.09]
          const thinRadius = bondRadius * 0.75

          offsets.forEach((off) => {
            const geo = new CylinderGeometry(thinRadius, thinRadius, len, 12)
            const mesh = new Mesh(geo, bondMat)
            const bMid = mid.clone().addScaledVector(perp, off)
            mesh.position.copy(bMid)
            mesh.quaternion.copy(new Quaternion().setFromUnitVectors(upAxis, dir))
            this.modelGroup!.add(mesh)
          })
        }
      })
    }

    // Auto-fit camera distance based on centered bounding dimensions (including atom radii)
    let maxDist = 1.0
    compound.atoms3D.forEach((atom) => {
      const p = new Vector3(
        atom.position[0] - centroid.x,
        atom.position[1] - centroid.y,
        atom.position[2] - centroid.z,
      )
      const d = p.length()
      const r = (atom.radius ?? 0.35) * (style === 'space-filling' ? 1.6 : 0.85)
      if (d + r > maxDist) maxDist = d + r
    })
    const targetDist = Math.max(3.2, maxDist * 3.4)
    if (this.camera) {
      this.camera.position.set(0, targetDist * 0.22, targetDist)
      this.camera.lookAt(0, 0, 0)
      if (this.controls) {
        this.controls.target.set(0, 0, 0)
        this.controls.update()
      }
    }
  }
}

if (!customElements.get('elementa-compound-3d')) {
  customElements.define('elementa-compound-3d', ElementaCompound3DElement)
}
