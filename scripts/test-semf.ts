/**
 * Test & Validation Script for Liquid-Drop SEMF & Fission Engine
 */

import {
  calculateSemf,
  calculatePairing,
  calculateFissility,
  analyzeFission,
  FISSION_PRESETS,
  FUSION_PRESETS,
  FUEL_COMPARISONS,
} from '../src/lib/periodic/semf'

function assert(cond: boolean, msg: string, detail?: any) {
  if (!cond) {
    console.error(`FAIL: ${msg}`, detail ?? '')
    process.exit(1)
  }
  console.log(`PASS ${msg} `, detail ?? '')
}

console.log('Testing Liquid-Drop SEMF & Nuclear Fission Engine...')

// 1. Fe-56 and Ni-62 peak binding energy
const fe56 = calculateSemf(56, 26)
assert(fe56.bPerA >= 8.5 && fe56.bPerA <= 9.0, 'Fe-56 theoretical B/A is ~8.79 MeV/nucleon', fe56.bPerA)
assert(fe56.experimentalBPerA != null && fe56.experimentalBPerA >= 8.7 && fe56.experimentalBPerA <= 8.9,
  'Fe-56 experimental B/A is ~8.79 MeV', fe56.experimentalBPerA)

const ni62 = calculateSemf(62, 28)
assert(ni62.bPerA >= 8.6 && ni62.bPerA <= 9.0, 'Ni-62 theoretical B/A is ~8.8 MeV', ni62.bPerA)
assert(ni62.experimentalBPerA != null && ni62.experimentalBPerA >= 8.75 && ni62.experimentalBPerA <= 8.85,
  'Ni-62 experimental B/A is ~8.795 MeV', ni62.experimentalBPerA)

// 2. Heavy nucleus U-238
const u238 = calculateSemf(238, 92)
assert(u238.bPerA >= 7.3 && u238.bPerA <= 7.8, 'U-238 theoretical B/A is ~7.57 MeV/nucleon', u238.bPerA)
assert(u238.experimentalBPerA != null && u238.experimentalBPerA >= 7.5 && u238.experimentalBPerA <= 7.6,
  'U-238 experimental B/A is ~7.57 MeV', u238.experimentalBPerA)

// 3. Pairing term rules
const deltaEvenEven = calculatePairing(56, 26)
assert(deltaEvenEven > 0, 'Even-even has positive pairing delta', deltaEvenEven)

const deltaOddOdd = calculatePairing(14, 7)
assert(deltaOddOdd < 0, 'Odd-odd has negative pairing delta', deltaOddOdd)

const deltaOddA = calculatePairing(13, 6)
assert(deltaOddA === 0, 'Odd A has zero pairing delta', deltaOddA)

// 4. Term breakdown signs
assert(fe56.volume > 0, 'Volume term is positive (binding)', fe56.volume)
assert(fe56.surface < 0, 'Surface term is negative (loss of neighbors)', fe56.surface)
assert(fe56.coulomb < 0, 'Coulomb term is negative (proton repulsion)', fe56.coulomb)
assert(fe56.asymmetry <= 0, 'Asymmetry term is negative or zero', fe56.asymmetry)

// 5. Bohr-Wheeler Fissility
const fissU235 = calculateFissility(235, 92)
assert(fissU235.z2OverA >= 35.8 && fissU235.z2OverA <= 36.2, 'U-235 Z^2/A is ~36.0', fissU235.z2OverA)
assert(fissU235.fissilityX >= 0.7 && fissU235.fissilityX <= 0.8, 'U-235 fissility parameter x is ~0.74', fissU235.fissilityX)
assert(!fissU235.isSpontaneousFavored, 'U-235 has non-zero fission barrier against spontaneous fission', fissU235.fissionBarrierMev)

// 6. Fission Reactions (U-235 thermal split)
const rxU235 = FISSION_PRESETS[0]
const analysisU235 = analyzeFission(rxU235)
assert(analysisU235.promptQMev >= 165 && analysisU235.promptQMev <= 185,
  'U-235 standard fission prompt Q is ~173 MeV', analysisU235.promptQMev)
assert(analysisU235.coulombBarrierMev >= 220 && analysisU235.coulombBarrierMev <= 250,
  'Coulomb barrier between Kr-92 and Ba-141 is ~239 MeV', analysisU235.coulombBarrierMev)
assert(analysisU235.energyBreakdown.fragmentsKineticMev >= 160 && analysisU235.energyBreakdown.fragmentsKineticMev <= 175,
  'Fission fragments prompt kinetic energy is ~168 MeV', analysisU235.energyBreakdown.fragmentsKineticMev)
assert(analysisU235.energyBreakdown.totalRecoverableMev >= 180 && analysisU235.energyBreakdown.totalRecoverableMev <= 215,
  'Total recoverable fission energy is ~200 MeV', analysisU235.energyBreakdown.totalRecoverableMev)

// 7. Fusion Reactions
const dtFusion = FUSION_PRESETS[0]
assert(Math.abs(dtFusion.qMev - 17.59) < 0.1, 'D-T fusion Q-value is 17.59 MeV', dtFusion.qMev)

// 8. Fuel comparisons
const fusionFuel = FUEL_COMPARISONS.find(f => f.name.includes('Fusion'))!
const coalFuel = FUEL_COMPARISONS.find(f => f.name.includes('Coal'))!
const ratio = fusionFuel.densityMjPerKg / coalFuel.densityMjPerKg
assert(ratio > 10_000_000, 'Fusion energy density is > 10 million times coal', ratio)

console.log('\nTests completed with 0 failures.')
