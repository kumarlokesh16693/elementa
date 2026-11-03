import { h, reactive, type VNode } from 'nexus-framework'
import {
  NUCLEI,
  STABLE_COUNT,
  nucAt,
  catOf,
  CATS,
  type Nuclide,
} from '@/lib/periodic/nuclides'
import { searchElements } from '@/lib/periodic'
import '@/components/segre/segre-element'
import '@/components/segre/bateman-element'
import '@/components/segre/semf-element'
import '@/components/segre/nucleosynthesis-element'
import '@/components/segre/shielding-element'
import { NuclidePanelNexus } from '@/components/segre/NuclidePanelNexus'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

type Mode = 'decay' | 'hl'

const HL_TICKS: [string, number][] = [
  ['10⁻²² s', 0],
  ['1 ns', (-9 + 22) / 46],
  ['1 µs', (-6 + 22) / 46],
  ['1 s', 0.478],
  ['1 y', (7.499 + 22) / 46],
  ['1 Gy', (16.5 + 22) / 46],
  ['10²⁴ s', 1],
]

function getInitialParams() {
  if (typeof window === 'undefined') {
    return { sel: nucAt(92, 146)!, hl: null as number | null, sim: false, semf: false, astro: false, shield: false }
  }
  const params = new URLSearchParams(window.location.search)
  const zParam = parseInt(params.get('z') ?? '', 10)
  const nParam = parseInt(params.get('n') ?? '', 10)
  const sim = params.get('sim') === '1' || params.get('sim') === 'true'
  const semf = params.get('semf') === '1' || params.get('semf') === 'true' || params.get('fission') === '1'
  const astro = params.get('astro') === '1' || params.get('astro') === 'true' || params.get('origins') === '1'
  const shield = params.get('shield') === '1' || params.get('shield') === 'true' || params.get('shielding') === '1'

  if (Number.isFinite(zParam) && Number.isFinite(nParam)) {
    const nu = nucAt(zParam, nParam)
    if (nu) return { sel: nu, hl: null as number | null, sim, semf, astro, shield }
  }
  if (Number.isFinite(zParam) && zParam >= 0) {
    const rows = NUCLEI.filter((nu) => nu.z === zParam)
    if (rows.length) {
      const best =
        rows.find((r) => r.stable) ??
        [...rows].sort((a, b) => (b.hlSec ?? -1) - (a.hlSec ?? -1))[0]
      return { sel: best, hl: zParam as number | null, sim, semf, astro, shield }
    }
  }
  return { sel: nucAt(92, 146)!, hl: null as number | null, sim, semf, astro, shield }
}

const init = getInitialParams()

const state = reactive({
  mode: 'decay' as Mode,
  showMagic: true,
  showPath: true,
  selected: init.sel as Nuclide | null,
  highlightZ: init.hl as number | null,
  query: '',
  batemanOpen: init.sim,
  batemanNuclide: null as Nuclide | null,
  semfOpen: init.semf,
  semfNuclide: null as Nuclide | null,
  astroOpen: init.astro,
  astroNuclide: null as Nuclide | null,
  shieldingOpen: init.shield,
  shieldingNuclide: null as Nuclide | null,
})

function syncUrl(nu: Nuclide | null): void {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    if (nu) {
      url.searchParams.set('z', String(nu.z))
      url.searchParams.set('n', String(nu.n))
    } else {
      url.searchParams.delete('z')
      url.searchParams.delete('n')
    }
    if (state.batemanOpen) {
      url.searchParams.set('sim', '1')
    } else {
      url.searchParams.delete('sim')
    }
    if (state.semfOpen) {
      url.searchParams.set('semf', '1')
    } else {
      url.searchParams.delete('semf')
    }
    if (state.astroOpen) {
      url.searchParams.set('astro', '1')
    } else {
      url.searchParams.delete('astro')
    }
    if (state.shieldingOpen) {
      url.searchParams.set('shield', '1')
    } else {
      url.searchParams.delete('shield')
    }
    window.history.replaceState(null, '', url.toString())
  }
}

function showElement(z: number): void {
  const rows = NUCLEI.filter((nu) => nu.z === z)
  if (!rows.length) return
  const best =
    rows.find((r) => r.stable) ??
    [...rows].sort((a, b) => (b.hlSec ?? -1) - (a.hlSec ?? -1))[0]
  state.highlightZ = z
  state.selected = best
  syncUrl(best)
  const chartEl = document.querySelector('elementa-segre-canvas') as any
  chartEl?.centerOn?.(best.z, best.n)
}

function selectNuclide(nu: Nuclide | null): void {
  state.selected = nu
  syncUrl(nu)
  if (nu) {
    const chartEl = document.querySelector('elementa-segre-canvas') as any
    chartEl?.centerOn?.(nu.z, nu.n)
  }
}

export default function SegrePage(): VNode {
  const results = searchElements(state.query)
  const sel = state.selected

  // Count categories
  const counts = new Map<string, number>()
  for (const nu of NUCLEI) {
    const k = catOf(nu)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  return H(
    'div',
    {
      class: 'flex h-dvh flex-col bg-[#070a10]',
      onselectnuclide: (e: CustomEvent) => {
        selectNuclide(e.detail.nuclide)
      },
      onclosebateman: () => {
        state.batemanOpen = false
        state.batemanNuclide = null
        syncUrl(state.selected)
      },
      onselectbatemannuclide: (e: CustomEvent) => {
        selectNuclide(e.detail.nuclide)
      },
      onclosesemf: () => {
        state.semfOpen = false
        state.semfNuclide = null
        syncUrl(state.selected)
      },
      onselectsemfnuclide: (e: CustomEvent) => {
        selectNuclide(e.detail.nuclide)
      },
      onclosenucleosynthesis: () => {
        state.astroOpen = false
        state.astroNuclide = null
        syncUrl(state.selected)
      },
      onselectnucleosynthesisnuclide: (e: CustomEvent) => {
        selectNuclide(e.detail.nuclide)
      },
    },
    // Header
    H(
      'header',
      {
        class:
          'relative z-20 flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur',
      },
      H(
        'a',
        {
          href: './index.html',
          class:
            'shrink-0 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
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
          'SEGR',
          H('span', { class: 'text-amber-400' }, 'È'),
          ' CHART',
        ),
      ),
      H(
        'span',
        { class: 'hidden font-mono text-[10px] text-zinc-500 md:inline' },
        `chart of nuclides · ${NUCLEI.length.toLocaleString()} ground states · ${STABLE_COUNT} stable · IAEA LiveChart / ENSDF`,
      ),
      H(
        'a',
        {
          href: './orbitals.html',
          class:
            'ml-auto shrink-0 rounded-md border border-sky-400/40 bg-sky-400/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-300 transition hover:bg-sky-400/20',
        },
        'Orbital lab',
      ),
      GitHubLink(),
    ),

    // Toolbar
    H(
      'div',
      {
        class:
          'relative z-10 flex h-11 shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#080c14] px-4',
      },
      // Mode selector
      H(
        'div',
        { class: 'flex shrink-0 rounded-md border border-white/10 p-0.5' },
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              state.mode = 'decay'
            },
            class: `rounded px-2.5 py-1 text-[11px] font-medium transition ${
              state.mode === 'decay' ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
            }`,
          },
          'Decay mode',
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              state.mode = 'hl'
            },
            class: `rounded px-2.5 py-1 text-[11px] font-medium transition ${
              state.mode === 'hl' ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
            }`,
          },
          'Half-life',
        ),
      ),

      // Magic toggle
      H(
        'button',
        {
          type: 'button',
          onclick: () => {
            state.showMagic = !state.showMagic
          },
          class: `shrink-0 rounded-md border px-2.5 py-1 text-[11px] transition ${
            state.showMagic
              ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
              : 'border-white/10 text-zinc-400 hover:border-white/20'
          }`,
        },
        'Magic numbers',
      ),

      // Decay arrows toggle
      H(
        'button',
        {
          type: 'button',
          onclick: () => {
            state.showPath = !state.showPath
          },
          class: `shrink-0 rounded-md border px-2.5 py-1 text-[11px] transition ${
            state.showPath
              ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
              : 'border-white/10 text-zinc-400 hover:border-white/20'
          }`,
        },
        'Decay arrows',
      ),

      // Bateman simulator toolbar launcher
      H(
        'button',
        {
          type: 'button',
          onclick: () => {
            state.batemanOpen = true
            state.batemanNuclide = state.selected
            syncUrl(state.selected)
          },
          class: `flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
            state.batemanOpen
              ? 'border-amber-400/70 bg-amber-400/20 text-amber-200'
              : 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
          }`,
        },
        H('span', null, '⏱ Bateman Simulator'),
        H(
          'span',
          {
            class:
              'rounded bg-amber-400/20 px-1 py-0.2 font-mono text-[9px] uppercase tracking-wider text-amber-300',
          },
          'Interactive',
        ),
      ),

      // Liquid-Drop SEMF & Fission toolbar launcher
      H(
        'button',
        {
          type: 'button',
          onclick: () => {
            state.semfOpen = true
            state.semfNuclide = state.selected
            syncUrl(state.selected)
          },
          class: `flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
            state.semfOpen
              ? 'border-teal-400/70 bg-teal-400/20 text-teal-200'
              : 'border-teal-400/40 bg-teal-400/10 text-teal-300 hover:bg-teal-400/20'
          }`,
        },
        H('span', null, '🔬 SEMF & Fission'),
        H(
          'span',
          {
            class:
              'rounded bg-teal-400/20 px-1 py-0.2 font-mono text-[9px] uppercase tracking-wider text-teal-300',
          },
          'Liquid-Drop',
        ),
      ),

      // Stellar Nucleosynthesis toolbar launcher
      H(
        'button',
        {
          type: 'button',
          onclick: () => {
            state.astroOpen = true
            state.astroNuclide = state.selected
            syncUrl(state.selected)
          },
          class: `flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
            state.astroOpen
              ? 'border-purple-400/70 bg-purple-400/20 text-purple-200'
              : 'border-purple-400/40 bg-purple-400/10 text-purple-300 hover:bg-purple-400/20'
          }`,
        },
        H('span', null, '✦ Cosmic Origins'),
        H(
          'span',
          {
            class:
              'rounded bg-purple-400/20 px-1 py-0.2 font-mono text-[9px] uppercase tracking-wider text-purple-300',
          },
          'Astrophysics',
        ),
      ),

      // Radiation Shielding toolbar launcher
      H(
        'button',
        {
          type: 'button',
          onclick: () => {
            state.shieldingOpen = true
            state.shieldingNuclide = state.selected
            syncUrl(state.selected)
          },
          class: `flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
            state.shieldingOpen
              ? 'border-cyan-400/70 bg-cyan-400/20 text-cyan-200'
              : 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20'
          }`,
        },
        H('span', null, '🛡️ Radiation Shielding'),
        H(
          'span',
          {
            class:
              'rounded bg-cyan-400/20 px-1 py-0.2 font-mono text-[9px] uppercase tracking-wider text-cyan-300',
          },
          'ALARA',
        ),
      ),

      // Element search
      H(
        'div',
        { class: 'relative ml-auto shrink-0' },
        H('input', {
          type: 'text',
          value: state.query,
          placeholder: 'Find element (e.g. U, 92, gold)…',
          oninput: (e: Event) => {
            state.query = (e.target as HTMLInputElement).value
          },
          class:
            'h-7 w-48 rounded-md border border-white/10 bg-[#0c1220] px-2.5 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none sm:w-60',
        }),
        state.query.trim() && results.length > 0
          ? H(
              'div',
              {
                class:
                  'absolute right-0 top-full z-30 mt-1 max-h-60 w-60 overflow-y-auto rounded-md border border-white/15 bg-[#0a0f18] p-1 shadow-2xl backdrop-blur',
              },
              ...results.slice(0, 10).map((el) =>
                H(
                  'button',
                  {
                    key: el.number,
                    type: 'button',
                    onclick: () => {
                      showElement(el.number)
                      state.query = ''
                    },
                    class:
                      'flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-mono text-[11px] text-zinc-300 hover:bg-white/10',
                  },
                  H('span', null, `${el.number} · ${el.symbol} — ${el.name}`),
                  H('span', { class: 'text-zinc-500' }, el.category),
                ),
              ),
            )
          : null,
      ),
    ),

    // Legend
    H(
      'div',
      {
        class:
          'relative z-10 flex shrink-0 items-center gap-3 overflow-x-auto border-b border-white/5 bg-[#060910] px-4 py-1 text-[10.5px]',
      },
      state.mode === 'decay'
        ? H(
            'div',
            { class: 'flex flex-wrap items-center gap-x-3 gap-y-1' },
            ...CATS.map((c) =>
              H(
                'span',
                { key: c.key, class: 'flex items-center gap-1.5' },
                H('span', {
                  class: 'h-2 w-2 rounded-sm',
                  style: { background: c.color },
                }),
                H('span', { class: 'text-zinc-400' }, c.label),
                H(
                  'span',
                  { class: 'font-mono text-[9px] text-zinc-600' },
                  counts.get(c.key) ?? 0,
                ),
              ),
            ),
          )
        : H(
            'div',
            { class: 'flex items-center gap-2 font-mono text-[9.5px] text-zinc-400' },
            H('span', null, 'log T½:'),
            H('div', {
              class: 'h-2.5 w-56 rounded-sm border border-white/10',
              style: {
                background:
                  'linear-gradient(to right, #450a0a, #991b1b, #d97706, #eab308, #22c55e, #06b6d4, #3b82f6, #1e3a8a)',
              },
            }),
            ...HL_TICKS.map(([label]) => H('span', { key: label }, label)),
            H('span', { class: 'ml-2 flex items-center gap-1' }, [
              H('span', { class: 'inline-block h-2 w-2 rounded-sm border border-white bg-black' }),
              H('span', null, 'stable (white outline)'),
            ]),
          ),
    ),

    // Chart canvas and side panel
    H(
      'div',
      {
        class: 'relative flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row',
      },
      H(
        'div',
        { class: 'relative min-h-0 flex-1' },
        H('elementa-segre-canvas', {
          'data-mode': state.mode,
          'data-magic': String(state.showMagic),
          'data-path': String(state.showPath),
          'data-highlight-z': state.highlightZ != null ? String(state.highlightZ) : '',
          'data-selected-z': sel ? String(sel.z) : '',
          'data-selected-n': sel ? String(sel.n) : '',
        }),
      ),
      sel
        ? NuclidePanelNexus({
            nuc: sel,
            showPath: state.showPath,
            onTogglePath: () => {
              state.showPath = !state.showPath
            },
            onClose: () => {
              state.selected = null
              syncUrl(null)
            },
            onSelect: (nu) => selectNuclide(nu),
            onOpenBateman: (nu) => {
              state.batemanNuclide = nu
              state.batemanOpen = true
              syncUrl(nu)
            },
            onOpenSemf: (nu) => {
              state.semfNuclide = nu
              state.semfOpen = true
              syncUrl(nu)
            },
            onOpenAstro: (nu) => {
              state.astroNuclide = nu
              state.astroOpen = true
              syncUrl(nu)
            },
            onOpenShielding: (nu) => {
              state.shieldingNuclide = nu
              state.shieldingOpen = true
              syncUrl(nu)
            },
          })
        : null,
    ),

    // Bateman Simulator Modal
    state.batemanOpen
      ? H('elementa-bateman-modal', {
          'data-z': String(state.batemanNuclide?.z ?? sel?.z ?? 56),
          'data-n': String(state.batemanNuclide?.n ?? sel?.n ?? 84),
          onclosebateman: () => {
            state.batemanOpen = false
            state.batemanNuclide = null
            syncUrl(state.selected)
          },
          onselectbatemannuclide: (e: CustomEvent) => {
            selectNuclide(e.detail.nuclide)
          },
        })
      : null,

    // Liquid-Drop SEMF & Fission Modal
    state.semfOpen
      ? H('elementa-semf-modal', {
          'data-z': String(state.semfNuclide?.z ?? sel?.z ?? 92),
          'data-n': String(state.semfNuclide?.n ?? sel?.n ?? 143),
          onclosesemf: () => {
            state.semfOpen = false
            state.semfNuclide = null
            syncUrl(state.selected)
          },
          onselectsemfnuclide: (e: CustomEvent) => {
            selectNuclide(e.detail.nuclide)
          },
        })
      : null,

    // Stellar Nucleosynthesis & Cosmic Origins Modal
    state.astroOpen
      ? H('elementa-nucleosynthesis-modal', {
          'data-z': String(state.astroNuclide?.z ?? sel?.z ?? 26),
          'data-n': String(state.astroNuclide?.n ?? sel?.n ?? 30),
          onclosenucleosynthesis: () => {
            state.astroOpen = false
            state.astroNuclide = null
            syncUrl(state.selected)
          },
          onselectnucleosynthesisnuclide: (e: CustomEvent) => {
            selectNuclide(e.detail.nuclide)
          },
        })
      : null,

    // Radiation Shielding & Particle Attenuation Modal
    state.shieldingOpen
      ? H('elementa-shielding-modal', {
          'data-z': String(state.shieldingNuclide?.z ?? sel?.z ?? 55),
          'data-n': String(state.shieldingNuclide?.n ?? sel?.n ?? 82),
          oncloseshielding: () => {
            state.shieldingOpen = false
            state.shieldingNuclide = null
            syncUrl(state.selected)
          },
          onselectshieldingnuclide: (e: CustomEvent) => {
            selectNuclide(e.detail.nuclide)
          },
        })
      : null,
  )
}
