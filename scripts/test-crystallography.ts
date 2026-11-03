import {
  CU_K_ALPHA,
  calculateDSpacingCubic,
  calculateTwoTheta,
  isReflectionAllowed,
  generateXrdPeaks,
  getCrystallographyDetails,
} from '../src/lib/periodic/crystallography'
import { getElement } from '../src/lib/periodic'

let fail = 0
function check(name: string, cond: boolean, info?: unknown) {
  if (!cond) fail++
  console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : '->', info ?? '')
}

console.log('Testing Crystallography & Powder XRD Engine...')

// 1. Interplanar d-spacing & Bragg angle: Copper (FCC, a ≈ 3.615 Å)
const aCu = 3.615
const d111Cu = calculateDSpacingCubic(aCu, 1, 1, 1)
check('Cu (111) d-spacing ≈ 2.087 Å', Math.abs(d111Cu - 2.087) < 0.01, d111Cu)

const twoThetaCu111 = calculateTwoTheta(d111Cu, CU_K_ALPHA)
check('Cu (111) Bragg 2θ ≈ 43.3°', twoThetaCu111 != null && Math.abs(twoThetaCu111 - 43.3) < 0.5, twoThetaCu111)

// 2. Extinction rules for FCC: h, k, l must be unmixed
check('FCC allows (111)', isReflectionAllowed('fcc', 1, 1, 1))
check('FCC forbids (110) [mixed parity]', !isReflectionAllowed('fcc', 1, 1, 0))
check('FCC allows (200) [all even]', isReflectionAllowed('fcc', 2, 0, 0))
check('FCC allows (220) [all even]', isReflectionAllowed('fcc', 2, 2, 0))
check('FCC allows (311) [all odd]', isReflectionAllowed('fcc', 3, 1, 1))

// 3. Extinction rules for BCC: h + k + l must be even
check('BCC allows (110)', isReflectionAllowed('bcc', 1, 1, 0))
check('BCC forbids (111) [sum = 3 odd]', !isReflectionAllowed('bcc', 1, 1, 1))
check('BCC allows (200) [sum = 2 even]', isReflectionAllowed('bcc', 2, 0, 0))
check('BCC allows (211) [sum = 4 even]', isReflectionAllowed('bcc', 2, 1, 1))

// 4. Diamond cubic extinction
check('Diamond allows (111)', isReflectionAllowed('diamond', 1, 1, 1))
check('Diamond forbids (200) [sum = 2 not div by 4]', !isReflectionAllowed('diamond', 2, 0, 0))
check('Diamond allows (220) [sum = 4 div by 4]', isReflectionAllowed('diamond', 2, 2, 0))

// 5. Full Element Crystallography Details (Iron Z=26, BCC)
const fe = getElement(26)!
const feDetails = getCrystallographyDetails(fe, 'bcc')
check('Fe is BCC with coordination 8', feDetails.coordination === 8 && feDetails.system.includes('Body-Centred'))
check('Fe APF is 68.0%', feDetails.apfPercent === '68.0%')
check('Fe XRD peaks generated', feDetails.xrdPeaks.length >= 3)
check('Fe primary reflection is (110)', feDetails.xrdPeaks[0].h === 1 && feDetails.xrdPeaks[0].k === 1 && feDetails.xrdPeaks[0].l === 0)

// 6. Gold (Au, Z=79, FCC)
const au = getElement(79)!
const auDetails = getCrystallographyDetails(au, 'fcc')
check('Au is FCC with coordination 12', auDetails.coordination === 12)
check('Au APF is 74.1%', auDetails.apfPercent === '74.1%')
check('Au primary reflection is (111)', auDetails.xrdPeaks[0].h === 1 && auDetails.xrdPeaks[0].k === 1 && auDetails.xrdPeaks[0].l === 1)

console.log(`\nTests completed with ${fail} failures.`)
if (fail > 0) process.exit(1)
