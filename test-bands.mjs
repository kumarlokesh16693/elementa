import {
  bandEnergies, bandGap, bandRange, sampleBandPath, bzPolygon,
  analyse, fermiEnergy, dosAt, insideBZ, pathVertices, occupation,
  KB_EV, HBAR2_OVER_2ME_EV_A2,
} from './src/lib/bands.ts'

const base = { model: 'chain', t: 1, a: 2.46, delta: 0, gap: 0, filling: 1, temperature: 0 }

function show(label, v) { console.log(label.padEnd(34), v) }

// --- honeycomb dispersion checks ---
const hc = { ...base, model: 'honeycomb', t: 2.7, a: 2.46, gap: 0 }
const a = hc.a
show('honeycomb Γ (expect ±8.1)', bandEnergies(0, 0, hc).map(v => v.toFixed(6)))
show('honeycomb K (expect 0)', bandEnergies(4 * Math.PI / (3 * a), 0, hc).map(v => v.toFixed(9)))
show('honeycomb M (expect ±2.7)', bandEnergies(Math.PI / a, Math.PI / (Math.sqrt(3) * a), hc).map(v => v.toFixed(6)))
const hg = { ...hc, gap: 0.5 }
show('gapped honeycomb K (expect ±0.5)', bandEnergies(4 * Math.PI / (3 * a), 0, hg).map(v => v.toFixed(6)))
show('honeycomb K inside BZ', insideBZ(4 * Math.PI / (3 * a), 0, hc))
show('honeycomb Γ inside BZ', insideBZ(0, 0, hc))

// --- ssh checks ---
const ssh = { ...base, model: 'ssh', t: 1, a: 4.92, delta: 0.2 }
show('ssh k=0 (expect ±2)', bandEnergies(0, 0, ssh).map(v => v.toFixed(6)))
show('ssh k=π/a (expect ±0.8)', bandEnergies(Math.PI / ssh.a, 0, ssh).map(v => v.toFixed(6)))
show('ssh gap (expect 0.8)', bandGap(ssh))

// --- square checks ---
const sq = { ...base, model: 'square', t: 1, a: 2.46 }
show('square Γ (expect -4)', bandEnergies(0, 0, sq))
show('square M (expect +4)', bandEnergies(Math.PI / sq.a, Math.PI / sq.a, sq))

// --- Fermi levels ---
for (const m of ['chain', 'square', 'honeycomb']) {
  const p = { ...base, model: m, t: 1, filling: 1 }
  show(`EF half filling ${m}`, fermiEnergy(p))
}
const chainQ = { ...base, model: 'chain', t: 1, filling: 0.5 }
show('EF chain ν=0.5 (expect -1.4142)', fermiEnergy(chainQ))
const chain3 = { ...base, model: 'chain', t: 1, filling: 1.5 }
show('EF chain ν=1.5 (expect +1.4142)', fermiEnergy(chain3))

// finite T: half filling should stay 0 by symmetry
show('EF chain ν=1 T=300', fermiEnergy({ ...base, filling: 1, temperature: 300 }))
show('EF honeycomb ν=1 T=300', fermiEnergy({ ...base, model: 'honeycomb', t: 2.7, filling: 1, temperature: 300 }))
show('EF gapped honeycomb ν=1 T=0', fermiEnergy({ ...base, model: 'honeycomb', t: 2.7, gap: 0.5, filling: 1 }))
show('EF gapped honeycomb ν=0.9', fermiEnergy({ ...base, model: 'honeycomb', t: 2.7, gap: 0.5, filling: 0.9 }))

// --- DOS normalisation (integral = 2 * bands) ---
for (const m of ['chain', 'ssh', 'square', 'honeycomb']) {
  const p = { ...base, model: m, t: 1, filling: 1, delta: 0.2, gap: 0.3 }
  const an = analyse(p)
  const dE = an.dos.energies[1] - an.dos.energies[0]
  let integral = 0
  for (let i = 0; i < an.dos.dos.length; i++) integral += an.dos.dos[i] * dE
  show(`DOS integral ${m} (expect ${2 * an.nBands})`, integral.toFixed(4))
  show(`  gap ${m}`, an.gap.toFixed(3))
  show(`  mass ${m}`, `${an.mass.ratio.toFixed(3)} mₑ (${an.mass.note})`)
  show(`  classify ${m}`, `${an.classification.kind} · EF=${an.fermi.toFixed(3)}`)
}

// graphene mass: Δ=0.5, t=2.7 -> theory ~0.115 m_e
const gm = analyse({ ...base, model: 'honeycomb', t: 2.7, a: 2.46, gap: 0.5, filling: 1 })
show('graphene m* Δ=0.5 (theory 0.115)', gm.mass)

// chain mass: 3.81/(1*2.46²)=0.63
show('chain m* t=1 a=2.46', analyse({ ...base, model: 'chain', t: 1, a: 2.46 }).mass.ratio)

// --- path ---
for (const m of ['chain', 'ssh', 'square', 'honeycomb']) {
  const p = { ...base, model: m, t: 1, filling: 1 }
  const path = sampleBandPath(p, 32)
  show(`path ${m} samples`, path.samples.length)
  show(`  ticks ${m}`, path.ticks.map(t => `${t.label}@${t.t.toFixed(2)}`).join(' '))
  const start = path.samples[0]
  const end = path.samples[path.samples.length - 1]
  show(`  ends ${m}`, `${start.energies.map(v => v.toFixed(2))} → ${end.energies.map(v => v.toFixed(2))}`)
}

// --- BZ polygon ---
for (const m of ['square', 'honeycomb']) {
  const pts = bzPolygon({ ...base, model: m, a: 2.46 })
  show(`BZ ${m}`, pts.map(p => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(' '))
}

// --- Fermi contour counts ---
for (const m of ['chain', 'square', 'honeycomb']) {
  const p = { ...base, model: m, t: 1, filling: 1 }
  const an = analyse(p)
  // contour actually lives in the element; here just report EF
  show(`fermi ${m} EF`, an.fermi)
}

// --- occupation ---
show('FD E=EF', occupation(0, 0, 300))
show('FD E=EF+0.1 @300K', occupation(0.1, 0, 300).toFixed(4))
show('kT @300K (meV)', (KB_EV * 300 * 1000).toFixed(2))
