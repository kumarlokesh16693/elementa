/**
 * ELEMENTA — Thermodynamics & Heat Engines
 * Physics for PV diagrams, heat-engine cycles, entropy, kinetic theory,
 * and blackbody radiation. All SI units unless noted.
 */

/* ------------------------------------------------------------------ */
/* Fundamental constants                                              */
/* ------------------------------------------------------------------ */

export const K_B = 1.380649e-23 // J/K Boltzmann constant
export const N_A = 6.02214076e23 // mol^-1 Avogadro constant
export const R = 8.31446261815324 // J/(mol·K) gas constant
export const SIGMA = 5.670374419e-8 // W/(m²·K⁴) Stefan-Boltzmann constant
export const C = 299792458 // m/s speed of light
export const H = 6.62607015e-34 // J·s Planck constant

/* ------------------------------------------------------------------ */
/* Ideal gas                                                          */
/* ------------------------------------------------------------------ */

/** Pressure from ideal gas law: P = nRT / V. */
export function pressure(n: number, T: number, V: number): number {
  return (n * R * T) / V
}

/** Temperature from ideal gas law: T = PV / nR. */
export function temperature(P: number, V: number, n: number): number {
  return (P * V) / (n * R)
}

/** Volume from ideal gas law: V = nRT / P. */
export function volume(n: number, T: number, P: number): number {
  return (n * R * T) / P
}

/** Number of moles from PV = nRT. */
export function moles(P: number, V: number, T: number): number {
  return (P * V) / (R * T)
}

/* ------------------------------------------------------------------ */
/* Thermodynamic processes (quasi-static)                             */
/* ------------------------------------------------------------------ */

export type Process = 'isobaric' | 'isochoric' | 'isothermal' | 'adiabatic'

/** Work done BY the gas during a quasi-static process. */
export function work(
  process: Process,
  P1: number,
  V1: number,
  P2: number,
  V2: number,
  n: number,
  T1: number,
  gamma: number,
): number {
  switch (process) {
    case 'isobaric':
      return P1 * (V2 - V1)
    case 'isochoric':
      return 0
    case 'isothermal': {
      const T = T1
      return n * R * T * Math.log(V2 / V1)
    }
    case 'adiabatic': {
      // W = (P1*V1 - P2*V2) / (gamma - 1)
      return (P1 * V1 - P2 * V2) / (gamma - 1)
    }
  }
}

/** Heat added to the gas during a quasi-static process. */
export function heat(
  process: Process,
  P1: number,
  V1: number,
  P2: number,
  V2: number,
  n: number,
  T1: number,
  gamma: number,
): number {
  const Cv = R / (gamma - 1) // molar heat capacity at constant volume
  const Cp = (gamma * R) / (gamma - 1) // molar heat capacity at constant pressure
  const T2 = temperature(P2, V2, n)
  const dT = T2 - T1
  const dU = n * Cv * dT // change in internal energy
  const W = work(process, P1, V1, P2, V2, n, T1, gamma)
  return dU + W // Q = ΔU + W (first law, work done BY gas)
}

/** Change in entropy for an ideal gas between two states. */
export function deltaS(
  n: number,
  Cv: number,
  T1: number,
  T2: number,
  V1: number,
  V2: number,
): number {
  return n * Cv * Math.log(T2 / T1) + n * R * Math.log(V2 / V1)
}

/** Adiabatic relation: P2 = P1 * (V1/V2)^gamma. */
export function adiabaticPressure(P1: number, V1: number, V2: number, gamma: number): number {
  return P1 * Math.pow(V1 / V2, gamma)
}

/** Adiabatic relation: T2 = T1 * (V1/V2)^(gamma-1). */
export function adiabaticTemperature(T1: number, V1: number, V2: number, gamma: number): number {
  return T1 * Math.pow(V1 / V2, gamma - 1)
}

/* ------------------------------------------------------------------ */
/* Heat-engine cycles                                                 */
/* ------------------------------------------------------------------ */

export type Cycle = 'carnot' | 'otto' | 'diesel' | 'stirling'

export interface CyclePoint {
  P: number // Pa
  V: number // m³
  T: number // K
  label: string
}

export interface CycleResult {
  name: string
  points: CyclePoint[]
  processes: Process[]
  heatIn: number // J
  heatOut: number // J (positive magnitude)
  workNet: number // J
  efficiency: number // 0..1
  efficiencyCarnot: number // 0..1
}

/** Build the four points of a cycle. Th and Tc are hot/cold reservoir temps. */
function cyclePoints(
  cycle: Cycle,
  n: number,
  Vmin: number,
  Vmax: number,
  Th: number,
  Tc: number,
  gamma: number,
  cutoff: number, // Diesel: V3/V2 ratio
): CyclePoint[] {
  // Adiabatic volume ratio between the reservoirs, clamped so pathological
  // gamma / temperature ratios stay finite and the cycle stays constructible.
  const adRatio = (th: number, tc: number): number =>
    Math.max(1.05, Math.min(50, Math.pow(th / tc, 1 / (gamma - 1))))

  switch (cycle) {
    case 'carnot': {
      // 1→2 isothermal expansion at Th (Vmin→Vmax)
      // 2→3 adiabatic expansion Th→Tc (Vmax→Vmax·r)
      // 3→4 isothermal compression at Tc (Vmax·r→Vmin·r)
      // 4→1 adiabatic compression Tc→Th (Vmin·r→Vmin)
      const r = adRatio(Th, Tc)
      const V1 = Vmin
      const V2 = Vmax
      const V3 = V2 * r
      const V4 = V1 * r
      return [
        { P: pressure(n, Th, V1), V: V1, T: Th, label: '1' },
        { P: pressure(n, Th, V2), V: V2, T: Th, label: '2' },
        { P: pressure(n, Tc, V3), V: V3, T: Tc, label: '3' },
        { P: pressure(n, Tc, V4), V: V4, T: Tc, label: '4' },
      ]
    }
    case 'otto': {
      // Compression ratio derived from the reservoir temperatures so the
      // isochoric heat-addition leg always has a positive ΔT (T2 < Th).
      const rc = adRatio(0.9 * Th, Tc)
      const V1 = Vmax
      const T1 = Tc
      const V2 = V1 / rc
      const T2 = adiabaticTemperature(T1, V1, V2, gamma)
      const V3 = V2
      const T3 = Th
      const V4 = V1
      const T4 = adiabaticTemperature(T3, V3, V4, gamma)
      return [
        { P: pressure(n, T1, V1), V: V1, T: T1, label: '1' },
        { P: pressure(n, T2, V2), V: V2, T: T2, label: '2' },
        { P: pressure(n, T3, V3), V: V3, T: T3, label: '3' },
        { P: pressure(n, T4, V4), V: V4, T: T4, label: '4' },
      ]
    }
    case 'diesel': {
      const rc = adRatio(0.9 * Th, Tc)
      const V1 = Vmax
      const T1 = Tc
      const V2 = V1 / rc
      const T2 = adiabaticTemperature(T1, V1, V2, gamma)
      // Isobaric heat addition up to the cutoff ratio (never past V1).
      const V3 = Math.min(cutoff * V2, V1 * 0.95)
      const T3 = T2 * (V3 / V2)
      const V4 = V1
      const T4 = adiabaticTemperature(T3, V3, V4, gamma)
      return [
        { P: pressure(n, T1, V1), V: V1, T: T1, label: '1' },
        { P: pressure(n, T2, V2), V: V2, T: T2, label: '2' },
        { P: pressure(n, T3, V3), V: V3, T: T3, label: '3' }, // isobaric: P3 = P2
        { P: pressure(n, T4, V4), V: V4, T: T4, label: '4' },
      ]
    }
    case 'stirling': {
      // 1→2 isothermal compression Vmax→Vmin at Tc
      // 2→3 isochoric heating Tc→Th
      // 3→4 isothermal expansion Vmin→Vmax at Th
      // 4→1 isochoric cooling Th→Tc
      const V1 = Vmax
      const V2 = Vmin
      return [
        { P: pressure(n, Tc, V1), V: V1, T: Tc, label: '1' },
        { P: pressure(n, Tc, V2), V: V2, T: Tc, label: '2' },
        { P: pressure(n, Th, V2), V: V2, T: Th, label: '3' },
        { P: pressure(n, Th, V1), V: V1, T: Th, label: '4' },
      ]
    }
  }
}

export function cycleProcesses(cycle: Cycle): Process[] {
  switch (cycle) {
    case 'carnot':
      return ['isothermal', 'adiabatic', 'isothermal', 'adiabatic']
    case 'otto':
      return ['adiabatic', 'isochoric', 'adiabatic', 'isochoric']
    case 'diesel':
      return ['adiabatic', 'isobaric', 'adiabatic', 'isochoric']
    case 'stirling':
      return ['isothermal', 'isochoric', 'isothermal', 'isochoric']
  }
}

export function computeCycle(
  cycle: Cycle,
  n: number,
  Vmin: number,
  Vmax: number,
  Th: number,
  Tc: number,
  gamma: number,
  cutoff: number,
): CycleResult {
  // The γ slider can reach 1.0, which divides by zero downstream.
  const g = Math.max(1.001, gamma)
  const pts = cyclePoints(cycle, n, Vmin, Vmax, Th, Tc, g, cutoff)
  const procs = cycleProcesses(cycle)

  let heatIn = 0
  let heatOut = 0
  let workNet = 0

  for (let i = 0; i < 4; i++) {
    const p1 = pts[i]
    const p2 = pts[(i + 1) % 4]
    const W = work(procs[i], p1.P, p1.V, p2.P, p2.V, n, p1.T, g)
    const Q = heat(procs[i], p1.P, p1.V, p2.P, p2.V, n, p1.T, g)
    workNet += W
    if (Q > 1e-9) heatIn += Q
    else heatOut += -Q
  }

  const efficiency = heatIn > 0 ? workNet / heatIn : 0
  const efficiencyCarnot = Th > Tc ? 1 - Tc / Th : 0

  return {
    name: cycle.charAt(0).toUpperCase() + cycle.slice(1),
    points: pts,
    processes: procs,
    heatIn,
    heatOut,
    workNet,
    efficiency,
    efficiencyCarnot,
  }
}

/* ------------------------------------------------------------------ */
/* Kinetic theory — Maxwell-Boltzmann                                 */
/* ------------------------------------------------------------------ */

/** Most probable speed: sqrt(2kT/m). */
export function vMp(T: number, m: number): number {
  return Math.sqrt((2 * K_B * T) / m)
}

/** Mean speed: sqrt(8kT/pi m). */
export function vMean(T: number, m: number): number {
  return Math.sqrt((8 * K_B * T) / (Math.PI * m))
}

/** RMS speed: sqrt(3kT/m). */
export function vRms(T: number, m: number): number {
  return Math.sqrt((3 * K_B * T) / m)
}

/** Maxwell-Boltzmann speed distribution f(v) (probability density). */
export function mbSpeedDistribution(v: number, T: number, m: number): number {
  const a = m / (2 * K_B * T)
  return 4 * Math.PI * Math.pow(m / (2 * Math.PI * K_B * T), 1.5) * v * v * Math.exp(-a * v * v)
}

/* ------------------------------------------------------------------ */
/* Blackbody radiation                                                */
/* ------------------------------------------------------------------ */

/** Total power radiated per unit area: P = σT⁴. */
export function stephanBoltzmann(T: number): number {
  return SIGMA * Math.pow(T, 4)
}

/** Wien's displacement law: λmax = b / T, b ≈ 2.898e-3 m·K. */
export function wienLambdaMax(T: number): number {
  return 2.897771955e-3 / T
}

/** Planck spectral radiance B(λ, T) in W/(m³·sr). */
export function planckRadiance(lambda: number, T: number): number {
  const hc = H * C
  const kT = K_B * T
  const a = 2 * H * Math.pow(C, 2)
  const b = hc / (lambda * kT)
  return (a / Math.pow(lambda, 5)) * (1 / (Math.exp(b) - 1))
}
