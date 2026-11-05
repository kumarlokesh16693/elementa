/**
 * Molecular Spectroscopy & Photophysics Engine
 * Harmonic oscillator mechanics, reduced mass, isotope effect,
 * Beer-Lambert optical attenuation, and FTIR continuous transmittance curve generation.
 */

import type { SpectroscopyMolecule, BeerLambertState, VibrationalMode } from './types'

export const SPEED_OF_LIGHT_CM_S = 2.99792458e10 // cm/s
export const PLANCK_CONST = 6.62607015e-34 // J·s

/**
 * Calculates reduced mass mu (kg) between two atomic masses in amu
 */
export function computeReducedMass(m1Amu: number, m2Amu: number): number {
  const amuToKg = 1.6605390666e-27
  const m1 = m1Amu * amuToKg
  const m2 = m2Amu * amuToKg
  return (m1 * m2) / (m1 + m2)
}

/**
 * Computes Beer-Lambert Law optical parameters: A = ε · b · c, T = 10^(-A)
 */
export function computeBeerLambert(
  pathLengthCm: number,
  concentrationM: number,
  molarExtinction: number
): BeerLambertState {
  const b = Math.max(pathLengthCm, 0.01)
  const c = Math.max(concentrationM, 0)
  const eps = Math.max(molarExtinction, 0)

  // Absorbance A = ε · b · c
  const absorbance = eps * b * c

  // Transmittance T = 10^(-A)
  // Clamped to avoid floating underflow
  const T = Math.pow(10, -Math.min(absorbance, 8))
  const transmittancePct = T * 100

  return {
    pathLengthCm: b,
    concentrationM: c,
    molarExtinction: eps,
    absorbance,
    transmittancePct,
    transmittedIntensityPct: transmittancePct,
  }
}

/**
 * Evaluates continuous simulated FTIR transmittance spectrum T(ν) from 400 to 4000 cm⁻¹
 */
export function generateFtirSpectrum(
  modes: VibrationalMode[],
  numPoints = 600,
  minWavenumber = 400,
  maxWavenumber = 4000
): { wavenumber: number; transmittance: number }[] {
  const data: { wavenumber: number; transmittance: number }[] = []
  const step = (maxWavenumber - minWavenumber) / (numPoints - 1)

  for (let i = 0; i < numPoints; i++) {
    const wn = minWavenumber + i * step
    // Baseline transmittance ~98% with subtle noise
    let T = 98.0 - 0.5 * Math.sin(wn * 0.005)

    for (const mode of modes) {
      if (!mode.irActive) continue
      // Peak depth: 100 - transmittancePercent (stronger absorption = lower trough)
      const depth = Math.max(100 - mode.transmittancePercent, 5)
      // Natural vibrational line width (FWHM ~25-45 cm⁻¹)
      const fwhm = mode.type.startsWith('stretch') ? 35 : 24
      const diff = (wn - mode.wavenumber) / (fwhm * 0.5)

      // Lorentzian absorption profile
      const lorentz = 1 / (1 + diff * diff)
      T -= depth * lorentz
    }

    data.push({ wavenumber: wn, transmittance: Math.max(Math.min(T, 100), 2) })
  }

  return data
}

export interface DiagnosticZone {
  name: string
  range: [number, number] // cm⁻¹
  color: string
  description: string
}

export const FTIR_DIAGNOSTIC_ZONES: DiagnosticZone[] = [
  {
    name: 'O-H / N-H Stretch',
    range: [3200, 3650],
    color: '#38bdf8',
    description: 'Hydroxyl hydrogen-bonded network and amine N-H stretching',
  },
  {
    name: 'C-H Stretch',
    range: [2850, 3100],
    color: '#34d399',
    description: 'Aliphatic sp³ and aromatic/alkenyl sp² C-H stretching vibrations',
  },
  {
    name: 'Triple Bonds (C≡C, C≡N)',
    range: [2100, 2300],
    color: '#a78bfa',
    description: 'Alkynes and nitriles high-frequency covalent stretching',
  },
  {
    name: 'Carbonyl (C=O)',
    range: [1650, 1780],
    color: '#fbbf24',
    description: 'Ketones, aldehydes, esters & carboxylic acid intense dipolar stretch',
  },
  {
    name: 'Fingerprint Region',
    range: [400, 1500],
    color: '#f43f5e',
    description: 'Complex skeletal bending, C-O single bond stretching, and torsional modes',
  },
]
