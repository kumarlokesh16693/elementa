/**
 * ELEMENTA — 2D Bose–Einstein Condensate & Quantum Vortex Lab
 * Page Component: /bec
 *
 * Interactive laboratory for macroscopic quantum phenomena:
 *   - 2D Gross–Pitaevskii Equation solved via Split-Step Fourier Method
 *   - Dynamic vortex nucleation, lattice formation, and quantized circulation
 *   - Real-time macroscopic observables (Norm, Energy, <L_z>, Healing Length ξ)
 */

import { h, reactive, type VNode } from 'nexus-framework'
import '@/components/bec/bec-element'
import type { ElementaBecElement } from '@/components/bec/bec-element'
import type { BecViewMode } from '@/components/bec/bec-element'
import type { TrapType } from '@/lib/bec'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

function StatCard({
  label,
  value,
  sublabel,
  tint,
}: {
  label: string
  value: string
  sublabel?: string
  tint?: string
}): VNode {
  return H(
    'div',
    { class: 'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2' },
    H('div', { class: 'text-[9.5px] uppercase tracking-wider text-zinc-400' }, label),
    H(
      'div',
      {
        class: 'mt-0.5 font-mono text-[13px] font-semibold tracking-tight',
        style: { color: tint ?? '#f4f4f5' },
      },
      value,
    ),
    sublabel
      ? H('div', { class: 'text-[9px] text-zinc-500 font-mono mt-0.5' }, sublabel)
      : null,
  )
}

const state = reactive({
  preset: 'ground',
  mode: 'combined' as BecViewMode,
  g: 5.0,
  omega: 0.0,
  trap: 'harmonic' as TrapType,
  speed: 2,
  paused: false,

  // Observables
  norm: 1.0,
  energy: 0.0,
  lz: 0.0,
  healingLength: 0.0,
  vortexCount: 0,
  peakDensity: 0.0,
  mu: 0.0,
  simTime: 0.0,
  stepsPerSec: 300,
  fps: 60,
  stirring: false,

  // UI
  theoryExpanded: false,
})

function getBecElement(): ElementaBecElement | null {
  return typeof document !== 'undefined'
    ? (document.querySelector('elementa-bec') as ElementaBecElement | null)
    : null
}

function applyPreset(presetKey: string): void {
  state.preset = presetKey
  if (presetKey === 'ground') {
    state.g = 5.0
    state.omega = 0.0
    state.trap = 'harmonic'
  } else if (presetKey === 'vortex-lattice') {
    state.g = 10.0
    state.omega = 0.7
    state.trap = 'harmonic'
  } else if (presetKey === 'double-well') {
    state.g = 5.0
    state.omega = 0.0
    state.trap = 'double-well'
  } else if (presetKey === 'ring') {
    state.g = 5.0
    state.omega = 0.3
    state.trap = 'ring'
  } else if (presetKey === 'giant-vortex') {
    state.g = 15.0
    state.omega = 0.85
    state.trap = 'toroidal'
  }

  const el = getBecElement()
  if (el) {
    el.reset(presetKey)
  }
}

export default function BecPage(): VNode {
  return H(
    'div',
    {
      class: 'flex h-dvh flex-col bg-[#070a10] text-zinc-200 select-none overflow-hidden font-sans',
    },
    // Top Navigation Header
    H(
      'header',
      {
        class:
          'flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur z-20',
      },
      H(
        'div',
        { class: 'flex items-center gap-2.5 shrink-0' },
        ElementaLogo({ size: 28 }),
        H(
          'a',
          {
            href: './index.html',
            class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100 hover:text-amber-400 transition',
          },
          'ELEM',
          H('span', { class: 'text-amber-400' }, 'E'),
          'NTA',
        ),
        H('span', { class: 'text-zinc-600 font-mono text-[12px]' }, '/'),
        H(
          'h1',
          { class: 'text-[13px] font-semibold text-zinc-200 whitespace-nowrap' },
          'BEC & Quantum Vortex Lab',
        ),
        H(
          'span',
          {
            class:
              'hidden sm:inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[9.5px] font-mono font-medium text-cyan-300',
          },
          '2D GPE · SSFM',
        ),
      ),
      H(
        'div',
        { class: 'ml-auto flex items-center gap-2 overflow-x-auto min-w-0 py-1' },
        H(
          'a',
          {
            href: './index.html',
            class:
              'shrink-0 rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition',
          },
          '← Periodic Table',
        ),
        H(
          'a',
          {
            href: './quantumwave.html',
            class:
              'shrink-0 rounded-md border border-fuchsia-400/40 bg-fuchsia-400/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-300 hover:bg-fuchsia-400/20 transition',
          },
          'Quantum wave lab',
        ),
        H(
          'a',
          {
            href: './bands.html',
            class:
              'shrink-0 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-400/20 transition',
          },
          'Band theory lab',
        ),
        GitHubLink(),
      ),
    ),

    // Main 3-Column Workspace
    H(
      'div',
      { class: 'flex flex-1 min-h-0 overflow-hidden' },

      // Left Controls Sidebar (280px)
      H(
        'aside',
        {
          class:
            'w-[280px] shrink-0 border-r border-white/10 bg-[#090d16] p-3.5 overflow-y-auto space-y-4 custom-scrollbar text-[11px]',
        },

        // 1. Presets Selector
        H(
          'div',
          { class: 'space-y-1.5' },
          H(
            'div',
            { class: 'flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Presets',
            H('span', { class: 'text-[9px] text-zinc-500 font-mono font-normal' }, 'Pick state'),
          ),
          H(
            'div',
            { class: 'grid grid-cols-1 gap-1' },
            [
              { key: 'ground', label: 'Ground State', sub: 'g=5, Ω=0' },
              {
                key: 'vortex-lattice',
                label: 'Vortex Lattice',
                sub: 'g=10, Ω=0.7 · Abrikosov',
                highlight: true,
              },
              { key: 'double-well', label: 'Double Well', sub: 'Josephson tunnel' },
              { key: 'ring', label: 'Ring Trap', sub: 'Persistent current' },
              { key: 'giant-vortex', label: 'Giant Vortex', sub: 'g=15, Ω=0.85' },
            ].map((p) =>
              H(
                'button',
                {
                  key: p.key,
                  type: 'button',
                  onclick: () => applyPreset(p.key),
                  class: `flex items-baseline justify-between rounded-md border px-2.5 py-1.5 text-left transition ${
                    state.preset === p.key
                      ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200 font-medium'
                      : p.highlight
                        ? 'border-amber-400/30 bg-amber-400/[0.06] text-amber-200 hover:bg-amber-400/10'
                        : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                  }`,
                },
                H('span', null, p.label),
                H('span', { class: 'text-[9px] font-mono text-zinc-500' }, p.sub),
              ),
            ),
          ),
        ),

        // 2. Visualization Mode
        H(
          'div',
          { class: 'space-y-1.5' },
          H(
            'div',
            { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Visual Mode',
          ),
          H(
            'div',
            { class: 'grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/30 p-0.5' },
            (['combined', 'density', 'phase'] as BecViewMode[]).map((m) =>
              H(
                'button',
                {
                  key: m,
                  type: 'button',
                  onclick: () => {
                    state.mode = m
                    const el = getBecElement()
                    if (el) el.setViewMode(m)
                  },
                  class: `rounded py-1 text-center text-[10.5px] font-medium capitalize transition ${
                    state.mode === m
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`,
                },
                m,
              ),
            ),
          ),
        ),

        // 3. Physical Parameters Sliders
        H(
          'div',
          { class: 'space-y-3 pt-1 border-t border-white/5' },
          H(
            'div',
            { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Physical Parameters',
          ),

          // g: Interaction strength
          H(
            'div',
            { class: 'space-y-1' },
            H(
              'div',
              { class: 'flex justify-between font-mono text-[10px]' },
              H('span', { class: 'text-zinc-400' }, 'Interaction (g)'),
              H('span', { class: 'font-semibold text-cyan-300' }, state.g.toFixed(1)),
            ),
            H('input', {
              type: 'range',
              min: '0',
              max: '20',
              step: '0.5',
              value: String(state.g),
              oninput: (e: Event) => {
                state.g = parseFloat((e.target as HTMLInputElement).value)
              },
              class: 'w-full accent-cyan-400 cursor-pointer',
            }),
            H(
              'div',
              { class: 'text-[9px] text-zinc-500 leading-tight' },
              's-wave scattering: repulsive g > 0 expands condensate',
            ),
          ),

          // Ω: Rotation frequency
          H(
            'div',
            { class: 'space-y-1' },
            H(
              'div',
              { class: 'flex justify-between font-mono text-[10px]' },
              H('span', { class: 'text-zinc-400' }, 'Rotation (Ω/ω)'),
              H('span', { class: 'font-semibold text-amber-300' }, `${state.omega.toFixed(2)} ω_trap`),
            ),
            H('input', {
              type: 'range',
              min: '0.0',
              max: '0.90',
              step: '0.01',
              value: String(state.omega),
              oninput: (e: Event) => {
                state.omega = parseFloat((e.target as HTMLInputElement).value)
              },
              class: 'w-full accent-amber-400 cursor-pointer',
            }),
            H(
              'div',
              { class: 'text-[9px] text-zinc-500 leading-tight' },
              'Exceeds critical Ω_c to nucleate quantized vortex lattices',
            ),
          ),

          // Simulation Speed
          H(
            'div',
            { class: 'space-y-1' },
            H(
              'div',
              { class: 'flex justify-between font-mono text-[10px]' },
              H('span', { class: 'text-zinc-400' }, 'Speed'),
              H('span', { class: 'font-semibold text-zinc-200' }, `${state.speed} steps/frame`),
            ),
            H('input', {
              type: 'range',
              min: '1',
              max: '20',
              step: '1',
              value: String(state.speed),
              oninput: (e: Event) => {
                state.speed = parseInt((e.target as HTMLInputElement).value, 10)
              },
              class: 'w-full accent-zinc-400 cursor-pointer',
            }),
          ),
        ),

        // 4. Confining Trap Selector
        H(
          'div',
          { class: 'space-y-1.5 pt-1 border-t border-white/5' },
          H(
            'div',
            { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Trap Potential V(r)',
          ),
          H(
            'div',
            { class: 'grid grid-cols-2 gap-1' },
            (['harmonic', 'double-well', 'ring', 'toroidal'] as TrapType[]).map((t) =>
              H(
                'button',
                {
                  key: t,
                  type: 'button',
                  onclick: () => {
                    state.trap = t
                    const el = getBecElement()
                    if (el) el.reset()
                  },
                  class: `rounded border px-2 py-1 text-center capitalize text-[10px] font-medium transition ${
                    state.trap === t
                      ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200'
                      : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-zinc-200'
                  }`,
                },
                t.replace('-', ' '),
              ),
            ),
          ),
        ),

        // 5. Actions & Experiment Tools
        H(
          'div',
          { class: 'space-y-1.5 pt-1 border-t border-white/5' },
          H(
            'div',
            { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Actions',
          ),
          H(
            'div',
            { class: 'grid grid-cols-2 gap-1.5' },
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  state.paused = !state.paused
                },
                class: `rounded-md border px-2.5 py-1.5 text-center font-medium transition ${
                  state.paused
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/15 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]'
                }`,
              },
              state.paused ? '▶ Resume' : '⏸ Pause',
            ),
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  const el = getBecElement()
                  if (el) {
                    el.stir(200)
                    state.stirring = true
                  }
                },
                class:
                  'rounded-md border border-amber-400/40 bg-amber-400/15 px-2.5 py-1.5 text-center font-medium text-amber-300 hover:bg-amber-400/25 transition shadow-sm',
                title: 'Stir with a transient rotation pulse to nucleate vortices',
              },
              '⚡ Stir!',
            ),
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  const el = getBecElement()
                  if (el) el.addVortexAt(0, 0, 1)
                },
                class:
                  'rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1.5 text-center font-medium text-cyan-300 hover:bg-cyan-400/20 transition',
              },
              '+ Vortex (+1)',
            ),
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  const el = getBecElement()
                  if (el) el.addVortexAt(0, 0, -1)
                },
                class:
                  'rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-1.5 text-center font-medium text-rose-300 hover:bg-rose-400/20 transition',
              },
              '− Vortex (-1)',
            ),
          ),
          H(
            'button',
            {
              type: 'button',
              onclick: () => {
                const el = getBecElement()
                if (el) el.reset(state.preset)
              },
              class:
                'w-full rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-center text-[10.5px] font-medium text-zinc-300 hover:bg-white/[0.07] transition mt-1',
            },
            '↺ Reset Ground State',
          ),
        ),
      ),

      // Center Canvas Workspace (flex-1)
      H(
        'main',
        { class: 'flex-1 flex flex-col min-w-0 p-3 overflow-y-auto space-y-3' },

        // Canvas Wrapper
        H(
          'div',
          {
            class:
              'relative flex-1 min-h-[460px] rounded-xl border border-white/10 bg-[#0a0f18] overflow-hidden flex items-center justify-center shadow-2xl',
          },
          H('elementa-bec', {
            id: 'bec-canvas',
            mode: state.mode,
            g: String(state.g),
            omega: String(state.omega),
            trap: state.trap,
            speed: String(state.speed),
            paused: String(state.paused),
            onbecupdate: (e: CustomEvent) => {
              const detail = e.detail
              if (!detail) return
              const obs = detail.observables
              if (obs) {
                state.norm = obs.norm
                state.energy = obs.energy
                state.lz = obs.Lz
                state.healingLength = obs.healingLength
                state.vortexCount = obs.vortexCount
                state.peakDensity = obs.peakDensity
                state.mu = obs.mu
              }
              state.simTime = detail.time ?? 0
              state.stepsPerSec = detail.stepsPerSec ?? 0
              state.fps = detail.fps ?? 60
              state.stirring = detail.stirring ?? false
            },
            style: 'width: 100%; height: 100%; display: block;',
          }),

          // Interactive tooltip pill
          H(
            'div',
            {
              class:
                'pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[9px] text-zinc-400 backdrop-blur',
            },
            '💡 Click canvas to imprint vortex · Shift+Click for anti-vortex',
          ),
        ),

        // Collapsible Physics Theory & Mathematical Foundations Panel
        H(
          'div',
          {
            class: 'rounded-xl border border-white/10 bg-[#0a0f18]/80 p-3 text-[11px] leading-relaxed',
          },
          H(
            'div',
            {
              class: 'flex items-center justify-between cursor-pointer select-none',
              onclick: () => {
                state.theoryExpanded = !state.theoryExpanded
              },
            },
            H(
              'span',
              { class: 'font-semibold text-zinc-200 flex items-center gap-1.5' },
              '📖 Physics Foundations: 2D Gross–Pitaevskii Equation & Quantum Vortices',
            ),
            H(
              'span',
              { class: 'text-zinc-500 font-mono text-[10px]' },
              state.theoryExpanded ? 'Hide ▲' : 'Expand ▼',
            ),
          ),
          state.theoryExpanded
            ? H(
                'div',
                { class: 'mt-3 space-y-3 border-t border-white/10 pt-3 text-zinc-300' },
                H(
                  'div',
                  { class: 'grid grid-cols-1 md:grid-cols-2 gap-3' },
                  H(
                    'div',
                    { class: 'space-y-1.5' },
                    H(
                      'div',
                      { class: 'font-mono text-cyan-300 text-[10.5px] font-semibold' },
                      '1. The Gross–Pitaevskii Equation (GPE)',
                    ),
                    H(
                      'p',
                      { class: 'text-zinc-400 text-[10.5px]' },
                      'At ultracold temperatures, macroscopic Bose condensation is governed by the mean-field Gross–Pitaevskii non-linear Schrödinger equation:',
                    ),
                    H(
                      'div',
                      {
                        class:
                          'rounded bg-black/40 p-2 font-mono text-[10px] text-zinc-200 border border-white/5',
                      },
                      'iħ ∂ψ/∂t = [ -ħ²/(2m) ∇² + V(r) + g|ψ|² - Ω L_z ] ψ',
                    ),
                    H(
                      'p',
                      { class: 'text-zinc-400 text-[10.5px]' },
                      'Where g = 4πħ²a_s/m measures contact interaction. For repulsive bosons (g > 0), the non-linearity stabilizes localized density depressions known as quantized vortices.',
                    ),
                  ),
                  H(
                    'div',
                    { class: 'space-y-1.5' },
                    H(
                      'div',
                      { class: 'font-mono text-amber-300 text-[10.5px] font-semibold' },
                      '2. Healing Length & Critical Rotation Ω_c',
                    ),
                    H(
                      'p',
                      { class: 'text-zinc-400 text-[10.5px]' },
                      'The vortex core radius is dictated by the healing length ξ, the distance over which kinetic pressure balances interaction energy:',
                    ),
                    H(
                      'div',
                      {
                        class:
                          'rounded bg-black/40 p-2 font-mono text-[10px] text-zinc-200 border border-white/5',
                      },
                      'ξ = ħ / √(2m g n₀) ≈ 1 / √(g n₀)',
                    ),
                    H(
                      'p',
                      { class: 'text-zinc-400 text-[10.5px]' },
                      'According to the Fetter–Svidzinsky formula, rotating the trap beyond critical frequency Ω_c nucleates vortices energetically:',
                    ),
                    H(
                      'div',
                      {
                        class:
                          'rounded bg-black/40 p-2 font-mono text-[10px] text-amber-200 border border-white/5',
                      },
                      'Ω_c ≈ [ 5ħ / (2m R²) ] · ln(R / ξ)',
                    ),
                  ),
                ),
                H(
                  'div',
                  { class: 'border-t border-white/5 pt-2 flex flex-wrap gap-4 text-[10px] text-zinc-400' },
                  H(
                    'div',
                    null,
                    H('span', { class: 'text-zinc-500 font-semibold' }, 'Circulation: '),
                    '∮ v_s · dr = (h/m) q, with integer topological charge q ∈ ℤ.',
                  ),
                  H(
                    'div',
                    null,
                    H('span', { class: 'text-zinc-500 font-semibold' }, 'Algorithm: '),
                    'Split-Step Fourier Method (SSFM) with second-order Strang operator splitting and 2D FFT.',
                  ),
                ),
              )
            : null,
        ),
      ),

      // Right Stats Sidebar (210px)
      H(
        'aside',
        {
          class:
            'w-[210px] shrink-0 border-l border-white/10 bg-[#090d16] p-3 space-y-2.5 overflow-y-auto custom-scrollbar',
        },
        H(
          'div',
          { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
          'Observables',
        ),

        StatCard({
          label: 'Discrete Norm ||ψ||²',
          value: state.norm.toFixed(4),
          sublabel: 'Conserved = 1.000',
          tint: Math.abs(state.norm - 1.0) < 0.05 ? '#34d399' : '#f87171',
        }),

        StatCard({
          label: 'Total Energy E',
          value: `${state.energy.toFixed(3)} nat`,
          sublabel: 'E_kin + E_pot + E_int',
          tint: '#38bdf8',
        }),

        StatCard({
          label: 'Angular Momentum ⟨L_z⟩',
          value: `${state.lz.toFixed(3)} ħ`,
          sublabel: 'Rotational circulation',
          tint: Math.abs(state.lz) > 0.05 ? '#fbbf24' : '#e4e4e7',
        }),

        StatCard({
          label: 'Healing Length ξ',
          value:
            state.healingLength > 0
              ? `${state.healingLength.toFixed(3)} a_ho`
              : '∞',
          sublabel: 'Core size = 1/√(gn₀)',
          tint: '#a78bfa',
        }),

        StatCard({
          label: 'Detected Vortices',
          value: String(state.vortexCount),
          sublabel: 'Topological charge Σ q',
          tint: state.vortexCount > 0 ? '#22d3ee' : '#a1a1aa',
        }),

        StatCard({
          label: 'Chemical Potential μ',
          value: `${state.mu.toFixed(3)} nat`,
          sublabel: '∂E/∂N ground energy',
          tint: '#e4e4e7',
        }),

        StatCard({
          label: 'Simulation Time t',
          value: `${state.simTime.toFixed(1)} ω⁻¹`,
          sublabel: `dt = 0.005`,
          tint: '#e4e4e7',
        }),

        H(
          'div',
          { class: 'pt-2 border-t border-white/5 space-y-1.5' },
          H(
            'div',
            { class: 'text-[9.5px] font-semibold uppercase tracking-wider text-zinc-500' },
            'Engine Health',
          ),
          H(
            'div',
            { class: 'flex justify-between font-mono text-[10px] text-zinc-400' },
            H('span', null, 'Throughput:'),
            H('span', { class: 'text-zinc-200' }, `${state.stepsPerSec} steps/s`),
          ),
          H(
            'div',
            { class: 'flex justify-between font-mono text-[10px] text-zinc-400' },
            H('span', null, 'Render:'),
            H('span', { class: 'text-zinc-200' }, `${state.fps} FPS`),
          ),
          H(
            'div',
            { class: 'flex justify-between font-mono text-[10px] text-zinc-400' },
            H('span', null, 'Grid:'),
            H('span', { class: 'text-zinc-200' }, '128 × 128'),
          ),
          H(
            'div',
            { class: 'flex justify-between font-mono text-[10px] text-zinc-400' },
            H('span', null, 'Domain:'),
            H('span', { class: 'text-zinc-200' }, '[-8, +8]² a_ho'),
          ),
        ),
      ),
    ),
  ) as VNode
}
