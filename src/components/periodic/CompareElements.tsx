import { h, reactive, type VNode } from 'nexus-framework'
import type { ElementData } from '@/lib/periodic/types'
import { ELEMENTS } from '@/lib/periodic'
import { paletteColor, type PaletteId } from '@/lib/palette'
import { download, toCSV } from '@/lib/citation'

type MetricKey = 'mass' | 'electronegativity' | 'ionizationEnergy' | 'electronAffinity' | 'atomicRadius' | 'meltingPoint' | 'boilingPoint' | 'density' | 'valence'
type Metric = { key: MetricKey; label: string; unit: string; digits: number }

const METRICS: Metric[] = [
  { key: 'mass', label: 'Atomic mass', unit: 'u', digits: 3 },
  { key: 'electronegativity', label: 'Electronegativity', unit: 'Pauling', digits: 2 },
  { key: 'ionizationEnergy', label: 'First ionization energy', unit: 'eV', digits: 3 },
  { key: 'electronAffinity', label: 'Electron affinity', unit: 'kJ/mol', digits: 1 },
  { key: 'atomicRadius', label: 'Atomic radius', unit: 'pm', digits: 0 },
  { key: 'meltingPoint', label: 'Melting point', unit: 'K', digits: 1 },
  { key: 'boilingPoint', label: 'Boiling point', unit: 'K', digits: 1 },
  { key: 'density', label: 'Density at STP', unit: 'g/cm3', digits: 4 },
  { key: 'valence', label: 'Outermost shell e', unit: 'e', digits: 0 },
]

const AXIS: Metric[] = [{ key: 'mass', label: 'Atomic mass', unit: 'u', digits: 3 }, ...METRICS]

const lab = reactive({
  x: 'mass' as MetricKey,
  y: 'electronegativity' as MetricKey,
  log: false,
})

function H(tag: any, props?: any, ...children: any[]): VNode { return h(tag, props, ...children) as VNode }

function valueOf(element: ElementData, key: MetricKey): number | null {
  if (key === 'valence') return element.shells.at(-1) ?? null
  return element[key]
}

function format(value: number | null, metric: Metric): string {
  if (value == null || !Number.isFinite(value)) return '-'
  return Number(value.toFixed(metric.digits)).toLocaleString() + ' ' + metric.unit
}

interface Stats { n: number; mean: number; median: number; sd: number; min: number; max: number }

function stats(values: Array<number | null>): Stats {
  const clean = values.filter((value): value is number => value != null && Number.isFinite(value)).sort((a, b) => a - b)
  if (!clean.length) return { n: 0, mean: Number.NaN, median: Number.NaN, sd: Number.NaN, min: Number.NaN, max: Number.NaN }
  const mean = clean.reduce((a, b) => a + b, 0) / clean.length
  const variance = clean.length > 1 ? clean.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (clean.length - 1) : 0
  const middle = Math.floor(clean.length / 2)
  return {
    n: clean.length,
    mean,
    median: clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2,
    sd: Math.sqrt(variance),
    min: clean[0],
    max: clean.at(-1)!,
  }
}

function pearson(pairs: Array<[number, number]>): { r: number; n: number; slope: number } | null {
  const n = pairs.length
  if (n < 3) return null
  const meanX = pairs.reduce((acc, pair) => acc + pair[0], 0) / n
  const meanY = pairs.reduce((acc, pair) => acc + pair[1], 0) / n
  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const pair of pairs) {
    const x = pair[0]
    const y = pair[1]
    sxx += (x - meanX) ** 2
    syy += (y - meanY) ** 2
    sxy += (x - meanX) * (y - meanY)
  }
  if (sxx === 0 || syy === 0) return null
  const slope = sxy / sxx
  return { r: sxy / Math.sqrt(sxx * syy), n, slope }
}

function fmtNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '-'
  const abs = Math.abs(value)
  if (abs !== 0 && (abs < 0.001 || abs >= 1e5)) return value.toExponential(2)
  return String(Number(value.toFixed(digits)))
}

const SCATTER_W = 560
const SCATTER_H = 220
const SCATTER_PAD = 34

export default function CompareElements({ elements, property, palette, onPropertyChange, onRemove, onClose }: {
  elements: ElementData[]
  property: MetricKey
  palette: PaletteId
  onPropertyChange: (property: MetricKey) => void
  onRemove: (atomicNumber: number) => void
  onClose: () => void
}): VNode {
  const metric = METRICS.find((item) => item.key === property) ?? METRICS[2]
  const values = elements.map((element) => valueOf(element, metric.key))
  const numeric = values.filter((value): value is number => value != null && Number.isFinite(value))
  const min = numeric.length ? Math.min(...numeric) : 0
  const max = numeric.length ? Math.max(...numeric) : 0
  const range = max - min || 1
  const zero = (0 - min) / range * 100

  const chartStats = stats(values)
  const allStats = stats(ELEMENTS.map((element) => valueOf(element, metric.key)))
  const xMetric = AXIS.find((item) => item.key === lab.x) ?? AXIS[0]
  const yMetric = AXIS.find((item) => item.key === lab.y) ?? AXIS[1]
  const pairs: Array<[number, number]> = []
  for (const element of ELEMENTS) {
    const x = valueOf(element, xMetric.key)
    const y = valueOf(element, yMetric.key)
    if (x == null || y == null) continue
    if (lab.log && (x <= 0 || y <= 0)) continue
    pairs.push([lab.log ? Math.log10(x) : x, lab.log ? Math.log10(y) : y])
  }
  const corr = pearson(pairs)

  const xLo = pairs.length ? Math.min(...pairs.map((pair) => pair[0])) : 0
  const xHi = pairs.length ? Math.max(...pairs.map((pair) => pair[0])) : 1
  const yLo = pairs.length ? Math.min(...pairs.map((pair) => pair[1])) : 0
  const yHi = pairs.length ? Math.max(...pairs.map((pair) => pair[1])) : 1
  const padX = (xHi - xLo) * 0.05 || 1
  const padY = (yHi - yLo) * 0.05 || 1
  const sx = (x: number) => SCATTER_PAD + ((x - (xLo - padX)) / ((xHi + padX) - (xLo - padX))) * (SCATTER_W - SCATTER_PAD * 2)
  const sy = (y: number) => SCATTER_H - SCATTER_PAD - ((y - (yLo - padY)) / ((yHi + padY) - (yLo - padY))) * (SCATTER_H - SCATTER_PAD * 2)
  const comparedZ = new Set(elements.map((element) => element.number))

  const scatterDotNodes = ELEMENTS.flatMap((element) => {
    const x = valueOf(element, xMetric.key)
    const y = valueOf(element, yMetric.key)
    if (x == null || y == null) return []
    if (lab.log && (x <= 0 || y <= 0)) return []
    const tx = lab.log ? Math.log10(x) : x
    const ty = lab.log ? Math.log10(y) : y
    const focus = comparedZ.has(element.number)
    const cx = sx(tx)
    const cy = sy(ty)
    const circle = H('circle', { cx: cx, cy: cy, r: focus ? 3.4 : 1.8, fill: focus ? '#34d399' : 'rgba(148,163,184,0.55)', stroke: focus ? '#052e1b' : 'none', 'stroke-width': focus ? 1 : 0 })
    const label = focus ? H('text', { x: cx + 5, y: cy - 4, fill: '#a7f3d0', 'font-size': '9', class: 'font-mono' }, element.symbol) : null
    return [H('g', { key: element.number }, circle, label)]
  })

  const scatterChildren: VNode[] = [
    H('line', { x1: SCATTER_PAD, y1: SCATTER_H - SCATTER_PAD, x2: SCATTER_W - SCATTER_PAD, y2: SCATTER_H - SCATTER_PAD, stroke: '#334155', 'stroke-width': 1 }),
    H('line', { x1: SCATTER_PAD, y1: SCATTER_PAD, x2: SCATTER_PAD, y2: SCATTER_H - SCATTER_PAD, stroke: '#334155', 'stroke-width': 1 }),
    H('text', { x: SCATTER_W / 2, y: SCATTER_H - 6, 'text-anchor': 'middle', fill: '#71717a', 'font-size': '9' }, xMetric.label + (lab.log ? ' (log10)' : '') + ' - ' + xMetric.unit),
    H('text', { x: 10, y: SCATTER_H / 2, 'text-anchor': 'middle', fill: '#71717a', 'font-size': '9', transform: 'rotate(-90 10 ' + SCATTER_H / 2 + ')' }, yMetric.label + (lab.log ? ' (log10)' : '') + ' - ' + yMetric.unit),
    H('text', { x: SCATTER_PAD, y: SCATTER_PAD - 6, fill: '#52525b', 'font-size': '8' }, fmtNumber(lab.log ? 10 ** xLo : xLo, 2)),
    H('text', { x: SCATTER_W - SCATTER_PAD, y: SCATTER_PAD - 6, 'text-anchor': 'end', fill: '#52525b', 'font-size': '8' }, fmtNumber(lab.log ? 10 ** xHi : xHi, 2)),
    H('text', { x: SCATTER_PAD - 5, y: SCATTER_PAD + 4, 'text-anchor': 'end', fill: '#52525b', 'font-size': '8' }, fmtNumber(lab.log ? 10 ** yHi : yHi, 2)),
    ...scatterDotNodes,
  ]
  const scatter = H('svg', { viewBox: '0 0 ' + SCATTER_W + ' ' + SCATTER_H, class: 'block h-auto w-full', role: 'img', 'aria-label': xMetric.label + ' versus ' + yMetric.label + ' scatter plot with ' + (corr ? corr.n : 0) + ' elements' }, ...scatterChildren)

  const tableCsv = toCSV(
    ['property', ...elements.map((element) => element.symbol + ' (Z ' + element.number + ')')],
    METRICS.map((row) => [row.label, ...elements.map((element) => valueOf(element, row.key) ?? '')]),
  )

  const correlationText = corr
    ? 'Pearson r = ' + corr.r.toFixed(3) + ' - n = ' + corr.n + ' - R2 = ' + (corr.r * corr.r).toFixed(3) + ' - slope = ' + corr.slope.toExponential(2)
    : 'Not enough paired values for a correlation.'

  const header = H('header', { class: 'flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3' },
    H('div', { class: 'min-w-0 flex-1' },
      H('div', { class: 'text-[9px] font-medium uppercase tracking-[0.2em] text-emerald-300' }, 'ELEMENTA - COMPARISON LAB'),
      H('h2', { id: 'element-compare-title', class: 'mt-0.5 text-base font-semibold text-zinc-100' }, 'Compare elements'),
      H('p', { class: 'mt-0.5 text-[10px] text-zinc-500' }, 'Measured reference values - blanks indicate unavailable data - statistics over all 118 elements use the same field definition'),
    ),
    H('label', { class: 'flex items-center gap-2 text-[10px] text-zinc-500' }, 'Chart property',
      H('select', { value: property, onChange: (event: Event) => onPropertyChange((event.target as HTMLSelectElement).value as MetricKey), class: 'rounded-md border border-white/10 bg-[#101722] px-2 py-1.5 text-[10px] text-zinc-200' },
        ...METRICS.map((item) => H('option', { key: item.key, value: item.key }, item.label + ' (' + item.unit + ')')),
      ),
    ),
    H('button', { type: 'button', onClick: onClose, class: 'flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-zinc-400 hover:text-zinc-100', 'aria-label': 'Close comparison' }, 'X'),
  )

  const slotCards = H('div', { class: 'grid gap-2 sm:grid-cols-2 lg:grid-cols-4' },
    ...elements.map((element, index) => H('article', { key: element.number, class: 'relative rounded-xl border border-white/10 bg-white/[0.025] p-3' },
      H('button', { type: 'button', onClick: () => onRemove(element.number), class: 'absolute right-2 top-2 text-base leading-none text-zinc-600 hover:text-zinc-200', 'aria-label': 'Remove ' + element.name + ' from comparison' }, 'X'),
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-mono text-lg font-bold', style: { color: paletteColor(index / Math.max(1, elements.length - 1), palette) } }, element.symbol),
        H('div', null,
          H('div', { class: 'pr-5 text-[12px] font-semibold text-zinc-100' }, element.name),
          H('div', { class: 'font-mono text-[9px] text-zinc-500' }, 'Z ' + element.number + ' - group ' + (element.group || '-') + ' - period ' + element.period),
        ),
      ),
      H('div', { class: 'mt-3 flex flex-wrap gap-1.5' },
        H('span', { class: 'rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-zinc-400' }, element.phase),
        H('span', { class: 'rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-zinc-400' }, element.shells.length + ' shells'),
      ),
      H('div', { class: 'mt-2 truncate font-mono text-[9px] text-zinc-500', title: element.config }, element.config),
    )),
  )

  const rangeRows: VNode[] = elements.map((element, index) => {
    const value = values[index]
    const left = value == null ? zero : (value - min) / range * 100
    const width = value == null ? 0 : Math.abs(value - min) / range * 100
    const color = paletteColor(index / Math.max(1, elements.length - 1), palette)
    return H('div', { key: element.number, class: 'grid grid-cols-[48px_minmax(0,1fr)_120px] items-center gap-2' },
      H('span', { class: 'font-mono text-[10px] font-semibold text-zinc-300' }, element.symbol),
      H('div', { class: 'relative h-2 overflow-hidden rounded-full bg-white/[0.06]' },
        H('span', { class: 'absolute bottom-0 top-0 w-px bg-white/35', style: { left: zero + '%' } }),
        value == null ? null : H('span', { class: 'absolute bottom-0 top-0 rounded-full', style: { left: left + '%', width: Math.max(width, 0.8) + '%', background: color } }),
      ),
      H('span', { class: 'text-right font-mono text-[10px] text-zinc-300' }, format(value, metric)),
    )
  })
  const rangeSection = H('section', { class: 'rounded-xl border border-white/10 bg-[#080c14] p-3' },
    H('div', { class: 'flex flex-wrap items-baseline justify-between gap-2' },
      H('h3', { class: 'text-[11px] font-semibold text-zinc-100' }, metric.label + ' - ' + metric.unit),
      H('span', { class: 'text-[9px] text-zinc-600' }, 'Shared linear scale - baseline at zero'),
    ),
    H('div', { class: 'mt-3 space-y-3' }, ...rangeRows),
  )

  const distributionTableRows: Array<VNode> = [
    H('tr', { class: 'border-t border-white/[0.06]' },
      H('th', { scope: 'row', class: 'px-2 py-1 text-[10px] text-zinc-400' }, 'selected (' + elements.length + ')'),
      ...[chartStats.n, chartStats.mean, chartStats.median, chartStats.sd, chartStats.min, chartStats.max].map((value, index) => H('td', { key: index, class: 'px-2 py-1 text-right font-mono text-[10px] text-zinc-200' }, Number.isFinite(value) ? fmtNumber(value, index === 0 ? 0 : 3) : '-')),
    ),
    H('tr', { class: 'border-t border-white/[0.06]' },
      H('th', { scope: 'row', class: 'px-2 py-1 text-[10px] text-zinc-400' }, 'all elements'),
      ...[allStats.n, allStats.mean, allStats.median, allStats.sd, allStats.min, allStats.max].map((value, index) => H('td', { key: 'a' + index, class: 'px-2 py-1 text-right font-mono text-[10px] text-zinc-400' }, Number.isFinite(value) ? fmtNumber(value, index === 0 ? 0 : 3) : '-')),
    ),
  ]
  const distributionCard = H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.02] p-3' },
    H('h3', { class: 'text-[11px] font-semibold text-zinc-100' }, 'Distribution'),
    H('div', { class: 'mt-2 overflow-x-auto' },
      H('table', { class: 'w-full border-collapse text-left' },
        H('thead', null, H('tr', { class: 'bg-white/[0.035]' },
          H('th', { class: 'px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-500' }, 'set'),
          ...['n', 'mean', 'median', 'sd', 'min', 'max'].map((key) => H('th', { key: key, class: 'px-2 py-1 text-right text-[9px] uppercase tracking-wider text-zinc-500' }, key)),
        ),
      ),
        H('tbody', null, distributionTableRows),
      ),
    ),
    H('p', { class: 'mt-1.5 font-mono text-[9px] text-zinc-600' }, 'Standard deviation is the sample SD (n - 1). Missing values are excluded, not imputed.'),
  )

  const correlationSection = H('section', { class: 'grid gap-3 lg:grid-cols-2' },
    H('div', { class: 'rounded-xl border border-white/10 bg-white/[0.02] p-3' },
      H('h3', { class: 'text-[11px] font-semibold text-zinc-100' }, 'Correlation across all 118'),
      H('div', { class: 'mt-2 flex flex-wrap items-center gap-2' },
        H('label', { class: 'text-[9px] text-zinc-500' }, 'x',
          H('select', { value: lab.x, onChange: (event: Event) => { lab.x = (event.target as HTMLSelectElement).value as MetricKey }, class: 'ml-1 rounded border border-white/10 bg-[#0c1220] px-1 py-0.5 text-[9px] text-zinc-300' },
            ...AXIS.map((item) => H('option', { key: item.key, value: item.key }, item.label)),
          ),
        ),
        H('label', { class: 'text-[9px] text-zinc-500' }, 'y',
          H('select', { value: lab.y, onChange: (event: Event) => { lab.y = (event.target as HTMLSelectElement).value as MetricKey }, class: 'ml-1 rounded border border-white/10 bg-[#0c1220] px-1 py-0.5 text-[9px] text-zinc-300' },
            ...AXIS.map((item) => H('option', { key: item.key, value: item.key }, item.label)),
          ),
        ),
        H('label', { class: 'flex items-center gap-1 text-[9px] text-zinc-500' },
          H('input', { type: 'checkbox', checked: lab.log, onChange: (event: Event) => { lab.log = (event.target as HTMLInputElement).checked } }),
          ' log10',
        ),
      ),
      H('p', { class: 'mt-1.5 font-mono text-[10px] text-zinc-400' }, correlationText),
      scatter,
      H('p', { class: 'mt-1.5 text-[9px] leading-relaxed text-zinc-600' }, 'Pearson r is a linear-association statistic; it does not establish causation. With 118 points, |r| below 0.18 is not significantly different from zero at the 5% level.'),
    ),
    distributionCard,
  )

  const comparisonTable = H('div', { class: 'overflow-x-auto rounded-xl border border-white/10' },
    H('table', { class: 'w-full min-w-[560px] border-collapse text-left' },
      H('thead', null, H('tr', { class: 'bg-white/[0.035]' },
        H('th', { class: 'px-3 py-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500' }, 'Property'),
        ...elements.map((element) => H('th', { key: element.number, class: 'px-3 py-2 text-right text-[10px] font-semibold text-zinc-300' }, element.symbol + ' - ' + element.name)),
      ),
      ),
      H('tbody', null, ...METRICS.map((row) => H('tr', { key: row.key, class: 'border-t border-white/[0.06]' },
        H('th', { scope: 'row', class: 'whitespace-nowrap px-3 py-2 text-[10px] font-medium text-zinc-400' }, row.label),
        ...elements.map((element) => H('td', { key: element.number, class: 'whitespace-nowrap px-3 py-2 text-right font-mono text-[10px] text-zinc-200' }, format(valueOf(element, row.key), row))),
      )),
    ),
  ))

  const content = H('div', { class: 'min-h-0 flex-1 space-y-5 overflow-auto p-4' },
    slotCards,
    rangeSection,
    correlationSection,
    comparisonTable,
  )

  const footer = H('footer', { class: 'flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-[9px] text-zinc-600' },
    H('span', null, elements.length + ' of 4 comparison slots used - values from IUPAC / CRC / NIST'),
    H('div', { class: 'flex gap-2' },
      H('button', { type: 'button', onClick: () => download('elementa-compare.csv', tableCsv, 'text/csv;charset=utf-8'), class: 'rounded-md border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[10px] text-sky-300 hover:bg-sky-400/20' }, 'Export CSV'),
      H('button', { type: 'button', onClick: onClose, class: 'rounded-md border border-white/10 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-white/5' }, 'Back to periodic table'),
    ),
  )

  return H('div', { class: 'fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'element-compare-title', onClick: onClose },
    H('section', { class: 'flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0f18] shadow-2xl', onClick: (event: Event) => event.stopPropagation() },
      header,
      content,
      footer,
    ),
  )
}
