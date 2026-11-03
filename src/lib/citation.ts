/**
 * Citation, export and reproducibility helpers.
 */

import type { ElementData } from './periodic/types'
import { APP_VERSION, DATA_RETRIEVED, DATASETS } from './provenance'

export interface CitationInput {
  url: string
  accessed: string
  title: string
}

const APP_TITLE = 'ELEMENTA - interactive periodic table, nuclide chart and orbital lab'

export function buildBibTeX(input: CitationInput = { url: location.href, accessed: DATA_RETRIEVED, title: APP_TITLE }): string {
  const key = `elementa${APP_VERSION.replace(/\./g, '')}`
  return [
    `@software{${key},`,
    `  title        = {${input.title}},`,
    `  author       = {{ELEMENTA contributors}},`,
    `  year         = {2026},`,
    `  version      = {${APP_VERSION}},`,
    `  url          = {${input.url}},`,
    `  note         = {Data retrieved ${input.accessed}. Primary datasets: ${DATASETS.map((d) => d.publisher).join('; ')}.}`,
    `}`,
  ].join('\n')
}

export function buildRIS(input: CitationInput = { url: location.href, accessed: DATA_RETRIEVED, title: APP_TITLE }): string {
  return [
    'TY  - COMP',
    'AU  - ELEMENTA contributors',
    `TI  - ${input.title}`,
    'PY  - 2026',
    `VL  - ${APP_VERSION}`,
    `UR  - ${input.url}`,
    `Y2  - ${input.accessed}`,
    `N1  - Data retrieved ${input.accessed}; primary datasets: ${DATASETS.map((d) => d.title).join('; ')}.`,
    'ER  - ',
  ].join('\n')
}

export function stableStringify(value: unknown): string {
  if (value == null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}

export function viewHash(state: unknown): string {
  const canonical = stableStringify(state)
  let hash = 0x811c9dc5
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export interface Receipt {
  app: string
  version: string
  retrieved: string
  generated: string
  viewHash: string
  url: string
  datasets: Array<{ id: string; version: string; retrieved: string }>
}

export function buildReceipt(state: unknown): Receipt {
  return {
    app: 'ELEMENTA',
    version: APP_VERSION,
    retrieved: DATA_RETRIEVED,
    generated: new Date().toISOString(),
    viewHash: viewHash(state),
    url: location.href,
    datasets: DATASETS.map((dataset) => ({
      id: dataset.id,
      version: dataset.version,
      retrieved: dataset.retrieved,
    })),
  }
}

function escapeCell(value: unknown): string {
  if (value == null) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCSV(headers: string[], rows: unknown[][]): string {
  return [headers.map(escapeCell).join(','), ...rows.map((row) => row.map(escapeCell).join(','))].join('\r\n')
}

export const ELEMENT_CSV_HEADERS = [
  'atomic_number', 'symbol', 'name', 'standard_atomic_weight_u', 'mass_interval_low', 'mass_interval_high',
  'category', 'group', 'period', 'block', 'phase', 'electron_configuration', 'shells',
  'electronegativity_pauling', 'ionization_energy_eV', 'electron_affinity_kJ_mol',
  'atomic_radius_pm', 'melting_point_K', 'boiling_point_K', 'density_g_cm3',
  'oxidation_states', 'radioactive', 'discovered_year', 'discovered_by',
]

export function elementRows(elements: ElementData[], blockOf: (el: ElementData) => string, intervalOf: (z: number) => [number, number] | null): unknown[][] {
  return elements.map((el) => {
    const interval = intervalOf(el.number)
    return [
      el.number, el.symbol, el.name, el.mass,
      interval ? interval[0] : '', interval ? interval[1] : '',
      el.category, el.group || '', el.period, blockOf(el), el.phase, el.config, el.shells.join(' '),
      el.electronegativity, el.ionizationEnergy, el.electronAffinity,
      el.atomicRadius, el.meltingPoint, el.boilingPoint, el.density,
      el.oxidationStates, el.radioactive, el.discoveredYear, el.discoveredBy,
    ]
  })
}

export function download(filename: string, text: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function buildIssueReport(view: Record<string, unknown>, note = ''): string {
  const receipt = buildReceipt(view)
  return [
    '## Data issue report',
    '',
    note || '_Describe the value you believe is wrong and what you expected._',
    '',
    '### View state',
    '```json',
    JSON.stringify(view, null, 2),
    '```',
    '',
    '### Reproducibility receipt',
    '```json',
    JSON.stringify(receipt, null, 2),
    '```',
    '',
    `Open the view: ${location.href}`,
  ].join('\n')
}
