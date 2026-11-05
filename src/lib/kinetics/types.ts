/**
 * Reaction Kinetics & Catalysis Simulator Types
 */

export type RateOrder = 'zero' | 'first' | 'second' | 'consecutive'

export type InhibitionType = 'none' | 'competitive' | 'non-competitive' | 'uncompetitive'

export interface KineticsReaction {
  id: string
  name: string
  equation: string
  category: 'gas-phase' | 'solution' | 'enzymatic' | 'heterogeneous-catalysis'
  // Thermodynamic & Activation Parameters (kJ/mol)
  eaUncatalyzed: number // Activation energy uncatalyzed (kJ/mol)
  eaCatalyzed: number // Activation energy with catalyst (kJ/mol)
  deltaH: number // Standard enthalpy change (kJ/mol, negative = exothermic)
  deltaG: number // Standard Gibbs free energy change (kJ/mol)
  deltaS_ddagger: number // Activation entropy J/(mol*K)
  frequencyFactorA: number // Pre-exponential factor A (1/s or L/(mol*s))
  catalystName: string
  catalystType: 'homogeneous' | 'heterogeneous' | 'enzyme'
  defaultTempK: number
  order: RateOrder
  description: string
  mechanismSteps: string[]
  industrialApplication: string
}

export interface ConcentrationPoint {
  t: number
  concA: number
  concB?: number
  concP: number
}

export interface MichaelisMentenParams {
  vMax: number // Maximum reaction velocity (uM/s)
  kM: number // Michaelis constant (uM)
  inhibitorType: InhibitionType
  inhibitorConcI: number // Inhibitor concentration (uM)
  kI: number // Inhibition constant (uM)
}

export interface KineticsState {
  activeReactionId: string
  temperatureK: number
  catalystEnabled: boolean
  catalystEfficiency: number // 0 to 1 scaling Ea reduction
  // Rate law simulator parameters
  order: RateOrder
  initialConcA: number // M
  initialConcB: number // M (for consecutive reactions)
  rateConstantK: number // rate constant at current T
  simTime: number
  simPlaying: boolean
  simSpeed: number
  activeTab: 'energy-profile' | 'maxwell-boltzmann' | 'rate-curves' | 'enzyme-lab'
  // Enzyme parameters
  enzymeParams: MichaelisMentenParams
}
