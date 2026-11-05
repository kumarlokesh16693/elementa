/**
 * Chemical Kinetics & Catalysis Mathematical Physics Engine
 * Implements Arrhenius, Eyring-Polanyi, Maxwell-Boltzmann, Integrated Rate Laws,
 * and Michaelis-Menten Enzyme Kinetics with strict physical rigor.
 */

import type { RateOrder, ConcentrationPoint, MichaelisMentenParams } from './types'

export const R_IDEAL = 8.314462618e-3 // kJ / (mol * K)
export const K_BOLTZMANN = 1.380649e-23 // J / K
export const PLANCK_H = 6.62607015e-34 // J * s

/**
 * Arrhenius Rate Constant
 * k = A * exp(-Ea / (R * T))
 * @param A Pre-exponential factor
 * @param Ea Activation energy in kJ/mol
 * @param T Temperature in Kelvin
 */
export function computeArrheniusRateConstant(A: number, Ea: number, T: number): number {
  if (T <= 0) return 0
  const exponent = -Ea / (R_IDEAL * T)
  // Clamp to prevent numerical overflow/underflow
  if (exponent < -80) return 0
  return A * Math.exp(exponent)
}

/**
 * Eyring-Polanyi Rate Constant (Transition State Theory)
 * k = (kappa * kB * T / h) * exp(dS_ddagger / R) * exp(-dH_ddagger / (R * T))
 * @param dH_ddagger Activation enthalpy in kJ/mol
 * @param dS_ddagger Activation entropy in J / (mol * K)
 * @param T Temperature in Kelvin
 * @param kappa Transmission coefficient (default 1.0)
 */
export function computeEyringRateConstant(
  dH_ddagger: number,
  dS_ddagger: number,
  T: number,
  kappa = 1.0,
): number {
  if (T <= 0) return 0
  const prefactor = (kappa * K_BOLTZMANN * T) / PLANCK_H // 1/s
  const sTerm = Math.exp(dS_ddagger / 8.314462618) // dS in J/(mol*K)
  const hTerm = Math.exp(-dH_ddagger / (R_IDEAL * T))
  return prefactor * sTerm * hTerm
}

/**
 * Maxwell-Boltzmann Kinetic Energy Probability Density Function
 * f(E) = 2 * sqrt(E / pi) * (1 / (R * T))^(3/2) * exp(-E / (R * T))
 * Normalized so that integral over E from 0 to infinity = 1
 * @param E Energy in kJ/mol
 * @param T Temperature in Kelvin
 */
export function computeMaxwellBoltzmannDensity(E: number, T: number): number {
  if (E <= 0 || T <= 0) return 0
  const RT = R_IDEAL * T
  const term1 = 2 * Math.sqrt(E / Math.PI)
  const term2 = Math.pow(1 / RT, 1.5)
  const term3 = Math.exp(-E / RT)
  return term1 * term2 * term3
}

/**
 * Energetic fraction of collisions exceeding activation energy Ea
 * fraction = exp(-Ea / (R * T))
 */
export function computeEnergeticFraction(Ea: number, T: number): number {
  if (T <= 0) return 0
  const val = -Ea / (R_IDEAL * T)
  if (val < -80) return 0
  return Math.exp(val)
}

/**
 * Half-life calculation based on rate law order
 */
export function computeHalfLife(order: RateOrder, k: number, a0: number): number {
  if (k <= 0 || a0 <= 0) return Infinity
  switch (order) {
    case 'zero':
      return a0 / (2 * k)
    case 'first':
      return Math.LN2 / k
    case 'second':
      return 1 / (k * a0)
    case 'consecutive':
      return Math.LN2 / k
  }
}

/**
 * Integrated Rate Law Simulation points
 * Generates concentration trajectories [A](t), [B](t), [P](t)
 */
export function generateRateTrajectories(
  order: RateOrder,
  k: number,
  a0: number,
  durationSeconds: number,
  steps = 150,
  k2Consecutive = 0.5 * k,
): ConcentrationPoint[] {
  const points: ConcentrationPoint[] = []
  const dt = durationSeconds / steps

  for (let i = 0; i <= steps; i++) {
    const t = i * dt

    if (order === 'zero') {
      const concA = Math.max(0, a0 - k * t)
      const concP = a0 - concA
      points.push({ t, concA, concP })
    } else if (order === 'first') {
      const concA = a0 * Math.exp(-k * t)
      const concP = a0 - concA
      points.push({ t, concA, concP })
    } else if (order === 'second') {
      const concA = a0 / (1 + k * a0 * t)
      const concP = a0 - concA
      points.push({ t, concA, concP })
    } else if (order === 'consecutive') {
      // A -> B -> C
      const k1 = k
      const k2 = k2Consecutive
      const concA = a0 * Math.exp(-k1 * t)
      let concB = 0
      if (Math.abs(k1 - k2) < 1e-6) {
        concB = a0 * k1 * t * Math.exp(-k1 * t)
      } else {
        concB = a0 * (k1 / (k2 - k1)) * (Math.exp(-k1 * t) - Math.exp(-k2 * t))
      }
      const concP = Math.max(0, a0 - concA - concB) // C is product
      points.push({ t, concA, concB, concP })
    }
  }

  return points
}

/**
 * Michaelis-Menten Apparent Parameters considering Enzyme Inhibition
 */
export function computeApparentEnzymeParams(params: MichaelisMentenParams): {
  vMaxApp: number
  kMApp: number
  alpha: number
  alphaPrime: number
} {
  const { vMax, kM, inhibitorType, inhibitorConcI, kI } = params

  let alpha = 1.0
  let alphaPrime = 1.0

  if (inhibitorType !== 'none' && inhibitorConcI > 0 && kI > 0) {
    const ratio = inhibitorConcI / kI
    if (inhibitorType === 'competitive') {
      alpha = 1 + ratio
      alphaPrime = 1.0
    } else if (inhibitorType === 'non-competitive') {
      alpha = 1 + ratio
      alphaPrime = 1 + ratio
    } else if (inhibitorType === 'uncompetitive') {
      alpha = 1.0
      alphaPrime = 1 + ratio
    }
  }

  const vMaxApp = vMax / alphaPrime
  const kMApp = (kM * alpha) / alphaPrime

  return { vMaxApp, kMApp, alpha, alphaPrime }
}

/**
 * Reaction Velocity as a function of Substrate Concentration [S]
 */
export function computeEnzymeVelocity(substrateS: number, params: MichaelisMentenParams): number {
  if (substrateS <= 0) return 0
  const { vMaxApp, kMApp } = computeApparentEnzymeParams(params)
  return (vMaxApp * substrateS) / (kMApp + substrateS)
}
