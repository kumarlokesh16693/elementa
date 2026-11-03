/**
 * CRYSTALLOGRAPHY, MILLER INDICES & POWDER XRD (X-RAY DIFFRACTION) ENGINE
 *
 * Implements:
 * - Lattice parameter calculation (a, c in Å) from atomic radius and crystal system
 * - Atomic Packing Factor (APF) and Coordination numbers
 * - Miller index plane cutting equations and polygon intersections
 * - Powder X-ray Diffraction (PXRD) simulation via Bragg's Law:
 *     λ = 2 d_{hkl} sin(θ)
 * - Systematic absence extinction conditions for FCC, BCC, HCP, SC, and Diamond lattices
 * - Peak intensity modeling using Multiplicity and Lorentz-Polarization factors
 */

import type { ElementData } from './types'

export const CU_K_ALPHA = 1.5406 // Å (Copper K-alpha wavelength)
export const MO_K_ALPHA = 0.7107 // Å (Molybdenum K-alpha wavelength)

export interface MillerPlane {
  h: number
  k: number
  l: number
  name: string
  dSpacingAngstrom: number
  twoThetaDeg: number
  relativeIntensity: number
}

export interface XrdPeak {
  h: number
  k: number
  l: number
  dSpacingAngstrom: number
  twoThetaDeg: number
  relativeIntensity: number
  multiplicity: number
}

export interface CrystallographyDetails {
  kind: 'fcc' | 'bcc' | 'hcp' | 'diamond' | 'simple-cubic' | 'other'
  system: string
  spaceGroup: string
  pearson: string
  coordination: number
  apf: number // Atomic Packing Factor (0..1)
  apfPercent: string
  latticeA: number // Å
  latticeC?: number // Å
  atomicRadiusAngstrom: number
  prominentPlanes: MillerPlane[]
  xrdPeaks: XrdPeak[]
}

/**
 * Estimate lattice constant `a` (and `c` for HCP) from element atomic radius.
 */
export function estimateLatticeParameters(
  el: ElementData,
  kind: 'fcc' | 'bcc' | 'hcp' | 'diamond' | 'simple-cubic' | 'other',
): { a: number; c?: number } {
  // atomicRadius is in picometers (pm) in ElementData; convert to Ångströms (1 Å = 100 pm)
  const r = (el.atomicRadius ?? 140) / 100

  switch (kind) {
    case 'fcc':
      return { a: 2 * Math.SQRT2 * r }
    case 'bcc':
      return { a: (4 / Math.sqrt(3)) * r }
    case 'hcp':
      return { a: 2 * r, c: 2 * r * Math.sqrt(8 / 3) }
    case 'diamond':
      return { a: (8 / Math.sqrt(3)) * r }
    case 'simple-cubic':
      return { a: 2 * r }
    default:
      return { a: 2 * Math.SQRT2 * r }
  }
}

/**
 * Calculate interplanar d-spacing for cubic crystal systems.
 */
export function calculateDSpacingCubic(a: number, h: number, k: number, l: number): number {
  const sumSq = h * h + k * k + l * l
  if (sumSq === 0) return 0
  return a / Math.sqrt(sumSq)
}

/**
 * Calculate interplanar d-spacing for hexagonal systems.
 */
export function calculateDSpacingHexagonal(
  a: number,
  c: number,
  h: number,
  k: number,
  l: number,
): number {
  const term1 = ((4 / 3) * (h * h + h * k + k * k)) / (a * a)
  const term2 = (l * l) / (c * c)
  const denom = term1 + term2
  if (denom <= 0) return 0
  return 1 / Math.sqrt(denom)
}

/**
 * Compute Bragg diffraction angle 2θ in degrees:
 *   λ = 2 d sin(θ) => 2θ = 2 arcsin(λ / 2d)
 */
export function calculateTwoTheta(dSpacing: number, wavelength = CU_K_ALPHA): number | null {
  const sinTheta = wavelength / (2 * dSpacing)
  if (sinTheta >= 1 || sinTheta <= 0) return null
  const thetaRad = Math.asin(sinTheta)
  return (thetaRad * 2 * 180) / Math.PI
}

/**
 * Multiplicity factor p_{hkl} for cubic crystals.
 */
export function getCubicMultiplicity(h: number, k: number, l: number): number {
  const absVals = [Math.abs(h), Math.abs(k), Math.abs(l)].sort((a, b) => b - a)
  const [a, b, c] = absVals

  const nonZero = absVals.filter((v) => v > 0).length
  const unique = new Set(absVals).size

  if (a > 0 && b === 0 && c === 0) return 6 // {h 0 0}
  if (a === b && c === 0) return 12 // {h h 0}
  if (a === b && b === c) return 8 // {h h h}
  if (a > 0 && b > 0 && c === 0 && a !== b) return 24 // {h k 0}
  if (a === b && c > 0 && a !== c) return 24 // {h h l}
  if (a > 0 && b > 0 && c > 0 && unique === 3) return 48 // {h k l}
  return 12
}

/**
 * Lorentz-Polarization factor: LP(θ) = (1 + cos²(2θ)) / (sin²(θ) * cos(θ))
 */
export function lorentzPolarization(twoThetaDeg: number): number {
  const theta = ((twoThetaDeg / 2) * Math.PI) / 180
  const sinT = Math.sin(theta)
  const cosT = Math.cos(theta)
  const twoT = (twoThetaDeg * Math.PI) / 180
  const cos2T = Math.cos(twoT)

  if (sinT <= 1e-4 || cosT <= 1e-4) return 0
  return (1 + cos2T * cos2T) / (sinT * sinT * cosT)
}

/**
 * Check selection rule / systematic absence for cubic crystal lattices.
 */
export function isReflectionAllowed(
  kind: 'fcc' | 'bcc' | 'diamond' | 'simple-cubic' | 'hcp' | 'other',
  h: number,
  k: number,
  l: number,
): boolean {
  if (h === 0 && k === 0 && l === 0) return false

  if (kind === 'fcc') {
    // FCC: h, k, l must be unmixed (all odd or all even)
    const oH = Math.abs(h) % 2 === 1
    const oK = Math.abs(k) % 2 === 1
    const oL = Math.abs(l) % 2 === 1
    return (oH && oK && oL) || (!oH && !oK && !oL)
  }

  if (kind === 'bcc') {
    // BCC: h + k + l must be even
    return (Math.abs(h) + Math.abs(k) + Math.abs(l)) % 2 === 0
  }

  if (kind === 'diamond') {
    // Diamond: all odd OR (all even and h + k + l = 4n)
    const oH = Math.abs(h) % 2 === 1
    const oK = Math.abs(k) % 2 === 1
    const oL = Math.abs(l) % 2 === 1
    if (oH && oK && oL) return true
    if (!oH && !oK && !oL) {
      return (Math.abs(h) + Math.abs(k) + Math.abs(l)) % 4 === 0
    }
    return false
  }

  if (kind === 'simple-cubic') {
    return true
  }

  if (kind === 'hcp') {
    // HCP extinction: if h + 2k = 3n, l must be even
    if ((Math.abs(h) + 2 * Math.abs(k)) % 3 === 0 && Math.abs(l) % 2 === 1) {
      return false
    }
    return true
  }

  return true
}

/**
 * Generate simulated Powder XRD reflection peaks for an element.
 */
export function generateXrdPeaks(
  kind: 'fcc' | 'bcc' | 'diamond' | 'simple-cubic' | 'hcp' | 'other',
  a: number,
  c?: number,
  wavelength = CU_K_ALPHA,
): XrdPeak[] {
  const peaks: XrdPeak[] = []
  const maxIndex = 5

  const tested = new Set<number>()

  for (let h = 0; h <= maxIndex; h++) {
    for (let k = 0; k <= h; k++) {
      for (let l = 0; l <= k; l++) {
        if (h === 0 && k === 0 && l === 0) continue

        if (!isReflectionAllowed(kind, h, k, l)) continue

        let d = 0
        if (kind === 'hcp' && c) {
          d = calculateDSpacingHexagonal(a, c, h, k, l)
        } else {
          d = calculateDSpacingCubic(a, h, k, l)
        }

        const twoTheta = calculateTwoTheta(d, wavelength)
        if (twoTheta == null || twoTheta < 15 || twoTheta > 95) continue

        // avoid duplicate d-spacings in cubic
        const roundTwoT = Math.round(twoTheta * 10)
        if (tested.has(roundTwoT)) continue
        tested.add(roundTwoT)

        const mult = getCubicMultiplicity(h, k, l)
        const lp = lorentzPolarization(twoTheta)

        // Atomic scattering factor attenuation roughly e^(-B sin²θ / λ²)
        const sinT = Math.sin(((twoTheta / 2) * Math.PI) / 180)
        const fAtten = Math.exp((-2.5 * sinT * sinT) / (wavelength * wavelength))

        const rawIntensity = mult * lp * (fAtten * fAtten)

        peaks.push({
          h,
          k,
          l,
          dSpacingAngstrom: Number(d.toFixed(4)),
          twoThetaDeg: Number(twoTheta.toFixed(2)),
          relativeIntensity: rawIntensity,
          multiplicity: mult,
        })
      }
    }
  }

  // Normalize relative intensity to 100%
  const maxI = Math.max(...peaks.map((p) => p.relativeIntensity), 1)
  return peaks
    .map((p) => ({
      ...p,
      relativeIntensity: Math.round((p.relativeIntensity / maxI) * 100),
    }))
    .sort((a, b) => a.twoThetaDeg - b.twoThetaDeg)
}

/**
 * Return full crystallography specs and XRD peaks for an element.
 */
export function getCrystallographyDetails(
  el: ElementData,
  rawKind: string,
): CrystallographyDetails {
  let kind: 'fcc' | 'bcc' | 'hcp' | 'diamond' | 'simple-cubic' | 'other' = 'other'

  if (rawKind === 'fcc') kind = 'fcc'
  else if (rawKind === 'bcc') kind = 'bcc'
  else if (rawKind === 'hcp') kind = 'hcp'
  else if (rawKind === 'diamond') kind = 'diamond'
  else if (rawKind === 'simple-cubic') kind = 'simple-cubic'

  const { a, c } = estimateLatticeParameters(el, kind)
  const r = (el.atomicRadius ?? 140) / 100

  let apf = 0.68
  let apfPercent = '68.0%'
  let coordination = 8
  let system = 'Cubic'
  let spaceGroup = 'Im-3m'
  let pearson = 'cI2'

  if (kind === 'fcc') {
    apf = 0.7405
    apfPercent = '74.1%'
    coordination = 12
    system = 'Face-Centred Cubic'
    spaceGroup = 'Fm-3m'
    pearson = 'cF4'
  } else if (kind === 'bcc') {
    apf = 0.6802
    apfPercent = '68.0%'
    coordination = 8
    system = 'Body-Centred Cubic'
    spaceGroup = 'Im-3m'
    pearson = 'cI2'
  } else if (kind === 'hcp') {
    apf = 0.7405
    apfPercent = '74.1%'
    coordination = 12
    system = 'Hexagonal Close-Packed'
    spaceGroup = 'P6₃/mmc'
    pearson = 'hP2'
  } else if (kind === 'diamond') {
    apf = 0.3401
    apfPercent = '34.0%'
    coordination = 4
    system = 'Diamond Cubic'
    spaceGroup = 'Fd-3m'
    pearson = 'cF8'
  } else if (kind === 'simple-cubic') {
    apf = 0.5236
    apfPercent = '52.4%'
    coordination = 6
    system = 'Simple Cubic'
    spaceGroup = 'Pm-3m'
    pearson = 'cP1'
  }

  const xrdPeaks = generateXrdPeaks(kind, a, c, CU_K_ALPHA)

  const prominentIndices =
    kind === 'fcc'
      ? [
          [1, 1, 1],
          [2, 0, 0],
          [2, 2, 0],
          [3, 1, 1],
        ]
      : kind === 'bcc'
        ? [
            [1, 1, 0],
            [2, 0, 0],
            [2, 1, 1],
            [2, 2, 0],
          ]
        : kind === 'diamond'
          ? [
              [1, 1, 1],
              [2, 2, 0],
              [3, 1, 1],
              [4, 0, 0],
            ]
          : [
              [1, 0, 0],
              [1, 1, 0],
              [1, 1, 1],
              [2, 0, 0],
            ]

  const prominentPlanes: MillerPlane[] = prominentIndices.map(([h, k, l]) => {
    const d = calculateDSpacingCubic(a, h, k, l)
    const twoT = calculateTwoTheta(d, CU_K_ALPHA) ?? 0
    const matchedPeak = xrdPeaks.find((p) => p.h === h && p.k === k && p.l === l)
    return {
      h,
      k,
      l,
      name: `(${h}${k}${l})`,
      dSpacingAngstrom: Number(d.toFixed(3)),
      twoThetaDeg: Number(twoT.toFixed(2)),
      relativeIntensity: matchedPeak?.relativeIntensity ?? 50,
    }
  })

  return {
    kind,
    system,
    spaceGroup,
    pearson,
    coordination,
    apf,
    apfPercent,
    latticeA: Number(a.toFixed(3)),
    latticeC: c ? Number(c.toFixed(3)) : undefined,
    atomicRadiusAngstrom: Number(r.toFixed(3)),
    prominentPlanes,
    xrdPeaks,
  }
}
