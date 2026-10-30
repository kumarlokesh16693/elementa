import type { Block, CategoryKey, ElementData, Phase } from './types'
import { BLOCK_COLORS, CATEGORY_MAP, PHASE_COLORS } from './types'
import { RAW1 } from './data1'
import { RAW2 } from './data2'

function num(s: string | undefined): number | null {
  if (!s || s === '?' || s === '') return null
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : null
}

const PHASE_SET: Phase[] = ['solid', 'liquid', 'gas', 'unknown']

function parseRow(line: string): ElementData {
  const f = line.split('|')
  if (f.length < 24) throw new Error(`Bad element row (${f.length} fields): ${line.slice(0, 60)}`)
  const phase = (PHASE_SET.includes(f[19] as Phase) ? f[19] : 'unknown') as Phase
  return {
    number: parseInt(f[0], 10),
    symbol: f[1],
    name: f[2],
    mass: parseFloat(f[3]),
    category: f[4] as CategoryKey,
    group: parseInt(f[5], 10),
    period: parseInt(f[6], 10),
    xpos: parseInt(f[7], 10),
    ypos: parseInt(f[8], 10),
    config: f[9],
    shells: f[10].split('-').map((s) => parseInt(s, 10)),
    electronegativity: num(f[11]),
    ionizationEnergy: num(f[12]),
    electronAffinity: num(f[13]),
    atomicRadius: num(f[14]),
    meltingPoint: num(f[15]),
    boilingPoint: num(f[16]),
    density: num(f[17]),
    oxidationStates: f[18],
    phase,
    discoveredYear: f[20] === '?' ? null : parseInt(f[20], 10),
    discoveredBy: f[21],
    radioactive: f[22] === 'R',
    summary: f[23] ?? '',
  }
}

const rows = [...RAW1.trim().split('\n'), ...RAW2.trim().split('\n')]
export const ELEMENTS: ElementData[] = rows.map(parseRow).sort((a, b) => a.number - b.number)

export const ELEMENT_MAP: Map<number, ElementData> = new Map(ELEMENTS.map((e) => [e.number, e]))

export function getElement(z: number): ElementData | undefined {
  return ELEMENT_MAP.get(z)
}

/** Elements without a standard atomic weight (bracketed most-stable isotope) */
export function usesBracketMass(el: ElementData): boolean {
  return el.number === 43 || el.number === 61 || el.number >= 84
}

export function blockOf(el: ElementData): Block {
  if (el.category === 'lanthanide' || el.category === 'actinide') return 'f'
  const c = el.config.toLowerCase()
  if (c.includes('f')) return 'f'
  if (c.includes('d')) return 'd'
  if (c.includes('p')) return 'p'
  return 's'
}

/** Outermost-shell (Bohr) valence electron count */
export function valenceOf(el: ElementData): number {
  return el.shells[el.shells.length - 1] ?? 0
}

export function neutronCount(el: ElementData): number {
  return Math.round(el.mass) - el.number
}

/* ---------- Color modes ---------- */

export type HeatField =
  | 'electronegativity'
  | 'ionizationEnergy'
  | 'atomicRadius'
  | 'density'
  | 'meltingPoint'

const HEAT_FIELDS: HeatField[] = [
  'electronegativity',
  'ionizationEnergy',
  'atomicRadius',
  'density',
  'meltingPoint',
]

export function isHeatMode(mode: string): mode is HeatField {
  return (HEAT_FIELDS as string[]).includes(mode)
}

const HEAT_RANGES: Record<HeatField, [number, number]> = {
  electronegativity: [0.7, 3.98],
  ionizationEnergy: [3.8, 24.6],
  atomicRadius: [30, 298],
  density: [0.00009, 22.6],
  meltingPoint: [0.95, 3695],
}

const HEAT_STOPS: [number, number, number][] = [
  [38, 70, 83], // teal-ish dark
  [42, 157, 143], // teal
  [233, 196, 106], // sand
  [244, 162, 97], // orange
  [231, 111, 81], // red-orange
]

function heatColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t))
  const scaled = clamped * (HEAT_STOPS.length - 1)
  const i = Math.min(HEAT_STOPS.length - 2, Math.floor(scaled))
  const local = scaled - i
  const a = HEAT_STOPS[i]
  const b = HEAT_STOPS[i + 1]
  const mix = (x: number, y: number) => Math.round(x + (y - x) * local)
  return `rgb(${mix(a[0], b[0])}, ${mix(a[1], b[1])}, ${mix(a[2], b[2])})`
}

export function heatForField(el: ElementData, field: HeatField): string {
  const v = el[field]
  if (v == null) return '#3f4652'
  const [lo, hi] = HEAT_RANGES[field]
  // density spans orders of magnitude -> use log scale
  const t =
    field === 'density'
      ? (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))
      : (v - lo) / (hi - lo)
  return heatColor(Number.isFinite(t) ? t : 0)
}

export function heatLegend(field: HeatField): { lo: number; hi: number; unit: string } {
  const [lo, hi] = HEAT_RANGES[field]
  const units: Record<HeatField, string> = {
    electronegativity: 'Pauling',
    ionizationEnergy: 'eV',
    atomicRadius: 'pm',
    density: 'g/cm³',
    meltingPoint: 'K',
  }
  return { lo, hi, unit: units[field] }
}

export interface TileColor {
  bg: string
  border: string
  text: string
}

export function tileColor(el: ElementData, mode: string): TileColor {
  let color: string
  if (mode === 'category') color = CATEGORY_MAP[el.category].color
  else if (mode === 'block') color = BLOCK_COLORS[blockOf(el)]
  else if (mode === 'phase') color = PHASE_COLORS[el.phase]
  else if (isHeatMode(mode)) color = heatForField(el, mode)
  else color = CATEGORY_MAP[el.category].color

  return {
    bg: hexWithAlpha(color, 0.13),
    border: hexWithAlpha(color, 0.55),
    text: color,
  }
}

export function hexWithAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgb')) return hex // already rgb(); used only for heat (alpha applied inline)
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* ---------- Formatting ---------- */

export function kelvinToC(k: number | null): number | null {
  return k == null ? null : Math.round((k - 273.15) * 10) / 10
}

export function fmt(value: number | null, unit = '', digits = 2): string {
  if (value == null) return '—'
  const abs = Math.abs(value)
  let s: string
  if (abs !== 0 && (abs < 0.001 || abs >= 1e5)) {
    s = value.toExponential(2)
  } else {
    s = String(Math.round(value * 10 ** digits) / 10 ** digits)
  }
  return unit ? `${s} ${unit}` : s
}

export function configToSuperscript(config: string): string {
  const sup: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  }
  return config.replace(/\d+/g, (d) => [...d].map((c) => sup[c]).join(''))
}

/* ---------- Search ---------- */

export function searchElements(query: string): ElementData[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return ELEMENTS.filter((el) => {
    if (el.name.toLowerCase().includes(q)) return true
    if (el.symbol.toLowerCase() === q) return true
    if (el.symbol.toLowerCase().startsWith(q)) return true
    if (String(el.number) === q) return true
    return false
  }).slice(0, 12)
}

/* ---------- Validation (dev sanity) ---------- */

if (process.env.NODE_ENV !== 'production') {
  const issues: string[] = []
  for (const el of ELEMENTS) {
    const sum = el.shells.reduce((a, b) => a + b, 0)
    if (sum !== el.number) issues.push(`Z=${el.number} shell sum ${sum} != ${el.number}`)
  }
  if (issues.length) console.warn('[periodic] shell sum issues:', issues)
  if (ELEMENTS.length !== 118) console.warn(`[periodic] expected 118 elements, got ${ELEMENTS.length}`)
}
