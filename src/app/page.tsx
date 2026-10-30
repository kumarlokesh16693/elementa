'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Atom, Search, X } from 'lucide-react'
import type { ElementData } from '@/lib/periodic/types'
import { CATEGORIES, CATEGORY_MAP, COLOR_MODES, type CategoryKey, type ColorMode } from '@/lib/periodic/types'
import {
  ELEMENT_MAP,
  heatLegend,
  isHeatMode,
  searchElements,
} from '@/lib/periodic'
import { PeriodicTable } from '@/components/periodic/PeriodicTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DetailPanel = dynamic(
  () => import('@/components/periodic/DetailPanel').then((m) => m.DetailPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0c0f16]">
        <span className="font-mono text-xs tracking-[0.3em] text-amber-500/80 animate-pulse">
          LOADING MODELS…
        </span>
      </div>
    ),
  },
)

export default function Page() {
  const [selectedZ, setSelectedZ] = useState<number | null>(6)
  const [panelOpen, setPanelOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeCats, setActiveCats] = useState<Set<CategoryKey>>(new Set())
  const [colorMode, setColorMode] = useState<ColorMode>('category')
  const searchRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const matches = useMemo(() => searchElements(query), [query])

  const selectElement = useCallback((el: ElementData) => {
    setSelectedZ(el.number)
    setPanelOpen(true)
  }, [])

  /* ---------- filtering ---------- */
  const isDimmed = useCallback(
    (el: ElementData) => {
      if (activeCats.size > 0 && !activeCats.has(el.category)) return true
      if (query.trim() && !matches.some((m) => m.number === el.number)) return true
      return false
    },
    [activeCats, query, matches],
  )

  /* ---------- hotkeys ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (e.key === '/' && !inInput) {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if (e.key === 'Escape') {
        if (showSuggestions) setShowSuggestions(false)
        else if (inInput) (e.target as HTMLInputElement).blur()
        else if (panelOpen) setPanelOpen(false)
        return
      }
      if (inInput || !selectedZ) return
      const dirs: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }
      const d = dirs[e.key]
      if (!d) return
      e.preventDefault()
      const cur = ELEMENT_MAP.get(selectedZ)
      if (!cur) return
      const [dx, dy] = d
      // immediate neighbor, then scan across empty spacer rows (main <-> f-block)
      for (let k = 1; k <= 4; k++) {
        const target = [...ELEMENT_MAP.values()].find(
          (o) => o.xpos === cur.xpos + dx * k && o.ypos === cur.ypos + dy * k,
        )
        if (target) {
          setSelectedZ(target.number)
          return
        }
        if (dx !== 0) break // horizontal moves don't need gap scanning
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedZ, panelOpen, showSuggestions])

  const toggleCat = (key: CategoryKey) =>
    setActiveCats((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const selected = selectedZ != null ? ELEMENT_MAP.get(selectedZ) : null
  const heat = isHeatMode(colorMode)
  const legend = heat ? heatLegend(colorMode) : null

  const fmtSci = (v: number) => (v < 0.01 ? v.toExponential(1) : String(Math.round(v * 100) / 100))

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#070a10] text-zinc-200">
      {/* ============ header ============ */}
      <header className="shrink-0 border-b border-white/[0.08] bg-[#090c12]/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10">
              <Atom className="h-5 w-5 text-amber-400" />
            </div>
            <div className="leading-tight">
              <div className="font-mono text-[15px] font-bold tracking-[0.22em] text-zinc-100">
                ELEMENTA
              </div>
              <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-zinc-500">
                Research periodic table
              </div>
            </div>
          </div>

          {/* search */}
          <div className="relative w-full max-w-[280px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matches.length > 0) {
                  selectElement(matches[0])
                  setQuery('')
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              placeholder="Search element, symbol, Z …  ( / )"
              aria-label="Search elements"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-8 pr-8 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {showSuggestions && query.trim() && matches.length > 0 && (
              <ul className="absolute left-0 right-0 top-11 z-40 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-[#10141d] py-1 shadow-2xl">
                {matches.map((el) => {
                  const c = CATEGORY_MAP[el.category].color
                  return (
                    <li key={el.number}>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          selectElement(el)
                          setQuery('')
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-white/[0.05]"
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded border font-mono text-[10px] font-semibold"
                          style={{ color: c, borderColor: `${c}55`, background: `${c}14` }}
                        >
                          {el.symbol}
                        </span>
                        <span className="text-xs text-zinc-200">{el.name}</span>
                        <span className="ml-auto font-mono text-[10px] text-zinc-500">
                          Z={el.number}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* color mode */}
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600 sm:block">
              Color by
            </span>
            <Select value={colorMode} onValueChange={(v) => setColorMode(v as ColorMode)}>
              <SelectTrigger className="h-9 w-[170px] border-white/10 bg-white/[0.04] font-mono text-xs text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#10141d] font-mono text-xs">
                {COLOR_MODES.map((m) => (
                  <SelectItem key={m.key} value={m.key} className="text-zinc-300">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* heat legend */}
          {legend && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-zinc-500">
                {fmtSci(legend.lo)} {legend.unit}
              </span>
              <span
                className="h-2 w-28 rounded-full sm:w-40"
                style={{
                  background:
                    'linear-gradient(90deg, rgb(38,70,83), rgb(42,157,143), rgb(233,196,106), rgb(244,162,97), rgb(231,111,81))',
                }}
              />
              <span className="font-mono text-[9px] text-zinc-500">
                {fmtSci(legend.hi)} {legend.unit}
              </span>
            </div>
          )}
        </div>

        {/* category filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.05] px-4 py-1.5">
          <button
            onClick={() => setActiveCats(new Set())}
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] transition ${
              activeCats.size === 0
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                : 'border-white/10 bg-white/[0.03] text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All 118
          </button>
          {CATEGORIES.map((c) => {
            const active = activeCats.has(c.key)
            return (
              <button
                key={c.key}
                onClick={() => toggleCat(c.key)}
                title={c.desc}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] transition ${
                  active ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={{
                  borderColor: active ? c.color : 'rgba(255,255,255,0.1)',
                  background: active ? `${c.color}22` : 'rgba(255,255,255,0.03)',
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: c.color }}
                />
                {c.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* ============ main ============ */}
      <main className="flex min-h-0 flex-1">
        <section
          aria-label="Periodic table"
          className="min-w-0 flex-1 overflow-auto p-3 md:p-5"
        >
          <PeriodicTable
            selectedZ={selectedZ}
            onSelect={selectElement}
            colorMode={colorMode}
            isDimmed={isDimmed}
          />
        </section>

        {/* desktop panel */}
        {selected && panelOpen && (
          <aside className="hidden w-[420px] shrink-0 border-l border-white/[0.08] lg:block xl:w-[460px]">
            <DetailPanel element={selected} onClose={() => setPanelOpen(false)} />
          </aside>
        )}
        {selected && !panelOpen && (
          <aside className="hidden w-[52px] shrink-0 border-l border-white/[0.08] lg:block">
            <button
              onClick={() => setPanelOpen(true)}
              className="flex h-full w-full flex-col items-center gap-3 pt-4 text-zinc-500 hover:text-amber-300"
              aria-label="Open detail panel"
            >
              <span className="font-mono text-sm font-bold" style={{ writingMode: 'vertical-rl' }}>
                {selected.symbol} · {selected.name}
              </span>
            </button>
          </aside>
        )}
      </main>

      {/* mobile overlay panel */}
      {selected && panelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-10 overflow-hidden rounded-t-2xl border-t border-white/10 shadow-2xl">
            <DetailPanel element={selected} onClose={() => setPanelOpen(false)} />
          </div>
        </div>
      )}

      {/* ============ footer ============ */}
      <footer className="shrink-0 border-t border-white/[0.08] bg-[#090c12] px-4 py-1.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-0.5 font-mono text-[9.5px] text-zinc-600">
          <span>
            Data: IUPAC 2021 masses · NIST ionization energies · NuDat/ENSDF half-lives · CRC Handbook ·
            Slater/Clementi radii
          </span>
          <span className="hidden md:inline">
            Superheavy (Z≥104) properties are predictions; — means no accepted value
          </span>
          <span className="ml-auto hidden sm:inline">
            ← ↑ → ↓ navigate · / search · Esc close
          </span>
        </div>
      </footer>
    </div>
  )
}
