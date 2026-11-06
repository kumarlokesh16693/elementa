/**
 * Xenon-135 Poisoning Transient & Iodine Pit Plot
 * Illustrates reactor post-shutdown negative reactivity buildup,
 * peak poisoning (at ~9-11 hours), and the physics trap behind Chernobyl.
 */

import { h, type VNode } from 'nexus-framework'
import { LAMBDA_I135, LAMBDA_XE135, NOMINAL_THERMAL_FLUX, SIGMA_A_XE135 } from '@/lib/reactor/physics'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function XenonPitPlot({
  currentFlux,
  simTimeHours = 0,
}: {
  currentFlux: number
  simTimeHours?: number
}): VNode {
  const canvasId = 'xenon-pit-canvas'

  setTimeout(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#090d16'
    ctx.fillRect(0, 0, w, h)

    const padL = 65
    const padR = 30
    const padT = 30
    const padB = 45
    const plotW = w - padL - padR
    const plotH = h - padT - padB

    // Transient simulation for 48 hours post-trip from 100% steady state
    // [I](t) = I_0 * exp(-lambda_I * t)
    // [Xe](t) = Xe_0 * exp(-lambda_Xe * t) + I_0 * (lambda_I / (lambda_Xe - lambda_I)) * (exp(-lambda_I * t) - exp(-lambda_Xe * t))
    const hoursTotal = 48
    const points: { tHours: number; iPct: number; xePct: number; rhoPcm: number }[] = []

    const I0 = 100.0 // 100% equilibrium at rated power
    // Steady state Xe relative: production = destruction
    const Xe0 = 100.0

    let maxXe = 0
    let maxXeHour = 0

    for (let hr = 0; hr <= hoursTotal; hr += 0.25) {
      const tSec = hr * 3600
      const iPct = I0 * Math.exp(-LAMBDA_I135 * tSec)

      // Post-shutdown burnout is 0 because flux = 0
      const termXe = Xe0 * Math.exp(-LAMBDA_XE135 * tSec)
      const termI = I0 * (LAMBDA_I135 / (LAMBDA_XE135 - LAMBDA_I135)) *
        (Math.exp(-LAMBDA_I135 * tSec) - Math.exp(-LAMBDA_XE135 * tSec))
      const xePct = Math.max(0, termXe + termI)
      const rhoPcm = -(xePct / 100) * 2800

      if (xePct > maxXe) {
        maxXe = xePct
        maxXeHour = hr
      }
      points.push({ tHours: hr, iPct, xePct, rhoPcm })
    }

    const tToX = (t: number) => padL + plotW * (t / hoursTotal)
    const xeToY = (pct: number) => padT + plotH * (1 - pct / (maxXe * 1.15))

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1

    for (let pct = 0; pct <= maxXe * 1.1; pct += 50) {
      const y = xeToY(pct)
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(w - padR, y)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${pct.toFixed(0)}%`, padL - 8, y + 3)
    }

    for (let hr = 0; hr <= hoursTotal; hr += 6) {
      const x = tToX(hr)
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, h - padB)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${hr}h`, x, h - padB + 16)
    }

    // 100% steady state dashed reference line
    const y100 = xeToY(100)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(padL, y100)
    ctx.lineTo(w - padR, y100)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#94a3b8'
    ctx.font = '9.5px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('100% Steady-State Equilibrium', padL + 8, y100 - 6)

    // Iodine-135 decay curve (Violet / Purple)
    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 2
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = tToX(p.tHours)
      const y = xeToY(p.iPct)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Xenon-135 transient curve (Bright Amber / Red)
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 3
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = tToX(p.tHours)
      const y = xeToY(p.xePct)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Shaded Xenon Pit Area
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)'
    ctx.beginPath()
    ctx.moveTo(tToX(0), y100)
    points.forEach((p) => {
      if (p.xePct >= 100) {
        ctx.lineTo(tToX(p.tHours), xeToY(p.xePct))
      }
    })
    const endPoint = points.find((p) => p.tHours > 10 && p.xePct <= 100)
    if (endPoint) {
      ctx.lineTo(tToX(endPoint.tHours), y100)
    }
    ctx.closePath()
    ctx.fill()

    // Peak Poisoning Marker
    const xPeak = tToX(maxXeHour)
    const yPeak = xeToY(maxXe)
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(xPeak, yPeak, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`Peak Poisoning (${maxXe.toFixed(0)}% at ${maxXeHour.toFixed(1)}h)`, xPeak, yPeak - 12)
    ctx.fillText(`Δρ_Xe ≈ -${(maxXe * 28).toFixed(0)} pcm`, xPeak, yPeak + 18)

    // Legend
    ctx.font = 'bold 11px sans-serif'
    ctx.fillStyle = '#f59e0b'
    ctx.textAlign = 'left'
    ctx.fillText('● ¹³⁵Xe Xenon Poison (T½ = 9.17h, σ_a = 2.6M barns)', padL + 10, padT + 12)

    ctx.fillStyle = '#a855f7'
    ctx.fillText('● ¹³⁵I Iodine Precursor (T½ = 6.57h)', padL + 10, padT + 28)

    // Axis titles
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Time Post-Shutdown (Hours)', padL + plotW / 2, h - 10)

    ctx.save()
    ctx.translate(16, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Relative Concentration (% of Equilibrium)', 0, 0)
    ctx.restore()
  }, 10)

  return H('div', { class: 'flex h-full flex-col gap-2' },
    H('div', { class: 'relative flex-1 min-h-[260px]' },
      H('canvas', {
        id: canvasId,
        class: 'h-full w-full rounded-lg border border-white/5 bg-[#090d16]',
      }),
    ),
    // Chernobyl Physics Context Box
    H('div', { class: 'rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-zinc-300' },
      H('div', { class: 'font-mono text-amber-400 font-bold mb-1 flex items-center gap-1.5' },
        H('span', null, '⚠️'),
        'PHYSICS TRAP: THE XENON-135 DEAD TIME',
      ),
      H('p', null,
        'After a power reduction, ¹³⁵I can continue decaying into ¹³⁵Xe while neutron absorption changes, temporarily increasing xenon concentration. The peak time and reactivity depend on prior operating history, flux, and fuel composition. This illustrative shutdown curve is not operating guidance or a control-rod limit.',
      ),
    ),
  )
}
