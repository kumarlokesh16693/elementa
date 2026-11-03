import { h, reactive, type VNode } from 'nexus-framework'
import type { ElementData } from '@/lib/periodic/types'
import { ELEMENTS, getElement } from '@/lib/periodic'
import {
  ISOTOPES,
  DECAY_CHAINS,
  SERIES_NOTE,
  daughterOf,
  type DecayChain,
  type IsoEntry,
} from '@/lib/periodic/isotopes'

interface IsotopeModalProps {
  element: ElementData
  accent: string
  open: boolean
  onClose: () => void
}

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

/** Modal-local view state (survives re-renders; reset when opened for another element). */
const state = reactive({ z: 0, chain: null as string | null })
/** Plain (non-reactive) bookkeeping for the open/element sync above. */
let lastOpen = false
let lastHostZ = -1

function CloseIcon(): VNode {
  return H('svg', {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2.2,
    'stroke-linecap': 'round',
    'aria-hidden': 'true',
  },
    H('line', { x1: 18, y1: 6, x2: 6, y2: 18 }),
    H('line', { x1: 6, y1: 6, x2: 18, y2: 18 }))
}

const MODE_TINT: Record<string, string> = {
  α: '#fbbf24',
  'β⁻': '#38bdf8',
  'β⁺': '#c084fc',
  EC: '#c084fc',
  '2β⁻': '#38bdf8',
  SF: '#fb7185',
  IT: '#a1a1aa',
}

function modeTint(mode: string): string {
  if (MODE_TINT[mode]) return MODE_TINT[mode]
  if (mode.includes('α')) return '#fbbf24'
  if (mode.includes('β⁻')) return '#38bdf8'
  if (mode.includes('EC')) return '#c084fc'
  return '#a1a1aa'
}

/* ------------------------------ isotope table ------------------------------ */

function IsotopeTable({ el, accent }: { el: ElementData; accent: string }): VNode {
  const rows = ISOTOPES[el.number] ?? []
  if (rows.length === 0) {
    return H('p', { class: 'text-[11px] text-zinc-500' }, 'No isotope data tracked for this element.')
  }
  return H('div', { class: 'overflow-x-auto rounded-lg border border-white/10' },
    H('table', { class: 'w-full min-w-[560px] border-collapse text-left' },
      H('thead', null,
        H('tr', { class: 'bg-white/[0.04] text-[9px] uppercase tracking-wider text-zinc-500' },
          H('th', { class: 'px-2.5 py-1.5 font-medium' }, 'Nuclide'),
          H('th', { class: 'px-2.5 py-1.5 font-medium' }, 'Natural abundance'),
          H('th', { class: 'px-2.5 py-1.5 font-medium' }, 'Half-life'),
          H('th', { class: 'px-2.5 py-1.5 font-medium' }, 'Decay →'),
          H('th', { class: 'px-2.5 py-1.5 font-medium' }, 'Note'))),
      H('tbody', null,
        rows.map((r: IsoEntry, i) => {
          const stable = r.abundance != null && !r.halfLife
          const daughter = daughterOf(el.number, r.a, r.decay)
          return H('tr', {
            key: `${r.a}-${i}`,
            class: `border-t border-white/5 text-[11px] ${
              stable ? 'bg-emerald-400/[0.05]' : i % 2 ? 'bg-white/[0.015]' : ''
            }`,
          },
            H('td', { class: 'whitespace-nowrap px-2.5 py-1.5 font-mono' },
              H('sup', { class: 'text-zinc-500' }, String(r.a)),
              H('span', { class: 'ml-0.5 font-semibold', style: { color: accent } }, el.symbol),
              r.note?.includes('(ᵐ)') || r.halfLife?.includes('(ᵐ)')
                ? H('span', { class: 'ml-1 text-[9px] text-zinc-500' }, 'isomer')
                : null,
              stable
                ? H('span', { class: 'ml-1.5 rounded bg-emerald-400/15 px-1 py-px text-[8.5px] text-emerald-300' }, 'stable')
                : null),
            H('td', { class: 'whitespace-nowrap px-2.5 py-1.5 font-mono text-zinc-300' },
              r.abundance != null ? `${r.abundance}%` : '—'),
            H('td', { class: 'whitespace-nowrap px-2.5 py-1.5 font-mono text-zinc-300' },
              r.halfLife ?? (stable ? '≥ 10¹⁵ a' : '—')),
            H('td', { class: 'whitespace-nowrap px-2.5 py-1.5 font-mono' },
              r.decay
                ? [
                    H('span', { style: { color: modeTint(r.decay) } }, r.decay),
                    daughter ? H('span', { class: 'text-zinc-500' }, ` → ${daughter}`) : null,
                  ]
                : H('span', { class: 'text-zinc-600' }, '—')),
            H('td', { class: 'px-2.5 py-1.5 text-[10.5px] leading-snug text-zinc-400' },
              r.note ?? ''))
        }))))
}

/* ------------------------------ chain flow ------------------------------ */

function ChainStepBox({ z, a, halfLife, mode, highlight }: {
  z: number
  a: number
  halfLife: string
  mode: string
  highlight: boolean
}): VNode | null {
  const el = getElement(z)
  if (!el) return null
  const stable = halfLife === 'stable'
  return H('div', {
    class: `w-[86px] shrink-0 rounded-lg border px-1 py-1.5 text-center ${
      stable ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/12 bg-white/[0.03]'
    } ${highlight ? 'ring-1 ring-sky-400/70' : ''}`,
  },
    H('div', { class: 'font-mono text-[9px] leading-none text-zinc-500' }, String(a)),
    H('div', {
      class: 'text-[15px] font-bold leading-tight',
      style: { color: stable ? '#34d399' : '#e4e4e7' },
    }, el.symbol),
    H('div', { class: 'font-mono text-[8.5px] leading-tight text-zinc-400' },
      stable ? 'stable' : halfLife),
    mode && !stable
      ? H('div', { class: 'mt-0.5 text-[9px] font-medium leading-none', style: { color: modeTint(mode) } }, mode)
      : null)
}

function ChainArrow({ mode }: { mode: string }): VNode {
  return H('div', { class: 'flex w-6 shrink-0 flex-col items-center justify-center' },
    H('span', { class: 'text-[8px] leading-none', style: { color: modeTint(mode) } }, mode),
    H('span', { class: 'text-[12px] leading-none text-zinc-600' }, '→'))
}

function DecayChainView({ chain, z }: { chain: DecayChain; z: number }): VNode {
  return H('div', { class: 'rounded-lg border border-white/10 bg-black/20 p-3' },
    H('div', { class: 'mb-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1' },
      H('span', { class: 'text-[12px] font-semibold text-zinc-200' }, chain.name),
      H('span', { class: 'font-mono text-[10px] text-zinc-500' },
        `${chain.family} family · ${chain.head} → ${chain.terminal} · ${chain.steps.length - 1} decays`),
      H('span', { class: 'ml-auto font-mono text-[9px] text-zinc-600' },
        'α = helium nucleus · β⁻ = electron emission')),
    H('div', { class: 'flex flex-wrap items-center gap-y-3' },
      chain.steps.map((s, i) => H('div', { key: i, class: 'flex items-center' },
        ChainStepBox({ z: s.z, a: s.a, halfLife: s.halfLife, mode: s.mode, highlight: s.z === z }),
        i < chain.steps.length - 1 ? ChainArrow({ mode: chain.steps[i].mode }) : null))),
    H('p', { class: 'mt-2.5 text-[9.5px] leading-relaxed text-zinc-600' },
      'Main decay path; secondary branches (e.g. ²¹²Bi → ²⁰⁸Tl, ~36% α branch) omitted for clarity. Blue outline marks boxes containing the currently selected element.'))
}

/* ------------------------------ main modal ------------------------------ */

export default function IsotopeModal({ element, accent, open, onClose }: IsotopeModalProps): VNode {
  if (!open) {
    lastOpen = false
    return H('span', { class: 'hidden' })
  }

  /* Mirrors the React effect deps `[open, element.number]`: reset the explorer
     when it opens, or when the host element changes — but never when the user
     picks a different element inside the modal. */
  if (!lastOpen || lastHostZ !== element.number) {
    lastHostZ = element.number
    if (state.z !== element.number) state.z = element.number
    state.chain = null
  }
  lastOpen = true

  const el = getElement(state.z) ?? element
  const containing = DECAY_CHAINS.find((c) => c.steps.some((s) => s.z === state.z))
  const activeKey = state.chain ?? containing?.key ?? '4n2'
  const chain = DECAY_CHAINS.find((c) => c.key === activeKey) ?? DECAY_CHAINS[0]
  const accentEl = accent

  return H('div', {
    class: 'modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6',
    onClick: onClose,
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': `${el.name} isotope explorer`,
  },
    H('div', {
      class: 'modal-card flex h-full max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0f18] shadow-2xl',
      onClick: (event: Event) => event.stopPropagation(),
    },
      // header
      H('div', { class: 'flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 px-4 py-3' },
        H('div', {
          class: 'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border',
          style: { background: `${accentEl}1f`, borderColor: `${accentEl}80` },
        },
          H('span', { class: 'font-mono text-[8px] leading-none opacity-75', style: { color: accentEl } }, String(el.number)),
          H('span', { class: 'text-base font-bold leading-tight', style: { color: accentEl } }, el.symbol)),
        H('div', { class: 'min-w-0' },
          H('div', { class: 'truncate text-sm font-semibold text-zinc-100' }, `${el.name} — isotope explorer`),
          H('div', { class: 'font-mono text-[10px] text-zinc-500' },
            `${el.mass} u · ${el.radioactive ? 'all isotopes radioactive' : 'stable element'} · data: notable isotopes, not exhaustive`)),
        H('select', {
          /* `value` on <select> is applied before its options exist, so the
             matching <option> is flagged with `selected` instead. */
          onChange: (event: Event) => {
            state.z = Number((event.target as HTMLSelectElement).value)
            state.chain = null
          },
          'aria-label': 'Pick element',
          class: 'ml-auto rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none',
        },
          ELEMENTS.map((e2) => H('option', {
            key: e2.number,
            value: String(e2.number),
            selected: e2.number === state.z,
          }, `${e2.number} · ${e2.symbol} — ${e2.name}`))),
        H('button', {
          type: 'button',
          onClick: onClose,
          'aria-label': 'Close isotope explorer',
          class: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-white/30 hover:text-zinc-100',
        }, CloseIcon())),
      // body
      H('div', { class: 'min-h-0 flex-1 space-y-5 overflow-y-auto p-4' },
        H('section', { class: 'space-y-2' },
          H('h3', { class: 'flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            H('span', { class: 'inline-block h-3 w-[3px] rounded-full', style: { background: accentEl } }),
            `Key isotopes of ${el.name}`),
          IsotopeTable({ el, accent: accentEl })),
        H('section', { class: 'space-y-2' },
          H('h3', { class: 'flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            H('span', { class: 'inline-block h-3 w-[3px] rounded-full', style: { background: accentEl } }),
            'Natural radioactive decay series'),
          H('div', { class: 'flex flex-wrap gap-1.5' },
            DECAY_CHAINS.map((c) => H('button', {
              key: c.key,
              type: 'button',
              onClick: () => { state.chain = c.key },
              class: `rounded-full border px-2.5 py-1 text-[10.5px] transition ${
                c.key === activeKey
                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                  : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
              }`,
            }, `${c.name} (${c.family})`))),
          DecayChainView({ chain, z: state.z }),
          H('p', { class: 'text-[9.5px] leading-relaxed text-zinc-600' }, SERIES_NOTE)))))
}
