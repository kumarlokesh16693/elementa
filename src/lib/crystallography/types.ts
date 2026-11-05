/**
 * Crystallography & X-Ray Diffraction (XRD) Type Definitions
 */

export type CrystalSystem =
  | 'cubic'
  | 'tetragonal'
  | 'orthorhombic'
  | 'hexagonal'
  | 'rhombohedral'
  | 'monoclinic'
  | 'triclinic'

export type BravaisLatticeType =
  | 'P' // Primitive
  | 'I' // Body-centered
  | 'F' // Face-centered
  | 'C' // Base-centered
  | 'R' // Rhombohedral

export interface LatticeParameters {
  a: number // Å
  b: number // Å
  c: number // Å
  alpha: number // deg
  beta: number // deg
  gamma: number // deg
}

export interface BasisAtom {
  element: string
  z: number
  fracPos: [number, number, number] // fractional coordinates [u, v, w] in [0, 1)
  color?: string
  radius?: number // Å
  occupancy?: number
}

export interface MillerIndices {
  h: number
  k: number
  l: number
}

export interface XRDPeak {
  h: number
  k: number
  l: number
  dSpacing: number // Å
  twoTheta: number // degrees (2θ)
  theta: number // degrees (θ)
  structureFactor: number // |F_hkl|
  intensity: number // normalized 0 - 100%
  multiplicity: number
  fwhm: number // Full Width at Half Maximum (degrees) via Scherrer equation
}

export interface XRaySource {
  id: string
  name: string
  wavelength: number // Ångströms
  description: string
}

export interface CrystalStructure {
  id: string
  name: string
  chemicalFormula: string
  system: CrystalSystem
  bravais: BravaisLatticeType
  spaceGroup: string
  spaceGroupNumber: number
  lattice: LatticeParameters
  basisAtoms: BasisAtom[]
  atomicPackingFactor: number
  density: number // g/cm³
  description: string
  historicalSignificance?: string
  applications: string[]
  commonMillerPlanes: MillerIndices[]
}
