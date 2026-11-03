/**
 * ============================================================================
 * ZEEMAN & STARK EFFECT QUANTUM SPLITTING LAB (NATIVE NEXUS COMPONENT)
 * ============================================================================
 * Implements:
 * 1. Interactive Magnetic Field B (0 - 10 Tesla) & Landé g-factor splitting
 * 2. Paschen-Back L-S decoupling transition
 * 3. Electric Field E (0 - 100 kV/cm) Linear & Quadratic Stark effect
 * 4. 2D Polarized Wavefunction Dipole deformation cross-section
 * 5. Polarized Optical Spectrograph (pi and sigma+/- lines)
 * ============================================================================
 */

import { h, reactive, type VNode } from 'nexus-framework'
import {
  BOHR_MAGNETON_EV,
  BOHR_RADIUS_METERS,
  calculateLandeG,
  computeTransitions,
  evaluateStarkWavefunction,
  generateSubstates,
  type QuantumState,
  type TransitionLine,
  ZEEMAN_STARK_PRESETS,
  type ZeemanStarkPreset,
} from '@/lib/periodic/zeeman-stark'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export type LabTab = 'zeeman' | 'stark' | 'presets'

interface ZeemanStarkState {
  activeTab: LabTab
  presetId: string
  bTesla: number
  eKilovoltPerCm: number
  selectedLineId: string | null
  hoveredState: string | null
}

export const zeemanStarkState = reactive<ZeemanStarkState>({
  activeTab: 'zeeman',
  presetId: 'cadmium-normal',
  bTesla: 1.5,
  eKilovoltPerCm: 0.0,
  selectedLineId: null,
  hoveredState: null,
})

export function initZeemanStarkState(presetId?: string): void {
  const targetId = presetId ?? 'cadmium-normal'
  const preset = ZEEMAN_STARK_PRESETS.find((p) => p.id === targetId) ?? ZEEMAN_STARK_PRESETS[0]
  zeemanStarkState.presetId = preset.id
  zeemanStarkState.bTesla = preset.defaultB
  zeemanStarkState.eKilovoltPerCm = preset.defaultE
  zeemanStarkState.selectedLineId = null
  zeemanStarkState.hoveredState = null
  zeemanStarkState.activeTab = preset.isLinearStark ? 'stark' : 'zeeman'
}

interface Props {
  onClose?: () => void
  onSelectPreset?: (preset: ZeemanStarkPreset) => void
}

export function ZeemanStarkLabNexus({ onClose, onSelectPreset }: Props): VNode {
  const currentPreset =
    ZEEMAN_STARK_PRESETS.find((p) => p.id === zeemanStarkState.presetId) ?? ZEEMAN_STARK_PRESETS[0]

  // Calculate substates under current B and E
  const upperSubstates = generateSubstates(
    currentPreset.upperTerm,
    zeemanStarkState.bTesla,
    zeemanStarkState.eKilovoltPerCm,
    currentPreset.spinOrbitCouplingEV,
    currentPreset.isLinearStark,
    currentPreset.polarizabilityCm3,
  )

  const lowerSubstates = generateSubstates(
    currentPreset.lowerTerm,
    zeemanStarkState.bTesla,
    zeemanStarkState.eKilovoltPerCm,
    0.0,
    false,
    currentPreset.polarizabilityCm3 * 0.2,
  )

  // Transition lines
  const lines = computeTransitions(
    upperSubstates,
    lowerSubstates,
    (u) => {
      const g = calculateLandeG(currentPreset.upperTerm.l, currentPreset.upperTerm.s, u.j)
      const fs =
        currentPreset.spinOrbitCouplingEV > 0
          ? 0.5 * currentPreset.spinOrbitCouplingEV * (u.j * (u.j + 1) - currentPreset.upperTerm.l * (currentPreset.upperTerm.l + 1) - currentPreset.upperTerm.s * (currentPreset.upperTerm.s + 1))
          : 0
      return currentPreset.upperTerm.energyEV + fs + g * BOHR_MAGNETON_EV * zeemanStarkState.bTesla * u.mj
    },
    (l) => {
      const g = calculateLandeG(currentPreset.lowerTerm.l, currentPreset.lowerTerm.s, l.j)
      return currentPreset.lowerTerm.energyEV + g * BOHR_MAGNETON_EV * zeemanStarkState.bTesla * l.mj
    },
    currentPreset.nominalWavelengthNm,
  )

  const selectedLine = lines.find((l) => l.id === zeemanStarkState.selectedLineId) ?? lines[0]

  // Calculate Stark mixing parameter eta for 2s-2p superposition
  const maxEta = 0.8
  const currentEta = Math.min(maxEta, (zeemanStarkState.eKilovoltPerCm / 100.0) * maxEta)

  return H(
    'div',
    {
      class:
        'flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#090d16] text-zinc-200 shadow-2xl',
    },
    // Header
    H(
      'header',
      {
        class:
          'flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#0c1220] px-4',
      },
      H(
        'div',
        { class: 'flex items-center gap-2' },
        H(
          'span',
          {
            class:
              'flex h-6 w-6 items-center justify-center rounded-md border border-cyan-400/40 bg-cyan-400/10 font-mono text-[11px] font-bold text-cyan-300',
          },
          '⚡',
        ),
        H(
          'h2',
          { class: 'font-mono text-[12px] font-bold uppercase tracking-wider text-zinc-100' },
          'Zeeman & Stark Quantum Splitting Lab',
        ),
        H(
          'span',
          { class: 'hidden font-mono text-[10px] text-zinc-500 sm:inline' },
          'Magnetic B & Electric E Perturbations · Landé g · Paschen-Back Decoupling',
        ),
      ),
      H(
        'div',
        { class: 'flex items-center gap-2' },
        onClose
          ? H(
              'button',
              {
                type: 'button',
                onclick: onClose,
                class:
                  'rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-white',
              },
              '✕ Close',
            )
          : null,
      ),
    ),

    // Subheader tabs
    H(
      'nav',
      {
        class:
          'flex shrink-0 items-center justify-between border-b border-white/5 bg-[#0a0e1a] px-4 py-1.5',
      },
      H(
        'div',
        { class: 'flex gap-1.5' },
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              zeemanStarkState.activeTab = 'zeeman'
            },
            class: `rounded-md px-3 py-1 font-mono text-[11px] font-semibold transition ${
              zeemanStarkState.activeTab === 'zeeman'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`,
          },
          '🧲 Magnetic Zeeman (B-Field)',
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              zeemanStarkState.activeTab = 'stark'
            },
            class: `rounded-md px-3 py-1 font-mono text-[11px] font-semibold transition ${
              zeemanStarkState.activeTab === 'stark'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`,
          },
          '⚡ Electric Stark (E-Field)',
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              zeemanStarkState.activeTab = 'presets'
            },
            class: `rounded-md px-3 py-1 font-mono text-[11px] font-semibold transition ${
              zeemanStarkState.activeTab === 'presets'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`,
          },
          '🏛 Benchmark Systems',
        ),
      ),
      H(
        'div',
        { class: 'hidden items-center gap-2 font-mono text-[10px] text-zinc-500 md:flex' },
        H('span', null, 'Active System:'),
        H('span', { class: 'text-cyan-300 font-semibold' }, currentPreset.name),
      ),
    ),

    // Content container
    H(
      'div',
      { class: 'flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:flex-row gap-4' },
      // Left / Main column: Controls & Visualizations
      H(
        'div',
        { class: 'flex min-h-0 flex-1 flex-col gap-4' },
        // Top control strip
        H(
          'div',
          {
            class:
              'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3',
          },
          // Preset selector dropdown
          H(
            'div',
            { class: 'flex items-center gap-2' },
            H('span', { class: 'font-mono text-[10px] text-zinc-400' }, 'System:'),
            H(
              'select',
              {
                value: zeemanStarkState.presetId,
                onchange: (e: Event) => {
                  const id = (e.target as HTMLSelectElement).value
                  initZeemanStarkState(id)
                },
                class:
                  'rounded border border-white/10 bg-[#0e1424] px-2 py-1 font-mono text-[11px] text-zinc-200 focus:border-cyan-400 focus:outline-none',
              },
              ...ZEEMAN_STARK_PRESETS.map((p) =>
                H('option', { value: p.id, selected: p.id === zeemanStarkState.presetId }, p.name),
              ),
            ),
          ),

          // Magnetic Field B Slider
          H(
            'div',
            { class: 'flex items-center gap-2' },
            H('span', { class: 'font-mono text-[10px] text-zinc-400' }, 'Magnetic Field B:'),
            H('input', {
              type: 'range',
              min: '0.0',
              max: '10.0',
              step: '0.05',
              value: String(zeemanStarkState.bTesla),
              oninput: (e: Event) => {
                zeemanStarkState.bTesla = parseFloat((e.target as HTMLInputElement).value)
              },
              class: 'w-28 accent-cyan-400',
            }),
            H(
              'span',
              { class: 'w-16 font-mono text-[11px] font-bold text-cyan-300' },
              `${zeemanStarkState.bTesla.toFixed(2)} T`,
            ),
          ),

          // Electric Field E Slider
          H(
            'div',
            { class: 'flex items-center gap-2' },
            H('span', { class: 'font-mono text-[10px] text-zinc-400' }, 'Electric Field E:'),
            H('input', {
              type: 'range',
              min: '0.0',
              max: '100.0',
              step: '1.0',
              value: String(zeemanStarkState.eKilovoltPerCm),
              oninput: (e: Event) => {
                zeemanStarkState.eKilovoltPerCm = parseFloat((e.target as HTMLInputElement).value)
              },
              class: 'w-28 accent-amber-400',
            }),
            H(
              'span',
              { class: 'w-20 font-mono text-[11px] font-bold text-amber-300' },
              `${zeemanStarkState.eKilovoltPerCm.toFixed(1)} kV/cm`,
            ),
          ),
        ),

        // Main Visualizer depending on active tab
        zeemanStarkState.activeTab === 'stark'
          ? renderStarkWavefunctionView(currentEta, zeemanStarkState.eKilovoltPerCm)
          : renderZeemanLevelDiagram(currentPreset, upperSubstates, lowerSubstates, lines, selectedLine),

        // Optical Spectrograph Strip (always shown at bottom of visualization)
        renderSpectrograph(lines, selectedLine, currentPreset),
      ),

      // Right column: Physics Inspector & Quantum Numbers
      H(
        'div',
        { class: 'w-full shrink-0 space-y-4 md:w-80' },
        renderPhysicsInspector(currentPreset, selectedLine, upperSubstates, lowerSubstates),
        renderSelectionRulesCard(),
      ),
    ),
  )
}

/**
 * Renders the Interactive Energy Level Splitting Diagram.
 */
function renderZeemanLevelDiagram(
  preset: ZeemanStarkPreset,
  upperStates: QuantumState[],
  lowerStates: QuantumState[],
  lines: TransitionLine[],
  selectedLine: TransitionLine | null,
): VNode {
  const width = 640
  const height = 300
  const upperY0 = 70
  const lowerY0 = 230

  // Calculate state splitting spread
  const maxUpperSpread = 40
  const maxLowerSpread = 30

  return H(
    'div',
    { class: 'relative rounded-xl border border-white/10 bg-[#080c14] p-3' },
    H(
      'div',
      { class: 'mb-2 flex items-center justify-between font-mono text-[10px]' },
      H(
        'span',
        { class: 'text-zinc-400' },
        'E(B) Quantum Level Splitting (eV) & Optical Transitions',
      ),
      H(
        'span',
        { class: 'text-cyan-400' },
        `μ_B·B = ${(BOHR_MAGNETON_EV * zeemanStarkState.bTesla * 1e3).toFixed(3)} meV`,
      ),
    ),

    H(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        class: 'w-full h-auto rounded border border-white/5 bg-[#060910]',
      },
      // Axis & baseline guidelines
      H('line', {
        x1: 40,
        y1: upperY0,
        x2: 120,
        y2: upperY0,
        stroke: '#52525b',
        'stroke-width': 2,
      }),
      H(
        'text',
        { x: 40, y: upperY0 - 8, fill: '#a1a1aa', 'font-size': '10', 'font-family': 'monospace' },
        `Upper Term: ${preset.upperTerm.n}${['s', 'p', 'd'][preset.upperTerm.l]}`,
      ),

      H('line', {
        x1: 40,
        y1: lowerY0,
        x2: 120,
        y2: lowerY0,
        stroke: '#52525b',
        'stroke-width': 2,
      }),
      H(
        'text',
        { x: 40, y: lowerY0 + 16, fill: '#a1a1aa', 'font-size': '10', 'font-family': 'monospace' },
        `Lower Term: ${preset.lowerTerm.n}${['s', 'p', 'd'][preset.lowerTerm.l]}`,
      ),

      // Split lines on right side
      ...upperStates.map((s, idx) => {
        const offset = (s.mj / (s.j || 1)) * maxUpperSpread * (zeemanStarkState.bTesla / 5.0)
        const y = upperY0 - offset
        const x1 = 180
        const x2 = 580
        const isSelected = selectedLine?.upperState.mj === s.mj && selectedLine?.upperState.j === s.j

        return H('g', { key: `u-${s.label}` },
          // Connector dashed line
          H('line', {
            x1: 120,
            y1: upperY0,
            x2: x1,
            y2: y,
            stroke: '#3f3f46',
            'stroke-dasharray': '3,3',
          }),
          // Level line
          H('line', {
            x1,
            y1: y,
            x2,
            y2: y,
            stroke: isSelected ? '#38bdf8' : '#71717a',
            'stroke-width': isSelected ? 2.5 : 1.5,
          }),
          // Label
          H(
            'text',
            {
              x: x2 + 6,
              y: y + 3,
              fill: isSelected ? '#38bdf8' : '#a1a1aa',
              'font-size': '9',
              'font-family': 'monospace',
            },
            `mj=${s.mj >= 0 ? '+' : ''}${s.mj}`,
          ),
        )
      }),

      ...lowerStates.map((s) => {
        const offset = (s.mj / (s.j || 1)) * maxLowerSpread * (zeemanStarkState.bTesla / 5.0)
        const y = lowerY0 - offset
        const x1 = 180
        const x2 = 580
        const isSelected = selectedLine?.lowerState.mj === s.mj && selectedLine?.lowerState.j === s.j

        return H('g', { key: `l-${s.label}` },
          H('line', {
            x1: 120,
            y1: lowerY0,
            x2: x1,
            y2: y,
            stroke: '#3f3f46',
            'stroke-dasharray': '3,3',
          }),
          H('line', {
            x1,
            y1: y,
            x2,
            y2: y,
            stroke: isSelected ? '#34d399' : '#71717a',
            'stroke-width': isSelected ? 2.5 : 1.5,
          }),
          H(
            'text',
            {
              x: x2 + 6,
              y: y + 3,
              fill: isSelected ? '#34d399' : '#a1a1aa',
              'font-size': '9',
              'font-family': 'monospace',
            },
            `mj=${s.mj >= 0 ? '+' : ''}${s.mj}`,
          ),
        )
      }),

      // Draw transition arrows between upper and lower levels
      ...lines.map((l, i) => {
        const upperOffset =
          (l.upperState.mj / (l.upperState.j || 1)) * maxUpperSpread * (zeemanStarkState.bTesla / 5.0)
        const lowerOffset =
          (l.lowerState.mj / (l.lowerState.j || 1)) * maxLowerSpread * (zeemanStarkState.bTesla / 5.0)
        const y1 = upperY0 - upperOffset
        const y2 = lowerY0 - lowerOffset
        const x = 220 + i * (320 / Math.max(1, lines.length - 1))
        const isSelected = selectedLine?.id === l.id

        const color =
          l.polarization === 'pi'
            ? '#10b981' // emerald pi line
            : l.polarization === 'sigma_plus'
              ? '#f59e0b' // amber sigma+
              : '#06b6d4' // cyan sigma-

        return H(
          'g',
          {
            key: l.id,
            style: { cursor: 'pointer' },
            onclick: () => {
              zeemanStarkState.selectedLineId = l.id
            },
          },
          H('line', {
            x1: x,
            y1: y1 + 2,
            x2: x,
            y2: y2 - 4,
            stroke: color,
            'stroke-width': isSelected ? 2.5 : 1.2,
            opacity: isSelected ? 1.0 : 0.6,
          }),
          // Arrowhead
          H('polygon', {
            points: `${x - 3},${y2 - 6} ${x + 3},${y2 - 6} ${x},${y2}`,
            fill: color,
          }),
        )
      }),
    ),
  )
}

/**
 * Renders the 2D Wavefunction Dipole Deformation view under an Electric Field E.
 */
function renderStarkWavefunctionView(eta: number, eFieldKV: number): VNode {
  const width = 640
  const height = 300
  const gridSize = 40
  const dx = 14 / gridSize
  const dz = 14 / gridSize

  const rects: VNode[] = []
  for (let ix = 0; ix < gridSize; ix++) {
    const x = -7 + ix * dx
    for (let iz = 0; iz < gridSize; iz++) {
      const z = -7 + iz * dz
      const { psiSq } = evaluateStarkWavefunction(x, z, eta)
      const intensity = Math.min(1.0, psiSq * 40.0)
      if (intensity < 0.02) continue

      // Color mapping: Cyan to amber depending on Stark displacement
      const r = Math.round(56 + intensity * 200)
      const g = Math.round(189 + intensity * 30)
      const b = Math.round(248 - intensity * 150)
      const alpha = (intensity * 0.9).toFixed(3)

      const px = 220 + ix * 5
      const pz = height - 30 - iz * 6

      rects.push(
        H('rect', {
          key: `${ix}-${iz}`,
          x: px,
          y: pz,
          width: 5.2,
          height: 6.2,
          fill: `rgba(${r}, ${g}, ${b}, ${alpha})`,
        }),
      )
    }
  }

  // Calculate induced dipole expectation value
  const inducedDipoleDebye = (eta * 2.54).toFixed(2)
  const linearShiftEV = (3 * BOHR_RADIUS_METERS * (eFieldKV * 1e5)).toFixed(3)

  return H(
    'div',
    { class: 'relative rounded-xl border border-white/10 bg-[#080c14] p-3' },
    H(
      'div',
      { class: 'mb-2 flex items-center justify-between font-mono text-[10px]' },
      H(
        'span',
        { class: 'text-zinc-400' },
        '2D Polarized Electron Density |ψ(x, z)|² Cross-Section (Hydrogenic n=2)',
      ),
      H(
        'span',
        { class: 'text-amber-400' },
        `Linear Stark Shift: ±${linearShiftEV} eV · Dipole p = ${inducedDipoleDebye} D`,
      ),
    ),
    H(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        class: 'w-full h-auto rounded border border-white/5 bg-[#060910]',
      },
      // Electric Field Direction Arrow
      H('defs', null,
        H('marker', {
          id: 'arrow-e',
          viewBox: '0 0 10 10',
          refX: '5',
          refY: '5',
          markerWidth: '6',
          markerHeight: '6',
          orient: 'auto-start-reverse',
        },
        H('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#f59e0b' })),
      ),

      H('line', {
        x1: 80,
        y1: height - 50,
        x2: 80,
        y2: 50,
        stroke: '#f59e0b',
        'stroke-width': 2.5,
        'marker-end': 'url(#arrow-e)',
      }),
      H(
        'text',
        { x: 92, y: 150, fill: '#f59e0b', 'font-size': '11', 'font-family': 'monospace', 'font-weight': 'bold' },
        `E_ext = ${eFieldKV.toFixed(0)} kV/cm (along +z)`,
      ),

      // Induced Dipole Vector
      H('line', {
        x1: 150,
        y1: 50,
        x2: 150,
        y2: height - 50,
        stroke: '#38bdf8',
        'stroke-width': 2,
        'stroke-dasharray': '4,4',
        'marker-end': 'url(#arrow-e)',
      }),
      H(
        'text',
        { x: 135, y: height - 25, fill: '#38bdf8', 'font-size': '9', 'font-family': 'monospace' },
        'Induced Dipole p',
      ),

      // Density grid
      ...rects,

      // Nucleus in center
      H('circle', {
        cx: 320,
        cy: height / 2,
        r: 3,
        fill: '#ef4444',
      }),
      H(
        'text',
        { x: 328, y: height / 2 + 3, fill: '#ef4444', 'font-size': '8', 'font-family': 'monospace' },
        'Z+',
      ),
    ),
  )
}

/**
 * Renders the High-Resolution Polarized Emission Spectrograph.
 */
function renderSpectrograph(
  lines: TransitionLine[],
  selectedLine: TransitionLine | null,
  preset: ZeemanStarkPreset,
): VNode {
  const width = 640
  const height = 90
  const centerNm = preset.nominalWavelengthNm
  const spanNm = 0.08 // window span in nm

  return H(
    'div',
    { class: 'rounded-xl border border-white/10 bg-[#080c14] p-3' },
    H(
      'div',
      { class: 'mb-1.5 flex items-center justify-between font-mono text-[10px]' },
      H(
        'div',
        { class: 'flex items-center gap-3' },
        H('span', { class: 'text-zinc-400 font-semibold' }, 'Polarized Spectrogram:'),
        H(
          'span',
          { class: 'flex items-center gap-1 text-emerald-400' },
          H('span', { class: 'inline-block h-1.5 w-1.5 rounded-full bg-emerald-400' }),
          'π (Δm=0)',
        ),
        H(
          'span',
          { class: 'flex items-center gap-1 text-amber-400' },
          H('span', { class: 'inline-block h-1.5 w-1.5 rounded-full bg-amber-400' }),
          'σ+ (Δm=+1)',
        ),
        H(
          'span',
          { class: 'flex items-center gap-1 text-cyan-400' },
          H('span', { class: 'inline-block h-1.5 w-1.5 rounded-full bg-cyan-400' }),
          'σ- (Δm=-1)',
        ),
      ),
      H(
        'span',
        { class: 'text-zinc-500' },
        `${lines.length} transitions visible`,
      ),
    ),

    H(
      'svg',
      {
        viewBox: `0 0 ${width} ${height}`,
        class: 'w-full h-auto rounded border border-white/5 bg-[#05070d]',
      },
      // Center reference line
      H('line', {
        x1: width / 2,
        y1: 0,
        x2: width / 2,
        y2: height,
        stroke: '#27272a',
        'stroke-dasharray': '2,2',
      }),
      H(
        'text',
        { x: width / 2 + 4, y: 12, fill: '#52525b', 'font-size': '8', 'font-family': 'monospace' },
        `λ0 = ${centerNm.toFixed(3)} nm`,
      ),

      // Transition spectral peaks
      ...lines.map((l) => {
        const deltaNm = l.wavelengthNm - centerNm
        const x = width / 2 + (deltaNm / spanNm) * (width * 0.45)
        const isSelected = selectedLine?.id === l.id

        const color =
          l.polarization === 'pi'
            ? '#10b981'
            : l.polarization === 'sigma_plus'
              ? '#f59e0b'
              : '#06b6d4'

        return H(
          'g',
          {
            key: `spec-${l.id}`,
            style: { cursor: 'pointer' },
            onclick: () => {
              zeemanStarkState.selectedLineId = l.id
            },
          },
          H('line', {
            x1: x,
            y1: height - 6,
            x2: x,
            y2: isSelected ? 15 : 25,
            stroke: color,
            'stroke-width': isSelected ? 2.5 : 1.5,
            opacity: isSelected ? 1.0 : 0.75,
          }),
          isSelected
            ? H('polygon', {
                points: `${x - 3},10 ${x + 3},10 ${x},15`,
                fill: color,
              })
            : null,
        )
      }),
    ),
  )
}

/**
 * Renders the Right-hand Detailed Physics Inspector Card.
 */
function renderPhysicsInspector(
  preset: ZeemanStarkPreset,
  selectedLine: TransitionLine | null,
  upperStates: QuantumState[],
  lowerStates: QuantumState[],
): VNode {
  return H(
    'div',
    { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
    H(
      'h3',
      { class: 'mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-300' },
      'Quantum Transition Inspector',
    ),

    selectedLine
      ? H(
          'dl',
          { class: 'grid grid-cols-2 gap-x-2 gap-y-2 font-mono text-[11px]' },
          H('dt', { class: 'text-zinc-500' }, 'Transition:'),
          H('dd', { class: 'text-right font-semibold text-zinc-100' }, selectedLine.id),

          H('dt', { class: 'text-zinc-500' }, 'Polarization:'),
          H(
            'dd',
            {
              class: `text-right font-bold ${
                selectedLine.polarization === 'pi'
                  ? 'text-emerald-400'
                  : selectedLine.polarization === 'sigma_plus'
                    ? 'text-amber-400'
                    : 'text-cyan-400'
              }`,
            },
            selectedLine.polarization === 'pi'
              ? 'π (Parallel E || B)'
              : selectedLine.polarization === 'sigma_plus'
                ? 'σ+ (Circular right)'
                : 'σ- (Circular left)',
          ),

          H('dt', { class: 'text-zinc-500' }, 'Wavelength λ:'),
          H('dd', { class: 'text-right text-zinc-200' }, `${selectedLine.wavelengthNm.toFixed(4)} nm`),

          H('dt', { class: 'text-zinc-500' }, 'Frequency Shift:'),
          H('dd', { class: 'text-right text-cyan-300 font-semibold' }, `${selectedLine.shiftGhz.toFixed(2)} GHz`),

          H('dt', { class: 'text-zinc-500' }, 'Energy Shift ΔE:'),
          H(
            'dd',
            { class: 'text-right text-amber-300' },
            `${(selectedLine.shiftEV * 1e3).toFixed(3)} meV`,
          ),

          H('dt', { class: 'text-zinc-500' }, 'Upper Landé g:'),
          H('dd', { class: 'text-right text-zinc-300' }, selectedLine.upperState.landeG.toFixed(3)),

          H('dt', { class: 'text-zinc-500' }, 'Lower Landé g:'),
          H('dd', { class: 'text-right text-zinc-300' }, selectedLine.lowerState.landeG.toFixed(3)),
        )
      : H('p', { class: 'text-[11px] text-zinc-500' }, 'No transition line selected.'),
  )
}

/**
 * Renders the Theoretical Selection Rules card.
 */
function renderSelectionRulesCard(): VNode {
  return H(
    'div',
    { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4 text-[10.5px] leading-relaxed text-zinc-400' },
    H(
      'h3',
      { class: 'mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300' },
      'Dipole Selection Rules',
    ),
    H('ul', { class: 'space-y-1.5 list-disc pl-4 font-mono text-[10px]' },
      H('li', null, H('span', { class: 'text-zinc-200' }, 'Δl = ±1'), ' — Parity inversion'),
      H('li', null, H('span', { class: 'text-zinc-200' }, 'Δj = 0, ±1'), ' (0 → 0 forbidden)'),
      H('li', null, H('span', { class: 'text-emerald-300' }, 'Δm_j = 0'), ' → π line (E || B)'),
      H('li', null, H('span', { class: 'text-cyan-300' }, 'Δm_j = ±1'), ' → σ± line (E ⊥ B)'),
    ),
    H(
      'p',
      { class: 'mt-3 border-t border-white/5 pt-2 text-[9.5px] text-zinc-500' },
      'Lorentz classical theory predicts 3 lines (normal triplet). Quantum mechanics with electron spin S=1/2 predicts anomalous splitting due to Landé factor g_J ≠ 1.',
    ),
  )
}
