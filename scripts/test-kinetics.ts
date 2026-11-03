/**
 * Test Suite: Chemical Kinetics & Transition State Engine
 * Validates Arrhenius law, Eyring TST parameters, Maxwell-Boltzmann distributions,
 * Eckart reaction coordinate barriers, and Walden inversion geometries.
 */

import {
  calculateArrheniusRate,
  calculateEyringParameters,
  maxwellBoltzmannEnergyDensity,
  fractionExceedingActivation,
  evaluateReactionProfile,
  solveConcentrationDynamics,
  KINETICS_PRESETS,
  GAS_CONSTANT_R,
} from '../src/lib/periodic/kinetics'

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

console.log('=== TEST SUITE: Chemical Kinetics & Transition State Engine ===\n')

// 1. Arrhenius Rate Law & Temperature Dependence
console.log('--- 1. Arrhenius Rate Law & Temperature Dependence ---')
const A = 1e11
const Ea = 50.0 // 50 kJ/mol
const k300 = calculateArrheniusRate(A, Ea, 300.0)
const k310 = calculateArrheniusRate(A, Ea, 310.0)

assert(k300 > 0, 'Arrhenius rate k(300 K) is strictly positive')
assert(k310 > k300, 'Reaction rate increases with temperature (k(310 K) > k(300 K))')

// Approximate rule of thumb: rate approximately doubles for 10 K rise around ~50 kJ/mol
const ratio10K = k310 / k300
assert(ratio10K >= 1.8 && ratio10K <= 2.2, `10 K rise approximately doubles rate (actual ratio: ${ratio10K.toFixed(2)}x)`)

// Zero temperature limit
assert(calculateArrheniusRate(A, Ea, 0) === 0, 'At T = 0 K, reaction rate is 0')

// 2. Catalysis & Activation Barrier Reduction
console.log('\n--- 2. Catalysis & Barrier Lowering ---')
const sn2Preset = KINETICS_PRESETS.find((p) => p.id === 'sn2-walden')!
assert(sn2Preset != null, 'SN2 preset defined')

const kUncatalyzed = calculateArrheniusRate(sn2Preset.frequencyFactorA, sn2Preset.eaKjMol, 298.15)
const kCatalyzed = calculateArrheniusRate(sn2Preset.frequencyFactorA, sn2Preset.eaCatalyzedKjMol!, 298.15)

const catalyticAcceleration = kCatalyzed / kUncatalyzed
assert(catalyticAcceleration > 1e5, `Catalyst lowering Ea by 33.5 kJ/mol accelerates rate by > 100,000x (actual: ${catalyticAcceleration.toExponential(2)}x)`)

// 3. Eyring-Polanyi Transition State Theory
console.log('\n--- 3. Eyring-Polanyi Transition State Theory ---')
const eyring = calculateEyringParameters(75.0, -40.0, 300.0) // dH = 75 kJ/mol, dS = -40 J/mol.K
const expectedDeltaG = 75.0 - 300.0 * (-40.0 / 1000.0) // 75 - (-12) = 87.0 kJ/mol

assertClose(eyring.deltaGActivationKjMol, expectedDeltaG, 1e-4, 'Eyring Delta G_ddagger = Delta H_ddagger - T * Delta S_ddagger')
assert(eyring.rateConstantK > 0, 'Eyring rate constant is positive')

// 4. Maxwell-Boltzmann Molecular Collision Energy Distribution
console.log('\n--- 4. Maxwell-Boltzmann Energy Distribution ---')
const mbLow = maxwellBoltzmannEnergyDensity(2.0, 300.0)
const mbPeak = maxwellBoltzmannEnergyDensity(1.2, 300.0) // RT/2 ~ 1.25 kJ/mol
const mbHigh = maxwellBoltzmannEnergyDensity(80.0, 300.0) // High energy tail

assert(mbPeak > 0, 'Maxwell-Boltzmann density at peak is positive')
assert(mbPeak > mbHigh, 'Peak probability is higher than high-energy tail')
assert(mbHigh > 0, 'High energy tail has non-zero probability for collisions')

const frac300 = fractionExceedingActivation(50.0, 300.0)
const frac600 = fractionExceedingActivation(50.0, 600.0)
assert(frac600 > frac300 * 100, `High temperature (600 K) dramatically increases fraction exceeding Ea vs 300 K (${(frac600 / frac300).toFixed(0)}x increase)`)

// 5. Reaction Potential Energy Coordinate Profile V(s)
console.log('\n--- 5. Reaction Coordinate Profile V(s) & Eckart Barrier ---')
const vReactants = evaluateReactionProfile(-1.0, 60.0, -25.0)
const vTS = evaluateReactionProfile(0.0, 60.0, -25.0)
const vProducts = evaluateReactionProfile(1.0, 60.0, -25.0)

assertClose(vReactants.potentialEnergyKjMol, 0.0, 1.0, 'Reactants at s = -1 have reference energy ~0 kJ/mol')
assertClose(vTS.potentialEnergyKjMol, 60.0, 1.0, 'Transition state at s = 0 peaks at activation barrier Ea = 60 kJ/mol')
assert(vTS.isTransitionState, 'Profile correctly identifies transition state near s = 0')
assertClose(vProducts.potentialEnergyKjMol, -25.0, 1.0, 'Products at s = +1 have enthalpy of reaction Delta H = -25 kJ/mol')

// 6. SN2 Walden Umbrella Inversion Geometry
console.log('\n--- 6. SN2 Walden Inversion 3D Coordinates ---')
const coordsReactants = sn2Preset.getCoordinatesAt(-1.0)
const coordsTS = sn2Preset.getCoordinatesAt(0.0)
const coordsProducts = sn2Preset.getCoordinatesAt(1.0)

const hReactantsX = coordsReactants.find((a) => a.symbol === 'H')!.x
const hTSX = coordsTS.find((a) => a.symbol === 'H')!.x
const hProductsX = coordsProducts.find((a) => a.symbol === 'H')!.x

assert(hReactantsX < 0, 'Reactant hydrogens angled towards -x (umbrella pointing left)')
assertClose(hTSX, 0.0, 1e-4, 'Transition state hydrogens are strictly planar at x = 0 (trigonal bipyramidal)')
assert(hProductsX > 0, 'Product hydrogens inverted towards +x (Walden umbrella inverted)')

// 7. Integrated Rate Laws
console.log('\n--- 7. Integrated Rate Laws ---')
const kTest = 0.05 // s^-1
const tHalfExpected = Math.log(2) / kTest // ~13.86 s
const dyn = solveConcentrationDynamics(1, kTest, 1.0, 60, 60)

const halfPt = dyn.find((p) => Math.abs(p.timeSec - tHalfExpected) < 1.0)!
assertClose(halfPt.concA, 0.5, 0.05, `At t_1/2 (${tHalfExpected.toFixed(1)} s), [A] reaches 50% initial concentration`)
assertClose(halfPt.concA + halfPt.concP, 1.0, 1e-6, 'Total mass is strictly conserved ([A] + [P] = [A]_0)')

console.log('\n========================================')
console.log(`Test Results: ${passCount} passed, ${failCount} failed`)
console.log('========================================\n')

if (failCount > 0) process.exit(1)
