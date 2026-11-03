/**
 * Data-integrity checks for the element table.
 */

import { ELEMENTS, blockOf, getElement } from './periodic'
import type { ElementData } from './periodic/types'
import { ISOTOPES, DECAY_CHAINS, daughterOf, type ChainStep } from './periodic/isotopes'
import { MASS_INTERVALS } from './provenance'

export type CheckStatus = 'pass' | 'warn' | 'fail'

export interface IntegrityCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
  offenders: string[]
}

export interface IntegrityReport {
  scope: string
  generated: string
  checks: IntegrityCheck[]
  pass: number
  warn: number
  fail: number
}

export function makeCheck(
  id: string,
  label: string,
  offenders: string[],
  detail: (count: number) => string,
  severity: 'warn' | 'fail' = 'warn',
): IntegrityCheck {
  const status: CheckStatus = offenders.length === 0 ? 'pass' : severity
  return { id, label, status, detail: detail(offenders.length), offenders: offenders.slice(0, 24) }
}

const FIELD_LABELS: Record<string, string> = {
  electronegativity: 'electronegativity',
  ionizationEnergy: 'ionization energy',
  electronAffinity: 'electron affinity',
  atomicRadius: 'atomic radius',
  meltingPoint: 'melting point',
  boilingPoint: 'boiling point',
  density: 'density',
}

const SANITY: Record<string, [number, number]> = {
  mass: [0.9, 320],
  electronegativity: [0, 4.2],
  ionizationEnergy: [0, 32],
  electronAffinity: [-400, 400],
  atomicRadius: [0, 420],
  meltingPoint: [0, 5000],
  boilingPoint: [0, 6000],
  density: [0, 30],
}

export function runElementChecks(): IntegrityReport {
  const checks: IntegrityCheck[] = []

  checks.push(makeCheck(
    'element-count',
    'Element roster completeness',
    ELEMENTS.length === 118 ? [] : [`expected 118 rows, found ${ELEMENTS.length}`],
    (n) => (n ? `${ELEMENTS.length} rows present; the table is incomplete.` : 'All 118 elements are present.'),
    'fail',
  ))

  const seenNumber = new Map<number, number>()
  const seenSymbol = new Map<string, number>()
  for (const el of ELEMENTS) {
    seenNumber.set(el.number, (seenNumber.get(el.number) ?? 0) + 1)
    seenSymbol.set(el.symbol, (seenSymbol.get(el.symbol) ?? 0) + 1)
  }
  const duplicates = [
    ...[...seenNumber.entries()].filter(([, n]) => n > 1).map(([z]) => `Z ${z}`),
    ...[...seenSymbol.entries()].filter(([, n]) => n > 1).map(([sym]) => sym),
  ]
  checks.push(makeCheck('unique-keys', 'Unique atomic numbers and symbols', duplicates,
    (n) => (n ? `${n} duplicate key${n === 1 ? '' : 's'}.` : '118 atomic numbers and 118 symbols are unique.'), 'fail'))

  const shellOffenders = ELEMENTS
    .filter((el) => el.shells.reduce((a, b) => a + b, 0) !== el.number)
    .map((el) => `${el.symbol}: shell sum ${el.shells.reduce((a, b) => a + b, 0)} != Z ${el.number}`)
  checks.push(makeCheck('shell-sum', 'Shell populations sum to Z', shellOffenders,
    (n) => (n ? `${n} element${n === 1 ? '' : 's'} disagree with their atomic number.` : 'Every shell list sums to its atomic number.'), 'fail'))

  const radioactiveOffenders = ELEMENTS
    .filter((el) => (el.number === 43 || el.number === 61 || el.number >= 84) && !el.radioactive)
    .map((el) => `${el.symbol} (Z ${el.number}) is not flagged radioactive`)
  checks.push(makeCheck('radioactive-flag', 'No stable isotope => radioactive flag', radioactiveOffenders,
    (n) => (n ? `${n} element${n === 1 ? '' : 's'} should be flagged radioactive.` : 'Tc, Pm and Z >= 84 are all flagged.')))

  const abundanceOffenders: string[] = []
  let abundanceGroups = 0
  for (const [key, rows] of Object.entries(ISOTOPES)) {
    const withAbundance = rows.filter((row) => row.abundance != null)
    if (!withAbundance.length) continue
    abundanceGroups++
    const sum = withAbundance.reduce((acc, row) => acc + (row.abundance ?? 0), 0)
    if (Math.abs(sum - 100) > 1.5) {
      const el = getElement(Number(key))
      abundanceOffenders.push(`${el ? el.symbol : 'Z ' + key}: abundance sum ${sum.toFixed(2)}%`)
    }
  }
  checks.push(makeCheck('abundance-sum', 'Natural isotope abundances sum to 100%', abundanceOffenders,
    (n) => (n ? `${n} of ${abundanceGroups} elements with listed abundances do not sum to 100 +- 1.5%.` : `${abundanceGroups} element abundance sets sum to 100 +- 1.5%.`)))

  const chainOffenders: string[] = []
  for (const chain of DECAY_CHAINS) {
    for (let i = 0; i < chain.steps.length - 1; i++) {
      const step: ChainStep = chain.steps[i]
      const next = chain.steps[i + 1]
      const daughter = daughterOf(step.z, step.a, step.mode)
      const expected = `${getElement(next.z) ? getElement(next.z)!.symbol : '?'}-${next.a}`
      if (daughter !== expected) {
        chainOffenders.push(`${chain.name}: step ${step.a} predicts ${daughter ?? 'unknown'} but next is ${expected}`)
      }
    }
  }
  checks.push(makeCheck('chain-continuity', 'Decay-chain steps connect', chainOffenders,
    (n) => (n ? `${n} chain step${n === 1 ? '' : 's'} do not connect to the next member.` : `${DECAY_CHAINS.length} named chains connect end to end.`)))

  const sanityOffenders: string[] = []
  for (const el of ELEMENTS) {
    for (const [field, [lo, hi]] of Object.entries(SANITY)) {
      const value = el[field as keyof ElementData] as number | null
      if (value != null && (value < lo || value > hi)) {
        sanityOffenders.push(`${el.symbol}.${field} = ${value}`)
      }
    }
  }
  checks.push(makeCheck('value-bounds', 'Physical values inside sanity bounds', sanityOffenders,
    (n) => (n ? `${n} value${n === 1 ? '' : 's'} fall outside the configured bounds.` : 'All numeric fields are inside their configured bounds.')))

  const massOffenders: string[] = []
  for (const el of ELEMENTS) {
    if (el.mass < el.number * 0.9 || el.mass > el.number * 3 + 3) {
      massOffenders.push(`${el.symbol}: ${el.mass} u for Z ${el.number}`)
    }
  }
  checks.push(makeCheck('mass-scale', 'Atomic weight scales with Z', massOffenders,
    (n) => (n ? `${n} mass${n === 1 ? '' : 'es'} are far from the expected A ~ 2-2.5 Z.` : 'Every atomic weight is consistent with A ~ 2-2.5 Z.')))

  const intervalOffenders = Object.entries(MASS_INTERVALS)
    .filter(([z, [lo, hi]]) => {
      const el = getElement(Number(z))
      return !el || lo >= hi || el.mass < lo - 1e-6 || el.mass > hi + 1e-6
    })
    .map(([z, [lo, hi]]) => {
      const el = getElement(Number(z))
      const symbol = el ? el.symbol : `Z ${z}`
      const mass = el ? el.mass : Number.NaN
      return `${symbol}: display ${mass} outside [${lo}, ${hi}]`
    })
  checks.push(makeCheck('weight-intervals', 'Interval atomic weights consistent with the table', intervalOffenders,
    (n) => (n ? `${n} interval value${n === 1 ? '' : 's'} disagree with the single-value mass.` : `${Object.keys(MASS_INTERVALS).length} interval weights are consistent with their single-value display.`)))

  const coverageFields = ['electronegativity', 'ionizationEnergy', 'electronAffinity', 'atomicRadius', 'meltingPoint', 'boilingPoint', 'density']
  for (const field of coverageFields) {
    const known = ELEMENTS.filter((el) => el[field as keyof ElementData] != null).length
    const pct = (known / ELEMENTS.length) * 100
    checks.push(makeCheck(
      `coverage-${field}`,
      `Coverage: ${FIELD_LABELS[field] ?? field}`,
      pct < 50 ? [`only ${pct.toFixed(0)}% of elements have a value`] : [],
      () => `${known}/${ELEMENTS.length} elements (${pct.toFixed(0)}%) have a reference value.`,
    ))
  }

  const blockOffenders = ELEMENTS.filter((el) => !['s', 'p', 'd', 'f'].includes(blockOf(el)))
    .map((el) => `${el.symbol}: block ${blockOf(el)}`)
  checks.push(makeCheck('block', 'Every element maps to an orbital block', blockOffenders,
    (n) => (n ? `${n} elements have no valid block.` : 's/p/d/f assignment covers all 118 elements.'), 'fail'))

  const pass = checks.filter((check) => check.status === 'pass').length
  const warn = checks.filter((check) => check.status === 'warn').length
  const fail = checks.filter((check) => check.status === 'fail').length
  const scope = `${ELEMENTS.length} elements, ${abundanceGroups} abundance sets, ${DECAY_CHAINS.length} decay chains`
  return { scope, generated: new Date().toISOString(), checks, pass, warn, fail }
}

export function elementCheckSummary(): { pass: number; warn: number; fail: number; total: number; status: CheckStatus } {
  const report = runElementChecks()
  const status: CheckStatus = report.fail ? 'fail' : report.warn ? 'warn' : 'pass'
  return { pass: report.pass, warn: report.warn, fail: report.fail, total: report.checks.length, status }
}
