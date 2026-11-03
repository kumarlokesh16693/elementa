/**
 * Radiation Shielding, Particle Stopping Power & Dosimetry Physics Engine
 *
 * Implements:
 * 1. Exponential photon attenuation via Beer-Lambert Law (I = I0 * exp(-mu * x))
 * 2. Three fundamental photon interaction regimes: Photoelectric, Compton, Pair Production
 * 3. Heavy charged particle stopping power (Bethe-Bloch) & Bragg Peak ionization
 * 4. Beta particle range, continuous spectra & Bremsstrahlung radiation yield
 * 5. Neutron moderation (elastic scattering) & capture cross-sections
 * 6. Half-Value Layer (HVL) & Tenth-Value Layer (TVL) determinations
 * 7. Inverse-square law, absorbed dose (Gy), and biological equivalent dose (Sv)
 *
 * Pure TypeScript physics engine with zero external dependencies.
 */

export type RadiationType = 'alpha' | 'beta' | 'gamma' | 'neutron'

export interface ShieldingMaterial {
  id: string
  name: string
  density: number // g/cm^3
  effectiveZ: number
  color: string
  description: string
  // Coefficients for photon interaction parameterization
  photoelectricCoeff: number // scales tau ~ Z^4.5 / E^3
  comptonCoeff: number // scales sigma ~ Z / E^0.5
  pairProductionCoeff: number // scales kappa ~ Z^2 * ln(E/1.022)
  // Neutron moderation power
  neutronSlowdownPower: number // cm^-1
}

export interface RadiationSource {
  id: string
  name: string
  nuclide: string
  type: RadiationType
  primaryEnergyMev: number
  secondaryEnergyMev?: number
  halfLife: string
  activityBq: number
  description: string
  biologicalHazard: 'Internal only (extreme)' | 'Moderate' | 'High external & internal'
}

export interface AttenuationResult {
  initialFlux: number
  transmittedFlux: number
  attenuationFraction: number // I / I0
  percentShielded: number // 100 * (1 - I/I0)
  linearAttenuationCoeff: number // mu in cm^-1
  massAttenuationCoeff: number // mu/rho in cm^2/g
  hvlCm: number // Half-value layer in cm
  tvlCm: number // Tenth-value layer in cm
  dominantMechanism: 'Photoelectric' | 'Compton Scattering' | 'Pair Production' | 'Bethe-Bloch Ionization' | 'Elastic Moderation'
}

export interface DoseCalculation {
  distanceMeters: number
  exposureHours: number
  doseRateAt1mMicroSvH: number
  actualDoseRateMicroSvH: number
  totalDoseMicroSv: number
  annualPublicLimitPercent: number // 1 mSv/yr = 1000 uSv
  annualOccupationalLimitPercent: number // 20 mSv/yr = 20000 uSv
}

export const SHIELDING_MATERIALS: Record<string, ShieldingMaterial> = {
  lead: {
    id: 'lead',
    name: 'Lead (Pb)',
    density: 11.34,
    effectiveZ: 82,
    color: '#94a3b8',
    description: 'High-density, high-Z metal. The industry benchmark for gamma and X-ray attenuation via photoelectric absorption and pair production.',
    photoelectricCoeff: 0.052,
    comptonCoeff: 0.048,
    pairProductionCoeff: 0.0092,
    neutronSlowdownPower: 0.008,
  },
  concrete: {
    id: 'concrete',
    name: 'Standard Concrete',
    density: 2.35,
    effectiveZ: 13.5,
    color: '#71717a',
    description: 'Cost-effective structural shielding. Effective for broad-beam gamma attenuation and moderate neutron thermalization.',
    photoelectricCoeff: 0.00062,
    comptonCoeff: 0.058,
    pairProductionCoeff: 0.0018,
    neutronSlowdownPower: 0.085,
  },
  water: {
    id: 'water',
    name: 'Light Water (H₂O)',
    density: 1.00,
    effectiveZ: 7.42,
    color: '#06b6d4',
    description: 'High hydrogen density. Ideal neutron moderator used in nuclear reactor pools and spent-fuel cooling basins.',
    photoelectricCoeff: 0.00015,
    comptonCoeff: 0.064,
    pairProductionCoeff: 0.0011,
    neutronSlowdownPower: 0.32,
  },
  borated_poly: {
    id: 'borated_poly',
    name: 'Borated Polyethylene (5% B)',
    density: 0.95,
    effectiveZ: 5.6,
    color: '#10b981',
    description: 'High hydrogen content thermalizes fast neutrons, while 5% Boron-10 captures thermal neutrons via the 10B(n,α)7Li reaction.',
    photoelectricCoeff: 0.00009,
    comptonCoeff: 0.068,
    pairProductionCoeff: 0.0008,
    neutronSlowdownPower: 0.42,
  },
  aluminum: {
    id: 'aluminum',
    name: 'Aluminum (Al)',
    density: 2.70,
    effectiveZ: 13,
    color: '#cbd5e1',
    description: 'Low-Z shielding preferred for beta particles to prevent dangerous Bremsstrahlung secondary X-ray generation.',
    photoelectricCoeff: 0.00055,
    comptonCoeff: 0.057,
    pairProductionCoeff: 0.0017,
    neutronSlowdownPower: 0.022,
  },
  iron: {
    id: 'iron',
    name: 'Steel / Iron (Fe)',
    density: 7.87,
    effectiveZ: 26,
    color: '#f59e0b',
    description: 'Dense structural metal offering intermediate gamma shielding and high-energy neutron inelastic scattering.',
    photoelectricCoeff: 0.0048,
    comptonCoeff: 0.052,
    pairProductionCoeff: 0.0042,
    neutronSlowdownPower: 0.035,
  },
}

export const RADIATION_PRESETS: RadiationSource[] = [
  {
    id: 'cs137',
    name: 'Cesium-137',
    nuclide: '¹³⁷Cs',
    type: 'gamma',
    primaryEnergyMev: 0.662,
    secondaryEnergyMev: 0.514, // Beta max
    halfLife: '30.08 years',
    activityBq: 3.7e7, // 1 mCi
    description: 'Common calibration and industrial gauge isotope. Decays via beta into metastable 137mBa, which emits a 662 keV gamma ray.',
    biologicalHazard: 'High external & internal',
  },
  {
    id: 'co60',
    name: 'Cobalt-60',
    nuclide: '⁶⁰Co',
    type: 'gamma',
    primaryEnergyMev: 1.173,
    secondaryEnergyMev: 1.332,
    halfLife: '5.27 years',
    activityBq: 3.7e8, // 10 mCi
    description: 'Powerful industrial irradiator and legacy teletherapy source emitting dual high-energy gamma photons (1.17 and 1.33 MeV).',
    biologicalHazard: 'High external & internal',
  },
  {
    id: 'am241',
    name: 'Americium-241',
    nuclide: '²⁴¹Am',
    type: 'alpha',
    primaryEnergyMev: 5.486,
    secondaryEnergyMev: 0.0595, // Soft gamma
    halfLife: '432.2 years',
    activityBq: 3.7e4, // 1 µCi (household smoke detector)
    description: 'Alpha emitter in ionization smoke detectors. Alpha is stopped by centimeters of air or dead skin, but dangerous if inhaled.',
    biologicalHazard: 'Internal only (extreme)',
  },
  {
    id: 'sr90',
    name: 'Strontium-90 / Yttrium-90',
    nuclide: '⁹⁰Sr / ⁹⁰Y',
    type: 'beta',
    primaryEnergyMev: 2.28, // Y-90 endpoint beta
    secondaryEnergyMev: 0.546, // Sr-90 endpoint beta
    halfLife: '28.79 years',
    activityBq: 3.7e7, // 1 mCi
    description: 'High-energy pure beta emitter. Bone-seeking fission product. Requires low-Z plastic/aluminum shielding to prevent Bremsstrahlung.',
    biologicalHazard: 'High external & internal',
  },
  {
    id: 'cf252',
    name: 'Californium-252',
    nuclide: '²⁵²Cf',
    type: 'neutron',
    primaryEnergyMev: 2.1, // Mean fission neutron energy
    secondaryEnergyMev: 1.0,
    halfLife: '2.645 years',
    activityBq: 1.0e6,
    description: 'Spontaneous fission actinide emitting 3.77 neutrons per fission with a Maxwellian energy distribution peaking at 0.7–2.1 MeV.',
    biologicalHazard: 'High external & internal',
  },
  {
    id: 'f18',
    name: 'Fluorine-18 (FDG PET)',
    nuclide: '¹⁸F',
    type: 'gamma',
    primaryEnergyMev: 0.511, // Annihilation photons
    secondaryEnergyMev: 0.634, // Positron endpoint
    halfLife: '109.77 min',
    activityBq: 1.85e8, // 5 mCi standard PET injection
    description: 'Positron emitter used in Positron Emission Tomography (PET). Positron annihilates with electron to yield two opposite 511 keV photons.',
    biologicalHazard: 'Moderate',
  },
  {
    id: 'i131',
    name: 'Iodine-131',
    nuclide: '¹³¹I',
    type: 'gamma',
    primaryEnergyMev: 0.364,
    secondaryEnergyMev: 0.606, // Beta max
    halfLife: '8.02 days',
    activityBq: 1.11e9, // 30 mCi thyroid ablation
    description: 'Thyroid therapy radionuclide emitting 364 keV gamma rays alongside energetic beta particles that destroy thyroid carcinoma cells.',
    biologicalHazard: 'High external & internal',
  },
]

/**
 * Calculates gamma linear attenuation components:
 * mu(E) = tau(Photoelectric) + sigma_c(Compton) + kappa(Pair Production)
 */
export function calculateGammaAttenuation(
  energyMev: number,
  material: ShieldingMaterial,
): {
  muTotal: number // cm^-1
  muPhotoelectric: number
  muCompton: number
  muPair: number
  dominant: 'Photoelectric' | 'Compton Scattering' | 'Pair Production'
} {
  const E = Math.max(0.015, energyMev)
  const z = material.effectiveZ
  const rho = material.density

  // 1. Photoelectric absorption ~ 1 / E^3.2 (dominant at low energy E < 0.2 MeV)
  const photoMass = material.photoelectricCoeff * Math.pow(0.5 / E, 3.2)
  const muPhoto = Math.max(0, photoMass * rho)

  // 2. Compton scattering (Klein-Nishina envelope, dominant at intermediate energy 0.3 - 5 MeV)
  const comptonMass = material.comptonCoeff / (1 + 0.85 * Math.sqrt(E))
  const muCompton = Math.max(0, comptonMass * rho)

  // 3. Pair production (threshold at 2 * m_e * c^2 = 1.022 MeV, dominant at high energy E > 5 MeV)
  let muPair = 0
  if (E > 1.022) {
    const pairMass = material.pairProductionCoeff * Math.log(E / 1.022)
    muPair = Math.max(0, pairMass * rho)
  }

  const muTotal = muPhoto + muCompton + muPair

  let dominant: 'Photoelectric' | 'Compton Scattering' | 'Pair Production' = 'Compton Scattering'
  if (muPhoto >= muCompton && muPhoto >= muPair) {
    dominant = 'Photoelectric'
  } else if (muPair >= muPhoto && muPair >= muCompton) {
    dominant = 'Pair Production'
  }

  return {
    muTotal,
    muPhotoelectric: muPhoto,
    muCompton,
    muPair,
    dominant,
  }
}

/**
 * Calculates Alpha particle range in matter using semi-empirical Bragg-Kleeman rule:
 * Range R = 0.318 * E^(1.5) (in cm of air), then scaled by densities and sqrt(A)
 */
export function calculateAlphaRangeCm(energyMev: number, material: ShieldingMaterial): number {
  const rangeAirCm = 0.318 * Math.pow(energyMev, 1.5)
  const airDensity = 0.001225
  const airA = 14.6
  // Scaling by density and atomic weight ratio: R1 / R2 = (rho2 / rho1) * sqrt(A1 / A2)
  const rangeMaterialCm = rangeAirCm * (airDensity / material.density) * Math.sqrt(material.effectiveZ / airA)
  return Math.max(1e-5, rangeMaterialCm)
}

/**
 * Calculates Beta particle maximum range in matter using Katz-Penfold relation:
 * R_max (g/cm^2) = 0.412 * E^(1.265 - 0.0954 * ln(E)) for 0.01 <= E <= 2.5 MeV
 */
export function calculateBetaRangeCm(energyMev: number, material: ShieldingMaterial): number {
  const E = Math.max(0.01, Math.min(10, energyMev))
  let rangeDensityGcm2 = 0
  if (E < 2.5) {
    rangeDensityGcm2 = 0.412 * Math.pow(E, 1.265 - 0.0954 * Math.log(E))
  } else {
    rangeDensityGcm2 = 0.530 * E - 0.106
  }
  return Math.max(1e-4, rangeDensityGcm2 / material.density)
}

/**
 * Computes fraction of Beta kinetic energy converted into secondary Bremsstrahlung X-rays:
 * Yield Y ~ Z * E / (800 MeV)
 */
export function calculateBremsstrahlungYield(energyMev: number, material: ShieldingMaterial): number {
  const yieldFraction = (material.effectiveZ * energyMev) / 800
  return Math.min(0.25, Math.max(0, yieldFraction))
}

/**
 * Evaluates comprehensive multi-layer radiation attenuation through thickness x (cm)
 */
export function evaluateShielding(
  source: RadiationSource,
  material: ShieldingMaterial,
  thicknessCm: number,
  initialIntensity: number = 1000,
): AttenuationResult {
  const x = Math.max(0, thicknessCm)

  if (source.type === 'gamma') {
    const { muTotal, dominant } = calculateGammaAttenuation(source.primaryEnergyMev, material)
    const linearCoeff = muTotal
    const massCoeff = linearCoeff / material.density
    const transmitted = initialIntensity * Math.exp(-linearCoeff * x)
    const fraction = transmitted / initialIntensity
    const hvl = Math.LN2 / linearCoeff
    const tvl = Math.LN10 / linearCoeff

    return {
      initialFlux: initialIntensity,
      transmittedFlux: transmitted,
      attenuationFraction: fraction,
      percentShielded: (1 - fraction) * 100,
      linearAttenuationCoeff: linearCoeff,
      massAttenuationCoeff: massCoeff,
      hvlCm: hvl,
      tvlCm: tvl,
      dominantMechanism: dominant,
    }
  }

  if (source.type === 'alpha') {
    const range = calculateAlphaRangeCm(source.primaryEnergyMev, material)
    const transmitted = x >= range ? 0 : initialIntensity * Math.pow(1 - x / range, 1.2)
    const fraction = transmitted / initialIntensity
    const effectiveMu = 1.0 / (range * 0.3)

    return {
      initialFlux: initialIntensity,
      transmittedFlux: transmitted,
      attenuationFraction: fraction,
      percentShielded: (1 - fraction) * 100,
      linearAttenuationCoeff: effectiveMu,
      massAttenuationCoeff: effectiveMu / material.density,
      hvlCm: range * 0.25,
      tvlCm: range * 0.7,
      dominantMechanism: 'Bethe-Bloch Ionization',
    }
  }

  if (source.type === 'beta') {
    const range = calculateBetaRangeCm(source.primaryEnergyMev, material)
    // Beta attenuation follows quasi-exponential absorption before cutoff
    const bremYield = calculateBremsstrahlungYield(source.primaryEnergyMev, material)
    let fraction = 0
    if (x < range) {
      fraction = Math.exp((-4.5 * x) / range)
    } else {
      // Secondary Bremsstrahlung leakage
      fraction = bremYield * Math.exp(-0.15 * (x - range))
    }
    const transmitted = initialIntensity * fraction
    const effectiveMu = 4.5 / range

    return {
      initialFlux: initialIntensity,
      transmittedFlux: transmitted,
      attenuationFraction: fraction,
      percentShielded: (1 - fraction) * 100,
      linearAttenuationCoeff: effectiveMu,
      massAttenuationCoeff: effectiveMu / material.density,
      hvlCm: Math.LN2 / effectiveMu,
      tvlCm: Math.LN10 / effectiveMu,
      dominantMechanism: 'Bethe-Bloch Ionization',
    }
  }

  // Neutron attenuation via macroscopic removal cross section
  const removalCrossSection = material.neutronSlowdownPower
  const transmitted = initialIntensity * Math.exp(-removalCrossSection * x)
  const fraction = transmitted / initialIntensity
  const hvl = Math.LN2 / removalCrossSection
  const tvl = Math.LN10 / removalCrossSection

  return {
    initialFlux: initialIntensity,
    transmittedFlux: transmitted,
    attenuationFraction: fraction,
    percentShielded: (1 - fraction) * 100,
    linearAttenuationCoeff: removalCrossSection,
    massAttenuationCoeff: removalCrossSection / material.density,
    hvlCm: hvl,
    tvlCm: tvl,
    dominantMechanism: 'Elastic Moderation',
  }
}

/**
 * Generates Bragg peak ionization curve for heavy charged particle (Alpha or Proton):
 * dE/dx vs depth x, showing localized energy deposition spike at terminal range.
 */
export interface BraggPoint {
  depthMm: number
  stoppingPowerMevPerMm: number
  remainingEnergyMev: number
}

export function generateBraggPeak(
  initialEnergyMev: number,
  material: ShieldingMaterial,
  steps: number = 80,
): BraggPoint[] {
  const rangeCm = calculateAlphaRangeCm(initialEnergyMev, material)
  const rangeMm = rangeCm * 10
  const maxDepth = rangeMm * 1.15
  const stepSize = maxDepth / steps

  const points: BraggPoint[] = []

  for (let d = 0; d <= maxDepth; d += stepSize) {
    if (d < rangeMm) {
      // Remaining fractional range
      const rRemaining = Math.max(0.001, 1 - d / rangeMm)
      const remainingE = initialEnergyMev * Math.pow(rRemaining, 0.66)
      // Bethe-Bloch ~ 1 / v^2 ~ 1 / E before cut-off
      const baseDedx = (initialEnergyMev / rangeMm) * 0.45
      const braggMultiplier = 1 / (Math.pow(rRemaining, 0.45) + 0.08)
      const dedx = baseDedx * Math.min(8.5, braggMultiplier)

      points.push({
        depthMm: d,
        stoppingPowerMevPerMm: dedx,
        remainingEnergyMev: remainingE,
      })
    } else {
      // Past terminal range: stopping power is zero
      points.push({
        depthMm: d,
        stoppingPowerMevPerMm: 0,
        remainingEnergyMev: 0,
      })
    }
  }

  return points
}

/**
 * Calculates radiological dose rate and equivalent dose at distance d with shielding:
 * DoseRate(d) = (GammaConstant * Activity / d^2) * exp(-mu * x)
 */
export function calculateDose(
  source: RadiationSource,
  attenuationFraction: number,
  distanceMeters: number,
  exposureHours: number,
): DoseCalculation {
  const d = Math.max(0.1, distanceMeters)
  const t = Math.max(0.01, exposureHours)

  // Radiation weighting factor w_R (ICRP 103)
  const wR = source.type === 'alpha' ? 20 : source.type === 'neutron' ? 10 : 1

  // Specific gamma-ray constant approximation (uSv*m^2 / (h * MBq))
  let specificGammaConst = 0.08
  if (source.id === 'co60') specificGammaConst = 0.35
  else if (source.id === 'cs137') specificGammaConst = 0.081
  else if (source.id === 'f18') specificGammaConst = 0.14
  else if (source.id === 'i131') specificGammaConst = 0.055
  else if (source.type === 'alpha') specificGammaConst = 0.002 // Mostly contained
  else if (source.type === 'beta') specificGammaConst = 0.03
  else if (source.type === 'neutron') specificGammaConst = 0.25

  const activityMbq = source.activityBq / 1e6
  const unshieldedRateAt1m = specificGammaConst * activityMbq * wR
  const actualRate = (unshieldedRateAt1m / (d * d)) * attenuationFraction
  const totalDose = actualRate * t

  return {
    distanceMeters: d,
    exposureHours: t,
    doseRateAt1mMicroSvH: unshieldedRateAt1m,
    actualDoseRateMicroSvH: actualRate,
    totalDoseMicroSv: totalDose,
    annualPublicLimitPercent: (totalDose / 1000) * 100, // 1 mSv public limit
    annualOccupationalLimitPercent: (totalDose / 20000) * 100, // 20 mSv occupational limit
  }
}
