import { h, type VNode } from 'nexus-framework'
import { APP_VERSION, DATASETS, DATA_RETRIEVED, MODEL_TIERS, TIER_META, type ModelKey } from '@/lib/provenance'
import { CONSTANTS } from '@/lib/constants'
import { buildBibTeX } from '@/lib/citation'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'

function H(tag: any, props?: any, ...children: any[]): VNode { return h(tag, props, ...children) as VNode }

function Section({ title, accent, children }: { title: string; accent: string; children: VNode }): VNode {
  return H('section', { class: 'space-y-2' },
    H('h2', { class: 'text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' }, accent + ' - ' + title),
    children)
}

export default function ReferencesPage(): VNode {
  const bibtex = buildBibTeX()
  const modelKeys = Object.keys(MODEL_TIERS) as ModelKey[]

  const datasetRows = DATASETS.map((dataset) => H('tr', { key: dataset.id, class: 'border-t border-white/[0.06]' },
    H('td', { class: 'px-3 py-2 text-[11px] text-zinc-200' }, dataset.title),
    H('td', { class: 'px-3 py-2 text-[10px] text-zinc-400' }, dataset.publisher),
    H('td', { class: 'px-3 py-2 font-mono text-[10px] text-zinc-300' }, dataset.version),
    H('td', { class: 'px-3 py-2 font-mono text-[10px] text-zinc-400' }, dataset.retrieved),
    H('td', { class: 'px-3 py-2 text-[10px] text-zinc-400' }, dataset.license),
    H('td', { class: 'px-3 py-2 text-[10px] leading-relaxed text-zinc-500' }, dataset.note),
  ))
  const registrySection = H(Section, { key: 'registry', title: 'Dataset registry', accent: '#38bdf8' },
    H('div', { class: 'overflow-hidden rounded-xl border border-white/10 bg-[#0a0f18]' },
      H('div', { class: 'overflow-x-auto' },
        H('table', { class: 'w-full border-collapse text-left' },
          H('thead', null, H('tr', { class: 'bg-white/[0.035]' },
            H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Dataset'),
            H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Publisher'),
            H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Version'),
            H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Retrieved'),
            H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'License'),
            H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Notes'),
          )),
          H('tbody', null, ...datasetRows),
        ),
      ),
    ),
  )

  const modelsSection = H(Section, { key: 'models', title: 'Model tiers', accent: '#fbbf24' },
    H('div', { class: 'space-y-2' },
      ...modelKeys.map((key) => {
        const tier = MODEL_TIERS[key]
        const meta = TIER_META[tier.tier]
        return H('article', { key, class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          H('div', { class: 'flex flex-wrap items-center gap-2' },
            H('h3', { class: 'text-[12px] font-semibold text-zinc-100' }, key),
            H('span', { class: 'rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider', style: { color: meta.color, borderColor: meta.color + '66', background: meta.color + '14' } }, meta.label),
            H('span', { class: 'ml-auto font-mono text-[9px] text-zinc-500' }, 'view: ' + key)),
          H('p', { class: 'mt-1 text-[10px] leading-relaxed text-zinc-500' }, tier.note),
          H('p', { class: 'mt-1 text-[9px] leading-relaxed text-zinc-600' }, meta.description))
      })))

  const citationSection = H('section', { class: 'space-y-2' },
    H('h2', { class: 'text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' }, '#0ea5e9 - Software citation'),
    H('p', { class: 'text-[11px] text-zinc-400' }, 'ELEMENTA v' + APP_VERSION + ' - data retrieved ' + DATA_RETRIEVED + '. Primary sources are named in the registry; derived fields and model labels are attributed to this application.'),
    H('pre', { class: 'overflow-auto rounded-lg border border-white/10 bg-[#070a10] p-2 font-mono text-[9px] text-zinc-400' }, bibtex),
    H('div', { class: 'flex flex-wrap gap-2' },
      H('a', { href: './integrity.html', class: 'rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300 transition hover:bg-emerald-400/20' }, 'Data integrity report'),
      H('a', { href: './index.html', class: 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-300 transition hover:bg-white/5' }, 'Back to the periodic table')))

  const constantsSection = H('section', { class: 'space-y-2' },
    H('h2', { class: 'text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' }, '#a78bfa - CODATA 2022 constants used by the physics models'),
    H('div', { class: 'overflow-x-auto rounded-xl border border-white/10 bg-[#0a0f18]' },
      H('table', { class: 'w-full border-collapse text-left' },
        H('thead', null, H('tr', { class: 'bg-white/[0.035]' },
          H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Symbol'),
          H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Quantity'),
          H('th', { class: 'px-3 py-2 text-right text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Recommended value'),
          H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Uncertainty'))),
        H('tbody', null, ...CONSTANTS.map((constant) => H('tr', { key: constant.symbol, class: 'border-t border-white/[0.06]' },
          H('td', { class: 'px-3 py-2 font-mono text-[10px] text-amber-300' }, constant.symbol),
          H('td', { class: 'px-3 py-2 text-[10px] text-zinc-400' }, constant.name),
          H('td', { class: 'px-3 py-2 text-right font-mono text-[10px] text-zinc-300' }, constant.value.toExponential(6) + ' ' + constant.unit),
          H('td', { class: 'px-3 py-2 text-right font-mono text-[10px] text-zinc-400' }, constant.exact ? 'exact' : '- ' + constant.uncertainty.toExponential(1))))))))

  return H('div', { class: 'min-h-dvh bg-[#070a10] text-zinc-200' },
    H('header', { class: 'sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur' },
      H('div', { class: 'flex items-center gap-2.5' },
        ElementaLogo({ size: 26 }),
        H('h1', { class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100' }, 'ELEM', H('span', { class: 'text-amber-400' }, 'E'), 'NTA'),
      ),
      H('span', { class: 'hidden font-mono text-[10px] text-zinc-500 lg:inline' }, 'dataset registry, citations and model tiers'),
      H('a', { href: './index.html', class: 'ml-auto shrink-0 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200' }, 'Back to the periodic table'),
      GitHubLink()),
    H('main', { class: 'mx-auto max-w-5xl space-y-5 p-4 lg:p-6 lg:space-y-6' },
      registrySection,
      modelsSection,
      citationSection,
      constantsSection))
}
