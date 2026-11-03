/* ============================================================
   PROJECT DAEDALUS — vehicle definitions & hypersonic aero models
   Cl/Cd are functions of angle of attack (radians).
   Curves are calibrated so that displayed aerothermo state matches
   published-class values (e.g. waverider L/D ≈ 1.8 @ α = 18°).
   ============================================================ */

export type VehicleId = 'capsule' | 'apollo' | 'waverider' | 'msl'
export type VehicleKind = 'waverider' | 'capsule'

export interface Vehicle {
  id: VehicleId
  name: string
  kind: VehicleKind
  /** mass, kg */
  m: number
  /** reference area, m^2 */
  A: number
  /** effective stagnation nose radius, m */
  Rn: number
  cl: (a: number) => number
  cd: (a: number) => number
  /** linear lift params for the autopilot trim solver (Cl = cl0 + cla*alpha) */
  clLin?: { cl0: number; cla: number }
  /** structural/thermal limits: heat W/cm^2, g-load G, dynamic pressure kPa */
  limits: { heat: number; g: number; q: number }
  blurb: string
}

export const VEHICLES: Record<VehicleId, Vehicle> = {
  capsule: {
    id: 'capsule',
    name: 'CREW CAPSULE',
    kind: 'capsule',
    m: 8_500,
    A: 12.8,
    Rn: 2.0,
    cl: (a) => 0.7 * Math.sin(2 * a),
    cd: (a) => 1.28 + 0.25 * Math.sin(a),
    limits: { heat: 120, g: 6, q: 45 },
    blurb: 'Blunt-body ballistic capsule, L/D ≈ 0.3',
  },
  apollo: {
    id: 'apollo',
    name: 'APOLLO CM',
    kind: 'capsule',
    m: 5_560,
    A: 12.0,
    Rn: 2.5,
    cl: (a) => 0.7 * Math.sin(2 * a),
    cd: (a) => 1.3 + 0.22 * Math.sin(a),
    limits: { heat: 500, g: 8, q: 40 },
    blurb: 'Lunar-return blunt body, superorbital entry',
  },
  waverider: {
    id: 'waverider',
    name: 'SR-72/X-51 CLASS WAVERIDER',
    kind: 'waverider',
    m: 13_500,
    A: 42.0,
    Rn: 0.45,
    cl: (a) => 0.05 + 0.75 * a,
    cd: (a) => 0.04 + 1.18 * a * a,
    clLin: { cl0: 0.05, cla: 0.75 },
    limits: { heat: 150, g: 3.5, q: 60 },
    blurb: 'High L/D compression-lift glider, Mach 16 class',
  },
  msl: {
    id: 'msl',
    name: 'MSL-CLASS AEROSHELL',
    kind: 'capsule',
    m: 3_300,
    A: 15.4,
    Rn: 1.1,
    cl: (a) => 0.62 * Math.sin(2 * a),
    cd: (a) => 1.36 + 0.2 * Math.sin(a),
    limits: { heat: 90, g: 6, q: 20 },
    blurb: '70° cone aeroshell for CO2 aerocapture',
  },
}
