import { h, type VNode } from 'nexus-framework'
import {
  formatTemp,
  getPhaseCountsAtTemperature,
  kelvinToSlider,
  kelvinToUnit,
  sliderToKelvin,
  TEMP_PRESETS,
  tempToKelvin,
  type SimulatedPhase,
  type TempPreset,
  type TempUnit,
} from '@/lib/periodic/temperature'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

interface TemperatureBarProps {
  tempK: number
  unit: TempUnit
  isPlaying: boolean
  playDirection: 1 | -1
  playSpeed: number
  activePhaseFilter: SimulatedPhase | null
  onTempChange: (tempK: number) => void
  onUnitChange: (unit: TempUnit) => void
  onTogglePlay: (direction?: 1 | -1) => void
  onSpeedChange: (speed: number) => void
  onPhaseFilterChange: (phase: SimulatedPhase | null) => void
  onReset: () => void
}

export default function TemperatureBar({
  tempK,
  unit,
  isPlaying,
  playDirection,
  playSpeed,
  activePhaseFilter,
  onTempChange,
  onUnitChange,
  onTogglePlay,
  onSpeedChange,
  onPhaseFilterChange,
  onReset,
}: TemperatureBarProps): VNode {
  const counts = getPhaseCountsAtTemperature(tempK)
  const sliderVal = kelvinToSlider(tempK)

  const currentUnitVal = kelvinToUnit(tempK, unit)
  const isSTP = Math.abs(tempK - 298.15) < 0.1

  const phaseChips: Array<{ key: SimulatedPhase; label: string; count: number; colorClass: string; activeClass: string; icon: string }> = [
    {
      key: 'solid',
      label: 'Solids',
      count: counts.solid,
      colorClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20',
      activeClass: 'border-amber-400 bg-amber-500/30 ring-1 ring-amber-400 text-amber-200',
      icon: '❄️',
    },
    {
      key: 'liquid',
      label: 'Liquids',
      count: counts.liquid,
      colorClass: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20',
      activeClass: 'border-cyan-300 bg-cyan-400/30 ring-1 ring-cyan-300 text-cyan-100',
      icon: '💧',
    },
    {
      key: 'gas',
      label: 'Gases',
      count: counts.gas,
      colorClass: 'text-purple-300 border-purple-400/30 bg-purple-400/10 hover:bg-purple-400/20',
      activeClass: 'border-purple-300 bg-purple-400/30 ring-1 ring-purple-300 text-purple-100',
      icon: '☁️',
    },
  ]

  if (counts.superfluid > 0) {
    phaseChips.push({
      key: 'superfluid',
      label: 'Superfluids',
      count: counts.superfluid,
      colorClass: 'text-pink-300 border-pink-400/30 bg-pink-400/10 hover:bg-pink-400/20 animate-pulse',
      activeClass: 'border-pink-300 bg-pink-400/30 ring-1 ring-pink-300 text-pink-100',
      icon: '🌀',
    })
  }

  if (counts.plasma > 0) {
    phaseChips.push({
      key: 'plasma',
      label: 'Plasma',
      count: counts.plasma,
      colorClass: 'text-rose-300 border-rose-400/30 bg-rose-400/10 hover:bg-rose-400/20 animate-pulse',
      activeClass: 'border-rose-300 bg-rose-400/30 ring-1 ring-rose-300 text-rose-100',
      icon: '⚡',
    })
  }

  phaseChips.push({
    key: 'unknown',
    label: 'Unknown',
    count: counts.unknown,
    colorClass: 'text-zinc-400 border-white/10 bg-white/[0.03] hover:bg-white/[0.08]',
    activeClass: 'border-zinc-300 bg-white/[0.15] text-zinc-100',
    icon: '?',
  })

  // Quick milestones
  const prominentPresets: TempPreset[] = [
    TEMP_PRESETS[0], // 0 K
    TEMP_PRESETS[1], // 2.17 K (He Lambda)
    TEMP_PRESETS[3], // 77.4 K (Liq N2)
    TEMP_PRESETS[5], // 273.15 K (0 °C)
    TEMP_PRESETS[6], // 298.15 K (STP)
    TEMP_PRESETS[7], // 302.9 K (Gallium)
    TEMP_PRESETS[8], // 373.15 K (100 °C)
    TEMP_PRESETS[10], // 1811 K (Iron)
    TEMP_PRESETS[11], // 3695 K (Tungsten)
    TEMP_PRESETS[13], // 5778 K (Sun)
  ]

  return H('section', {
    class: 'mb-4 w-full max-w-[1240px] rounded-xl border border-white/10 bg-[#0a0f18]/90 p-3.5 shadow-xl backdrop-blur-md',
    'aria-label': 'Real-Time Temperature & State of Matter Simulator',
  },
    // Top Row: Title, Temperature Readout & Unit Selector, Phase Tallies
    H('div', { class: 'flex flex-wrap items-center justify-between gap-3' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-400/10 text-sm' }, '🌡️'),
        H('div', null,
          H('div', { class: 'flex items-center gap-2' },
            H('h2', { class: 'text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-100' }, 'State of Matter Simulator'),
            isSTP ? H('span', { class: 'rounded-full border border-emerald-400/40 bg-emerald-400/10 px-1.5 py-0.2 text-[8.5px] font-medium text-emerald-300' }, 'STP (25°C)') : null,
          ),
          H('p', { class: 'text-[9.5px] text-zinc-500' }, 'Real-time phase transitions at 1 atm · Click phase badges to filter elements'),
        ),
      ),

      // Temperature Readout & Units
      H('div', { class: 'flex items-center gap-2' },
        H('div', { class: 'flex items-baseline gap-1.5 rounded-lg border border-white/15 bg-[#070b12] px-3 py-1 font-mono' },
          H('span', { class: 'text-base font-extrabold tracking-tight text-amber-300' }, formatTemp(tempK, unit, 1)),
          unit !== 'K' ? H('span', { class: 'text-[10px] text-zinc-500' }, `(${tempK.toFixed(1)} K)`) : null,
        ),
        H('div', { class: 'flex rounded-md border border-white/10 bg-[#070b12] p-0.5 text-[10px] font-medium' },
          (['K', 'C', 'F'] as TempUnit[]).map((u) => H('button', {
            key: u,
            type: 'button',
            onClick: () => onUnitChange(u),
            class: `px-2 py-0.5 rounded transition ${unit === u ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40' : 'text-zinc-400 hover:text-zinc-200'}`,
            title: u === 'K' ? 'Kelvin (SI base unit)' : u === 'C' ? 'Celsius (°C)' : 'Fahrenheit (°F)',
          }, u === 'K' ? 'K' : `°${u}`)),
        ),
      ),

      // Phase Counts / Filters
      H('div', { class: 'flex flex-wrap items-center gap-1.5' },
        ...phaseChips.map((chip) => {
          const isActive = activePhaseFilter === chip.key
          return H('button', {
            key: chip.key,
            type: 'button',
            onClick: () => onPhaseFilterChange(isActive ? null : chip.key),
            class: `flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${isActive ? chip.activeClass : chip.colorClass}`,
            title: `Filter elements in ${chip.label} state at ${formatTemp(tempK, unit)} (Click to toggle)`,
          },
            H('span', { class: 'text-xs leading-none' }, chip.icon),
            H('span', null, `${chip.count} ${chip.label}`),
            isActive ? H('span', { class: 'ml-0.5 text-[9px] opacity-75' }, '✕') : null,
          )
        }),
      ),
    ),

    // Middle Row: Slider Track with Milestones
    H('div', { class: 'mt-3 space-y-1.5' },
      H('div', { class: 'relative flex items-center' },
        H('input', {
          type: 'range',
          min: '0',
          max: '1000',
          value: String(sliderVal),
          onInput: (event: Event) => {
            const rawVal = Number((event.target as HTMLInputElement).value)
            const k = sliderToKelvin(rawVal)
            onTempChange(k)
          },
          class: 'h-2 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-sky-500/40 via-amber-500/50 to-rose-600/60 accent-amber-400 focus:outline-none',
          'aria-label': 'Adjust temperature from 0 K to 6000 K',
        }),
      ),

      // Milestone Markers under the track
      H('div', { class: 'hidden sm:flex justify-between px-1 text-[8.5px] font-mono text-zinc-500' },
        H('span', { class: 'cursor-pointer hover:text-cyan-300', onClick: () => onTempChange(0) }, '0 K (Abs Zero)'),
        H('span', { class: 'cursor-pointer hover:text-cyan-300', onClick: () => onTempChange(77.36) }, '77.4 K (Liq N₂)'),
        H('span', { class: 'cursor-pointer hover:text-amber-300', onClick: () => onTempChange(273.15) }, '273 K (0°C)'),
        H('span', { class: 'cursor-pointer font-bold text-emerald-400 hover:text-emerald-300', onClick: () => onTempChange(298.15) }, '298 K (STP)'),
        H('span', { class: 'cursor-pointer hover:text-amber-300', onClick: () => onTempChange(373.15) }, '373 K (100°C)'),
        H('span', { class: 'cursor-pointer hover:text-rose-400', onClick: () => onTempChange(1811) }, '1,811 K (Fe melt)'),
        H('span', { class: 'cursor-pointer hover:text-rose-400', onClick: () => onTempChange(3695) }, '3,695 K (W melt)'),
        H('span', { class: 'cursor-pointer hover:text-rose-400', onClick: () => onTempChange(5778) }, '5,778 K (Sun)'),
      ),
    ),

    // Bottom Row: Playback Controls, Step Buttons, and Preset Pills
    H('div', { class: 'mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5' },
      // Play / Pause / Step Controls
      H('div', { class: 'flex items-center gap-1.5' },
        H('button', {
          type: 'button',
          onClick: () => onTogglePlay(isPlaying ? undefined : 1),
          class: `flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10.5px] font-semibold transition ${isPlaying && playDirection === 1 ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/10'}`,
          title: isPlaying ? 'Pause thermal animation' : 'Animate heating from current temperature',
        }, isPlaying && playDirection === 1 ? '⏸ Pause' : '▶ Heat Up'),

        H('button', {
          type: 'button',
          onClick: () => onTogglePlay(isPlaying ? undefined : -1),
          class: `flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-semibold transition ${isPlaying && playDirection === -1 ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300' : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10'}`,
          title: 'Animate cooling down towards Absolute Zero',
        }, '◀ Cool Down'),

        H('div', { class: 'h-4 w-px bg-white/10 mx-0.5' }),

        H('button', {
          type: 'button',
          onClick: () => onTempChange(Math.max(0, tempK - 10)),
          class: 'rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] font-mono text-zinc-300 hover:bg-white/10',
          title: 'Step down 10 Kelvin',
        }, '−10 K'),

        H('button', {
          type: 'button',
          onClick: () => onTempChange(Math.min(6000, tempK + 10)),
          class: 'rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] font-mono text-zinc-300 hover:bg-white/10',
          title: 'Step up 10 Kelvin',
        }, '+10 K'),

        H('button', {
          type: 'button',
          onClick: () => onTempChange(Math.max(0, tempK - 100)),
          class: 'rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] font-mono text-zinc-300 hover:bg-white/10',
          title: 'Step down 100 Kelvin',
        }, '−100 K'),

        H('button', {
          type: 'button',
          onClick: () => onTempChange(Math.min(6000, tempK + 100)),
          class: 'rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] font-mono text-zinc-300 hover:bg-white/10',
          title: 'Step up 100 Kelvin',
        }, '+100 K'),

        // Speed Multiplier
        H('select', {
          value: String(playSpeed),
          onChange: (event: Event) => onSpeedChange(Number((event.target as HTMLSelectElement).value)),
          class: 'ml-1 rounded border border-white/10 bg-[#080d16] px-1.5 py-0.5 text-[9.5px] font-mono text-zinc-400 focus:outline-none',
          title: 'Simulation heating/cooling animation rate',
        },
          H('option', { value: '1' }, '1× speed'),
          H('option', { value: '3' }, '3× speed'),
          H('option', { value: '10' }, '10× speed'),
          H('option', { value: '25' }, '25× speed'),
        ),

        !isSTP ? H('button', {
          type: 'button',
          onClick: onReset,
          class: 'ml-1 rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9.5px] font-medium text-emerald-300 hover:bg-emerald-400/20',
          title: 'Reset temperature to 298.15 K (STP room temperature)',
        }, 'Reset STP') : null,
      ),

      // Quick Milestone Presets
      H('div', { class: 'flex flex-wrap items-center gap-1' },
        H('span', { class: 'text-[9.5px] font-medium text-zinc-500 mr-1' }, 'Presets:'),
        ...prominentPresets.map((p) => {
          const isSelected = Math.abs(tempK - p.tempK) < 0.1
          return H('button', {
            key: p.label,
            type: 'button',
            onClick: () => onTempChange(p.tempK),
            class: `rounded-md border px-2 py-0.5 text-[9.5px] transition ${isSelected ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold' : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'}`,
            title: p.description,
          }, p.label)
        }),
      ),
    ),
  ) as VNode
}
