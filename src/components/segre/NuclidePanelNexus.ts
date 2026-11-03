import { h, type VNode } from 'nexus-framework'
import {
  catOf,
  CATS,
  formatHl,
  formatHlSci,
  atomicMassU,
  qFor,
  chainOf,
  decayLabel,
  type Nuclide,
} from '@/lib/periodic/nuclides'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

interface Props {
  nuc: Nuclide
  showPath: boolean
  onTogglePath: () => void
  onClose: () => void
  onSelect: (n: Nuclide) => void
  onOpenBateman?: (n: Nuclide) => void
  onOpenSemf?: (n: Nuclide) => void
  onOpenAstro?: (n: Nuclide) => void
  onOpenShielding?: (n: Nuclide) => void
}

function fmtQ(q: number): string {
  const a = Math.abs(q)
  if (a >= 1000) return `${(q / 1000).toFixed(2)} MeV`
  if (a >= 100) return `${q.toFixed(0)} keV`
  if (a >= 10) return `${q.toFixed(1)} keV`
  return `${q.toFixed(2)} keV`
}

const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
function sup(v: number): string {
  return String(v)
    .split('')
    .map((ch) => SUPS[+ch] ?? ch)
    .join('')
}

export function NuclidePanelNexus({
  nuc,
  showPath,
  onTogglePath,
  onClose,
  onSelect,
  onOpenBateman,
  onOpenSemf,
  onOpenAstro,
  onOpenShielding,
}: Props): VNode {
  const cat = catOf(nuc)
  const catInfo = CATS.find((c) => c.key === cat)!
  const chain = chainOf(nuc)
  const mass = atomicMassU(nuc)

  return H(
    'aside',
    {
      class:
        'pointer-events-auto flex max-h-[52dvh] w-full flex-col overflow-hidden rounded-t-xl border border-white/10 bg-[#0a0f18]/97 shadow-2xl backdrop-blur md:max-h-none md:w-[342px] md:rounded-none md:border-y-0 md:border-r-0',
      'data-testid': 'nuclide-panel',
    },
    // Header
    H(
      'div',
      { class: 'flex shrink-0 items-start gap-3 border-b border-white/10 px-4 py-3' },
      H(
        'div',
        { class: 'min-w-0' },
        H(
          'div',
          { class: 'flex items-baseline gap-2' },
          H('span', { class: 'text-[13px] font-semibold text-zinc-400' }, sup(nuc.a)),
          H('span', { class: 'truncate text-[26px] font-bold leading-none text-zinc-50' }, nuc.sym),
          H(
            'span',
            {
              class: 'rounded px-1.5 py-0.5 text-[10px] font-medium',
              style: { background: `${catInfo.color}22`, color: catInfo.color },
            },
            catInfo.label,
          ),
        ),
        H(
          'div',
          { class: 'mt-1 font-mono text-[10.5px] text-zinc-500' },
          `Z ${nuc.z} · N ${nuc.n} · A ${nuc.a}${nuc.z === 0 ? ' · free neutron' : ''}`,
        ),
      ),
      H(
        'button',
        {
          type: 'button',
          'aria-label': 'Close nuclide details',
          onclick: onClose,
          class:
            'ml-auto shrink-0 rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-white/30 hover:text-zinc-100',
        },
        '✕',
      ),
    ),

    // Content body
    H(
      'div',
      { class: 'min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-3' },
      // Half-life section
      H(
        'section',
        null,
        H('div', { class: 'mb-1 text-[9px] uppercase tracking-wider text-zinc-500' }, 'Half-life'),
        H(
          'div',
          { class: 'font-mono text-[15px] font-semibold text-amber-300' },
          formatHl(nuc),
        ),
        formatHlSci(nuc)
          ? H(
              'div',
              { class: 'font-mono text-[10.5px] text-zinc-500' },
              `${formatHlSci(nuc)}${nuc.hlOp !== '' ? ' (experimental bound)' : ''}`,
            )
          : null,
        nuc.unbound
          ? H(
              'p',
              { class: 'mt-1 text-[10.5px] leading-relaxed text-zinc-500' },
              'This nuclide is particle-unbound — observed only as a resonance; the value quoted is its width, not a lifetime.',
            )
          : null,
      ),

      // Decay modes
      nuc.decays.length > 0
        ? H(
            'section',
            null,
            H(
              'div',
              { class: 'mb-1.5 text-[9px] uppercase tracking-wider text-zinc-500' },
              'Decay modes & Q values',
            ),
            H(
              'div',
              { class: 'space-y-1' },
              ...nuc.decays.map((d) => {
                const q = qFor(nuc, d.code)
                return H(
                  'div',
                  {
                    key: d.code,
                    class:
                      'flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px]',
                  },
                  H('span', { class: 'font-semibold text-zinc-100' }, decayLabel(d.code)),
                  H(
                    'span',
                    { class: 'text-zinc-500' },
                    d.pct != null ? `${d.pct}%` : 'branch % not given',
                  ),
                  H(
                    'span',
                    { class: 'ml-auto text-[10.5px] text-sky-300/90' },
                    q != null ? `Q ${fmtQ(q)}` : '',
                  ),
                )
              }),
            ),
            H(
              'p',
              { class: 'mt-1 text-[9.5px] leading-relaxed text-zinc-600' },
              'Q computed on the fly from ground-state atomic mass excesses (daughter must be known).',
            ),
          )
        : null,

      // Decay chain
      chain.length > 1
        ? H(
            'section',
            null,
            H(
              'div',
              { class: 'mb-1.5 text-[9px] uppercase tracking-wider text-zinc-500' },
              `Dominant decay chain (${chain.length} steps)`,
            ),
            H(
              'div',
              { class: 'flex flex-wrap items-center gap-1' },
              ...chain.map((c, i) =>
                H(
                  'span',
                  { key: `${c.z}:${c.n}`, class: 'flex items-center gap-1' },
                  i > 0
                    ? H(
                        'span',
                        { class: 'text-[9.5px] text-zinc-600' },
                        `${decayLabel(chain[i - 1].decays[0]?.code ?? '')} →`,
                      )
                    : null,
                  H(
                    'button',
                    {
                      type: 'button',
                      onclick: () => onSelect(c),
                      class: `rounded border px-1.5 py-0.5 font-mono text-[10.5px] transition hover:brightness-125 ${
                        c.stable
                          ? 'border-white/40 bg-white/10 font-semibold text-white'
                          : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/30'
                      }`,
                    },
                    `${c.sym}-${c.a}`,
                  ),
                ),
              ),
            ),
          )
        : null,

      // Bateman Simulator action button
      chain.length > 1 && onOpenBateman
        ? H(
            'div',
            { class: 'pt-1' },
            H(
              'button',
              {
                type: 'button',
                onclick: () => onOpenBateman(nuc),
                class:
                  'flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-400/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-400/20',
              },
              H('span', null, '⏱ Simulate in Bateman Lab'),
              H('span', { class: 'text-[9px]' }, '↗'),
            ),
          )
        : null,

      // SEMF & Nuclear Fission action button
      onOpenSemf
        ? H(
            'div',
            { class: 'pt-1' },
            H(
              'button',
              {
                type: 'button',
                onclick: () => onOpenSemf(nuc),
                class:
                  'flex w-full items-center justify-center gap-1.5 rounded-lg border border-teal-400/35 bg-teal-400/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-teal-300 transition hover:border-teal-400/60 hover:bg-teal-400/20',
              },
              H('span', null, '🔬 Liquid-Drop SEMF & Fission'),
              H('span', { class: 'text-[9px]' }, '↗'),
            ),
          )
        : null,

      // Cosmic Origins & Nucleosynthesis action button
      onOpenAstro
        ? H(
            'div',
            { class: 'pt-1' },
            H(
              'button',
              {
                type: 'button',
                onclick: () => onOpenAstro(nuc),
                class:
                  'flex w-full items-center justify-center gap-1.5 rounded-lg border border-purple-400/35 bg-purple-400/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-purple-300 transition hover:border-purple-400/60 hover:bg-purple-400/20',
              },
              H('span', null, '✦ Cosmic Origins & Nucleosynthesis'),
              H('span', { class: 'text-[9px]' }, '↗'),
            ),
          )
        : null,

      // Radiation Shielding & Particle Attenuation Lab
      onOpenShielding
        ? H(
            'div',
            { class: 'pt-1' },
            H(
              'button',
              {
                type: 'button',
                onclick: () => onOpenShielding(nuc),
                class:
                  'flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-400/20',
              },
              H('span', null, '🛡️ Radiation Shielding Lab'),
              H('span', { class: 'text-[9px]' }, '↗'),
            ),
          )
        : null,

      // Properties
      H(
        'section',
        null,
        H('div', { class: 'mb-1.5 text-[9px] uppercase tracking-wider text-zinc-500' }, 'Properties'),
        H(
          'dl',
          { class: 'grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]' },
          H('dt', { class: 'text-zinc-500' }, 'Spin-parity'),
          H('dd', { class: 'text-right text-zinc-200' }, nuc.jp || '—'),
          H('dt', { class: 'text-zinc-500' }, 'Nat. abundance'),
          H(
            'dd',
            { class: 'text-right text-zinc-200' },
            nuc.abundance != null ? `${nuc.abundance}%` : '—',
          ),
          H('dt', { class: 'text-zinc-500' }, 'Atomic mass'),
          H('dd', { class: 'text-right text-zinc-200' }, mass != null ? `${mass.toFixed(5)} u` : '—'),
          H('dt', { class: 'text-zinc-500' }, 'Mass excess'),
          H(
            'dd',
            { class: 'text-right text-zinc-200' },
            nuc.me != null ? `${nuc.me.toLocaleString()} keV` : '—',
          ),
          H('dt', { class: 'text-zinc-500' }, 'Discovered'),
          H('dd', { class: 'text-right text-zinc-200' }, nuc.discovery ?? '—'),
          H('dt', { class: 'text-zinc-500' }, 'Nucleus'),
          H('dd', { class: 'text-right text-zinc-200' }, `${nuc.z}p ${nuc.n}n`),
        ),
      ),

      // Actions
      H(
        'section',
        { class: 'flex flex-wrap gap-1.5' },
        H(
          'button',
          {
            type: 'button',
            onclick: onTogglePath,
            class: `rounded-md border px-2.5 py-1.5 text-[10.5px] font-medium transition ${
              showPath
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/30'
            }`,
          },
          `Decay arrows ${showPath ? 'on' : 'off'}`,
        ),
        nuc.z > 0
          ? H(
              'a',
              {
                href: `./index.html?e=${nuc.z}`,
                class:
                  'rounded-md border border-sky-400/40 bg-sky-400/10 px-2.5 py-1.5 text-[10.5px] font-medium text-sky-300 transition hover:bg-sky-400/20',
              },
              `Element ${nuc.sym} ↗`,
            )
          : null,
      ),

      H(
        'p',
        { class: 'border-t border-white/5 pt-2.5 text-[9px] leading-relaxed text-zinc-600' },
        'Ground-state nuclear data: IAEA LiveChart (ENSDF cut-off 2023-10-18). Branching %, Q values and masses as evaluated by ENSDF; half-life bounds (< / >) reflect the experimental limit where no direct measurement exists.',
      ),
    ),
  )
}
