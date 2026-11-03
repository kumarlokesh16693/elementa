/* ============================================================
   PROJECT DAEDALUS — simulation engine
   Planar 3-DOF point-mass entry flight over a spherical planet,
   RK4 fixed-step integration, Sutton–Graves / Tauber-style
   aerothermal models, GNC autopilot (bank-angle modulation),
   telemetry history, scrub snapshots, recording & CSV export.
   ============================================================ */

import { atmosphere } from './atmosphere'
import {
  clamp,
  DEG,
  G0,
  PLANETS,
  RAD,
  type PlanetId,
} from './constants'
import { MISSIONS, type Mission, type MissionId } from './missions'
import { VEHICLES, type Vehicle } from './vehicles'

/* ------------------------------------------------------------------ */

export type StatusId =
  | 'STANDBY'
  | 'EXOATMOSPHERIC'
  | 'PLASMA BUILDUP'
  | 'IONIZATION BLACKOUT'
  | 'PLASMA EXIT'
  | 'HYPERSONIC'
  | 'SUPERSONIC'
  | 'TRANSONIC'
  | 'SUBSONIC'
  | 'TOUCHDOWN'
  | 'CAPTURED'

export interface HistPoint {
  t: number
  h: number // m
  v: number // m/s
  gamma: number // deg
  alpha: number // deg
  sigma: number // deg
  mach: number
  rho: number
  q: number // Pa
  heat: number // W/cm^2
  heatR: number // W/cm^2
  g: number // G
  ld: number
  down: number // m
  ts: number // K
  theta: number // rad, planet-centric downrange angle
}

interface State {
  v: number
  gamma: number // rad
  r: number // m
  theta: number // rad
}

export interface UiSnapshot {
  version: number
  missionId: MissionId
  missionName: string
  planetId: PlanetId
  planetName: string
  vehicleName: string
  vehicleBlurb: string
  mode: Mission['mode']

  t: number
  h: number // m
  v: number // m/s
  gamma: number // deg
  alpha: number // deg
  sigma: number // deg
  apAlpha: number
  apSigma: number

  mach: number
  rho: number
  q: number // kPa
  heat: number // W/cm^2
  heatR: number // W/cm^2
  heatLoad: number // MJ/m^2
  g: number
  ld: number
  downrange: number // km
  tShock: number // K

  status: StatusId
  attenuation: number // 0..1
  dataRate: number // kbps
  warnings: string[]
  colorScaleMax: number // W/cm^2 for color bar normalization

  autopilot: boolean
  paused: boolean
  landed: boolean
  captured: boolean
  warp: number
  recording: boolean
  recCount: number
  cfgVersion: number
}

/* ------------------------------------------------------------------ */

const DT = 0.02 // integration step, s
const HIST_EVERY = 0.1 // s
const SNAP_EVERY = 0.5 // s
const MAX_HIST = 6000
const MAX_SNAP = 4000

export class SimEngine {
  cfg: Mission
  private veh: Vehicle

  // state
  t = 0
  private v = 4400
  private gamma = 0 // rad
  private r = PLANETS.earth.radius + 44_000
  private theta = 0 // rad
  alpha = 18 // deg (user/commanded)
  sigma = 0 // deg
  apAlpha = 18
  apSigma = 0

  // ui toggles
  autopilot = false
  paused = false
  landed = false
  captured = false
  warp: 1 | 2 | 5 | 10 = 5
  recording = false

  // data
  history: HistPoint[] = []
  private snapshots: Array<State & { t: number; alpha: number; sigma: number }> = []
  recordingData: HistPoint[] = []

  // internals
  private heatLoad = 0 // MJ/m^2
  private theta0 = 0
  private histAcc = 0
  private snapAcc = 0
  private histStride = 1
  private snapStride = 1
  private lastHeat = 0

  // external store
  version = 0
  cfgVersion = 0
  ui: UiSnapshot
  private listeners = new Set<() => void>()
  private emitAcc = 0

  constructor() {
    this.cfg = MISSIONS.waverider
    this.veh = VEHICLES[this.cfg.vehicle]
    this.resetState()
    this.ui = this.buildUi()
  }

  /* ---------------- external store ---------------- */

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb)
    return () => {
      this.listeners.delete(cb)
    }
  }

  getVersion = (): number => this.version

  private emit(force = false): void {
    this.emitAcc += 1
    if (!force && this.emitAcc < 2) return
    this.emitAcc = 0
    this.ui = this.buildUi()
    this.version++
    this.listeners.forEach((cb) => cb())
  }

  /* ---------------- lifecycle ---------------- */

  loadMission(id: MissionId): void {
    this.cfg = MISSIONS[id]
    this.veh = VEHICLES[this.cfg.vehicle]
    this.resetState()
    this.cfgVersion++
    this.emit(true)
  }

  reset(): void {
    this.resetState()
    this.emit(true)
  }

  private resetState(): void {
    const ic = this.cfg.ic
    const P = PLANETS[this.cfg.planet]
    this.t = 0
    this.v = ic.v
    this.gamma = ic.gamma * RAD
    this.r = P.radius + ic.h
    this.theta = 0
    this.theta0 = 0
    this.alpha = ic.alpha
    this.sigma = ic.sigma
    this.apAlpha = ic.alpha
    this.apSigma = ic.sigma
    this.autopilot = false
    this.paused = false
    this.landed = false
    this.captured = false
    this.heatLoad = 0
    this.lastHeat = 0
    this.history = []
    this.snapshots = []
    this.recordingData = []
    this.histAcc = 0
    this.snapAcc = 0
    this.histStride = 1
    this.snapStride = 1
    this.pushHist()
  }

  /* ---------------- derived quantities ---------------- */

  private deriv(s: State, alpha: number, sigma: number): State {
    const P = PLANETS[this.cfg.planet]
    const h = s.r - P.radius
    const atm = atmosphere(this.cfg.planet, Math.max(h, 0))
    const rho = h > 0 ? atm.rho : 0
    const vv = Math.max(s.v, 5)
    const q = 0.5 * rho * vv * vv
    const cd = this.veh.cd(alpha)
    const cl = this.veh.cl(alpha)
    const D = (q * this.veh.A * cd) / this.veh.m
    const L = (q * this.veh.A * cl) / this.veh.m
    const g = P.mu / (s.r * s.r)
    const cG = Math.cos(s.gamma)
    const sG = Math.sin(s.gamma)

    return {
      v: -D - g * sG,
      gamma: (L * Math.cos(sigma)) / vv + (vv / s.r - g / vv) * cG,
      r: vv * sG,
      theta: (vv * cG) / s.r,
    }
  }

  private rk4(dt: number): void {
    const y: State = { v: this.v, gamma: this.gamma, r: this.r, theta: this.theta }
    const a = this.alpha * RAD
    const s = this.sigma * RAD

    const k1 = this.deriv(y, a, s)
    const k2 = this.deriv(
      { v: y.v + (dt / 2) * k1.v, gamma: y.gamma + (dt / 2) * k1.gamma, r: y.r + (dt / 2) * k1.r, theta: y.theta + (dt / 2) * k1.theta },
      a,
      s
    )
    const k3 = this.deriv(
      { v: y.v + (dt / 2) * k2.v, gamma: y.gamma + (dt / 2) * k2.gamma, r: y.r + (dt / 2) * k2.r, theta: y.theta + (dt / 2) * k2.theta },
      a,
      s
    )
    const k4 = this.deriv(
      { v: y.v + dt * k3.v, gamma: y.gamma + dt * k3.gamma, r: y.r + dt * k3.r, theta: y.theta + dt * k3.theta },
      a,
      s
    )

    y.v += (dt / 6) * (k1.v + 2 * k2.v + 2 * k3.v + k4.v)
    y.gamma += (dt / 6) * (k1.gamma + 2 * k2.gamma + 2 * k3.gamma + k4.gamma)
    y.r += (dt / 6) * (k1.r + 2 * k2.r + 2 * k3.r + k4.r)
    y.theta += (dt / 6) * (k1.theta + 2 * k2.theta + 2 * k3.theta + k4.theta)

    this.v = Math.max(y.v, 5)
    this.gamma = clamp(y.gamma, -89 * RAD, 89 * RAD)
    this.r = Math.max(y.r, PLANETS[this.cfg.planet].radius)
    this.theta = y.theta
  }

  /** stagnation-point derived aerothermal state at current conditions */
  private aeroState(): {
    mach: number
    rho: number
    q: number
    heat: number
    heatR: number
    g: number
    ld: number
    ts: number
  } {
    const P = PLANETS[this.cfg.planet]
    const h = this.r - P.radius
    const atm = atmosphere(this.cfg.planet, Math.max(h, 0))
    const rho = h > 0 ? atm.rho : 0
    const q = 0.5 * rho * this.v * this.v // Pa
    const cd = this.veh.cd(this.alpha * RAD)
    const cl = this.veh.cl(this.alpha * RAD)
    const D = q * this.veh.A * cd
    const L = q * this.veh.A * cl
    const heat = (P.kSG * Math.sqrt(rho / this.veh.Rn) * this.v ** 3) / 1e4 // W/cm^2
    // Tauber-style simplified radiative term (significant only superorbital)
    const heatR =
      (3e-27 * Math.pow(rho, 1.1) * Math.pow(this.v, 8) * Math.sqrt(this.veh.Rn)) / 1e4
    const gLoad = Math.sqrt(D * D + L * L) / (this.veh.m * G0)
    const ld = cd > 1e-6 ? cl / cd : 0
    // shock-layer temperature — equilibrium-air engineering correlation
    const ts = 220 + 0.71 * this.v
    return { mach: this.v / atm.a, rho, q, heat, heatR, g: gLoad, ld, ts }
  }

  /** current vehicle pose for the 3D scene (gamma in rad) */
  pose(): { h: number; theta: number; gamma: number; v: number } {
    const P = PLANETS[this.cfg.planet]
    return {
      h: this.r - P.radius,
      theta: this.theta,
      gamma: this.gamma,
      v: this.v,
    }
  }

  /** coarse forward integration of the current state (frozen controls) */
  predictPath(horizonS = 240, steps = 280): Array<{ h: number; theta: number }> {
    const P = PLANETS[this.cfg.planet]
    const s: State = { v: this.v, gamma: this.gamma, r: this.r, theta: this.theta }
    const dt = horizonS / steps
    const a = this.alpha * RAD
    const sg = this.sigma * RAD
    const out: Array<{ h: number; theta: number }> = []
    for (let i = 0; i < steps; i++) {
      const k1 = this.deriv(s, a, sg)
      const mid: State = {
        v: Math.max(s.v + 0.5 * dt * k1.v, 5),
        gamma: clamp(s.gamma + 0.5 * dt * k1.gamma, -89 * RAD, 89 * RAD),
        r: Math.max(s.r + 0.5 * dt * k1.r, P.radius),
        theta: s.theta + 0.5 * dt * k1.theta,
      }
      const k2 = this.deriv(mid, a, sg)
      s.v = Math.max(s.v + dt * k2.v, 5)
      s.gamma = clamp(s.gamma + dt * k2.gamma, -89 * RAD, 89 * RAD)
      s.r = Math.max(s.r + dt * k2.r, P.radius)
      s.theta += dt * k2.theta
      const h = s.r - P.radius
      out.push({ h, theta: s.theta })
      if (h <= 0) break
    }
    return out
  }

  /* ---------------- history / snapshots ---------------- */

  private pushHist(): void {
    const P = PLANETS[this.cfg.planet]
    const a = this.aeroState()
    this.history.push({
      t: this.t,
      h: this.r - P.radius,
      v: this.v,
      gamma: this.gamma * DEG,
      alpha: this.alpha,
      sigma: this.sigma,
      mach: a.mach,
      rho: a.rho,
      q: a.q,
      heat: a.heat,
      heatR: a.heatR,
      g: a.g,
      ld: a.ld,
      down: P.radius * Math.abs(this.theta - this.theta0),
      ts: a.ts,
      theta: this.theta,
    })
    if (this.history.length > MAX_HIST) {
      this.history = this.history.filter((_, i) => i % 2 === 0)
      this.histStride *= 2
    }
    if (this.recording) {
      this.recordingData.push(this.history[this.history.length - 1])
      if (this.recordingData.length > 200_000) this.recording = false
    }
  }

  private pushSnap(): void {
    this.snapshots.push({
      t: this.t,
      v: this.v,
      gamma: this.gamma,
      r: this.r,
      theta: this.theta,
      alpha: this.alpha,
      sigma: this.sigma,
    })
    if (this.snapshots.length > MAX_SNAP) {
      this.snapshots = this.snapshots.filter((_, i) => i % 2 === 0)
      this.snapStride *= 2
    }
  }

  /** rewind the vehicle state to sim-time t (scrubbing) */
  scrubTo(t: number): void {
    if (this.snapshots.length === 0) return
    let best = this.snapshots[0]
    for (const s of this.snapshots) {
      if (s.t <= t + 1e-6) best = s
      else break
    }
    this.t = best.t
    this.v = best.v
    this.gamma = best.gamma
    this.r = best.r
    this.theta = best.theta
    this.alpha = best.alpha
    this.sigma = best.sigma
    this.landed = false
    this.captured = false
    // truncate future history & snapshots
    this.history = this.history.filter((p) => p.t <= best.t + 1e-6)
    this.snapshots = this.snapshots.filter((p) => p.t <= best.t + 1e-6)
    // recompute heat load from history (coarse but consistent)
    this.heatLoad = 0
    for (let i = 1; i < this.history.length; i++) {
      const dtt = (this.history[i].t - this.history[i - 1].t) * this.histStride
      this.heatLoad += (this.history[i].heat * 1e4 * dtt) / 1e6
    }
    this.paused = true
    this.emit(true)
  }

  /* ---------------- manual overrides ---------------- */

  setAlpha(deg: number): void {
    this.alpha = clamp(deg, 0, 40)
    this.apAlpha = this.alpha
    this.emit(true)
  }

  setSigma(deg: number): void {
    this.sigma = clamp(deg, 0, 180)
    this.apSigma = this.sigma
    this.emit(true)
  }

  /** direct state overrides (sandbox what-if) */
  overrideAltitude(h: number): void {
    this.r = PLANETS[this.cfg.planet].radius + clamp(h, 0, 200_000)
    this.landed = false
    this.emit(true)
  }

  overrideVelocity(v: number): void {
    this.v = clamp(v, 50, 12_000)
    this.emit(true)
  }

  overrideGamma(gammaDeg: number): void {
    this.gamma = clamp(gammaDeg, -15, 15) * RAD
    this.emit(true)
  }

  setWarp(w: 1 | 2 | 5 | 10): void {
    this.warp = w
    this.emit(true)
  }

  toggleAutopilot(): void {
    this.autopilot = !this.autopilot
    this.emit(true)
  }

  togglePause(): void {
    if (this.landed) return
    this.paused = !this.paused
    this.emit(true)
  }

  toggleRecording(): void {
    this.recording = !this.recording
    if (this.recording) this.recordingData = []
    this.emit(true)
  }

  /* ---------------- GNC autopilot ---------------- */

  private apStep(dt: number): void {
    if (!this.autopilot) return
    const P = PLANETS[this.cfg.planet]
    const h = this.r - P.radius
    const a = this.aeroState()
    const g = P.mu / (this.r * this.r)
    const gammaDeg = this.gamma * DEG

    let alphaCmd = this.alpha
    let sigmaCmd = this.sigma

    if (this.cfg.mode === 'cruise' && this.veh.clLin) {
      // altitude-hold / equilibrium glide: solve Cl*(q*A) = m*g for alpha
      const q = Math.max(a.q, 1)
      const clReq = (this.veh.m * g) / (q * this.veh.A)
      const aEq = (clReq - this.veh.clLin.cl0) / this.veh.clLin.cla
      const hDot = this.v * Math.sin(this.gamma)
      const hErr = h - (this.cfg.hRef ?? h)
      alphaCmd = clamp(aEq * DEG - 0.004 * hErr - 0.06 * hDot, 1, 34)
      sigmaCmd = 0
    } else if (this.cfg.mode === 'aerocapture') {
      // corridor control: g-load tracking with lift-down deepening;
      // once capture energy state reached, pull up to exit the atmosphere
      const vEsc = Math.sqrt((2 * P.mu) / this.r)
      const gRef = this.cfg.gRef ?? 4
      if (this.captured) {
        sigmaCmd = 14 // lift-up to climb out
      } else {
        const gErr = a.g - gRef
        const gamErr = clamp(gammaDeg - (this.cfg.gammaRef ?? -1.5), -4, 4)
        let sig = 90 - 20 * gErr + 3 * gamErr
        if (a.g > this.veh.limits.g * 0.95) sig = 55 // overload protection
        sigmaCmd = clamp(sig, 10, 170)
      }
      alphaCmd = this.cfg.ic.alpha
    } else {
      // entry: bank-angle modulation on g-load & fpa, heat-biased
      const gRef = this.cfg.gRef ?? 4
      const gErr = a.g - gRef
      const gamErr = gammaDeg - (this.cfg.gammaRef ?? -2)
      let sig = 22 - 14 * gErr + 6 * gamErr
      if (a.heat > this.veh.limits.heat * 0.92) sig = 78 // ride lift-down vector
      sigmaCmd = clamp(sig, 5, 80)
      alphaCmd = clamp(this.cfg.ic.alpha, 12, 26)
    }

    // actuator rate limits (cruise uses a faster pitch actuator)
    const aRate = (this.cfg.mode === 'cruise' ? 10 : 4) * dt // deg/s
    const sRate = 14 * dt
    this.alpha += clamp(alphaCmd - this.alpha, -aRate, aRate)
    this.sigma += clamp(sigmaCmd - this.sigma, -sRate, sRate)
    this.alpha = clamp(this.alpha, 0, 40)
    this.sigma = clamp(this.sigma, 0, 180)
    this.apAlpha = this.alpha
    this.apSigma = this.sigma
  }

  /* ---------------- main tick ---------------- */

  tick(realDt: number): void {
    const dt = Math.min(realDt, 0.05)
    if (!this.paused && !this.landed) {
      const simDt = dt * this.warp
      const n = Math.min(120, Math.max(1, Math.ceil(simDt / DT)))
      const h = simDt / n
      for (let i = 0; i < n; i++) {
        this.apStep(h)
        this.rk4(h)
        this.t += h
        const a = this.aeroState()
        this.lastHeat = a.heat
        this.heatLoad += (a.heat * 1e4 * h) / 1e6

        this.histAcc += h
        if (this.histAcc >= HIST_EVERY * this.histStride) {
          this.histAcc = 0
          this.pushHist()
        }
        this.snapAcc += h
        if (this.snapAcc >= SNAP_EVERY * this.snapStride) {
          this.snapAcc = 0
          this.pushSnap()
        }

        // terminal conditions
        const P = PLANETS[this.cfg.planet]
        if (this.r - P.radius <= 0) {
          this.r = P.radius
          this.landed = true
          this.paused = true
          this.pushHist()
          this.emit(true)
          break
        }
        if (this.cfg.mode === 'aerocapture') {
          const vEsc = Math.sqrt((2 * P.mu) / this.r)
          const hNow = this.r - P.radius
          // capture = sub-escape specific energy while inside the atmosphere
          if (!this.captured && hNow < P.entryInterface && this.v < vEsc * 0.985) {
            this.captured = true
          }
          if (this.captured && hNow > P.entryInterface && this.gamma > 0) {
            this.paused = true
            this.emit(true)
            break
          }
        }
      }
    }

    // throttle UI emit to ~12 Hz
    this.emitAcc += 1
    if (this.emitAcc >= 5) {
      this.emitAcc = 0
      this.ui = this.buildUi()
      this.version++
      this.listeners.forEach((cb) => cb())
    }
  }

  /* ---------------- status & ui ---------------- */

  private status(): StatusId {
    const P = PLANETS[this.cfg.planet]
    const h = this.r - P.radius
    if (this.landed) return 'TOUCHDOWN'
    if (this.captured) return 'CAPTURED'
    if (h > P.entryInterface) return 'EXOATMOSPHERIC'
    const a = this.aeroState()
    const inbound = this.gamma < 0
    if (a.heat > 45 && this.v > 2_800) return 'IONIZATION BLACKOUT'
    if (a.heat > 15 && this.v > 2_000)
      return inbound ? 'PLASMA BUILDUP' : 'PLASMA EXIT'
    if (a.mach >= 5) return 'HYPERSONIC'
    if (a.mach >= 1.2) return 'SUPERSONIC'
    if (a.mach >= 0.8) return 'TRANSONIC'
    return 'SUBSONIC'
  }

  private buildUi(): UiSnapshot {
    const P = PLANETS[this.cfg.planet]
    const a = this.aeroState()
    const status = this.status()
    const attenuation = clamp((a.heat - 10) / 60, 0, 0.995)
    const dataRate = (1 - attenuation) * 12

    const warnings: string[] = []
    if (a.heat > this.veh.limits.heat) warnings.push('HEAT FLUX LIMIT EXCEEDED')
    if (a.g > this.veh.limits.g) warnings.push('G-LOAD LIMIT EXCEEDED')
    if (a.q / 1000 > this.veh.limits.q) warnings.push('DYNAMIC PRESSURE LIMIT')
    if (status === 'IONIZATION BLACKOUT') warnings.push('TT&C SIGNAL OUTAGE')

    return {
      version: this.version,
      missionId: this.cfg.id,
      missionName: this.cfg.name,
      planetId: this.cfg.planet,
      planetName: P.name,
      vehicleName: this.veh.name,
      vehicleBlurb: this.veh.blurb,
      mode: this.cfg.mode,

      t: this.t,
      h: this.r - P.radius,
      v: this.v,
      gamma: this.gamma * DEG,
      alpha: this.alpha,
      sigma: this.sigma,
      apAlpha: this.apAlpha,
      apSigma: this.apSigma,

      mach: a.mach,
      rho: a.rho,
      q: a.q / 1000,
      heat: a.heat,
      heatR: a.heatR,
      heatLoad: this.heatLoad,
      g: a.g,
      ld: a.ld,
      downrange: (P.radius * Math.abs(this.theta - this.theta0)) / 1000,
      tShock: a.ts,

      status,
      attenuation,
      dataRate,
      warnings,
      colorScaleMax: Math.max(this.veh.limits.heat * 1.5, 60),

      autopilot: this.autopilot,
      paused: this.paused,
      landed: this.landed,
      captured: this.captured,
      warp: this.warp,
      recording: this.recording,
      recCount: this.recordingData.length,
      cfgVersion: this.cfgVersion,
    }
  }

  /* ---------------- CSV export ---------------- */

  buildCsv(): string {
    const data = this.recordingData.length > 1 ? this.recordingData : this.history
    const head =
      't_s,h_km,v_kms,gamma_deg,alpha_deg,sigma_deg,mach,rho_kgm3,q_kPa,' +
      'heat_conv_Wcm2,heat_rad_Wcm2,heat_load_MJm2,g_load,LD,downrange_km,shock_T_K'
    const rows = data.map((p) =>
      [
        p.t.toFixed(2),
        (p.h / 1000).toFixed(3),
        (p.v / 1000).toFixed(4),
        p.gamma.toFixed(3),
        p.alpha.toFixed(2),
        p.sigma.toFixed(2),
        p.mach.toFixed(2),
        p.rho.toExponential(4),
        (p.q / 1000).toFixed(3),
        p.heat.toFixed(3),
        p.heatR.toFixed(3),
        ((p.heat * 1e4 * HIST_EVERY * this.histStride) / 1e6).toFixed(3),
        p.g.toFixed(3),
        p.ld.toFixed(3),
        (p.down / 1000).toFixed(2),
        p.ts.toFixed(1),
      ].join(',')
    )
    return [head, ...rows].join('\n')
  }

  /** peak values over recorded history (for the flight supervisor summary) */
  peaks(): { heat: number; g: number; q: number } {
    let heat = 0
    let g = 0
    let q = 0
    for (const p of this.history) {
      if (p.heat > heat) heat = p.heat
      if (p.g > g) g = p.g
      if (p.q > q) q = p.q
    }
    return { heat, g, q: q / 1000 }
  }
}
