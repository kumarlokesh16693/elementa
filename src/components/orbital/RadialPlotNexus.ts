import { h, type VNode } from 'nexus-framework'
import type { RadialStats } from '@/lib/orbital'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

const W = 360
const H_HEIGHT = 178
const M = { l: 38, r: 14, t: 16, b: 27 }

export function RadialPlotNexus({ stats, accent }: { stats: RadialStats; accent: string }): VNode {
  const { rs, P, R, rMax, rMp, rMean, nodes } = stats
  const iw = W - M.l - M.r
  const ih = H_HEIGHT - M.t - M.b
  const x = (r: number) => M.l + (r / rMax) * iw
  const yP = (p: number) => M.t + ih - p * ih
  const midY = M.t + ih * 0.5
  const yR = (rv: number) => midY - rv * ih * 0.36

  let dLine = ''
  for (let i = 0; i < rs.length; i += 2) {
    dLine += `${i === 0 ? 'M' : 'L'}${x(rs[i]).toFixed(1)},${yP(P[i]).toFixed(1)} `
  }
  const dArea = `${dLine}L${x(rMax).toFixed(1)},${yP(0).toFixed(1)} L${x(0).toFixed(1)},${yP(0).toFixed(1)} Z`

  let dR = ''
  for (let i = 0; i < rs.length; i += 2) {
    dR += `${i === 0 ? 'M' : 'L'}${x(rs[i]).toFixed(1)},${yR(R[i]).toFixed(1)} `
  }

  const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50]
  const step = steps.find((s) => rMax / s <= 7) ?? 100
  const ticks: number[] = []
  for (let v = 0; v <= rMax + 1e-9; v += step) ticks.push(v)

  const fmtR = (v: number) => (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2))

  const tickNodes: VNode[] = ticks.map((v) =>
    H(
      'g',
      { key: String(v) },
      H('line', {
        x1: x(v),
        y1: M.t + ih,
        x2: x(v),
        y2: M.t + ih + 3,
        stroke: '#52525b',
        'stroke-width': 1,
      }),
      H(
        'text',
        {
          x: x(v),
          y: M.t + ih + 12,
          'text-anchor': 'middle',
          'font-size': 8,
          fill: '#71717a',
          'font-family': 'var(--font-geist-mono), monospace',
        },
        fmtR(v),
      ),
    ),
  )

  const nodeElements: VNode[] = nodes.map((rn, i) =>
    H(
      'g',
      { key: String(i) },
      H('line', {
        x1: x(rn),
        y1: M.t,
        x2: x(rn),
        y2: M.t + ih,
        stroke: '#38bdf8',
        'stroke-width': 1,
        'stroke-dasharray': '2 2',
        'stroke-opacity': 0.7,
      }),
      H('circle', { cx: x(rn), cy: midY, r: 2.2, fill: '#38bdf8' }),
      H(
        'text',
        {
          x: x(rn),
          y: M.t + 9,
          'text-anchor': 'middle',
          'font-size': 7.5,
          fill: '#38bdf8',
          'font-family': 'var(--font-geist-mono), monospace',
        },
        `${rn.toFixed(2)}`,
      ),
    ),
  )

  return H(
    'svg',
    {
      viewBox: `0 0 ${W} ${H_HEIGHT}`,
      class: 'block w-full',
      role: 'img',
      'aria-label': 'Radial distribution plot',
    },
    // frame
    H('rect', {
      x: M.l,
      y: M.t,
      width: iw,
      height: ih,
      fill: 'none',
      stroke: '#ffffff',
      'stroke-opacity': 0.08,
    }),
    // zero line for R(r)
    H('line', {
      x1: M.l,
      y1: midY,
      x2: M.l + iw,
      y2: midY,
      stroke: '#ffffff',
      'stroke-opacity': 0.06,
      'stroke-dasharray': '2 3',
    }),
    // ticks
    ...tickNodes,
    H(
      'text',
      {
        x: M.l + iw,
        y: H_HEIGHT - 3,
        'text-anchor': 'end',
        'font-size': 8.5,
        fill: '#a1a1aa',
        'font-family': 'var(--font-geist-mono), monospace',
      },
      'r / a₀',
    ),
    // P(r) fill
    H('path', { d: dArea, fill: accent, 'fill-opacity': 0.18 }),
    H('path', { d: dLine, fill: 'none', stroke: accent, 'stroke-width': 1.6 }),
    // R(r) curve
    H('path', {
      d: dR,
      fill: 'none',
      stroke: '#93c5fd',
      'stroke-width': 1.1,
      'stroke-dasharray': '3 2',
      'stroke-opacity': 0.7,
    }),
    // nodes
    ...nodeElements,
    // r_mp marker
    H('line', {
      x1: x(rMp),
      y1: yP(1),
      x2: x(rMp),
      y2: M.t + ih,
      stroke: accent,
      'stroke-width': 1,
      'stroke-dasharray': '1 2',
    }),
    H('circle', { cx: x(rMp), cy: yP(1), r: 2.2, fill: accent }),
    // rMean tick
    H('line', {
      x1: x(rMean),
      y1: M.t + ih - 6,
      x2: x(rMean),
      y2: M.t + ih,
      stroke: '#e4e4e7',
      'stroke-width': 1.6,
    }),
    // Legend labels
    H(
      'text',
      {
        x: M.l + 4,
        y: M.t + 11,
        'font-size': 8.5,
        fill: accent,
        'font-family': 'var(--font-geist-mono), monospace',
      },
      '— P(r) = r²R²',
    ),
    H(
      'text',
      {
        x: M.l + 84,
        y: M.t + 11,
        'font-size': 8.5,
        fill: '#93c5fd',
        'font-family': 'var(--font-geist-mono), monospace',
      },
      '╌ R(r)',
    ),
  )
}
