/**
 * Enzyme Kinetics & Michaelis-Menten / Lineweaver-Burk Explorer
 * Simulates saturation kinetics, catalytic turnover k_cat,
 * and competitive / non-competitive / uncompetitive inhibition modes.
 */

import { h, type VNode } from 'nexus-framework'
import { computeApparentEnzymeParams } from '@/lib/kinetics/physics'
import type { MichaelisMentenParams, InhibitionType } from '@/lib/kinetics/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function MichaelisMentenLab({
  params,
  onParamsChange,
}: {
  params: MichaelisMentenParams
  onParamsChange: (p: MichaelisMentenParams) => void
}): VNode {
  const mmCanvasId = 'michaelis-menten-canvas'
  const lbCanvasId = 'lineweaver-burk-canvas'

  const { vMax, kM, inhibitorType, inhibitorConcI, kI } = params
  const { vMaxApp, kMApp } = computeApparentEnzymeParams(params)

  setTimeout(() => {
    // 1. Render Michaelis-Menten Curve
    const mmCanvas = document.getElementById(mmCanvasId) as HTMLCanvasElement | null
    if (mmCanvas) {
      const ctx = mmCanvas.getContext('2d')
      if (ctx) {
        const dpr = window.devicePixelRatio || 1
        const rect = mmCanvas.getBoundingClientRect()
        const w = rect.width
        const h = rect.height
        mmCanvas.width = w * dpr
        mmCanvas.height = h * dpr
        ctx.scale(dpr, dpr)

        ctx.fillStyle = '#090d16'
        ctx.fillRect(0, 0, w, h)

        const padL = 50, padR = 25, padT = 25, padB = 40
        const plotW = w - padL - padR
        const plotH = h - padT - padB

        const maxS = kM * 6
        const maxV = Math.max(vMax, vMaxApp) * 1.25

        const sToX = (s: number) => padL + plotW * (s / maxS)
        const vToY = (v: number) => padT + plotH * (1 - v / maxV)

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.lineWidth = 1
        for (let v = 0; v <= maxV; v += vMax / 4) {
          const y = vToY(v)
          ctx.beginPath()
          ctx.moveTo(padL, y)
          ctx.lineTo(w - padR, y)
          ctx.stroke()

          ctx.fillStyle = '#64748b'
          ctx.font = '9px monospace'
          ctx.textAlign = 'right'
          ctx.fillText(v.toFixed(1), padL - 6, y + 3)
        }

        // Vmax Asymptote Line
        const yVmax = vToY(vMax)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(padL, yVmax)
        ctx.lineTo(w - padR, yVmax)
        ctx.stroke()
        ctx.setLineDash([])

        // Control Curve (Cyan)
        ctx.strokeStyle = inhibitorType !== 'none' ? 'rgba(56, 189, 248, 0.5)' : '#38bdf8'
        ctx.lineWidth = inhibitorType !== 'none' ? 2 : 3
        ctx.beginPath()
        for (let s = 0; s <= maxS; s += maxS / 100) {
          const v = (vMax * s) / (kM + s)
          const x = sToX(s)
          const y = vToY(v)
          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Inhibited Curve (Rose)
        if (inhibitorType !== 'none' && inhibitorConcI > 0) {
          ctx.strokeStyle = '#f43f5e'
          ctx.lineWidth = 3
          ctx.beginPath()
          for (let s = 0; s <= maxS; s += maxS / 100) {
            const v = (vMaxApp * s) / (kMApp + s)
            const x = sToX(s)
            const y = vToY(v)
            if (s === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }

        // KM and Vmax/2 markers
        const halfVmax = vMax / 2
        const yHalf = vToY(halfVmax)
        const xKM = sToX(kM)
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(padL, yHalf)
        ctx.lineTo(xKM, yHalf)
        ctx.lineTo(xKM, h - padB)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = '#eab308'
        ctx.font = '9.5px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`Km = ${kM} µM`, xKM, h - padB + 14)

        // Axis Titles
        ctx.fillStyle = '#94a3b8'
        ctx.font = '10px sans-serif'
        ctx.fillText('Substrate [S] (µM)', padL + plotW / 2, h - 8)
        ctx.save()
        ctx.translate(14, padT + plotH / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Velocity v (µM/s)', 0, 0)
        ctx.restore()
      }
    }

    // 2. Render Lineweaver-Burk Double Reciprocal Plot (1/v vs 1/[S])
    const lbCanvas = document.getElementById(lbCanvasId) as HTMLCanvasElement | null
    if (lbCanvas) {
      const ctx = lbCanvas.getContext('2d')
      if (ctx) {
        const dpr = window.devicePixelRatio || 1
        const rect = lbCanvas.getBoundingClientRect()
        const w = rect.width
        const h = rect.height
        lbCanvas.width = w * dpr
        lbCanvas.height = h * dpr
        ctx.scale(dpr, dpr)

        ctx.fillStyle = '#090d16'
        ctx.fillRect(0, 0, w, h)

        const padL = 50, padR = 25, padT = 25, padB = 40
        const plotW = w - padL - padR
        const plotH = h - padT - padB

        // X axis: -1/Km to 1/[S]_min
        const minInvS = -1.5 / kM
        const maxInvS = 2.5 / kM
        const maxInvV = 2.5 / vMax

        const invSToX = (invS: number) => padL + plotW * ((invS - minInvS) / (maxInvS - minInvS))
        const invVToY = (invV: number) => padT + plotH * (1 - invV / maxInvV)

        // Zero axis (Y-axis where 1/[S] = 0)
        const xZero = invSToX(0)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(xZero, padT)
        ctx.lineTo(xZero, h - padB)
        ctx.stroke()

        // X-axis (where 1/v = 0)
        const yZero = invVToY(0)
        ctx.beginPath()
        ctx.moveTo(padL, yZero)
        ctx.lineTo(w - padR, yZero)
        ctx.stroke()

        // Control Line: 1/v = (Km / Vmax) * (1/[S]) + 1/Vmax
        const slopeCtrl = kM / vMax
        const interceptCtrl = 1 / vMax

        ctx.strokeStyle = inhibitorType !== 'none' ? 'rgba(56, 189, 248, 0.5)' : '#38bdf8'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(invSToX(-1 / kM), invVToY(0))
        ctx.lineTo(invSToX(maxInvS), invVToY(slopeCtrl * maxInvS + interceptCtrl))
        ctx.stroke()

        // Inhibited Line
        if (inhibitorType !== 'none' && inhibitorConcI > 0) {
          const slopeInh = kMApp / vMaxApp
          const interceptInh = 1 / vMaxApp

          ctx.strokeStyle = '#f43f5e'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(invSToX(-1 / kMApp), invVToY(0))
          ctx.lineTo(invSToX(maxInvS), invVToY(slopeInh * maxInvS + interceptInh))
          ctx.stroke()

          // Highlight intersection
          ctx.fillStyle = '#f43f5e'
          ctx.font = 'bold 9px monospace'
          ctx.textAlign = 'left'
          if (inhibitorType === 'competitive') {
            ctx.fillText('Same 1/Vmax (Y-axis intersection)', xZero + 5, invVToY(interceptCtrl) - 5)
          } else if (inhibitorType === 'non-competitive') {
            ctx.fillText('Same -1/Km (X-axis intersection)', invSToX(-1 / kM) + 5, yZero - 5)
          } else if (inhibitorType === 'uncompetitive') {
            ctx.fillText('Parallel slopes (Km/Vmax equal)', xZero + 5, invVToY(interceptInh) - 5)
          }
        }

        // Labels
        ctx.fillStyle = '#94a3b8'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('1 / [S] (1/µM)', padL + plotW / 2, h - 8)
        ctx.save()
        ctx.translate(14, padT + plotH / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('1 / v (s/µM)', 0, 0)
        ctx.restore()
      }
    }
  }, 10)

  return H('div', { class: 'flex h-full flex-col gap-3' },
    // Inhibition Mode Selector Strip
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2' },
      H('div', { class: 'flex items-center gap-1.5' },
        (['none', 'competitive', 'non-competitive', 'uncompetitive'] as InhibitionType[]).map((mode) => {
          const isActive = inhibitorType === mode
          return H('button', {
            key: mode,
            type: 'button',
            onClick: () => onParamsChange({ ...params, inhibitorType: mode }),
            class: `rounded px-2 py-1 text-[11px] font-mono font-bold transition ${
              isActive
                ? 'bg-rose-500 text-white shadow-md'
                : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
            }`,
          }, mode.toUpperCase() + (mode === 'none' ? ' (CONTROL)' : ' INHIBITION'))
        }),
      ),
      H('div', { class: 'font-mono text-[11px] text-zinc-400' },
        `Vmax: ${vMaxApp.toFixed(1)} µM/s | Km: ${kMApp.toFixed(1)} µM`,
      ),
    ),

    // Twin Plots: Left = Michaelis-Menten, Right = Lineweaver-Burk
    H('div', { class: 'grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-[260px]' },
      // Michaelis-Menten Plot
      H('div', { class: 'flex flex-col gap-1' },
        H('div', { class: 'flex items-center justify-between px-1 text-[11px] font-mono text-zinc-400' },
          H('span', { class: 'text-zinc-200 font-bold' }, 'Michaelis-Menten Kinetics: v vs [S]'),
          H('span', { class: 'text-sky-300' }, 'v = (Vmax·[S]) / (Km + [S])'),
        ),
        H('div', { class: 'relative flex-1 rounded-lg border border-white/5 bg-[#090d16] overflow-hidden' },
          H('canvas', { id: mmCanvasId, class: 'h-full w-full' }),
        ),
      ),

      // Lineweaver-Burk Plot
      H('div', { class: 'flex flex-col gap-1' },
        H('div', { class: 'flex items-center justify-between px-1 text-[11px] font-mono text-zinc-400' },
          H('span', { class: 'text-zinc-200 font-bold' }, 'Lineweaver-Burk: 1/v vs 1/[S]'),
          H('span', { class: 'text-emerald-300' }, 'Double Reciprocal'),
        ),
        H('div', { class: 'relative flex-1 rounded-lg border border-white/5 bg-[#090d16] overflow-hidden' },
          H('canvas', { id: lbCanvasId, class: 'h-full w-full' }),
        ),
      ),
    ),

    // Parameter Controls
    H('div', { class: 'grid grid-cols-2 md:grid-cols-4 gap-2.5 rounded-lg border border-white/5 bg-[#0c1220] p-2.5 text-[11px]' },
      H('div', { class: 'space-y-1' },
        H('div', { class: 'flex justify-between font-mono text-zinc-400' },
          H('span', null, 'Vmax:'),
          H('span', { class: 'text-sky-300 font-bold' }, `${vMax.toFixed(0)} µM/s`),
        ),
        H('input', {
          type: 'range',
          min: '10',
          max: '100',
          step: '5',
          value: String(vMax),
          onInput: (e: any) => onParamsChange({ ...params, vMax: parseFloat(e.target.value) }),
          class: 'w-full accent-sky-400 h-1 bg-zinc-700 rounded cursor-pointer',
        }),
      ),

      H('div', { class: 'space-y-1' },
        H('div', { class: 'flex justify-between font-mono text-zinc-400' },
          H('span', null, 'Km:'),
          H('span', { class: 'text-amber-300 font-bold' }, `${kM.toFixed(0)} µM`),
        ),
        H('input', {
          type: 'range',
          min: '5',
          max: '60',
          step: '5',
          value: String(kM),
          onInput: (e: any) => onParamsChange({ ...params, kM: parseFloat(e.target.value) }),
          class: 'w-full accent-amber-400 h-1 bg-zinc-700 rounded cursor-pointer',
        }),
      ),

      H('div', { class: 'space-y-1' },
        H('div', { class: 'flex justify-between font-mono text-zinc-400' },
          H('span', null, 'Inhibitor [I]:'),
          H('span', { class: 'text-rose-300 font-bold' }, `${inhibitorConcI.toFixed(0)} µM`),
        ),
        H('input', {
          type: 'range',
          min: '0',
          max: '50',
          step: '2',
          value: String(inhibitorConcI),
          onInput: (e: any) => onParamsChange({ ...params, inhibitorConcI: parseFloat(e.target.value) }),
          class: 'w-full accent-rose-400 h-1 bg-zinc-700 rounded cursor-pointer',
        }),
      ),

      H('div', { class: 'space-y-1' },
        H('div', { class: 'flex justify-between font-mono text-zinc-400' },
          H('span', null, 'Inhibition Const Ki:'),
          H('span', { class: 'text-purple-300 font-bold' }, `${kI.toFixed(0)} µM`),
        ),
        H('input', {
          type: 'range',
          min: '2',
          max: '40',
          step: '2',
          value: String(kI),
          onInput: (e: any) => onParamsChange({ ...params, kI: parseFloat(e.target.value) }),
          class: 'w-full accent-purple-400 h-1 bg-zinc-700 rounded cursor-pointer',
        }),
      ),
    ),
  )
}
