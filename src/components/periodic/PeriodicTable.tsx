import { h, type VNode } from 'nexus-framework'
import type { CategoryKey, ColorMode, ElementData } from '@/lib/periodic/types'
import {
  ELEMENTS, getElement, isHeatMode, ORIGIN_MAP, originsFor, originPct, tileColor,
} from '@/lib/periodic'
import type { OriginKey } from '@/lib/periodic'
import type { PaletteId } from '@/lib/palette'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

interface PeriodicTableProps {
  selected: number
  onSelect: (el: ElementData) => void
  colorMode: ColorMode
  palette?: PaletteId
  matches: Set<number> | null
  activeCategories: Set<CategoryKey> | null
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

function Tile({ el, colorMode, palette, dim, selected, onSelect }: {
  el: ElementData; colorMode: ColorMode; palette: PaletteId; dim: boolean; selected: boolean; onSelect: (el: ElementData) => void
}): VNode {
  const c = tileColor(el, colorMode, palette)
  const sub = isHeatMode(colorMode) ? shortVal(el[colorMode]) : String(el.mass)
  const origins = colorMode === 'origins' ? originsFor(el.number) : null
  const title = origins
    ? `${el.name} · ${el.mass} u · origin: ${origins.map(([k, v]) => `~${v}% ${ORIGIN_MAP[k].label.toLowerCase()}`).join(' + ')}`
    : `${el.name} · ${el.mass} u · ${el.config}`
  return H('button', {
    type: 'button', onClick: () => onSelect(el), title,
    'aria-label': `${el.name}, symbol ${el.symbol}, atomic number ${el.number}, ${el.mass} unified atomic mass units, ${el.category.replace('-', ' ')}, ${el.phase} at STP`,
    style: { gridColumn: el.xpos + 1, gridRow: el.ypos + 1, background: c.bg, borderColor: selected ? c.text : c.border, color: c.text, boxShadow: selected ? `0 0 0 1.5px ${c.text}, 0 0 12px ${c.border}` : undefined },
    class: `group relative grid h-full w-full grid-rows-[11px_1fr_13px] items-center rounded-[4px] border transition-[opacity,filter,transform] duration-150 hover:z-10 hover:scale-[1.12] hover:brightness-150 focus:outline-none ${dim ? 'opacity-15 saturate-0' : ''}`,
  },
    H('span', { class: 'justify-self-start pl-1 font-mono text-[9px] leading-none opacity-90' }, el.number),
    H('span', { class: 'absolute right-1 top-1 h-1 w-1 rounded-full bg-current opacity-60 group-hover:opacity-100', style: { display: el.radioactive ? 'block' : 'none' } }),
    H('span', { class: 'self-center text-[17px] font-bold leading-none tracking-tight' }, el.symbol),
    H('span', { class: 'self-start font-mono text-[9px] leading-none opacity-85' }, origins ? `${ORIGIN_MAP[origins[0][0]].short} ${origins[0][1]}%` : sub),
  ) as VNode
}

const GROUP_LABELS = Array.from({ length: 18 }, (_, i) => i + 1)

function GhostSeries({ label, col, row, target, onSelect }: {
  label: string; col: number; row: number; target: number; onSelect: (el: ElementData) => void
}): VNode | null {
  const el = getElement(target)
  if (!el) return null
  return H('button', {
    type: 'button', onClick: () => onSelect(el), style: { gridColumn: col, gridRow: row },
    title: `Jump to ${el.name} (${target})`,
    class: 'flex h-full w-full flex-col items-center justify-center rounded-[4px] border border-dashed border-white/15 text-zinc-500 transition hover:border-white/40 hover:text-zinc-300',
  },
    H('span', { class: 'font-mono text-[10px] leading-tight' }, label),
    H('span', { class: 'text-[8px] uppercase tracking-wider opacity-80' }, target === 57 ? 'La series' : 'Ac series'),
  ) as VNode
}

export default function PeriodicTable({ selected, onSelect, colorMode, palette = 'default', matches, activeCategories, originFilter }: PeriodicTableProps): VNode {
  const cells: Array<VNode | null> = [
    H('div', null),
    ...GROUP_LABELS.map((g) => H('div', { key: `g-${g}`, class: 'flex items-end justify-center pb-0.5 font-mono text-[8px] text-zinc-600' }, g)),
    ...[1, 2, 3, 4, 5, 6, 7].map((p) => H('div', { key: `p-${p}`, style: { gridRow: p + 1, gridColumn: 1 }, class: 'flex items-center justify-end pr-1 font-mono text-[8px] text-zinc-600' }, p)),
    ...['6*', '7*'].map((p, i) => H('div', { key: `pf-${p}`, style: { gridRow: 10 + i, gridColumn: 1 }, class: 'flex items-center justify-end pr-1 font-mono text-[8px] text-zinc-600' }, p)),
    GhostSeries({ label: '57–71', col: 4, row: 7, target: 57, onSelect }),
    GhostSeries({ label: '89–103', col: 4, row: 8, target: 89, onSelect }),
    ...ELEMENTS.map((el) => {
      const dimSearch = matches != null && !matches.has(el.number)
      const dimCat = activeCategories != null && !activeCategories.has(el.category)
      const dimOrigin = originFilter != null && originPct(el.number, originFilter) < 5
      return Tile({ el, colorMode, palette, dim: dimSearch || dimCat || dimOrigin, selected: selected === el.number, onSelect })
    }),
  ]
  return H('div', { class: 'w-full max-w-full overflow-x-auto pb-2' }, H('div', { class: 'mx-auto w-max' }, H('div', {
    class: 'pt-grid inline-grid',
    style: { gridTemplateColumns: '20px repeat(18, var(--tile))', gridTemplateRows: '16px repeat(7, var(--tile)) 14px repeat(2, var(--tile))', gap: 'var(--tile-gap)' },
  }, cells))) as VNode
}
