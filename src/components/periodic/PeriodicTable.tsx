'use client'

import { memo } from 'react'
import type { CategoryKey, ColorMode, ElementData } from '@/lib/periodic/types'
import {
  ELEMENTS,
  getElement,
  isHeatMode,
  ORIGIN_MAP,
  originsFor,
  originPct,
  tileColor,
} from '@/lib/periodic'
import type { OriginKey } from '@/lib/periodic'

interface PeriodicTableProps {
  selected: number
  onSelect: (el: ElementData) => void
  colorMode: ColorMode
  /** element numbers that match the current search; null = no search active */
  matches: Set<number> | null
  /** category filter; null = all visible */
  activeCategories: Set<CategoryKey> | null
  /** origins mode: highlight elements with ≥5% of this channel; null = all */
  originFilter: OriginKey | null
}

function shortVal(v: number | null): string {
  if (v == null) return '—'
  const a = Math.abs(v)
  if (a >= 1000) return String(Math.round(v))
  if (a >= 100) return v.toFixed(0)
  if (a >= 10) return v.toFixed(1)
  if (a >= 0.01) return v.toFixed(2)
  return v.toExponential(1)
}

interface TileProps {
  el: ElementData
  colorMode: ColorMode
  dim: boolean
  selected: boolean
  onSelect: (el: ElementData) => void
}

const Tile = memo(function Tile({ el, colorMode, dim, selected, onSelect }: TileProps) {
  const c = tileColor(el, colorMode)
  const sub = isHeatMode(colorMode) ? shortVal(el[colorMode]) : String(el.mass)
  const origins = colorMode === 'origins' ? originsFor(el.number) : null
  const title = origins
    ? `${el.name} · ${el.mass} u · origin: ${origins
        .map(([k, v]) => `~${v}% ${ORIGIN_MAP[k].label.toLowerCase()}`)
        .join(' + ')}`
    : `${el.name} · ${el.mass} u · ${el.config}`
  return (
    <button
      type="button"
      onClick={() => onSelect(el)}
      title={title}
      style={{
        gridColumn: el.xpos + 1,
        gridRow: el.ypos + 1,
        background: c.bg,
        borderColor: selected ? c.text : c.border,
        color: c.text,
        boxShadow: selected ? `0 0 0 1.5px ${c.text}, 0 0 12px ${c.border}` : undefined,
      }}
      className={`group relative flex h-full w-full flex-col items-center justify-center rounded-[4px] border transition-[opacity,filter,transform] duration-150 hover:z-10 hover:scale-[1.12] hover:brightness-150 focus:outline-none ${
        dim ? 'opacity-15 saturate-0' : ''
      }`}
    >
      <span className="absolute left-1 top-0.5 font-mono text-[8px] leading-none opacity-80">
        {el.number}
      </span>
      <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-current opacity-60 group-hover:opacity-100" style={{ display: el.radioactive ? 'block' : 'none' }} />
      <span className="text-[15px] font-bold leading-none tracking-tight">{el.symbol}</span>
      <span className="mt-0.5 font-mono text-[7.5px] leading-none opacity-75">
        {origins ? `${ORIGIN_MAP[origins[0][0]].short} ${origins[0][1]}%` : sub}
      </span>
    </button>
  )
})

const GROUP_LABELS = Array.from({ length: 18 }, (_, i) => i + 1)

function GhostSeries({
  label,
  col,
  row,
  target,
  onSelect,
}: {
  label: string
  col: number
  row: number
  target: number
  onSelect: (el: ElementData) => void
}) {
  const el = getElement(target)
  if (!el) return null
  return (
    <button
      type="button"
      onClick={() => onSelect(el)}
      style={{ gridColumn: col, gridRow: row }}
      title={`Jump to ${el.name} (${target})`}
      className="flex h-full w-full flex-col items-center justify-center rounded-[4px] border border-dashed border-white/15 text-zinc-500 transition hover:border-white/40 hover:text-zinc-300"
    >
      <span className="font-mono text-[9px] leading-tight">{label}</span>
      <span className="text-[7px] uppercase tracking-wider opacity-70">
        {target === 57 ? 'La series' : 'Ac series'}
      </span>
    </button>
  )
}

export default function PeriodicTable({
  selected,
  onSelect,
  colorMode,
  matches,
  activeCategories,
  originFilter,
}: PeriodicTableProps) {
  return (
    <div className="w-max">
      <div
        className="pt-grid inline-grid"
        style={{
          gridTemplateColumns: '20px repeat(18, var(--tile))',
          gridTemplateRows: '16px repeat(7, var(--tile)) 14px repeat(2, var(--tile))',
          gap: 'var(--tile-gap)',
        }}
      >
        {/* group header */}
        <div />
        {GROUP_LABELS.map((g) => (
          <div
            key={`g-${g}`}
            className="flex items-end justify-center pb-0.5 font-mono text-[8px] text-zinc-600"
          >
            {g}
          </div>
        ))}

        {/* period labels */}
        {[1, 2, 3, 4, 5, 6, 7].map((p) => (
          <div
            key={`p-${p}`}
            style={{ gridRow: p + 1, gridColumn: 1 }}
            className="flex items-center justify-end pr-1 font-mono text-[8px] text-zinc-600"
          >
            {p}
          </div>
        ))}
        {['6*', '7*'].map((p, i) => (
          <div
            key={`pf-${p}`}
            style={{ gridRow: 10 + i, gridColumn: 1 }}
            className="flex items-center justify-end pr-1 font-mono text-[8px] text-zinc-600"
          >
            {p}
          </div>
        ))}

        {/* f-block pull-out markers in the main body */}
        <GhostSeries label="57–71" col={4} row={7} target={57} onSelect={onSelect} />
        <GhostSeries label="89–103" col={4} row={8} target={89} onSelect={onSelect} />

        {ELEMENTS.map((el) => {
          const dimSearch = matches != null && !matches.has(el.number)
          const dimCat = activeCategories != null && !activeCategories.has(el.category)
          const dimOrigin =
            originFilter != null && originPct(el.number, originFilter) < 5
          return (
            <Tile
              key={el.number}
              el={el}
              colorMode={colorMode}
              dim={dimSearch || dimCat || dimOrigin}
              selected={selected === el.number}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}
