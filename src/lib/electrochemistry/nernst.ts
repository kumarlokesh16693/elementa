/**
 * Nernst Equation & Electrochemical Thermodynamics Engine
 * Rigorous calculations of standard cell potentials, reaction quotients (Q),
 * temperature-dependent Nernst cell voltages (E_cell), Gibbs free energy (ΔG),
 * and equilibrium constants (K).
 */

import type { HalfReaction, NernstCalculation } from './types'

export const R_IDEAL = 8.314462618 // J/(mol·K)
export const FARADAY_CONST = 96485.33212 // C/mol (Coulombs per mole of electrons)

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b)
}

/**
 * Calculates Nernst cell potential and thermodynamic state
 */
export function computeNernstCell(
  anodeHalf: HalfReaction,
  cathodeHalf: HalfReaction,
  anodeConc: number, // M (mol/L)
  cathodeConc: number, // M (mol/L)
  tempK = 298.15
): NernstCalculation {
  // E°_cell = E°_cathode - E°_anode
  const standardPotential = cathodeHalf.standardPotential - anodeHalf.standardPotential

  // Number of electrons transferred in balanced cell reaction: n = lcm(n_anode, n_cathode)
  const n = lcm(anodeHalf.electrons, cathodeHalf.electrons)

  // Stoichiometric coefficients
  const nuAnode = n / anodeHalf.electrons
  const nuCathode = n / cathodeHalf.electrons

  // Reaction quotient Q = [Anode ion]^nuAnode / [Cathode ion]^nuCathode
  // Clamped to prevent numerical overflow/underflow
  const aConcSafe = Math.max(anodeConc, 1e-6)
  const cConcSafe = Math.max(cathodeConc, 1e-6)
  const Q = Math.pow(aConcSafe, nuAnode) / Math.pow(cConcSafe, nuCathode)

  // Nernst Equation: E = E° - (RT / nF) * ln(Q)
  const thermalVolt = (R_IDEAL * tempK) / (n * FARADAY_CONST)
  const cellPotential = standardPotential - thermalVolt * Math.log(Q)

  // Gibbs free energy ΔG = -n * F * E (in kJ/mol)
  const deltaG = (-n * FARADAY_CONST * cellPotential) / 1000

  // Equilibrium constant K = exp(n * F * E° / (R * T))
  const exponent = (n * FARADAY_CONST * standardPotential) / (R_IDEAL * tempK)
  const equilibriumConstantK =
    exponent > 700 ? Infinity : exponent < -700 ? 0 : Math.exp(exponent)

  return {
    standardPotential,
    cellPotential,
    reactionQuotientQ: Q,
    deltaG,
    equilibriumConstantK,
    isSpontaneous: cellPotential > 0,
    tempK,
    anodeConc,
    cathodeConc,
    faradayConstant: FARADAY_CONST,
  }
}

/**
 * Generates balanced overall redox reaction equation string
 */
export function generateOverallCellEquation(
  anodeHalf: HalfReaction,
  cathodeHalf: HalfReaction
): string {
  const n = lcm(anodeHalf.electrons, cathodeHalf.electrons)
  const coeffAnode = n / anodeHalf.electrons
  const coeffCathode = n / cathodeHalf.electrons

  const aMetal = coeffAnode === 1 ? anodeHalf.metal : `${coeffAnode} ${anodeHalf.metal}`
  const cIon = coeffCathode === 1 ? cathodeHalf.ionSpecies : `${coeffCathode} ${cathodeHalf.ionSpecies}`
  const aIon = coeffAnode === 1 ? anodeHalf.ionSpecies : `${coeffAnode} ${anodeHalf.ionSpecies}`
  const cMetal = coeffCathode === 1 ? cathodeHalf.metal : `${coeffCathode} ${cathodeHalf.metal}`

  return `${aMetal} + ${cIon} ➔ ${aIon} + ${cMetal}`
}
