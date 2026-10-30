'use client'

import { useState } from 'react'
import { Pause, Play, RotateCcw, X } from 'lucide-react'
import type { ElementData } from '@/lib/periodic/types'
import { CATEGORY_MAP, SHELL_LETTERS } from '@/lib/periodic/types'
import {
  blockOf,
  configToSuperscript,
  fmt,
  kelvinToC,
  neutronCount,
  usesBracketMass,
  valenceOf,
} from '@/lib/periodic'
import { Bohr2D } from './Bohr2D'
import { Bohr3D } from './Bohr3D'
import { TrendsChart, type TrendField } from './TrendsChart'

interface DetailPanelProps {
  element: ElementData
  onClose: () => void
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'bohr2d', label: 'Bohr 2D' },
  { key: 'bohr3d', label: 'Bohr 3D' },
  { key: 'trends', label: 'Trends' },
] as const

type TabKey = (typeof TABS)[number]['key']

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2">
      <div className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[13px] text-zinc-100">{value}</div>
      {sub && <div className="font-mono text-[10px] text-zinc-500">{sub}</div>}
    </div>
  )
}

function ModelControls({
  playing,
  speed,
  onToggle,
  onSpeed,
  extra,
}: {
  playing: boolean
  speed: number
  onToggle: () => void
  onSpeed: (v: number) => void
  extra?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <button
        onClick={onToggle}
        aria-label={playing ? 'Pause animation' : 'Play animation'}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 transition hover:bg-amber-500/20"
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <label className="flex flex-1 min-w-[140px] items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
        Speed
        <input
          type="range"
          min={0.2}
          max={3}
          step={0.1}
          value={speed}
          onChange={(e) => onSpeed(parseFloat(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded bg-white/15 accent-amber-400"
          aria-label="Animation speed"
        />
        <span className="w-8 text-right font-mono text-[10px] text-zinc-400">
          {speed.toFixed(1)}×
        </span>
      </label>
      {extra}
    </div>
  )
}

export function DetailPanel({ element, onClose }: DetailPanelProps) {
  const [tab, setTab] = useState<TabKey>('overview')
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [trendField, setTrendField] = useState<TrendField>('ionizationEnergy')

  const cat = CATEGORY_MAP[element.category]
  const block = blockOf(element)
  const massStr = usesBracketMass(element) ? `[${Math.round(element.mass)}]` : fmt(element.mass, 'u', 3)
  const mpC = kelvinToC(element.meltingPoint)
  const bpC = kelvinToC(element.boilingPoint)

  return (
    <div className="flex h-full flex-col bg-[#0c0f16]">
      {/* header */}
      <div className="relative shrink-0 overflow-hidden border-b border-white/[0.08] px-5 pb-4 pt-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{ background: `radial-gradient(120% 90% at 85% -10%, ${cat.color}, transparent 60%)` }}
        />
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border font-mono"
            style={{
              borderColor: cat.color,
              background: `${cat.color}1f`,
              boxShadow: `0 0 24px ${cat.color}33`,
            }}
          >
            <span className="text-2xl font-semibold" style={{ color: cat.color }}>
              {element.symbol}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h2 className="truncate text-xl font-semibold text-zinc-50">{element.name}</h2>
              <span className="font-mono text-sm text-zinc-500">Z = {element.number}</span>
            </div>
            <div className="mt-0.5 font-mono text-xs text-zinc-400">{massStr}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                style={{ color: cat.color, borderColor: `${cat.color}55`, background: `${cat.color}14` }}
              >
                {cat.label}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] capitalize text-zinc-300">
                {element.phase} · STP
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase text-zinc-300">
                {block}-block
              </span>
              {element.radioactive && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                  ☢ Radioactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="flex shrink-0 gap-1 border-b border-white/[0.08] px-3 pt-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-md px-3 py-1.5 text-xs font-medium transition ${
              tab === t.key
                ? 'border-b-2 border-amber-400 text-amber-300'
                : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-3">
        {tab === 'overview' && (
          <div className="space-y-4">
            <p className="text-[13px] leading-relaxed text-zinc-300">{element.summary}</p>

            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="Electron configuration"
                value={configToSuperscript(element.config)}
              />
              <Stat
                label={`Shells (${SHELL_LETTERS.slice(0, element.shells.length).join(' ')})`}
                value={element.shells.join(' · ')}
                sub={`valence: ${valenceOf(element)} e⁻`}
              />
              <Stat label="Neutrons (≈)" value={String(neutronCount(element))} sub="most stable isotope" />
              <Stat label="Electronegativity" value={fmt(element.electronegativity, '', 2)} sub="Pauling" />
              <Stat label="1st ionization energy" value={fmt(element.ionizationEnergy, 'eV', 3)} />
              <Stat label="Electron affinity" value={fmt(element.electronAffinity, 'kJ/mol', 1)} />
              <Stat label="Atomic radius" value={fmt(element.atomicRadius, 'pm', 0)} sub="empirical (calc: H, ng)" />
              <Stat label="Density (STP)" value={fmt(element.density, 'g/cm³', 3)} />
              <Stat
                label="Melting point"
                value={fmt(element.meltingPoint, 'K', 1)}
                sub={mpC != null ? `${fmt(mpC, '°C', 0)}` : undefined}
              />
              <Stat
                label="Boiling point"
                value={fmt(element.boilingPoint, 'K', 1)}
                sub={bpC != null ? `${fmt(bpC, '°C', 0)}` : undefined}
              />
              <Stat label="Oxidation states" value={element.oxidationStates} />
              <Stat
                label="Group / Period"
                value={element.group === 0 ? `f-series · P${element.period}` : `G${element.group} · P${element.period}`}
              />
            </div>

            <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
              <div className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                Discovery
              </div>
              <div className="mt-1 text-[13px] text-zinc-200">
                {element.discoveredYear ? (
                  <span className="font-mono">{element.discoveredYear}</span>
                ) : (
                  <span className="font-mono">Antiquity</span>
                )}
                <span className="text-zinc-400"> — {element.discoveredBy}</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'bohr2d' && (
          <div className="flex h-full min-h-[420px] flex-col gap-3">
            <ModelControls
              playing={playing}
              speed={speed}
              onToggle={() => setPlaying((p) => !p)}
              onSpeed={setSpeed}
              extra={
                <button
                  onClick={() => setShowLabels((s) => !s)}
                  className={`rounded-md border px-2.5 py-1.5 text-[10px] uppercase tracking-widest transition ${
                    showLabels
                      ? 'border-teal-400/40 bg-teal-400/10 text-teal-300'
                      : 'border-white/10 bg-white/[0.03] text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Shell labels
                </button>
              }
            />
            <div className="min-h-0 flex-1">
              <Bohr2D element={element} playing={playing} speed={speed} showLabels={showLabels} />
            </div>
          </div>
        )}

        {tab === 'bohr3d' && (
          <div className="flex h-full min-h-[440px] flex-col gap-3">
            <ModelControls
              playing={playing}
              speed={speed}
              onToggle={() => setPlaying((p) => !p)}
              onSpeed={setSpeed}
              extra={
                <>
                  <button
                    onClick={() => setAutoRotate((s) => !s)}
                    className={`rounded-md border px-2.5 py-1.5 text-[10px] uppercase tracking-widest transition ${
                      autoRotate
                        ? 'border-teal-400/40 bg-teal-400/10 text-teal-300'
                        : 'border-white/10 bg-white/[0.03] text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Auto-orbit
                  </button>
                  <button
                    onClick={() => setResetKey((k) => k + 1)}
                    aria-label="Reset camera view"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </>
              }
            />
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-white/[0.07] bg-[#070a10]">
              <Bohr3D
                key={`${element.number}-${resetKey}`}
                element={element}
                playing={playing}
                speed={speed}
                autoRotate={autoRotate}
              />
            </div>
          </div>
        )}

        {tab === 'trends' && (
          <div className="h-full min-h-[380px]">
            <TrendsChart element={element} field={trendField} onFieldChange={setTrendField} />
          </div>
        )}
      </div>
    </div>
  )
}
