'use client'

import { useState, type ReactNode } from 'react'
import type { ElementData } from '@/lib/periodic/types'
import { CATEGORY_MAP, SHELL_LETTERS } from '@/lib/periodic/types'
import {
  configToSuperscript,
  fmt,
  heatForField,
  heatT,
  hexWithAlpha,
  kelvinToC,
  usesBracketMass,
  valenceOf,
} from '@/lib/periodic'
import { Bohr2D } from './Bohr2D'
import Bohr3D from './Bohr3D'

interface DetailPanelProps {
  element: ElementData
  accent: string
}

function shortVal(v: number | null): string {
  if (v == null) return '—'
  const a = Math.abs(v)
  if (a >= 1000) return String(Math.round(v))
  if (a >= 100) return v.toFixed(0)
  if (a >= 10) return v.toFixed(1)
  if (a >= 0.01) return v.toFixed(2)
  return v.toExponential(1)
}

function Chip({ children, tint }: { children: ReactNode; tint?: string }) {
  return (
    <span
      className="rounded-full border px-1.5 py-0.5 text-[9.5px] leading-none"
      style={
        tint
          ? { color: tint, borderColor: hexWithAlpha(tint, 0.4), background: hexWithAlpha(tint, 0.1) }
          : undefined
      }
    >
      {children}
    </span>
  )
}

function Section({
  title,
  accent,
  children,
}: {
  title: string
  accent: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        <span className="inline-block h-3 w-[3px] rounded-full" style={{ background: accent }} />
        {title}
      </h3>
      {children}
    </section>
  )
}

function Prop({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-0.5 font-mono text-[12px] leading-tight text-zinc-200">{value}</div>
    </div>
  )
}

type TrendField =
  | 'electronegativity'
  | 'ionizationEnergy'
  | 'atomicRadius'
  | 'density'
  | 'meltingPoint'

const TRENDS: { field: TrendField; label: string; unit: string }[] = [
  { field: 'electronegativity', label: 'Electronegativity', unit: '' },
  { field: 'ionizationEnergy', label: 'Ionization E₁', unit: ' eV' },
  { field: 'atomicRadius', label: 'Atomic radius', unit: ' pm' },
  { field: 'density', label: 'Density (log)', unit: ' g/cm³' },
  { field: 'meltingPoint', label: 'Melting point', unit: ' K' },
]

const SHELL_MAX = 32

export default function DetailPanel({ element: el, accent }: DetailPanelProps) {
  const [model, setModel] = useState<'2d' | '3d'>('2d')
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(1)

  const bracket = usesBracketMass(el)
  const cat = CATEGORY_MAP[el.category]

  return (
    <div className="space-y-5 p-4">
      {/* identity */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border"
          style={{ background: hexWithAlpha(accent, 0.12), borderColor: hexWithAlpha(accent, 0.5) }}
        >
          <span className="font-mono text-[9px] leading-none opacity-75" style={{ color: accent }}>
            {el.number}
          </span>
          <span className="text-xl font-bold leading-tight" style={{ color: accent }}>
            {el.symbol}
          </span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-zinc-100">{el.name}</div>
          <div className="font-mono text-[11px] text-zinc-500">
            {cat.label} · {el.mass} u{bracket ? ' †' : ''}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip tint={cat.color}>{cat.label}</Chip>
        <Chip>phase: {el.phase}</Chip>
        <Chip>group {el.group > 0 ? el.group : '—'}</Chip>
        <Chip>period {el.period}</Chip>
        {el.radioactive && <Chip tint="#fbbf24">☢ radioactive</Chip>}
        {bracket && <Chip tint="#94a3b8">† bracketed mass</Chip>}
      </div>

      {/* Bohr model viewer */}
      <Section title="Atomic model" accent={accent}>
        <div className="relative h-[280px] overflow-hidden rounded-lg border border-white/10 bg-[#060a12] xl:h-[320px]">
          {model === '2d' ? (
            <Bohr2D element={el} accent={accent} speed={speed} animated={!paused} />
          ) : (
            <Bohr3D element={el} accent={accent} speed={speed} paused={paused} />
          )}
          <div className="absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400 backdrop-blur-sm">
            {model === '2d' ? 'SVG · 2D' : 'Three.js · 3D — drag to orbit'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-white/10">
            {(['2d', '3d'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModel(m)}
                className={`px-2.5 py-1 text-[11px] uppercase tracking-wide transition ${
                  model === m
                    ? 'bg-white/10 text-zinc-100'
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200"
          >
            {paused ? '▶ Play' : '❚❚ Pause'}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-500">
              ×{String(speed).replace(/\.0+$/, '.0')}
            </span>
            <input
              type="range"
              min={0.25}
              max={3}
              step={0.25}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-24"
              aria-label="Model animation speed"
            />
          </div>
        </div>

        {/* shell population */}
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-zinc-600">
            shell population (max {SHELL_MAX} e⁻ scale)
          </div>
          {el.shells.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-3.5 font-mono text-[10px] text-zinc-500">
                {SHELL_LETTERS[i] ?? `n${i + 1}`}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-white/5">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${Math.min(100, (n / SHELL_MAX) * 100)}%`,
                    background: accent,
                    opacity: 0.45 + (0.55 * i) / Math.max(1, el.shells.length - 1),
                  }}
                />
              </div>
              <span className="w-9 text-right font-mono text-[10px] text-zinc-400">{n} e⁻</span>
            </div>
          ))}
        </div>
      </Section>

      {/* atomic properties */}
      <Section title="Atomic properties" accent={accent}>
        <div className="grid grid-cols-2 gap-1.5">
          <Prop
            label="Electron config"
            value={<span className="text-[11px]">{configToSuperscript(el.config)}</span>}
          />
          <Prop label="Valence e⁻ (Bohr)" value={valenceOf(el)} />
          <Prop label="Electronegativity" value={fmt(el.electronegativity, '', 2)} />
          <Prop label="Ionization E₁" value={fmt(el.ionizationEnergy, 'eV', 2)} />
          <Prop
            label="Electron affinity"
            value={el.electronAffinity == null ? '—' : `${el.electronAffinity} kJ/mol`}
          />
          <Prop label="Atomic radius" value={fmt(el.atomicRadius, 'pm', 0)} />
          <div className="col-span-2">
            <Prop label="Oxidation states" value={el.oxidationStates || '—'} />
          </div>
        </div>
      </Section>

      {/* physical properties */}
      <Section title="Physical properties" accent={accent}>
        <div className="grid grid-cols-2 gap-1.5">
          <Prop label="Phase at STP" value={<span className="capitalize">{el.phase}</span>} />
          <Prop label="Density" value={el.density == null ? '—' : `${el.density} g/cm³`} />
          <Prop
            label="Melting point"
            value={
              el.meltingPoint == null
                ? '—'
                : `${el.meltingPoint} K · ${kelvinToC(el.meltingPoint)} °C`
            }
          />
          <Prop
            label="Boiling point"
            value={
              el.boilingPoint == null
                ? '—'
                : `${el.boilingPoint} K · ${kelvinToC(el.boilingPoint)} °C`
            }
          />
        </div>
      </Section>

      {/* periodic trends */}
      <Section title="Trend percentile (of reference range)" accent={accent}>
        <div className="space-y-2">
          {TRENDS.map((t) => {
            const val = el[t.field]
            const pct = heatT(el, t.field)
            return (
              <div key={t.field}>
                <div className="flex items-baseline justify-between text-[10px]">
                  <span className="text-zinc-400">{t.label}</span>
                  <span className="font-mono text-zinc-300">
                    {val == null ? '—' : `${shortVal(val)}${t.unit}`}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                  {pct != null && (
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(pct * 100).toFixed(1)}%`,
                        background: heatForField(el, t.field),
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* discovery */}
      <Section title="Discovery & notes" accent={accent}>
        <div className="grid grid-cols-2 gap-1.5">
          <Prop label="Discovered" value={el.discoveredYear ?? 'Antiquity'} />
          <Prop
            label="Credited to"
            value={<span className="text-[11px]">{el.discoveredBy || '—'}</span>}
          />
        </div>
        {bracket && (
          <p className="text-[10px] leading-relaxed text-zinc-500">
            † This element has no standard atomic weight (all isotopes unstable); the value shown is
            the mass number of the most stable isotope, conventionally bracketed in IUPAC tables.
          </p>
        )}
        <p className="text-[11.5px] leading-relaxed text-zinc-400">{el.summary}</p>
      </Section>
    </div>
  )
}
