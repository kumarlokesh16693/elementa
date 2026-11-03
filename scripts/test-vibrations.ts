/**
 * Physics Test Suite: Molecular Vibrational Spectroscopy & Normal Modes
 *
 * Verifies:
 * 1. Vibrational Degrees of Freedom: 3N - 6 (nonlinear) and 3N - 5 (linear).
 * 2. Center of Mass translational invariance: sum(m_i * e_i) = 0 for all modes.
 * 3. Point Group Symmetry & Rule of Mutual Exclusion for centrosymmetric molecules (CO2, SF6, XeF4).
 * 4. FTIR transmittance spectrum physics (Beer-Lambert law, absorption dips <= 100%).
 * 5. Raman spectrum activity and Lorentzian profile generation.
 */

import {
  VIBRATIONAL_MOLECULES,
  generateFtIrSpectrum,
  generateRamanSpectrum,
  computeHarmonicPosition,
} from '../src/lib/periodic/vibrations'

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

console.log('=== TEST SUITE: Molecular Vibrations & Normal Modes ===\n')

// 1. Degrees of Freedom
console.log('--- 1. Vibrational Degrees of Freedom (3N - 6 / 3N - 5) ---')
for (const [id, mol] of Object.entries(VIBRATIONAL_MOLECULES)) {
  const expectedDof = mol.isLinear ? 3 * mol.numAtoms - 5 : 3 * mol.numAtoms - 6
  assert(
    mol.degreesOfFreedom === expectedDof,
    `${mol.formula} (${mol.isLinear ? 'linear' : 'nonlinear'}, N=${mol.numAtoms}): dof = ${mol.degreesOfFreedom} (expected ${expectedDof})`
  )
}

// 2. Center of Mass Invariance
console.log('\n--- 2. Center-of-Mass Conservation (Zero Net Translation) ---')
for (const [id, mol] of Object.entries(VIBRATIONAL_MOLECULES)) {
  const totalMass = mol.atoms.reduce((sum, a) => sum + a.mass, 0)
  for (const mode of mol.modes) {
    let comDx = 0
    let comDy = 0
    let comDz = 0
    for (let i = 0; i < mol.atoms.length; i++) {
      const m = mol.atoms[i].mass
      comDx += m * mode.displacements[i].x
      comDy += m * mode.displacements[i].y
      comDz += m * mode.displacements[i].z
    }
    const drift = Math.sqrt(comDx * comDx + comDy * comDy + comDz * comDz) / totalMass
    assert(
      drift < 1e-4,
      `${mol.formula} Mode ${mode.id} (${mode.symmetry} @ ${mode.frequency} cm⁻¹): COM drift = ${drift.toExponential(3)} Å < 1e-4`
    )
  }
}

// 3. Rule of Mutual Exclusion for Centrosymmetric Molecules
console.log('\n--- 3. Rule of Mutual Exclusion (Ci / Inversion Symmetry) ---')
for (const [id, mol] of Object.entries(VIBRATIONAL_MOLECULES)) {
  if (mol.hasInversionCenter) {
    let mutualExclusionViolated = false
    for (const mode of mol.modes) {
      if (mode.irActive && mode.ramanActive) {
        mutualExclusionViolated = true
        console.error(`Violation in ${mol.formula} mode ${mode.id} (${mode.symmetry})`)
      }
    }
    assert(
      !mutualExclusionViolated,
      `${mol.formula} (${mol.pointGroup}): Rule of Mutual Exclusion strictly holds (no mode simultaneously IR & Raman active)`
    )
  } else {
    // Non-centrosymmetric molecule can have coincident IR and Raman active modes
    const coincidentModes = mol.modes.filter((m) => m.irActive && m.ramanActive)
    assert(
      coincidentModes.length > 0,
      `${mol.formula} (${mol.pointGroup}): Non-centrosymmetric permits coincident IR & Raman activity (${coincidentModes.length} modes)`
    )
  }
}

// 4. Harmonic Coordinate Propagation
console.log('\n--- 4. Harmonic Coordinates Dynamic Displacement ---')
const water = VIBRATIONAL_MOLECULES['h2o']
const waterNu1 = water.modes[0]
const pos0 = computeHarmonicPosition(water.atoms[1], waterNu1.displacements[1], 1.0, 0)
const posQuarter = computeHarmonicPosition(water.atoms[1], waterNu1.displacements[1], 1.0, Math.PI / 2)
const posHalf = computeHarmonicPosition(water.atoms[1], waterNu1.displacements[1], 1.0, Math.PI)
const posThreeQuarter = computeHarmonicPosition(water.atoms[1], waterNu1.displacements[1], 1.0, (3 * Math.PI) / 2)

assert(Math.abs(pos0.y - water.atoms[1].y0) < 1e-6, 'Phase 0 rad: atom is exactly at equilibrium coordinate')
assert(Math.abs(posHalf.y - water.atoms[1].y0) < 1e-6, 'Phase pi rad: atom returns to equilibrium coordinate')
assert(
  Math.abs((posQuarter.y - water.atoms[1].y0) + (posThreeQuarter.y - water.atoms[1].y0)) < 1e-6,
  'Phase pi/2 and 3pi/2: equal and opposite maximum harmonic displacement amplitudes'
)

// 5. FTIR Transmittance Spectrum Simulation
console.log('\n--- 5. FTIR Transmittance Spectrum Generation ---')
const co2 = VIBRATIONAL_MOLECULES['co2']
const ftirPoints = generateFtIrSpectrum(co2.modes, 400, 4000, 5)
assert(ftirPoints.length > 700, `Generated ${ftirPoints.length} FTIR spectral data points`)

// Find global minimum transmittance in CO2 spectrum (should be around 667 or 2349 cm^-1)
let minT = 100
let minWn = 0
for (const p of ftirPoints) {
  if (p.intensity < minT) {
    minT = p.intensity
    minWn = p.wavenumber
  }
}
assert(
  minT < 10 && (Math.abs(minWn - 2349) <= 15 || Math.abs(minWn - 667) <= 15),
  `CO2 FTIR global absorption dip: %T = ${minT.toFixed(1)}% at ${minWn} cm⁻¹ (matches CO2 fundamental band)`
)

// 6. Raman Intensity Spectrum Simulation
console.log('\n--- 6. Raman Scattering Spectrum Generation ---')
const ramanPoints = generateRamanSpectrum(water.modes, 400, 4000, 5)
let maxRaman = 0
let maxRamanWn = 0
for (const p of ramanPoints) {
  if (p.intensity > maxRaman) {
    maxRaman = p.intensity
    maxRamanWn = p.wavenumber
  }
}
assert(
  maxRaman > 80 && Math.abs(maxRamanWn - 3657) <= 15,
  `H2O Raman maximum peak: intensity = ${maxRaman.toFixed(1)} at ${maxRamanWn} cm⁻¹ (matches ν1 symmetric stretch)`
)

console.log(`\n========================================`)
console.log(`Test Results: ${passed} passed, ${failed} failed`)
console.log(`========================================`)

if (failed > 0) {
  process.exit(1)
}
