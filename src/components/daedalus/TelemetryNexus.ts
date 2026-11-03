import type { SimEngine } from '@/lib/sim/engine'
import { HEAT_GRADIENT_CSS } from '@/lib/sim/constants'

type ChartDef = {
  key: string
  label: string
  unit: string
  color: string
  get: (h: { h: number; heat: number; v: number; g: number }) => number
  scale: number
}

const CHARTS: ChartDef[] = [
  {
    key: 'alt',
    label: 'ALTITUDE',
    unit: 'km',
    color: '#67e8f9',
    get: (p) => p.h / 1000,
    scale: 1,
  },
  {
    key: 'heat',
    label: 'HEAT FLUX',
    unit: 'W/cm²',
    color: '#fb923c',
    get: (p) => p.heat,
    scale: 1,
  },
  {
    key: 'vel',
    label: 'VELOCITY',
    unit: 'km/s',
    color: '#a3e635',
    get: (p) => p.v / 1000,
    scale: 1,
  },
]

export function createColorBar(container: HTMLElement, engine: SimEngine) {
  const el = document.createElement('div')
  el.className = 'pointer-events-none absolute bottom-3 left-3 w-56 rounded border border-white/10 bg-black/55 p-2 backdrop-blur-sm select-none'

  const ticks = 5
  el.innerHTML = `
    <div class="mb-1 flex items-center justify-between font-mono text-[9px] tracking-widest text-zinc-400">
      <span>STAGNATION HEAT FLUX</span>
      <span class="text-amber-400">W/cm²</span>
    </div>
    <div class="h-2 w-full rounded-sm" style="background: ${HEAT_GRADIENT_CSS}"></div>
    <div class="mt-0.5 flex justify-between font-mono text-[8px] text-zinc-500" id="ticks-row"></div>
  `

  const ticksRow = el.querySelector('#ticks-row') as HTMLDivElement

  const update = () => {
    ticksRow.innerHTML = Array.from({ length: ticks + 1 }, (_, i) => {
      const val = (engine.ui.colorScaleMax * i) / ticks
      return `<span>${val.toFixed(0)}</span>`
    }).join('')
  }
  update()

  const unsubscribe = engine.subscribe(update)
  container.appendChild(el)

  return {
    dispose: () => {
      unsubscribe()
      el.remove()
    },
  }
}

export function createTelemetryCharts(container: HTMLElement, engine: SimEngine) {
  const root = document.createElement('div')
  root.className = 'absolute bottom-3 right-3 hidden w-[300px] rounded border border-white/10 bg-black/55 p-2 backdrop-blur-sm sm:block sm:w-[360px] select-none'
  root.innerHTML = `
    <div class="mb-1 font-mono text-[9px] tracking-widest text-zinc-400">TELEMETRY HISTORY</div>
    <div class="flex flex-col gap-1.5" id="charts-wrap"></div>
  `

  const chartsWrap = root.querySelector('#charts-wrap') as HTMLDivElement
  const canvases: { cv: HTMLCanvasElement; def: ChartDef }[] = []

  CHARTS.forEach((def) => {
    const wrap = document.createElement('div')
    wrap.className = 'h-[54px]'
    const cv = document.createElement('canvas')
    cv.className = 'h-full w-full'
    wrap.appendChild(cv)
    chartsWrap.appendChild(wrap)
    canvases.push({ cv, def })
  })

  const drawChart = (cv: HTMLCanvasElement, def: ChartDef) => {
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = cv.clientWidth || 340
    const h = cv.clientHeight || 54
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const hist = engine.history
    if (hist.length < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.font = '9px ui-monospace, monospace'
      ctx.fillText('AWAITING DATA…', 6, h / 2)
      return
    }

    const N = 180
    const stride = Math.max(1, Math.floor(hist.length / N))
    const pts: Array<{ x: number; y: number; val: number }> = []
    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < hist.length; i += stride) {
      const val = def.get(hist[i]) * def.scale
      if (val < min) min = val
      if (val > max) max = val
      pts.push({ x: 0, y: 0, val })
    }
    const lastPt = hist[hist.length - 1]
    const curVal = def.get(lastPt) * def.scale
    if (curVal < min) min = curVal
    if (curVal > max) max = curVal
    if (max - min < 1e-9) max = min + 1
    const pad = (max - min) * 0.12
    min -= pad
    max += pad

    const padL = 2
    const padR = 34
    const padY = 4
    const plotW = w - padL - padR
    const plotH = h - padY * 2
    pts.forEach((p, i) => {
      p.x = padL + (plotW * i) / (pts.length - 1)
      p.y = padY + plotH * (1 - (p.val - min) / (max - min))
    })

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      const y = padY + (plotH * i) / 3
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
      ctx.stroke()
    }

    // Area fill
    const grad = ctx.createLinearGradient(0, padY, 0, padY + plotH)
    grad.addColorStop(0, def.color + '40')
    grad.addColorStop(1, def.color + '00')
    ctx.beginPath()
    ctx.moveTo(pts[0].x, padY + plotH)
    pts.forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, padY + plotH)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.strokeStyle = def.color
    ctx.lineWidth = 1.4
    ctx.stroke()

    // Labels
    ctx.font = '9px ui-monospace, monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText(def.label, padL + 3, padY + 9)
    ctx.fillStyle = def.color
    ctx.textAlign = 'right'
    ctx.fillText(
      `${curVal >= 100 ? curVal.toFixed(0) : curVal.toFixed(curVal >= 10 ? 1 : 2)} ${def.unit}`,
      w - 3,
      padY + 9,
    )
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = '8px ui-monospace, monospace'
    ctx.fillText(`${max.toFixed(0)}`, w - 30, h - 3)
    ctx.fillText(`${min.toFixed(0)}`, w - 30, 10)
  }

  let rafId = 0
  let lastDraw = 0
  const loop = (now: number) => {
    rafId = requestAnimationFrame(loop)
    if (now - lastDraw > 80) {
      lastDraw = now
      canvases.forEach(({ cv, def }) => drawChart(cv, def))
    }
  }
  rafId = requestAnimationFrame(loop)

  container.appendChild(root)

  return {
    dispose: () => {
      cancelAnimationFrame(rafId)
      root.remove()
    },
  }
}
