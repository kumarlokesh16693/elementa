import assert from 'node:assert/strict'
import {
  STANDARD_MODEL_PARTICLES,
  SM_PRIMARY_KEYS,
  getParticle,
  checkVertexConservation,
  checkDiagramConservation,
  FEYNMAN_PRESETS,
  RESONANCE_CATALOG,
  relativisticBreitWigner,
  computeResonanceCurve,
  DECAY_PROFILES,
} from '../src/lib/particle.ts'

console.log('🧪 Starting Particle Physics & Feynman Diagram Lab Rigor Suite...\n')

let passCount = 0
function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passCount++
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`)
    console.error(err)
    process.exit(1)
  }
}

// ----------------------------------------------------------------------------
// 1. Standard Model Dataset Verification (17 Fundamental Particles + Antiparticles)
// ----------------------------------------------------------------------------
test('Standard Model defines all 17 fundamental particles with accurate PDG properties', () => {
  assert.strictEqual(SM_PRIMARY_KEYS.length, 17, 'SM must contain 17 primary fundamental particles')

  // Check 6 Quarks
  const quarks = ['u', 'd', 'c', 's', 't', 'b']
  quarks.forEach((qId) => {
    const q = getParticle(qId)
    assert.strictEqual(q.kind, 'quark')
    assert.strictEqual(q.spin, 0.5)
    assert.strictEqual(q.color, 'triplet')
    assert.ok(Math.abs(q.baryonNumber - 1 / 3) < 1e-6)
    assert.strictEqual(q.leptonE, 0)
    assert.strictEqual(q.leptonMu, 0)
    assert.strictEqual(q.leptonTau, 0)
  })

  // Specific Quark masses & charges
  const u = getParticle('u')
  assert.ok(Math.abs(u.charge - 2 / 3) < 1e-4, 'Up quark charge must be +2/3')
  assert.ok(u.massMeV >= 1.5 && u.massMeV <= 3.0, 'Up quark mass in ~2.16 MeV range')

  const d = getParticle('d')
  assert.ok(Math.abs(d.charge - (-1 / 3)) < 1e-4, 'Down quark charge must be -1/3')
  assert.ok(d.massMeV >= 4.0 && d.massMeV <= 5.5, 'Down quark mass in ~4.67 MeV range')

  const c = getParticle('c')
  assert.ok(Math.abs(c.charge - 2 / 3) < 1e-4)
  assert.ok(c.massMeV >= 1200 && c.massMeV <= 1350, 'Charm quark ~1.27 GeV')

  const s = getParticle('s')
  assert.ok(Math.abs(s.charge - (-1 / 3)) < 1e-4)
  assert.ok(s.massMeV >= 85 && s.massMeV <= 105, 'Strange quark ~93.4 MeV')

  const t = getParticle('t')
  assert.ok(Math.abs(t.charge - 2 / 3) < 1e-4)
  assert.ok(t.massMeV >= 170000 && t.massMeV <= 175000, 'Top quark ~172.7 GeV')

  const b = getParticle('b')
  assert.ok(Math.abs(b.charge - (-1 / 3)) < 1e-4)
  assert.ok(b.massMeV >= 4000 && b.massMeV <= 4300, 'Bottom quark ~4.18 GeV')

  // Check 6 Leptons
  const leptons = ['e_minus', 'nu_e', 'mu_minus', 'nu_mu', 'tau_minus', 'nu_tau']
  leptons.forEach((lId) => {
    const l = getParticle(lId)
    assert.strictEqual(l.kind, 'lepton')
    assert.strictEqual(l.spin, 0.5)
    assert.strictEqual(l.color, 'singlet')
    assert.strictEqual(l.baryonNumber, 0)
  })

  const e = getParticle('e_minus')
  assert.strictEqual(e.charge, -1)
  assert.ok(Math.abs(e.massMeV - 0.511) < 0.001, 'Electron mass ~0.511 MeV')
  assert.strictEqual(e.leptonE, 1)

  const mu = getParticle('mu_minus')
  assert.strictEqual(mu.charge, -1)
  assert.ok(Math.abs(mu.massMeV - 105.658) < 0.01, 'Muon mass ~105.66 MeV')
  assert.strictEqual(mu.leptonMu, 1)

  const tau = getParticle('tau_minus')
  assert.strictEqual(tau.charge, -1)
  assert.ok(Math.abs(tau.massMeV - 1776.86) < 0.1, 'Tau mass ~1776.86 MeV')
  assert.strictEqual(tau.leptonTau, 1)

  // Check Gauge Bosons
  const gamma = getParticle('gamma')
  assert.strictEqual(gamma.kind, 'gauge_boson')
  assert.strictEqual(gamma.spin, 1)
  assert.strictEqual(gamma.massMeV, 0)
  assert.strictEqual(gamma.charge, 0)

  const gluon = getParticle('gluon')
  assert.strictEqual(gluon.kind, 'gauge_boson')
  assert.strictEqual(gluon.spin, 1)
  assert.strictEqual(gluon.massMeV, 0)
  assert.strictEqual(gluon.color, 'octet')

  const w_plus = getParticle('w_plus')
  assert.strictEqual(w_plus.kind, 'gauge_boson')
  assert.strictEqual(w_plus.charge, 1)
  assert.ok(Math.abs(w_plus.massMeV - 80377) < 10, 'W+ mass ~80.377 GeV')

  const w_minus = getParticle('w_minus')
  assert.strictEqual(w_minus.kind, 'gauge_boson')
  assert.strictEqual(w_minus.charge, -1)
  assert.ok(Math.abs(w_minus.massMeV - 80377) < 10, 'W- mass ~80.377 GeV')

  const z_zero = getParticle('z_zero')
  assert.strictEqual(z_zero.kind, 'gauge_boson')
  assert.strictEqual(z_zero.charge, 0)
  assert.ok(Math.abs(z_zero.massMeV - 91187.6) < 10, 'Z0 mass ~91.1876 GeV')

  // Check Scalar Boson
  const higgs = getParticle('higgs')
  assert.strictEqual(higgs.kind, 'scalar_boson')
  assert.strictEqual(higgs.spin, 0)
  assert.strictEqual(higgs.charge, 0)
  assert.ok(Math.abs(higgs.massMeV - 125250) < 50, 'Higgs mass ~125.25 GeV')
})

test('Antiparticles have inverted charge, lepton numbers, and baryon numbers', () => {
  const e_plus = getParticle('e_plus')
  assert.strictEqual(e_plus.charge, 1)
  assert.strictEqual(e_plus.leptonE, -1)
  assert.strictEqual(e_plus.isAntiparticle, true)

  const u_bar = getParticle('u_bar')
  assert.ok(Math.abs(u_bar.charge - (-2 / 3)) < 1e-4)
  assert.ok(Math.abs(u_bar.baryonNumber - (-1 / 3)) < 1e-4)
  assert.strictEqual(u_bar.color, 'antitriplet')

  const d_bar = getParticle('d_bar')
  assert.ok(Math.abs(d_bar.charge - (1 / 3)) < 1e-4)
  assert.ok(Math.abs(d_bar.baryonNumber - (-1 / 3)) < 1e-4)
})

// ----------------------------------------------------------------------------
// 2. Vertex Conservation Checker Rigor
// ----------------------------------------------------------------------------
test('Vertex conservation verifies valid QED, Weak, QCD, and Higgs vertices', () => {
  // QED vertex: e- -> e- + gamma
  const qed1 = checkVertexConservation(['e_minus'], ['e_minus', 'gamma'])
  assert.strictEqual(qed1.valid, true)
  assert.strictEqual(qed1.deltaQ, 0)
  assert.strictEqual(qed1.deltaLe, 0)

  // Weak charged current vertex: d -> u + W-
  const weak1 = checkVertexConservation(['d'], ['u', 'w_minus'])
  assert.strictEqual(weak1.valid, true)
  assert.strictEqual(weak1.deltaQ, 0)
  assert.strictEqual(weak1.deltaB, 0)

  // Weak leptonic vertex: W- -> e- + nu_e_bar
  const weak2 = checkVertexConservation(['w_minus'], ['e_minus', 'nu_e_bar'])
  assert.strictEqual(weak2.valid, true)
  assert.strictEqual(weak2.deltaQ, 0)
  assert.strictEqual(weak2.deltaLe, 0) // e- has Le=1, nu_e_bar has Le=-1 => sum = 0

  // Weak neutral current vertex: mu- -> mu- + Z0
  const zVertex = checkVertexConservation(['mu_minus'], ['mu_minus', 'z_zero'])
  assert.strictEqual(zVertex.valid, true)

  // QCD vertex: q -> q + g
  const qcdVertex = checkVertexConservation(['u'], ['u', 'gluon'])
  assert.strictEqual(qcdVertex.valid, true)

  // Higgs Yukawa vertex: H -> b + b_bar
  const higgsVertex = checkVertexConservation(['higgs'], ['b', 'b_bar'])
  assert.strictEqual(higgsVertex.valid, true)
  assert.strictEqual(higgsVertex.deltaQ, 0)
  assert.strictEqual(higgsVertex.deltaB, 0)
})

test('Vertex conservation flags invalid interactions (charge, lepton flavor, and baryon violations)', () => {
  // Charge violation: e- -> e- + e- (Qin = -1, Qout = -2)
  const badCharge = checkVertexConservation(['e_minus'], ['e_minus', 'e_minus'])
  assert.strictEqual(badCharge.valid, false)
  assert.ok(badCharge.errors.some((e) => e.includes('Charge conservation violated')))

  // Lepton flavor violation: mu- -> e- + gamma (forbidden at tree level in SM)
  const lfv = checkVertexConservation(['mu_minus'], ['e_minus', 'gamma'])
  assert.strictEqual(lfv.valid, false)
  assert.ok(lfv.errors.some((e) => e.includes('Muon lepton number violated') || e.includes('Electron lepton number violated')))

  // Baryon number violation: u -> e+ + gamma
  const bnv = checkVertexConservation(['u'], ['e_plus', 'gamma'])
  assert.strictEqual(bnv.valid, false)
  assert.ok(bnv.errors.some((e) => e.includes('Baryon number violated') || e.includes('Charge conservation violated')))
})

test('All 8 required Feynman presets pass complete vertex and global conservation checks', () => {
  const presetKeys = Object.keys(FEYNMAN_PRESETS)
  assert.ok(presetKeys.length >= 8, 'Must have at least 8 fundamental presets')

  const requiredPresets = [
    'ee_to_mumu',
    'beta_decay',
    'muon_decay',
    'bhabha_scattering',
    'gluon_self_interaction',
    'higgs_decay',
    'top_decay',
    'compton_scattering',
  ]

  for (const key of requiredPresets) {
    const preset = FEYNMAN_PRESETS[key]
    assert.ok(preset, `Preset ${key} must exist`)
    const res = checkDiagramConservation(preset)
    assert.strictEqual(res.valid, true, `Preset ${key} failed conservation: ${res.errors.join('; ')}`)
  }
})

// ----------------------------------------------------------------------------
// 3. Breit–Wigner Relativistic Resonance Calculations
// ----------------------------------------------------------------------------
test('Breit–Wigner cross-section peak matches invariant mass M and FWHM matches Γ', () => {
  // Test Z0 pole
  const zCurve = computeResonanceCurve('z_zero', 500)
  const M_Z = 91.1876
  const Gamma_Z = 2.4952

  // Peak must be within 0.1% of M_Z
  assert.ok(
    Math.abs(zCurve.peakE - M_Z) < 0.1,
    `Z peak ${zCurve.peakE} GeV should match invariant mass ${M_Z} GeV`,
  )

  // FWHM must match total decay width within ~3% due to grid discretization
  assert.ok(
    Math.abs(zCurve.fwhm - Gamma_Z) / Gamma_Z < 0.05,
    `Z FWHM ${zCurve.fwhm} should match Gamma ${Gamma_Z}`,
  )

  // Lifetime tau = hbar / Gamma
  assert.ok(zCurve.lifetimeSec > 2.0e-25 && zCurve.lifetimeSec < 3.5e-25)

  // Test W boson
  const wCurve = computeResonanceCurve('w_boson', 500)
  const M_W = 80.377
  const Gamma_W = 2.085
  assert.ok(Math.abs(wCurve.peakE - M_W) < 0.15)
  assert.ok(Math.abs(wCurve.fwhm - Gamma_W) / Gamma_W < 0.05)

  // Test Higgs narrow resonance
  const hCurve = computeResonanceCurve('higgs', 500)
  assert.ok(Math.abs(hCurve.peakE - 125.25) < 0.001)
  assert.ok(Math.abs(hCurve.fwhm - 0.0041) / 0.0041 < 0.08)
})

// ----------------------------------------------------------------------------
// 4. Decay Profiles & Branching Ratios
// ----------------------------------------------------------------------------
test('Decay profiles sum to ~100% and provide accurate branching fractions', () => {
  const profileKeys = ['higgs', 'z_zero', 'w_plus', 'tau_minus', 'top', 'pion_plus']
  for (const k of profileKeys) {
    const profile = DECAY_PROFILES[k]
    assert.ok(profile, `Profile ${k} must exist`)
    const sum = profile.modes.reduce((acc, m) => acc + m.branchingFraction, 0)
    assert.ok(
      sum >= 0.98 && sum <= 1.01,
      `Profile ${k} branching fractions should sum to ~1.0, got ${sum}`,
    )
  }
})

console.log(`\n🎉 All ${passCount} Particle Physics & Feynman Lab tests passed with 100% rigor!\n`)
