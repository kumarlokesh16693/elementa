/**
 * Structured element queries.
 *
 * Free-text search stays fuzzy ("iron", "Fe", "26"). If a query contains a
 * comparison operator it is parsed as a conjunction of predicates instead:
 *
 *   Z>50 AND chi>=2.0 AND phase=solid
 *   block=p & group=17 & year<1900
 *   name:carbon
 *
 * Only AND is supported (comma / ampersand / "and"). Unknown fields make the
 * query invalid, so the UI can say why instead of silently returning nothing.
 */

import type { ElementData, Block } from './periodic/types'
import { ELEMENTS, blockOf } from './periodic'

export interface QueryClause {
  field: string
  op: string
  value: string
  test: (el: ElementData) => boolean
}

export interface StructuredQuery {
  clauses: QueryClause[]
  matches: ElementData[]
  label: string
  error: string | null
}

type NumericKey =
  | 'number' | 'mass' | 'electronegativity' | 'ionizationEnergy' | 'electronAffinity'
  | 'atomicRadius' | 'meltingPoint' | 'boilingPoint' | 'density' | 'group' | 'period'
  | 'discoveredYear'

const NUMERIC_ALIASES: Record<string, NumericKey> = {
  z: 'number', number: 'number', atomicnumber: 'number',
  mass: 'mass', weight: 'mass', u: 'mass',
  chi: 'electronegativity', en: 'electronegativity', electronegativity: 'electronegativity',
  ie: 'ionizationEnergy', ionization: 'ionizationEnergy', ionizationenergy: 'ionizationEnergy',
  ea: 'electronAffinity', affinity: 'electronAffinity', electronaffinity: 'electronAffinity',
  radius: 'atomicRadius', atomicradius: 'atomicRadius',
  melt: 'meltingPoint', melting: 'meltingPoint', meltingpoint: 'meltingPoint',
  boil: 'boilingPoint', boiling: 'boilingPoint', boilingpoint: 'boilingPoint',
  density: 'density', rho: 'density',
  group: 'group', period: 'period', row: 'period',
  year: 'discoveredYear', discovered: 'discoveredYear', discoveredyear: 'discoveredYear',
}

const TEXT_ALIASES: Record<string, 'phase' | 'category' | 'block' | 'name' | 'symbol' | 'discoverer'> = {
  phase: 'phase', state: 'phase',
  category: 'category', cat: 'category', class: 'category',
  block: 'block', orbital: 'block',
  name: 'name', element: 'name',
  symbol: 'symbol', sym: 'symbol',
  discoverer: 'discoverer', discoveredby: 'discoverer', by: 'discoverer',
}

const FIELD_LABELS: Record<string, string> = {
  number: 'Z', mass: 'mass', electronegativity: 'chi', ionizationEnergy: 'E1', electronAffinity: 'EA',
  atomicRadius: 'r', meltingPoint: 'Tm', boilingPoint: 'Tb', density: 'rho', group: 'group',
  period: 'period', discoveredYear: 'year', phase: 'phase', category: 'category',
  block: 'block', name: 'name', symbol: 'symbol', discoverer: 'discoverer',
}

const OP_LABEL: Record<string, string> = { '>': '>', '>=': '>=', '<': '<', '<=': '<=', '=': '=', ':': ':' }

const TOKEN = /^([a-zA-Z]+)\s*(>=|<=|>|<|=|:)\s*(.+)$/
const SPLIT = /\s*(?:,|&|\band\b)\s*/i

function numericTest(el: ElementData, key: NumericKey, op: string, value: number): boolean {
  const raw = el[key]
  if (raw == null || !Number.isFinite(raw)) return false
  switch (op) {
    case '>': return raw > value
    case '>=': return raw >= value
    case '<': return raw < value
    case '<=': return raw <= value
    default: return Math.abs(raw - value) < 1e-9
  }
}

function textTest(el: ElementData, key: 'phase' | 'category' | 'block' | 'name' | 'symbol' | 'discoverer', op: string, value: string): boolean {
  const needle = value.trim().toLowerCase()
  if (!needle) return false
  if (key === 'block') {
    const block: Block = blockOf(el)
    return op === ':' ? block.includes(needle) : block === needle
  }
  if (key === 'phase') return el.phase.toLowerCase() === needle
  if (key === 'category') return el.category.toLowerCase() === needle
  if (key === 'symbol') return el.symbol.toLowerCase() === needle
  if (key === 'discoverer') return el.discoveredBy.toLowerCase().includes(needle)
  return el.name.toLowerCase().includes(needle)
}

export function parseStructuredQuery(input: string): StructuredQuery | null {
  const trimmed = input.trim()
  if (!trimmed || !/[<>=:]/.test(trimmed)) return null

  const pieces = trimmed.split(SPLIT).filter(Boolean)
  const clauses: QueryClause[] = []
  const labels: string[] = []
  const errors: string[] = []

  for (const piece of pieces) {
    const match = piece.match(TOKEN)
    if (!match) {
      errors.push(`"${piece.trim()}" is not a field-operator-value clause`)
      continue
    }
    const field = match[1].toLowerCase()
    const op = match[2]
    const value = match[3].trim()

    const numericKey = NUMERIC_ALIASES[field]
    if (numericKey) {
      const parsed = Number.parseFloat(value.replace(/[^0-9.eE+-]/g, ''))
      if (!Number.isFinite(parsed)) {
        errors.push(`"${value}" is not a number for ${field}`)
        continue
      }
      clauses.push({ field: numericKey, op, value: String(parsed), test: (el) => numericTest(el, numericKey, op, parsed) })
      labels.push(`${FIELD_LABELS[numericKey]} ${OP_LABEL[op]} ${parsed}`)
      continue
    }

    const textKey = TEXT_ALIASES[field]
    if (textKey) {
      clauses.push({ field: textKey, op, value, test: (el) => textTest(el, textKey, op, value) })
      labels.push(`${FIELD_LABELS[textKey]} ${OP_LABEL[op]} ${value.toLowerCase()}`)
      continue
    }

    if (field === 'radioactive' || field === 'radio') {
      const truthy = /^(true|yes|1|on)$/i.test(value)
      clauses.push({ field: 'radioactive', op, value, test: (el) => el.radioactive === truthy })
      labels.push(`radioactive = ${truthy}`)
      continue
    }

    errors.push(`unknown field "${field}"`)
  }

  if (!clauses.length) {
    return { clauses, matches: [], label: '', error: errors.length ? errors.join('; ') : 'No valid query clause' }
  }

  const matches = ELEMENTS.filter((el) => clauses.every((clause) => clause.test(el)))
  return { clauses, matches, label: labels.join(' · '), error: errors.length ? errors.join('; ') : null }
}
