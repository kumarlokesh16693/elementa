/**
 * ELEMENTA — Statistical Mechanics Rigorous Verification Suite
 * Tests Onsager exact 1944 solutions, Metropolis detailed balance, periodic boundary wrapping,
 * ferromagnetic/antiferromagnetic ground state energies, and Mean-Field theory.
 */

import {
  L,
  N_SPINS,
  UP_TABLE,
  DOWN_TABLE,
  LEFT_TABLE,
  RIGHT_TABLE,
  getExactTc,
  getOnsagerExactMagnetization,
  getOnsagerExactEnergy,
  getMeanFieldMagnetization,
  computeTransitionProbability,
  computeTotalEnergy,
  computeMagnetization,
  computeStaggeredMagnetization,
  createStatMechState,
  setLatticeAllUp,
  setLatticeAllDown,
  setLatticeCheckerboard,
  stepMonteCarloSweep,
} from '../src/lib/statmech.ts'

console.log('🧪 Starting Statistical Mechanics & Ising Model Rigorous Verification Suite...\n')

let passed = 0
let failed = 0

function assert(desc, condition, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${desc} ${details}`)
    failed++
  }
}

function assertClose(desc, actual, expected, epsilon = 1e-4) {
  const diff = Math.abs(actual - expected)
  assert(
    desc,
    diff <= epsilon,
    `[Actual: ${actual.toFixed(6)}, Expected: ${expected.toFixed(6)}, Diff: ${diff.toExponential(3)}]`,
  )
}

// ----------------------------------------------------------------------------
// Test 1: Onsager Exact Critical Temperature T_c
// ----------------------------------------------------------------------------
console.log('--- Test 1: Onsager Exact Critical Temperature T_c ---')
const Tc_J1 = getExactTc(1.0)
const expectedTc = 2.0 / Math.log(1 + Math.SQRT2)
assertClose('T_c for J = 1.0 matches 2 / ln(1 + √2)', Tc_J1, expectedTc, 1e-12)
assertClose('T_c numerical constant is ~2.26918531', Tc_J1, 2.269185314213, 1e-8)

const Tc_J05 = getExactTc(0.5)
assertClose('T_c scales linearly with coupling J (J=0.5 -> Tc ≈ 1.13459)', Tc_J05, expectedTc * 0.5, 1e-12)

// ----------------------------------------------------------------------------
// Test 2: Onsager Spontaneous Magnetization M(T) Analytical Benchmark
// ----------------------------------------------------------------------------
console.log('\n--- Test 2: Onsager Spontaneous Magnetization M(T) ---')
// Analytical benchmark points for J = 1.0:
// T = 0.5   -> 1.000000
// T = 1.0   -> 0.999276
// T = 1.5   -> 0.986500
// T = 2.0   -> 0.911319
// T = 2.2   -> 0.784755
// T = 2.269 -> 0.000000 (T >= Tc)
assertClose('M(0.5) ≈ 1.000000', getOnsagerExactMagnetization(0.5, 1.0), 1.000000, 1e-5)
assertClose('M(1.0) ≈ 0.999276', getOnsagerExactMagnetization(1.0, 1.0), 0.999276, 1e-5)
assertClose('M(1.5) ≈ 0.986500', getOnsagerExactMagnetization(1.5, 1.0), 0.986500, 1e-5)
assertClose('M(2.0) ≈ 0.911319', getOnsagerExactMagnetization(2.0, 1.0), 0.911319, 1e-5)
assertClose('M(2.2) ≈ 0.784755', getOnsagerExactMagnetization(2.2, 1.0), 0.784755, 1e-5)
assert('M(T) is exactly 0 for T >= Tc (T = 2.2692)', getOnsagerExactMagnetization(2.2692, 1.0) === 0.0)
assert('M(T) is exactly 0 for T = 3.0', getOnsagerExactMagnetization(3.0, 1.0) === 0.0)

// Mean Field Comparison
assertClose('Mean-Field Tc = 4.0 (M_MF(4.0) = 0)', getMeanFieldMagnetization(4.0, 1.0), 0.0, 1e-6)
assert('Mean-Field M > Onsager M near Tc (e.g. at T=2.2: MF > Onsager)',
  getMeanFieldMagnetization(2.2, 1.0) > getOnsagerExactMagnetization(2.2, 1.0))

// ----------------------------------------------------------------------------
// Test 3: Metropolis Transition Probabilities & Detailed Balance
// ----------------------------------------------------------------------------
console.log('\n--- Test 3: Metropolis Detailed Balance ---')
// Detailed balance requires: P(s -> -s) / P(-s -> s) = exp(-beta * Delta E)
const testTemps = [0.8, 1.5, 2.269, 3.5]
const testNeighborSums = [-4, -2, 0, 2, 4]
const J_val = 1.0
const h_val = 0.2

for (const T of testTemps) {
  const beta = 1.0 / T
  for (const sum of testNeighborSums) {
    // Transition 1: +1 -> -1
    const p_plus_to_minus = computeTransitionProbability(+1, sum, T, J_val, h_val)
    // Reverse Transition: -1 -> +1 with the SAME neighbor environment
    const p_minus_to_plus = computeTransitionProbability(-1, sum, T, J_val, h_val)

    // dE for +1 -> -1 is 2 * (+1) * (J * sum + h)
    const dE = 2 * (+1) * (J_val * sum + h_val)
    const expectedRatio = Math.exp(-beta * dE)
    const actualRatio = p_plus_to_minus / p_minus_to_plus

    assertClose(
      `Detailed balance holds at T=${T.toFixed(2)}, sum=${sum}`,
      actualRatio,
      expectedRatio,
      1e-8,
    )
  }
}

// ----------------------------------------------------------------------------
// Test 4: Torus Periodic Boundary Condition Wrapping on L x L Grid
// ----------------------------------------------------------------------------
console.log('\n--- Test 4: Periodic Boundary Condition Wrapping ---')
assert('Lattice dimensions L = 128, N = 16,384', L === 128 && N_SPINS === 16384)

// Top edge (y = 0) wraps UP to bottom edge (y = L-1)
let topWrapOk = true
for (let x = 0; x < L; x++) {
  const idx = 0 * L + x
  const expectedUp = (L - 1) * L + x
  if (UP_TABLE[idx] !== expectedUp) topWrapOk = false
}
assert('Top boundary (y=0) wraps UP to bottom row (y=L-1)', topWrapOk)

// Bottom edge (y = L-1) wraps DOWN to top edge (y = 0)
let botWrapOk = true
for (let x = 0; x < L; x++) {
  const idx = (L - 1) * L + x
  const expectedDown = 0 * L + x
  if (DOWN_TABLE[idx] !== expectedDown) botWrapOk = false
}
assert('Bottom boundary (y=L-1) wraps DOWN to top row (y=0)', botWrapOk)

// Left edge (x = 0) wraps LEFT to right edge (x = L-1)
let leftWrapOk = true
for (let y = 0; y < L; y++) {
  const idx = y * L + 0
  const expectedLeft = y * L + (L - 1)
  if (LEFT_TABLE[idx] !== expectedLeft) leftWrapOk = false
}
assert('Left boundary (x=0) wraps LEFT to right column (x=L-1)', leftWrapOk)

// Right edge (x = L-1) wraps RIGHT to left edge (x = 0)
let rightWrapOk = true
for (let y = 0; y < L; y++) {
  const idx = y * L + (L - 1)
  const expectedRight = y * L + 0
  if (RIGHT_TABLE[idx] !== expectedRight) rightWrapOk = false
}
assert('Right boundary (x=L-1) wraps RIGHT to left column (x=0)', rightWrapOk)

// ----------------------------------------------------------------------------
// Test 5: Ground State Energies (Ferromagnetic & Antiferromagnetic)
// ----------------------------------------------------------------------------
console.log('\n--- Test 5: Ground State Energies & Magnetization ---')
const testState = createStatMechState()

// 5a. Ferromagnetic Ground State (All +1, J = 1.0, h = 0)
setLatticeAllUp(testState)
const mAllUp = computeMagnetization(testState.spins)
assertClose('All-up magnetization m = +1.0', mAllUp, 1.0, 1e-12)

const totalEFerro = computeTotalEnergy(testState.spins, 1.0, 0.0)
const eFerroPerSpin = totalEFerro / N_SPINS
assertClose('Ferromagnetic ground state energy per spin e = -2J (-2.0)', eFerroPerSpin, -2.0, 1e-12)
assertClose('Ferromagnetic total energy is -2 * N (-32,768)', totalEFerro, -2 * N_SPINS, 1e-12)

// All-down
setLatticeAllDown(testState)
const mAllDown = computeMagnetization(testState.spins)
assertClose('All-down magnetization m = -1.0', mAllDown, -1.0, 1e-12)
const totalEFerroDown = computeTotalEnergy(testState.spins, 1.0, 0.0)
assertClose('All-down ferromagnetic ground energy per spin e = -2.0', totalEFerroDown / N_SPINS, -2.0, 1e-12)

// 5b. Antiferromagnetic Ground State (Checkerboard, J = -1.0, h = 0)
setLatticeCheckerboard(testState)
const mCheckerboard = computeMagnetization(testState.spins)
assertClose('Checkerboard uniform magnetization m = 0.0', mCheckerboard, 0.0, 1e-12)

const stagM = Math.abs(computeStaggeredMagnetization(testState.spins))
assertClose('Checkerboard staggered magnetization |m_stag| = 1.0', stagM, 1.0, 1e-12)

const totalEAntiferro = computeTotalEnergy(testState.spins, -1.0, 0.0)
const eAntiferroPerSpin = totalEAntiferro / N_SPINS
assertClose('Antiferromagnetic ground state energy per spin is -2|J| (-2.0)', eAntiferroPerSpin, -2.0, 1e-12)

// ----------------------------------------------------------------------------
// Test 6: Low-T Ferromagnetic Stability under Metropolis Sweeps
// ----------------------------------------------------------------------------
console.log('\n--- Test 6: Metropolis Dynamics & Thermal Stability ---')
setLatticeAllUp(testState)
// Run 20 sweeps at deep cold T = 0.2 (thermal fluctuations very rare)
stepMonteCarloSweep(testState, {
  temperature: 0.2,
  field: 0.0,
  coupling: 1.0,
  sweepsPerFrame: 1,
}, 20)

const mAfterColdSweeps = computeMagnetization(testState.spins)
assert('Lattice remains strongly magnetized at T = 0.2 (m > 0.999)', mAfterColdSweeps > 0.999, `m = ${mAfterColdSweeps}`)

// Onsager Exact Energy check at T = 1.0
const exactE1 = getOnsagerExactEnergy(1.0, 1.0)
assertClose('Onsager exact energy at T=1.0 is ~ -1.99716', exactE1, -1.99716, 1e-3)
const exactETc = getOnsagerExactEnergy(Tc_J1, 1.0)
assertClose('Onsager exact energy at Tc is -√2 ≈ -1.41421', exactETc, -Math.SQRT2, 1e-4)

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log(`\n========================================`)
console.log(`Total tests passed: ${passed}`)
console.log(`Total tests failed: ${failed}`)
console.log(`========================================\n`)

if (failed > 0) {
  process.exit(1)
}
