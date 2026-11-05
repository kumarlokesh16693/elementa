/**
 * ELEMENTA — Solid-State Band Theory
 *
 * Nearest-neighbour tight-binding models for four lattice geometries, in the
 * units a chemist actually measures: hopping t and gaps in eV, lattice
 * constants in Å, temperatures in K.
 *
 *   1D chain        E(k) = −2t cos(ka)                     one band
 *   dimerized chain E±(k) = ±√(t₁² + t₂² + 2t₁t₂ cos ka)   Peierls gap 4|δ|
 *   square lattice  E(k) = −2t (cos kₓa + cos k_y a)       one band, 8t wide
 *   honeycomb       E±(k) = ±√(|f(k)|² + Δ²)               Dirac cones at K
 *
 * with t₁ = t + δ, t₂ = t − δ and
 *
 *   |f(k)|² = t² [3 + 2cos(a kₓ) + 4cos(a kₓ/2) cos(√3 a k_y/2)]
 *
 * The honeycomb model uses the lattice constant a = √3·(C–C bond), and the
 * massless Dirac points sit at |K| = 4π/(3a). A sublattice potential Δ (hBN-
 * style) opens a 2Δ gap at those points.
 *
 * Fermi energies come from the actual filling by integrating the sampled band
 * manifold (spin included); DOS is a Gaussian-smoothed histogram normalised to
 * states per eV per unit cell. Everything below is pure arithmetic — no engine
 * dependencies.
 */

export type LatticeModel = 'chain' | 'ssh' | 'square' | 'honeycomb'

export interface BandParams {
  model: LatticeModel
  /** nearest-neighbour hopping t, eV */
  t: number
  /** lattice constant a, Å (unit-cell length; honeycomb: √3 × bond) */
  a: number
  /** dimerization δ, eV (ssh only) */
  delta: number
  /** sublattice potential Δ, eV (honeycomb only) */
  gap: number
  /** electrons per site, spin included (0–2); 1 = half filling */
  filling: number
  /** temperature, K */
  temperature: number
}

export const KB_EV = 8.617333262e-5
/** ħ²/(2mₑ) in eV·Å² */
export const HBAR2_OVER_2ME_EV_A2 = 3.80998212

export const MODEL_LABEL: Record<LatticeModel, string> = {
  chain: '1D chain',
  ssh: 'Dimerized chain',
  square: 'Square lattice',
  honeycomb: 'Honeycomb lattice',
}

export const MODEL_NOTE: Record<LatticeModel, string> = {
  chain: 'one s orbital per site · no gap',
  ssh: 'two sites per cell · Peierls instability',
  square: '2D s band · Fermi surface',
  honeycomb: 'p_z orbitals · Dirac cones at K',
}

export const SITES_PER_CELL: Record<LatticeModel, number> = {
  chain: 1,
  ssh: 2,
  square: 1,
  honeycomb: 2,
}

export const BAND_COUNT: Record<LatticeModel, number> = {
  chain: 1,
  ssh: 2,
  square: 1,
  honeycomb: 2,
}

export const LATTICE_MODELS: LatticeModel[] = ['chain', 'ssh', 'square', 'honeycomb']

export function sanitizeParams(p: BandParams): BandParams {
  const t = Math.min(4, Math.max(0.2, p.t))
  const a = Math.min(8, Math.max(1, p.a))
  const delta = Math.min(0.48 * t, Math.max(0, p.delta))
  const gap = Math.min(3, Math.max(0, p.gap))
  const filling = Math.min(2, Math.max(0, p.filling))
  const temperature = Math.min(1500, Math.max(0, p.temperature))
  return { model: p.model, t, a, delta, gap, filling, temperature }
}

/* ------------------------------------------------------------------ */
/* Dispersion                                                          */
/* ------------------------------------------------------------------ */

/**
 * Band energies at (kₓ, k_y) in eV, sorted ascending. k in Å⁻¹. One entry for
 * the chain and square lattice, two for the dimerized chain and honeycomb.
 */
export function bandEnergies(kx: number, ky: number, params: BandParams): number[] {
  const p = sanitizeParams(params)
  const { t, a } = p
  switch (p.model) {
    case 'chain':
      return [-2 * t * Math.cos(kx * a)]
    case 'ssh': {
      const t1 = t + p.delta
      const t2 = t - p.delta
      const e2 = t1 * t1 + t2 * t2 + 2 * t1 * t2 * Math.cos(kx * a)
      const e = Math.sqrt(Math.max(0, e2))
      return [-e, e]
    }
    case 'square':
      return [-2 * t * (Math.cos(kx * a) + Math.cos(ky * a))]
    case 'honeycomb': {
      const f2 =
        t * t *
        (3 + 2 * Math.cos(a * kx) + 4 * Math.cos((a * kx) / 2) * Math.cos((Math.sqrt(3) * a * ky) / 2))
      const e = Math.sqrt(Math.max(0, f2) + p.gap * p.gap)
      return [-e, e]
    }
  }
}

/** Analytic band extrema in eV. All four spectra are particle–hole symmetric. */
export function bandRange(p: BandParams): { min: number; max: number } {
  const q = sanitizeParams(p)
  if (q.model === 'square') return { min: -4 * q.t, max: 4 * q.t }
  if (q.model === 'honeycomb') {
    const top = Math.sqrt(9 * q.t * q.t + q.gap * q.gap)
    return { min: -top, max: top }
  }
  return { min: -2 * q.t, max: 2 * q.t }
}

/** Analytic gap in eV: 4|δ| for the dimerized chain, 2Δ for gapped graphene. */
export function bandGap(p: BandParams): number {
  const q = sanitizeParams(p)
  if (q.model === 'ssh') return 4 * q.delta
  if (q.model === 'honeycomb') return 2 * q.gap
  return 0
}

/* ------------------------------------------------------------------ */
/* High-symmetry paths                                                 */
/* ------------------------------------------------------------------ */

export interface KVertex {
  label: string
  kx: number
  ky: number
}

export function pathVertices(p: BandParams): KVertex[] {
  const a = sanitizeParams(p).a
  switch (sanitizeParams(p).model) {
    case 'chain':
    case 'ssh':
      return [
        { label: '−π/a', kx: -Math.PI / a, ky: 0 },
        { label: '0', kx: 0, ky: 0 },
        { label: '+π/a', kx: Math.PI / a, ky: 0 },
      ]
    case 'square':
      return [
        { label: 'Γ', kx: 0, ky: 0 },
        { label: 'X', kx: Math.PI / a, ky: 0 },
        { label: 'M', kx: Math.PI / a, ky: Math.PI / a },
        { label: 'Γ', kx: 0, ky: 0 },
      ]
    case 'honeycomb':
      return [
        { label: 'Γ', kx: 0, ky: 0 },
        { label: 'M', kx: Math.PI / a, ky: Math.PI / (Math.sqrt(3) * a) },
        { label: 'K', kx: (4 * Math.PI) / (3 * a), ky: 0 },
        { label: 'Γ', kx: 0, ky: 0 },
      ]
  }
}

export interface BandPathSample {
  /** normalised position along the path, 0–1 */
  t: number
  kx: number
  ky: number
  energies: number[]
}

export interface BandPath {
  samples: BandPathSample[]
  ticks: { t: number; label: string }[]
  vertices: { t: number; label: string }[]
}

export function sampleBandPath(p: BandParams, perSegment = 90): BandPath {
  const verts = pathVertices(p)
  const lengths: number[] = []
  let total = 0
  for (let i = 0; i < verts.length - 1; i++) {
    const dx = verts[i + 1].kx - verts[i].kx
    const dy = verts[i + 1].ky - verts[i].ky
    const len = Math.hypot(dx, dy)
    lengths.push(len)
    total += len
  }
  const scale = total > 1e-12 ? 1 / total : 1
  const samples: BandPathSample[] = []
  const vertices: { t: number; label: string }[] = []
  let acc = 0
  for (let i = 0; i < verts.length - 1; i++) {
    const v0 = verts[i]
    const v1 = verts[i + 1]
    vertices.push({ t: (acc * scale), label: v0.label })
    const n = Math.max(2, perSegment)
    const start = samples.length === 0 ? 0 : 1
    for (let j = start; j <= n; j++) {
      const f = j / n
      const kx = v0.kx + (v1.kx - v0.kx) * f
      const ky = v0.ky + (v1.ky - v0.ky) * f
      samples.push({
        t: (acc + lengths[i] * f) * scale,
        kx,
        ky,
        energies: bandEnergies(kx, ky, p),
      })
    }
    acc += lengths[i]
  }
  vertices.push({ t: 1, label: verts[verts.length - 1].label })
  return { samples, ticks: vertices, vertices }
}

/* ------------------------------------------------------------------ */
/* Brillouin zones                                                     */
/* ------------------------------------------------------------------ */

export interface KPoint2 {
  x: number
  y: number
}

/** BZ outline in k-space (Å⁻¹). Square lattice: square. Honeycomb: hexagon. */
export function bzPolygon(p: BandParams): KPoint2[] {
  const q = sanitizeParams(p)
  if (q.model === 'honeycomb') {
    const r = (4 * Math.PI) / (3 * q.a)
    const pts: KPoint2[] = []
    for (let i = 0; i < 6; i++) {
      const th = (i * Math.PI) / 3
      pts.push({ x: r * Math.cos(th), y: r * Math.sin(th) })
    }
    return pts
  }
  const k = Math.PI / q.a
  return [
    { x: -k, y: -k },
    { x: k, y: -k },
    { x: k, y: k },
    { x: -k, y: k },
  ]
}

/** Is k inside the first BZ? (Used to sample the honeycomb hexagon.) */
export function insideBZ(kx: number, ky: number, p: BandParams): boolean {
  const q = sanitizeParams(p)
  if (q.model === 'honeycomb') {
    const r = (4 * Math.PI) / (3 * q.a)
    const inradius = (r * Math.sqrt(3)) / 2
    for (let i = 0; i < 6; i++) {
      const th = Math.PI / 6 + (i * Math.PI) / 3
      if (Math.abs(kx * Math.cos(th) + ky * Math.sin(th)) > inradius + 1e-9) return false
    }
    return true
  }
  const k = Math.PI / q.a
  return Math.abs(kx) <= k + 1e-9 && Math.abs(ky) <= k + 1e-9
}

/* ------------------------------------------------------------------ */
/* Sampling, Fermi level, DOS                                          */
/* ------------------------------------------------------------------ */

interface SampleSet {
  energies: Float64Array
  sorted: Float64Array
  nK: number
  nBands: number
  sites: number
}

const GRID_2D = 128
const GRID_1D = 4800

function sampleSet(p: BandParams): SampleSet {
  const q = sanitizeParams(p)
  const nBands = BAND_COUNT[q.model]
  const sites = SITES_PER_CELL[q.model]
  const values: number[] = []

  if (q.model === 'chain' || q.model === 'ssh') {
    // Periodic grid: exactly n points, no duplicated BZ edge. The half-BZ
    // shift k → k + π/a is then an exact grid symmetry, which keeps the
    // particle–hole-symmetric Fermi level at exactly zero.
    const n = GRID_1D
    for (let i = 0; i < n; i++) {
      const kx = -Math.PI / q.a + (2 * Math.PI / q.a) * (i / n)
      const e = bandEnergies(kx, 0, q)
      for (let b = 0; b < e.length; b++) values.push(e[b])
    }
    return finish(values, n, nBands, sites)
  }

  if (q.model === 'square') {
    const n = GRID_2D
    const kMax = Math.PI / q.a
    for (let iy = 0; iy < n; iy++) {
      const ky = -kMax + (2 * kMax * iy) / n
      for (let ix = 0; ix < n; ix++) {
        const kx = -kMax + (2 * kMax * ix) / n
        values.push(bandEnergies(kx, ky, q)[0])
      }
    }
    return finish(values, n * n, nBands, sites)
  }

  // Honeycomb: sample the reciprocal primitive cell (rhombus) uniformly.
  const b = q.a / Math.sqrt(3)
  const g = (2 * Math.PI) / (3 * b)
  const g1 = { x: g, y: g * Math.sqrt(3) }
  const g2 = { x: g, y: -g * Math.sqrt(3) }
  const n = GRID_2D
  for (let iv = 0; iv < n; iv++) {
    const v = -0.5 + iv / n
    for (let iu = 0; iu < n; iu++) {
      const u = -0.5 + iu / n
      const kx = u * g1.x + v * g2.x
      const ky = u * g1.y + v * g2.y
      const e = bandEnergies(kx, ky, q)
      values.push(e[0], e[1])
    }
  }
  return finish(values, n * n, nBands, sites)
}

function finish(values: number[], nK: number, nBands: number, sites: number): SampleSet {
  const arr = Float64Array.from(values)
  const sorted = Float64Array.from(values)
  sorted.sort()
  return { energies: arr, sorted, nK, nBands, sites }
}

export interface DosCurve {
  energies: Float64Array
  dos: Float64Array
  sigma: number
  peak: number
}

function buildDos(p: BandParams, set: SampleSet): { curve: DosCurve; atEf: (ef: number) => number } {
  const range = bandRange(p)
  const span = Math.max(1e-6, range.max - range.min)
  const sigma = span / 110
  const lo = range.min - 4 * sigma
  const hi = range.max + 4 * sigma
  const bins = 320
  const width = (hi - lo) / bins
  const counts = new Float64Array(bins)
  for (let i = 0; i < set.energies.length; i++) {
    let idx = Math.floor((set.energies[i] - lo) / width)
    if (idx < 0) idx = 0
    else if (idx >= bins) idx = bins - 1
    counts[idx]++
  }
  const rad = Math.max(1, Math.ceil((3 * sigma) / width))
  const kernel = new Float64Array(2 * rad + 1)
  let ksum = 0
  for (let d = -rad; d <= rad; d++) {
    const w = Math.exp(-0.5 * Math.pow((d * width) / sigma, 2))
    kernel[d + rad] = w
    ksum += w
  }
  const dos = new Float64Array(bins)
  const energies = new Float64Array(bins)
  let peak = 0
  for (let j = 0; j < bins; j++) {
    let acc = 0
    const from = Math.max(0, j - rad)
    const to = Math.min(bins - 1, j + rad)
    for (let k = from; k <= to; k++) acc += counts[k] * kernel[k - j + rad]
    const value = (2 * acc) / (set.nK * ksum * width)
    dos[j] = value
    energies[j] = lo + (j + 0.5) * width
    if (value > peak) peak = value
  }
  const atEf = (ef: number): number => {
    if (ef <= energies[0] || ef >= energies[bins - 1]) return 0
    const pos = (ef - lo) / width - 0.5
    const i = Math.min(bins - 2, Math.max(0, Math.floor(pos)))
    const f = Math.min(1, Math.max(0, pos - i))
    return dos[i] * (1 - f) + dos[i + 1] * f
  }
  return { curve: { energies, dos, sigma, peak }, atEf }
}

/** Fermi level in eV for the current filling and temperature. */
export function fermiEnergy(p: BandParams): number {
  return analyse(p).fermi
}

function computeFermi(p: BandParams, set: SampleSet): number {
  const q = sanitizeParams(p)
  const n = set.sorted.length
  const target = q.filling * set.sites // electrons per cell, spin included
  const fraction = Math.min(1, Math.max(0, target / (2 * set.nBands)))
  const gap = bandGap(q)

  // All four spectra are particle–hole symmetric (E → −E under a half-BZ
  // shift), so exactly half filling puts E_F at the symmetry point 0.
  if (Math.abs(fraction - 0.5) < 1e-12) return 0

  if (q.temperature < 1) {
    const pos = fraction * (n - 1)
    const lo = Math.floor(pos)
    const hi = Math.min(n - 1, lo + 1)
    return 0.5 * (set.sorted[lo] + set.sorted[hi])
  }

  // Finite temperature: solve (2 / nK) Σ f(e, μ) = N_electrons_per_cell.
  const kT = KB_EV * q.temperature
  const want = (target * set.nK) / 2
  let lo = set.sorted[0] - 30 * kT
  let hi = set.sorted[n - 1] + 30 * kT
  for (let it = 0; it < 70; it++) {
    const mid = 0.5 * (lo + hi)
    let occ = 0
    for (let i = 0; i < n; i++) {
      const x = (set.sorted[i] - mid) / kT
      occ += x > 60 ? 0 : x < -60 ? 1 : 1 / (1 + Math.exp(x))
    }
    if (occ > want) hi = mid
    else lo = mid
  }
  return 0.5 * (lo + hi)
}

export interface Classification {
  kind: 'metal' | 'semimetal' | 'semiconductor' | 'insulator' | 'doped'
  label: string
  detail: string
}

export interface EffectiveMass {
  /** effective mass in electron masses (magnitude at the band edge) */
  ratio: number
  note: string
}

export interface BandAnalysis {
  params: BandParams
  nBands: number
  sites: number
  fermi: number
  gap: number
  range: { min: number; max: number }
  dos: DosCurve
  dosAtFermi: number
  classification: Classification
  mass: EffectiveMass
  /** electrons per unit cell at the current filling, spin included */
  electronsPerCell: number
}

function classify(p: BandParams, ef: number, gap: number): Classification {
  const q = sanitizeParams(p)
  if (q.filling < 0.01) {
    return { kind: 'insulator', label: 'Empty band', detail: 'No electrons in the band — the crystal is a transparent insulator.' }
  }
  if (q.filling > 1.99) {
    return { kind: 'insulator', label: 'Filled band', detail: 'Every band state occupied — a filled band cannot carry current.' }
  }
  if (gap < 1e-3) {
    if (q.model === 'honeycomb' && Math.abs(ef) < 0.03 && Math.abs(q.filling - 1) < 0.03) {
      return {
        kind: 'semimetal',
        label: 'Dirac semimetal',
        detail: 'Valence and conduction cones touch at K; carriers are massless Dirac fermions.',
      }
    }
    return {
      kind: 'metal',
      label: 'Metal',
      detail: 'A partially filled band crosses the Fermi level, so arbitrarily small fields excite carriers.',
    }
  }
  const inGap = Math.abs(ef) < gap / 2 - 1e-6
  if (!inGap) {
    return {
      kind: 'doped',
      label: 'Doped metal',
      detail: `The Fermi level sits inside a band, not the ${gap.toFixed(2)} eV gap — doping has closed the transport gap.`,
    }
  }
  if (gap < 2.5) {
    return {
      kind: 'semiconductor',
      label: 'Semiconductor',
      detail: `A ${gap.toFixed(2)} eV gap straddles E_F. Thermal excitation across it sets the carrier density.`,
    }
  }
  return {
    kind: 'insulator',
    label: 'Insulator',
    detail: `A wide ${gap.toFixed(2)} eV gap: thermal excitation at ${Math.round(q.temperature)} K is negligible (kT = ${(KB_EV * q.temperature * 1000).toFixed(1)} meV).`,
  }
}

function effectiveMass(p: BandParams): EffectiveMass {
  const q = sanitizeParams(p)
  if (q.model === 'chain' || q.model === 'square') {
    return { ratio: HBAR2_OVER_2ME_EV_A2 / (q.t * q.a * q.a), note: 'band bottom' }
  }
  if (q.model === 'ssh') {
    const d = Math.max(0.02 * q.t, q.delta)
    const ratio = (4 * d * HBAR2_OVER_2ME_EV_A2) / ((q.t * q.t - d * d) * q.a * q.a)
    return { ratio, note: 'gap edge' }
  }
  if (q.gap < 0.005) {
    return { ratio: 0, note: 'Dirac · massless' }
  }
  // Gapped Dirac cone: numeric curvature at K along K → Γ.
  const kK = (4 * Math.PI) / (3 * q.a)
  const dk = 0.005 * kK
  const e0 = bandEnergies(kK, 0, q)[1]
  const e1 = bandEnergies(kK - dk, 0, q)[1]
  const e2 = bandEnergies(kK - 2 * dk, 0, q)[1]
  const curv = (e2 - 2 * e1 + e0) / (dk * dk)
  const ratio = curv > 1e-6 ? (2 * HBAR2_OVER_2ME_EV_A2) / curv : 0
  return { ratio, note: 'K valley' }
}

let cacheKey = ''
let cacheValue: BandAnalysis | null = null

function signature(p: BandParams): string {
  return [
    p.model, p.t.toFixed(5), p.a.toFixed(5), p.delta.toFixed(5),
    p.gap.toFixed(5), p.filling.toFixed(5), p.temperature.toFixed(2),
  ].join('|')
}

/** One-shot analysis shared by the page and the custom element (cached). */
export function analyse(p: BandParams): BandAnalysis {
  const key = signature(p)
  if (cacheValue && key === cacheKey) return cacheValue
  const q = sanitizeParams(p)
  const set = sampleSet(q)
  const fermi = computeFermi(q, set)
  const gap = bandGap(q)
  const range = bandRange(q)
  const { curve, atEf } = buildDos(q, set)
  const classification = classify(q, fermi, gap)
  const mass = effectiveMass(q)
  const value: BandAnalysis = {
    params: q,
    nBands: set.nBands,
    sites: set.sites,
    fermi,
    gap,
    range,
    dos: curve,
    dosAtFermi: atEf(fermi),
    classification,
    mass,
    electronsPerCell: q.filling * set.sites,
  }
  cacheKey = key
  cacheValue = value
  return value
}

/** Fermi–Dirac occupation. */
export function occupation(E: number, ef: number, temperature: number): number {
  if (temperature < 1e-6) return E < ef ? 1 : E > ef ? 0 : 0.5
  const x = (E - ef) / (KB_EV * temperature)
  if (x > 60) return 0
  if (x < -60) return 1
  return 1 / (1 + Math.exp(x))
}

/** Interpolate the smoothed DOS (states eV⁻¹ cell⁻¹) at an arbitrary energy. */
export function dosAt(p: BandParams, E: number): number {
  const { dos } = analyse(p)
  const e = dos.energies
  if (E <= e[0] || E >= e[e.length - 1]) return 0
  const width = e[1] - e[0]
  const pos = (E - e[0]) / width
  const i = Math.min(e.length - 2, Math.max(0, Math.floor(pos)))
  const f = Math.min(1, Math.max(0, pos - i))
  return dos.dos[i] * (1 - f) + dos.dos[i + 1] * f
}

/* ------------------------------------------------------------------ */
/* Fermi-surface tracing (for the k-space inset)                       */
/* ------------------------------------------------------------------ */

export interface FermiContourPoint {
  kx: number
  ky: number
  band: number
}

/**
 * Points on the Fermi surface: |E(k) − E_F| < tol. For a 1D model the caller
 * should use a k-axis instead; this still returns the two Fermi points.
 */
export function fermiContour(p: BandParams, n = 110): FermiContourPoint[] {
  const q = sanitizeParams(p)
  const a = analyse(q)
  const ef = a.fermi
  const tol = Math.max(0.004, 0.004 * (a.range.max - a.range.min))
  const out: FermiContourPoint[] = []

  const push = (kx: number, ky: number, band: number): void => {
    const e = bandEnergies(kx, ky, q)
    if (Math.abs(e[band] - ef) < tol) out.push({ kx, ky, band })
  }

  if (q.model === 'honeycomb') {
    const r = (4 * Math.PI) / (3 * q.a)
    for (let iy = 0; iy <= n; iy++) {
      const ky = -r + (2 * r * iy) / n
      for (let ix = 0; ix <= n; ix++) {
        const kx = -r + (2 * r * ix) / n
        if (!insideBZ(kx, ky, q)) continue
        push(kx, ky, 0)
        push(kx, ky, 1)
      }
    }
  } else if (q.model === 'square') {
    const k = Math.PI / q.a
    for (let iy = 0; iy <= n; iy++) {
      const ky = -k + (2 * k * iy) / n
      for (let ix = 0; ix <= n; ix++) {
        const kx = -k + (2 * k * ix) / n
        push(kx, ky, 0)
      }
    }
  } else {
    for (let i = 0; i <= n * 4; i++) {
      const kx = -Math.PI / q.a + (2 * Math.PI / q.a) * (i / (n * 4))
      push(kx, 0, 0)
      if (BAND_COUNT[q.model] === 2) push(kx, 0, 1)
    }
  }
  return out
}
