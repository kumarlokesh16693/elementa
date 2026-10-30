'use client'

// Segrè chart page — chart of nuclides built on IAEA LiveChart ground states.
// N (neutrons) on x, Z (protons) on y, colored by dominant decay mode or
// log-half-life heat. Magic numbers, decay-path arrows, per-nuclide detail
// panel with computed Q values and decay chains.

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SegreChart, { type FocusTarget } from '@/components/segre/SegreChart'
import NuclidePanel from '@/components/segre/NuclidePanel'
import {
  NUCLEI,
  STABLE_COUNT,
  nucAt,
  catOf,
  CATS,
  type Nuclide,
} from '@/lib/periodic/nuclides'
import { searchElements } from '@/lib/periodic'

type Mode = 'decay' | 'hl'

const HL_TICKS: [string, number][] = [
  ['10⁻²² s', 0],
  ['1 ns', (-9 + 22) / 46],
  ['1 µs', (-6 + 22) / 46],
  ['1 s', 0.478],
  ['1 y', (7.499 + 22) / 46],
  ['1 Gy', (16.5 + 22) / 46],
  ['10²⁴ s', 1],
]

export default function SegrePage() {
  return (
    <Suspense fallback={null}>
      <SegreInner />
    </Suspense>
  )
}

function SegreInner() {
  const params = useSearchParams()
  const zParam = parseInt(params.get('z') ?? '', 10)
  const nParam = parseInt(params.get('n') ?? '', 10)

  /* initial state from URL: ?z=&n= centers a nuclide; ?z= highlights an element row */
  const init = useMemo(() => {
    if (Number.isFinite(zParam) && Number.isFinite(nParam)) {
      const nu = nucAt(zParam, nParam)
      if (nu) return { sel: nu, hl: null as number | null, focus: { z: zParam, n: nParam, key: 1 } }
    }
    if (Number.isFinite(zParam) && zParam >= 0) {
      const rows = NUCLEI.filter((nu) => nu.z === zParam)
      if (rows.length) {
        const best =
          rows.find((r) => r.stable) ??
          [...rows].sort((a, b) => (b.hlSec ?? -1) - (a.hlSec ?? -1))[0]
        return { sel: best, hl: zParam as number | null, focus: { z: best.z, n: best.n, key: 1 } }
      }
    }
    return { sel: nucAt(92, 146)!, hl: null as number | null, focus: null }
  }, [zParam, nParam])

  const [mode, setMode] = useState<Mode>('decay')
  const [showMagic, setShowMagic] = useState(true)
  const [showPath, setShowPath] = useState(true)
  const [selected, setSelected] = useState<Nuclide | null>(init.sel)
  const [highlightZ, setHighlightZ] = useState<number | null>(init.hl)
  const [focus, setFocus] = useState<FocusTarget | null>(init.focus)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const nu of NUCLEI) {
      const k = catOf(nu)
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [])

  const results = useMemo(() => searchElements(query), [query])

  /** select & center an element's most notable nuclide (stable first, then longest-lived) */
  const showElement = (z: number) => {
    const rows = NUCLEI.filter((nu) => nu.z === z)
    if (!rows.length) return
    const best =
      rows.find((r) => r.stable) ??
      [...rows].sort((a, b) => (b.hlSec ?? -1) - (a.hlSec ?? -1))[0]
    setHighlightZ(z)
    setSelected(best)
    setFocus({ z: best.z, n: best.n, key: Date.now() })
  }

  const onSelect = (nu: Nuclide | null) => {
    setSelected(nu)
  }

  const selectFromPanel = (nu: Nuclide) => {
    setSelected(nu)
    setFocus({ z: nu.z, n: nu.n, key: Date.now() })
  }

  return (
    <div className="flex h-dvh flex-col bg-[#070a10]">
      {/* header */}
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur">
        <Link
          href="/"
          className="shrink-0 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200"
        >
          ← Periodic table
        </Link>
        <h1 className="text-[15px] font-bold tracking-[0.2em] text-zinc-100">
          SEGR<span className="text-amber-400">È</span> CHART
        </h1>
        <span className="hidden font-mono text-[10px] text-zinc-500 md:inline">
          chart of nuclides · {NUCLEI.length.toLocaleString()} ground states · {STABLE_COUNT} stable ·
          IAEA LiveChart / ENSDF
        </span>
        <Link
          href="/orbitals"
          className="ml-auto shrink-0 rounded-md border border-sky-400/40 bg-sky-400/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-300 transition hover:bg-sky-400/20"
        >
          Orbital lab
        </Link>
      </header>

      {/* toolbar */}
      <div className="relative z-10 flex h-11 shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#080c14] px-4">
        <div className="flex shrink-0 rounded-md border border-white/10 p-0.5">
          {(
            [
              ['decay', 'Decay mode'],
              ['hl', 'Half-life'],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                mode === m ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowMagic((v) => !v)}
          className={`shrink-0 rounded-md border px-2.5 py-1 text-[11px] transition ${
            showMagic
              ? 'border-white/30 bg-white/10 text-zinc-100'
              : 'border-white/10 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Magic numbers
        </button>

        {/* element search */}
        <div className="relative ml-auto w-44 shrink-0 sm:w-56">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('')
              if (e.key === 'Enter' && results.length > 0) {
                showElement(results[0].number)
                setQuery('')
              }
            }}
            placeholder="Highlight element…"
            className="w-full rounded-md border border-white/10 bg-[#0c1220] px-3 py-1.5 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          {focused && query.trim() && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-md border border-white/10 bg-[#0c1220] shadow-2xl">
              {results.slice(0, 8).map((el) => (
                <button
                  key={el.number}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-zinc-300 hover:bg-white/5"
                  onMouseDown={() => {
                    showElement(el.number)
                    setQuery('')
                  }}
                >
                  <span className="font-mono text-[10px] text-zinc-500">{el.number}</span>
                  <span className="font-semibold">{el.symbol}</span>
                  <span className="text-zinc-400">{el.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* legend */}
      <div className="flex h-10 shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#080c14] px-4">
        {mode === 'decay' ? (
          CATS.map((c) => (
            <span
              key={c.key}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[10px] text-zinc-400"
            >
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c.color }} />
              {c.label}
              <span className="text-zinc-600">{counts.get(c.key) ?? 0}</span>
            </span>
          ))
        ) : (
          <div className="flex w-full min-w-[320px] items-center gap-3">
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-500">
              log₁₀ t½
            </span>
            <div className="relative h-2.5 flex-1 rounded-full bg-gradient-to-r from-[#440154] via-[#21918c] to-[#fde725]">
              {HL_TICKS.map(([label, pos]) => (
                <span
                  key={label}
                  className="absolute top-3.5 -translate-x-1/2 font-mono text-[9px] text-zinc-500"
                  style={{ left: `${pos * 100}%` }}
                >
                  {label}
                </span>
              ))}
            </div>
            <span className="shrink-0 font-mono text-[10px] text-zinc-400">
              ▦ stable <span className="text-zinc-600">· ? unbound</span>
            </span>
          </div>
        )}
      </div>

      {/* chart + detail panel */}
      <main className="relative min-h-0 flex-1">
        <SegreChart
          mode={mode}
          showMagic={showMagic}
          showPath={showPath}
          selected={selected}
          onSelect={onSelect}
          highlightZ={highlightZ}
          focus={focus}
        />
        {selected && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-start md:items-stretch md:justify-end">
            <NuclidePanel
              nuc={selected}
              showPath={showPath}
              onTogglePath={() => setShowPath((v) => !v)}
              onClose={() => setSelected(null)}
              onSelect={selectFromPanel}
            />
          </div>
        )}
        {/* hint when nothing selected */}
        {!selected && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-white/10 bg-[#0d1322]/85 px-3 py-1.5 font-mono text-[10px] text-zinc-500 backdrop-blur">
            click any nuclide · drag to pan · scroll to zoom
          </div>
        )}
      </main>
    </div>
  )
}
