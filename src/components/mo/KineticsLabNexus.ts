/**
 * ============================================================================
 * CHEMICAL KINETICS & TRANSITION STATE LAB (NATIVE NEXUS COMPONENT)
 * ============================================================================
 * Implements:
 * 1. Arrhenius Law & Eyring Transition State Theory (TST)
 * 2. Potential Energy Surface Profile V(s) along Reaction Coordinate
 * 3. Maxwell-Boltzmann Collision Energy Distribution & Activation Tail
 * 4. 3D/2D Molecular Transition State Collision & Walden Inversion
 * 5. Dynamic Integrated Concentration Rate Laws [A](t) & [P](t)
 * 6. Catalytic Activation Barrier Lowering
 * ============================================================================
 */

import { h, reactive, type VNode } from 'nexus-framework'
import {
  calculateArrheniusRate,
  calculateEyringParameters,
  evaluateReactionProfile,
  fractionExceedingActivation,
  KINETICS_PRESETS,
  maxwellBoltzmannEnergyDensity,
  type ReactionPreset,
  solveConcentrationDynamics,
} from '@/lib/periodic/kinetics'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export type KineticsViewTab = 'potential' | 'distribution' | 'dynamics'

interface KineticsState {
  presetId: string
  temperatureK: number
  reactionCoord: number // -1.0 (reactants) to +1.0 (products)
  isCatalyzed: boolean
  isPlaying: boolean
  activeView: KineticsViewTab
  initialConcentration: number // M
}

export const kineticsState = reactive<KineticsState>({
  presetId: 'sn2-walden',
  temperatureK: 298.15,
  reactionCoord: -0.7,
  isCatalyzed: false,
  isPlaying: false,
  activeView: 'potential',
  initialConcentration: 1.0,
})

export function initKineticsState(presetId?: string): void {
  const targetId = presetId ?? 'sn2-walden'
  const preset = KINETICS_PRESETS.find((p) => p.id === targetId) ?? KINETICS_PRESETS[0]
  kineticsState.presetId = preset.id
  kineticsState.temperatureK = preset.defaultTemperatureK
  kineticsState.reactionCoord = -0.7
  kineticsState.isCatalyzed = false
  kineticsState.isPlaying = false
  kineticsState.activeView = 'potential'
}

export function KineticsLabNexus(): VNode {
  const preset =
    KINETICS_PRESETS.find((p) => p.id === kineticsState.presetId) ?? KINETICS_PRESETS[0]

  const activeEa =
    kineticsState.isCatalyzed && preset.eaCatalyzedKjMol != null
      ? preset.eaCatalyzedKjMol
      : preset.eaKjMol

  // Arrhenius & Eyring calculations
  const rateK = calculateArrheniusRate(preset.frequencyFactorA, activeEa, kineticsState.temperatureK)
  const uncatalyzedK = calculateArrheniusRate(
    preset.frequencyFactorA,
    preset.eaKjMol,
    kineticsState.temperatureK,
  )
  const speedupRatio = rateK / (uncatalyzedK || 1e-12)

  const eyring = calculateEyringParameters(
    activeEa,
    preset.deltaSActivationJ_MolK,
    kineticsState.temperatureK,
  )

  const fractionExceeding = fractionExceedingActivation(activeEa, kineticsState.temperatureK)

  // Current molecular coordinates along IRC
  const atoms = preset.getCoordinatesAt(kineticsState.reactionCoord)

  // Current energy at coordinate
  const currentEnergy = evaluateReactionProfile(
    kineticsState.reactionCoord,
    activeEa,
    preset.deltaHReactionKjMol,
  )

  return H(
    'div',
    { class: 'space-y-4' },
    // Top Control Toolbar
    H(
      'div',
      {
        class:
          'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0a0f18] p-4',
      },
      // Reaction Preset Dropdown
      H(
        'div',
        { class: 'flex items-center gap-2' },
        H('span', { class: 'font-mono text-[10.5px] uppercase text-zinc-400' }, 'Reaction:'),
        H(
          'select',
          {
            value: kineticsState.presetId,
            onchange: (e: Event) => {
              const id = (e.target as HTMLSelectElement).value
              initKineticsState(id)
            },
            class:
              'rounded-md border border-white/10 bg-[#0c1220] px-2.5 py-1.5 font-mono text-[11px] text-zinc-200 focus:border-amber-400 focus:outline-none',
          },
          ...KINETICS_PRESETS.map((p) =>
            H('option', { value: p.id, selected: p.id === kineticsState.presetId }, p.name),
          ),
        ),
      ),

      // Temperature Slider
      H(
        'div',
        { class: 'flex items-center gap-2' },
        H('span', { class: 'font-mono text-[10.5px] text-zinc-400' }, 'Temperature:'),
        H('input', {
          type: 'range',
          min: '150',
          max: '1000',
          step: '5',
          value: String(kineticsState.temperatureK),
          oninput: (e: Event) => {
            kineticsState.temperatureK = parseFloat((e.target as HTMLInputElement).value)
          },
          class: 'w-28 accent-amber-400',
        }),
        H(
          'span',
          { class: 'w-16 font-mono text-[11px] font-bold text-amber-300' },
          `${kineticsState.temperatureK.toFixed(0)} K`,
        ),
      ),

      // Catalyst Toggle
      preset.eaCatalyzedKjMol != null
        ? H(
            'button',
            {
              type: 'button',
              onclick: () => {
                kineticsState.isCatalyzed = !kineticsState.isCatalyzed
              },
              class: `flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] font-semibold transition ${
                kineticsState.isCatalyzed
                  ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-200'
                  : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`,
            },
            H('span', null, '⚡ Catalyst'),
            H(
              'span',
              {
                class: `rounded px-1 text-[9px] uppercase tracking-wider ${
                  kineticsState.isCatalyzed
                    ? 'bg-emerald-400/30 text-emerald-100'
                    : 'bg-white/10 text-zinc-400'
                }`,
              },
              kineticsState.isCatalyzed ? 'Active' : 'Off',
            ),
          )
        : null,

      // View Sub-Tabs
      H(
        'div',
        { class: 'flex rounded-md border border-white/10 p-0.5 bg-[#0e1626]' },
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              kineticsState.activeView = 'potential'
            },
            class: `rounded px-2.5 py-1 font-mono text-[10.5px] font-medium transition ${
              kineticsState.activeView === 'potential'
                ? 'bg-amber-400/20 text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '📈 Reaction Profile',
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              kineticsState.activeView = 'distribution'
            },
            class: `rounded px-2.5 py-1 font-mono text-[10.5px] font-medium transition ${
              kineticsState.activeView === 'distribution'
                ? 'bg-amber-400/20 text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '📊 Boltzmann f(E)',
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              kineticsState.activeView = 'dynamics'
            },
            class: `rounded px-2.5 py-1 font-mono text-[10.5px] font-medium transition ${
              kineticsState.activeView === 'dynamics'
                ? 'bg-amber-400/20 text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '⏱ Rate Dynamics',
        ),
      ),
    ),

    // Chemical Equation Banner
    H(
      'div',
      {
        class:
          'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-400/25 bg-amber-400/[0.04] px-4 py-2.5',
      },
      H(
        'div',
        { class: 'font-mono text-[13px] font-bold tracking-wide text-amber-300' },
        preset.reactionEquation,
      ),
      H(
        'div',
        { class: 'flex items-center gap-2 font-mono text-[10.5px] text-zinc-400' },
        H('span', null, 'Order:'),
        H(
          'span',
          { class: 'rounded bg-amber-400/10 px-1.5 py-0.5 text-amber-300 font-semibold' },
          `${preset.order === 1 ? '1st' : '2nd'} Order`,
        ),
        H('span', { class: 'ml-2' }, 'ΔH_rxn:'),
        H(
          'span',
          {
            class: `font-semibold ${
              preset.deltaHReactionKjMol < 0 ? 'text-emerald-400' : 'text-rose-400'
            }`,
          },
          `${preset.deltaHReactionKjMol} kJ/mol (${
            preset.deltaHReactionKjMol < 0 ? 'Exothermic' : 'Endothermic'
          })`,
        ),
      ),
    ),

    // Main 2-Column Layout
    H(
      'div',
      { class: 'grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]' },
      // Left Column: Interactive Simulation Stages
      H(
        'div',
        { class: 'space-y-4' },
        // Top Stage: View Switcher (Potential Profile / Boltzmann / Rate Dynamics)
        kineticsState.activeView === 'potential'
          ? renderPotentialProfileView(preset, activeEa, currentEnergy.potentialEnergyKjMol)
          : kineticsState.activeView === 'distribution'
            ? renderBoltzmannDistributionView(activeEa, kineticsState.temperatureK, fractionExceeding)
            : renderRateDynamicsView(preset, rateK),

        // Bottom Stage: 3D/2D Molecular Collision Reaction Coordinate Scrubber
        renderMolecularCollisionStage(preset, atoms, currentEnergy.isTransitionState),
      ),

      // Right Column: Detailed Physical Chemistry Inspector Card
      H(
        'div',
        { class: 'space-y-4' },
        renderKineticsInspectorCard(preset, activeEa, rateK, speedupRatio, eyring, fractionExceeding),
        renderTheorySummaryCard(preset),
      ),
    ),
  )
}

/**
 * 1. Potential Energy Surface Profile along Intrinsic Reaction Coordinate s in [-1, +1]
 */
function renderPotentialProfileView(
  preset: ReactionPreset,
  activeEa: number,
  currentPotential: number,
): VNode {
  const width = 640
  const height = 280
  const paddingX = 60
  const paddingY = 45

  // Map energy range
  const minE = Math.min(-20, preset.deltaHReactionKjMol - 20)
  const maxE = Math.max(activeEa + 25, 40)
  const eRange = maxE - minE

  const toX = (s: number) => paddingX + ((s + 1) / 2) * (width - 2 * paddingX)
  const toY = (e: number) => height - paddingY - ((e - minE) / eRange) * (height - 2 * paddingY)

  // Generate un-catalyzed path
  const uncatPoints: string[] = []
  for (let s = -1; s <= 1.01; s += 0.02) {
    const v = evaluateReactionProfile(s, preset.eaKjMol, preset.deltaHReactionKjMol)
    uncatPoints.push(`${toX(s).toFixed(1)},${toY(v.potentialEnergyKjMol).toFixed(1)}`)
  }

  // Generate catalyzed path if applicable
  const catPoints: string[] = []
  if (preset.eaCatalyzedKjMol != null) {
    for (let s = -1; s <= 1.01; s += 0.02) {
      const v = evaluateReactionProfile(s, preset.eaCatalyzedKjMol, preset.deltaHReactionKjMol)
      catPoints.push(`${toX(s).toFixed(1)},${toY(v.potentialEnergyKjMol).toFixed(1)}`)
    }
  }

  const ballX = toX(kineticsState.reactionCoord)
  const ballY = toY(currentPotential)

  return H(
    'div',
    { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
    H(
      'div',
      { class: 'mb-2 flex items-center justify-between font-mono text-[10px]' },
      H(
        'span',
        { class: 'text-zinc-400 font-semibold' },
        'Potential Energy Surface V(s) vs Intrinsic Reaction Coordinate (IRC)',
      ),
      H(
        'span',
        { class: 'text-amber-300 font-bold' },
        `Current V(s): ${currentPotential.toFixed(1)} kJ/mol`,
      ),
    ),
    H(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        class: 'w-full h-auto rounded border border-white/5 bg-[#070a12]',
      },
      // Zero reference line
      H('line', {
        x1: paddingX,
        y1: toY(0),
        x2: width - paddingX,
        y2: toY(0),
        stroke: '#27272a',
        'stroke-dasharray': '2,3',
      }),
      H(
        'text',
        { x: paddingX + 4, y: toY(0) - 5, fill: '#52525b', 'font-size': '9', 'font-family': 'monospace' },
        'V = 0 (Reactants Reference)',
      ),

      // Uncatalyzed path curve
      H('polyline', {
        points: uncatPoints.join(' '),
        fill: 'none',
        stroke: kineticsState.isCatalyzed ? '#52525b' : '#fbbf24',
        'stroke-width': kineticsState.isCatalyzed ? 1.5 : 2.5,
        'stroke-dasharray': kineticsState.isCatalyzed ? '4,4' : undefined,
      }),

      // Catalyzed path curve (if available)
      preset.eaCatalyzedKjMol != null
        ? H('polyline', {
            points: catPoints.join(' '),
            fill: 'none',
            stroke: '#10b981',
            'stroke-width': kineticsState.isCatalyzed ? 2.5 : 1.2,
            opacity: kineticsState.isCatalyzed ? 1.0 : 0.45,
          })
        : null,

      // Transition state double dagger marker
      H(
        'text',
        {
          x: toX(0) - 5,
          y: toY(activeEa) - 10,
          fill: '#f59e0b',
          'font-size': '16',
          'font-family': 'monospace',
          'font-weight': 'bold',
        },
        '‡',
      ),
      H(
        'text',
        {
          x: toX(0) - 22,
          y: toY(activeEa) - 26,
          fill: '#f59e0b',
          'font-size': '9.5',
          'font-family': 'monospace',
        },
        `E_a = ${activeEa} kJ`,
      ),

      // Product Enthalpy marker
      H('line', {
        x1: toX(0.85),
        y1: toY(preset.deltaHReactionKjMol),
        x2: toX(1.0),
        y2: toY(preset.deltaHReactionKjMol),
        stroke: '#ef4444',
        'stroke-dasharray': '2,2',
      }),
      H(
        'text',
        {
          x: toX(0.72),
          y: toY(preset.deltaHReactionKjMol) + 14,
          fill: '#ef4444',
          'font-size': '9',
          'font-family': 'monospace',
        },
        `ΔH = ${preset.deltaHReactionKjMol} kJ`,
      ),

      // Animated State Particle Ball on Reaction Curve
      H('circle', {
        cx: ballX,
        cy: ballY,
        r: 6.5,
        fill: '#38bdf8',
        stroke: '#ffffff',
        'stroke-width': 2,
      }),
      H('circle', {
        cx: ballX,
        cy: ballY,
        r: 12,
        fill: '#38bdf8',
        opacity: 0.25,
      }),
    ),
  )
}

/**
 * 2. Maxwell-Boltzmann Collision Energy Distribution & Activation Tail View
 */
function renderBoltzmannDistributionView(
  eaKjMol: number,
  temperatureK: number,
  fractionExceeding: number,
): VNode {
  const width = 640
  const height = 280
  const maxEnergy = Math.max(140, eaKjMol + 40)
  const paddingX = 60
  const paddingY = 40

  const toX = (e: number) => paddingX + (e / maxEnergy) * (width - 2 * paddingX)
  const maxY = maxwellBoltzmannEnergyDensity(1.5, temperatureK) * 1.25 || 0.05
  const toY = (prob: number) => height - paddingY - (prob / maxY) * (height - 2 * paddingY)

  const curvePoints: string[] = []
  const shadedPoints: string[] = []
  shadedPoints.push(`${toX(eaKjMol).toFixed(1)},${toY(0).toFixed(1)}`)

  for (let e = 0; e <= maxEnergy; e += 1.5) {
    const p = maxwellBoltzmannEnergyDensity(e, temperatureK)
    const px = toX(e)
    const py = toY(p)
    curvePoints.push(`${px.toFixed(1)},${py.toFixed(1)}`)
    if (e >= eaKjMol) {
      shadedPoints.push(`${px.toFixed(1)},${py.toFixed(1)}`)
    }
  }
  shadedPoints.push(`${toX(maxEnergy).toFixed(1)},${toY(0).toFixed(1)}`)

  return H(
    'div',
    { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
    H(
      'div',
      { class: 'mb-2 flex items-center justify-between font-mono text-[10px]' },
      H(
        'span',
        { class: 'text-zinc-400 font-semibold' },
        `Maxwell-Boltzmann Molecular Energy Distribution f(E) @ ${temperatureK.toFixed(0)} K`,
      ),
      H(
        'span',
        { class: 'text-rose-400 font-bold' },
        `Fraction E ≥ Ea: ${(fractionExceeding * 100).toExponential(2)}%`,
      ),
    ),
    H(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        class: 'w-full h-auto rounded border border-white/5 bg-[#070a12]',
      },
      // Shaded activation tail (E >= Ea)
      H('polygon', {
        points: shadedPoints.join(' '),
        fill: '#ef4444',
        opacity: 0.35,
      }),

      // Distribution Curve
      H('polyline', {
        points: curvePoints.join(' '),
        fill: 'none',
        stroke: '#38bdf8',
        'stroke-width': 2.5,
      }),

      // Activation Barrier Threshold vertical line
      H('line', {
        x1: toX(eaKjMol),
        y1: paddingY - 10,
        x2: toX(eaKjMol),
        y2: height - paddingY,
        stroke: '#f59e0b',
        'stroke-width': 2,
        'stroke-dasharray': '3,3',
      }),
      H(
        'text',
        {
          x: toX(eaKjMol) + 5,
          y: paddingY + 15,
          fill: '#f59e0b',
          'font-size': '10',
          'font-family': 'monospace',
          'font-weight': 'bold',
        },
        `E_a = ${eaKjMol} kJ/mol`,
      ),
      H(
        'text',
        {
          x: toX(eaKjMol) + 5,
          y: paddingY + 28,
          fill: '#f87171',
          'font-size': '8.5',
          'font-family': 'monospace',
        },
        'Effective Collisions ⟶',
      ),

      // Axes
      H('line', {
        x1: paddingX,
        y1: height - paddingY,
        x2: width - paddingX + 20,
        y2: height - paddingY,
        stroke: '#52525b',
        'stroke-width': 1.5,
      }),
      H(
        'text',
        {
          x: width - paddingX - 40,
          y: height - paddingY + 20,
          fill: '#a1a1aa',
          'font-size': '9.5',
          'font-family': 'monospace',
        },
        'Energy (kJ/mol) ⟶',
      ),
    ),
  )
}

/**
 * 3. Integrated Rate Law Concentration vs Time Dynamics Plot
 */
function renderRateDynamicsView(preset: ReactionPreset, rateK: number): VNode {
  const width = 640
  const height = 280
  const paddingX = 60
  const paddingY = 40

  // Total duration: 3 half-lives
  const halfLife = Math.log(2) / (rateK || 0.001)
  const duration = Math.min(300, Math.max(10, halfLife * 3))

  const dynamics = solveConcentrationDynamics(
    preset.order,
    rateK,
    kineticsState.initialConcentration,
    duration,
    80,
  )

  const toX = (t: number) => paddingX + (t / duration) * (width - 2 * paddingX)
  const toY = (c: number) =>
    height - paddingY - (c / kineticsState.initialConcentration) * (height - 2 * paddingY)

  const lineA = dynamics.map((d) => `${toX(d.timeSec).toFixed(1)},${toY(d.concA).toFixed(1)}`).join(' ')
  const lineP = dynamics.map((d) => `${toX(d.timeSec).toFixed(1)},${toY(d.concP).toFixed(1)}`).join(' ')

  return H(
    'div',
    { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
    H(
      'div',
      { class: 'mb-2 flex items-center justify-between font-mono text-[10px]' },
      H(
        'div',
        { class: 'flex items-center gap-3' },
        H('span', { class: 'text-zinc-400 font-semibold' }, 'Concentration vs Time:'),
        H(
          'span',
          { class: 'flex items-center gap-1 text-sky-400' },
          H('span', { class: 'inline-block h-1.5 w-1.5 rounded-full bg-sky-400' }),
          '[Reactants]',
        ),
        H(
          'span',
          { class: 'flex items-center gap-1 text-emerald-400' },
          H('span', { class: 'inline-block h-1.5 w-1.5 rounded-full bg-emerald-400' }),
          '[Products]',
        ),
      ),
      H(
        'span',
        { class: 'text-amber-300 font-mono' },
        `t_1/2 = ${halfLife < 1000 ? `${halfLife.toFixed(2)} s` : halfLife.toExponential(2) + ' s'}`,
      ),
    ),
    H(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        class: 'w-full h-auto rounded border border-white/5 bg-[#070a12]',
      },
      // Reactant curve [A](t)
      H('polyline', {
        points: lineA,
        fill: 'none',
        stroke: '#38bdf8',
        'stroke-width': 2.5,
      }),

      // Product curve [P](t)
      H('polyline', {
        points: lineP,
        fill: 'none',
        stroke: '#10b981',
        'stroke-width': 2.5,
      }),

      // Axes & grid
      H('line', {
        x1: paddingX,
        y1: height - paddingY,
        x2: width - paddingX,
        y2: height - paddingY,
        stroke: '#52525b',
      }),
      H(
        'text',
        {
          x: width - paddingX - 40,
          y: height - paddingY + 18,
          fill: '#a1a1aa',
          'font-size': '9',
          'font-family': 'monospace',
        },
        'Time (s) ⟶',
      ),
      H('line', {
        x1: paddingX,
        y1: paddingY,
        x2: paddingX,
        y2: height - paddingY,
        stroke: '#52525b',
      }),
      H(
        'text',
        {
          x: paddingX - 25,
          y: paddingY - 10,
          fill: '#a1a1aa',
          'font-size': '9',
          'font-family': 'monospace',
        },
        '[Conc] M',
      ),
    ),
  )
}

/**
 * 4. Interactive 3D/2D Molecular Collision Reaction Coordinate Scrubber
 */
function renderMolecularCollisionStage(
  preset: ReactionPreset,
  atoms: any[],
  isTransitionState: boolean,
): VNode {
  const width = 640
  const height = 180
  const scale = 50 // Pixels per Angstrom
  const centerX = width / 2
  const centerY = height / 2

  return H(
    'div',
    { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
    H(
      'div',
      { class: 'mb-2 flex items-center justify-between font-mono text-[10px]' },
      H(
        'div',
        { class: 'flex items-center gap-2' },
        H('span', { class: 'text-zinc-400 font-semibold' }, 'Molecular Geometry @ Reaction Coordinate s:'),
        H(
          'span',
          {
            class: `font-bold ${
              isTransitionState ? 'text-amber-400' : kineticsState.reactionCoord < 0 ? 'text-sky-400' : 'text-emerald-400'
            }`,
          },
          isTransitionState
            ? preset.transitionStateLabel
            : kineticsState.reactionCoord < 0
              ? preset.reactantsLabel
              : preset.productsLabel,
        ),
      ),
      H(
        'div',
        { class: 'flex items-center gap-1.5' },
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              kineticsState.reactionCoord = -1.0
            },
            class: 'rounded border border-white/10 px-1.5 py-0.5 text-[9px] hover:bg-white/10',
          },
          '|◀ Reactants',
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              kineticsState.reactionCoord = 0.0
            },
            class: 'rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-300 hover:bg-amber-400/20',
          },
          '‡ TS',
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              kineticsState.reactionCoord = 1.0
            },
            class: 'rounded border border-white/10 px-1.5 py-0.5 text-[9px] hover:bg-white/10',
          },
          'Products ▶|',
        ),
      ),
    ),

    // Canvas Stage
    H(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        class: `w-full h-auto rounded border bg-[#060910] ${
          isTransitionState ? 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'border-white/5'
        }`,
      },
      // Center reference crosshair
      H('line', {
        x1: centerX,
        y1: 10,
        x2: centerX,
        y2: height - 10,
        stroke: '#27272a',
        'stroke-dasharray': '2,4',
      }),

      // Render Atoms
      ...atoms.map((a: any, i: number) => {
        const px = centerX + a.x * scale
        const py = centerY - a.y * scale
        const r = a.radius * scale * 0.75

        return H('g', { key: `atom-${i}` },
          // Shadow / halo
          H('circle', {
            cx: px,
            cy: py,
            r: r + 3,
            fill: a.color,
            opacity: 0.15,
          }),
          // Sphere body
          H('circle', {
            cx: px,
            cy: py,
            r,
            fill: a.color,
            stroke: '#ffffff',
            'stroke-width': 1.2,
          }),
          // Element label
          H(
            'text',
            {
              x: px,
              y: py + 3.5,
              fill: '#ffffff',
              'font-size': '11',
              'font-family': 'monospace',
              'font-weight': 'bold',
              'text-anchor': 'middle',
            },
            a.symbol,
          ),
        )
      }),
    ),

    // Reaction Coordinate Scrubber Slider
    H(
      'div',
      { class: 'mt-3 flex items-center gap-3' },
      H('span', { class: 'font-mono text-[10px] text-zinc-500' }, 'Reactants (s = -1.0)'),
      H('input', {
        type: 'range',
        min: '-1.0',
        max: '1.0',
        step: '0.02',
        value: String(kineticsState.reactionCoord),
        oninput: (e: Event) => {
          kineticsState.reactionCoord = parseFloat((e.target as HTMLInputElement).value)
        },
        class: 'flex-1 accent-amber-400',
      }),
      H('span', { class: 'font-mono text-[10px] text-zinc-500' }, 'Products (s = +1.0)'),
    ),
  )
}

/**
 * 5. Right-Hand Physics & Thermodynamics Inspector Card
 */
function renderKineticsInspectorCard(
  preset: ReactionPreset,
  activeEa: number,
  rateK: number,
  speedupRatio: number,
  eyring: any,
  fractionExceeding: number,
): VNode {
  return H(
    'div',
    { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
    H(
      'h3',
      { class: 'mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300' },
      'Kinetics & Transition State Parameters',
    ),
    H(
      'dl',
      { class: 'grid grid-cols-2 gap-x-2 gap-y-2 font-mono text-[11px]' },
      H('dt', { class: 'text-zinc-500' }, 'Reaction Rate k(T):'),
      H(
        'dd',
        { class: 'text-right font-bold text-amber-300' },
        `${rateK < 1e4 && rateK > 1e-4 ? rateK.toFixed(3) : rateK.toExponential(3)} ${
          preset.order === 1 ? 's⁻¹' : 'M⁻¹ s⁻¹'
        }`,
      ),

      H('dt', { class: 'text-zinc-500' }, 'Activation Energy Ea:'),
      H(
        'dd',
        { class: 'text-right font-semibold text-zinc-200' },
        `${activeEa.toFixed(1)} kJ/mol`,
      ),

      kineticsState.isCatalyzed
        ? [
            H('dt', { class: 'text-emerald-400' }, 'Catalytic Acceleration:'),
            H('dd', { class: 'text-right font-bold text-emerald-300' }, `${speedupRatio.toExponential(1)}×`),
          ]
        : null,

      H('dt', { class: 'text-zinc-500' }, 'Pre-exponential A:'),
      H(
        'dd',
        { class: 'text-right text-zinc-400' },
        `${preset.frequencyFactorA.toExponential(2)}`,
      ),

      H('dt', { class: 'text-zinc-500' }, 'ΔG‡ (Gibbs Activation):'),
      H(
        'dd',
        { class: 'text-right text-purple-300 font-semibold' },
        `${eyring.deltaGActivationKjMol.toFixed(1)} kJ/mol`,
      ),

      H('dt', { class: 'text-zinc-500' }, 'ΔH‡ (Enthalpy):'),
      H('dd', { class: 'text-right text-zinc-300' }, `${eyring.deltaHActivationKjMol.toFixed(1)} kJ/mol`),

      H('dt', { class: 'text-zinc-500' }, 'ΔS‡ (Entropy):'),
      H(
        'dd',
        { class: 'text-right text-zinc-300' },
        `${preset.deltaSActivationJ_MolK.toFixed(1)} J/(mol·K)`,
      ),

      H('dt', { class: 'text-zinc-500' }, 'Fraction E ≥ Ea:'),
      H(
        'dd',
        { class: 'text-right text-rose-400 font-bold' },
        `${(fractionExceeding * 100).toExponential(2)}%`,
      ),
    ),
  )
}

/**
 * 6. Theoretical Mechanism Summary Card
 */
function renderTheorySummaryCard(preset: ReactionPreset): VNode {
  return H(
    'div',
    { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4 text-[10.5px] leading-relaxed text-zinc-400' },
    H(
      'h3',
      { class: 'mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-sky-300' },
      'Reaction Mechanism',
    ),
    H('p', { class: 'text-zinc-300' }, preset.description),
    H(
      'div',
      { class: 'mt-3 border-t border-white/5 pt-2.5 space-y-1 font-mono text-[10px] text-zinc-500' },
      H('div', null, '• Transition State: Saddle point on the Potential Energy Surface (PES).'),
      H('div', null, '• Walden Inversion: Front-to-back inversion of tetrahedral stereocenters.'),
      H('div', null, '• Arrhenius: Higher T shifts Maxwell-Boltzmann tail exponentially across Ea.'),
    ),
  )
}
