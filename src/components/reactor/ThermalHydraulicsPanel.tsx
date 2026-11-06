/**
 * Nuclear Thermal-Hydraulics & Electric Turbine Generator Schematic
 * Displays primary loop (RPV -> Steam Generator -> Coolant Pump)
 * and secondary cycle (Steam Turbine -> Generator MWe -> Condenser).
 */

import { h, type VNode } from 'nexus-framework'
import type { ReactorPreset } from '@/lib/reactor/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function ThermalHydraulicsPanel({
  preset,
  thermalPowerMWth,
  electricPowerMWe,
  fuelTempAvgC,
  coolantInC,
  coolantOutC,
  steamPressMPa,
  turbineRpm,
  flowRatePct,
  onFlowRateChange,
}: {
  preset: ReactorPreset
  thermalPowerMWth: number
  electricPowerMWe: number
  fuelTempAvgC: number
  coolantInC: number
  coolantOutC: number
  steamPressMPa: number
  turbineRpm: number
  flowRatePct: number
  onFlowRateChange: (flow: number) => void
}): VNode {
  const thermalEfficiency = thermalPowerMWth > 0 ? (electricPowerMWe / thermalPowerMWth) * 100 : 0

  return H('div', { class: 'flex h-full flex-col gap-3 text-xs' },
    // Flow Rate Controller Strip
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-[#0c1220] p-2.5' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'font-mono text-zinc-400 font-bold text-[11px]' }, 'PRIMARY COOLANT FLOW RATE:'),
        H('input', {
          type: 'range',
          min: '20',
          max: '100',
          step: '5',
          value: String(flowRatePct),
          onInput: (e: any) => onFlowRateChange(parseFloat(e.target.value)),
          oninput: (e: any) => onFlowRateChange(parseFloat(e.target.value)),
          class: 'w-32 accent-sky-400 h-1 bg-zinc-700 rounded cursor-pointer',
        }),
        H('span', { class: 'font-mono text-sky-300 font-bold' }, `${flowRatePct.toFixed(0)}% Nominal`),
      ),
      H('div', { class: 'font-mono text-[11px] text-zinc-400' },
        `Pressure: ${preset.operatingPressureMPa.toFixed(1)} MPa | Efficiency: ${thermalEfficiency.toFixed(1)}%`,
      ),
    ),

    // Schematic Visual Blocks
    H('div', { class: 'grid grid-cols-1 md:grid-cols-3 gap-3 flex-1' },
      // 1. Core Pressure Vessel
      H('div', { class: 'rounded-xl border border-white/10 bg-[#090d16] p-3 flex flex-col justify-between' },
        H('div', null,
          H('div', { class: 'flex items-center justify-between border-b border-white/10 pb-2 mb-2' },
            H('span', { class: 'font-bold text-zinc-200' }, '☢️ Reactor Pressure Vessel (RPV)'),
            H('span', { class: 'rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[9.5px] text-rose-300 font-bold' }, 'PRIMARY LOOP'),
          ),
          H('div', { class: 'space-y-2 font-mono text-[11px]' },
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Core Thermal Output:'),
              H('span', { class: 'text-amber-400 font-bold' }, `${thermalPowerMWth.toFixed(1)} MWth`),
            ),
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Peak Fuel Centerline:'),
              H('span', { class: `${fuelTempAvgC > 1200 ? 'text-rose-400' : 'text-zinc-200'} font-bold` }, `${fuelTempAvgC.toFixed(1)} °C`),
            ),
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Coolant Outlet (Hot Leg):'),
              H('span', { class: 'text-rose-400 font-bold' }, `${coolantOutC.toFixed(1)} °C`),
            ),
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Coolant Inlet (Cold Leg):'),
              H('span', { class: 'text-sky-400 font-bold' }, `${coolantInC.toFixed(1)} °C`),
            ),
          ),
        ),
        H('div', { class: 'mt-2 text-[10px] text-zinc-500 font-mono' },
          `ΔT Core = ${(coolantOutC - coolantInC).toFixed(1)} °C`,
        ),
      ),

      // 2. Steam Generator & Secondary Cycle
      H('div', { class: 'rounded-xl border border-white/10 bg-[#090d16] p-3 flex flex-col justify-between' },
        H('div', null,
          H('div', { class: 'flex items-center justify-between border-b border-white/10 pb-2 mb-2' },
            H('span', { class: 'font-bold text-zinc-200' }, '♨️ Steam Generator Loop'),
            H('span', { class: 'rounded bg-sky-500/20 px-1.5 py-0.5 font-mono text-[9.5px] text-sky-300 font-bold' }, 'SECONDARY'),
          ),
          H('div', { class: 'space-y-2 font-mono text-[11px]' },
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Main Steam Pressure:'),
              H('span', { class: 'text-sky-300 font-bold' }, `${steamPressMPa.toFixed(2)} MPa`),
            ),
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Steam Temperature:'),
              H('span', { class: 'text-zinc-200 font-bold' }, `${Math.min(290, coolantOutC - 15).toFixed(1)} °C`),
            ),
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Boiler Circulation:'),
              H('span', { class: 'text-emerald-400 font-bold' }, 'Recirculating U-Tube'),
            ),
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Condenser Vacuum:'),
              H('span', { class: 'text-zinc-300' }, '5.0 kPa (-0.095 MPa)'),
            ),
          ),
        ),
        H('div', { class: 'mt-2 text-[10px] text-zinc-500 font-mono' },
          'Isolates radioactive primary water from turbine steam',
        ),
      ),

      // 3. Steam Turbine & Generator
      H('div', { class: 'rounded-xl border border-white/10 bg-[#090d16] p-3 flex flex-col justify-between' },
        H('div', null,
          H('div', { class: 'flex items-center justify-between border-b border-white/10 pb-2 mb-2' },
            H('span', { class: 'font-bold text-zinc-200' }, '⚡ Turbine & Generator'),
            H('span', { class: 'rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9.5px] text-emerald-300 font-bold' }, 'GRID OUTPUT'),
          ),
          H('div', { class: 'space-y-2 font-mono text-[11px]' },
            H('div', { class: 'flex justify-between p-2 rounded bg-emerald-500/10 border border-emerald-500/20' },
              H('span', { class: 'text-emerald-300 font-bold' }, 'ELECTRIC OUTPUT:'),
              H('span', { class: 'text-emerald-300 font-bold text-sm' }, `${electricPowerMWe.toFixed(1)} MWe`),
            ),
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Turbine Shaft Speed:'),
              H('span', { class: 'text-amber-300 font-bold' }, `${turbineRpm.toFixed(0)} RPM`),
            ),
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Generator Frequency:'),
              H('span', { class: 'text-zinc-200' }, `${((turbineRpm / 1800) * 60).toFixed(1)} Hz`),
            ),
            H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
              H('span', { class: 'text-zinc-500' }, 'Net Capacity Factor:'),
              H('span', { class: 'text-sky-300 font-bold' }, `${((electricPowerMWe / preset.electricPowerMWe) * 100).toFixed(0)}%`),
            ),
          ),
        ),
        H('div', { class: 'mt-2 text-[10px] text-zinc-500 font-mono' },
          'Synchronized to 3-phase national electrical grid',
        ),
      ),
    ),
  )
}

