/**
 * ELEMENTA — Electromagnetism & Maxwell's Equations Laboratory
 * Interactive 3D visualization of electric fields, magnetic fields,
 * electromagnetic waves, and Lorentz-force particle dynamics.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import '@/components/em/em-field-element'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

function StatCard({ label, value, tint }: { label: string; value: string; tint?: string }): VNode {
  return H(
    'div',
    { class: 'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2' },
    H('div', { class: 'text-[9px] uppercase tracking-wider text-zinc-500' }, label),
    H(
      'div',
      { class: 'mt-0.5 font-mono text-[13px] font-semibold', style: { color: tint ?? '#e4e4e7' } },
      value,
    ),
  )
}

function getInitialParams(): {
  preset: string
  charge: number
  current: number
  loops: number
  radius: number
  frequency: number
  e0: number
  particleQ: number
  particleM: number
  vx: number
  vy: number
  vz: number
  time: number
  scale: number
} {
  if (typeof window === 'undefined') {
    return {
      preset: 'point-charge', charge: 1.0, current: 1.0, loops: 1, radius: 1.0,
      frequency: 5.0, e0: 1.0, particleQ: 1.0, particleM: 1.0,
      vx: 0, vy: 1, vz: 0, time: 0, scale: 1.0,
    }
  }
  const params = new URLSearchParams(window.location.search)
  const p = (k: string, d: number): number => {
    const raw = params.get(k)
    if (raw == null || raw.trim() === '') return d
    const v = Number(raw)
    return Number.isFinite(v) ? v : d
  }
  return {
    preset: params.get('preset') ?? 'point-charge',
    charge: p('charge', 1.0),
    current: p('current', 1.0),
    loops: p('loops', 1),
    radius: p('radius', 1.0),
    frequency: p('frequency', 5.0),
    e0: p('e0', 1.0),
    particleQ: p('particleQ', 1.0),
    particleM: p('particleM', 1.0),
    vx: p('vx', 0),
    vy: p('vy', 1),
    vz: p('vz', 0),
    time: p('time', 0),
    // A zero scale collapses every object to the origin and makes the camera
    // clipping range invalid, leaving a completely blank viewport.
    scale: p('scale', 1.0) > 0 ? p('scale', 1.0) : 1.0,
  }
}

const initialParams = getInitialParams()

const state = reactive({
  preset: initialParams.preset,
  charge: initialParams.charge,
  current: initialParams.current,
  loops: initialParams.loops,
  radius: initialParams.radius,
  frequency: initialParams.frequency,
  e0: initialParams.e0,
  particleQ: initialParams.particleQ,
  particleM: initialParams.particleM,
  particleV0: { x: initialParams.vx, y: initialParams.vy, z: initialParams.vz },
  time: initialParams.time,
  scale: initialParams.scale,
  playing: false,
})

let lastUrl = ''
function syncUrl(): void {
  if (typeof window === 'undefined') return
  const next = new URLSearchParams()
  next.set('preset', state.preset)
  next.set('charge', String(state.charge))
  next.set('current', String(state.current))
  next.set('loops', String(state.loops))
  next.set('radius', String(state.radius))
  next.set('frequency', String(state.frequency))
  next.set('e0', String(state.e0))
  next.set('particleQ', String(state.particleQ))
  next.set('particleM', String(state.particleM))
  next.set('vx', String(state.particleV0.x))
  next.set('vy', String(state.particleV0.y))
  next.set('vz', String(state.particleV0.z))
  next.set('time', String(state.time))
  next.set('scale', String(state.scale))
  const url = `${window.location.pathname}?${next}`
  if (url !== lastUrl) {
    lastUrl = url
    window.history.replaceState(null, '', url)
  }
}

let raf = 0
function startClock(): void {
  if (state.playing || typeof window === 'undefined') return
  state.playing = true
  const tick = () => {
    if (!state.playing) return
    state.time += 0.02
    syncUrl()
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}
function stopClock(): void {
  state.playing = false
  cancelAnimationFrame(raf)
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
): VNode {
  return H(
    'div',
    { class: 'space-y-1' },
    H('div', { class: 'flex justify-between text-[9.5px] font-medium text-zinc-400' }, label),
    H('input', {
      type: 'range', min: String(min), max: String(max), step: String(step),
      value: String(get()),
      oninput: (e: Event) => { set(parseFloat((e.target as HTMLInputElement).value)); syncUrl() },
      class: 'w-full accent-cyan-400',
    }),
    H(
      'div',
      { class: 'text-[10px] font-mono text-zinc-200' },
      format ? format(get()) : get().toFixed(2),
    ),
  )
}

function toggle(label: string, id: string, get: () => boolean, set: (v: boolean) => void): VNode {
  return H(
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

export default function EMLabPage(): VNode {
  const presetLabels: Record<string, string> = {
    'point-charge': 'Point Charge (Electrostatics)',
    dipole: 'Electric Dipole',
    solenoid: 'Solenoid (Magnetostatics)',
    'em-wave': 'Electromagnetic Wave',
    lorentz: 'Lorentz Force',
  }

  const presetDescr: Record<string, string> = {
    'point-charge': "Coulomb field E = kq/r²·r̂ around a point charge. Field vectors + lines.",
    dipole: "Two equal and opposite charges separated by 2a. Dipole field pattern.",
    solenoid: "Biot–Savart field from N circular current loops. B-field vectors in yz/xz planes.",
    'em-wave': "Plane EM wave: E = E₀sin(kz−ωt)x̂, B = B₀sin(kz−ωt)ŷ, B₀=E₀/c.",
    lorentz: "F = q(E + v×B). Charged particle in uniform crossed E (y) and B (z) fields.",
  }

  const isWave = state.preset === 'em-wave'
  const isLorentz = state.preset === 'lorentz'
  const isMagneto = state.preset === 'solenoid'
  const isElectro = state.preset === 'point-charge' || state.preset === 'dipole'

  const maxwellEqs = H(
    'div',
    { class: 'rounded-lg border border-white/10 bg-[#0a0f18] p-3 mt-2' },
    H('h2', { class: 'mb-1 text-[9px] uppercase tracking-[0.18em] text-zinc-500' }, "Maxwell's equations"),
    H(
      'div',
      { class: 'text-[9.5px] leading-[1.5] text-zinc-300 font-mono space-y-1' },
      H('div', null, '∇·E  =  ρ/ε₀        (Gauss — electricity)'),
      H('div', null, '∇·B  =  0            (Gauss — magnetism)'),
      H('div', null, '∇×E  = −∂B/∂t        (Faraday)'),
      H('div', null, '∇×B  = μ₀J + μ₀ε₀∂E/∂t   (Ampère–Maxwell)'),
    ),
    H(
      'p',
      { class: 'mt-1 text-[9px] text-zinc-500' },
      'c = 1/√(μ₀ε₀) = 299,792,458 m/s · ε₀ = 8.854×10⁻¹² F/m · μ₀ = 4π×10⁻⁷ N/A²',
    ),
  )

  return H(
    'div',
    { class: 'flex min-h-dvh flex-col bg-[#070a10] text-zinc-200' },
    // Header
    H(
      'header',
      {
        class:
          'sticky top-0 z-30 flex h-14 shrink-0 flex-wrap items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur',
      },
      H(
        'a',
        {
          href: './index.html',
          class:
            'rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
        },
        '← Periodic table',
      ),
      H(
        'div',
        { class: 'flex items-center gap-2' },
        ElementaLogo({ size: 26 }),
        H(
          'h1',
          { class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100' },
          H('span', { class: 'text-cyan-400' }, 'EM'),
          ' LAB',
        ),
      ),
      H(
        'span',
        { class: 'hidden font-mono text-[10px] text-zinc-500 lg:inline' },
        'Maxwell’s equations · E & B fields · Lorentz force · EM waves',
      ),
      GitHubLink(),
    ),

    // Main grid
    H(
      'main',
      {
        class:
          'mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-6',
      },
      // Left: 3D visualization
      H(
        'div',
        { class: 'flex flex-col h-[700px] lg:h-[820px]' },
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-2 flex-1 relative' },
          H('elementa-em-field', {
            'data-preset': state.preset,
            'data-charge': state.charge,
            'data-current': state.current,
            'data-loops': state.loops,
            'data-radius': state.radius,
            'data-frequency': state.frequency,
            'data-e0': state.e0,
            'data-particle-q': state.particleQ,
            'data-particle-m': state.particleM,
            'data-particle-vx': state.particleV0.x,
            'data-particle-vy': state.particleV0.y,
            'data-particle-vz': state.particleV0.z,
            'data-time': state.time,
            'data-scale': state.scale,
            style: 'width: 100%; height: 100%; display: block;',
          }),
          H(
            'div',
            {
              class:
                'pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 font-mono text-[9.5px] text-zinc-500',
            },
            H('span', { class: 'flex items-center gap-1' },
              H('span', { class: 'inline-block h-2 w-2 rounded-full bg-cyan-400' }),
              'E field'),
            H('span', { class: 'flex items-center gap-1' },
              H('span', { class: 'inline-block h-2 w-2 rounded-full bg-rose-300' }),
              'B field'),
            H('span', { class: 'flex items-center gap-1' },
              H('span', { class: 'inline-block h-2 w-2 rounded-full bg-red-400' }),
              'particle'),
          ),
        ),
        H(
          'div',
          { class: 'mt-2 flex items-center gap-2' },
          toggle('Animate', 'animate', () => state.playing, (v) => {
            if (v) startClock()
            else stopClock()
          }),
          H(
            'button',
            {
              type: 'button',
              onclick: () => { state.time = 0; syncUrl() },
              class: 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400 transition hover:text-zinc-200',
            },
            'Reset t',
          ),
          H(
            'button',
            {
              type: 'button',
              onclick: () => {
                state.scale = state.scale === 1.0 ? 1.5 : 1.0
                syncUrl()
              },
              class: 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400 transition hover:text-zinc-200',
            },
            `scale ×${state.scale}`,
          ),
        ),
      ),
      // Right: controls
      H(
        'div',
        { class: 'space-y-3' },
        // Preset selector
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          H(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Field preset',
          ),
          H(
            'div',
            { class: 'space-y-1' },
            ...Object.entries(presetLabels).map(([key, label]) =>
              H(
                'button',
                {
                  type: 'button',
                  onclick: () => { state.preset = key as any; state.time = 0; syncUrl() },
                  class: `w-full text-left rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${
                    state.preset === key
                      ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                      : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                  }`,
                },
                label,
              ),
            ),
          ),
          H(
            'p',
            { class: 'mt-2 text-[9px] leading-relaxed text-zinc-600' },
            presetDescr[state.preset],
          ),
        ),

        // Field parameters
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          H(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Field parameters',
          ),
          H(
            'div',
            { class: 'space-y-2' },
            isElectro
              ? slider('Charge q', 'charge', -5, 5, 0.25, () => state.charge, (v) => { state.charge = v }, (v) => `${v.toFixed(2)} C`)
              : null,
            isMagneto
              ? slider('Current I', 'current', -10, 10, 0.5, () => state.current, (v) => { state.current = v }, (v) => `${v.toFixed(1)} A`)
              : null,
            isMagneto
              ? slider('Loops N', 'loops', 1, 6, 1, () => state.loops, (v) => { state.loops = v }, (v) => `${Math.round(v)}`)
              : null,
            isMagneto
              ? slider('Radius R', 'radius', 0.3, 3, 0.1, () => state.radius, (v) => { state.radius = v }, (v) => `${v.toFixed(1)} m`)
              : null,
            isWave
              ? slider('Frequency f', 'frequency', 0.5, 30, 0.5, () => state.frequency, (v) => { state.frequency = v }, (v) => `${v.toFixed(1)} Hz`)
              : null,
            isWave
              ? slider('Amplitude E₀', 'e0', 0.1, 5, 0.1, () => state.e0, (v) => { state.e0 = v }, (v) => `${v.toFixed(1)} V/m`)
              : null,
          ),
        ),

        // Particle parameters (Lorentz)
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          H(
            'h2',
            { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
            'Lorentz particle',
          ),
          H(
            'p',
            { class: 'text-[9px] text-zinc-600 mb-2' },
            'F = q(E + v × B) — E along y, B along z',
          ),
          isLorentz
            ? H(
                'div',
                { class: 'space-y-2' },
                slider('Charge q', 'particleQ', -3, 3, 0.25, () => state.particleQ, (v) => { state.particleQ = v }, (v) => `${v.toFixed(2)} C`),
                slider('Mass m', 'particleM', 0.1, 5, 0.1, () => state.particleM, (v) => { state.particleM = v }, (v) => `${v.toFixed(1)} kg`),
                slider('vₓ', 'particle-vx', -3, 3, 0.25, () => state.particleV0.x, (v) => { state.particleV0.x = v }),
                slider('v_y', 'particle-vy', -3, 3, 0.25, () => state.particleV0.y, (v) => { state.particleV0.y = v }),
                slider('v_z', 'particle-vz', -3, 3, 0.25, () => state.particleV0.z, (v) => { state.particleV0.z = v }),
              )
            : H('p', { class: 'text-[9px] text-zinc-500 italic' }, 'Select “Lorentz Force” preset'),
        ),

        maxwellEqs,
      ),
    ),
  )
}
