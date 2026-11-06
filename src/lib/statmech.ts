/**
 * ELEMENTA — Statistical Mechanics & Phase Transitions Lab
 * Physics Engine: 2D Ising Model & Onsager Exact Solutions
 *
 * Simulates the 2D Square-Lattice Ising Model on an L x L grid with periodic
 * boundary conditions (torus topology) using Metropolis–Hastings Monte Carlo.
 *
 * Hamiltonian:
 *   H = -J ∑_<i,j> s_i s_j - h ∑_i s_i    with s_i ∈ {+1, -1}
 *
 * Features:
 *   - Metropolis–Hastings Monte Carlo with precomputed Boltzmann lookup tables
 *     (zero Math.exp calls in hot loop, zero heap allocations).
 *   - Checkerboard & random update options for detailed-balance ergodic sampling.
 *   - Lars Onsager 1944 exact analytical solution for 2D Ising critical temperature Tc,
 *     exact spontaneous magnetization M(T), and exact internal energy E(T) via AGM complete elliptic integrals.
 *   - Mean-field Weiss comparison: M_MF = tanh(4J M_MF / T) with T_c^MF = 4J.
 *   - Thermodynamic observable accumulators: <m>, <|m|>, <e>, Specific Heat Cv, and Magnetic Susceptibility χ.
 *   - Hysteresis tracking: (h, m) phase space trajectory.
 */

export const L = 128
export const N_SPINS = L * L // 16,384 spins

// Precomputed Torus Periodic Boundary Neighbor Arrays
export const UP_TABLE = new Int32Array(N_SPINS)
export const DOWN_TABLE = new Int32Array(N_SPINS)
export const LEFT_TABLE = new Int32Array(N_SPINS)
export const RIGHT_TABLE = new Int32Array(N_SPINS)

// Checkerboard Sublattices (Bipartite Graph)
const evenIndices: number[] = []
const oddIndices: number[] = []

for (let y = 0; y < L; y++) {
  const upY = y === 0 ? L - 1 : y - 1
  const downY = y === L - 1 ? 0 : y + 1
  for (let x = 0; x < L; x++) {
    const leftX = x === 0 ? L - 1 : x - 1
    const rightX = x === L - 1 ? 0 : x + 1
    const idx = y * L + x

    UP_TABLE[idx] = upY * L + x
    DOWN_TABLE[idx] = downY * L + x
    LEFT_TABLE[idx] = y * L + leftX
    RIGHT_TABLE[idx] = y * L + rightX

    if ((x + y) % 2 === 0) {
      evenIndices.push(idx)
    } else {
      oddIndices.push(idx)
    }
  }
}

export const EVEN_SUBLATTICE = new Int32Array(evenIndices)
export const ODD_SUBLATTICE = new Int32Array(oddIndices)
export const HALF_N = N_SPINS / 2

export interface StatMechParams {
  temperature: number // T ∈ [0.1, 5.0]
  field: number // h ∈ [-2.0, 2.0]
  coupling: number // J ∈ [-1.0, 1.0] (J > 0 ferro, J < 0 antiferro)
  sweepsPerFrame: number // 1 to 20
}

export interface StatMechObservables {
  m: number // Magnetization per spin <m> ∈ [-1, 1]
  absM: number // Absolute magnetization <|m|> ∈ [0, 1]
  e: number // Energy per spin <e>
  cv: number // Specific heat Cv
  chi: number // Magnetic susceptibility χ
  staggeredM: number // Staggered magnetization ∈ [-1, 1]
  sweepsCount: number
}

export interface HysteresisPoint {
  h: number
  m: number
}

export interface StatMechState {
  spins: Int8Array
  probTable: Float64Array // 10 entries: [sIdx * 5 + sumIdx]
  lastT: number
  lastJ: number
  lastH: number
  sweepsCount: number

  // Thermodynamic accumulator rolling stats
  sumM: number
  sumAbsM: number
  sumM2: number
  sumE: number
  sumE2: number
  sampleCount: number

  // Hysteresis trajectory history
  hysteresisHistory: HysteresisPoint[]
}

/**
 * Creates an empty or freshly initialized StatMechState.
 */
export function createStatMechState(): StatMechState {
  const spins = new Int8Array(N_SPINS)
  // Default to random disordered spins
  for (let i = 0; i < N_SPINS; i++) {
    spins[i] = Math.random() < 0.5 ? 1 : -1
  }

  const state: StatMechState = {
    spins,
    probTable: new Float64Array(10),
    lastT: -1,
    lastJ: -999,
    lastH: -999,
    sweepsCount: 0,
    sumM: 0,
    sumAbsM: 0,
    sumM2: 0,
    sumE: 0,
    sumE2: 0,
    sampleCount: 0,
    hysteresisHistory: [],
  }

  updateProbabilityTable(state, 2.269185, 1.0, 0.0)
  return state
}

/**
 * Precomputes the Metropolis transition acceptance probability table:
 *   ΔE = 2 s_i (J ∑ s_j + h)
 *   P(flip) = min(1.0, exp(-ΔE / T))
 *
 * Indexing:
 *   sIdx = (s_i === 1 ? 1 : 0)  ∈ {0, 1}
 *   sumIdx = (∑ s_j + 4) >> 1   ∈ {0, 1, 2, 3, 4} (since ∑ s_j ∈ {-4, -2, 0, 2, 4})
 *   tableIndex = sIdx * 5 + sumIdx
 */
export function updateProbabilityTable(
  state: StatMechState,
  temperature: number,
  coupling: number,
  field: number,
): void {
  const T = Math.max(0.01, temperature)
  const beta = 1.0 / T

  state.lastT = temperature
  state.lastJ = coupling
  state.lastH = field

  const table = state.probTable
  for (let sIdx = 0; sIdx < 2; sIdx++) {
    const s = sIdx === 1 ? 1 : -1
    for (let sumIdx = 0; sumIdx < 5; sumIdx++) {
      const neighborSum = sumIdx * 2 - 4
      const dE = 2 * s * (coupling * neighborSum + field)
      table[sIdx * 5 + sumIdx] = dE <= 0 ? 1.0 : Math.exp(-beta * dE)
    }
  }
}

/**
 * Computes exact Boltzmann transition probability for a given s, neighborSum, T, J, h.
 * Used for testing and validation of detailed balance.
 */
export function computeTransitionProbability(
  s: number,
  neighborSum: number,
  temperature: number,
  coupling: number,
  field: number,
): number {
  const T = Math.max(0.01, temperature)
  const beta = 1.0 / T
  const dE = 2 * s * (coupling * neighborSum + field)
  return dE <= 0 ? 1.0 : Math.exp(-beta * dE)
}

/**
 * Performs one or more full Monte Carlo sweeps (MCS) using checkerboard decomposition.
 * Each sweep attempts N_SPINS spin flips. Zero memory allocations.
 */
export function stepMonteCarloSweep(
  state: StatMechState,
  params: StatMechParams,
  sweeps: number = 1,
): void {
  // Sync lookup table if physical parameters changed
  if (
    params.temperature !== state.lastT ||
    params.coupling !== state.lastJ ||
    params.field !== state.lastH
  ) {
    updateProbabilityTable(
      state,
      params.temperature,
      params.coupling,
      params.field,
    )
  }

  const spins = state.spins
  const table = state.probTable
  const UP = UP_TABLE
  const DOWN = DOWN_TABLE
  const LEFT = LEFT_TABLE
  const RIGHT = RIGHT_TABLE
  const EVEN = EVEN_SUBLATTICE
  const ODD = ODD_SUBLATTICE
  const halfN = HALF_N

  for (let sw = 0; sw < sweeps; sw++) {
    // 1. Update Even Sublattice
    for (let i = 0; i < halfN; i++) {
      const idx = EVEN[i]
      const s = spins[idx]
      const sum = spins[UP[idx]] + spins[DOWN[idx]] + spins[LEFT[idx]] + spins[RIGHT[idx]]
      const sIdx = s > 0 ? 1 : 0
      const sumIdx = (sum + 4) >> 1
      const p = table[sIdx * 5 + sumIdx]
      if (p >= 1.0 || Math.random() < p) {
        spins[idx] = -s as (-1 | 1)
      }
    }

    // 2. Update Odd Sublattice
    for (let i = 0; i < halfN; i++) {
      const idx = ODD[i]
      const s = spins[idx]
      const sum = spins[UP[idx]] + spins[DOWN[idx]] + spins[LEFT[idx]] + spins[RIGHT[idx]]
      const sIdx = s > 0 ? 1 : 0
      const sumIdx = (sum + 4) >> 1
      const p = table[sIdx * 5 + sumIdx]
      if (p >= 1.0 || Math.random() < p) {
        spins[idx] = -s as (-1 | 1)
      }
    }

    state.sweepsCount++
  }
}

/**
 * Computes instantaneous total energy H:
 *   H = -J ∑_<i,j> s_i s_j - h ∑_i s_i
 * For periodic boundary conditions, each bond is counted once by summing right and down neighbors.
 */
export function computeTotalEnergy(
  spins: Int8Array,
  coupling: number,
  field: number,
): number {
  let bondSum = 0
  let spinSum = 0
  const RIGHT = RIGHT_TABLE
  const DOWN = DOWN_TABLE

  for (let i = 0; i < N_SPINS; i++) {
    const s = spins[i]
    spinSum += s
    bondSum += s * (spins[RIGHT[i]] + spins[DOWN[i]])
  }

  return -coupling * bondSum - field * spinSum
}

/**
 * Computes instantaneous magnetization per spin: m = (∑ s_i) / N
 */
export function computeMagnetization(spins: Int8Array): number {
  let sum = 0
  for (let i = 0; i < N_SPINS; i++) {
    sum += spins[i]
  }
  return sum / N_SPINS
}

/**
 * Computes instantaneous staggered magnetization per spin:
 *   m_stag = (1 / N) ∑_{x,y} (-1)^{x+y} s(x, y)
 */
export function computeStaggeredMagnetization(spins: Int8Array): number {
  let sum = 0
  for (let y = 0; y < L; y++) {
    const yRow = y * L
    for (let x = 0; x < L; x++) {
      const sign = (x + y) % 2 === 0 ? 1 : -1
      sum += sign * spins[yRow + x]
    }
  }
  return sum / N_SPINS
}

/**
 * Sample observables and update rolling thermodynamic averages.
 */
export function accumulateObservables(
  state: StatMechState,
  params: StatMechParams,
): StatMechObservables {
  const m = computeMagnetization(state.spins)
  const absM = Math.abs(m)
  const totalE = computeTotalEnergy(state.spins, params.coupling, params.field)
  const e = totalE / N_SPINS
  const stagM = computeStaggeredMagnetization(state.spins)

  // Accumulate with exponential moving average or rolling window to track current regime
  const alpha = 0.04 // Smoothing factor
  if (state.sampleCount === 0) {
    state.sumM = m
    state.sumAbsM = absM
    state.sumM2 = m * m
    state.sumE = e
    state.sumE2 = e * e
    state.sampleCount = 1
  } else {
    state.sumM = state.sumM * (1 - alpha) + m * alpha
    state.sumAbsM = state.sumAbsM * (1 - alpha) + absM * alpha
    state.sumM2 = state.sumM2 * (1 - alpha) + m * m * alpha
    state.sumE = state.sumE * (1 - alpha) + e * alpha
    state.sumE2 = state.sumE2 * (1 - alpha) + e * e * alpha
    state.sampleCount++
  }

  const T = Math.max(0.01, params.temperature)
  const T2 = T * T

  // Specific heat Cv = (N / T^2) * (<e^2> - <e>^2)
  const eVar = Math.max(0, state.sumE2 - state.sumE * state.sumE)
  const cv = (N_SPINS / T2) * eVar

  // Magnetic susceptibility χ = (N / T) * (<m^2> - <|m|>^2)
  const mVar = Math.max(0, state.sumM2 - state.sumAbsM * state.sumAbsM)
  const chi = (N_SPINS / T) * mVar

  // Record hysteresis trajectory (keep latest 300 points)
  state.hysteresisHistory.push({ h: params.field, m })
  if (state.hysteresisHistory.length > 300) {
    state.hysteresisHistory.shift()
  }

  return {
    m,
    absM,
    e,
    cv: Math.min(500.0, cv),
    chi: Math.min(1000.0, chi),
    staggeredM: stagM,
    sweepsCount: state.sweepsCount,
  }
}

/**
 * Resets accumulator moments (called on preset change or manual reset).
 */
export function resetAccumulator(state: StatMechState): void {
  state.sumM = 0
  state.sumAbsM = 0
  state.sumM2 = 0
  state.sumE = 0
  state.sumE2 = 0
  state.sampleCount = 0
  state.hysteresisHistory = []
}

// ============================================================================
// State Initializers & Lattice Configurations
// ============================================================================

export function setLatticeRandom(state: StatMechState): void {
  const spins = state.spins
  for (let i = 0; i < N_SPINS; i++) {
    spins[i] = Math.random() < 0.5 ? 1 : -1
  }
  resetAccumulator(state)
}

export function setLatticeAllUp(state: StatMechState): void {
  state.spins.fill(1)
  resetAccumulator(state)
}

export function setLatticeAllDown(state: StatMechState): void {
  state.spins.fill(-1)
  resetAccumulator(state)
}

export function setLatticeCheckerboard(state: StatMechState): void {
  const spins = state.spins
  for (let y = 0; y < L; y++) {
    const yRow = y * L
    for (let x = 0; x < L; x++) {
      spins[yRow + x] = (x + y) % 2 === 0 ? 1 : -1
    }
  }
  resetAccumulator(state)
}

export function setLatticeDomainWall(state: StatMechState): void {
  const spins = state.spins
  const half = L / 2
  for (let y = 0; y < L; y++) {
    const yRow = y * L
    for (let x = 0; x < L; x++) {
      spins[yRow + x] = x < half ? 1 : -1
    }
  }
  resetAccumulator(state)
}

// ============================================================================
// Analytical & Exact Solutions (Onsager 1944, Yang 1952, Mean Field)
// ============================================================================

/**
 * Exact critical temperature for the 2D Square-Lattice Ising Model:
 *   T_c = 2J / ln(1 + √2) ≈ 2.269185314213...
 */
export function getExactTc(coupling: number = 1.0): number {
  const J = Math.abs(coupling)
  return (2 * J) / Math.log(1 + Math.SQRT2)
}

/**
 * Exact spontaneous magnetization M(T) (Lars Onsager 1944 / C. N. Yang 1952):
 *   M(T) = [ 1 - sinh⁻⁴(2J / T) ]^(1/8)   for T < T_c
 *   M(T) = 0                               for T >= T_c
 */
export function getOnsagerExactMagnetization(
  temperature: number,
  coupling: number = 1.0,
): number {
  const Tc = getExactTc(coupling)
  if (temperature >= Tc || temperature <= 0) return 0.0

  const J = Math.abs(coupling)
  const s = Math.sinh((2 * J) / temperature)
  if (s <= 0) return 0.0

  const term = 1.0 - Math.pow(s, -4)
  if (term <= 0) return 0.0

  return Math.pow(term, 1 / 8)
}

/**
 * Complete Elliptic Integral of the First Kind K(k) using Arithmetic-Geometric Mean (AGM).
 * Rapid convergence to machine precision in 4–5 iterations.
 */
export function ellipticK(k: number): number {
  if (k >= 1.0) return Infinity
  if (k <= 0) return Math.PI / 2

  let a = 1.0
  let b = Math.sqrt(1.0 - k * k)
  for (let i = 0; i < 15; i++) {
    const nextA = (a + b) / 2
    const nextB = Math.sqrt(a * b)
    if (Math.abs(nextA - nextB) < 1e-15) {
      a = nextA
      break
    }
    a = nextA
    b = nextB
  }
  return Math.PI / (2 * a)
}

/**
 * Exact internal energy per spin E(T) / N (Lars Onsager 1944) for h = 0:
 *   k_1 = 2 sinh(2βJ) / cosh²(2βJ)
 *   E(T) = -J coth(2βJ) [ 1 + (2/π) (2 tanh²(2βJ) - 1) K(k_1) ]
 * At T = T_c, E = -√2 J ≈ -1.41421356 J.
 */
export function getOnsagerExactEnergy(
  temperature: number,
  coupling: number = 1.0,
): number {
  if (temperature <= 0.01) return -2.0 * Math.abs(coupling)

  const J = Math.abs(coupling)
  const beta = 1.0 / temperature
  const s = Math.sinh(2 * beta * J)
  const c = Math.cosh(2 * beta * J)
  const t = Math.tanh(2 * beta * J)

  const k1 = (2 * s) / (c * c)
  // At critical point k1 = 1
  if (Math.abs(k1 - 1.0) < 1e-6) {
    return -Math.SQRT2 * J
  }

  const K = ellipticK(k1)
  return -J * (c / s) * (1.0 + (2.0 / Math.PI) * (2 * t * t - 1.0) * K)
}

/**
 * Mean-Field Theory (Bragg–Williams / Weiss approximation):
 *   M_MF = tanh(4J M_MF / T) with T_c^MF = 4J.
 * Solved via Newton–Raphson iteration.
 */
export function getMeanFieldMagnetization(
  temperature: number,
  coupling: number = 1.0,
): number {
  const J = Math.abs(coupling)
  const TcMF = 4.0 * J
  if (temperature >= TcMF || temperature <= 0) return 0.0

  // Starting estimate near bifurcation
  let m = Math.sqrt(3.0 * (1.0 - temperature / TcMF))
  m = Math.min(0.9999, Math.max(0.01, m))

  for (let iter = 0; iter < 25; iter++) {
    const arg = (4 * J * m) / temperature
    const th = Math.tanh(arg)
    const f = m - th
    const sech2 = 1.0 - th * th
    const df = 1.0 - ((4 * J) / temperature) * sech2

    const nextM = m - f / df
    if (Math.abs(nextM - m) < 1e-12) {
      return Math.min(1.0, Math.max(0.0, nextM))
    }
    m = Math.min(1.0, Math.max(0.0, nextM))
  }

  return m
}
