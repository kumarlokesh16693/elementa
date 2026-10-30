/* ============================================================
   PROJECT DAEDALUS — atmosphere models
   Earth: 8-layer US76 standard atmosphere approximation (+ upper
          atmosphere exponential fit up to 160 km)
   Mars:  isothermal exponential CO2 atmosphere
   ============================================================ */

import type { PlanetId } from './constants'

export interface Atmos {
  /** density kg/m^3 */
  rho: number
  /** temperature K */
  T: number
  /** pressure Pa */
  p: number
  /** speed of sound m/s */
  a: number
}

const R_AIR = 287.053
const G0 = 9.80665

// US76 layer bases (geopotential altitude)
const HB = [0, 11_000, 20_000, 32_000, 47_000, 51_000, 71_000, 86_000]
const TB = [288.15, 216.65, 216.65, 228.65, 270.65, 270.65, 214.65, 186.87]
const LB = [-0.0065, 0, 0.001, 0.0028, 0, -0.0028, -0.002, 0]
const PB = [101325, 22632.1, 5474.89, 868.019, 110.906, 66.9389, 3.95642, 0.3734]

// upper-atmosphere exponential fit segments [start altitude, scale height]
const UPPER: Array<[number, number]> = [
  [86_000, 5_550],
  [100_000, 6_000],
  [120_000, 11_000],
  [150_000, 18_000],
]
const RHO_86 = PB[7] / (R_AIR * TB[7])

export function earthAtm(hIn: number): Atmos {
  const h = Math.max(0, Math.min(hIn, 159_999))
  let T: number
  let p: number

  if (h <= HB[7]) {
    let i = 0
    for (let k = HB.length - 1; k >= 0; k--) {
      if (h >= HB[k]) {
        i = k
        break
      }
    }
    const L = LB[i]
    T = TB[i] + L * (h - HB[i])
    if (Math.abs(L) < 1e-12) {
      p = PB[i] * Math.exp((-G0 * (h - HB[i])) / (R_AIR * TB[i]))
    } else {
      p = PB[i] * Math.pow(T / TB[i], -G0 / (L * R_AIR))
    }
  } else {
    // thermosphere fit: density exponential, temperature ramp
    let rho = RHO_86
    for (let k = 0; k < UPPER.length; k++) {
      const h0 = UPPER[k][0]
      const Hs = UPPER[k][1]
      const h1 = k + 1 < UPPER.length ? UPPER[k + 1][0] : 160_000
      if (h > h0) {
        const hTop = Math.min(h, h1)
        rho *= Math.exp(-(hTop - h0) / Hs)
      }
    }
    T = Math.min(600, 186.87 + (1.2 * (h - 86_000)) / 1000)
    p = rho * R_AIR * T
    return { rho, T, p, a: Math.sqrt(1.4 * R_AIR * T) }
  }

  const rho = p / (R_AIR * T)
  return { rho, T, p, a: Math.sqrt(1.4 * R_AIR * T) }
}

const MARS_T = 214.0
const MARS_RHO0 = 0.020
const MARS_H = 11_100
const MARS_R = 191.9
const MARS_GAMMA = 1.29

export function marsAtm(hIn: number): Atmos {
  const h = Math.max(0, Math.min(hIn, 200_000))
  const rho = MARS_RHO0 * Math.exp(-h / MARS_H)
  const p = rho * MARS_R * MARS_T
  return { rho, T: MARS_T, p, a: Math.sqrt(MARS_GAMMA * MARS_R * MARS_T) }
}

export function atmosphere(planet: PlanetId, h: number): Atmos {
  return planet === 'mars' ? marsAtm(h) : earthAtm(h)
}
