import { h, type VNode } from 'nexus-framework'
import { ELEMENTS } from '@/lib/periodic'
import type { ElementData } from '@/lib/periodic/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

const WIDTH = 960
const HEIGHT = 260
const PAD = { top: 16, right: 18, bottom: 34, left: 42 }
const Y_MAX = 26
const x = (number: number) => PAD.left + ((number - 1) / 117) * (WIDTH - PAD.left - PAD.right)
const y = (value: number) => PAD.top + (1 - value / Y_MAX) * (HEIGHT - PAD.top - PAD.bottom)

export default function IonizationChart({ selected, onSelect }: {
  selected: number
  onSelect: (element: ElementData) => void
}): VNode {
  const points = ELEMENTS.flatMap((element) => element.ionizationEnergy == null
    ? []
    : [{ element, px: x(element.number), py: y(element.ionizationEnergy) }])
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${point.px.toFixed(1)},${point.py.toFixed(1)}`).join(' ')
  const yTicks = [0, 5, 10, 15, 20, 25]
  const periods = [2, 10, 18, 36, 54, 86]

  return H('section', { class: 'mt-5 w-full max-w-[1120px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0f18]/90', 'aria-label': 'First ionization energy chart' },
    H('div', { class: 'flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-white/10 px-3 py-2' },
      H('h2', { class: 'text-[12px] font-semibold text-zinc-100' }, 'First ionization energy'),
      H('span', { class: 'text-[10px] text-zinc-500' }, 'Energy required to remove the first electron · select a point to open that element')),
    H('div', { class: 'overflow-x-auto px-2 py-2' },
      H('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, class: 'min-w-[720px] w-full', role: 'img', 'aria-label': 'First ionization energy of elements 1 through 118, in electronvolts' },
        yTicks.map((tick) => H('g', { key: `y-${tick}` },
          H('line', { x1: PAD.left, y1: y(tick), x2: WIDTH - PAD.right, y2: y(tick), stroke: '#272d38', strokeWidth: 1 }),
          H('text', { x: PAD.left - 8, y: y(tick) + 3, fill: '#71717a', fontSize: 9, textAnchor: 'end' }, tick))),
        periods.map((atomicNumber) => H('line', { key: `period-${atomicNumber}`, x1: x(atomicNumber), y1: PAD.top, x2: x(atomicNumber), y2: HEIGHT - PAD.bottom, stroke: '#343b48', strokeWidth: 1, strokeDasharray: '3 4' })),
        H('path', { d: path, fill: 'none', stroke: '#fbbf24', strokeWidth: 1.5, strokeOpacity: 0.55, vectorEffect: 'non-scaling-stroke' }),
        points.map(({ element, px, py }) => H('circle', {
          key: element.number, cx: px, cy: py, r: selected === element.number ? 5 : 2.8,
          fill: selected === element.number ? '#ffffff' : '#fbbf24',
          stroke: selected === element.number ? '#fbbf24' : '#0a0f18', strokeWidth: selected === element.number ? 2 : 1,
          class: 'cursor-pointer transition-[r] hover:stroke-white', role: 'button', tabIndex: 0,
          onClick: () => onSelect(element),
          onKeyDown: (event: KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(element) } },
        }, H('title', null, `${element.name} (${element.symbol}) · Z ${element.number} · ${element.ionizationEnergy?.toFixed(3)} eV`))),
        [1, 20, 40, 60, 80, 100, 118].map((number) => H('text', { key: `x-${number}`, x: x(number), y: HEIGHT - 12, fill: '#71717a', fontSize: 9, textAnchor: 'middle' }, number)),
        H('text', { x: 10, y: HEIGHT / 2, fill: '#a1a1aa', fontSize: 9, textAnchor: 'middle', transform: `rotate(-90 10 ${HEIGHT / 2})` }, 'Ionization energy (eV)'),
        H('text', { x: WIDTH / 2, y: HEIGHT - 1, fill: '#71717a', fontSize: 9, textAnchor: 'middle' }, 'Atomic number'))),
    H('div', { class: 'flex flex-wrap items-center gap-2 px-3 pb-2 text-[9px] text-zinc-500' },
      H('span', { class: 'h-2 w-2 rounded-full bg-amber-400' }),
      `${points.length} reference values`,
      H('span', { class: 'ml-auto' }, 'Source: ELEMENTA periodic reference data · missing values are omitted')))
}
