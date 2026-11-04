import { h, reactive, type VNode } from 'nexus-framework'
import type { ElementData } from '@/lib/periodic/types'
import { CATEGORY_MAP, SHELL_LETTERS } from '@/lib/periodic/types'
import { configToSuperscript, fmt, heatForField, heatT, hexWithAlpha, kelvinToC, ORIGIN_FOOTNOTE, ORIGIN_MAP, ORIGIN_NOTES, originsFor, valenceOf } from '@/lib/periodic'
import { ISOTOPES, chainsForElement } from '@/lib/periodic/isotopes'
import { DATASET_MAP, MODEL_TIERS, TIER_META, datasetFor, massInterval, massLabel, methodFor, sourceLine, uncertaintyNote } from '@/lib/provenance'
import { copyText, download, toCSV } from '@/lib/citation'
import IsotopeModal from '@/components/periodic/IsotopeModal'
import { getPhaseAtTemperature, formatTemp } from '@/lib/periodic/temperature'

type ModelKind = '2d' | 'qm' | 'spectra' | '3d' | 'crystal'

const panel = reactive({
  model: '2d' as ModelKind,
  paused: false,
  speed: 1,
  isotopeOpen: false,
  evidenceField: '' as '' | 'mass' | 'ionizationEnergy' | 'electronAffinity',
  evidenceCopied: '',
})

window.addEventListener('elementa-isotope-close', () => { panel.isotopeOpen = false })
window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (panel.isotopeOpen) panel.isotopeOpen = false
  else window.dispatchEvent(new Event('elementa-detail-close'))
})

function H(tag: any, props?: any, ...children: any[]): VNode { return h(tag, props, ...children) as VNode }

function shortVal(value: number | null): string {
  if (value == null) return '-'
  const magnitude = Math.abs(value)
  if (magnitude >= 1000) return String(Math.round(value))
  if (magnitude >= 100) return value.toFixed(0)
  if (magnitude >= 10) return value.toFixed(1)
  if (magnitude >= 0.01) return value.toFixed(2)
  return value.toExponential(1)
}

function prop(label: string, value: unknown, field?: string): VNode {
  return H('div', { class: 'rounded-md border border-white/5 bg-white/[0.03] px-2 py-1.5' },
    H('div', { class: 'flex items-baseline gap-1 text-[9px] uppercase tracking-wider text-zinc-500' },
      H('span', { class: 'min-w-0 truncate' }, label),
      field ? H('span', {
        tabindex: '0', role: 'note', title: sourceLine(field),
        'aria-label': 'Source for ' + label + ': ' + sourceLine(field),
        class: 'ml-auto shrink-0 cursor-help text-[9px] text-sky-500/70 hover:text-sky-300',
      }, 'i') : null,
    ),
    H('div', { class: 'mt-0.5 font-mono text-[12px] leading-tight text-zinc-200' }, String(value ?? '-')),
  )
}

function section(title: string, accent: string, ...children: any[]): VNode {
  return H('section', { class: 'space-y-2' },
    H('h3', { class: 'flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500' },
      H('span', { class: 'inline-block h-3 w-[3px] rounded-full', style: { background: accent } }), title),
    ...children)
}

export default function DetailPanel({ element: el, accent, open, compareSelected, onToggleCompare, compareFull, simulatedTemp }: {
  element: ElementData
  accent: string
  open: boolean
  compareSelected: boolean
  onToggleCompare: () => void
  compareFull: boolean
  simulatedTemp?: number | null
}): VNode {
  if (!open) return H('span', { class: 'hidden' })

  const bracket = el.number === 43 || el.number === 61 || el.number >= 84
  const category = CATEGORY_MAP[el.category]
  const massRange = massInterval(el.number)
  const modelTier = MODEL_TIERS[panel.model]
  const modelTierMeta = TIER_META[modelTier.tier]
  const sourceDatasetIds = [...new Set(
    ['mass', 'config', 'ionizationEnergy', 'electronegativity', 'atomicRadius', 'meltingPoint', 'density', 'halfLife', 'qValue']
      .map((field) => datasetFor(field)?.id)
      .filter((id): id is string => id != null),
  )]
  const isotopeRows = ISOTOPES[el.number] ?? []
  const stableIsotopes = isotopeRows.filter((row) => row.abundance != null && !row.halfLife).length
  const decayChains = chainsForElement(el.number)
  const originPairs = originsFor(el.number)
  const originNote = ORIGIN_NOTES[el.number]
  const synthetic = originPairs[0][0] === 'synthetic'
  const trends = [
    { field: 'electronegativity' as const, label: 'Electronegativity', unit: '' },
    { field: 'ionizationEnergy' as const, label: 'Ionization E', unit: ' eV' },
    { field: 'atomicRadius' as const, label: 'Atomic radius', unit: ' pm' },
    { field: 'density' as const, label: 'Density (log)', unit: ' g/cm3' },
    { field: 'meltingPoint' as const, label: 'Melting point', unit: ' K' },
  ]
  const evidenceFields = [
    { field: 'mass' as const, label: 'Atomic weight', value: massLabel(el.number, el.mass), classification: bracket ? 'Most-stable isotope mass number' : 'IUPAC standard atomic weight', conditions: 'Standard atomic-weight basis. Natural-composition intervals are retained where applicable; sample-specific conditions are not recorded.' },
    { field: 'ionizationEnergy' as const, label: 'First ionization energy', value: fmt(el.ionizationEnergy, 'eV', 4), classification: el.number >= 104 ? 'Predicted per dataset note' : 'NIST reference value', conditions: 'First ionization energy. Element-specific experimental conditions are not included in the bundled record.' },
    { field: 'electronAffinity' as const, label: 'Electron affinity', value: el.electronAffinity == null ? 'not available' : el.electronAffinity + ' kJ/mol', classification: 'CRC reference value; evaluation status not encoded', conditions: 'Element-specific measurement conditions and sign-convention metadata are not included in the bundled record.' },
  ].map((item) => {
    const dataset = datasetFor(item.field)!
    const interval = item.field === 'mass' ? massRange : null
    const reportedUncertainty = interval
      ? `IUPAC interval: ${interval[0]}–${interval[1]} u`
      : item.field === 'mass' && bracket
        ? 'A standard atomic weight is unavailable; the displayed bracketed value is a mass number.'
        : uncertaintyNote(item.field)
          ? `Context only; not element-specific: ${uncertaintyNote(item.field)}`
          : 'No element-specific uncertainty is recorded in the bundled data.'
    return {
      ...item,
      method: methodFor(item.field),
      dataset,
      reportedUncertainty,
    }
  })
  const evidencePayload = evidenceFields.map((item) => ({
    element: { atomicNumber: el.number, symbol: el.symbol, name: el.name },
    property: item.label,
    field: item.field,
    value: item.value,
    classification: item.classification,
    method: item.method,
    conditions: item.conditions,
    uncertainty: item.reportedUncertainty,
    source: { title: item.dataset.title, publisher: item.dataset.publisher, version: item.dataset.version, retrieved: item.dataset.retrieved, url: item.dataset.url },
  }))
  const evidenceCsv = toCSV(
    ['atomic_number', 'symbol', 'name', 'property', 'field', 'value', 'classification', 'method', 'conditions', 'uncertainty', 'source_title', 'source_publisher', 'source_version', 'retrieved', 'source_url'],
    evidencePayload.map((item) => [item.element.atomicNumber, item.element.symbol, item.element.name, item.property, item.field, item.value, item.classification, item.method, item.conditions, item.uncertainty, item.source.title, item.source.publisher, item.source.version, item.source.retrieved, item.source.url]),
  )
  const copyEvidence = async () => {
    const ok = await copyText(JSON.stringify(evidencePayload, null, 2))
    panel.evidenceCopied = ok ? 'JSON copied' : 'Clipboard access blocked'
    window.setTimeout(() => { panel.evidenceCopied = '' }, 2200)
  }
  const modelLabel = panel.model === 'crystal'
    ? 'Crystal unit cell drag to rotate, wheel to zoom'
    : panel.model === '2d'
      ? 'SVG Bohr shell 2D drag to orbit'
      : panel.model === 'qm'
        ? 'QM isosurface drag to orbit, slider cuts probability'
        : panel.model === 'spectra'
          ? 'Grotian levels calculated emission NIST observed lines'
          : 'Three.js Bohr shell 3D drag to orbit, scroll to zoom'
  const modelControls = (['2d', 'qm', 'spectra', '3d', 'crystal'] as const).map((kind) => H('button', {
    key: kind, type: 'button', onClick: () => { panel.model = kind },
    class: 'px-2.5 py-1 text-[11px] uppercase tracking-wide transition ' + (panel.model === kind ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'),
  }, kind))
  const modelViewer = H('elementa-model-view', {
    'data-z': String(el.number), 'data-symbol': el.symbol, 'data-accent': accent,
    'data-model': panel.model, 'data-paused': String(panel.paused), 'data-speed': String(panel.speed),
    key: el.number + '-' + panel.model, class: 'absolute inset-0 block',
  })

  const shellBar = (n: number, i: number) => H('div', { class: 'flex items-center gap-2' },
    H('span', { class: 'w-3.5 font-mono text-[10px] text-zinc-500' }, SHELL_LETTERS[i] ?? ('n' + (i + 1))),
    H('div', { class: 'h-1.5 flex-1 overflow-hidden rounded-sm bg-white/5' },
      H('div', { class: 'h-full rounded-sm', style: { width: Math.min(100, n / 32 * 100) + '%', background: accent, opacity: 0.45 + 0.55 * i / Math.max(1, el.shells.length - 1) } }),
    ),
    H('span', { class: 'w-9 text-right font-mono text-[10px] text-zinc-400' }, n + ' e'),
  )

  const body = H('div', { class: 'flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden' },
    H('div', { class: 'flex shrink-0 flex-col border-b border-white/10 bg-[#060a12] lg:min-h-0 lg:shrink lg:border-b-0 lg:border-r' },
      H('div', { class: 'relative h-[300px] overflow-hidden sm:h-[340px] lg:h-auto lg:min-h-0 lg:flex-1' },
        modelViewer,
        (panel.model === '2d' || panel.model === '3d') ? H('div', { class: 'absolute left-2 top-2 flex flex-col gap-1 z-10 pointer-events-none' },
          H('div', { class: 'rounded bg-black/60 px-2 py-0.5 font-mono text-[9px] text-zinc-300 backdrop-blur-sm border border-white/10' },
            'Bohr shell model · ' + el.shells.length + ' shells (' + el.shells.reduce((a: number, b: number) => a + b, 0) + ' e⁻)',
          ),
          panel.model === '3d' ? H('div', { class: 'flex items-center gap-2 rounded bg-black/60 px-2 py-0.5 font-mono text-[9px] text-zinc-400 backdrop-blur-sm border border-white/10' },
            H('span', { class: 'flex items-center gap-1 text-emerald-400 font-semibold' },
              H('span', { class: 'inline-block h-1.5 w-1.5 rounded-full', style: { background: accent } }),
              el.number + ' p⁺ (Protons)',
            ),
            H('span', { class: 'flex items-center gap-1 text-zinc-400' },
              H('span', { class: 'inline-block h-1.5 w-1.5 rounded-full bg-slate-500' }),
              Math.max(0, Math.round(el.mass) - el.number) + ' n⁰ (Neutrons)',
            ),
          ) : null,
        ) : null,
        panel.model === '3d' ? H('a', {
          href: './orbitals.html',
          class: 'absolute right-2 top-2 z-10 rounded border border-sky-400/40 bg-black/60 px-2 py-1 font-mono text-[9px] font-medium text-sky-300 backdrop-blur-sm transition hover:bg-sky-400/20 hover:text-sky-200',
        }, 'Quantum Cloud (|ψ|²) ↗') : null,
        panel.model === '3d' ? H('div', {
          class: 'pointer-events-none absolute bottom-2 inset-x-2 z-10 rounded bg-black/70 px-2 py-1 text-center font-mono text-[8.5px] text-zinc-400 backdrop-blur-sm border border-white/10',
        }, '⚠️ Scale Note: Nucleus magnified ~100,000× for visibility. Classical orbits radiate (Larmor formula); for quantum mechanics, see Orbital Lab.') : null,
      ),
      H('div', { class: 'relative z-10 shrink-0 border-t border-white/10 px-4 py-2.5' },
        H('div', { class: 'mb-2 flex flex-wrap items-center gap-1.5' },
          ...el.shells.map((n, i) => H('span', { key: i, class: 'rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none', style: { color: accent, borderColor: hexWithAlpha(accent, 0.35), background: hexWithAlpha(accent, 0.08) } }, (SHELL_LETTERS[i] || ('n' + (i + 1))) + '·' + n + 'e')),
        ),
        H('span', { class: 'ml-auto hidden font-mono text-[10px] text-zinc-600 md:inline' }, 'Esc to close'),
      ),
      H('div', { class: 'flex items-center gap-2' },
        H('div', { class: 'flex overflow-hidden rounded-md border border-white/10' }, modelControls),
        H('span', { class: 'shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider', style: { color: modelTierMeta.color, borderColor: modelTierMeta.color + '66', background: modelTierMeta.color + '14' }, title: modelTierMeta.description + ' ' + modelTier.note }, modelTierMeta.label),
        panel.model !== 'spectra' ? H('button', { type: 'button', onClick: () => { panel.paused = !panel.paused }, class: 'rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200' }, panel.paused ? 'Pause' : 'Play') : null,
        panel.model !== 'spectra' ? H('div', { class: 'ml-auto flex items-center gap-2' },
          H('span', { class: 'font-mono text-[10px] text-zinc-400' }, 'Speed: ' + panel.speed + '×'),
          H('input', { type: 'range', min: 0.25, max: 3, step: 0.25, value: panel.speed, onInput: (event: Event) => { panel.speed = Number((event.target as HTMLInputElement).value) }, class: 'w-24', 'aria-label': 'Model animation speed' }),
        ) : null,
      ),
    ),
    H('div', { class: 'space-y-5 p-4 lg:min-h-0 lg:overflow-y-auto' },
      section('Shell population', accent,
        H('div', { class: 'space-y-1' },
          H('div', { class: 'text-[9px] uppercase tracking-wider text-zinc-600' }, 'max 32 e scale'),
          ...el.shells.map((n, i) => H('div', { key: i, class: 'flex items-center gap-2' }, shellBar(n, i))),
        ),
      ),
      section('Atomic properties', accent,
        H('div', { class: 'grid grid-cols-2 gap-1.5' },
          H('div', { class: 'col-span-2' }, prop('Electron config', configToSuperscript(el.config), 'config')),
          prop('Valence e Bohr', valenceOf(el), 'shells'),
          prop('Electronegativity', fmt(el.electronegativity, '', 2), 'electronegativity'),
          prop('Ionization E', fmt(el.ionizationEnergy, 'eV', 2), 'ionizationEnergy'),
          prop('Electron affinity', el.electronAffinity == null ? '-' : el.electronAffinity + ' kJ/mol', 'electronAffinity'),
          prop('Atomic radius', fmt(el.atomicRadius, 'pm', 0), 'atomicRadius'),
          H('div', { class: 'col-span-2' }, prop('Oxidation states', el.oxidationStates || '-', 'oxidationStates')),
        ),
      ),
      section('Physical properties', accent,
        H('div', { class: 'grid grid-cols-2 gap-1.5' },
          prop('Phase at STP', el.phase, 'phase'),
          simulatedTemp != null ? H('div', { class: 'col-span-2 rounded border border-white/10 bg-white/[0.02] p-2' },
            H('div', { class: 'flex items-center justify-between text-[10.5px]' },
              H('span', { class: 'text-zinc-400' }, 'State at ' + formatTemp(simulatedTemp)),
              H('span', { class: 'font-semibold', style: { color: getPhaseAtTemperature(el, simulatedTemp).color } },
                getPhaseAtTemperature(el, simulatedTemp).icon + ' ' + getPhaseAtTemperature(el, simulatedTemp).label
              ),
            ),
            getPhaseAtTemperature(el, simulatedTemp).transitionInfo ? H('p', { class: 'mt-1 text-[9.5px] text-zinc-400 font-mono' }, getPhaseAtTemperature(el, simulatedTemp).transitionInfo) : null,
          ) : null,
          prop('Density', el.density == null ? '-' : el.density + ' g/cm3', 'density'),
          prop('Melting point', el.meltingPoint == null ? '-' : el.meltingPoint + ' K ' + kelvinToC(el.meltingPoint), 'meltingPoint'),
          prop('Boiling point', el.boilingPoint == null ? '-' : el.boilingPoint + ' K ' + kelvinToC(el.boilingPoint), 'boilingPoint'),
        ),
      ),
      section('Trend percentile (of reference range)', accent,
        H('div', { class: 'space-y-2' },
          ...trends.map((trend) => {
            const value = el[trend.field]
            const percentile = heatT(el, trend.field)
            return H('div', { key: trend.field },
              H('div', { class: 'flex items-baseline justify-between text-[10px]' },
                H('span', { class: 'text-zinc-400' }, trend.label),
                H('span', { class: 'font-mono text-zinc-300' }, value == null ? '-' : shortVal(value) + trend.unit),
              ),
              H('div', { class: 'mt-1 h-1 overflow-hidden rounded-full bg-white/10' },
                percentile == null ? null : H('div', { class: 'h-full rounded-full', style: { width: percentile * 100 + '%' , background: heatForField(el, trend.field) } }),
              ),
            )
          }),
        ),
      ),
      section('Discovery and notes', accent,
        H('div', { class: 'grid grid-cols-2 gap-1.5' },
          H('div', { class: 'col-span-2' }, prop('Discovered', el.discoveredYear ?? 'Antiquity', 'discoveredYear')),
          H('div', { class: 'col-span-2' }, prop('Credited to', el.discoveredBy || '-', 'discoveredBy')),
        ),
        bracket ? H('p', { class: 'text-[10px] leading-relaxed text-zinc-500' }, 'No standard atomic weight is available because all isotopes are unstable; the displayed value is the mass number of the most stable isotope.') : null,
        H('p', { class: 'text-[11.5px] leading-relaxed text-zinc-400' }, el.summary),
      ),
      section('Isotopes and decay', accent,
        H('p', { class: 'text-[11px] leading-relaxed text-zinc-400' }, isotopeRows.length + ' notable nuclides tracked, ' + stableIsotopes + ' stable. ' + (decayChains.length ? 'Part of the ' + decayChains.map((chain) => chain.name).join(', ') + ' chain.' : '')),
        H('button', { type: 'button', onClick: () => { panel.isotopeOpen = true }, class: 'w-full rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11.5px] font-medium text-amber-300 transition hover:bg-amber-400/20' }, 'Open isotope explorer'),
        H('a', { href: './segre.html?z=' + el.number, class: 'mt-1.5 block w-full rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-center text-[11.5px] font-medium text-emerald-300 transition hover:bg-emerald-400/20' }, 'View all nuclides of ' + el.symbol + ' in the Segr chart'),
      ),
      section('Nucleosynthesis origin', accent,
        H('div', { class: 'flex h-3.5 gap-px overflow-hidden rounded-full bg-white/5' },
          ...originPairs.map(([key, value]) => H('div', { key: key, title: ORIGIN_MAP[key].label + ' ' + value + '%', style: { width: value + '%', background: ORIGIN_MAP[key].color, opacity: 0.85 } })),
        ),
        H('div', { class: 'space-y-1.5' },
          ...originPairs.map(([key, value]) => {
            const origin = ORIGIN_MAP[key]
            return H('div', { key: key },
              H('div', { class: 'flex items-baseline gap-1.5 text-[10.5px]' },
                H('span', { class: 'inline-block h-2 w-2 shrink-0 translate-y-px rounded-full', style: { background: origin.color } }),
                H('span', { class: 'text-zinc-300' }, origin.label),
                H('span', { class: 'font-mono text-zinc-500' }, origin.example),
                H('span', { class: 'ml-auto shrink-0 font-mono text-zinc-400' }, value + '%'),
              ),
              H('p', { class: 'pl-3.5 text-[10.5px] leading-snug text-zinc-500' }, origin.desc),
            )
          }),
        ),
        originNote ? H('p', { class: 'rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1.5 text-[10px] leading-relaxed text-zinc-400' }, originNote) : null,
        synthetic && !originNote ? H('p', { class: 'rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1.5 text-[10px] leading-relaxed text-zinc-400' }, 'Every atom of ' + el.symbol + ' on Earth was made by humans; none survives from the solar system formation.') : null,
        H('p', { class: 'text-[9px] leading-relaxed text-zinc-600' }, ORIGIN_FOOTNOTE),
      ),
      section('Property evidence', accent,
        H('p', { class: 'text-[10px] leading-relaxed text-zinc-500' }, 'Inspect the source and recorded metadata for key reference values. Missing uncertainty and condition fields are identified explicitly; no alternate-source determinations are bundled for conflict comparison.'),
        H('div', { class: 'space-y-1.5' }, ...evidenceFields.map((item) => H('div', { key: item.field, class: 'overflow-hidden rounded-md border border-white/10 bg-white/[0.025]' },
          H('button', { type: 'button', class: 'flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-white/[0.04]', 'aria-expanded': String(panel.evidenceField === item.field), onClick: () => { panel.evidenceField = panel.evidenceField === item.field ? '' : item.field } },
            H('span', { class: 'min-w-0 flex-1 text-[10px] text-zinc-300' }, item.label),
            H('span', { class: 'font-mono text-[10px] text-zinc-100' }, item.value),
            H('span', { class: 'text-[10px] text-sky-400' }, panel.evidenceField === item.field ? '−' : '+'),
          ),
          panel.evidenceField === item.field ? H('div', { class: 'space-y-2 border-t border-white/10 px-2.5 py-2 text-[9.5px] leading-relaxed' },
            H('div', null, H('span', { class: 'text-zinc-600' }, 'Classification · '), H('span', { class: 'text-zinc-300' }, item.classification)),
            H('div', null, H('span', { class: 'text-zinc-600' }, 'Method · '), H('span', { class: 'text-zinc-300' }, item.method)),
            H('div', null, H('span', { class: 'text-zinc-600' }, 'Uncertainty · '), H('span', { class: 'text-zinc-300' }, item.reportedUncertainty)),
            H('div', null, H('span', { class: 'text-zinc-600' }, 'Conditions · '), H('span', { class: 'text-zinc-300' }, item.conditions)),
            H('a', { href: item.dataset.url, target: '_blank', rel: 'noreferrer', class: 'inline-block text-sky-400 underline decoration-dotted hover:text-sky-300' }, item.dataset.publisher + ' · ' + item.dataset.title + ' (' + item.dataset.version + ')'),
          ) : null,
        ))),
        H('div', { class: 'flex flex-wrap items-center gap-1.5' },
          H('button', { type: 'button', onClick: () => download('elementa-' + el.symbol.toLowerCase() + '-property-evidence.csv', evidenceCsv, 'text/csv;charset=utf-8'), class: 'rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-[9.5px] text-sky-300 hover:bg-sky-400/20' }, 'Export evidence CSV'),
          H('button', { type: 'button', onClick: () => { void copyEvidence() }, class: 'rounded-md border border-white/10 px-2 py-1 text-[9.5px] text-zinc-300 hover:bg-white/5' }, 'Copy evidence JSON'),
          panel.evidenceCopied ? H('span', { class: 'text-[9px] text-emerald-300', 'aria-live': 'polite' }, panel.evidenceCopied) : null,
        ),
      ),
      section('Methods and sources', accent,
        H('div', { class: 'flex flex-wrap gap-1' },
          ...sourceDatasetIds.map((id) => {
            const dataset = DATASET_MAP[id]
            return H('span', {
              key: id,
              title: dataset.title + ' ' + dataset.version + ' retrieved ' + dataset.retrieved + ' ' + dataset.license + '\n' + dataset.url,
              class: 'cursor-help rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] text-zinc-400',
            }, dataset.publisher.split(/[\s/]/)[0])
          }),
        ),
        H('p', { class: 'text-[10px] leading-relaxed text-zinc-500' }, 'Current model tier: ' + modelTierMeta.label + ' ' + modelTier.note),
        uncertaintyNote('mass') ? H('p', { class: 'text-[9.5px] leading-relaxed text-zinc-600' }, uncertaintyNote('mass')!) : null,
        H('div', { class: 'flex flex-wrap gap-1.5' },
          H('a', { href: './synthesizer.html?z=' + el.number, class: 'rounded-md border border-rose-400/40 bg-rose-400/10 px-2 py-1 text-[10px] text-rose-300 transition hover:bg-rose-400/20' }, '⚗️ Synthesize compounds →'),
          H('button', { type: 'button', onClick: () => window.dispatchEvent(new Event('elementa-open-research')), class: 'rounded-md border border-sky-400/40 bg-sky-400/10 px-2 py-1 text-[10px] text-sky-300 transition hover:bg-sky-400/20' }, 'Cite / export this view'),
          H('a', { href: './references.html', class: 'rounded-md border border-white/10 px-2 py-1 text-zinc-300 transition hover:bg-white/5' }, 'References'),
          H('a', { href: './integrity.html', class: 'rounded-md border border-white/10 px-2 py-1 text-zinc-300 transition hover:bg-white/5' }, 'Integrity report'),
        ),
      ),
    ),
  )

  return H('div', { class: 'modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6', onClick: () => { window.dispatchEvent(new Event('elementa-detail-close')) }, role: 'dialog', 'aria-modal': 'true', 'aria-label': el.name + ' full details' },
    H('div', { class: 'modal-card flex h-full max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0f18] shadow-2xl', onClick: (event: Event) => event.stopPropagation() },
      H('div', { class: 'flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 px-4 py-3' },
        H('div', { class: 'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border', style: { background: hexWithAlpha(accent, 0.12), borderColor: hexWithAlpha(accent, 0.5) } },
          H('span', { class: 'font-mono text-[8px] leading-none opacity-75', style: { color: accent } }, el.number),
          H('span', { class: 'text-base font-bold leading-tight', style: { color: accent } }, el.symbol),
        ),
        H('div', { class: 'min-w-0' },
          H('div', { class: 'truncate text-sm font-semibold text-zinc-100' }, el.name,
            H('span', { class: 'ml-2 cursor-help font-mono text-[11px] font-normal text-zinc-500', title: sourceLine('mass') + (massRange ? '\nIUPAC interval: ' + massRange[0] + ' ' + massRange[1] + ' u' : '') }, massLabel(el.number, el.mass) + (bracket ? ' bracketed' : '')),
          ),
          H('div', { class: 'mt-1 flex flex-wrap gap-1.5' },
            H('span', { class: 'rounded-full border px-1.5 py-0.5 text-[9.5px] leading-none', style: { color: category.color, borderColor: hexWithAlpha(category.color, 0.4), background: hexWithAlpha(category.color, 0.1) } }, category.label),
            H('span', { class: 'rounded-full border px-1.5 py-0.5 text-[9.5px] leading-none' }, 'phase: ' + el.phase),
            H('span', { class: 'rounded-full border px-1.5 py-0.5 text-[9.5px] leading-none' }, 'group ' + (el.group > 0 ? el.group : '-')),
            H('span', { class: 'rounded-full border px-1.5 py-0.5 text-[9.5px] leading-none' }, 'period ' + el.period),
            el.radioactive ? H('span', { class: 'rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9.5px] leading-none text-amber-300' }, 'radioactive') : null,
            bracket ? H('span', { class: 'rounded-full border border-slate-400/40 bg-slate-400/10 px-1.5 py-0.5 text-[9.5px] leading-none text-slate-300' }, 'bracketed mass') : null,
          ),
        ),
        H('span', { class: 'ml-auto hidden shrink-0 font-mono text-[10px] text-zinc-500 xl:inline' }, modelLabel),
        H('button', { type: 'button', onClick: onToggleCompare, disabled: compareFull && !compareSelected, class: 'shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-40 ' + (compareSelected ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-zinc-300 hover:border-white/25'), 'aria-pressed': String(compareSelected), title: compareFull && !compareSelected ? 'Comparison is full (4 elements)' : undefined }, compareSelected ? 'In compare' : 'Compare'),
        H('button', { type: 'button', onClick: () => { window.dispatchEvent(new Event('elementa-detail-close')) }, 'aria-label': 'Close element details', class: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-white/30 hover:text-zinc-100' }, 'x'),
      ),
      body,
    ),
    panel.isotopeOpen
      ? IsotopeModal({
          element: el,
          accent,
          open: panel.isotopeOpen,
          onClose: () => { panel.isotopeOpen = false },
        })
      : null,
  )
}
