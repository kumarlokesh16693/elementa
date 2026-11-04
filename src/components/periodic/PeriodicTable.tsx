import { h, type VNode } from 'nexus-framework'
import type { CategoryKey, ColorMode, ElementData } from '@/lib/periodic/types'
import {
  ELEMENTS, getElement, isHeatMode, ORIGIN_MAP, originsFor, originPct, tileColor,
} from '@/lib/periodic'
import type { OriginKey } from '@/lib/periodic'
import type { PaletteId } from '@/lib/palette'
import { getPhaseAtTemperature, SIMULATED_PHASE_COLORS, type SimulatedPhase } from '@/lib/periodic/temperature'

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
  simulatedTemp?: number | null
  activePhaseFilter?: SimulatedPhase | null
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

function Tile({ el, colorMode, palette, dim, selected, simulatedTemp, onSelect }: {
  el: ElementData
  colorMode: ColorMode
  palette: PaletteId
  dim: boolean
  selected: boolean
  simulatedTemp?: number | null
  onSelect: (el: ElementData) => void
}): VNode {
  const currentTemp = simulatedTemp ?? 298.15
  const phaseInfo = getPhaseAtTemperature(el, currentTemp)
  let c = tileColor(el, colorMode, palette)

  if (colorMode === 'phase') {
    const pStyle = SIMULATED_PHASE_COLORS[phaseInfo.phase]
    c = {
      bg: pStyle.bg,
      border: pStyle.border,
      text: pStyle.text,
    }
  }

  const sub = isHeatMode(colorMode) ? shortVal(el[colorMode]) : String(el.mass)
  const origins = colorMode === 'origins' ? originsFor(el.number) : null
  const tempLabel = currentTemp.toFixed(1) + ' K'
  const title = origins
    ? `${el.name} · ${el.mass} u · ${phaseInfo.label} at ${tempLabel} · origin: ${origins.map(([k, v]) => `~${v}% ${ORIGIN_MAP[k].label.toLowerCase()}`).join(' + ')}`
    : `${el.name} · ${el.mass} u · ${phaseInfo.label} at ${tempLabel}${phaseInfo.transitionInfo ? ` (${phaseInfo.transitionInfo})` : ''} · ${el.config}`

  let shadow = selected ? `0 0 0 1.5px ${c.text}, 0 0 12px ${c.border}` : undefined
  if (!selected && phaseInfo.isNearTransition) {
    shadow = '0 0 0 1.5px #fbbf24, 0 0 10px rgba(251, 191, 36, 0.7)'
  }

  return H('button', {
    type: 'button', onClick: () => onSelect(el), title,
    'aria-label': `${el.name}, symbol ${el.symbol}, atomic number ${el.number}, ${el.mass} unified atomic mass units, ${el.category.replace('-', ' ')}, ${phaseInfo.label} at ${tempLabel}`,
    style: {
      gridColumn: el.xpos + 1,
      gridRow: el.ypos + 1,
      background: c.bg,
      borderColor: selected ? c.text : (phaseInfo.isNearTransition ? '#fbbf24' : c.border),
      color: c.text,
      boxShadow: shadow,
    },
    class: `group relative grid h-full w-full grid-rows-[11px_1fr_13px] items-center rounded-[4px] border transition-[opacity,filter,transform] duration-150 hover:z-10 hover:scale-[1.12] hover:brightness-150 focus:outline-none ${dim ? 'opacity-15 saturate-0' : ''} ${phaseInfo.isNearTransition ? 'animate-pulse' : ''}`,
  },
    H('span', { class: 'justify-self-start pl-1 font-mono text-[9px] leading-none opacity-90' }, el.number),
    H('span', { class: 'absolute right-3.5 top-1.5 h-1 w-1 rounded-full bg-current opacity-60 group-hover:opacity-100', style: { display: el.radioactive ? 'block' : 'none' } }),
    H('span', {
      class: 'absolute right-1 top-0.5 text-[8.5px] leading-none opacity-70 group-hover:opacity-100 pointer-events-none select-none z-10',
      title: `${phaseInfo.label} at ${tempLabel}`,
    }, phaseInfo.icon),
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

export default function PeriodicTable({
  selected,
  onSelect,
  colorMode,
  palette = 'default',
  matches,
  activeCategories,
  originFilter,
  simulatedTemp = 298.15,
  activePhaseFilter = null,
}: PeriodicTableProps): VNode {
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
      const phaseInfo = getPhaseAtTemperature(el, simulatedTemp ?? 298.15)
      const dimPhase = activePhaseFilter != null && phaseInfo.phase !== activePhaseFilter
      return Tile({
        el,
        colorMode,
        palette,
        dim: dimSearch || dimCat || dimOrigin || dimPhase,
        selected: selected === el.number,
        simulatedTemp,
        onSelect,
      })
    }),
  ]
  return H('div', { class: 'w-full max-w-full overflow-x-auto pb-2' }, H('div', { class: 'mx-auto w-max' }, H('div', {
    class: 'pt-grid inline-grid',
    style: { gridTemplateColumns: '20px repeat(18, var(--tile))', gridTemplateRows: '16px repeat(7, var(--tile)) 14px repeat(2, var(--tile))', gap: 'var(--tile-gap)' },
  }, cells))) as VNode
}
