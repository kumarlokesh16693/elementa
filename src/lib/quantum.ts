/**
 * ELEMENTA — 1D Quantum Wave Laboratory
 * Finite-difference Schrödinger solver:
 *   • bound-state eigenvalues via Sturm-sequence bisection of the symmetric
 *     tridiagonal Hamiltonian,
 *   • eigenfunctions via inverse iteration (Thomas passes),
 *   • time evolution via the unitary Crank–Nicolson scheme (complex Thomas),
 *   • analytic references (square well, harmonic oscillator, barrier T(E)).
 * Internal units: ℏ = 1, 2m = 1  →  H = −∂² + V(x), x dimensionless.
 * Physical scale: E_real = E_dim × ħ²/(2mₑL²).
 */

export const HBAR2_2M_EV_A2 = 3.80998212 // ħ²/(2mₑ) in eV·Å² (electron)

export type SystemKey = 'well' | 'finite' | 'ho' | 'barrier'

export type SystemParams = {
  system: SystemKey
  /** box half-extent (dimensionless) — implicit ψ = 0 walls */
  boxHalf: number
  /** infinite-well width / finite-well width (dimensionless) */
  width: number
  /** finite-well depth / barrier height (dimensionless) */
  depth: number
  /** barrier width (dimensionless) */
  barrierWidth: number
  /** harmonic-oscillator curvature: V = ½κ²x² */
  kappa: number
}

export type Grid = {
  n: number
  h: number
  boxHalf: number
  x: Float64Array
  v: Float64Array
}

export function buildGrid(p: SystemParams, nPoints = 512): Grid {
  const half = p.system === 'well' ? p.width / 2 : 22
  const n = nPoints
  const h = (2 * half) / (n - 1)
  const x = new Float64Array(n)
  const v = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const xi = -half + i * h
    x[i] = xi
    let val = 0
    if (p.system === 'finite') {
      val = Math.abs(xi) <= p.width / 2 ? 0 : p.depth
    } else if (p.system === 'ho') {
      const k = p.kappa
      val = 0.5 * k * k * xi * xi
    } else if (p.system === 'barrier') {
      val = Math.abs(xi) <= p.barrierWidth / 2 ? p.depth : 0
    }
    v[i] = val
  }
  return { n, h, boxHalf: half, x, v }
}

/** Count of eigenvalues below λ (LDL pivot sign count for T − λI). */
function sturmCount(d: Float64Array, b: number, lambda: number): number {
  let count = 0
  const b2 = b * b
  let q = d[0] - lambda
  if (q < 0) count++
  for (let i = 1; i < d.length; i++) {
    if (Math.abs(q) < 1e-300) q = 1e-300
    q = d[i] - lambda - b2 / q
    if (q < 0) count++
  }
  return count
}

/** Interior Dirichlet tridiagonal (rows 1 … n−2): wall points are not unknowns. */
export function interiorTridiagonal(grid: Grid): { d: Float64Array; b: number } {
  const m = grid.n - 2
  const d = new Float64Array(m)
  const invH2 = 1 / (grid.h * grid.h)
  for (let j = 0; j < m; j++) d[j] = 2 * invH2 + grid.v[j + 1]
  return { d, b: -invH2 }
}

/** First `count` eigenvalues of the boxed Hamiltonian, ascending (NaN = absent). */
export function eigenvalues(grid: Grid, count: number): number[] {
  const { d, b } = interiorTridiagonal(grid)
  const n = d.length
  const radius = 2 * Math.abs(b)
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < n; i++) {
    if (d[i] - radius < lo) lo = d[i] - radius
    if (d[i] + radius > hi) hi = d[i] + radius
  }
  const out: number[] = []
  for (let k = 0; k < count; k++) {
    // A bracket holding the (k+1)-th eigenvalue in the boxed spectrum: every
    // state lies in [lo, hi], so this guard never trips with Gershgorin bounds;
    // kept as protection against degenerate inputs.
    if (sturmCount(d, b, hi) <= k) {
      out.push(Number.NaN)
      continue
    }
    let a = lo
    let z = hi
    for (let it = 0; it < 110; it++) {
      const m = 0.5 * (a + z)
      if (sturmCount(d, b, m) >= k + 1) z = m
      else a = m
    }
    out.push(0.5 * (a + z))
  }
  return out
}

/** Check whether an eigenvalue corresponds to a physically bound state or a box continuum state. */
export function isStateBound(energy: number, grid: Grid, system: SystemKey): boolean {
  if (!Number.isFinite(energy)) return false
  if (system === 'well' || system === 'ho') return true
  if (system === 'barrier') {
    const midIdx = Math.floor(grid.n / 2)
    const vBarrier = grid.v[midIdx]
    return energy < vBarrier - 1e-9
  }
  const vInf = Math.min(grid.v[0], grid.v[grid.n - 1])
  return energy < vInf - 1e-9
}

/** Compute numerical 2-norm residual ||(H - lambda*I) psi||_2 on the interior grid. */
export function eigenResidual(grid: Grid, lambda: number, psi: Float64Array): number {
  const n = grid.n
  const h = grid.h
  const invH2 = 1 / (h * h)
  let sumSq = 0
  for (let i = 1; i < n - 1; i++) {
    const d2psi = (psi[i + 1] - 2 * psi[i] + psi[i - 1]) * invH2
    const Hpsi = -d2psi + grid.v[i] * psi[i]
    const diff = Hpsi - lambda * psi[i]
    sumSq += diff * diff
  }
  return Math.sqrt(sumSq * h)
}

export type EigenPairsResult = {
  energies: number[]
  vectors: Float64Array[]
  bound: boolean[]
  residuals: number[]
}

/** Eigenvalues plus eigenvectors (levels 1..count) with bound-state classification and residuals. */
export function eigenPairs(
  grid: Grid,
  count: number,
  system: SystemKey = 'well',
): EigenPairsResult {
  const energies = eigenvalues(grid, count)
  const vectors: Float64Array[] = []
  const bound: boolean[] = []
  const residuals: number[] = []
  for (let k = 0; k < energies.length; k++) {
    const e = energies[k]
    const vec = Number.isFinite(e) ? eigenvector(grid, e) : new Float64Array(grid.n)
    vectors.push(vec)
    bound.push(isStateBound(e, grid, system))
    residuals.push(Number.isFinite(e) ? eigenResidual(grid, e, vec) : 0)
  }
  return { energies, vectors, bound, residuals }
}

/** One inverse-iteration pass: eigenvector of the interior Dirichlet system. */
export function eigenvector(grid: Grid, lambda: number): Float64Array {
  const n = grid.n
  const m = n - 2
  const off = -1 / (grid.h * grid.h)
  const eps = 1e-7 * Math.max(1, Math.abs(lambda))
  const diag = new Float64Array(m)
  for (let j = 0; j < m; j++) diag[j] = 2 / (grid.h * grid.h) + grid.v[j + 1] - (lambda + eps)

  const cp = new Float64Array(m) // super-diagonal multipliers
  const dp = new Float64Array(m) // transformed rhs
  let mv = diag[0]
  if (Math.abs(mv) < 1e-30) mv = mv >= 0 ? 1e-30 : -1e-30
  dp[0] = 1 / mv // rhs = e₀
  cp[0] = off / mv
  for (let i = 1; i < m; i++) {
    mv = diag[i] - off * cp[i - 1]
    if (Math.abs(mv) < 1e-30) mv = mv >= 0 ? 1e-30 : -1e-30
    cp[i] = off / mv
    dp[i] = (0 - off * dp[i - 1]) / mv
  }
  const yInt = new Float64Array(m)
  yInt[m - 1] = dp[m - 1]
  for (let i = m - 2; i >= 0; i--) yInt[i] = dp[i] - cp[i] * yInt[i + 1]

  // expand to the full grid (walls zero); normalise Σ y² h = 1; sign → peak positive
  const y = new Float64Array(n)
  for (let j = 0; j < m; j++) y[j + 1] = yInt[j]
  let s = 0
  for (let i = 0; i < n; i++) s += y[i] * y[i]
  const norm = Math.sqrt(s * grid.h)
  if (!Number.isFinite(norm) || norm === 0) return y
  for (let i = 0; i < n; i++) y[i] /= norm
  let peak = 0
  for (let i = 0; i < n; i++) if (Math.abs(y[i]) > Math.abs(y[peak])) peak = i
  if (y[peak] < 0) for (let i = 0; i < n; i++) y[i] = -y[i]
  return y
}

/** Number of sign changes (interior nodes) of an array. */
export function countNodes(psi: Float64Array): number {
  let nodes = 0
  for (let i = 1; i < psi.length; i++) {
    if (psi[i - 1] * psi[i] < 0) nodes++
  }
  return nodes
}

/* ------------------------------------------------------------------ */
/* Observables                                                         */
/* ------------------------------------------------------------------ */

export type Observables = {
  norm: number
  meanX: number
  dx: number
  meanP: number
  dp: number
  energy: number
  dxTimesDp: number
}

/** ⟨x⟩, Δx, ⟨p⟩, Δp, ⟨E⟩ of a general (possibly complex) wavefunction. */
export function observables(
  re: Float64Array,
  im: Float64Array,
  x: Float64Array,
  v: Float64Array,
  h: number,
): Observables {
  const n = re.length
  let norm = 0
  let xMean = 0
  let x2 = 0
  let pMean = 0
  let p2 = 0
  let vPart = 0
  for (let i = 1; i < n - 1; i++) {
    const rho = re[i] * re[i] + im[i] * im[i]
    norm += rho
    xMean += rho * x[i]
    x2 += rho * x[i] * x[i]
    vPart += rho * v[i]
    const dRe = (re[i + 1] - re[i - 1]) / (2 * h)
    const dIm = (im[i + 1] - im[i - 1]) / (2 * h)
    const ddRe = (re[i + 1] - 2 * re[i] + re[i - 1]) / (h * h)
    const ddIm = (im[i + 1] - 2 * im[i] + im[i - 1]) / (h * h)
    // ⟨p⟩ = ℏ·Im ∫ψ*ψ′ dx  (ℏ = 1)      ⟨p²⟩ = −ℏ²·Re ∫ψ*ψ″ dx
    pMean += re[i] * dIm - im[i] * dRe
    p2 += -(re[i] * ddRe + im[i] * ddIm)
  }
  // edge columns contribute to norms/positions only
  for (const edge of [0, n - 1]) {
    const rho = re[edge] * re[edge] + im[edge] * im[edge]
    norm += rho
    xMean += rho * x[edge]
    x2 += rho * x[edge] * x[edge]
    vPart += rho * v[edge]
  }
  norm *= h
  xMean *= h
  x2 *= h
  pMean *= h
  p2 *= h
  vPart *= h
  const dx = Math.sqrt(Math.max(0, x2 - xMean * xMean))
  const dpSq = p2 - pMean * pMean
  const dp = Math.sqrt(dpSq > 0 ? dpSq : 0)
  return {
    norm,
    meanX: xMean,
    dx,
    meanP: pMean,
    dp,
    energy: p2 + vPart,
    dxTimesDp: dx * dp,
  }
}

/** Probability mass left of / inside / right of a centred barrier of half-width a. */
export function regionProbs(
  re: Float64Array,
  im: Float64Array,
  x: Float64Array,
  halfWidth: number,
  h: number,
): { left: number; inside: number; right: number } {
  const n = re.length
  let left = 0
  let inside = 0
  let right = 0
  for (let i = 0; i < n; i++) {
    const rho = re[i] * re[i] + im[i] * im[i]
    if (x[i] < -halfWidth) left += rho * h
    else if (x[i] > halfWidth) right += rho * h
    else inside += rho * h
  }
  return { left, inside, right }
}

/* ------------------------------------------------------------------ */
/* Wave packets & Crank–Nicolson evolution                             */
/* ------------------------------------------------------------------ */

export type Packet = {
  re: Float64Array
  im: Float64Array
  x0: number
  sigma: number
  k0: number
  initialEnergy: number
}

/** Gaussian packet ψ ∝ exp(−(x−x₀)²/4σ² + i k₀ x), normalised on the grid. */
export function makePacket(grid: Grid, x0: number, sigma: number, k0: number): Packet {
  const n = grid.n
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  let s = 0
  for (let i = 0; i < n; i++) {
    const dx = grid.x[i] - x0
    const amp = Math.exp(-(dx * dx) / (4 * sigma * sigma))
    const phase = k0 * grid.x[i]
    re[i] = amp * Math.cos(phase)
    im[i] = amp * Math.sin(phase)
    s += amp * amp
  }
  const inv = 1 / Math.sqrt(s * grid.h)
  for (let i = 0; i < n; i++) {
    re[i] *= inv
    im[i] *= inv
  }
  const obs = observables(re, im, grid.x, grid.v, grid.h)
  return { re, im, x0, sigma, k0, initialEnergy: obs.energy }
}

export type CnScratch = {
  wRe: Float64Array
  wIm: Float64Array
  gRe: Float64Array
  gIm: Float64Array
}

export function cnScratch(n: number): CnScratch {
  return { wRe: new Float64Array(n), wIm: new Float64Array(n), gRe: new Float64Array(n), gIm: new Float64Array(n) }
}

/**
 * One Crank–Nicolson step for  i ψ̇ = Hψ  with ψ(±boxHalf) = 0:
 *   (I + i·c·H) ψⁿ⁺¹ = (I − i·c·H) ψⁿ,  c = dt/2.
 * Dirichlet walls: the wall values are fixed at 0, so the Thomas elimination
 * runs over the *interior* unknowns i = 1 … n−2 only (row 1 has no coupling to
 * the wall, and the wall rows are identity rows). Unitary in exact arithmetic.
 */
export function evolvePacket(packet: Packet, grid: Grid, dt: number, s: CnScratch): void {
  const n = grid.n
  const h = grid.h
  const invH2 = 1 / (h * h)
  const c = dt / 2
  const offIm = -c * invH2 // β = i·c·b, b = −1/h²  (constant, purely imaginary)
  const gb = offIm * offIm // β² = −gb (real negative) → w_i = a_i + gb/w_{i−1}
  const { wRe, wIm, gRe, gIm } = s
  const last = n - 2 // last interior unknown

  // rhs_i = (I − i·c·H)ψ = ψ + c·(Hψ)ᵢₘ − i·c·(Hψ)ᵣₑ — computed inline; the
  // stencil reads the *previous* packet, whose wall values are exactly zero.
  const rhs = (i: number): { re: number; im: number } => {
    if (i <= 0 || i >= n - 1) return { re: 0, im: 0 }
    const Hre = -((packet.re[i + 1] - 2 * packet.re[i] + packet.re[i - 1]) * invH2) + grid.v[i] * packet.re[i]
    const Him = -((packet.im[i + 1] - 2 * packet.im[i] + packet.im[i - 1]) * invH2) + grid.v[i] * packet.im[i]
    return { re: packet.re[i] + c * Him, im: packet.im[i] - c * Hre }
  }

  // First interior row: w₁ = a₁ (no sub-diagonal — wall is fixed), g₁ = rhs₁/w₁.
  {
    const r = rhs(1)
    wRe[1] = 1
    wIm[1] = c * (2 * invH2 + grid.v[1])
    const d2 = wRe[1] * wRe[1] + wIm[1] * wIm[1]
    gRe[1] = (r.re * wRe[1] + r.im * wIm[1]) / d2
    gIm[1] = (r.im * wRe[1] - r.re * wIm[1]) / d2
  }

  for (let i = 2; i <= last; i++) {
    const d2Prev = wRe[i - 1] * wRe[i - 1] + wIm[i - 1] * wIm[i - 1]
    const dPrev = d2Prev < 1e-300 ? 1e-300 : d2Prev
    // w_i = a_i + gb/w_{i−1} — complex quotient: re += gb·wRe/|w|², im −= gb·wIm/|w|²
    wRe[i] = 1 + (gb * wRe[i - 1]) / dPrev
    wIm[i] = c * (2 * invH2 + grid.v[i]) - (gb * wIm[i - 1]) / dPrev

    // g_i = (rhs_i − β·g_{i−1}) / w_i ; β·g = (−offIm·gIm, +offIm·gRe)
    const r = rhs(i)
    const bRe = r.re - (-offIm * gIm[i - 1])
    const bIm = r.im - (offIm * gRe[i - 1])
    const d2 = wRe[i] * wRe[i] + wIm[i] * wIm[i]
    const dd = d2 < 1e-300 ? 1e-300 : d2
    gRe[i] = (bRe * wRe[i] + bIm * wIm[i]) / dd
    gIm[i] = (bIm * wRe[i] - bRe * wIm[i]) / dd
  }

  // back substitution over interior unknowns: x_i = g_i − (β / w_i)·x_{i+1}
  packet.re[last] = gRe[last]
  packet.im[last] = gIm[last]
  for (let i = last - 1; i >= 1; i--) {
    const d2 = wRe[i] * wRe[i] + wIm[i] * wIm[i]
    const dd = d2 < 1e-300 ? 1e-300 : d2
    const qRe = (offIm * wIm[i]) / dd
    const qIm = (offIm * wRe[i]) / dd
    const pxRe = packet.re[i + 1]
    const pxIm = packet.im[i + 1]
    const dxRe = qRe * pxRe - qIm * pxIm
    const dxIm = qRe * pxIm + qIm * pxRe
    packet.re[i] = gRe[i] - dxRe
    packet.im[i] = gIm[i] - dxIm
  }

  // identity rows at the walls
  packet.re[0] = 0
  packet.im[0] = 0
  packet.re[n - 1] = 0
  packet.im[n - 1] = 0
}

/** Calculate discrete probability integral P = h * sum(|psi|^2) without modifying the packet. */
export function discreteNorm(packet: Packet, h: number): number {
  let s = 0
  const n = packet.re.length
  for (let i = 0; i < n; i++) s += packet.re[i] * packet.re[i] + packet.im[i] * packet.im[i]
  return s * h
}

/** Probability mass in outer fraction (default 5% on each edge) of the domain. */
export function boundaryProbability(packet: Packet, h: number, fraction = 0.05): number {
  const n = packet.re.length
  const edgeCount = Math.max(1, Math.floor(n * fraction))
  let s = 0
  for (let i = 0; i < edgeCount; i++) {
    s += packet.re[i] * packet.re[i] + packet.im[i] * packet.im[i]
  }
  for (let i = n - edgeCount; i < n; i++) {
    s += packet.re[i] * packet.re[i] + packet.im[i] * packet.im[i]
  }
  return s * h
}

/** Renormalise a packet to Σ|ψ|²h = 1 (residual = true CN unitarity error). */
export function renormalise(packet: Packet, h: number): number {
  let s = 0
  const n = packet.re.length
  for (let i = 0; i < n; i++) s += packet.re[i] * packet.re[i] + packet.im[i] * packet.im[i]
  const norm = Math.sqrt(s * h)
  if (!Number.isFinite(norm) || norm === 0) return 0
  const inv = 1 / norm
  for (let i = 0; i < n; i++) {
    packet.re[i] *= inv
    packet.im[i] *= inv
  }
  return Math.abs(norm - 1)
}

/* ------------------------------------------------------------------ */
/* Analytic references & unit conversion                               */
/* ------------------------------------------------------------------ */

/** Physics scale: eV per natural (ℏ²/2mₑ = 1) energy unit for system length L. */
export function evScale(lengthNm: number): number {
  const lA = Math.max(0.05, lengthNm * 10)
  return HBAR2_2M_EV_A2 / (lA * lA)
}

/** Infinite square well of width W (walls at ±W/2): Eₙ = π²n²/W². */
export function wellAnalyticEnergy(n: number, width: number): number {
  return (Math.PI * Math.PI * n * n) / (width * width)
}

/** Harmonic oscillator V = ½κ²x² (m = ½): ω = κ√2, Eₙ = (n − ½)·κ√2, n = 1, 2, … */
export function hoAnalyticEnergy(n: number, kappa: number): number {
  return (n - 0.5) * kappa * Math.SQRT2
}

/**
 * Rectangular barrier transmission T(E) for a barrier of FULL width W and
 * height V₀ (matched-condition derivation):
 *   T = [1 + V₀²·sinh²(κW)/(4E(V₀−E))]⁻¹        (E < V₀, κ = √(V₀−E))
 *   T = [1 + V₀²·sin²(kW)/(4E(E−V₀))]⁻¹         (E > V₀, k = √(E−V₀))
 *   T = 1/(1 + V₀W²/4)                          (E ≈ V₀)
 */
export function barrierTransmission(energy: number, v0: number, width: number): number {
  if (energy <= 0) return 0
  if (v0 <= 0 || width <= 0) return 1
  const W = width
  if (Math.abs(energy - v0) < 1e-9 * Math.max(1, Math.abs(v0))) {
    return 1 / (1 + (v0 * W * W) / 4)
  }
  if (energy < v0) {
    const k = Math.sqrt(v0 - energy)
    const sh = Math.sinh(k * W)
    return 1 / (1 + ((v0 * v0 * sh * sh) / (4 * energy * (v0 - energy))))
  }
  const k = Math.sqrt(energy - v0)
  const sn = Math.sin(k * W)
  return 1 / (1 + ((v0 * v0 * sn * sn) / (4 * energy * (energy - v0))))
}
