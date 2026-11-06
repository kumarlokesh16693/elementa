/**
 * ELEMENTA — Solid-State Band Theory
 * Custom Web Component:
 *   • WebGL (@nexus/3d): the tight-binding dispersion E(k) drawn as a real 3D
 *     surface over the first Brillouin zone — one sheet for the 1D chain and
 *     square lattice, two sheets (valence/conduction) for the dimerized chain
 *     and honeycomb lattice. Vertex colours switch at the Fermi level, so the
 *     occupied Fermi sea is cyan and the empty states amber; a translucent
 *     plane marks E_F and the BZ outline anchors k-space.
 *   • 2D canvas overlay: the band diagram along Γ–X–M–Γ (or Γ–M–K–Γ), the
 *     density of states on a shared energy axis, the Fermi-surface inset and
 *     live W / E_g / E_F / m* / g(E_F) / metal–insulator readouts.
 *
 * Physics by @/lib/bands. The 3D surface is the exact dispersion sampled over
 * the BZ; only the camera is schematic.
 */

import {
  BufferGeometry,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from '@nexus/3d'
import {
  analyse,
  bandEnergies,
  bzPolygon,
  fermiContour,
  sampleBandPath,
  BAND_COUNT,
  KB_EV,
  MODEL_LABEL,
  MODEL_NOTE,
  type BandAnalysis,
  type BandParams,
  type BandPath,
  type FermiContourPoint,
  type LatticeModel,
} from '@/lib/bands'
import { createGlowPost, type GlowPost } from '@/lib/postfx'

const R_WORLD = 3.3
const Y_WORLD = 3.05
const BASE_Y = -3.62

const OCC = [0.13, 0.83, 0.93]
const EMPTY = [0.98, 0.66, 0.12]

const FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace'

export class ElementaBandsElement extends HTMLElement {
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private raf = 0
  private ro: ResizeObserver | null = null
  private group: Object3D | null = null
  private overlay: HTMLCanvasElement | null = null
  private pillEl: HTMLElement | null = null
  private noteEl: HTMLElement | null = null
  private ready = false
  private lastTime = 0

  // public state (page-driven)
  public model: LatticeModel = 'square'
  public t = 1
  public a = 2.46
  public delta = 0.3
  public gap = 0.4
  public filling = 1
  public temperature = 300
  public autoRotate = true
  public viewMode: 'split' | '3d' | '2d' = 'split'

  // cached analysis for the current parameters
  public analysis: BandAnalysis | null = null
  private path: BandPath | null = null
  private contour: FermiContourPoint[] = []
  private lastSig = ''
  private glow: GlowPost | null = null
  private fx = false

  static get observedAttributes(): string[] {
    return [
      'data-model', 'data-t', 'data-a', 'data-delta', 'data-gap',
      'data-fill', 'data-temp', 'data-rot', 'data-reset', 'data-view', 'data-fx',
    ]
  }

  connectedCallback(): void {
    if (this.ready) return
    this.initScene()
    this.readAttributes()
    this.rebuild(true)
    this.syncGlow()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    if (!this.ready) return
    this.readAttributes()
    this.syncGlow()
    this.updateLayout()
    this.rebuild(false)
  }

  /** Build or release the glow post chain for the band surface. */
  private syncGlow(): void {
    const renderer = this.renderer
    const scene = this.scene
    const camera = this.camera
    if (this.fx) {
      if ((!this.glow || !this.glow.active) && renderer && scene && camera) {
        this.glow = createGlowPost(renderer, scene, camera)
      }
    } else if (this.glow) {
      this.glow.dispose()
      this.glow = null
    }
  }

  /* ------------------------------------------------------------------ */

  private initScene(): void {
    this.style.position = 'relative'
    this.style.display = 'block'
    this.style.width = '100%'
    this.style.height = '100%'

    const overlay = document.createElement('canvas')
    overlay.style.position = 'absolute'
    overlay.style.top = '10px'
    overlay.style.left = '10px'
    overlay.style.bottom = '10px'
    overlay.style.borderRadius = '12px'
    overlay.style.border = '1px solid rgba(255,255,255,0.10)'
    overlay.style.background = '#080c14'
    overlay.style.zIndex = '2'
    this.appendChild(overlay)
    this.overlay = overlay

    let renderer: WebGLRenderer | null = null
    let scene: Scene | null = null
    let camera: PerspectiveCamera | null = null
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setClearColor('#080c14', 1.0)
      renderer.domElement.style.position = 'absolute'
      renderer.domElement.style.touchAction = 'none'
      this.appendChild(renderer.domElement)
      this.renderer = renderer

      scene = new Scene()
      camera = new PerspectiveCamera(45, 1, 0.05, 400)
      camera.position.set(0, 7.5, 9.5)
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.target.set(0, -0.1, 0)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.minDistance = 4
      controls.maxDistance = 42
      controls.updateSphericalFromCamera()
      controls.update()
      this.scene = scene
      this.camera = camera
      this.controls = controls
    } catch {
      renderer = null
      scene = null
      camera = null
    }

    if (!renderer) {
      overlay.style.width = 'calc(100% - 20px)'
      const note = document.createElement('div')
      note.textContent = 'WebGL unavailable — showing the exact band diagram'
      note.style.cssText =
        'position:absolute;right:18px;bottom:14px;z-index:3;pointer-events:none;' +
        'font:10px ' + FONT + ';color:#71717a;' +
        'background:rgba(8,12,20,0.7);padding:3px 7px;border-radius:6px'
      this.appendChild(note)
      this.noteEl = note
    }

    // Floating view mode pills in the top-right
    const pill = document.createElement('div')
    pill.style.cssText =
      'position:absolute;top:18px;right:18px;z-index:10;display:flex;gap:3px;' +
      'background:rgba(8,12,20,0.88);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);' +
      'border-radius:8px;padding:3px;box-shadow:0 4px 16px rgba(0,0,0,0.45);font-family:' + FONT + ';'

    const modes: { label: string; mode: 'split' | '3d' | '2d' }[] = [
      { label: '◨ Split', mode: 'split' },
      { label: '🌐 3D', mode: '3d' },
      { label: '📊 2D', mode: '2d' },
    ]
    for (const m of modes) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = m.label
      btn.dataset.mode = m.mode
      btn.style.cssText =
        'padding:3px 8px;font-size:10px;border-radius:5px;border:none;' +
        'cursor:pointer;transition:all 0.15s ease;'
      btn.addEventListener('pointerdown', (e) => e.stopPropagation())
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.viewMode = m.mode
        this.setAttribute('data-view', m.mode)
        this.dispatchEvent(new CustomEvent('elementa-bands-view-change', { detail: m.mode, bubbles: true }))
        this.updateLayout()
      })
      pill.appendChild(btn)
    }
    this.appendChild(pill)
    this.pillEl = pill

    this.updateLayout()
    this.ro = new ResizeObserver(() => this.updateLayout())
    this.ro.observe(this)

    if (renderer && scene && camera) {
      const r = renderer
      const s = scene
      const c = camera
      const tick = (now: number) => {
        this.raf = requestAnimationFrame(tick)
        const dt = this.lastTime ? Math.min(0.05, (now - this.lastTime) / 1000) : 0
        this.lastTime = now
        this.advance(dt)
        if (this.controls) this.controls.update()
        if (this.glow?.active) this.glow.render(dt)
        else r.render(s, c)
      }
      this.lastTime = 0
      this.raf = requestAnimationFrame(tick)
    }

    this.ready = true
  }

  private updateLayout(): void {
    const w = this.clientWidth || 1
    const h = this.clientHeight || 1
    const renderer = this.renderer
    const camera = this.camera
    const overlay = this.overlay

    // Small screens (<740px) default to 2D view unless user explicitly chooses 3D
    const isNarrow = w < 740
    const mode = isNarrow ? (this.viewMode === '3d' ? '3d' : '2d') : this.viewMode

    const pad = 10
    const padY = 10
    const contentH = Math.max(100, h - padY * 2)

    if (mode === 'split') {
      const gap = 12
      // 2D diagram gets ~49% of available space (min 360px, max 50%)
      const leftW = Math.round(Math.min(Math.max((w - pad * 2 - gap) * 0.49, 360), (w - pad * 2 - gap) * 0.51))
      const rightW = Math.max(100, w - pad * 2 - gap - leftW)

      if (overlay) {
        overlay.style.display = 'block'
        overlay.style.left = `${pad}px`
        overlay.style.top = `${padY}px`
        overlay.style.width = `${leftW}px`
        overlay.style.height = `${contentH}px`
      }

      if (renderer && camera) {
        const dom = renderer.domElement
        dom.style.display = 'block'
        dom.style.left = `${pad + leftW + gap}px`
        dom.style.top = `${padY}px`
        dom.style.width = `${rightW}px`
        dom.style.height = `${contentH}px`
        dom.style.borderRadius = '12px'
        dom.style.border = '1px solid rgba(255,255,255,0.10)'
        dom.style.background = '#080c14'

        renderer.setSize(rightW, contentH, false)
        camera.aspect = rightW / contentH
        camera.updateProjectionMatrix()
        if (this.glow?.active) this.glow.setSize(renderer.domElement.width, renderer.domElement.height)
        camera.position.set(0, 7.5, 9.5)
        if (this.controls) {
          this.controls.target.set(0, -0.1, 0)
          const fit = Math.min(2.2, Math.max(0.9, 1.15 / camera.aspect))
          this.controls.setDistance(11.8 * fit)
          this.controls.update()
        }
      }
    } else if (mode === '3d') {
      const fullW = Math.max(100, w - pad * 2)

      if (overlay) {
        overlay.style.display = 'none'
      }

      if (renderer && camera) {
        const dom = renderer.domElement
        dom.style.display = 'block'
        dom.style.left = `${pad}px`
        dom.style.top = `${padY}px`
        dom.style.width = `${fullW}px`
        dom.style.height = `${contentH}px`
        dom.style.borderRadius = '12px'
        dom.style.border = '1px solid rgba(255,255,255,0.10)'
        dom.style.background = '#080c14'

        renderer.setSize(fullW, contentH, false)
        camera.aspect = fullW / contentH
        camera.updateProjectionMatrix()
        if (this.glow?.active) this.glow.setSize(renderer.domElement.width, renderer.domElement.height)
        camera.position.set(0, 7.5, 9.5)
        if (this.controls) {
          this.controls.target.set(0, -0.1, 0)
          const fit = Math.min(2.0, Math.max(0.9, 1.25 / camera.aspect))
          this.controls.setDistance(11.5 * fit)
          this.controls.update()
        }
      }
    } else {
      // 2D diagram takes entire area
      const fullW = Math.max(100, w - pad * 2)

      if (overlay) {
        overlay.style.display = 'block'
        overlay.style.left = `${pad}px`
        overlay.style.top = `${padY}px`
        overlay.style.width = `${fullW}px`
        overlay.style.height = `${contentH}px`
      }

      if (renderer) {
        renderer.domElement.style.display = 'none'
      }
    }

    this.updatePillUI(mode)
    this.drawOverlay()
  }

  private updatePillUI(activeMode: 'split' | '3d' | '2d'): void {
    if (!this.pillEl) return
    const btns = this.pillEl.querySelectorAll('button')
    btns.forEach((btn) => {
      const isAct = btn.dataset.mode === activeMode
      btn.style.background = isAct ? 'rgba(34,211,238,0.22)' : 'transparent'
      btn.style.color = isAct ? '#22d3ee' : '#94a3b8'
      btn.style.border = isAct ? '1px solid rgba(34,211,238,0.45)' : '1px solid transparent'
      btn.style.fontWeight = isAct ? '600' : '400'
    })
  }

  /* ------------------------------------------------------------------ */

  private readAttributes(): void {
    const p = (k: string, d: number): number => {
      const raw = this.getAttribute(`data-${k}`)
      if (raw == null || raw.trim() === '') return d
      const v = Number(raw)
      return Number.isFinite(v) ? v : d
    }
    const raw = (k: string, d: string): string => {
      const v = this.getAttribute(`data-${k}`)
      return v == null || v.trim() === '' ? d : v.trim()
    }

    const m = raw('model', this.model)
    if (m === 'chain' || m === 'ssh' || m === 'square' || m === 'honeycomb') this.model = m
    this.t = Math.min(4, Math.max(0.2, p('t', this.t)))
    this.a = Math.min(8, Math.max(1, p('a', this.a)))
    this.delta = Math.min(0.48 * this.t, Math.max(0, p('delta', this.delta)))
    this.gap = Math.min(3, Math.max(0, p('gap', this.gap)))
    this.filling = Math.min(2, Math.max(0, p('fill', this.filling)))
    this.temperature = Math.min(1500, Math.max(0, p('temp', this.temperature)))
    const rot = this.getAttribute('data-rot')
    if (rot != null) {
      const v = rot.trim().toLowerCase()
      this.autoRotate = v !== 'false' && v !== '0'
    }
    const fxRaw = this.getAttribute('data-fx')
    if (fxRaw != null) {
      const t = fxRaw.trim().toLowerCase()
      this.fx = t !== 'false' && t !== '0' && t !== 'off'
    }
    const vm = this.getAttribute('data-view')
    if (vm === 'split' || vm === '3d' || vm === '2d') {
      this.viewMode = vm
    }
  }

  private params(): BandParams {
    return {
      model: this.model,
      t: this.t,
      a: this.a,
      delta: this.delta,
      gap: this.gap,
      filling: this.filling,
      temperature: this.temperature,
    }
  }

  private sig(): string {
    return [
      this.model, this.t, this.a, this.delta, this.gap,
      this.filling, this.temperature,
    ].join('|')
  }

  private rebuild(full: boolean): void {
    const seed = this.getAttribute('data-reset')
    if (seed != null && seed !== this.lastSeed) {
      this.lastSeed = seed
      this.group?.rotation.set(0, 0, 0)
    }
    const sig = this.sig()
    if (!full && sig === this.lastSig && this.analysis) {
      this.drawOverlay()
      return
    }
    this.lastSig = sig
    const p = this.params()
    this.analysis = analyse(p)
    this.path = sampleBandPath(p, 80)
    this.contour = fermiContour(p, 88)
    this.build3D()
    this.drawOverlay()
  }

  private lastSeed: string | null = null

  /* ------------------------------------------------------------------ */
  /* 3D dispersion surfaces                                              */
  /* ------------------------------------------------------------------ */

  private clearContent(): void {
    const group = this.group
    if (!group) return
    for (const child of [...group.children]) {
      const renderable = child as unknown as { geometry?: BufferGeometry }
      if (renderable.geometry) this.renderer?.releaseGeometry(renderable.geometry)
      group.remove(child)
    }
    this.scene?.remove(group)
    this.group = null
  }

  private makeMesh(pos: Float32Array, col: Float32Array, idx: number[]): Mesh {
    const geo = new BufferGeometry()
    geo.setAttribute('position', { array: pos, itemSize: 3 })
    geo.setAttribute('color', { array: col, itemSize: 3 })
    geo.setIndex(idx)
    const mat = new MeshBasicMaterial()
    mat.side = 'double'
    const mesh = new Mesh(geo, mat)
    mesh.frustumCulled = false
    return mesh
  }

  private makeLines(points: number[], color: string, opacity = 1): LineSegments {
    const geo = new BufferGeometry()
    geo.setAttribute('position', { array: new Float32Array(points), itemSize: 3 })
    const mat = new MeshBasicMaterial({ color, transparent: opacity < 1, opacity })
    const line = new LineSegments(geo, mat)
    line.frustumCulled = false
    return line
  }

  private build3D(): void {
    const scene = this.scene
    const an = this.analysis
    if (!an) return
    // Preserve the current orbit spin across parameter updates.
    const rotY = this.group?.rotation.y ?? 0
    this.clearContent()

    const p = an.params
    const group = new Object3D()
    group.name = 'bands-content'
    group.rotation.y = rotY
    this.group = group
    // Buildable without a GL context: the overlay keeps working and the
    // geometry stays inspectable in headless/blocked-WebGL environments.
    scene?.add(group)

    const maxAbs = Math.max(1e-6, Math.abs(an.range.min), Math.abs(an.range.max))
    const yScale = Y_WORLD / maxAbs
    const ef = an.fermi
    const efY = ef * yScale

    const colour = (E: number, out: Float32Array | number[], i: number): void => {
      const base = E <= ef + 1e-9 ? OCC : EMPTY
      const shade = 0.42 + 0.58 * Math.min(1, Math.abs(E) / maxAbs)
      out[i] = base[0] * shade + 0.015
      out[i + 1] = base[1] * shade + 0.015
      out[i + 2] = base[2] * shade + 0.02
    }

    if (p.model === 'square') {
      const n = 64
      const kMax = Math.PI / p.a
      const count = (n + 1) * (n + 1)
      const pos = new Float32Array(count * 3)
      const col = new Float32Array(count * 3)
      const idx: number[] = []
      for (let iy = 0; iy <= n; iy++) {
        const ky = -kMax + (2 * kMax * iy) / n
        for (let ix = 0; ix <= n; ix++) {
          const kx = -kMax + (2 * kMax * ix) / n
          const i = iy * (n + 1) + ix
          const E = bandEnergies(kx, ky, p)[0]
          pos[i * 3] = (kx / kMax) * R_WORLD
          pos[i * 3 + 1] = E * yScale
          pos[i * 3 + 2] = (ky / kMax) * R_WORLD
          colour(E, col, i * 3)
        }
      }
      for (let iy = 0; iy < n; iy++) {
        for (let ix = 0; ix < n; ix++) {
          const a0 = iy * (n + 1) + ix
          const b0 = a0 + 1
          const c0 = a0 + n + 1
          const d0 = c0 + 1
          idx.push(a0, c0, b0, b0, c0, d0)
        }
      }
      group.add(this.makeMesh(pos, col, idx))
    } else if (p.model === 'honeycomb') {
      const poly = bzPolygon(p)
      const kR = Math.abs(poly[0].x)
      const sub = 24
      for (let band = 0; band < 2; band++) {
        const positions: number[] = []
        const colors: number[] = []
        const indices: number[] = []
        for (let wedge = 0; wedge < 6; wedge++) {
          const A = poly[wedge]
          const B = poly[(wedge + 1) % 6]
          const base = positions.length / 3
          const at = (i: number, j: number): number => base + i * (sub + 1) - (i * (i - 1)) / 2 + j
          for (let i = 0; i <= sub; i++) {
            for (let j = 0; j <= sub - i; j++) {
              const u = i / sub
              const v = j / sub
              const kx = u * A.x + v * B.x
              const ky = u * A.y + v * B.y
              const E = bandEnergies(kx, ky, p)[band]
              positions.push((kx / kR) * R_WORLD, E * yScale, (ky / kR) * R_WORLD)
              const c: number[] = [0, 0, 0]
              colour(E, c, 0)
              colors.push(c[0], c[1], c[2])
            }
          }
          for (let i = 0; i < sub; i++) {
            for (let j = 0; j < sub - i; j++) {
              indices.push(at(i, j), at(i + 1, j), at(i, j + 1))
              if (i + j < sub - 1) {
                indices.push(at(i + 1, j), at(i + 1, j + 1), at(i, j + 1))
              }
            }
          }
        }
        group.add(this.makeMesh(Float32Array.from(positions), Float32Array.from(colors), indices))
      }
    } else {
      // 1D chain / dimerized chain: dispense with a flat sheet and draw the
      // band as a narrow ribbon so k is still a spatial axis.
      const n = 150
      const kMax = Math.PI / p.a
      const nBands = BAND_COUNT[p.model]
      for (let band = 0; band < nBands; band++) {
        const pos = new Float32Array(n * 2 * 3)
        const col = new Float32Array(n * 2 * 3)
        for (let i = 0; i < n; i++) {
          const kx = -kMax + (2 * kMax * i) / (n - 1)
          const E = bandEnergies(kx, 0, p)[band]
          for (let row = 0; row < 2; row++) {
            const vi = i * 2 + row
            const z = row === 0 ? -0.12 : 0.12
            pos[vi * 3] = (kx / kMax) * R_WORLD
            pos[vi * 3 + 1] = E * yScale
            pos[vi * 3 + 2] = z
            colour(E, col, vi * 3)
          }
        }
        const idx: number[] = []
        for (let i = 0; i < n - 1; i++) {
          const a0 = i * 2
          idx.push(a0, a0 + 2, a0 + 1, a0 + 1, a0 + 2, a0 + 3)
        }
        group.add(this.makeMesh(pos, col, idx))
      }
    }

    // Fermi plane
    const halfZ = p.model === 'chain' || p.model === 'ssh' ? 0.5 : R_WORLD
    const plane = this.makeMesh(
      Float32Array.from([
        -R_WORLD, efY, -halfZ,
        R_WORLD, efY, -halfZ,
        R_WORLD, efY, halfZ,
        -R_WORLD, efY, halfZ,
      ]),
      Float32Array.from([
        0.79, 0.86, 0.94,
        0.79, 0.86, 0.94,
        0.79, 0.86, 0.94,
        0.79, 0.86, 0.94,
      ]),
      [0, 1, 2, 0, 2, 3],
    )
    const planeMat = plane.material as MeshBasicMaterial
    planeMat.transparent = true
    planeMat.opacity = 0.12
    planeMat.side = 'double'
    group.add(plane)

    let border: number[] = []
    if (p.model === 'honeycomb') {
      const poly = bzPolygon(p)
      const kR = Math.abs(poly[0].x)
      for (let i = 0; i < 6; i++) {
        const aPt = poly[i]
        const bPt = poly[(i + 1) % 6]
        border.push(
          (aPt.x / kR) * R_WORLD, efY, (aPt.y / kR) * R_WORLD,
          (bPt.x / kR) * R_WORLD, efY, (bPt.y / kR) * R_WORLD,
        )
      }
    } else {
      const zz = p.model === 'chain' || p.model === 'ssh' ? 0.5 : R_WORLD
      border = [
        -R_WORLD, efY, -zz, R_WORLD, efY, -zz,
        R_WORLD, efY, -zz, R_WORLD, efY, zz,
        R_WORLD, efY, zz, -R_WORLD, efY, zz,
        -R_WORLD, efY, zz, -R_WORLD, efY, -zz,
      ]
    }
    group.add(this.makeLines(border, '#94a3b8', 0.45))

    // Brillouin-zone outline on the base plane
    let bzPts: number[] = []
    if (p.model === 'honeycomb') {
      const poly = bzPolygon(p)
      const kR = Math.abs(poly[0].x)
      for (let i = 0; i < 6; i++) {
        const aPt = poly[i]
        const bPt = poly[(i + 1) % 6]
        bzPts.push(
          (aPt.x / kR) * R_WORLD, BASE_Y, (aPt.y / kR) * R_WORLD,
          (bPt.x / kR) * R_WORLD, BASE_Y, (bPt.y / kR) * R_WORLD,
        )
      }
    } else if (p.model === 'square') {
      bzPts = [
        -R_WORLD, BASE_Y, -R_WORLD, R_WORLD, BASE_Y, -R_WORLD,
        R_WORLD, BASE_Y, -R_WORLD, R_WORLD, BASE_Y, R_WORLD,
        R_WORLD, BASE_Y, R_WORLD, -R_WORLD, BASE_Y, R_WORLD,
        -R_WORLD, BASE_Y, R_WORLD, -R_WORLD, BASE_Y, -R_WORLD,
      ]
    } else {
      bzPts = [-R_WORLD, BASE_Y, 0, R_WORLD, BASE_Y, 0]
    }
    group.add(this.makeLines(bzPts, '#334155', 0.9))

    // Faint vertical guide at Γ (k = 0)
    if (p.model !== 'chain' && p.model !== 'ssh') {
      group.add(this.makeLines([0, BASE_Y, 0, 0, Y_WORLD + 0.15, 0], '#1e293b', 0.8))
    }
  }

  /* ------------------------------------------------------------------ */

  public advance(dt: number): void {
    if (this.autoRotate && this.group && dt > 0) {
      this.group.rotation.y += dt * 0.16
    }
  }

  /* ------------------------------------------------------------------ */

  public drawOverlay(): void {
    const cv = this.overlay
    if (!cv) return
    const w = cv.clientWidth || 0
    const h = cv.clientHeight || 0
    if (!w || !h) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
    }
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    // Paint the panel into the bitmap itself (not just CSS) so captures and
    // exports are self-contained and the bright 3D surface cannot bleed in.
    ctx.fillStyle = '#080c14'
    ctx.fillRect(0, 0, w, h)

    const an = this.analysis
    if (!an) return
    const p = an.params
    const narrow = w < 470
    const mL = narrow ? 38 : 46
    const mR = 12
    const mT = 38
    const contentW = w - mL - mR
    const gapPx = narrow ? 10 : 18
    const bandW = contentW * (narrow ? 0.61 : 0.65) - gapPx / 2
    const dosW = contentW - bandW - gapPx
    const dosX = mL + bandW + gapPx

    const mainTop = mT + 4
    const mainH = Math.max(110, h * 0.49)
    const span = an.range.max - an.range.min
    const pad = span * 0.07
    const emin = an.range.min - pad
    const emax = an.range.max + pad
    const yE = (E: number): number => mainTop + ((emax - E) / (emax - emin)) * mainH

    const C_OCC = '#22d3ee'
    const C_EMPTY = '#f59e0b'
    const C_EF = '#e2e8f0'
    const C_TEXT = '#94a3b8'
    const C_DIM = '#64748b'
    const C_GRID = 'rgba(148,163,184,0.13)'

    // ---- header ----
    ctx.font = `11px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(MODEL_LABEL[p.model], mL, 12)
    ctx.font = `8.5px ${FONT}`
    ctx.fillStyle = C_DIM
    ctx.fillText(MODEL_NOTE[p.model], mL, 25)

    ctx.textAlign = 'right'
    ctx.font = `9.5px ${FONT}`
    ctx.fillStyle = C_TEXT
    const head = w >= 560
      ? `t ${p.t.toFixed(2)} eV · a ${p.a.toFixed(2)} Å · ν ${p.filling.toFixed(2)} · T ${Math.round(p.temperature)} K`
      : `t ${p.t.toFixed(2)} eV · ν ${p.filling.toFixed(2)}`
    ctx.fillText(head, w - mR, 12)
    ctx.textAlign = 'left'

    // ---- energy grid ----
    const eStep = niceStep(span / (narrow ? 5 : 6))
    ctx.font = `9px ${FONT}`
    ctx.textAlign = 'right'
    for (let e = Math.ceil(emin / eStep) * eStep; e <= emax; e += eStep) {
      const yy = yE(e)
      ctx.strokeStyle = C_GRID
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(mL, yy)
      ctx.lineTo(mL + bandW, yy)
      ctx.stroke()
      ctx.fillStyle = C_DIM
      ctx.fillText(e.toFixed(Math.abs(eStep) < 0.1 ? 2 : 1), mL - 5, yy)
    }
    ctx.fillStyle = C_DIM
    ctx.textAlign = 'left'
    ctx.fillText('E (eV)', mL - 34, mainTop - 8)

    // ---- band curves, clipped by occupancy ----
    const path = this.path
    if (path) {
      const drawBands = (occupied: boolean): void => {
        ctx.save()
        ctx.beginPath()
        if (occupied) {
          const yF = yE(an.fermi)
          ctx.rect(mL, yF, bandW, mainTop + mainH - yF)
        } else {
          const yF = yE(an.fermi)
          ctx.rect(mL, mainTop, bandW, yF - mainTop)
        }
        ctx.clip()
        ctx.strokeStyle = occupied ? C_OCC : C_EMPTY
        ctx.lineWidth = 1.7
        ctx.lineJoin = 'round'
        const nB = path.samples[0]?.energies.length ?? 1
        for (let b = 0; b < nB; b++) {
          ctx.beginPath()
          for (let i = 0; i < path.samples.length; i++) {
            const s = path.samples[i]
            const x = mL + s.t * bandW
            const y = yE(s.energies[b])
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
        ctx.restore()
      }
      drawBands(true)
      drawBands(false)

      // k ticks
      ctx.textAlign = 'center'
      ctx.font = `9px ${FONT}`
      for (const tick of path.ticks) {
        const x = mL + tick.t * bandW
        ctx.strokeStyle = 'rgba(148,163,184,0.20)'
        ctx.beginPath()
        ctx.moveTo(x, mainTop)
        ctx.lineTo(x, mainTop + mainH)
        ctx.stroke()
        ctx.fillStyle = C_TEXT
        ctx.fillText(tick.label, x, mainTop + mainH + 11)
      }
      ctx.textAlign = 'left'
    }

    // ---- Fermi level ----
    const yF = yE(an.fermi)
    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(226,232,240,0.62)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(mL, yF)
    ctx.lineTo(w - mR, yF)
    ctx.stroke()
    ctx.restore()
    ctx.font = `8.5px ${FONT}`
    ctx.fillStyle = C_EF
    ctx.textAlign = 'left'
    ctx.fillText(`E_F ${an.fermi.toFixed(3)} eV`, mL + 4, yF - 7)

    // ---- DOS panel ----
    const dos = an.dos
    const peak = Math.max(1e-9, dos.peak)
    const xDos = (g: number): number => dosX + (g / peak) * dosW
    ctx.beginPath()
    ctx.moveTo(dosX, yE(emin))
    for (let i = 0; i < dos.energies.length; i++) {
      ctx.lineTo(xDos(dos.dos[i]), yE(dos.energies[i]))
    }
    ctx.lineTo(dosX, yE(emax))
    ctx.closePath()
    ctx.fillStyle = 'rgba(34,211,238,0.16)'
    ctx.fill()
    ctx.beginPath()
    let first = true
    for (let i = 0; i < dos.energies.length; i++) {
      const x = xDos(dos.dos[i])
      const y = yE(dos.energies[i])
      if (first) {
        ctx.moveTo(x, y)
        first = false
      } else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = 'rgba(34,211,238,0.85)'
    ctx.lineWidth = 1.4
    ctx.stroke()

    ctx.strokeStyle = 'rgba(148,163,184,0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(dosX, mainTop)
    ctx.lineTo(dosX, mainTop + mainH)
    ctx.stroke()

    ctx.font = `9px ${FONT}`
    ctx.textAlign = 'left'
    ctx.fillStyle = C_TEXT
    ctx.fillText('DOS', dosX + 3, mainTop - 8)
    ctx.textAlign = 'center'
    ctx.fillStyle = C_DIM
    ctx.fillText('0', dosX, mainTop + mainH + 11)
    if (narrow) {
      ctx.fillText(peak.toFixed(1), dosX + dosW, mainTop + mainH + 11)
    } else {
      ctx.fillText(`${peak.toFixed(2)} states/eV·cell`, dosX + dosW / 2, mainTop + mainH + 11)
    }
    ctx.textAlign = 'left'

    // ---- bottom: Fermi surface + readouts ----
    const bottomTop = mainTop + mainH + 24
    const remain = h - bottomTop - 10
    if (remain > 64) {
      const insetH = Math.min(remain - 4, narrow ? 96 : 148, bandW * 0.62)
      const iy0 = bottomTop
      const twoD = p.model === 'square' || p.model === 'honeycomb'
      const insetW = twoD ? insetH : Math.max(120, bandW * 0.68)
      if (twoD) {
        this.drawFermiInset(ctx, mL, iy0, insetW, insetH, an)
      } else {
        this.drawFermiLine(ctx, mL, iy0, insetW, insetH, an)
      }

      const tx = mL + insetW + (narrow ? 10 : 16)
      const tw = w - mR - tx
      if (tw > 80) {
        const lineH = narrow ? 12 : 13
        let ty = iy0 + 9
        const unit = an.mass.ratio > 0 ? `${an.mass.ratio.toFixed(2)} mₑ` : '0 (Dirac)'
        ctx.font = `${narrow ? 8.5 : 9.5}px ${FONT}`
        ctx.fillStyle = C_TEXT
        ctx.fillText(`W ${(an.range.max - an.range.min).toFixed(2)} eV`, tx, ty)
        ctx.fillText(`Eg ${an.gap.toFixed(3)} eV`, tx + tw * 0.42, ty)
        ty += lineH
        ctx.fillText(`E_F ${an.fermi.toFixed(3)} eV`, tx, ty)
        ctx.fillText(`m* ${unit}`, tx + tw * 0.42, ty)
        ty += lineH
        ctx.fillText(`g(E_F) ${an.dosAtFermi.toFixed(2)}`, tx, ty)
        ctx.fillStyle = an.classification.kind === 'metal' || an.classification.kind === 'semimetal'
          ? C_OCC : C_EMPTY
        ctx.fillText(an.classification.label.toUpperCase(), tx + tw * 0.42, ty)
        if ((!narrow || remain > 150) && remain > 96) {
          ty += lineH + 2
          ctx.font = `${narrow ? 8 : 9}px ${FONT}`
          ctx.fillStyle = C_DIM
          const words = an.classification.detail.split(' ')
          let line = ''
          const maxW = tw
          for (const word of words) {
            const test = line ? `${line} ${word}` : word
            if (ctx.measureText(test).width > maxW && line) {
              ctx.fillText(line, tx, ty)
              ty += lineH
              line = word
            } else line = test
          }
          if (line) ctx.fillText(line, tx, ty)
        }
      }
    } else {
      // very short panel: one compact stats line
      ctx.font = `9px ${FONT}`
      ctx.fillStyle = C_TEXT
      ctx.textAlign = 'left'
      ctx.fillText(
        `W ${(an.range.max - an.range.min).toFixed(2)} eV · Eg ${an.gap.toFixed(2)} eV · E_F ${an.fermi.toFixed(3)} eV · ${an.classification.label}`,
        mL, bottomTop,
      )
    }
  }

  /** k-space Fermi surface: BZ outline plus the E(k) = E_F contour. */
  private drawFermiInset(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    wid: number,
    hei: number,
    an: BandAnalysis,
  ): void {
    const p = an.params
    const poly = bzPolygon(p)
    let extent = 0
    for (const pt of poly) extent = Math.max(extent, Math.abs(pt.x), Math.abs(pt.y))
    extent = Math.max(1e-9, extent)
    const size = Math.min(wid, hei)
    const cx = x0 + wid / 2
    const cy = y0 + size / 2
    const scale = (size / 2 - 7) / extent
    const sx = (kx: number): number => cx + kx * scale
    const sy = (ky: number): number => cy - ky * scale

    ctx.strokeStyle = 'rgba(148,163,184,0.30)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < poly.length; i++) {
      const pt = poly[i]
      if (i === 0) ctx.moveTo(sx(pt.x), sy(pt.y))
      else ctx.lineTo(sx(pt.x), sy(pt.y))
    }
    ctx.closePath()
    ctx.stroke()

    // Γ marker
    ctx.strokeStyle = 'rgba(148,163,184,0.22)'
    ctx.beginPath()
    ctx.moveTo(cx - 3, cy)
    ctx.lineTo(cx + 3, cy)
    ctx.moveTo(cx, cy - 3)
    ctx.lineTo(cx, cy + 3)
    ctx.stroke()

    for (const pt of this.contour) {
      ctx.fillStyle = pt.band === 0 ? 'rgba(34,211,238,0.95)' : 'rgba(245,158,11,0.95)'
      ctx.beginPath()
      ctx.arc(sx(pt.kx), sy(pt.ky), 1.05, 0, Math.PI * 2)
      ctx.fill()
    }
    if (this.contour.length === 0) {
      ctx.font = `8px ${FONT}`
      ctx.fillStyle = '#475569'
      ctx.textAlign = 'center'
      ctx.fillText('E_F in gap', cx, cy + 20)
      ctx.fillText('no Fermi surface', cx, cy + 31)
      ctx.textAlign = 'left'
    }

    ctx.font = `8.5px ${FONT}`
    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'left'
    ctx.fillText('Fermi surface · k', x0, y0 + 8)
  }

  /** 1D Fermi “surface”: the two Fermi points on the band axis. */
  private drawFermiLine(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    wid: number,
    hei: number,
    an: BandAnalysis,
  ): void {
    const p = an.params
    const kMax = Math.PI / p.a
    const y = y0 + Math.min(hei * 0.6, 64)
    const x = (kx: number): number => x0 + 6 + ((kx + kMax) / (2 * kMax)) * (wid - 12)
    ctx.strokeStyle = 'rgba(148,163,184,0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x0 + 6, y)
    ctx.lineTo(x0 + wid - 6, y)
    ctx.stroke()
    for (const t of [-kMax, 0, kMax]) {
      ctx.beginPath()
      ctx.moveTo(x(t), y - 3)
      ctx.lineTo(x(t), y + 3)
      ctx.stroke()
    }
    for (const pt of this.contour) {
      ctx.fillStyle = pt.band === 0 ? '#22d3ee' : '#f59e0b'
      ctx.beginPath()
      ctx.arc(x(pt.kx), y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
    if (this.contour.length === 0) {
      ctx.fillStyle = '#475569'
      ctx.font = `8px ${FONT}`
      ctx.textAlign = 'center'
      ctx.fillText('E_F in gap — no Fermi points', x0 + wid / 2, y + 28)
      ctx.textAlign = 'left'
    }
    ctx.font = `8.5px ${FONT}`
    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'left'
    ctx.fillText('Fermi points', x0, y0 + 8)
    ctx.fillStyle = '#475569'
    ctx.fillText('−π/a', x0 + 4, y + 12)
    ctx.textAlign = 'right'
    ctx.fillText('+π/a', x0 + wid - 4, y + 12)
    ctx.textAlign = 'left'
  }

  /* ------------------------------------------------------------------ */

  private teardown(): void {
    cancelAnimationFrame(this.raf)
    this.ready = false
    this.lastSig = ''
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
      this.clearContent()
      this.renderer.dispose()
      if (this.renderer.domElement.parentElement === this) {
        this.removeChild(this.renderer.domElement)
      }
      this.renderer = null
    }
    if (this.overlay && this.overlay.parentElement === this) {
      this.removeChild(this.overlay)
      this.overlay = null
    }
    if (this.pillEl && this.pillEl.parentElement === this) {
      this.removeChild(this.pillEl)
      this.pillEl = null
    }
    if (this.noteEl) {
      if (this.noteEl.parentElement === this) this.removeChild(this.noteEl)
      this.noteEl = null
    }
    this.scene = null
    this.camera = null
  }
}

/** 1 / 2 / 5 × 10ⁿ step for axis ticks. */
function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / pow
  const step = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10
  return step * pow
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-bands')) {
  customElements.define('elementa-bands', ElementaBandsElement)
}
