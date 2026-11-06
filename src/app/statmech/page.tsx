/**
 * ELEMENTA — Statistical Mechanics & Phase Transitions Lab
 * Page Component: /statmech
 *
 * Interactive laboratory for statistical mechanics and critical phenomena:
 *   - 2D Square-Lattice Ising Model on Torus Topology (L = 128, N = 16,384 spins)
 *   - Ultra-fast Metropolis–Hastings Monte Carlo with zero-allocation Boltzmann tables
 *   - Lars Onsager (1944) Exact Analytical Phase Transition Solution
 *   - Real-time Phase Transition Plot M(T) comparing Onsager Exact vs Mean-Field vs Simulation
 *   - Dynamic Magnetic Hysteresis Loop Tracking (h, m)
 *   - Interactive Spin Domain Brushing & Seeding
 */

import { h, reactive, type VNode } from 'nexus-framework'
import '@/components/statmech/ising-element'
import type {
  ElementaIsingElement,
  IsingTheme,
} from '@/components/statmech/ising-element'
import {
  getExactTc,
  getOnsagerExactMagnetization,
  getMeanFieldMagnetization,
  type HysteresisPoint,
} from '@/lib/statmech'
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
  preset: 'curie',
  temperature: 2.269185,
  field: 0.0,
  coupling: 1.0,
  sweepsPerFrame: 5,
  paused: false,
  theme: 'amber-navy' as IsingTheme,
  autoSweepField: false,
  autoSweepDir: 1,

  // Live Observables
  m: 0.0,
  absM: 0.0,
  e: -1.414,
  cv: 0.0,
  chi: 0.0,
  staggeredM: 0.0,
  sweepsPerSec: 0,
  fps: 60,
  sweepsCount: 0,
  isAnnealing: false,

  // Hysteresis History
  hysteresisHistory: [] as HysteresisPoint[],

  // UI state
  theoryExpanded: false,
})

function getIsingElement(): ElementaIsingElement | null {
  return typeof document !== 'undefined'
    ? (document.querySelector('elementa-ising') as ElementaIsingElement | null)
    : null
}

function applyPreset(key: string): void {
  state.preset = key
  const el = getIsingElement()

  if (key === 'curie') {
    state.temperature = 2.269185
    state.field = 0.0
    state.coupling = 1.0
    state.autoSweepField = false
    el?.resetRandom()
  } else if (key === 'cold-ferro') {
    state.temperature = 0.5
    state.field = 0.0
    state.coupling = 1.0
    state.autoSweepField = false
    el?.alignUp()
  } else if (key === 'high-t-disorder') {
    state.temperature = 4.0
    state.field = 0.0
    state.coupling = 1.0
    state.autoSweepField = false
    el?.resetRandom()
  } else if (key === 'hysteresis') {
    state.temperature = 1.5
    state.field = -1.5
    state.coupling = 1.0
    state.autoSweepField = true
    state.autoSweepDir = 1
    el?.alignDown()
  } else if (key === 'antiferro') {
    state.temperature = 1.5
    state.field = 0.0
    state.coupling = -1.0
    state.autoSweepField = false
    el?.checkerboard()
  } else if (key === 'domain-wall') {
    state.temperature = 1.8
    state.field = 0.0
    state.coupling = 1.0
    state.autoSweepField = false
    el?.domainWall()
  }
}

// Auto-sweep timer for hysteresis demonstration
let autoSweepInterval: number | null = null
function startAutoSweepTimer(): void {
  if (typeof window === 'undefined' || autoSweepInterval != null) return
  autoSweepInterval = window.setInterval(() => {
    if (!state.autoSweepField || state.paused) return
    const step = 0.04 * state.autoSweepDir
    let nextH = state.field + step
    if (nextH > 1.8) {
      nextH = 1.8
      state.autoSweepDir = -1
    } else if (nextH < -1.8) {
      nextH = -1.8
      state.autoSweepDir = 1
    }
    state.field = Math.round(nextH * 100) / 100
  }, 100)
}
startAutoSweepTimer()

export default function StatMechPage(): VNode {
  const Tc = getExactTc(state.coupling)

  // Status computation for HUD pill
  let statusText = 'Critical Fluctuations Active'
  let statusColor = 'border-amber-500/40 bg-amber-500/10 text-amber-300'

  if (state.coupling < 0 && Math.abs(state.staggeredM) > 0.5) {
    statusText = 'Antiferromagnetic Néel Order (Checkerboard)'
    statusColor = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
  } else if (Math.abs(state.temperature - Tc) < 0.12 && Math.abs(state.field) < 0.1) {
    statusText = 'Critical Fluctuations (Scale Invariant Clusters)'
    statusColor = 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  } else if (state.temperature < Tc && state.absM > 0.6) {
    statusText = 'Spontaneous Ferromagnetic Symmetry Broken'
    statusColor = 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300'
  } else if (state.temperature > Tc) {
    statusText = 'Paramagnetic High-T Disorder'
    statusColor = 'border-blue-400/40 bg-blue-400/10 text-blue-300'
  } else {
    statusText = 'Metastable Domain Coarsening'
    statusColor = 'border-purple-400/40 bg-purple-400/10 text-purple-300'
  }

  // Precompute Onsager and Mean-Field curves for Phase Transition SVG plot
  const plotPointsCount = 60
  const maxPlotT = 4.5
  const onsagerPathData: string[] = []
  const meanFieldPathData: string[] = []

  for (let i = 0; i <= plotPointsCount; i++) {
    const tVal = 0.05 + (i / plotPointsCount) * (maxPlotT - 0.05)
    // Scale T to plot width: x ∈ [45, 335]
    const x = 45 + ((tVal - 0.05) / (maxPlotT - 0.05)) * 290

    // Onsager M(T)
    const mOns = getOnsagerExactMagnetization(tVal, Math.abs(state.coupling))
    // Scale M ∈ [0, 1] to plot height: y ∈ [160, 20]
    const yOns = 160 - mOns * 140
    onsagerPathData.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yOns.toFixed(1)}`)

    // Mean Field M(T)
    const mMF = getMeanFieldMagnetization(tVal, Math.abs(state.coupling))
    const yMF = 160 - mMF * 140
    meanFieldPathData.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yMF.toFixed(1)}`)
  }

  // Live simulation point on Phase Transition plot
  const liveX = Math.min(
    335,
    Math.max(45, 45 + ((state.temperature - 0.05) / (maxPlotT - 0.05)) * 290),
  )
  const liveY = Math.min(160, Math.max(20, 160 - state.absM * 140))
  const tcX = Math.min(
    335,
    Math.max(45, 45 + ((Tc - 0.05) / (maxPlotT - 0.05)) * 290),
  )

  // Hysteresis trajectory SVG path
  let hysteresisPath = ''
  if (state.hysteresisHistory.length > 1) {
    hysteresisPath = state.hysteresisHistory
      .map((pt, i) => {
        // Map h ∈ [-2.0, 2.0] to x ∈ [45, 335]
        const x = 45 + ((pt.h + 2.0) / 4.0) * 290
        // Map m ∈ [-1.0, 1.0] to y ∈ [160, 20]
        const y = 90 - pt.m * 70
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }
  const liveHystX = Math.min(335, Math.max(45, 45 + ((state.field + 2.0) / 4.0) * 290))
  const liveHystY = Math.min(160, Math.max(20, 90 - state.m * 70))

  return H(
    'div',
    { class: 'flex min-h-screen flex-col bg-[#070a10] text-zinc-200' },

    // Header Bar
    H(
      'header',
      {
        class:
          'flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#090d16] px-4 gap-3',
      },
      H(
        'div',
        { class: 'flex items-center gap-3 min-w-0' },
        ElementaLogo(),
        H('span', { class: 'text-zinc-600 font-mono text-[12px]' }, '/'),
        H(
          'h1',
          { class: 'text-[13px] font-semibold text-zinc-200 whitespace-nowrap' },
          'Statistical Mechanics & Phase Transitions Lab',
        ),
        H(
          'span',
          {
            class:
              'hidden sm:inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9.5px] font-mono font-medium text-amber-300',
          },
          '2D Ising · Onsager 1944 · Monte Carlo',
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
            href: './bec.html',
            class:
              'shrink-0 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-400/20 transition',
          },
          'BEC lab',
        ),
        H(
          'a',
          {
            href: './particle.html',
            class:
              'shrink-0 rounded-md border border-indigo-400/40 bg-indigo-400/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-400/20 transition',
          },
          'Particle lab',
        ),
        GitHubLink(),
      ),
    ),

    // Main 3-Column Layout
    H(
      'div',
      { class: 'flex flex-1 flex-col lg:flex-row min-h-0 overflow-y-auto' },

      // Left Sidebar: Presets & Controls
      H(
        'aside',
        {
          class:
            'w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#080c14] p-4 flex flex-col gap-4 overflow-y-auto',
        },

        // Presets Group
        H(
          'div',
          { class: 'space-y-2' },
          H(
            'div',
            { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Physical Regimes & Presets',
          ),
          H(
            'div',
            { class: 'grid grid-cols-2 gap-1.5' },
            [
              { id: 'curie', label: 'Curie Critical Point', sub: 'T = 2.269 (Fractals)' },
              { id: 'cold-ferro', label: 'Cold Ferromagnet', sub: 'T = 0.5 (Broken Symmetry)' },
              { id: 'high-t-disorder', label: 'Supercritical T', sub: 'T = 4.0 (Paramagnet)' },
              { id: 'hysteresis', label: 'Hysteresis Loop', sub: 'T = 1.5 (Field Sweep)' },
              { id: 'antiferro', label: 'Antiferromagnet', sub: 'J = -1.0 (Néel Order)' },
              { id: 'domain-wall', label: 'Domain Wall', sub: 'Coarsening Relaxation' },
            ].map((p) =>
              H(
                'button',
                {
                  key: p.id,
                  type: 'button',
                  onclick: () => applyPreset(p.id),
                  class: `rounded-lg border p-2 text-left transition ${
                    state.preset === p.id
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                      : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]'
                  }`,
                },
                H('div', { class: 'text-[11px] font-semibold leading-tight' }, p.label),
                H('div', { class: 'text-[9px] text-zinc-400 mt-0.5 font-mono' }, p.sub),
              ),
            ),
          ),
        ),

        // Sliders Group
        H(
          'div',
          { class: 'space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3' },
          H(
            'div',
            { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Hamiltonian Parameters',
          ),

          // Temperature Slider with Quick Snap to Tc
          H(
            'div',
            { class: 'space-y-1' },
            H(
              'div',
              { class: 'flex items-center justify-between text-[11px]' },
              H('span', { class: 'text-zinc-300' }, 'Temperature (T)'),
              H(
                'div',
                { class: 'flex items-center gap-1.5' },
                H('span', { class: 'font-mono text-amber-300' }, state.temperature.toFixed(3)),
                H(
                  'button',
                  {
                    type: 'button',
                    onclick: () => {
                      state.temperature = 2.269185
                      state.coupling = 1.0
                    },
                    class:
                      'rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300 hover:bg-amber-500/30 transition',
                    title: 'Snap to Lars Onsager exact critical temperature',
                  },
                  'Snap Tc',
                ),
              ),
            ),
            H('input', {
              type: 'range',
              min: '0.1',
              max: '5.0',
              step: '0.01',
              value: String(state.temperature),
              oninput: (e: any) => {
                state.temperature = parseFloat(e.target.value)
              },
              class: 'w-full accent-amber-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer',
            }),
            H(
              'div',
              { class: 'flex justify-between text-[9px] font-mono text-zinc-500' },
              H('span', null, '0.1 (Cold)'),
              H('span', { class: 'text-amber-400/80' }, 'Tc ≈ 2.269'),
              H('span', null, '5.0 (Hot)'),
            ),
          ),

          // External Field h
          H(
            'div',
            { class: 'space-y-1' },
            H(
              'div',
              { class: 'flex items-center justify-between text-[11px]' },
              H('span', { class: 'text-zinc-300' }, 'External Field (h)'),
              H(
                'div',
                { class: 'flex items-center gap-1' },
                H('span', { class: 'font-mono text-cyan-300' }, state.field.toFixed(2)),
                H(
                  'button',
                  {
                    type: 'button',
                    onclick: () => {
                      state.field = 0.0
                    },
                    class:
                      'rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300 hover:bg-white/20 transition',
                  },
                  'h=0',
                ),
              ),
            ),
            H('input', {
              type: 'range',
              min: '-2.0',
              max: '2.0',
              step: '0.05',
              value: String(state.field),
              oninput: (e: any) => {
                state.field = parseFloat(e.target.value)
              },
              class: 'w-full accent-cyan-400 h-1.5 bg-zinc-700 rounded-lg cursor-pointer',
            }),
          ),

          // Coupling Constant J
          H(
            'div',
            { class: 'space-y-1' },
            H(
              'div',
              { class: 'flex items-center justify-between text-[11px]' },
              H('span', { class: 'text-zinc-300' }, 'Coupling (J)'),
              H(
                'span',
                {
                  class: `font-mono ${
                    state.coupling > 0
                      ? 'text-amber-300'
                      : state.coupling < 0
                        ? 'text-emerald-300'
                        : 'text-zinc-400'
                  }`,
                },
                state.coupling > 0
                  ? `+${state.coupling.toFixed(2)} (Ferro)`
                  : state.coupling < 0
                    ? `${state.coupling.toFixed(2)} (Anti)`
                    : '0.0 (Idle)',
              ),
            ),
            H('input', {
              type: 'range',
              min: '-1.0',
              max: '1.0',
              step: '0.05',
              value: String(state.coupling),
              oninput: (e: any) => {
                state.coupling = parseFloat(e.target.value)
              },
              class: 'w-full accent-emerald-400 h-1.5 bg-zinc-700 rounded-lg cursor-pointer',
            }),
          ),

          // Monte Carlo Speed
          H(
            'div',
            { class: 'space-y-1' },
            H(
              'div',
              { class: 'flex items-center justify-between text-[11px]' },
              H('span', { class: 'text-zinc-300' }, 'Sweeps / Frame'),
              H('span', { class: 'font-mono text-zinc-400' }, `${state.sweepsPerFrame} MCS`),
            ),
            H('input', {
              type: 'range',
              min: '1',
              max: '20',
              step: '1',
              value: String(state.sweepsPerFrame),
              oninput: (e: any) => {
                state.sweepsPerFrame = parseInt(e.target.value, 10)
              },
              class: 'w-full accent-zinc-400 h-1.5 bg-zinc-700 rounded-lg cursor-pointer',
            }),
          ),
        ),

        // Color Theme Selector
        H(
          'div',
          { class: 'space-y-1.5' },
          H(
            'div',
            { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Spin Visualization Theme',
          ),
          H(
            'div',
            { class: 'grid grid-cols-2 gap-1.5' },
            [
              { id: 'amber-navy', label: 'Amber / Navy' },
              { id: 'cyan-dark', label: 'Cyan / Midnight' },
              { id: 'emerald-obsidian', label: 'Emerald / Dark' },
              { id: 'monochrome', label: 'Monochrome' },
            ].map((th) =>
              H(
                'button',
                {
                  key: th.id,
                  type: 'button',
                  onclick: () => {
                    state.theme = th.id as IsingTheme
                  },
                  class: `rounded-lg border px-2 py-1.5 text-[11px] font-medium transition ${
                    state.theme === th.id
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-zinc-200'
                  }`,
                },
                th.label,
              ),
            ),
          ),
        ),

        // Lattice Action Buttons
        H(
          'div',
          { class: 'space-y-1.5' },
          H(
            'div',
            { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Lattice Operations',
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
                class: `rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
                  state.paused
                    ? 'border-yellow-500/40 bg-yellow-500/20 text-yellow-300'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                }`,
              },
              state.paused ? '▶ Resume' : '⏸ Pause',
            ),
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  getIsingElement()?.resetRandom()
                },
                class:
                  'rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-white/10 transition',
              },
              '🎲 Randomize',
            ),
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  getIsingElement()?.alignUp()
                },
                class:
                  'rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-white/10 transition',
              },
              '⬆ All Up (+1)',
            ),
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  getIsingElement()?.alignDown()
                },
                class:
                  'rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-white/10 transition',
              },
              '⬇ All Down (-1)',
            ),
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  getIsingElement()?.checkerboard()
                },
                class:
                  'rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-white/10 transition',
              },
              '🏁 Checkerboard',
            ),
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  getIsingElement()?.anneal(5.0, 0.1)
                },
                class:
                  'rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition',
              },
              '❄ Anneal (5→0.1)',
            ),
          ),
        ),
      ),

      // Center Workspace: Ising Canvas & Theory Drawer
      H(
        'main',
        { class: 'flex flex-1 flex-col p-4 gap-4 min-w-0 min-h-0' },

        // Canvas Header HUD
        H(
          'div',
          {
            class:
              'flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#090d16] px-4 py-2.5',
          },
          H(
            'div',
            { class: 'flex items-center gap-2' },
            H(
              'span',
              {
                class: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium ${statusColor}`,
              },
              H('span', { class: 'h-1.5 w-1.5 rounded-full bg-current animate-pulse' }),
              statusText,
            ),
          ),
          H(
            'div',
            { class: 'flex items-center gap-3 text-[11px] font-mono text-zinc-400' },
            H('span', null, `Grid: 128×128 (16,384 spins)`),
            H('span', { class: 'text-zinc-600' }, '•'),
            H('span', null, `Topology: Torus T²`),
            H('span', { class: 'text-zinc-600' }, '•'),
            H(
              'span',
              { class: 'text-emerald-400 font-semibold' },
              `${state.sweepsPerSec.toLocaleString()} sweeps/s`,
            ),
          ),
        ),

        // Ising Custom Web Component Display
        H(
          'div',
          {
            class:
              'relative flex-1 min-h-[440px] rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl flex items-center justify-center p-2',
          },
          H('elementa-ising', {
            id: 'ising-canvas',
            temperature: String(state.temperature),
            field: String(state.field),
            coupling: String(state.coupling),
            sweepsperframe: String(state.sweepsPerFrame),
            paused: String(state.paused),
            theme: state.theme,
            onstatmechupdate: (e: CustomEvent) => {
              const d = e.detail
              if (!d) return
              state.m = d.m ?? 0
              state.absM = d.absM ?? 0
              state.e = d.e ?? 0
              state.cv = d.cv ?? 0
              state.chi = d.chi ?? 0
              state.staggeredM = d.staggeredM ?? 0
              state.sweepsPerSec = d.sweepsPerSec ?? 0
              state.fps = d.fps ?? 60
              state.sweepsCount = d.sweepsCount ?? 0
              state.isAnnealing = d.annealing ?? false
              if (d.hysteresisHistory) {
                state.hysteresisHistory = d.hysteresisHistory
              }
              // If simulated annealing updated temperature
              if (d.annealing && typeof d.temperature === 'number') {
                state.temperature = d.temperature
              }
            },
            style: 'width: 100%; height: 100%; max-width: 640px; aspect-ratio: 1; display: block;',
          }),

          // Domain Seeding Tooltip Overlay
          H(
            'div',
            {
              class:
                'pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/70 px-3 py-1 font-mono text-[9px] text-zinc-400 backdrop-blur shadow-lg',
            },
            '💡 Left-Click + Drag: seed Up (+1) · Right-Click / Shift+Click: seed Down (-1)',
          ),
        ),

        // Collapsible Physics Theory & Mathematical Foundations Panel
        H(
          'div',
          {
            class:
              'rounded-xl border border-white/10 bg-[#090d16] p-3 text-[11px] leading-relaxed',
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
              '📖 Physics Foundations: Lars Onsager 1944 Solution & Universality Class',
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
                { class: 'mt-3 space-y-3 pt-3 border-t border-white/10 text-zinc-300' },
                H(
                  'p',
                  null,
                  H('strong', { class: 'text-zinc-100' }, 'Lars Onsager Exact Solution (1944): '),
                  'The 2D square-lattice Ising model in zero magnetic field was solved analytically by Lars Onsager using the transfer matrix method and Lie algebra of spinors. It was the first rigorous demonstration that statistical mechanics can produce a genuine continuous phase transition with non-analytic thermodynamic singularities.',
                ),
                H(
                  'div',
                  { class: 'grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[10px]' },
                  H(
                    'div',
                    { class: 'p-2.5 rounded-lg border border-white/10 bg-white/[0.02]' },
                    H('div', { class: 'text-amber-300 font-bold' }, 'Critical Temperature & Kramers–Wannier Duality'),
                    H('div', { class: 'text-zinc-400 mt-1' }, 'sinh(2β_c J) = 1'),
                    H('div', { class: 'text-zinc-200 mt-0.5' }, 'T_c = 2J / ln(1 + √2) ≈ 2.269185 J/k_B'),
                    H('div', { class: 'text-zinc-500 mt-1 text-[9.5px]' }, 'Relates high-temperature disorder to low-temperature domain walls on the dual square lattice.'),
                  ),
                  H(
                    'div',
                    { class: 'p-2.5 rounded-lg border border-white/10 bg-white/[0.02]' },
                    H('div', { class: 'text-cyan-300 font-bold' }, 'Spontaneous Magnetization (Yang 1952)'),
                    H('div', { class: 'text-zinc-200 mt-1' }, 'M(T) = [ 1 - sinh⁻⁴(2J/T) ]¹/⁸   (T < T_c)'),
                    H('div', { class: 'text-zinc-400 mt-0.5' }, 'M(T) = 0   (T ≥ T_c)'),
                    H('div', { class: 'text-zinc-500 mt-1 text-[9.5px]' }, 'Critical exponent β = 1/8 = 0.125 (contrasting mean-field β = 1/2).'),
                  ),
                ),
                H(
                  'div',
                  { class: 'rounded-lg border border-white/10 bg-white/[0.02] p-2.5 font-mono text-[10px]' },
                  H('div', { class: 'text-zinc-200 font-bold' }, '2D Ising Universality Class Critical Exponents:'),
                  H(
                    'div',
                    { class: 'grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5 text-zinc-400' },
                    H('div', null, 'Order Param: β = 1/8'),
                    H('div', null, 'Correlation: ν = 1'),
                    H('div', null, 'Susceptibility: γ = 7/4'),
                    H('div', null, 'Specific Heat: α = 0 (log div)'),
                  ),
                  H(
                    'div',
                    { class: 'mt-1.5 text-zinc-500 text-[9px]' },
                    'Hyperscaling 2 - α = dν (with d = 2) is satisfied identically (2 - 0 = 2 × 1).',
                  ),
                ),
              )
            : null,
        ),
      ),

      // Right Panel: Observables & Analytical Plots
      H(
        'aside',
        {
          class:
            'w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#080c14] p-4 flex flex-col gap-4 overflow-y-auto',
        },

        // Observables Grid
        H(
          'div',
          { class: 'space-y-2' },
          H(
            'div',
            { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' },
            'Live Thermodynamic Observables',
          ),
          H(
            'div',
            { class: 'grid grid-cols-2 gap-2' },
            StatCard({
              label: 'Magnetization ⟨m⟩',
              value: state.m.toFixed(4),
              sublabel: `|m| = ${state.absM.toFixed(4)}`,
              tint: state.m >= 0 ? '#fbbf24' : '#60a5fa',
            }),
            StatCard({
              label: 'Energy / Spin ⟨e⟩',
              value: state.e.toFixed(4),
              sublabel: `Total H = ${(state.e * 16384).toFixed(0)}`,
              tint: '#f43f5e',
            }),
            StatCard({
              label: 'Specific Heat Cv',
              value: state.cv.toFixed(2),
              sublabel: 'N/T² (⟨e²⟩ - ⟨e⟩²)',
              tint: '#a78bfa',
            }),
            StatCard({
              label: 'Susceptibility χ',
              value: state.chi.toFixed(1),
              sublabel: 'N/T (⟨m²⟩ - ⟨|m|⟩²)',
              tint: '#34d399',
            }),
          ),
        ),

        // Phase Transition Plot M(T)
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#090d16] p-3 space-y-2' },
          H(
            'div',
            { class: 'flex items-center justify-between' },
            H('span', { class: 'text-[11px] font-bold text-zinc-100' }, 'Phase Transition Curve M(T)'),
            H(
              'span',
              { class: 'text-[9.5px] font-mono text-zinc-400' },
              `Tc = ${Tc.toFixed(3)}`,
            ),
          ),
          H(
            'div',
            { class: 'relative h-44 w-full bg-black/40 rounded-lg border border-white/5 overflow-hidden' },
            H(
              'svg',
              {
                viewBox: '0 0 350 180',
                class: 'w-full h-full block select-none',
              },
              // Background Grid
              H('line', { x1: '45', y1: '20', x2: '45', y2: '160', stroke: 'rgba(255,255,255,0.15)', 'stroke-width': '1' }),
              H('line', { x1: '45', y1: '160', x2: '335', y2: '160', stroke: 'rgba(255,255,255,0.15)', 'stroke-width': '1' }),
              H('line', { x1: '45', y1: '90', x2: '335', y2: '90', stroke: 'rgba(255,255,255,0.06)', 'stroke-dasharray': '2 2' }),
              H('line', { x1: '45', y1: '20', x2: '335', y2: '20', stroke: 'rgba(255,255,255,0.06)', 'stroke-dasharray': '2 2' }),

              // Tc Vertical Line
              H('line', {
                x1: String(tcX),
                y1: '20',
                x2: String(tcX),
                y2: '160',
                stroke: '#f59e0b',
                'stroke-width': '1',
                'stroke-dasharray': '3 3',
              }),
              H('text', { x: String(tcX + 3), y: '30', fill: '#fbbf24', 'font-size': '8', 'font-family': 'monospace' }, 'Tc'),

              // Mean-Field Curve (Zinc dotted)
              H('path', {
                d: meanFieldPathData.join(' '),
                fill: 'none',
                stroke: '#71717a',
                'stroke-width': '1.5',
                'stroke-dasharray': '3 3',
              }),

              // Onsager Exact Curve (Cyan dashed)
              H('path', {
                d: onsagerPathData.join(' '),
                fill: 'none',
                stroke: '#22d3ee',
                'stroke-width': '2',
              }),

              // Current Live Point
              H('circle', {
                cx: String(liveX),
                cy: String(liveY),
                r: '5',
                fill: '#fbbf24',
                stroke: '#ffffff',
                'stroke-width': '1.5',
              }),

              // Axis Labels
              H('text', { x: '12', y: '25', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '1.0'),
              H('text', { x: '12', y: '93', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '0.5'),
              H('text', { x: '12', y: '163', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '0.0'),
              H('text', { x: '45', y: '174', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '0'),
              H('text', { x: '180', y: '174', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '2.5'),
              H('text', { x: '320', y: '174', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '4.5 T'),
            ),
          ),
          // Legend
          H(
            'div',
            { class: 'flex items-center justify-between text-[9.5px] font-mono text-zinc-400 pt-1' },
            H('span', { class: 'text-cyan-400' }, '— Onsager Exact (1944)'),
            H('span', { class: 'text-zinc-500' }, '··· Mean-Field'),
            H('span', { class: 'text-amber-300' }, '● Live Simulation'),
          ),
        ),

        // Magnetic Hysteresis Loop Plot
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#090d16] p-3 space-y-2' },
          H(
            'div',
            { class: 'flex items-center justify-between' },
            H('span', { class: 'text-[11px] font-bold text-zinc-100' }, 'Hysteresis Loop (h vs m)'),
            H(
              'button',
              {
                type: 'button',
                onclick: () => {
                  state.autoSweepField = !state.autoSweepField
                },
                class: `rounded px-2 py-0.5 text-[9.5px] font-mono font-medium transition ${
                  state.autoSweepField
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`,
              },
              state.autoSweepField ? 'Auto-Sweep: ON' : 'Auto-Sweep: OFF',
            ),
          ),
          H(
            'div',
            { class: 'relative h-44 w-full bg-black/40 rounded-lg border border-white/5 overflow-hidden' },
            H(
              'svg',
              {
                viewBox: '0 0 350 180',
                class: 'w-full h-full block select-none',
              },
              // Center axes
              H('line', { x1: '45', y1: '90', x2: '335', y2: '90', stroke: 'rgba(255,255,255,0.2)', 'stroke-width': '1' }),
              H('line', { x1: '190', y1: '20', x2: '190', y2: '160', stroke: 'rgba(255,255,255,0.2)', 'stroke-width': '1' }),
              H('line', { x1: '45', y1: '20', x2: '335', y2: '20', stroke: 'rgba(255,255,255,0.06)', 'stroke-dasharray': '2 2' }),
              H('line', { x1: '45', y1: '160', x2: '335', y2: '160', stroke: 'rgba(255,255,255,0.06)', 'stroke-dasharray': '2 2' }),

              // Trajectory path
              hysteresisPath
                ? H('path', {
                    d: hysteresisPath,
                    fill: 'none',
                    stroke: '#38bdf8',
                    'stroke-width': '1.5',
                    'stroke-opacity': '0.7',
                  })
                : null,

              // Current Point
              H('circle', {
                cx: String(liveHystX),
                cy: String(liveHystY),
                r: '5',
                fill: '#38bdf8',
                stroke: '#ffffff',
                'stroke-width': '1.5',
              }),

              // Labels
              H('text', { x: '193', y: '28', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '+1 m'),
              H('text', { x: '193', y: '158', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '-1 m'),
              H('text', { x: '45', y: '86', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '-2.0 h'),
              H('text', { x: '305', y: '86', fill: '#a1a1aa', 'font-size': '8', 'font-family': 'monospace' }, '+2.0 h'),
            ),
          ),
          H(
            'div',
            { class: 'flex items-center justify-between text-[9.5px] font-mono text-zinc-400 pt-1' },
            H('span', null, `Field h = ${state.field.toFixed(2)}`),
            H('span', { class: 'text-cyan-300' }, `m = ${state.m.toFixed(3)}`),
          ),
        ),
      ),
    ),
  )
}
