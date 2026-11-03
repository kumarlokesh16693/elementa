/**
 * ============================================================================
 * ELEMENTA PHYSICAL CHEMISTRY: CHEMICAL KINETICS & TRANSITION STATE ENGINE
 * ============================================================================
 * Theoretical Foundations:
 * 1. Arrhenius Law:
 *    k(T) = A * exp( -E_a / (R * T) )
 *    ln(k) = ln(A) - (E_a / R) * (1 / T)
 *
 * 2. Eyring-Polanyi Transition State Theory (TST):
 *    k(T) = (kappa * k_B * T / h) * exp( Delta S_ddagger / R ) * exp( -Delta H_ddagger / (R * T) )
 *    Delta G_ddagger = Delta H_ddagger - T * Delta S_ddagger
 *
 * 3. Maxwell-Boltzmann Molecular Collision Energy Distribution:
 *    f(E) = 2 * sqrt(E / pi) * (1 / (k_B * T))^(3/2) * exp( -E / (k_B * T) )
 *    Fraction of collisions exceeding E_a:
 *    F(E >= E_a) = integral_{E_a}^infinity f(E) dE
 *
 * 4. Eckart Potential Energy Barrier along Reaction Coordinate s in [-1, +1]:
 *    V(s) = (A * y) / (1 + y) + (B * y) / (1 + y)^2, where y = exp(2 * pi * s)
 *
 * 5. Integrated Rate Laws:
 *    - 1st Order: [A](t) = [A]_0 * exp(-k * t), t_1/2 = ln(2) / k
 *    - 2nd Order: 1/[A](t) = 1/[A]_0 + k * t, t_1/2 = 1 / (k * [A]_0)
 *    - Reversible: A <-> B with k_f, k_r, K_eq = k_f / k_r
 * ============================================================================
 */

export const GAS_CONSTANT_R = 8.314462618 // J / (mol·K)
export const BOLTZMANN_K_B = 1.380649e-23 // J / K
export const PLANCK_H = 6.62607015e-34 // J·s
export const AVOGADRO_N_A = 6.02214076e23 // mol^-1

export interface AtomCoord {
  symbol: string
  x: number // in Angstroms
  y: number
  z: number
  color: string
  radius: number // in Angstroms
}

export interface ReactionPreset {
  id: string
  name: string
  reactionEquation: string
  mechanismType: 'SN2' | 'addition' | 'radical' | 'catalytic' | 'exchange'
  description: string
  order: 1 | 2
  eaKjMol: number // Activation energy in kJ/mol
  eaCatalyzedKjMol?: number // Catalyzed activation energy
  deltaHReactionKjMol: number // Enthalpy of reaction (negative = exothermic)
  deltaSActivationJ_MolK: number // Entropy of activation (J/mol·K)
  frequencyFactorA: number // Pre-exponential factor A (s^-1 or M^-1 s^-1)
  defaultTemperatureK: number
  reactantsLabel: string
  transitionStateLabel: string
  productsLabel: string
  getCoordinatesAt: (s: number) => AtomCoord[] // s in [-1, +1]
}

/**
 * 5 Benchmark reaction presets covering foundational chemical kinetics.
 */
export const KINETICS_PRESETS: ReactionPreset[] = [
  {
    id: 'sn2-walden',
    name: 'SN2 Nucleophilic Substitution & Walden Inversion',
    reactionEquation: 'Cl⁻ + CH₃Br ⟶ [Cl···CH₃···Br]‡ ⟶ CH₃Cl + Br⁻',
    mechanismType: 'SN2',
    description:
      'Classic concerted bimolecular nucleophilic substitution. Backside attack of chloride ion causes a planar trigonal carbon transition state and flips the umbrella of hydrogen atoms (Walden inversion).',
    order: 2,
    eaKjMol: 79.5, // ~19.0 kcal/mol
    eaCatalyzedKjMol: 46.0,
    deltaHReactionKjMol: -28.0, // Exothermic by 28 kJ/mol
    deltaSActivationJ_MolK: -45.0, // Orderly associative transition state decreases entropy
    frequencyFactorA: 3.2e11,
    defaultTemperatureK: 298.15,
    reactantsLabel: 'Cl⁻ + CH₃Br',
    transitionStateLabel: '[Cl···CH₃···Br]‡',
    productsLabel: 'CH₃Cl + Br⁻',
    getCoordinatesAt: (s: number) => {
      // s = -1 (reactants), s = 0 (transition state), s = +1 (products)
      // Carbon at origin (0, 0, 0)
      const cZ = 0
      // Chlorine approaches from left (-x): rCl(s)
      const rCl = s < 0 ? -3.2 + 1.2 * (s + 1) : -2.0 + 0.3 * s
      // Bromine leaves to right (+x): rBr(s)
      const rBr = s < 0 ? 1.94 + 0.3 * (s + 1) : 1.94 + 1.6 * s

      // 3 Hydrogen umbrella angle: theta flips from -20 deg to 0 deg to +20 deg
      const umbrellaX = s * 0.35 // Displacement along x
      const hRadius = 1.05
      const h1 = { symbol: 'H', x: umbrellaX, y: hRadius, z: 0, color: '#e4e4e7', radius: 0.35 }
      const h2 = { symbol: 'H', x: umbrellaX, y: -hRadius * 0.5, z: hRadius * 0.866, color: '#e4e4e7', radius: 0.35 }
      const h3 = { symbol: 'H', x: umbrellaX, y: -hRadius * 0.5, z: -hRadius * 0.866, color: '#e4e4e7', radius: 0.35 }

      return [
        { symbol: 'C', x: 0, y: 0, z: cZ, color: '#3f3f46', radius: 0.55 },
        h1,
        h2,
        h3,
        { symbol: 'Cl', x: rCl, y: 0, z: 0, color: '#22c55e', radius: 0.75 },
        { symbol: 'Br', x: rBr, y: 0, z: 0, color: '#a855f7', radius: 0.85 },
      ]
    },
  },
  {
    id: 'hydrogen-exchange',
    name: 'Hydrogen Atom Abstraction Benchmark',
    reactionEquation: 'H + H₂ ⟶ [H···H···H]‡ ⟶ H₂ + H',
    mechanismType: 'exchange',
    description:
      'The foundational quantum mechanical reaction benchmark. Collinear collision over a symmetric Eckart potential barrier with a symmetric [H-H-H] linear transition state.',
    order: 2,
    eaKjMol: 40.5,
    eaCatalyzedKjMol: 18.0,
    deltaHReactionKjMol: 0.0, // Thermoneutral
    deltaSActivationJ_MolK: -32.0,
    frequencyFactorA: 1.5e11,
    defaultTemperatureK: 300.0,
    reactantsLabel: 'H + H₂',
    transitionStateLabel: '[H···H···H]‡',
    productsLabel: 'H₂ + H',
    getCoordinatesAt: (s: number) => {
      const r1 = s < 0 ? -2.5 + 1.5 * (s + 1) : -1.0 + 0.25 * s
      const r2 = 0
      const r3 = s < 0 ? 1.0 + 0.25 * (s + 1) : 1.0 + 1.5 * s
      return [
        { symbol: 'H', x: r1, y: 0, z: 0, color: '#38bdf8', radius: 0.45 },
        { symbol: 'H', x: r2, y: 0, z: 0, color: '#fbbf24', radius: 0.45 },
        { symbol: 'H', x: r3, y: 0, z: 0, color: '#34d399', radius: 0.45 },
      ]
    },
  },
  {
    id: 'diels-alder',
    name: 'Diels-Alder [4+2] Concerted Cycloaddition',
    reactionEquation: '1,3-Butadiene + Ethene ⟶ [Cyclohexene]‡ ⟶ Cyclohexene',
    mechanismType: 'addition',
    description:
      'Pericyclic cycloaddition with a concerted, aromatic 6-electron cyclic transition state obeying Woodward-Hoffmann symmetry rules.',
    order: 2,
    eaKjMol: 92.0,
    eaCatalyzedKjMol: 55.0,
    deltaHReactionKjMol: -167.0, // Strongly exothermic
    deltaSActivationJ_MolK: -145.0, // High negative entropy due to rigid cyclic transition state
    frequencyFactorA: 8.0e9,
    defaultTemperatureK: 380.0,
    reactantsLabel: 'C₄H₆ + C₂H₄',
    transitionStateLabel: '[C₆H₁₀]‡ (cyclic)',
    productsLabel: 'Cyclohexene',
    getCoordinatesAt: (s: number) => {
      // 6-membered ring forming: distance between diene and dienophile closes from 3.2 A to 1.54 A
      const dist = s < 0 ? 3.2 - 1.2 * (s + 1) : 2.0 - 0.46 * s
      const r = 1.35
      const atoms: AtomCoord[] = []
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3
        const yOffset = i < 3 ? -dist * 0.4 : dist * 0.4
        atoms.push({
          symbol: 'C',
          x: r * Math.cos(ang),
          y: r * Math.sin(ang) + yOffset,
          z: 0,
          color: '#52525b',
          radius: 0.52,
        })
      }
      return atoms
    },
  },
  {
    id: 'catalytic-ethene-hydrogenation',
    name: 'Heterogeneous Platinum Catalytic Hydrogenation',
    reactionEquation: 'C₂H₄ + H₂ ⟶ [C₂H₄···2H]‡/Pt ⟶ C₂H₆',
    mechanismType: 'catalytic',
    description:
      'Industrial Sabatier/Horiuti-Polanyi mechanism. Platinum surface dissociatively adsorbs H₂ with nearly zero barrier, lowering ethylene hydrogenation barrier from 180 kJ/mol down to 42 kJ/mol.',
    order: 1,
    eaKjMol: 180.0, // Uncatalyzed gas-phase
    eaCatalyzedKjMol: 42.0, // On Pt(111) surface
    deltaHReactionKjMol: -137.0,
    deltaSActivationJ_MolK: -110.0,
    frequencyFactorA: 4.5e12,
    defaultTemperatureK: 320.0,
    reactantsLabel: 'C₂H₄ + H₂',
    transitionStateLabel: '[Pt-H-H-C₂H₄]‡',
    productsLabel: 'C₂H₆ (Ethane)',
    getCoordinatesAt: (s: number) => {
      const zH = s < 0 ? 1.8 - 0.8 * (s + 1) : 1.0 - 0.4 * s
      return [
        { symbol: 'Pt', x: -1.4, y: -1.2, z: 0, color: '#94a3b8', radius: 0.8 },
        { symbol: 'Pt', x: 0, y: -1.2, z: 0, color: '#94a3b8', radius: 0.8 },
        { symbol: 'Pt', x: 1.4, y: -1.2, z: 0, color: '#94a3b8', radius: 0.8 },
        { symbol: 'C', x: -0.67, y: 0, z: 0, color: '#3f3f46', radius: 0.55 },
        { symbol: 'C', x: 0.67, y: 0, z: 0, color: '#3f3f46', radius: 0.55 },
        { symbol: 'H', x: -0.67, y: zH, z: 0.6, color: '#38bdf8', radius: 0.35 },
        { symbol: 'H', x: 0.67, y: zH, z: 0.6, color: '#38bdf8', radius: 0.35 },
      ]
    },
  },
  {
    id: 'stratospheric-ozone-depletion',
    name: 'Atmospheric Ozone Depletion by Chlorine Radical',
    reactionEquation: 'Cl• + O₃ ⟶ [Cl···O···O₂]‡ ⟶ ClO• + O₂',
    mechanismType: 'radical',
    description:
      'The Molina-Rowland Nobel prize reaction causing the Antarctic ozone hole. Fast radical abstraction with low activation energy (2.1 kJ/mol), catalytically destroying thousands of O₃ molecules.',
    order: 2,
    eaKjMol: 2.1,
    eaCatalyzedKjMol: 1.2,
    deltaHReactionKjMol: -163.0,
    deltaSActivationJ_MolK: -25.0,
    frequencyFactorA: 2.8e10,
    defaultTemperatureK: 220.0, // Stratospheric temperature (~220 K)
    reactantsLabel: 'Cl• + O₃',
    transitionStateLabel: '[Cl···O···O₂]‡',
    productsLabel: 'ClO• + O₂',
    getCoordinatesAt: (s: number) => {
      const rCl = s < 0 ? -3.0 + 1.2 * (s + 1) : -1.8 + 0.3 * s
      const rO2 = s < 0 ? 1.6 + 0.2 * (s + 1) : 1.8 + 1.4 * s
      return [
        { symbol: 'Cl', x: rCl, y: 0.2, z: 0, color: '#22c55e', radius: 0.75 },
        { symbol: 'O', x: 0, y: 0, z: 0, color: '#ef4444', radius: 0.55 },
        { symbol: 'O', x: rO2, y: 0.4, z: 0, color: '#ef4444', radius: 0.52 },
        { symbol: 'O', x: rO2 + 1.1, y: -0.3, z: 0, color: '#ef4444', radius: 0.52 },
      ]
    },
  },
]

/**
 * Calculates the Arrhenius reaction rate constant k(T).
 */
export function calculateArrheniusRate(
  preExponentialA: number,
  activationEnergyKjMol: number,
  temperatureKelvin: number,
): number {
  if (temperatureKelvin <= 0) return 0
  const eaJoules = activationEnergyKjMol * 1000
  const exponent = -eaJoules / (GAS_CONSTANT_R * temperatureKelvin)
  // Clamp exponent to prevent underflow / overflow
  if (exponent < -120) return 0
  if (exponent > 50) return preExponentialA * Math.exp(50)
  return preExponentialA * Math.exp(exponent)
}

/**
 * Calculates the Eyring transition state rate constant and thermodynamic parameters.
 */
export function calculateEyringParameters(
  deltaHActivationKjMol: number,
  deltaSActivationJ_MolK: number,
  temperatureKelvin: number,
  transmissionCoefficientKappa = 1.0,
): {
  rateConstantK: number
  deltaGActivationKjMol: number
  deltaHActivationKjMol: number
  tDeltaSActivationKjMol: number
} {
  const deltaHJoules = deltaHActivationKjMol * 1000
  const tDeltaSJoules = temperatureKelvin * deltaSActivationJ_MolK
  const deltaGJoules = deltaHJoules - tDeltaSJoules

  const factor = (transmissionCoefficientKappa * BOLTZMANN_K_B * temperatureKelvin) / PLANCK_H
  const exponent = -deltaGJoules / (GAS_CONSTANT_R * temperatureKelvin)
  const rateConstantK = factor * Math.exp(Math.max(-120, Math.min(50, exponent)))

  return {
    rateConstantK,
    deltaGActivationKjMol: deltaGJoules / 1000,
    deltaHActivationKjMol,
    tDeltaSActivationKjMol: tDeltaSJoules / 1000,
  }
}

/**
 * Evaluates the Maxwell-Boltzmann energy distribution density f(E).
 * E is energy in kJ/mol.
 */
export function maxwellBoltzmannEnergyDensity(
  energyKjMol: number,
  temperatureKelvin: number,
): number {
  if (energyKjMol <= 0 || temperatureKelvin <= 0) return 0
  const eJoules = energyKjMol * 1000
  const rtJoules = GAS_CONSTANT_R * temperatureKelvin

  // f(E) = 2 * sqrt(E / pi) * (1 / (RT))^(3/2) * exp(-E / RT)
  const prefactor = 2 * Math.sqrt(eJoules / Math.PI) * Math.pow(1 / rtJoules, 1.5)
  const exponent = -eJoules / rtJoules
  if (exponent < -100) return 0

  // Returned as density per kJ/mol: multiply by 1000
  return prefactor * Math.exp(exponent) * 1000
}

/**
 * Calculates the fraction of molecular collisions exceeding activation barrier E_a.
 */
export function fractionExceedingActivation(
  activationEnergyKjMol: number,
  temperatureKelvin: number,
): number {
  if (temperatureKelvin <= 0) return 0
  const eaJoules = activationEnergyKjMol * 1000
  const x = eaJoules / (GAS_CONSTANT_R * temperatureKelvin)
  // Analytical integral approximation of Maxwell-Boltzmann tail:
  // P(E >= Ea) ≈ 2 * sqrt(x / pi) * exp(-x) + erfc(sqrt(x))
  // For x > 3, primary contribution is 2 * sqrt(x / pi) * exp(-x)
  if (x > 120) return 0
  if (x < 1e-4) return 1.0
  const tail = 2 * Math.sqrt(x / Math.PI) * Math.exp(-x)
  return Math.min(1.0, tail + Math.exp(-x))
}

/**
 * Evaluates the Potential Energy Surface profile V(s) along Reaction Coordinate s in [-1, +1].
 */
export function evaluateReactionProfile(
  s: number, // in [-1, +1]
  eaKjMol: number,
  deltaHReactionKjMol: number,
): { potentialEnergyKjMol: number; isTransitionState: boolean } {
  const sc = Math.max(-1, Math.min(1, s))

  // Symmetric gaussian barrier peaking at s = 0 with value 1.0
  const gaussian = Math.exp(-10 * sc * sc)

  // Smooth sigmoid step from 0 at s = -1 to 1 at s = +1
  const sigmoid = 1 / (1 + Math.exp(-8 * sc))

  // Exact transition state anchoring:
  // At s = -1: gaussian ~ 0, sigmoid ~ 0  => V ~ 0 (reactants)
  // At s = 0:  gaussian = 1, sigmoid = 0.5 => V = Ea (transition state barrier peak)
  // At s = +1: gaussian ~ 0, sigmoid ~ 1  => V ~ deltaH (products)
  const stepModulated = sigmoid - 0.5 * gaussian
  const potentialEnergyKjMol = eaKjMol * gaussian + deltaHReactionKjMol * stepModulated

  return {
    potentialEnergyKjMol,
    isTransitionState: Math.abs(sc) < 0.05,
  }
}

/**
 * Solves integrated rate laws for dynamic concentration tracking [A](t), [B](t), [P](t).
 */
export function solveConcentrationDynamics(
  order: 1 | 2,
  rateConstantK: number,
  initialA = 1.0, // in M (mol/L)
  totalDurationSeconds = 60,
  stepCount = 100,
): Array<{ timeSec: number; concA: number; concP: number }> {
  const points: Array<{ timeSec: number; concA: number; concP: number }> = []
  const dt = totalDurationSeconds / stepCount

  for (let i = 0; i <= stepCount; i++) {
    const t = i * dt
    let concA = 0
    if (order === 1) {
      // 1st order: [A] = [A]0 * exp(-k * t)
      concA = initialA * Math.exp(-rateConstantK * t)
    } else {
      // 2nd order: 1/[A] = 1/[A]0 + k * t  =>  [A] = [A]0 / (1 + k * [A]0 * t)
      concA = initialA / (1 + rateConstantK * initialA * t)
    }
    const concP = Math.max(0, initialA - concA)
    points.push({ timeSec: t, concA, concP })
  }

  return points
}
