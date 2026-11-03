import { h, reactive, type VNode } from 'nexus-framework'
import type { ElementData } from '@/lib/periodic/types'
import { blockOf, ELEMENTS } from '@/lib/periodic'
import { APP_VERSION, DATA_RETRIEVED, DATASETS, MODEL_TIERS, TIER_META, massInterval, type ModelKey } from '@/lib/provenance'
import { CONSTANTS, CONVERSION_ROWS, ENERGY_UNITS, convertEnergy, formatConstant, type EnergyUnit } from '@/lib/constants'
import { ELEMENT_CSV_HEADERS, buildBibTeX, buildIssueReport, buildRIS, buildReceipt, copyText, download, elementRows, toCSV, viewHash } from '@/lib/citation'
import { elementCheckSummary } from '@/lib/integrity'

function H(tag: any, props?: any, ...children: any[]): VNode { return h(tag, props, ...children) as VNode }

type Tab = 'overview' | 'cite' | 'units' | 'tiers'

const ui = reactive({
  tab: 'overview' as Tab,
  copied: '',
  note: '',
  amount: '1',
  from: 'eV' as EnergyUnit,
  to: 'kJ/mol' as EnergyUnit,
})

const TABS: Array<[Tab, string]> = [
  ['overview', 'Datasets and integrity'],
  ['cite', 'Cite and export'],
  ['units', 'Constants and units'],
  ['tiers', 'Model tiers'],
]

function flash(message: string): void {
  ui.copied = message
  window.setTimeout(() => { if (ui.copied === message) ui.copied = '' }, 2200)
}

function copy(label: string, text: string): void {
  void copyText(text).then((ok) => flash(ok ? label + ' copied to clipboard' : 'Clipboard access was blocked'))
}

function badge(status: 'pass' | 'warn' | 'fail'): VNode {
  const meta = status === 'pass'
    ? { label: 'pass', color: '#34d399' }
    : status === 'warn'
      ? { label: 'warn', color: '#fbbf24' }
      : { label: 'fail', color: '#fb7185' }
  return H('span', {
    class: 'rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider',
    style: { color: meta.color, borderColor: meta.color + '66', background: meta.color + '14' },
  }, meta.label)
}

function tierBadge(key: ModelKey): VNode {
  const tier = MODEL_TIERS[key]
  const meta = TIER_META[tier.tier]
  return H('span', {
    class: 'shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider',
    style: { color: meta.color, borderColor: meta.color + '66', background: meta.color + '14' },
    title: meta.description,
  }, meta.label)
}

function OverviewTab({ view, hash, elements }: { view: Record<string, unknown>; hash: string; elements: ElementData[] }): VNode {
  const receipt = buildReceipt(view)
  const integrity = elementCheckSummary()
  const bibtex = buildBibTeX({ url: location.href, accessed: DATA_RETRIEVED, title: 'ELEMENTA view export' })
  const ris = buildRIS({ url: location.href, accessed: DATA_RETRIEVED, title: 'ELEMENTA view export' })
  const currentCsv = toCSV(ELEMENT_CSV_HEADERS, elementRows(elements, blockOf, massInterval))
  const fullCsv = toCSV(ELEMENT_CSV_HEADERS, elementRows(ELEMENTS, blockOf, massInterval))

  const receiptCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.025] p-3' },
    H('div', { class: 'flex flex-wrap items-center gap-2' },
      H('h4', { class: 'text-[12px] font-semibold text-zinc-100' }, 'Reproducibility receipt'),
      H('span', { class: 'rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-zinc-400' }, 'v' + APP_VERSION),
      H('span', { class: 'rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-zinc-400' }, 'view ' + hash),
    ),
    H('dl', { class: 'mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px]' },
      H('dt', { class: 'text-zinc-500' }, 'data retrieved'),
      H('dd', { class: 'text-right text-zinc-300' }, DATA_RETRIEVED),
      H('dt', { class: 'text-zinc-500' }, 'generated'),
      H('dd', { class: 'truncate text-right text-zinc-300', title: receipt.generated }, receipt.generated),
      H('dt', { class: 'text-zinc-500' }, 'datasets'),
      H('dd', { class: 'text-right text-zinc-300' }, DATASETS.length + ' registered'),
    ),
    H('button', { type: 'button', onClick: () => download('elementa-receipt-' + hash + '.json', JSON.stringify(receipt, null, 2), 'application/json'), class: 'mt-2 w-full rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5' }, 'Download receipt JSON'),
  )

  const integrityCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.025] p-3' },
    H('div', { class: 'flex flex-wrap items-center gap-2' },
      H('h4', { class: 'text-[12px] font-semibold text-zinc-100' }, 'Element-data integrity'),
      badge(integrity.status),
      H('span', { class: 'font-mono text-[10px] text-zinc-400' }, integrity.pass + '/' + integrity.total + ' checks pass'),
    ),
    H('p', { class: 'mt-1.5 text-[10px] leading-relaxed text-zinc-500' },
      integrity.warn + ' warning(s) - ' + integrity.fail + ' failure(s). Checks cover shell sums, isotope abundance totals, decay-chain continuity, physical bounds and field coverage.'),
    H('div', { class: 'mt-2 flex gap-2' },
      H('a', { href: './integrity.html', class: 'rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300 hover:bg-emerald-400/20' }, 'Open full integrity report'),
      H('a', { href: './references.html', class: 'rounded-md border border-sky-400/40 bg-sky-400/10 px-2 py-1 text-[10px] text-sky-300 hover:bg-sky-400/20' }, 'References'),
    ),
  )

  const datasetsCard = H('div', { class: 'space-y-2' },
    ...DATASETS.map((dataset) => H('article', { key: dataset.id, class: 'rounded-lg border border-white/10 bg-white/[0.02] p-2.5' },
      H('div', { class: 'flex flex-wrap items-baseline gap-x-2 gap-y-1' },
        H('h4', { class: 'text-[11px] font-semibold text-zinc-200' }, dataset.title),
        H('span', { class: 'font-mono text-[9px] text-zinc-500' }, dataset.version),
        H('a', { href: dataset.url, target: '_blank', rel: 'noreferrer', class: 'ml-auto text-[9px] text-sky-400/80 hover:text-sky-300' }, 'source'),
      ),
      H('p', { class: 'mt-0.5 text-[9.5px] text-zinc-500' }, dataset.publisher + ' - retrieved ' + dataset.retrieved + ' - ' + dataset.license),
      H('p', { class: 'mt-1 text-[9.5px] leading-relaxed text-zinc-500' }, dataset.note),
    )),
  )

  return H('div', { class: 'space-y-4' },
    receiptCard,
    integrityCard,
    datasetsCard,
  )
}

function CiteTab({ view, hash }: { view: Record<string, unknown>; hash: string }): VNode {
  const receipt = buildReceipt(view)
  const bibtex = buildBibTeX({ url: location.href, accessed: DATA_RETRIEVED, title: 'ELEMENTA view export' })
  const ris = buildRIS({ url: location.href, accessed: DATA_RETRIEVED, title: 'ELEMENTA view export' })
  const fullCsv = toCSV(ELEMENT_CSV_HEADERS, elementRows(ELEMENTS, blockOf, massInterval))

  const permalinkCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.025] p-3' },
    H('h4', { class: 'text-[12px] font-semibold text-zinc-100' }, 'Permalink'),
    H('p', { class: 'mt-0.5 text-[10px] text-zinc-500' }, 'The URL encodes the current filters, colour mode, comparison set and open model.'),
    H('div', { class: 'mt-2 flex gap-2' },
      H('input', { readonly: true, value: location.href, 'aria-label': 'Permalink to this view', class: 'min-w-0 flex-1 rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 font-mono text-[10px] text-zinc-300' }),
      H('button', { type: 'button', onClick: () => copy('Permalink', location.href), class: 'shrink-0 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] text-emerald-300 hover:bg-emerald-400/20' }, 'Copy'),
    ),
  )

  const citationCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.025] p-3' },
    H('div', { class: 'flex flex-wrap items-center gap-2' },
      H('h4', { class: 'mr-auto text-[12px] font-semibold text-zinc-100' }, 'Citation'),
      H('button', { type: 'button', onClick: () => copy('BibTeX', bibtex), class: 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5' }, 'Copy BibTeX'),
      H('button', { type: 'button', onClick: () => copy('RIS', ris), class: 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5' }, 'Copy RIS'),
      H('button', { type: 'button', onClick: () => download('elementa.bib', bibtex, 'text/plain;charset=utf-8'), class: 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5' }, 'Download BibTeX'),
    ),
    H('pre', { class: 'mt-2 max-h-40 overflow-auto rounded-md border border-white/10 bg-[#070a10] p-2 font-mono text-[9px] leading-relaxed text-zinc-400' }, bibtex),
  )

  const exportCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.025] p-3' },
    H('h4', { class: 'text-[12px] font-semibold text-zinc-100' }, 'Data export'),
    H('p', { class: 'mt-0.5 text-[10px] text-zinc-500' }, 'Current view: ' + 'element rows' + ' - CSV with provenance-relevant fields and interval weights.'),
    H('div', { class: 'mt-2 flex flex-wrap gap-2' },
      H('button', { type: 'button', onClick: () => download('elementa-all-118.csv', fullCsv, 'text/csv;charset=utf-8'), class: 'rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-300 hover:bg-amber-400/20' }, 'Download all 118 CSV'),
      H('button', { type: 'button', onClick: () => download('elementa-view-' + hash + '.json', JSON.stringify({ receipt, view }, null, 2), 'application/json'), class: 'rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-300 hover:bg-amber-400/20' }, 'Download view JSON'),
    ),
  )

  const issueCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.025] p-3' },
    H('h4', { class: 'text-[12px] font-semibold text-zinc-100' }, 'Report a data issue'),
    H('p', { class: 'mt-0.5 text-[10px] leading-relaxed text-zinc-500' }, 'Copy a structured report (view state, dataset versions, receipt) into your issue tracker. No repository URL is assumed.'),
    H('textarea', {
      value: ui.note, rows: 2, placeholder: 'Which value looks wrong, and what did you expect?',
      onInput: (event: Event) => { ui.note = (event.target as HTMLTextAreaElement).value },
      class: 'mt-2 w-full rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[10px] text-zinc-300 placeholder:text-zinc-600 focus:border-amber-400/40 focus:outline-none',
    }),
    H('button', { type: 'button', onClick: () => copy('Issue report', buildIssueReport({}, ui.note)), class: 'mt-2 rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5' }, 'Copy issue report'),
  )

  return H('div', { class: 'space-y-4' }, permalinkCard, citationCard, exportCard, issueCard)
}

function UnitsTab(): VNode {
  const amount = Number.parseFloat(ui.amount)
  const converted = Number.isFinite(amount) ? convertEnergy(amount, ui.from, ui.to) : Number.NaN

  const converterCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.025] p-3' },
    H('h4', { class: 'text-[12px] font-semibold text-zinc-100' }, 'Energy converter'),
    H('div', { class: 'mt-2 flex flex-wrap items-center gap-2' },
      H('input', { type: 'number', value: ui.amount, step: 'any', 'aria-label': 'Value to convert', onInput: (event: Event) => { ui.amount = (event.target as HTMLInputElement).value }, class: 'w-28 rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 font-mono text-[11px] text-zinc-200' }),
      H('select', { value: ui.from, 'aria-label': 'Convert from', onChange: (event: Event) => { ui.from = (event.target as HTMLSelectElement).value as EnergyUnit }, class: 'rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[11px] text-zinc-300' },
        ...ENERGY_UNITS.map((unit) => H('option', { key: unit, value: unit }, unit)),
      ),
      H('span', { class: 'text-[11px] text-zinc-500' }, 'to'),
      H('select', { value: ui.to, 'aria-label': 'Convert to', onChange: (event: Event) => { ui.to = (event.target as HTMLSelectElement).value as EnergyUnit }, class: 'rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[11px] text-zinc-300' },
        ...ENERGY_UNITS.map((unit) => H('option', { key: unit, value: unit }, unit)),
      ),
      H('output', { class: 'font-mono text-[13px] font-semibold text-amber-300', 'aria-live': 'polite' }, Number.isFinite(converted) ? converted.toPrecision(6) + ' ' + ui.to : 'n/a'),
    ),
    H('p', { class: 'mt-2 text-[9.5px] leading-relaxed text-zinc-500' }, 'Wavelength is reciprocal (E = hc / lambda). Conversions use CODATA 2022 factors and preserve six significant figures.'),
  )

  const constantsCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.025] p-3' },
    H('h4', { class: 'text-[12px] font-semibold text-zinc-100' }, 'CODATA 2022 constants'),
    H('div', { class: 'mt-2 overflow-x-auto' },
      H('table', { class: 'w-full border-collapse text-left' },
        H('thead', null, H('tr', { class: 'bg-white/[0.035]' },
          H('th', { class: 'px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'symbol'),
          H('th', { class: 'px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'quantity'),
          H('th', { class: 'px-2 py-1 text-right text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'recommended value'),
        ),
        ),
        H('tbody', null, ...CONSTANTS.map((constant) => H('tr', { key: constant.symbol, class: 'border-t border-white/[0.06]' },
          H('th', { scope: 'row', class: 'px-2 py-1 font-mono text-[10px] text-amber-300' }, constant.symbol),
          H('td', { class: 'px-2 py-1 text-[10px] text-zinc-400' }, constant.name),
          H('td', { class: 'px-2 py-1 text-right font-mono text-[9.5px] text-zinc-300' }, formatConstant(constant)),
        ))),
      ),
    ),
    H('p', { class: 'mt-2 text-[9px] text-zinc-600' }, 'Recommended values for the 2022 adjustment, retrieved ' + DATA_RETRIEVED + '.'),
  )

  const conversionsCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.025] p-3' },
    H('h4', { class: 'text-[12px] font-semibold text-zinc-100' }, 'Conversion factors'),
    H('dl', { class: 'mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 font-mono text-[10px]' },
      ...CONVERSION_ROWS.map((row) => H('div', { key: row.label, class: 'contents' },
        H('dt', { class: 'text-zinc-500' }, row.label),
        H('dd', { class: 'text-right text-zinc-300', title: row.note }, row.factor),
      )),
    ),
  )

  return H('div', { class: 'space-y-4' }, converterCard, constantsCard, conversionsCard)
}

function TiersTab(): VNode {
  const keys = Object.keys(MODEL_TIERS) as ModelKey[]
  const articles = keys.map((key) => {
    const tier = MODEL_TIERS[key]
    const meta = TIER_META[tier.tier]
    return H('article', { key: key, class: 'rounded-lg border border-white/10 bg-white/[0.02] p-2.5' },
      H('div', { class: 'flex flex-wrap items-center gap-2' },
        H('h4', { class: 'text-[11px] font-semibold text-zinc-200' }, key),
        tierBadge(key),
        H('span', { class: 'ml-auto font-mono text-[9px] text-zinc-500' }, meta.label),
      ),
      H('p', { class: 'mt-1 text-[10px] leading-relaxed text-zinc-500' }, tier.note),
      H('p', { class: 'mt-1 text-[9px] leading-relaxed text-zinc-600' }, meta.description),
    )
  })
  return H('div', { class: 'space-y-3' },
    H('p', { class: 'rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-[10px] leading-relaxed text-amber-100/70' },
      'Every view carries a tier. A theoretical curve is not a measurement, and a pedagogical drawing is not a prediction: the distinction is shown here and repeated in the viewer chrome.'),
    ...articles,
  )
}

export default function ResearchPanel({ open, onClose, view, elements }: {
  open: boolean
  onClose: () => void
  view: Record<string, unknown>
  elements: ElementData[]
}): VNode {
  if (!open) return H('span', { class: 'hidden' })

  const hash = viewHash(view)
  let tabBody: VNode
  if (ui.tab === 'cite') tabBody = CiteTab({ view, hash })
  else if (ui.tab === 'units') tabBody = UnitsTab()
  else if (ui.tab === 'tiers') tabBody = TiersTab()
  else tabBody = OverviewTab({ view, hash, elements })

  return H('div', { class: 'fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Research data, citations and constants', onClick: onClose },
    H('section', { class: 'flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0f18] shadow-2xl', onClick: (event: Event) => event.stopPropagation() },
      H('header', { class: 'flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3' },
        H('div', { class: 'min-w-0 flex-1' },
          H('div', { class: 'text-[9px] font-medium uppercase tracking-[0.2em] text-sky-300' }, 'ELEMENTA RESEARCH LAYER'),
          H('h2', { class: 'mt-0.5 text-base font-semibold text-zinc-100' }, 'Data, citations and constants'),
          H('p', { class: 'mt-0.5 text-[10px] text-zinc-500' }, 'v' + APP_VERSION + ' - ' + DATASETS.length + ' datasets - view ' + hash),
        ),
        ui.copied ? H('span', { class: 'rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300', 'aria-live': 'polite' }, ui.copied) : null,
        H('button', { type: 'button', onClick: onClose, 'aria-label': 'Close research panel', class: 'flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-zinc-400 hover:text-zinc-100' }, 'X'),
      ),
      H('div', { class: 'flex flex-wrap gap-1 border-b border-white/10 px-3 py-2', role: 'tablist', 'aria-label': 'Research panel sections' },
        ...TABS.map(([key, label]) => H('button', { key: key, type: 'button', role: 'tab', 'aria-selected': String(ui.tab === key), onClick: () => { ui.tab = key }, class: 'rounded-md border px-2.5 py-1 text-[10.5px] font-medium transition ' + (ui.tab === key ? 'border-sky-400/40 bg-sky-400/10 text-sky-200' : 'border-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-300') }, label),
        ),
      ),
      H('div', { class: 'min-h-0 flex-1 overflow-y-auto p-3 sm:p-4', role: 'tabpanel' }, tabBody),
      H('footer', { class: 'flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2 text-[9px] text-zinc-600' },
        H('span', null, 'Derived values are labelled as such; primary sources are never invented.'),
        H('button', { type: 'button', onClick: onClose, class: 'rounded-md border border-white/10 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-white/5' }, 'Close'),
      ),
    ),
  )
}
