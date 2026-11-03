/**
 * Liquid-Drop Model & Nuclear Fission / Fusion Energetics
 *
 * Implements the Bethe-Weizsäcker Semi-Empirical Mass Formula (SEMF),
 * nuclear fissility (Bohr-Wheeler theory), prompt fission Q-value physics,
 * and thermonuclear fusion energetics.
 */

import { nucAt, type Nuclide } from './nuclides'

// Standard Audi-Wapstra SEMF constants in MeV
export const SEMF_COEFFS = {
  a_v: 15.75, // Volume energy coefficient (MeV)
  a_s: 17.8, // Surface energy coefficient (MeV)
  a_c: 0.711, // Coulomb repulsion coefficient (MeV)
  a_a: 23.7, // Asymmetry (Pauli) coefficient (MeV)
  a_p: 11.18, // Pairing coefficient (MeV)
  r_0: 1.25, // Nuclear radius parameter in fm (R = r_0 * A^(1/3))
}

export interface SemfBreakdown {
  A: number
  Z: number
  N: number
  volume: number // a_v * A
  surface: number // - a_s * A^(2/3)
  coulomb: number // - a_c * Z(Z-1) / A^(1/3)
  asymmetry: number // - a_a * (A - 2Z)^2 / A
  pairing: number // delta(A, Z)
  totalB: number // B(A, Z) in MeV
  bPerA: number // B / A in MeV/nucleon
  experimentalB?: number // B from IAEA ENSDF if available
  experimentalBPerA?: number // B_exp / A in MeV/nucleon
  shellResidual?: number // B_exp - B_SEMF (shell effect)
}

/**
 * Calculates SEMF pairing term delta in MeV:
 * +a_p / A^(1/2) for even-even
 * -a_p / A^(1/2) for odd-odd
 * 0 for odd A
 */
export function calculatePairing(A: number, Z: number): number {
  if (A <= 0) return 0
  const N = A - Z
  const zEven = Z % 2 === 0
  const nEven = N % 2 === 0

  if (zEven && nEven) {
    return SEMF_COEFFS.a_p / Math.sqrt(A)
  }
  if (!zEven && !nEven) {
    return -SEMF_COEFFS.a_p / Math.sqrt(A)
  }
  return 0
}

/**
 * Computes the individual SEMF components and total binding energy in MeV.
 */
export function calculateSemf(A: number, Z: number): SemfBreakdown {
  const N = A - Z
  if (A <= 1 || Z < 0 || N < 0) {
    return {
      A,
      Z,
      N,
      volume: 0,
      surface: 0,
      coulomb: 0,
      asymmetry: 0,
      pairing: 0,
      totalB: 0,
      bPerA: 0,
    }
  }

  const { a_v, a_s, a_c, a_a } = SEMF_COEFFS
  const a1_3 = Math.cbrt(A)
  const a2_3 = a1_3 * a1_3

  const volume = a_v * A
  const surface = -a_s * a2_3
  const coulomb = -(a_c * Z * (Z - 1)) / a1_3
  const asymmetry = -(a_a * Math.pow(A - 2 * Z, 2)) / A
  const pairing = calculatePairing(A, Z)

  const totalB = Math.max(0, volume + surface + coulomb + asymmetry + pairing)
  const bPerA = totalB / A

  // Compare with experimental ENSDF if nuclide exists
  const nu = nucAt(Z, N)
  let experimentalB: number | undefined
  let experimentalBPerA: number | undefined
  let shellResidual: number | undefined

  if (nu && nu.me != null) {
    // Delta_H = 7288.971 keV, Delta_n = 8071.318 keV
    const DELTA_H_KEV = 7288.971
    const DELTA_N_KEV = 8071.318
    const bExpKev = Z * DELTA_H_KEV + N * DELTA_N_KEV - nu.me
    experimentalB = bExpKev / 1000 // to MeV
    experimentalBPerA = experimentalB / A
    shellResidual = experimentalB - totalB
  }

  return {
    A,
    Z,
    N,
    volume,
    surface,
    coulomb,
    asymmetry,
    pairing,
    totalB,
    bPerA,
    experimentalB,
    experimentalBPerA,
    shellResidual,
  }
}

/**
 * Bohr-Wheeler Nuclear Fissility Parameter:
 * x = E_Coulomb / (2 * E_Surface) = (Z^2 / A) / (Z^2 / A)_critical
 * (Z^2 / A)_critical ≈ 48.5
 */
export function calculateFissility(A: number, Z: number): {
  z2OverA: number
  fissilityX: number
  fissionBarrierMev: number
  isSpontaneousFavored: boolean
} {
  const z2OverA = (Z * Z) / A
  const CRITICAL_Z2_OVER_A = (2 * SEMF_COEFFS.a_s) / SEMF_COEFFS.a_c // ≈ 50.07 (classical 48.5 - 50.1)
  const fissilityX = z2OverA / 48.5

  // Empirical Myers-Swiatecki fission barrier estimate in MeV
  // B_f ≈ 0.83 * E_surface0 * (1 - x)^3 for x <= 1
  const a2_3 = Math.pow(A, 2 / 3)
  const eSurface0 = SEMF_COEFFS.a_s * a2_3
  let fissionBarrierMev = 0
  if (fissilityX < 1) {
    fissionBarrierMev = Math.max(0, 0.83 * eSurface0 * Math.pow(1 - fissilityX, 3))
  }

  return {
    z2OverA,
    fissilityX,
    fissionBarrierMev,
    isSpontaneousFavored: fissilityX >= 1.0,
  }
}

export interface FissionReaction {
  id: string
  title: string
  description: string
  parentZ: number
  parentA: number
  incidentNeutron: boolean
  frag1Z: number
  frag1A: number
  frag2Z: number
  frag2A: number
  promptNeutrons: number
}

export const FISSION_PRESETS: FissionReaction[] = [
  {
    id: 'u235-standard',
    title: '²³⁵U + n_th → ⁹²Kr + ¹⁴¹Ba + 3n',
    description: 'Classic Hahn-Strassmann thermal fission with asymmetric mass peak split.',
    parentZ: 92,
    parentA: 235,
    incidentNeutron: true,
    frag1Z: 36,
    frag1A: 92, // Kr-92
    frag2Z: 56,
    frag2A: 141, // Ba-141
    promptNeutrons: 3,
  },
  {
    id: 'u235-xe140',
    title: '²³⁵U + n_th → ⁹⁴Sr + ¹⁴⁰Xe + 2n',
    description: 'High-yield noble gas fission channel yielding precursor to ¹⁴⁰Cs and ¹⁴⁰Ba.',
    parentZ: 92,
    parentA: 235,
    incidentNeutron: true,
    frag1Z: 38,
    frag1A: 94, // Sr-94
    frag2Z: 54,
    frag2A: 140, // Xe-140
    promptNeutrons: 2,
  },
  {
    id: 'pu239-std',
    title: '²³⁹Pu + n_th → ⁹⁴Sr + ¹⁴⁴Ba + 2n',
    description: 'Fast breeder and weapons-grade Plutonium thermal fission channel.',
    parentZ: 94,
    parentA: 239,
    incidentNeutron: true,
    frag1Z: 38,
    frag1A: 94,
    frag2Z: 56,
    frag2A: 144,
    promptNeutrons: 2,
  },
  {
    id: 'u233-thorium',
    title: '²³³U + n_th → ⁹⁵Y + ¹³⁷I + 2n',
    description: 'Thorium fuel cycle fissile uranium isotope fission.',
    parentZ: 92,
    parentA: 233,
    incidentNeutron: true,
    frag1Z: 39,
    frag1A: 95,
    frag2Z: 53,
    frag2A: 137,
    promptNeutrons: 2,
  },
  {
    id: 'cf252-spontaneous',
    title: '²⁵²Cf → ¹⁰⁸Tc + ¹⁴⁰Cs + 4n (Spontaneous)',
    description: 'Spontaneous fission neutron source isotope with high branching yield.',
    parentZ: 98,
    parentA: 252,
    incidentNeutron: false,
    frag1Z: 43,
    frag1A: 108,
    frag2Z: 55,
    frag2A: 140,
    promptNeutrons: 4,
  },
]

export interface FissionAnalysis {
  reaction: FissionReaction
  parentNuclide: Nuclide | null
  frag1Nuclide: Nuclide | null
  frag2Nuclide: Nuclide | null
  promptQMev: number
  coulombBarrierMev: number // classical contact repulsion
  energyBreakdown: {
    fragmentsKineticMev: number // ~84%
    promptNeutronsMev: number // ~2.5%
    promptGammasMev: number // ~3.5%
    delayedBetaMev: number // ~4.0%
    delayedNeutrinosMev: number // ~6.0%
    totalRecoverableMev: number
  }
}

/**
 * Computes prompt Q-value and Coulomb barrier for a fission split.
 */
export function analyzeFission(rx: FissionReaction): FissionAnalysis {
  const DELTA_N_KEV = 8071.318
  const parent = nucAt(rx.parentZ, rx.parentA - rx.parentZ)
  const f1 = nucAt(rx.frag1Z, rx.frag1A - rx.frag1Z)
  const f2 = nucAt(rx.frag2Z, rx.frag2A - rx.frag2Z)

  let promptQMev = 0

  if (parent && parent.me != null && f1 && f1.me != null && f2 && f2.me != null) {
    const parentEnergyKev = parent.me + (rx.incidentNeutron ? DELTA_N_KEV : 0)
    const productEnergyKev = f1.me + f2.me + rx.promptNeutrons * DELTA_N_KEV
    promptQMev = (parentEnergyKev - productEnergyKev) / 1000
  } else {
    // Theoretical fallback using SEMF B
    const compoundA = rx.parentA + (rx.incidentNeutron ? 1 : 0)
    const bCompound = calculateSemf(compoundA, rx.parentZ).totalB
    const bF1 = calculateSemf(rx.frag1A, rx.frag1Z).totalB
    const bF2 = calculateSemf(rx.frag2A, rx.frag2Z).totalB
    promptQMev = bF1 + bF2 - bCompound
  }

  // Coulomb contact repulsion of tangent undeformed spheres: V_c = 1.44 * (Z1 * Z2) / (r1 + r2)
  const r1 = SEMF_COEFFS.r_0 * Math.cbrt(rx.frag1A)
  const r2 = SEMF_COEFFS.r_0 * Math.cbrt(rx.frag2A)
  const contactCoulombMev = (1.43996 * rx.frag1Z * rx.frag2Z) / (r1 + r2)

  // At the moment of scission, nascent fragments are deformed (elongated prolate spheroids)
  // with an effective separation distance ~ 1.42 * (r1 + r2), converting ~168 MeV into prompt kinetic energy
  const scissionSeparation = 1.42 * (r1 + r2)
  const fragmentsKineticMev = (1.43996 * rx.frag1Z * rx.frag2Z) / scissionSeparation

  // Typical empirical energy partition (approx. 200 MeV total thermal yield for U-235)
  const scale = promptQMev > 0 ? promptQMev / 173 : 1
  const promptNeutronsMev = 4.8 * scale
  const promptGammasMev = 7.0 * scale
  const delayedBetaMev = 6.5 * scale
  const delayedNeutrinosMev = 9.5 * scale
  const totalRecoverableMev = fragmentsKineticMev + promptNeutronsMev + promptGammasMev + delayedBetaMev

  return {
    reaction: rx,
    parentNuclide: parent ?? null,
    frag1Nuclide: f1 ?? null,
    frag2Nuclide: f2 ?? null,
    promptQMev,
    coulombBarrierMev: contactCoulombMev,
    energyBreakdown: {
      fragmentsKineticMev,
      promptNeutronsMev,
      promptGammasMev,
      delayedBetaMev,
      delayedNeutrinosMev,
      totalRecoverableMev,
    },
  }
}

export interface FusionReaction {
  name: string
  equation: string
  reactants: string
  products: string
  qMev: number
  specificEnergyGjPerKg: number
  ignitionTempKev: number // Lawson criteria threshold
  notes: string
}

export const FUSION_PRESETS: FusionReaction[] = [
  {
    name: 'D–T Fusion',
    equation: '²H + ³H → ⁴He (3.5 MeV) + n (14.1 MeV)',
    reactants: 'Deuterium + Tritium',
    products: 'Alpha + Neutron',
    qMev: 17.59,
    specificEnergyGjPerKg: 337000, // 3.37e11 J/kg = 3.37e5 GJ/kg
    ignitionTempKev: 4.5, // ~50 million Kelvin
    notes: 'Primary candidate for magnetic (ITER) and inertial confinement fusion.',
  },
  {
    name: 'D–D (Neutron Branch)',
    equation: '²H + ²H → ³He (0.82 MeV) + n (2.45 MeV)',
    reactants: 'Deuterium + Deuterium',
    products: 'Helium-3 + Neutron',
    qMev: 3.27,
    specificEnergyGjPerKg: 78900,
    ignitionTempKev: 30, // ~350 million Kelvin
    notes: '50% branch in pure deuterium plasma.',
  },
  {
    name: 'D–D (Proton Branch)',
    equation: '²H + ²H → ³H (1.01 MeV) + p (3.02 MeV)',
    reactants: 'Deuterium + Deuterium',
    products: 'Tritium + Proton',
    qMev: 4.03,
    specificEnergyGjPerKg: 97200,
    ignitionTempKev: 30,
    notes: '50% branch; produces tritium in situ.',
  },
  {
    name: 'D–³He Aneutronic',
    equation: '²H + ³He → ⁴He (3.6 MeV) + p (14.7 MeV)',
    reactants: 'Deuterium + Helium-3',
    products: 'Alpha + Proton',
    qMev: 18.35,
    specificEnergyGjPerKg: 353000,
    ignitionTempKev: 58, // ~670 million Kelvin
    notes: 'Charged products allow direct electrostatic energy conversion.',
  },
  {
    name: 'p–¹¹B Aneutronic',
    equation: 'p + ¹¹B → 3 ⁴He (8.7 MeV)',
    reactants: 'Proton + Boron-11',
    products: '3 Alpha particles',
    qMev: 8.68,
    specificEnergyGjPerKg: 69700,
    ignitionTempKev: 120, // > 1 billion Kelvin
    notes: 'No neutron activation, abundant terrestrial fuel.',
  },
]

export interface FuelComparison {
  name: string
  densityMjPerKg: number
  description: string
  gramsFor1Gwd: number // 1 GW-day = 8.64e13 J
}

export const FUEL_COMPARISONS: FuelComparison[] = [
  {
    name: 'D–T Nuclear Fusion',
    densityMjPerKg: 337_000_000,
    description: 'Complete deuterium-tritium fusion reaction',
    gramsFor1Gwd: 0.256,
  },
  {
    name: '²³⁵U Fission (100% burn)',
    densityMjPerKg: 82_000_000,
    description: 'Complete thermal neutron fission of pure U-235',
    gramsFor1Gwd: 1.054,
  },
  {
    name: 'Natural Uranium (LWR 4.5% burnup)',
    densityMjPerKg: 400_000,
    description: 'Standard Light Water Reactor nuclear fuel cycle',
    gramsFor1Gwd: 216,
  },
  {
    name: 'Diesel / Jet-A Fuel',
    densityMjPerKg: 43.1,
    description: 'Hydrocarbon chemical combustion with oxygen',
    gramsFor1Gwd: 2_004_000, // ~2,004 metric tonnes
  },
  {
    name: 'Anthracite Coal',
    densityMjPerKg: 29.0,
    description: 'Bituminous / anthracite fossil fuel combustion',
    gramsFor1Gwd: 2_979_000, // ~2,979 metric tonnes
  },
  {
    name: 'Lithium-ion Battery (NMC)',
    densityMjPerKg: 0.95,
    description: 'Electrochemical intercalation storage',
    gramsFor1Gwd: 90_947_000, // ~91,000 metric tonnes
  },
]

/**
 * Returns the valley of beta stability line:
 * Z_stable ≈ A / (2 + 0.015 * A^(2/3))
 */
export function valleyOfStabilityZ(A: number): number {
  return A / (2 + 0.015 * Math.pow(A, 2 / 3))
}
