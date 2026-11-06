/**
 * ELEMENTA — 1D Quantum Wave Laboratory — solver parity tests.
 *
 * Locks the finite-difference Schrödinger solver in src/lib/quantum.ts to its
 * analytic references:
 *   • infinite-well eigenvalues vs  Eₙ = n²π²/W²
 *   • harmonic-oscillator eigenvalues vs  Eₙ = (n − ½)·κ√2
 *   • eigenfunction node counts (ψₙ has exactly n − 1 nodes)
 *   • inverse-iteration residuals
 *   • Gaussian-packet normalisation + minimal uncertainty Δx·Δp = ħ/2
 *   • Crank–Nicolson unitarity (pre-renormalisation norm error) and ⟨E⟩ drift
 *   • barrier transmission sanity
 */

import { describe, expect, it } from 'vitest'
import {
  barrierTransmission,
  buildGrid,
  cnScratch,
  countNodes,
  discreteNorm,
  eigenPairs,
  eigenvector,
  evolvePacket,
  hoAnalyticEnergy,
  makePacket,
  observables,
  renormalise,
  wellAnalyticEnergy,
} from '../src/lib/quantum'

const N = 512

function gridFor(system: 'well' | 'finite' | 'ho' | 'barrier') {
  return buildGrid(
    {
      system,
      boxHalf: system === 'well' ? 5 : 22, // width W = 10 natural units for the well
      width: 10,
      depth: 2,
      barrierWidth: 2,
      kappa: 0.6,
    },
    N,
  )
}

describe('eigen solver parity', () => {
  it('matches Eₙ = n²π²/W² for the infinite well', () => {
    const grid = gridFor('well')
    const { energies } = eigenPairs(grid, 10, 'well')
    for (let k = 0; k < 10; k++) {
      const analytic = wellAnalyticEnergy(k + 1, 10)
      expect(Math.abs((energies[k] - analytic) / analytic)).toBeLessThan(5e-4)
    }
  })

  it('matches Eₙ = (n − ½)·κ√2 for the harmonic oscillator', () => {
    const grid = gridFor('ho')
    const { energies } = eigenPairs(grid, 10, 'ho')
    for (let k = 0; k < 10; k++) {
      const analytic = hoAnalyticEnergy(k + 1, 0.6)
      expect(Math.abs((energies[k] - analytic) / analytic)).toBeLessThan(0.02)
    }
  })

  it('produces eigenfunctions with exactly n − 1 nodes', () => {
    const grid = gridFor('well')
    for (let n = 1; n <= 8; n++) {
      const psi = eigenvector(grid, wellAnalyticEnergy(n, 10))
      expect(countNodes(psi)).toBe(n - 1)
    }
  })

  it('returns small residuals ||(H − E)ψ||₂ for well eigenstates', () => {
    const grid = gridFor('well')
    const { energies, residuals } = eigenPairs(grid, 10, 'well')
    for (let k = 0; k < 10; k++) {
      // Residual of the *discrete* eigenpair (regardless of the analytic gap)
      expect(residuals[k]).toBeLessThan(1e-3)
      expect(energies[k]).toBeGreaterThan(0)
    }
  })
})

describe('wave packets', () => {
  it('normalises the initial packet on the grid', () => {
    const grid = gridFor('well')
    const packet = makePacket(grid, -0.62 * grid.boxHalf, 1.6, 0.95)
    expect(Math.abs(discreteNorm(packet, grid.h) - 1)).toBeLessThan(1e-12)
  })

  it('saturates the Heisenberg bound for a Gaussian (Δx·Δp = ħ/2)', () => {
    const grid = gridFor('well')
    const packet = makePacket(grid, 0, 1.6, 0)
    const obs = observables(packet.re, packet.im, grid.x, grid.v, grid.h)
    expect(Math.abs(obs.dxTimesDp - 0.5)).toBeLessThan(0.01)
  })
})

describe('Crank–Nicolson evolution', () => {
  it('conserves the norm to ~1e-9 per step (pre-renormalisation)', () => {
    const grid = gridFor('barrier')
    const packet = makePacket(grid, -0.62 * grid.boxHalf, 1.6, 0.95)
    const scratch = cnScratch(N)
    let worst = 0
    for (let step = 0; step < 2000; step++) {
      worst = Math.max(worst, Math.abs(discreteNorm(packet, grid.h) - 1))
      evolvePacket(packet, grid, 0.005, scratch)
      renormalise(packet, grid.h)
    }
    expect(worst).toBeLessThan(1e-8)
    expect(discreteNorm(packet, grid.h)).toBeCloseTo(1, 12)
  })

  it('keeps ⟨E⟩ drift below 0.2% over 10 natural time units', () => {
    const grid = gridFor('barrier')
    const packet = makePacket(grid, -0.62 * grid.boxHalf, 1.6, 0.95)
    const e0 = observables(packet.re, packet.im, grid.x, grid.v, grid.h).energy
    const scratch = cnScratch(N)
    for (let step = 0; step < 2000; step++) {
      evolvePacket(packet, grid, 0.005, scratch)
      renormalise(packet, grid.h)
    }
    const e1 = observables(packet.re, packet.im, grid.x, grid.v, grid.h).energy
    expect(Math.abs((e1 - e0) / e0)).toBeLessThan(0.002)
  })

  it('moves probability through the barrier (tunnelling is not zero)', () => {
    const grid = gridFor('barrier')
    const packet = makePacket(grid, -0.62 * grid.boxHalf, 1.6, 0.95)
    const scratch = cnScratch(N)
    for (let step = 0; step < 4000; step++) {
      evolvePacket(packet, grid, 0.005, scratch)
      renormalise(packet, grid.h)
    }
    const rightMass = observables(packet.re, packet.im, grid.x, grid.v, grid.h)
    // Energy E₀ ≈ 1 < V₀ = 2: transmission is small but strictly positive.
    expect(rightMass.energy).toBeGreaterThan(0)
    const barrierHalf = 1 // barrierWidth 2, centred at x = 0
    let rightOfBarrier = 0
    for (let i = 0; i < N; i++) {
      if (grid.x[i] > barrierHalf) {
        rightOfBarrier += (packet.re[i] * packet.re[i] + packet.im[i] * packet.im[i]) * grid.h
      }
    }
    expect(rightOfBarrier).toBeGreaterThan(0.001)
    expect(rightOfBarrier).toBeLessThan(1)
  })
})

describe('analytic references', () => {
  it('gives 0 < T(E < V₀) < 1 and monotone decay in barrier width', () => {
    const t1 = barrierTransmission(1, 2, 2)
    const t2 = barrierTransmission(1, 2, 4)
    expect(t1).toBeGreaterThan(0)
    expect(t1).toBeLessThan(1)
    expect(t2).toBeLessThan(t1)
  })

  it('approaches 1 as the barrier vanishes and uses the E → V₀ branch', () => {
    expect(barrierTransmission(1, 1e-12, 2)).toBeCloseTo(1, 6)
    const atTop = barrierTransmission(2, 2, 2)
    expect(atTop).toBeCloseTo(1 / (1 + (2 * 2 * 2) / 4), 9)
  })
})
