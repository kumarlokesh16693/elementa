/**
 * Interactive Fourier-Transform Infrared (FTIR) Spectrum Plot
 * Renders standard FTIR inverted transmittance curve T(ν) [4000 ➔ 400 cm⁻¹],
 * highlights diagnostic functional group zones, and enables 1-click mode inspection.
 */

import { h, type VNode } from 'nexus-framework'
import type { VibrationalMode } from '@/lib/spectroscopy/types'
import { generateFtirSpectrum, FTIR_DIAGNOSTIC_ZONES } from '@/lib/spectroscopy/physics'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function FtirPlot({
  modes,
  activeModeId,
  onSelectMode,
}: {
  modes: VibrationalMode[]
  activeModeId: string
  onSelectMode: (mode: VibrationalMode) => void
}): VNode {
  const spectrum = generateFtirSpectrum(modes, 650, 400, 4000)

  // Standard FTIR convention: 4000 cm⁻¹ on the left ➔ 400 cm⁻¹ on the right
  const minWN = 400
  const maxWN = 4000
  const W = 800
  const H_PX = 250
  const padL = 45
  const padR = 25
  const padT = 30
  const padB = 35
  const plotW = W - padL - padR
  const plotH = H_PX - padT - padB

  // Inverted horizontal axis mapping (4000 ➔ 400)
  const toX = (wn: number) => padL + ((maxWN - wn) / (maxWN - minWN)) * plotW
  // Transmittance vertical mapping (100% at top -> 0% at bottom)
  const toY = (t: number) => padT + ((100 - t) / 100) * plotH

  // Build SVG path
  const pathD = spectrum.reduce((acc, pt, idx) => {
    const x = toX(pt.wavenumber).toFixed(1)
    const y = toY(pt.transmittance).toFixed(1)
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
  }, '')

  // Ticks every 500 cm⁻¹: 4000, 3500, 3000, 2500, 2000, 1500, 1000, 500
  const wnTicks = [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]
  // Transmittance ticks
  const tTicks = [100, 75, 50, 25, 0]

  return H('div', { class: 'flex flex-col rounded-xl border border-white/10 bg-[#0a0f1d] p-3' },
    // Header
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-amber-400 font-mono text-sm' }, '📡'),
        H('span', { class: 'text-[13px] font-bold text-zinc-100' }, 'FTIR Infrared Absorption Spectrum T(ν)'),
        H('span', { class: 'rounded bg-amber-400/20 px-1.5 py-0.5 font-mono text-[9.5px] text-amber-300 font-bold' },
          '4000 ➔ 400 cm⁻¹'
        ),
      ),
      H('div', { class: 'flex items-center gap-2 text-[10px] font-mono text-zinc-400' },
        H('span', null, 'Click any absorption trough to animate in 3D'),
        H('span', null, '·'),
        H('span', { class: 'text-emerald-400 font-bold' }, `${modes.filter(m => m.irActive).length} IR Active Modes`),
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
          H('linearGradient', { id: 'ftirTroughGlow', x1: '0', y1: '0', x2: '0', y2: '1' },
            H('stop', { offset: '0%', 'stop-color': '#f43f5e', 'stop-opacity': '0.0' }),
            H('stop', { offset: '100%', 'stop-color': '#f43f5e', 'stop-opacity': '0.35' }),
          ),
        ),

        // Diagnostic Zones Shading
        ...FTIR_DIAGNOSTIC_ZONES.map((zone) => {
          const xStart = toX(Math.min(zone.range[1], maxWN))
          const xEnd = toX(Math.max(zone.range[0], minWN))
          const wZone = Math.max(xEnd - xStart, 2)
          return H('g', { key: `zone-${zone.name}` },
            H('rect', {
              x: xStart,
              y: padT,
              width: wZone,
              height: plotH,
              fill: zone.color,
              opacity: '0.04',
            }),
            H('text', {
              x: xStart + wZone / 2,
              y: padT + 12,
              'text-anchor': 'middle',
              'font-family': 'monospace',
              'font-size': '8',
              fill: zone.color,
              opacity: '0.6',
            }, zone.name),
          )
        }),

        // Grid Lines X (Wavenumber 4000 ➔ 400)
        ...wnTicks.map((tick) => {
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
            }, `${tick}`),
          )
        }),

        // Grid Lines Y (Transmittance %)
        ...tTicks.map((tick) => {
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

        // Continuous FTIR Spectrum Curve
        H('path', {
          d: pathD,
          fill: 'none',
          stroke: '#f43f5e',
          'stroke-width': '2.2',
          'stroke-linejoin': 'round',
        }),

        // Clickable Peak Troughs & Markers
        ...modes.filter(m => m.irActive).map((mode) => {
          const px = toX(mode.wavenumber)
          const py = toY(mode.transmittancePercent)
          const isSelected = mode.id === activeModeId

          return H('g', {
            key: `marker-${mode.id}`,
            class: 'cursor-pointer group',
            onClick: () => onSelectMode(mode),
          },
            // Dashed indicator stem down to trough
            H('line', {
              x1: px,
              y1: padT,
              x2: px,
              y2: py,
              stroke: isSelected ? '#fbbf24' : '#38bdf8',
              'stroke-width': isSelected ? '1.8' : '1.0',
              'stroke-dasharray': '2,2',
              opacity: isSelected ? '1' : '0.5',
            }),
            // Trough marker dot
            H('circle', {
              cx: px,
              cy: py,
              r: isSelected ? '5' : '3.5',
              fill: isSelected ? '#fbbf24' : '#38bdf8',
              stroke: '#0f172a',
              'stroke-width': '1.5',
            }),
            // Floating Wavenumber Label Box
            H('rect', {
              x: px - 28,
              y: Math.min(py + 6, padT + plotH - 18),
              width: '56',
              height: '14',
              rx: '3',
              fill: isSelected ? 'rgba(251, 191, 36, 0.95)' : 'rgba(15, 23, 42, 0.85)',
              stroke: isSelected ? '#ffffff' : 'rgba(56, 189, 248, 0.4)',
              'stroke-width': '1',
            }),
            H('text', {
              x: px,
              y: Math.min(py + 16, padT + plotH - 8),
              'text-anchor': 'middle',
              'font-family': 'monospace',
              'font-size': '8.5',
              'font-weight': 'bold',
              fill: isSelected ? '#000000' : '#bae6fd',
            }, `${mode.wavenumber} cm⁻¹`),
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
        }, 'Wavenumber ν̃ (cm⁻¹) [High Energy ➔ Low Energy]'),

        H('text', {
          x: -(padT + plotH / 2),
          y: 12,
          transform: 'rotate(-90)',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '10',
          fill: '#94a3b8',
        }, 'Transmittance %T (Absorption Troughs ➔)'),
      ),
    ),

    // Quick Mode Pills below spectrum
    H('div', { class: 'mt-2 border-t border-white/5 pt-2 flex flex-wrap gap-1.5' },
      ...modes.map((mode) => {
        const isSelected = mode.id === activeModeId
        return H('button', {
          key: `pill-${mode.id}`,
          type: 'button',
          onClick: () => onSelectMode(mode),
          onclick: () => onSelectMode(mode),
          class: `cursor-pointer rounded border px-2 py-1 text-left font-mono text-[9.5px] transition ${
            isSelected
              ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold shadow'
              : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
          }`,
        },
          H('div', { class: 'flex items-center gap-1.5' },
            H('span', { class: 'font-bold' }, `${mode.wavenumber} cm⁻¹`),
            H('span', { class: mode.irActive ? 'text-rose-400' : 'text-zinc-500' }, mode.irActive ? 'IR Active' : 'IR Inactive'),
          ),
          H('div', { class: 'text-[8.5px] text-zinc-400 truncate max-w-[200px]' }, mode.name),
        )
      }),
    ),
  )
}
