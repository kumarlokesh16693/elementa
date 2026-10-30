'use client'

import Link from 'next/link'
import { Suspense, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ELEMENTS, configToSuperscript, getElement } from '@/lib/periodic'
import {
  combosOf,
  defaultSelection,
  lLetter,
  occupancyOf,
  orbitalLabel,
  parseConfig,
  radialStats,
  slaterZeff,
  subshellLabel,
  type RealOrbital,
} from '@/lib/orbital'
import OrbitalCanvas, { type OrbitalMode } from '@/components/orbital/OrbitalCanvas'
import RadialPlot from '@/components/orbital/RadialPlot'
import CrossSection from '@/components/orbital/CrossSection'

function StatCard({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-0.5 font-mono text-[14px] font-semibold" style={{ color: tint ?? '#e4e4e7' }}>
        {value}
      </div>
    </div>
  )
}

function LabInner() {
  const params = useSearchParams()
  const zParam = parseInt(params.get('z') ?? '6', 10)
  const z0 = Number.isFinite(zParam) && zParam >= 1 && zParam <= 118 ? zParam : 6

  const [z, setZ] = useState(z0)
  const el = getElement(z)!
  const occupied = useMemo(() => parseConfig(el.config), [el.config])
  const defSel = useMemo(() => defaultSelection(occupied), [occupied])

  const [sel, setSel] = useState<RealOrbital>(defSel)
  const [lastDef, setLastDef] = useState(defSel)
  if (lastDef !== defSel) {
    /* element changed — reset selection during render (React-recommended) */
    setLastDef(defSel)
    setSel(defSel)
  }

  /* keep the URL shareable */
  useEffect(() => {
    window.history.replaceState(null, '', `/orbitals?z=${z}`)
  }, [z])

  const [mode, setMode] = useState<OrbitalMode>('surface')
  const [isoT, setIsoT] = useState(0.7) // iso ≈ 0.176 — clean lobe/torus topology
  const [rotate, setRotate] = useState(true)
  const isoRaw = 0.03 + Math.pow(isoT, 2.2) * 0.32
  const iso = useDeferredValue(isoRaw)

  const occ = occupancyOf(occupied, sel.n, sel.l)
  const { zeff, sigma } = slaterZeff(el.number, { n: sel.n, l: sel.l, e: occ }, occupied)
  const stats = useMemo(() => radialStats(sel.n, sel.l, zeff), [sel.n, sel.l, zeff])
  const combos = combosOf(sel.l)
  const comboIdx = Math.max(
    0,
    combos.findIndex((c) => c.m === sel.m && c.sin === sel.sin),
  )

  const eV = (-13.6057 * zeff * zeff) / (sel.n * sel.n)
  const eStr = Math.abs(eV) >= 1000 ? `${(eV / 1000).toFixed(1)} keV` : `${eV.toFixed(2)} eV`
  const capacity = 2 * (2 * sel.l + 1)

  const pickSubshell = (n: number, l: number) => {
    const c = combosOf(l)[0]
    setSel({ n, l, m: c.m, sin: c.sin })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#070a10] text-zinc-200">
      {/* header */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 flex-wrap items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur">
        <Link
          href="/"
          className="rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200"
        >
          ← Periodic table
        </Link>
        <h1 className="text-[15px] font-bold tracking-[0.2em] text-zinc-100">
          QM <span className="text-amber-400">ORBITAL LAB</span>
        </h1>
        <span className="hidden font-mono text-[10px] text-zinc-500 lg:inline">
          hydrogenic ψ<sub>nlm</sub> · Slater Z<sub>eff</sub> · isosurfaces, radial nodes & cross-sections
        </span>
        <select
          value={z}
          onChange={(e) => setZ(parseInt(e.target.value, 10))}
          aria-label="Pick element"
          className="ml-auto rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none"
        >
          {ELEMENTS.map((e2) => (
            <option key={e2.number} value={e2.number}>
              {e2.number} · {e2.symbol} — {e2.name}
            </option>
          ))}
        </select>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:p-6">
        {/* left column — viewer + cross-section */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-[#0a0f18] p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className="flex h-9 w-9 flex-col items-center justify-center rounded-lg border font-bold"
                style={{ borderColor: '#fbbf2455', background: '#fbbf2412', color: '#fbbf24' }}
              >
                <span className="text-[14px] leading-none">{el.symbol}</span>
                <span className="font-mono text-[7.5px] leading-none opacity-70">{z}</span>
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-zinc-100">
                  {orbitalLabel(sel)}
                  <span className="ml-2 font-mono text-[10px] font-normal text-zinc-500">
                    Z<sub>eff</sub> = {zeff.toFixed(2)} · {occ > 0 ? `${occ} e⁻ occupied` : 'virtual orbital'}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-zinc-600">{configToSuperscript(el.config)}</div>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded-md border border-white/10">
                  {(['surface', 'cloud'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`px-2.5 py-1 text-[11px] transition ${
                        mode === m ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setRotate((r) => !r)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] transition ${
                    rotate
                      ? 'border-teal-400/40 bg-teal-400/10 text-teal-300'
                      : 'border-white/10 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {rotate ? '❚❚ rotate' : '▶ rotate'}
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9.5px] text-zinc-500">iso</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={isoT}
                    onChange={(e) => setIsoT(parseFloat(e.target.value))}
                    className="w-24"
                    aria-label="Isosurface threshold"
                  />
                  <span className="w-9 font-mono text-[9.5px] text-zinc-400">{isoRaw.toFixed(3)}</span>
                </div>
              </div>
            </div>

            <div className="relative h-[380px] overflow-hidden rounded-lg border border-white/[0.07] bg-[#070a10] lg:h-[540px]">
              <OrbitalCanvas
                orbital={sel}
                zEff={zeff}
                mode={mode}
                iso={iso}
                gridN={84}
                autoRotate={rotate}
                speed={1}
              />
              <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-3 font-mono text-[9.5px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> ψ &gt; 0
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-teal-400" /> ψ &lt; 0
                </span>
                <span className="hidden md:inline">· physics z renders upward · drag to orbit</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a0f18] p-4">
            <h2 className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              ψ² cross-section — nodal structure
            </h2>
            <CrossSection orbital={sel} zEff={zeff} extent={stats.rMax} />
            <p className="mt-2 text-[9.5px] leading-relaxed text-zinc-600">
              Sign-modulated |ψ|² in the xz-plane. Dark seams are nodal surfaces where ψ = 0 —
              probability never crosses them. {stats.nAngularNodes} angular node
              {stats.nAngularNodes === 1 ? '' : 's'} (cones/planes) and {stats.nRadialNodes} radial node
              {stats.nRadialNodes === 1 ? '' : 's'} (spheres) for this orbital.
            </p>
          </div>
        </div>

        {/* right column — numbers */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-[#0a0f18] p-4">
            <h2 className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Quantum numbers & screening
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatCard label="Principal n" value={String(sel.n)} />
              <StatCard label="Azimuthal ℓ" value={`${sel.l} (${lLetter(sel.l)})`} />
              <StatCard label="Real combo" value={orbitalLabel(sel)} />
              <StatCard label="Occupancy" value={`${occ} / ${capacity} e⁻`} tint={occ > 0 ? '#34d399' : '#a1a1aa'} />
              <StatCard label="Z (nuclear)" value={String(z)} />
              <StatCard label="σ (Slater)" value={sigma.toFixed(2)} />
              <StatCard label="Z_eff = Z − σ" value={zeff.toFixed(2)} tint="#fbbf24" />
              <StatCard label="E_n (hydrogenic)" value={eStr} tint="#fb7185" />
              <StatCard label="⟨r⟩" value={`${stats.rMean.toFixed(2)} a₀`} />
              <StatCard label="r most probable" value={`${stats.rMp.toFixed(2)} a₀`} />
              <StatCard label="Radial nodes" value={String(stats.nRadialNodes)} tint="#38bdf8" />
              <StatCard label="Angular nodes" value={String(stats.nAngularNodes)} tint="#38bdf8" />
            </div>
            <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10.5px] text-zinc-400">
              radial node radii:{' '}
              <span className="text-zinc-200">
                {stats.nodes.length > 0
                  ? stats.nodes.map((v) => `${v.toFixed(2)} a₀`).join(' · ')
                  : '—'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a0f18] p-4">
            <h2 className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Radial distribution
            </h2>
            <RadialPlot stats={stats} accent="#fbbf24" />
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a0f18] p-4">
            <h2 className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Occupied subshells
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {occupied.map((s, i) => {
                const active = sel.n === s.n && sel.l === s.l
                return (
                  <button
                    key={`${s.n}-${s.l}-${i}`}
                    type="button"
                    onClick={() => pickSubshell(s.n, s.l)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition ${
                      active
                        ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                        : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                    }`}
                  >
                    {subshellLabel(s)}
                  </button>
                )
              })}
            </div>

            <h2 className="mb-2 mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Explore any orbital (incl. virtual)
            </h2>
            <div className="flex flex-wrap gap-2">
              <select
                value={sel.n}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  pickSubshell(n, Math.min(sel.l, Math.min(3, n - 1)))
                }}
                aria-label="Principal quantum number"
                className="rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 font-mono text-[11px] text-zinc-300 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                  <option key={v} value={v}>
                    n = {v}
                  </option>
                ))}
              </select>
              <select
                value={sel.l}
                onChange={(e) => pickSubshell(sel.n, parseInt(e.target.value, 10))}
                aria-label="Azimuthal quantum number"
                className="rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 font-mono text-[11px] text-zinc-300 focus:outline-none"
              >
                {Array.from({ length: Math.min(3, sel.n - 1) + 1 }, (_, l) => (
                  <option key={l} value={l}>
                    ℓ = {l} ({lLetter(l)})
                  </option>
                ))}
              </select>
              <select
                value={comboIdx}
                onChange={(e) => {
                  const c = combos[parseInt(e.target.value, 10)] ?? combos[0]
                  setSel({ ...sel, m: c.m, sin: c.sin })
                }}
                aria-label="Real orbital combination"
                className="rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 font-mono text-[11px] text-zinc-300 focus:outline-none"
              >
                {combos.map((c, i) => (
                  <option key={`${c.m}-${c.sin}`} value={i}>
                    {orbitalLabel({ ...sel, m: c.m, sin: c.sin })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a0f18] p-4">
            <h2 className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Method & accuracy
            </h2>
            <p className="text-[10.5px] leading-relaxed text-zinc-500">
              ψ<sub>nlm</sub> = R<sub>nl</sub>(r)·Y<sub>lm</sub>(θ,φ) is evaluated exactly for the
              hydrogen-like atom in atomic units; multi-electron screening is folded in as a single
              Slater effective nuclear charge (classroom rules), so shapes are qualitative and
              radial scales approximate for many-electron atoms — exact for hydrogen-like ions.
              Real (Cartesian) combinations are shown; lobe sign matters because bonding overlaps
              ψ of the same sign. Isosurfaces are extracted with surface nets on a nucleus-graded
              grid; the cloud mode samples |ψ|² directly. E<sub>n</sub> = −13.6057·Z<sub>eff</sub>²/n² eV.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href="/mo"
                className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-300 transition hover:bg-amber-400/20"
              >
                MO builder →
              </Link>
              <Link
                href="/"
                className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200"
              >
                ← periodic table
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function OrbitalLabPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center bg-[#070a10] font-mono text-[11px] text-zinc-500">
          loading orbital lab…
        </div>
      }
    >
      <LabInner />
    </Suspense>
  )
}
