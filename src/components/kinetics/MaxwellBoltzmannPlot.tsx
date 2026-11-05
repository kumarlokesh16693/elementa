/**
 * Maxwell-Boltzmann Kinetic Energy Distribution Plot
 * Demonstrates how temperature and activation energy thresholds dictate
 * the fraction of reactive molecular collisions (f = exp(-Ea / RT)).
 */

import { h, type VNode } from 'nexus-framework'
import { computeMaxwellBoltzmannDensity, computeEnergeticFraction } from '@/lib/kinetics/physics'
import type { KineticsReaction } from '@/lib/kinetics/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function MaxwellBoltzmannPlot({
  reaction,
  catalystEnabled,
  catalystEfficiency,
  tempK,
}: {
  reaction: KineticsReaction
  catalystEnabled: boolean
  catalystEfficiency: number
  tempK: number
}): VNode {
  const canvasId = 'maxwell-boltzmann-canvas'

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
    const padR = 40
    const padT = 35
    const padB = 55
    const plotW = w - padL - padR
    const plotH = h - padT - padB

    const eaUncat = reaction.eaUncatalyzed
    const effectiveEaCat = reaction.eaCatalyzed + (1 - catalystEfficiency) * (eaUncat - reaction.eaCatalyzed)

    // Energy domain from 0 to max(eaUncat * 1.5, 300) kJ/mol
    const maxEnergy = Math.max(eaUncat * 1.4, 250)
    const eStep = maxEnergy / 300

    // Compute distribution points
    let maxDensity = 0
    const points: { e: number; d: number }[] = []
    for (let e = 0.5; e <= maxEnergy; e += eStep) {
      const d = computeMaxwellBoltzmannDensity(e, tempK)
      if (d > maxDensity) maxDensity = d
      points.push({ e, d })
    }
    const dCeil = maxDensity * 1.25

    const eToX = (e: number) => padL + plotW * (e / maxEnergy)
    const dToY = (d: number) => padT + plotH * (1 - d / dCeil)

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let e = 50; e < maxEnergy; e += 50) {
      const x = eToX(e)
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, h - padB)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${e}`, x, h - padB + 16)
    }

    // Baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.beginPath()
    ctx.moveTo(padL, h - padB)
    ctx.lineTo(w - padR, h - padB)
    ctx.stroke()

    // 1. Shaded area for Catalyzed fraction (Emerald)
    if (catalystEnabled && effectiveEaCat < maxEnergy) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)'
      ctx.beginPath()
      ctx.moveTo(eToX(effectiveEaCat), h - padB)
      for (const p of points) {
        if (p.e >= effectiveEaCat) {
          ctx.lineTo(eToX(p.e), dToY(p.d))
        }
      }
      ctx.lineTo(eToX(maxEnergy), h - padB)
      ctx.closePath()
      ctx.fill()
    }

    // 2. Shaded area for Uncatalyzed fraction (Rose / Coral)
    if (eaUncat < maxEnergy) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.35)'
      ctx.beginPath()
      ctx.moveTo(eToX(eaUncat), h - padB)
      for (const p of points) {
        if (p.e >= eaUncat) {
          ctx.lineTo(eToX(p.e), dToY(p.d))
        }
      }
      ctx.lineTo(eToX(maxEnergy), h - padB)
      ctx.closePath()
      ctx.fill()
    }

    // 3. Draw Maxwell-Boltzmann Curve
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = eToX(p.e)
      const y = dToY(p.d)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 4. Vertical Activation Energy Threshold Lines
    // Uncatalyzed Ea line
    if (eaUncat <= maxEnergy) {
      const xUncat = eToX(eaUncat)
      ctx.strokeStyle = '#f43f5e'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(xUncat, padT)
      ctx.lineTo(xUncat, h - padB)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#f43f5e'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`Ea (uncat) = ${eaUncat} kJ`, xUncat, padT + 12)
    }

    // Catalyzed Ea line
    if (catalystEnabled && effectiveEaCat <= maxEnergy) {
      const xCat = eToX(effectiveEaCat)
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(xCat, padT + 24)
      ctx.lineTo(xCat, h - padB)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`Ea (cat) = ${effectiveEaCat.toFixed(0)} kJ`, xCat, padT + 36)
    }

    // Axis labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Kinetic Energy E (kJ/mol)', padL + plotW / 2, h - 14)

    ctx.save()
    ctx.translate(18, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Probability Density f(E)', 0, 0)
    ctx.restore()
  }, 10)

  // Calculations for summary card
  const eaUncat = reaction.eaUncatalyzed
  const effectiveEaCat = reaction.eaCatalyzed + (1 - catalystEfficiency) * (eaUncat - reaction.eaCatalyzed)
  const fracUncat = computeEnergeticFraction(eaUncat, tempK)
  const fracCat = computeEnergeticFraction(effectiveEaCat, tempK)
  const accelerationRatio = fracUncat > 0 ? fracCat / fracUncat : 1

  return H('div', { class: 'flex h-full flex-col gap-2' },
    H('div', { class: 'relative flex-1 min-h-[260px]' },
      H('canvas', {
        id: canvasId,
        class: 'h-full w-full rounded-lg border border-white/5 bg-[#090d16]',
      }),
    ),
    // Energetic Fraction Metrics Strip
    H('div', { class: 'grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono' },
      H('div', { class: 'rounded-lg border border-white/5 bg-[#0c1220] p-2' },
        H('span', { class: 'text-zinc-500 block text-[9.5px]' }, 'TEMPERATURE'),
        H('span', { class: 'text-amber-300 font-bold text-sm' }, `${tempK.toFixed(1)} K`),
        H('span', { class: 'text-zinc-500 block text-[9px]' }, `(${(tempK - 273.15).toFixed(1)} °C)`),
      ),
      H('div', { class: 'rounded-lg border border-rose-500/20 bg-rose-500/5 p-2' },
        H('span', { class: 'text-rose-400/80 block text-[9.5px]' }, 'UNCATALYZED FRACTION'),
        H('span', { class: 'text-rose-300 font-bold text-sm' }, fracUncat.toExponential(3)),
        H('span', { class: 'text-zinc-500 block text-[9px]' }, 'f = exp(-Ea / RT)'),
      ),
      H('div', { class: 'rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2' },
        H('span', { class: 'text-emerald-400/80 block text-[9.5px]' }, 'CATALYZED FRACTION'),
        H('span', { class: 'text-emerald-300 font-bold text-sm' }, catalystEnabled ? fracCat.toExponential(3) : 'OFF'),
        H('span', { class: 'text-zinc-500 block text-[9px]' }, 'Lower activation threshold'),
      ),
      H('div', { class: 'rounded-lg border border-sky-500/20 bg-sky-500/5 p-2' },
        H('span', { class: 'text-sky-400/80 block text-[9.5px]' }, 'RATE ACCELERATION'),
        H('span', { class: 'text-sky-300 font-bold text-sm' },
          catalystEnabled
            ? accelerationRatio >= 1e6
              ? `${(accelerationRatio / 1e6).toFixed(1)}M ×`
              : accelerationRatio >= 1e3
              ? `${(accelerationRatio / 1e3).toFixed(1)}k ×`
              : `${accelerationRatio.toFixed(1)} ×`
            : '1.0 ×',
        ),
        H('span', { class: 'text-zinc-500 block text-[9px]' }, 'k_cat / k_uncat ratio'),
      ),
    ),
  )
}
