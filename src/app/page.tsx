'use client'

import { useMemo, useState } from 'react'
import type { CategoryKey, ColorMode } from '@/lib/periodic/types'
import { CATEGORIES, COLOR_MODES, BLOCK_COLORS, PHASE_COLORS } from '@/lib/periodic/types'
import {
  getElement,
  heatLegend,
  searchElements,
  tileColor,
  isHeatMode,
  HEAT_GRADIENT_CSS,
} from '@/lib/periodic'
import PeriodicTable from '@/components/periodic/PeriodicTable'
import DetailPanel from '@/components/periodic/DetailPanel'

export default function Home() {
  const [selectedZ, setSelectedZ] = useState(6) // Carbon
  const [colorMode, setColorMode] = useState<ColorMode>('category')
  const [activeCats, setActiveCats] = useState<Set<CategoryKey> | null>(null)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const selectedEl = getElement(selectedZ) ?? getElement(1)!
  const accent = tileColor(selectedEl, colorMode).text

  const results = useMemo(() => searchElements(query), [query])
  const matches = useMemo(
    () => (query.trim() ? new Set(results.map((e) => e.number)) : null),
    [query, results],
  )

  const select = (z: number) => setSelectedZ(z)

  const toggleCat = (k: CategoryKey) => {
    setActiveCats((prev) => {
      const next = new Set(prev ?? [])
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next.size ? next : null
    })
  }

  const hasFilters = activeCats != null || query.trim().length > 0

  return (
    <div className="flex h-dvh flex-col bg-[#070a10]">
      {/* header */}
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[17px] font-bold tracking-[0.22em] text-zinc-100">
            ELEM<span className="text-amber-400">E</span>NTA
          </h1>
          <span className="hidden font-mono text-[10px] text-zinc-500 md:inline">
            research-grade periodic table · 118 elements · 2D/3D Bohr
          </span>
        </div>

        {/* search */}
        <div className="relative ml-auto w-56 lg:w-72">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('')
              if (e.key === 'Enter' && results.length > 0) {
                select(results[0].number)
                setQuery('')
              }
            }}
            placeholder="Search name, symbol, atomic number…"
            className="w-full rounded-md border border-white/10 bg-[#0c1220] px-3 py-1.5 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          {focused && query.trim() && results.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[#0c1220] shadow-2xl">
              {results.map((el) => {
                const c = tileColor(el, 'category')
                return (
                  <button
                    key={el.number}
                    type="button"
                    onMouseDown={() => {
                      select(el.number)
                      setQuery('')
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition hover:bg-white/5"
                  >
                    <span
                      className="w-9 text-center font-mono text-[12px] font-bold"
                      style={{ color: c.text }}
                    >
                      {el.symbol}
                    </span>
                    <span className="truncate text-[12px] text-zinc-200">{el.name}</span>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-zinc-500">
                      {el.number} · {el.mass}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          {focused && query.trim() && results.length === 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#0c1220] px-3 py-2 text-[11px] text-zinc-500 shadow-2xl">
              No element matches “{query}”.
            </div>
          )}
        </div>

        {/* color mode */}
        <select
          value={colorMode}
          onChange={(e) => setColorMode(e.target.value as ColorMode)}
          className="rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none"
          aria-label="Color mode"
        >
          {COLOR_MODES.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </header>

      {/* legend bar */}
      <div className="z-10 flex h-10 shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#080c14] px-4">
        {isHeatMode(colorMode) ? (
          <>
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-500">
              {heatLegend(colorMode).unit}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-400">
              {heatLegend(colorMode).lo}
            </span>
            <div className="h-2 w-48 shrink-0 rounded-full md:w-72" style={{ background: HEAT_GRADIENT_CSS }} />
            <span className="shrink-0 font-mono text-[10px] text-zinc-400">
              {heatLegend(colorMode).hi} {heatLegend(colorMode).unit}
            </span>
            <span className="shrink-0 text-[10px] text-zinc-600">
              · grey = no consensus value{colorMode === 'density' ? ' · logarithmic scale' : ''}
            </span>
          </>
        ) : colorMode === 'block' ? (
          <>
            {Object.entries(BLOCK_COLORS).map(([k, c]) => (
              <span
                key={k}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px]"
                style={{ color: c }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                {k}-block
              </span>
            ))}
            <span className="shrink-0 text-[10px] text-zinc-600">· highest-energy occupied orbital</span>
          </>
        ) : colorMode === 'phase' ? (
          <>
            {Object.entries(PHASE_COLORS).map(([k, c]) => (
              <span
                key={k}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] capitalize"
                style={{ color: c }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                {k}
              </span>
            ))}
            <span className="shrink-0 text-[10px] text-zinc-600">· predicted phase for heaviest elements</span>
          </>
        ) : (
          <>
            {CATEGORIES.map((cat) => {
              const active = activeCats == null || activeCats.has(cat.key)
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCat(cat.key)}
                  title={cat.desc}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] transition ${
                    active ? 'border-white/20 bg-white/[0.05]' : 'border-transparent opacity-35'
                  }`}
                  style={{ color: active ? cat.color : undefined }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
                  {cat.label}
                </button>
              )
            })}
            {activeCats != null && (
              <button
                type="button"
                onClick={() => setActiveCats(null)}
                className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400 transition hover:text-zinc-200"
              >
                clear ×
              </button>
            )}
          </>
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setActiveCats(null)
              setQuery('')
            }}
            className="ml-auto shrink-0 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300 transition hover:bg-amber-400/20"
          >
            reset filters
          </button>
        )}
      </div>

      {/* main */}
      <main className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div
          className="flex flex-1 justify-center overflow-auto p-4 lg:p-6"
          style={{
            background:
              'radial-gradient(1100px 520px at 50% -8%, rgba(251,191,36,0.05), transparent 70%)',
          }}
        >
          <div className="flex flex-col items-center">
            <PeriodicTable
              selected={selectedZ}
              onSelect={(el) => select(el.number)}
              colorMode={colorMode}
              matches={matches}
              activeCategories={activeCats}
            />
            <p className="mt-5 max-w-[880px] text-center text-[10px] leading-relaxed text-zinc-600">
              Reference values follow IUPAC conventions — Pauling electronegativity, first ionization
              energy in eV, electron affinity in kJ/mol, empirical radii in pm (calculated for noble
              gases), temperatures in K, densities at STP. Bracketed standard atomic weights apply to
              Tc, Pm and Z ≥ 84. A dash (—) marks properties with no accepted experimental value.
              Radioactive nuclides are flagged with a dot; Bohr shells are a pedagogical
              approximation, not a quantum-mechanical orbital picture.
            </p>
          </div>
        </div>

        <aside className="w-full shrink-0 border-t border-white/10 bg-[#0a0f18] lg:h-full lg:w-[384px] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <DetailPanel element={selectedEl} accent={accent} />
        </aside>
      </main>
    </div>
  )
}
