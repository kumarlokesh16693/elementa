/* ============================================================
   PROJECT DAEDALUS — mission presets
   ============================================================ */

import type { PlanetId } from './constants'
import type { VehicleId } from './vehicles'

export type MissionId = 'leo' | 'apollo' | 'mars' | 'waverider'
export type MissionMode = 'entry' | 'aerocapture' | 'cruise'

export interface MissionIC {
  /** altitude, m */
  h: number
  /** speed, m/s */
  v: number
  /** flight path angle, deg */
  gamma: number
  /** angle of attack, deg */
  alpha: number
  /** bank angle, deg */
  sigma: number
}

export interface Mission {
  id: MissionId
  name: string
  short: string
  planet: PlanetId
  vehicle: VehicleId
  mode: MissionMode
  ic: MissionIC
  /** cruise reference altitude, m */
  hRef?: number
  /** autopilot reference g-load, G */
  gRef?: number
  /** autopilot reference flight path angle, deg */
  gammaRef?: number
  blurb: string
}

export const MISSIONS: Record<MissionId, Mission> = {
  waverider: {
    id: 'waverider',
    name: 'MACH 16 WAVERIDER',
    short: 'MACH 16 WAVERIDER',
    planet: 'earth',
    vehicle: 'waverider',
    mode: 'cruise',
    ic: { h: 44_000, v: 4_400, gamma: 0.4, alpha: 18, sigma: 0 },
    hRef: 44_000,
    blurb: 'Airbreathing-class hypersonic glider riding its own shock — hold the corridor.',
  },
  leo: {
    id: 'leo',
    name: 'LEO DEORBIT / ENTRY',
    short: 'LEO DEORBIT',
    planet: 'earth',
    vehicle: 'capsule',
    mode: 'entry',
    ic: { h: 120_000, v: 7_800, gamma: -1.8, alpha: 20, sigma: 0 },
    gRef: 4,
    gammaRef: -2.2,
    blurb: 'Shuttle-class orbital entry from a 400 km deorbit burn.',
  },
  apollo: {
    id: 'apollo',
    name: 'APOLLO LUNAR RETURN',
    short: 'APOLLO LUNAR',
    planet: 'earth',
    vehicle: 'apollo',
    mode: 'entry',
    ic: { h: 122_000, v: 11_020, gamma: -6.4, alpha: 22, sigma: 0 },
    gRef: 4.5,
    gammaRef: -4,
    blurb: 'Superorbital entry at 11 km/s — radiative heating regime.',
  },
  mars: {
    id: 'mars',
    name: 'MARS AEROCAPTURE',
    short: 'MARS AEROCAPTURE',
    planet: 'mars',
    vehicle: 'msl',
    mode: 'aerocapture',
    ic: { h: 140_000, v: 5_900, gamma: -9.5, alpha: 20, sigma: 0 },
    gRef: 4,
    gammaRef: -1.5,
    blurb: 'Dissolve interplanetary energy in one CO2 pass — capture, not impact.',
  },
}

export const MISSION_ORDER: MissionId[] = ['leo', 'apollo', 'mars', 'waverider']
