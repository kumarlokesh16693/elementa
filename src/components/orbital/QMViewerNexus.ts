import { h, reactive, type VNode } from 'nexus-framework'
import { getElement } from '@/lib/periodic'
import {
  combosOf,
  defaultSelection,
  occupancyOf,
  orbitalLabel,
  parseConfig,
  slaterZeff,
  subshellLabel,
  type RealOrbital,
} from '@/lib/orbital'
import './orbital-element'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

interface QMViewerProps {
  z: number
  paused?: boolean
  speed?: number
}

const qmStateMap = new Map<number, any>()

function getQmState(z: number, occupied: any) {
  let s = qmStateMap.get(z)
  if (!s) {
    const defSel = defaultSelection(occupied)
    s = reactive({
      sel: defSel,
      mode: 'surface' as 'surface' | 'cloud',
      isoT: 0.7,
    })
    qmStateMap.set(z, s)
  }
  return s
}

export function QMViewerNexus({ z, paused = false, speed = 1 }: QMViewerProps): VNode {
  const el = getElement(z)!
  const occupied = parseConfig(el.config)
  const state = getQmState(z, occupied)

  const sel = state.sel
  const isoRaw = 0.03 + Math.pow(state.isoT, 2.2) * 0.32
  const occ = occupancyOf(occupied, sel.n, sel.l)
  const { zeff, sigma } = slaterZeff(el.number, { n: sel.n, l: sel.l, e: occ }, occupied)
  const combos = combosOf(sel.l)
  const comboIdx = Math.max(
    0,
    combos.findIndex((c) => c.m === sel.m && c.sin === sel.sin),
  )

  const pickSubshell = (n: number, l: number) => {
    const c = combosOf(l)[0]
    state.sel = { n, l, m: c.m, sin: c.sin }
  }

  return H(
    'div',
    { class: 'flex h-full min-h-0 flex-col' },
    // Canvas container
    H(
      'div',
      { class: 'relative min-h-0 flex-1' },
      H('elementa-orbital-view', {
        'data-n': sel.n,
        'data-l': sel.l,
        'data-m': sel.m,
        'data-sin': sel.sin,
        'data-zeff': zeff,
        'data-mode': state.mode,
        'data-iso': isoRaw,
        'data-rotate': String(!paused),
        'data-speed': String(speed),
      }),
      H(
        'div',
        {
          class:
            'pointer-events-none absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[9.5px] text-zinc-300 backdrop-blur-sm',
        },
        `${orbitalLabel(sel)} · Z`,
        H('sub', null, 'eff'),
        ` ${zeff.toFixed(2)} · ${occ > 0 ? `${occ} e⁻` : 'virtual'}`,
      ),
      H(
        'div',
        {
          class:
            'pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 font-mono text-[9px] text-zinc-500',
        },
        H(
          'span',
          { class: 'flex items-center gap-1' },
          H('span', { class: 'inline-block h-1.5 w-1.5 rounded-full bg-amber-400' }),
          ' ψ>0',
        ),
        H(
          'span',
          { class: 'flex items-center gap-1' },
          H('span', { class: 'inline-block h-1.5 w-1.5 rounded-full bg-teal-400' }),
          ' ψ<0',
        ),
        H('span', { class: 'hidden sm:inline' }, '· drag to orbit · scroll to zoom'),
      ),
    ),

    // Bottom controls
    H(
      'div',
      { class: 'relative z-10 shrink-0 space-y-2 border-t border-white/10 px-3 py-2' },
      // Subshell chips
      H(
        'div',
        { class: 'flex flex-wrap items-center gap-1.5' },
        ...occupied.map((s) => {
          const active = sel.n === s.n && sel.l === s.l
          return H(
            'button',
            {
              type: 'button',
              onclick: () => pickSubshell(s.n, s.l),
              class: `rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none transition ${
                active
                  ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                  : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
              }`,
            },
            subshellLabel(s),
          )
        }),
        H(
          'span',
          { class: 'ml-auto font-mono text-[9px] text-zinc-600' },
          `σ = ${sigma.toFixed(2)} · Slater rules`,
        ),
      ),

      // Toolbar
      H(
        'div',
        { class: 'flex flex-wrap items-center gap-2' },
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
              class: `px-2 py-0.5 text-[10px] lowercase transition ${
                state.mode === 'surface' ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
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
              class: `px-2 py-0.5 text-[10px] lowercase transition ${
                state.mode === 'cloud' ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`,
            },
            'cloud',
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
              'rounded-md border border-white/10 bg-[#0c1220] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 focus:outline-none',
          },
          ...combos.map((c, i) =>
            H(
              'option',
              { value: i, class: 'bg-[#0c1220]', selected: i === comboIdx },
              `${sel.n}${c.suffix ? `_${c.suffix}` : ''}`,
            ),
          ),
        ),
        H(
          'div',
          { class: 'flex items-center gap-1.5' },
          H('span', { class: 'font-mono text-[9px] text-zinc-500' }, 'iso'),
          H('input', {
            type: 'range',
            min: '0',
            max: '1',
            step: '0.02',
            value: String(state.isoT),
            oninput: (e: Event) => {
              state.isoT = parseFloat((e.target as HTMLInputElement).value)
            },
            class: 'w-16',
            'aria-label': 'Isosurface threshold',
          }),
        ),
        H(
          'a',
          {
            href: `./orbitals.html?z=${z}`,
            class:
              'ml-auto rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-300 transition hover:bg-sky-400/20',
          },
          'open orbital lab →',
        ),
      ),
    ),
  )
}
