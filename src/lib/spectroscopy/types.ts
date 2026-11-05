/**
 * Molecular Vibrational Modes & Spectroscopy Type Definitions
 */

export interface Atom3D {
  element: string
  z: number
  position: [number, number, number] // Equilibrium position in Å
  color?: string
  radius?: number
}

export interface Bond3D {
  from: number
  to: number
  order?: number // 1, 2, 3
}

export interface VibrationalMode {
  id: string
  name: string // e.g. "Symmetric OH Stretch", "H-O-H Scissoring Bend"
  type: 'stretch-sym' | 'stretch-asym' | 'bend-scissor' | 'bend-wag' | 'twist' | 'rock'
  wavenumber: number // cm⁻¹
  transmittancePercent: number // 0 - 100% (lower = stronger absorption dip in FTIR)
  irActive: boolean // IR dipole moment selection rule dμ/dq ≠ 0
  ramanActive: boolean // Polarizability selection rule dα/dq ≠ 0
  symmetryLabel?: string // e.g. A1, B2, Σg+, Πu
  displacementVectors: [number, number, number][] // 3D displacement vector per atom
  description: string
}

export interface UVVisAbsorption {
  lambdaMaxNm: number // nm (peak absorption wavelength)
  molarAbsorptivity: number // ε in L/(mol·cm)
  transitionType: string // e.g. "π ➔ π*", "n ➔ π*", "d ➔ d (Ligand Field)", "Charge Transfer"
  solutionColor: string // Visual appearance of solution
  absorptionColorName: string // Color of absorbed photons
}

export interface SpectroscopyMolecule {
  id: string
  name: string
  formula: string
  systematicName: string
  molecularWeight: number
  pointGroup: string // e.g. C2v, D∞h, Td, D6h
  degreesOfFreedom: {
    translational: number
    rotational: number
    vibrational: number // 3N - 6 (or 3N - 5 for linear)
  }
  atoms3D: Atom3D[]
  bonds3D: Bond3D[]
  modes: VibrationalMode[]
  uvVis: UVVisAbsorption
  description: string
  applications: string[]
}

export interface BeerLambertState {
  pathLengthCm: number // b (0.1 - 5.0 cm)
  concentrationM: number // c (mol/L)
  molarExtinction: number // ε (L/(mol·cm))
  absorbance: number // A = ε * b * c
  transmittancePct: number // T = 10^(-A) * 100%
  transmittedIntensityPct: number
}
