/**
 * Molecular Vibrational Modes & Spectroscopy Lab Workbench
 * Dual 3D WebGL normal mode visualizer + real-time FTIR transmittance spectrum
 * alongside an interactive Beer-Lambert UV-Vis spectrophotometer.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import {
  getAllSpectroscopyMolecules,
  getSpectroscopyMoleculeById,
} from '@/lib/spectroscopy/database'
import type { SpectroscopyMolecule, VibrationalMode } from '@/lib/spectroscopy/types'
import { FtirPlot } from './FtirPlot'
import { BeerLambertLab } from './BeerLambertLab'
import './vibrational-3d-element'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export const PRESET_MOLECULES = [
  { label: '💧 Water (H₂O)', id: 'h2o', modeId: 'h2o-v1' },
  { label: '💨 Carbon Dioxide (CO₂)', id: 'co2', modeId: 'co2-v2' },
  { label: '🧪 Acetone (C=O 1715 cm⁻¹)', id: 'acetone', modeId: 'acetone-co' },
  { label: '🍷 Ethanol (O-H Broad)', id: 'ethanol', modeId: 'eth-oh' },
  { label: '💜 KMnO₄ (UV-Vis 525 nm)', id: 'kmno4', modeId: 'kmno4-mno' },
  { label: '🔷 CuSO₄ (d-d 810 nm)', id: 'cuso4', modeId: 'cuso4-so4' },
]

export const spectroStore = reactive({
  activeMoleculeId: 'h2o',
  activeModeId: 'h2o-v1',
  viewStyle: 'ball-stick' as 'ball-stick' | 'space-filling' | 'wireframe',
  amplitude: 0.45,
  speed: 1.0,
  autoRotate: true,
  activeTab: 'vibrations' as 'vibrations' | 'beerlambert' | 'catalog',
  pathLengthCm: 1.0,
  concentrationM: 0.002, // 2 mM
  molarExtinction: 2400,
})

export function SpectroscopyWorkbench(): VNode {
  const allMolecules = getAllSpectroscopyMolecules()
  const activeMolecule: SpectroscopyMolecule =
    getSpectroscopyMoleculeById(spectroStore.activeMoleculeId) ?? allMolecules[0]

  const activeMode: VibrationalMode =
    activeMolecule.modes.find((m) => m.id === spectroStore.activeModeId) ??
    activeMolecule.modes[0]

  const handleSelectMode = (mode: VibrationalMode) => {
    spectroStore.activeModeId = mode.id
  }

  const loadPreset = (p: (typeof PRESET_MOLECULES)[0]) => {
    spectroStore.activeMoleculeId = p.id
    spectroStore.activeModeId = p.modeId
    const mol = getSpectroscopyMoleculeById(p.id)
    if (mol) {
      spectroStore.molarExtinction = mol.uvVis.molarAbsorptivity
    }
  }

  return H('div', { class: 'flex h-full w-full flex-col overflow-hidden bg-[#070a12] text-zinc-100 select-none' },
    // --- TOP SUB-HEADER CONTROLS ---
    H('div', { class: 'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0c1220] px-4 py-2.5' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-[15px]' }, '🌈'),
        H('span', { class: 'font-semibold text-zinc-100 text-[13px]' }, 'Vibrational Modes & Spectroscopy Lab'),
        H('span', { class: 'hidden rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-purple-300 md:inline' },
          'FTIR & BEER-LAMBERT ENGINE'
        ),
      ),

      // Navigation Mode Tabs
      H('div', { class: 'flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-0.5' },
        H('button', {
          type: 'button',
          onClick: () => { spectroStore.activeTab = 'vibrations' },
          onclick: () => { spectroStore.activeTab = 'vibrations' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${
            spectroStore.activeTab === 'vibrations' ? 'bg-amber-400/20 text-amber-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`,
        }, '🌊 3D Normal Modes & FTIR'),
        H('button', {
          type: 'button',
          onClick: () => { spectroStore.activeTab = 'beerlambert' },
          onclick: () => { spectroStore.activeTab = 'beerlambert' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${
            spectroStore.activeTab === 'beerlambert' ? 'bg-sky-400/20 text-sky-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`,
        }, '🧪 Beer-Lambert UV-Vis'),
        H('button', {
          type: 'button',
          onClick: () => { spectroStore.activeTab = 'catalog' },
          onclick: () => { spectroStore.activeTab = 'catalog' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${
            spectroStore.activeTab === 'catalog' ? 'bg-emerald-400/20 text-emerald-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`,
        }, `📜 Molecular Catalog (${allMolecules.length})`),
      ),

      // Presets Bar
      H('div', { class: 'flex items-center gap-1.5 overflow-x-auto max-w-full' },
        H('span', { class: 'text-[10px] text-zinc-500 uppercase tracking-wider font-mono' }, 'Samples:'),
        ...PRESET_MOLECULES.map((preset) => H('button', {
          key: preset.id,
          type: 'button',
          onClick: () => loadPreset(preset),
          onclick: () => loadPreset(preset),
          class: `cursor-pointer rounded border px-2 py-0.5 text-[10px] font-mono transition ${
            spectroStore.activeMoleculeId === preset.id
              ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold'
              : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-amber-400/40 hover:text-amber-200'
          }`,
        }, preset.label)),
      ),
    ),

    // --- MAIN VIEW BODY BY ACTIVE TAB ---
    spectroStore.activeTab === 'vibrations'
      ? H('div', { class: 'grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12 min-h-0' },
          // === LEFT COLUMN: MOLECULE & NORMAL MODE CONTROLS (4 COLS) ===
          H('div', { class: 'flex flex-col border-r border-white/10 bg-[#080d18] p-3 overflow-y-auto lg:col-span-4 min-h-0 space-y-3' },
            // Molecule Selector Box
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1322] p-3' },
              H('div', { class: 'flex items-center justify-between mb-2' },
                H('span', { class: 'text-[11px] font-semibold text-zinc-300 uppercase tracking-wider' }, 'Molecule'),
                H('span', { class: 'rounded bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300 uppercase' },
                  `Point Group ${activeMolecule.pointGroup}`
                ),
              ),

              H('select', {
                value: spectroStore.activeMoleculeId,
                onChange: (e: Event) => {
                  spectroStore.activeMoleculeId = (e.target as HTMLSelectElement).value
                  const mol = getSpectroscopyMoleculeById(spectroStore.activeMoleculeId)
                  if (mol && mol.modes.length > 0) {
                    spectroStore.activeModeId = mol.modes[0].id
                    spectroStore.molarExtinction = mol.uvVis.molarAbsorptivity
                  }
                },
                onchange: (e: Event) => {
                  spectroStore.activeMoleculeId = (e.target as HTMLSelectElement).value
                  const mol = getSpectroscopyMoleculeById(spectroStore.activeMoleculeId)
                  if (mol && mol.modes.length > 0) {
                    spectroStore.activeModeId = mol.modes[0].id
                    spectroStore.molarExtinction = mol.uvVis.molarAbsorptivity
                  }
                },
                class: 'w-full rounded-md border border-white/15 bg-black/60 px-2.5 py-1.5 font-mono text-[12px] text-zinc-200 focus:border-amber-400 focus:outline-none cursor-pointer',
              },
                ...allMolecules.map((m) => H('option', {
                  key: m.id,
                  value: m.id,
                  selected: m.id === spectroStore.activeMoleculeId,
                }, `${m.formula} — ${m.name} (${m.pointGroup})`)),
              ),

              H('p', { class: 'mt-2 text-[10.5px] text-zinc-400 leading-relaxed' }, activeMolecule.description),
            ),

            // Normal Modes Selector Box
            H('div', { class: 'rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#16120b] to-[#0e121d] p-3 shadow-lg' },
              H('div', { class: 'flex items-center justify-between border-b border-white/10 pb-1.5 mb-2' },
                H('div', { class: 'flex items-center gap-1.5' },
                  H('span', { class: 'text-amber-400 font-bold' }, '🎵'),
                  H('span', { class: 'text-[11px] font-bold text-amber-200 uppercase tracking-wider font-mono' }, 'Normal Modes (3N-6)'),
                ),
                H('span', { class: 'font-mono text-[9.5px] text-zinc-400' },
                  `${activeMolecule.degreesOfFreedom.vibrational} Vibrations`
                ),
              ),

              H('div', { class: 'space-y-1.5' },
                ...activeMolecule.modes.map((mode) => {
                  const isSelected = mode.id === spectroStore.activeModeId
                  return H('button', {
                    key: mode.id,
                    type: 'button',
                    onClick: () => handleSelectMode(mode),
                    onclick: () => handleSelectMode(mode),
                    class: `w-full text-left p-2 rounded-lg border font-mono text-[10.5px] transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold shadow'
                        : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/25 hover:bg-white/[0.05]'
                    }`,
                  },
                    H('div', { class: 'flex items-center justify-between' },
                      H('span', { class: 'text-[12px] font-bold' }, `${mode.wavenumber} cm⁻¹`),
                      H('div', { class: 'flex items-center gap-1 text-[8.5px]' },
                        mode.irActive
                          ? H('span', { class: 'rounded bg-rose-500/20 text-rose-300 px-1.5 py-0.5' }, 'IR Active')
                          : H('span', { class: 'rounded bg-zinc-700/50 text-zinc-500 px-1.5 py-0.5' }, 'IR Inactive'),
                        mode.ramanActive
                          ? H('span', { class: 'rounded bg-sky-500/20 text-sky-300 px-1.5 py-0.5' }, 'Raman')
                          : null,
                      ),
                    ),
                    H('div', { class: 'text-[10px] text-zinc-300 mt-0.5 font-sans' }, mode.name),
                  )
                }),
              ),

              // Active Mode Scientific Details
              H('div', { class: 'mt-3 border-t border-white/10 pt-2 font-mono text-[10px] text-zinc-400 space-y-1' },
                H('p', { class: 'leading-relaxed text-zinc-300 font-sans' }, activeMode.description),
                activeMode.symmetryLabel
                  ? H('div', { class: 'text-[9px] text-amber-300' }, `Symmetry Representation: ${activeMode.symmetryLabel}`)
                  : null,
              ),
            ),

            // Vibration Physics Parameters Card (Amplitude & Speed)
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1322] p-3 font-mono text-[10.5px]' },
              H('div', { class: 'text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2' }, 'Oscillation Controls'),

              // Amplitude
              H('div', { class: 'mb-2.5' },
                H('div', { class: 'flex justify-between text-[10px] mb-1' },
                  H('span', { class: 'text-zinc-400' }, 'Vibrational Amplitude:'),
                  H('span', { class: 'text-amber-300 font-bold' }, `${(spectroStore.amplitude * 100).toFixed(0)}%`),
                ),
                H('input', {
                  type: 'range',
                  min: '0.1',
                  max: '1.0',
                  step: '0.05',
                  value: String(spectroStore.amplitude),
                  onInput: (e: Event) => { spectroStore.amplitude = parseFloat((e.target as HTMLInputElement).value) },
                  oninput: (e: Event) => { spectroStore.amplitude = parseFloat((e.target as HTMLInputElement).value) },
                  class: 'w-full h-1.5 bg-zinc-700 rounded accent-amber-400 cursor-pointer',
                }),
              ),

              // Speed Factor
              H('div', null,
                H('div', { class: 'flex justify-between text-[10px] mb-1' },
                  H('span', { class: 'text-zinc-400' }, 'Animation Speed:'),
                  H('span', { class: 'text-sky-300 font-bold' }, `${spectroStore.speed.toFixed(1)}×`),
                ),
                H('input', {
                  type: 'range',
                  min: '0.2',
                  max: '2.5',
                  step: '0.1',
                  value: String(spectroStore.speed),
                  onInput: (e: Event) => { spectroStore.speed = parseFloat((e.target as HTMLInputElement).value) },
                  oninput: (e: Event) => { spectroStore.speed = parseFloat((e.target as HTMLInputElement).value) },
                  class: 'w-full h-1.5 bg-zinc-700 rounded accent-sky-400 cursor-pointer',
                }),
              ),
            ),
          ),

          // === RIGHT COLUMN: 3D VIBRATION CANVAS & FTIR SPECTRUM (8 COLS) ===
          H('div', { class: 'flex flex-col bg-[#05070d] p-3 overflow-y-auto lg:col-span-8 min-h-0 space-y-3' },
            // 3D Visualizer Card
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1220] p-3 flex flex-col min-h-[380px] shrink-0' },
              // Header
              H('div', { class: 'flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2' },
                H('div', { class: 'flex items-center gap-2' },
                  H('span', { class: 'font-mono text-[16px] font-bold text-amber-300' }, activeMolecule.formula),
                  H('span', { class: 'text-[12px] font-medium text-zinc-200' }, activeMolecule.name),
                  H('span', { class: 'rounded bg-sky-400/20 px-1.5 py-0.5 font-mono text-[9px] text-sky-300 uppercase font-bold' },
                    `${activeMode.wavenumber} cm⁻¹`
                  ),
                ),

                H('div', { class: 'flex items-center gap-2' },
                  // Style Toggle
                  H('div', { class: 'flex rounded border border-white/10 overflow-hidden text-[9px] font-mono' },
                    H('button', {
                      type: 'button',
                      onClick: () => { spectroStore.viewStyle = 'ball-stick' },
                      onclick: () => { spectroStore.viewStyle = 'ball-stick' },
                      class: `cursor-pointer px-2 py-0.5 transition ${spectroStore.viewStyle === 'ball-stick' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400'}`,
                    }, 'Ball & Stick'),
                    H('button', {
                      type: 'button',
                      onClick: () => { spectroStore.viewStyle = 'space-filling' },
                      onclick: () => { spectroStore.viewStyle = 'space-filling' },
                      class: `cursor-pointer px-2 py-0.5 transition ${spectroStore.viewStyle === 'space-filling' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400'}`,
                    }, 'Space-Filling'),
                  ),

                  // Auto rotate
                  H('button', {
                    type: 'button',
                    onClick: () => { spectroStore.autoRotate = !spectroStore.autoRotate },
                    onclick: () => { spectroStore.autoRotate = !spectroStore.autoRotate },
                    class: `cursor-pointer rounded border px-2 py-0.5 text-[9px] font-mono transition ${
                      spectroStore.autoRotate ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 font-bold' : 'border-white/10 text-zinc-400'
                    }`,
                  }, spectroStore.autoRotate ? 'Spin: ON' : 'Spin: OFF'),
                ),
              ),

              // The 3D Canvas Box
              H('div', { class: 'relative flex-1 min-h-[280px] h-72 sm:h-80 md:h-96 rounded-lg border border-white/5 bg-black/50 overflow-hidden' },
                H('elementa-vibrational-3d', {
                  'data-molecule': activeMolecule.id,
                  'data-mode': spectroStore.activeModeId,
                  'data-amplitude': String(spectroStore.amplitude),
                  'data-speed': String(spectroStore.speed),
                  'data-style': spectroStore.viewStyle,
                  'data-rotate': String(spectroStore.autoRotate),
                  class: 'h-full w-full',
                }),
                H('div', { class: 'pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-2 font-mono text-[8.5px] text-zinc-500 bg-black/60 px-2 py-0.5 rounded backdrop-blur' },
                  'Drag to rotate · Scroll to zoom · Dynamic bond stretching follows normal mode vectors',
                ),
                H('div', { class: 'pointer-events-none absolute top-2 right-2 rounded bg-amber-400/20 border border-amber-400/40 px-2 py-1 font-mono text-[10px] text-amber-200 backdrop-blur' },
                  `Active Mode: ${activeMode.name}`
                ),
              ),
            ),

            // FTIR Plot linked directly below
            H(FtirPlot, {
              modes: activeMolecule.modes,
              activeModeId: spectroStore.activeModeId,
              onSelectMode: handleSelectMode,
            }),
          ),
        )
      : spectroStore.activeTab === 'beerlambert'
      // === BEER-LAMBERT UV-VIS TAB ===
      ? H('div', { class: 'flex-1 overflow-y-auto p-4' },
          H(BeerLambertLab, {
            molecule: activeMolecule,
            pathLengthCm: spectroStore.pathLengthCm,
            concentrationM: spectroStore.concentrationM,
            molarExtinction: spectroStore.molarExtinction,
            onChangePathLength: (b) => { spectroStore.pathLengthCm = b },
            onChangeConcentration: (c) => { spectroStore.concentrationM = c },
            onChangeExtinction: (eps) => { spectroStore.molarExtinction = eps },
          }),
        )
      // === MOLECULAR CATALOG TAB ===
      : H('div', { class: 'flex-1 overflow-y-auto p-4 space-y-4' },
          H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1220] p-3' },
            H('h3', { class: 'text-[15px] font-bold text-zinc-100 mb-1' }, 'Molecular Spectroscopy Library'),
            H('p', { class: 'text-[11px] text-zinc-400 leading-relaxed' },
              'Explore fundamental molecular vibrational normal modes (3N-6 non-linear, 3N-5 linear) and electronic transitions (UV-Vis chromophores) with authentic infrared and optical data.'
            ),
          ),

          H('div', { class: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3' },
            ...allMolecules.map((m) => H('div', {
              key: m.id,
              onClick: () => {
                spectroStore.activeMoleculeId = m.id
                if (m.modes.length > 0) spectroStore.activeModeId = m.modes[0].id
                spectroStore.molarExtinction = m.uvVis.molarAbsorptivity
                spectroStore.activeTab = 'vibrations'
              },
              onclick: () => {
                spectroStore.activeMoleculeId = m.id
                if (m.modes.length > 0) spectroStore.activeModeId = m.modes[0].id
                spectroStore.molarExtinction = m.uvVis.molarAbsorptivity
                spectroStore.activeTab = 'vibrations'
              },
              class: `cursor-pointer rounded-xl border p-3 flex flex-col justify-between transition hover:scale-[1.01] ${
                m.id === spectroStore.activeMoleculeId ? 'border-amber-400 bg-amber-400/10 shadow-lg' : 'border-white/10 bg-[#0c1220] hover:border-white/25'
              }`,
            },
              H('div', null,
                H('div', { class: 'flex items-start justify-between' },
                  H('div', null,
                    H('span', { class: 'font-mono text-[18px] font-bold text-amber-200' }, m.formula),
                    H('div', { class: 'text-[12.5px] font-medium text-zinc-200' }, m.name),
                  ),
                  H('span', { class: 'rounded bg-amber-400/20 px-1.5 py-0.5 font-mono text-[9px] text-amber-300 uppercase font-bold' },
                    m.pointGroup
                  ),
                ),

                H('p', { class: 'mt-2 text-[10.5px] text-zinc-400 leading-relaxed line-clamp-3' }, m.description),
              ),

              H('div', { class: 'mt-3 border-t border-white/5 pt-2 flex items-center justify-between font-mono text-[9.5px] text-zinc-500' },
                H('span', null, `${m.modes.length} Modes`),
                H('span', null, `λ_max ${m.uvVis.lambdaMaxNm} nm`),
                H('span', { class: 'text-amber-300 font-bold' }, 'Inspect in 3D →'),
              ),
            )),
          ),
        ),
  )
}
