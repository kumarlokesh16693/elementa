/**
 * Interactive Powder X-Ray Diffractometer (XRD) Spectrum Canvas
 * Plots real-time Bragg peaks, continuous pseudo-Voigt profiles, Miller (hkl) flags,
 * and mouse-hover peak inspection tooltips.
 */

import { h, type VNode } from 'nexus-framework'
import type { XRDPeak } from '@/lib/crystallography/types'
import { generateDiffractogramProfile } from '@/lib/crystallography/diffraction'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function XrdPlot({
  peaks,
  wavelength,
  crystalliteSize,
  sourceName,
  onSelectPeak,
}: {
  peaks: XRDPeak[]
  wavelength: number
  crystalliteSize: number
  sourceName: string
  onSelectPeak?: (peak: XRDPeak) => void
}): VNode {
  const profile = generateDiffractogramProfile(peaks, 10, 90, 600)
  const maxI = Math.max(...profile.map((p) => p.intensity), 100)

  // Canvas dimensions
  const W = 800
  const H_PX = 260
  const padL = 45
  const padR = 25
  const padT = 30
  const padB = 35
  const plotW = W - padL - padR
  const plotH = H_PX - padT - padB

  const toX = (twoTheta: number) => padL + ((twoTheta - 10) / 80) * plotW
  const toY = (intensity: number) => padT + plotH - (intensity / maxI) * plotH

  // Build SVG path for continuous diffractogram curve
  const pathD = profile.reduce((acc, pt, i) => {
    const x = toX(pt.twoTheta).toFixed(1)
    const y = toY(pt.intensity).toFixed(1)
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
  }, '')

  const areaD = `${pathD} L ${toX(90).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${toX(10).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`

  // 2θ grid ticks every 10 degrees
  const xTicks = [10, 20, 30, 40, 50, 60, 70, 80, 90]
  // Intensity grid ticks
  const yTicks = [0, 25, 50, 75, 100]

  return H('div', { class: 'flex flex-col rounded-xl border border-white/10 bg-[#0a0f1d] p-3' },
    // Diffractometer Header
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-amber-400 font-mono text-sm' }, '⚡'),
        H('span', { class: 'text-[13px] font-bold text-zinc-100' }, 'Simulated Powder Diffractogram I(2θ)'),
        H('span', { class: 'rounded bg-amber-400/20 px-1.5 py-0.5 font-mono text-[9.5px] text-amber-300 font-bold' }, sourceName),
      ),
      H('div', { class: 'flex items-center gap-2 text-[10px] font-mono text-zinc-400' },
        H('span', null, `λ = ${wavelength.toFixed(4)} Å`),
        H('span', null, '·'),
        H('span', null, `L = ${crystalliteSize} nm`),
        H('span', null, '·'),
        H('span', { class: 'text-emerald-400 font-bold' }, `${peaks.length} Bragg Peaks`),
      ),
    ),

    // SVG Spectrum Canvas
    H('div', { class: 'relative w-full overflow-hidden' },
      H('svg', {
        viewBox: `0 0 ${W} ${H_PX}`,
        class: 'w-full h-auto select-none overflow-visible',
        xmlns: 'http://www.w3.org/2000/svg',
      },
        H('defs', null,
          H('linearGradient', { id: 'xrdGlow', x1: '0', y1: '0', x2: '0', y2: '1' },
            H('stop', { offset: '0%', 'stop-color': '#38bdf8', 'stop-opacity': '0.35' }),
            H('stop', { offset: '100%', 'stop-color': '#38bdf8', 'stop-opacity': '0.0' }),
          ),
        ),

        // Grid lines X (2θ)
        ...xTicks.map((tick) => {
          const x = toX(tick)
          return H('g', { key: `xt-${tick}` },
            H('line', {
              x1: x,
              y1: padT,
              x2: x,
              y2: padT + plotH,
              stroke: 'rgba(255,255,255,0.06)',
              'stroke-dasharray': '2,4',
            }),
            H('text', {
              x: x,
              y: padT + plotH + 16,
              'text-anchor': 'middle',
              'font-family': 'monospace',
              'font-size': '10',
              fill: '#71717a',
            }, `${tick}°`),
          )
        }),

        // Grid lines Y (Intensity)
        ...yTicks.map((tick) => {
          const y = toY(tick)
          return H('g', { key: `yt-${tick}` },
            H('line', {
              x1: padL,
              y1: y,
              x2: padL + plotW,
              y2: y,
              stroke: 'rgba(255,255,255,0.06)',
              'stroke-dasharray': '2,4',
            }),
            H('text', {
              x: padL - 8,
              y: y + 3,
              'text-anchor': 'end',
              'font-family': 'monospace',
              'font-size': '9',
              fill: '#71717a',
            }, `${tick}%`),
          )
        }),

        // Diffractogram Shaded Area & Line Curve
        H('path', {
          d: areaD,
          fill: 'url(#xrdGlow)',
        }),
        H('path', {
          d: pathD,
          fill: 'none',
          stroke: '#38bdf8',
          'stroke-width': '2.0',
          'stroke-linejoin': 'round',
        }),

        // Peak Markers & Miller (hkl) Labels
        ...peaks.map((peak, idx) => {
          const px = toX(peak.twoTheta)
          const py = toY(peak.intensity)
          const label = `(${peak.h} ${peak.k} ${peak.l})`

          return H('g', {
            key: `peak-${idx}`,
            class: 'cursor-pointer group',
            onClick: () => onSelectPeak?.(peak),
          },
            // Stem line
            H('line', {
              x1: px,
              y1: py,
              x2: px,
              y2: Math.max(py - 18, padT - 5),
              stroke: '#fbbf24',
              'stroke-width': '1.2',
              'stroke-dasharray': '2,2',
              opacity: '0.8',
            }),
            // Peak Dot
            H('circle', {
              cx: px,
              cy: py,
              r: '3.5',
              fill: '#fbbf24',
              stroke: '#0f172a',
              'stroke-width': '1.5',
            }),
            // Miller Index Label Box
            H('rect', {
              x: px - 20,
              y: Math.max(py - 30, padT - 15),
              width: '40',
              height: '14',
              rx: '3',
              fill: 'rgba(15, 23, 42, 0.85)',
              stroke: 'rgba(251, 191, 36, 0.4)',
              'stroke-width': '1',
            }),
            H('text', {
              x: px,
              y: Math.max(py - 20, padT - 5),
              'text-anchor': 'middle',
              'font-family': 'monospace',
              'font-size': '8.5',
              'font-weight': 'bold',
              fill: '#fef08a',
            }, label),
          )
        }),

        // Axis Titles
        H('text', {
          x: padL + plotW / 2,
          y: padT + plotH + 30,
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '10',
          fill: '#94a3b8',
        }, 'Diffraction Angle 2θ (degrees)'),

        H('text', {
          x: -(padT + plotH / 2),
          y: 12,
          transform: 'rotate(-90)',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '10',
          fill: '#94a3b8',
        }, 'Relative Intensity I/I₀ (%)'),
      ),
    ),

    // Peak Table / Summary Pills
    H('div', { class: 'mt-3 border-t border-white/5 pt-2' },
      H('div', { class: 'text-[9px] font-mono uppercase text-zinc-500 mb-1.5 flex items-center justify-between' },
        H('span', null, 'Primary Reflections (Click to inspect plane in 3D):'),
        H('span', null, 'Bragg Equation: λ = 2d·sin(θ)'),
      ),
      H('div', { class: 'flex flex-wrap gap-1.5 overflow-x-auto max-h-24 pr-1' },
        ...peaks.slice(0, 10).map((peak, idx) => H('button', {
          key: `tab-${idx}`,
          type: 'button',
          onClick: () => onSelectPeak?.(peak),
          class: 'cursor-pointer rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-left font-mono transition hover:border-amber-400/50 hover:bg-amber-400/10',
        },
          H('div', { class: 'flex items-center gap-1.5' },
            H('span', { class: 'font-bold text-amber-300 text-[10px]' }, `(${peak.h}${peak.k}${peak.l})`),
            H('span', { class: 'text-[9.5px] text-zinc-300 font-bold' }, `2θ = ${peak.twoTheta.toFixed(1)}°`),
          ),
          H('div', { class: 'text-[8px] text-zinc-500 mt-0.5' },
            `d=${peak.dSpacing.toFixed(3)} Å · I=${peak.intensity.toFixed(0)}% · |F|=${peak.structureFactor.toFixed(1)}`
          ),
        )),
      ),
    ),
  )
}
