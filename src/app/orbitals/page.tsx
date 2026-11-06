import { h, reactive, type VNode } from 'nexus-framework'
import { ELEMENTS, configToSuperscript, getElement } from '@/lib/periodic'
import {
  combosOf,
  defaultSelection,
  lLetter,
  occupancyOf,
  orbitalLabel,
  parseConfig,
  radialStats,
  slaterZeff,
  subshellLabel,
  type RealOrbital,
} from '@/lib/orbital'
import '@/components/orbital/orbital-element'
import '@/components/orbital/zeeman-stark-element'
import { RadialPlotNexus } from '@/components/orbital/RadialPlotNexus'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

function StatCard({ label, value, tint }: { label: string; value: string; tint?: string }): VNode {
  return H(
    'div',
    { class: 'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2' },
    H('div', { class: 'text-[9px] uppercase tracking-wider text-zinc-500' }, label),
    H(
      'div',
      {
        class: 'mt-0.5 font-mono text-[14px] font-semibold',
        style: { color: tint ?? '#e4e4e7' },
      },
      value,
    ),
  )
}

function getInitialParams(): { z: number; zeeman: boolean; preset: string } {
  if (typeof window === 'undefined') return { z: 6, zeeman: false, preset: 'cadmium-normal' }
  const params = new URLSearchParams(window.location.search)
  const zParam = parseInt(params.get('z') ?? '6', 10)
  const z = Number.isFinite(zParam) && zParam >= 1 && zParam <= 118 ? zParam : 6
  const zeeman =
    params.get('zeeman') === '1' ||
    params.get('stark') === '1' ||
    params.get('field') === '1' ||
    params.get('b') != null
  const preset = params.get('preset') ?? 'cadmium-normal'
  return { z, zeeman, preset }
}

const initialParams = getInitialParams()
const initialEl = getElement(initialParams.z)!
const initialOccupied = parseConfig(initialEl.config)
const initialDefSel = defaultSelection(initialOccupied)

const state = reactive({
  z: initialParams.z,
  sel: initialDefSel as RealOrbital,
  mode: 'surface' as 'surface' | 'cloud',
  isoT: 0.7,
  rotate: true,
  fx: typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('fx') === 'on',
  zeemanLabOpen: initialParams.zeeman,
  zeemanPreset: initialParams.preset,
})

function syncUrl(z: number): void {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('z', String(z))
    if (state.fx) url.searchParams.set('fx', 'on')
    else url.searchParams.delete('fx')
    if (state.zeemanLabOpen) {
      url.searchParams.set('zeeman', '1')
    } else {
      url.searchParams.delete('zeeman')
      url.searchParams.delete('stark')
      url.searchParams.delete('field')
    }
    window.history.replaceState(null, '', url.toString())
  }
}

function setElement(z: number): void {
  state.z = z
  const el = getElement(z)!
  const occ = parseConfig(el.config)
  state.sel = defaultSelection(occ)
  syncUrl(z)
}

function pickSubshell(n: number, l: number): void {
  const c = combosOf(l)[0]
  state.sel = { n, l, m: c.m, sin: c.sin }
}

export default function OrbitalLabPage(): VNode {
  const el = getElement(state.z)!
  const occupied = parseConfig(el.config)
  const sel = state.sel

  const isoRaw = 0.03 + Math.pow(state.isoT, 2.2) * 0.32
  const occ = occupancyOf(occupied, sel.n, sel.l)
  const { zeff, sigma } = slaterZeff(el.number, { n: sel.n, l: sel.l, e: occ }, occupied)
  const stats = radialStats(sel.n, sel.l, zeff)
  const combos = combosOf(sel.l)
  const comboIdx = Math.max(
    0,
    combos.findIndex((c) => c.m === sel.m && c.sin === sel.sin),
  )

  const eV = (-13.6057 * zeff * zeff) / (sel.n * sel.n)
  const eStr = Math.abs(eV) >= 1000 ? `${(eV / 1000).toFixed(1)} keV` : `${eV.toFixed(2)} eV`
  const capacity = 2 * (2 * sel.l + 1)

  return H(
    'div',
    { class: 'flex min-h-dvh flex-col bg-[#070a10] text-zinc-200' },
    // Header
    H(
      'header',
      {
        class:
          'sticky top-0 z-30 flex h-14 shrink-0 flex-wrap items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur',
      },
      H(
        'a',
        {
          href: './index.html',
          class:
            'rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
        },
        '← Periodic table',
      ),
      H(
        'div',
        { class: 'flex items-center gap-2' },
        ElementaLogo({ size: 26 }),
        H(
          'h1',
          { class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100' },
          'QM ',
          H('span', { class: 'text-amber-400' }, 'ORBITAL LAB'),
        ),
      ),
      H(
        'span',
        { class: 'hidden font-mono text-[10px] text-zinc-500 lg:inline' },
        'hydrogenic ψ',
        H('sub', null, 'nlm'),
        ' · Slater Z',
        H('sub', null, 'eff'),
        ' · isosurfaces, radial nodes & cross-sections',
      ),
      H(
        'button',
        {
          type: 'button',
          onclick: () => {
            state.zeemanLabOpen = true
            syncUrl(state.z)
          },
          class:
            'ml-auto flex items-center gap-1.5 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-cyan-300 transition hover:border-cyan-400/70 hover:bg-cyan-400/20 cursor-pointer',
        },
        H('span', null, '⚡ Zeeman & Stark Lab'),
        H(
          'span',
          {
            class:
              'rounded bg-cyan-400/20 px-1 py-0.2 font-mono text-[9px] uppercase tracking-wider text-cyan-200',
          },
          'B & E Fields',
        ),
      ),
      H(
        'select',
        {
          value: state.z,
          onchange: (e: Event) => {
            const val = parseInt((e.target as HTMLSelectElement).value, 10)
            setElement(val)
          },
          'aria-label': 'Pick element',
          class:
            'rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none',
        },
        ...ELEMENTS.map((e2) =>
          H(
            'option',
            { value: e2.number, selected: e2.number === state.z },
            `${e2.number} · ${e2.symbol} — ${e2.name}`,
          ),
        ),
      ),
      GitHubLink(),
    ),

    // Main grid
    H(
      'main',
      {
        class:
          'mx-auto grid w-full max-w-[1500px] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:p-6',
      },
      // Left Column
      H(
        'div',
        { class: 'space-y-4' },
        // 3D Canvas Box
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
          H(
            'div',
            { class: 'mb-3 flex flex-wrap items-center gap-2' },
            H(
              'span',
              {
                class:
                  'flex h-9 w-9 flex-col items-center justify-center rounded-lg border font-bold',
                style: {
                  borderColor: '#fbbf2455',
                  background: '#fbbf2412',
                  color: '#fbbf24',
                },
              },
              H('span', { class: 'text-[14px] leading-none' }, el.symbol),
              H('span', { class: 'font-mono text-[7.5px] leading-none opacity-70' }, state.z),
            ),
            H(
              'div',
              { class: 'min-w-0' },
              H(
                'div',
                { class: 'text-[13px] font-semibold text-zinc-100' },
                orbitalLabel(sel),
                H(
                  'span',
                  { class: 'ml-2 font-mono text-[10px] font-normal text-zinc-500' },
                  'Z',
                  H('sub', null, 'eff'),
                  ` = ${zeff.toFixed(2)} · ${occ > 0 ? `${occ} e⁻ occupied` : 'virtual orbital'}`,
                ),
              ),
              H(
                'div',
                { class: 'font-mono text-[10px] text-zinc-600' },
                configToSuperscript(el.config),
              ),
            ),
            H(
              'div',
              { class: 'ml-auto flex flex-wrap items-center gap-2' },
              H(
                'div',
                { class: 'flex overflow-hidden rounded-md border border-white/10' },
                H(
                  'button',
                  {
                    type: 'button',
                    onclick: () => {
                      state.mode = 'surface'
                    },
                    class: `px-2.5 py-1 text-[11px] transition ${
                      state.mode === 'surface'
                        ? 'bg-white/10 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`,
                  },
                  'surface',
                ),
                H(
                  'button',
                  {
                    type: 'button',
                    onclick: () => {
                      state.mode = 'cloud'
                    },
                    class: `px-2.5 py-1 text-[11px] transition ${
                      state.mode === 'cloud'
                        ? 'bg-white/10 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`,
                  },
                  'cloud',
                ),
              ),
              H(
                'button',
                {
                  type: 'button',
                  onclick: () => {
                    state.rotate = !state.rotate
                  },
                  class: `rounded-md border px-2.5 py-1 text-[11px] transition ${
                    state.rotate
                      ? 'border-teal-400/40 bg-teal-400/10 text-teal-300'
                      : 'border-white/10 text-zinc-500 hover:text-zinc-300'
                  }`,
                },
                state.rotate ? '❚❚ rotate' : '▶ rotate',
              ),
              H(
                'button',
                {
                  type: 'button',
                  onclick: () => {
                    state.fx = !state.fx
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href)
                      if (state.fx) url.searchParams.set('fx', 'on')
                      else url.searchParams.delete('fx')
                      window.history.replaceState(null, '', url.toString())
                    }
                  },
                  class: `rounded-md border px-2.5 py-1 text-[11px] transition ${
                    state.fx
                      ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-300'
                      : 'border-white/10 text-zinc-500 hover:text-zinc-300'
                  }`,
                },
                state.fx ? '✨ glow fx' : '✧ glow fx',
              ),
              H(
                'div',
                { class: 'flex items-center gap-1.5' },
                H('span', { class: 'font-mono text-[9.5px] text-zinc-500' }, 'iso'),
                H('input', {
                  type: 'range',
                  min: '0',
                  max: '1',
                  step: '0.02',
                  value: String(state.isoT),
                  oninput: (e: Event) => {
                    state.isoT = parseFloat((e.target as HTMLInputElement).value)
                  },
                  class: 'w-24',
                  'aria-label': 'Isosurface threshold',
                }),
                H(
                  'span',
                  { class: 'w-9 font-mono text-[9.5px] text-zinc-400' },
                  isoRaw.toFixed(3),
                ),
              ),
            ),
          ),
          H(
            'div',
            {
              class:
                'relative h-[380px] overflow-hidden rounded-lg border border-white/[0.07] bg-[#070a10] lg:h-[540px]',
            },
            H('elementa-orbital-view', {
              'data-n': sel.n,
              'data-l': sel.l,
              'data-m': sel.m,
              'data-sin': sel.sin,
              'data-zeff': zeff,
              'data-mode': state.mode,
              'data-iso': isoRaw,
              'data-rotate': String(state.rotate),
              'data-speed': '1',
              'data-fx': state.fx ? 'on' : 'off',
            }),
            H(
              'div',
              {
                class:
                  'pointer-events-none absolute bottom-2 left-3 flex items-center gap-3 font-mono text-[9.5px] text-zinc-500',
              },
              H(
                'span',
                { class: 'flex items-center gap-1' },
                H('span', { class: 'inline-block h-2 w-2 rounded-full bg-amber-400' }),
                ' ψ > 0',
              ),
              H(
                'span',
                { class: 'flex items-center gap-1' },
                H('span', { class: 'inline-block h-2 w-2 rounded-full bg-teal-400' }),
                ' ψ < 0',
              ),
              H('span', { class: 'hidden md:inline' }, '· physics z renders upward · drag to orbit'),
            ),
          ),
        ),

        // Cross section
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
          H(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'ψ² cross-section — nodal structure',
          ),
          H('elementa-cross-section', {
            'data-n': sel.n,
            'data-l': sel.l,
            'data-m': sel.m,
            'data-sin': sel.sin,
            'data-zeff': zeff,
            'data-extent': stats.rMax,
          }),
          H(
            'p',
            { class: 'mt-2 text-[9.5px] leading-relaxed text-zinc-600' },
            'Sign-modulated |ψ|² in the xz-plane. Dark seams are nodal surfaces where ψ = 0 — probability never crosses them. ',
            `${stats.nAngularNodes} angular node${stats.nAngularNodes === 1 ? '' : 's'} (cones/planes) and `,
            `${stats.nRadialNodes} radial node${stats.nRadialNodes === 1 ? '' : 's'} (spheres) for this orbital.`,
          ),
        ),
      ),

      // Right Column — numbers & controls
      H(
        'div',
        { class: 'space-y-4' },
        // Quantum numbers & screening
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
          H(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Quantum numbers & screening',
          ),
          H(
            'div',
            { class: 'grid grid-cols-2 gap-2 sm:grid-cols-3' },
            StatCard({ label: 'Principal n', value: String(sel.n) }),
            StatCard({ label: 'Azimuthal ℓ', value: `${sel.l} (${lLetter(sel.l)})` }),
            StatCard({ label: 'Real combo', value: orbitalLabel(sel) }),
            StatCard({
              label: 'Occupancy',
              value: `${occ} / ${capacity} e⁻`,
              tint: occ > 0 ? '#34d399' : '#a1a1aa',
            }),
            StatCard({ label: 'Z (nuclear)', value: String(state.z) }),
            StatCard({ label: 'σ (Slater)', value: sigma.toFixed(2) }),
            StatCard({ label: 'Z_eff = Z − σ', value: zeff.toFixed(2), tint: '#fbbf24' }),
            StatCard({ label: 'E_n (hydrogenic)', value: eStr, tint: '#fb7185' }),
            StatCard({ label: '⟨r⟩', value: `${stats.rMean.toFixed(2)} a₀` }),
            StatCard({ label: 'r most probable', value: `${stats.rMp.toFixed(2)} a₀` }),
            StatCard({ label: 'Radial nodes', value: String(stats.nRadialNodes), tint: '#38bdf8' }),
            StatCard({ label: 'Angular nodes', value: String(stats.nAngularNodes), tint: '#38bdf8' }),
          ),
          H(
            'div',
            {
              class:
                'mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10.5px] text-zinc-400',
            },
            'radial node radii: ',
            H(
              'span',
              { class: 'text-zinc-200' },
              stats.nodes.length > 0
                ? stats.nodes.map((v) => `${v.toFixed(2)} a₀`).join(' · ')
                : '—',
            ),
          ),
        ),

        // Radial distribution
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
          H(
            'h2',
            { class: 'mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Radial distribution',
          ),
          RadialPlotNexus({ stats, accent: '#fbbf24' }),
        ),

        // Occupied subshells
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
          H(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Occupied subshells',
          ),
          H(
            'div',
            { class: 'flex flex-wrap gap-1.5' },
            ...occupied.map((s) => {
              const active = sel.n === s.n && sel.l === s.l
              return H(
                'button',
                {
                  type: 'button',
                  onclick: () => pickSubshell(s.n, s.l),
                  class: `rounded-full border px-2.5 py-1 font-mono text-[11px] transition ${
                    active
                      ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                      : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                  }`,
                },
                subshellLabel(s),
              )
            }),
          ),

          // Explore any orbital
          H(
            'h2',
            { class: 'mb-2 mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Explore any orbital (incl. virtual)',
          ),
          H(
            'div',
            { class: 'flex flex-wrap gap-2' },
            H(
              'select',
              {
                value: sel.n,
                onchange: (e: Event) => {
                  const n = parseInt((e.target as HTMLSelectElement).value, 10)
                  pickSubshell(n, Math.min(sel.l, Math.min(3, n - 1)))
                },
                'aria-label': 'Principal quantum number',
                class:
                  'rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 font-mono text-[11px] text-zinc-300 focus:outline-none',
              },
              ...[1, 2, 3, 4, 5, 6, 7].map((v) =>
                H('option', { value: v, selected: v === sel.n }, `n = ${v}`),
              ),
            ),
            H(
              'select',
              {
                value: sel.l,
                onchange: (e: Event) => {
                  const l = parseInt((e.target as HTMLSelectElement).value, 10)
                  pickSubshell(sel.n, l)
                },
                'aria-label': 'Azimuthal quantum number',
                class:
                  'rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 font-mono text-[11px] text-zinc-300 focus:outline-none',
              },
              ...Array.from({ length: Math.min(3, sel.n - 1) + 1 }, (_, l) =>
                H('option', { value: l, selected: l === sel.l }, `ℓ = ${l} (${lLetter(l)})`),
              ),
            ),
            H(
              'select',
              {
                value: comboIdx,
                onchange: (e: Event) => {
                  const idx = parseInt((e.target as HTMLSelectElement).value, 10)
                  const c = combos[idx] ?? combos[0]
                  state.sel = { ...sel, m: c.m, sin: c.sin }
                },
                'aria-label': 'Real orbital combination',
                class:
                  'rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 font-mono text-[11px] text-zinc-300 focus:outline-none',
              },
              ...combos.map((c, i) =>
                H(
                  'option',
                  { value: i, selected: i === comboIdx },
                  orbitalLabel({ ...sel, m: c.m, sin: c.sin }),
                ),
              ),
            ),
          ),
        ),

        // Method & accuracy
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
          H(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Method & accuracy',
          ),
          H(
            'p',
            { class: 'text-[10.5px] leading-relaxed text-zinc-500' },
            'ψ',
            H('sub', null, 'nlm'),
            ' = R',
            H('sub', null, 'nl'),
            '(r)·Y',
            H('sub', null, 'lm'),
            '(θ,φ) is evaluated exactly for the hydrogen-like atom in atomic units; multi-electron screening is folded in as a single Slater effective nuclear charge (classroom rules), so shapes are qualitative and radial scales approximate for many-electron atoms — exact for hydrogen-like ions. Real (Cartesian) combinations are shown; lobe sign matters because bonding overlaps ψ of the same sign. Isosurfaces are extracted with surface nets on a nucleus-graded grid; the cloud mode samples |ψ|² directly. E',
            H('sub', null, 'n'),
            ' = −13.6057·Z',
            H('sub', null, 'eff'),
            '²/n² eV.',
          ),
          H(
            'div',
            { class: 'mt-3 flex gap-2' },
            H(
              'a',
              {
                href: './mo.html',
                class:
                  'rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-300 transition hover:bg-amber-400/20',
              },
              'MO builder →',
            ),
            H(
              'a',
              {
                href: './index.html',
                class:
                  'rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
              },
              '← periodic table',
            ),
          ),
        ),
      ),
    ),

    // Zeeman & Stark Effect Quantum Splitting Modal
    state.zeemanLabOpen
      ? H('elementa-zeeman-stark-modal', {
          'data-preset': state.zeemanPreset,
          onclosezeemanstark: () => {
            state.zeemanLabOpen = false
            syncUrl(state.z)
          },
        })
      : null,
  )
}
