/**
 * Interactive Beer-Lambert UV-Vis Spectrophotometer Lab
 * Simulates monochromatic light beam attenuation through a variable-pathlength
 * optical cuvette: A = ε · b · c, T = 10^(-A).
 */

import { h, type VNode } from 'nexus-framework'
import type { SpectroscopyMolecule, BeerLambertState } from '@/lib/spectroscopy/types'
import { computeBeerLambert } from '@/lib/spectroscopy/physics'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function BeerLambertLab({
  molecule,
  pathLengthCm,
  concentrationM,
  molarExtinction,
  onChangePathLength,
  onChangeConcentration,
  onChangeExtinction,
}: {
  molecule: SpectroscopyMolecule
  pathLengthCm: number
  concentrationM: number
  molarExtinction: number
  onChangePathLength: (b: number) => void
  onChangeConcentration: (c: number) => void
  onChangeExtinction: (eps: number) => void
}): VNode {
  const state: BeerLambertState = computeBeerLambert(
    pathLengthCm,
    concentrationM,
    molarExtinction
  )

  const W = 680
  const H_PX = 230

  // Cuvette dimensions in SVG
  const cuvetteW = Math.max(pathLengthCm * 45, 20)
  const cuvetteX = 340 - cuvetteW / 2
  const cuvetteY = 60
  const cuvetteH = 120

  // Beam entry and exit
  const beamColor = '#38bdf8' // incoming light
  const exitOpacity = Math.max(state.transmittancePct / 100, 0.05)

  // Status analysis
  const statusColor =
    state.absorbance < 0.08
      ? 'text-amber-400'
      : state.absorbance <= 1.6
      ? 'text-emerald-400'
      : state.absorbance <= 2.2
      ? 'text-amber-400'
      : 'text-rose-400'

  const statusLabel =
    state.absorbance < 0.08
      ? 'Low Absorbance (Dilute Solution / Detector Noise)'
      : state.absorbance <= 1.6
      ? '✓ Optimal Linear Beer-Lambert Dynamic Range'
      : state.absorbance <= 2.2
      ? 'High Optical Density (Approaching Detector Stray Light Limit)'
      : '⚠ Saturated / Opaque Sample (T < 0.5% - Dilution Required)'

  return H('div', { class: 'flex flex-col space-y-3' },
    // Header & Molecular Chromophore Specs
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0c1220] p-3' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-xl' }, '🔬'),
        H('div', null,
          H('h3', { class: 'text-[14px] font-bold text-zinc-100' },
            `${molecule.formula} — ${molecule.name} UV-Vis Spectrophotometry`
          ),
          H('p', { class: 'text-[10px] text-zinc-400 font-mono' },
            `λ_max = ${molecule.uvVis.lambdaMaxNm} nm · Transition: ${molecule.uvVis.transitionType}`
          ),
        ),
      ),
      H('div', { class: 'rounded bg-sky-400/10 border border-sky-400/20 px-2 py-1 text-[10px] font-mono text-sky-300' },
        `Absorbs: ${molecule.uvVis.absorptionColorName}`
      ),
    ),

    // Optical Bench Schematic SVG
    H('div', { class: 'relative rounded-xl border border-white/10 bg-[#070b14] p-3 overflow-hidden shadow-2xl' },
      H('div', { class: 'text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between' },
        H('span', null, 'Optical Attenuation Chamber (A = ε · b · c)'),
        H('span', { class: `${statusColor} font-bold` }, statusLabel),
      ),

      H('svg', {
        viewBox: `0 0 ${W} ${H_PX}`,
        class: 'w-full h-auto select-none',
        xmlns: 'http://www.w3.org/2000/svg',
      },
        H('defs', null,
          // Solution Gradient
          H('linearGradient', { id: 'solGrad', x1: '0', y1: '0', x2: '1', y2: '0' },
            H('stop', { offset: '0%', 'stop-color': molecule.uvVis.solutionColor, 'stop-opacity': '0.7' }),
            H('stop', { offset: '100%', 'stop-color': molecule.uvVis.solutionColor, 'stop-opacity': '0.9' }),
          ),
        ),

        // 1. Light Source (Monochromator)
        H('rect', { x: '40', y: '80', width: '70', height: '80', rx: '6', fill: '#0f172a', stroke: '#38bdf8', 'stroke-width': '1.5' }),
        H('circle', { cx: '75', cy: '120', r: '14', fill: '#38bdf8', filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.8))' }),
        H('text', { x: '75', y: '100', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '8', fill: '#94a3b8' }, 'LIGHT SOURCE'),
        H('text', { x: '75', y: '148', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '7.5', fill: '#38bdf8' }, `I₀ = 100%`),

        // Incoming Beam
        H('rect', {
          x: '110',
          y: '114',
          width: String(cuvetteX - 110),
          height: '12',
          fill: beamColor,
          opacity: '0.85',
          filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))',
        }),

        // 2. Optical Quartz Cuvette
        H('rect', {
          x: String(cuvetteX),
          y: String(cuvetteY),
          width: String(cuvetteW),
          height: String(cuvetteH),
          rx: '4',
          fill: 'url(#solGrad)',
          stroke: 'rgba(255,255,255,0.4)',
          'stroke-width': '2',
        }),
        // Cuvette Dimension Label
        H('line', {
          x1: String(cuvetteX),
          y1: String(cuvetteY + cuvetteH + 12),
          x2: String(cuvetteX + cuvetteW),
          y2: String(cuvetteY + cuvetteH + 12),
          stroke: '#fbbf24',
          'stroke-width': '1.5',
        }),
        H('text', {
          x: String(cuvetteX + cuvetteW / 2),
          y: String(cuvetteY + cuvetteH + 24),
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '9',
          'font-weight': 'bold',
          fill: '#fbbf24',
        }, `b = ${pathLengthCm.toFixed(1)} cm`),

        // Beam inside cuvette (attenuating)
        H('rect', {
          x: String(cuvetteX),
          y: '114',
          width: String(cuvetteW),
          height: '12',
          fill: '#ffffff',
          opacity: String(0.85 * (1 + exitOpacity) / 2),
        }),

        // Exiting Transmitted Beam
        H('rect', {
          x: String(cuvetteX + cuvetteW),
          y: '114',
          width: String(570 - (cuvetteX + cuvetteW)),
          height: '12',
          fill: beamColor,
          opacity: String(exitOpacity),
          filter: exitOpacity > 0.2 ? 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))' : 'none',
        }),

        // 3. Photodiode Detector
        H('rect', { x: '570', y: '80', width: '70', height: '80', rx: '6', fill: '#0f172a', stroke: '#10b981', 'stroke-width': '1.5' }),
        H('text', { x: '605', y: '100', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '8', fill: '#94a3b8' }, 'PHOTODETECTOR'),
        H('text', {
          x: '605',
          y: '125',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '13',
          'font-weight': 'bold',
          fill: '#10b981',
        }, `${state.transmittancePct.toFixed(1)}%`),
        H('text', { x: '605', y: '144', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '8', fill: '#6ee7b7' }, `T = I / I₀`),
      ),

      // Gauges Matrix
      H('div', { class: 'mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center text-[10.5px]' },
        H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-2' },
          H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block' }, 'Absorbance (A)'),
          H('span', { class: `font-bold text-[14px] ${statusColor}` }, state.absorbance.toFixed(3)),
        ),
        H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-2' },
          H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block' }, 'Transmittance (%T)'),
          H('span', { class: 'font-bold text-sky-300 text-[14px]' }, `${state.transmittancePct.toFixed(2)}%`),
        ),
        H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-2' },
          H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block' }, 'Path Length (b)'),
          H('span', { class: 'font-bold text-amber-300 text-[14px]' }, `${state.pathLengthCm.toFixed(1)} cm`),
        ),
        H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-2' },
          H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block' }, 'Concentration (c)'),
          H('span', { class: 'font-bold text-emerald-300 text-[14px]' }, `${(state.concentrationM * 1000).toFixed(2)} mM`),
        ),
      ),
    ),

    // Sliders Panel
    H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1220] p-3 grid grid-cols-1 md:grid-cols-3 gap-3 font-mono' },
      // Path length
      H('div', null,
        H('div', { class: 'flex justify-between text-[10.5px] mb-1' },
          H('span', { class: 'text-zinc-400' }, 'Cuvette Path Length (b):'),
          H('span', { class: 'text-amber-300 font-bold' }, `${pathLengthCm.toFixed(1)} cm`),
        ),
        H('input', {
          type: 'range',
          min: '0.2',
          max: '5.0',
          step: '0.1',
          value: String(pathLengthCm),
          onInput: (e: Event) => onChangePathLength(parseFloat((e.target as HTMLInputElement).value)),
          oninput: (e: Event) => onChangePathLength(parseFloat((e.target as HTMLInputElement).value)),
          class: 'w-full h-1.5 bg-zinc-700 rounded accent-amber-400 cursor-pointer',
        }),
      ),

      // Concentration
      H('div', null,
        H('div', { class: 'flex justify-between text-[10.5px] mb-1' },
          H('span', { class: 'text-zinc-400' }, 'Molar Concentration (c):'),
          H('span', { class: 'text-emerald-300 font-bold' }, `${(concentrationM * 1000).toFixed(2)} mM`),
        ),
        H('input', {
          type: 'range',
          min: '0.0001',
          max: '0.0200',
          step: '0.0002',
          value: String(concentrationM),
          onInput: (e: Event) => onChangeConcentration(parseFloat((e.target as HTMLInputElement).value)),
          oninput: (e: Event) => onChangeConcentration(parseFloat((e.target as HTMLInputElement).value)),
          class: 'w-full h-1.5 bg-zinc-700 rounded accent-emerald-400 cursor-pointer',
        }),
      ),

      // Molar Extinction
      H('div', null,
        H('div', { class: 'flex justify-between text-[10.5px] mb-1' },
          H('span', { class: 'text-zinc-400' }, 'Molar Absorptivity (ε):'),
          H('span', { class: 'text-sky-300 font-bold' }, `${molarExtinction.toFixed(0)} M⁻¹cm⁻¹`),
        ),
        H('input', {
          type: 'range',
          min: '10',
          max: '5000',
          step: '50',
          value: String(molarExtinction),
          onInput: (e: Event) => onChangeExtinction(parseFloat((e.target as HTMLInputElement).value)),
          oninput: (e: Event) => onChangeExtinction(parseFloat((e.target as HTMLInputElement).value)),
          class: 'w-full h-1.5 bg-zinc-700 rounded accent-sky-400 cursor-pointer',
        }),
      ),
    ),
  )
}
