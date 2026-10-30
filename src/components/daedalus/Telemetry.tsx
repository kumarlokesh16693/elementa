'use client'

import { useEffect, useRef } from 'react'
import { useSim } from './SimProvider'
import { HEAT_GRADIENT_CSS } from '@/lib/sim/constants'
import type { SimEngine } from '@/lib/sim/engine'

/* ---------------- heat flux color bar ---------------- */

export function ColorBar() {
  const { ui } = useSim()
  const ticks = 5
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 w-56 rounded border border-white/10 bg-black/55 p-2 backdrop-blur-sm">
      <div className="mb-1 flex items-center justify-between font-mono text-[9px] tracking-widest text-zinc-400">
        <span>STAGNATION HEAT FLUX</span>
        <span className="text-amber-400">W/cm²</span>
      </div>
      <div className="h-2 w-full rounded-sm" style={{ background: HEAT_GRADIENT_CSS }} />
      <div className="mt-0.5 flex justify-between font-mono text-[8px] text-zinc-500">
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const val = (ui.colorScaleMax * i) / ticks
          return (
            <span key={i} className="translate-x-0 first:-translate-x-0">
              {val >= 100 ? val.toFixed(0) : val.toFixed(0)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- strip charts ---------------- */

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

function StripChart({
  def,
  version,
  engine,
}: {
  def: ChartDef
  version: number
  engine: SimEngine
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    const w = cv.clientWidth
    const h = cv.clientHeight
    if (cv.width !== w * dpr || cv.height !== h * dpr) {
      cv.width = w * dpr
      cv.height = h * dpr
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

    // sample history down to ~180 points
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

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      const y = padY + (plotH * i) / 3
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + plotW, y)
      ctx.stroke()
    }

    // area fill
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

    // line
    ctx.beginPath()
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.strokeStyle = def.color
    ctx.lineWidth = 1.4
    ctx.stroke()

    // labels
    ctx.font = '9px ui-monospace, monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText(def.label, padL + 3, padY + 9)
    ctx.fillStyle = def.color
    ctx.textAlign = 'right'
    ctx.fillText(
      `${curVal >= 100 ? curVal.toFixed(0) : curVal.toFixed(curVal >= 10 ? 1 : 2)} ${def.unit}`,
      w - 3,
      padY + 9
    )
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = '8px ui-monospace, monospace'
    ctx.fillText(`${max.toFixed(0)}`, w - 30, h - 3)
    ctx.fillText(`${min.toFixed(0)}`, w - 30, 10)
  }, [version, def, engine])

  return <canvas ref={ref} className="h-full w-full" />
}

export function TelemetryCharts() {
  const { version, engine } = useSim()

  return (
    <div className="absolute bottom-3 right-3 hidden w-[300px] rounded border border-white/10 bg-black/55 p-2 backdrop-blur-sm sm:block sm:w-[360px]">
      <div className="mb-1 font-mono text-[9px] tracking-widest text-zinc-400">
        TELEMETRY HISTORY
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-[54px]">
          <StripChart def={CHARTS[0]} version={version} engine={engine} />
        </div>
        <div className="h-[54px]">
          <StripChart def={CHARTS[1]} version={version} engine={engine} />
        </div>
        <div className="h-[54px]">
          <StripChart def={CHARTS[2]} version={version} engine={engine} />
        </div>
      </div>
    </div>
  )
}
