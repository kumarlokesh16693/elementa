/**
 * Interactive Reaction Coordinate Potential Energy Canvas
 * Visualizes Reactants -> Transition State [TS]‡ -> Products,
 * catalyzed vs uncatalyzed multi-step pathways, and energetic barrier surmounting.
 */

import { h, type VNode } from 'nexus-framework'
import type { KineticsReaction } from '@/lib/kinetics/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function ReactionCoordinateCanvas({
  reaction,
  catalystEnabled,
  catalystEfficiency,
  tempK,
}: {
  reaction: KineticsReaction
  catalystEnabled: boolean
  catalystEfficiency: number // 0 to 1
  tempK: number
}): VNode {
  const canvasId = 'reaction-coordinate-canvas'

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

    // Background
    ctx.fillStyle = '#090d16'
    ctx.fillRect(0, 0, w, h)

    // Margins
    const padL = 70
    const padR = 40
    const padT = 45
    const padB = 55
    const plotW = w - padL - padR
    const plotH = h - padT - padB

    // Energy scale: 0 at reactant, peak at Ea, products at deltaH
    const eaUncat = reaction.eaUncatalyzed
    const effectiveEaCat = reaction.eaCatalyzed + (1 - catalystEfficiency) * (eaUncat - reaction.eaCatalyzed)
    const deltaH = reaction.deltaH

    const maxE = Math.max(eaUncat, effectiveEaCat, 0) + 30
    const minE = Math.min(deltaH, 0) - 25
    const eRange = maxE - minE

    const eToY = (e: number) => padT + plotH * (1 - (e - minE) / eRange)
    const xToCoord = (pct: number) => padL + plotW * pct

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let e = Math.floor(minE / 50) * 50; e <= maxE; e += 50) {
      const y = eToY(e)
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(w - padR, y)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${e} kJ`, padL - 8, y + 3)
    }

    // Zero energy dashed baseline
    const yZero = eToY(0)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(padL, yZero)
    ctx.lineTo(w - padR, yZero)
    ctx.stroke()
    ctx.setLineDash([])

    // 1. Uncatalyzed Curve (Red / Orange)
    ctx.beginPath()
    ctx.strokeStyle = catalystEnabled ? 'rgba(244, 63, 94, 0.45)' : '#f43f5e'
    ctx.lineWidth = catalystEnabled ? 2 : 3.5

    // Spline points: Reactants (0 to 0.2), Peak at 0.5, Products (0.8 to 1.0)
    const p0x = xToCoord(0.05), p0y = eToY(0)
    const p1x = xToCoord(0.22), p1y = eToY(0)
    const p2x = xToCoord(0.50), p2y = eToY(eaUncat)
    const p3x = xToCoord(0.78), p3y = eToY(deltaH)
    const p4x = xToCoord(0.95), p4y = eToY(deltaH)

    ctx.moveTo(p0x, p0y)
    ctx.lineTo(p1x, p1y)
    ctx.bezierCurveTo(xToCoord(0.35), p0y, xToCoord(0.38), p2y, p2x, p2y)
    ctx.bezierCurveTo(xToCoord(0.62), p2y, xToCoord(0.65), p3y, p3x, p3y)
    ctx.lineTo(p4x, p4y)
    ctx.stroke()

    // 2. Catalyzed Curve (Emerald / Cyan with Intermediate Well)
    if (catalystEnabled) {
      ctx.beginPath()
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 3.5

      // Multi-step catalytic pathway with two mini-peaks and intermediate well
      const cPeak1 = effectiveEaCat
      const cInter = cPeak1 * 0.25 + deltaH * 0.18
      const cPeak2 = Math.max(cInter + 5, cPeak1 * 0.75 + deltaH * 0.08)

      ctx.moveTo(p0x, p0y)
      ctx.lineTo(p1x, p0y)
      // Step 1: Substrate binding / Complexation
      ctx.bezierCurveTo(xToCoord(0.26), p0y, xToCoord(0.28), eToY(cPeak1), xToCoord(0.35), eToY(cPeak1))
      // Intermediate well
      ctx.bezierCurveTo(xToCoord(0.40), eToY(cPeak1), xToCoord(0.42), eToY(cInter), xToCoord(0.48), eToY(cInter))
      // Step 2: Transition state 2 / Cleavage
      ctx.bezierCurveTo(xToCoord(0.54), eToY(cInter), xToCoord(0.56), eToY(cPeak2), xToCoord(0.62), eToY(cPeak2))
      // Desorption to products (smooth sigmoid transition)
      ctx.bezierCurveTo(xToCoord(0.68), eToY(cPeak2), xToCoord(0.72), p3y, p3x, p3y)
      ctx.lineTo(p4x, p4y)
      ctx.stroke()

      // Catalytic TS1 marker
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(xToCoord(0.35), eToY(cPeak1), 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`[Cat-TS₁]‡ (${effectiveEaCat.toFixed(1)} kJ)`, xToCoord(0.35), eToY(cPeak1) - 10)

      // Catalytic TS2 marker
      ctx.beginPath()
      ctx.arc(xToCoord(0.62), eToY(cPeak2), 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillText(`[Cat-TS₂]‡ (${cPeak2.toFixed(1)} kJ)`, xToCoord(0.62), eToY(cPeak2) - 10)
    }

    // Uncatalyzed TS marker
    ctx.fillStyle = catalystEnabled ? 'rgba(244, 63, 94, 0.6)' : '#f43f5e'
    ctx.beginPath()
    ctx.arc(p2x, p2y, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`[TS]‡ (${eaUncat.toFixed(1)} kJ/mol)`, p2x, p2y - 10)

    // Annotations: Reactants, Products, Ea, DeltaH
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Reactants', p0x, p0y - 12)
    ctx.font = '10px monospace'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('0.0 kJ/mol', p0x, p0y + 16)

    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('Products', p4x, p4y - 12)
    ctx.font = '10px monospace'
    ctx.fillStyle = deltaH < 0 ? '#38bdf8' : '#f59e0b'
    ctx.fillText(`ΔH = ${deltaH > 0 ? '+' : ''}${deltaH.toFixed(1)} kJ/mol`, p4x, p4y + 16)

    // Ea Double Arrow Indicator
    const arrowX = xToCoord(0.24)
    ctx.strokeStyle = '#f43f5e'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(arrowX, p0y)
    ctx.lineTo(arrowX, p2y)
    ctx.stroke()
    // Arrow heads
    drawArrowHead(ctx, arrowX, p2y, 'up', '#f43f5e')
    drawArrowHead(ctx, arrowX, p0y, 'down', '#f43f5e')

    ctx.fillStyle = '#f43f5e'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`Ea (uncat) = ${eaUncat.toFixed(0)} kJ`, arrowX - 6, (p0y + p2y) / 2)

    if (catalystEnabled) {
      const catArrowX = xToCoord(0.74)
      const cPeakY = eToY(effectiveEaCat)
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(catArrowX, p0y)
      ctx.lineTo(catArrowX, cPeakY)
      ctx.stroke()
      drawArrowHead(ctx, catArrowX, cPeakY, 'up', '#10b981')
      drawArrowHead(ctx, catArrowX, p0y, 'down', '#10b981')

      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`Ea (cat) = ${effectiveEaCat.toFixed(0)} kJ`, catArrowX + 6, (p0y + cPeakY) / 2)

      // Delta Ea delta indicator
      const deltaEa = eaUncat - effectiveEaCat
      ctx.fillStyle = '#34d399'
      ctx.fillText(`↓ ΔEa = -${deltaEa.toFixed(1)} kJ/mol`, catArrowX + 6, (p0y + cPeakY) / 2 + 14)
    }

    // DeltaH Vertical Bracket on the right
    const dhX = xToCoord(0.88)
    ctx.strokeStyle = deltaH < 0 ? '#38bdf8' : '#f59e0b'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(dhX, p0y)
    ctx.lineTo(dhX, p4y)
    ctx.stroke()
    drawArrowHead(ctx, dhX, p4y, deltaH < 0 ? 'down' : 'up', deltaH < 0 ? '#38bdf8' : '#f59e0b')

    // Axis Labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Reaction Progress (Reaction Coordinate ξ)', padL + plotW / 2, h - 14)

    ctx.save()
    ctx.translate(18, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Potential Energy E (kJ/mol)', 0, 0)
    ctx.restore()
  }, 10)

  return H('div', { class: 'relative h-full w-full' },
    H('canvas', {
      id: canvasId,
      class: 'h-full w-full rounded-lg border border-white/5 bg-[#090d16]',
    }),
  )
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 'up' | 'down', color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  if (dir === 'up') {
    ctx.moveTo(x, y)
    ctx.lineTo(x - 4, y + 7)
    ctx.lineTo(x + 4, y + 7)
  } else {
    ctx.moveTo(x, y)
    ctx.lineTo(x - 4, y - 7)
    ctx.lineTo(x + 4, y - 7)
  }
  ctx.closePath()
  ctx.fill()
}
