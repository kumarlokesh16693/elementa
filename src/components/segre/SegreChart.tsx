'use client'

// Segrè chart — interactive canvas rendering of ~3400 ground-state nuclides.
// Camera pan/zoom, decay-mode & half-life coloring, magic-number lines, hover
// tooltip, click-select, decay-path arrows to daughter nuclides.
//
// DPR note (learned from the Bohr3D bug): the canvas buffer is sized to
// clientWidth×dpr but its CSS box is pinned to absolute inset-0 100%×100%
// inside a relative overflow-hidden container; all overlay controls sit above
// it at z-10 so they are never covered.

import { useEffect, useRef, useState } from 'react'
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

export interface FocusTarget {
  z: number
  n: number
  /** increment to re-trigger centering */
  key: number
}

interface Props {
  mode: 'decay' | 'hl'
  showMagic: boolean
  showPath: boolean
  selected: Nuclide | null
  onSelect: (n: Nuclide | null) => void
  highlightZ: number | null
  focus: FocusTarget | null
}

interface HoverState {
  nuc: Nuclide
  mx: number
  my: number
}

export default function SegreChart({
  mode,
  showMagic,
  showPath,
  selected,
  onSelect,
  highlightZ,
  focus,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camRef = useRef({ ox: -6, oy: -2, s: 6 })
  const sizeRef = useRef({ w: 0, h: 0 })
  const dirtyRef = useRef(true)
  const fittedRef = useRef(false)
  const movedRef = useRef(false)
  const hoverRef = useRef<HoverState | null>(null)
  const [hover, setHover] = useState<HoverState | null>(null)
  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 })
  const stateRef = useRef({ mode, showMagic, showPath, selected, highlightZ })
  const focusRef = useRef<FocusTarget | null>(focus)

  /* ------- camera helpers (need live size) ------- */
  const zoomAt = (mx: number, my: number, factor: number) => {
    const { w, h } = sizeRef.current
    if (!w || !h) return
    const cam = camRef.current
    const wx = cam.ox + mx / cam.s
    const wy = cam.oy + my / cam.s
    const s2 = Math.min(S_MAX, Math.max(S_MIN, cam.s * factor))
    cam.s = s2
    cam.ox = wx - mx / s2
    cam.oy = wy - my / s2
    dirtyRef.current = true
  }

  const fit = () => {
    const { w, h } = sizeRef.current
    if (!w || !h) return
    const s = Math.min(S_MAX, Math.max(S_MIN, Math.min(w / (N_MAX + 9), h / (Z_MAX + 7))))
    camRef.current.s = s
    camRef.current.ox = -7 + (N_MAX + 8.5 - w / s) / 2
    camRef.current.oy = -2 + (Z_MAX + 5 - h / s) / 2
    dirtyRef.current = true
  }

  const centerOn = (z: number, n: number) => {
    const { w, h } = sizeRef.current
    if (!w || !h) return
    const cam = camRef.current
    if (cam.s < 14) cam.s = 20
    cam.ox = n + 0.5 - w / (2 * cam.s)
    cam.oy = Z_MAX - z + 0.5 - h / (2 * cam.s)
    dirtyRef.current = true
  }

  /* ------- effects ------- */

  // initial fit + resize handling
  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (!w || !h) return
      sizeRef.current = { w, h }
      setWrapSize({ w, h })
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      if (!fittedRef.current) {
        fittedRef.current = true
        fit()
        // a focus request made before the canvas had a size (e.g. URL deep link)
        if (focusRef.current) centerOn(focusRef.current.z, focusRef.current.n)
      }
      dirtyRef.current = true
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  // external focus request (canvas already sized at this point)
  useEffect(() => {
    if (!focus) return
    centerOn(focus.z, focus.n)
  }, [focus?.key])

  // sync props for the canvas draw loop + redraw on change
  useEffect(() => {
    stateRef.current = { mode, showMagic, showPath, selected, highlightZ }
    dirtyRef.current = true
  }, [mode, showMagic, showPath, selected, highlightZ])

  useEffect(() => {
    focusRef.current = focus
  }, [focus])

  // main render loop + input
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const draw = () => {
      const { w, h } = sizeRef.current
      if (!w || !h) return
      const dpr = canvas.width / w
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#070a10'
      ctx.fillRect(0, 0, w, h)

      const st = stateRef.current
      const cam = camRef.current
      const s = cam.s
      const sx = (wx: number) => (wx - cam.ox) * s
      const sy = (wy: number) => (wy - cam.oy) * s
      const x0 = cam.ox
      const x1 = cam.ox + w / s
      const y0 = cam.oy
      const y1 = cam.oy + h / s
      const gap = Math.max(0.5, s * 0.09)

      /* magic number lines */
      if (st.showMagic) {
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

      /* highlight row band (element search) */
      if (st.highlightZ != null) {
        const y = sy(Z_MAX - st.highlightZ)
        ctx.fillStyle = 'rgba(251,191,36,0.10)'
        ctx.fillRect(sx(0), y, (N_MAX + 1.5) * s, s)
        ctx.strokeStyle = 'rgba(251,191,36,0.5)'
        ctx.lineWidth = 1
        ctx.strokeRect(sx(0) + 0.5, y + 0.5, (N_MAX + 1.5) * s - 1, s - 1)
      }

      /* nuclide cells */
      for (const nu of NUCLEI) {
        const x = nu.n
        const y = Z_MAX - nu.z
        if (x + 1 < x0 || x > x1 || y + 1 < y0 || y > y1) continue
        ctx.fillStyle = cellColor(nu, st.mode)
        ctx.fillRect(sx(x) + gap, sy(y) + gap, s - 2 * gap, s - 2 * gap)
        if (nu.stable && st.mode === 'hl') {
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

      /* decay path arrows */
      const sel = st.selected
      if (sel && st.showPath) {
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
          // arrowhead at 78% of the way
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

      /* selection & hover markers */
      const mark = (nu: Nuclide, stroke: string, lw: number, pad: number) => {
        ctx.strokeStyle = stroke
        ctx.lineWidth = lw
        ctx.strokeRect(sx(nu.n) - pad, sy(Z_MAX - nu.z) - pad, s + 2 * pad, s + 2 * pad)
      }
      if (sel) {
        mark(sel, 'rgba(251,191,36,0.4)', 5, 1.5)
        mark(sel, '#fbbf24', 1.5, 1.5)
      }
      const hv = hoverRef.current
      if (hv && (!sel || hv.nuc !== sel)) mark(hv.nuc, 'rgba(255,255,255,0.75)', 1.25, 1)

      /* axes */
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

    let raf = 0
    const loop = () => {
      if (dirtyRef.current) {
        dirtyRef.current = false
        draw()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    /* input: wheel zoom (non-passive) */
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = canvas.getBoundingClientRect()
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.pow(1.0016, -e.deltaY))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })

    /* input: pointer pan / pinch / click-select / hover */
    const pointers = new Map<number, { x: number; y: number }>()
    let pinchDist = 0
    let downAt: { x: number; y: number } | null = null

    const cellAt = (mx: number, my: number): Nuclide | null => {
      const cam = camRef.current
      const n = Math.floor(cam.ox + mx / cam.s)
      const z = Z_MAX - Math.floor(cam.oy + my / cam.s)
      return nucAt(z, n) ?? null
    }

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      downAt = { x: e.clientX, y: e.clientY }
      movedRef.current = false
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
        // pure hover — update marker ref and tooltip position
        const nuc = cellAt(mx, my)
        hoverRef.current = nuc ? { nuc, mx, my } : null
        setHover(hoverRef.current)
        dirtyRef.current = true
        return
      }
      const prev = pointers.get(e.pointerId)!
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) movedRef.current = true
      const cam = camRef.current
      if (pointers.size === 1) {
        cam.ox -= (e.clientX - prev.x) / cam.s
        cam.oy -= (e.clientY - prev.y) / cam.s
        dirtyRef.current = true
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinchDist > 0) zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / pinchDist)
        pinchDist = d
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (pointers.size < 2) pinchDist = 0
      if (!movedRef.current && e.button === 0) {
        const r = canvas.getBoundingClientRect()
        onSelect(cellAt(e.clientX - r.left, e.clientY - r.top))
      }
      downAt = null
    }
    const onPointerLeave = () => {
      if (pointers.size === 0) {
        hoverRef.current = null
        setHover(null)
        dirtyRef.current = true
      }
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  const tipLeft = hover ? Math.min(hover.mx + 14, wrapSize.w - 200) : 0
  const tipTop = hover ? Math.min(hover.my + 14, wrapSize.h - 96) : 0

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden" data-testid="segre-canvas">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-crosshair touch-none" />
      {hover && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-white/15 bg-[#0d1322]/95 px-2.5 py-1.5 font-mono text-[10.5px] leading-snug text-zinc-200 shadow-xl backdrop-blur"
          style={{ left: tipLeft, top: tipTop }}
        >
          <div className="text-[12px] font-bold text-zinc-50">
            {hover.nuc.sym}-{hover.nuc.a}
            <span className="ml-2 font-normal text-zinc-500">
              Z {hover.nuc.z} · N {hover.nuc.n}
            </span>
          </div>
          <div className="text-amber-300/90">{formatHl(hover.nuc)}</div>
          <div className="text-zinc-400">
            {hover.nuc.decays[0]
              ? `${decayLabel(hover.nuc.decays[0].code)}${hover.nuc.decays[0].pct != null ? ` ${hover.nuc.decays[0].pct}%` : ''}`
              : hover.nuc.stable && hover.nuc.abundance != null
                ? `${hover.nuc.abundance}% nat. abundance`
                : '—'}
          </div>
        </div>
      )}
      {/* zoom controls — above canvas (DPR lesson: keep interactive overlays at z-10+) */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => {
            const { w, h } = sizeRef.current
            zoomAt(w / 2, h / 2, 1.3)
          }}
          className="h-8 w-8 rounded-md border border-white/15 bg-[#0d1322]/90 text-[15px] text-zinc-300 transition hover:border-white/35 hover:text-white"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => {
            const { w, h } = sizeRef.current
            zoomAt(w / 2, h / 2, 1 / 1.3)
          }}
          className="h-8 w-8 rounded-md border border-white/15 bg-[#0d1322]/90 text-[15px] text-zinc-300 transition hover:border-white/35 hover:text-white"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Fit whole chart"
          onClick={fit}
          className="h-8 w-8 rounded-md border border-white/15 bg-[#0d1322]/90 text-[11px] text-zinc-300 transition hover:border-white/35 hover:text-white"
        >
          ⤢
        </button>
      </div>
    </div>
  )
}
