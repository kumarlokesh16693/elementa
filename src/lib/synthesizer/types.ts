export type CompoundCategory =
  | 'oxide'
  | 'halide'
  | 'hydride'
  | 'acid'
  | 'base'
  | 'salt'
  | 'organic'
  | 'semiconductor'
  | 'coordination'
  | 'superconductor'

export type BondingType =
  | 'covalent-molecular'
  | 'ionic'
  | 'covalent-network'
  | 'metallic'

export type StateAtSTP = 'solid' | 'liquid' | 'gas' | 'aqueous'

export interface Atom3D {
  element: string
  z: number
  position: [number, number, number] // Angstroms (Å)
  radius?: number
  color?: string
}

export interface Bond3D {
  from: number
  to: number
  order?: number
}

export interface Compound {
  id: string
  formula: string
  rawFormula: string
  name: string
  systematicName: string
  elements: { z: number; count: number }[]
  molecularWeight: number // g/mol
  category: CompoundCategory
  stateAtSTP: StateAtSTP
  bonding: BondingType
  deltaHf: number // kJ/mol (Standard Enthalpy of Formation at 298.15 K)
  deltaGf: number // kJ/mol (Standard Gibbs Free Energy of Formation at 298.15 K)
  entropyS: number // J/(mol·K) (Standard Molar Entropy)
  electronegativityDiff: number // Δχ
  ionicPct: number // Pauling % ionic character
  color: string
  description: string
  atoms3D: Atom3D[]
  bonds3D: Bond3D[]
  safetyNotes?: string
  applications?: string[]
}

export type ReactionType =
  | 'synthesis'
  | 'combustion'
  | 'decomposition'
  | 'redox'
  | 'precipitation'
  | 'neutralization'
  | 'thermite'

export interface ReactionComponent {
  compoundId: string
  coeff: number
}

export interface ChemicalReaction {
  id: string
  name: string
  type: ReactionType
  equation: string
  reactants: ReactionComponent[]
  products: ReactionComponent[]
  deltaH: number // kJ/mol at 298.15 K
  deltaS: number // J/(mol·K) at 298.15 K
  activationEnergy?: number // kJ/mol
  catalyst?: string
  conditions?: string
  description: string
  hazard?: string
}

export interface ThermodynamicState {
  tempK: number
  deltaH: number // kJ/mol
  deltaS: number // J/(mol·K)
  deltaG: number // kJ/mol
  kEq: number
  isSpontaneous: boolean
  isInverted: boolean
  inversionTemp?: number // K
  thermalRating: 'extremely-exothermic' | 'exothermic' | 'neutral' | 'endothermic' | 'extremely-endothermic'
}
