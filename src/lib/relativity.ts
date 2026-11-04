/**
 * ELEMENTA — Special Relativity
 * Lorentz transformations, length contraction, time dilation, relativistic
 * dynamics, the Doppler effect, and spacetime geometry.
 * SI units unless noted; β = v/c is dimensionless.
 */

/* ------------------------------------------------------------------ */
/* Fundamental constants                                              */
/* ------------------------------------------------------------------ */

export const C = 299792458 // m/s speed of light
export const C_KM = 299792.458 // km/s
export const LY = 9.4607304725808e15 // m per light-year
export const YEAR = 31557600 // s (Julian year)
export const EV = 1.602176634e-19 // J per eV
export const ELECTRON_MASS = 9.1093837139e-31 // kg
export const PROTON_MASS = 1.67262192595e-27 // kg
export const MUON_LIFETIME = 2.1969811e-6 // s proper lifetime

/* ------------------------------------------------------------------ */
/* Lorentz factor & kinematics                                         */
/* ------------------------------------------------------------------ */

/** Lorentz factor γ = 1/√(1−β²). β is clamped below 1 to stay finite. */
export function lorentzFactor(beta: number): number {
  const b = Math.min(Math.abs(beta), 0.999999999)
  return 1 / Math.sqrt(1 - b * b)
}

/** Length contraction: L = L₀/γ (measured along the direction of motion). */
export function contractedLength(L0: number, beta: number): number {
  return L0 / lorentzFactor(beta)
}

/** Time dilation: Δt = γΔt₀ (coordinate time for a moving clock). */
export function dilatedTime(t0: number, beta: number): number {
  return t0 * lorentzFactor(beta)
}

/** Proper time elapsed for a clock moving at β over coordinate time t. */
export function properTime(t: number, beta: number): number {
  return t / lorentzFactor(beta)
}

/** Rapidity φ = artanh(β) — additively composed under boosts. */
export function rapidity(beta: number): number {
  const b = Math.max(-0.999999999, Math.min(0.999999999, beta))
  return 0.5 * Math.log((1 + b) / (1 - b))
}

/** Inverse of rapidity: β = tanh(φ). */
export function betaFromRapidity(phi: number): number {
  return Math.tanh(phi)
}

/**
 * Relativistic velocity addition (1D): u = (v₁+v₂)/(1+v₁v₂/c²).
 * Accepts fractions of c; result never reaches ±1.
 */
export function velocityAddition(beta1: number, beta2: number): number {
  return (beta1 + beta2) / (1 + beta1 * beta2)
}

/* ------------------------------------------------------------------ */
/* Relativistic dynamics                                               */
/* ------------------------------------------------------------------ */

/** Rest energy E₀ = mc² (J). */
export function restEnergy(mass: number): number {
  return mass * C * C
}

/** Total energy E = γmc² (J). */
export function totalEnergy(mass: number, beta: number): number {
  return lorentzFactor(beta) * mass * C * C
}

/** Kinetic energy KE = (γ−1)mc² (J). */
export function kineticEnergy(mass: number, beta: number): number {
  return (lorentzFactor(beta) - 1) * mass * C * C
}

/** Classical kinetic energy ½mv² (J) — for comparison. */
export function newtonianKineticEnergy(mass: number, beta: number): number {
  const v = beta * C
  return 0.5 * mass * v * v
}

/** Relativistic momentum p = γmv (kg·m/s). */
export function relativisticMomentum(mass: number, beta: number): number {
  return lorentzFactor(beta) * mass * beta * C
}

/** Momentum × c, convenient in eV: pc = γβmc² (J). */
export function momentumTimesC(mass: number, beta: number): number {
  return lorentzFactor(beta) * Math.abs(beta) * mass * C * C
}

/** Convert joules to electronvolts. */
export function joulesToEV(joules: number): number {
  return joules / EV
}

/* ------------------------------------------------------------------ */
/* Relativistic Doppler effect                                         */
/* ------------------------------------------------------------------ */

/**
 * Doppler factor f/f₀ for a source moving along the line of sight.
 * approaching=true → blueshift, false → redshift.
 * f/f₀ = √((1±β)/(1∓β)).
 */
export function dopplerFactor(beta: number, approaching: boolean): number {
  const b = Math.min(Math.abs(beta), 0.999999999)
  return approaching
    ? Math.sqrt((1 + b) / (1 - b))
    : Math.sqrt((1 - b) / (1 + b))
}

/** Observed frequency (Hz). */
export function dopplerFrequency(f0: number, beta: number, approaching: boolean): number {
  return f0 * dopplerFactor(beta, approaching)
}

/** Observed wavelength (m). */
export function dopplerWavelength(lambda0: number, beta: number, approaching: boolean): number {
  return lambda0 / dopplerFactor(beta, approaching)
}

/** Speed of light from wavelength/frequency helpers. */
export function wavelengthToFrequency(lambda: number): number {
  return C / lambda
}

/** Frequency to wavelength (m). */
export function frequencyToWavelength(f: number): number {
  return C / f
}

/**
 * Approximate sRGB colour for a visible wavelength (nm).
 * Returns {r,g,b} in 0..255; clamps to the visible band 380–780 nm.
 */
export function wavelengthToRGB(nm: number): { r: number; g: number; b: number } {
  const w = Math.max(380, Math.min(780, nm))
  let r = 0
  let g = 0
  let b = 0
  if (w < 440) {
    r = -(w - 440) / 60
    b = 1
  } else if (w < 490) {
    g = (w - 440) / 50
    b = 1
  } else if (w < 510) {
    g = 1
    b = -(w - 510) / 20
  } else if (w < 580) {
    r = (w - 510) / 70
    g = 1
  } else if (w < 645) {
    r = 1
    g = -(w - 645) / 65
  } else {
    r = 1
  }
  let f = 1
  if (w < 420) f = 0.3 + (0.7 * (w - 380)) / 40
  else if (w > 700) f = 0.3 + (0.7 * (780 - w)) / 80
  const gamma = 0.8
  return {
    r: Math.round(255 * Math.pow(Math.max(0, r) * f, gamma)),
    g: Math.round(255 * Math.pow(Math.max(0, g) * f, gamma)),
    b: Math.round(255 * Math.pow(Math.max(0, b) * f, gamma)),
  }
}

/** CSS rgb() string for a wavelength. */
export function wavelengthToCSS(nm: number): string {
  const { r, g, b } = wavelengthToRGB(nm)
  return `rgb(${r}, ${g}, ${b})`
}

/* ------------------------------------------------------------------ */
/* Spacetime geometry                                                  */
/* ------------------------------------------------------------------ */

/** Lorentz boost of an event (t seconds, x metres) into a frame at +β. */
export function lorentzBoost(
  t: number,
  x: number,
  beta: number,
): { t: number; x: number } {
  const g = lorentzFactor(beta)
  const b = Math.min(Math.abs(beta), 0.999999999)
  return {
    t: g * (t - (b * x) / C),
    x: g * (x - b * C * t),
  }
}

/** Invariant interval s² = (ct)² − x² (m²). */
export function spacetimeInterval(t: number, x: number): number {
  const ct = C * t
  return ct * ct - x * x
}

/** Classify an interval as timelike / spacelike / lightlike. */
export function intervalType(t: number, x: number): 'timelike' | 'spacelike' | 'lightlike' {
  const s2 = spacetimeInterval(t, x)
  const scale = Math.max(1, C * C * t * t, x * x)
  if (Math.abs(s2) < scale * 1e-9) return 'lightlike'
  return s2 > 0 ? 'timelike' : 'spacelike'
}

/* ------------------------------------------------------------------ */
/* Classic relativistic phenomena                                      */
/* ------------------------------------------------------------------ */

/**
 * Muon survival fraction after travelling `distance` metres at β.
 * `dilated` applies time dilation (the observed lifetime is γτ₀).
 */
export function muonSurvival(distance: number, beta: number, dilated: boolean): number {
  const b = Math.max(1e-6, Math.min(Math.abs(beta), 0.999999999))
  const gamma = dilated ? lorentzFactor(b) : 1
  const tObserved = distance / (b * C)
  return Math.exp(-tObserved / (gamma * MUON_LIFETIME))
}

/**
 * Twin paradox: round trip to a destination at distance `distanceLy`
 * (light-years) flown at constant β. Returns Earth-frame years and the
 * travelling twin's proper-time years.
 */
export function twinAges(
  distanceLy: number,
  beta: number,
): { earthYears: number; travelerYears: number } {
  const b = Math.max(1e-6, Math.min(Math.abs(beta), 0.999999999))
  const g = lorentzFactor(b)
  const earthYears = (2 * distanceLy) / b
  const travelerYears = earthYears / g
  return { earthYears, travelerYears }
}

/** Rest energy of an electron in eV. */
export function electronRestEV(): number {
  return joulesToEV(restEnergy(ELECTRON_MASS))
}

/** Rest energy of a proton in eV. */
export function protonRestEV(): number {
  return joulesToEV(restEnergy(PROTON_MASS))
}
