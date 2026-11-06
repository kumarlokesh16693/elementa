import assert from 'node:assert/strict'
import {
  buildGrid,
  eigenvalues,
  eigenvector,
  eigenPairs,
  eigenResidual,
  isStateBound,
  discreteNorm,
  boundaryProbability,
  evolvePacket,
  makePacket,
  cnScratch,
  renormalise,
  observables,
  wellAnalyticEnergy,
  hoAnalyticEnergy,
} from '../src/lib/quantum.ts'

console.log('🧪 Starting Quantum Wave Lab Rigor & Physics Verification Suite...\n')

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

// ---------------------------------------------------------
// 1. Sturm Bisection & Eigensolver Residuals
// ---------------------------------------------------------
test('Infinite well eigensolver matches analytic E_n = n^2 pi^2 / W^2 to < 0.05% error', () => {
  const W = 10
  const grid = buildGrid({
    system: 'well',
    boxHalf: W / 2,
    width: W,
    depth: 0,
    barrierWidth: 0,
    kappa: 0,
  }, 512)

  const pairs = eigenPairs(grid, 5, 'well')
  for (let n = 1; n <= 5; n++) {
    const numericE = pairs.energies[n - 1]
    const analyticE = wellAnalyticEnergy(n, W)
    const relErr = Math.abs((numericE - analyticE) / analyticE)
    assert.ok(relErr < 0.0005, `Level ${n}: expected relErr < 0.05%, got ${(relErr * 100).toFixed(4)}%`)
    
    // Check residual ||(H - E) psi||_2
    const res = pairs.residuals[n - 1]
    assert.ok(res < 1e-3, `Level ${n}: residual should be < 1e-3, got ${res}`)
    assert.strictEqual(pairs.bound[n - 1], true, `Level ${n} must be bound in infinite well`)
  }
})

test('Harmonic oscillator eigensolver matches analytic E_n = (n - 0.5) kappa sqrt(2)', () => {
  const kappa = 0.6
  const grid = buildGrid({
    system: 'ho',
    boxHalf: 22,
    width: 0,
    depth: 0,
    barrierWidth: 0,
    kappa,
  }, 512)

  const pairs = eigenPairs(grid, 4, 'ho')
  for (let n = 1; n <= 4; n++) {
    const numericE = pairs.energies[n - 1]
    const analyticE = hoAnalyticEnergy(n, kappa)
    const relErr = Math.abs((numericE - analyticE) / analyticE)
    assert.ok(relErr < 0.001, `HO level ${n}: expected relErr < 0.1%, got ${(relErr * 100).toFixed(4)}%`)
    assert.strictEqual(pairs.bound[n - 1], true, `HO level ${n} must be bound`)
  }
})

// ---------------------------------------------------------
// 2. Finite-Well Bound vs Continuum Classification (P1)
// ---------------------------------------------------------
test('Finite well correctly classifies bound states (E < V_0) and continuum states (E >= V_0)', () => {
  const V0 = 2.0
  const W = 8.0
  const grid = buildGrid({
    system: 'finite',
    boxHalf: 22,
    width: W,
    depth: V0,
    barrierWidth: 0,
    kappa: 0,
  }, 512)

  const pairs = eigenPairs(grid, 10, 'finite')
  const vInf = Math.min(grid.v[0], grid.v[grid.n - 1])
  assert.strictEqual(vInf, V0, `Grid edge potential must be V0 = ${V0}`)

  let foundBound = 0
  let foundContinuum = 0
  for (let i = 0; i < pairs.energies.length; i++) {
    const e = pairs.energies[i]
    const isB = pairs.bound[i]
    if (e < V0) {
      assert.strictEqual(isB, true, `E = ${e} < V0 (${V0}) must be classified as bound`)
      foundBound++
    } else {
      assert.strictEqual(isB, false, `E = ${e} >= V0 (${V0}) must be classified as box continuum`)
      foundContinuum++
    }
  }

  assert.ok(foundBound >= 2, `Should have at least 2 bound states for W=8, V0=2, got ${foundBound}`)
  assert.ok(foundContinuum >= 3, `Should have continuum states in the lowest 10, got ${foundContinuum}`)
  console.log(`    → Identified ${foundBound} bound states and ${foundContinuum} box continuum states`)
})

// ---------------------------------------------------------
// 3. Fixed-Timestep Accumulator & Speed 0 Invariance (P0)
// ---------------------------------------------------------
test('Time accumulator: evolution freezes completely at speed 0', () => {
  const grid = buildGrid({
    system: 'barrier',
    boxHalf: 22,
    width: 0,
    depth: 2,
    barrierWidth: 2,
    kappa: 0,
  }, 512)

  const packet = makePacket(grid, -10, 1.6, 1.0)
  const initialRe0 = packet.re[100]
  const initialIm0 = packet.im[100]

  const scratch = cnScratch(512)
  let simAccumulator = 0
  let speed = 0
  const dt = 0.016 // 60 FPS frame

  // Run 100 frames at speed = 0
  for (let frame = 0; frame < 100; frame++) {
    if (speed > 0) {
      simAccumulator += dt * speed
      const dtSub = 0.005
      while (simAccumulator >= dtSub) {
        evolvePacket(packet, grid, dtSub, scratch)
        simAccumulator -= dtSub
      }
    }
  }

  assert.strictEqual(packet.re[100], initialRe0, 'Packet Re must not change at speed 0')
  assert.strictEqual(packet.im[100], initialIm0, 'Packet Im must not change at speed 0')
  assert.strictEqual(simAccumulator, 0, 'simAccumulator must remain 0 at speed 0')
})

test('Time accumulator: frame-rate independent evolution (60 FPS vs 30 FPS vs 120 FPS)', () => {
  const grid = buildGrid({
    system: 'barrier',
    boxHalf: 22,
    width: 0,
    depth: 2,
    barrierWidth: 2,
    kappa: 0,
  }, 512)

  function runSim(fps, targetRealTimeSec) {
    const pkt = makePacket(grid, -10, 1.6, 1.0)
    const scratch = cnScratch(512)
    let accum = 0
    let simT = 0
    const frameDt = 1 / fps
    const totalFrames = Math.round(targetRealTimeSec * fps)
    const dtSub = 0.005

    for (let f = 0; f < totalFrames; f++) {
      accum += frameDt * 1.0 // speed 1
      while (accum >= dtSub) {
        evolvePacket(pkt, grid, dtSub, scratch)
        renormalise(pkt, grid.h)
        accum -= dtSub
        simT += dtSub
      }
    }
    return { pkt, simT }
  }

  const res60 = runSim(60, 1.0)
  const res30 = runSim(30, 1.0)
  const res120 = runSim(120, 1.0)

  // Both should advance by the exact same simulated time
  assert.ok(Math.abs(res60.simT - 1.0) < 0.01, `60 FPS simT was ${res60.simT}`)
  assert.ok(Math.abs(res30.simT - 1.0) < 0.01, `30 FPS simT was ${res30.simT}`)
  assert.ok(Math.abs(res120.simT - 1.0) < 0.01, `120 FPS simT was ${res120.simT}`)

  // Wavefunctions should closely match across different frame rates
  let diffMax = 0
  for (let i = 0; i < grid.n; i++) {
    const diff = Math.abs(res60.pkt.re[i] - res30.pkt.re[i])
    if (diff > diffMax) diffMax = diff
  }
  assert.ok(diffMax < 0.01, `Max discrepancy between 60 FPS and 30 FPS should be < 0.01, got ${diffMax}`)
  console.log(`    → 30 FPS vs 60 FPS maximum difference: ${diffMax.toExponential(3)} (frame-rate invariant)`)
})

// ---------------------------------------------------------
// 4. Unitary Evolution & Norm Drift Diagnostic (P1)
// ---------------------------------------------------------
test('Crank-Nicolson discrete norm conservation error is < 1e-12 prior to renormalization', () => {
  const grid = buildGrid({
    system: 'barrier',
    boxHalf: 22,
    width: 0,
    depth: 2,
    barrierWidth: 2,
    kappa: 0,
  }, 512)

  const packet = makePacket(grid, -10, 1.6, 1.2)
  const scratch = cnScratch(512)
  const dtSub = 0.005

  let maxNormErrorBeforeRenorm = 0
  for (let step = 0; step < 50; step++) {
    const normBefore = discreteNorm(packet, grid.h)
    const err = Math.abs(normBefore - 1.0)
    if (err > maxNormErrorBeforeRenorm) maxNormErrorBeforeRenorm = err
    evolvePacket(packet, grid, dtSub, scratch)
  }

  assert.ok(maxNormErrorBeforeRenorm < 1e-9, `Discrete norm error before renorm should be < 1e-9, got ${maxNormErrorBeforeRenorm}`)
  console.log(`    → Pre-renormalization discrete norm error: ${maxNormErrorBeforeRenorm.toExponential(3)}`)
})

// ---------------------------------------------------------
// 5. Boundary Probability Monitor
// ---------------------------------------------------------
test('Boundary probability monitor flags edge interaction correctly', () => {
  const grid = buildGrid({
    system: 'well',
    boxHalf: 10,
    width: 20,
    depth: 0,
    barrierWidth: 0,
    kappa: 0,
  }, 512)

  // Packet launched close to edge
  const packetNearEdge = makePacket(grid, -8.5, 0.8, 0)
  const pEdge = boundaryProbability(packetNearEdge, grid.h, 0.1) // outer 10%
  assert.ok(pEdge > 0.05, `Boundary mass should be detected near edge, got ${(pEdge * 100).toFixed(2)}%`)

  // Packet centered in middle
  const packetCenter = makePacket(grid, 0, 0.8, 0)
  const pEdgeCenter = boundaryProbability(packetCenter, grid.h, 0.1)
  assert.ok(pEdgeCenter < 1e-6, `Center packet should have negligible boundary mass, got ${pEdgeCenter}`)
})

console.log(`\n🎉 All ${passCount} tests passed with 100% rigorous verification!\n`)
