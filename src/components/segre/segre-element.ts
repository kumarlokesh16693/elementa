import {
  NUCLEI,
  N_MAX,
  Z_MAX,
  nucAt,
  cellColor,
  catColor,
  codeCat,
  symOf,
  formatHl,
  decayLabel,
  daughtersOf,
  type Nuclide,
} from '@/lib/periodic/nuclides'

const MAGIC_N = [2, 8, 20, 28, 50, 82, 126]
const MAGIC_Z = [2, 8, 20, 28, 50, 82]
const S_MIN = 2.4
const S_MAX = 44

interface HoverState {
  nuc: Nuclide
  mx: number
  my: number
}

export class ElementaSegreCanvasElement extends HTMLElement {
  private canvas: HTMLCanvasElement | null = null
  private tooltipEl: HTMLDivElement | null = null
  private controlsEl: HTMLDivElement | null = null
  private ro: ResizeObserver | null = null
  private raf = 0
  private dirty = true
  private fitted = false
  private moved = false

  private cam = { ox: -6, oy: -2, s: 6 }
  private size = { w: 0, h: 0 }
  private hover: HoverState | null = null

  // State
  public mode: 'decay' | 'hl' = 'decay'
  public showMagic = true
  public showPath = true
  public selected: Nuclide | null = null
  public highlightZ: number | null = null

  static get observedAttributes(): string[] {
    return ['data-mode', 'data-magic', 'data-path', 'data-highlight-z', 'data-selected-z', 'data-selected-n']
  }

  connectedCallback(): void {
    if (this.canvas) return
    this.initDOM()
    this.initEvents()
    this.readAttrs()
  }

  disconnectedCallback(): void {
    this.teardown()
  }

  attributeChangedCallback(): void {
    this.readAttrs()
    this.dirty = true
  }

  private readAttrs(): void {
    if (this.hasAttribute('data-mode')) {
      this.mode = (this.getAttribute('data-mode') as 'decay' | 'hl') ?? 'decay'
    }
    if (this.hasAttribute('data-magic')) {
      this.showMagic = this.getAttribute('data-magic') !== 'false'
    }
    if (this.hasAttribute('data-path')) {
      this.showPath = this.getAttribute('data-path') !== 'false'
    }
    if (this.hasAttribute('data-highlight-z')) {
      const hz = this.getAttribute('data-highlight-z')
      this.highlightZ = hz ? Number(hz) : null
    }
    if (this.hasAttribute('data-selected-z') && this.hasAttribute('data-selected-n')) {
      const sz = Number(this.getAttribute('data-selected-z'))
      const sn = Number(this.getAttribute('data-selected-n'))
      this.selected = nucAt(sz, sn) ?? null
    }
  }

  private initDOM(): void {
    this.style.position = 'relative'
    this.style.display = 'block'
    this.style.width = '100%'
    this.style.height = '100%'
    this.style.overflow = 'hidden'

    const canvas = document.createElement('canvas')
    canvas.className = 'absolute inset-0 h-full w-full cursor-crosshair touch-none'
    this.appendChild(canvas)
    this.canvas = canvas

    const tip = document.createElement('div')
    tip.className = 'pointer-events-none absolute z-20 hidden rounded-md border border-white/15 bg-[#0d1322]/95 px-2.5 py-1.5 font-mono text-[10.5px] leading-snug text-zinc-200 shadow-xl backdrop-blur'
    this.appendChild(tip)
    this.tooltipEl = tip

    // Zoom buttons
    const ctrl = document.createElement('div')
    ctrl.className = 'absolute bottom-3 left-3 z-10 flex flex-col gap-1.5'
    ctrl.innerHTML = `
      <button type="button" aria-label="Zoom in" class="h-8 w-8 rounded-md border border-white/15 bg-[#0d1322]/90 text-[15px] text-zinc-300 transition hover:border-white/35 hover:text-white">+</button>
      <button type="button" aria-label="Zoom out" class="h-8 w-8 rounded-md border border-white/15 bg-[#0d1322]/90 text-[15px] text-zinc-300 transition hover:border-white/35 hover:text-white">−</button>
      <button type="button" aria-label="Fit whole chart" class="h-8 w-8 rounded-md border border-white/15 bg-[#0d1322]/90 text-[11px] text-zinc-300 transition hover:border-white/35 hover:text-white">⤢</button>
    `
    const [btnIn, btnOut, btnFit] = ctrl.querySelectorAll('button')
    btnIn.onclick = () => {
      const { w, h } = this.size
      this.zoomAt(w / 2, h / 2, 1.3)
    }
    btnOut.onclick = () => {
      const { w, h } = this.size
      this.zoomAt(w / 2, h / 2, 1 / 1.3)
    }
    btnFit.onclick = () => this.fit()

    this.appendChild(ctrl)
    this.controlsEl = ctrl
  }

  public zoomAt(mx: number, my: number, factor: number): void {
    const { w, h } = this.size
    if (!w || !h) return
    const cam = this.cam
    const wx = cam.ox + mx / cam.s
    const wy = cam.oy + my / cam.s
    const s2 = Math.min(S_MAX, Math.max(S_MIN, cam.s * factor))
    cam.s = s2
    cam.ox = wx - mx / s2
    cam.oy = wy - my / s2
    this.dirty = true
  }

  public fit(): void {
    const { w, h } = this.size
    if (!w || !h) return
    const s = Math.min(S_MAX, Math.max(S_MIN, Math.min(w / (N_MAX + 9), h / (Z_MAX + 7))))
    this.cam.s = s
    this.cam.ox = -7 + (N_MAX + 8.5 - w / s) / 2
    this.cam.oy = -2 + (Z_MAX + 5 - h / s) / 2
    this.dirty = true
  }

  public centerOn(z: number, n: number): void {
    const { w, h } = this.size
    if (!w || !h) return
    const cam = this.cam
    if (cam.s < 14) cam.s = 20
    cam.ox = n + 0.5 - w / (2 * cam.s)
    cam.oy = Z_MAX - z + 0.5 - h / (2 * cam.s)
    this.dirty = true
  }

  private initEvents(): void {
    const canvas = this.canvas
    if (!canvas) return

    this.ro = new ResizeObserver(() => {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      const w = this.clientWidth
      const h = this.clientHeight
      if (!w || !h) return
      this.size = { w, h }
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      if (!this.fitted) {
        this.fitted = true
        this.fit()
        if (this.selected) this.centerOn(this.selected.z, this.selected.n)
      }
      this.dirty = true
    })
    this.ro.observe(this)

    // Wheel zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = canvas.getBoundingClientRect()
      this.zoomAt(e.clientX - r.left, e.clientY - r.top, Math.pow(1.0016, -e.deltaY))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Pointer events
    const pointers = new Map<number, { x: number; y: number }>()
    let pinchDist = 0
    let downAt: { x: number; y: number } | null = null

    const cellAt = (mx: number, my: number): Nuclide | null => {
      const cam = this.cam
      const n = Math.floor(cam.ox + mx / cam.s)
      const z = Z_MAX - Math.floor(cam.oy + my / cam.s)
      return nucAt(z, n) ?? null
    }

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      downAt = { x: e.clientX, y: e.clientY }
      this.moved = false
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const mx = e.clientX - r.left
      const my = e.clientY - r.top

      if (!pointers.has(e.pointerId)) {
        const nuc = cellAt(mx, my)
        this.hover = nuc ? { nuc, mx, my } : null
        this.updateTooltip()
        this.dirty = true
        return
      }

      const prev = pointers.get(e.pointerId)!
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) {
        this.moved = true
      }

      const cam = this.cam
      if (pointers.size === 1) {
        cam.ox -= (e.clientX - prev.x) / cam.s
        cam.oy -= (e.clientY - prev.y) / cam.s
        this.dirty = true
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinchDist > 0) {
          this.zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / pinchDist)
        }
        pinchDist = d
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (pointers.size < 2) pinchDist = 0
      if (!this.moved && e.button === 0) {
        const r = canvas.getBoundingClientRect()
        const targetNuc = cellAt(e.clientX - r.left, e.clientY - r.top)
        this.dispatchEvent(
          new CustomEvent('select-nuclide', {
            bubbles: true,
            composed: true,
            detail: { nuclide: targetNuc },
          }),
        )
      }
      downAt = null
    }

    const onPointerLeave = () => {
      if (pointers.size === 0) {
        this.hover = null
        this.updateTooltip()
        this.dirty = true
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)

    const loop = () => {
      if (this.dirty) {
        this.dirty = false
        this.draw()
      }
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  private updateTooltip(): void {
    if (!this.tooltipEl) return
    const h = this.hover
    if (!h) {
      this.tooltipEl.classList.add('hidden')
      return
    }

    this.tooltipEl.classList.remove('hidden')
    const tipLeft = Math.min(h.mx + 14, this.size.w - 200)
    const tipTop = Math.min(h.my + 14, this.size.h - 96)
    this.tooltipEl.style.left = `${tipLeft}px`
    this.tooltipEl.style.top = `${tipTop}px`

    const decayInfo = h.nuc.decays[0]
      ? `${decayLabel(h.nuc.decays[0].code)}${h.nuc.decays[0].pct != null ? ` ${h.nuc.decays[0].pct}%` : ''}`
      : h.nuc.stable && h.nuc.abundance != null
        ? `${h.nuc.abundance}% nat. abundance`
        : '—'

    this.tooltipEl.innerHTML = `
      <div class="text-[12px] font-bold text-zinc-50">
        ${h.nuc.sym}-${h.nuc.a}
        <span class="ml-2 font-normal text-zinc-500">Z ${h.nuc.z} · N ${h.nuc.n}</span>
      </div>
      <div class="text-amber-300/90">${formatHl(h.nuc)}</div>
      <div class="text-zinc-400">${decayInfo}</div>
    `
  }

  private draw(): void {
    const canvas = this.canvas
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { w, h } = this.size
    if (!w || !h) return
    const dpr = canvas.width / w
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#070a10'
    ctx.fillRect(0, 0, w, h)

    const cam = this.cam
    const s = cam.s
    const sx = (wx: number) => (wx - cam.ox) * s
    const sy = (wy: number) => (wy - cam.oy) * s
    const x0 = cam.ox
    const x1 = cam.ox + w / s
    const y0 = cam.oy
    const y1 = cam.oy + h / s
    const gap = Math.max(0.5, s * 0.09)

    // Magic number lines
    if (this.showMagic) {
      ctx.save()
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(255,255,255,0.09)'
      ctx.lineWidth = 1
      for (const n of MAGIC_N) {
        const x = sx(n + 0.5)
        if (x < -40 || x > w + 40) continue
        ctx.beginPath()
        ctx.moveTo(x, sy(0))
        ctx.lineTo(x, sy(Z_MAX))
        ctx.stroke()
      }
      for (const z of MAGIC_Z) {
        const y = sy(Z_MAX - z)
        if (y < -40 || y > h + 40) continue
        ctx.beginPath()
        ctx.moveTo(sx(0), y)
        ctx.lineTo(sx(N_MAX + 1), y)
        ctx.stroke()
      }
      ctx.restore()
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.34)'
      for (const n of MAGIC_N) {
        const x = sx(n + 0.5)
        if (x < -40 || x > w + 40) continue
        ctx.fillText(`N=${n}`, x + 4, sy(0) + 12)
      }
      for (const z of MAGIC_Z) {
        const y = sy(Z_MAX - z)
        if (y < -40 || y > h + 40) continue
        ctx.fillText(`Z=${z}`, sx(0) + 4, y + 12)
      }
    }

    // Highlight row band
    if (this.highlightZ != null) {
      const y = sy(Z_MAX - this.highlightZ)
      ctx.fillStyle = 'rgba(251,191,36,0.10)'
      ctx.fillRect(sx(0), y, (N_MAX + 1.5) * s, s)
      ctx.strokeStyle = 'rgba(251,191,36,0.5)'
      ctx.lineWidth = 1
      ctx.strokeRect(sx(0) + 0.5, y + 0.5, (N_MAX + 1.5) * s - 1, s - 1)
    }

    // Nuclide cells
    for (const nu of NUCLEI) {
      const x = nu.n
      const y = Z_MAX - nu.z
      if (x + 1 < x0 || x > x1 || y + 1 < y0 || y > y1) continue
      ctx.fillStyle = cellColor(nu, this.mode)
      ctx.fillRect(sx(x) + gap, sy(y) + gap, s - 2 * gap, s - 2 * gap)
      if (nu.stable && this.mode === 'hl') {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth = 1
        ctx.strokeRect(sx(x) + gap + 0.5, sy(y) + gap + 0.5, s - 2 * gap - 1, s - 2 * gap - 1)
      }
      if (nu.unbound && s >= 13) {
        ctx.fillStyle = 'rgba(255,255,255,0.38)'
        ctx.font = `${Math.round(s * 0.55)}px ui-sans-serif, sans-serif`
        ctx.fillText('?', sx(x) + s / 2 - s * 0.14, sy(y) + s / 2 + s * 0.2)
      }
    }

    // Decay path arrows
    const sel = this.selected
    if (sel && this.showPath) {
      for (const d of daughtersOf(sel)) {
        const x1c = sx(sel.n + 0.5)
        const y1c = sy(Z_MAX - sel.z + 0.5)
        const x2c = sx(d.nuclide.n + 0.5)
        const y2c = sy(Z_MAX - d.nuclide.z + 0.5)
        const color = catColor(codeCat(d.code))
        ctx.strokeStyle = color
        ctx.fillStyle = color
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.9
        ctx.beginPath()
        ctx.moveTo(x1c, y1c)
        ctx.lineTo(x2c, y2c)
        ctx.stroke()

        const t = 0.78
        const ax = x1c + (x2c - x1c) * t
        const ay = y1c + (y2c - y1c) * t
        const ang = Math.atan2(y2c - y1c, x2c - x1c)
        const ah = Math.max(6, Math.min(11, s * 0.5))
        ctx.beginPath()
        ctx.moveTo(ax + Math.cos(ang) * ah, ay + Math.sin(ang) * ah)
        ctx.lineTo(ax + Math.cos(ang + 2.5) * ah, ay + Math.sin(ang + 2.5) * ah)
        ctx.lineTo(ax + Math.cos(ang - 2.5) * ah, ay + Math.sin(ang - 2.5) * ah)
        ctx.closePath()
        ctx.fill()

        if (s >= 10) {
          ctx.globalAlpha = 1
          ctx.font = '10.5px ui-sans-serif, sans-serif'
          const mx = (x1c + x2c) / 2
          const my = (y1c + y2c) / 2
          const label = d.label
          ctx.strokeStyle = '#070a10'
          ctx.lineWidth = 3
          ctx.strokeText(label, mx + 5, my - 4)
          ctx.fillText(label, mx + 5, my - 4)
        }
        ctx.globalAlpha = 1
      }
    }

    // Selection & hover markers
    const mark = (nu: Nuclide, stroke: string, lw: number, pad: number) => {
      ctx.strokeStyle = stroke
      ctx.lineWidth = lw
      ctx.strokeRect(sx(nu.n) - pad, sy(Z_MAX - nu.z) - pad, s + 2 * pad, s + 2 * pad)
    }
    if (sel) {
      mark(sel, 'rgba(251,191,36,0.4)', 5, 1.5)
      mark(sel, '#fbbf24', 1.5, 1.5)
    }
    if (this.hover && (!sel || this.hover.nuc !== sel)) {
      mark(this.hover.nuc, 'rgba(255,255,255,0.75)', 1.25, 1)
    }

    // Axes
    const zEvery = s >= 17 ? 1 : s >= 9 ? 2 : s >= 4.5 ? 5 : 10
    const nEvery = s >= 17 ? 5 : s >= 8 ? 10 : 20
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '10.5px ui-monospace, monospace'
    for (let z = 0; z <= Z_MAX; z += zEvery) {
      const y = sy(Z_MAX - z)
      if (y < -20 || y > h + 20) continue
      const label = s >= 22 ? `${z} ${symOf(z)}` : `${z}`
      ctx.textAlign = 'right'
      ctx.fillText(label, sx(-1.6), y + 3.5)
    }
    ctx.textAlign = 'center'
    for (let n = 0; n <= N_MAX + 10; n += nEvery) {
      const x = sx(n + 0.5)
      if (x < -20 || x > w + 20) continue
      ctx.fillText(`${n}`, x, sy(Z_MAX) + 16)
    }
    ctx.textAlign = 'left'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillText('N →', sx(N_MAX + 1) - 34, sy(Z_MAX) + 16)
    ctx.fillText('Z ↑', sx(-4.6), sy(-0.4) + 12)
    ctx.textAlign = 'start'
  }

  private teardown(): void {
    cancelAnimationFrame(this.raf)
    if (this.ro) {
      this.ro.disconnect()
      this.ro = null
    }
    this.canvas = null
    this.tooltipEl = null
    this.controlsEl = null
    if (this.childNodes.length > 0) this.replaceChildren()
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-segre-canvas')) {
  customElements.define('elementa-segre-canvas', ElementaSegreCanvasElement)
}
