/**
 * Crystallography & X-Ray Powder Diffraction (XRD) Interactive Workbench
 * Dual 3D WebGL crystal supercell + dynamic Miller plane (hkl) slicer
 * alongside a real-time powder diffractometer computing Bragg's law, structure factors,
 * and Scherrer crystallite broadening.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import {
  getAllCrystalStructures,
  getCrystalStructureById,
} from '@/lib/crystallography/database'
import {
  XRAY_SOURCES,
  computeUnitCellVolume,
  computeDSpacing,
  calculateXRDDiffraction,
} from '@/lib/crystallography/diffraction'
import type { CrystalStructure, XRDPeak } from '@/lib/crystallography/types'
import { XrdPlot } from './XrdPlot'
import './crystal-3d-element'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export const crystalStore = reactive({
  activeCrystalId: 'fe-bcc',
  viewStyle: 'ball-stick' as 'ball-stick' | 'space-filling' | 'wireframe',
  supercell: 2 as 1 | 2,
  millerH: 1,
  millerK: 1,
  millerL: 0,
  showPlane: true,
  autoRotate: true,
  fx: false,
  xraySourceId: 'Cu-Ka',
  crystalliteSizeNm: 35,
  activeTab: 'unitcell' as 'unitcell' | 'diffractometer' | 'bravais',
  searchQuery: '',
})

export function CrystallographyWorkbench(): VNode {
  const allCrystals = getAllCrystalStructures()
  const activeCrystal: CrystalStructure =
    getCrystalStructureById(crystalStore.activeCrystalId) ?? allCrystals[0]

  const activeSource =
    XRAY_SOURCES.find((s) => s.id === crystalStore.xraySourceId) ?? XRAY_SOURCES[0]

  // Calculate Bragg peaks and interplanar spacing
  const peaks = calculateXRDDiffraction(
    activeCrystal,
    activeSource.wavelength,
    crystalStore.crystalliteSizeNm
  )

  const activeDSpacing = computeDSpacing(
    crystalStore.millerH,
    crystalStore.millerK,
    crystalStore.millerL,
    activeCrystal.lattice
  )

  const sinTheta =
    activeDSpacing > 0 ? activeSource.wavelength / (2 * activeDSpacing) : 0
  const activeTwoTheta =
    sinTheta > 0 && sinTheta <= 1.0 ? 2 * ((Math.asin(sinTheta) * 180) / Math.PI) : null

  const volume = computeUnitCellVolume(activeCrystal.lattice)

  // Handle peak selection from XRD plot
  const handleSelectPeak = (peak: XRDPeak) => {
    crystalStore.millerH = peak.h
    crystalStore.millerK = peak.k
    crystalStore.millerL = peak.l
    crystalStore.showPlane = true
    crystalStore.activeTab = 'unitcell'
  }

  return H('div', { class: 'flex h-full w-full flex-col overflow-hidden bg-[#070a12] text-zinc-100 select-none' },
    // --- TOP SUB-HEADER CONTROLS ---
    H('div', { class: 'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0c1220] px-4 py-2.5' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-[15px]' }, '💎'),
        H('span', { class: 'font-semibold text-zinc-100 text-[13px]' }, '3D Crystal Lattice & Powder XRD Lab'),
        H('span', { class: 'hidden rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-amber-300 md:inline' }, 'BRAGG & SCHERRER ENGINE'),
      ),

      // Navigation Mode Tabs
      H('div', { class: 'flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-0.5' },
        H('button', {
          type: 'button',
          onClick: () => { crystalStore.activeTab = 'unitcell' },
          onclick: () => { crystalStore.activeTab = 'unitcell' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${
            crystalStore.activeTab === 'unitcell' ? 'bg-amber-400/20 text-amber-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`,
        }, '🔮 3D Lattice & Miller Slicer'),
        H('button', {
          type: 'button',
          onClick: () => { crystalStore.activeTab = 'diffractometer' },
          onclick: () => { crystalStore.activeTab = 'diffractometer' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${
            crystalStore.activeTab === 'diffractometer' ? 'bg-sky-400/20 text-sky-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`,
        }, `📈 Powder Diffractometer (${peaks.length} Peaks)`),
        H('button', {
          type: 'button',
          onClick: () => { crystalStore.activeTab = 'bravais' },
          onclick: () => { crystalStore.activeTab = 'bravais' },
          class: `cursor-pointer rounded-md px-3 py-1 text-[11px] font-medium transition ${
            crystalStore.activeTab === 'bravais' ? 'bg-emerald-400/20 text-emerald-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`,
        }, '🏛️ 14 Bravais Lattices'),
      ),

      // Preset Crystals Bar
      H('div', { class: 'flex items-center gap-1.5 overflow-x-auto max-w-full' },
        H('span', { class: 'text-[10px] text-zinc-500 uppercase tracking-wider font-mono' }, 'Lattices:'),
        ...allCrystals.slice(0, 6).map((c) => H('button', {
          key: c.id,
          type: 'button',
          onClick: () => { crystalStore.activeCrystalId = c.id },
          onclick: () => { crystalStore.activeCrystalId = c.id },
          class: `cursor-pointer rounded border px-2 py-0.5 text-[10px] font-mono transition ${
            crystalStore.activeCrystalId === c.id
              ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold'
              : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-amber-400/40 hover:text-amber-200'
          }`,
        }, c.chemicalFormula)),
      ),
    ),

    // --- MAIN VIEW BY ACTIVE TAB ---
    crystalStore.activeTab === 'unitcell'
      ? H('div', { class: 'grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12 min-h-0' },
          // === LEFT COLUMN: CRYSTAL CONTROLS & MILLER SLICER (4 COLS) ===
          H('div', { class: 'flex flex-col border-r border-white/10 bg-[#080d18] p-3 overflow-y-auto lg:col-span-4 min-h-0 space-y-3' },
            // Crystal Selector Box
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1322] p-3' },
              H('div', { class: 'flex items-center justify-between mb-2' },
                H('span', { class: 'text-[11px] font-semibold text-zinc-300 uppercase tracking-wider' }, 'Lattice Material'),
                H('span', { class: 'rounded bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300 uppercase' }, activeCrystal.system),
              ),

              H('select', {
                value: crystalStore.activeCrystalId,
                onChange: (e: Event) => {
                  crystalStore.activeCrystalId = (e.target as HTMLSelectElement).value
                  const c = getCrystalStructureById(crystalStore.activeCrystalId)
                  if (c && c.commonMillerPlanes.length > 0) {
                    crystalStore.millerH = c.commonMillerPlanes[0].h
                    crystalStore.millerK = c.commonMillerPlanes[0].k
                    crystalStore.millerL = c.commonMillerPlanes[0].l
                  }
                },
                onchange: (e: Event) => {
                  crystalStore.activeCrystalId = (e.target as HTMLSelectElement).value
                  const c = getCrystalStructureById(crystalStore.activeCrystalId)
                  if (c && c.commonMillerPlanes.length > 0) {
                    crystalStore.millerH = c.commonMillerPlanes[0].h
                    crystalStore.millerK = c.commonMillerPlanes[0].k
                    crystalStore.millerL = c.commonMillerPlanes[0].l
                  }
                },
                class: 'w-full rounded-md border border-white/15 bg-black/60 px-2.5 py-1.5 font-mono text-[12px] text-zinc-200 focus:border-amber-400 focus:outline-none cursor-pointer',
              },
                ...allCrystals.map((c) => H('option', {
                  key: c.id,
                  value: c.id,
                  selected: c.id === crystalStore.activeCrystalId,
                }, `${c.chemicalFormula} — ${c.name} (${c.system.toUpperCase()} ${c.bravais})`)),
              ),

              H('p', { class: 'mt-2 text-[10.5px] text-zinc-400 leading-relaxed' }, activeCrystal.description),
            ),

            // Dynamic Miller Indices (hkl) Plane Slicer Card
            H('div', { class: 'rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#16120b] to-[#0e121d] p-3 shadow-lg' },
              H('div', { class: 'flex items-center justify-between border-b border-white/10 pb-1.5 mb-2' },
                H('div', { class: 'flex items-center gap-1.5' },
                  H('span', { class: 'text-amber-400 font-bold' }, '📐'),
                  H('span', { class: 'text-[11px] font-bold text-amber-200 uppercase tracking-wider font-mono' }, 'Miller Plane Slicer (h k l)'),
                ),
                H('button', {
                  type: 'button',
                  onClick: () => { crystalStore.showPlane = !crystalStore.showPlane },
                  onclick: () => { crystalStore.showPlane = !crystalStore.showPlane },
                  class: `cursor-pointer rounded px-2 py-0.5 text-[9px] font-mono transition ${
                    crystalStore.showPlane ? 'bg-amber-400 text-black font-bold' : 'border border-white/10 text-zinc-400'
                  }`,
                }, crystalStore.showPlane ? 'Plane: VISIBLE' : 'Plane: HIDDEN'),
              ),

              // h, k, l Steppers
              H('div', { class: 'grid grid-cols-3 gap-2 my-2' },
                ...(['h', 'k', 'l'] as const).map((idxName) => {
                  const val = idxName === 'h' ? crystalStore.millerH : idxName === 'k' ? crystalStore.millerK : crystalStore.millerL
                  return H('div', { key: idxName, class: 'rounded border border-white/10 bg-black/40 p-1.5 text-center' },
                    H('div', { class: 'text-[9.5px] font-mono text-amber-400 font-bold uppercase' }, `Index ${idxName}`),
                    H('div', { class: 'text-[18px] font-mono font-bold text-zinc-100 my-0.5' }, val),
                    H('div', { class: 'flex justify-center gap-1 mt-1' },
                      H('button', {
                        type: 'button',
                        onClick: () => {
                          if (idxName === 'h') crystalStore.millerH = Math.max(crystalStore.millerH - 1, -3)
                          if (idxName === 'k') crystalStore.millerK = Math.max(crystalStore.millerK - 1, -3)
                          if (idxName === 'l') crystalStore.millerL = Math.max(crystalStore.millerL - 1, -3)
                        },
                        onclick: () => {
                          if (idxName === 'h') crystalStore.millerH = Math.max(crystalStore.millerH - 1, -3)
                          if (idxName === 'k') crystalStore.millerK = Math.max(crystalStore.millerK - 1, -3)
                          if (idxName === 'l') crystalStore.millerL = Math.max(crystalStore.millerL - 1, -3)
                        },
                        class: 'cursor-pointer w-6 h-5 rounded bg-white/10 text-xs font-bold hover:bg-white/20 transition',
                      }, '-'),
                      H('button', {
                        type: 'button',
                        onClick: () => {
                          if (idxName === 'h') crystalStore.millerH = Math.min(crystalStore.millerH + 1, 3)
                          if (idxName === 'k') crystalStore.millerK = Math.min(crystalStore.millerK + 1, 3)
                          if (idxName === 'l') crystalStore.millerL = Math.min(crystalStore.millerL + 1, 3)
                        },
                        onclick: () => {
                          if (idxName === 'h') crystalStore.millerH = Math.min(crystalStore.millerH + 1, 3)
                          if (idxName === 'k') crystalStore.millerK = Math.min(crystalStore.millerK + 1, 3)
                          if (idxName === 'l') crystalStore.millerL = Math.min(crystalStore.millerL + 1, 3)
                        },
                        class: 'cursor-pointer w-6 h-5 rounded bg-white/10 text-xs font-bold hover:bg-white/20 transition',
                      }, '+'),
                    ),
                  )
                }),
              ),

              // Common Miller Planes Quick-Pills
              H('div', { class: 'mt-2' },
                H('div', { class: 'text-[9px] font-mono text-zinc-400 uppercase mb-1' }, 'Common Symmetry Planes:'),
                H('div', { class: 'flex flex-wrap gap-1' },
                  ...activeCrystal.commonMillerPlanes.map((p) => H('button', {
                    key: `plane-${p.h}-${p.k}-${p.l}`,
                    type: 'button',
                    onClick: () => {
                      crystalStore.millerH = p.h
                      crystalStore.millerK = p.k
                      crystalStore.millerL = p.l
                      crystalStore.showPlane = true
                    },
                    onclick: () => {
                      crystalStore.millerH = p.h
                      crystalStore.millerK = p.k
                      crystalStore.millerL = p.l
                      crystalStore.showPlane = true
                    },
                    class: `cursor-pointer rounded border px-2 py-0.5 font-mono text-[9px] transition ${
                      crystalStore.millerH === p.h && crystalStore.millerK === p.k && crystalStore.millerL === p.l
                        ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold'
                        : 'border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`,
                  }, `(${p.h} ${p.k} ${p.l})`)),
                ),
              ),

              // Plane Geometric Metrics
              H('div', { class: 'mt-3 grid grid-cols-2 gap-1.5 border-t border-white/10 pt-2 font-mono text-center text-[10px]' },
                H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
                  H('div', { class: 'text-zinc-500 text-[8.5px] uppercase' }, 'd-Spacing (d_hkl)'),
                  H('div', { class: 'font-bold text-amber-300 text-[12px]' }, `${activeDSpacing.toFixed(3)} Å`),
                ),
                H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
                  H('div', { class: 'text-zinc-500 text-[8.5px] uppercase' }, 'Bragg Peak 2θ'),
                  H('div', { class: 'font-bold text-sky-300 text-[12px]' },
                    activeTwoTheta !== null ? `${activeTwoTheta.toFixed(2)}°` : 'Extinct / λ > 2d'
                  ),
                ),
              ),
            ),

            // Crystallographic Metric Parameters Card
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1322] p-3 font-mono text-[10px]' },
              H('div', { class: 'text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between' },
                H('span', null, 'Lattice Parameters'),
                H('span', { class: 'text-zinc-500' }, activeCrystal.spaceGroup),
              ),
              H('div', { class: 'grid grid-cols-3 gap-1 text-center mb-2' },
                H('div', { class: 'rounded bg-black/40 p-1 border border-white/5' },
                  H('span', { class: 'text-[8px] text-zinc-500 block' }, 'a (Å)'),
                  H('span', { class: 'font-bold text-zinc-200' }, activeCrystal.lattice.a.toFixed(3)),
                ),
                H('div', { class: 'rounded bg-black/40 p-1 border border-white/5' },
                  H('span', { class: 'text-[8px] text-zinc-500 block' }, 'b (Å)'),
                  H('span', { class: 'font-bold text-zinc-200' }, activeCrystal.lattice.b.toFixed(3)),
                ),
                H('div', { class: 'rounded bg-black/40 p-1 border border-white/5' },
                  H('span', { class: 'text-[8px] text-zinc-500 block' }, 'c (Å)'),
                  H('span', { class: 'font-bold text-zinc-200' }, activeCrystal.lattice.c.toFixed(3)),
                ),
              ),
              H('div', { class: 'grid grid-cols-3 gap-1 text-center mb-2' },
                H('div', { class: 'rounded bg-black/40 p-1 border border-white/5' },
                  H('span', { class: 'text-[8px] text-zinc-500 block' }, 'α'),
                  H('span', { class: 'text-zinc-300' }, `${activeCrystal.lattice.alpha}°`),
                ),
                H('div', { class: 'rounded bg-black/40 p-1 border border-white/5' },
                  H('span', { class: 'text-[8px] text-zinc-500 block' }, 'β'),
                  H('span', { class: 'text-zinc-300' }, `${activeCrystal.lattice.beta}°`),
                ),
                H('div', { class: 'rounded bg-black/40 p-1 border border-white/5' },
                  H('span', { class: 'text-[8px] text-zinc-500 block' }, 'γ'),
                  H('span', { class: 'text-zinc-300' }, `${activeCrystal.lattice.gamma}°`),
                ),
              ),

              H('div', { class: 'grid grid-cols-2 gap-1.5 border-t border-white/5 pt-2' },
                H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
                  H('span', { class: 'text-[8px] text-zinc-500 uppercase block' }, 'Unit Cell Volume'),
                  H('span', { class: 'font-bold text-emerald-300 text-[11px]' }, `${volume.toFixed(2)} Å³`),
                ),
                H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
                  H('span', { class: 'text-[8px] text-zinc-500 uppercase block' }, 'Atomic Packing (APF)'),
                  H('span', { class: 'font-bold text-amber-300 text-[11px]' }, `${(activeCrystal.atomicPackingFactor * 100).toFixed(1)}%`),
                ),
              ),
            ),
          ),

          // === RIGHT COLUMN: 3D LATTICE VIEW & XRD SPECTRUM LINK (8 COLS) ===
          H('div', { class: 'flex flex-col bg-[#05070d] p-3 overflow-y-auto lg:col-span-8 min-h-0 space-y-3' },
            // 3D Visualizer Card
            H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1220] p-3 flex flex-col min-h-[380px] shrink-0' },
              // Card Header & Controls
              H('div', { class: 'flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2' },
                H('div', { class: 'flex items-center gap-2' },
                  H('span', { class: 'font-mono text-[16px] font-bold text-amber-300' }, activeCrystal.chemicalFormula),
                  H('span', { class: 'text-[12px] font-medium text-zinc-200' }, activeCrystal.name),
                  H('span', { class: 'rounded bg-sky-400/20 px-1.5 py-0.5 font-mono text-[9px] text-sky-300 uppercase font-bold' },
                    `${activeCrystal.system} ${activeCrystal.bravais}`
                  ),
                ),

                H('div', { class: 'flex items-center gap-2' },
                  // Supercell 1x1 vs 2x2 Toggle
                  H('div', { class: 'flex rounded border border-white/10 overflow-hidden text-[9px] font-mono' },
                    H('button', {
                      type: 'button',
                      onClick: () => { crystalStore.supercell = 1 },
                      onclick: () => { crystalStore.supercell = 1 },
                      class: `cursor-pointer px-2 py-0.5 transition ${crystalStore.supercell === 1 ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400'}`,
                    }, '1×1×1 Cell'),
                    H('button', {
                      type: 'button',
                      onClick: () => { crystalStore.supercell = 2 },
                      onclick: () => { crystalStore.supercell = 2 },
                      class: `cursor-pointer px-2 py-0.5 transition ${crystalStore.supercell === 2 ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400'}`,
                    }, '2×2×2 Supercell'),
                  ),

                  // Style Toggle
                  H('div', { class: 'flex rounded border border-white/10 overflow-hidden text-[9px] font-mono' },
                    H('button', {
                      type: 'button',
                      onClick: () => { crystalStore.viewStyle = 'ball-stick' },
                      onclick: () => { crystalStore.viewStyle = 'ball-stick' },
                      class: `cursor-pointer px-2 py-0.5 transition ${crystalStore.viewStyle === 'ball-stick' ? 'bg-sky-400/20 text-sky-300 font-bold' : 'text-zinc-400'}`,
                    }, 'Ball & Stick'),
                    H('button', {
                      type: 'button',
                      onClick: () => { crystalStore.viewStyle = 'space-filling' },
                      onclick: () => { crystalStore.viewStyle = 'space-filling' },
                      class: `cursor-pointer px-2 py-0.5 transition ${crystalStore.viewStyle === 'space-filling' ? 'bg-sky-400/20 text-sky-300 font-bold' : 'text-zinc-400'}`,
                    }, 'Space-Filling'),
                  ),

                  // Auto rotate
                  H('button', {
                    type: 'button',
                    onClick: () => { crystalStore.autoRotate = !crystalStore.autoRotate },
                    onclick: () => { crystalStore.autoRotate = !crystalStore.autoRotate },
                    class: `cursor-pointer rounded border px-2 py-0.5 text-[9px] font-mono transition ${
                      crystalStore.autoRotate ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 font-bold' : 'border-white/10 text-zinc-400'
                    }`,
                  }, crystalStore.autoRotate ? 'Spin: ON' : 'Spin: OFF'),
                  H('button', {
                    type: 'button',
                    onClick: () => { crystalStore.fx = !crystalStore.fx },
                    onclick: () => { crystalStore.fx = !crystalStore.fx },
                    class: `cursor-pointer rounded border px-2 py-0.5 text-[9px] font-mono transition ${
                      crystalStore.fx ? 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300 font-bold' : 'border-white/10 text-zinc-400'
                    }`,
                  }, crystalStore.fx ? 'Glow FX: ON' : 'Glow FX: OFF'),
                ),
              ),

              // The 3D Canvas Box
              H('div', { class: 'relative flex-1 min-h-[280px] h-72 sm:h-80 md:h-96 rounded-lg border border-white/5 bg-black/50 overflow-hidden' },
                H('elementa-crystal-3d', {
                  'data-crystal': activeCrystal.id,
                  'data-style': crystalStore.viewStyle,
                  'data-supercell': String(crystalStore.supercell),
                  'data-miller-h': String(crystalStore.millerH),
                  'data-miller-k': String(crystalStore.millerK),
                  'data-miller-l': String(crystalStore.millerL),
                  'data-show-plane': String(crystalStore.showPlane),
                  'data-rotate': String(crystalStore.autoRotate),
                  'data-speed': '1',
                  'data-fx': crystalStore.fx ? 'on' : 'off',
                  class: 'h-full w-full',
                }),
                H('div', { class: 'pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-2 font-mono text-[8.5px] text-zinc-500 bg-black/60 px-2 py-0.5 rounded backdrop-blur' },
                  'Drag to rotate · Scroll to zoom · Amber plane = (h k l) cutting plane',
                ),
                crystalStore.showPlane && (crystalStore.millerH !== 0 || crystalStore.millerK !== 0 || crystalStore.millerL !== 0)
                  ? H('div', { class: 'pointer-events-none absolute top-2 right-2 rounded bg-amber-400/20 border border-amber-400/40 px-2 py-1 font-mono text-[10px] text-amber-200 backdrop-blur' },
                      `Miller Plane: (${crystalStore.millerH} ${crystalStore.millerK} ${crystalStore.millerL})`
                    )
                  : null,
              ),
            ),

            // Diffractometer Linked Spectrum directly below
            H(XrdPlot, {
              peaks,
              wavelength: activeSource.wavelength,
              crystalliteSize: crystalStore.crystalliteSizeNm,
              sourceName: activeSource.name,
              onSelectPeak: handleSelectPeak,
            }),
          ),
        )
      : crystalStore.activeTab === 'diffractometer'
      // === FULL DIFFRACTOMETER TAB ===
      ? H('div', { class: 'flex-1 overflow-y-auto p-4 space-y-4' },
          // Diffractometer Controls Header
          H('div', { class: 'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0c1220] p-3' },
            H('div', { class: 'flex items-center gap-2' },
              H('span', { class: 'text-xl' }, '📈'),
              H('div', null,
                H('h3', { class: 'text-[14px] font-bold text-zinc-100' }, `Powder X-Ray Diffractometer — ${activeCrystal.chemicalFormula} (${activeCrystal.name})`),
                H('p', { class: 'text-[10px] text-zinc-400 font-mono' }, `Space Group ${activeCrystal.spaceGroup} · ${activeCrystal.system.toUpperCase()} ${activeCrystal.bravais}`),
              ),
            ),

            // Anode Source Selector
            H('div', { class: 'flex items-center gap-2' },
              H('span', { class: 'text-[10px] text-zinc-400 font-mono uppercase' }, 'X-Ray Source:'),
              H('select', {
                value: crystalStore.xraySourceId,
                onChange: (e: Event) => { crystalStore.xraySourceId = (e.target as HTMLSelectElement).value },
                onchange: (e: Event) => { crystalStore.xraySourceId = (e.target as HTMLSelectElement).value },
                class: 'rounded border border-white/15 bg-black/60 px-2 py-1 font-mono text-[11px] text-amber-300 focus:outline-none cursor-pointer',
              },
                ...XRAY_SOURCES.map((s) => H('option', {
                  key: s.id,
                  value: s.id,
                  selected: s.id === crystalStore.xraySourceId,
                }, s.name)),
              ),
            ),

            // Scherrer Crystallite Size Slider
            H('div', { class: 'flex items-center gap-2' },
              H('span', { class: 'text-[10px] text-zinc-400 font-mono uppercase' }, 'Crystallite Size L:'),
              H('input', {
                type: 'range',
                min: '5',
                max: '100',
                step: '5',
                value: String(crystalStore.crystalliteSizeNm),
                onInput: (e: Event) => { crystalStore.crystalliteSizeNm = Number((e.target as HTMLInputElement).value) },
                oninput: (e: Event) => { crystalStore.crystalliteSizeNm = Number((e.target as HTMLInputElement).value) },
                class: 'w-24 h-1.5 bg-zinc-700 rounded-lg accent-amber-400 cursor-pointer',
              }),
              H('span', { class: 'font-mono text-amber-300 font-bold text-[11px] w-12 text-right' }, `${crystalStore.crystalliteSizeNm} nm`),
            ),
          ),

          // Diffractogram Canvas
          H(XrdPlot, {
            peaks,
            wavelength: activeSource.wavelength,
            crystalliteSize: crystalStore.crystalliteSizeNm,
            sourceName: activeSource.name,
            onSelectPeak: handleSelectPeak,
          }),

          // Comprehensive Reflection Peaks Table
          H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1220] p-3' },
            H('h4', { class: 'text-[12px] font-bold text-zinc-200 mb-2 font-mono uppercase' }, 'Allowed Bragg Reflections & Extinction Analysis'),
            H('div', { class: 'overflow-x-auto' },
              H('table', { class: 'w-full text-left font-mono text-[11px]' },
                H('thead', { class: 'border-b border-white/10 text-zinc-400 text-[10px] uppercase' },
                  H('tr', null,
                    H('th', { class: 'py-1.5 px-2' }, 'Miller (hkl)'),
                    H('th', { class: 'py-1.5 px-2' }, '2θ (deg)'),
                    H('th', { class: 'py-1.5 px-2' }, 'θ (deg)'),
                    H('th', { class: 'py-1.5 px-2' }, 'd-Spacing (Å)'),
                    H('th', { class: 'py-1.5 px-2' }, '|F_hkl|'),
                    H('th', { class: 'py-1.5 px-2' }, 'Multiplicity p'),
                    H('th', { class: 'py-1.5 px-2' }, 'FWHM β (deg)'),
                    H('th', { class: 'py-1.5 px-2 text-right' }, 'Rel. Intensity I/I₀'),
                  ),
                ),
                H('tbody', { class: 'divide-y divide-white/5' },
                  ...peaks.map((p) => H('tr', {
                    key: `tbl-${p.h}-${p.k}-${p.l}`,
                    class: 'hover:bg-white/[0.04] cursor-pointer transition',
                    onClick: () => handleSelectPeak(p),
                  },
                    H('td', { class: 'py-1.5 px-2 font-bold text-amber-300' }, `(${p.h} ${p.k} ${p.l})`),
                    H('td', { class: 'py-1.5 px-2 text-zinc-200 font-bold' }, `${p.twoTheta.toFixed(2)}°`),
                    H('td', { class: 'py-1.5 px-2 text-zinc-400' }, `${p.theta.toFixed(2)}°`),
                    H('td', { class: 'py-1.5 px-2 text-sky-300' }, `${p.dSpacing.toFixed(4)} Å`),
                    H('td', { class: 'py-1.5 px-2 text-zinc-300' }, p.structureFactor.toFixed(2)),
                    H('td', { class: 'py-1.5 px-2 text-zinc-400' }, p.multiplicity),
                    H('td', { class: 'py-1.5 px-2 text-zinc-400' }, `${p.fwhm.toFixed(3)}°`),
                    H('td', { class: 'py-1.5 px-2 text-right font-bold text-emerald-400' }, `${p.intensity.toFixed(1)}%`),
                  )),
                ),
              ),
            ),
          ),
        )
      // === 14 BRAVAIS LATTICES CATALOG TAB ===
      : H('div', { class: 'flex-1 overflow-y-auto p-4 space-y-4' },
          H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1220] p-3' },
            H('h3', { class: 'text-[15px] font-bold text-zinc-100 mb-1' }, 'The 7 Crystal Systems & 14 Bravais Lattices'),
            H('p', { class: 'text-[11px] text-zinc-400 leading-relaxed' },
              'Auguste Bravais demonstrated mathematically in 1848 that 3D crystalline translational periodicity produces exactly 14 distinct lattice types, grouped into 7 crystal systems based on axial lengths and interaxial angles.'
            ),
          ),

          H('div', { class: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3' },
            ...allCrystals.map((c) => H('div', {
              key: c.id,
              onClick: () => {
                crystalStore.activeCrystalId = c.id
                crystalStore.activeTab = 'unitcell'
              },
              onclick: () => {
                crystalStore.activeCrystalId = c.id
                crystalStore.activeTab = 'unitcell'
              },
              class: `cursor-pointer rounded-xl border p-3 flex flex-col justify-between transition hover:scale-[1.01] ${
                c.id === crystalStore.activeCrystalId ? 'border-amber-400 bg-amber-400/10 shadow-lg' : 'border-white/10 bg-[#0c1220] hover:border-white/25'
              }`,
            },
              H('div', null,
                H('div', { class: 'flex items-start justify-between' },
                  H('div', null,
                    H('span', { class: 'font-mono text-[18px] font-bold text-amber-200' }, c.chemicalFormula),
                    H('div', { class: 'text-[12.5px] font-medium text-zinc-200' }, c.name),
                  ),
                  H('span', { class: 'rounded bg-amber-400/20 px-1.5 py-0.5 font-mono text-[9px] text-amber-300 uppercase font-bold' },
                    `${c.system} ${c.bravais}`
                  ),
                ),

                H('p', { class: 'mt-2 text-[10.5px] text-zinc-400 leading-relaxed line-clamp-3' }, c.description),
              ),

              H('div', { class: 'mt-3 border-t border-white/5 pt-2 flex items-center justify-between font-mono text-[9.5px] text-zinc-500' },
                H('span', null, `a=${c.lattice.a.toFixed(2)} Å`),
                H('span', null, `APF ${(c.atomicPackingFactor * 100).toFixed(0)}%`),
                H('span', { class: 'text-amber-300 font-bold' }, 'Inspect in 3D →'),
              ),
            )),
          ),
        ),
  )
}
