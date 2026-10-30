'use client'

import { memo } from 'react'
import type { ElementData } from '@/lib/periodic/types'
import { CATEGORY_MAP } from '@/lib/periodic/types'
import { fmt, hexWithAlpha, isHeatMode, tileColor, usesBracketMass, ELEMENTS } from '@/lib/periodic'

interface PeriodicTableProps {
  selectedZ: number | null
  onSelect: (el: ElementData) => void
  colorMode: string
  isDimmed: (el: ElementData) => boolean
}

interface TileProps {
  el: ElementData
  colorMode: string
  selected: boolean
  dimmed: boolean
  onSelect: (el: ElementData) => void
}

const Tile = memo(function Tile({ el, colorMode, selected, dimmed, onSelect }: TileProps) {
  const tc = tileColor(el, colorMode)
  const cat = CATEGORY_MAP[el.category]
  const heat = isHeatMode(colorMode)
  const value = heat
    ? fmt(el[colorMode as keyof ElementData] as number | null, '', 2)
    : usesBracketMass(el)
      ? `[${Math.round(el.mass)}]`
      : fmt(el.mass, '', 3)

  return (
    <button
      onClick={() => onSelect(el)}
      title={`${el.name} (${el.symbol}) · Z=${el.number} · ${cat.label}`}
      aria-label={`${el.name}, atomic number ${el.number}, ${cat.label}`}
      className={`group relative flex h-full w-full flex-col justify-between rounded-[5px] border p-[3px] text-left transition-[transform,opacity,box-shadow] duration-150 hover:z-20 hover:scale-[1.18] focus-visible:z-20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300 ${
        dimmed ? 'opacity-[0.16] saturate-0' : 'opacity-100'
      }`}
      style={{
        gridColumn: el.xpos + 1,
        gridRow: el.ypos + 1,
        background: tc.bg,
        borderColor: selected ? cat.color : tc.border,
        boxShadow: selected ? `0 0 0 1.5px ${cat.color}, 0 0 14px ${hexWithAlpha(cat.color, 0.5)}` : undefined,
        zIndex: selected ? 15 : undefined,
      }}
    >
      <span className="flex w-full items-start justify-between leading-none">
        <span className="font-mono text-[8px] text-zinc-400">{el.number}</span>
        {el.radioactive && (
          <span className="text-[7px] leading-none text-amber-400/90" aria-label="radioactive">
            ☢
          </span>
        )}
      </span>
      <span
        className="text-center font-mono text-[15px] font-semibold leading-none tracking-tight"
        style={{ color: tc.text }}
      >
        {el.symbol}
      </span>
      <span
        className="hidden truncate text-center text-[6.5px] leading-[1.25] text-zinc-400 group-hover:block md:block"
      >
        {el.name}
      </span>
      <span className="truncate text-center font-mono text-[6.5px] leading-[1.25] text-zinc-500">
        {value}
      </span>
    </button>
  )
})

const F_PLACEHOLDERS = [
  { label: '57–71', sub: 'La–Lu', col: 4, row: 7 },
  { label: '89–103', sub: 'Ac–Lr', col: 4, row: 8 },
]

export function PeriodicTable({ selectedZ, onSelect, colorMode, isDimmed }: PeriodicTableProps) {
  return (
    <div className="w-max min-w-full p-1">
      <div
        className="pt-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(19, var(--tile))',
          gridTemplateRows: '18px repeat(7, var(--tile)) 10px repeat(2, var(--tile))',
          gap: 'var(--tile-gap)',
        }}
      >
        {/* group labels */}
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={`g-${i}`}
            className="flex items-end justify-center pb-0.5 font-mono text-[8px] text-zinc-600"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {i + 1}
          </div>
        ))}

        {/* period labels */}
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={`p-${i}`}
            className="flex items-center justify-end pr-1.5 font-mono text-[8px] text-zinc-600"
            style={{ gridColumn: 1, gridRow: i + 2 }}
          >
            {i + 1}
          </div>
        ))}
        {/* f-block series labels */}
        <div
          className="flex items-center justify-end pr-1.5 font-mono text-[8px] text-fuchsia-400/60"
          style={{ gridColumn: 1, gridRow: 10 }}
        >
          6f
        </div>
        <div
          className="flex items-center justify-end pr-1.5 font-mono text-[8px] text-pink-400/60"
          style={{ gridColumn: 1, gridRow: 11 }}
        >
          5f
        </div>

        {/* f-block insertion placeholders */}
        {F_PLACEHOLDERS.map((p) => (
          <div
            key={p.label}
            className="flex flex-col items-center justify-center rounded-[5px] border border-dashed border-white/15 text-[7px] leading-tight text-zinc-500"
            style={{ gridColumn: p.col, gridRow: p.row }}
          >
            <span className="font-mono">{p.label}</span>
            <span className="text-[6px] text-zinc-600">{p.sub}</span>
          </div>
        ))}

        {ELEMENTS.map((el) => (
          <Tile
            key={el.number}
            el={el}
            colorMode={colorMode}
            selected={selectedZ === el.number}
            dimmed={isDimmed(el)}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* block strip */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 font-mono text-[9px] text-zinc-600">
        {(['s', 'p', 'd', 'f'] as const).map((b) => (
          <span key={b} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: BLOCK_TINTS[b] }}
            />
            {b}-block · {BLOCK_LABELS[b]}
          </span>
        ))}
      </div>
    </div>
  )
}

const BLOCK_TINTS: Record<string, string> = {
  s: 'rgba(251,113,133,0.5)',
  p: 'rgba(74,222,128,0.5)',
  d: 'rgba(34,211,238,0.5)',
  f: 'rgba(232,121,249,0.5)',
}

const BLOCK_LABELS: Record<string, string> = {
  s: 'groups 1-2',
  p: 'groups 13-18',
  d: 'groups 3-12',
  f: 'inner series',
}
