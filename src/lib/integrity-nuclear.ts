/**
 * Nuclear-data integrity checks (heavy: imports the 3,000-nuclide dataset).
 *
 * Kept in a separate module so the periodic-table entry point never pulls the
 * Segra dataset into its bundle. Used by /integrity.html only.
 */

import {
  NUCLEI,
  STABLE_COUNT,
  NUC_MAP,
  atomicMassU,
  daughtersOf,
  qFor,
  type Nuclide,
} from './periodic/nuclides'
import { makeCheck, type IntegrityCheck, type IntegrityReport } from './integrity'

const Q_POSITIVE_MODES = new Set(['A', 'B-', 'B+', 'EC', 'B+N', 'B-2N', 'B-3N', 'B-N', '2B-', '2P'])

export function runNuclearChecks(): IntegrityReport {
  const checks: IntegrityCheck[] = []

  checks.push(makeCheck(
    'nuclear-count',
    'Ground-state dataset loaded',
    NUCLEI.length < 1000 ? [`only ${NUCLEI.length} nuclides parsed`] : [],
    () => `${NUCLEI.length.toLocaleString()} ground states parsed; ${STABLE_COUNT} flagged stable.`,
    'fail',
  ))

  const anOffenders = NUCLEI.filter((nu) => nu.a !== nu.z + nu.n)
    .slice(0, 30)
    .map((nu) => `${nu.sym}-${nu.a}: A = Z + N (${nu.z} + ${nu.n})`)
  checks.push(makeCheck('nuclear-a', 'Mass number A = Z + N', anOffenders,
    (n) => (n ? `${n} nuclide${n === 1 ? '' : 's'} violate A = Z + N.` : 'A = Z + N for every ground state.'), 'fail'))

  const massOffenders = NUCLEI
    .filter((nu) => {
      const mass = atomicMassU(nu)
      return mass != null && (mass < nu.a - 0.15 || mass > nu.a + 0.25)
    })
    .slice(0, 30)
    .map((nu) => `${nu.sym}-${nu.a}: ${atomicMassU(nu)?.toFixed(4)} u`)

  checks.push(makeCheck('nuclear-mass', 'Mass excess yields a sane atomic mass', massOffenders,
    (n) => (n ? `${n} nuclide${n === 1 ? '' : 's'} fall outside A +/- 0.15-0.25 u.` : 'Every mass excess maps to an atomic mass within 0.15-0.25 u of A.')))

  const halfLifeOffenders = NUCLEI
    .filter((nu) => nu.stable && nu.hlSec != null)
    .slice(0, 30)
    .map((nu) => `${nu.sym}-${nu.a}: stable but has hlSec ${nu.hlSec}`)
  checks.push(makeCheck('nuclear-half-life', 'Stable nuclides carry no numeric half-life', halfLifeOffenders,
    (n) => (n ? `${n} stable nuclide${n === 1 ? '' : 's'} carry a half-life.` : `${STABLE_COUNT} stable nuclides have no numeric half-life.`), 'fail'))

  const qOffenders: string[] = []
  let qChecked = 0
  for (const nu of NUCLEI) {
    for (const decay of nu.decays) {
      if (!Q_POSITIVE_MODES.has(decay.code)) continue
      const q = qFor(nu, decay.code)
      if (q == null) continue
      qChecked++
      if (q < -1) qOffenders.push(`${nu.sym}-${nu.a} ${decay.code}: Q = ${q.toFixed(1)} keV`)
    }
  }
  checks.push(makeCheck('nuclear-q', 'Observed decay modes have positive Q', qOffenders.slice(0, 30),
    (n) => (n
      ? `${n} of ${qChecked.toLocaleString()} recomputed Q values are negative by more than 1 keV.`
      : `${qChecked.toLocaleString()} recomputed Q values are positive for observed decay modes.`)))

  const abundanceOffenders: string[] = []
  const byZ = new Map<number, Nuclide[]>()
  for (const nu of NUCLEI) {
    if (nu.abundance == null) continue
    const list = byZ.get(nu.z) ?? []
    list.push(nu)
    byZ.set(nu.z, list)
  }
  for (const [z, list] of byZ) {
    const sum = list.reduce((acc, nu) => acc + (nu.abundance ?? 0), 0)
    if (Math.abs(sum - 100) > 0.5) {
      abundanceOffenders.push(`Z ${z} (${list[0].sym}): I = ${sum.toFixed(3)}%`)
    }
  }
  checks.push(makeCheck('nuclear-abundance', 'Nuclide abundance sums equal 100%', abundanceOffenders,
    (n) => (n ? `${n} element${n === 1 ? '' : 's'} have nuclide abundances that do not sum to 100 +/- 0.5%.` : `${byZ.size} elements with natural abundances sum to 100 +/- 0.5%.`)))

  const daughterOffenders: string[] = []
  for (const nu of NUCLEI) {
    if (!nu.decays.length) continue
    const daughters = daughtersOf(nu)
    if (!daughters.length) {
      daughterOffenders.push(`${nu.sym}-${nu.a}: no resolvable daughter`)
      continue
    }
    for (const daughter of daughters) {
      if (!NUC_MAP.has(`${daughter.nuclide.z}:${daughter.nuclide.n}`)) {
        daughterOffenders.push(`${nu.sym}-${nu.a} -> ${daughter.label} (missing record)`)
      }
    }
  }
  checks.push(makeCheck('nuclear-daughters', 'Decay daughters resolve to dataset records', daughterOffenders.slice(0, 30),
    (n) => (n ? `${n} decay branch${n === 1 ? '' : 'es'} point at a nuclide that is not in the dataset.` : 'Every resolvable decay branch points at a dataset record.')))

  const jpKnown = NUCLEI.filter((nu) => nu.jp).length
  checks.push(makeCheck('nuclear-jp', 'Spin-parity coverage', jpKnown / NUCLEI.length < 0.5 ? [`only ${((jpKnown / NUCLEI.length) * 100).toFixed(0)}% have JPI`] : [],
    () => `${jpKnown.toLocaleString()}/${NUCLEI.length.toLocaleString()} ground states (${((jpKnown / NUCLEI.length) * 100).toFixed(0)}%) carry a spin-parity assignment.`))

  const yearOffenders = NUCLEI
    .filter((nu) => nu.discovery != null && (nu.discovery < 1895 || nu.discovery > 2026))
    .slice(0, 30)
    .map((nu) => `${nu.sym}-${nu.a}: ${nu.discovery}`)
  checks.push(makeCheck('nuclear-year', 'Discovery years inside the nuclear era', yearOffenders,
    (n) => (n ? `${n} discovery year${n === 1 ? '' : 's'} fall outside 1895-2026.` : 'All listed discovery years are inside 1895-2026.')))

  const pass = checks.filter((check) => check.status === 'pass').length
  const warn = checks.filter((check) => check.status === 'warn').length
  const fail = checks.filter((check) => check.status === 'fail').length
  return { scope: `${NUCLEI.length.toLocaleString()} ground states - ${STABLE_COUNT} stable`, generated: new Date().toISOString(), checks, pass, warn, fail }
}
