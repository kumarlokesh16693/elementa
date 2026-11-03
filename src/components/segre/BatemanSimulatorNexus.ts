import { h, reactive, type VNode } from 'nexus-framework'
import {
  BATEMAN_PRESETS,
  buildBatemanChain,
  convertAmountToAtoms,
  determineTimeBounds,
  evaluateBatemanAtTime,
  analyzeEquilibrium,
  formatActivityBq,
  formatAtomCount,
  formatDuration,
  formatMassGrams,
  type AmountUnit,
  type BatemanPreset,
  type MetricScale,
  type PlotMetric,
  type TimeScale,
} from '@/lib/periodic/bateman'
import { nucAt, type Nuclide } from '@/lib/periodic/nuclides'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

interface Props {
  initialNuclide?: Nuclide | null
  onClose: () => void
  onSelectNuclide?: (nu: Nuclide) => void
}

const UNITS: { key: AmountUnit; label: string }[] = [
  { key: 'GBq', label: 'GBq' },
  { key: 'MBq', label: 'MBq' },
  { key: 'kBq', label: 'kBq' },
  { key: 'Bq', label: 'Bq' },
  { key: 'Ci', label: 'Ci' },
  { key: 'mCi', label: 'mCi' },
  { key: 'uCi', label: 'µCi' },
  { key: 'g', label: 'g (grams)' },
  { key: 'mg', label: 'mg' },
  { key: 'kg', label: 'kg' },
  { key: 'atoms', label: 'Atoms (N₀)' },
]

export interface BatemanState {
  activeNuclide: Nuclide
  selectedPresetId: string | null
  amount: number
  unit: AmountUnit
  metric: PlotMetric
  yScale: MetricScale
  xScale: TimeScale
  currentTime: number
  isPlaying: boolean
  playbackSpeed: number
  hoverTime: number | null
  theoryOpen: boolean
}

const defaultInitialNuclide = nucAt(56, 84)!
const defaultInitialPreset = BATEMAN_PRESETS.find(
  (p) => p.rootZ === defaultInitialNuclide.z && p.rootN === defaultInitialNuclide.n,
)

export const batemanState = reactive<BatemanState>({
  activeNuclide: defaultInitialNuclide,
  selectedPresetId: defaultInitialPreset ? defaultInitialPreset.id : null,
  amount: defaultInitialPreset ? defaultInitialPreset.defaultAmount : 1.0,
  unit: (defaultInitialPreset ? defaultInitialPreset.defaultUnit : 'MBq') as AmountUnit,
  metric: 'activity',
  yScale: 'log',
  xScale: 'log',
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  hoverTime: null,
  theoryOpen: false,
})

export function initBatemanState(initialNuclide?: Nuclide | null): void {
  const nuclide = initialNuclide ?? defaultInitialNuclide
  const preset = BATEMAN_PRESETS.find(
    (p) => p.rootZ === nuclide.z && p.rootN === nuclide.n,
  )
  batemanState.activeNuclide = nuclide
  batemanState.selectedPresetId = preset ? preset.id : null
  batemanState.amount = preset ? preset.defaultAmount : 1.0
  batemanState.unit = (preset ? preset.defaultUnit : 'MBq') as AmountUnit
  batemanState.metric = 'activity'
  batemanState.yScale = 'log'
  batemanState.xScale = 'log'
  batemanState.currentTime = 0
  batemanState.isPlaying = false
  batemanState.playbackSpeed = 1
  batemanState.hoverTime = null
  batemanState.theoryOpen = false
}

export function BatemanSimulatorNexus({ initialNuclide: _initialNuclide, onClose, onSelectNuclide }: Props): VNode {
  const state = batemanState

  let animId: number | null = null
  let lastStamp = performance.now()

  const stopAnim = () => {
    if (animId != null) {
      cancelAnimationFrame(animId)
      animId = null
    }
  }

  const applyPreset = (preset: BatemanPreset) => {
    const nuc = nucAt(preset.rootZ, preset.rootN)
    if (!nuc) return
    stopAnim()
    state.selectedPresetId = preset.id
    state.activeNuclide = nuc
    state.amount = preset.defaultAmount
    state.unit = preset.defaultUnit
    state.currentTime = 0
    state.isPlaying = false
  }

  // Chain and physics calculation
  const chain = buildBatemanChain(state.activeNuclide, 14)
  const equilibrium = analyzeEquilibrium(chain)
  const timeBounds = determineTimeBounds(chain)
  const n0 = convertAmountToAtoms(state.amount, state.unit, state.activeNuclide)

  const step = (now: number) => {
    if (!state.isPlaying) {
      stopAnim()
      return
    }
    const dtReal = (now - lastStamp) / 1000
    lastStamp = now
    const span = timeBounds.tEnd - timeBounds.tMin
    const dtSim = (span / 25) * dtReal * state.playbackSpeed
    const next = state.currentTime + dtSim
    if (next >= timeBounds.tEnd) {
      state.currentTime = timeBounds.tEnd
      state.isPlaying = false
      stopAnim()
    } else {
      state.currentTime = next
      animId = requestAnimationFrame(step)
    }
  }

  const togglePlay = () => {
    state.isPlaying = !state.isPlaying
    if (state.isPlaying) {
      lastStamp = performance.now()
      animId = requestAnimationFrame(step)
    } else {
      stopAnim()
    }
  }

  const handleClose = () => {
    stopAnim()
    onClose()
  }

  // Snapshot at current time
  const snapshot = evaluateBatemanAtTime(chain, n0, state.currentTime)
  const hoverSnapshot = state.hoverTime != null ? evaluateBatemanAtTime(chain, n0, state.hoverTime) : null
  const displaySnapshot = hoverSnapshot ?? snapshot
  const displayTime = state.hoverTime ?? state.currentTime

  // Plot data generator
  const pointsCount = 200
  const points: { t: number; values: number[] }[] = []
  const minT = Math.max(1e-6, timeBounds.tMin)
  const maxT = timeBounds.tEnd
  const logMin = Math.log10(minT)
  const logMax = Math.log10(maxT)

  for (let i = 0; i <= pointsCount; i++) {
    const frac = i / pointsCount
    const t =
      state.xScale === 'log'
        ? Math.pow(10, logMin + frac * (logMax - logMin))
        : minT + frac * (maxT - minT)

    const snap = evaluateBatemanAtTime(chain, n0, t)
    const values = snap.members.map((m) => {
      if (state.metric === 'activity') return m.activityBq
      if (state.metric === 'atoms') return m.atoms
      return m.massGrams
    })
    points.push({ t, values })
  }

  // Dimensions
  const CHART_W = 720
  const CHART_H = 280
  const PAD = { top: 16, right: 24, bottom: 36, left: 68 }
  const plotW = CHART_W - PAD.left - PAD.right
  const plotH = CHART_H - PAD.top - PAD.bottom

  // Y-axis bounds
  const allVals = points.flatMap((p) => p.values).filter((v) => Number.isFinite(v) && v > 0)
  const rawMax = allVals.length > 0 ? Math.max(...allVals) : 10
  const rawMin = allVals.length > 0 ? Math.min(...allVals) : 1

  let yMin = 1
  let yMax = 10
  if (state.yScale === 'log') {
    const yLogMax = Math.ceil(Math.log10(rawMax))
    const yLogMin = Math.max(yLogMax - 12, Math.floor(Math.log10(Math.max(1e-25, rawMin))))
    yMin = Math.pow(10, yLogMin)
    yMax = Math.pow(10, yLogMax)
  } else {
    yMin = 0
    yMax = rawMax * 1.05
  }

  const getX = (t: number) => {
    let frac = 0
    if (state.xScale === 'log') {
      frac = (Math.log10(Math.max(minT, t)) - logMin) / (logMax - logMin)
    } else {
      frac = (t - minT) / (maxT - minT)
    }
    return PAD.left + Math.max(0, Math.min(1, frac)) * plotW
  }

  const getY = (val: number) => {
    let frac = 0
    if (state.yScale === 'log') {
      const ymLogMin = Math.log10(yMin)
      const ymLogMax = Math.log10(yMax)
      const safeVal = Math.max(yMin, val)
      frac = (Math.log10(safeVal) - ymLogMin) / (ymLogMax - ymLogMin)
    } else {
      frac = (val - yMin) / (yMax - yMin || 1)
    }
    return PAD.top + (1 - Math.max(0, Math.min(1, frac))) * plotH
  }

  // Generate SVG path for each member
  const memberPaths = chain.map((member, mIdx) => {
    let d = ''
    for (let i = 0; i < points.length; i++) {
      const pt = points[i]
      const x = getX(pt.t)
      const val = pt.values[mIdx] ?? 0
      const y = getY(val)
      d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`
    }
    return { member, d }
  })

  // Y Ticks
  const yTicks: { y: number; label: string }[] = []
  if (state.yScale === 'log') {
    const lMin = Math.floor(Math.log10(yMin))
    const lMax = Math.ceil(Math.log10(yMax))
    const stepL = Math.max(1, Math.ceil((lMax - lMin) / 5))
    for (let p = lMin; p <= lMax; p += stepL) {
      const val = Math.pow(10, p)
      const y = getY(val)
      let label = ''
      if (state.metric === 'activity') label = formatActivityBq(val)
      else if (state.metric === 'atoms') label = val.toExponential(0)
      else label = formatMassGrams(val)
      yTicks.push({ y, label })
    }
  } else {
    for (let i = 0; i <= 5; i++) {
      const val = yMin + (i / 5) * (yMax - yMin)
      const y = getY(val)
      let label = ''
      if (state.metric === 'activity') label = formatActivityBq(val)
      else if (state.metric === 'atoms') label = formatAtomCount(val)
      else label = formatMassGrams(val)
      yTicks.push({ y, label })
    }
  }

  // X Ticks
  const xTicks: { x: number; label: string }[] = []
  if (state.xScale === 'log') {
    const lMin = Math.floor(Math.log10(minT))
    const lMax = Math.ceil(Math.log10(maxT))
    const stepL = Math.max(1, Math.ceil((lMax - lMin) / 5))
    for (let p = lMin; p <= lMax; p += stepL) {
      const val = Math.pow(10, p)
      const x = getX(val)
      xTicks.push({ x, label: formatDuration(val) })
    }
  } else {
    for (let i = 0; i <= 5; i++) {
      const val = minT + (i / 5) * (maxT - minT)
      const x = getX(val)
      xTicks.push({ x, label: formatDuration(val) })
    }
  }

  // Mouse move on SVG
  const handleSvgMouseMove = (e: MouseEvent) => {
    const target = e.currentTarget as SVGSVGElement
    const rect = target.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const svgX = (mouseX / rect.width) * CHART_W
    const relX = Math.max(0, Math.min(1, (svgX - PAD.left) / plotW))
    const t =
      state.xScale === 'log'
        ? Math.pow(10, Math.log10(minT) + relX * (Math.log10(maxT) - Math.log10(minT)))
        : minT + relX * (maxT - minT)
    state.hoverTime = t
  }

  const handleSvgClick = (e: MouseEvent) => {
    const target = e.currentTarget as SVGSVGElement
    const rect = target.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const svgX = (mouseX / rect.width) * CHART_W
    const relX = Math.max(0, Math.min(1, (svgX - PAD.left) / plotW))
    const t =
      state.xScale === 'log'
        ? Math.pow(10, Math.log10(minT) + relX * (Math.log10(maxT) - Math.log10(minT)))
        : minT + relX * (maxT - minT)
    state.currentTime = t
  }

  return H(
    'div',
    {
      class: 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-md md:p-6',
      role: 'dialog',
      'aria-label': 'Bateman Equation Decay Simulator',
    },
    H(
      'div',
      {
        class: 'flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#090e17] text-zinc-200 shadow-2xl',
      },
      // Top Header
      H(
        'header',
        { class: 'flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0c1322] px-4 py-3' },
        H(
          'div',
          { class: 'flex items-center gap-3' },
          H('span', { class: 'flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/15 font-mono text-xs font-bold text-amber-400' }, 'λ'),
          H(
            'div',
            null,
            H(
              'div',
              { class: 'flex items-center gap-2' },
              H('h2', { class: 'text-sm font-bold tracking-wider text-zinc-100 uppercase' }, 'Bateman Equation Decay Simulator'),
              H('span', { class: 'rounded bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-400' }, 'IAEA ENSDF Validated'),
            ),
            H('p', { class: 'text-[10.5px] text-zinc-400' }, 'Time-dependent radioactive decay chain & isotopic equilibrium engine'),
          ),
        ),
        H(
          'div',
          { class: 'flex items-center gap-2' },
          H(
            'button',
            {
              type: 'button',
              class: 'rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200 cursor-pointer',
              onClick: () => { state.theoryOpen = !state.theoryOpen },
            },
            state.theoryOpen ? 'Hide Theory' : 'Physics & Theory',
          ),
          H(
            'button',
            {
              type: 'button',
              class: 'rounded-md border border-white/10 px-2.5 py-1 text-sm font-semibold text-zinc-400 transition hover:border-white/30 hover:text-zinc-100 cursor-pointer',
              title: 'Close simulator',
              onClick: handleClose,
            },
            '✕',
          ),
        ),
      ),

      // Presets Bar
      H(
        'div',
        { class: 'flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-[#070b12] px-4 py-2' },
        H('span', { class: 'text-[10px] font-semibold tracking-wider text-zinc-500 uppercase' }, 'Presets:'),
        ...BATEMAN_PRESETS.map((p) => {
          const active = state.selectedPresetId === p.id
          return H(
            'button',
            {
              key: p.id,
              type: 'button',
              onClick: () => applyPreset(p),
              class: `shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                active
                  ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                  : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
              }`,
            },
            p.title.split(' ')[0],
          )
        }),
        state.selectedPresetId == null
          ? H(
              'span',
              { class: 'rounded-md border border-sky-400/50 bg-sky-400/15 px-2.5 py-1 text-[11px] font-semibold text-sky-300' },
              `Custom: ${state.activeNuclide.sym}-${state.activeNuclide.a}`,
            )
          : null,
      ),

      // Main Workspace Body
      H(
        'div',
        { class: 'min-h-0 flex-1 overflow-y-auto p-4 space-y-4' },

        // Equilibrium Status Banner
        H(
          'div',
          { class: 'flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0e1626]/80 p-3.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between' },
          H(
            'div',
            { class: 'space-y-1' },
            H(
              'div',
              { class: 'flex items-center gap-2' },
              H(
                'span',
                {
                  class: `rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider ${
                    equilibrium.type === 'secular'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : equilibrium.type === 'transient'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-zinc-700/40 text-zinc-300 border border-zinc-600/30'
                  }`,
                },
                equilibrium.label,
              ),
              H(
                'span',
                { class: 'text-[12px] font-semibold text-zinc-200' },
                `${chain[0].name} (${formatDuration(chain[0].halfLifeSec ?? 0)})${
                  chain.length > 1 ? ` → ${chain[1].name} (${formatDuration(chain[1].halfLifeSec ?? 0)})` : ''
                }`,
              ),
            ),
            H('p', { class: 'text-[11px] text-zinc-400' }, equilibrium.headline),
          ),
          H(
            'div',
            { class: 'flex flex-wrap items-center gap-1.5 shrink-0' },
            equilibrium.tMaxSec != null
              ? H(
                  'button',
                  {
                    type: 'button',
                    onClick: () => { state.currentTime = equilibrium.tMaxSec! },
                    class: 'rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-amber-300 transition hover:bg-amber-400/20 cursor-pointer',
                  },
                  `Jump to Peak (t_max: ${equilibrium.tMaxFormatted})`,
                )
              : null,
            chain[0].halfLifeSec
              ? H(
                  'button',
                  {
                    type: 'button',
                    onClick: () => { state.currentTime = chain[0].halfLifeSec! },
                    class: 'rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-zinc-300 transition hover:bg-white/10 cursor-pointer',
                  },
                  't = 1× t½',
                )
              : null,
            H(
              'button',
              {
                type: 'button',
                onClick: () => { state.currentTime = 0 },
                class: 'rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-zinc-300 transition hover:bg-white/10 cursor-pointer',
              },
              't = 0',
            ),
          ),
        ),

        // Theory Accordion
        state.theoryOpen
          ? H(
              'div',
              { class: 'rounded-xl border border-sky-500/20 bg-sky-950/20 p-4 text-[11px] leading-relaxed text-zinc-300' },
              H('h3', { class: 'mb-2 font-bold text-sky-400 uppercase tracking-wider' }, 'Bateman Equations & Decay Physics'),
              H('p', { class: 'mb-2' }, 'For a decay chain 1 → 2 → ... → n, the rate of change of each daughter isotope is determined by the balance of parent decay production minus its own radioactive decay:'),
              H(
                'div',
                { class: 'my-2 rounded-lg bg-black/40 p-2.5 font-mono text-[11px] text-zinc-200 overflow-x-auto whitespace-pre' },
                'dN₁/dt = -λ₁ N₁\n' +
                'dN_i/dt = b_{i-1} λ_{i-1} N_{i-1} - λ_i N_i   (for radioactive daughters)\n' +
                'dN_k/dt = b_{k-1} λ_{k-1} N_{k-1}             (for stable terminus)',
              ),
              H(
                'ul',
                { class: 'list-disc space-y-1 pl-4 text-zinc-400' },
                H('li', null, H('strong', { class: 'text-emerald-400' }, 'Secular Equilibrium'), ' (T½ parent >> 100× T½ daughter): The daughter activity rises until it precisely equals the parent activity (A_d / A_p → 1.0).'),
                H('li', null, H('strong', { class: 'text-amber-400' }, 'Transient Equilibrium'), ' (T½ parent > T½ daughter): The daughter activity reaches a peak at t_max = ln(λ₂/λ₁) / (λ₂ - λ₁), then settles at an elevated constant ratio A_d / A_p → λ_d / (λ_d - λ_p).'),
              ),
            )
          : null,

        // Configuration & Controls
        H(
          'div',
          { class: 'grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#0b101c] p-3 md:grid-cols-4' },
          // Initial Amount
          H(
            'div',
            { class: 'space-y-1' },
            H('label', { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-500' }, 'Initial Parent Amount'),
            H(
              'div',
              { class: 'flex gap-1.5' },
              H('input', {
                type: 'number',
                min: '0.00001',
                step: 'any',
                value: state.amount,
                class: 'w-full rounded-md border border-white/10 bg-[#121a2c] px-2.5 py-1 font-mono text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none',
                onInput: (e: any) => { state.amount = Math.max(0, parseFloat(e.target.value) || 0) },
              }),
              H(
                'select',
                {
                  value: state.unit,
                  class: 'rounded-md border border-white/10 bg-[#121a2c] px-2 py-1 font-mono text-xs text-zinc-300 focus:border-amber-400/50 focus:outline-none',
                  onChange: (e: any) => { state.unit = e.target.value as AmountUnit },
                },
                ...UNITS.map((u) => H('option', { key: u.key, value: u.key, selected: state.unit === u.key }, u.label)),
              ),
            ),
            H('div', { class: 'text-[9.5px] font-mono text-zinc-500' }, `N₀ = ${formatAtomCount(n0)} atoms`),
          ),

          // Metric Mode
          H(
            'div',
            { class: 'space-y-1' },
            H('label', { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-500' }, 'Plot Metric'),
            H(
              'div',
              { class: 'flex rounded-md border border-white/10 p-0.5 bg-[#121a2c]' },
              ...([
                ['activity', 'Activity (Bq)'],
                ['atoms', 'Atoms (N)'],
                ['mass', 'Mass (g)'],
              ] as [PlotMetric, string][]).map(([m, label]) =>
                H(
                  'button',
                  {
                    key: m,
                    type: 'button',
                    onClick: () => { state.metric = m },
                    class: `flex-1 rounded py-1 text-[10.5px] font-medium transition cursor-pointer ${
                      state.metric === m ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                    }`,
                  },
                  label,
                ),
              ),
            ),
          ),

          // Y-Axis Scale
          H(
            'div',
            { class: 'space-y-1' },
            H('label', { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-500' }, 'Y-Axis Scale'),
            H(
              'div',
              { class: 'flex rounded-md border border-white/10 p-0.5 bg-[#121a2c]' },
              ...([
                ['log', 'Logarithmic'],
                ['linear', 'Linear'],
              ] as [MetricScale, string][]).map(([s, label]) =>
                H(
                  'button',
                  {
                    key: s,
                    type: 'button',
                    onClick: () => { state.yScale = s },
                    class: `flex-1 rounded py-1 text-[10.5px] font-medium transition cursor-pointer ${
                      state.yScale === s ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                    }`,
                  },
                  label,
                ),
              ),
            ),
          ),

          // X-Axis Scale
          H(
            'div',
            { class: 'space-y-1' },
            H('label', { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-500' }, 'Time (X-Axis) Scale'),
            H(
              'div',
              { class: 'flex rounded-md border border-white/10 p-0.5 bg-[#121a2c]' },
              ...([
                ['log', 'Log Time'],
                ['linear', 'Linear Time'],
              ] as [TimeScale, string][]).map(([s, label]) =>
                H(
                  'button',
                  {
                    key: s,
                    type: 'button',
                    onClick: () => { state.xScale = s },
                    class: `flex-1 rounded py-1 text-[10.5px] font-medium transition cursor-pointer ${
                      state.xScale === s ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                    }`,
                  },
                  label,
                ),
              ),
            ),
          ),
        ),

        // SVG Multi-Line Decay Curve Chart
        H(
          'div',
          { class: 'relative rounded-xl border border-white/10 bg-[#070b13] p-3 shadow-inner' },
          H(
            'div',
            { class: 'mb-2 flex flex-wrap items-center justify-between gap-2 px-1' },
            H(
              'div',
              { class: 'flex items-center gap-3' },
              H('span', { class: 'font-mono text-[11px] font-bold text-zinc-300' }, `${state.metric.toUpperCase()} vs TIME`),
              H('span', { class: 'font-mono text-[10px] text-zinc-500' }, `${chain.length} isotope series (${chain[0].name} → ${chain[chain.length - 1].name})`),
            ),
            H(
              'div',
              { class: 'font-mono text-[11px] text-amber-300' },
              'Inspection Time: ',
              H('span', { class: 'font-bold' }, formatDuration(displayTime)),
              H('span', { class: 'ml-1 text-[10px] text-zinc-500' }, `(${displayTime.toExponential(2)} s)`),
            ),
          ),

          // Chart SVG
          H(
            'svg',
            {
              viewBox: `0 0 ${CHART_W} ${CHART_H}`,
              class: 'w-full cursor-crosshair select-none',
              onMouseMove: handleSvgMouseMove,
              onMouseLeave: () => { state.hoverTime = null },
              onClick: handleSvgClick,
            },
            H(
              'defs',
              null,
              H(
                'clipPath',
                { id: 'bateman-chart-clip' },
                H('rect', { x: PAD.left, y: PAD.top, width: plotW, height: plotH }),
              ),
            ),
            // Background
            H('rect', {
              x: PAD.left,
              y: PAD.top,
              width: plotW,
              height: plotH,
              fill: '#0a0f1c',
              stroke: '#ffffff12',
              strokeWidth: '1',
            }),
            // Horizontal grid & Y-ticks
            ...yTicks.map((t, idx) =>
              H(
                'g',
                { key: `y-${idx}` },
                H('line', {
                  x1: PAD.left,
                  x2: PAD.left + plotW,
                  y1: t.y,
                  y2: t.y,
                  stroke: '#ffffff0a',
                  strokeDasharray: '3 3',
                }),
                H('text', {
                  x: PAD.left - 8,
                  y: t.y + 3.5,
                  textAnchor: 'end',
                  class: 'font-mono text-[8.5px] fill-zinc-500',
                }, t.label),
              ),
            ),
            // Vertical grid & X-ticks
            ...xTicks.map((t, idx) =>
              H(
                'g',
                { key: `x-${idx}` },
                H('line', {
                  x1: t.x,
                  x2: t.x,
                  y1: PAD.top,
                  y2: PAD.top + plotH,
                  stroke: '#ffffff0a',
                  strokeDasharray: '3 3',
                }),
                H('text', {
                  x: t.x,
                  y: PAD.top + plotH + 16,
                  textAnchor: 'middle',
                  class: 'font-mono text-[8.5px] fill-zinc-500',
                }, t.label),
              ),
            ),
            // Curves clipped
            H(
              'g',
              { clipPath: 'url(#bateman-chart-clip)' },
              ...memberPaths.map(({ member, d }) =>
                H('path', {
                  key: member.name,
                  d,
                  fill: 'none',
                  stroke: member.color,
                  strokeWidth: member.isStable ? '1.5' : '2',
                  strokeDasharray: member.isStable ? '4 2' : 'none',
                  opacity: member.isStable ? 0.75 : 0.95,
                }),
              ),
              // Current time cursor
              H('line', {
                x1: getX(state.currentTime),
                x2: getX(state.currentTime),
                y1: PAD.top,
                y2: PAD.top + plotH,
                stroke: '#fbbf24',
                strokeWidth: '1.5',
                opacity: 0.85,
              }),
              // Hover time cursor
              state.hoverTime != null
                ? H('line', {
                    x1: getX(state.hoverTime),
                    x2: getX(state.hoverTime),
                    y1: PAD.top,
                    y2: PAD.top + plotH,
                    stroke: '#38bdf8',
                    strokeWidth: '1',
                    strokeDasharray: '2 2',
                    opacity: 0.8,
                  })
                : null,
            ),
            // Peak indicator if transient
            equilibrium.tMaxSec != null
              ? H(
                  'g',
                  null,
                  H('line', {
                    x1: getX(equilibrium.tMaxSec),
                    x2: getX(equilibrium.tMaxSec),
                    y1: PAD.top,
                    y2: PAD.top + plotH,
                    stroke: '#f59e0b',
                    strokeWidth: '1',
                    strokeDasharray: '2 4',
                    opacity: 0.4,
                  }),
                  H('text', {
                    x: getX(equilibrium.tMaxSec),
                    y: PAD.top + 10,
                    textAnchor: 'middle',
                    class: 'font-mono text-[8px] fill-amber-400/80 font-bold',
                  }, 't_max'),
                )
              : null,
          ),

          // Playback & Scrubber Controls
          H(
            'div',
            { class: 'mt-3 space-y-2 border-t border-white/5 pt-3' },
            H(
              'div',
              { class: 'flex items-center gap-3' },
              // Play/Pause button
              H(
                'button',
                {
                  type: 'button',
                  onClick: togglePlay,
                  class: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/50 bg-amber-400/15 text-amber-300 transition hover:bg-amber-400/25 cursor-pointer',
                  title: state.isPlaying ? 'Pause' : 'Play timeline',
                },
                state.isPlaying
                  ? H('svg', { viewBox: '0 0 24 24', fill: 'currentColor', class: 'h-4 w-4' },
                      H('rect', { x: '6', y: '4', width: '4', height: '16', rx: '1' }),
                      H('rect', { x: '14', y: '4', width: '4', height: '16', rx: '1' }),
                    )
                  : H('svg', { viewBox: '0 0 24 24', fill: 'currentColor', class: 'h-4 w-4' },
                      H('polygon', { points: '5 3 19 12 5 21 5 3' }),
                    ),
              ),
              // Reset to t=0
              H(
                'button',
                {
                  type: 'button',
                  onClick: () => {
                    stopAnim()
                    state.isPlaying = false
                    state.currentTime = 0
                  },
                  class: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200 cursor-pointer',
                  title: 'Reset to t = 0',
                },
                H('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', class: 'h-4 w-4' },
                  H('path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }),
                  H('path', { d: 'M3 3v5h5' }),
                ),
              ),
              // Scrubber slider
              H(
                'div',
                { class: 'relative flex-1' },
                H('input', {
                  type: 'range',
                  min: '0',
                  max: '1000',
                  step: '1',
                  'aria-label': 'Time timeline scrubber',
                  value:
                    state.xScale === 'log'
                      ? Math.round(
                          ((Math.log10(Math.max(timeBounds.tMin, state.currentTime || 1e-6)) -
                            Math.log10(timeBounds.tMin)) /
                            (Math.log10(timeBounds.tEnd) - Math.log10(timeBounds.tMin))) *
                            1000,
                        )
                      : Math.round((state.currentTime / timeBounds.tEnd) * 1000),
                  onInput: (e: any) => {
                    const frac = Number(e.target.value) / 1000
                    const t =
                      state.xScale === 'log'
                        ? Math.pow(10, Math.log10(minT) + frac * (Math.log10(maxT) - Math.log10(minT)))
                        : minT + frac * (maxT - minT)
                    state.currentTime = t
                  },
                  class: 'w-full accent-amber-400 cursor-pointer',
                }),
              ),
              // Playback speed
              H(
                'div',
                { class: 'flex items-center gap-1 rounded-md border border-white/10 bg-[#0c1220] p-0.5' },
                ...[0.2, 1, 5, 20].map((spd) =>
                  H(
                    'button',
                    {
                      key: spd,
                      type: 'button',
                      onClick: () => { state.playbackSpeed = spd },
                      class: `rounded px-1.5 py-0.5 font-mono text-[9.5px] transition cursor-pointer ${
                        state.playbackSpeed === spd
                          ? 'bg-amber-400/20 text-amber-300 font-bold'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`,
                    },
                    `${spd}×`,
                  ),
                ),
              ),
            ),
          ),
        ),

        // Live Isotope Breakdown Table
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f1c] overflow-hidden' },
          H(
            'div',
            { class: 'flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-[#0d1424]' },
            H(
              'div',
              { class: 'flex items-center gap-2' },
              H('span', { class: 'text-[11px] font-bold tracking-wider text-zinc-200 uppercase' }, `Isotopic Inventory at t = ${formatDuration(displayTime)}`),
              H('span', { class: 'text-[10px] text-zinc-500' }, `(Total Activity: ${formatActivityBq(displaySnapshot.totalActivityBq)})`),
            ),
            H(
              'div',
              { class: 'flex items-center gap-3 font-mono text-[10px] text-zinc-400' },
              H('span', null, `Alphas: ${displaySnapshot.totalAlphaEmitted.toExponential(2)}`),
              H('span', null, `Betas: ${displaySnapshot.totalBetaEmitted.toExponential(2)}`),
            ),
          ),
          H(
            'div',
            { class: 'overflow-x-auto' },
            H(
              'table',
              { class: 'w-full text-left font-mono text-[11px]' },
              H(
                'thead',
                { class: 'border-b border-white/5 bg-white/[0.02] text-[9px] uppercase tracking-wider text-zinc-500' },
                H(
                  'tr',
                  null,
                  H('th', { class: 'px-3 py-2' }, 'Nuclide'),
                  H('th', { class: 'px-3 py-2' }, 'Half-Life'),
                  H('th', { class: 'px-3 py-2' }, 'Mode'),
                  H('th', { class: 'px-3 py-2 text-right' }, 'Activity (Bq)'),
                  H('th', { class: 'px-3 py-2 text-right' }, 'Activity (Ci)'),
                  H('th', { class: 'px-3 py-2 text-right' }, 'Mass (g)'),
                  H('th', { class: 'px-3 py-2 text-right' }, 'Atoms (N)'),
                  H('th', { class: 'px-3 py-2 text-right' }, 'A / A_parent'),
                ),
              ),
              H(
                'tbody',
                { class: 'divide-y divide-white/5' },
                ...displaySnapshot.members.map((m, idx) =>
                  H(
                    'tr',
                    { key: m.member.name, class: 'transition hover:bg-white/[0.03]' },
                    H(
                      'td',
                      { class: 'px-3 py-2 flex items-center gap-2' },
                      H('span', { class: 'h-2 w-2 rounded-full shrink-0', style: `background: ${m.member.color}` }),
                      H(
                        'button',
                        {
                          type: 'button',
                          onClick: () => onSelectNuclide?.(m.member.nuclide),
                          class: 'font-bold text-zinc-100 hover:text-amber-300 hover:underline cursor-pointer',
                          title: 'View nuclide on Segrè Chart',
                        },
                        m.member.name,
                      ),
                      idx === 0
                        ? H('span', { class: 'rounded bg-white/10 px-1 py-0.2 text-[8.5px] text-zinc-400' }, 'parent')
                        : null,
                      m.member.isStable
                        ? H('span', { class: 'rounded bg-emerald-500/10 px-1 py-0.2 text-[8.5px] text-emerald-400' }, 'stable')
                        : null,
                    ),
                    H('td', { class: 'px-3 py-2 text-zinc-400' }, m.member.halfLifeSec ? formatDuration(m.member.halfLifeSec) : 'Stable'),
                    H('td', { class: 'px-3 py-2 text-zinc-500' }, m.member.decayMode || '—'),
                    H('td', { class: 'px-3 py-2 text-right font-semibold text-zinc-200' }, m.member.isStable ? '0 Bq' : formatActivityBq(m.activityBq)),
                    H(
                      'td',
                      { class: 'px-3 py-2 text-right text-zinc-400' },
                      m.member.isStable
                        ? '0 Ci'
                        : m.activityCi >= 1
                          ? `${m.activityCi.toFixed(2)} Ci`
                          : m.activityCi >= 1e-3
                            ? `${(m.activityCi * 1e3).toFixed(2)} mCi`
                            : `${(m.activityCi * 1e6).toFixed(2)} µCi`,
                    ),
                    H('td', { class: 'px-3 py-2 text-right text-zinc-300' }, formatMassGrams(m.massGrams)),
                    H('td', { class: 'px-3 py-2 text-right text-zinc-400' }, formatAtomCount(m.atoms)),
                    H(
                      'td',
                      { class: 'px-3 py-2 text-right' },
                      idx === 0
                        ? H('span', { class: 'text-zinc-500' }, '1.000')
                        : m.member.isStable
                          ? H('span', { class: 'text-zinc-600' }, '—')
                          : H(
                              'span',
                              {
                                class:
                                  Math.abs(m.activityRatioToParent - 1) < 0.05
                                    ? 'text-emerald-400 font-semibold'
                                    : 'text-zinc-400',
                              },
                              m.activityRatioToParent.toFixed(3),
                            ),
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
