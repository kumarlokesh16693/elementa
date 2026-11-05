/**
 * Nuclear Fission Reactor Core & Criticality Simulator Types
 */

export interface DelayedGroup {
  group: number
  fractionBeta_i: number // Effective delayed neutron fraction
  decayConstantLambda_i: number // Decay constant (1/s)
  halfLifeSeconds: number
}

export interface ReactorPreset {
  id: string
  name: string
  type: 'PWR' | 'BWR' | 'CANDU' | 'SMR' | 'HTGR'
  thermalPowerMWth: number
  electricPowerMWe: number
  fuelType: string
  enrichmentPct: number // % U-235
  moderator: string
  coolant: string
  operatingPressureMPa: number
  inletTempC: number
  outletTempC: number
  fuelAssemblies: number
  rodsPerAssembly: number
  promptNeutronLifetimeUs: number // microseconds
  totalBeta: number // Total delayed neutron fraction (e.g., 0.0065 for U-235)
  dopplerCoeffPcmPerC: number // pcm / °C (negative)
  moderatorTempCoeffPcmPerC: number // pcm / °C (negative for stable)
  description: string
  safetyFeatures: string[]
}

export interface ReactorState {
  presetId: string
  // Control & Reactivity
  controlRodInsertion: number // 0 (withdrawn) to 100% (fully inserted)
  boronConcentrationPpm: number // Chemical shim soluble boron (ppm)
  manualReactivityPcm: number // External reactivity perturbation
  scramActive: boolean
  // Core Kinetics
  neutronFluxNormalized: number // 1.0 = 100% rated power
  thermalPowerMWth: number
  electricPowerMWe: number
  kEff: number
  reactivityPcm: number
  reactivityDollars: number // $ = rho / beta
  reactorPeriodSeconds: number // e-folding time T
  // Delayed neutron precursor concentrations (6 groups)
  precursors: number[]
  // Xenon & Iodine Poisoning (atoms / cm3 or relative)
  iodine135Rel: number
  xenon135Rel: number
  xenonReactivityPcm: number
  // Thermal-Hydraulics
  fuelTempAvgC: number
  coolantInletTempC: number
  coolantOutletTempC: number
  coolantFlowRatePct: number // % of nominal pump flow
  steamPressureMPa: number
  turbineRpm: number
  cherenkovIntensity: number // 0 to 1
  // Simulation loop
  simTimeSeconds: number
  simSpeed: number
  simPaused: boolean
  activeTab: 'core-3d' | 'kinetics-telemetry' | 'xenon-transient' | 'thermal-loop'
}
