/**
 * Electrochemistry & Battery Lab Workbench
 * Interactive Galvanic cell simulator, Nernst equation engine,
 * commercial battery architectures (Li-Ion, LFP, Solid-State, Na-Ion, Fuel Cell),
 * and standard reduction potential series ladder.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import {
  HALF_REACTIONS,
  getHalfReactionById,
  BATTERY_ARCHITECTURES,
} from '@/lib/electrochemistry/database'
import {
  computeNernstCell,
  generateOverallCellEquation,
} from '@/lib/electrochemistry/nernst'
import type { HalfReaction } from '@/lib/electrochemistry/types'
import { CellVisualizer } from './CellVisualizer'
import { BatteryLab } from './BatteryLab'
import { PotentialLadder } from './PotentialLadder'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export const PRESETS = [
  { label: '⚡ Daniell Cell (Zn-Cu)', anodeId: 'zn2-zn', cathodeId: 'cu2-cu', aConc: 1.0, cConc: 1.0 },
  { label: '🔋 Lead-Acid (Pb-PbO₂)', anodeId: 'pb2-pb', cathodeId: 'pbo2-pbso4', aConc: 1.0, cConc: 1.0 },
  { label: '🚗 High-Voltage Li-Cu', anodeId: 'li-li', cathodeId: 'cu2-cu', aConc: 0.1, cConc: 1.5 },
  { label: '🛡️ Sacrificial Zinc Rust (Zn-Fe)', anodeId: 'zn2-zn', cathodeId: 'fe2-fe', aConc: 1.0, cConc: 0.5 },
  { label: '🥈 Silver Plating (Cu-Ag)', anodeId: 'cu2-cu', cathodeId: 'ag-ag', aConc: 0.5, cConc: 1.0 },
  { label: '💧 H₂/O₂ Fuel Cell Pair', anodeId: 'h2-she', cathodeId: 'o2-h2o', aConc: 1.0, cConc: 1.0 },
]

export const electroStore = reactive({
  anodeId: 'zn2-zn',
  cathodeId: 'cu2-cu',
  anodeConc: 1.0,
  cathodeConc: 1.0,
  tempK: 298.15,
  circuitMode: 'voltmeter' as 'voltmeter' | 'bulb' | 'open',
  activeTab: 'galvanic' as 'galvanic' | 'battery' | 'ladder',
  activeBatteryId: 'li-ion-nmc',
  batterySoc: 80,
  searchQuery: '',
})

export function ElectrochemistryWorkbench(): VNode {
  const anodeHalf = getHalfReactionById(electroStore.anodeId) ?? HALF_REACTIONS[19] // Zn
  const cathodeHalf = getHalfReactionById(electroStore.cathodeId) ?? HALF_REACTIONS[10] // Cu

  const nernst = computeNernstCell(
    anodeHalf,
    cathodeHalf,
    electroStore.anodeConc,
    electroStore.cathodeConc,
    electroStore.tempK
  )

  const overallEquation = generateOverallCellEquation(anodeHalf, cathodeHalf)

  const loadPreset = (p: (typeof PRESETS)[0]) => {
    electroStore.anodeId = p.anodeId
    electroStore.cathodeId = p.cathodeId
    electroStore.anodeConc = p.aConc
    electroStore.cathodeConc = p.cConc
    electroStore.activeTab = 'galvanic'
  }

  return H('div', { class: 'flex h-full w-full flex-col overflow-hidden bg-[#070a12] text-zinc-100 select-none' },
    // --- TOP SUB-HEADER CONTROLS ---
    H('div', { class: 'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0c1220] px-4 py-2.5' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-[15px]' }, '⚡'),
        H('span', { class: 'font-semibold text-zinc-100 text-[13px]' }, 'Electrochemistry & Battery Lab'),
        H('span', { class: 'hidden rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-emerald-300 md:inline' }, 'NERNST & FARADAY ENGINE'),
      ),

      // Navigation Mode Tabs
      H('div', { class: 'flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-0.5' },
        H('button', {
          type: 'button',
          onClick: () => { electroStore.activeTab = 'galvanic' },
          onclick: () => { electroStore.activeTab = 'galvanic' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${
            electroStore.activeTab === 'galvanic' ? 'bg-amber-400/20 text-amber-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`,
        }, '⚡ Galvanic Cell & Nernst'),
        H('button', {
          type: 'button',
          onClick: () => { electroStore.activeTab = 'battery' },
          onclick: () => { electroStore.activeTab = 'battery' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${
            electroStore.activeTab === 'battery' ? 'bg-sky-400/20 text-sky-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`,
        }, '🔋 Commercial Battery Lab (6)'),
        H('button', {
          type: 'button',
          onClick: () => { electroStore.activeTab = 'ladder' },
          onclick: () => { electroStore.activeTab = 'ladder' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${
            electroStore.activeTab === 'ladder' ? 'bg-emerald-400/20 text-emerald-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`,
        }, `📊 Reduction Series (${HALF_REACTIONS.length})`),
      ),

      // Presets Pills
      H('div', { class: 'flex items-center gap-1.5 overflow-x-auto max-w-full' },
        H('span', { class: 'text-[10px] text-zinc-500 uppercase tracking-wider font-mono' }, 'Cells:'),
        ...PRESETS.slice(0, 5).map((preset) => H('button', {
          key: preset.label,
          type: 'button',
          onClick: () => loadPreset(preset),
          onclick: () => loadPreset(preset),
          class: 'cursor-pointer rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-200',
        }, preset.label)),
      ),
    ),

    // --- MAIN VIEW BY ACTIVE TAB ---
    electroStore.activeTab === 'galvanic'
      ? H('div', { class: 'grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12 min-h-0' },
          // === LEFT COLUMN: CELL HALF-REACTIONS & NERNST CONTROLS (4 COLS) ===
          H('div', { class: 'flex flex-col border-r border-white/10 bg-[#080d18] p-3 overflow-y-auto lg:col-span-4 min-h-0 space-y-3' },
            // Anode Selection Box
            H('div', { class: 'rounded-xl border border-rose-500/30 bg-[#12080f] p-3' },
              H('div', { class: 'flex items-center justify-between mb-1.5' },
                H('span', { class: 'text-[11px] font-bold text-rose-300 uppercase tracking-wider font-mono' }, '🔴 Anode (Oxidation / Negative -)'),
                H('span', { class: 'font-mono text-[10px] text-zinc-400' }, `E° = ${anodeHalf.standardPotential.toFixed(2)} V`),
              ),
              H('select', {
                value: electroStore.anodeId,
                onChange: (e: Event) => { electroStore.anodeId = (e.target as HTMLSelectElement).value },
                onchange: (e: Event) => { electroStore.anodeId = (e.target as HTMLSelectElement).value },
                class: 'w-full rounded border border-white/15 bg-black/60 px-2 py-1.5 font-mono text-[11px] text-rose-200 focus:outline-none cursor-pointer',
              },
                ...HALF_REACTIONS.map((rxn) => H('option', {
                  key: `an-${rxn.id}`,
                  value: rxn.id,
                  selected: rxn.id === electroStore.anodeId,
                }, `${rxn.metal} — ${rxn.name} (${rxn.standardPotential >= 0 ? '+' : ''}${rxn.standardPotential.toFixed(2)}V)`)),
              ),
              // Anode Ion Concentration Slider
              H('div', { class: 'mt-2.5' },
                H('div', { class: 'flex items-center justify-between font-mono text-[10px] mb-1' },
                  H('span', { class: 'text-zinc-400' }, `[${anodeHalf.ionSpecies}] Concentration:`),
                  H('span', { class: 'text-rose-300 font-bold' }, `${electroStore.anodeConc.toFixed(2)} M`),
                ),
                H('input', {
                  type: 'range',
                  min: '0.01',
                  max: '3.0',
                  step: '0.05',
                  value: String(electroStore.anodeConc),
                  onInput: (e: Event) => { electroStore.anodeConc = parseFloat((e.target as HTMLInputElement).value) },
                  oninput: (e: Event) => { electroStore.anodeConc = parseFloat((e.target as HTMLInputElement).value) },
                  class: 'w-full h-1.5 bg-zinc-700 rounded appearance-none accent-rose-400 cursor-pointer',
                }),
              ),
            ),

            // Cathode Selection Box
            H('div', { class: 'rounded-xl border border-sky-500/30 bg-[#091222] p-3' },
              H('div', { class: 'flex items-center justify-between mb-1.5' },
                H('span', { class: 'text-[11px] font-bold text-sky-300 uppercase tracking-wider font-mono' }, '🔵 Cathode (Reduction / Positive +)'),
                H('span', { class: 'font-mono text-[10px] text-zinc-400' }, `E° = ${cathodeHalf.standardPotential.toFixed(2)} V`),
              ),
              H('select', {
                value: electroStore.cathodeId,
                onChange: (e: Event) => { electroStore.cathodeId = (e.target as HTMLSelectElement).value },
                onchange: (e: Event) => { electroStore.cathodeId = (e.target as HTMLSelectElement).value },
                class: 'w-full rounded border border-white/15 bg-black/60 px-2 py-1.5 font-mono text-[11px] text-sky-200 focus:outline-none cursor-pointer',
              },
                ...HALF_REACTIONS.map((rxn) => H('option', {
                  key: `cat-${rxn.id}`,
                  value: rxn.id,
                  selected: rxn.id === electroStore.cathodeId,
                }, `${rxn.metal} — ${rxn.name} (${rxn.standardPotential >= 0 ? '+' : ''}${rxn.standardPotential.toFixed(2)}V)`)),
              ),
              // Cathode Ion Concentration Slider
              H('div', { class: 'mt-2.5' },
                H('div', { class: 'flex items-center justify-between font-mono text-[10px] mb-1' },
                  H('span', { class: 'text-zinc-400' }, `[${cathodeHalf.ionSpecies}] Concentration:`),
                  H('span', { class: 'text-sky-300 font-bold' }, `${electroStore.cathodeConc.toFixed(2)} M`),
                ),
                H('input', {
                  type: 'range',
                  min: '0.01',
                  max: '3.0',
                  step: '0.05',
                  value: String(electroStore.cathodeConc),
                  onInput: (e: Event) => { electroStore.cathodeConc = parseFloat((e.target as HTMLInputElement).value) },
                  oninput: (e: Event) => { electroStore.cathodeConc = parseFloat((e.target as HTMLInputElement).value) },
                  class: 'w-full h-1.5 bg-zinc-700 rounded appearance-none accent-sky-400 cursor-pointer',
                }),
              ),
            ),

            // Temperature Controls
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1322] p-3' },
              H('div', { class: 'flex items-center justify-between font-mono text-[10px] mb-1.5' },
                H('span', { class: 'text-zinc-300 uppercase font-bold' }, 'Cell Temperature:'),
                H('span', { class: 'text-amber-300 font-bold' }, `${electroStore.tempK.toFixed(1)} K (${(electroStore.tempK - 273.15).toFixed(1)} °C)`),
              ),
              H('input', {
                type: 'range',
                min: '273.15',
                max: '373.15',
                step: '1',
                value: String(electroStore.tempK),
                onInput: (e: Event) => { electroStore.tempK = parseFloat((e.target as HTMLInputElement).value) },
                oninput: (e: Event) => { electroStore.tempK = parseFloat((e.target as HTMLInputElement).value) },
                class: 'w-full h-1.5 bg-zinc-700 rounded appearance-none accent-amber-400 cursor-pointer mb-2',
              }),
              H('div', { class: 'flex justify-between font-mono text-[8.5px] text-zinc-500' },
                H('button', { type: 'button', onClick: () => { electroStore.tempK = 273.15 }, class: 'hover:text-zinc-300' }, '0°C (Ice)'),
                H('button', { type: 'button', onClick: () => { electroStore.tempK = 298.15 }, class: 'text-amber-400 font-bold' }, '25°C (STP)'),
                H('button', { type: 'button', onClick: () => { electroStore.tempK = 373.15 }, class: 'hover:text-zinc-300' }, '100°C (Boil)'),
              ),
            ),

            // Nernst Equation Breakdown Card
            H('div', { class: 'rounded-xl border border-amber-500/30 bg-[#16120b] p-3 font-mono text-[10.5px]' },
              H('div', { class: 'text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center justify-between' },
                H('span', null, 'Nernst Formulation'),
                H('span', { class: 'text-zinc-400' }, `E = E° - (RT/nF)·ln(Q)`),
              ),
              H('div', { class: 'rounded bg-black/50 p-2 border border-white/5 space-y-1 text-[10px]' },
                H('div', { class: 'text-zinc-300' },
                  H('span', { class: 'text-zinc-500' }, 'E°_cell = '),
                  `${cathodeHalf.standardPotential.toFixed(2)}V - (${anodeHalf.standardPotential.toFixed(2)}V) = `,
                  H('span', { class: 'text-amber-300 font-bold' }, `${nernst.standardPotential.toFixed(3)} V`),
                ),
                H('div', { class: 'text-zinc-300' },
                  H('span', { class: 'text-zinc-500' }, 'Reaction Quotient Q = '),
                  H('span', { class: 'text-sky-300' }, nernst.reactionQuotientQ.toFixed(4)),
                ),
                H('div', { class: 'text-zinc-300' },
                  H('span', { class: 'text-zinc-500' }, 'Thermal Shift ΔE = '),
                  `${(nernst.cellPotential - nernst.standardPotential).toFixed(4)} V`,
                ),
              ),
            ),
          ),

          // === RIGHT COLUMN: CELL VISUALIZATION & APPARATUS (8 COLS) ===
          H('div', { class: 'flex flex-col bg-[#05070d] p-3 overflow-y-auto lg:col-span-8 min-h-0 space-y-3' },
            // Balanced Overall Reaction Equation Banner
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1220] p-3 text-center shadow-lg' },
              H('div', { class: 'text-[9.5px] font-mono text-zinc-400 uppercase tracking-wider mb-1' }, 'Overall Spontaneous Cell Reaction:'),
              H('div', { class: 'font-mono text-[18px] sm:text-[20px] font-bold tracking-wider text-amber-200' }, overallEquation),
              H('div', { class: 'mt-1 flex flex-wrap justify-center items-center gap-3 text-[10px] font-mono text-zinc-400' },
                H('span', null, `Electrons Transferred: n = 2`),
                H('span', null, '·'),
                H('span', null, `Salt Bridge Electrolyte: Agar-KNO₃`),
                H('span', null, '·'),
                H('span', { class: nernst.isSpontaneous ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold' },
                  nernst.isSpontaneous ? 'Spontaneous Galvanic Mode' : 'Electrolysis Mode'
                ),
              ),
            ),

            // Animated Visualizer
            H(CellVisualizer, {
              anodeHalf,
              cathodeHalf,
              nernst,
              circuitMode: electroStore.circuitMode,
              onToggleCircuit: (m) => { electroStore.circuitMode = m },
            }),
          ),
        )
      : electroStore.activeTab === 'battery'
      // === BATTERY LAB TAB ===
      ? H('div', { class: 'flex-1 overflow-y-auto p-4' },
          H(BatteryLab, {
            activeBatteryId: electroStore.activeBatteryId,
            socPercent: electroStore.batterySoc,
            onSelectBattery: (id) => { electroStore.activeBatteryId = id },
            onChangeSoc: (soc) => { electroStore.batterySoc = soc },
          }),
        )
      // === REDUCTION SERIES LADDER TAB ===
      : H('div', { class: 'flex-1 overflow-y-auto p-4' },
          H(PotentialLadder, {
            anodeId: electroStore.anodeId,
            cathodeId: electroStore.cathodeId,
            searchQuery: electroStore.searchQuery,
            onSetAnode: (rxn) => {
              electroStore.anodeId = rxn.id
              electroStore.activeTab = 'galvanic'
            },
            onSetCathode: (rxn) => {
              electroStore.cathodeId = rxn.id
              electroStore.activeTab = 'galvanic'
            },
          }),
        ),
  )
}
