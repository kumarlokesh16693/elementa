/**
 * ELEMENTA — Electromagnetism & Maxwell's Equations
 * Physics formulas for electrostatics, magnetostatics, and electrodynamics.
 * All SI units. Atomic-unit-scale fields are scaled for visualization.
 */

/* ------------------------------------------------------------------ */
/* Fundamental constants (SI)                                         */
/* ------------------------------------------------------------------ */

export const EPSILON_0 = 8.8541878128e-12 // F/m
export const MU_0 = 1.25663706212e-6 // N/A² (exact pre-2019; effectively exact)
export const K_E = 1 / (4 * Math.PI * EPSILON_0) // 8.9875517923e9 N·m²/C²
export const C = 299792458 // m/s
export const Q_E = 1.602176634e-19 // C
export const ME = 9.1093837139e-31 // kg

/** Vacuum impedance Z₀ = sqrt(μ₀/ε₀) ≈ 376.73 Ω */
export const Z0 = Math.sqrt(MU_0 / EPSILON_0)

/* ------------------------------------------------------------------ */
/* Vector helpers                                                     */
/* ------------------------------------------------------------------ */

export interface Vec3 { x: number; y: number; z: number }

export function add(a: Vec3, b: Vec3): Vec3 { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z } }
export function sub(a: Vec3, b: Vec3): Vec3 { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z } }
export function mul(a: Vec3, s: number): Vec3 { return { x: a.x * s, y: a.y * s, z: a.z * s } }
export function div(a: Vec3, s: number): Vec3 { return { x: a.x / s, y: a.y / s, z: a.z / s } }
export function dot(a: Vec3, b: Vec3): number { return a.x * b.x + a.y * b.y + a.z * b.z }
export function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}
export function mag(a: Vec3): number { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) }
export function norm(a: Vec3): Vec3 {
  const m = mag(a)
  if (!m || !Number.isFinite(m)) return { x: 0, y: 0, z: 0 }
  return { x: a.x / m, y: a.y / m, z: a.z / m }
}

/* ------------------------------------------------------------------ */
/* Electrostatics — point charge field                                */
/* ------------------------------------------------------------------ */

/** Electric field E(r) from a point charge q at position r₀. */
export function eFieldPoint(q: number, r0: Vec3, r: Vec3): Vec3 {
  const d = sub(r, r0)
  const r3 = Math.pow(mag(d), 3)
  if (!r3 || r3 < 1e-18) return { x: 0, y: 0, z: 0 }
  return mul(d, (K_E * q) / r3)
}

/** Electric potential V(r) from a point charge q at r₀ (V(∞)=0). */
export function vPotentialPoint(q: number, r0: Vec3, r: Vec3): number {
  const d = mag(sub(r, r0))
  if (d < 1e-12) return 0
  return (K_E * q) / d
}

/* ------------------------------------------------------------------ */
/* Magnetostatics — Biot–Savart                                       */
/* ------------------------------------------------------------------ */

/** Magnetic field dB from a current element I·dl at source r₀, observed at r. */
export function dbI(I: number, dl: Vec3, r0: Vec3, r: Vec3): Vec3 {
  const d = sub(r, r0)
  const r3 = Math.pow(mag(d), 3)
  if (!r3 || r3 < 1e-18) return { x: 0, y: 0, z: 0 }
  const c = (MU_0 / (4 * Math.PI)) * I
  const cr = cross(dl, d)
  return mul(cr, c / r3)
}

/** B-field on the axis of a circular loop radius R, current I, at distance z. */
export function bLoopAxis(I: number, R: number, z: number): number {
  return (MU_0 * I * R * R) / (2 * Math.pow(R * R + z * z, 1.5))
}

/* ------------------------------------------------------------------ */
/* Electrodynamics — plane EM wave                                    */
/* ------------------------------------------------------------------ */

/**
 * Plane EM wave propagating along +z.
 * E = E₀·sin(kz − ωt) x̂,  B = B₀·sin(kz − ωt) ŷ,  B₀ = E₀/c.
 * Returns { E, B } vectors at position r, time t.
 */
export function emWave(E0: number, fHz: number, z: number, t: number): { E: Vec3; B: Vec3 } {
  const omega = 2 * Math.PI * fHz
  const k = omega / C
  const phase = k * z - omega * t
  const s = Math.sin(phase)
  const B0 = E0 / C
  return {
    E: { x: E0 * s, y: 0, z: 0 },
    B: { x: 0, y: B0 * s, z: 0 },
  }
}

/** Wavelength λ = c / f. */
export function wavelength(fHz: number): number { return C / fHz }

/* ------------------------------------------------------------------ */
/* Lorentz force                                                      */
/* ------------------------------------------------------------------ */

/** F = q(E + v × B). */
export function lorentzForce(q: number, v: Vec3, E: Vec3, B: Vec3): Vec3 {
  const vxB = cross(v, B)
  const fx = q * (E.x + vxB.x)
  const fy = q * (E.y + vxB.y)
  const fz = q * (E.z + vxB.z)
  return { x: fx, y: fy, z: fz }
}

/** Acceleration a = F/m for a particle of mass m. */
export function acceleration(q: number, v: Vec3, E: Vec3, B: Vec3, m: number): Vec3 {
  const f = lorentzForce(q, v, E, B)
  return mul(f, 1 / m)
}

/* ------------------------------------------------------------------ */
/* Integration helpers (RK4)                                          */
/* ------------------------------------------------------------------ */

/** RK4 step for charged particle: state = {r, v}, derivatives = {v, a}. */
export interface ParticleState { r: Vec3; v: Vec3 }

export function rk4Step(
  state: ParticleState,
  dt: number,
  q: number,
  m: number,
  eField: (r: Vec3) => Vec3,
  bField: (r: Vec3) => Vec3,
): ParticleState {
  const h = dt
  const k1v = acceleration(q, state.v, eField(state.r), bField(state.r), m)
  const k1r = state.v

  const r2 = add(state.r, mul(k1r, h / 2))
  const v2 = add(state.v, mul(k1v, h / 2))
  const k2v = acceleration(q, v2, eField(r2), bField(r2), m)
  const k2r = v2

  const r3 = add(state.r, mul(k2r, h / 2))
  const v3 = add(state.v, mul(k2v, h / 2))
  const k3v = acceleration(q, v3, eField(r3), bField(r3), m)
  const k3r = v3

  const r4 = add(state.r, mul(k3r, h))
  const v4 = add(state.v, mul(k3v, h))
  const k4v = acceleration(q, v4, eField(r4), bField(r4), m)
  const k4r = v4

  const rNext = add(state.r, mul(add(k1r, mul(add(k2r, add(k3r, k4r)), 2)), h / 6))
  const vNext = add(state.v, mul(add(k1v, mul(add(k2v, add(k3v, k4v)), 2)), h / 6))
  return { r: rNext, v: vNext }
}

/* ------------------------------------------------------------------ */
/* Field presets                                                      */
/* ------------------------------------------------------------------ */

export type FieldPreset = 'point-charge' | 'dipole' | 'solenoid' | 'em-wave' | 'lorentz'

export interface FieldConfig {
  preset: FieldPreset
  charge: number // C (scaled for visualization)
  current: number // A
  loops: number
  radius: number // m (scaled)
  frequency: number // Hz
  e0: number // V/m (scaled)
  particleQ: number // C (scaled)
  particleM: number // kg (scaled)
  particleV0: Vec3
  time: number
}

export function defaultConfig(): FieldConfig {
  return {
    preset: 'point-charge',
    charge: 1.0,
    current: 1.0,
    loops: 1,
    radius: 1.0,
    frequency: 5.0,
    e0: 1.0,
    particleQ: 1.0,
    particleM: 1.0,
    particleV0: { x: 0, y: 0, z: 0 },
    time: 0,
  }
}
