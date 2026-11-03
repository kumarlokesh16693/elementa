/**
 * Decay-chain equilibrium calculator.
 */

import type { Nuclide } from './nuclides'

export interface ChainMember {
  nuc: Nuclide
  lambda: number
  branch: number
}

export interface EquilibriumResult {
  members: ChainMember[]
  times: number[]
  activity: number[][]
  tEnd: number
  classification: 'secular' | 'transient' | 'none' | 'insufficient'
  classificationNote: string
  notes: string[]
}

const MAX_MEMBERS = 6
const STEPS = 4000
const LN2 = Math.LN2

function lambdaOf(nu: Nuclide): number | null {
  if (nu.stable || nu.unbound || nu.hlSec == null || !(nu.hlSec > 0)) return null
  return LN2 / nu.hlSec
}

export function buildEquilibrium(chain: Nuclide[]): EquilibriumResult | null {
  if (chain.length < 2) return null
  const members: ChainMember[] = []
  for (const nuc of chain.slice(0, MAX_MEMBERS)) {
    const lambda = lambdaOf(nuc)
    if (lambda == null) break
    members.push({ nuc, lambda, branch: (nuc.decays[0]?.pct ?? 100) / 100 })
  }
  if (members.length < 2) return null

  const shortest = Math.min(...members.map((member) => member.nuc.hlSec ?? Infinity))
  const longest = Math.max(...members.map((member) => member.nuc.hlSec ?? 0))
  const tMin = Math.max(1e-12, shortest / 1000)
  const tEnd = Math.min(1e20, Math.max(longest * 20, tMin * 10))
  const logMin = Math.log10(tMin)
  const logMax = Math.log10(tEnd)

  const times: number[] = []
  const activity: number[][] = members.map(() => [])
  const state = new Array(members.length).fill(0)
  state[0] = 1

  const deriv = (n: number[], out: number[]) => {
    out[0] = -members[0].lambda * n[0]
    for (let i = 1; i < members.length; i++) {
      out[i] = members[i - 1].branch * members[i - 1].lambda * n[i - 1] - members[i].lambda * n[i]
    }
  }

  const k1 = [...state]
  const k2 = new Array<number>(members.length).fill(0)
  const k3 = new Array<number>(members.length).fill(0)
  const k4 = new Array<number>(members.length).fill(0)
  const tmpA = new Array<number>(members.length).fill(0)
  const tmpB = new Array<number>(members.length).fill(0)
  const tmpC = new Array<number>(members.length).fill(0)

  const record = (t: number) => {
    times.push(t)
    for (let i = 0; i < members.length; i++) activity[i].push(members[i].lambda * state[i])
  }
  record(Math.pow(10, logMin))

  let previousT = Math.pow(10, logMin)
  for (let step = 1; step <= STEPS; step++) {
    const t = Math.pow(10, logMin + ((logMax - logMin) * step) / STEPS)
    const dt = t - previousT
    deriv(state, k1)
    for (let i = 0; i < state.length; i++) tmpA[i] = state[i] + (dt / 2) * k1[i]
    deriv(tmpA, k2)
    for (let i = 0; i < state.length; i++) tmpB[i] = state[i] + (dt / 2) * k2[i]
    deriv(tmpB, k3)
    for (let i = 0; i < state.length; i++) tmpC[i] = state[i] + dt * k3[i]
    deriv(tmpC, k4)
    for (let i = 0; i < state.length; i++) {
      state[i] = state[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
      if (state[i] < 0) state[i] = 0
    }
    previousT = t
    if (step % 25 === 0 || step === STEPS) record(t)
  }

  const parentHl = members[0].nuc.hlSec ?? Infinity
  const daughterHl = members[1].nuc.hlSec ?? Infinity
  let classification: EquilibriumResult['classification'] = 'none'
  let classificationNote = ''
  if (!Number.isFinite(parentHl) || !Number.isFinite(daughterHl)) {
    classification = 'insufficient'
    classificationNote = 'At least one half-life in the chain is not measured, so equilibrium cannot be classified.'
  } else if (parentHl > daughterHl * 100) {
    const ratios = activity[1]
      .map((value, index) => (activity[0][index] > 0 ? value / activity[0][index] : 0))
      .filter((value) => Number.isFinite(value) && value > 0)
    const tail = ratios.slice(Math.floor(ratios.length * 0.9))
    const stable = tail.length > 1 && Math.max(...tail) / Math.max(1e-30, Math.min(...tail)) < 1.05
    const lastRatio = tail.length ? tail[tail.length - 1] : 0
    if (stable && Math.abs(lastRatio - 1) < 0.05) {
      classification = 'secular'
      classificationNote = `t_half(parent) / t_half(daughter) ~ ${(parentHl / daughterHl).toExponential(2)} and A_d / A_p -> 1: secular equilibrium.`
    } else if (stable) {
      classification = 'transient'
      classificationNote = `t_half(parent) >> t_half(daughter); A_d / A_p settles at ~ ${lastRatio.toFixed(3)}: transient equilibrium.`
    } else {
      classificationNote = 'The daughter/parent activity ratio has not settled by the end of the plotted interval.'
    }
  } else {
    classificationNote = `t_half(parent) is not much longer than t_half(daughter) (ratio ~ ${(parentHl / daughterHl).toFixed(2)}); no equilibrium is reached.`
  }

  return {
    members,
    times,
    activity,
    tEnd,
    classification,
    classificationNote,
    notes: [
      'Initial condition: parent only, no daughters at t = 0.',
      'Numerical RK4 integration on a log-spaced grid (4000 steps).',
      'Dominant branch only; minor branches and decays outside this chain are ignored.',
      'Relative activities normalised to N_parent(0) = 1; no chemical separation or physical loss.',
    ],
  }
}

export function formatSeconds(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '-'
  const units: Array<[number, string]> = [
    [1, 's'], [60, 'min'], [3600, 'h'], [86400, 'd'], [3.156e7, 'a'], [3.156e16, 'Gy'],
  ]
  let chosen: [number, string] = [1, 's']
  for (const unit of units) if (value >= unit[0]) chosen = unit
  const scaled = value / chosen[0]
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2
  return `${scaled.toFixed(digits)} ${chosen[1]}`
}

export function decadeTicks(tMin: number, tMax: number, count = 6): number[] {
  const lo = Math.floor(Math.log10(tMin))
  const hi = Math.ceil(Math.log10(tMax))
  const stride = Math.max(1, Math.ceil((hi - lo) / count))
  const ticks: number[] = []
  for (let exponent = lo; exponent <= hi; exponent += stride) ticks.push(Math.pow(10, exponent))
  return ticks
}
