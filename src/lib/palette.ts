/**
 * Colour ramps for heat-map modes.
 */

export type PaletteId = 'default' | 'viridis' | 'cividis'

export interface PaletteMeta {
  id: PaletteId
  label: string
  description: string
  stops: string[]
}

export const PALETTES: PaletteMeta[] = [
  {
    id: 'default',
    label: 'ELEMENTA',
    description: 'Teal to sand to coral. Monotonic in lightness.',
    stops: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
  },
  {
    id: 'viridis',
    label: 'Viridis',
    description: 'Perceptually uniform; safe for deuteranopia and protanopia.',
    stops: ['#440154', '#482878', '#3e4989', '#31688e', '#26828e', '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'],
  },
  {
    id: 'cividis',
    label: 'Cividis',
    description: 'Optimised for colour-vision deficiency; blue to yellow.',
    stops: ['#00204d', '#00336f', '#39486b', '#575c6d', '#707173', '#8a8779', '#a69d75', '#c4b56c', '#e4cf5b', '#ffea46'],
  },
]

export const PALETTE_MAP: Record<PaletteId, PaletteMeta> = Object.fromEntries(
  PALETTES.map((palette) => [palette.id, palette]),
) as Record<PaletteId, PaletteMeta>

const GREY = '#3f4652'

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function paletteColor(t: number, palette: PaletteId = 'default'): string {
  if (!Number.isFinite(t)) return GREY
  const stops = PALETTE_MAP[palette].stops
  const clamped = Math.min(1, Math.max(0, t))
  const scaled = clamped * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(scaled))
  const local = scaled - i
  const a = parseHex(stops[i])
  const b = parseHex(stops[i + 1])
  const mix = (x: number, y: number) => Math.round(x + (y - x) * local)
  return `rgb(${mix(a[0], b[0])}, ${mix(a[1], b[1])}, ${mix(a[2], b[2])})`
}

export function paletteGradientCss(palette: PaletteId = 'default'): string {
  const stops = PALETTE_MAP[palette].stops
  return `linear-gradient(90deg, ${stops.join(', ')})`
}
