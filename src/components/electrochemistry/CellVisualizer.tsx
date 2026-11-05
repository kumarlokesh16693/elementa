/**
 * Animated Interactive Electrochemical Cell Visualizer
 * Renders dual beakers (Anode oxidation & Cathode reduction), U-shaped salt bridge
 * with ion migration, electron flow along external circuit wire, and digital LED voltmeter.
 */

import { h, type VNode } from 'nexus-framework'
import type { HalfReaction, NernstCalculation } from '@/lib/electrochemistry/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function CellVisualizer({
  anodeHalf,
  cathodeHalf,
  nernst,
  circuitMode = 'voltmeter',
  onToggleCircuit,
}: {
  anodeHalf: HalfReaction
  cathodeHalf: HalfReaction
  nernst: NernstCalculation
  circuitMode?: 'voltmeter' | 'bulb' | 'open'
  onToggleCircuit?: (mode: 'voltmeter' | 'bulb' | 'open') => void
}): VNode {
  const isSpont = nernst.cellPotential > 0
  const vDisplay = nernst.cellPotential.toFixed(3)

  // SVG viewBox coordinates
  const W = 700
  const H_PX = 380

  return H('div', { class: 'relative flex flex-col rounded-xl border border-white/10 bg-[#070b14] p-3 shadow-2xl' },
    // Instrument Header & Circuit Mode Switcher
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-amber-400 font-mono text-sm' }, '⚡'),
        H('span', { class: 'text-[13px] font-bold text-zinc-100' }, 'Galvanic / Voltaic Cell Apparatus'),
        H('span', {
          class: `rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
            isSpont ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'
          }`,
        }, isSpont ? '✓ Spontaneous Discharge' : '⚠ Non-Spontaneous (Electrolysis Required)'),
      ),

      // Circuit Load Toggle
      H('div', { class: 'flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-0.5 text-[9.5px] font-mono' },
        H('button', {
          type: 'button',
          onClick: () => onToggleCircuit?.('voltmeter'),
          onclick: () => onToggleCircuit?.('voltmeter'),
          class: `cursor-pointer rounded px-2 py-0.5 transition ${circuitMode === 'voltmeter' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400'}`,
        }, '📟 Digital Voltmeter'),
        H('button', {
          type: 'button',
          onClick: () => onToggleCircuit?.('bulb'),
          onclick: () => onToggleCircuit?.('bulb'),
          class: `cursor-pointer rounded px-2 py-0.5 transition ${circuitMode === 'bulb' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400'}`,
        }, '💡 Light Bulb Load'),
        H('button', {
          type: 'button',
          onClick: () => onToggleCircuit?.('open'),
          onclick: () => onToggleCircuit?.('open'),
          class: `cursor-pointer rounded px-2 py-0.5 transition ${circuitMode === 'open' ? 'bg-rose-400/20 text-rose-300 font-bold' : 'text-zinc-400'}`,
        }, '⏚ Open Circuit'),
      ),
    ),

    // Animated Cell Schematic SVG
    H('div', { class: 'relative w-full overflow-hidden' },
      H('svg', {
        viewBox: `0 0 ${W} ${H_PX}`,
        class: 'w-full h-auto select-none',
        xmlns: 'http://www.w3.org/2000/svg',
      },
        H('defs', null,
          // Anode Solution Gradient
          H('linearGradient', { id: 'anodeGrad', x1: '0', y1: '0', x2: '0', y2: '1' },
            H('stop', { offset: '0%', 'stop-color': anodeHalf.solutionColor, 'stop-opacity': '0.4' }),
            H('stop', { offset: '100%', 'stop-color': anodeHalf.solutionColor, 'stop-opacity': '0.75' }),
          ),
          // Cathode Solution Gradient
          H('linearGradient', { id: 'cathodeGrad', x1: '0', y1: '0', x2: '0', y2: '1' },
            H('stop', { offset: '0%', 'stop-color': cathodeHalf.solutionColor, 'stop-opacity': '0.4' }),
            H('stop', { offset: '100%', 'stop-color': cathodeHalf.solutionColor, 'stop-opacity': '0.85' }),
          ),
          // Salt Bridge Gradient
          H('linearGradient', { id: 'bridgeGrad', x1: '0', y1: '0', x2: '1', y2: '0' },
            H('stop', { offset: '0%', 'stop-color': '#1e293b' }),
            H('stop', { offset: '50%', 'stop-color': '#334155' }),
            H('stop', { offset: '100%', 'stop-color': '#1e293b' }),
          ),
        ),

        // === 1. LEFT BEAKER (ANODE - OXIDATION) ===
        // Glass outline
        H('rect', {
          x: '80',
          y: '140',
          width: '180',
          height: '210',
          rx: '10',
          fill: 'rgba(15, 23, 42, 0.4)',
          stroke: 'rgba(255,255,255,0.2)',
          'stroke-width': '2',
        }),
        // Liquid
        H('rect', {
          x: '84',
          y: '180',
          width: '172',
          height: '166',
          rx: '8',
          fill: 'url(#anodeGrad)',
        }),
        // Anode Electrode Rod
        H('rect', {
          x: '140',
          y: '100',
          width: '32',
          height: '180',
          rx: '3',
          fill: anodeHalf.color,
          stroke: '#ffffff',
          'stroke-width': '1',
          opacity: '0.9',
        }),
        // Anode Text Details
        H('text', {
          x: '170',
          y: '70',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '12',
          'font-weight': 'bold',
          fill: '#f43f5e',
        }, 'ANODE (-)'),
        H('text', {
          x: '170',
          y: '85',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '10',
          fill: '#cbd5e1',
        }, `Oxidation: ${anodeHalf.metal} → ${anodeHalf.ionSpecies} + ${anodeHalf.electrons}e⁻`),
        H('text', {
          x: '170',
          y: '330',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '9.5',
          fill: '#94a3b8',
        }, `[${anodeHalf.ionSpecies}] = ${nernst.anodeConc.toFixed(2)} M`),

        // Dissolved Cations floating in Anode beaker
        H('circle', { cx: '110', cy: '230', r: '12', fill: '#0f172a', stroke: '#f43f5e', 'stroke-width': '1.5' }),
        H('text', { x: '110', y: '234', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '8.5', fill: '#fda4af', 'font-weight': 'bold' }, anodeHalf.ionSpecies),

        H('circle', { cx: '210', cy: '270', r: '12', fill: '#0f172a', stroke: '#f43f5e', 'stroke-width': '1.5' }),
        H('text', { x: '210', y: '274', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '8.5', fill: '#fda4af', 'font-weight': 'bold' }, anodeHalf.ionSpecies),

        // === 2. RIGHT BEAKER (CATHODE - REDUCTION) ===
        // Glass outline
        H('rect', {
          x: '440',
          y: '140',
          width: '180',
          height: '210',
          rx: '10',
          fill: 'rgba(15, 23, 42, 0.4)',
          stroke: 'rgba(255,255,255,0.2)',
          'stroke-width': '2',
        }),
        // Liquid
        H('rect', {
          x: '444',
          y: '180',
          width: '172',
          height: '166',
          rx: '8',
          fill: 'url(#cathodeGrad)',
        }),
        // Cathode Electrode Rod
        H('rect', {
          x: '528',
          y: '100',
          width: '32',
          height: '180',
          rx: '3',
          fill: cathodeHalf.color,
          stroke: '#ffffff',
          'stroke-width': '1',
          opacity: '0.9',
        }),
        // Cathode Text Details
        H('text', {
          x: '530',
          y: '70',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '12',
          'font-weight': 'bold',
          fill: '#38bdf8',
        }, 'CATHODE (+)'),
        H('text', {
          x: '530',
          y: '85',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '10',
          fill: '#cbd5e1',
        }, `Reduction: ${cathodeHalf.ionSpecies} + ${cathodeHalf.electrons}e⁻ → ${cathodeHalf.metal}`),
        H('text', {
          x: '530',
          y: '330',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '9.5',
          fill: '#94a3b8',
        }, `[${cathodeHalf.ionSpecies}] = ${nernst.cathodeConc.toFixed(2)} M`),

        // Plating Cations in Cathode beaker
        H('circle', { cx: '480', cy: '240', r: '12', fill: '#0f172a', stroke: '#38bdf8', 'stroke-width': '1.5' }),
        H('text', { x: '480', y: '244', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '8.5', fill: '#bae6fd', 'font-weight': 'bold' }, cathodeHalf.ionSpecies),

        H('circle', { cx: '585', cy: '280', r: '12', fill: '#0f172a', stroke: '#38bdf8', 'stroke-width': '1.5' }),
        H('text', { x: '585', y: '284', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '8.5', fill: '#bae6fd', 'font-weight': 'bold' }, cathodeHalf.ionSpecies),

        // === 3. INVERTED U-SHAPED SALT BRIDGE ===
        H('path', {
          d: 'M 220 230 L 220 155 Q 220 135 240 135 L 460 135 Q 480 135 480 155 L 480 230 L 455 230 L 455 160 Q 455 155 450 155 L 250 155 Q 245 155 245 160 L 245 230 Z',
          fill: 'url(#bridgeGrad)',
          stroke: 'rgba(255,255,255,0.3)',
          'stroke-width': '1.5',
        }),
        H('text', {
          x: '350',
          y: '148',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '9',
          'font-weight': 'bold',
          fill: '#e2e8f0',
        }, 'SALT BRIDGE (KNO₃ / Agar)'),
        H('text', {
          x: '280',
          y: '172',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '8.5',
          fill: '#f43f5e',
        }, '◀ Cl⁻ / NO₃⁻'),
        H('text', {
          x: '420',
          y: '172',
          'text-anchor': 'middle',
          'font-family': 'monospace',
          'font-size': '8.5',
          fill: '#38bdf8',
        }, 'K⁺ ▶'),

        // === 4. EXTERNAL CIRCUIT WIRES ===
        // Wire from Anode upward
        H('path', {
          d: 'M 156 100 L 156 30 L 285 30',
          fill: 'none',
          stroke: '#eab308',
          'stroke-width': '2.5',
          'stroke-linecap': 'round',
        }),
        // Wire from Cathode upward
        H('path', {
          d: 'M 544 100 L 544 30 L 415 30',
          fill: 'none',
          stroke: '#eab308',
          'stroke-width': '2.5',
          'stroke-linecap': 'round',
        }),

        // Electron flow arrows
        isSpont && circuitMode !== 'open'
          ? H('g', null,
              H('text', { x: '210', y: '24', 'font-family': 'monospace', 'font-size': '9.5', fill: '#fef08a', 'font-weight': 'bold' }, 'e⁻ ➔ ➔ ➔'),
              H('text', { x: '460', y: '24', 'font-family': 'monospace', 'font-size': '9.5', fill: '#fef08a', 'font-weight': 'bold' }, 'e⁻ ➔ ➔ ➔'),
            )
          : null,

        // === 5. CENTER INSTRUMENT MODULE ===
        circuitMode === 'voltmeter'
          ? H('g', null,
              // Voltmeter Case
              H('rect', {
                x: '285',
                y: '10',
                width: '130',
                height: '42',
                rx: '6',
                fill: '#020617',
                stroke: '#38bdf8',
                'stroke-width': '1.8',
              }),
              // Digital LED Voltage Display
              H('text', {
                x: '350',
                y: '36',
                'text-anchor': 'middle',
                'font-family': 'monospace',
                'font-size': '17',
                'font-weight': 'bold',
                fill: isSpont ? '#38bdf8' : '#f43f5e',
                filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))',
              }, `${nernst.cellPotential >= 0 ? '+' : ''}${vDisplay} V`),
              H('text', {
                x: '350',
                y: '48',
                'text-anchor': 'middle',
                'font-family': 'monospace',
                'font-size': '7.5',
                fill: '#64748b',
              }, 'DIGITAL VOLTMETER'),
            )
          : circuitMode === 'bulb'
          ? H('g', null,
              // Light bulb socket
              H('rect', { x: '335', y: '22', width: '30', height: '16', rx: '2', fill: '#475569' }),
              // Bulb Glass
              H('circle', {
                cx: '350',
                cy: '14',
                r: '18',
                fill: isSpont ? 'rgba(250, 204, 21, 0.85)' : 'rgba(100, 116, 139, 0.4)',
                stroke: '#eab308',
                'stroke-width': '1.5',
                filter: isSpont ? 'drop-shadow(0 0 16px rgba(250, 204, 21, 0.9))' : 'none',
              }),
              H('text', {
                x: '350',
                y: '18',
                'text-anchor': 'middle',
                'font-size': '14',
              }, isSpont ? '💡' : '○'),
            )
          : H('g', null,
              // Open switch
              H('circle', { cx: '330', cy: '30', r: '4', fill: '#ef4444' }),
              H('circle', { cx: '370', cy: '30', r: '4', fill: '#ef4444' }),
              H('line', { x1: '330', y1: '30', x2: '360', y2: '16', stroke: '#ef4444', 'stroke-width': '2' }),
              H('text', { x: '350', y: '48', 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '8', fill: '#ef4444' }, 'CIRCUIT OPEN'),
            ),
      ),
    ),

    // Quick Thermodynamic Indicators Bar below visualizer
    H('div', { class: 'mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-center text-[10.5px]' },
      H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-1.5' },
        H('span', { class: 'text-[8px] text-zinc-500 uppercase block' }, 'Standard Potential E°'),
        H('span', { class: 'font-bold text-amber-300 text-[12px]' }, `${nernst.standardPotential >= 0 ? '+' : ''}${nernst.standardPotential.toFixed(3)} V`),
      ),
      H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-1.5' },
        H('span', { class: 'text-[8px] text-zinc-500 uppercase block' }, 'Nernst Potential E_cell'),
        H('span', { class: `font-bold text-[12px] ${isSpont ? 'text-emerald-300' : 'text-rose-400'}` },
          `${nernst.cellPotential >= 0 ? '+' : ''}${vDisplay} V`
        ),
      ),
      H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-1.5' },
        H('span', { class: 'text-[8px] text-zinc-500 uppercase block' }, 'Gibbs Energy ΔG'),
        H('span', { class: `font-bold text-[12px] ${nernst.deltaG < 0 ? 'text-emerald-300' : 'text-rose-400'}` },
          `${nernst.deltaG.toFixed(1)} kJ/mol`
        ),
      ),
      H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-1.5' },
        H('span', { class: 'text-[8px] text-zinc-500 uppercase block' }, 'Equilibrium Const. K'),
        H('span', { class: 'font-bold text-violet-300 text-[12px] truncate' },
          nernst.equilibriumConstantK === Infinity
            ? '>> 10¹⁰'
            : nernst.equilibriumConstantK === 0
            ? '<< 10⁻¹⁰'
            : nernst.equilibriumConstantK.toExponential(2)
        ),
      ),
    ),
  )
}
