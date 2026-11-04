import type { ElementData } from './types'
import { ELEMENTS } from './index'

export type SimulatedPhase = 'solid' | 'liquid' | 'gas' | 'superfluid' | 'plasma' | 'unknown'
export type TempUnit = 'K' | 'C' | 'F'

export interface PhaseResult {
  phase: SimulatedPhase
  label: string
  color: string
  icon: string
  isNearTransition: boolean
  transitionInfo?: string
}

export interface TempPreset {
  tempK: number
  label: string
  description: string
  tag: string
}

export const TEMP_PRESETS: TempPreset[] = [
  { tempK: 0, label: '0 K', description: 'Absolute Zero (No thermal kinetic energy, quantum ground state)', tag: 'Cryo' },
  { tempK: 2.17, label: '2.17 K', description: 'Helium Lambda Point (He-II Superfluid transition, zero viscosity)', tag: 'Quantum' },
  { tempK: 20.28, label: '20.3 K', description: 'Liquid Hydrogen Boiling Point (Cryogenic propellant)', tag: 'Cryo' },
  { tempK: 77.36, label: '77.4 K', description: 'Liquid Nitrogen Boiling Point (Industrial cryogenic refrigerant)', tag: 'Cryo' },
  { tempK: 194.65, label: '194.7 K', description: 'Dry Ice Sublimation Point (−78.5 °C, CO₂ gas formation)', tag: 'Sublime' },
  { tempK: 273.15, label: '273.15 K', description: 'Water Ice Melting Point (0 °C / 32 °F)', tag: 'STP' },
  { tempK: 298.15, label: '298.15 K', description: 'IUPAC Standard Ambient Temperature (25 °C / 77 °F)', tag: 'Ambient' },
  { tempK: 302.91, label: '302.9 K', description: 'Gallium Melting Point (29.8 °C — liquefies in human hand)', tag: 'Metal' },
  { tempK: 373.15, label: '373.15 K', description: 'Water Boiling Point (100 °C / 212 °F)', tag: 'Boil' },
  { tempK: 600.61, label: '600.6 K', description: 'Lead Melting Point (327.5 °C)', tag: 'Alloy' },
  { tempK: 1811, label: '1,811 K', description: 'Iron Melting Point (1,538 °C — blast furnace liquidus)', tag: 'Refractory' },
  { tempK: 3695, label: '3,695 K', description: 'Tungsten Melting Point (3,422 °C — highest pure metal melting point)', tag: 'Extreme' },
  { tempK: 3915, label: '3,915 K', description: 'Carbon Sublimation Point (3,642 °C at 1 atm)', tag: 'Sublime' },
  { tempK: 5778, label: '5,778 K', description: 'Solar Photosphere (Sun surface effective blackbody temperature)', tag: 'Cosmic' },
]

export const SIMULATED_PHASE_COLORS: Record<SimulatedPhase, { bg: string; border: string; text: string; glow: string; badge: string }> = {
  solid: {
    bg: 'rgba(251, 146, 60, 0.16)',
    border: 'rgba(251, 146, 60, 0.55)',
    text: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.4)',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  liquid: {
    bg: 'rgba(34, 211, 238, 0.22)',
    border: 'rgba(34, 211, 238, 0.75)',
    text: '#22d3ee',
    glow: 'rgba(34, 211, 238, 0.55)',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
  },
  gas: {
    bg: 'rgba(192, 132, 252, 0.20)',
    border: 'rgba(192, 132, 252, 0.65)',
    text: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.45)',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  superfluid: {
    bg: 'rgba(244, 114, 182, 0.25)',
    border: 'rgba(244, 114, 182, 0.8)',
    text: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.6)',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  },
  plasma: {
    bg: 'rgba(248, 113, 113, 0.28)',
    border: 'rgba(248, 113, 113, 0.85)',
    text: '#f87171',
    glow: 'rgba(248, 113, 113, 0.7)',
    badge: 'bg-rose-500/25 text-rose-300 border-rose-500/50',
  },
  unknown: {
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.4)',
    text: '#94a3b8',
    glow: 'transparent',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
}

export function formatTemp(tempK: number, unit: TempUnit = 'K', precision = 1): string {
  if (unit === 'C') {
    const c = tempK - 273.15
    return `${c.toFixed(precision)} °C`
  }
  if (unit === 'F') {
    const f = (tempK - 273.15) * (9 / 5) + 32
    return `${f.toFixed(precision)} °F`
  }
  return `${tempK.toFixed(precision)} K`
}

export function tempToKelvin(value: number, unit: TempUnit): number {
  if (unit === 'C') return Math.max(0, value + 273.15)
  if (unit === 'F') return Math.max(0, (value - 32) * (5 / 9) + 273.15)
  return Math.max(0, value)
}

export function kelvinToUnit(tempK: number, unit: TempUnit): number {
  if (unit === 'C') return tempK - 273.15
  if (unit === 'F') return (tempK - 273.15) * (9 / 5) + 32
  return tempK
}

/** Non-linear mapping from slider 0..1000 to 0..6000 K with high precision around 0..500 K */
export function sliderToKelvin(sliderVal: number): number {
  const norm = Math.max(0, Math.min(1000, sliderVal)) / 1000
  const k = 6000 * Math.pow(norm, 2.2)
  return Math.round(k * 10) / 10
}

export function kelvinToSlider(tempK: number): number {
  const clamped = Math.max(0, Math.min(6000, tempK))
  const norm = Math.pow(clamped / 6000, 1 / 2.2)
  return Math.round(norm * 1000)
}

export function getPhaseAtTemperature(el: ElementData, tempK: number): PhaseResult {
  // 1. Extreme thermal plasma
  if (tempK >= 10000) {
    return {
      phase: 'plasma',
      label: 'Plasma',
      color: '#f87171',
      icon: '⚡',
      isNearTransition: false,
      transitionInfo: 'Thermally ionized plasma (T ≥ 10,000 K)',
    }
  }

  // 2. Helium special quantum physics at 1 atm
  if (el.number === 2) {
    if (tempK < 2.1768) {
      return {
        phase: 'superfluid',
        label: 'Superfluid (He-II)',
        color: '#f472b6',
        icon: '🌀',
        isNearTransition: Math.abs(tempK - 2.1768) <= 0.6,
        transitionInfo: 'Lambda point T_λ = 2.1768 K (zero viscosity, quantum vortex quantization)',
      }
    } else if (tempK < 4.22) {
      return {
        phase: 'liquid',
        label: 'Liquid (He-I)',
        color: '#22d3ee',
        icon: '💧',
        isNearTransition: Math.abs(tempK - 4.22) <= 0.5 || Math.abs(tempK - 2.1768) <= 0.5,
        transitionInfo: 'Liquid Helium-I (boils at 4.22 K; never solidifies at 1 atm due to zero-point motion)',
      }
    } else {
      return {
        phase: 'gas',
        label: 'Gas',
        color: '#c084fc',
        icon: '☁️',
        isNearTransition: Math.abs(tempK - 4.22) <= 0.5,
        transitionInfo: 'Gas phase (boiling point 4.22 K)',
      }
    }
  }

  const tm = el.meltingPoint
  const tb = el.boilingPoint

  // Carbon sublimation at 1 atm
  if (el.number === 6) {
    const tSub = 3915
    if (tempK < tSub) {
      const near = Math.abs(tempK - tSub) <= 60
      return {
        phase: 'solid',
        label: 'Solid',
        color: '#fb923c',
        icon: '❄️',
        isNearTransition: near,
        transitionInfo: `Sublimes directly to vapor at 3,915 K (${(tSub - tempK).toFixed(0)} K higher)`,
      }
    } else {
      return {
        phase: 'gas',
        label: 'Gas',
        color: '#c084fc',
        icon: '☁️',
        isNearTransition: Math.abs(tempK - tSub) <= 60,
        transitionInfo: `Sublimed vapor (T ≥ 3,915 K at 1 atm)`,
      }
    }
  }

  // Arsenic sublimation at 1 atm
  if (el.number === 33) {
    const tSub = 887
    if (tempK < tSub) {
      const near = Math.abs(tempK - tSub) <= 25
      return {
        phase: 'solid',
        label: 'Solid',
        color: '#fb923c',
        icon: '❄️',
        isNearTransition: near,
        transitionInfo: `Sublimes directly to vapor at 887 K (${(tSub - tempK).toFixed(1)} K higher)`,
      }
    } else {
      return {
        phase: 'gas',
        label: 'Gas',
        color: '#c084fc',
        icon: '☁️',
        isNearTransition: Math.abs(tempK - tSub) <= 25,
        transitionInfo: `Sublimed arsenic vapor (T ≥ 887 K at 1 atm)`,
      }
    }
  }

  // If no thermodynamic data (e.g. synthetic transuranics Z >= 104)
  if (tm == null && tb == null) {
    return {
      phase: 'unknown',
      label: 'Predicted / Unknown',
      color: '#94a3b8',
      icon: '?',
      isNearTransition: false,
      transitionInfo: 'Synthetic radioactive nuclide (short half-life, no macro phase measured)',
    }
  }

  if (tm != null && tb != null) {
    if (tempK < tm) {
      const near = Math.abs(tempK - tm) <= Math.max(12, tm * 0.035)
      const delta = tm - tempK
      return {
        phase: 'solid',
        label: 'Solid',
        color: '#fb923c',
        icon: '❄️',
        isNearTransition: near,
        transitionInfo: `Solid (melts at ${tm.toFixed(1)} K, in +${delta.toFixed(1)} K)`,
      }
    } else if (tempK < tb) {
      const nearMelt = Math.abs(tempK - tm) <= Math.max(12, tm * 0.035)
      const nearBoil = Math.abs(tempK - tb) <= Math.max(12, tb * 0.035)
      const deltaBoil = tb - tempK
      return {
        phase: 'liquid',
        label: 'Liquid',
        color: '#22d3ee',
        icon: '💧',
        isNearTransition: nearMelt || nearBoil,
        transitionInfo: `Liquid range (${tm.toFixed(1)} K → ${tb.toFixed(1)} K; boils in +${deltaBoil.toFixed(1)} K)`,
      }
    } else {
      const near = Math.abs(tempK - tb) <= Math.max(12, tb * 0.035)
      const delta = tempK - tb
      return {
        phase: 'gas',
        label: 'Gas',
        color: '#c084fc',
        icon: '☁️',
        isNearTransition: near,
        transitionInfo: `Gas vapor (boiled at ${tb.toFixed(1)} K, ${delta.toFixed(1)} K above boiling point)`,
      }
    }
  }

  if (tm != null) {
    if (tempK < tm) {
      return {
        phase: 'solid',
        label: 'Solid',
        color: '#fb923c',
        icon: '❄️',
        isNearTransition: Math.abs(tempK - tm) <= 15,
        transitionInfo: `Melts at ${tm.toFixed(1)} K`,
      }
    } else {
      return {
        phase: 'liquid',
        label: 'Liquid',
        color: '#22d3ee',
        icon: '💧',
        isNearTransition: false,
        transitionInfo: `Liquid (Tm = ${tm.toFixed(1)} K)`,
      }
    }
  }

  if (tb != null) {
    if (tempK < tb) {
      return {
        phase: 'solid',
        label: 'Solid',
        color: '#fb923c',
        icon: '❄️',
        isNearTransition: Math.abs(tempK - tb) <= 15,
        transitionInfo: `Condenses below ${tb.toFixed(1)} K`,
      }
    } else {
      return {
        phase: 'gas',
        label: 'Gas',
        color: '#c084fc',
        icon: '☁️',
        isNearTransition: Math.abs(tempK - tb) <= 15,
        transitionInfo: `Gas (Tb = ${tb.toFixed(1)} K)`,
      }
    }
  }

  return {
    phase: 'unknown',
    label: 'Unknown',
    color: '#94a3b8',
    icon: '?',
    isNearTransition: false,
  }
}

export function getPhaseCountsAtTemperature(tempK: number) {
  let solid = 0
  let liquid = 0
  let gas = 0
  let superfluid = 0
  let plasma = 0
  let unknown = 0

  for (const el of ELEMENTS) {
    const res = getPhaseAtTemperature(el, tempK)
    if (res.phase === 'solid') solid++
    else if (res.phase === 'liquid') liquid++
    else if (res.phase === 'gas') gas++
    else if (res.phase === 'superfluid') superfluid++
    else if (res.phase === 'plasma') plasma++
    else unknown++
  }

  return { solid, liquid, gas, superfluid, plasma, unknown }
}
