/* Physics sanity check for PROJECT DAEDALUS engine */
import { SimEngine } from '../src/lib/sim/engine'
import { earthAtm } from '../src/lib/sim/atmosphere'
import { PLANETS, DEG } from '../src/lib/sim/constants'

// 1. atmosphere spot checks
const a44 = earthAtm(43_800)
console.log('rho(43.8km) =', a44.rho.toFixed(4), '(screenshot ref ~0.0032)')
console.log('a(43.8km)   =', a44.a.toFixed(1), 'm/s')

// 2. run waverider mission from its IC with alpha=18, sigma=0 (manual), no autopilot
const eng = new SimEngine()
eng.loadMission('waverider')
eng.autopilot = false
eng.alpha = 18
// force exact IC values
eng.overrideAltitude(43_800)
eng.overrideVelocity(4_260)
eng.overrideGamma(0)
const ui0 = eng.ui
console.log('--- waverider @ alpha 18 (manual) ---')
console.log('mach      =', ui0.mach.toFixed(1))
console.log('rho       =', ui0.rho.toFixed(4))
console.log('q kPa     =', ui0.q.toFixed(1), '(ref 29.4)')
console.log('heat Wcm2 =', ui0.heat.toFixed(1), '(ref 95.2)')
console.log('tShock K  =', ui0.tShock.toFixed(0), '(ref 3288)')
console.log('g         =', ui0.g.toFixed(2), '(ref 2.24)')
console.log('L/D       =', ui0.ld.toFixed(2), '(ref 1.83)')

// 3. simulate 120 s of cruise and watch it hold with autopilot
const eng2x = new SimEngine()
eng2x.loadMission('waverider')
eng2x.autopilot = true
let maxH = -1e9, minH = 1e9
for (let i = 0; i < 120 * 50; i++) {
  eng2x.tick(1 / 50)
  maxH = Math.max(maxH, eng2x.ui.h)
  minH = Math.min(minH, eng2x.ui.h)
}
console.log('--- autopilot cruise 120s ---')
console.log('h range km:', (minH / 1000).toFixed(2), '->', (maxH / 1000).toFixed(2))
console.log('v km/s:', (eng2x.ui.v / 1000).toFixed(3), 'gamma:', eng2x.ui.gamma.toFixed(2))

// 4. LEO deorbit entry: run to touchdown with autopilot
const leo = new SimEngine()
leo.loadMission('leo')
leo.autopilot = true
let peakG = 0, peakQ = 0, peakHeat = 0, blackout = false
for (let i = 0; i < 40 * 3600 * 20 && !leo.ui.landed; i++) {
  leo.tick(1 / 20)
  peakG = Math.max(peakG, leo.ui.g)
  peakQ = Math.max(peakQ, leo.ui.q)
  peakHeat = Math.max(peakHeat, leo.ui.heat)
  if (leo.ui.status === 'IONIZATION BLACKOUT') blackout = true
}
console.log('--- LEO entry w/ autopilot ---')
console.log('landed:', leo.ui.landed, 'duration:', leo.ui.t.toFixed(0), 's')
console.log('peakG:', peakG.toFixed(2), 'peakQ kPa:', peakQ.toFixed(1), 'peakHeat:', peakHeat.toFixed(1))
console.log('blackout occurred:', blackout, 'downrange km:', leo.ui.downrange.toFixed(0))

// 5. Apollo superorbital
const ap = new SimEngine()
ap.loadMission('apollo')
ap.autopilot = true
let apG = 0, apHeat = 0
for (let i = 0; i < 40 * 3600 * 20 && !ap.ui.landed; i++) {
  ap.tick(1 / 20)
  apG = Math.max(apG, ap.ui.g)
  apHeat = Math.max(apHeat, ap.ui.heat)
}
console.log('--- Apollo ---')
console.log('landed:', ap.ui.landed, 'peakG:', apG.toFixed(2), 'peakHeat:', apHeat.toFixed(1))

// 6. Mars aerocapture
const mr = new SimEngine()
mr.loadMission('mars')
mr.autopilot = true
for (let i = 0; i < 40 * 3600 * 20 && !mr.ui.landed && !mr.ui.paused; i++) {
  mr.tick(1 / 20)
}
console.log('--- Mars aerocapture ---')
console.log('captured:', mr.ui.captured, 'landed:', mr.ui.landed, 'status:', mr.ui.status)
console.log('v_esc check km/s:', (Math.sqrt(2 * PLANETS.mars.mu / (PLANETS.mars.radius + mr.ui.h)) / 1000).toFixed(3))
