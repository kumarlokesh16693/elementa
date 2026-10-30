// Segrè chart data layer — parses the IAEA LiveChart ground-state dataset (ENSDF-based,
// extraction 2023-10-18) and provides decay taxonomy, Q-value physics, daughter nuclide
// computation and display formatters. Row encoding documented in nuclide-data.ts.

import { NUCLIDE_RAW } from './nuclide-data'
import { ELEMENTS } from './index'

/* ---------------- types ---------------- */

export interface DecayMode {
  code: string
  pct: number | null
}

export interface Nuclide {
  z: number
  n: number
  a: number
  sym: string
  /** half-life in seconds; null for stable / unknown / unbound (see flags) */
  hlSec: number | null
  /** experimental bound operator for half-life ('<' / '>') */
  hlOp: '' | '<' | '>'
  stable: boolean
  unbound: boolean
  hlKnown: boolean
  /** raw token from dataset ('S', '-1', '-2', '1.41e+17', '<1.2e19' …) */
  hlRaw: string
  decays: DecayMode[]
  jp: string
  /** natural abundance in % (stable isotopes only) */
  abundance: number | null
  /** atomic mass excess in keV */
  me: number | null
  discovery: number | null
}

export type NuCatKey =
  | 'stable'
  | 'bminus'
  | 'bec'
  | 'alpha'
  | 'sf'
  | 'p'
  | 'n'
  | 'd2b'
  | 'cluster'
  | 'it'
  | 'unbound'
  | 'unknown'

export interface CatInfo {
  key: NuCatKey
  label: string
  color: string
}

/* ---------------- parse ---------------- */

const SYMS: string[] = ['n', ...ELEMENTS.map((e) => e.symbol)]

export const NUCLEI: Nuclide[] = NUCLIDE_RAW.trim()
  .split('\n')
  .map((line) => {
    const f = line.split('|')
    const z = parseInt(f[0], 10)
    const n = parseInt(f[1], 10)
    const hlRaw = f[2]
    let hlSec: number | null = null
    let hlOp: '' | '<' | '>' = ''
    let stable = false
    let unbound = false
    if (hlRaw === 'S') stable = true
    else if (hlRaw === '-1') {
      /* unknown */
    } else if (hlRaw === '-2') unbound = true
    else {
      if (hlRaw.startsWith('<')) hlOp = '<'
      else if (hlRaw.startsWith('>')) hlOp = '>'
      hlSec = parseFloat(hlOp ? hlRaw.slice(1) : hlRaw)
      if (!Number.isFinite(hlSec)) {
        hlSec = null
        hlOp = ''
      }
    }
    const decays: DecayMode[] = []
    for (const d of f.slice(3, 6)) {
      if (!d) continue
      const ci = d.indexOf(':')
      decays.push(
        ci === -1
          ? { code: d, pct: null }
          : { code: d.slice(0, ci), pct: parseFloat(d.slice(ci + 1)) },
      )
    }
    const ab = f[7] ? parseFloat(f[7]) : null
    const me = f[8] ? parseFloat(f[8]) : null
    return {
      z,
      n,
      a: z + n,
      sym: SYMS[z] ?? `E${z}`,
      hlSec,
      hlOp,
      stable,
      unbound,
      hlKnown: stable || hlSec != null,
      hlRaw,
      decays,
      jp: f[6],
      abundance: ab != null && Number.isFinite(ab) ? ab : null,
      me: me != null && Number.isFinite(me) ? me : null,
      discovery: f[9] ? parseInt(f[9], 10) : null,
    }
  })

export const NUC_MAP = new Map<string, Nuclide>()
for (const nu of NUCLEI) NUC_MAP.set(`${nu.z}:${nu.n}`, nu)

export function nucAt(z: number, n: number): Nuclide | undefined {
  return NUC_MAP.get(`${z}:${n}`)
}

export const N_MAX = NUCLEI.reduce((m, x) => Math.max(m, x.n), 0)
export const Z_MAX = NUCLEI.reduce((m, x) => Math.max(m, x.z), 0)
export const STABLE_COUNT = NUCLEI.filter((x) => x.stable).length

/* ---------------- decay taxonomy ---------------- */

const BUCKET: Record<string, NuCatKey> = {
  'B-': 'bminus',
  'B-N': 'bminus',
  'B-2N': 'bminus',
  'B-3N': 'bminus',
  'B-4N': 'bminus',
  'B-5N': 'bminus',
  'B-6N': 'bminus',
  'B-7N': 'bminus',
  'B-A': 'bminus',
  'B-P': 'bminus',
  'B-SF': 'bminus',
  'EC': 'bec',
  'B+': 'bec',
  'EC+B+': 'bec',
  'ECP': 'bec',
  'EC2P': 'bec',
  'B+P': 'bec',
  'B+2P': 'bec',
  'ECA': 'bec',
  'B+A': 'bec',
  'ECSF': 'bec',
  'A': 'alpha',
  'SF': 'sf',
  'SF+EC+B+': 'sf',
  'P': 'p',
  '2P': 'p',
  'N': 'n',
  '2N': 'n',
  '2B-': 'd2b',
  '2EC': 'd2b',
  '2B+': 'd2b',
  '14C': 'cluster',
  '22NE': 'cluster',
  '{+22}NE': 'cluster',
  '24NE': 'cluster',
  '{+24}NE': 'cluster',
  '{+25}NE': 'cluster',
  '34SI': 'cluster',
  '{+34}SI': 'cluster',
  'MG': 'cluster',
  'IT': 'it',
}

export function catOf(nu: Nuclide): NuCatKey {
  if (nu.stable) return 'stable'
  if (nu.unbound) return 'unbound'
  const first = nu.decays[0]
  if (first) return BUCKET[first.code] ?? 'unknown'
  return 'unknown'
}

export const CATS: CatInfo[] = [
  { key: 'stable', label: 'Stable', color: '#f4efe4' },
  { key: 'bminus', label: 'β⁻ decay', color: '#38bdf8' },
  { key: 'bec', label: 'β⁺ / EC decay', color: '#fb923c' },
  { key: 'alpha', label: 'α decay', color: '#fde047' },
  { key: 'sf', label: 'Spontaneous fission', color: '#4ade80' },
  { key: 'p', label: 'Proton emission', color: '#f472b6' },
  { key: 'n', label: 'Neutron emission', color: '#a78bfa' },
  { key: 'd2b', label: 'Double β decay', color: '#2dd4bf' },
  { key: 'cluster', label: 'Cluster decay', color: '#e879f9' },
  { key: 'it', label: 'Isomeric transition', color: '#94a3b8' },
  { key: 'unbound', label: 'Unbound resonance', color: '#4a4a52' },
  { key: 'unknown', label: 'Decay not observed', color: '#2a2a31' },
]

const CAT_COLOR: Record<NuCatKey, string> = Object.fromEntries(
  CATS.map((c) => [c.key, c.color]),
) as Record<NuCatKey, string>

export function catColor(k: NuCatKey): string {
  return CAT_COLOR[k]
}

/** category bucket of a raw decay code (for coloring arrows/labels) */
export function codeCat(code: string): NuCatKey {
  return BUCKET[code] ?? 'unknown'
}

/** element symbol by Z ('n' for the free neutron row) */
export function symOf(z: number): string {
  return SYMS[z] ?? `E${z}`
}

/* ---------------- decay code display ---------------- */

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
export function supNum(v: number | string): string {
  return String(v)
    .split('')
    .map((c) => (c >= '0' && c <= '9' ? SUP[+c] : c === '-' ? '⁻' : c))
    .join('')
}

const CODE_LABEL: Record<string, string> = {
  'B-': 'β⁻',
  'EC': 'EC',
  'B+': 'β⁺',
  'EC+B+': 'β⁺/EC',
  'A': 'α',
  'SF': 'SF',
  'IT': 'IT',
  'P': 'p',
  '2P': '2p',
  'N': 'n',
  '2N': '2n',
  '2B-': '2β⁻',
  '2EC': '2EC',
  '2B+': '2β⁺',
  'ECP': 'EC p',
  'EC2P': 'EC 2p',
  'B+P': 'β⁺ p',
  'B+2P': 'β⁺ 2p',
  'ECA': 'EC α',
  'B+A': 'β⁺ α',
  'B-A': 'β⁻ α',
  'B-P': 'β⁻ p',
  'B-SF': 'β⁻ SF',
  'ECSF': 'EC SF',
  'SF+EC+B+': 'SF/β⁺',
  '14C': '¹⁴C',
  '22NE': '²²Ne',
  '24NE': '²⁴Ne',
  '{+22}NE': '²²Ne',
  '{+24}NE': '²⁴Ne',
  '{+25}NE': '²⁵Ne',
  '34SI': '³⁴Si',
  '{+34}SI': '³⁴Si',
  'MG': '³²Mg',
}

export function decayLabel(code: string): string {
  const known = CODE_LABEL[code]
  if (known) return known
  let m = code.match(/^B-(\d+)N$/)
  if (m) return `β⁻ ${m[1]}n`
  m = code.match(/^EC(\d+)P$/)
  if (m) return `EC ${m[1]}p`
  m = code.match(/^B\+(\d+)P$/)
  if (m) return `β⁺ ${m[1]}p`
  m = code.match(/^\{\+(\d+)\}([A-Z][A-Z]?)$/)
  if (m) return `${supNum(m[1])}${m[2][0]}${m[2].slice(1).toLowerCase()}`
  m = code.match(/^(\d+)([A-Z][A-Z]?)$/)
  if (m) return `${supNum(m[1])}${m[2][0]}${m[2].slice(1).toLowerCase()}`
  return code
}

/* ---------------- half-life formatting ---------------- */

const UNIT_STEPS: [number, string][] = [
  [1e-12, 'ps'],
  [1e-9, 'ns'],
  [1e-6, 'µs'],
  [1e-3, 'ms'],
  [1, 's'],
  [60, 'min'],
  [3600, 'h'],
  [86400, 'd'],
  [3.156e7, 'y'],
  [3.156e10, 'ky'],
  [3.156e13, 'My'],
  [3.156e16, 'Gy'],
  [3.156e19, 'Ty'],
  [3.156e22, 'Py'],
  [3.156e25, 'Ey'],
]

function sig3(v: number): string {
  if (v >= 100) return v.toFixed(0)
  if (v >= 10) return v.toFixed(1)
  return v.toFixed(2)
}

/** '10.2 min', '4.47 Gy', 'unbound', 'not measured', '< 1.2×10¹⁹ y' */
export function formatHl(nu: Nuclide): string {
  if (nu.stable) return 'stable'
  if (nu.unbound) return 'unbound'
  if (nu.hlSec == null) return 'not measured'
  const s = nu.hlSec
  const pretty = (v: number, u: string) => `${sig3(v)} ${u}`
  let text: string
  if (s < 1e-12) text = pretty(s * 1e12, 'ps')
  else if (s > 3.156e28) text = pretty(s / 3.156e25, 'Ey')
  else {
    let matched = false
    for (let i = UNIT_STEPS.length - 1; i >= 0 && !matched; i--) {
      const [k, u] = UNIT_STEPS[i]
      if (s >= k) {
        text = pretty(s / k, u)
        matched = true
      }
    }
    if (!matched) text = pretty(s * 1e12, 'ps')
  }
  const op = nu.hlOp === '<' ? '< ' : nu.hlOp === '>' ? '> ' : ''
  return op + text
}

/** raw seconds in scientific notation with unicode superscript exponent */
export function formatHlSci(nu: Nuclide): string | null {
  if (nu.hlSec == null || nu.stable) return null
  const e = Math.floor(Math.log10(Math.abs(nu.hlSec)))
  const mant = nu.hlSec / 10 ** e
  const op = nu.hlOp
  return `${op}${mant.toFixed(2)}×10${supNum(e)} s`
}

/* ---------------- mass & Q values ---------------- */

const KEV_PER_U = 931494.019
const ME_ALPHA = 2424.915
const ME_P = 7288.971
const ME_N = 8071.318

export function atomicMassU(nu: Nuclide): number | null {
  if (nu.me == null) return null
  return nu.a + nu.me / KEV_PER_U
}

/** mass excess of an emitted cluster, looked up from the dataset itself */
function meOf(z: number, n: number): number | null {
  return nucAt(z, n)?.me ?? null
}

const CLUSTER_EMIT: Record<string, [number, number]> = {
  // code -> [z, A] of emitted cluster
  '14C': [6, 14],
  '22NE': [10, 22],
  '24NE': [10, 24],
  '{+22}NE': [10, 22],
  '{+24}NE': [10, 24],
  '{+25}NE': [10, 25],
  '34SI': [14, 34],
  '{+34}SI': [14, 34],
  'MG': [12, 32],
}

/** Q value in keV for a given decay code, computed from atomic mass excesses */
export function qFor(nu: Nuclide, code: string): number | null {
  if (nu.me == null) return null
  const { z, n } = nu
  const sub = (dz: number, dn: number, meEmit = 0): number | null => {
    const d = meOf(z + dz, n + dn)
    return d == null ? null : nu.me - d - meEmit
  }
  switch (code) {
    case 'B-':
      return sub(1, -1)
    case 'B-N':
    case 'B-2N':
    case 'B-3N':
    case 'B-4N':
    case 'B-5N':
    case 'B-6N':
    case 'B-7N':
    case 'B-A':
    case 'B-P':
      return sub(1, -1) // β⁻ Q value; subsequent emission comes from excitation energy
    case 'B-SF':
      return null
    case 'EC':
    case 'EC+B+':
      return sub(-1, 1)
    case 'B+':
      return sub(-1, 1, 1022)
    case 'A':
      return sub(-2, -2, ME_ALPHA)
    case 'P':
      return sub(-1, 0, ME_P)
    case '2P':
      return sub(-1, 0, ME_P) // first proton Q; 2p is a sequential/3-body process
    case 'N':
      return sub(0, -1, ME_N)
    case '2N':
      return sub(0, -1, ME_N)
    case '2B-':
      return sub(2, -2)
    case '2EC':
      return sub(-2, 2)
    case '2B+':
      return sub(-2, 2, 2044)
    default: {
      const cl = CLUSTER_EMIT[code]
      if (cl) {
        const [cz, ca] = cl
        const d = meOf(z - cz, n - (ca - cz))
        const e = meOf(cz, ca - cz)
        if (d == null || e == null) return null
        return nu.me - d - e
      }
      return null
    }
  }
}

/* ---------------- daughters & chains ---------------- */

const DELTA: Record<string, [number, number] | null> = {
  'B-': [1, -1],
  'B-N': [1, -2],
  'B-2N': [1, -3],
  'B-3N': [1, -4],
  'B-4N': [1, -5],
  'B-5N': [1, -6],
  'B-6N': [1, -7],
  'B-7N': [1, -8],
  'B-A': [-1, -3],
  'B-P': [0, -1],
  'B-SF': null,
  'EC': [-1, 1],
  'B+': [-1, 1],
  'EC+B+': [-1, 1],
  'ECP': [-2, 1],
  'EC2P': [-3, 1],
  'B+P': [-2, 1],
  'B+2P': [-3, 1],
  'ECA': [-3, -1],
  'B+A': [-3, -1],
  'ECSF': null,
  'A': [-2, -2],
  'SF': null,
  'SF+EC+B+': null,
  'P': [-1, 0],
  '2P': [-2, 0],
  'N': [0, -1],
  '2N': [0, -2],
  'IT': [0, 0],
  '2B-': [2, -2],
  '2EC': [-2, 2],
  '2B+': [-2, 2],
}

export interface Daughter {
  nuclide: Nuclide
  code: string
  label: string
}

export function daughtersOf(nu: Nuclide): Daughter[] {
  const out: Daughter[] = []
  const seen = new Set<string>()
  for (const d of nu.decays) {
    let delta: [number, number] | null = DELTA[d.code] ?? null
    if (!delta && !d.code.startsWith('SF')) {
      const cl = CLUSTER_EMIT[d.code]
      if (cl) delta = [-cl[0], -(cl[1] - cl[0])]
    }
    if (!delta) continue
    const [dz, dn] = delta
    const key = `${dz}:${dn}`
    if (seen.has(key)) continue
    seen.add(key)
    const daughter = nucAt(nu.z + dz, nu.n + dn)
    if (daughter && !(dz === 0 && dn === 0)) {
      out.push({ nuclide: daughter, code: d.code, label: decayLabel(d.code) })
    }
  }
  return out
}

/** follow the dominant decay mode down to stability (max 24 steps) */
export function chainOf(start: Nuclide): Nuclide[] {
  const chain: Nuclide[] = [start]
  const seen = new Set<string>([`${start.z}:${start.n}`])
  let cur = start
  for (let i = 0; i < 24; i++) {
    if (cur.stable || cur.unbound) break
    const first = cur.decays[0]
    if (!first) break
    let delta: [number, number] | null = DELTA[first.code] ?? null
    if (!delta) {
      const cl = CLUSTER_EMIT[first.code]
      if (cl) delta = [-cl[0], -(cl[1] - cl[0])]
    }
    if (!delta) break
    const next = nucAt(cur.z + delta[0], cur.n + delta[1])
    if (!next || seen.has(`${next.z}:${next.n}`)) break
    seen.add(`${next.z}:${next.n}`)
    chain.push(next)
    cur = next
  }
  return chain
}

/* ---------------- half-life heat color ---------------- */

const VIRIDIS: [number, number, number][] = [
  [68, 1, 84],
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [109, 205, 89],
  [180, 222, 44],
  [253, 231, 37],
]

/** log₁₀ half-life in s mapped to viridis; unbounded ends get flat colors */
export function hlColor(nu: Nuclide): string {
  if (nu.stable) return '#b5d979'
  if (!nu.hlSec) return nu.unbound ? '#3a3a42' : '#232329'
  const t = Math.min(1, Math.max(0, (Math.log10(nu.hlSec) + 22) / 46))
  const x = t * (VIRIDIS.length - 1)
  const i = Math.min(VIRIDIS.length - 2, Math.floor(x))
  const f = x - i
  const c0 = VIRIDIS[i]
  const c1 = VIRIDIS[i + 1]
  const r = Math.round(c0[0] + (c1[0] - c0[0]) * f)
  const g = Math.round(c0[1] + (c1[1] - c0[1]) * f)
  const b = Math.round(c0[2] + (c1[2] - c0[2]) * f)
  return `rgb(${r},${g},${b})`
}

export function cellColor(nu: Nuclide, mode: 'decay' | 'hl'): string {
  return mode === 'decay' ? catColor(catOf(nu)) : hlColor(nu)
}
