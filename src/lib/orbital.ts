/**
 * Shared quantum-mechanical orbital math for ELEMENTA.
 *
 * Hydrogenic wavefunctions ψ_nlm(r) = R_nl(r) · Y_lm(θ,φ) in atomic units
 * (a₀ = 1), scaled by a Slater effective nuclear charge Z_eff so per-element
 * orbitals contract realistically across periods. Angles use the math
 * convention (θ from +z, φ from +x toward +y); display code maps physics-z
 * to screen-up (Three.js +Y).
 *
 * Multi-electron atoms are approximated as hydrogenic with a single Z_eff
 * from the classic Slater screening rules — shapes and radial scales are
 * qualitative for heavy atoms, exact for hydrogen-like ions.
 */

const FACT: number[] = [1]
for (let i = 1; i <= 64; i++) FACT[i] = FACT[i - 1] * i

function dfact(n: number): number {
  if (n < 1) return 1
  let r = 1
  for (let i = n; i >= 1; i -= 2) r *= i
  return r
}

/** Associated Legendre P_l^m(x), m >= 0 — no Condon–Shortley phase, so the
 *  real Cartesian combinations (p_x, d_xy, …) come out positive along their
 *  label directions, matching chemistry conventions. */
export function assocLegendre(l: number, m: number, x: number): number {
  let pmm = 1
  if (m > 0) {
    const somx2 = Math.sqrt(Math.max(0, 1 - x * x))
    for (let i = 1; i <= m; i++) {
      pmm *= somx2 * dfact(2 * i - 1)
    }
  }
  if (l === m) return pmm
  let pmmp1 = x * (2 * m + 1) * pmm
  if (l === m + 1) return pmmp1
  let pll = 0
  for (let ll = m + 2; ll <= l; ll++) {
    pll = ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m)
    pmm = pmmp1
    pmmp1 = pll
  }
  return pll
}

/** Real spherical harmonic Y_lm (Condon-Shortley; m<0 → sin|m|φ) */
export function realYlm(l: number, m: number, sin: boolean, theta: number, phi: number): number {
  const am = Math.abs(m)
  const nrm =
    Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (FACT[l - am] / FACT[l + am])) *
    (am > 0 ? Math.SQRT2 : 1)
  const p = assocLegendre(l, am, Math.cos(theta))
  const azi = am === 0 ? 1 : sin ? Math.sin(am * phi) : Math.cos(am * phi)
  return nrm * p * azi
}

/** Generalized Laguerre L_k^α(x) via recurrence */
export function laguerre(k: number, alpha: number, x: number): number {
  if (k === 0) return 1
  let lm1 = 1
  let l0 = 1 + alpha - x
  if (k === 1) return l0
  let res = l0
  for (let j = 1; j < k; j++) {
    res = ((2 * j + 1 + alpha - x) * l0 - (j + alpha) * lm1) / (j + 1)
    lm1 = l0
    l0 = res
  }
  return res
}

/** Hydrogenic radial function R_nl with effective charge zEff (r in a₀) */
export function radialR(n: number, l: number, r: number, zEff = 1): number {
  const rho = (2 * zEff * r) / n
  const nrm = Math.sqrt(
    Math.pow((2 * zEff) / n, 3) * (FACT[n - l - 1] / (2 * n * FACT[n + l])),
  )
  return nrm * Math.exp(-rho / 2) * Math.pow(rho, l) * laguerre(n - l - 1, 2 * l + 1, rho)
}

/** Full wavefunction ψ_nlm at a Cartesian point (atomic units) */
export function psiAt(
  n: number,
  l: number,
  m: number,
  sin: boolean,
  zEff: number,
  x: number,
  y: number,
  z: number,
): number {
  const r2 = x * x + y * y + z * z
  const r = Math.sqrt(r2)
  if (r < 1e-9) return l === 0 ? radialR(n, 0, 0, zEff) * realYlm(0, 0, false, 0, 0) : 0
  const theta = Math.acos(Math.max(-1, Math.min(1, z / r)))
  const phi = Math.atan2(y, x)
  return radialR(n, l, r, zEff) * realYlm(l, m, sin, theta, phi)
}

/* ---------------- orbital catalogue (real Cartesian combinations) ---------------- */

export interface RealOrbital {
  n: number
  l: number
  m: number
  sin: boolean
}

export const L_LETTER = ['s', 'p', 'd', 'f', 'g'] as const

export function lLetter(l: number): string {
  return L_LETTER[l] ?? `l${l}`
}

const REAL_NAMES: Record<number, string[]> = {
  0: [''],
  1: ['z', 'x', 'y'],
  2: ['z²', 'xz', 'yz', 'x²−y²', 'xy'],
  3: ['z³', 'xz²', 'yz²', 'z(x²−y²)', 'xyz', 'x(x²−3y²)', 'y(3x²−y²)'],
  4: ['m0', 'm1c', 'm1s', 'm2c', 'm2s', 'm3c', 'm3s', 'm4c', 'm4s'],
}

export interface Combo {
  m: number
  sin: boolean
  suffix: string
}

/** All real (Cartesian) combinations of a subshell, in canonical order */
export function combosOf(l: number): Combo[] {
  const names = REAL_NAMES[l] ?? []
  const out: Combo[] = []
  let idx = 0
  for (let m = 0; m <= l; m++) {
    out.push({ m, sin: false, suffix: names[idx] ?? `m${m}c` })
    idx++
    if (m > 0) {
      out.push({ m: -m, sin: true, suffix: names[idx] ?? `m${m}s` })
      idx++
    }
  }
  return out
}

export function comboOf(l: number, m: number, sin: boolean): Combo {
  return combosOf(l).find((c) => c.m === m && c.sin === sin) ?? { m, sin, suffix: '' }
}

export function orbitalLabel(o: RealOrbital): string {
  const c = comboOf(o.l, o.m, o.sin)
  return `${o.n}${lLetter(o.l)}${c.suffix ? '_' + c.suffix : ''}`
}

/* ---------------- electron configuration parsing ---------------- */

export interface Subshell {
  n: number
  l: number
  e: number
}

const NOBLE: Record<string, string> = {
  He: '1s2',
  Ne: '1s2 2s2 2p6',
  Ar: '1s2 2s2 2p6 3s2 3p6',
  Kr: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6',
  Xe: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6',
  Rn: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 4f14 5d10 6s2 6p6',
}

const SUP_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

function desuperscript(s: string): string {
  return s.replace(/[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]/g, (c) => {
    const i = SUP_DIGITS.indexOf(c)
    return i >= 0 ? String(i) : c
  })
}

/** Parse an aufbau config string ("[Xe] 4f14 5d10 6s2 ...") into subshells */
export function parseConfig(config: string): Subshell[] {
  let s = desuperscript(config)
  for (let pass = 0; pass < 3; pass++) {
    s = s.replace(/\[(He|Ne|Ar|Kr|Xe|Rn)\]/g, (_, sym: string) => ` ${NOBLE[sym]} `)
  }
  const out: Subshell[] = []
  const re = /(\d+)([spdf])(\d+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) {
    out.push({ n: parseInt(m[1], 10), l: 'spdf'.indexOf(m[2]), e: parseInt(m[3], 10) })
  }
  return out
}

const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
}

export function subshellLabel(s: Subshell): string {
  return `${s.n}${lLetter(s.l)}${String(s.e).replace(/\d/g, (d) => SUP[d])}`
}

/** Electron count in a subshell (0 if unoccupied) */
export function occupancyOf(occupied: Subshell[], n: number, l: number): number {
  return occupied.find((s) => s.n === n && s.l === l)?.e ?? 0
}

/**
 * Representative starting orbital for an element: its highest-ℓ occupied
 * subshell (ties → highest n), shown as the m=0 real combination.
 */
export function defaultSelection(occupied: Subshell[]): RealOrbital {
  if (occupied.length === 0) return { n: 1, l: 0, m: 0, sin: false }
  let best = occupied[0]
  for (const s of occupied) {
    if (s.l > best.l || (s.l === best.l && s.n > best.n)) best = s
  }
  const c = combosOf(best.l)[0]
  return { n: best.n, l: best.l, m: c.m, sin: c.sin }
}

/* ---------------- Slater screening rules ---------------- */

/*
 * Canonical Slater group sequence: (1s)(2s2p)(3s3p)(3d)(4s4p)(4d)(4f)(5s5p)…
 * ns/np electron: 0.35 × same-group others (0.30 for 1s), 0.85 × (n−1) shell,
 * 1.00 × deeper. nd/nf electron: 0.35 × same-group others, 1.00 × all groups
 * to the left; groups to the right do not shield.
 */
const SLATER_SEQ: [number, number][] = [
  [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2], [4, 3],
  [5, 0], [5, 1], [5, 2], [5, 3], [6, 0], [6, 1], [6, 2], [7, 0], [7, 1],
]

function slaterKey(n: number, l: number): string {
  return l <= 1 ? `${n}sp` : `${n}${lLetter(l)}`
}

export function slaterZeff(
  z: number,
  target: { n: number; l: number; e: number },
  occupied: Subshell[],
): { zeff: number; sigma: number } {
  const groups = new Map<string, { order: number; n: number; e: number }>()
  SLATER_SEQ.forEach(([n, l], i) => groups.set(slaterKey(n, l), { order: i, n, e: 0 }))
  for (const s of occupied) {
    const g = groups.get(slaterKey(s.n, s.l))
    if (g) g.e += s.e
  }
  const tKey = slaterKey(target.n, target.l)
  const tGroup = groups.get(tKey)
  if (!tGroup) return { zeff: z, sigma: 0 }

  let sigma = 0
  for (const g of groups.values()) {
    if (g.order === tGroup.order) {
      /* one target electron; the rest of the group shields it */
      const others = target.e > 0 ? Math.max(0, g.e - 1) : g.e
      sigma += others * (target.n === 1 ? 0.3 : 0.35)
      continue
    }
    if (g.order > tGroup.order) continue
    if (target.l <= 1) {
      if (g.n === target.n - 1) sigma += g.e * 0.85
      else if (g.n <= target.n - 2) sigma += g.e * 1.0
    } else {
      sigma += g.e * 1.0
    }
  }
  return { zeff: Math.max(1, z - sigma), sigma: Math.round(sigma * 100) / 100 }
}

/* ---------------- radial statistics ---------------- */

export interface RadialStats {
  /** sampled arrays over [0, rMax] (P normalised to max 1, R to max |R|) */
  rs: Float64Array
  P: Float64Array
  R: Float64Array
  rMax: number
  /** most probable radius (argmax of r²R²) */
  rMp: number
  /** expectation value ⟨r⟩ = (3n² − l(l+1)) / 2Z_eff */
  rMean: number
  /** radial node radii (roots of R, r > 0) */
  nodes: number[]
  nRadialNodes: number
  nAngularNodes: number
}

export function radialStats(n: number, l: number, zEff: number, bins = 600): RadialStats {
  const outer = (10 + 9 * n) / zEff
  const probe = Math.min(2048, bins * 3)
  const dr0 = outer / probe
  let pPeak = 0
  let rPeak = 0
  let acc = 0
  const cdf = new Float64Array(probe)
  for (let i = 0; i < probe; i++) {
    const r = (i + 0.5) * dr0
    const Rv = radialR(n, l, r, zEff)
    const p = r * r * Rv * Rv
    acc += p * dr0
    cdf[i] = acc
    if (p > pPeak) {
      pPeak = p
      rPeak = r
    }
  }
  // shrink to where the tail carries ~0.3% of probability past the peak
  let rCut = outer
  for (let i = Math.floor((rPeak / outer) * probe); i < probe; i++) {
    if (cdf[i] > 0.997 * acc) {
      rCut = Math.min(outer, (i + 1) * dr0)
      break
    }
  }
  const rMax = Math.max(0.5 / zEff, rCut * 1.05)

  const rs = new Float64Array(bins)
  const P = new Float64Array(bins)
  const R = new Float64Array(bins)
  const dr = rMax / bins
  let pMax = 0
  let rAbsMax = 0
  let rMp = 0
  for (let i = 0; i < bins; i++) {
    const r = (i + 0.5) * dr
    const Rv = radialR(n, l, r, zEff)
    const p = r * r * Rv * Rv
    rs[i] = r
    P[i] = p
    R[i] = Rv
    if (p > pMax) {
      pMax = p
      rMp = r
    }
    if (Math.abs(Rv) > rAbsMax) rAbsMax = Math.abs(Rv)
  }
  for (let i = 0; i < bins; i++) {
    P[i] /= pMax || 1
    R[i] /= rAbsMax || 1
  }
  // radial nodes = sign changes of R
  const nodes: number[] = []
  for (let i = 1; i < bins; i++) {
    if (R[i - 1] !== 0 && R[i] !== 0 && R[i - 1] * R[i] < 0) {
      const t = Math.abs(R[i - 1]) / (Math.abs(R[i - 1]) + Math.abs(R[i]))
      nodes.push(rs[i - 1] + t * dr)
    }
  }
  return {
    rs,
    P,
    R,
    rMax,
    rMp,
    rMean: ((3 * n * n - l * (l + 1)) / (2 * zEff)),
    nodes,
    nRadialNodes: n - l - 1,
    nAngularNodes: l,
  }
}

/**
 * Box half-size that encloses ~99.7 % of the radial probability — used as the
 * 3D grid extent and plot range.
 */
export function orbitalExtent(n: number, l: number, zEff: number): number {
  const outer = (10 + 9 * n) / zEff
  const probe = 1024
  const dr = outer / probe
  let acc = 0
  const cdf = new Float64Array(probe)
  for (let i = 0; i < probe; i++) {
    const r = (i + 0.5) * dr
    const Rv = radialR(n, l, r, zEff)
    acc += r * r * Rv * Rv * dr
    cdf[i] = acc
  }
  for (let i = 0; i < probe; i++) {
    if (cdf[i] > 0.997 * acc) return Math.min(140, Math.max(0.06, (i + 1) * dr * 1.06))
  }
  return Math.min(140, outer)
}

/**
 * Power-graded symmetric axis for isosurface grids: dense near the nucleus,
 * coarse at the tail. x_i = L · sign(s)|s|^1.35 with s = −1…1.
 */
export function gradedAxis(nPoints: number, L: number): Float64Array {
  const a = new Float64Array(nPoints)
  const p = 1.35
  for (let i = 0; i < nPoints; i++) {
    const s = (2 * i) / (nPoints - 1) - 1
    a[i] = L * Math.sign(s) * Math.pow(Math.abs(s), p)
  }
  return a
}
