/**
 * Physics Test Suite: Radiation Shielding, Particle Stopping Power & Dosimetry
 *
 * Verifies:
 * 1. Beer-Lambert law exponential attenuation: I(x) = I0 * exp(-mu * x)
 * 2. Exact HVL & TVL relationship: TVL = HVL * (ln 10 / ln 2) ≈ 3.322 * HVL
 * 3. Photoelectric absorption dominance at low energies (E < 100 keV)
 * 4. Compton scattering dominance at intermediate energies (0.5 - 2 MeV)
 * 5. Pair production emergence only above threshold 2 * m_e * c^2 = 1.022 MeV
 * 6. Alpha Bragg peak: stopping power (dE/dx) peaks sharply at terminal range
 * 7. Beta Bremsstrahlung yield scaling with material atomic number Z
 * 8. Inverse-square law distance dose reduction
 */

import {
  SHIELDING_MATERIALS,
  RADIATION_PRESETS,
  calculateGammaAttenuation,
  calculateAlphaRangeCm,
  calculateBetaRangeCm,
  calculateBremsstrahlungYield,
  evaluateShielding,
  generateBraggPeak,
  calculateDose,
} from '../src/lib/periodic/shielding'

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${msg}`)
    failed++
  }
}

console.log('=== TEST SUITE: Radiation Shielding & Particle Attenuation ===\n')

// 1. Exponential Attenuation & Beer-Lambert Law
console.log('--- 1. Beer-Lambert Exponential Attenuation Law ---')
const lead = SHIELDING_MATERIALS.lead
const cs137 = RADIATION_PRESETS.find((r) => r.id === 'cs137')!
const res0 = evaluateShielding(cs137, lead, 0)
const res1Hvl = evaluateShielding(cs137, lead, res0.hvlCm)
const res2Hvl = evaluateShielding(cs137, lead, 2 * res0.hvlCm)
const res1Tvl = evaluateShielding(cs137, lead, res0.tvlCm)

assert(Math.abs(res0.attenuationFraction - 1.0) < 1e-6, 'Thickness 0 cm: transmission is 100%')
assert(Math.abs(res1Hvl.attenuationFraction - 0.5) < 0.01, `At 1 HVL (${res0.hvlCm.toFixed(2)} cm): transmission is 50% (actual: ${(res1Hvl.attenuationFraction * 100).toFixed(1)}%)`)
assert(Math.abs(res2Hvl.attenuationFraction - 0.25) < 0.01, `At 2 HVL: transmission is 25% (actual: ${(res2Hvl.attenuationFraction * 100).toFixed(1)}%)`)
assert(Math.abs(res1Tvl.attenuationFraction - 0.1) < 0.01, `At 1 TVL (${res0.tvlCm.toFixed(2)} cm): transmission is 10% (actual: ${(res1Tvl.attenuationFraction * 100).toFixed(1)}%)`)

// 2. HVL vs TVL Consistency
console.log('\n--- 2. HVL and TVL Theoretical Ratio ---')
for (const [id, mat] of Object.entries(SHIELDING_MATERIALS)) {
  const gammaRes = evaluateShielding(cs137, mat, 1.0)
  const ratio = gammaRes.tvlCm / gammaRes.hvlCm
  const expectedRatio = Math.LN10 / Math.LN2 // 3.321928...
  assert(Math.abs(ratio - expectedRatio) < 1e-4, `${mat.name}: TVL/HVL = ${ratio.toFixed(3)} (matches ln(10)/ln(2) = 3.322)`)
}

// 3. Three Photon Interaction Regimes (Photoelectric, Compton, Pair Production)
console.log('\n--- 3. Gamma Interaction Regimes & Energy Thresholds ---')
const lowE = calculateGammaAttenuation(0.04, lead) // 40 keV
assert(lowE.dominant === 'Photoelectric', `40 keV in Lead: Dominant interaction is Photoelectric absorption (tau = ${lowE.muPhotoelectric.toFixed(1)} cm⁻¹)`)

const midE = calculateGammaAttenuation(1.0, lead) // 1.0 MeV
assert(midE.dominant === 'Compton Scattering', `1.0 MeV in Lead: Dominant interaction is Compton scattering (sigma = ${midE.muCompton.toFixed(2)} cm⁻¹)`)

const highE = calculateGammaAttenuation(8.0, lead) // 8.0 MeV
assert(highE.dominant === 'Pair Production', `8.0 MeV in Lead: Dominant interaction is Pair Production (kappa = ${highE.muPair.toFixed(2)} cm⁻¹)`)

const subThreshold = calculateGammaAttenuation(0.8, lead) // Below 1.022 MeV
assert(subThreshold.muPair === 0, '0.8 MeV in Lead: Pair production is strictly 0 below 1.022 MeV threshold')

// 4. Alpha Particle Stopping Range & Bragg Peak
console.log('\n--- 4. Alpha Particle Stopping Range & Bragg Peak ---')
const am241 = RADIATION_PRESETS.find((r) => r.id === 'am241')!
const water = SHIELDING_MATERIALS.water
const alphaRangeWaterCm = calculateAlphaRangeCm(am241.primaryEnergyMev, water)
const alphaRangeWaterMicrons = alphaRangeWaterCm * 10000

assert(alphaRangeWaterMicrons > 25 && alphaRangeWaterMicrons < 65, `5.5 MeV Alpha range in water/tissue is ${alphaRangeWaterMicrons.toFixed(1)} µm (expected ~40 µm)`)

const braggCurve = generateBraggPeak(am241.primaryEnergyMev, water, 100)
let maxDedx = 0
let maxDedxDepth = 0
const entranceDedx = braggCurve[0].stoppingPowerMevPerMm

for (const pt of braggCurve) {
  if (pt.stoppingPowerMevPerMm > maxDedx) {
    maxDedx = pt.stoppingPowerMevPerMm
    maxDedxDepth = pt.depthMm
  }
}

assert(maxDedx > entranceDedx * 2.5, `Bragg Peak: Terminal stopping power (${maxDedx.toFixed(1)} MeV/mm) is >2.5× higher than entrance (${entranceDedx.toFixed(1)} MeV/mm)`)
assert(maxDedxDepth > (alphaRangeWaterCm * 10) * 0.75, `Bragg Peak occurs near terminal range (${maxDedxDepth.toFixed(2)} mm vs range ${(alphaRangeWaterCm * 10).toFixed(2)} mm)`)

// 5. Beta Particle Range & Bremsstrahlung Yield
console.log('\n--- 5. Beta Range & Bremsstrahlung Yield vs Atomic Number Z ---')
const sr90 = RADIATION_PRESETS.find((r) => r.id === 'sr90')!
const al = SHIELDING_MATERIALS.aluminum
const betaRangeAlCm = calculateBetaRangeCm(sr90.primaryEnergyMev, al)
const bremYieldPb = calculateBremsstrahlungYield(sr90.primaryEnergyMev, lead)
const bremYieldAl = calculateBremsstrahlungYield(sr90.primaryEnergyMev, al)

assert(betaRangeAlCm > 0.3 && betaRangeAlCm < 0.6, `2.28 MeV Y-90 Beta range in Aluminum is ${betaRangeAlCm.toFixed(2)} cm (expected ~0.4 cm)`)
assert(bremYieldPb > bremYieldAl * 5, `Lead Bremsstrahlung yield (${(bremYieldPb * 100).toFixed(1)}%) is >5× higher than Aluminum (${(bremYieldAl * 100).toFixed(1)}%) — explains why Al/acrylic is used first`)

// 6. Dosimetry & Inverse-Square Law
console.log('\n--- 6. Dosimetry & Inverse-Square Law Scaling ---')
const co60 = RADIATION_PRESETS.find((r) => r.id === 'co60')!
const dose1m = calculateDose(co60, 1.0, 1.0, 1.0)
const dose2m = calculateDose(co60, 1.0, 2.0, 1.0)
const ratioDose = dose1m.actualDoseRateMicroSvH / dose2m.actualDoseRateMicroSvH

assert(Math.abs(ratioDose - 4.0) < 0.05, `Inverse-Square Law: Doubling distance reduces dose rate by 4.0× (actual ratio: ${ratioDose.toFixed(2)})`)

console.log(`\n========================================`)
console.log(`Test Results: ${passed} passed, ${failed} failed`)
console.log(`========================================`)

if (failed > 0) {
  process.exit(1)
}
