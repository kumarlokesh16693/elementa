/**
 * ELEMENTA — 2D Bose–Einstein Condensate & Quantum Vortex Lab
 * Physics Engine: 2D Gross–Pitaevskii Equation (SSFM)
 *
 * Solves the non-linear Schrödinger equation (Gross–Pitaevskii equation):
 *   iħ ∂ψ/∂t = [ -ħ²/(2m) ∇² + V(r, t) + g|ψ|² - Ω L_z ] ψ
 *
 * In natural dimensionless units:
 *   ħ = 1, m = 1, ω_trap = 1
 *
 * Numerical Scheme:
 *   Split-Step Fourier Method (SSFM) with second-order Strang splitting:
 *     ψ(t + Δt) = exp(-i Δt/2 V_nl) · F⁻¹ [ exp(-i Δt T) · F [ exp(-i Δt/2 V_nl) · ψ(t) ] ]
 *   Ground states obtained via imaginary-time relaxation (t → -iτ).
 *   Fast 2D in-place radix-2 Cooley–Tukey FFT with pre-computed twiddle tables.
 *   Zero garbage collection inside simulation hot loops.
 */

export const N = 128
export const L = 16.0 // Spatial domain: [-L/2, L/2] = [-8.0, 8.0]
export const DX = L / N // 0.125
export const DX2 = DX * DX
export const N2 = N * N

// Pre-computed coordinate arrays
export const X_COORDS = new Float64Array(N)
export const Y_COORDS = new Float64Array(N)
for (let i = 0; i < N; i++) {
  const coord = -L / 2 + (i + 0.5) * DX
  X_COORDS[i] = coord
  Y_COORDS[i] = coord
}

// Pre-computed momentum (k-space) arrays
export const K_X = new Float64Array(N)
export const K_Y = new Float64Array(N)
for (let i = 0; i < N; i++) {
  const p = i < N / 2 ? i : i - N
  const k = (2 * Math.PI * p) / L
  K_X[i] = k
  K_Y[i] = k
}

// Pre-computed k² array for 2D kinetic propagator
export const K2_GRID = new Float64Array(N2)
for (let k = 0; k < N; k++) {
  const ky2 = K_Y[k] * K_Y[k]
  for (let j = 0; j < N; j++) {
    K2_GRID[k * N + j] = K_X[j] * K_X[j] + ky2
  }
}

// --- FFT Precomputations (Radix-2 Cooley-Tukey) ---
const BIT_REV = new Uint16Array(N)
for (let i = 0; i < N; i++) {
  let rev = 0
  for (let b = 0; b < 7; b++) {
    if ((i >> b) & 1) rev |= 1 << (6 - b)
  }
  BIT_REV[i] = rev
}

const COS_TABLE = new Float64Array(N)
const SIN_TABLE = new Float64Array(N)
for (let i = 0; i < N; i++) {
  COS_TABLE[i] = Math.cos((2 * Math.PI * i) / N)
  SIN_TABLE[i] = Math.sin((2 * Math.PI * i) / N)
}

/**
 * In-place 1D Cooley-Tukey Radix-2 FFT on contiguous row buffer.
 */
function fft1D(
  re: Float64Array,
  im: Float64Array,
  offset: number,
  inverse: boolean,
): void {
  // Bit-reversal permutation
  for (let i = 0; i < N; i++) {
    const j = BIT_REV[i]
    if (j > i) {
      const idxI = offset + i
      const idxJ = offset + j
      const tr = re[idxI]
      re[idxI] = re[idxJ]
      re[idxJ] = tr
      const ti = im[idxI]
      im[idxI] = im[idxJ]
      im[idxJ] = ti
    }
  }

  // Butterfly stages
  for (let len = 2; len <= N; len <<= 1) {
    const halfLen = len >> 1
    const step = N / len
    for (let i = 0; i < N; i += len) {
      for (let j = 0; j < halfLen; j++) {
        const k = j * step
        const wRe = COS_TABLE[k]
        const wIm = inverse ? SIN_TABLE[k] : -SIN_TABLE[k]
        const uIdx = offset + i + j
        const vIdx = uIdx + halfLen
        const uRe = re[uIdx]
        const uIm = im[uIdx]
        const vRe = re[vIdx]
        const vIm = im[vIdx]
        const tRe = vRe * wRe - vIm * wIm
        const tIm = vRe * wIm + vIm * wRe
        re[uIdx] = uRe + tRe
        im[uIdx] = uIm + tIm
        re[vIdx] = uRe - tRe
        im[vIdx] = uIm - tIm
      }
    }
  }
}

/**
 * In-place matrix transposition for row-column 2D FFT decomposition.
 */
function transpose(re: Float64Array, im: Float64Array): void {
  for (let r = 0; r < N; r++) {
    for (let c = r + 1; c < N; c++) {
      const i1 = r * N + c
      const i2 = c * N + r
      const tr = re[i1]
      re[i1] = re[i2]
      re[i2] = tr
      const ti = im[i1]
      im[i1] = im[i2]
      im[i2] = ti
    }
  }
}

/**
 * 2D In-place Fast Fourier Transform.
 * Runs 1D FFT on rows, transposes, runs on rows, transposes back.
 * Scales by 1/N² on inverse transform.
 */
export function fft2D(
  re: Float64Array,
  im: Float64Array,
  inverse: boolean,
): void {
  for (let r = 0; r < N; r++) {
    fft1D(re, im, r * N, inverse)
  }
  transpose(re, im)
  for (let r = 0; r < N; r++) {
    fft1D(re, im, r * N, inverse)
  }
  transpose(re, im)

  if (inverse) {
    const invN2 = 1 / N2
    for (let i = 0; i < N2; i++) {
      re[i] *= invN2
      im[i] *= invN2
    }
  }
}

export type TrapType = 'harmonic' | 'double-well' | 'ring' | 'toroidal'

export interface BecParams {
  g: number // Non-linear interaction strength (repulsive > 0)
  omega: number // Trap rotation frequency Ω in units of trap frequency ω
  trap: TrapType
  dt: number // Simulation timestep (default ~ 0.005)
  mu: number // Chemical potential
}

export interface BecState {
  psiRe: Float64Array // N*N real part
  psiIm: Float64Array // N*N imaginary part
  density: Float64Array // N*N |psi|²
  phase: Float64Array // N*N arg(psi) in [-π, π]
  fftRe: Float64Array // FFT workspace
  fftIm: Float64Array // FFT workspace
  time: number // Simulation time in natural units
  stepCount: number // Step counter
  stirSteps: number // Stirring pulse countdown
}

export interface VortexPoint {
  x: number
  y: number
  charge: number // +1 or -1
}

export interface BecObservables {
  norm: number
  energy: number
  Lz: number
  healingLength: number
  vortexCount: number
  peakDensity: number
  mu: number
}

/**
 * Factory for allocating a fresh BecState with pre-allocated Float64Arrays.
 */
export function createBecState(): BecState {
  return {
    psiRe: new Float64Array(N2),
    psiIm: new Float64Array(N2),
    density: new Float64Array(N2),
    phase: new Float64Array(N2),
    fftRe: new Float64Array(N2),
    fftIm: new Float64Array(N2),
    time: 0,
    stepCount: 0,
    stirSteps: 0,
  }
}

/**
 * Evaluates the external confining potential V(x, y, t) at natural time t.
 * Implements rotating asymmetric potentials when Ω > 0 or during stirring.
 */
export function evalPotential(
  x: number,
  y: number,
  t: number,
  params: BecParams,
  stirSteps = 0,
): number {
  const effectiveOmega = stirSteps > 0 ? Math.max(0.8, params.omega) : params.omega
  const theta = effectiveOmega * t
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)

  // Rotating frame coordinates
  const xr = x * cosT + y * sinT
  const yr = -x * sinT + y * cosT
  const r2 = x * x + y * y
  const r = Math.sqrt(r2)

  // Asymmetry parameter to transfer angular momentum and stir vortices
  const eps = effectiveOmega > 0 ? 0.16 * Math.min(1.0, effectiveOmega / 0.4) : 0.0

  let v = 0

  switch (params.trap) {
    case 'harmonic':
      // Elliptical rotating harmonic trap: 0.5 * [(1+ε) xr² + (1-ε) yr²]
      v = 0.5 * ((1 + eps) * xr * xr + (1 - eps) * yr * yr)
      break

    case 'double-well': {
      // Harmonic trap with a central Gaussian barrier splitting into two wells
      const vBarrier = 6.0
      const sigmaB = 0.9
      const barrier = vBarrier * Math.exp(-(xr * xr) / (2 * sigmaB * sigmaB))
      v = 0.5 * (xr * xr + yr * yr) + barrier
      break
    }

    case 'ring': {
      // Ring (Mexican-hat) trap: minimum at radius R0 = 3.5
      const r0 = 3.5
      const dr = r - r0
      v = 0.5 * (dr * dr) * 4.0
      if (eps > 0) {
        // Asymmetric pinning modulation
        v += eps * 1.5 * Math.sin(2 * Math.atan2(yr, xr))
      }
      break
    }

    case 'toroidal': {
      // Harmonic trap with an optical Gaussian repulsive plug at the center
      const plugHeight = 16.0
      const plugRadius = 1.3
      const plug = plugHeight * Math.exp(-r2 / (2 * plugRadius * plugRadius))
      v = 0.5 * r2 + plug
      if (eps > 0) {
        v += 0.5 * eps * (xr * xr - yr * yr)
      }
      break
    }
  }

  // Soft boundary absorbing barrier at domain edge to prevent periodic wrap-around
  const rEdge = 7.1
  if (r > rEdge) {
    const drEdge = r - rEdge
    v += 40.0 * drEdge * drEdge
  }

  return v
}

/**
 * Updates derived fields: density = |ψ|² and phase = arg(ψ) ∈ [-π, π].
 */
export function updateDerived(state: BecState): void {
  const re = state.psiRe
  const im = state.psiIm
  const dens = state.density
  const ph = state.phase
  for (let i = 0; i < N2; i++) {
    const r = re[i]
    const m = im[i]
    dens[i] = r * r + m * m
    ph[i] = Math.atan2(m, r)
  }
}

/**
 * Normalizes the wavefunction: ∫ |ψ|² dx dy = 1.
 */
export function normalizeState(state: BecState): number {
  const re = state.psiRe
  const im = state.psiIm
  let sum = 0
  for (let i = 0; i < N2; i++) {
    sum += re[i] * re[i] + im[i] * im[i]
  }
  const norm = sum * DX2
  if (norm <= 1e-12 || !Number.isFinite(norm)) {
    return 0
  }
  const factor = 1 / Math.sqrt(norm)
  for (let i = 0; i < N2; i++) {
    re[i] *= factor
    im[i] *= factor
  }
  return norm
}

/**
 * Seeds an initial state and relaxes it using imaginary-time evolution (t → -iτ)
 * to obtain the exact ground state of the Gross–Pitaevskii equation.
 */
export function initGroundState(
  state: BecState,
  params: BecParams,
  steps = 280,
): void {
  state.time = 0
  state.stepCount = 0
  state.stirSteps = 0

  const re = state.psiRe
  const im = state.psiIm

  // Initial seed depending on trap geometry
  for (let k = 0; k < N; k++) {
    const y = Y_COORDS[k]
    for (let j = 0; j < N; j++) {
      const x = X_COORDS[j]
      const idx = k * N + j
      const r2 = x * x + y * y
      const r = Math.sqrt(r2)

      let seed = 0
      if (params.trap === 'ring') {
        const dr = r - 3.5
        seed = Math.exp(-(dr * dr) / 1.2)
      } else if (params.trap === 'toroidal') {
        const dr = r - 2.8
        seed = Math.exp(-(dr * dr) / 1.5)
      } else if (params.trap === 'double-well') {
        // Two Gaussians in the double wells
        seed =
          Math.exp(-((x - 1.8) ** 2 + y * y) / 1.5) +
          Math.exp(-((x + 1.8) ** 2 + y * y) / 1.5)
      } else {
        // Thomas-Fermi inspired Gaussian seed
        seed = Math.exp(-r2 / 4.0)
      }

      re[idx] = seed
      im[idx] = 0
    }
  }

  normalizeState(state)

  // Imaginary time evolution
  const dtau = 0.02
  const g = params.g

  for (let step = 0; step < steps; step++) {
    // 1. Half-step coordinate decay: exp(-Δτ/2 (V + g|ψ|²))
    for (let k = 0; k < N; k++) {
      const y = Y_COORDS[k]
      for (let j = 0; j < N; j++) {
        const idx = k * N + j
        const x = X_COORDS[j]
        const v = evalPotential(x, y, 0, params)
        const dens = re[idx] * re[idx] + im[idx] * im[idx]
        const decay = Math.exp(-0.5 * dtau * (v + g * dens))
        re[idx] *= decay
        im[idx] *= decay
      }
    }

    // 2. Momentum space kinetic decay
    fft2D(re, im, false)
    for (let i = 0; i < N2; i++) {
      const decay = Math.exp(-0.5 * dtau * K2_GRID[i])
      re[i] *= decay
      im[i] *= decay
    }
    fft2D(re, im, true)

    // 3. Half-step coordinate decay
    for (let k = 0; k < N; k++) {
      const y = Y_COORDS[k]
      for (let j = 0; j < N; j++) {
        const idx = k * N + j
        const x = X_COORDS[j]
        const v = evalPotential(x, y, 0, params)
        const dens = re[idx] * re[idx] + im[idx] * im[idx]
        const decay = Math.exp(-0.5 * dtau * (v + g * dens))
        re[idx] *= decay
        im[idx] *= decay
      }
    }

    // 4. Renormalize to preserve unit norm
    normalizeState(state)
  }

  updateDerived(state)

  // Compute chemical potential μ = E_kin + E_pot + g ∫ |ψ|⁴
  const obs = computeObservables(state, params)
  params.mu = obs.mu
}

/**
 * Single real-time timestep using the Split-Step Fourier Method (SSFM).
 * Second-order Strang splitting preserves unitarity and exact norm.
 */
export function stepSSFM(state: BecState, params: BecParams): void {
  const dt = params.dt
  const g = params.g
  const t = state.time
  const re = state.psiRe
  const im = state.psiIm

  if (state.stirSteps > 0) {
    state.stirSteps--
  }

  // 1. Half-step coordinate propagator at t
  for (let k = 0; k < N; k++) {
    const y = Y_COORDS[k]
    for (let j = 0; j < N; j++) {
      const idx = k * N + j
      const x = X_COORDS[j]
      const v = evalPotential(x, y, t, params, state.stirSteps)
      const dens = re[idx] * re[idx] + im[idx] * im[idx]
      const alpha = -0.5 * dt * (v + g * dens)
      const c = Math.cos(alpha)
      const s = Math.sin(alpha)
      const r = re[idx]
      const m = im[idx]
      re[idx] = r * c - m * s
      im[idx] = r * s + m * c
    }
  }

  // 2. Forward FFT to momentum space
  fft2D(re, im, false)

  // 3. Kinetic propagator: exp(-i Δt/2 k²)
  for (let i = 0; i < N2; i++) {
    const beta = -0.5 * dt * K2_GRID[i]
    const c = Math.cos(beta)
    const s = Math.sin(beta)
    const r = re[i]
    const m = im[i]
    re[i] = r * c - m * s
    im[i] = r * s + m * c
  }

  // 4. Inverse FFT back to coordinate space
  fft2D(re, im, true)

  // 5. Half-step coordinate propagator at t + Δt
  const tNext = t + dt
  for (let k = 0; k < N; k++) {
    const y = Y_COORDS[k]
    for (let j = 0; j < N; j++) {
      const idx = k * N + j
      const x = X_COORDS[j]
      const v = evalPotential(x, y, tNext, params, state.stirSteps)
      const dens = re[idx] * re[idx] + im[idx] * im[idx]
      const alpha = -0.5 * dt * (v + g * dens)
      const c = Math.cos(alpha)
      const s = Math.sin(alpha)
      const r = re[idx]
      const m = im[idx]
      re[idx] = r * c - m * s
      im[idx] = r * s + m * c
    }
  }

  // 6. Renormalize to prevent numerical drift
  let sum = 0
  for (let i = 0; i < N2; i++) {
    sum += re[i] * re[i] + im[i] * im[i]
  }
  const norm = sum * DX2

  if (!Number.isFinite(norm) || norm <= 1e-10 || norm > 10.0) {
    // Divergence safety fallback: reset to ground state
    initGroundState(state, params, 60)
    return
  }

  const invNorm = 1 / Math.sqrt(norm)
  for (let i = 0; i < N2; i++) {
    re[i] *= invNorm
    im[i] *= invNorm
  }

  state.time = tNext
  state.stepCount++

  updateDerived(state)
}

/**
 * Imprints a quantized vortex of topological charge ±1 at coordinate (x0, y0).
 * Imparts phase winding arg[(x - x0) + i q (y - y0)] and core amplitude suppression.
 */
export function addVortex(
  state: BecState,
  x0 = 0.0,
  y0 = 0.0,
  charge = 1,
): void {
  const re = state.psiRe
  const im = state.psiIm

  // Estimate healing length for core suppression
  let maxDens = 0
  for (let i = 0; i < N2; i++) {
    if (state.density[i] > maxDens) maxDens = state.density[i]
  }
  const xi = maxDens > 1e-6 ? 1 / Math.sqrt(Math.max(1, maxDens * 5)) : 0.4

  for (let k = 0; k < N; k++) {
    const y = Y_COORDS[k]
    const dy = y - y0
    for (let j = 0; j < N; j++) {
      const idx = k * N + j
      const x = X_COORDS[j]
      const dx = x - x0
      const r = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx) * charge
      const coreProfile = Math.tanh(r / Math.max(0.2, xi))

      const c = Math.cos(angle) * coreProfile
      const s = Math.sin(angle) * coreProfile

      const r0 = re[idx]
      const m0 = im[idx]

      re[idx] = r0 * c - m0 * s
      im[idx] = r0 * s + m0 * c
    }
  }

  normalizeState(state)
  updateDerived(state)
}

/**
 * Detects quantum vortices by computing the topological phase winding number
 * around each elementary 4-cell square plaquette:
 *   W = 1/(2π) ∮ ∇θ · dr = 1/(2π) [ Δθ_01 + Δθ_12 + Δθ_23 + Δθ_30 ]
 * A winding of +1 indicates a quantized vortex, -1 an anti-vortex.
 */
export function detectVortices(state: BecState): VortexPoint[] {
  const phase = state.phase
  const density = state.density
  const vortices: VortexPoint[] = []

  let peakDens = 0
  for (let i = 0; i < N2; i++) {
    if (density[i] > peakDens) peakDens = density[i]
  }
  const densityCutoff = Math.max(1e-4, peakDens * 0.02)

  // Helper to wrap angle difference to [-π, π]
  const angleDiff = (a: number, b: number) => {
    let d = a - b
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    return d
  }

  for (let k = 0; k < N - 1; k++) {
    const y = -L / 2 + (k + 1.0) * DX
    for (let j = 0; j < N - 1; j++) {
      const idx0 = k * N + j
      const idx1 = idx0 + 1
      const idx2 = (k + 1) * N + j + 1
      const idx3 = (k + 1) * N + j

      // Ignore low-density vacuum where phase is undefined numerical noise
      const dMax = Math.max(
        density[idx0],
        density[idx1],
        density[idx2],
        density[idx3],
      )
      if (dMax < densityCutoff) continue

      const p0 = phase[idx0]
      const p1 = phase[idx1]
      const p2 = phase[idx2]
      const p3 = phase[idx3]

      const sum =
        angleDiff(p1, p0) +
        angleDiff(p2, p1) +
        angleDiff(p3, p2) +
        angleDiff(p0, p3)

      const charge = Math.round(sum / (2 * Math.PI))
      if (charge === 1 || charge === -1) {
        const x = -L / 2 + (j + 1.0) * DX
        vortices.push({ x, y, charge })
      }
    }
  }

  return vortices
}

/**
 * Computes macroscopic observables of the condensate:
 * - Norm: ∫ |ψ|² d²r
 * - Total Energy: E = E_kin + E_pot + E_int
 * - Angular Momentum: ⟨L_z⟩ = ∫ ψ* (-iħ)(x ∂_y - y ∂_x) ψ d²r
 * - Healing length: ξ = 1/√(g n₀)
 * - Chemical potential: μ = E_kin + E_pot + g ∫ |ψ|⁴ d²r
 */
export function computeObservables(
  state: BecState,
  params: BecParams,
): BecObservables {
  const re = state.psiRe
  const im = state.psiIm
  const dens = state.density

  let normSum = 0
  let maxDens = 0
  let ePotSum = 0
  let eIntSum = 0
  let lzSum = 0
  let eKinSum = 0

  const t = state.time

  for (let k = 0; k < N; k++) {
    const y = Y_COORDS[k]
    const kPrev = (k - 1 + N) % N
    const kNext = (k + 1) % N

    for (let j = 0; j < N; j++) {
      const idx = k * N + j
      const x = X_COORDS[j]
      const jPrev = (j - 1 + N) % N
      const jNext = (j + 1) % N

      const d = dens[idx]
      normSum += d
      if (d > maxDens) maxDens = d

      // Potential energy
      const v = evalPotential(x, y, t, params, state.stirSteps)
      ePotSum += v * d

      // Interaction energy (g/2 ∫ |ψ|⁴)
      eIntSum += d * d

      // Spatial derivatives for Kinetic Energy and Angular Momentum L_z
      const idxRight = k * N + jNext
      const idxLeft = k * N + jPrev
      const idxUp = kNext * N + j
      const idxDown = kPrev * N + j

      const dxRe = (re[idxRight] - re[idxLeft]) / (2 * DX)
      const dxIm = (im[idxRight] - im[idxLeft]) / (2 * DX)
      const dyRe = (re[idxUp] - re[idxDown]) / (2 * DX)
      const dyIm = (im[idxUp] - im[idxDown]) / (2 * DX)

      // Kinetic energy density: 0.5 * (|∇ψ|²)
      const grad2 = dxRe * dxRe + dxIm * dxIm + dyRe * dyRe + dyIm * dyIm
      eKinSum += 0.5 * grad2

      // L_z = x p_y - y p_x = x (-i ∂_y) - y (-i ∂_x)
      // Re[ψ* (-i ∂_y ψ)] = Re[ (re - i im)(-i (dyRe + i dyIm)) ]
      //                 = Re[ (re - i im)(dyIm - i dyRe) ] = re*dyIm - im*dyRe
      const pyPsi = re[idx] * dyIm - im[idx] * dyRe
      const pxPsi = re[idx] * dxIm - im[idx] * dxRe
      lzSum += x * pyPsi - y * pxPsi
    }
  }

  const norm = normSum * DX2
  const eKin = eKinSum * DX2
  const ePot = ePotSum * DX2
  const eInt = 0.5 * params.g * eIntSum * DX2
  const totalEnergy = eKin + ePot + eInt
  const lz = lzSum * DX2

  // Chemical potential μ = E_kin + E_pot + g ∫ |ψ|⁴
  const mu = eKin + ePot + params.g * eIntSum * DX2

  // Healing length: ξ = 1/√(g n₀) (with g > 0 and n₀ > 0)
  const healingLength =
    params.g > 0 && maxDens > 1e-6 ? 1 / Math.sqrt(params.g * maxDens) : 0

  const vortices = detectVortices(state)

  return {
    norm,
    energy: totalEnergy,
    Lz: lz,
    healingLength,
    vortexCount: vortices.length,
    peakDensity: maxDens,
    mu,
  }
}
