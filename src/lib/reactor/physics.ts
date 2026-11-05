/**
 * Nuclear Reactor Physics, Kinetics & Thermal-Hydraulics Solvers
 */

import type { DelayedGroup, ReactorPreset, ReactorState } from './types'

// Keepin 6-group delayed neutron constants for U-235 thermal fission
export const DELAYED_GROUPS_U235: DelayedGroup[] = [
  { group: 1, fractionBeta_i: 0.000215, decayConstantLambda_i: 0.0124, halfLifeSeconds: 55.72 },
  { group: 2, fractionBeta_i: 0.001424, decayConstantLambda_i: 0.0305, halfLifeSeconds: 22.72 },
  { group: 3, fractionBeta_i: 0.001274, decayConstantLambda_i: 0.111, halfLifeSeconds: 6.22 },
  { group: 4, fractionBeta_i: 0.002568, decayConstantLambda_i: 0.301, halfLifeSeconds: 2.30 },
  { group: 5, fractionBeta_i: 0.000748, decayConstantLambda_i: 1.14, halfLifeSeconds: 0.61 },
  { group: 6, fractionBeta_i: 0.000273, decayConstantLambda_i: 3.01, halfLifeSeconds: 0.23 },
]

export const TOTAL_BETA_U235 = DELAYED_GROUPS_U235.reduce((sum, g) => sum + g.fractionBeta_i, 0) // ~0.00650 (650 pcm)

// Nuclear cross-sections & decay constants for Xenon-135 transient
export const LAMBDA_I135 = 2.87e-5 // 1/s (T1/2 = 6.57 h)
export const LAMBDA_XE135 = 2.09e-5 // 1/s (T1/2 = 9.17 h)
export const YIELD_I135 = 0.0639 // 6.39% fission yield
export const YIELD_XE135 = 0.00228 // 0.228% direct yield
export const SIGMA_A_XE135 = 2.6e6 * 1e-24 // cm^2 (2.6 million barns!)
export const NOMINAL_THERMAL_FLUX = 3.0e13 // neutrons / (cm^2 * s)

/**
 * Integral control rod worth curve:
 * S-shaped cosine profile representing rod insertion depth (0 to 100%)
 */
export function computeRodReactivityWorth(insertionPct: number, totalRodWorthPcm = 4500): number {
  // insertionPct: 0% = fully withdrawn (max reactivity), 100% = fully inserted (min reactivity)
  const z = Math.max(0, Math.min(100, insertionPct)) / 100
  // Standard integral worth shape: z - (1/(2pi)) * sin(2pi * z)
  const fractionInserted = z - Math.sin(2 * Math.PI * z) / (2 * Math.PI)
  return -fractionInserted * totalRodWorthPcm
}

/**
 * Solves single time-step of 6-group point kinetics equations
 */
export function stepPointKinetics(
  n: number,
  precursors: number[],
  rho: number, // Reactivity (dimensionless, not pcm)
  beta: number,
  lambdaPromptUs: number,
  dt: number,
): { nNext: number; precursorsNext: number[]; period: number } {
  const Lambda = lambdaPromptUs * 1e-6 // Convert microseconds to seconds
  const promptTerm = ((rho - beta) / Lambda) * n
  let delayedSource = 0

  for (let i = 0; i < 6; i++) {
    delayedSource += DELAYED_GROUPS_U235[i].decayConstantLambda_i * precursors[i]
  }

  const dn = (promptTerm + delayedSource) * dt
  const nNext = Math.max(1e-7, n + dn)

  const precursorsNext: number[] = []
  for (let i = 0; i < 6; i++) {
    const beta_i = DELAYED_GROUPS_U235[i].fractionBeta_i
    const lambda_i = DELAYED_GROUPS_U235[i].decayConstantLambda_i
    const dCi = ((beta_i / Lambda) * n - lambda_i * precursors[i]) * dt
    precursorsNext.push(Math.max(1e-7, precursors[i] + dCi))
  }

  // Reactor period T (e-folding time): T = n / (dn/dt)
  const rateOfChange = dn / Math.max(dt, 1e-4)
  const period = Math.abs(rateOfChange) > 1e-6 ? n / rateOfChange : 9999.0

  return { nNext, precursorsNext, period }
}

/**
 * Solves single step of Iodine-135 and Xenon-135 transient
 */
export function stepXenonTransient(
  fluxNormalized: number,
  I_rel: number,
  Xe_rel: number,
  dt: number,
): { I_next: number; Xe_next: number; rhoXePcm: number } {
  const flux = Math.max(0, fluxNormalized) * NOMINAL_THERMAL_FLUX

  // Relative to equilibrium at 100% steady state:
  // dI/dt = lambda_I * (fluxNorm - I_rel)
  const dI = (LAMBDA_I135 * fluxNormalized - LAMBDA_I135 * I_rel) * dt
  const I_next = Math.max(0, I_rel + dI)

  // dXe/dt = yield_factor * fluxNorm + lambda_I * I_rel - (lambda_Xe + sigma_Xe * flux) * Xe_rel
  // Scaled normalized equilibrium values:
  const production = 0.05 * fluxNormalized + 0.95 * I_rel
  const destruction = (LAMBDA_XE135 + SIGMA_A_XE135 * flux) / (LAMBDA_XE135 + SIGMA_A_XE135 * NOMINAL_THERMAL_FLUX)
  const dXe = 2.0e-5 * (production - destruction * Xe_rel) * dt
  const Xe_next = Math.max(0, Xe_rel + dXe)

  // Nominal equilibrium Xenon worth at 100% power is roughly -2800 pcm
  const rhoXePcm = -Xe_next * 2800

  return { I_next, Xe_next, rhoXePcm }
}

/**
 * Solves core thermal-hydraulics: fuel temperature, coolant temperature, steam pressure, turbine MWe
 */
export function stepThermalHydraulics(
  preset: ReactorPreset,
  fluxNormalized: number,
  flowRatePct: number,
  prevFuelTempC: number,
  prevCoolantOutC: number,
  dt: number,
): {
  fuelTempC: number
  coolantInC: number
  coolantOutC: number
  steamPressMPa: number
  electricMWe: number
  turbineRpm: number
} {
  const flowFraction = Math.max(0.1, flowRatePct / 100)
  const heatGen = preset.thermalPowerMWth * fluxNormalized

  // Target equilibrium temperatures
  const nominalDT = preset.outletTempC - preset.inletTempC
  const actualDT = (nominalDT * fluxNormalized) / flowFraction
  const targetCoolantOut = preset.inletTempC + actualDT
  const targetFuelTemp = targetCoolantOut + 350 * fluxNormalized

  // Thermal lag (thermal inertia of massive UO2 pellets & water inventory)
  const fuelTau = 5.0 // 5 seconds fuel thermal time constant
  const coolantTau = 8.0 // 8 seconds coolant loop time constant

  const fuelTempC = prevFuelTempC + ((targetFuelTemp - prevFuelTempC) / fuelTau) * dt
  const coolantOutC = prevCoolantOutC + ((targetCoolantOut - prevCoolantOutC) / coolantTau) * dt
  const coolantInC = preset.inletTempC

  // Secondary Steam Cycle & Turbine
  const thermalEfficiency = preset.electricPowerMWe / preset.thermalPowerMWth
  const electricMWe = Math.max(0, heatGen * thermalEfficiency)
  const steamPressMPa = Math.max(0.1, (preset.operatingPressureMPa * 0.45) * Math.min(1.0, coolantOutC / preset.outletTempC))
  const turbineRpm = Math.min(1800, Math.max(0, 1800 * (electricMWe / preset.electricPowerMWe)))

  return {
    fuelTempC,
    coolantInC,
    coolantOutC,
    steamPressMPa,
    electricMWe,
    turbineRpm,
  }
}

/**
 * Computes Cherenkov radiation intensity and RGB emission color
 */
export function computeCherenkovGlow(fluxNormalized: number): { intensity: number; cssRgba: string } {
  // Cherenkov radiation is blue/violet visible light emitted when charged fission beta particles
  // exceed the speed of light in water (v > c / n_water = c / 1.33).
  // Intensity scales with instantaneous fission rate (flux^1.2).
  const intensity = Math.min(1.0, Math.pow(Math.max(0, fluxNormalized), 1.25))
  // Intense electric cyan: rgb(0, 210, 255)
  const alpha = Math.min(0.95, intensity * 0.85 + (fluxNormalized > 0.05 ? 0.1 : 0))
  return {
    intensity,
    cssRgba: `rgba(0, 215, 255, ${alpha.toFixed(3)})`,
  }
}
