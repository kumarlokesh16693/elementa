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
  if (!(Lambda > 0) || !(dt > 0)) return { nNext: n, precursorsNext: [...precursors], period: 9999 }

  // Forward Euler is unstable for frame-sized steps because the prompt mode
  // has a characteristic rate of (beta-rho)/Lambda. Substep against the
  // fastest point-kinetics rate so the explicit update remains well behaved.
  const promptRate = Math.abs((rho - beta) / Lambda)
  const fastestDelayedRate = Math.max(...DELAYED_GROUPS_U235.map((group) => group.decayConstantLambda_i))
  const maxRate = Math.max(promptRate, fastestDelayedRate)
  const substeps = Math.max(1, Math.ceil((dt * maxRate) / 0.25))
  const h = dt / substeps
  let nCurrent = Math.max(1e-7, n)
  let precursorCurrent = precursors.slice(0, DELAYED_GROUPS_U235.length)
  while (precursorCurrent.length < DELAYED_GROUPS_U235.length) precursorCurrent.push(1e-7)
  let initialRate = 0

  for (let step = 0; step < substeps; step++) {
    const nAtStepStart = nCurrent
    let delayedSource = 0
    for (let i = 0; i < DELAYED_GROUPS_U235.length; i++) {
      delayedSource += DELAYED_GROUPS_U235[i].decayConstantLambda_i * precursorCurrent[i]
    }
    const dnPerSecond = ((rho - beta) / Lambda) * nAtStepStart + delayedSource
    if (step === 0) initialRate = dnPerSecond
    nCurrent = Math.max(1e-7, nAtStepStart + dnPerSecond * h)

    for (let i = 0; i < DELAYED_GROUPS_U235.length; i++) {
      const group = DELAYED_GROUPS_U235[i]
      const betaI = group.fractionBeta_i * (beta / TOTAL_BETA_U235)
      const dCiPerSecond = (betaI / Lambda) * nAtStepStart - group.decayConstantLambda_i * precursorCurrent[i]
      precursorCurrent[i] = Math.max(1e-7, precursorCurrent[i] + dCiPerSecond * h)
    }
  }

  // Reactor period T (e-folding time): T = n / (dn/dt)
  const period = Math.abs(initialRate) > 1e-6 ? n / initialRate : 9999.0

  return { nNext: nCurrent, precursorsNext: precursorCurrent, period }
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

  // Normalize the physical production terms by the nominal Xe-135 inventory.
  // Direct Xe and I-135 decay contributions use the tabulated fission yields.
  const totalXeYield = YIELD_I135 + YIELD_XE135
  const directFraction = YIELD_XE135 / totalXeYield
  const iodineFraction = YIELD_I135 / totalXeYield
  const destruction = (LAMBDA_XE135 + SIGMA_A_XE135 * flux) / (LAMBDA_XE135 + SIGMA_A_XE135 * NOMINAL_THERMAL_FLUX)
  const nominalXeRemovalRate = LAMBDA_XE135 + SIGMA_A_XE135 * NOMINAL_THERMAL_FLUX
  const production = directFraction * fluxNormalized + iodineFraction * I_rel
  const dXe = nominalXeRemovalRate * (production - destruction * Xe_rel) * dt
  const Xe_next = Math.max(0, Xe_rel + dXe)

  // Nominal equilibrium Xenon worth at 100% power is roughly -2800 pcm
  const rhoXePcm = -Xe_next * 2800

  return { I_next, Xe_next, rhoXePcm }
}

/**
 * Produces an illustrative lumped thermal response and power conversion estimate.
 * This is not a plant-specific thermal-hydraulics or steam-cycle solver.
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
  // Pressure is held at a nominal display value: computing it credibly requires
  // a phase-specific coolant/steam-cycle model that this lumped demo lacks.
  const steamPressMPa = preset.type === 'BWR' ? preset.operatingPressureMPa : preset.operatingPressureMPa * 0.44
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
