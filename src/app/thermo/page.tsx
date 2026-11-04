/**
 * ELEMENTA — Thermodynamics & Heat Engines Laboratory
 * PV diagrams, Carnot/Otto/Diesel/Stirling cycles, entropy,
 * kinetic theory, and blackbody radiation.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import '@/components/thermo/thermo-element'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'
import {
  C,
  H,
  K_B,
  N_A,
  R,
  SIGMA,
  adiabaticPressure,
  adiabaticTemperature,
  computeCycle,
  cycleProcesses,
  deltaS,
  heat,
  mbSpeedDistribution,
  moles,
  planckRadiance,
  pressure,
  stephanBoltzmann,
  temperature,
  vMp,
  vMean,
  vRms,
  volume,
  wienLambdaMax,
  type Cycle,
  type Process,
} from '@/lib/thermo'

function Htag(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

function StatCard({ label, value, tint }: { label: string; value: string; tint?: string }): VNode {
  return Htag(
    'div',
    { class: 'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2' },
    Htag('div', { class: 'text-[9px] uppercase tracking-wider text-zinc-500' }, label),
    Htag(
      'div',
      { class: 'mt-0.5 font-mono text-[13px] font-semibold', style: { color: tint ?? '#e4e4e7' } },
      value,
    ),
  )
}

function getInitialParams(): {
  n: number
  T: number
  V: number
  gamma: number
  cycle: string
  Th: number
  Tc: number
  cutoff: number
} {
  if (typeof window === 'undefined') {
    return { n: 1, T: 300, V: 0.0224, gamma: 1.4, cycle: 'carnot', Th: 600, Tc: 300, cutoff: 1.5 }
  }
  const params = new URLSearchParams(window.location.search)
  const p = (k: string, d: number): number => {
    const raw = params.get(k)
    if (raw == null || raw.trim() === '') return d
    const v = Number(raw)
    return Number.isFinite(v) ? v : d
  }
  const positive = (k: string, d: number): number => {
    const value = p(k, d)
    return value > 0 ? value : d
  }
  const gamma = p('gamma', 1.4)
  return {
    n: positive('n', 1),
    T: positive('T', 300),
    V: positive('V', 0.0224),
    // The adiabatic formulas divide by gamma - 1, so reject stale or invalid
    // values at and below 1 before calculating the cycle.
    gamma: gamma > 1 ? gamma : 1.4,
    cycle: params.get('cycle') ?? 'carnot',
    Th: positive('Th', 600),
    Tc: positive('Tc', 300),
    cutoff: positive('cutoff', 1.5),
  }
}

const initialParams = getInitialParams()

const state = reactive({
  n: initialParams.n,
  T: initialParams.T,
  V: initialParams.V,
  gamma: initialParams.gamma,
  cycle: initialParams.cycle as Cycle,
  Th: initialParams.Th,
  Tc: initialParams.Tc,
  cutoff: initialParams.cutoff,
  showCycle: true,
  showParticles: true,
  autoCycle: false,
  cyclePhase: 0,
})

let raf = 0
function startClock(): void {
  if (state.autoCycle || typeof window === 'undefined') return
  state.autoCycle = true
  const tick = () => {
    if (!state.autoCycle) return
    state.cyclePhase = (state.cyclePhase + 0.01) % 1
    syncUrl()
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}
function stopClock(): void {
  state.autoCycle = false
  cancelAnimationFrame(raf)
}

let lastUrl = ''
function syncUrl(): void {
  if (typeof window === 'undefined') return
  const next = new URLSearchParams()
  next.set('n', String(state.n))
  next.set('T', String(state.T))
  next.set('V', String(state.V))
  next.set('gamma', String(state.gamma))
  next.set('cycle', state.cycle)
  next.set('Th', String(state.Th))
  next.set('Tc', String(state.Tc))
  next.set('cutoff', String(state.cutoff))
  next.set('show-cycle', String(state.showCycle))
  next.set('show-particles', String(state.showParticles))
  next.set('auto-cycle', String(state.autoCycle))
  next.set('cycle-phase', String(state.cyclePhase))
  const url = `${window.location.pathname}?${next}`
  if (url !== lastUrl) {
    lastUrl = url
    window.history.replaceState(null, '', url)
  }
}

function slider(
  label: string,
  id: string,
  min: number,
  max: number,
  step: number,
  get: () => number,
  set: (v: number) => void,
  format?: (v: number) => string,
  unit = '',
): VNode {
  return Htag(
    'div',
    { class: 'space-y-1' },
    Htag('div', { class: 'flex justify-between text-[9.5px] font-medium text-zinc-400' }, label),
    Htag('input', {
      type: 'range', min: String(min), max: String(max), step: String(step),
      value: String(get()),
      oninput: (e: Event) => { set(parseFloat((e.target as HTMLInputElement).value)); syncUrl() },
      class: 'w-full accent-cyan-400',
    }),
    Htag(
      'div',
      { class: 'text-[10px] font-mono text-zinc-200' },
      format ? `${format(get())} ${unit}` : `${get().toFixed(2)} ${unit}`,
    ),
  )
}

function toggle(label: string, id: string, get: () => boolean, set: (v: boolean) => void): VNode {
  return Htag(
    'button',
    {
      type: 'button',
      onclick: () => { set(!get()); syncUrl() },
      class: `rounded-md border px-2.5 py-1 text-[11px] transition ${
        get()
          ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
          : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-200'
      }`,
    },
    label,
  )
}

function fmtSci(v: number): string {
  if (!Number.isFinite(v) || v === 0) return '0'
  const text = v.toExponential(3)
  return text
}

export default function ThermoPage(): VNode {
  const P = pressure(state.n, state.T, state.V)
  const P_atm = 101325
  const cycle = computeCycle(
    state.cycle,
    state.n,
    state.V * 0.4,
    state.V * 2.2,
    state.Th,
    state.Tc,
    state.gamma,
    state.cutoff,
  )

  const cycleLabels: Record<Cycle, string> = {
    carnot: 'Carnot',
    otto: 'Otto',
    diesel: 'Diesel',
    stirling: 'Stirling',
  }

  const procLabels: Record<Process, string> = {
    isobaric: 'Isobaric',
    isochoric: 'Isochoric',
    isothermal: 'Isothermal',
    adiabatic: 'Adiabatic',
  }

  // Maxwell-Boltzmann speeds for N2 (m = 4.65e-26 kg)
  const mN2 = 4.65e-26
  const speeds = { mp: vMp(state.T, mN2), mean: vMean(state.T, mN2), rms: vRms(state.T, mN2) }

  // Blackbody at state T
  const sb = stephanBoltzmann(state.T)
  const wl = wienLambdaMax(state.T)

  // Entropy change from (P_atm, 300K, V_atm) to current state
  const V_atm = volume(state.n, 300, P_atm)
  const dS = deltaS(state.n, R / (state.gamma - 1), 300, state.T, V_atm, state.V)

  const cycleDescr: Record<Cycle, string> = {
    carnot: 'Two isothermal + two adiabatic processes. Theoretical maximum efficiency between two reservoirs.',
    otto: 'Two adiabatic + two isochoric processes. Idealized gasoline (spark-ignition) engine.',
    diesel: 'Two adiabatic + one isobaric + one isochoric. Idealized diesel (compression-ignition) engine.',
    stirling: 'Two isothermal + two isochoric processes with perfect regenerators.',
  }

  return Htag(
    'div',
    { class: 'flex min-h-dvh flex-col bg-[#070a10] text-zinc-200' },
    // Header
    Htag(
      'header',
      {
        class:
          'sticky top-0 z-30 flex h-14 shrink-0 flex-wrap items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur',
      },
      Htag(
        'a',
        {
          href: './index.html',
          class:
            'rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
        },
        '← Periodic table',
      ),
      Htag(
        'div',
        { class: 'flex items-center gap-2' },
        ElementaLogo({ size: 26 }),
        Htag(
          'h1',
          { class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100' },
          Htag('span', { class: 'text-cyan-400' }, 'THERMO'),
          ' LAB',
        ),
      ),
      Htag(
        'span',
        { class: 'hidden font-mono text-[10px] text-zinc-500 lg:inline' },
        'PV diagrams · Carnot · Otto · Diesel · Stirling · kinetic theory · blackbody radiation',
      ),
      GitHubLink(),
    ),

    // Main grid
    Htag(
      'main',
      {
        class:
          'mx-auto grid w-full max-w-[1700px] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:p-6',
      },
      // Left: 3D visualization
      Htag(
        'div',
        { class: 'flex flex-col h-[700px] lg:h-[860px]' },
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-2 flex-1 relative' },
          Htag('elementa-thermo', {
            'data-n': state.n,
            'data-t': state.T,
            'data-v': state.V,
            'data-gamma': state.gamma,
            'data-cycle': state.cycle,
            'data-th': state.Th,
            'data-tc': state.Tc,
            'data-cutoff': state.cutoff,
            'data-show-cycle': String(state.showCycle),
            'data-show-particles': String(state.showParticles),
            'data-auto-cycle': String(state.autoCycle),
            'data-cycle-phase': String(state.cyclePhase),
            style: 'width: 100%; height: 100%; display: block;',
          }),
          Htag(
            'div',
            {
              class:
                'pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 font-mono text-[9.5px] text-zinc-500',
            },
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-cyan-400' }),
              'gas'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-slate-500' }),
              'piston'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-amber-400' }),
              'PV diagram'),
          ),
        ),
        Htag(
          'div',
          { class: 'mt-2 flex items-center gap-2' },
          toggle('Animate cycle', 'animate', () => state.autoCycle, (v) => {
            if (v) startClock()
            else stopClock()
          }),
          Htag(
            'button',
            {
              type: 'button',
              onclick: () => { state.cyclePhase = 0; syncUrl() },
              class: 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400 transition hover:text-zinc-200',
            },
            'Reset phase',
          ),
        ),
      ),
      // Right: controls & results
      Htag(
        'div',
        { class: 'space-y-3' },
        // State
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          Htag(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Ideal gas state',
          ),
          Htag(
            'div',
            { class: 'grid grid-cols-2 gap-2' },
            StatCard({ label: 'Pressure P', value: fmtSci(P), tint: '#f472b6' }),
            StatCard({ label: 'Temperature T', value: `${state.T.toFixed(1)} K`, tint: '#fbbf24' }),
            StatCard({ label: 'Volume V', value: `${state.V.toFixed(4)} m³`, tint: '#38bdf8' }),
            StatCard({ label: 'Moles n', value: `${state.n.toFixed(2)} mol` }),
            StatCard({ label: 'γ', value: `${state.gamma.toFixed(2)}` }),
            StatCard({ label: 'P / atm', value: `${(P / P_atm).toFixed(3)}` }),
          ),
        ),

        // State sliders
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          Htag(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'State variables',
          ),
          Htag(
            'div',
            { class: 'space-y-2' },
            slider('Moles n', 'n', 0.1, 5, 0.1, () => state.n, (v) => { state.n = v }, (v) => v.toFixed(2), 'mol'),
            slider('Temperature T', 'T', 100, 1500, 10, () => state.T, (v) => { state.T = v }, (v) => v.toFixed(1), 'K'),
            slider('Volume V', 'V', 0.001, 0.1, 0.001, () => state.V, (v) => { state.V = v }, (v) => v.toFixed(4), 'm³'),
            slider('Adiabatic γ', 'gamma', 1.01, 1.67, 0.01, () => state.gamma, (v) => { state.gamma = v }, (v) => v.toFixed(2)),
          ),
        ),

        // Cycle
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          Htag(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Heat-engine cycle',
          ),
          Htag(
            'div',
            { class: 'space-y-1' },
            ...Object.entries(cycleLabels).map(([key, label]) =>
              Htag(
                'button',
                {
                  type: 'button',
                  onclick: () => { state.cycle = key as Cycle; syncUrl() },
                  class: `w-full text-left rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${
                    state.cycle === key
                      ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                      : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                  }`,
                },
                label,
              ),
            ),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[9px] leading-relaxed text-zinc-600' },
            cycleDescr[state.cycle],
          ),
          Htag(
            'div',
            { class: 'space-y-2 mt-2' },
            state.cycle === 'diesel'
              ? slider('Cutoff ratio', 'cutoff', 1.0, 4, 0.1, () => state.cutoff, (v) => { state.cutoff = v }, (v) => v.toFixed(1))
              : null,
            slider('Hot Tₕ', 'Th', 300, 1500, 10, () => state.Th, (v) => { state.Th = v }, (v) => v.toFixed(1), 'K'),
            slider('Cold T_c', 'Tc', 100, 1000, 10, () => state.Tc, (v) => { state.Tc = v }, (v) => v.toFixed(1), 'K'),
          ),
        ),

        // Cycle results
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          Htag(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Cycle analysis',
          ),
          Htag(
            'div',
            { class: 'grid grid-cols-2 gap-2' },
            StatCard({ label: 'Heat in Q_in', value: fmtSci(cycle.heatIn), tint: '#34d399' }),
            StatCard({ label: 'Heat out |Q_out|', value: fmtSci(cycle.heatOut), tint: '#fb7185' }),
            StatCard({ label: 'Net work W_net', value: fmtSci(cycle.workNet), tint: '#22d3ee' }),
            StatCard({ label: 'Efficiency η', value: `${(cycle.efficiency * 100).toFixed(1)} %`, tint: '#a78bfa' }),
            StatCard({ label: 'Carnot η_c', value: `${(cycle.efficiencyCarnot * 100).toFixed(1)} %`, tint: '#94a3b8' }),
            StatCard({ label: 'ΔS', value: `${dS.toExponential(2)} J/K`, tint: '#94a3b8' }),
          ),
          Htag(
            'div',
            { class: 'mt-3 space-y-1 text-[9.5px] text-zinc-500' },
            ...cycle.points.map((pt, i) => Htag(
              'div',
              { class: 'flex justify-between' },
              Htag('span', { class: 'font-mono' }, `State ${pt.label}`),
              Htag('span', { class: 'text-right' }, `P=${fmtSci(pt.P)} Pa · V=${pt.V.toExponential(2)} m³ · T=${pt.T.toFixed(1)} K`),
            )),
            Htag('div', { class: 'mt-1 text-[9px] text-zinc-500' },
              `Processes: ${cycle.processes.map((p, i) => `${procLabels[p]} ${i+1}→${i+1===4?1:i+2}`).join(' · ')}`),
          ),
        ),

        // Kinetic theory
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          Htag(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Kinetic theory (N₂ at state T)',
          ),
          Htag(
            'div',
            { class: 'grid grid-cols-3 gap-2' },
            StatCard({ label: 'v_most probable', value: `${speeds.mp.toFixed(1)} m/s` }),
            StatCard({ label: 'v_mean', value: `${speeds.mean.toFixed(1)} m/s` }),
            StatCard({ label: 'v_rms', value: `${speeds.rms.toFixed(1)} m/s` }),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[9px] text-zinc-600' },
            'Maxwell–Boltzmann speed distribution for nitrogen molecules at the current temperature.',
          ),
        ),

        // Blackbody
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          Htag(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Blackbody radiation',
          ),
          Htag(
            'div',
            { class: 'grid grid-cols-2 gap-2' },
            StatCard({ label: 'Radiant exitance', value: `${sb.toExponential(2)} W/m²` }),
            StatCard({ label: 'λ_max (Wien)', value: `${(wl * 1e9).toFixed(1)} nm` }),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[9px] text-zinc-600' },
            'Stefan–Boltzmann law: M = σT⁴ · Wien: λmax = b/T.',
          ),
        ),
      ),
    ),
  )
}
