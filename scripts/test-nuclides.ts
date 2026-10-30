// Sanity tests for the Segrè data layer (run: bun scripts/test-nuclides.ts)
import {
  NUCLEI, STABLE_COUNT, N_MAX, Z_MAX, nucAt, formatHl, formatHlSci, atomicMassU,
  qFor, daughtersOf, chainOf, catOf, catColor, decayLabel, hlColor, cellColor,
} from '../src/lib/periodic/nuclides'

let fail = 0
function check(name: string, cond: boolean, info?: unknown) {
  if (!cond) fail++
  console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : '->', info)
}

console.log('total', NUCLEI.length, 'stable', STABLE_COUNT, 'Nmax', N_MAX, 'Zmax', Z_MAX)
check('counts', NUCLEI.length === 3384 && STABLE_COUNT === 244 && N_MAX === 178 && Z_MAX === 118)

const u238 = nucAt(92, 146)!
check('U-238 hl 4.47 Gy', formatHl(u238) === '4.47 Gy', formatHl(u238))
check('U-238 alpha Q≈4269.8 keV', Math.abs((qFor(u238, 'A') ?? 0) - 4269.8) < 10, qFor(u238, 'A'))
check('U-238 SF branch', u238.decays.some((d) => d.code === 'SF' && Math.abs((d.pct ?? 0) - 5.45e-5) < 1e-6), u238.decays)

const chain = chainOf(u238)
check('U-238 chain ends at Pb-206 stable', chain[chain.length - 1].z === 82 && chain[chain.length - 1].n === 124 && chain[chain.length - 1].stable, chain.map((c) => `${c.sym}-${c.a}`))
console.log('  chain:', chain.map((c) => `${c.sym}-${c.a}`).join(' → '))

const c14 = nucAt(6, 8)!
check('C-14 hl 5.70 ky', formatHl(c14) === '5.70 ky', formatHl(c14))
check('C-14 Q(β⁻)≈156 keV', Math.abs((qFor(c14, 'B-') ?? 0) - 156) < 6, qFor(c14, 'B-'))
check('C-14 sci', formatHlSci(c14) === '1.80×10¹¹ s', formatHlSci(c14))

const fe56 = nucAt(26, 30)!
check('Fe-56 stable + mass 55.9349 u', fe56.stable && Math.abs((atomicMassU(fe56) ?? 0) - 55.934935) < 1e-4, atomicMassU(fe56))
check('Fe-56 abundance', fe56.abundance === 91.75, fe56.abundance)

const bi212 = nucAt(83, 129)!
const dau = daughtersOf(bi212).map((d) => `${d.nuclide.sym}-${d.nuclide.a}(${d.code})`)
check('Bi-212 daughters Po-212 + Tl-208', dau.includes('Po-212(B-)') && dau.includes('Tl-208(A)'), dau)

const neutron = nucAt(0, 1)!
check('neutron 10.2 min', formatHl(neutron) === '10.2 min', formatHl(neutron))

const h3 = nucAt(1, 2)!
check('H-3 12.3 y β⁻', formatHl(h3) === '12.3 y' && catOf(h3) === 'bminus', [formatHl(h3), catOf(h3)])

const og = nucAt(118, 176)!
check('Og-294 580 µs α', formatHl(og) === '580 µs' && catOf(og) === 'alpha', [formatHl(og), catOf(og)])

const te128 = nucAt(52, 76)
console.log('  Te-128:', te128 && `${te128.sym}-${te128.a} ${te128.hlRaw} ${decayLabel(te128.decays[0].code)}`)

check('cat colors defined', CAT_KEYS_DEFINED())
function CAT_KEYS_DEFINED() {
  return ['stable', 'bminus', 'bec', 'alpha', 'sf', 'p', 'n', 'd2b', 'cluster', 'it', 'unbound', 'unknown'].every((k) => catColor(k as never).startsWith('#'))
}

check('hl color endpoints', hlColor(c14) !== hlColor(fe56), [hlColor(c14), hlColor(fe56)])
check('cellColor decay/hl differ', cellColor(c14, 'decay') !== cellColor(c14, 'hl'))
check('labels', decayLabel('B-2N') === 'β⁻ 2n' && decayLabel('EC+B+') === 'β⁺/EC' && decayLabel('24NE') === '²⁴Ne')

// every nuclide must have a category color and no crash in formatters
let allOk = true
for (const nu of NUCLEI) {
  if (!catColor(catOf(nu)) || !formatHl(nu)) allOk = false
  for (const d of nu.decays) if (!decayLabel(d.code)) allOk = false
}
check('all 3384 nuclides format cleanly', allOk)

process.exit(fail ? 1 : 0)
