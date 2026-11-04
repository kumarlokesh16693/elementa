/**
 * ELEMENTA — Special Relativity Laboratory
 * Lorentz factor, length contraction, time dilation, relativistic dynamics,
 * Doppler shift, velocity addition, muon decay, and the twin paradox.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import '@/components/relativity/relativity-element'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'
import {
  C,
  C_KM,
  ELECTRON_MASS,
  PROTON_MASS,
  betaFromRapidity,
  contractedLength,
  dilatedTime,
  dopplerFactor,
  dopplerFrequency,
  dopplerWavelength,
  electronRestEV,
  intervalType,
  kineticEnergy,
  lorentzFactor,
  muonSurvival,
  momentumTimesC,
  newtonianKineticEnergy,
  properTime,
  rapidity,
  spacetimeInterval,
  totalEnergy,
  twinAges,
  velocityAddition,
  wavelengthToCSS,
  wavelengthToFrequency,
} from '@/lib/relativity'

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

function slider(
  label: string,
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
      class: 'w-full accent-violet-400',
    }),
    Htag(
      'div',
      { class: 'text-[10px] font-mono text-zinc-200' },
      format ? `${format(get())} ${unit}` : `${get().toFixed(3)} ${unit}`,
    ),
  )
}

function toggle(label: string, get: () => boolean, set: (v: boolean) => void): VNode {
  return Htag(
    'button',
    {
      type: 'button',
      onclick: () => { set(!get()); syncUrl() },
      class: `rounded-md border px-2.5 py-1 text-[11px] transition ${
        get()
          ? 'border-violet-400/60 bg-violet-400/10 text-violet-300'
          : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-200'
      }`,
    },
    label,
  )
}

function fmtSci(v: number): string {
  if (!Number.isFinite(v) || v === 0) return '0'
  return v.toExponential(3)
}

/** Adaptive eV formatter: eV / keV / MeV / GeV. */
function fmtEV(ev: number): string {
  const a = Math.abs(ev)
  if (a >= 1e9) return `${(ev / 1e9).toFixed(3)} GeV`
  if (a >= 1e6) return `${(ev / 1e6).toFixed(3)} MeV`
  if (a >= 1e3) return `${(ev / 1e3).toFixed(3)} keV`
  return `${ev.toFixed(3)} eV`
}

function getInitialParams(): Record<string, number> {
  if (typeof window === 'undefined') {
    return { beta: 0.8, L0: 12, lambda0: 550, b1: 0.6, b2: 0.7, muonDist: 8, twinDist: 4.37 }
  }
  const params = new URLSearchParams(window.location.search)
  const p = (k: string, d: number): number => {
    const v = Number(params.get(k))
    return Number.isFinite(v) && params.get(k) != null ? v : d
  }
  return {
    beta: p('beta', 0.8),
    L0: p('L0', 12),
    lambda0: p('lambda0', 550),
    b1: p('b1', 0.6),
    b2: p('b2', 0.7),
    muonDist: p('muonDist', 8),
    twinDist: p('twinDist', 4.37),
  }
}

const initial = getInitialParams()

const state = reactive({
  beta: Math.min(0.999, Math.max(0, initial.beta)),
  L0: initial.L0,
  lambda0: initial.lambda0,
  b1: initial.b1,
  b2: initial.b2,
  muonDist: initial.muonDist,
  twinDist: initial.twinDist,
  showTrail: true,
  showRods: true,
  animate: true,
})

let lastUrl = ''
function syncUrl(): void {
  if (typeof window === 'undefined') return
  const next = new URLSearchParams()
  next.set('beta', String(state.beta))
  next.set('L0', String(state.L0))
  next.set('lambda0', String(state.lambda0))
  next.set('b1', String(state.b1))
  next.set('b2', String(state.b2))
  next.set('muonDist', String(state.muonDist))
  next.set('twinDist', String(state.twinDist))
  next.set('show-trail', String(state.showTrail))
  next.set('show-rods', String(state.showRods))
  next.set('animate', String(state.animate))
  const url = `${window.location.pathname}?${next}`
  if (url !== lastUrl) {
    lastUrl = url
    window.history.replaceState(null, '', url)
  }
}

function SectionTitle(text: string): VNode {
  return Htag(
    'h2',
    { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
    text,
  )
}

export default function RelativityPage(): VNode {
  const beta = state.beta
  const gamma = lorentzFactor(beta)
  const vKm = beta * C_KM
  const L0 = state.L0
  const L = contractedLength(L0, beta)

  // Dynamics (per unit mass, plus electron/proton specifics).
  const keElectron = kineticEnergy(ELECTRON_MASS, beta)
  const keProton = kineticEnergy(PROTON_MASS, beta)
  const eElectron = totalEnergy(ELECTRON_MASS, beta)
  const pcElectron = momentumTimesC(ELECTRON_MASS, beta)
  const keNewton = newtonianKineticEnergy(ELECTRON_MASS, beta)
  const restElecEV = electronRestEV()

  // Doppler.
  const lambda0 = state.lambda0
  const f0 = wavelengthToFrequency(lambda0 * 1e-9)
  const lambdaApp = dopplerWavelength(lambda0 * 1e-9, beta, true) * 1e9
  const lambdaRec = dopplerWavelength(lambda0 * 1e-9, beta, false) * 1e9
  const fApp = dopplerFrequency(f0, beta, true)
  const fRec = dopplerFrequency(f0, beta, false)

  // Velocity addition.
  const bAdd = velocityAddition(state.b1, state.b2)
  const phiSum = rapidity(state.b1) + rapidity(state.b2)

  // Muons.
  const muonDistM = state.muonDist * 1000
  const muonDilated = muonSurvival(muonDistM, beta, true)
  const muonNaive = muonSurvival(muonDistM, beta, false)
  const muonBoost = muonNaive > 1e-30 ? muonDilated / muonNaive : Infinity

  // Twin paradox.
  const twin = twinAges(state.twinDist, beta)

  // Spacetime sample event (1 s, 1.5e8 m).
  const sampleT = 1
  const sampleX = 1.5e8
  const s2 = spacetimeInterval(sampleT, sampleX)
  const sType = intervalType(sampleT, sampleX)

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
          Htag('span', { class: 'text-violet-400' }, 'RELATIVITY'),
          ' LAB',
        ),
      ),
      Htag(
        'span',
        { class: 'hidden font-mono text-[10px] text-zinc-500 lg:inline' },
        'Lorentz boost · length contraction · time dilation · Doppler · muon decay · twin paradox',
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
          Htag('elementa-relativity', {
            'data-beta': String(state.beta),
            'data-proper-length': String(state.L0),
            'data-show-trail': String(state.showTrail),
            'data-show-rods': String(state.showRods),
            'data-animate': String(state.animate),
            style: 'width: 100%; height: 100%; display: block;',
          }),
          Htag(
            'div',
            {
              class:
                'pointer-events-none absolute bottom-2 left-2 flex flex-wrap items-center gap-2 font-mono text-[9.5px] text-zinc-500',
            },
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-white' }),
              'photon'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-cyan-400' }),
              `contracted L = L₀/γ`),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-zinc-200' }),
              'proper L₀'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-violet-400' }),
              "worldline"),
          ),
        ),
        Htag(
          'div',
          { class: 'mt-2 flex flex-wrap items-center gap-2' },
          toggle('Animate clock', () => state.animate, (v) => { state.animate = v }),
          toggle('Photon trail', () => state.showTrail, (v) => { state.showTrail = v }),
          toggle('Rods', () => state.showRods, (v) => { state.showRods = v }),
          Htag(
            'span',
            { class: 'font-mono text-[10px] text-zinc-600' },
            `γ = ${gamma.toFixed(3)} · clock slowed ${gamma.toFixed(2)}×`,
          ),
        ),
      ),

      // Right: controls & results
      Htag(
        'div',
        { class: 'space-y-3' },
        // Lorentz state
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Lorentz factor'),
          Htag(
            'div',
            { class: 'grid grid-cols-3 gap-2' },
            StatCard({ label: 'β = v/c', value: beta.toFixed(4), tint: '#a78bfa' }),
            StatCard({ label: 'γ', value: gamma.toFixed(4), tint: '#22d3ee' }),
            StatCard({ label: 'v', value: `${vKm.toFixed(0)} km/s`, tint: '#f472b6' }),
          ),
          Htag('div', { class: 'mt-2 space-y-2' },
            slider('Velocity β', 0, 0.999, 0.001, () => state.beta, (v) => { state.beta = v },
              (v) => v.toFixed(3), 'c'),
          ),
          Htag(
            'p',
            { class: 'mt-1 text-[9px] leading-relaxed text-zinc-600' },
            'γ = 1/√(1−β²) diverges as β→1: moving clocks slow, lengths contract along the motion, and energy grows without bound.',
          ),
        ),

        // Length contraction & time dilation
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Length contraction & time dilation'),
          Htag(
            'div',
            { class: 'grid grid-cols-2 gap-2' },
            StatCard({ label: 'Proper length L₀', value: `${L0.toFixed(1)} m` }),
            StatCard({ label: 'Contracted L', value: `${L.toFixed(3)} m`, tint: '#22d3ee' }),
            StatCard({ label: 'Δt for Δt₀ = 1 s', value: `${dilatedTime(1, beta).toFixed(4)} s`, tint: '#fbbf24' }),
            StatCard({ label: 'Δt for Δt₀ = 1 yr', value: `${dilatedTime(1, beta).toFixed(3)} yr`, tint: '#fbbf24' }),
            StatCard({ label: 'Proper time / hr', value: `${properTime(3600, beta).toFixed(2)} s`, tint: '#34d399' }),
            StatCard({ label: 'Contraction 1−L/L₀', value: `${((1 - L / L0) * 100).toFixed(1)} %` }),
          ),
          Htag('div', { class: 'mt-2 space-y-2' },
            slider('Proper length L₀', 2, 40, 0.5, () => state.L0, (v) => { state.L0 = v },
              (v) => v.toFixed(1), 'm'),
          ),
        ),

        // Energy & momentum
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Relativistic energy & momentum (electron)'),
          Htag(
            'div',
            { class: 'grid grid-cols-2 gap-2' },
            StatCard({ label: 'Kinetic energy', value: fmtEV(keElectron / 1.602176634e-19), tint: '#34d399' }),
            StatCard({ label: 'Total energy E', value: fmtEV(eElectron / 1.602176634e-19), tint: '#22d3ee' }),
            StatCard({ label: 'Momentum × c', value: fmtEV(pcElectron / 1.602176634e-19), tint: '#a78bfa' }),
            StatCard({ label: 'Rest energy mc²', value: fmtEV(restElecEV), tint: '#94a3b8' }),
            StatCard({ label: 'Classical ½mv²', value: fmtEV(keNewton / 1.602176634e-19), tint: '#f87171' }),
            StatCard({ label: 'γ − 1', value: (gamma - 1).toFixed(4) }),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[9px] leading-relaxed text-zinc-600' },
            `Proton KE at this β: ${fmtEV(keProton / 1.602176634e-19)} · E² = (pc)² + (mc²)² · classical KE underestimates by ${(((keElectron - keNewton) / Math.max(keNewton, 1e-30)) * 100).toFixed(1)} %.`,
          ),
        ),

        // Doppler
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Relativistic Doppler effect'),
          Htag(
            'div',
            { class: 'grid grid-cols-2 gap-2' },
            StatCard({ label: 'f₀ (source)', value: `${(f0 / 1e12).toFixed(1)} THz` }),
            StatCard({ label: 'λ₀ (source)', value: `${lambda0.toFixed(0)} nm` }),
            StatCard({ label: 'f approaching', value: `${(fApp / 1e12).toFixed(1)} THz`, tint: '#60a5fa' }),
            StatCard({ label: 'f receding', value: `${(fRec / 1e12).toFixed(1)} THz`, tint: '#f87171' }),
          ),
          // Colour swatches: source / blueshift / redshift.
          Htag(
            'div',
            { class: 'mt-2 grid grid-cols-3 gap-2' },
            ...[
              { label: 'source', nm: lambda0, color: wavelengthToCSS(lambda0) },
              { label: '→ you', nm: lambdaApp, color: wavelengthToCSS(lambdaApp) },
              { label: '← you', nm: lambdaRec, color: wavelengthToCSS(lambdaRec) },
            ].map((s) =>
              Htag(
                'div',
                { class: 'overflow-hidden rounded-lg border border-white/10' },
                Htag('div', {
                  style: `height: 30px; background: ${s.color};`,
                }),
                Htag(
                  'div',
                  { class: 'bg-white/[0.03] px-1.5 py-1 text-center font-mono text-[9px] text-zinc-400' },
                  `${s.label} ${s.nm.toFixed(0)} nm`,
                ),
              ),
            ),
          ),
          Htag('div', { class: 'mt-2 space-y-2' },
            slider('Source λ₀', 380, 780, 1, () => state.lambda0, (v) => { state.lambda0 = v },
              (v) => v.toFixed(0), 'nm'),
          ),
          Htag(
            'p',
            { class: 'mt-1 text-[9px] text-zinc-600' },
            `f/f₀ = √((1±β)/(1∓β)) · approaching factor ${dopplerFactor(beta, true).toFixed(3)}×, receding ${dopplerFactor(beta, false).toFixed(3)}×.`,
          ),
        ),

        // Velocity addition
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Relativistic velocity addition'),
          Htag(
            'div',
            { class: 'grid grid-cols-2 gap-2' },
            StatCard({ label: 'u₁ + u₂ (relativistic)', value: `${bAdd.toFixed(4)} c`, tint: '#a78bfa' }),
            StatCard({ label: 'Classical sum', value: `${(state.b1 + state.b2).toFixed(4)} c`, tint: '#f87171' }),
            StatCard({ label: 'Rapidity sum φ', value: phiSum.toFixed(3), tint: '#22d3ee' }),
            StatCard({ label: 'β from φ', value: betaFromRapidity(phiSum).toFixed(4) }),
          ),
          Htag('div', { class: 'mt-2 space-y-2' },
            slider('u₁', 0, 0.999, 0.001, () => state.b1, (v) => { state.b1 = v },
              (v) => v.toFixed(3), 'c'),
            slider('u₂', 0, 0.999, 0.001, () => state.b2, (v) => { state.b2 = v },
              (v) => v.toFixed(3), 'c'),
          ),
          Htag(
            'p',
            { class: 'mt-1 text-[9px] text-zinc-600' },
            'u = (u₁+u₂)/(1+u₁u₂/c²) — always below c, no matter the classical sum.',
          ),
        ),

        // Muon decay
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Muon decay at sea level'),
          Htag(
            'div',
            { class: 'grid grid-cols-3 gap-2' },
            StatCard({ label: 'Survival (dilated)', value: `${(muonDilated * 100).toFixed(2)} %`, tint: '#34d399' }),
            StatCard({ label: 'Survival (no dilation)', value: muonNaive < 1e-4 ? muonNaive.toExponential(1) : `${(muonNaive * 100).toFixed(3)} %`, tint: '#f87171' }),
            StatCard({ label: 'Enhancement', value: Number.isFinite(muonBoost) ? `${muonBoost.toExponential(1)}×` : '∞', tint: '#a78bfa' }),
          ),
          Htag('div', { class: 'mt-2 space-y-2' },
            slider('Distance', 1, 30, 0.5, () => state.muonDist, (v) => { state.muonDist = v },
              (v) => v.toFixed(1), 'km'),
          ),
          Htag(
            'p',
            { class: 'mt-1 text-[9px] text-zinc-600' },
            'τ₀ = 2.20 μs. Cosmic-ray muons reach the ground because their dilated lifetime (γτ₀) outlasts the flight — the classic 1930s proof of time dilation.',
          ),
        ),

        // Twin paradox
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Twin paradox (round trip)'),
          Htag(
            'div',
            { class: 'grid grid-cols-3 gap-2' },
            StatCard({ label: 'Earth ages', value: `${twin.earthYears.toFixed(2)} yr`, tint: '#fbbf24' }),
            StatCard({ label: 'Traveller ages', value: `${twin.travelerYears.toFixed(2)} yr`, tint: '#22d3ee' }),
            StatCard({ label: 'Age difference', value: `${(twin.earthYears - twin.travelerYears).toFixed(2)} yr`, tint: '#a78bfa' }),
          ),
          Htag('div', { class: 'mt-2 space-y-2' },
            slider('Destination', 1, 30, 0.01, () => state.twinDist, (v) => { state.twinDist = v },
              (v) => v.toFixed(2), 'ly'),
          ),
          Htag(
            'p',
            { class: 'mt-1 text-[9px] text-zinc-600' },
            `Travelling at β = ${beta.toFixed(3)}: the traveller's proper time is diluted by γ = ${gamma.toFixed(3)}. The asymmetry — turnaround acceleration — resolves the paradox.`,
          ),
        ),

        // Spacetime sample
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Spacetime interval'),
          Htag(
            'div',
            { class: 'grid grid-cols-2 gap-2' },
            StatCard({ label: 'Sample event', value: 't = 1 s, x = 1.5×10⁸ m' }),
            StatCard({ label: 's² = (ct)² − x²', value: `${s2.toExponential(3)} m²`, tint: '#22d3ee' }),
            StatCard({ label: 'Classification', value: sType, tint: sType === 'timelike' ? '#34d399' : sType === 'spacelike' ? '#f87171' : '#fbbf24' }),
            StatCard({ label: 'c·t', value: `${(C * sampleT).toExponential(2)} m` }),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[9px] text-zinc-600' },
            'Timelike (s² > 0): causally connected, ordered for all observers. Lightlike: a photon path. Spacelike: no causal order — simultaneity is relative.',
          ),
        ),
      ),
    ),
  )
}
