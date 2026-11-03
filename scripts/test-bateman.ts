import {
  BATEMAN_PRESETS,
  buildBatemanChain,
  convertAmountToAtoms,
  determineTimeBounds,
  evaluateBatemanAtTime,
  analyzeEquilibrium,
  formatActivityBq,
  formatDuration,
  formatMassGrams,
} from '../src/lib/periodic/bateman'
import { nucAt } from '../src/lib/periodic/nuclides'

let fail = 0
function check(name: string, cond: boolean, info?: unknown) {
  if (!cond) fail++
  console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : '->', info ?? '')
}

console.log('Testing Bateman Decay Simulator Engine...')

// 1. Presets test
check('Presets defined', BATEMAN_PRESETS.length >= 8)

// 2. Ba-140 -> La-140 transient equilibrium
const ba140 = nucAt(56, 84)!
check('Ba-140 found', !!ba140)
const baChain = buildBatemanChain(ba140)
check('Ba-140 chain has members', baChain.length >= 2, baChain.map((m) => m.name))
const baEq = analyzeEquilibrium(baChain)
check('Ba-140 is transient equilibrium', baEq.type === 'transient', baEq.type)
check('Ba-140 t_max ~ 5.65 days', baEq.tMaxSec != null && Math.abs(baEq.tMaxSec / 86400 - 5.65) < 0.1, baEq.tMaxSec ? baEq.tMaxSec / 86400 : null)

// Initial 100 MBq Ba-140
const baN0 = convertAmountToAtoms(100, 'MBq', ba140)
check('Ba-140 N0 > 0', baN0 > 0)

// At peak t_max: Daughter activity crosses parent activity (Ratio = 1.000)
const snapBaPeak = evaluateBatemanAtTime(baChain, baN0, baEq.tMaxSec!)
check('At peak t_max: A_daughter == A_parent (Ratio = 1.000)', Math.abs(snapBaPeak.members[1].activityBq / snapBaPeak.members[0].activityBq - 1.0) < 0.005)
console.log('  Ba-140 at peak:', formatActivityBq(snapBaPeak.members[0].activityBq))
console.log('  La-140 at peak:', formatActivityBq(snapBaPeak.members[1].activityBq))
console.log('  Ratio at peak:', (snapBaPeak.members[1].activityBq / snapBaPeak.members[0].activityBq).toFixed(3))

// After t_max (e.g. t = 16 days): Transient equilibrium ratio settles at lambda_d / (lambda_d - lambda_p) ~ 1.152
const snapBaTransient = evaluateBatemanAtTime(baChain, baN0, 16 * 86400)
const expectedRatio = baEq.asymptoticActivityRatio ?? 1.152
check('Transient equilibrium ratio A_d / A_p ~ 1.152', Math.abs(snapBaTransient.members[1].activityRatioToParent - expectedRatio) < 0.02, snapBaTransient.members[1].activityRatioToParent)
console.log('  Ratio after 16d:', snapBaTransient.members[1].activityRatioToParent.toFixed(3), 'expected:', expectedRatio.toFixed(3))

// 3. Sr-90 -> Y-90 secular equilibrium
const sr90 = nucAt(38, 52)!
check('Sr-90 found', !!sr90)
const srChain = buildBatemanChain(sr90)
const srEq = analyzeEquilibrium(srChain)
check('Sr-90 is secular equilibrium', srEq.type === 'secular', srEq.type)
const srN0 = convertAmountToAtoms(50, 'MBq', sr90)
const snapSr1Month = evaluateBatemanAtTime(srChain, srN0, 30 * 86400)
check('Sr-90 / Y-90 secular lockstep reached in 30 days', Math.abs(snapSr1Month.members[1].activityRatioToParent - 1.0) < 0.05, snapSr1Month.members[1].activityRatioToParent)
console.log('  Sr-90 after 30d:', formatActivityBq(snapSr1Month.members[0].activityBq))
console.log('  Y-90 after 30d:', formatActivityBq(snapSr1Month.members[1].activityBq))

// 4. U-238 geological series
const u238 = nucAt(92, 146)!
check('U-238 found', !!u238)
const uChain = buildBatemanChain(u238)
check('U-238 chain has 15 members', uChain.length === 15, uChain.length)
check('U-238 terminal is Pb-206 stable', uChain[uChain.length - 1].name === 'Pb-206' && uChain[uChain.length - 1].isStable)

const uN0 = convertAmountToAtoms(1.0, 'g', u238)
const snapUHalflife = evaluateBatemanAtTime(uChain, uN0, u238.hlSec!)
check('U-238 half remaining after 1 half-life', Math.abs(snapUHalflife.members[0].atoms / uN0 - 0.5) < 0.01, snapUHalflife.members[0].atoms / uN0)
console.log('  Pb-206 accumulated after 4.47 Gy:', formatMassGrams(snapUHalflife.members[uChain.length - 1].massGrams))

console.log(`\nTests completed with ${fail} failures.`)
if (fail > 0) process.exit(1)
