import {
  BURNING_STAGES,
  NEUTRON_CAPTURE_PROCESSES,
  COSMIC_ABUNDANCES,
  getCosmicAbundance,
  calculateGamowPeak,
} from '../src/lib/periodic/nucleosynthesis'

let fail = 0
function check(name: string, cond: boolean, info?: unknown) {
  if (!cond) fail++
  console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : '->', info ?? '')
}

console.log('Testing Stellar Nucleosynthesis & Cosmic Origins Engine...')

// 1. Burning Stages definition & Net Q-Values
check('Burning stages defined', BURNING_STAGES.length === 8)

const pp = BURNING_STAGES.find((s) => s.id === 'pp_chain')!
check('pp-chain exists', !!pp)
check('pp-chain net Q is 26.73 MeV', Math.abs(pp.qNetMev - 26.73) < 0.01, pp.qNetMev)

const cno = BURNING_STAGES.find((s) => s.id === 'cno_cycle')!
check('CNO cycle exists', !!cno)
check('CNO cycle net Q is 26.73 MeV', Math.abs(cno.qNetMev - 26.73) < 0.01, cno.qNetMev)
const cnoBottleneck = cno.reactions.find((r) => r.equation.includes('¹⁴N + p'))
check('CNO bottleneck is 14N(p,gamma)15O', !!cnoBottleneck && cnoBottleneck.notes?.includes('bottleneck'))

const tripleAlpha = BURNING_STAGES.find((s) => s.id === 'triple_alpha')!
check('Triple-alpha exists', !!tripleAlpha)
const hoyle = tripleAlpha.reactions.find((r) => r.equation.includes('¹²C*'))
check('Hoyle state resonance is present', !!hoyle && hoyle.qMev > 7.0, hoyle?.qMev)

// 2. Neutron Capture Processes
check('Neutron capture processes defined', NEUTRON_CAPTURE_PROCESSES.length === 3)
const sProc = NEUTRON_CAPTURE_PROCESSES.find((p) => p.id === 's_process')!
const rProc = NEUTRON_CAPTURE_PROCESSES.find((p) => p.id === 'r_process')!
check('s-process terminal is Bi-209', sProc.terminalElement.includes('²⁰⁹Bi'))
check('r-process produces actinides', rProc.terminalElement.includes('²³⁸U') || rProc.characteristicNuclides.includes('²³⁸U'))

// 3. Gamow Peak & Thermonuclear Quantum Tunneling
// For p + p at solar core T = 15.7 MK: E_0 ≈ 5.9 keV
const gamowPP = calculateGamowPeak(1, 1, 1, 1, 15.7)
check('Solar p+p Gamow peak E_0 ≈ 5.9 keV', Math.abs(gamowPP.e0Kev - 5.9) < 0.5, gamowPP.e0Kev)
check('Solar p+p Gamow peak has non-zero tunneling probability', gamowPP.tunnelingProb > 0 && gamowPP.tunnelingProb < 1e-3, gamowPP.tunnelingProb)

// 4. Cosmic Abundance & Oddo-Harkins rule
const hAbund = getCosmicAbundance(1)
const heAbund = getCosmicAbundance(2)
const feAbund = getCosmicAbundance(26)
const coAbund = getCosmicAbundance(27)

check('Hydrogen is most abundant element', hAbund.logAbundance > 10.0, hAbund.logAbundance)
check('Helium is second most abundant', heAbund.logAbundance > 9.0, heAbund.logAbundance)
check('Iron peak is prominent (Fe-56 > Co-57, Oddo-Harkins)', feAbund.logAbundance > coAbund.logAbundance, { Fe: feAbund.logAbundance, Co: coAbund.logAbundance })

// 5. Origin Decomposition
const au = getCosmicAbundance(79)
check('Gold (Au) originates primarily from neutron star mergers', au.origins.neutronStarMergers >= 80, au.origins.neutronStarMergers)

const u = getCosmicAbundance(92)
check('Uranium (U) originates from neutron star mergers (r-process)', u.origins.neutronStarMergers === 100, u.origins.neutronStarMergers)

console.log(`\nTests completed with ${fail} failures.`)
if (fail > 0) process.exit(1)
