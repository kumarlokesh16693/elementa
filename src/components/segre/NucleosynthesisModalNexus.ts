import { h, reactive, type VNode } from 'nexus-framework'
import {
  BURNING_STAGES,
  NEUTRON_CAPTURE_PROCESSES,
  COSMIC_ABUNDANCES,
  getCosmicAbundance,
  calculateGamowPeak,
  type BurningStage,
  type NeutronCaptureProcess,
} from '@/lib/periodic/nucleosynthesis'
import { nucAt, type Nuclide } from '@/lib/periodic/nuclides'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

type TabKey = 'stages' | 'neutron_capture' | 'abundance' | 'gamow' | 'origins'

export interface AstroState {
  activeTab: TabKey
  selectedStage: typeof BURNING_STAGES[number]
  selectedProcess: typeof NEUTRON_CAPTURE_PROCESSES[number]
  inspectZ: number
  hoverZ: number | null
  gamowZ1: number
  gamowA1: number
  gamowZ2: number
  gamowA2: number
  gamowT: number
}

export const astroState = reactive<AstroState>({
  activeTab: 'stages',
  selectedStage: BURNING_STAGES[1], // pp_chain default
  selectedProcess: NEUTRON_CAPTURE_PROCESSES[1], // r_process default
  inspectZ: 26,
  hoverZ: null,
  gamowZ1: 1,
  gamowA1: 1,
  gamowZ2: 1,
  gamowA2: 1,
  gamowT: 15.7,
})

export function initAstroState(initialNuclide?: Nuclide | null): void {
  astroState.activeTab = 'stages'
  astroState.selectedStage = BURNING_STAGES[1]
  astroState.selectedProcess = NEUTRON_CAPTURE_PROCESSES[1]
  astroState.inspectZ = initialNuclide ? initialNuclide.z : 26
  astroState.hoverZ = null
  astroState.gamowZ1 = 1
  astroState.gamowA1 = 1
  astroState.gamowZ2 = 1
  astroState.gamowA2 = 1
  astroState.gamowT = 15.7
}

export function NucleosynthesisModalNexus({
  initialNuclide: _initialNuclide,
  onClose,
  onSelectNuclide,
}: {
  initialNuclide?: Nuclide | null
  onClose: () => void
  onSelectNuclide?: (nu: Nuclide) => void
}): VNode {
  const state = astroState

  // Precomputed cosmic abundance curve data points for Z = 1 to 92
  const abundancePoints: { z: number; logN: number; symbol: string; name: string }[] = []
  for (let z = 1; z <= 92; z++) {
    const entry = getCosmicAbundance(z)
    abundancePoints.push({
      z,
      logN: entry.logAbundance,
      symbol: entry.symbol,
      name: entry.name,
    })
  }

  // Gamow peak result
  const gamowResult = calculateGamowPeak(
    state.gamowZ1,
    state.gamowZ2,
    state.gamowA1,
    state.gamowA2,
    state.gamowT,
  )

  // SVG Chart dimensions for Abundance Curve
  const AW = 760
  const AH = 260
  const AM = { l: 50, r: 24, t: 20, b: 35 }
  const aIw = AW - AM.l - AM.r
  const aIh = AH - AM.t - AM.b

  const xZ = (z: number) => AM.l + ((z - 1) / 91) * aIw
  // logAbundance ranges from -2.5 to 11.0
  const yLog = (val: number) => AM.t + aIh - ((val - -2.5) / 13.5) * aIh

  let abundancePathD = ''
  abundancePoints.forEach((pt, idx) => {
    const px = xZ(pt.z)
    const py = yLog(pt.logN)
    abundancePathD += `${idx === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)} `
  })

  const inspectedAbundance = getCosmicAbundance(state.hoverZ ?? state.inspectZ)

  return H(
    'div',
    {
      class: 'fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md select-none',
      role: 'dialog',
      'aria-label': 'Stellar Nucleosynthesis & Cosmic Origins Simulator',
    },
    H(
      'div',
      {
        class: 'flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#090e18] shadow-2xl text-zinc-200',
      },
      // Header
      H(
        'header',
        { class: 'flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0c1424] px-4 py-3' },
        H(
          'div',
          { class: 'flex items-center gap-3' },
          H('span', { class: 'flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 font-mono text-sm font-bold text-amber-300' }, '✦'),
          H(
            'div',
            null,
            H(
              'div',
              { class: 'flex items-center gap-2' },
              H('h2', { class: 'text-sm font-bold tracking-wider text-zinc-100 uppercase' }, 'Stellar Nucleosynthesis & Cosmic Origins'),
              H('span', { class: 'rounded bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300 border border-amber-400/20' }, 'Astrophysics & B²FH Engine'),
            ),
            H('p', { class: 'text-[10.5px] text-zinc-400' }, 'Thermonuclear fusion cycles, s/r-process neutron capture, and the cosmic forging of the elements'),
          ),
        ),
        H(
          'button',
          {
            type: 'button',
            class: 'rounded-md border border-white/10 px-2.5 py-1 text-sm font-semibold text-zinc-400 transition hover:border-white/30 hover:text-zinc-100 cursor-pointer',
            title: 'Close',
            onClick: onClose,
          },
          '✕',
        ),
      ),

      // Navigation Tabs
      H(
        'div',
        { class: 'flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-[#070b12] px-4 py-2' },
        ...([
          ['stages', 'Stellar Burning Stages'],
          ['neutron_capture', 's-Process vs r-Process'],
          ['abundance', 'Cosmic Abundance Curve'],
          ['gamow', 'Gamow Peak & Tunneling'],
          ['origins', 'Cosmic Origin by Element'],
        ] as [TabKey, string][]).map(([tabKey, label]) => {
          const active = state.activeTab === tabKey
          return H(
            'button',
            {
              key: tabKey,
              type: 'button',
              onClick: () => { state.activeTab = tabKey },
              class: `rounded-md border px-3 py-1 text-[11px] font-medium transition cursor-pointer ${
                active
                  ? 'border-amber-400/60 bg-amber-400/15 text-amber-300 font-bold'
                  : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`,
            },
            label,
          )
        }),
      ),

      // Workspace Body
      H(
        'div',
        { class: 'min-h-0 flex-1 overflow-y-auto p-4 space-y-4' },

        // ==================== TAB 1: STELLAR BURNING STAGES ====================
        state.activeTab === 'stages'
          ? H(
              'div',
              { class: 'space-y-4' },
              // Stage selector chips
              H(
                'div',
                { class: 'flex flex-wrap gap-1.5' },
                ...BURNING_STAGES.map((stage) => {
                  const active = state.selectedStage.id === stage.id
                  return H(
                    'button',
                    {
                      key: stage.id,
                      type: 'button',
                      onClick: () => { state.selectedStage = stage },
                      class: `rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition cursor-pointer ${
                        active
                          ? 'border-amber-400/60 bg-amber-400/20 text-amber-200 font-bold shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                          : 'border-white/10 bg-[#0d1424] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                      }`,
                    },
                    stage.short,
                  )
                }),
              ),

              // Stage Details Card
              H(
                'div',
                { class: 'rounded-xl border border-white/10 bg-[#0d1526] p-4 space-y-3' },
                H(
                  'div',
                  { class: 'flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-white/10 pb-2.5' },
                  H(
                    'div',
                    null,
                    H('h3', { class: 'text-sm font-bold text-amber-300' }, state.selectedStage.name),
                    H('div', { class: 'text-[11px] text-zinc-400' }, state.selectedStage.site),
                  ),
                  H(
                    'div',
                    { class: 'font-mono text-[11px] text-sky-400' },
                    `Duration: ${state.selectedStage.typicalDuration}`,
                  ),
                ),

                H('p', { class: 'text-[11.5px] leading-relaxed text-zinc-300' }, state.selectedStage.description),

                // Physical Conditions Grid
                H(
                  'div',
                  { class: 'grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-[11px]' },
                  H(
                    'div',
                    { class: 'rounded-lg border border-white/8 bg-white/[0.02] p-2' },
                    H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Temperature'),
                    H('span', { class: 'text-amber-300 font-bold' }, `${state.selectedStage.temperatureMK >= 1000 ? (state.selectedStage.temperatureMK / 1000).toFixed(1) + ' GK' : state.selectedStage.temperatureMK + ' MK'}`),
                  ),
                  H(
                    'div',
                    { class: 'rounded-lg border border-white/8 bg-white/[0.02] p-2' },
                    H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Core Density'),
                    H('span', { class: 'text-zinc-200 font-bold' }, `${state.selectedStage.densityGcm3.toExponential(1)} g/cm³`),
                  ),
                  H(
                    'div',
                    { class: 'rounded-lg border border-white/8 bg-white/[0.02] p-2' },
                    H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Q-Value (Net)'),
                    H('span', { class: 'text-emerald-400 font-bold' }, `+${state.selectedStage.qNetMev} MeV`),
                  ),
                  H(
                    'div',
                    { class: 'rounded-lg border border-white/8 bg-white/[0.02] p-2' },
                    H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Sensitivity'),
                    H('span', { class: 'text-purple-300 font-bold' }, state.selectedStage.powerLawT),
                  ),
                ),

                // Sub-reactions Table
                H(
                  'div',
                  { class: 'mt-3 overflow-hidden rounded-lg border border-white/10' },
                  H(
                    'table',
                    { class: 'w-full text-left font-mono text-[11px]' },
                    H(
                      'thead',
                      { class: 'border-b border-white/10 bg-white/[0.03] text-[9px] uppercase tracking-wider text-zinc-400' },
                      H(
                        'tr',
                        null,
                        H('th', { class: 'px-3 py-2' }, 'Reaction Step'),
                        H('th', { class: 'px-3 py-2 text-right' }, 'Q-Value (MeV)'),
                        H('th', { class: 'px-3 py-2' }, 'Astrophysical Role & Notes'),
                      ),
                    ),
                    H(
                      'tbody',
                      { class: 'divide-y divide-white/5 bg-[#0a0f1c]' },
                      ...state.selectedStage.reactions.map((r, idx) =>
                        H(
                          'tr',
                          { key: idx, class: 'transition hover:bg-white/[0.02]' },
                          H('td', { class: 'px-3 py-2 text-zinc-100 font-bold' }, r.equation),
                          H(
                            'td',
                            { class: `px-3 py-2 text-right font-bold ${r.qMev >= 0 ? 'text-emerald-400' : 'text-rose-400'}` },
                            `${r.qMev >= 0 ? '+' : ''}${r.qMev.toFixed(3)}`,
                          ),
                          H('td', { class: 'px-3 py-2 text-[10.5px] text-zinc-400' }, r.notes ?? '—'),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            )
          : null,

        // ==================== TAB 2: S-PROCESS VS R-PROCESS ====================
        state.activeTab === 'neutron_capture'
          ? H(
              'div',
              { class: 'space-y-4' },
              // Process comparison selector
              H(
                'div',
                { class: 'grid grid-cols-1 sm:grid-cols-3 gap-2' },
                ...NEUTRON_CAPTURE_PROCESSES.map((proc) => {
                  const active = state.selectedProcess.id === proc.id
                  return H(
                    'button',
                    {
                      key: proc.id,
                      type: 'button',
                      onClick: () => { state.selectedProcess = proc },
                      class: `rounded-xl border p-3 text-left transition cursor-pointer ${
                        active
                          ? 'border-amber-400/60 bg-amber-400/15 text-amber-200 shadow-md'
                          : 'border-white/10 bg-[#0c1424] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                      }`,
                    },
                    H('div', { class: 'font-mono text-xs font-bold' }, proc.name),
                    H('div', { class: 'mt-1 text-[10px] text-zinc-400 font-mono' }, proc.timescaleRelation),
                  )
                }),
              ),

              // Selected Process Detail
              H(
                'div',
                { class: 'rounded-xl border border-white/10 bg-[#0d1628] p-4 space-y-3' },
                H('h3', { class: 'text-sm font-bold text-amber-300' }, state.selectedProcess.name),
                H('p', { class: 'text-[11.5px] leading-relaxed text-zinc-300' }, state.selectedProcess.description),

                H(
                  'div',
                  { class: 'grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]' },
                  H(
                    'div',
                    { class: 'rounded-lg border border-white/8 bg-white/[0.02] p-2.5' },
                    H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Neutron Flux Density'),
                    H('span', { class: 'text-sky-300 font-bold' }, state.selectedProcess.neutronDensityCm3),
                  ),
                  H(
                    'div',
                    { class: 'rounded-lg border border-white/8 bg-white/[0.02] p-2.5' },
                    H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Abundance Peaks (A)'),
                    H('span', { class: 'text-amber-300 font-bold' }, state.selectedProcess.keyPeaksA.join(', ')),
                  ),
                  H(
                    'div',
                    { class: 'rounded-lg border border-white/8 bg-white/[0.02] p-2.5' },
                    H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Terminal Nucleus'),
                    H('span', { class: 'text-emerald-400 font-bold' }, state.selectedProcess.terminalElement),
                  ),
                ),

                // Astrophysical Sites
                H(
                  'div',
                  { class: 'rounded-lg border border-white/8 bg-white/[0.02] p-3' },
                  H('h4', { class: 'mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono' }, 'Astrophysical Sites & Environments'),
                  H(
                    'ul',
                    { class: 'list-disc space-y-1 pl-4 text-[11px] text-zinc-300' },
                    ...state.selectedProcess.sites.map((s, idx) => H('li', { key: idx }, s)),
                  ),
                ),

                // Characteristic Nuclides Chips
                H(
                  'div',
                  null,
                  H('span', { class: 'block mb-1.5 text-[9.5px] uppercase tracking-wider text-zinc-500 font-mono' }, 'Key Isotopes Synthesized:'),
                  H(
                    'div',
                    { class: 'flex flex-wrap gap-1.5' },
                    ...state.selectedProcess.characteristicNuclides.map((nuc) =>
                      H(
                        'span',
                        {
                          key: nuc,
                          class: 'rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10.5px] text-zinc-200',
                        },
                        nuc,
                      ),
                    ),
                  ),
                ),
              ),
            )
          : null,

        // ==================== TAB 3: COSMIC ABUNDANCE CURVE ====================
        state.activeTab === 'abundance'
          ? H(
              'div',
              { class: 'space-y-4' },
              H(
                'div',
                { class: 'flex flex-wrap items-center justify-between gap-2 text-[11px]' },
                H(
                  'div',
                  { class: 'flex items-center gap-2' },
                  H('span', { class: 'font-mono font-bold text-zinc-200' }, 'SOLAR SYSTEM ELEMENTAL ABUNDANCE'),
                  H('span', { class: 'font-mono text-zinc-500 text-[10px]' }, '(Lodders 2009 standard, log₁₀ N relative to Si = 10⁶)'),
                ),
                H(
                  'div',
                  { class: 'font-mono text-[10.5px] text-amber-300' },
                  `Inspecting: Z = ${inspectedAbundance.z} (${inspectedAbundance.symbol} - ${inspectedAbundance.name}) | log₁₀ N = ${inspectedAbundance.logAbundance}`,
                ),
              ),

              // SVG Plot
              H(
                'div',
                { class: 'relative rounded-xl border border-white/10 bg-[#070b13] p-3 shadow-inner' },
                H(
                  'svg',
                  {
                    viewBox: `0 0 ${AW} ${AH}`,
                    class: 'w-full select-none cursor-crosshair',
                  },
                  // Horizontal Gridlines (-2, 0, 2, 4, 6, 8, 10)
                  ...[-2, 0, 2, 4, 6, 8, 10].map((val) => {
                    const y = yLog(val)
                    return H(
                      'g',
                      { key: `y-${val}` },
                      H('line', {
                        x1: AM.l,
                        x2: AM.l + aIw,
                        y1: y,
                        y2: y,
                        stroke: '#ffffff0d',
                        strokeDasharray: '3 3',
                      }),
                      H(
                        'text',
                        {
                          x: AM.l - 6,
                          y: y + 3,
                          textAnchor: 'end',
                          class: 'font-mono text-[8.5px] fill-zinc-500',
                        },
                        `10^${val}`,
                      ),
                    )
                  }),

                  // Vertical Gridlines (Z = 10, 20, 26, 30, 40, 50, 56, 70, 82, 92)
                  ...[10, 20, 26, 30, 40, 50, 56, 70, 82, 92].map((z) => {
                    const x = xZ(z)
                    return H(
                      'g',
                      { key: `x-${z}` },
                      H('line', {
                        x1: x,
                        x2: x,
                        y1: AM.t,
                        y2: AM.t + aIh,
                        stroke: z === 26 ? '#f59e0b44' : '#ffffff0a',
                        strokeDasharray: '2 2',
                      }),
                      H(
                        'text',
                        {
                          x,
                          y: AM.t + aIh + 16,
                          textAnchor: 'middle',
                          class: `font-mono text-[8px] ${z === 26 ? 'fill-amber-400 font-bold' : 'fill-zinc-500'}`,
                        },
                        z === 26 ? '26 (Fe)' : String(z),
                      ),
                    )
                  }),

                  // Abundance curve polyline
                  H('path', {
                    d: abundancePathD,
                    fill: 'none',
                    stroke: '#38bdf8',
                    strokeWidth: '1.8',
                  }),

                  // Individual element points
                  ...abundancePoints.map((pt) => {
                    const px = xZ(pt.z)
                    const py = yLog(pt.logN)
                    const isSelected = (state.hoverZ ?? state.inspectZ) === pt.z
                    return H('circle', {
                      key: `pt-${pt.z}`,
                      cx: px,
                      cy: py,
                      r: isSelected ? '4.5' : pt.z === 26 || pt.z === 1 || pt.z === 82 ? '3.5' : '1.8',
                      fill: isSelected ? '#fbbf24' : pt.z === 26 ? '#f59e0b' : '#38bdf8',
                      stroke: '#ffffff44',
                      strokeWidth: isSelected ? '2' : '0.5',
                      class: 'cursor-pointer',
                      onMouseEnter: () => { state.hoverZ = pt.z },
                      onMouseLeave: () => { state.hoverZ = null },
                      onClick: () => {
                        state.inspectZ = pt.z
                        const nu = nucAt(pt.z, Math.round(pt.z * 1.2))
                        if (nu && onSelectNuclide) onSelectNuclide(nu)
                      },
                    })
                  }),

                  // Iron peak marker
                  H('text', {
                    x: xZ(26),
                    y: yLog(5.95) - 8,
                    textAnchor: 'middle',
                    class: 'font-mono text-[9px] font-bold fill-amber-300',
                  }, 'Iron Peak (Fe)'),
                ),
              ),

              // Element Detail Readout
              H(
                'div',
                { class: 'rounded-xl border border-white/10 bg-[#0d1628] p-3.5 space-y-2' },
                H(
                  'div',
                  { class: 'flex items-baseline justify-between border-b border-white/10 pb-2' },
                  H(
                    'div',
                    { class: 'flex items-center gap-2' },
                    H('span', { class: 'text-sm font-bold text-zinc-100' }, `${inspectedAbundance.name} (${inspectedAbundance.symbol})`),
                    H('span', { class: 'rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300' }, `Z = ${inspectedAbundance.z}`),
                  ),
                  H('span', { class: 'font-mono text-xs font-bold text-amber-300' }, inspectedAbundance.primaryOrigin),
                ),
                H(
                  'div',
                  { class: 'grid grid-cols-2 sm:grid-cols-6 gap-1.5 font-mono text-[10px]' },
                  H('div', { class: 'rounded bg-white/[0.02] p-1.5 text-center' }, H('span', { class: 'block text-zinc-500' }, 'Big Bang'), H('span', { class: 'text-zinc-200' }, `${inspectedAbundance.origins.bbn}%`)),
                  H('div', { class: 'rounded bg-white/[0.02] p-1.5 text-center' }, H('span', { class: 'block text-zinc-500' }, 'Cosmic Rays'), H('span', { class: 'text-zinc-200' }, `${inspectedAbundance.origins.spallation}%`)),
                  H('div', { class: 'rounded bg-white/[0.02] p-1.5 text-center' }, H('span', { class: 'block text-zinc-500' }, 'Low-Mass (s)'), H('span', { class: 'text-zinc-200' }, `${inspectedAbundance.origins.lowMassStars}%`)),
                  H('div', { class: 'rounded bg-white/[0.02] p-1.5 text-center' }, H('span', { class: 'block text-zinc-500' }, 'Massive SN II'), H('span', { class: 'text-zinc-200' }, `${inspectedAbundance.origins.explodingMassive}%`)),
                  H('div', { class: 'rounded bg-white/[0.02] p-1.5 text-center' }, H('span', { class: 'block text-zinc-500' }, 'White Dwarfs'), H('span', { class: 'text-zinc-200' }, `${inspectedAbundance.origins.explodingWhiteDwarf}%`)),
                  H('div', { class: 'rounded bg-white/[0.02] p-1.5 text-center' }, H('span', { class: 'block text-zinc-500' }, 'Mergers (r)'), H('span', { class: 'text-amber-300 font-bold' }, `${inspectedAbundance.origins.neutronStarMergers}%`)),
                ),
              ),
            )
          : null,

        // ==================== TAB 4: GAMOW PEAK & TUNNELING ====================
        state.activeTab === 'gamow'
          ? H(
              'div',
              { class: 'space-y-4' },
              H('p', { class: 'text-[11.5px] leading-relaxed text-zinc-300' },
                'Thermonuclear reactions in stellar interiors occur at the Gamow Peak — the narrow energy window formed by the overlap of the Maxwell-Boltzmann thermal kinetic energy tail with the quantum mechanical Coulomb barrier tunneling probability.',
              ),

              // Inputs for Gamow Peak
              H(
                'div',
                { class: 'grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-white/10 bg-[#0b101c] p-3 font-mono text-[11px]' },
                H(
                  'div',
                  { class: 'space-y-1' },
                  H('label', { class: 'text-[9.5px] text-zinc-500 uppercase' }, 'Reactant 1 (Z₁, A₁)'),
                  H(
                    'div',
                    { class: 'flex gap-1.5' },
                    H('input', {
                      type: 'number',
                      min: '1',
                      max: '26',
                      value: state.gamowZ1,
                      class: 'w-1/2 rounded border border-white/10 bg-[#121a2c] px-2 py-1 text-zinc-200',
                      onInput: (e: any) => { state.gamowZ1 = Math.max(1, parseInt(e.target.value) || 1) },
                    }),
                    H('input', {
                      type: 'number',
                      min: '1',
                      max: '60',
                      value: state.gamowA1,
                      class: 'w-1/2 rounded border border-white/10 bg-[#121a2c] px-2 py-1 text-zinc-200',
                      onInput: (e: any) => { state.gamowA1 = Math.max(1, parseInt(e.target.value) || 1) },
                    }),
                  ),
                ),
                H(
                  'div',
                  { class: 'space-y-1' },
                  H('label', { class: 'text-[9.5px] text-zinc-500 uppercase' }, 'Reactant 2 (Z₂, A₂)'),
                  H(
                    'div',
                    { class: 'flex gap-1.5' },
                    H('input', {
                      type: 'number',
                      min: '1',
                      max: '26',
                      value: state.gamowZ2,
                      class: 'w-1/2 rounded border border-white/10 bg-[#121a2c] px-2 py-1 text-zinc-200',
                      onInput: (e: any) => { state.gamowZ2 = Math.max(1, parseInt(e.target.value) || 1) },
                    }),
                    H('input', {
                      type: 'number',
                      min: '1',
                      max: '60',
                      value: state.gamowA2,
                      class: 'w-1/2 rounded border border-white/10 bg-[#121a2c] px-2 py-1 text-zinc-200',
                      onInput: (e: any) => { state.gamowA2 = Math.max(1, parseInt(e.target.value) || 1) },
                    }),
                  ),
                ),
                H(
                  'div',
                  { class: 'space-y-1' },
                  H('label', { class: 'text-[9.5px] text-zinc-500 uppercase' }, `Core Temp: ${state.gamowT} Million K`),
                  H('input', {
                    type: 'range',
                    min: '1',
                    max: '3000',
                    step: '1',
                    value: state.gamowT,
                    class: 'w-full accent-amber-400 cursor-pointer',
                    onInput: (e: any) => { state.gamowT = parseFloat(e.target.value) || 15.7 },
                  }),
                ),
              ),

              // Gamow Results Card
              H(
                'div',
                { class: 'grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]' },
                H(
                  'div',
                  { class: 'rounded-xl border border-white/10 bg-[#0d1628] p-3' },
                  H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Gamow Peak (E₀)'),
                  H('span', { class: 'text-amber-300 font-bold text-sm' }, `${gamowResult.e0Kev} keV`),
                ),
                H(
                  'div',
                  { class: 'rounded-xl border border-white/10 bg-[#0d1628] p-3' },
                  H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Window Width (ΔE)'),
                  H('span', { class: 'text-zinc-200 font-bold text-sm' }, `± ${(gamowResult.deltaEKev / 2).toFixed(2)} keV`),
                ),
                H(
                  'div',
                  { class: 'rounded-xl border border-white/10 bg-[#0d1628] p-3' },
                  H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Tunneling Factor'),
                  H('span', { class: 'text-sky-300 font-bold text-sm' }, gamowResult.tunnelingProb.toExponential(2)),
                ),
                H(
                  'div',
                  { class: 'rounded-xl border border-white/10 bg-[#0d1628] p-3' },
                  H('span', { class: 'block text-[9px] uppercase tracking-wider text-zinc-500' }, 'Thermal Energy (k_B T)'),
                  H('span', { class: 'text-purple-300 font-bold text-sm' }, `${(8.617e-5 * state.gamowT * 1e6 / 1000).toFixed(2)} keV`),
                ),
              ),

              // Mathematical derivation note
              H(
                'div',
                { class: 'rounded-xl border border-sky-500/20 bg-sky-950/20 p-3 text-[11px] leading-relaxed text-zinc-300' },
                H('strong', { class: 'text-sky-400 font-mono' }, 'Quantum Tunneling & Cross-Section Factorization:'),
                H(
                  'div',
                  { class: 'my-1 rounded bg-black/40 p-2 font-mono text-[10.5px] text-zinc-200 whitespace-pre overflow-x-auto' },
                  'σ(E) = (S(E) / E) · exp(-√(E_G / E))\n' +
                  'E₀ = 1.2204 · (Z₁² Z₂² A_red T_6²)^(1/3)  [keV]\n' +
                  'ΔE = 0.9816 · (Z₁² Z₂² A_red T_6⁵)^(1/6)  [keV]',
                ),
              ),
            )
          : null,

        // ==================== TAB 5: COSMIC ORIGINS BY ELEMENT ====================
        state.activeTab === 'origins'
          ? H(
              'div',
              { class: 'space-y-4' },
              H('p', { class: 'text-[11.5px] leading-relaxed text-zinc-300' },
                'Every atom in the periodic table was forged in an astrophysical forge. Select any element to inspect its cosmic origin decomposition according to modern stellar nucleosynthesis consensus.',
              ),

              // Quick selector grid (Z = 1 to 92)
              H(
                'div',
                { class: 'flex flex-wrap gap-1 max-h-48 overflow-y-auto p-1.5 rounded-lg border border-white/10 bg-[#060a12]' },
                ...abundancePoints.map((pt) => {
                  const active = state.inspectZ === pt.z
                  return H(
                    'button',
                    {
                      key: pt.z,
                      type: 'button',
                      onClick: () => { state.inspectZ = pt.z },
                      class: `h-7 w-8 rounded border text-[9.5px] font-mono font-bold transition cursor-pointer ${
                        active
                          ? 'border-amber-400 bg-amber-400/25 text-amber-200'
                          : 'border-white/10 bg-[#0d1424] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                      }`,
                    },
                    pt.symbol,
                  )
                }),
              ),

              // Full origin breakdown card for selected element
              H(
                'div',
                { class: 'rounded-xl border border-white/10 bg-[#0d1628] p-4 space-y-3' },
                H(
                  'div',
                  { class: 'flex items-baseline justify-between border-b border-white/10 pb-2' },
                  H(
                    'div',
                    { class: 'flex items-center gap-2' },
                    H('h3', { class: 'text-base font-bold text-amber-300' }, `${inspectedAbundance.name} (${inspectedAbundance.symbol})`),
                    H('span', { class: 'rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-zinc-300' }, `Atomic Number Z = ${inspectedAbundance.z}`),
                  ),
                  H('span', { class: 'font-mono text-xs font-semibold text-zinc-300' }, inspectedAbundance.primaryOrigin),
                ),

                // Horizontal origin stacked bar chart
                H(
                  'div',
                  { class: 'space-y-1' },
                  H(
                    'div',
                    { class: 'flex h-5 w-full overflow-hidden rounded-md border border-white/10 bg-black/40' },
                    inspectedAbundance.origins.bbn > 0
                      ? H('div', { style: `width: ${inspectedAbundance.origins.bbn}%; background: #38bdf8;`, title: `Big Bang: ${inspectedAbundance.origins.bbn}%` })
                      : null,
                    inspectedAbundance.origins.spallation > 0
                      ? H('div', { style: `width: ${inspectedAbundance.origins.spallation}%; background: #a855f7;`, title: `Cosmic Rays: ${inspectedAbundance.origins.spallation}%` })
                      : null,
                    inspectedAbundance.origins.lowMassStars > 0
                      ? H('div', { style: `width: ${inspectedAbundance.origins.lowMassStars}%; background: #34d399;`, title: `Dying Low-Mass Stars (s): ${inspectedAbundance.origins.lowMassStars}%` })
                      : null,
                    inspectedAbundance.origins.explodingMassive > 0
                      ? H('div', { style: `width: ${inspectedAbundance.origins.explodingMassive}%; background: #fb923c;`, title: `Exploding Massive Stars (SN II): ${inspectedAbundance.origins.explodingMassive}%` })
                      : null,
                    inspectedAbundance.origins.explodingWhiteDwarf > 0
                      ? H('div', { style: `width: ${inspectedAbundance.origins.explodingWhiteDwarf}%; background: #f43f5e;`, title: `Exploding White Dwarfs (SN Ia): ${inspectedAbundance.origins.explodingWhiteDwarf}%` })
                      : null,
                    inspectedAbundance.origins.neutronStarMergers > 0
                      ? H('div', { style: `width: ${inspectedAbundance.origins.neutronStarMergers}%; background: #fbbf24;`, title: `Neutron Star Mergers (r): ${inspectedAbundance.origins.neutronStarMergers}%` })
                      : null,
                  ),
                  H(
                    'div',
                    { class: 'flex flex-wrap items-center gap-3 font-mono text-[9.5px] text-zinc-400 pt-1' },
                    H('span', { class: 'flex items-center gap-1' }, H('span', { class: 'h-2 w-2 rounded-full bg-[#38bdf8]' }), `Big Bang (${inspectedAbundance.origins.bbn}%)`),
                    H('span', { class: 'flex items-center gap-1' }, H('span', { class: 'h-2 w-2 rounded-full bg-[#a855f7]' }), `Cosmic Rays (${inspectedAbundance.origins.spallation}%)`),
                    H('span', { class: 'flex items-center gap-1' }, H('span', { class: 'h-2 w-2 rounded-full bg-[#34d399]' }), `Low-Mass AGB (${inspectedAbundance.origins.lowMassStars}%)`),
                    H('span', { class: 'flex items-center gap-1' }, H('span', { class: 'h-2 w-2 rounded-full bg-[#fb923c]' }), `Massive SN II (${inspectedAbundance.origins.explodingMassive}%)`),
                    H('span', { class: 'flex items-center gap-1' }, H('span', { class: 'h-2 w-2 rounded-full bg-[#f43f5e]' }), `White Dwarfs SN Ia (${inspectedAbundance.origins.explodingWhiteDwarf}%)`),
                    H('span', { class: 'flex items-center gap-1' }, H('span', { class: 'h-2 w-2 rounded-full bg-[#fbbf24]' }), `Neutron Star Mergers (${inspectedAbundance.origins.neutronStarMergers}%)`),
                  ),
                ),
              ),
            )
          : null,
      ),
    ),
  )
}
