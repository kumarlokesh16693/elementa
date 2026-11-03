/**
 * BATEMAN EQUATION DECAY & EQUILIBRIUM ENGINE
 *
 * Solves the coupled differential equations governing radioactive decay chains:
 *   dN_1/dt = -λ_1 N_1
 *   dN_i/dt = b_{i-1} λ_{i-1} N_{i-1} - λ_i N_i   (for radioactive daughters)
 *   dN_k/dt = b_{k-1} λ_{k-1} N_{k-1}             (for terminal stable nuclides)
 *
 * Provides:
 * - Analytical Bateman equation evaluation with numerical stability protections
 * - Real physical units: Activity (Bq, Ci), Atom count (N), Mass (g, mg, kg)
 * - Decay particle tracking (cumulative alphas, betas)
 * - Transient & secular equilibrium classification with peak time (t_max)
 * - Pre-configured historical and industrial decay series
 */

import { nucAt, atomicMassU, chainOf, type Nuclide } from './nuclides'

export const AVOGADRO = 6.02214076e23
export const BECQUEREL_PER_CURIE = 3.7e10
export const LN2 = Math.LN2

export type AmountUnit =
  | 'g'
  | 'mg'
  | 'kg'
  | 'Bq'
  | 'kBq'
  | 'MBq'
  | 'GBq'
  | 'Ci'
  | 'mCi'
  | 'uCi'
  | 'atoms'

export type PlotMetric = 'activity' | 'atoms' | 'mass'
export type TimeScale = 'log' | 'linear'
export type MetricScale = 'log' | 'linear'

export interface BatemanChainMember {
  nuclide: Nuclide
  name: string
  z: number
  n: number
  a: number
  sym: string
  lambda: number // in s^-1; 0 for stable
  halfLifeSec: number | null
  branch: number // branch fraction into this member (0..1)
  isStable: boolean
  decayMode: string
  color: string
}

export interface BatemanPreset {
  id: string
  title: string
  subtitle: string
  rootZ: number
  rootN: number
  defaultUnit: AmountUnit
  defaultAmount: number
  description: string
}

export interface MemberEvaluation {
  member: BatemanChainMember
  atoms: number
  activityBq: number
  activityCi: number
  massGrams: number
  massFraction: number
  activityRatioToParent: number // A_i / A_1
}

export interface BatemanStepSnapshot {
  t: number
  members: MemberEvaluation[]
  totalActivityBq: number
  totalActivityCi: number
  totalMassGrams: number
  totalAlphaEmitted: number
  totalBetaEmitted: number
}

export interface EquilibriumAnalysis {
  type: 'secular' | 'transient' | 'none' | 'stable' | 'single'
  label: string
  headline: string
  parentHalfLife: number | null
  daughterHalfLife: number | null
  halfLifeRatio: number | null // T_parent / T_daughter
  asymptoticActivityRatio: number | null // λ_d / (λ_d - λ_p)
  tMaxSec: number | null // time of daughter maximum activity
  tMaxFormatted: string | null
  notes: string[]
}

const PALETTE = [
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
  '#3b82f6', // blue-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#e11d48', // rose-600
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#6366f1', // indigo-500
  '#d946ef', // fuchsia-500
  '#64748b', // slate-500
]

export const BATEMAN_PRESETS: BatemanPreset[] = [
  {
    id: 'ba140',
    title: '¹⁴⁰Ba → ¹⁴⁰La Fission Transient',
    subtitle: 'Classic Transient Equilibrium (Fission Product Ingrowth)',
    rootZ: 56,
    rootN: 84,
    defaultUnit: 'MBq',
    defaultAmount: 100,
    description:
      'Barium-140 (t½ = 12.75 d) decays to Lanthanum-140 (t½ = 1.678 d). La-140 activity peaks at t_max ≈ 6.57 d, exceeding parent activity by 15.2% before decaying in lockstep.',
  },
  {
    id: 'sr90',
    title: '⁹⁰Sr → ⁹⁰Y Bone-Seeker',
    subtitle: 'Classic Secular Equilibrium (T½ parent >> 100× T½ daughter)',
    rootZ: 38,
    rootN: 52,
    defaultUnit: 'MBq',
    defaultAmount: 50,
    description:
      'Strontium-90 (t½ = 28.8 y) decays to energetic beta emitter Yttrium-90 (t½ = 64.0 h). Reaches 1:1 activity secular equilibrium within ~20 days.',
  },
  {
    id: 'u238',
    title: '²³⁸U Decay Series (Primordial)',
    subtitle: 'Geological 15-step Cascade to Stable ²⁰⁶Pb',
    rootZ: 92,
    rootN: 146,
    defaultUnit: 'g',
    defaultAmount: 1.0,
    description:
      'The primordial 4.47-billion-year cascade passing through Ra-226, Rn-222 gas, and polonium isotopes down to stable Lead-206. Foundation of U-Pb radiometric geochronology.',
  },
  {
    id: 'ra226',
    title: '²²⁶Ra → ²²²Rn Curie Generator',
    subtitle: 'Radium-to-Radon Gas Secular Ingrowth',
    rootZ: 88,
    rootN: 138,
    defaultUnit: 'mCi',
    defaultAmount: 10,
    description:
      'Radium-226 (t½ = 1600 y) decays via alpha to noble gas Radon-222 (t½ = 3.82 d). Equilibrium gas activity builds up over 3 weeks.',
  },
  {
    id: 'rn222',
    title: '²²²Rn Radon Ingrowth & Progeny',
    subtitle: 'Indoor Radiation Hazard & Short-lived Alpha Ingrowth',
    rootZ: 86,
    rootN: 136,
    defaultUnit: 'kBq',
    defaultAmount: 10,
    description:
      'Radon-222 (t½ = 3.82 d) emanates from stone. In closed air, toxic alpha-emitting daughters (Po-218, Pb-214, Bi-214, Po-214) accumulate within 3 hours.',
  },
  {
    id: 'pb210',
    title: '²¹⁰Pb → ²¹⁰Bi → ²¹⁰Po Ingrowth',
    subtitle: 'Alpha-Emitting Polonium Accumulation',
    rootZ: 82,
    rootN: 128,
    defaultUnit: 'kBq',
    defaultAmount: 100,
    description:
      'Lead-210 (t½ = 22.2 y) decays through Bi-210 to dangerous alpha emitter Polonium-210 (t½ = 138.4 d). Po-210 activity peaks after ~2 years.',
  },
  {
    id: 'th232',
    title: '²³²Th Thorium Series to ²⁰⁸Pb',
    subtitle: 'Primordial 14-billion-year Thorium Cascade',
    rootZ: 90,
    rootN: 142,
    defaultUnit: 'g',
    defaultAmount: 1.0,
    description:
      'Thorium-232 (t½ = 14.0 Gy) decays through Radium-228, Actinium-228, and Radon-220 (thoron) to stable Lead-208.',
  },
  {
    id: 'c14',
    title: '¹⁴C → ¹⁴N Radiocarbon Clock',
    subtitle: 'Single-step Beta Decay for Archaeological Dating',
    rootZ: 6,
    rootN: 8,
    defaultUnit: 'Bq',
    defaultAmount: 250,
    description:
      'Carbon-14 (t½ = 5,700 y) decays directly into stable Nitrogen-14. Used to date organic artifacts up to ~50,000 years old.',
  },
]

/**
 * Extract the decay chain starting at `root`, including up to maxSteps and terminating
 * at the stable end product.
 */
export function buildBatemanChain(root: Nuclide, maxSteps = 16): BatemanChainMember[] {
  const nuclides = chainOf(root).slice(0, maxSteps)
  const members: BatemanChainMember[] = []

  for (let i = 0; i < nuclides.length; i++) {
    const nu = nuclides[i]
    const isStable = nu.stable || nu.hlSec == null || nu.unbound
    const lambda = isStable || !nu.hlSec || nu.hlSec <= 0 ? 0 : LN2 / nu.hlSec
    const prevDecay = i > 0 ? nuclides[i - 1].decays[0] : null
    const branch = prevDecay?.pct != null ? prevDecay.pct / 100 : 1.0
    const mode = prevDecay ? prevDecay.code : ''

    members.push({
      nuclide: nu,
      name: `${nu.sym}-${nu.a}`,
      z: nu.z,
      n: nu.n,
      a: nu.a,
      sym: nu.sym,
      lambda,
      halfLifeSec: isStable ? null : nu.hlSec,
      branch: Math.max(0, Math.min(1, branch)),
      isStable,
      decayMode: mode,
      color: PALETTE[i % PALETTE.length],
    })

    if (isStable) break
  }

  return members
}

/**
 * Convert user input (mass, activity, or atom count) into initial parent atoms N0.
 */
export function convertAmountToAtoms(amount: number, unit: AmountUnit, parent: Nuclide): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0

  const massU = atomicMassU(parent) ?? parent.a
  const molarMassG = massU // 1 u ≈ 1 g/mol
  const lambda = parent.hlSec && parent.hlSec > 0 ? LN2 / parent.hlSec : 0

  switch (unit) {
    case 'atoms':
      return amount
    case 'g':
      return (amount / molarMassG) * AVOGADRO
    case 'mg':
      return (amount * 1e-3 / molarMassG) * AVOGADRO
    case 'kg':
      return (amount * 1e3 / molarMassG) * AVOGADRO
    case 'Bq':
      return lambda > 0 ? amount / lambda : 0
    case 'kBq':
      return lambda > 0 ? (amount * 1e3) / lambda : 0
    case 'MBq':
      return lambda > 0 ? (amount * 1e6) / lambda : 0
    case 'GBq':
      return lambda > 0 ? (amount * 1e9) / lambda : 0
    case 'Ci':
      return lambda > 0 ? (amount * BECQUEREL_PER_CURIE) / lambda : 0
    case 'mCi':
      return lambda > 0 ? (amount * 1e-3 * BECQUEREL_PER_CURIE) / lambda : 0
    case 'uCi':
      return lambda > 0 ? (amount * 1e-6 * BECQUEREL_PER_CURIE) / lambda : 0
  }
}

/**
 * Analytical Bateman Equation solver with numerical safeguards.
 * Evaluates the populations N_i(t) for every chain member at a given time t (seconds).
 */
export function evaluateBatemanAtTime(
  chain: BatemanChainMember[],
  n0: number,
  t: number,
): BatemanStepSnapshot {
  const K = chain.length
  const atoms = new Array<number>(K).fill(0)

  if (K === 0 || n0 <= 0 || t < 0) {
    return {
      t,
      members: [],
      totalActivityBq: 0,
      totalActivityCi: 0,
      totalMassGrams: 0,
      totalAlphaEmitted: 0,
      totalBetaEmitted: 0,
    }
  }

  // Member 0 (parent)
  const l0 = chain[0].lambda
  atoms[0] = l0 > 0 ? n0 * Math.exp(-l0 * t) : n0

  // For intermediate members:
  // We use the analytical Bateman equation:
  // N_i(t) = N0 * (prod_{k=0}^{i-1} b_{k+1} λ_k) * sum_{j=0}^i [ exp(-λ_j * t) / prod_{p=0, p!=j}^i (λ_p - λ_j) ]
  for (let i = 1; i < K; i++) {
    if (chain[i].isStable) {
      // Stable terminal member:
      // In a strict chain, N_stable(t) is total decays from the previous member.
      // If there's 100% branching along the chain, total nuclei is conserved: N0 - sum_{j=0}^{i-1} N_j(t).
      // For branched chains, we integrate the previous daughter's activity.
      const prevL = chain[i - 1].lambda
      const branch = chain[i].branch
      if (prevL > 0) {
        // Approximate conservation if dominant branch:
        let sumActive = 0
        for (let j = 0; j < i; j++) sumActive += atoms[j]
        atoms[i] = Math.max(0, n0 - sumActive)
      } else {
        atoms[i] = 0
      }
      continue
    }

    // Radioactive daughter i:
    let branchProd = 1
    for (let k = 1; k <= i; k++) branchProd *= chain[k].branch

    let rateProd = 1
    for (let k = 0; k < i; k++) rateProd *= chain[k].lambda

    let sum = 0
    let valid = true

    for (let j = 0; j <= i; j++) {
      let denom = 1
      const lj = chain[j].lambda
      for (let p = 0; p <= i; p++) {
        if (p === j) continue
        const diff = chain[p].lambda - lj
        if (Math.abs(diff) < 1e-30) {
          valid = false
          break
        }
        denom *= diff
      }
      if (!valid) break
      sum += Math.exp(-lj * t) / denom
    }

    const calculated = branchProd * rateProd * sum * n0

    // Safeguard against floating point cancellation in long stiff chains:
    // If analytical formula loses significance (e.g. negative or extreme NaN), fallback to secular QSSA
    if (!valid || !Number.isFinite(calculated) || calculated < 0) {
      const prev = atoms[i - 1]
      const curL = chain[i].lambda
      const prevL = chain[i - 1].lambda
      if (curL > 0 && prevL > 0 && curL > prevL * 10) {
        // Secular equilibrium approximation
        atoms[i] = (chain[i].branch * prevL * prev) / curL
      } else {
        atoms[i] = 0
      }
    } else {
      atoms[i] = calculated
    }
  }

  // Compile full snapshot
  const members: MemberEvaluation[] = []
  let totalActivityBq = 0
  let totalMassGrams = 0
  let totalAlphaEmitted = 0
  let totalBetaEmitted = 0

  const parentActivity = chain[0].lambda * atoms[0]

  for (let i = 0; i < K; i++) {
    const mem = chain[i]
    const count = atoms[i]
    const actBq = mem.lambda > 0 ? mem.lambda * count : 0
    const actCi = actBq / BECQUEREL_PER_CURIE
    const massU = atomicMassU(mem.nuclide) ?? mem.a
    const massG = (count * massU) / AVOGADRO
    const fraction = count / n0
    const ratioToParent = parentActivity > 0 ? actBq / parentActivity : 0

    totalActivityBq += actBq
    totalMassGrams += massG

    members.push({
      member: mem,
      atoms: count,
      activityBq: actBq,
      activityCi: actCi,
      massGrams: massG,
      massFraction: fraction,
      activityRatioToParent: ratioToParent,
    })
  }

  // Count emitted radiation from decays of parent and daughters
  const decayedParent = Math.max(0, n0 - atoms[0])
  for (let i = 0; i < K - 1; i++) {
    const mem = chain[i]
    const decaysFromMem = mem.lambda > 0 ? Math.max(0, n0 - atoms[i]) : 0
    const primaryMode = mem.nuclide.decays[0]?.code ?? ''
    if (primaryMode === 'A') {
      totalAlphaEmitted += decaysFromMem * (mem.nuclide.decays[0]?.pct ?? 100) / 100
    } else if (primaryMode.startsWith('B-')) {
      totalBetaEmitted += decaysFromMem * (mem.nuclide.decays[0]?.pct ?? 100) / 100
    }
  }

  return {
    t,
    members,
    totalActivityBq,
    totalActivityCi: totalActivityBq / BECQUEREL_PER_CURIE,
    totalMassGrams,
    totalAlphaEmitted,
    totalBetaEmitted,
  }
}

/**
 * Determine suitable time horizon and key simulation points.
 */
export function determineTimeBounds(chain: BatemanChainMember[]): {
  tMin: number
  tEnd: number
  tMaxDaughter: number | null
} {
  if (chain.length === 0) return { tMin: 1, tEnd: 86400, tMaxDaughter: null }

  const p = chain[0]
  const d = chain.length > 1 ? chain[1] : null

  let tMaxDaughter: number | null = null
  if (d && p.lambda > 0 && d.lambda > 0 && Math.abs(p.lambda - d.lambda) > 1e-30) {
    tMaxDaughter = Math.log(d.lambda / p.lambda) / (d.lambda - p.lambda)
  }

  const activeHls = chain
    .filter((m) => !m.isStable && m.halfLifeSec && m.halfLifeSec > 0)
    .map((m) => m.halfLifeSec!)

  if (activeHls.length === 0) return { tMin: 1, tEnd: 86400, tMaxDaughter: null }

  const minHl = Math.min(...activeHls)
  const maxHl = Math.max(...activeHls)

  const parentHl = p.halfLifeSec ?? 86400
  const tMin = Math.max(1e-6, minHl * 0.01)
  let tEnd = parentHl * 6

  // If daughter is much longer lived than parent, extend to see daughter decay
  if (d && d.halfLifeSec && d.halfLifeSec > parentHl) {
    tEnd = d.halfLifeSec * 5
  }

  tEnd = Math.max(tEnd, (tMaxDaughter ?? 0) * 4, tMin * 100)

  return { tMin, tEnd, tMaxDaughter }
}

/**
 * Classify physical equilibrium between parent and daughter.
 */
export function analyzeEquilibrium(chain: BatemanChainMember[]): EquilibriumAnalysis {
  if (chain.length <= 1) {
    return {
      type: 'single',
      label: 'Single-Step Decay',
      headline: 'No daughters with active decay in the configured series.',
      parentHalfLife: chain[0]?.halfLifeSec ?? null,
      daughterHalfLife: null,
      halfLifeRatio: null,
      asymptoticActivityRatio: null,
      tMaxSec: null,
      tMaxFormatted: null,
      notes: ['No radioactive daughter chain exists for this nuclide.'],
    }
  }

  const p = chain[0]
  const d = chain[1]

  if (p.isStable) {
    return {
      type: 'stable',
      label: 'Stable Parent',
      headline: `${p.name} is stable; no radioactive decay occurs.`,
      parentHalfLife: null,
      daughterHalfLife: null,
      halfLifeRatio: null,
      asymptoticActivityRatio: null,
      tMaxSec: null,
      tMaxFormatted: null,
      notes: ['Natural stability terminates radioactive chains.'],
    }
  }

  const pHl = p.halfLifeSec ?? 0
  const dHl = d.halfLifeSec ?? 0

  if (d.isStable || dHl <= 0) {
    return {
      type: 'single',
      label: 'Decay to Stable Product',
      headline: `${p.name} decays directly into stable ${d.name}.`,
      parentHalfLife: pHl,
      daughterHalfLife: null,
      halfLifeRatio: null,
      asymptoticActivityRatio: 0,
      tMaxSec: null,
      tMaxFormatted: null,
      notes: [`${d.name} accumulates steadily with N(t) = N₀(1 - e^{–λt}).`],
    }
  }

  const ratio = pHl / dHl
  let tMax: number | null = null
  if (p.lambda > 0 && d.lambda > 0 && Math.abs(p.lambda - d.lambda) > 1e-30) {
    tMax = Math.log(d.lambda / p.lambda) / (d.lambda - p.lambda)
  }

  const notes: string[] = []

  if (ratio >= 100) {
    const asymp = 1.0 * d.branch
    notes.push(
      `Parent half-life (${formatDuration(pHl)}) is > 100× longer than daughter (${formatDuration(dHl)}).`,
    )
    notes.push(`Daughter activity rises and locks into 1:1 parity with parent activity: A_d(t) → A_p(t).`)
    notes.push(
      `Full secular equilibrium is achieved at ~7 half-lives of the daughter (${formatDuration(dHl * 7)}).`,
    )
    return {
      type: 'secular',
      label: 'Secular Equilibrium',
      headline: `T½(Parent) >> T½(Daughter): Activity locks into equality (A_d / A_p → 1.00)`,
      parentHalfLife: pHl,
      daughterHalfLife: dHl,
      halfLifeRatio: ratio,
      asymptoticActivityRatio: asymp,
      tMaxSec: tMax,
      tMaxFormatted: tMax != null ? formatDuration(tMax) : null,
      notes,
    }
  } else if (ratio > 1) {
    const asymp = (d.lambda / (d.lambda - p.lambda)) * d.branch
    notes.push(
      `Parent half-life (${formatDuration(pHl)}) is moderately longer than daughter (${formatDuration(dHl)}).`,
    )
    notes.push(
      `Daughter activity peaks at t_max = ${tMax != null ? formatDuration(tMax) : '—'}, exceeding parent activity.`,
    )
    notes.push(
      `After t_max, daughter decays with the parent’s apparent half-life at a constant ratio A_d / A_p → ${asymp.toFixed(3)}.`,
    )
    return {
      type: 'transient',
      label: 'Transient Equilibrium',
      headline: `T½(Parent) > T½(Daughter): Peak at t_max, then A_d/A_p → λ_d / (λ_d – λ_p) = ${asymp.toFixed(3)}`,
      parentHalfLife: pHl,
      daughterHalfLife: dHl,
      halfLifeRatio: ratio,
      asymptoticActivityRatio: asymp,
      tMaxSec: tMax,
      tMaxFormatted: tMax != null ? formatDuration(tMax) : null,
      notes,
    }
  } else {
    notes.push(
      `Parent half-life (${formatDuration(pHl)}) is shorter than daughter (${formatDuration(dHl)}).`,
    )
    notes.push(`No equilibrium is possible. The parent decays away, leaving long-lived daughter activity.`)
    return {
      type: 'none',
      label: 'No Equilibrium',
      headline: `T½(Parent) < T½(Daughter): Daughter activity outlasts parent; no steady ratio is reached.`,
      parentHalfLife: pHl,
      daughterHalfLife: dHl,
      halfLifeRatio: ratio,
      asymptoticActivityRatio: null,
      tMaxSec: tMax,
      tMaxFormatted: tMax != null ? formatDuration(tMax) : null,
      notes,
    }
  }
}

/**
 * Format a duration in seconds to an intuitive scientific/human string.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 s'
  if (seconds < 1e-9) return `${(seconds * 1e12).toFixed(2)} ps`
  if (seconds < 1e-6) return `${(seconds * 1e9).toFixed(2)} ns`
  if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(2)} µs`
  if (seconds < 1) return `${(seconds * 1e3).toFixed(2)} ms`
  if (seconds < 60) return `${seconds.toFixed(seconds >= 10 ? 1 : 2)} s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} h`
  if (seconds < 365.25 * 86400) return `${(seconds / 86400).toFixed(1)} d`

  const years = seconds / (365.25 * 86400)
  if (years < 1e3) return `${years.toFixed(years >= 100 ? 0 : 1)} y`
  if (years < 1e6) return `${(years / 1e3).toFixed(2)} ky`
  if (years < 1e9) return `${(years / 1e6).toFixed(2)} Ma`
  return `${(years / 1e9).toFixed(2)} Ga`
}

/**
 * Format activity in Becquerels to human prefix.
 */
export function formatActivityBq(bq: number): string {
  if (!Number.isFinite(bq) || bq <= 0) return '0 Bq'
  if (bq >= 1e15) return `${(bq / 1e15).toFixed(2)} PBq`
  if (bq >= 1e12) return `${(bq / 1e12).toFixed(2)} TBq`
  if (bq >= 1e9) return `${(bq / 1e9).toFixed(2)} GBq`
  if (bq >= 1e6) return `${(bq / 1e6).toFixed(2)} MBq`
  if (bq >= 1e3) return `${(bq / 1e3).toFixed(2)} kBq`
  if (bq >= 1) return `${bq.toFixed(1)} Bq`
  if (bq >= 1e-3) return `${(bq * 1e3).toFixed(2)} mBq`
  return bq.toExponential(2) + ' Bq'
}

/**
 * Format mass in grams to human prefix.
 */
export function formatMassGrams(grams: number): string {
  if (!Number.isFinite(grams) || grams <= 0) return '0 g'
  if (grams >= 1e3) return `${(grams / 1e3).toFixed(2)} kg`
  if (grams >= 1) return `${grams.toFixed(2)} g`
  if (grams >= 1e-3) return `${(grams * 1e3).toFixed(2)} mg`
  if (grams >= 1e-6) return `${(grams * 1e6).toFixed(2)} µg`
  if (grams >= 1e-9) return `${(grams * 1e9).toFixed(2)} ng`
  if (grams >= 1e-12) return `${(grams * 1e12).toFixed(2)} pg`
  return grams.toExponential(2) + ' g'
}

/**
 * Format large atom counts with exponential notation or friendly suffixes.
 */
export function formatAtomCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '0'
  if (count < 1e4) return Math.round(count).toLocaleString()
  return count.toExponential(3)
}
