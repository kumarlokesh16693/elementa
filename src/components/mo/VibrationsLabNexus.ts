/**
 * Molecular Vibrations & Normal Modes Interactive Laboratory
 *
 * Implemented using pure nexus-framework h() virtual DOM and reactive state.
 * Interfaces with <elementa-vibration-view> WebGL custom element.
 *
 * Zero third-party UI libraries, 100% native nexus-framework.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import {
  VIBRATIONAL_MOLECULES,
  generateFtIrSpectrum,
  generateRamanSpectrum,
  type NormalMode,
  type VibrationalMolecule,
} from '@/lib/periodic/vibrations'
import '@/components/mo/vibration-element'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export interface VibrationsLabState {
  moleculeId: string
  modeIndex: number
  amplitude: number
  speed: number
  isPaused: boolean
  showVectors: boolean
  style: 'ball-stick' | 'space-filling'
  spectrumType: 'ftir' | 'raman'
  hoveredModeId: number | null
}

export const vibState = reactive<VibrationsLabState>({
  moleculeId: 'h2o',
  modeIndex: 0,
  amplitude: 1.0,
  speed: 1.0,
  isPaused: false,
  showVectors: true,
  style: 'ball-stick',
  spectrumType: 'ftir',
  hoveredModeId: null,
})

export function VibrationsLabNexus(): VNode {
  const currentMol: VibrationalMolecule =
    VIBRATIONAL_MOLECULES[vibState.moleculeId] || VIBRATIONAL_MOLECULES.h2o
  const currentMode: NormalMode = currentMol.modes[vibState.modeIndex] || currentMol.modes[0]

  return H(
    'div',
    { class: 'flex flex-col gap-5' },

    // Header Molecule Picker Ribbon
    H(
      'div',
      { class: 'rounded-xl border border-white/10 bg-[#0d1322] p-3' },
      H(
        'div',
        { class: 'flex flex-wrap items-center justify-between gap-3' },
        H(
          'div',
          { class: 'flex flex-wrap items-center gap-2' },
          H('span', { class: 'font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400' }, 'Molecule:'),
          ...Object.values(VIBRATIONAL_MOLECULES).map((mol) => {
            const isSelected = mol.id === vibState.moleculeId
            return H(
              'button',
              {
                type: 'button',
                onClick: () => {
                  vibState.moleculeId = mol.id
                  vibState.modeIndex = 0
                },
                class: `flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition ${
                  isSelected
                    ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 ring-1 ring-amber-300'
                    : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08]'
                }`,
              },
              H('span', { class: 'text-sm' }, mol.formula),
              H('span', { class: `text-[10px] ${isSelected ? 'text-zinc-800' : 'text-zinc-500'}` }, `(${mol.pointGroup})`),
            )
          }),
        ),
        H(
          'div',
          { class: 'flex items-center gap-2 text-xs font-mono text-zinc-400' },
          H(
            'span',
            {
              class: `rounded px-2 py-0.5 text-[11px] font-semibold ${
                currentMol.hasInversionCenter
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border border-zinc-700 bg-zinc-800/50 text-zinc-400'
              }`,
            },
            currentMol.hasInversionCenter ? 'Center of Inversion (Ci) · Mutual Exclusion' : 'Non-Centrosymmetric',
          ),
          H(
            'span',
            { class: 'rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300' },
            `3N - ${currentMol.isLinear ? '5' : '6'} = ${currentMol.degreesOfFreedom} Modes`,
          ),
        ),
      ),
    ),

    // Main 2-Column Lab Layout
    H(
      'div',
      { class: 'grid grid-cols-1 gap-5 lg:grid-cols-12' },

      // Left Column: 3D Animated WebGL Visualizer (7 cols)
      H(
        'div',
        { class: 'flex flex-col gap-4 lg:col-span-7' },

        // 3D Canvas Card
        H(
          'div',
          { class: 'relative overflow-hidden rounded-xl border border-white/10 bg-[#060911] shadow-2xl' },

          // Custom WebGL Element
          H('elementa-vibration-view', {
            class: 'block h-[440px] w-full cursor-grab active:cursor-grabbing',
            'data-molecule': vibState.moleculeId,
            'data-mode': String(vibState.modeIndex),
            'data-amplitude': String(vibState.amplitude),
            'data-speed': String(vibState.speed),
            'data-paused': vibState.isPaused ? '1' : '0',
            'data-show-vectors': vibState.showVectors ? '1' : '0',
            'data-style': vibState.style,
          }),

          // Top Overlay Badges
          H(
            'div',
            { class: 'pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2 font-mono text-xs' },
            H(
              'span',
              { class: 'rounded-md border border-amber-400/40 bg-zinc-950/80 px-2.5 py-1 font-bold text-amber-300 backdrop-blur' },
              `Mode ${currentMode.id}: ${currentMode.symmetry}`,
            ),
            H(
              'span',
              { class: 'rounded-md border border-white/10 bg-zinc-950/80 px-2.5 py-1 text-zinc-300 backdrop-blur' },
              `${currentMode.frequency} cm⁻¹ (${(10000 / currentMode.frequency).toFixed(2)} µm)`,
            ),
            currentMode.irActive
              ? H('span', { class: 'rounded-md border border-emerald-500/40 bg-emerald-950/80 px-2 py-1 text-emerald-300' }, 'IR Active')
              : H('span', { class: 'rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-zinc-500' }, 'IR Inactive'),
            currentMode.ramanActive
              ? H('span', { class: 'rounded-md border border-purple-500/40 bg-purple-950/80 px-2 py-1 text-purple-300' }, 'Raman Active')
              : H('span', { class: 'rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-zinc-500' }, 'Raman Inactive'),
          ),

          // Bottom Left Helper
          H(
            'div',
            { class: 'pointer-events-none absolute bottom-3 left-3 rounded-md bg-zinc-950/80 px-2 py-1 font-mono text-[10px] text-zinc-400 backdrop-blur' },
            'Drag to rotate · Scroll to zoom · Cyan arrows: mode displacement vectors e_i',
          ),
        ),

        // 3D Controls Bar
        H(
          'div',
          { class: 'flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0d1322] p-3' },

          // Play/Pause & Vectors
          H(
            'div',
            { class: 'flex items-center gap-2' },
            H(
              'button',
              {
                type: 'button',
                onClick: () => {
                  vibState.isPaused = !vibState.isPaused
                },
                class: `flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                  vibState.isPaused
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
                }`,
              },
              vibState.isPaused ? '▶ Resume' : '⏸ Pause',
            ),
            H(
              'button',
              {
                type: 'button',
                onClick: () => {
                  vibState.showVectors = !vibState.showVectors
                },
                class: `flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                  vibState.showVectors
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                    : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:text-zinc-200'
                }`,
              },
              vibState.showVectors ? 'Vector Arrows: ON' : 'Vector Arrows: OFF',
            ),
            H(
              'button',
              {
                type: 'button',
                onClick: () => {
                  vibState.style = vibState.style === 'ball-stick' ? 'space-filling' : 'ball-stick'
                },
                class: 'rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-zinc-300 transition hover:bg-white/[0.08]',
              },
              vibState.style === 'ball-stick' ? 'Ball & Stick' : 'Space Filling',
            ),
          ),

          // Sliders: Amplitude & Speed
          H(
            'div',
            { class: 'flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400' },
            H(
              'label',
              { class: 'flex items-center gap-2' },
              H('span', null, `Amp: ${vibState.amplitude.toFixed(1)}×`),
              H('input', {
                type: 'range',
                min: '0.2',
                max: '2.5',
                step: '0.1',
                value: String(vibState.amplitude),
                onInput: (e: Event) => {
                  vibState.amplitude = parseFloat((e.target as HTMLInputElement).value)
                },
                class: 'h-1.5 w-20 cursor-pointer accent-amber-400',
              }),
            ),
            H(
              'label',
              { class: 'flex items-center gap-2' },
              H('span', null, `Speed: ${vibState.speed.toFixed(1)}×`),
              H('input', {
                type: 'range',
                min: '0.2',
                max: '2.5',
                step: '0.1',
                value: String(vibState.speed),
                onInput: (e: Event) => {
                  vibState.speed = parseFloat((e.target as HTMLInputElement).value)
                },
                class: 'h-1.5 w-20 cursor-pointer accent-sky-400',
              }),
            ),
          ),
        ),

        // Selected Mode Detail Card
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0d1322] p-4 font-mono text-xs' },
          H(
            'div',
            { class: 'flex items-center justify-between border-b border-white/10 pb-2' },
            H('span', { class: 'font-bold text-zinc-200' }, `Mode ${currentMode.id}: ${currentMode.description}`),
            H('span', { class: 'text-amber-400' }, `${currentMode.frequency} cm⁻¹`),
          ),
          H(
            'div',
            { class: 'mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center' },
            H(
              'div',
              { class: 'rounded-lg border border-white/5 bg-white/[0.02] p-2' },
              H('div', { class: 'text-[10px] text-zinc-500 uppercase' }, 'Symmetry'),
              H('div', { class: 'mt-0.5 text-sm font-bold text-sky-400' }, currentMode.symmetry),
            ),
            H(
              'div',
              { class: 'rounded-lg border border-white/5 bg-white/[0.02] p-2' },
              H('div', { class: 'text-[10px] text-zinc-500 uppercase' }, 'Wavelength'),
              H('div', { class: 'mt-0.5 text-sm font-bold text-amber-300' }, `${(10000 / currentMode.frequency).toFixed(2)} µm`),
            ),
            H(
              'div',
              { class: 'rounded-lg border border-white/5 bg-white/[0.02] p-2' },
              H('div', { class: 'text-[10px] text-zinc-500 uppercase' }, 'IR Activity'),
              H(
                'div',
                { class: `mt-0.5 text-sm font-bold ${currentMode.irActive ? 'text-emerald-400' : 'text-zinc-600'}` },
                currentMode.irActive ? `${currentMode.irIntensity}%` : 'Forbidden',
              ),
            ),
            H(
              'div',
              { class: 'rounded-lg border border-white/5 bg-white/[0.02] p-2' },
              H('div', { class: 'text-[10px] text-zinc-500 uppercase' }, 'Raman Activity'),
              H(
                'div',
                { class: `mt-0.5 text-sm font-bold ${currentMode.ramanActive ? 'text-purple-400' : 'text-zinc-600'}` },
                currentMode.ramanActive ? `${currentMode.ramanIntensity}% (ρ=${currentMode.depolarizationRatio})` : 'Forbidden',
              ),
            ),
          ),
          currentMol.greenhouseEffect
            ? H(
                'div',
                { class: 'mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200/90' },
                H('span', { class: 'font-bold text-amber-400' }, '🌍 Atmospheric & Climate Note: '),
                currentMol.greenhouseEffect,
              )
            : null,
        ),
      ),

      // Right Column: Simulated Spectrometer & Normal Modes Table (5 cols)
      H(
        'div',
        { class: 'flex flex-col gap-4 lg:col-span-5' },

        // Spectrometer Card
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0d1322] p-4' },
          // Header with FTIR / Raman toggle
          H(
            'div',
            { class: 'flex items-center justify-between pb-3' },
            H('h2', { class: 'font-mono text-xs font-bold tracking-wider text-zinc-200 uppercase' }, 'Simulated Spectrometer'),
            H(
              'div',
              { class: 'flex rounded-md border border-white/10 bg-[#080c14] p-0.5' },
              H(
                'button',
                {
                  type: 'button',
                  onClick: () => {
                    vibState.spectrumType = 'ftir'
                  },
                  class: `rounded px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
                    vibState.spectrumType === 'ftir'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`,
                },
                'FTIR (%T)',
              ),
              H(
                'button',
                {
                  type: 'button',
                  onClick: () => {
                    vibState.spectrumType = 'raman'
                  },
                  class: `rounded px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
                    vibState.spectrumType === 'raman'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`,
                },
                'Raman',
              ),
            ),
          ),

          // Interactive SVG Spectrum
          renderSpectrumSvg(currentMol),

          // Spectrum caption
          H(
            'div',
            { class: 'mt-2 flex items-center justify-between font-mono text-[10px] text-zinc-500' },
            H(
              'span',
              null,
              vibState.spectrumType === 'ftir'
                ? 'Standard FTIR: Wavenumber inverted (4000 → 400 cm⁻¹), downward absorption dips'
                : 'Raman Shift (0 → 4000 cm⁻¹), upright inelastic scattering peaks',
            ),
            H('span', { class: 'text-amber-400/80' }, 'Click peak marker to animate'),
          ),
        ),

        // Normal Modes Table Card
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0d1322] p-4' },
          H(
            'div',
            { class: 'flex items-center justify-between pb-3' },
            H('h2', { class: 'font-mono text-xs font-bold tracking-wider text-zinc-200 uppercase' }, 'Normal Modes Matrix'),
            H('span', { class: 'font-mono text-[10px] text-zinc-500' }, `${currentMol.modes.length} fundamental frequencies`),
          ),

          // Table
          H(
            'div',
            { class: 'max-h-72 overflow-y-auto rounded-lg border border-white/5' },
            H(
              'table',
              { class: 'w-full text-left font-mono text-xs' },
              H(
                'thead',
                { class: 'sticky top-0 bg-[#080d17] text-[10px] uppercase tracking-wider text-zinc-500' },
                H(
                  'tr',
                  null,
                  H('th', { class: 'px-2.5 py-2' }, '#'),
                  H('th', { class: 'px-2 py-2' }, 'Sym'),
                  H('th', { class: 'px-2 py-2 text-right' }, 'Wavenumber'),
                  H('th', { class: 'px-2.5 py-2 text-center' }, 'IR'),
                  H('th', { class: 'px-2.5 py-2 text-center' }, 'Raman'),
                  H('th', { class: 'px-2 py-2 text-right' }, 'Action'),
                ),
              ),
              H(
                'tbody',
                { class: 'divide-y divide-white/5 bg-[#0a101d]' },
                ...currentMol.modes.map((mode, idx) => {
                  const isCurrent = idx === vibState.modeIndex
                  return H(
                    'tr',
                    {
                      class: `cursor-pointer transition ${
                        isCurrent
                          ? 'bg-amber-400/10 text-amber-200'
                          : 'text-zinc-300 hover:bg-white/[0.04]'
                      }`,
                      onClick: () => {
                        vibState.modeIndex = idx
                      },
                    },
                    H('td', { class: 'px-2.5 py-2 font-bold' }, `ν${mode.id}`),
                    H('td', { class: 'px-2 py-2 text-sky-400' }, mode.symmetry),
                    H('td', { class: 'px-2 py-2 text-right font-semibold' }, `${mode.frequency} cm⁻¹`),
                    H(
                      'td',
                      { class: 'px-2.5 py-2 text-center' },
                      mode.irActive
                        ? H('span', { class: 'text-emerald-400 font-bold' }, '●')
                        : H('span', { class: 'text-zinc-600' }, '○'),
                    ),
                    H(
                      'td',
                      { class: 'px-2.5 py-2 text-center' },
                      mode.ramanActive
                        ? H('span', { class: 'text-purple-400 font-bold' }, '●')
                        : H('span', { class: 'text-zinc-600' }, '○'),
                    ),
                    H(
                      'td',
                      { class: 'px-2 py-2 text-right' },
                      H(
                        'button',
                        {
                          type: 'button',
                          onClick: (e: Event) => {
                            e.stopPropagation()
                            vibState.modeIndex = idx
                          },
                          class: `rounded px-2 py-0.5 text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-amber-400 text-zinc-950'
                              : 'border border-white/10 bg-white/[0.05] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200'
                          }`,
                        },
                        isCurrent ? 'Active' : 'Animate',
                      ),
                    ),
                  )
                }),
              ),
            ),
          ),
        ),

        // Physical Theory & Selection Rules Card
        H(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0d1322] p-4 text-xs font-mono leading-relaxed text-zinc-400' },
          H('div', { class: 'font-bold uppercase tracking-wider text-zinc-300 mb-1' }, 'Spectroscopic Selection Rules'),
          H(
            'ul',
            { class: 'space-y-1.5 list-disc list-inside text-[11px]' },
            H(
              'li',
              null,
              H('span', { class: 'text-emerald-300 font-semibold' }, 'Infrared Activity: '),
              'Dipole moment must change during normal coordinate vibration (dμ/dQ ≠ 0).',
            ),
            H(
              'li',
              null,
              H('span', { class: 'text-purple-300 font-semibold' }, 'Raman Activity: '),
              'Molecular polarizability ellipsoid must distort during vibration (dα/dQ ≠ 0).',
            ),
            H(
              'li',
              null,
              H('span', { class: 'text-amber-300 font-semibold' }, 'Rule of Mutual Exclusion: '),
              'For molecules with an inversion center (Ci), normal modes cannot be simultaneously IR and Raman active.',
            ),
          ),
        ),
      ),
    ),
  )
}

/**
 * Renders an interactive SVG spectrometer curve with lorentzian peaks and clickable peak markers.
 */
function renderSpectrumSvg(mol: VibrationalMolecule): VNode {
  const isFtir = vibState.spectrumType === 'ftir'
  const W = 460
  const H_PX = 180
  const PAD_L = 38
  const PAD_R = 15
  const PAD_T = 20
  const PAD_B = 25

  const minWn = 400
  const maxWn = 4000
  const stepWn = 8

  const points = isFtir
    ? generateFtIrSpectrum(mol.modes, minWn, maxWn, stepWn)
    : generateRamanSpectrum(mol.modes, minWn, maxWn, stepWn)

  // Map wavenumber to SVG X (In FTIR standard, X is inverted: 4000 on left, 400 on right)
  const mapX = (wn: number) => {
    if (isFtir) {
      // Inverted: wn = maxWn => x = PAD_L, wn = minWn => x = W - PAD_R
      return PAD_L + ((maxWn - wn) / (maxWn - minWn)) * (W - PAD_L - PAD_R)
    } else {
      // Regular: wn = minWn => x = PAD_L, wn = maxWn => x = W - PAD_L - PAD_R
      return PAD_L + ((wn - minWn) / (maxWn - minWn)) * (W - PAD_L - PAD_R)
    }
  }

  // Map intensity to SVG Y (0% to 100%)
  const mapY = (val: number) => {
    return PAD_T + (1 - val / 100) * (H_PX - PAD_T - PAD_B)
  }

  // Build SVG polyline path
  let pathD = ''
  points.forEach((p, i) => {
    const x = mapX(p.wavenumber)
    const y = mapY(p.intensity)
    pathD += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  })

  // Relevant modes for markers
  const activeModes = mol.modes.filter((m) => (isFtir ? m.irActive : m.ramanActive))

  return H(
    'svg',
    {
      viewBox: `0 0 ${W} ${H_PX}`,
      class: 'h-auto w-full select-none rounded-lg border border-white/5 bg-[#070b13]',
    },

    // Horizontal gridlines (25%, 50%, 75%, 100%)
    [0, 25, 50, 75, 100].map((pct) => {
      const y = mapY(pct)
      return H(
        'g',
        { key: `grid-${pct}` },
        H('line', {
          x1: PAD_L,
          y1: y,
          x2: W - PAD_R,
          y2: y,
          stroke: 'rgba(255, 255, 255, 0.06)',
          'stroke-dasharray': pct === 0 || pct === 100 ? undefined : '3 3',
        }),
        H(
          'text',
          {
            x: PAD_L - 6,
            y: y + 3,
            'text-anchor': 'end',
            fill: '#71717a',
            'font-size': '8',
            'font-family': 'monospace',
          },
          `${pct}%`,
        ),
      )
    }),

    // Wavenumber grid ticks (500, 1000, 2000, 3000, 4000)
    [500, 1000, 2000, 3000, 4000].map((wn) => {
      const x = mapX(wn)
      return H(
        'g',
        { key: `tick-${wn}` },
        H('line', {
          x1: x,
          y1: PAD_T,
          x2: x,
          y2: H_PX - PAD_B,
          stroke: 'rgba(255, 255, 255, 0.05)',
        }),
        H(
          'text',
          {
            x: x,
            y: H_PX - PAD_B + 14,
            'text-anchor': 'middle',
            fill: '#71717a',
            'font-size': '8.5',
            'font-family': 'monospace',
          },
          String(wn),
        ),
      )
    }),

    // Spectrum trace
    H('path', {
      d: pathD,
      fill: 'none',
      stroke: isFtir ? '#10b981' : '#a855f7',
      'stroke-width': '1.8',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    }),

    // Mode peak indicators
    ...activeModes.map((m) => {
      const x = mapX(m.frequency)
      const modeIdx = mol.modes.indexOf(m)
      const isSelected = modeIdx === vibState.modeIndex

      // In FTIR, peaks dip downwards; in Raman, peaks point upwards
      const yPeak = isFtir ? mapY(Math.max(5, 100 - m.irIntensity * 0.95)) : mapY(m.ramanIntensity)

      return H(
        'g',
        {
          key: `peak-${m.id}`,
          class: 'cursor-pointer transition-transform hover:scale-110',
          onClick: () => {
            vibState.modeIndex = modeIdx
          },
        },
        // Pin line
        H('line', {
          x1: x,
          y1: isFtir ? PAD_T + 5 : H_PX - PAD_B - 5,
          x2: x,
          y2: yPeak,
          stroke: isSelected ? '#fbbf24' : isFtir ? '#10b981' : '#a855f7',
          'stroke-width': isSelected ? '1.5' : '1',
          'stroke-dasharray': '2 2',
        }),
        // Pin circle
        H('circle', {
          cx: x,
          cy: isFtir ? PAD_T + 6 : H_PX - PAD_B - 6,
          r: isSelected ? '4.5' : '3',
          fill: isSelected ? '#fbbf24' : isFtir ? '#10b981' : '#a855f7',
          stroke: '#060911',
          'stroke-width': '1.5',
        }),
        // Pin label
        H(
          'text',
          {
            x: x,
            y: isFtir ? PAD_T - 2 : H_PX - PAD_B + 10,
            'text-anchor': 'middle',
            fill: isSelected ? '#fbbf24' : '#e4e4e7',
            'font-size': '8',
            'font-family': 'monospace',
            'font-weight': isSelected ? 'bold' : 'normal',
          },
          `ν${m.id}`,
        ),
      )
    }),

    // Axis label
    H(
      'text',
      {
        x: W / 2,
        y: H_PX - 2,
        'text-anchor': 'middle',
        fill: '#52525b',
        'font-size': '8',
        'font-family': 'monospace',
      },
      'Wavenumber (cm⁻¹)',
    ),
  )
}
