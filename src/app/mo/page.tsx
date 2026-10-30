'use client'

import Link from 'next/link'
import { useState } from 'react'
import { getElement } from '@/lib/periodic'
import MoDiagram, { computeMo } from '@/components/periodic/MoDiagram'

const PICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const PRESETS: { label: string; a: number; b: number }[] = [
  { label: 'H₂', a: 1, b: 1 },
  { label: 'He₂', a: 2, b: 2 },
  { label: 'Li₂', a: 3, b: 3 },
  { label: 'B₂', a: 5, b: 5 },
  { label: 'C₂', a: 6, b: 6 },
  { label: 'N₂', a: 7, b: 7 },
  { label: 'O₂', a: 8, b: 8 },
  { label: 'F₂', a: 9, b: 9 },
  { label: 'Ne₂', a: 10, b: 10 },
  { label: 'CO', a: 6, b: 8 },
  { label: 'NO', a: 7, b: 8 },
  { label: 'CN', a: 6, b: 7 },
  { label: 'BF', a: 5, b: 9 },
  { label: 'BN', a: 5, b: 7 },
  { label: 'LiF', a: 3, b: 9 },
]

function formula(zA: number, zB: number): string {
  const sA = getElement(zA)!.symbol
  const sB = getElement(zB)!.symbol
  return zA === zB ? `${sA}₂` : `${sA}${sB}`
}

function StatCard({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-0.5 font-mono text-[15px] font-semibold" style={{ color: tint ?? '#e4e4e7' }}>
        {value}
      </div>
    </div>
  )
}

function AtomPicker({
  side,
  value,
  onChange,
}: {
  side: 'A' | 'B'
  value: number
  onChange: (z: number) => void
}) {
  return (
    <div>
      <div className="mb-1.5 text-[9px] uppercase tracking-wider text-zinc-500">Atom {side}</div>
      <div className="grid grid-cols-5 gap-1">
        {PICKS.map((z) => {
          const el = getElement(z)!
          const active = z === value
          return (
            <button
              key={z}
              type="button"
              onClick={() => onChange(z)}
              title={el.name}
              className={`rounded-md border py-1.5 text-center transition ${
                active
                  ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                  : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
              }`}
            >
              <div className="text-[13px] font-bold leading-none">{el.symbol}</div>
              <div className="mt-0.5 font-mono text-[8px] leading-none opacity-70">{z}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function MoBuilderPage() {
  const [zA, setZA] = useState(7)
  const [zB, setZB] = useState(7)

  const res = computeMo(zA, zB)
  const boStr = Number.isInteger(res.bondOrder)
    ? String(res.bondOrder)
    : res.bondOrder.toFixed(1)

  return (
    <div className="flex min-h-dvh flex-col bg-[#070a10]">
      {/* header */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur">
        <Link
          href="/"
          className="rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200"
        >
          ← Periodic table
        </Link>
        <h1 className="text-[15px] font-bold tracking-[0.2em] text-zinc-100">
          MO <span className="text-amber-400">BUILDER</span>
        </h1>
        <span className="hidden font-mono text-[10px] text-zinc-500 md:inline">
          diatomic molecular orbitals · H–Ne · bond order & magnetism
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:p-6">
        {/* controls */}
        <div className="space-y-4 self-start rounded-xl border border-white/10 bg-[#0a0f18] p-4">
          <div>
            <div className="mb-1.5 text-[9px] uppercase tracking-wider text-zinc-500">
              Common diatomics
            </div>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => {
                const active = p.a === zA && p.b === zB
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setZA(p.a)
                      setZB(p.b)
                    }}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition ${
                      active
                        ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                        : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
          <AtomPicker side="A" value={zA} onChange={setZA} />
          <AtomPicker side="B" value={zB} onChange={setZB} />
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-[11px] text-zinc-400">
            molecule: <span className="text-zinc-100">{formula(zA, zB)}</span> · {res.totalElectrons || zA + zB} e⁻
          </div>
          <p className="text-[9.5px] leading-relaxed text-zinc-600">
            Generic second-row MO treatment. s–p mixing puts π(2p) below σ(2p) for Z
            <sub>A</sub>+Z<sub>B</sub> ≤ 14 (B₂/C₂/N₂-like); above that the order flips
            (O₂/F₂-like). Heteronuclear diagrams offset the more electronegative atom&apos;s AOs
            downward. Energies are schematic, not to scale.
          </p>
        </div>

        {/* diagram + readouts */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-[#0a0f18] p-4">
            {res.valid && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                  bonding
                </span>
                <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] text-rose-300">
                  antibonding
                </span>
                <span className="ml-auto font-mono text-[10px] text-zinc-500">
                  {res.piBelowSigma ? 'π(2p) < σ(2p) — s–p mixing regime' : 'σ(2p) < π(2p) — reduced mixing'}
                </span>
              </div>
            )}
            <MoDiagram zA={zA} zB={zB} />
          </div>

          {res.valid && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Electrons" value={String(res.totalElectrons)} />
              <StatCard
                label="Bond order"
                value={boStr}
                tint={res.bondOrder > 0 ? '#34d399' : '#fb7185'}
              />
              <StatCard
                label="Magnetism"
                value={res.unpaired > 0 ? 'para' : 'dia'}
                tint={res.unpaired > 0 ? '#fbbf24' : '#38bdf8'}
              />
              <StatCard label="Unpaired e⁻" value={String(res.unpaired)} />
              <StatCard label="HOMO" value={res.homo} />
              <StatCard label="LUMO" value={res.lumo} />
              <div className="col-span-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:col-span-3 lg:col-span-6">
                <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                  Configuration ({formula(zA, zB)})
                </div>
                <div className="mt-0.5 font-mono text-[13px] leading-relaxed text-zinc-200">
                  {res.config}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
