import { h, reactive, type VNode } from 'nexus-framework'
import {
  calculateSemf,
  calculateFissility,
  analyzeFission,
  FISSION_PRESETS,
  FUSION_PRESETS,
  FUEL_COMPARISONS,
  valleyOfStabilityZ,
  type FissionReaction,
} from '@/lib/periodic/semf'
import { nucAt, type Nuclide } from '@/lib/periodic/nuclides'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

type TabKey = 'curve' | 'fission' | 'fusion'
const MAGIC_A = [4, 16, 40, 48, 56, 62, 208]

export interface SemfState {
  activeTab: TabKey
  inspectA: number
  inspectZ: number
  showTerms: boolean
  showExp: boolean
  selectedFissionRx: FissionReaction
}

export const semfState = reactive<SemfState>({
  activeTab: 'curve',
  inspectA: 56,
  inspectZ: 26,
  showTerms: true,
  showExp: true,
  selectedFissionRx: FISSION_PRESETS[0] as FissionReaction,
})

export function initSemfState(initialNuclide?: Nuclide | null): void {
  semfState.activeTab = 'curve'
  semfState.inspectA = initialNuclide ? initialNuclide.a : 56
  semfState.inspectZ = initialNuclide ? initialNuclide.z : 26
  semfState.showTerms = true
  semfState.showExp = true
  semfState.selectedFissionRx = FISSION_PRESETS[0] as FissionReaction
}

export function SemfSimulatorNexus({
  initialNuclide: _initialNuclide,
  onClose,
  onSelectNuclide,
}: {
  initialNuclide?: Nuclide | null
  onClose: () => void
  onSelectNuclide?: (nu: Nuclide) => void
}): VNode {
  const state = semfState

  const currentSemf = calculateSemf(state.inspectA, state.inspectZ)
  const currentFissility = calculateFissility(state.inspectA, state.inspectZ)
  const fissionAnalysis = analyzeFission(state.selectedFissionRx)

  // Precomputed curve points (A = 1 to 250 along valley of stability)
  const curvePoints: { a: number; z: number; bPerA: number; expBPerA?: number }[] = []
  for (let a = 1; a <= 250; a++) {
    const z = Math.round(valleyOfStabilityZ(a))
    const res = calculateSemf(a, z)
    curvePoints.push({
      a,
      z,
      bPerA: res.bPerA,
      expBPerA: res.experimentalBPerA,
    })
  }

  // Quick select an element for the curve
  const pickNuclideByA = (a: number) => {
    const z = Math.round(valleyOfStabilityZ(a))
    state.inspectA = a
    state.inspectZ = z
    const nu = nucAt(z, a - z)
    if (nu && onSelectNuclide) onSelectNuclide(nu)
  }

  // SVG dimensions for B/A curve
  const CW = 740
  const CH = 260
  const CM = { l: 45, r: 20, t: 20, b: 35 }
  const cIw = CW - CM.l - CM.r
  const cIh = CH - CM.t - CM.b

  const xA = (a: number) => CM.l + (a / 250) * cIw
  const yB = (b: number) => CM.t + cIh - (Math.max(0, Math.min(10, b)) / 10) * cIh

  let semfPathD = ''
  for (let i = 0; i < curvePoints.length; i++) {
    const pt = curvePoints[i]
    if (pt.a < 2) continue
    const px = xA(pt.a)
    const py = yB(pt.bPerA)
    semfPathD += `${semfPathD === '' ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)} `
  }

  return H(
    'div',
    {
      class:
        'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md',
    },
    H(
      'div',
      {
        class:
          'flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0a0f18] shadow-2xl',
        role: 'dialog',
        'aria-label': 'Liquid-Drop SEMF & Fission Simulator',
      },
      // Top Header
      H(
        'div',
        {
          class:
            'flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0d1322] px-4 py-3',
        },
        H(
          'div',
          { class: 'flex items-center gap-3' },
          H(
            'span',
            {
              class:
                'flex h-7 w-7 items-center justify-center rounded-md border border-amber-400/40 bg-amber-400/10 font-mono text-[13px] font-bold text-amber-300',
            },
            'B',
          ),
          H(
            'div',
            null,
            H(
              'h2',
              { class: 'text-[14px] font-bold tracking-wider text-zinc-100' },
              'LIQUID-DROP SEMF & NUCLEAR FISSION',
            ),
            H(
              'p',
              { class: 'font-mono text-[10px] text-zinc-500' },
              'Bethe-Weizsäcker formula · Binding energy per nucleon · Bohr-Wheeler fissility · Prompt Q-values',
            ),
          ),
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: onClose,
            class:
              'rounded-md border border-white/10 px-2.5 py-1 font-mono text-[11px] text-zinc-400 transition hover:border-white/30 hover:text-white',
          },
          '✕ Close',
        ),
      ),

      // Tab Navigation
      H(
        'div',
        { class: 'flex shrink-0 border-b border-white/10 bg-[#080c14] px-4' },
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              state.activeTab = 'curve'
            },
            class: `border-b-2 px-4 py-2 font-mono text-[11px] font-medium transition ${
              state.activeTab === 'curve'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '📈 B/A Curve & SEMF Terms',
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              state.activeTab = 'fission'
            },
            class: `border-b-2 px-4 py-2 font-mono text-[11px] font-medium transition ${
              state.activeTab === 'fission'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '💥 Nuclear Fission Lab',
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              state.activeTab = 'fusion'
            },
            class: `border-b-2 px-4 py-2 font-mono text-[11px] font-medium transition ${
              state.activeTab === 'fusion'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '☀️ Fusion vs Fission Energetics',
        ),
      ),

      // Modal Body
      H(
        'div',
        { class: 'min-h-0 flex-1 overflow-y-auto p-4 space-y-4 text-zinc-200' },
        state.activeTab === 'curve'
          ? H(
              'div',
              { class: 'space-y-4' },
              // SVG Box
              H(
                'div',
                { class: 'rounded-xl border border-white/10 bg-[#070a10] p-4' },
                H(
                  'div',
                  { class: 'mb-2 flex flex-wrap items-center justify-between gap-2' },
                  H(
                    'div',
                    null,
                    H(
                      'h3',
                      { class: 'font-mono text-[12px] font-semibold text-zinc-200' },
                      'Nuclear Binding Energy Curve: B(A, Z) / A vs Mass Number A',
                    ),
                    H(
                      'p',
                      { class: 'font-mono text-[10px] text-zinc-500' },
                      'Peak at ⁵⁶Fe & ⁶²Ni (~8.79 MeV/nucleon). Fusion releases energy for A < 56; Fission releases energy for A > 56.',
                    ),
                  ),
                  H(
                    'div',
                    { class: 'flex items-center gap-3 font-mono text-[10px]' },
                    H(
                      'label',
                      { class: 'flex cursor-pointer items-center gap-1.5 text-zinc-300' },
                      H('input', {
                        type: 'checkbox',
                        checked: state.showTerms,
                        onchange: (e: Event) => {
                          state.showTerms = (e.target as HTMLInputElement).checked
                        },
                        class: 'rounded accent-amber-400',
                      }),
                      H('span', null, 'SEMF breakdown'),
                    ),
                    H(
                      'label',
                      { class: 'flex cursor-pointer items-center gap-1.5 text-zinc-300' },
                      H('input', {
                        type: 'checkbox',
                        checked: state.showExp,
                        onchange: (e: Event) => {
                          state.showExp = (e.target as HTMLInputElement).checked
                        },
                        class: 'rounded accent-amber-400',
                      }),
                      H('span', null, 'IAEA experimental'),
                    ),
                  ),
                ),

                // SVG
                H(
                  'div',
                  { class: 'relative overflow-x-auto' },
                  H(
                    'svg',
                    {
                      viewBox: `0 0 ${CW} ${CH}`,
                      class: 'w-full min-w-[620px] select-none font-mono',
                    },
                    // Grid lines Y
                    ...[0, 2, 4, 6, 8, 10].map((b) =>
                      H(
                        'g',
                        { key: String(b) },
                        H('line', {
                          x1: CM.l,
                          y1: yB(b),
                          x2: CM.l + cIw,
                          y2: yB(b),
                          stroke: '#ffffff',
                          'stroke-opacity': 0.06,
                          'stroke-width': 1,
                        }),
                        H(
                          'text',
                          {
                            x: CM.l - 6,
                            y: yB(b) + 3,
                            'text-anchor': 'end',
                            'font-size': 9,
                            fill: '#71717a',
                          },
                          String(b),
                        ),
                      ),
                    ),

                    // Grid lines X
                    ...[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240].map((a) =>
                      H(
                        'g',
                        { key: String(a) },
                        H('line', {
                          x1: xA(a),
                          y1: CM.t,
                          x2: xA(a),
                          y2: CM.t + cIh,
                          stroke: '#ffffff',
                          'stroke-opacity': 0.06,
                          'stroke-width': 1,
                        }),
                        H(
                          'text',
                          {
                            x: xA(a),
                            y: CM.t + cIh + 14,
                            'text-anchor': 'middle',
                            'font-size': 9,
                            fill: '#71717a',
                          },
                          String(a),
                        ),
                      ),
                    ),

                    // Fusion & Fission Zones
                    H('rect', {
                      x: xA(1),
                      y: CM.t,
                      width: xA(56) - xA(1),
                      height: cIh,
                      fill: '#38bdf8',
                      'fill-opacity': 0.04,
                    }),
                    H(
                      'text',
                      {
                        x: (xA(1) + xA(56)) / 2,
                        y: CM.t + 20,
                        'text-anchor': 'middle',
                        'font-size': 9.5,
                        fill: '#38bdf8',
                        'fill-opacity': 0.8,
                        'font-weight': 'bold',
                      },
                      '← FUSION REGION (ΔB > 0)',
                    ),

                    H('rect', {
                      x: xA(56),
                      y: CM.t,
                      width: xA(250) - xA(56),
                      height: cIh,
                      fill: '#fb7185',
                      'fill-opacity': 0.04,
                    }),
                    H(
                      'text',
                      {
                        x: (xA(56) + xA(240)) / 2,
                        y: CM.t + 20,
                        'text-anchor': 'middle',
                        'font-size': 9.5,
                        fill: '#fb7185',
                        'fill-opacity': 0.8,
                        'font-weight': 'bold',
                      },
                      'FISSION REGION (ΔB > 0) →',
                    ),

                    // Magic numbers lines
                    ...MAGIC_A.map((ma) =>
                      H('line', {
                        key: String(ma),
                        x1: xA(ma),
                        y1: CM.t,
                        x2: xA(ma),
                        y2: CM.t + cIh,
                        stroke: '#34d399',
                        'stroke-opacity': 0.2,
                        'stroke-dasharray': '2 3',
                      }),
                    ),

                    // Experimental points
                    ...(state.showExp
                      ? curvePoints
                          .filter((p) => p.expBPerA != null && p.a >= 2)
                          .map((p) =>
                            H('circle', {
                              key: `exp-${p.a}`,
                              cx: xA(p.a),
                              cy: yB(p.expBPerA!),
                              r:
                                p.a === 4 || p.a === 16 || p.a === 56 || p.a === 208
                                  ? 3.2
                                  : 1.6,
                              fill:
                                p.a === 56 || p.a === 62
                                  ? '#fbbf24'
                                  : p.a === 4 || p.a === 16
                                    ? '#34d399'
                                    : '#a1a1aa',
                              'fill-opacity': 0.85,
                            }),
                          )
                      : []),

                    // Theoretical SEMF Path
                    H('path', {
                      d: semfPathD,
                      fill: 'none',
                      stroke: '#fbbf24',
                      'stroke-width': 2,
                      'stroke-linecap': 'round',
                    }),

                    // Inspected Cursor
                    H('line', {
                      x1: xA(state.inspectA),
                      y1: CM.t,
                      x2: xA(state.inspectA),
                      y2: CM.t + cIh,
                      stroke: '#fbbf24',
                      'stroke-width': 1.5,
                      'stroke-dasharray': '3 3',
                    }),
                    H('circle', {
                      cx: xA(state.inspectA),
                      cy: yB(currentSemf.bPerA),
                      r: 5,
                      fill: '#fbbf24',
                      stroke: '#070a10',
                      'stroke-width': 2,
                    }),

                    // Axis labels
                    H(
                      'text',
                      {
                        x: CM.l + cIw,
                        y: CH - 6,
                        'text-anchor': 'end',
                        'font-size': 9.5,
                        fill: '#a1a1aa',
                      },
                      'Mass Number A →',
                    ),
                    H(
                      'text',
                      {
                        x: CM.l - 6,
                        y: CM.t - 6,
                        'text-anchor': 'end',
                        'font-size': 9.5,
                        fill: '#a1a1aa',
                      },
                      'B / A (MeV) ↑',
                    ),
                  ),
                ),

                // Quick Presets
                H(
                  'div',
                  { class: 'mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[10px]' },
                  H('span', { class: 'text-zinc-500' }, 'Notable nuclei:'),
                  ...[
                    { a: 4, z: 2, label: '⁴He (α tightly bound)' },
                    { a: 16, z: 8, label: '¹⁶O (doubly magic)' },
                    { a: 56, z: 26, label: '⁵⁶Fe (Peak B/A)' },
                    { a: 62, z: 28, label: '⁶²Ni (Max B/A)' },
                    { a: 140, z: 56, label: '¹⁴⁰Ba (Fission prod)' },
                    { a: 208, z: 82, label: '²⁰⁸Pb (Doubly magic)' },
                    { a: 235, z: 92, label: '²³⁵U (Fissile)' },
                    { a: 238, z: 92, label: '²³⁸U (Fertile)' },
                  ].map((preset) =>
                    H(
                      'button',
                      {
                        key: preset.label,
                        type: 'button',
                        onclick: () => {
                          state.inspectA = preset.a
                          state.inspectZ = preset.z
                        },
                        class: `rounded border px-2 py-0.5 transition ${
                          state.inspectA === preset.a
                            ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                            : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/30 hover:text-zinc-200'
                        }`,
                      },
                      preset.label,
                    ),
                  ),
                ),
              ),

              // Slider & Stats Grid
              H(
                'div',
                { class: 'grid grid-cols-1 gap-4 lg:grid-cols-3' },
                // Nucleus Selector Card
                H(
                  'div',
                  { class: 'rounded-xl border border-white/10 bg-[#0d1322] p-4 font-mono space-y-3' },
                  H(
                    'div',
                    { class: 'flex items-center justify-between' },
                    H(
                      'span',
                      {
                        class:
                          'text-[11px] font-semibold text-zinc-300 uppercase tracking-wider',
                      },
                      'Selected Nucleus',
                    ),
                    H(
                      'span',
                      {
                        class:
                          'rounded bg-amber-400/15 px-2 py-0.5 text-[12px] font-bold text-amber-300',
                      },
                      `Z=${state.inspectZ}, A=${state.inspectA} (N=${state.inspectA - state.inspectZ})`,
                    ),
                  ),
                  H(
                    'div',
                    { class: 'space-y-1' },
                    H(
                      'div',
                      { class: 'flex justify-between text-[10px] text-zinc-400' },
                      H('span', null, 'Mass Number A'),
                      H('span', { class: 'font-bold text-zinc-200' }, state.inspectA),
                    ),
                    H('input', {
                      type: 'range',
                      min: '1',
                      max: '250',
                      value: String(state.inspectA),
                      oninput: (e: Event) => {
                        pickNuclideByA(parseInt((e.target as HTMLInputElement).value, 10))
                      },
                      class: 'w-full accent-amber-400',
                    }),
                  ),
                  H(
                    'div',
                    { class: 'space-y-1' },
                    H(
                      'div',
                      { class: 'flex justify-between text-[10px] text-zinc-400' },
                      H('span', null, 'Atomic Number Z'),
                      H('span', { class: 'font-bold text-zinc-200' }, state.inspectZ),
                    ),
                    H('input', {
                      type: 'range',
                      min: '0',
                      max: String(Math.min(100, state.inspectA)),
                      value: String(state.inspectZ),
                      oninput: (e: Event) => {
                        state.inspectZ = parseInt((e.target as HTMLInputElement).value, 10)
                      },
                      class: 'w-full accent-amber-400',
                    }),
                  ),

                  H(
                    'div',
                    {
                      class:
                        'rounded border border-white/10 bg-black/40 p-2.5 text-[11px] space-y-1',
                    },
                    H(
                      'div',
                      { class: 'flex justify-between' },
                      H('span', { class: 'text-zinc-400' }, 'SEMF B/A:'),
                      H(
                        'span',
                        { class: 'font-bold text-amber-300' },
                        `${currentSemf.bPerA.toFixed(3)} MeV/n`,
                      ),
                    ),
                    currentSemf.experimentalBPerA != null
                      ? H(
                          'div',
                          { class: 'flex justify-between' },
                          H('span', { class: 'text-zinc-400' }, 'IAEA Experimental B/A:'),
                          H(
                            'span',
                            { class: 'font-bold text-emerald-400' },
                            `${currentSemf.experimentalBPerA.toFixed(3)} MeV/n`,
                          ),
                        )
                      : null,
                    currentSemf.shellResidual != null
                      ? H(
                          'div',
                          { class: 'flex justify-between' },
                          H('span', { class: 'text-zinc-400' }, 'Shell Model Effect (ΔB):'),
                          H(
                            'span',
                            {
                              class: `font-bold ${
                                currentSemf.shellResidual >= 0 ? 'text-teal-300' : 'text-rose-400'
                              }`,
                            },
                            `${currentSemf.shellResidual >= 0 ? '+' : ''}${currentSemf.shellResidual.toFixed(2)} MeV`,
                          ),
                        )
                      : null,
                    H(
                      'div',
                      { class: 'flex justify-between border-t border-white/5 pt-1' },
                      H('span', { class: 'text-zinc-400' }, 'Total Binding Energy:'),
                      H(
                        'span',
                        { class: 'font-bold text-zinc-100' },
                        `${currentSemf.totalB.toFixed(1)} MeV`,
                      ),
                    ),
                  ),
                ),

                // SEMF Term Decomposition
                H(
                  'div',
                  {
                    class:
                      'rounded-xl border border-white/10 bg-[#0d1322] p-4 font-mono space-y-2 lg:col-span-2',
                  },
                  H(
                    'div',
                    { class: 'flex items-center justify-between' },
                    H(
                      'span',
                      {
                        class:
                          'text-[11px] font-semibold text-zinc-300 uppercase tracking-wider',
                      },
                      'SEMF Energy Term Decomposition',
                    ),
                    H(
                      'span',
                      { class: 'text-[10px] text-zinc-500' },
                      'B = a_v A - a_s A^(2/3) - a_c Z(Z-1)/A^(1/3) - a_a (A-2Z)²/A + δ',
                    ),
                  ),

                  H(
                    'div',
                    { class: 'grid grid-cols-2 gap-2 text-[10.5px] sm:grid-cols-5' },
                    H(
                      'div',
                      { class: 'rounded border border-emerald-400/20 bg-emerald-400/5 p-2' },
                      H(
                        'div',
                        { class: 'text-[9px] uppercase text-emerald-400/80' },
                        'Volume (+a_v)',
                      ),
                      H(
                        'div',
                        { class: 'text-[13px] font-bold text-emerald-300' },
                        `+${currentSemf.volume.toFixed(1)} MeV`,
                      ),
                      H('div', { class: 'text-[8.5px] text-zinc-500' }, 'Strong force saturation'),
                    ),
                    H(
                      'div',
                      { class: 'rounded border border-rose-400/20 bg-rose-400/5 p-2' },
                      H(
                        'div',
                        { class: 'text-[9px] uppercase text-rose-400/80' },
                        'Surface (-a_s)',
                      ),
                      H(
                        'div',
                        { class: 'text-[13px] font-bold text-rose-300' },
                        `${currentSemf.surface.toFixed(1)} MeV`,
                      ),
                      H(
                        'div',
                        { class: 'text-[8.5px] text-zinc-500' },
                        'Missing neighbor deficit',
                      ),
                    ),
                    H(
                      'div',
                      { class: 'rounded border border-sky-400/20 bg-sky-400/5 p-2' },
                      H(
                        'div',
                        { class: 'text-[9px] uppercase text-sky-400/80' },
                        'Coulomb (-a_c)',
                      ),
                      H(
                        'div',
                        { class: 'text-[13px] font-bold text-sky-300' },
                        `${currentSemf.coulomb.toFixed(1)} MeV`,
                      ),
                      H(
                        'div',
                        { class: 'text-[8.5px] text-zinc-500' },
                        'Proton electrostatic repulsion',
                      ),
                    ),
                    H(
                      'div',
                      { class: 'rounded border border-purple-400/20 bg-purple-400/5 p-2' },
                      H(
                        'div',
                        { class: 'text-[9px] uppercase text-purple-400/80' },
                        'Asymmetry (-a_a)',
                      ),
                      H(
                        'div',
                        { class: 'text-[13px] font-bold text-purple-300' },
                        `${currentSemf.asymmetry.toFixed(1)} MeV`,
                      ),
                      H('div', { class: 'text-[8.5px] text-zinc-500' }, 'Pauli exclusion penalty'),
                    ),
                    H(
                      'div',
                      { class: 'rounded border border-amber-400/20 bg-amber-400/5 p-2' },
                      H(
                        'div',
                        { class: 'text-[9px] uppercase text-amber-400/80' },
                        'Pairing (±δ)',
                      ),
                      H(
                        'div',
                        { class: 'text-[13px] font-bold text-amber-300' },
                        `${currentSemf.pairing >= 0 ? '+' : ''}${currentSemf.pairing.toFixed(1)} MeV`,
                      ),
                      H(
                        'div',
                        { class: 'text-[8.5px] text-zinc-500' },
                        state.inspectZ % 2 === 0 &&
                          (state.inspectA - state.inspectZ) % 2 === 0
                          ? 'Even-even (+δ)'
                          : state.inspectZ % 2 !== 0 &&
                              (state.inspectA - state.inspectZ) % 2 !== 0
                            ? 'Odd-odd (-δ)'
                            : 'Odd-A (0)',
                      ),
                    ),
                  ),

                  H(
                    'div',
                    {
                      class:
                        'rounded border border-white/10 bg-black/30 p-2.5 text-[10.5px] space-y-1',
                    },
                    H(
                      'div',
                      { class: 'flex flex-wrap items-center justify-between gap-2' },
                      H(
                        'span',
                        { class: 'text-zinc-400' },
                        'Bohr-Wheeler Fissility Parameter (x = (Z²/A) / 48.5):',
                      ),
                      H(
                        'span',
                        { class: 'font-bold text-zinc-200' },
                        `Z²/A = ${currentFissility.z2OverA.toFixed(2)} · x = ${currentFissility.fissilityX.toFixed(3)}`,
                      ),
                    ),
                    H(
                      'div',
                      { class: 'flex flex-wrap items-center justify-between gap-2' },
                      H('span', { class: 'text-zinc-400' }, 'Myers-Swiatecki Fission Barrier:'),
                      H(
                        'span',
                        { class: 'font-bold text-amber-300' },
                        currentFissility.fissilityX >= 1.0
                          ? '0.0 MeV (Spontaneous fission instantaneous)'
                          : `${currentFissility.fissionBarrierMev.toFixed(2)} MeV`,
                      ),
                    ),
                  ),
                ),
              ),
            )
          : state.activeTab === 'fission'
            ? H(
                'div',
                { class: 'space-y-4 font-mono' },
                // Presets
                H(
                  'div',
                  { class: 'flex flex-wrap items-center gap-2' },
                  H('span', { class: 'text-[11px] text-zinc-500' }, 'Fission Reactions:'),
                  ...FISSION_PRESETS.map((rx) =>
                    H(
                      'button',
                      {
                        key: rx.id,
                        type: 'button',
                        onclick: () => {
                          state.selectedFissionRx = rx
                        },
                        class: `rounded border px-2.5 py-1 text-[11px] transition ${
                          state.selectedFissionRx.id === rx.id
                            ? 'border-amber-400/80 bg-amber-400/20 text-amber-200 font-bold'
                            : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/30 hover:text-zinc-200'
                        }`,
                      },
                      rx.title,
                    ),
                  ),
                ),

                // Scission Box
                H(
                  'div',
                  { class: 'rounded-xl border border-white/10 bg-[#070a10] p-4 space-y-4' },
                  H(
                    'div',
                    {
                      class:
                        'flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3',
                    },
                    H(
                      'div',
                      null,
                      H(
                        'h3',
                        { class: 'text-[13px] font-bold text-zinc-100' },
                        state.selectedFissionRx.title,
                      ),
                      H(
                        'p',
                        { class: 'text-[10px] text-zinc-500' },
                        state.selectedFissionRx.description,
                      ),
                    ),
                    H(
                      'div',
                      {
                        class:
                          'rounded border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-center',
                      },
                      H(
                        'div',
                        { class: 'text-[9px] uppercase tracking-wider text-amber-400/80' },
                        'Prompt Q-Value',
                      ),
                      H(
                        'div',
                        { class: 'text-[16px] font-bold text-amber-300' },
                        `+${fissionAnalysis.promptQMev.toFixed(1)} MeV`,
                      ),
                    ),
                  ),

                  // Fission diagram
                  H(
                    'div',
                    {
                      class:
                        'relative flex min-h-[140px] items-center justify-around rounded-lg border border-white/5 bg-black/40 p-4',
                    },
                    // Parent
                    H(
                      'div',
                      { class: 'flex flex-col items-center' },
                      H(
                        'div',
                        {
                          class:
                            'relative flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/15 shadow-[0_0_20px_rgba(251,191,36,0.2)]',
                        },
                        H(
                          'span',
                          { class: 'text-[13px] font-bold text-amber-200' },
                          `${fissionAnalysis.parentNuclide?.sym ?? 'X'}-${state.selectedFissionRx.parentA}`,
                        ),
                        state.selectedFissionRx.incidentNeutron
                          ? H(
                              'div',
                              {
                                class:
                                  'absolute -left-6 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-sky-400 font-bold animate-pulse',
                              },
                              'n_th →',
                            )
                          : null,
                      ),
                      H(
                        'span',
                        { class: 'mt-1 text-[9.5px] text-zinc-500' },
                        `Z=${state.selectedFissionRx.parentZ}, N=${state.selectedFissionRx.parentA - state.selectedFissionRx.parentZ}`,
                      ),
                    ),

                    // Scission
                    H(
                      'div',
                      { class: 'flex flex-col items-center text-center' },
                      H('span', { class: 'text-[16px] text-amber-400 font-bold' }, '⚡ Scission'),
                      H(
                        'span',
                        { class: 'text-[9px] text-zinc-500' },
                        `Coulomb repulsion: ${fissionAnalysis.coulombBarrierMev.toFixed(0)} MeV`,
                      ),
                      H(
                        'span',
                        { class: 'text-[9px] text-teal-400' },
                        `+${state.selectedFissionRx.promptNeutrons} fast neutrons`,
                      ),
                    ),

                    // Fragments
                    H(
                      'div',
                      { class: 'flex flex-col gap-3' },
                      H(
                        'div',
                        { class: 'flex items-center gap-2' },
                        H(
                          'div',
                          {
                            class:
                              'flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/40 bg-sky-400/15 text-[11px] font-bold text-sky-200',
                          },
                          `${fissionAnalysis.frag1Nuclide?.sym ?? 'F1'}-${state.selectedFissionRx.frag1A}`,
                        ),
                        H(
                          'div',
                          { class: 'text-[9.5px]' },
                          H(
                            'div',
                            { class: 'font-bold text-zinc-200' },
                            `Light Fragment (Z=${state.selectedFissionRx.frag1Z})`,
                          ),
                          H(
                            'div',
                            { class: 'text-zinc-500' },
                            `E_kin ≈ ${(fissionAnalysis.energyBreakdown.fragmentsKineticMev * 0.6).toFixed(0)} MeV`,
                          ),
                        ),
                      ),
                      H(
                        'div',
                        { class: 'flex items-center gap-2' },
                        H(
                          'div',
                          {
                            class:
                              'flex h-14 w-14 items-center justify-center rounded-full border border-teal-400/40 bg-teal-400/15 text-[11px] font-bold text-teal-200',
                          },
                          `${fissionAnalysis.frag2Nuclide?.sym ?? 'F2'}-${state.selectedFissionRx.frag2A}`,
                        ),
                        H(
                          'div',
                          { class: 'text-[9.5px]' },
                          H(
                            'div',
                            { class: 'font-bold text-zinc-200' },
                            `Heavy Fragment (Z=${state.selectedFissionRx.frag2Z})`,
                          ),
                          H(
                            'div',
                            { class: 'text-zinc-500' },
                            `E_kin ≈ ${(fissionAnalysis.energyBreakdown.fragmentsKineticMev * 0.4).toFixed(0)} MeV`,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Energy bar
                  H(
                    'div',
                    { class: 'space-y-1.5' },
                    H(
                      'div',
                      { class: 'flex justify-between text-[10.5px]' },
                      H('span', { class: 'text-zinc-400' }, 'Total Thermal Recoverable Energy:'),
                      H(
                        'span',
                        { class: 'font-bold text-amber-300' },
                        `~${fissionAnalysis.energyBreakdown.totalRecoverableMev.toFixed(1)} MeV per fission`,
                      ),
                    ),
                    H(
                      'div',
                      {
                        class:
                          'flex h-4 w-full overflow-hidden rounded-md border border-white/10 text-[8px] font-bold text-black',
                      },
                      H(
                        'div',
                        {
                          style: { width: '84%' },
                          class: 'flex items-center justify-center bg-amber-400',
                        },
                        'Fragment Kinetic (84%)',
                      ),
                      H(
                        'div',
                        {
                          style: { width: '3%' },
                          class: 'flex items-center justify-center bg-teal-300',
                        },
                        'n (3%)',
                      ),
                      H(
                        'div',
                        {
                          style: { width: '4%' },
                          class: 'flex items-center justify-center bg-sky-300',
                        },
                        'γ (4%)',
                      ),
                      H(
                        'div',
                        {
                          style: { width: '4%' },
                          class: 'flex items-center justify-center bg-rose-400',
                        },
                        'β⁻ (4%)',
                      ),
                      H(
                        'div',
                        {
                          style: { width: '5%' },
                          class: 'flex items-center justify-center bg-purple-400',
                        },
                        'ν̄ (5%)',
                      ),
                    ),
                  ),
                ),
              )
            : H(
                'div',
                { class: 'space-y-4 font-mono' },
                // Fusion Reactions
                H(
                  'div',
                  { class: 'rounded-xl border border-white/10 bg-[#070a10] p-4 space-y-3' },
                  H(
                    'div',
                    { class: 'flex items-center justify-between' },
                    H(
                      'h3',
                      { class: 'text-[12px] font-bold text-zinc-100' },
                      'Thermonuclear Fusion Reactions',
                    ),
                    H(
                      'span',
                      { class: 'text-[10px] text-zinc-500' },
                      'Light nuclei combine to climb the steep left slope of the B/A curve',
                    ),
                  ),
                  H(
                    'div',
                    { class: 'space-y-2' },
                    ...FUSION_PRESETS.map((fus) =>
                      H(
                        'div',
                        {
                          key: fus.name,
                          class:
                            'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-[11px]',
                        },
                        H(
                          'div',
                          null,
                          H('div', { class: 'font-bold text-teal-300' }, fus.name),
                          H(
                            'div',
                            { class: 'text-[12px] font-semibold text-zinc-100' },
                            fus.equation,
                          ),
                          H('div', { class: 'text-[9px] text-zinc-500' }, fus.notes),
                        ),
                        H(
                          'div',
                          { class: 'flex items-center gap-4 text-right' },
                          H(
                            'div',
                            null,
                            H('div', { class: 'text-[9px] uppercase text-zinc-500' }, 'Q-Value'),
                            H(
                              'div',
                              { class: 'text-[13px] font-bold text-amber-300' },
                              `+${fus.qMev.toFixed(2)} MeV`,
                            ),
                          ),
                          H(
                            'div',
                            null,
                            H(
                              'div',
                              { class: 'text-[9px] uppercase text-zinc-500' },
                              'Ignition T',
                            ),
                            H(
                              'div',
                              { class: 'text-[12px] font-bold text-sky-300' },
                              `${fus.ignitionTempKev} keV`,
                            ),
                          ),
                          H(
                            'div',
                            null,
                            H(
                              'div',
                              { class: 'text-[9px] uppercase text-zinc-500' },
                              'Energy Density',
                            ),
                            H(
                              'div',
                              { class: 'text-[12px] font-bold text-emerald-300' },
                              `${(fus.specificEnergyGjPerKg / 1000).toFixed(0)} TJ/kg`,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                // Fuel Comparisons
                H(
                  'div',
                  { class: 'rounded-xl border border-white/10 bg-[#070a10] p-4 space-y-3' },
                  H(
                    'div',
                    { class: 'flex items-center justify-between' },
                    H(
                      'h3',
                      { class: 'text-[12px] font-bold text-zinc-100' },
                      'Fuel Consumption to Power a 1,000 MW Electric City for 1 Day (1 GW-day = 86.4 TJ)',
                    ),
                    H(
                      'span',
                      { class: 'text-[10px] text-zinc-500' },
                      'Comparing Nuclear vs Fossil vs Chemical',
                    ),
                  ),
                  H(
                    'div',
                    { class: 'space-y-1.5' },
                    ...FUEL_COMPARISONS.map((fuel) =>
                      H(
                        'div',
                        {
                          key: fuel.name,
                          class:
                            'flex flex-wrap items-center justify-between gap-2 rounded border border-white/5 bg-white/[0.02] px-3 py-2 text-[10.5px]',
                        },
                        H(
                          'div',
                          null,
                          H('span', { class: 'font-bold text-zinc-200' }, fuel.name),
                          H('span', { class: 'ml-2 text-[9.5px] text-zinc-500' }, fuel.description),
                        ),
                        H(
                          'div',
                          { class: 'flex items-center gap-4' },
                          H(
                            'span',
                            { class: 'text-zinc-400' },
                            fuel.densityMjPerKg >= 1_000_000
                              ? `${(fuel.densityMjPerKg / 1_000_000).toFixed(1)} TJ/kg`
                              : `${fuel.densityMjPerKg} MJ/kg`,
                          ),
                          H(
                            'span',
                            { class: 'rounded bg-white/10 px-2 py-0.5 font-bold text-amber-300' },
                            fuel.gramsFor1Gwd < 1
                              ? `${(fuel.gramsFor1Gwd * 1000).toFixed(1)} mg`
                              : fuel.gramsFor1Gwd < 1000
                                ? `${fuel.gramsFor1Gwd.toFixed(2)} g`
                                : fuel.gramsFor1Gwd < 1_000_000
                                  ? `${(fuel.gramsFor1Gwd / 1000).toFixed(1)} kg`
                                  : `${(fuel.gramsFor1Gwd / 1_000_000).toFixed(1)} metric tonnes`,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
      ),
    ),
  )
}
