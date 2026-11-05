/**
 * Integrated Rate Laws & Concentration-Time Simulator
 * Plots [A](t), [B](t), [P](t) decay and growth curves for 0th, 1st, 2nd order,
 * and consecutive A -> B -> C reaction networks.
 */

import { h, type VNode } from 'nexus-framework'
import { generateRateTrajectories, computeHalfLife } from '@/lib/kinetics/physics'
import type { RateOrder } from '@/lib/kinetics/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function RateLawsSimulator({
  order,
  rateConstantK,
  initialConcA,
  simTime,
  onOrderChange,
  onRateConstantChange,
  onInitialConcChange,
}: {
  order: RateOrder
  rateConstantK: number
  initialConcA: number
  simTime: number
  onOrderChange: (order: RateOrder) => void
  onRateConstantChange: (k: number) => void
  onInitialConcChange: (a0: number) => void
}): VNode {
  const canvasId = 'rate-curves-canvas'
  const duration = order === 'zero' ? initialConcA / rateConstantK * 1.2 : (computeHalfLife(order, rateConstantK, initialConcA) * 4) || 20
  const maxTime = Math.max(duration, 5)

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

    const padL = 60
    const padR = 30
    const padT = 30
    const padB = 45
    const plotW = w - padL - padR
    const plotH = h - padT - padB

    const maxConc = initialConcA * 1.15
    const tToX = (t: number) => padL + plotW * (t / maxTime)
    const cToY = (c: number) => padT + plotH * (1 - c / maxConc)

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1

    // Concentration horizontal grid
    for (let c = 0; c <= maxConc; c += initialConcA / 4) {
      const y = cToY(c)
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(w - padR, y)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${c.toFixed(2)} M`, padL - 8, y + 3)
    }

    // Time vertical grid
    const tStep = maxTime / 5
    for (let t = 0; t <= maxTime; t += tStep) {
      const x = tToX(t)
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, h - padB)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${t.toFixed(1)} s`, x, h - padB + 16)
    }

    // Trajectories
    const points = generateRateTrajectories(order, rateConstantK, initialConcA, maxTime, 200)

    // 1. Product [P] Curve (Emerald)
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = tToX(p.t)
      const y = cToY(p.concP)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 2. Intermediate [B] Curve (Amber - for consecutive A -> B -> C)
    if (order === 'consecutive') {
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      points.forEach((p, i) => {
        const x = tToX(p.t)
        const y = cToY(p.concB ?? 0)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    // 3. Reactant [A] Curve (Cyan / Blue)
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = tToX(p.t)
      const y = cToY(p.concA)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Half-life t1/2 vertical marker
    const tHalf = computeHalfLife(order, rateConstantK, initialConcA)
    if (tHalf < maxTime && order !== 'consecutive') {
      const xHalf = tToX(tHalf)
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(xHalf, padT)
      ctx.lineTo(xHalf, h - padB)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#eab308'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`t½ = ${tHalf.toFixed(2)}s`, xHalf, padT + 12)
    }

    // Current simTime vertical needle
    const curT = Math.min(simTime, maxTime)
    const curX = tToX(curT)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(curX, padT)
    ctx.lineTo(curX, h - padB)
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(curX, padT, 4, 0, Math.PI * 2)
    ctx.fill()

    // Legend
    ctx.font = 'bold 11px sans-serif'
    ctx.fillStyle = '#38bdf8'
    ctx.textAlign = 'left'
    ctx.fillText('● [A] Reactant', padL + 12, padT + 15)

    if (order === 'consecutive') {
      ctx.fillStyle = '#f59e0b'
      ctx.fillText('● [B] Intermediate', padL + 115, padT + 15)
      ctx.fillStyle = '#10b981'
      ctx.fillText('● [C] Product', padL + 235, padT + 15)
    } else {
      ctx.fillStyle = '#10b981'
      ctx.fillText('● [P] Product', padL + 115, padT + 15)
    }

    // Axis titles
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Time t (seconds)', padL + plotW / 2, h - 10)

    ctx.save()
    ctx.translate(16, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Concentration (M)', 0, 0)
    ctx.restore()
  }, 10)

  // Rate law mathematical formulas by order
  const orderDescriptions: Record<RateOrder, { diff: string; int: string; halfLife: string; desc: string }> = {
    zero: {
      diff: '-d[A]/dt = k',
      int: '[A]_t = [A]_0 - k·t',
      halfLife: 't½ = [A]_0 / (2k)',
      desc: 'Linear decay. Rate is independent of substrate concentration (e.g. enzyme active site saturation or surface catalysis).',
    },
    first: {
      diff: '-d[A]/dt = k·[A]',
      int: '[A]_t = [A]_0·exp(-k·t)',
      halfLife: 't½ = ln(2) / k ≈ 0.693 / k',
      desc: 'Exponential decay. Half-life is completely independent of initial concentration [A]0 (e.g. radioactive decay, unimolecular isomerization).',
    },
    second: {
      diff: '-d[A]/dt = k·[A]²',
      int: '1/[A]_t = 1/[A]_0 + k·t',
      halfLife: 't½ = 1 / (k·[A]_0)',
      desc: 'Hyperbolic decay. Half-life doubles with each successive half-life period as reactants dilute (e.g. bimolecular collisions, NO2 decomposition).',
    },
    consecutive: {
      diff: 'A -(k₁)→ B -(k₂)→ C',
      int: '[B]_t = [A]_0·(k₁/(k₂-k₁))·(e^(-k₁t) - e^(-k₂t))',
      halfLife: 't_max(B) = ln(k₂/k₁) / (k₂ - k₁)',
      desc: 'Multistep consecutive pathway: Reactive intermediate [B] builds up to a transient peak before degrading into final stable product [C].',
    },
  }

  const curOrderInfo = orderDescriptions[order]

  return H('div', { class: 'flex h-full flex-col gap-3' },
    // Order Selector Buttons
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2' },
      H('div', { class: 'flex items-center gap-1.5' },
        (['zero', 'first', 'second', 'consecutive'] as RateOrder[]).map((ord) => {
          const isActive = order === ord
          return H('button', {
            key: ord,
            type: 'button',
            onClick: () => onOrderChange(ord),
            onclick: () => onOrderChange(ord),
            class: `rounded px-2.5 py-1 text-[11px] font-mono font-bold transition ${
              isActive
                ? 'bg-sky-400 text-black shadow-md'
                : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
            }`,
          }, ord.toUpperCase() + (ord === 'consecutive' ? ' (A→B→C)' : ' ORDER'))
        }),
      ),
      H('div', { class: 'flex items-center gap-2 font-mono text-[11px] text-zinc-400' },
        H('span', null, `k = ${rateConstantK.toFixed(3)} s⁻¹`),
        H('span', { class: 'text-zinc-600' }, '|'),
        H('span', null, `[A]₀ = ${initialConcA.toFixed(2)} M`),
      ),
    ),

    // Canvas Container
    H('div', { class: 'relative flex-1 min-h-[260px]' },
      H('canvas', {
        id: canvasId,
        class: 'h-full w-full rounded-lg border border-white/5 bg-[#090d16]',
      }),
    ),

    // Interactive Sliders & Equation Badges
    H('div', { class: 'grid grid-cols-1 md:grid-cols-3 gap-2.5 rounded-lg border border-white/5 bg-[#0c1220] p-2.5 text-[11px]' },
      H('div', { class: 'space-y-1' },
        H('div', { class: 'flex justify-between font-mono text-zinc-400' },
          H('span', null, 'Initial [A]₀:'),
          H('span', { class: 'text-sky-300 font-bold' }, `${initialConcA.toFixed(2)} M`),
        ),
        H('input', {
          type: 'range',
          min: '0.10',
          max: '2.00',
          step: '0.05',
          value: String(initialConcA),
          onInput: (e: any) => onInitialConcChange(parseFloat(e.target.value)),
          oninput: (e: any) => onInitialConcChange(parseFloat(e.target.value)),
          class: 'w-full accent-sky-400 h-1 bg-zinc-700 rounded cursor-pointer',
        }),
      ),

      H('div', { class: 'space-y-1' },
        H('div', { class: 'flex justify-between font-mono text-zinc-400' },
          H('span', null, 'Rate Constant k:'),
          H('span', { class: 'text-amber-300 font-bold' }, `${rateConstantK.toFixed(3)}`),
        ),
        H('input', {
          type: 'range',
          min: '0.02',
          max: '1.00',
          step: '0.02',
          value: String(rateConstantK),
          onInput: (e: any) => onRateConstantChange(parseFloat(e.target.value)),
          oninput: (e: any) => onRateConstantChange(parseFloat(e.target.value)),
          class: 'w-full accent-amber-400 h-1 bg-zinc-700 rounded cursor-pointer',
        }),
      ),

      H('div', { class: 'flex flex-col justify-center rounded border border-white/5 bg-black/30 p-2 font-mono text-[10px]' },
        H('div', { class: 'text-emerald-300 font-bold' }, curOrderInfo.diff),
        H('div', { class: 'text-zinc-400' }, curOrderInfo.int),
        H('div', { class: 'text-amber-400' }, curOrderInfo.halfLife),
      ),
    ),
  )
}
