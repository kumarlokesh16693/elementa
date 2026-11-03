import { h, type VNode } from 'nexus-framework'
import type { ElementData } from '@/lib/periodic/types'
import { SHELL_LETTERS } from '@/lib/periodic/types'

interface Bohr2DProps {
  element: ElementData
  accent: string
  /** playback multiplier, 1 = normal */
  speed?: number
  animated?: boolean
}

const SIZE = 400
const C = SIZE / 2

function shellRadii(n: number): number[] {
  if (n === 1) return [112]
  const minR = 64
  const maxR = 184
  const step = (maxR - minR) / (n - 1)
  return Array.from({ length: n }, (_, i) => minR + i * step)
}

/**
 * Research-style 2D Bohr model.
 * Concentric quantized shells (K..Q), evenly distributed electrons per shell,
 * each shell rotating as a rigid orbital group with inner shells faster
 * (approximating v ∝ 1/n of the Bohr atom).
 */
export function Bohr2D({ element, accent, speed = 1, animated = true }: Bohr2DProps): VNode {
  const shells = element.shells
  const radii = shellRadii(shells.length)
  const neutrons = Math.max(0, Math.round(element.mass) - element.number)

  // quantized orbit rings
  const rings = radii.map((r, i) => h('circle', {
    key: `ring-${i}`,
    cx: C,
    cy: C,
    r,
    fill: 'none',
    stroke: accent,
    'stroke-opacity': 0.3,
    'stroke-width': 1,
    'stroke-dasharray': '3 4',
  }))

  // electrons — one rigid rotating group per shell
  const orbitals = shells.map((count, i) => {
    const r = radii[i]
    const duration = animated ? (3.4 + i * 2.1) / Math.max(speed, 0.05) : 0
    const offset = i * 17
    const electrons = Array.from({ length: count }, (_, j) => {
      const a = ((offset + (360 / count) * j) * Math.PI) / 180
      const x = C + r * Math.cos(a)
      const y = C + r * Math.sin(a)
      return h('circle', {
        key: j,
        cx: x.toFixed(2),
        cy: y.toFixed(2),
        r: 3.4,
        fill: accent,
        stroke: '#05080f',
        'stroke-width': 0.6,
      })
    })
    return h('g', {
      key: `orb-${i}`,
      style: animated
        ? {
            animation: `orbit ${duration.toFixed(2)}s linear infinite`,
            transformOrigin: '200px 200px',
            transformBox: 'view-box',
          }
        : undefined,
    }, electrons)
  })

  // shell badges K·n
  const badges = shells.map((count, i) => {
    const r = radii[i]
    const label = SHELL_LETTERS[i] ?? `n${i + 1}`
    return h('g', { key: `badge-${i}` },
      h('rect', {
        x: C - 21,
        y: C - r - 8,
        width: 42,
        height: 16,
        rx: 8,
        fill: '#0b1220',
        'fill-opacity': 0.92,
        stroke: accent,
        'stroke-opacity': 0.45,
        'stroke-width': 1,
      }),
      h('text', {
        x: C,
        y: C - r + 4,
        'text-anchor': 'middle',
        'font-size': 9.5,
        'font-family': 'var(--font-geist-mono), monospace',
        fill: accent,
      }, `${label}·${count}`))
  })

  return h('svg', {
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    class: 'h-full w-full',
    role: 'img',
    'aria-label': `2D Bohr model of ${element.name}`,
  },
    h('defs', null,
      h('radialGradient', { id: 'bohr2d-nucleus', cx: '50%', cy: '42%', r: '70%' },
        h('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.95 }),
        h('stop', { offset: '55%', 'stop-color': accent, 'stop-opacity': 0.85 }),
        h('stop', { offset: '100%', 'stop-color': accent, 'stop-opacity': 0.22 }),
      ),
    ),
    rings,
    orbitals,
    badges,
    // nucleus
    h('circle', {
      cx: C,
      cy: C,
      r: 30,
      fill: 'url(#bohr2d-nucleus)',
      stroke: accent,
      'stroke-opacity': 0.85,
      'stroke-width': 1.2,
    }),
    h('text', {
      x: C,
      y: C - 1,
      'text-anchor': 'middle',
      'font-size': 17,
      'font-weight': 700,
      fill: '#ffffff',
      'font-family': 'var(--font-geist-sans), sans-serif',
    }, element.symbol),
    h('text', {
      x: C,
      y: C + 14,
      'text-anchor': 'middle',
      'font-size': 8,
      fill: '#ffffff',
      'fill-opacity': 0.78,
      'font-family': 'var(--font-geist-mono), monospace',
    }, `${element.number}p⁺ ${neutrons}n⁰`),
    // caption
    h('text', {
      x: C,
      y: SIZE - 6,
      'text-anchor': 'middle',
      'font-size': 9,
      fill: '#7d8596',
      'font-family': 'var(--font-geist-mono), monospace',
    }, `Bohr shell model · ${shells.length} shell${shells.length > 1 ? 's' : ''} · ${element.number} e⁻`),
  ) as VNode
}

export default Bohr2D
