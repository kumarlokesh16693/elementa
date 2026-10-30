'use client'

import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ElementData } from '@/lib/periodic/types'
import { CATEGORY_MAP } from '@/lib/periodic/types'
import { ELEMENTS, fmt } from '@/lib/periodic'

export type TrendField =
  | 'ionizationEnergy'
  | 'electronegativity'
  | 'atomicRadius'
  | 'density'
  | 'meltingPoint'
  | 'boilingPoint'

const TREND_FIELDS: { key: TrendField; label: string; unit: string; log?: boolean }[] = [
  { key: 'ionizationEnergy', label: 'Ionization energy', unit: 'eV' },
  { key: 'electronegativity', label: 'Electronegativity', unit: 'Pauling' },
  { key: 'atomicRadius', label: 'Atomic radius', unit: 'pm' },
  { key: 'density', label: 'Density', unit: 'g/cm³', log: true },
  { key: 'meltingPoint', label: 'Melting point', unit: 'K', log: true },
  { key: 'boilingPoint', label: 'Boiling point', unit: 'K', log: true },
]

interface TrendsChartProps {
  element: ElementData
  field: TrendField
  onFieldChange: (f: TrendField) => void
}

export function TrendsChart({ element, field, onFieldChange }: TrendsChartProps) {
  const meta = TREND_FIELDS.find((f) => f.key === field)!
  const color = CATEGORY_MAP[element.category].color

  const data = useMemo(
    () =>
      ELEMENTS.filter((el) => el[field] != null).map((el) => ({
        z: el.number,
        symbol: el.symbol,
        name: el.name,
        value: el[field] as number,
      })),
    [field],
  )

  const current = data.find((d) => d.z === element.number)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {TREND_FIELDS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFieldChange(f.key)}
            className={`rounded-md border px-2.5 py-1 text-[11px] transition ${
              f.key === field
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="min-h-[240px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 14, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
            <XAxis
              dataKey="z"
              stroke="#5c6470"
              tick={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
              tickLine={false}
              axisLine={{ stroke: '#ffffff18' }}
              interval={9}
            />
            <YAxis
              stroke="#5c6470"
              tick={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
              tickLine={false}
              axisLine={{ stroke: '#ffffff18' }}
              width={58}
              scale={meta.log ? 'log' : 'auto'}
              domain={meta.log ? ['auto', 'auto'] : undefined}
              allowDataOverflow={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as (typeof data)[number]
                return (
                  <div className="rounded-md border border-white/15 bg-[#12151d] px-3 py-2 font-mono text-xs shadow-xl">
                    <div className="text-zinc-200">
                      {p.name} <span className="text-zinc-500">({p.symbol}, Z={p.z})</span>
                    </div>
                    <div style={{ color }}>
                      {fmt(p.value, meta.unit, 2)}
                    </div>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={1.6}
              dot={false}
              isAnimationActive={false}
            />
            {current && (
              <ReferenceDot
                x={current.z}
                y={current.value}
                r={5}
                fill={color}
                stroke="#0b0e14"
                strokeWidth={1.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-500">
        {current
          ? `${element.name}: ${fmt(current.value, meta.unit, 2)} at Z = ${element.number} (highlighted dot).`
          : `${element.name} has no accepted ${meta.label.toLowerCase()} value — shown on the curve only where data exists.`}{' '}
        {meta.log ? 'Log scale.' : 'Linear scale.'}
      </p>
    </div>
  )
}
