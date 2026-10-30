/* ============================================================
   PROJECT DAEDALUS — physical constants & shared utilities
   ============================================================ */

export type PlanetId = 'earth' | 'mars'

export interface Planet {
  id: PlanetId
  name: string
  /** mean radius, m */
  radius: number
  /** gravitational parameter, m^3/s^2 */
  mu: number
  /** sensible entry interface altitude, m */
  entryInterface: number
  /** Sutton–Graves stagnation heating constant (SI: q = k * sqrt(rho/Rn) * v^3, W/m^2) */
  kSG: number
  /** ui accent */
  color: string
}

export const G0 = 9.80665

export const PLANETS: Record<PlanetId, Planet> = {
  earth: {
    id: 'earth',
    name: 'EARTH',
    radius: 6_371_000,
    mu: 3.986004418e14,
    entryInterface: 120_000,
    kSG: 1.7415e-4,
    color: '#5ea8ff',
  },
  mars: {
    id: 'mars',
    name: 'MARS',
    radius: 3_389_500,
    mu: 4.282837e13,
    entryInterface: 140_000,
    kSG: 1.9027e-4,
    color: '#ff7a59',
  },
}

export function clamp(x: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, x))
}

export const DEG = 180 / Math.PI
export const RAD = Math.PI / 180

/* ------------------------------------------------------------------
   Heat colormap (blue → cyan → green → yellow → orange → red → white)
   Shared by 3D trajectory coloring, color bar legend and charts.
   ------------------------------------------------------------------ */

type RGB = [number, number, number]

const HEAT_STOPS: Array<{ p: number; c: RGB }> = [
  { p: 0.0, c: [10, 34, 90] },
  { p: 0.18, c: [33, 113, 181] },
  { p: 0.34, c: [65, 182, 196] },
  { p: 0.48, c: [128, 205, 165] },
  { p: 0.6, c: [247, 227, 95] },
  { p: 0.74, c: [248, 140, 40] },
  { p: 0.88, c: [227, 45, 25] },
  { p: 1.0, c: [255, 244, 230] },
]

/** normalized heat 0..1 → [r,g,b] floats 0..1 */
export function heatColorRGB(x: number): RGB {
  const t = clamp(x, 0, 1)
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const a = HEAT_STOPS[i]
    const b = HEAT_STOPS[i + 1]
    if (t >= a.p && t <= b.p) {
      const f = (t - a.p) / (b.p - a.p || 1)
      return [
        (a.c[0] + (b.c[0] - a.c[0]) * f) / 255,
        (a.c[1] + (b.c[1] - a.c[1]) * f) / 255,
        (a.c[2] + (b.c[2] - a.c[2]) * f) / 255,
      ]
    }
  }
  return [1, 1, 1]
}

/** CSS gradient string for the color bar legend */
export const HEAT_GRADIENT_CSS = `linear-gradient(90deg,
  rgb(10,34,90) 0%,
  rgb(33,113,181) 18%,
  rgb(65,182,196) 34%,
  rgb(128,205,165) 48%,
  rgb(247,227,95) 60%,
  rgb(248,140,40) 74%,
  rgb(227,45,25) 88%,
  rgb(255,244,230) 100%)`
