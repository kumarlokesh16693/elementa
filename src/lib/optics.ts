/**
 * ELEMENTA — Optics & Wave Phenomena
 *
 * Exact scalar-diffraction (Fraunhofer) physics for a screen at distance L:
 *
 *   I(θ) = sinc²(β) · [ sin(Nα) / (N sin α) ]²
 *
 * with β = π a sinθ / λ (single-slit envelope) and α = π d sinθ / λ
 * (inter-slit interference), a = slit width, d = slit separation, N = slit
 * count. Maxima of the N-slit factor sit at sinθ = mλ/d; the envelope's first
 * zero sits at sinθ = λ/a. "Single slit" is simply N = 1.
 *
 * No engine dependencies — pure arithmetic, unit-tested from the page.
 */

/** Grating / aperture configuration. Lengths in nm internally. */
export interface SlitParams {
  /** wavelength, nm */
  lambdaNm: number
  /** slit width a, µm */
  aUm: number
  /** slit separation d, µm */
  dUm: number
  /** number of slits N (≥ 1) */
  nSlits: number
}

export type OpticsSystem = 'single' | 'double' | 'grating'

export const SYSTEM_LABEL: Record<OpticsSystem, string> = {
  single: 'Single slit',
  double: 'Double slit',
  grating: 'Diffraction grating',
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

/** sinc²(x) = (sin x / x)², with the removable singularity at 0 handled. */
export function sinc2(x: number): number {
  if (Math.abs(x) < 1e-9) return 1
  const s = Math.sin(x) / x
  return s * s
}

/** Normalised Fraunhofer intensity for a given sinθ. I(0) = 1. */
export function slitIntensity(sinTheta: number, p: SlitParams): number {
  const lam = Math.max(1e-9, p.lambdaNm)
  const a = Math.max(1e-9, p.aUm * 1000) // µm → nm
  const d = Math.max(1e-9, p.dUm * 1000)
  const N = Math.max(1, Math.round(p.nSlits))

  const s = clamp(sinTheta, -1, 1)
  const beta = Math.PI * a * s / lam
  const env = sinc2(beta)
  if (N <= 1) return env

  const alpha = Math.PI * d * s / lam
  // sin(Nα)/(N sin α) → 1 as α → 0 (principal maximum)
  const den = N * Math.sin(alpha)
  const num = Math.sin(N * alpha)
  const factor = Math.abs(den) < 1e-9 ? 1 : num / den
  return env * factor * factor
}

/** Screen position (metres from the axis) → sinθ, exactly (spherical screen). */
export function sinThetaAtScreen(yMeters: number, screenDistanceM: number): number {
  const L = Math.max(1e-6, screenDistanceM)
  return yMeters / Math.sqrt(yMeters * yMeters + L * L)
}

/** Intensity at a screen position (metres from the axis). */
export function intensityAtScreen(yMeters: number, screenDistanceM: number, p: SlitParams): number {
  return slitIntensity(sinThetaAtScreen(yMeters, screenDistanceM), p)
}

/** Fringe spacing on the screen for small angles: Δy = λL/d. Returns metres. */
export function fringeSpacingM(p: SlitParams, screenDistanceM: number): number {
  const lamM = p.lambdaNm * 1e-9
  const dM = Math.max(1e-12, p.dUm * 1e-6)
  return (lamM * Math.max(1e-6, screenDistanceM)) / dM
}

/** Principal maxima that fit on the sphere: sinθ_m = mλ/d, |m| ≤ d/λ. */
export function visibleOrders(p: SlitParams, cap = 12): number[] {
  const ratio = (p.dUm * 1000) / Math.max(1e-9, p.lambdaNm)
  const mMax = Math.min(cap, Math.floor(ratio + 1e-9))
  const out: number[] = []
  for (let m = -mMax; m <= mMax; m++) out.push(m)
  return out
}

/** sinθ of the first principal maximum (λ/d); null when d < λ. */
export function firstOrderSin(p: SlitParams): number | null {
  const s = p.lambdaNm / (p.dUm * 1000)
  return s <= 1 ? s : null
}

/** sinθ of the single-slit envelope's first zero (λ/a); null when a < λ/2. */
export function envelopeZeroSin(p: SlitParams): number | null {
  const s = p.lambdaNm / (p.aUm * 1000)
  return s <= 1 ? s : null
}

/**
 * Resolving power of the grating at order m: R = mN (Rayleigh criterion), and
 * the smallest resolvable wavelength step Δλ = λ / (mN).
 */
export function resolvingPower(p: SlitParams, order = 1): number {
  return Math.max(0, Math.abs(Math.round(order)) * Math.max(1, Math.round(p.nSlits)))
}

export function rayleighDeltaLambdaNm(p: SlitParams, order = 1): number {
  const R = resolvingPower(p, order)
  return R > 0 ? p.lambdaNm / R : Number.POSITIVE_INFINITY
}

/**
 * Physical RGB for a wavelength in nm (CIE-influenced piecewise fit, gamma
 * lifted). Returns components in [0, 1]; outside 380–780 nm returns black.
 */
export function wavelengthToRgb(nm: number): [number, number, number] {
  if (!Number.isFinite(nm) || nm < 380 || nm > 780) return [0, 0, 0]
  let r = 0
  let g = 0
  let b = 0
  if (nm < 440) {
    r = -(nm - 440) / 60
    b = 1
  } else if (nm < 490) {
    g = (nm - 440) / 50
    b = 1
  } else if (nm < 510) {
    g = 1
    b = -(nm - 510) / 20
  } else if (nm < 580) {
    r = (nm - 510) / 70
    g = 1
  } else if (nm < 645) {
    r = 1
    g = -(nm - 645) / 65
  } else {
    r = 1
  }
  // luminous falloff at the extremes so 380 / 780 nm don't look neon
  let f = 1
  if (nm < 420) f = 0.35 + 0.65 * (nm - 380) / 40
  else if (nm > 700) f = 0.35 + 0.65 * (780 - nm) / 80
  const lift = 0.75
  return [Math.pow(r * f, lift), Math.pow(g * f, lift), Math.pow(b * f, lift)]
}

/** CSS rgba() string for a wavelength, with independent alpha. */
export function wavelengthCss(nm: number, alpha = 1): string {
  const [r, g, b] = wavelengthToRgb(nm)
  const c = (v: number): number => Math.round(255 * clamp(v, 0, 1))
  return `rgba(${c(r)}, ${c(g)}, ${c(b)}, ${clamp(alpha, 0, 1)})`
}

/** Coarse spectral name for labels ("green", "blue-green", …). */
export function spectralName(nm: number): string {
  if (nm < 420) return 'violet'
  if (nm < 450) return 'violet-blue'
  if (nm < 485) return 'blue'
  if (nm < 500) return 'cyan'
  if (nm < 530) return 'blue-green'
  if (nm < 565) return 'green'
  if (nm < 590) return 'yellow-green'
  if (nm < 605) return 'yellow'
  if (nm < 625) return 'orange'
  if (nm < 700) return 'red'
  return 'deep red'
}

/**
 * Number of phase samples needed to resolve the sharpest feature at a given
 * angular half-range — used by the overlay to decide its sampling density.
 */
export function sampleCountFor(p: SlitParams, sinRange: number): number {
  const period = Math.max(p.lambdaNm / (p.dUm * 1000), 1e-4) // Δsinθ between orders
  return clamp(Math.ceil((4 * sinRange) / period) + 64, 512, 8192)
}
