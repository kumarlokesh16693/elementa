/**
 * Spectra engine — exact Rydberg physics for the hydrogen-like ion X^(Z−1)+.
 *
 * Every level and transition is computed from two fundamental constants, so
 * all values are exact within the non-relativistic (Schrödinger/Rydberg)
 * model — for Z = 1 they reproduce the textbook hydrogen series. Nothing in
 * this file is empirical or invented.
 *
 *   E_n  = −R_H · Z² / n²                (eV, R_H = 13.605693 eV)
 *   ΔE   = E_u − E_l  (> 0 for emission from u → l)
 *   λ    = h·c / ΔE                      (1239.841984 eV·nm)
 *   ν    = ΔE / h                        (1 eV = 2.417989242e14 Hz)
 *   ṽ    = ΔE · 8065.543937              (cm⁻¹ per eV)
 */

export const RYDBERG_EV = 13.605693 // ionization energy of atomic hydrogen, eV
export const HC_EV_NM = 1239.841984 // Planck × speed of light, eV·nm
export const EV_TO_THZ = 241.7989242 // 1 eV ↔ 241.799 THz
export const EV_TO_CM1 = 8065.543937 // 1 eV ↔ 8065.544 cm⁻¹

export const N_MAX = 8 // levels shown in the Grotrian diagram

export interface Level {
  n: number
  E: number // eV, negative (bound state)
}

export interface Transition {
  upper: number
  lower: number
  dE: number // photon energy, eV
  lambdaNm: number // vacuum wavelength, nm
  series: number // lower level n (= series family)
}

export function levelEnergy(z: number, n: number): number {
  return -RYDBERG_EV * z * z * (1 / (n * n))
}

export function buildLevels(z: number): Level[] {
  return Array.from({ length: N_MAX }, (_, i) => {
    const n = i + 1
    return { n, E: levelEnergy(z, n) }
  })
}

export function buildTransitions(z: number): Transition[] {
  const out: Transition[] = []
  for (let u = 2; u <= N_MAX; u++) {
    for (let l = 1; l < u; l++) {
      const dE = levelEnergy(z, u) - levelEnergy(z, l)
      if (dE <= 0) continue
      out.push({
        upper: u,
        lower: l,
        dE,
        lambdaNm: HC_EV_NM / dE,
        series: l,
      })
    }
  }
  return out
}

/* ---------------- series naming (valid across the H-like isoelectronic series) ---------------- */

const SERIES_NAMES = ['Lyman', 'Balmer', 'Paschen', 'Brackett', 'Pfund', 'Humphreys']

export function seriesName(lower: number): string {
  return SERIES_NAMES[lower - 1] ?? `→ n=${lower}`
}

/** greek suffix of the α/β/… member inside its series (upper = lower + k) */
export function memberLetter(upper: number, lower: number): string {
  const greek = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ']
  return greek[upper - lower - 1] ?? `(${upper - lower})`
}

/* ---------------- spectral region classification ---------------- */

export type Region = 'gamma' | 'xray' | 'uv' | 'visible' | 'ir' | 'radio'

export function regionOf(lambdaNm: number): Region {
  if (lambdaNm < 0.01) return 'gamma'
  if (lambdaNm < 10) return 'xray'
  if (lambdaNm < 380) return 'uv'
  if (lambdaNm <= 780) return 'visible'
  if (lambdaNm <= 1e6) return 'ir'
  return 'radio'
}

export const REGION_META: Record<Region, { label: string; color: string }> = {
  gamma: { label: 'γ-ray', color: '#c084fc' },
  xray: { label: 'X-ray', color: '#38bdf8' },
  uv: { label: 'UV', color: '#818cf8' },
  visible: { label: 'visible', color: '#a3e635' },
  ir: { label: 'infrared', color: '#fb923c' },
  radio: { label: 'radio', color: '#a1a1aa' },
}

/* ---------------- wavelength → perceived colour (380–780 nm only) ---------------- */

/** returns `rgb(r,g,b)` inside the visible band, or null outside it */
export function wavelengthToRGB(lambdaNm: number): string | null {
  if (lambdaNm < 380 || lambdaNm > 780) return null
  let r = 0
  let g = 0
  let b = 0
  if (lambdaNm < 440) {
    r = -(lambdaNm - 440) / 60
    b = 1
  } else if (lambdaNm < 490) {
    g = (lambdaNm - 440) / 50
    b = 1
  } else if (lambdaNm < 510) {
    g = 1
    b = -(lambdaNm - 510) / 20
  } else if (lambdaNm < 580) {
    r = (lambdaNm - 510) / 70
    g = 1
  } else if (lambdaNm < 645) {
    r = 1
    g = -(lambdaNm - 645) / 65
  } else {
    r = 1
  }
  /* intensity falloff at the edges of perception */
  let factor = 1
  if (lambdaNm < 420) factor = 0.3 + (0.7 * (lambdaNm - 380)) / 40
  else if (lambdaNm > 700) factor = 0.3 + (0.7 * (780 - lambdaNm)) / 80
  const c = (v: number) => Math.round(255 * Math.min(1, Math.max(0, v)) * factor)
  return `rgb(${c(r)},${c(g)},${c(b)})`
}

/* ---------------- display formatting ---------------- */

export function formatEv(eV: number): string {
  const a = Math.abs(eV)
  if (a >= 1000) return `${(eV / 1000).toFixed(a >= 10000 ? 0 : 1)} keV`
  if (a >= 10) return `${eV.toFixed(1)} eV`
  return `${eV.toFixed(2)} eV`
}

export function formatLambda(lambdaNm: number): string {
  if (lambdaNm < 1) return `${(lambdaNm * 1000).toFixed(lambdaNm < 0.1 ? 1 : 0)} pm`
  if (lambdaNm < 1000) return `${lambdaNm.toFixed(lambdaNm < 10 ? 2 : lambdaNm < 100 ? 1 : 0)} nm`
  if (lambdaNm < 1e6) return `${(lambdaNm / 1000).toFixed(lambdaNm < 1e4 ? 2 : 1)} µm`
  return `${(lambdaNm / 1e6).toFixed(2)} mm`
}
