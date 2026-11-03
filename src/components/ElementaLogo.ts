import { h, type VNode } from 'nexus-framework'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

interface LogoProps {
  size?: number
  class?: string
}

export function ElementaLogo({ size = 26, class: className }: LogoProps = {}): VNode {
  return H(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 128 128',
      width: String(size),
      height: String(size),
      class: className ?? 'shrink-0',
    },
    H('defs', null,
      H('radialGradient', { id: 'elem-bg-c', cx: '50%', cy: '50%', r: '65%' },
        H('stop', { offset: '0%', 'stop-color': '#0e1726' }),
        H('stop', { offset: '60%', 'stop-color': '#070a12' }),
        H('stop', { offset: '100%', 'stop-color': '#030508' }),
      ),
      H('radialGradient', { id: 'elem-core-c', cx: '50%', cy: '50%', r: '50%' },
        H('stop', { offset: '0%', 'stop-color': '#ffffff' }),
        H('stop', { offset: '30%', 'stop-color': '#fef08a' }),
        H('stop', { offset: '70%', 'stop-color': '#f59e0b' }),
        H('stop', { offset: '100%', 'stop-color': '#b45309', 'stop-opacity': '0' }),
      ),
      H('linearGradient', { id: 'elem-amber-c', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
        H('stop', { offset: '0%', 'stop-color': '#fef08a' }),
        H('stop', { offset: '50%', 'stop-color': '#f59e0b' }),
        H('stop', { offset: '100%', 'stop-color': '#b45309' }),
      ),
      H('linearGradient', { id: 'elem-cyan-c', x1: '100%', y1: '0%', x2: '0%', y2: '100%' },
        H('stop', { offset: '0%', 'stop-color': '#e0f2fe' }),
        H('stop', { offset: '50%', 'stop-color': '#38bdf8' }),
        H('stop', { offset: '100%', 'stop-color': '#0284c7' }),
      ),
      H('linearGradient', { id: 'elem-purple-c', x1: '0%', y1: '50%', x2: '100%', y2: '50%' },
        H('stop', { offset: '0%', 'stop-color': '#c084fc' }),
        H('stop', { offset: '50%', 'stop-color': '#818cf8' }),
        H('stop', { offset: '100%', 'stop-color': '#4f46e5' }),
      ),
    ),
    // Shield Container
    H('rect', {
      x: 4,
      y: 4,
      width: 120,
      height: 120,
      rx: 28,
      fill: 'url(#elem-bg-c)',
      stroke: '#38bdf8',
      'stroke-width': 2,
      'stroke-opacity': 0.45,
    }),
    H('rect', {
      x: 6,
      y: 6,
      width: 116,
      height: 116,
      rx: 26,
      fill: 'none',
      stroke: '#fbbf24',
      'stroke-width': 1,
      'stroke-opacity': 0.25,
    }),
    // Orbit 1: Cyan (-45 deg tilt)
    H('g', { transform: 'rotate(-45 64 64)' },
      H('ellipse', {
        cx: 64,
        cy: 64,
        rx: 46,
        ry: 17,
        fill: 'none',
        stroke: 'url(#elem-cyan-c)',
        'stroke-width': 3,
      }),
      H('circle', { cx: 110, cy: 64, r: 4, fill: '#38bdf8' }),
      H('circle', { cx: 110, cy: 64, r: 1.8, fill: '#ffffff' }),
    ),
    // Orbit 2: Amber (+45 deg tilt)
    H('g', { transform: 'rotate(45 64 64)' },
      H('ellipse', {
        cx: 64,
        cy: 64,
        rx: 46,
        ry: 17,
        fill: 'none',
        stroke: 'url(#elem-amber-c)',
        'stroke-width': 3,
      }),
      H('circle', { cx: 18, cy: 64, r: 4, fill: '#f59e0b' }),
      H('circle', { cx: 18, cy: 64, r: 1.8, fill: '#ffffff' }),
    ),
    // Orbit 3: Equatorial Purple (horizontal)
    H('ellipse', {
      cx: 64,
      cy: 64,
      rx: 48,
      ry: 14,
      fill: 'none',
      stroke: 'url(#elem-purple-c)',
      'stroke-width': 2.5,
      'stroke-dasharray': '12 4',
      'stroke-opacity': 0.9,
    }),
    H('circle', { cx: 64, cy: 78, r: 3.5, fill: '#818cf8' }),
    H('circle', { cx: 64, cy: 78, r: 1.5, fill: '#ffffff' }),
    // Central Nucleus Core
    H('circle', { cx: 64, cy: 64, r: 16, fill: 'url(#elem-core-c)', opacity: 0.7 }),
    H('circle', { cx: 64, cy: 64, r: 9, fill: '#ffffff' }),
    H('circle', { cx: 64, cy: 64, r: 6.5, fill: '#f59e0b' }),
    H('circle', { cx: 64, cy: 64, r: 3, fill: '#ffffff' }),
    // Stylized Quantum 'E' Core
    H('path', {
      d: 'M 61 58.5 L 67 58.5 M 61 64 L 66 64 M 61 69.5 L 67 69.5 M 61 58.5 L 61 69.5',
      stroke: '#0c1220',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  )
}
