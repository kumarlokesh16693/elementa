/**
 * Radiation Shielding, Particle Stopping Power & Dosimetry Simulator
 *
 * Implemented using pure nexus-framework h() virtual DOM and reactive state.
 * Interfaces with <elementa-shielding-modal> Custom Element.
 *
 * Zero third-party UI libraries, 100% native nexus-framework.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import {
  SHIELDING_MATERIALS,
  RADIATION_PRESETS,
  calculateGammaAttenuation,
  evaluateShielding,
  generateBraggPeak,
  calculateDose,
  type ShieldingMaterial,
  type RadiationSource,
} from '@/lib/periodic/shielding'
import { type Nuclide } from '@/lib/periodic/nuclides'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export type ShieldingTab = 'attenuation' | 'bragg' | 'gamma_physics' | 'alara'

export interface ShieldingState {
  activeTab: ShieldingTab
  selectedSourceId: string
  selectedMaterialId: string
  thicknessCm: number
  distanceMeters: number
  exposureHours: number
  braggEnergyMev: number
}

export const shieldingState = reactive<ShieldingState>({
  activeTab: 'attenuation',
  selectedSourceId: 'cs137',
  selectedMaterialId: 'lead',
  thicknessCm: 2.5,
  distanceMeters: 1.0,
  exposureHours: 1.0,
  braggEnergyMev: 5.486,
})

export function initShieldingState(nuclide?: Nuclide | null): void {
  shieldingState.activeTab = 'attenuation'
  shieldingState.selectedMaterialId = 'lead'
  shieldingState.thicknessCm = 2.5
  shieldingState.distanceMeters = 1.0
  shieldingState.exposureHours = 1.0

  if (nuclide) {
    if (nuclide.z === 27) shieldingState.selectedSourceId = 'co60'
    else if (nuclide.z === 55) shieldingState.selectedSourceId = 'cs137'
    else if (nuclide.z === 95) shieldingState.selectedSourceId = 'am241'
    else if (nuclide.z === 38) shieldingState.selectedSourceId = 'sr90'
    else if (nuclide.z === 98) shieldingState.selectedSourceId = 'cf252'
    else if (nuclide.z === 9) shieldingState.selectedSourceId = 'f18'
    else if (nuclide.z === 53) shieldingState.selectedSourceId = 'i131'
    else shieldingState.selectedSourceId = 'cs137'
  }
}

export function ShieldingSimulatorNexus({
  initialNuclide: _initialNuclide,
  onClose,
  onSelectNuclide: _onSelectNuclide,
}: {
  initialNuclide?: Nuclide | null
  onClose: () => void
  onSelectNuclide?: (nu: Nuclide) => void
}): VNode {
  const state = shieldingState
  const currentSource: RadiationSource =
    RADIATION_PRESETS.find((s) => s.id === state.selectedSourceId) ?? RADIATION_PRESETS[0]
  const currentMaterial: ShieldingMaterial =
    SHIELDING_MATERIALS[state.selectedMaterialId] ?? SHIELDING_MATERIALS.lead

  const attRes = evaluateShielding(currentSource, currentMaterial, state.thicknessCm)
  const doseRes = calculateDose(
    currentSource,
    attRes.attenuationFraction,
    state.distanceMeters,
    state.exposureHours,
  )

  return H(
    'div',
    {
      class:
        'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md',
    },
    H(
      'div',
      {
        class:
          'flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0a0f18] shadow-2xl',
        role: 'dialog',
        'aria-label': 'Radiation Shielding & Attenuation Simulator',
      },

      // Header Bar
      H(
        'div',
        {
          class:
            'flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0d1322] px-4 py-3',
        },
        H(
          'div',
          { class: 'flex items-center gap-3' },
          H(
            'span',
            {
              class:
                'flex h-7 w-7 items-center justify-center rounded-md border border-cyan-400/40 bg-cyan-400/10 font-mono text-[14px] font-bold text-cyan-300',
            },
            '🛡️',
          ),
          H(
            'div',
            null,
            H(
              'h2',
              { class: 'text-[14px] font-bold tracking-wider text-zinc-100' },
              'RADIATION SHIELDING & PARTICLE ATTENUATION LAB',
            ),
            H(
              'p',
              { class: 'font-mono text-[10px] text-zinc-500' },
              'Beer-Lambert attenuation · Bragg peak ionization · Bremsstrahlung yield · HVL/TVL · ALARA dosimetry',
            ),
          ),
        ),
        H(
          'button',
          {
            type: 'button',
            onClick: onClose,
            class:
              'rounded-md border border-white/10 px-2.5 py-1 font-mono text-[11px] text-zinc-400 transition hover:border-white/30 hover:text-white',
          },
          '✕ Close',
        ),
      ),

      // Tab Ribbon
      H(
        'div',
        { class: 'flex shrink-0 border-b border-white/10 bg-[#080c14] px-4' },
        H(
          'button',
          {
            type: 'button',
            onClick: () => {
              state.activeTab = 'attenuation'
            },
            class: `border-b-2 px-4 py-2 font-mono text-[11px] font-medium transition ${
              state.activeTab === 'attenuation'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '📡 Attenuation & Ray Penetration',
        ),
        H(
          'button',
          {
            type: 'button',
            onClick: () => {
              state.activeTab = 'bragg'
            },
            class: `border-b-2 px-4 py-2 font-mono text-[11px] font-medium transition ${
              state.activeTab === 'bragg'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '🎯 Bragg Peak & Stopping Power (dE/dx)',
        ),
        H(
          'button',
          {
            type: 'button',
            onClick: () => {
              state.activeTab = 'gamma_physics'
            },
            class: `border-b-2 px-4 py-2 font-mono text-[11px] font-medium transition ${
              state.activeTab === 'gamma_physics'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '⚛️ Gamma Cross-Sections (τ, σ_c, κ)',
        ),
        H(
          'button',
          {
            type: 'button',
            onClick: () => {
              state.activeTab = 'alara'
            },
            class: `border-b-2 px-4 py-2 font-mono text-[11px] font-medium transition ${
              state.activeTab === 'alara'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '📏 HVL / TVL & ALARA Safety',
        ),
      ),

      // Modal Body
      H(
        'div',
        { class: 'min-h-0 flex-1 overflow-y-auto p-4 space-y-4 text-zinc-200' },
        state.activeTab === 'attenuation'
          ? renderAttenuationTab(state, currentSource, currentMaterial, attRes, doseRes)
          : state.activeTab === 'bragg'
          ? renderBraggTab(state, currentMaterial)
          : state.activeTab === 'gamma_physics'
          ? renderGammaPhysicsTab(currentMaterial)
          : renderAlaraTab(state, currentSource),
      ),
    ),
  )
}

function renderAttenuationTab(
  state: ShieldingState,
  source: RadiationSource,
  material: ShieldingMaterial,
  attRes: ReturnType<typeof evaluateShielding>,
  doseRes: ReturnType<typeof calculateDose>,
): VNode {
  return H(
    'div',
    { class: 'space-y-4' },

    // Selection Ribbon: Source and Material Pickers
    H(
      'div',
      { class: 'grid grid-cols-1 gap-3 sm:grid-cols-2' },

      // Radionuclide Source Picker
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#070b13] p-3' },
        H(
          'div',
          { class: 'mb-2 flex items-center justify-between font-mono text-[11px] text-zinc-400' },
          H('span', { class: 'font-bold uppercase text-zinc-300' }, 'Radiation Source'),
          H(
            'span',
            { class: 'rounded bg-white/5 px-2 py-0.5 text-[10px] text-amber-300' },
            `${source.type.toUpperCase()} · ${source.primaryEnergyMev} MeV`,
          ),
        ),
        H(
          'div',
          { class: 'flex flex-wrap gap-1.5' },
          ...RADIATION_PRESETS.map((s) => {
            const isSelected = s.id === state.selectedSourceId
            return H(
              'button',
              {
                type: 'button',
                onClick: () => {
                  state.selectedSourceId = s.id
                },
                class: `rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm ring-1 ring-amber-300'
                    : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08]'
                }`,
              },
              s.nuclide,
            )
          }),
        ),
      ),

      // Shielding Material Picker
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#070b13] p-3' },
        H(
          'div',
          { class: 'mb-2 flex items-center justify-between font-mono text-[11px] text-zinc-400' },
          H('span', { class: 'font-bold uppercase text-zinc-300' }, 'Shielding Material'),
          H(
            'span',
            { class: 'rounded bg-white/5 px-2 py-0.5 text-[10px] text-cyan-300' },
            `ρ = ${material.density} g/cm³ · Z_eff = ${material.effectiveZ}`,
          ),
        ),
        H(
          'div',
          { class: 'flex flex-wrap gap-1.5' },
          ...Object.values(SHIELDING_MATERIALS).map((m) => {
            const isSelected = m.id === state.selectedMaterialId
            return H(
              'button',
              {
                type: 'button',
                onClick: () => {
                  state.selectedMaterialId = m.id
                },
                class: `rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-cyan-400 text-zinc-950 font-bold shadow-sm ring-1 ring-cyan-300'
                    : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08]'
                }`,
              },
              m.name,
            )
          }),
        ),
      ),
    ),

    // Animated Ray Penetration SVG Canvas
    H(
      'div',
      { class: 'rounded-xl border border-white/10 bg-[#060911] p-4' },
      H(
        'div',
        { class: 'mb-2 flex items-center justify-between font-mono text-[11px] text-zinc-400' },
        H('span', { class: 'font-semibold text-zinc-200' }, 'Interactive Particle Penetration Profile'),
        H(
          'span',
          { class: 'text-zinc-500' },
          `Dominant interaction: ${attRes.dominantMechanism}`,
        ),
      ),
      renderPenetrationSvg(source, material, state.thicknessCm, attRes),
    ),

    // Sliders: Thickness, Distance & Exposure
    H(
      'div',
      { class: 'grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#0d1322] p-4 font-mono text-xs sm:grid-cols-3' },
      H(
        'div',
        { class: 'flex flex-col gap-1' },
        H('div', { class: 'flex justify-between text-zinc-400' },
          H('span', null, 'Shield Thickness:'),
          H('span', { class: 'font-bold text-cyan-300' }, `${state.thicknessCm.toFixed(1)} cm`),
        ),
        H('input', {
          type: 'range',
          min: '0.0',
          max: '20.0',
          step: '0.2',
          value: String(state.thicknessCm),
          onInput: (e: Event) => {
            state.thicknessCm = parseFloat((e.target as HTMLInputElement).value)
          },
          class: 'h-1.5 w-full cursor-pointer accent-cyan-400',
        }),
        H('span', { class: 'text-[10px] text-zinc-500' }, `${(state.thicknessCm * 10).toFixed(0)} mm`),
      ),
      H(
        'div',
        { class: 'flex flex-col gap-1' },
        H('div', { class: 'flex justify-between text-zinc-400' },
          H('span', null, 'Observer Distance:'),
          H('span', { class: 'font-bold text-amber-300' }, `${state.distanceMeters.toFixed(1)} m`),
        ),
        H('input', {
          type: 'range',
          min: '0.2',
          max: '8.0',
          step: '0.1',
          value: String(state.distanceMeters),
          onInput: (e: Event) => {
            state.distanceMeters = parseFloat((e.target as HTMLInputElement).value)
          },
          class: 'h-1.5 w-full cursor-pointer accent-amber-400',
        }),
        H('span', { class: 'text-[10px] text-zinc-500' }, 'Inverse-square 1/d² scaling'),
      ),
      H(
        'div',
        { class: 'flex flex-col gap-1' },
        H('div', { class: 'flex justify-between text-zinc-400' },
          H('span', null, 'Exposure Duration:'),
          H('span', { class: 'font-bold text-emerald-300' }, `${state.exposureHours.toFixed(1)} h`),
        ),
        H('input', {
          type: 'range',
          min: '0.1',
          max: '12.0',
          step: '0.1',
          value: String(state.exposureHours),
          onInput: (e: Event) => {
            state.exposureHours = parseFloat((e.target as HTMLInputElement).value)
          },
          class: 'h-1.5 w-full cursor-pointer accent-emerald-400',
        }),
        H('span', { class: 'text-[10px] text-zinc-500' }, 'Cumulative dose integration'),
      ),
    ),

    // Attenuation & Dosimetry Stat Cards
    H(
      'div',
      { class: 'grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs' },
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#070b13] p-3' },
        H('div', { class: 'text-[10px] uppercase text-zinc-500' }, 'Transmitted Flux'),
        H(
          'div',
          { class: 'mt-1 text-base font-bold text-cyan-300' },
          `${(attRes.attenuationFraction * 100).toFixed(2)}%`,
        ),
        H('div', { class: 'text-[9.5px] text-zinc-400' }, `${attRes.percentShielded.toFixed(2)}% blocked`),
      ),
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#070b13] p-3' },
        H('div', { class: 'text-[10px] uppercase text-zinc-500' }, 'Attenuation Coeff (μ)'),
        H(
          'div',
          { class: 'mt-1 text-base font-bold text-amber-300' },
          `${attRes.linearAttenuationCoeff.toFixed(3)} cm⁻¹`,
        ),
        H('div', { class: 'text-[9.5px] text-zinc-400' }, `μ/ρ = ${attRes.massAttenuationCoeff.toFixed(3)} cm²/g`),
      ),
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#070b13] p-3' },
        H('div', { class: 'text-[10px] uppercase text-zinc-500' }, 'HVL & TVL (cm)'),
        H(
          'div',
          { class: 'mt-1 text-base font-bold text-emerald-300' },
          `${attRes.hvlCm.toFixed(2)} / ${attRes.tvlCm.toFixed(2)}`,
        ),
        H('div', { class: 'text-[9.5px] text-zinc-400' }, 'Half / Tenth value layers'),
      ),
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#070b13] p-3' },
        H('div', { class: 'text-[10px] uppercase text-zinc-500' }, 'Actual Dose Rate'),
        H(
          'div',
          { class: 'mt-1 text-base font-bold text-purple-300' },
          doseRes.actualDoseRateMicroSvH >= 1000
            ? `${(doseRes.actualDoseRateMicroSvH / 1000).toFixed(2)} mSv/h`
            : `${doseRes.actualDoseRateMicroSvH.toFixed(2)} µSv/h`,
        ),
        H(
          'div',
          { class: 'text-[9.5px] text-zinc-400' },
          `Total: ${(doseRes.totalDoseMicroSv / 1000).toFixed(3)} mSv`,
        ),
      ),
    ),
  )
}

function renderPenetrationSvg(
  source: RadiationSource,
  material: ShieldingMaterial,
  thicknessCm: number,
  attRes: ReturnType<typeof evaluateShielding>,
): VNode {
  const W = 800
  const H_PX = 180
  const blockX = 260
  // Thickness in cm mapped to visual width (max 20 cm => 240 px)
  const blockW = Math.min(260, Math.max(12, (thicknessCm / 20) * 240))
  const rayStartY = 30
  const numRays = 10

  const rayColor =
    source.type === 'alpha'
      ? '#ef4444'
      : source.type === 'beta'
      ? '#3b82f6'
      : source.type === 'gamma'
      ? '#eab308'
      : '#10b981'

  // Rays simulation
  const rays: VNode[] = []
  for (let i = 0; i < numRays; i++) {
    const y = rayStartY + i * 13
    const rayIdx = i

    // Attenuation determines how far through the block this ray penetrates
    const rayTransmitted = (rayIdx + 0.5) / numRays < attRes.attenuationFraction

    if (source.type === 'alpha') {
      // Alpha stops within first few pixels of block
      const stopX = thicknessCm > 0.05 ? blockX + 6 : W - 80
      rays.push(
        H('line', {
          key: `ray-${i}`,
          x1: 70,
          y1: y,
          x2: stopX,
          y2: y,
          stroke: rayColor,
          'stroke-width': '2.2',
          'stroke-linecap': 'round',
        }),
      )
    } else if (source.type === 'beta') {
      // Beta penetrates partly, stops or penetrates
      const stopX = rayTransmitted ? blockX + blockW + 180 : blockX + blockW * 0.45
      rays.push(
        H('line', {
          key: `ray-${i}`,
          x1: 70,
          y1: y,
          x2: stopX,
          y2: y,
          stroke: rayColor,
          'stroke-width': '1.8',
          'stroke-dasharray': rayTransmitted ? undefined : '4 3',
        }),
      )
    } else {
      // Gamma / Neutron: exponential penetration
      const stopX = rayTransmitted ? W - 60 : blockX + (rayIdx / numRays) * blockW
      rays.push(
        H('line', {
          key: `ray-${i}`,
          x1: 70,
          y1: y,
          x2: stopX,
          y2: y,
          stroke: rayColor,
          'stroke-width': rayTransmitted ? '2' : '1.2',
          opacity: rayTransmitted ? '0.9' : '0.3',
        }),
      )
    }
  }

  return H(
    'svg',
    {
      viewBox: `0 0 ${W} ${H_PX}`,
      class: 'h-auto w-full select-none rounded-lg border border-white/5 bg-[#030712]',
    },

    // Source Emitter Housing (Left)
    H('rect', { x: 20, y: 20, width: 45, height: 135, rx: 6, fill: '#1f2937', stroke: '#374151' }),
    H('circle', { cx: 42, cy: 87, r: 14, fill: '#fbbf24', opacity: 0.2 }),
    H('text', {
      x: 42,
      y: 92,
      'text-anchor': 'middle',
      fill: '#fbbf24',
      'font-size': '15',
    }, '☢'),
    H('text', {
      x: 42,
      y: 145,
      'text-anchor': 'middle',
      fill: '#9ca3af',
      'font-size': '8',
      'font-family': 'monospace',
    }, source.nuclide),

    // Shielding Slab Block (Center)
    thicknessCm > 0.1
      ? H('g', null,
          H('rect', {
            x: blockX,
            y: 15,
            width: blockW,
            height: 145,
            rx: 4,
            fill: material.color,
            opacity: '0.45',
            stroke: material.color,
            'stroke-width': '1.5',
          }),
          H('text', {
            x: blockX + blockW / 2,
            y: 92,
            'text-anchor': 'middle',
            fill: '#f3f4f6',
            'font-size': '10',
            'font-family': 'monospace',
            'font-weight': 'bold',
          }, material.name),
          H('text', {
            x: blockX + blockW / 2,
            y: 106,
            'text-anchor': 'middle',
            fill: '#d1d5db',
            'font-size': '8.5',
            'font-family': 'monospace',
          }, `${thicknessCm.toFixed(1)} cm`),
        )
      : null,

    // Detector / Observer (Right)
    H('rect', { x: W - 50, y: 20, width: 35, height: 135, rx: 5, fill: '#111827', stroke: '#374151' }),
    H('text', {
      x: W - 32,
      y: 80,
      'text-anchor': 'middle',
      fill: '#38bdf8',
      'font-size': '9',
      'font-family': 'monospace',
    }, 'DETECTOR'),
    H('text', {
      x: W - 32,
      y: 100,
      'text-anchor': 'middle',
      fill: attRes.attenuationFraction > 0.1 ? '#ef4444' : '#10b981',
      'font-size': '9',
      'font-family': 'monospace',
      'font-weight': 'bold',
    }, `${(attRes.attenuationFraction * 100).toFixed(0)}%`),

    // Rays
    ...rays,
  )
}

function renderBraggTab(state: ShieldingState, material: ShieldingMaterial): VNode {
  const points = generateBraggPeak(state.braggEnergyMev, material, 90)
  const W = 760
  const H_PX = 230
  const PAD_L = 50
  const PAD_R = 30
  const PAD_T = 20
  const PAD_B = 35

  const maxDepth = Math.max(...points.map((p) => p.depthMm))
  const maxDedx = Math.max(...points.map((p) => p.stoppingPowerMevPerMm))

  let pathD = ''
  points.forEach((pt, i) => {
    const x = PAD_L + (pt.depthMm / maxDepth) * (W - PAD_L - PAD_R)
    const y = PAD_T + (1 - pt.stoppingPowerMevPerMm / maxDedx) * (H_PX - PAD_T - PAD_B)
    pathD += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  })

  return H(
    'div',
    { class: 'space-y-4' },
    H(
      'div',
      { class: 'rounded-xl border border-white/10 bg-[#070b13] p-4' },
      H(
        'div',
        { class: 'mb-3 flex flex-wrap items-center justify-between gap-2' },
        H(
          'div',
          null,
          H('h3', { class: 'font-mono text-xs font-semibold text-zinc-100 uppercase' }, 'Bragg Peak Stopping Power (dE/dx)'),
          H('p', { class: 'font-mono text-[10px] text-zinc-500' }, 'Localized terminal ionization spike of heavy charged particles. Sparing of healthy tissue before and after tumor in hadrontherapy.'),
        ),
        H(
          'div',
          { class: 'flex items-center gap-3 font-mono text-xs text-zinc-400' },
          H('span', null, `Kinetic Energy: ${state.braggEnergyMev.toFixed(2)} MeV`),
          H('input', {
            type: 'range',
            min: '2.0',
            max: '9.0',
            step: '0.2',
            value: String(state.braggEnergyMev),
            onInput: (e: Event) => {
              state.braggEnergyMev = parseFloat((e.target as HTMLInputElement).value)
            },
            class: 'h-1.5 w-28 cursor-pointer accent-cyan-400',
          }),
        ),
      ),

      H(
        'svg',
        {
          viewBox: `0 0 ${W} ${H_PX}`,
          class: 'h-auto w-full select-none rounded-lg border border-white/5 bg-[#030712]',
        },
        // Grid ticks
        [0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
          const y = PAD_T + (1 - frac) * (H_PX - PAD_T - PAD_B)
          return H('g', { key: `grid-${frac}` },
            H('line', { x1: PAD_L, y1: y, x2: W - PAD_R, y2: y, stroke: 'rgba(255,255,255,0.06)', 'stroke-dasharray': frac === 0 ? undefined : '3 3' }),
            H('text', { x: PAD_L - 6, y: y + 3, 'text-anchor': 'end', fill: '#71717a', 'font-size': '8', 'font-family': 'monospace' }, `${(frac * maxDedx).toFixed(0)}`),
          )
        }),
        [0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
          const x = PAD_L + frac * (W - PAD_L - PAD_R)
          return H('g', { key: `x-${frac}` },
            H('line', { x1: x, y1: PAD_T, x2: x, y2: H_PX - PAD_B, stroke: 'rgba(255,255,255,0.05)' }),
            H('text', { x: x, y: H_PX - PAD_B + 14, 'text-anchor': 'middle', fill: '#71717a', 'font-size': '8.5', 'font-family': 'monospace' }, `${(frac * maxDepth).toFixed(2)} mm`),
          )
        }),
        // Curve
        H('path', {
          d: pathD,
          fill: 'none',
          stroke: '#06b6d4',
          'stroke-width': '2.4',
          'stroke-linejoin': 'round',
        }),
        // Bragg peak callout
        H('text', {
          x: W - PAD_R - 10,
          y: PAD_T + 15,
          'text-anchor': 'end',
          fill: '#06b6d4',
          'font-size': '9',
          'font-family': 'monospace',
          'font-weight': 'bold',
        }, '⚡ Bragg Peak Ionization Spike'),
        // Axis labels
        H('text', { x: W / 2, y: H_PX - 5, 'text-anchor': 'middle', fill: '#52525b', 'font-size': '8.5', 'font-family': 'monospace' }, 'Depth in Tissue (mm)'),
      ),
    ),
  )
}

function renderGammaPhysicsTab(material: ShieldingMaterial): VNode {
  const energies = [0.02, 0.04, 0.07, 0.1, 0.2, 0.4, 0.7, 1.0, 2.0, 4.0, 8.0, 15.0, 30.0]
  const data = energies.map((e) => ({
    e,
    ...calculateGammaAttenuation(e, material),
  }))

  return H(
    'div',
    { class: 'space-y-4' },
    H(
      'div',
      { class: 'rounded-xl border border-white/10 bg-[#070b13] p-4' },
      H('h3', { class: 'font-mono text-xs font-semibold text-zinc-100 uppercase' }, `Gamma Interaction Regimes for ${material.name}`),
      H('p', { class: 'mt-0.5 font-mono text-[10px] text-zinc-500' }, 'Decomposition of linear attenuation coefficient μ into Photoelectric (τ), Compton scattering (σ), and Pair Production (κ).'),

      H(
        'div',
        { class: 'mt-3 overflow-x-auto rounded-lg border border-white/10 bg-[#080c14]' },
        H(
          'table',
          { class: 'w-full text-left font-mono text-xs' },
          H(
            'thead',
            { class: 'bg-white/[0.03] text-[9.5px] uppercase tracking-wider text-zinc-500' },
            H('tr', null,
              H('th', { class: 'px-3 py-2' }, 'Energy (MeV)'),
              H('th', { class: 'px-3 py-2 text-cyan-300' }, 'Photoelectric τ (cm⁻¹)'),
              H('th', { class: 'px-3 py-2 text-amber-300' }, 'Compton σ (cm⁻¹)'),
              H('th', { class: 'px-3 py-2 text-emerald-300' }, 'Pair Prod κ (cm⁻¹)'),
              H('th', { class: 'px-3 py-2 text-white font-bold' }, 'Total μ (cm⁻¹)'),
              H('th', { class: 'px-3 py-2' }, 'Dominant Regime'),
            ),
          ),
          H(
            'tbody',
            { class: 'divide-y divide-white/5' },
            ...data.map((row) =>
              H('tr', { class: 'hover:bg-white/[0.02] transition' },
                H('td', { class: 'px-3 py-1.5 font-bold text-zinc-200' }, row.e >= 1 ? `${row.e.toFixed(1)} MeV` : `${(row.e * 1000).toFixed(0)} keV`),
                H('td', { class: 'px-3 py-1.5 text-cyan-400' }, row.muPhotoelectric.toFixed(3)),
                H('td', { class: 'px-3 py-1.5 text-amber-400' }, row.muCompton.toFixed(3)),
                H('td', { class: 'px-3 py-1.5 text-emerald-400' }, row.muPair.toFixed(3)),
                H('td', { class: 'px-3 py-1.5 font-bold text-zinc-100' }, row.muTotal.toFixed(3)),
                H('td', { class: 'px-3 py-1.5' },
                  H('span', {
                    class: `rounded px-1.5 py-0.5 text-[9.5px] font-semibold ${
                      row.dominant === 'Photoelectric'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                        : row.dominant === 'Compton Scattering'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`,
                  }, row.dominant),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  )
}

function renderAlaraTab(state: ShieldingState, source: RadiationSource): VNode {
  return H(
    'div',
    { class: 'space-y-4' },
    H(
      'div',
      { class: 'rounded-xl border border-white/10 bg-[#070b13] p-4 font-mono text-xs' },
      H('h3', { class: 'font-bold uppercase tracking-wider text-zinc-100' }, 'The Three Cardinal Principles of Radiation Protection (ALARA)'),
      H('p', { class: 'mt-0.5 text-[10px] text-zinc-500' }, 'As Low As Reasonably Achievable: Minimizing occupational and public radiological exposure.'),

      H(
        'div',
        { class: 'mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3' },
        H(
          'div',
          { class: 'rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3' },
          H('div', { class: 'font-bold text-cyan-300' }, '1. TIME (t)'),
          H('div', { class: 'mt-1 text-[11px] text-zinc-400 leading-relaxed' }, 'Dose is directly linear with time: Dose = Rate × t. Minimize time in field, pre-plan operations with mockups.'),
        ),
        H(
          'div',
          { class: 'rounded-lg border border-amber-500/30 bg-amber-500/5 p-3' },
          H('div', { class: 'font-bold text-amber-300' }, '2. DISTANCE (d)'),
          H('div', { class: 'mt-1 text-[11px] text-zinc-400 leading-relaxed' }, 'Dose obeys inverse-square law: 1/d². Doubling distance slashes dose rate by 75%. Use long-handled tongs and remote manipulators.'),
        ),
        H(
          'div',
          { class: 'rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3' },
          H('div', { class: 'font-bold text-emerald-300' }, '3. SHIELDING (x)'),
          H('div', { class: 'mt-1 text-[11px] text-zinc-400 leading-relaxed' }, 'Dose falls exponentially: e^(-μx). Use appropriate barrier: low-Z for betas, high-Z lead for gammas, hydrogenous for neutrons.'),
        ),
      ),

      H(
        'div',
        { class: 'mt-4 overflow-x-auto rounded-lg border border-white/10 bg-[#080c14]' },
        H(
          'table',
          { class: 'w-full text-left font-mono text-xs' },
          H(
            'thead',
            { class: 'bg-white/[0.03] text-[9.5px] uppercase tracking-wider text-zinc-500' },
            H('tr', null,
              H('th', { class: 'px-3 py-2' }, 'Shield Material'),
              H('th', { class: 'px-3 py-2' }, 'Density'),
              H('th', { class: 'px-3 py-2 text-cyan-300' }, 'HVL (Half-Value Layer)'),
              H('th', { class: 'px-3 py-2 text-amber-300' }, 'TVL (Tenth-Value Layer)'),
              H('th', { class: 'px-3 py-2 text-emerald-300' }, 'Key Advantage'),
            ),
          ),
          H(
            'tbody',
            { class: 'divide-y divide-white/5' },
            ...Object.values(SHIELDING_MATERIALS).map((m) => {
              const res = evaluateShielding(source, m, 1.0)
              return H('tr', { class: 'hover:bg-white/[0.02]' },
                H('td', { class: 'px-3 py-1.5 font-bold text-zinc-200' }, m.name),
                H('td', { class: 'px-3 py-1.5 text-zinc-400' }, `${m.density} g/cm³`),
                H('td', { class: 'px-3 py-1.5 text-cyan-400' }, `${res.hvlCm.toFixed(2)} cm`),
                H('td', { class: 'px-3 py-1.5 text-amber-400' }, `${res.tvlCm.toFixed(2)} cm`),
                H('td', { class: 'px-3 py-1.5 text-[10px] text-zinc-400' }, m.description.split('.')[0]),
              )
            }),
          ),
        ),
      ),
    ),
  )
}
