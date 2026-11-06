/**
 * ELEMENTA — 1D Quantum Wave Laboratory
 * Stationary states (Sturm-bisection eigen solver), harmonic oscillator and
 * square wells, Heisenberg uncertainty, and Crank–Nicolson wave-packet
 * evolution with tunnelling through a rectangular barrier.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import '@/components/quantumwave/quantumwave-element'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'
import {
  barrierTransmission,
  buildGrid,
  eigenvalues,
  eigenvector,
  eigenResidual,
  countNodes,
  evScale,
  hoAnalyticEnergy,
  isStateBound,
  makePacket,
  observables,
  wellAnalyticEnergy,
  HBAR2_2M_EV_A2,
  type Grid,
  type SystemKey,
} from '@/lib/quantum'

function Htag(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

function StatCard({ label, value, tint }: { label: string; value: string; tint?: string }): VNode {
  return Htag(
    'div',
    { class: 'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2' },
    Htag('div', { class: 'text-[9px] uppercase tracking-wider text-zinc-500' }, label),
    Htag(
      'div',
      { class: 'mt-0.5 font-mono text-[13px] font-semibold', style: { color: tint ?? '#e4e4e7' } },
      value,
    ),
  )
}

function slider(
  label: string,
  min: number,
  max: number,
  step: number,
  get: () => number,
  set: (v: number) => void,
  format?: (v: number) => string,
  unit = '',
): VNode {
  return Htag(
    'div',
    { class: 'space-y-1' },
    Htag('div', { class: 'flex justify-between text-[9.5px] font-medium text-zinc-400' }, label),
    Htag('input', {
      type: 'range', min: String(min), max: String(max), step: String(step),
      value: String(get()),
      oninput: (e: Event) => { set(parseFloat((e.target as HTMLInputElement).value)); syncUrl() },
      class: 'w-full accent-fuchsia-400',
    }),
    Htag(
      'div',
      { class: 'text-[10px] font-mono text-zinc-200' },
      format ? `${format(get())} ${unit}` : `${get().toFixed(3)} ${unit}`,
    ),
  )
}

function toggle(label: string, active: boolean, onclick: () => void): VNode {
  return Htag(
    'button',
    {
      type: 'button',
      onclick,
      class: `rounded-md border px-2.5 py-1 text-[11px] transition ${
        active
          ? 'border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-300'
          : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-200'
      }`,
    },
    label,
  )
}

function SectionTitle(text: string): VNode {
  return Htag(
    'h2',
    { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
    text,
  )
}

const SYSTEMS: { key: SystemKey; label: string }[] = [
  { key: 'well', label: '∞ well' },
  { key: 'finite', label: 'finite well' },
  { key: 'ho', label: 'oscillator' },
  { key: 'barrier', label: 'barrier' },
]

function getInitialParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const k of ['system', 'mode', 'n', 'width', 'depth', 'bw', 'kappa', 'sigma', 'energy', 'speed', 'L', 'animate', 'view', 'fx']) {
    const v = params.get(k)
    if (v != null) out[k] = v
  }
  return out
}

const initial = getInitialParams()
const num = (o: Record<string, string>, k: string, d: number): number => {
  const v = Number(o[k])
  return o[k] != null && Number.isFinite(v) ? v : d
}

const state = reactive({
  system: (['well', 'finite', 'ho', 'barrier'].includes(initial.system ?? '') ? initial.system : 'well') as SystemKey,
  mode: (initial.mode === 'packet' ? 'packet' : 'eigen') as 'eigen' | 'packet',
  view: (['split', '3d', '2d'].includes(initial.view ?? '') ? initial.view : 'split') as 'split' | '3d' | '2d',
  n: Math.min(10, Math.max(1, Math.round(num(initial, 'n', 1)))),
  width: num(initial, 'width', 10),
  depth: num(initial, 'depth', 2),
  barrierWidth: num(initial, 'bw', 2),
  kappa: num(initial, 'kappa', 0.6),
  sigma: num(initial, 'sigma', 1.6),
  packetE: num(initial, 'energy', 1),
  speed: num(initial, 'speed', 1),
  lengthNm: num(initial, 'L', 1),
  animate: initial.animate !== 'false' && initial.animate !== '0',
  fx: initial.fx === 'on',
  seed: 0,
})

let lastUrl = ''
function syncUrl(): void {
  if (typeof window === 'undefined') return
  const next = new URLSearchParams()
  next.set('system', state.system)
  next.set('mode', state.mode)
  next.set('view', state.view)
  next.set('n', String(state.n))
  next.set('width', String(state.width))
  next.set('depth', String(state.depth))
  next.set('bw', String(state.barrierWidth))
  next.set('kappa', String(state.kappa))
  next.set('sigma', String(state.sigma))
  next.set('energy', String(state.packetE))
  next.set('speed', String(state.speed))
  next.set('L', String(state.lengthNm))
  next.set('animate', String(state.animate))
  next.set('fx', state.fx ? 'on' : 'off')
  const url = `${window.location.pathname}?${next}`
  if (url !== lastUrl) {
    lastUrl = url
    window.history.replaceState(null, '', url)
  }
}

function setSystem(key: SystemKey): void {
  state.system = key
  state.n = Math.min(state.n, 10)
  state.seed++
  syncUrl()
}

function setMode(mode: 'eigen' | 'packet'): void {
  state.mode = mode
  state.seed++
  syncUrl()
}

function resetPacket(): void {
  state.seed++
  syncUrl()
}

/** Solve the current system once (page-side readouts mirror the element). */
function solvePage(): { energies: number[]; bound: boolean[]; boxHalf: number; grid: Grid } {
  const grid = buildGrid(
    {
      system: state.system,
      boxHalf: state.system === 'well' ? state.width / 2 : 22,
      width: state.width,
      depth: state.depth,
      barrierWidth: state.barrierWidth,
      kappa: state.kappa,
    },
    512,
  )
  const energies = eigenvalues(grid, 10)
  const bound = energies.map((e) => isStateBound(e, grid, state.system))
  return { energies, bound, boxHalf: grid.boxHalf, grid }
}

const fmt = (v: number, d = 3): string => v.toFixed(d)

export default function QuantumWavePage(): VNode {
  const { energies, bound, boxHalf, grid } = solvePage()
  const scaleEV = evScale(state.lengthNm)
  const isBarrier = state.system === 'barrier'
  const mode = state.mode

  // ---- eigenstate observables (page-side, mirrors element overlay) ----
  let psiStats: { e: number; isBound: boolean; res: number; nodes: number; meanX: number; dx: number; meanP: number; dp: number; prod: number } | null = null
  if (mode === 'eigen') {
    const idx = Math.min(10, state.n) - 1
    const e = energies[idx]
    if (Number.isFinite(e)) {
      const psi = eigenvector(grid, e)
      const obs = observables(psi, new Float64Array(512), grid.x, grid.v, grid.h)
      psiStats = {
        e,
        isBound: bound[idx],
        res: eigenResidual(grid, e, psi),
        nodes: countNodes(psi),
        meanX: obs.meanX,
        dx: obs.dx,
        meanP: obs.meanP,
        dp: obs.dp,
        prod: obs.dxTimesDp / 0.5,
      }
    }
  }

  // ---- packet parameters ----
  const k0 = Math.sqrt(Math.max(1e-4, state.packetE - 1 / (4 * state.sigma * state.sigma)))
  const packetE0 =
    mode === 'packet'
      ? makePacket(
          buildGrid(
            {
              system: isBarrier ? 'barrier' : state.system,
              boxHalf: state.system === 'well' && !isBarrier ? state.width / 2 : 22,
              width: state.width,
              depth: state.depth,
              barrierWidth: state.barrierWidth,
              kappa: state.kappa,
            },
            512,
          ),
          // same launch position as the element: outside the barrier / left of center
          -0.62 * (state.system === 'well' && !isBarrier ? state.width / 2 : 22),
          state.sigma,
          k0,
        ).initialEnergy
      : 0
  const tAnalytic = isBarrier
    ? barrierTransmission(packetE0, state.depth, state.barrierWidth)
    : null
  const sigmaKEV = state.kappa * scaleEV * Math.SQRT2 // ħω (rendered by the overlay too)

  // element attribute payload
  const attrs: Record<string, string> = {
    'data-system': state.system,
    'data-mode': mode,
    'data-n': String(state.n),
    'data-width': String(state.width),
    'data-depth': String(state.depth),
    'data-barrier-width': String(state.barrierWidth),
    'data-kappa': String(state.kappa),
    'data-speed': String(state.speed),
    'data-sigma': String(state.sigma),
    'data-energy': String(state.packetE),
    'data-length': String(state.lengthNm),
    'data-anim': state.animate ? 'true' : 'false',
    'data-reset': String(state.seed),
    'data-view': state.view,
    'data-fx': state.fx ? 'on' : 'off',
  }

  return Htag(
    'div',
    { class: 'flex min-h-dvh flex-col bg-[#070a10] text-zinc-200' },
    // Header
    Htag(
      'header',
      {
        class:
          'sticky top-0 z-30 flex h-14 shrink-0 flex-wrap items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur',
      },
      Htag(
        'a',
        {
          href: './index.html',
          class:
            'rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
        },
        '← Periodic table',
      ),
      Htag(
        'div',
        { class: 'flex items-center gap-2' },
        ElementaLogo({ size: 26 }),
        Htag(
          'h1',
          { class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100' },
          Htag('span', { class: 'text-fuchsia-400' }, 'QUANTUM WAVE'),
          ' LAB',
        ),
      ),
      Htag(
        'span',
        { class: 'hidden font-mono text-[10px] text-zinc-500 lg:inline' },
        'Schrödinger solver · stationary states · Heisenberg uncertainty · wave-packet tunnelling',
      ),
      GitHubLink(),
    ),

    // Main grid
    Htag(
      'main',
      {
        class:
          'mx-auto grid w-full max-w-[1700px] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:p-6',
      },
      // Left: visualization
      Htag(
        'div',
        { class: 'flex min-h-[560px] flex-col h-[min(78dvh,820px)]' },
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-2 flex-1 relative' },
          Htag('elementa-quantumwave', {
            ...attrs,
            onviewchange: (e: CustomEvent) => {
              state.view = e.detail.view
              syncUrl()
            },
            style: 'width: 100%; height: 100%; display: block;',
          }),
          Htag(
            'div',
            {
              class:
                'pointer-events-none absolute bottom-2 right-2 flex flex-wrap items-center gap-2 font-mono text-[9.5px] text-zinc-500',
            },
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-cyan-400' }),
              'Re ψ > 0'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-pink-400' }),
              'Re ψ < 0'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-amber-400' }),
              '|ψ|² (Position) / V(x)'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-purple-400' }),
              '|ϕ|² (Momentum FFT)'),
          ),
        ),
        Htag(
          'div',
          { class: 'mt-2 flex flex-wrap items-center gap-2' },
          toggle('Animate', state.animate, () => { state.animate = !state.animate; syncUrl() }),
          toggle('Eigenstates', mode === 'eigen', () => setMode('eigen')),
          toggle('Packet', mode === 'packet', () => setMode('packet')),
          toggle('✨ Glow FX', state.fx, () => { state.fx = !state.fx; syncUrl() }),
          Htag('div', { class: 'h-4 w-[1px] bg-white/10 mx-1' }),
          toggle('◨ Split', state.view === 'split', () => { state.view = 'split'; syncUrl() }),
          toggle('🌊 3D Waterfall', state.view === '3d', () => { state.view = '3d'; syncUrl() }),
          toggle('📊 2D Plot', state.view === '2d', () => { state.view = '2d'; syncUrl() }),
          Htag(
            'button',
            {
              type: 'button',
              onclick: () => resetPacket(),
              class: 'rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
            },
            '⟲ Re-launch packet',
          ),
          Htag(
            'span',
            { class: 'font-mono text-[10px] text-zinc-600' },
            state.view !== '2d'
              ? '🖱️ Drag to orbit · Scroll to zoom'
              : mode === 'packet' && isBarrier
                ? `V₀ = ${fmt(state.depth * scaleEV, 2)} eV · tunnel probability settles on the canvas`
                : mode === 'eigen'
                  ? `State n = ${state.n} · E = ${fmt((energies[state.n - 1] ?? 0) * scaleEV, 3)} eV`
                  : `ħω = ${sigmaKEV.toFixed(2)} eV · E₀ = ${fmt(packetE0 * scaleEV, 2)} eV`,
          ),
        ),
      ),

      // Right: controls & physics
      Htag(
        'div',
        { class: 'space-y-3' },
        // System
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Potential'),
          Htag(
            'div',
            { class: 'mb-3 flex flex-wrap gap-1.5' },
            SYSTEMS.map((s) =>
              toggle(s.label, state.system === s.key, () => setSystem(s.key)),
            ),
          ),
          Htag('div', { class: 'space-y-2.5' },
            !isBarrier && state.system !== 'ho'
              ? slider('Width W', 3, 24, 0.5, () => state.width, (v) => { state.width = v })
              : Htag('span'),
            !isBarrier && state.system === 'finite' || isBarrier
              ? slider(isBarrier ? 'Barrier height V₀' : 'Well depth V₀', 0.3, 12, 0.1, () => state.depth, (v) => { state.depth = v })
              : Htag('span'),
            !isBarrier && state.system === 'finite' || isBarrier
              ? slider(isBarrier ? 'Barrier width W' : 'Well width W', 0.4, 8, 0.1, () => state.barrierWidth, (v) => { state.barrierWidth = v })
              : Htag('span'),
            !isBarrier && state.system === 'ho'
              ? slider('Curvature κ of ½κ²x²', 0.2, 1.4, 0.01, () => state.kappa, (v) => { state.kappa = v })
              : Htag('span'),
            slider('Length scale L', 0.2, 2.5, 0.05, () => state.lengthNm, (v) => { state.lengthNm = v }, (v) => v.toFixed(2), 'nm'),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[10px] leading-relaxed text-zinc-500' },
            isBarrier
              ? mode === 'eigen'
                ? 'Energies are stationary eigenvalues of the central barrier in the computational box (Sturm bisection). For E < V₀, states tunnel through the barrier forming doublet pairs.'
                : 'A barrier scatters incident wave packets — watch the wave split into reflected and transmitted pulses: the transmitted pulse tunnels through the classically forbidden barrier (E₀ < V₀).'
              : mode === 'eigen'
                ? 'Energies are eigenvalues of H = p²/2mₑ + V on a 512-point grid (Sturm bisection); ψ comes from one inverse-iteration pass.'
                : 'The packet evolves under the unitary Crank–Nicolson scheme — norm and ⟨E⟩ are conserved to numerical precision.',
          ),
        ),

        // Spectrum or packet-energy controls
        mode === 'eigen'
          ? Htag(
            'div',
            { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
            SectionTitle('Spectrum (E₁ … E₁₀)'),
            Htag(
              'div',
              { class: 'space-y-1' },
              energies
                .map((e, i) => ({ e, i, isB: bound[i] }))
                .filter(({ e }) => Number.isFinite(e))
                .map(({ e, i, isB }) =>
                  Htag(
                    'button',
                    {
                      type: 'button',
                      onclick: () => { state.n = i + 1; syncUrl() },
                      class: `flex w-full items-center justify-between rounded-md border px-2.5 py-1 text-left font-mono text-[11px] transition ${
                        state.n === i + 1
                          ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                          : 'border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                      }`,
                    },
                    Htag(
                      'span',
                      { class: 'flex items-center gap-2' },
                      `n = ${i + 1}${i + 1 === state.n ? '  ◂ shown' : ''}`,
                      state.system === 'finite' || state.system === 'barrier'
                        ? Htag(
                            'span',
                            {
                              class: `rounded px-1.5 py-0.2 text-[9px] font-sans font-medium uppercase tracking-wider ${
                                isB
                                  ? 'border border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                                  : 'border border-amber-400/40 bg-amber-400/10 text-amber-300'
                              }`,
                            },
                            isB ? (state.system === 'barrier' ? 'Tunnel' : 'Bound') : 'Continuum',
                          )
                        : Htag('span'),
                    ),
                    Htag('span', null, `${fmt(e, 4)} nat · ${fmt(e * scaleEV, 3)} eV`),
                  ),
                ),
            ),
          )
          : isBarrier
            ? Htag(
              'div',
              { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
              SectionTitle('Scattering parameters'),
              Htag('div', { class: 'space-y-2.5' },
                slider('Packet energy E₀', 0.05, 6, 0.05, () => state.packetE, (v) => { state.packetE = v }),
                slider('Initial width σ₀', 0.4, 3, 0.05, () => state.sigma, (v) => { state.sigma = v }),
                slider('Evolution speed', 0, 4, 0.1, () => state.speed, (v) => { state.speed = v }),
              ),
              Htag(
                'div',
                { class: 'mt-2 grid grid-cols-3 gap-2' },
                StatCard({ label: 'E₀', value: `${fmt(packetE0, 3)} nat`, tint: '#67e8f9' }),
                StatCard({ label: 'E₀', value: `${fmt(packetE0 * scaleEV, 2)} eV`, tint: '#fbbf24' }),
                StatCard({ label: 'E₀ / V₀', value: fmt(packetE0 / state.depth, 3), tint: '#e4e4e7' }),
              ),
              Htag(
                'div',
                { class: 'mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10.5px] leading-relaxed text-zinc-400' },
                Htag('div', { class: 'font-mono text-[12px] text-fuchsia-300' },
                  `T(E₀) = ${fmt(tAnalytic ?? 0, 4)}`),
                'exact transmission through the rectangular barrier. A Gaussian packet averages T(E) over its energy spread (Δp = ħ/2σ₀), so the live transmitted fraction on the canvas sits near, not exactly at, T(E₀).',
              ),
            )
            : Htag(
              'div',
              { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
              SectionTitle('Wave packet parameters'),
              Htag('div', { class: 'space-y-2.5' },
                slider('Packet energy E₀', 0.05, 6, 0.05, () => state.packetE, (v) => { state.packetE = v }),
                slider('Initial width σ₀', 0.4, 3, 0.05, () => state.sigma, (v) => { state.sigma = v }),
                slider('Evolution speed', 0, 4, 0.1, () => state.speed, (v) => { state.speed = v }),
              ),
              Htag(
                'div',
                { class: 'mt-2 grid grid-cols-3 gap-2' },
                StatCard({ label: '⟨E⟩', value: `${fmt(packetE0, 3)} nat`, tint: '#67e8f9' }),
                StatCard({ label: 'k₀', value: fmt(k0, 3), tint: '#e4e4e7' }),
                StatCard({ label: '⟨E⟩', value: `${fmt(packetE0 * scaleEV, 2)} eV`, tint: '#fbbf24' }),
              ),
            ),

        // Eigenstate physics
        psiStats
          ? Htag(
            'div',
            { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
            SectionTitle(`Stationary state ψ${state.n}`),
            Htag(
              'div',
              { class: 'grid grid-cols-3 gap-2' },
              StatCard({ label: 'E (natural)', value: fmt(psiStats.e, 4), tint: '#67e8f9' }),
              StatCard({ label: 'E', value: `${fmt(psiStats.e * scaleEV, 3)} eV`, tint: '#fbbf24' }),
              StatCard({ label: 'nodes', value: String(psiStats.nodes), tint: '#e4e4e7' }),
              StatCard({ label: '⟨x⟩', value: `${psiStats.meanX >= 0 ? '+' : ''}${fmt(psiStats.meanX, 3)}`, tint: '#e4e4e7' }),
              StatCard({ label: 'Δx', value: fmt(psiStats.dx, 3), tint: '#22d3ee' }),
              StatCard({ label: 'Δp', value: fmt(psiStats.dp, 3), tint: '#f472b6' }),
              StatCard({ label: 'residual ||Hψ−Eψ||₂', value: psiStats.res.toExponential(2), tint: '#a78bfa' }),
              StatCard({ label: state.system === 'barrier' ? 'tunnel state' : 'bound state', value: psiStats.isBound ? (state.system === 'barrier' ? 'Yes (Tunnel)' : 'Yes') : 'No (Continuum)', tint: psiStats.isBound ? '#34d399' : '#fbbf24' }),
              StatCard({ label: 'Δx·Δp / (ħ/2)', value: fmt(psiStats.prod, 3), tint: '#38bdf8' }),
            ),
            state.system === 'finite' && !psiStats.isBound
              ? Htag(
                'div',
                { class: 'mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10.5px] leading-relaxed text-amber-200' },
                Htag('div', { class: 'font-semibold text-amber-300' }, '⚠️ Box-Discretized Continuum State (E > V₀)'),
                `Energy ${fmt(psiStats.e, 4)} nat exceeds the well depth V₀ = ${fmt(state.depth, 4)} nat. This state is not physically bound within the finite well; it is a continuum wave discretized by the ±22 box Dirichlet boundaries.`,
              )
              : state.system === 'barrier'
                ? Htag(
                  'div',
                  { class: `mt-2 rounded-lg border px-3 py-2 text-[10.5px] leading-relaxed ${psiStats.isBound ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}` },
                  Htag('div', { class: `font-semibold ${psiStats.isBound ? 'text-cyan-300' : 'text-amber-300'}` }, psiStats.isBound ? '🚇 Barrier Tunnel State (E < V₀)' : '🌊 Over-Barrier Continuum State (E ≥ V₀)'),
                  psiStats.isBound
                    ? `Energy ${fmt(psiStats.e, 4)} nat is below barrier top V₀ = ${fmt(state.depth, 4)} nat. The wavefunction decays exponentially inside the barrier and forms a tunnel doublet pair with its neighboring parity state.`
                    : `Energy ${fmt(psiStats.e, 4)} nat exceeds the barrier top V₀ = ${fmt(state.depth, 4)} nat. The particle propagates over the barrier with altered local wavelength.`,
                )
                : Htag('span'),
            (() => {
              const analytic =
                state.system === 'well'
                  ? wellAnalyticEnergy(state.n, state.width)
                  : state.system === 'ho'
                    ? hoAnalyticEnergy(state.n, state.kappa)
                    : null
              return Htag('div', { class: 'mt-2' },
                analytic != null
                  ? Htag(
                    'div',
                    { class: 'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10.5px] leading-relaxed text-zinc-400' },
                    Htag('div', { class: 'font-mono text-[12px] text-fuchsia-300' },
                      state.system === 'well'
                        ? `E${state.n} = n²π²/W² = ${fmt(analytic, 4)} nat`
                        : `E${state.n} = (n−½)ħω = (n−½)κ√2 = ${fmt(analytic, 4)} nat`),
                    `numerical ${fmt(psiStats.e, 4)} — deviation ${(Math.abs((psiStats.e - analytic) / analytic) * 100).toFixed(3)}% (finite difference discretisation).`,
                  )
                  : Htag(
                    'div',
                    { class: 'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10.5px] leading-relaxed text-zinc-400' },
                    'The finite well has no closed-form spectrum; these eigenvalues come from LDLᵀ (Sturm) bisection to ~1e-12 precision.',
                  ),
                Htag(
                  'div',
                  { class: 'mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10.5px] leading-relaxed text-zinc-400' },
                  Htag('div', { class: 'font-mono text-[12px] text-fuchsia-300' },
                    `Δx·Δp = ${fmt(psiStats.prod * 0.5, 3)} · ħ/2`),
                  `ratio to the Heisenberg bound: ${fmt(psiStats.prod, 3)} — exactly 1 only for Gaussian (oscillator ground) state.`,
                ),
              )
            })(),
          )
          : Htag('span'),

        // Packet dynamics readout
        mode === 'packet'
          ? Htag(
            'div',
            { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
            SectionTitle('Packet & uncertainty'),
            Htag(
              'div',
              { class: 'grid grid-cols-3 gap-2' },
              StatCard({ label: 'σ₀', value: fmt(state.sigma, 2), tint: '#22d3ee' }),
              StatCard({ label: 'Δp = ħ/2σ₀', value: fmt(1 / (2 * state.sigma), 3), tint: '#f472b6' }),
              StatCard({ label: 'Δx·Δp', value: '≥ ħ/2', tint: '#e4e4e7' }),
            ),
            Htag(
              'p',
              { class: 'mt-2 text-[10px] leading-relaxed text-zinc-500' },
              'A free Gaussian spreads because its plane-wave components fly at different phase velocities (v = p/m, each k its own): watch Δx grow. Live ⟨E⟩, current and worst-case ΔE drift, pre-renormalization norm error, boundary reflection telemetry, and barrier fractions are printed on the canvas overlay.',
            ),
          )
          : Htag('span'),

        // Methodology note
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3 text-[10.5px] leading-relaxed text-zinc-500' },
          Htag('div', { class: 'mb-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400' }, 'Method & Visualization Semantics'),
          `Grid: 512 points, box ≤ ±22 natural units. 3D Waterfall: Wavefunction History Waterfall plotting signed amplitude Re ψ(x, t) across past time steps (preserving phase and nodes). Note: the waterfall animation of a stationary state uses an illustrative rotation frequency that is monotone in Eₙ — the true transition frequency ωₙ = (Eₙ₊₁ − Eₙ)/ħ is far too fine to animate faithfully at lab scales. 2D Lower Strip: Probability density |ψ|² (positive definite). Evolution: Fixed-timestep accumulator Crank–Nicolson (I + iΔtH/2)ψ⁺ = (I − iΔtH/2)ψ — frame-rate independent and exactly unitary. Internal units ħ²/2mₑ = 1; energies scale as ${fmt(HBAR2_2M_EV_A2 / ((state.lengthNm * 10) ** 2), 3)} eV per natural unit at L = ${fmt(state.lengthNm, 2)} nm.`,
        ),
      ),
    ),
  )
}
