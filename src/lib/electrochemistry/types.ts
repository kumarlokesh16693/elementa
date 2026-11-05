/**
 * Electrochemistry & Battery Lab Type Definitions
 */

export interface HalfReaction {
  id: string
  name: string
  equation: string // Reduction equation e.g. "Cu²⁺ + 2e⁻ → Cu"
  standardPotential: number // E° (V vs SHE at 298.15 K)
  electrons: number // n
  metal: string // Chemical symbol of electrode solid
  ionSpecies: string // Chemical formula of ion in solution
  ionCharge: number // e.g. +2
  molarMass: number // g/mol of electrode metal
  color: string // CPK / visual color of electrode metal
  solutionColor: string // visual hue of aqueous solution
  category: 'standard' | 'battery' | 'corrosion' | 'fuel-cell'
}

export interface GalvanicCellPair {
  anodeHalfReaction: HalfReaction
  cathodeHalfReaction: HalfReaction
  standardCellPotential: number // E°_cell = E°_cathode - E°_anode
  electronsTransferred: number // n
  overallEquation: string
  spontaneous: boolean // E°_cell > 0
}

export interface NernstCalculation {
  standardPotential: number // E°_cell (V)
  cellPotential: number // E_cell (V) at given T and concentrations
  reactionQuotientQ: number // Q = [Anode^charge]^... / [Cathode^charge]^...
  deltaG: number // Gibbs free energy ΔG = -nFE (kJ/mol)
  equilibriumConstantK: number // K = exp(nFE° / RT)
  isSpontaneous: boolean // E > 0 (ΔG < 0)
  tempK: number
  anodeConc: number // M (mol/L)
  cathodeConc: number // M (mol/L)
  faradayConstant: number // 96485.33 C/mol
}

export interface BatteryArchitecture {
  id: string
  name: string
  shortName: string
  chemistry: string
  nominalVoltage: number // V
  maxVoltage: number // V
  cutOffVoltage: number // V
  specificEnergyWhKg: number // Wh/kg
  volumetricEnergyWhL: number // Wh/L
  cycleLife: number // cycles
  anodeMaterial: string
  cathodeMaterial: string
  electrolyte: string
  dischargeReaction: string
  chargeReaction: string
  advantages: string[]
  limitations: string[]
  applications: string[]
  ocvCurvePoints: { soc: number; voltage: number }[] // Open Circuit Voltage vs SoC (0 - 100%)
}
