import { h, reactive, type VNode } from 'nexus-framework'
import {
  getAllCompounds,
  getCompoundById,
  getAllReactions,
  findSynthesizableCompounds,
  findRelatedCompounds,
  computeReactionThermodynamics,
} from '@/lib/synthesizer/engine'
import type { Compound, ChemicalReaction, ThermodynamicState, CompoundCategory } from '@/lib/synthesizer/types'
import { getElement, ELEMENTS } from '@/lib/periodic'
import { MolecularSvg } from './MolecularSvg'
import './compound-3d-element'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export const PRESETS = [
  { label: '💧 Water & Peroxide', zList: [1, 8], activeCompound: 'H2O', rxnId: 'water-synthesis' },
  { label: '🌱 Haber Ammonia', zList: [7, 1], activeCompound: 'NH3', rxnId: 'haber-bosch' },
  { label: '🔥 Thermite Reaction', zList: [13, 26, 8], activeCompound: 'Al2O3', rxnId: 'thermite' },
  { label: '🧂 Rock Salt', zList: [11, 17], activeCompound: 'NaCl', rxnId: 'neutralization' },
  { label: '🏗️ Rust Oxidation', zList: [26, 8], activeCompound: 'Fe2O3', rxnId: 'iron-rusting' },
  { label: '📱 5G GaAs', zList: [31, 33], activeCompound: 'GaAs', rxnId: 'gaas-synthesis' },
  { label: '🏎️ EV Inverter SiC', zList: [14, 6], activeCompound: 'SiC', rxnId: 'sic-synthesis' },
  { label: '🔋 Li-Ion Cathode', zList: [3, 27, 8], activeCompound: 'LiCoO2', rxnId: null },
  { label: '🪨 Limestone Calcination', zList: [20, 6, 8], activeCompound: 'CaCO3', rxnId: 'calcination' },
  { label: '⚡ Methane Flame', zList: [6, 1, 8], activeCompound: 'CH4', rxnId: 'methane-combustion' },
]

// Module-level reactive store ensures state survives re-renders
export const synthStore = reactive({
  selectedZ: [1, 8] as number[],
  activeCompoundId: 'H2O',
  activeReactionId: 'water-synthesis',
  viewStyle: 'ball-stick' as 'ball-stick' | 'space-filling' | 'wireframe',
  autoRotate: true,
  tempK: 298.15,
  searchQuery: '',
  categoryFilter: 'all' as 'all' | CompoundCategory,
  activeTab: 'reactor' as 'reactor' | 'compounds' | 'reactions',
})

let isInitialized = false

export function initSynthesizerState(initialZ?: number | null) {
  if (isInitialized) return
  isInitialized = true
  if (initialZ && initialZ >= 1 && initialZ <= 118) {
    const related = findRelatedCompounds([initialZ])
    synthStore.selectedZ = [initialZ, initialZ === 8 ? 1 : 8]
    if (related.length > 0) {
      synthStore.activeCompoundId = related[0].id
    }
  }
}

export function SynthesizerWorkbench({ initialZ }: { initialZ?: number | null } = {}): VNode {
  if (!isInitialized && initialZ) {
    initSynthesizerState(initialZ)
  }

  const toggleElement = (z: number) => {
    if (synthStore.selectedZ.includes(z)) {
      if (synthStore.selectedZ.length > 1) {
        synthStore.selectedZ = synthStore.selectedZ.filter((item) => item !== z)
      }
    } else {
      if (synthStore.selectedZ.length < 5) {
        synthStore.selectedZ = [...synthStore.selectedZ, z]
      }
    }

    // Auto-select first synthesizable compound
    const synthesizable = findSynthesizableCompounds(synthStore.selectedZ)
    if (synthesizable.length > 0) {
      synthStore.activeCompoundId = synthesizable[0].id
    } else {
      const related = findRelatedCompounds(synthStore.selectedZ)
      if (related.length > 0) {
        synthStore.activeCompoundId = related[0].id
      }
    }
  }

  const loadPreset = (preset: typeof PRESETS[0]) => {
    synthStore.selectedZ = [...preset.zList]
    synthStore.activeCompoundId = preset.activeCompound
    if (preset.rxnId) synthStore.activeReactionId = preset.rxnId
  }

  const loadReaction = (rxn: ChemicalReaction) => {
    synthStore.activeReactionId = rxn.id
    synthStore.activeTab = 'reactor'
    // Extract elements from reaction
    const zSet = new Set<number>()
    rxn.reactants.forEach((r) => {
      const el = ELEMENTS.find((e) => e.symbol.toLowerCase() === r.compoundId.toLowerCase())
      if (el) zSet.add(el.number)
      const comp = getCompoundById(r.compoundId)
      if (comp) comp.elements.forEach((e) => zSet.add(e.z))
    })
    rxn.products.forEach((p) => {
      const comp = getCompoundById(p.compoundId)
      if (comp) comp.elements.forEach((e) => zSet.add(e.z))
    })
    if (zSet.size > 0) {
      synthStore.selectedZ = Array.from(zSet).slice(0, 5)
    }
    if (rxn.products.length > 0) {
      synthStore.activeCompoundId = rxn.products[0].compoundId
    }
  }

  const activeCompound = getCompoundById(synthStore.activeCompoundId) ?? getAllCompounds()[0]
  const allReactions = getAllReactions()
  const activeReaction = allReactions.find((r) => r.id === synthStore.activeReactionId) ?? allReactions[0]
  const thermo: ThermodynamicState = computeReactionThermodynamics(activeReaction, synthStore.tempK)
  const synthesizableCompounds = findSynthesizableCompounds(synthStore.selectedZ)
  const relatedCompounds = findRelatedCompounds(synthStore.selectedZ).filter(
    (c) => !synthesizableCompounds.some((sc) => sc.id === c.id)
  )

  // Color mapping based on thermal rating
  let reactionGlow = 'rgba(56, 189, 248, 0.2)'
  let reactionBorder = 'border-sky-400/30'
  if (thermo.thermalRating === 'extremely-exothermic') {
    reactionGlow = 'rgba(234, 88, 12, 0.45)'
    reactionBorder = 'border-orange-500/60 shadow-[0_0_30px_rgba(234,88,12,0.3)]'
  } else if (thermo.thermalRating === 'exothermic') {
    reactionGlow = 'rgba(251, 191, 36, 0.35)'
    reactionBorder = 'border-amber-400/50'
  } else if (thermo.thermalRating === 'endothermic') {
    reactionGlow = 'rgba(14, 165, 233, 0.35)'
    reactionBorder = 'border-sky-400/40'
  }

  // Filtered compounds for Compound Library Tab
  const allCompoundsList = getAllCompounds().filter((c) => {
    if (synthStore.categoryFilter !== 'all' && c.category !== synthStore.categoryFilter) return false
    if (synthStore.searchQuery.trim()) {
      const q = synthStore.searchQuery.toLowerCase().trim()
      return (
        c.name.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q) ||
        c.rawFormula.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      )
    }
    return true
  })

  return H('div', { class: 'flex h-full w-full flex-col overflow-hidden bg-[#070a12] text-zinc-100 select-none' },
    // --- TOP SUB-HEADER CONTROLS ---
    H('div', { class: 'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0c1220] px-4 py-2.5' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-[15px]' }, '⚗️'),
        H('span', { class: 'font-semibold text-zinc-100 text-[13px]' }, 'Compound & Reaction Synthesizer'),
        H('span', { class: 'hidden rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-rose-300 md:inline' }, 'THERMO-KINETIC ENGINE'),
      ),

      // Navigation Mode Tabs
      H('div', { class: 'flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-0.5' },
        H('button', {
          type: 'button',
          onClick: () => { synthStore.activeTab = 'reactor' },
          onclick: () => { synthStore.activeTab = 'reactor' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${synthStore.activeTab === 'reactor' ? 'bg-amber-400/20 text-amber-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`,
        }, '🔥 Reaction Crucible'),
        H('button', {
          type: 'button',
          onClick: () => { synthStore.activeTab = 'compounds' },
          onclick: () => { synthStore.activeTab = 'compounds' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${synthStore.activeTab === 'compounds' ? 'bg-sky-400/20 text-sky-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`,
        }, `🧬 3D Compound Library (${getAllCompounds().length})`),
        H('button', {
          type: 'button',
          onClick: () => { synthStore.activeTab = 'reactions' },
          onclick: () => { synthStore.activeTab = 'reactions' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${synthStore.activeTab === 'reactions' ? 'bg-emerald-400/20 text-emerald-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`,
        }, `📜 All Reactions (${allReactions.length})`),
      ),

      // Presets dropdown/pills
      H('div', { class: 'flex items-center gap-1.5 overflow-x-auto max-w-full' },
        H('span', { class: 'text-[10px] text-zinc-500 uppercase tracking-wider font-mono' }, 'Presets:'),
        ...PRESETS.slice(0, 5).map((preset) => H('button', {
          key: preset.label,
          type: 'button',
          onClick: () => loadPreset(preset),
          onclick: () => loadPreset(preset),
          class: 'cursor-pointer rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-300 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-200',
        }, preset.label)),
      ),
    ),

    // --- MAIN VIEW BODY (BY ACTIVE TAB) ---
    synthStore.activeTab === 'reactor'
      ? H('div', { class: 'grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12 min-h-0' },
          // === LEFT COLUMN: ELEMENT BENCH & COMPOUND SELECTOR (4 COLS) ===
          H('div', { class: 'flex flex-col border-r border-white/10 bg-[#080d18] p-3 overflow-y-auto lg:col-span-4 min-h-0 space-y-3' },
            // Reactant Selection Tray
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1322] p-3' },
              H('div', { class: 'flex items-center justify-between mb-2' },
                H('span', { class: 'text-[11px] font-semibold text-zinc-300 uppercase tracking-wider' }, '🧪 Reactant Crucible'),
                H('span', { class: 'font-mono text-[9px] text-zinc-500' }, `${synthStore.selectedZ.length}/5 elements selected`),
              ),

              // Active Elements Chips
              H('div', { class: 'flex flex-wrap gap-1.5 min-h-[36px] items-center p-1.5 rounded-lg border border-dashed border-white/15 bg-black/30' },
                ...synthStore.selectedZ.map((z) => {
                  const el = getElement(z)
                  if (!el) return null
                  return H('div', {
                    key: `chip-${z}`,
                    class: 'flex items-center gap-1.5 rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-amber-300 shadow-sm',
                  },
                    H('span', { class: 'font-mono text-[9px] text-amber-400/70' }, z),
                    H('span', { class: 'font-bold text-[11px]' }, el.symbol),
                    H('span', { class: 'text-[9.5px] opacity-80' }, el.name),
                    H('button', {
                      type: 'button',
                      onClick: () => toggleElement(z),
                      onclick: () => toggleElement(z),
                      class: 'ml-1 text-[11px] text-zinc-400 hover:text-rose-400 transition cursor-pointer font-bold',
                      title: `Remove ${el.name}`,
                    }, '×'),
                  )
                }),
              ),

              // Quick Element Selector (Popular reactive elements)
              H('div', { class: 'mt-2.5' },
                H('span', { class: 'text-[9.5px] font-mono text-zinc-500 block mb-1' }, 'Click to add/remove element:'),
                H('div', { class: 'flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 rounded border border-white/5 bg-black/20' },
                  ...[1, 3, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 19, 20, 22, 25, 26, 27, 29, 30, 31, 33].map((z) => {
                    const el = getElement(z)
                    if (!el) return null
                    const isSelected = synthStore.selectedZ.includes(z)
                    return H('button', {
                      key: `btn-${z}`,
                      type: 'button',
                      onClick: () => toggleElement(z),
                      onclick: () => toggleElement(z),
                      class: `cursor-pointer flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] transition ${
                        isSelected
                          ? 'border border-amber-400 bg-amber-400/25 text-amber-200 font-bold shadow'
                          : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/30 hover:bg-white/[0.08]'
                      }`,
                    }, el.symbol, H('span', { class: 'text-[8.5px] opacity-60' }, z))
                  }),
                ),
              ),
            ),

            // Synthesizable Compounds from Current Selection
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1322] p-3 flex-1 flex flex-col min-h-0' },
              H('div', { class: 'flex items-center justify-between mb-2' },
                H('span', { class: 'text-[11px] font-semibold text-zinc-300 uppercase tracking-wider' }, '🔬 Synthesizable Compounds'),
                H('span', { class: 'font-mono text-[9.5px] text-emerald-400 font-bold' }, `${synthesizableCompounds.length} ready`),
              ),

              synthesizableCompounds.length > 0
                ? H('div', { class: 'space-y-1.5 overflow-y-auto pr-1' },
                    ...synthesizableCompounds.map((comp) => {
                      const isActive = comp.id === synthStore.activeCompoundId
                      return H('div', {
                        key: comp.id,
                        onClick: () => { synthStore.activeCompoundId = comp.id },
                        onclick: () => { synthStore.activeCompoundId = comp.id },
                        class: `flex items-center justify-between rounded-lg border p-2 transition cursor-pointer ${
                          isActive
                            ? 'border-sky-400 bg-sky-400/15 shadow-sm'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]'
                        }`,
                      },
                        H('div', { class: 'min-w-0' },
                          H('div', { class: 'flex items-baseline gap-2' },
                            H('span', { class: 'font-mono text-[13px] font-bold text-zinc-100' }, comp.formula),
                            H('span', { class: 'truncate text-[11px] text-zinc-300' }, comp.name),
                          ),
                          H('div', { class: 'flex items-center gap-2 mt-0.5 font-mono text-[9px] text-zinc-500' },
                            H('span', { class: 'capitalize' }, comp.category),
                            H('span', null, '·'),
                            H('span', null, `${comp.molecularWeight.toFixed(2)} g/mol`),
                          ),
                        ),
                        H('div', { class: 'text-right' },
                          H('span', {
                            class: `rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                              comp.deltaHf < 0 ? 'bg-amber-400/15 text-amber-300' : 'bg-sky-400/15 text-sky-300'
                            }`,
                          }, `ΔHf° ${comp.deltaHf.toFixed(0)}`),
                        ),
                      )
                    }),
                  )
                : H('div', { class: 'py-4 text-center text-zinc-500 text-[11px]' },
                    'No direct compound synthesizable with this exact elemental subset. Try adding another element above or pick a preset!',
                  ),

              // Related compounds requiring more elements
              relatedCompounds.length > 0
                ? H('div', { class: 'mt-3 border-t border-white/5 pt-2' },
                    H('div', { class: 'text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5' }, 'Related Compounds (need +elements):'),
                    H('div', { class: 'space-y-1 overflow-y-auto max-h-36 pr-1' },
                      ...relatedCompounds.slice(0, 6).map((comp) => H('div', {
                        key: `rel-${comp.id}`,
                        onClick: () => {
                          synthStore.activeCompoundId = comp.id
                          // Add missing elements to crucible
                          const missing = comp.elements.map((e) => e.z)
                          synthStore.selectedZ = Array.from(new Set([...synthStore.selectedZ, ...missing])).slice(0, 5)
                        },
                        onclick: () => {
                          synthStore.activeCompoundId = comp.id
                          const missing = comp.elements.map((e) => e.z)
                          synthStore.selectedZ = Array.from(new Set([...synthStore.selectedZ, ...missing])).slice(0, 5)
                        },
                        class: 'cursor-pointer flex items-center justify-between rounded border border-dashed border-white/10 px-2 py-1 text-[10px] text-zinc-400 hover:border-amber-400/40 hover:text-zinc-200 transition',
                      },
                        H('span', { class: 'font-mono' }, comp.formula),
                        H('span', { class: 'text-[9px] text-amber-400/70' }, '+ add elements'),
                      )),
                    ),
                  )
                : null,
            ),
          ),

          // === CENTER/RIGHT COLUMN: REACTION CRUCIBLE & 3D VISUALIZER (8 COLS) ===
          H('div', { class: 'flex flex-col bg-[#05070d] p-3 overflow-y-auto lg:col-span-8 min-h-0 space-y-2.5' },
            // --- REACTION CHAMBER CRUCIBLE ---
            H('div', {
              class: `rounded-xl border ${reactionBorder} bg-gradient-to-b from-[#0e1728] to-[#070b14] p-3 transition-all duration-300 shadow-xl shrink-0`,
              style: { boxShadow: `0 0 35px ${reactionGlow}` },
            },
              // Header of Crucible
              H('div', { class: 'flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-2' },
                H('div', null,
                  H('div', { class: 'flex items-center gap-2' },
                    H('span', { class: 'text-[11px] uppercase tracking-wider font-bold text-amber-400 font-mono' }, 'Thermal Reaction Crucible'),
                    H('span', {
                      class: `rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${
                        thermo.isSpontaneous ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'
                      }`,
                    }, thermo.isSpontaneous ? '✓ Spontaneous (ΔG < 0)' : '⚠ Non-Spontaneous'),
                  ),
                  H('h2', { class: 'text-[15px] font-bold text-zinc-100 mt-0.5' }, activeReaction.name),
                ),

                // Reaction Type Badge
                H('div', { class: 'rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-center font-mono' },
                  H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block' }, 'Reaction Type'),
                  H('span', { class: 'text-[10.5px] font-bold text-zinc-200 uppercase' }, activeReaction.type),
                ),
              ),

              // Chemical Equation Banner
              H('div', { class: 'my-2 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-center shadow-inner' },
                H('div', { class: 'font-mono text-[17px] sm:text-[20px] font-bold tracking-wider text-amber-200' }, activeReaction.equation),
                activeReaction.conditions
                  ? H('div', { class: 'mt-0.5 text-[9.5px] text-zinc-400 font-mono' }, `Conditions: ${activeReaction.conditions}${activeReaction.catalyst ? ` · Catalyst: ${activeReaction.catalyst}` : ''}`)
                  : null,
              ),

              // Temperature Slider & State Controls
              H('div', { class: 'rounded-lg border border-white/10 bg-[#090e1a] p-2.5' },
                H('div', { class: 'flex flex-wrap items-center justify-between gap-1 text-[11px] mb-1.5' },
                  H('div', { class: 'flex items-center gap-1.5' },
                    H('span', { class: 'font-semibold text-zinc-300 text-[10.5px]' }, 'Reaction Temp:'),
                    H('span', { class: 'font-mono text-amber-300 font-bold text-[12.5px]' }, `${synthStore.tempK.toFixed(1)} K`),
                    H('span', { class: 'font-mono text-zinc-500 text-[9.5px]' }, `(${(synthStore.tempK - 273.15).toFixed(1)} °C)`),
                  ),
                  H('div', { class: 'flex flex-wrap gap-1' },
                    ...[200, 298.15, 600, 1100, 1800].map((tPreset) => H('button', {
                      key: `t-${tPreset}`,
                      type: 'button',
                      onClick: () => { synthStore.tempK = tPreset },
                      onclick: () => { synthStore.tempK = tPreset },
                      class: `cursor-pointer rounded border px-1.5 py-0.5 font-mono text-[8.5px] transition ${
                        Math.abs(synthStore.tempK - tPreset) < 1 ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold' : 'border-white/10 text-zinc-400 hover:text-zinc-200'
                      }`,
                    }, `${tPreset.toFixed(0)} K`)),
                  ),
                ),

                H('input', {
                  type: 'range',
                  min: '100',
                  max: '2500',
                  step: '5',
                  value: String(synthStore.tempK),
                  onInput: (e: Event) => { synthStore.tempK = parseFloat((e.target as HTMLInputElement).value) },
                  oninput: (e: Event) => { synthStore.tempK = parseFloat((e.target as HTMLInputElement).value) },
                  class: 'w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400 my-1.5',
                  'aria-label': 'Adjust reaction temperature',
                }),

                // Thermodynamic Indicators Matrix
                H('div', { class: 'mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4 font-mono text-center' },
                  // ΔH
                  H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-1.5' },
                    H('div', { class: 'text-[8.5px] text-zinc-500 uppercase' }, 'Enthalpy (ΔH)'),
                    H('div', { class: `text-[12px] font-bold ${thermo.deltaH < 0 ? 'text-amber-300' : 'text-sky-300'}` }, `${thermo.deltaH.toFixed(1)} kJ/mol`),
                    H('div', { class: 'text-[8px] text-zinc-500 mt-0.5' }, thermo.deltaH < 0 ? '🔥 Exothermic' : '❄️ Endothermic'),
                  ),

                  // ΔS
                  H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-1.5' },
                    H('div', { class: 'text-[8.5px] text-zinc-500 uppercase' }, 'Entropy (ΔS)'),
                    H('div', { class: `text-[12px] font-bold ${thermo.deltaS > 0 ? 'text-emerald-300' : 'text-amber-300'}` }, `${thermo.deltaS.toFixed(1)} J/K`),
                    H('div', { class: 'text-[8px] text-zinc-500 mt-0.5' }, thermo.deltaS > 0 ? 'Disorder' : 'Order'),
                  ),

                  // ΔG
                  H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-1.5' },
                    H('div', { class: 'text-[8.5px] text-zinc-500 uppercase' }, 'Gibbs Energy (ΔG)'),
                    H('div', { class: `text-[12px] font-bold ${thermo.deltaG < 0 ? 'text-emerald-300' : 'text-rose-400'}` }, `${thermo.deltaG.toFixed(1)} kJ/mol`),
                    H('div', { class: 'text-[8px] text-zinc-500 mt-0.5' }, thermo.deltaG < 0 ? 'Spontaneous' : 'Non-spont.'),
                  ),

                  // K_eq
                  H('div', { class: 'rounded border border-white/10 bg-white/[0.02] p-1.5' },
                    H('div', { class: 'text-[8.5px] text-zinc-500 uppercase' }, 'Equilibrium Keq'),
                    H('div', { class: 'text-[12px] font-bold text-violet-300 truncate' },
                      thermo.kEq === Infinity ? '>> 10¹⁰' : thermo.kEq === 0 ? '<< 10⁻¹⁰' : thermo.kEq.toExponential(2)
                    ),
                    H('div', { class: 'text-[8px] text-zinc-500 mt-0.5' }, thermo.kEq > 1 ? 'Product fav.' : 'Reactant fav.'),
                  ),
                ),

                thermo.inversionTemp
                  ? H('div', { class: 'mt-1.5 rounded bg-amber-400/10 px-2 py-0.5 text-[9.5px] font-mono text-amber-300 border border-amber-400/20 text-center' },
                      `⚖️ Inversion: At T = ${thermo.inversionTemp.toFixed(1)} K, ΔG changes sign! (${thermo.isSpontaneous ? 'Spontaneous' : 'Non-spontaneous'})`
                    )
                  : null,
              ),
            ),

            // --- 3D MOLECULAR STRUCTURE & PROPERTY VIEWER ---
            H('div', { class: 'flex-1 rounded-xl border border-white/10 bg-[#0c1220] p-3 flex flex-col min-h-[280px]' },
              H('div', { class: 'flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-1.5 mb-1.5' },
                H('div', { class: 'flex items-center gap-2' },
                  H('span', { class: 'text-sm' }, '🔬'),
                  H('span', { class: 'font-mono text-[14px] font-bold text-zinc-100' }, activeCompound.formula),
                  H('span', { class: 'text-[11.5px] text-zinc-300' }, `(${activeCompound.name})`),
                  H('span', { class: 'rounded bg-sky-400/20 px-1.5 py-0.5 font-mono text-[9px] text-sky-300 uppercase' }, activeCompound.category),
                ),

                // 3D Controls
                H('div', { class: 'flex items-center gap-1.5' },
                  H('div', { class: 'flex rounded border border-white/10 overflow-hidden text-[9.5px]' },
                    H('button', {
                      type: 'button',
                      onClick: () => { synthStore.viewStyle = 'ball-stick' },
                      onclick: () => { synthStore.viewStyle = 'ball-stick' },
                      class: `cursor-pointer px-2 py-0.5 transition ${synthStore.viewStyle === 'ball-stick' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`,
                    }, 'Ball & Stick'),
                    H('button', {
                      type: 'button',
                      onClick: () => { synthStore.viewStyle = 'space-filling' },
                      onclick: () => { synthStore.viewStyle = 'space-filling' },
                      class: `cursor-pointer px-2 py-0.5 transition ${synthStore.viewStyle === 'space-filling' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`,
                    }, 'Space-Filling'),
                    H('button', {
                      type: 'button',
                      onClick: () => { synthStore.viewStyle = 'wireframe' },
                      onclick: () => { synthStore.viewStyle = 'wireframe' },
                      class: `cursor-pointer px-2 py-0.5 transition ${synthStore.viewStyle === 'wireframe' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`,
                    }, 'Wireframe'),
                  ),

                  H('button', {
                    type: 'button',
                    onClick: () => { synthStore.autoRotate = !synthStore.autoRotate },
                    onclick: () => { synthStore.autoRotate = !synthStore.autoRotate },
                    class: `cursor-pointer rounded border px-2 py-0.5 text-[9.5px] font-mono transition ${
                      synthStore.autoRotate ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-white/10 text-zinc-400'
                    }`,
                  }, synthStore.autoRotate ? 'Spin: ON' : 'Spin: OFF'),
                ),
              ),

              // The 3D Canvas Box
              H('div', { class: 'relative flex-1 min-h-[160px] h-48 sm:h-56 rounded-lg border border-white/5 bg-black/40 overflow-hidden' },
                H('elementa-compound-3d', {
                  'data-compound': activeCompound.id,
                  'data-style': synthStore.viewStyle,
                  'data-rotate': String(synthStore.autoRotate),
                  'data-speed': '1',
                  class: 'h-full w-full',
                }),
                H('div', { class: 'pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1.5 font-mono text-[8.5px] text-zinc-500 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur' },
                  'Drag to rotate · Scroll to zoom · CPK coloration',
                ),
              ),

              // Compound Physical Metrics Bar
              H('div', { class: 'mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4 font-mono text-[9.5px]' },
                H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
                  H('div', { class: 'text-zinc-500 uppercase text-[8px]' }, 'Molar Mass'),
                  H('div', { class: 'font-bold text-zinc-200 text-[10.5px]' }, `${activeCompound.molecularWeight.toFixed(3)} g/mol`),
                ),
                H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
                  H('div', { class: 'text-zinc-500 uppercase text-[8px]' }, 'Bond Character'),
                  H('div', { class: 'font-bold text-zinc-200 text-[10.5px]' }, `${activeCompound.ionicPct}% Ionic (Δχ ${activeCompound.electronegativityDiff})`),
                ),
                H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
                  H('div', { class: 'text-zinc-500 uppercase text-[8px]' }, 'Phase at STP'),
                  H('div', { class: 'font-bold text-zinc-200 text-[10.5px] capitalize' }, `${activeCompound.stateAtSTP} (${activeCompound.bonding})`),
                ),
                H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
                  H('div', { class: 'text-zinc-500 uppercase text-[8px]' }, 'Formation Enthalpy'),
                  H('div', { class: 'font-bold text-zinc-200 text-[10.5px]' }, `${activeCompound.deltaHf.toFixed(1)} kJ/mol`),
                ),
              ),

              // Description & Real-world Applications
              H('div', { class: 'mt-1.5 text-[10.5px] text-zinc-400 border-t border-white/5 pt-1.5' },
                H('p', { class: 'leading-relaxed line-clamp-2' }, activeCompound.description),
                activeCompound.applications && activeCompound.applications.length > 0
                  ? H('div', { class: 'mt-1 flex flex-wrap items-center gap-1' },
                      H('span', { class: 'font-mono text-[8.5px] text-zinc-500 uppercase' }, 'Apps:'),
                      ...activeCompound.applications.slice(0, 3).map((app) => H('span', {
                        key: app,
                        class: 'rounded bg-sky-400/10 px-1.5 py-0.5 text-[8.5px] text-sky-300 font-mono',
                      }, app)),
                    )
                  : null,
              ),
            ),
          ),
        )
      : synthStore.activeTab === 'compounds'
      // === 3D COMPOUND LIBRARY BROWSER TAB ===
      ? H('div', { class: 'flex-1 overflow-y-auto p-4 space-y-4' },
          H('div', { class: 'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0c1220] p-3' },
            H('div', { class: 'flex items-center gap-2' },
              H('span', { class: 'text-base' }, '🧬'),
              H('h3', { class: 'text-[14px] font-bold text-zinc-100' }, 'Interactive 3D Molecular Compound Library'),
            ),

            // Category filter pills
            H('div', { class: 'flex flex-wrap items-center gap-1 text-[10px]' },
              ...(['all', 'oxide', 'halide', 'acid', 'base', 'salt', 'organic', 'semiconductor'] as const).map((cat) => H('button', {
                key: cat,
                type: 'button',
                onClick: () => { synthStore.categoryFilter = cat },
                onclick: () => { synthStore.categoryFilter = cat },
                class: `cursor-pointer rounded-full px-2.5 py-1 capitalize transition ${
                  synthStore.categoryFilter === cat ? 'bg-sky-400 text-black font-bold' : 'border border-white/10 text-zinc-400 hover:text-zinc-200'
                }`,
              }, cat)),
            ),

            // Search box
            H('input', {
              type: 'text',
              placeholder: 'Search formula or name…',
              value: synthStore.searchQuery,
              onInput: (e: Event) => { synthStore.searchQuery = (e.target as HTMLInputElement).value },
              oninput: (e: Event) => { synthStore.searchQuery = (e.target as HTMLInputElement).value },
              class: 'rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-sky-400/50 w-44',
            }),
          ),

          // Cards Grid
          H('div', { class: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3' },
            ...allCompoundsList.map((comp) => {
              const isCurrent = comp.id === synthStore.activeCompoundId
              return H('div', {
                key: comp.id,
                onClick: () => {
                  synthStore.activeCompoundId = comp.id
                  synthStore.selectedZ = comp.elements.map((e) => e.z)
                  synthStore.activeTab = 'reactor'
                },
                onclick: () => {
                  synthStore.activeCompoundId = comp.id
                  synthStore.selectedZ = comp.elements.map((e) => e.z)
                  synthStore.activeTab = 'reactor'
                },
                class: `cursor-pointer flex flex-col justify-between rounded-xl border p-3 transition hover:scale-[1.01] ${
                  isCurrent ? 'border-sky-400 bg-sky-400/10 shadow-lg' : 'border-white/10 bg-[#0c1220] hover:border-white/30'
                }`,
              },
                H('div', null,
                  H('div', { class: 'flex items-start justify-between' },
                    H('div', null,
                      H('div', { class: 'font-mono text-[18px] font-bold text-amber-200' }, comp.formula),
                      H('div', { class: 'text-[12px] font-medium text-zinc-200' }, comp.name),
                      H('div', { class: 'text-[9.5px] text-zinc-500 font-mono' }, comp.systematicName),
                    ),
                    H('span', { class: 'rounded bg-sky-400/20 px-1.5 py-0.5 font-mono text-[9px] text-sky-300 uppercase font-bold' }, comp.category),
                  ),

                  H('div', { class: 'my-2 h-28 rounded-lg bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center p-1 relative group' },
                    MolecularSvg({ compound: comp, width: 280, height: 110 }),
                    H('div', { class: 'absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] pointer-events-none' },
                      H('span', { class: 'rounded-full bg-sky-400 text-black font-bold text-[10px] px-2.5 py-1 shadow-md' }, 'Inspect in 3D Crucible →'),
                    ),
                  ),

                  H('p', { class: 'text-[10.5px] text-zinc-400 line-clamp-2 leading-relaxed' }, comp.description),
                ),

                H('div', { class: 'mt-3 border-t border-white/5 pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500' },
                  H('span', null, `${comp.molecularWeight.toFixed(2)} g/mol`),
                  H('span', { class: 'text-amber-400/80 font-bold' }, `ΔHf° ${comp.deltaHf.toFixed(1)} kJ`),
                  H('span', { class: 'text-sky-300' }, 'Load in Crucible →'),
                ),
              )
            }),
          ),
        )
      // === ALL REACTIONS CATALOG TAB ===
      : H('div', { class: 'flex-1 overflow-y-auto p-4 space-y-3' },
          H('div', { class: 'flex items-center justify-between rounded-xl border border-white/10 bg-[#0c1220] p-3' },
            H('div', { class: 'flex items-center gap-2' },
              H('span', { class: 'text-base' }, '📜'),
              H('h3', { class: 'text-[14px] font-bold text-zinc-100' }, 'Comprehensive Chemical Reaction Catalog'),
            ),
            H('span', { class: 'font-mono text-[10px] text-emerald-400 font-bold' }, `${allReactions.length} Balanced Reactions`),
          ),

          H('div', { class: 'space-y-2' },
            ...allReactions.map((rxn) => {
              const isCurrent = rxn.id === synthStore.activeReactionId
              return H('div', {
                key: rxn.id,
                class: `rounded-xl border p-3.5 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isCurrent ? 'border-amber-400/60 bg-amber-400/[0.08]' : 'border-white/10 bg-[#0c1220] hover:border-white/25'
                }`,
              },
                H('div', { class: 'space-y-1' },
                  H('div', { class: 'flex items-center gap-2' },
                    H('span', { class: 'rounded bg-amber-400/20 px-1.5 py-0.5 font-mono text-[9px] uppercase font-bold text-amber-300' }, rxn.type),
                    H('h4', { class: 'text-[13px] font-bold text-zinc-100' }, rxn.name),
                  ),
                  H('div', { class: 'font-mono text-[15px] font-bold text-amber-200 tracking-wide' }, rxn.equation),
                  H('p', { class: 'text-[11px] text-zinc-400' }, rxn.description),
                  rxn.conditions
                    ? H('div', { class: 'text-[9.5px] font-mono text-zinc-500' }, `Conditions: ${rxn.conditions}${rxn.catalyst ? ` · Catalyst: ${rxn.catalyst}` : ''}`)
                    : null,
                ),

                H('div', { class: 'flex shrink-0 flex-col items-end gap-1.5' },
                  H('div', { class: 'font-mono text-[11px] font-bold text-zinc-300' },
                    `ΔH° = ${rxn.deltaH.toFixed(1)} kJ/mol`,
                  ),
                  H('button', {
                    type: 'button',
                    onClick: () => loadReaction(rxn),
                    onclick: () => loadReaction(rxn),
                    class: 'cursor-pointer rounded-md border border-amber-400/40 bg-amber-400/20 px-3 py-1 font-mono text-[10.5px] font-bold text-amber-200 hover:bg-amber-400/30 transition',
                  }, '🔥 Load in Crucible'),
                ),
              )
            }),
          ),
        ),
  )
}
