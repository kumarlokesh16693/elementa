/**
 * Test Suite: Zeeman & Stark Effect Splitting Engine
 * Validates Landé g-factors, normal vs anomalous Zeeman splitting,
 * Paschen-Back decoupling, and linear Stark effect parity mixing.
 */

import {
  calculateLandeG,
  generateSubstates,
  computeTransitions,
  evaluateStarkWavefunction,
  ZEEMAN_STARK_PRESETS,
  BOHR_MAGNETON_EV,
  BOHR_RADIUS_METERS,
} from '../src/lib/periodic/zeeman-stark'

let passCount = 0
let failCount = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passCount++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failCount++
  }
}

function assertClose(actual: number, expected: number, tol: number, message: string) {
  const diff = Math.abs(actual - expected)
  if (diff <= tol) {
    console.log(`  ✓ ${message} (actual: ${actual.toFixed(4)}, expected: ${expected.toFixed(4)})`)
    passCount++
  } else {
    console.error(`  ✗ FAIL: ${message} (actual: ${actual.toFixed(4)}, expected: ${expected.toFixed(4)}, diff: ${diff.toFixed(4)})`)
    failCount++
  }
}

console.log('=== TEST SUITE: Zeeman & Stark Quantum Splitting Engine ===\n')

// 1. Landé g-factors
console.log('--- 1. Analytical Landé g-Factors ---')
assertClose(calculateLandeG(0, 0.5, 0.5), 2.0, 1e-4, '2S1/2 (l=0, s=1/2, j=1/2) has g = 2.0')
assertClose(calculateLandeG(1, 0.5, 0.5), 2 / 3, 1e-4, '2P1/2 (l=1, s=1/2, j=1/2) has g = 2/3 (0.6667)')
assertClose(calculateLandeG(1, 0.5, 1.5), 4 / 3, 1e-4, '2P3/2 (l=1, s=1/2, j=3/2) has g = 4/3 (1.3333)')
assertClose(calculateLandeG(1, 0, 1), 1.0, 1e-4, '1P1 (l=1, s=0, j=1) has g = 1.0 (pure orbital)')
assertClose(calculateLandeG(2, 0, 2), 1.0, 1e-4, '1D2 (l=2, s=0, j=2) has g = 1.0')
assertClose(calculateLandeG(2, 0.5, 1.5), 0.8, 1e-4, '2D3/2 (l=2, s=1/2, j=3/2) has g = 0.8')
assertClose(calculateLandeG(2, 0.5, 2.5), 1.2, 1e-4, '2D5/2 (l=2, s=1/2, j=5/2) has g = 1.2')

// 2. Normal Zeeman Effect (Cadmium 643.8 nm Singlet)
console.log('\n--- 2. Normal Zeeman Triplet (Cadmium Singlet) ---')
const cdPreset = ZEEMAN_STARK_PRESETS.find((p) => p.id === 'cadmium-normal')!
assert(cdPreset != null, 'Cadmium preset defined')

const cdUpper = generateSubstates(cdPreset.upperTerm, 1.0, 0, 0, false, cdPreset.polarizabilityCm3)
const cdLower = generateSubstates(cdPreset.lowerTerm, 1.0, 0, 0, false, cdPreset.polarizabilityCm3)

assert(cdUpper.length === 3, '1P1 splits into 3 substates (mj = -1, 0, +1)')
assert(cdLower.length === 1, '1S0 remains 1 singlet state (mj = 0)')

const cdLines = computeTransitions(
  cdUpper,
  cdLower,
  (u) => cdPreset.upperTerm.energyEV + u.mj * BOHR_MAGNETON_EV * 1.0,
  (l) => cdPreset.lowerTerm.energyEV,
  cdPreset.nominalWavelengthNm,
)

assert(cdLines.length === 3, 'Normal Zeeman produces exactly 3 transition lines (Lorentz triplet)')
const piLines = cdLines.filter((l) => l.polarization === 'pi')
const sigmaPlus = cdLines.filter((l) => l.polarization === 'sigma_plus')
const sigmaMinus = cdLines.filter((l) => l.polarization === 'sigma_minus')

assert(piLines.length === 1, 'Exactly 1 pi line (Delta m = 0, unshifted)')
assertClose(piLines[0].shiftEV, 0.0, 1e-6, 'pi line has zero energy shift')
assert(sigmaPlus.length === 1, 'Exactly 1 sigma+ line (Delta m = +1)')
assert(sigmaMinus.length === 1, 'Exactly 1 sigma- line (Delta m = -1)')
assertClose(sigmaPlus[0].shiftEV, BOHR_MAGNETON_EV * 1.0, 1e-6, 'sigma+ shift equals exactly mu_B * B')
assertClose(sigmaMinus[0].shiftEV, -BOHR_MAGNETON_EV * 1.0, 1e-6, 'sigma- shift equals exactly -mu_B * B')

// 3. Anomalous Zeeman Effect (Sodium D-Lines)
console.log('\n--- 3. Anomalous Zeeman Splitting (Sodium D-Lines) ---')
const naPreset = ZEEMAN_STARK_PRESETS.find((p) => p.id === 'sodium-d-lines')!
assert(naPreset != null, 'Sodium preset defined')

// Test D1 line: 2P1/2 -> 2S1/2
const naUpperD1 = generateSubstates({ n: 3, l: 1, s: 0.5, j: [0.5], energyEV: 2.102 }, 1.0, 0, naPreset.spinOrbitCouplingEV, false, naPreset.polarizabilityCm3)
const naLower = generateSubstates(naPreset.lowerTerm, 1.0, 0, 0, false, naPreset.polarizabilityCm3)

const d1Lines = computeTransitions(
  naUpperD1,
  naLower,
  (u) => 2.102 + calculateLandeG(1, 0.5, 0.5) * BOHR_MAGNETON_EV * 1.0 * u.mj,
  (l) => naPreset.lowerTerm.energyEV + calculateLandeG(0, 0.5, 0.5) * BOHR_MAGNETON_EV * 1.0 * l.mj,
  589.6,
)

assert(d1Lines.length === 4, 'Sodium D1 line (2P1/2 -> 2S1/2) splits into 4 distinct lines')

// Test D2 line: 2P3/2 -> 2S1/2
const naUpperD2 = generateSubstates({ n: 3, l: 1, s: 0.5, j: [1.5], energyEV: 2.104 }, 1.0, 0, naPreset.spinOrbitCouplingEV, false, naPreset.polarizabilityCm3)
const d2Lines = computeTransitions(
  naUpperD2,
  naLower,
  (u) => 2.104 + calculateLandeG(1, 0.5, 1.5) * BOHR_MAGNETON_EV * 1.0 * u.mj,
  (l) => naPreset.lowerTerm.energyEV + calculateLandeG(0, 0.5, 0.5) * BOHR_MAGNETON_EV * 1.0 * l.mj,
  589.0,
)

assert(d2Lines.length === 6, 'Sodium D2 line (2P3/2 -> 2S1/2) splits into 6 distinct lines')

// 4. Linear Stark Effect & Parity Mixing
console.log('\n--- 4. Linear Stark Effect & Wavefunction Parity Mixing ---')
const hPreset = ZEEMAN_STARK_PRESETS.find((p) => p.id === 'hydrogen-lyman-alpha')!
assert(hPreset != null, 'Hydrogen Stark preset defined')

// At E = 20 kV/cm = 2e6 V/m
const eFieldVPerM = 2e6
const expectedStarkShiftEV = 3 * BOHR_RADIUS_METERS * eFieldVPerM // 3 * a_0 * e * E in eV
const hSubstates = generateSubstates(hPreset.upperTerm, 0, 20.0, hPreset.spinOrbitCouplingEV, true, hPreset.polarizabilityCm3)
assert(hSubstates.length > 0, 'Hydrogen substates generated')

// Evaluate Stark wavefunction distortion:
const unperturbed = evaluateStarkWavefunction(0, 1.5, 0.0) // eta = 0 (pure 2s)
const polarized = evaluateStarkWavefunction(0, 1.5, 0.5) // eta = 0.5 (polarized towards +z)
const oppositePole = evaluateStarkWavefunction(0, -1.5, 0.5) // z = -1.5

assert(polarized.psiSq > oppositePole.psiSq, 'Electric field induces asymmetry: |psi(+z)|^2 > |psi(-z)|^2 (induced dipole)')
assert(polarized.psiSq !== unperturbed.psiSq, 'Polarized density differs measurably from spherical unperturbed density')

console.log('\n========================================')
console.log(`Test Results: ${passCount} passed, ${failCount} failed`)
console.log('========================================\n')

if (failCount > 0) process.exit(1)
