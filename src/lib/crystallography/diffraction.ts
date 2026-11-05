/**
 * Crystallographic Math & X-Ray Powder Diffraction Engine
 * Implements metric tensors, reciprocal lattices, Bragg's Law, structure factors,
 * Lorentz-polarization corrections, and Scherrer crystallite size broadening.
 */

import type { CrystalStructure, LatticeParameters, MillerIndices, XRDPeak, XRaySource } from './types'

export const XRAY_SOURCES: XRaySource[] = [
  { id: 'Cu-Ka', name: 'Cu Kα (1.5406 Å)', wavelength: 1.5406, description: 'Standard laboratory diffractometer anode' },
  { id: 'Mo-Ka', name: 'Mo Kα (0.7107 Å)', wavelength: 0.71073, description: 'Short-wavelength anode for high-angle / heavy-element diffraction' },
  { id: 'Co-Ka', name: 'Co Kα (1.7890 Å)', wavelength: 1.7890, description: 'Ideal for ferrous samples (avoids Fe fluorescence)' },
  { id: 'Cr-Ka', name: 'Cr Kα (2.2909 Å)', wavelength: 2.2909, description: 'Long-wavelength anode for high 2θ peak dispersion' },
  { id: 'Synchrotron', name: 'Synchrotron (0.5000 Å)', wavelength: 0.5000, description: 'Ultra-bright, tunable high-energy synchrotron radiation' },
]

/**
 * Computes unit cell volume V (in Å³) from lattice parameters
 */
export function computeUnitCellVolume(lattice: LatticeParameters): number {
  const { a, b, c, alpha, beta, gamma } = lattice
  const radA = (alpha * Math.PI) / 180
  const radB = (beta * Math.PI) / 180
  const radG = (gamma * Math.PI) / 180

  const cosA = Math.cos(radA)
  const cosB = Math.cos(radB)
  const cosG = Math.cos(radG)

  const term = 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG
  return a * b * c * Math.sqrt(Math.max(term, 0))
}

/**
 * Universal interplanar d-spacing calculation using reciprocal metric tensor
 */
export function computeDSpacing(h: number, k: number, l: number, lattice: LatticeParameters): number {
  if (h === 0 && k === 0 && l === 0) return 0
  const { a, b, c, alpha, beta, gamma } = lattice

  // Fast-path for orthogonal lattices (Cubic, Tetragonal, Orthorhombic)
  if (alpha === 90 && beta === 90 && gamma === 90) {
    const invD2 = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c)
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0
  }

  // Fast-path for Hexagonal lattice (alpha=90, beta=90, gamma=120)
  if (alpha === 90 && beta === 90 && gamma === 120) {
    const invD2 = ((4 / 3) * (h * h + h * k + k * k)) / (a * a) + (l * l) / (c * c)
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0
  }

  // General Triclinic/Monoclinic/Rhombohedral metric tensor formulation
  const radA = (alpha * Math.PI) / 180
  const radB = (beta * Math.PI) / 180
  const radG = (gamma * Math.PI) / 180

  const cosA = Math.cos(radA)
  const cosB = Math.cos(radB)
  const cosG = Math.cos(radG)
  const sinA = Math.sin(radA)
  const sinB = Math.sin(radB)
  const sinG = Math.sin(radG)

  const V = computeUnitCellVolume(lattice)
  if (V <= 0) return 0

  const S11 = b * b * c * c * sinA * sinA
  const S22 = a * a * c * c * sinB * sinB
  const S33 = a * a * b * b * sinG * sinG
  const S12 = a * b * c * c * (cosA * cosB - cosG)
  const S23 = a * a * b * c * (cosB * cosG - cosA)
  const S13 = a * b * b * c * (cosG * cosA - cosB)

  const invD2 =
    (1 / (V * V)) *
    (S11 * h * h +
      S22 * k * k +
      S33 * l * l +
      2 * S12 * h * k +
      2 * S23 * k * l +
      2 * S13 * h * l)

  return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0
}

/**
 * Approximate atomic form factor f(s) where s = sin(θ)/λ = 1/(2d)
 */
function getAtomicFormFactor(z: number, s: number): number {
  // Gaussian-damped atomic form factor model
  const B = 2.0 // Thermal B-factor / Debye-Waller parameter
  return z * Math.exp(-B * s * s) / (1 + 0.3 * s * s)
}

/**
 * Computes structure factor F_hkl = sum_j f_j * exp(2*pi*i*(h*u + k*v + l*w))
 */
export function computeStructureFactor(
  structure: CrystalStructure,
  h: number,
  k: number,
  l: number,
  dSpacing: number
): { real: number; imag: number; modulus: number } {
  const s = dSpacing > 0 ? 1 / (2 * dSpacing) : 0
  let realSum = 0
  let imagSum = 0

  for (const atom of structure.basisAtoms) {
    const f = getAtomicFormFactor(atom.z, s) * (atom.occupancy ?? 1.0)
    const phase = 2 * Math.PI * (h * atom.fracPos[0] + k * atom.fracPos[1] + l * atom.fracPos[2])
    realSum += f * Math.cos(phase)
    imagSum += f * Math.sin(phase)
  }

  const modulus = Math.sqrt(realSum * realSum + imagSum * imagSum)
  return { real: realSum, imag: imagSum, modulus }
}

/**
 * Estimates reflection multiplicity p_hkl based on crystal system symmetry
 */
export function computeMultiplicity(h: number, k: number, l: number, system: string): number {
  const absH = Math.abs(h)
  const absK = Math.abs(k)
  const absL = Math.abs(l)
  const zeroCount = (absH === 0 ? 1 : 0) + (absK === 0 ? 1 : 0) + (absL === 0 ? 1 : 0)

  if (system === 'cubic') {
    if (absH === absK && absK === absL) {
      return absH === 0 ? 0 : 8 // {hhh} e.g. (111) -> 8
    }
    if (zeroCount === 2) return 6 // {h00} -> 6
    if (zeroCount === 1) {
      if (absH === absK || absK === absL || absH === absL) return 12 // {hh0} -> 12
      return 24 // {hk0} -> 24
    }
    if (absH === absK || absK === absL || absH === absL) return 24 // {hhl} -> 24
    return 48 // {hkl} -> 48
  }

  if (system === 'hexagonal') {
    if (absH === 0 && absK === 0) return 2 // (00l)
    if (absL === 0) {
      if (absH === absK || absH === 0 || absK === 0) return 6
      return 12
    }
    return 12
  }

  if (system === 'tetragonal') {
    if (zeroCount === 2 && absL > 0) return 2 // (00l)
    if (zeroCount === 2) return 4 // (h00)
    if (absH === absK && absL === 0) return 4
    if (absL === 0) return 8
    return 16
  }

  // Default for orthorhombic/monoclinic
  return 8
}

/**
 * Lorentz-Polarization Factor LP(2θ) for unpolarized radiation
 */
export function computeLorentzPolarization(thetaRad: number): number {
  if (thetaRad <= 0 || thetaRad >= Math.PI / 2) return 0
  const cosT = Math.cos(thetaRad)
  const sinT = Math.sin(thetaRad)
  const twoT = 2 * thetaRad
  const cos2T = Math.cos(twoT)
  return (1 + cos2T * cos2T) / (sinT * sinT * cosT)
}

/**
 * Computes all allowed XRD diffraction peaks within 2θ range [10°, 90°]
 */
export function calculateXRDDiffraction(
  structure: CrystalStructure,
  wavelength: number,
  crystalliteSizeNm = 30, // Scherrer crystallite size L in nm
  maxIndex = 6
): XRDPeak[] {
  const peaks: XRDPeak[] = []
  const seenAngles = new Set<string>()

  // Loop through Miller indices (h, k, l)
  for (let h = 0; h <= maxIndex; h++) {
    for (let k = 0; k <= maxIndex; k++) {
      for (let l = 0; l <= maxIndex; l++) {
        if (h === 0 && k === 0 && l === 0) continue

        const d = computeDSpacing(h, k, l, structure.lattice)
        if (d <= 0) continue

        const sinTheta = wavelength / (2 * d)
        if (sinTheta >= 1.0) continue // Beyond diffraction limit

        const thetaRad = Math.asin(sinTheta)
        const thetaDeg = (thetaRad * 180) / Math.PI
        const twoThetaDeg = 2 * thetaDeg

        // Restrict to standard 2θ lab range [8°, 100°]
        if (twoThetaDeg < 8 || twoThetaDeg > 100) continue

        const sf = computeStructureFactor(structure, h, k, l, d)
        if (sf.modulus < 0.05) continue // Systematic extinction / forbidden reflection

        const multiplicity = computeMultiplicity(h, k, l, structure.system)
        const lp = computeLorentzPolarization(thetaRad)

        // Raw intensity I = |F|^2 * multiplicity * LP
        const rawIntensity = sf.modulus * sf.modulus * multiplicity * lp

        // Scherrer broadening FWHM (degrees)
        // beta = (K * lambda) / (L * cos(theta)) [rad]
        const K = 0.94
        const lambdaNm = wavelength * 0.1 // Å to nm
        const fwhmRad = (K * lambdaNm) / (crystalliteSizeNm * Math.cos(thetaRad))
        const fwhmDeg = Math.max((fwhmRad * 180) / Math.PI, 0.08)

        // Key to deduplicate reflections that have identical 2θ within 0.01 deg
        const angleKey = twoThetaDeg.toFixed(2)
        if (seenAngles.has(angleKey)) {
          // Add to existing reflection
          const existing = peaks.find((p) => Math.abs(p.twoTheta - twoThetaDeg) < 0.03)
          if (existing) {
            existing.intensity += rawIntensity
            continue
          }
        }
        seenAngles.add(angleKey)

        peaks.push({
          h,
          k,
          l,
          dSpacing: d,
          theta: thetaDeg,
          twoTheta: twoThetaDeg,
          structureFactor: sf.modulus,
          intensity: rawIntensity,
          multiplicity,
          fwhm: fwhmDeg,
        })
      }
    }
  }

  // Normalize intensities so max peak = 100%
  const maxI = Math.max(...peaks.map((p) => p.intensity), 1e-6)
  peaks.forEach((p) => {
    p.intensity = (p.intensity / maxI) * 100
  })

  // Sort by ascending 2θ
  peaks.sort((a, b) => a.twoTheta - b.twoTheta)

  return peaks
}

/**
 * Evaluates the continuous simulated XRD diffractogram curve profile I(2θ)
 * using a sum of pseudo-Voigt or Gaussian peaks with background noise.
 */
export function generateDiffractogramProfile(
  peaks: XRDPeak[],
  twoThetaMin = 10,
  twoThetaMax = 90,
  numPoints = 800
): { twoTheta: number; intensity: number }[] {
  const data: { twoTheta: number; intensity: number }[] = []
  const step = (twoThetaMax - twoThetaMin) / (numPoints - 1)

  for (let i = 0; i < numPoints; i++) {
    const x = twoThetaMin + i * step
    let y = 1.5 // baseline background

    for (const peak of peaks) {
      if (Math.abs(x - peak.twoTheta) > 5 * peak.fwhm) continue
      // Gaussian peak shape: I * exp( -4 * ln(2) * ((x - x0)/fwhm)^2 )
      const diff = (x - peak.twoTheta) / (peak.fwhm || 0.1)
      const gauss = Math.exp(-2.7725887 * diff * diff)
      // Cauchy-Lorentz peak shape: 1 / (1 + 4 * ((x - x0)/fwhm)^2)
      const lorentz = 1 / (1 + 4 * diff * diff)
      // Pseudo-Voigt combination (60% Gauss + 40% Lorentz)
      const pv = 0.6 * gauss + 0.4 * lorentz
      y += peak.intensity * pv
    }

    data.push({ twoTheta: x, intensity: y })
  }

  return data
}
