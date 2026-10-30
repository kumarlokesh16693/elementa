import { computeMo } from '../src/components/periodic/MoDiagram'

const cases: [number, number, number, number, string][] = [
  [1, 1, 1, 0, 'H2'], [2, 2, 0, 0, 'He2'], [3, 3, 1, 0, 'Li2'],
  [4, 4, 0, 0, 'Be2'], [5, 5, 1, 2, 'B2'], [6, 6, 2, 0, 'C2'],
  [7, 7, 3, 0, 'N2'], [8, 8, 2, 2, 'O2'], [9, 9, 1, 0, 'F2'],
  [10, 10, 0, 0, 'Ne2'], [6, 8, 3, 0, 'CO'], [7, 8, 2.5, 1, 'NO'],
  [6, 7, 2.5, 1, 'CN'], [5, 9, 3, 0, 'BF'], [5, 7, 2, 0, 'BN'],
  [3, 9, 2, 0, 'LiF'],
]
let fail = 0
for (const [a, b, bo, unpaired, name] of cases) {
  const r = computeMo(a, b)
  const ok = r.valid && Math.abs(r.bondOrder - bo) < 1e-9 && r.unpaired === unpaired
  if (!ok) { fail++; console.log(`✗ ${name}: valid=${r.valid} BO=${r.bondOrder} unpaired=${r.unpaired} (want ${bo}/${unpaired}) config=${r.config}`) }
  else console.log(`✓ ${name}: BO=${r.bondOrder} unpaired=${r.unpaired} homo=${r.homo} lumo=${r.lumo}`)
}
console.log(fail === 0 ? 'ALL PASS' : `${fail} FAILURES`)
