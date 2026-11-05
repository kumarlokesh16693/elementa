/**
 * Modern Battery Architecture & OCV Discharge Lab
 * Interactive State of Charge (SoC), Open Circuit Voltage curves,
 * energy density comparisons, and electrode intercalation chemistry.
 */

import { h, type VNode } from 'nexus-framework'
import { BATTERY_ARCHITECTURES, getBatteryById } from '@/lib/electrochemistry/database'
import type { BatteryArchitecture } from '@/lib/electrochemistry/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

function interpolateVoltage(battery: BatteryArchitecture, soc: number): number {
  const pts = battery.ocvCurvePoints
  if (soc <= pts[0].soc) return pts[0].voltage
  if (soc >= pts[pts.length - 1].soc) return pts[pts.length - 1].voltage

  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]
    const p2 = pts[i + 1]
    if (soc >= p1.soc && soc <= p2.soc) {
      const frac = (soc - p1.soc) / (p2.soc - p1.soc)
      return p1.voltage + frac * (p2.voltage - p1.voltage)
    }
  }
  return battery.nominalVoltage
}

export function BatteryLab({
  activeBatteryId,
  socPercent,
  onSelectBattery,
  onChangeSoc,
}: {
  activeBatteryId: string
  socPercent: number
  onSelectBattery: (id: string) => void
  onChangeSoc: (soc: number) => void
}): VNode {
  const battery = getBatteryById(activeBatteryId) ?? BATTERY_ARCHITECTURES[0]
  const currentVoltage = interpolateVoltage(battery, socPercent)

  // SVG OCV Curve dimensions
  const W = 600
  const H_PX = 180
  const padL = 40
  const padR = 25
  const padT = 20
  const padB = 30
  const plotW = W - padL - padR
  const plotH = H_PX - padT - padB

  const vMin = battery.cutOffVoltage * 0.95
  const vMax = battery.maxVoltage * 1.05

  const toX = (soc: number) => padL + (soc / 100) * plotW
  const toY = (v: number) => padT + plotH - ((v - vMin) / (vMax - vMin)) * plotH

  // Generate SVG path for OCV curve
  const curvePoints: { s: number; v: number }[] = []
  for (let s = 0; s <= 100; s += 2) {
    curvePoints.push({ s, v: interpolateVoltage(battery, s) })
  }
  const pathD = curvePoints.reduce((acc, pt, idx) => {
    const x = toX(pt.s).toFixed(1)
    const y = toY(pt.v).toFixed(1)
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
  }, '')

  const currentMarkerX = toX(socPercent)
  const currentMarkerY = toY(currentVoltage)

  return H('div', { class: 'flex flex-col space-y-3' },
    // Battery Selection Bar
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0c1220] p-3' },
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-xl' }, '🔋'),
        H('div', null,
          H('h3', { class: 'text-[14px] font-bold text-zinc-100' }, battery.name),
          H('p', { class: 'text-[10px] text-zinc-400 font-mono' }, battery.chemistry),
        ),
      ),

      // Battery Pills
      H('div', { class: 'flex flex-wrap gap-1 font-mono text-[10px]' },
        ...BATTERY_ARCHITECTURES.map((b) => H('button', {
          key: b.id,
          type: 'button',
          onClick: () => onSelectBattery(b.id),
          onclick: () => onSelectBattery(b.id),
          class: `cursor-pointer rounded-lg border px-2.5 py-1 transition ${
            b.id === battery.id
              ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold'
              : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-200'
          }`,
        }, b.shortName)),
      ),
    ),

    // Interactive SoC Control & OCV Curve Grid
    H('div', { class: 'grid grid-cols-1 md:grid-cols-12 gap-3' },
      // Left: OCV Curve & SoC Slider (7 cols)
      H('div', { class: 'rounded-xl border border-white/10 bg-[#070b14] p-3 md:col-span-7 flex flex-col justify-between' },
        H('div', { class: 'flex items-center justify-between border-b border-white/10 pb-1.5 mb-2' },
          H('span', { class: 'text-[11px] font-bold text-zinc-200 font-mono uppercase' }, 'Open-Circuit Voltage (OCV) vs SoC%'),
          H('div', { class: 'flex items-center gap-2' },
            H('span', { class: 'text-[10px] text-zinc-400 font-mono' }, 'Active OCV:'),
            H('span', { class: 'font-mono text-emerald-400 font-bold text-[13px]' }, `${currentVoltage.toFixed(2)} V`),
          ),
        ),

        // SVG OCV Plot
        H('div', { class: 'w-full' },
          H('svg', {
            viewBox: `0 0 ${W} ${H_PX}`,
            class: 'w-full h-auto select-none',
            xmlns: 'http://www.w3.org/2000/svg',
          },
            // Grid Lines X
            ...[0, 25, 50, 75, 100].map((s) => {
              const x = toX(s)
              return H('g', { key: `gx-${s}` },
                H('line', {
                  x1: x,
                  y1: padT,
                  x2: x,
                  y2: padT + plotH,
                  stroke: 'rgba(255,255,255,0.08)',
                  'stroke-dasharray': '2,4',
                }),
                H('text', {
                  x: x,
                  y: padT + plotH + 16,
                  'text-anchor': 'middle',
                  'font-family': 'monospace',
                  'font-size': '9',
                  fill: '#64748b',
                }, `${s}%`),
              )
            }),

            // Grid Lines Y
            H('text', { x: padL - 6, y: toY(battery.maxVoltage) + 3, 'text-anchor': 'end', 'font-family': 'monospace', 'font-size': '8.5', fill: '#64748b' }, `${battery.maxVoltage}V`),
            H('text', { x: padL - 6, y: toY(battery.nominalVoltage) + 3, 'text-anchor': 'end', 'font-family': 'monospace', 'font-size': '8.5', fill: '#64748b' }, `${battery.nominalVoltage}V`),
            H('text', { x: padL - 6, y: toY(battery.cutOffVoltage) + 3, 'text-anchor': 'end', 'font-family': 'monospace', 'font-size': '8.5', fill: '#64748b' }, `${battery.cutOffVoltage}V`),

            // OCV Line
            H('path', {
              d: pathD,
              fill: 'none',
              stroke: '#38bdf8',
              'stroke-width': '2.5',
            }),

            // Active SoC Point Marker
            H('circle', {
              cx: currentMarkerX,
              cy: currentMarkerY,
              r: '6',
              fill: '#fbbf24',
              stroke: '#ffffff',
              'stroke-width': '2',
              filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))',
            }),
          ),
        ),

        // State of Charge (SoC) Interactive Slider
        H('div', { class: 'mt-2 border-t border-white/10 pt-2' },
          H('div', { class: 'flex items-center justify-between text-[11px] mb-1 font-mono' },
            H('span', { class: 'text-zinc-300 font-semibold' }, 'State of Charge (SoC):'),
            H('span', { class: 'font-bold text-amber-300 text-[13px]' }, `${socPercent}%`),
          ),
          H('input', {
            type: 'range',
            min: '0',
            max: '100',
            step: '1',
            value: String(socPercent),
            onInput: (e: Event) => onChangeSoc(Number((e.target as HTMLInputElement).value)),
            oninput: (e: Event) => onChangeSoc(Number((e.target as HTMLInputElement).value)),
            class: 'w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400',
          }),
          H('div', { class: 'flex justify-between text-[9px] font-mono text-zinc-500 mt-1' },
            H('span', null, '0% (Discharged Cut-off)'),
            H('span', null, '50% (Nominal)'),
            H('span', null, '100% (Fully Charged)'),
          ),
        ),
      ),

      // Right: Battery Architecture Specs (5 cols)
      H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1220] p-3 md:col-span-5 flex flex-col justify-between font-mono text-[10.5px]' },
        H('div', null,
          H('div', { class: 'text-[11px] font-bold text-zinc-200 border-b border-white/10 pb-1.5 mb-2 uppercase' }, 'Electrochemical Metrics'),
          H('div', { class: 'grid grid-cols-2 gap-1.5 mb-2 text-center' },
            H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
              H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block' }, 'Specific Energy'),
              H('span', { class: 'font-bold text-emerald-300 text-[12px]' }, `${battery.specificEnergyWhKg} Wh/kg`),
            ),
            H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
              H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block' }, 'Volumetric Density'),
              H('span', { class: 'font-bold text-sky-300 text-[12px]' }, `${battery.volumetricEnergyWhL} Wh/L`),
            ),
            H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
              H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block' }, 'Cycle Life'),
              H('span', { class: 'font-bold text-amber-300 text-[12px]' }, `${battery.cycleLife} cycles`),
            ),
            H('div', { class: 'rounded border border-white/5 bg-white/[0.02] p-1.5' },
              H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block' }, 'Nominal Voltage'),
              H('span', { class: 'font-bold text-zinc-100 text-[12px]' }, `${battery.nominalVoltage} V`),
            ),
          ),

          // Reactions Box
          H('div', { class: 'rounded bg-black/40 p-2 border border-white/5 space-y-1 mb-2 text-[9.5px]' },
            H('div', null,
              H('span', { class: 'text-amber-400 font-bold block text-[8px] uppercase' }, 'Discharge Reaction:'),
              H('span', { class: 'text-zinc-200' }, battery.dischargeReaction),
            ),
            H('div', null,
              H('span', { class: 'text-sky-400 font-bold block text-[8px] uppercase' }, 'Electrolyte:'),
              H('span', { class: 'text-zinc-400' }, battery.electrolyte),
            ),
          ),
        ),

        // Applications
        H('div', { class: 'border-t border-white/5 pt-1.5' },
          H('span', { class: 'text-[8.5px] text-zinc-500 uppercase block mb-1' }, 'Commercial Applications:'),
          H('div', { class: 'flex flex-wrap gap-1' },
            ...battery.applications.map((app) => H('span', {
              key: app,
              class: 'rounded bg-sky-400/10 px-1.5 py-0.5 text-[8.5px] text-sky-300',
            }, app)),
          ),
        ),
      ),
    ),
  )
}
