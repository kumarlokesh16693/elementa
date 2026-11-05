/**
 * ELEMENTA — Solid-State Band Theory Laboratory
 * Tight-binding bands, Brillouin zones, Fermi surfaces, density of states,
 * Peierls and Dirac gaps — analysed from the actual filling and temperature.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import '@/components/bands/bands-element'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'
import {
  analyse,
  KB_EV,
  LATTICE_MODELS,
  MODEL_LABEL,
  MODEL_NOTE,
  SITES_PER_CELL,
  type BandParams,
  type LatticeModel,
} from '@/lib/bands'

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
      class: 'w-full accent-cyan-400',
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
          ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
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

function getInitialParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const k of ['model', 't', 'a', 'delta', 'gap', 'fill', 'temp', 'rot']) {
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

const DEFAULT_T = 2.7
const DEFAULT_A = 2.46

const state = reactive({
  model: (LATTICE_MODELS as string[]).includes(initial.model ?? '')
    ? (initial.model as LatticeModel)
    : 'honeycomb',
  t: Math.min(3, Math.max(0.2, num(initial, 't', DEFAULT_T))),
  a: Math.min(6, Math.max(1.5, num(initial, 'a', DEFAULT_A))),
  delta: Math.min(1.4, Math.max(0, num(initial, 'delta', 0.3))),
  gap: Math.min(3, Math.max(0, num(initial, 'gap', 0.35))),
  filling: Math.min(1.95, Math.max(0.05, num(initial, 'fill', 1))),
  temperature: Math.min(800, Math.max(0, num(initial, 'temp', 300))),
  rotate: initial.rot !== 'false' && initial.rot !== '0',
  seed: 0,
})

if (state.delta > state.t * 0.45) state.delta = Number((state.t * 0.45).toFixed(2))

let lastUrl = ''
function syncUrl(): void {
  if (typeof window === 'undefined') return
  const next = new URLSearchParams()
  next.set('model', state.model)
  next.set('t', String(state.t))
  next.set('a', String(state.a))
  next.set('delta', String(state.delta))
  next.set('gap', String(state.gap))
  next.set('fill', String(state.filling))
  next.set('temp', String(Math.round(state.temperature)))
  next.set('rot', String(state.rotate))
  const url = `${window.location.pathname}?${next}`
  if (url !== lastUrl) {
    lastUrl = url
    window.history.replaceState(null, '', url)
  }
}

function setModel(model: LatticeModel): void {
  state.model = model
  syncUrl()
}

function setHopping(v: number): void {
  state.t = v
  if (state.delta > v * 0.45) state.delta = Number((v * 0.45).toFixed(2))
}

const fmt = (v: number, d = 3): string => v.toFixed(d)

const MODEL_TEXT: Record<LatticeModel, string> = {
  chain: 'One s orbital per site. Hopping t broadens the atomic level into a 4t band. At half filling E_F cuts the band, so the chain is always a metal.',
  ssh: 'Two sites per cell with alternating hoppings t ± δ. Dimerization opens a 4δ Peierls gap at the zone edge — the one-dimensional ancestor of every band insulator.',
  square: 'A 2D s band, 8t wide. The Fermi surface is the set of k with E(k) = E_F; changing the filling deforms it from a point to the whole zone.',
  honeycomb: 'p_z orbitals on a honeycomb lattice. At Δ = 0 the bands touch at K (massless Dirac fermions); a sublattice potential Δ opens a 2Δ gap, as in h-BN/graphene.',
}

const BADGE: Record<string, string> = {
  metal: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
  semimetal: 'border-teal-400/40 bg-teal-400/10 text-teal-300',
  semiconductor: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  insulator: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
  doped: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
}

export default function BandsPage(): VNode {
  const params: BandParams = {
    model: state.model,
    t: state.t,
    a: state.a,
    delta: state.delta,
    gap: state.gap,
    filling: state.filling,
    temperature: state.temperature,
  }
  const an = analyse(params)
  const kT = KB_EV * state.temperature * 1000
  const gapOverKt = an.gap > 0 ? an.gap / Math.max(1e-6, KB_EV * Math.max(1, state.temperature)) : 0
  const massLabel = an.mass.ratio > 0 ? `${an.mass.ratio.toFixed(2)} mₑ` : '0 (Dirac)'
  const sites = SITES_PER_CELL[state.model]
  const bandFill = an.sites > 0 ? an.electronsPerCell / (2 * an.nBands) : 0

  const attrs: Record<string, string> = {
    'data-model': state.model,
    'data-t': String(state.t),
    'data-a': String(state.a),
    'data-delta': String(state.delta),
    'data-gap': String(state.gap),
    'data-fill': String(state.filling),
    'data-temp': String(state.temperature),
    'data-rot': state.rotate ? 'true' : 'false',
    'data-reset': String(state.seed),
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
          Htag('span', { class: 'text-cyan-300' }, 'BAND'),
          ' LAB',
        ),
      ),
      Htag(
        'span',
        { class: 'hidden font-mono text-[10px] text-zinc-500 lg:inline' },
        'Tight-binding bands · Fermi surfaces · density of states · Peierls & Dirac gaps',
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
          Htag('elementa-bands', {
            ...attrs,
            style: 'width: 100%; height: 100%; display: block;',
          }),
          Htag(
            'div',
            {
              class:
                'pointer-events-none absolute bottom-2 right-2 flex flex-wrap items-center gap-2 font-mono text-[9.5px] text-zinc-500',
            },
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-[#22d3ee]' }),
              'occupied'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-[#f59e0b]' }),
              'empty'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-0.5 w-4 bg-zinc-200/70' }),
              'E_F'),
          ),
        ),
        Htag(
          'div',
          { class: 'mt-2 flex flex-wrap items-center gap-2' },
          toggle(state.rotate ? 'Auto-rotate' : 'Auto-rotate off', state.rotate, () => {
            state.rotate = !state.rotate
            syncUrl()
          }),
          Htag(
            'button',
            {
              type: 'button',
              onclick: () => { state.seed++ },
              class: 'rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
            },
            '⟲ Reset view',
          ),
          Htag(
            'span',
            { class: 'font-mono text-[10px] text-zinc-600' },
            `drag to orbit · scroll to zoom · ${an.nBands} band${an.nBands > 1 ? 's' : ''}`,
          ),
          Htag(
            'span',
            { class: 'font-mono text-[10px] text-zinc-600' },
            `${bandFill > 0.98 ? 'filled' : bandFill <= 0.02 ? 'empty' : `${Math.round(bandFill * 100)}% filled`} · ${MODEL_NOTE[state.model]}`,
          ),
        ),
      ),

      // Right: controls & physics
      Htag(
        'div',
        { class: 'space-y-3' },
        // Lattice & Hamiltonian
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Lattice & Hamiltonian'),
          Htag(
            'div',
            { class: 'mb-3 grid grid-cols-2 gap-1.5' },
            LATTICE_MODELS.map((m) => toggle(MODEL_LABEL[m], state.model === m, () => setModel(m))),
          ),
          Htag('div', { class: 'space-y-2.5' },
            slider('Hopping t', 0.2, 3, 0.05, () => state.t, setHopping, (v) => v.toFixed(2), 'eV'),
            slider('Lattice constant a', 1.5, 6, 0.02, () => state.a, (v) => { state.a = v }, (v) => v.toFixed(2), 'Å'),
            state.model === 'ssh'
              ? slider('Dimerization δ', 0, Number((state.t * 0.45).toFixed(2)), 0.01, () => state.delta, (v) => { state.delta = v }, (v) => v.toFixed(2), 'eV')
              : state.model === 'honeycomb'
                ? slider('Sublattice gap Δ', 0, 3, 0.01, () => state.gap, (v) => { state.gap = v }, (v) => v.toFixed(2), 'eV')
                : Htag('span'),
            slider('Filling ν', 0.05, 1.95, 0.05, () => state.filling, (v) => { state.filling = v }, (v) => v.toFixed(2), 'e⁻/site'),
            slider('Temperature T', 0, 800, 10, () => state.temperature, (v) => { state.temperature = v }, (v) => String(Math.round(v)), 'K'),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[10px] leading-relaxed text-zinc-500' },
            MODEL_TEXT[state.model],
          ),
        ),

        // Band summary
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Band summary'),
          Htag(
            'div',
            { class: 'grid grid-cols-3 gap-2' },
            StatCard({ label: 'bandwidth W', value: `${fmt(an.range.max - an.range.min, 2)} eV`, tint: '#22d3ee' }),
            StatCard({ label: 'gap E_g', value: `${fmt(an.gap, 3)} eV`, tint: an.gap > 0 ? '#fbbf24' : '#71717a' }),
            StatCard({ label: 'Fermi level E_F', value: `${fmt(an.fermi, 3)} eV`, tint: '#e4e4e7' }),
            StatCard({ label: 'm* / mₑ', value: massLabel, tint: '#a5f3fc' }),
            StatCard({ label: 'g(E_F)', value: `${an.dosAtFermi.toFixed(2)} eV⁻¹`, tint: '#a1a1aa' }),
            StatCard({ label: 'ν · sites/cell', value: `${state.filling.toFixed(2)} · ${sites}`, tint: '#a1a1aa' }),
          ),
          Htag(
            'div',
            { class: 'mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10.5px] leading-relaxed text-zinc-400' },
            Htag('div', { class: 'font-mono text-[11.5px] text-cyan-300' },
              an.gap > 0
                ? `E_g = ${an.gap.toFixed(2)} eV  ·  ${gapOverKt >= 1 ? `${gapOverKt.toFixed(0)} kT at ${Math.round(state.temperature)} K` : `comparable to kT = ${kT.toFixed(0)} meV`}`
                : 'E_g = 0  ·  band(s) cross the Fermi level'),
            Htag('div', { class: 'mt-0.5 font-mono text-[10px] text-zinc-500' },
              `E_F − mid-gap = ${an.fermi >= 0 ? '+' : ''}${an.fermi.toFixed(3)} eV${an.gap > 0 ? (Math.abs(an.fermi) < an.gap / 2 ? ' · inside the gap' : ' · doping pushes E_F into a band') : ''}`),
          ),
        ),

        // Electronic character
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Electronic character'),
          Htag(
            'div',
            { class: 'flex flex-wrap items-center gap-2' },
            Htag(
              'span',
              { class: `rounded-md border px-2.5 py-1 text-[11px] font-medium ${BADGE[an.classification.kind] ?? BADGE.metal}` },
              an.classification.label,
            ),
            Htag(
              'span',
              { class: 'font-mono text-[10px] text-zinc-500' },
              `${an.electronsPerCell.toFixed(2)} e⁻/cell · ${(bandFill * 100).toFixed(0)}% of all states`,
            ),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[10.5px] leading-relaxed text-zinc-500' },
            an.classification.detail,
          ),
          Htag(
            'div',
            { class: 'mt-2 grid grid-cols-3 gap-2' },
            StatCard({ label: 'thermal energy kT', value: `${kT.toFixed(1)} meV`, tint: '#e4e4e7' }),
            StatCard({ label: 'mass note', value: an.mass.note, tint: '#a1a1aa' }),
            StatCard({ label: 'states/cell', value: String(2 * an.nBands), tint: '#a1a1aa' }),
          ),
        ),

        // Model notes
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3 text-[10.5px] leading-relaxed text-zinc-500' },
          Htag('div', { class: 'mb-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400' }, 'Method'),
          'Nearest-neighbour tight binding with spin degeneracy 2. E_F solves (2/n_k) Σ f(E, μ) = ν·sites/cell by bisection; the DOS is a Gaussian-smoothed histogram over a 128² k-grid (4800 points in 1D) normalised to states eV⁻¹ cell⁻¹. m* follows from the band-edge curvature, ħ²/(d²E/dk²). The 3D surface is the exact E(k) over the first Brillouin zone — only the camera is schematic.',
        ),
      ),
    ),
  )
}
