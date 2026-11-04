/**
 * 2D Isometric Molecular Structure SVG Renderer
 * Projects 3D atomic coordinates (CPK coloration, single/double/triple bonds)
 * onto a clean, high-performance vector SVG.
 * Completely immune to WebGL context limits and zero GPU overhead.
 */

import { h, type VNode } from 'nexus-framework'
import type { Compound } from '@/lib/synthesizer/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) || 128
  const g = parseInt(hex.substring(2, 4), 16) || 128
  const b = parseInt(hex.substring(4, 6), 16) || 128
  // Perceived brightness formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 150 ? '#090d16' : '#ffffff'
}

export function MolecularSvg({
  compound,
  width = 300,
  height = 112,
  interactive = false,
}: {
  compound: Compound
  width?: number
  height?: number
  interactive?: boolean
}): VNode {
  const atoms = compound.atoms3D ?? []
  const bonds = compound.bonds3D ?? []

  if (atoms.length === 0) {
    return H('div', { class: 'flex h-full w-full items-center justify-center font-mono text-[11px] text-zinc-500' }, 'No coordinates')
  }

  // Isometric projection angles (yaw 32°, pitch 22°)
  const theta = 0.5585 // 32 deg
  const phi = 0.384 // 22 deg
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const cosP = Math.cos(phi)
  const sinP = Math.sin(phi)

  interface ProjectedAtom {
    index: number
    element: string
    color: string
    radius: number
    px: number
    py: number
    pz: number // for depth sorting
  }

  const projected: ProjectedAtom[] = atoms.map((atom, idx) => {
    const [x, y, z] = atom.position
    // Rotate Y (theta)
    const x1 = x * cosT + z * sinT
    const z1 = -x * sinT + z * cosT
    // Rotate X (phi)
    const y1 = y * cosP - z1 * sinP
    const z2 = y * sinP + z1 * cosP

    return {
      index: idx,
      element: atom.element,
      color: atom.color || '#94a3b8',
      radius: (atom.radius ?? 0.35) * 26, // base pixel radius
      px: x1,
      py: -y1, // invert y for SVG coordinate system (y points down)
      pz: z2,
    }
  })

  // Calculate bounding box in projected space
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const p of projected) {
    if (p.px < minX) minX = p.px
    if (p.px > maxX) maxX = p.px
    if (p.py < minY) minY = p.py
    if (p.py > maxY) maxY = p.py
  }

  const spanX = Math.max(maxX - minX, 0.8)
  const spanY = Math.max(maxY - minY, 0.8)
  const padX = 36
  const padY = 28
  const availW = width - padX * 2
  const availH = height - padY * 2
  const scale = Math.min(availW / spanX, availH / spanY, 34)

  const midProjX = (minX + maxX) / 2
  const midProjY = (minY + maxY) / 2
  const centerCanvasX = width / 2
  const centerCanvasY = height / 2

  // Transform each atom to screen coordinates
  const screenAtoms = projected.map((p) => ({
    ...p,
    sx: centerCanvasX + (p.px - midProjX) * scale,
    sy: centerCanvasY + (p.py - midProjY) * scale,
    r: Math.max(Math.min(p.radius * (scale / 30), 16), 8),
  }))

  // Sort atoms by Z depth (back-to-front painter's algorithm)
  const sortedAtomIndices = [...screenAtoms]
    .sort((a, b) => a.pz - b.pz)
    .map((a) => a.index)

  const defsId = `mol-${compound.id.replace(/[^a-zA-Z0-9]/g, '_')}`

  return H('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: 'h-full w-full select-none',
    xmlns: 'http://www.w3.org/2000/svg',
  },
    // Gradients for 3D sphere illusion
    H('defs', null,
      ...screenAtoms.map((a, i) =>
        H('radialGradient', {
          id: `${defsId}-grad-${i}`,
          cx: '35%',
          cy: '35%',
          r: '65%',
          fx: '25%',
          fy: '25%',
        },
          H('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '0.75' }),
          H('stop', { offset: '40%', 'stop-color': a.color, 'stop-opacity': '1' }),
          H('stop', { offset: '100%', 'stop-color': '#000000', 'stop-opacity': '0.6' }),
        )
      ),
    ),

    // Bonds Layer
    H('g', { class: 'bonds' },
      ...bonds.map((b, bi) => {
        const a1 = screenAtoms[b.from]
        const a2 = screenAtoms[b.to]
        if (!a1 || !a2) return null

        const dx = a2.sx - a1.sx
        const dy = a2.sy - a1.sy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 1) return null

        const order = b.order ?? 1
        const nx = -dy / dist
        const ny = dx / dist

        if (order === 1) {
          return H('line', {
            key: `b-${bi}`,
            x1: a1.sx.toFixed(1),
            y1: a1.sy.toFixed(1),
            x2: a2.sx.toFixed(1),
            y2: a2.sy.toFixed(1),
            stroke: '#71717a',
            'stroke-width': '2.5',
            'stroke-linecap': 'round',
            opacity: '0.85',
          })
        }

        if (order === 2) {
          const off = 2.2
          return H('g', { key: `b-${bi}` },
            H('line', {
              x1: (a1.sx + nx * off).toFixed(1),
              y1: (a1.sy + ny * off).toFixed(1),
              x2: (a2.sx + nx * off).toFixed(1),
              y2: (a2.sy + ny * off).toFixed(1),
              stroke: '#a1a1aa',
              'stroke-width': '2.0',
              'stroke-linecap': 'round',
            }),
            H('line', {
              x1: (a1.sx - nx * off).toFixed(1),
              y1: (a1.sy - ny * off).toFixed(1),
              x2: (a2.sx - nx * off).toFixed(1),
              y2: (a2.sy - ny * off).toFixed(1),
              stroke: '#a1a1aa',
              'stroke-width': '2.0',
              'stroke-linecap': 'round',
            }),
          )
        }

        // Triple bond
        const off = 3.2
        return H('g', { key: `b-${bi}` },
          H('line', {
            x1: (a1.sx + nx * off).toFixed(1),
            y1: (a1.sy + ny * off).toFixed(1),
            x2: (a2.sx + nx * off).toFixed(1),
            y2: (a2.sy + ny * off).toFixed(1),
            stroke: '#d4d4d8',
            'stroke-width': '1.8',
            'stroke-linecap': 'round',
          }),
          H('line', {
            x1: a1.sx.toFixed(1),
            y1: a1.sy.toFixed(1),
            x2: a2.sx.toFixed(1),
            y2: a2.sy.toFixed(1),
            stroke: '#d4d4d8',
            'stroke-width': '1.8',
            'stroke-linecap': 'round',
          }),
          H('line', {
            x1: (a1.sx - nx * off).toFixed(1),
            y1: (a1.sy - ny * off).toFixed(1),
            x2: (a2.sx - nx * off).toFixed(1),
            y2: (a2.sy - ny * off).toFixed(1),
            stroke: '#d4d4d8',
            'stroke-width': '1.8',
            'stroke-linecap': 'round',
          }),
        )
      }),
    ),

    // Atoms Layer (Back to front)
    H('g', { class: 'atoms' },
      ...sortedAtomIndices.map((origIdx) => {
        const atom = screenAtoms[origIdx]
        const textColor = getContrastColor(atom.color)
        const fontSize = Math.max(Math.round(atom.r * 0.95), 8)

        return H('g', { key: `a-${origIdx}` },
          // Shadow under atom
          H('circle', {
            cx: (atom.sx + 1).toFixed(1),
            cy: (atom.sy + 1.5).toFixed(1),
            r: atom.r.toFixed(1),
            fill: '#000000',
            opacity: '0.35',
          }),
          // Shaded sphere
          H('circle', {
            cx: atom.sx.toFixed(1),
            cy: atom.sy.toFixed(1),
            r: atom.r.toFixed(1),
            fill: `url(#${defsId}-grad-${origIdx})`,
            stroke: 'rgba(255,255,255,0.25)',
            'stroke-width': '1',
          }),
          // Element Symbol
          H('text', {
            x: atom.sx.toFixed(1),
            y: (atom.sy + fontSize * 0.35).toFixed(1),
            'text-anchor': 'middle',
            'font-family': 'monospace',
            'font-size': `${fontSize}px`,
            'font-weight': 'bold',
            fill: textColor,
            'pointer-events': 'none',
          }, atom.element),
        )
      }),
    ),
  )
}
