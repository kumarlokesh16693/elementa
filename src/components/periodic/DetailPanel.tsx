'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ElementData } from '@/lib/periodic/types'
import { CATEGORY_MAP, SHELL_LETTERS } from '@/lib/periodic/types'
import {
  configToSuperscript,
  fmt,
  heatForField,
  heatT,
  hexWithAlpha,
  kelvinToC,
  ORIGIN_FOOTNOTE,
  ORIGIN_MAP,
  ORIGIN_NOTES,
  originsFor,
  usesBracketMass,
  valenceOf,
} from '@/lib/periodic'
import { ISOTOPES, chainsForElement } from '@/lib/periodic/isotopes'
import { isTopModal, popModal, pushModal } from '@/lib/modalStack'
import { Bohr2D } from './Bohr2D'
import Bohr3D from './Bohr3D'
import GrotrianDiagram from './GrotrianDiagram'
import IsotopeModal from './IsotopeModal'
import QMViewer from '@/components/orbital/QMViewer'

interface DetailPanelProps {
  element: ElementData
  accent: string
  open: boolean
  onClose: () => void
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

function CloseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

interface ControlsRowProps {
  model: '2d' | 'qm' | 'spectra' | '3d'
  setModel: (m: '2d' | 'qm' | 'spectra' | '3d') => void
  paused: boolean
  togglePaused: () => void
  speed: number
  setSpeed: (s: number) => void
}

function ControlsRow({ model, setModel, paused, togglePaused, speed, setSpeed }: ControlsRowProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex overflow-hidden rounded-md border border-white/10">
        {(['2d', 'qm', 'spectra', '3d'] as const).map((m) => (
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
      {model !== 'spectra' && (
        <button
          type="button"
          onClick={togglePaused}
          className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200"
        >
          {paused ? '▶ Play' : '❚❚ Pause'}
        </button>
      )}
      {model !== 'spectra' && (
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-500">×{speed}</span>
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
      )}
      {model === 'spectra' && (
        <span className="ml-auto hidden font-mono text-[10px] text-zinc-600 md:inline">
          exact Rydberg spectrum · click a line to pin
        </span>
      )}
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

/**
 * Full element detail, shown exclusively inside a modal so the periodic
 * table keeps the entire window width and every element stays visible.
 */
export default function DetailPanel({ element: el, accent, open, onClose }: DetailPanelProps) {
  const [model, setModel] = useState<'2d' | 'qm' | 'spectra' | '3d'>('2d')
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [isoOpen, setIsoOpen] = useState(false)
  const modalId = useRef(Symbol('detail-modal'))

  /* close the modal with Escape — only if it is the topmost overlay */
  useEffect(() => {
    if (!open) return
    pushModal(modalId.current)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTopModal(modalId.current)) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      popModal(modalId.current)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const modelCanvas =
    model === '2d' ? (
      <Bohr2D element={el} accent={accent} speed={speed} animated={!paused} />
    ) : model === 'qm' ? (
      <QMViewer z={el.number} paused={paused} speed={speed} />
    ) : model === 'spectra' ? (
      <GrotrianDiagram key={el.number} z={el.number} symbol={el.symbol} accent={accent} />
    ) : (
      <Bohr3D element={el} accent={accent} speed={speed} paused={paused} />
    )

  const controls = (
    <ControlsRow
      model={model}
      setModel={setModel}
      paused={paused}
      togglePaused={() => setPaused((p) => !p)}
      speed={speed}
      setSpeed={setSpeed}
    />
  )

  const bracket = usesBracketMass(el)
  const cat = CATEGORY_MAP[el.category]

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${el.name} — full details`}
    >
      <div
        className="modal-card flex h-full max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0f18] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header — identity */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 px-4 py-3">
          <div
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border"
            style={{
              background: hexWithAlpha(accent, 0.12),
              borderColor: hexWithAlpha(accent, 0.5),
            }}
          >
            <span className="font-mono text-[8px] leading-none opacity-75" style={{ color: accent }}>
              {el.number}
            </span>
            <span className="text-base font-bold leading-tight" style={{ color: accent }}>
              {el.symbol}
            </span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-100">
              {el.name}
              <span className="ml-2 font-mono text-[11px] font-normal text-zinc-500">
                {el.mass} u{bracket ? ' †' : ''}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip tint={cat.color}>{cat.label}</Chip>
              <Chip>phase: {el.phase}</Chip>
              <Chip>group {el.group > 0 ? el.group : '—'}</Chip>
              <Chip>period {el.period}</Chip>
              {el.radioactive && <Chip tint="#fbbf24">☢ radioactive</Chip>}
              {bracket && <Chip tint="#94a3b8">† bracketed mass</Chip>}
            </div>
          </div>
          <span className="ml-auto hidden shrink-0 font-mono text-[10px] text-zinc-500 xl:inline">
            {model === '2d'
              ? 'SVG · 2D'
              : model === 'qm'
                ? 'QM ψ isosurface — drag to orbit · slider cuts probability'
                : model === 'spectra'
                  ? 'Grotrian diagram · hydrogen-like ion — hover a transition for photon data'
                  : 'Three.js · 3D — drag to orbit · scroll to zoom'}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close element details"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-white/30 hover:text-zinc-100"
          >
            <CloseIcon />
          </button>
        </div>

        {/* body — model on the left, data on the right */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden">
          {/* atomic model viewer */}
          <div className="flex shrink-0 flex-col border-b border-white/10 bg-[#060a12] lg:min-h-0 lg:shrink lg:border-b-0 lg:border-r">
            <div className="relative h-[300px] overflow-hidden sm:h-[340px] lg:h-auto lg:min-h-0 lg:flex-1">
              {modelCanvas}
              {(model === '2d' || model === '3d') && (
                <div className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400 backdrop-blur-sm">
                  Bohr shell model · {el.shells.length} shells · Σ
                  {el.shells.reduce((a, b) => a + b, 0)} e⁻
                </div>
              )}
            </div>
            <div className="relative z-10 shrink-0 border-t border-white/10 px-4 py-2.5">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {el.shells.map((n, i) => (
                  <span
                    key={i}
                    className="rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none"
                    style={{
                      color: accent,
                      borderColor: hexWithAlpha(accent, 0.35),
                      background: hexWithAlpha(accent, 0.08),
                    }}
                  >
                    {SHELL_LETTERS[i] ?? `n${i + 1}`}·{n}e⁻
                  </span>
                ))}
                <span className="ml-auto hidden font-mono text-[10px] text-zinc-600 md:inline">
                  Esc to close
                </span>
              </div>
              {controls}
            </div>
          </div>

          {/* data column */}
          <div className="space-y-5 p-4 lg:min-h-0 lg:overflow-y-auto">
            {/* shell population */}
            <Section title="Shell population" accent={accent}>
              <div className="space-y-1">
                <div className="text-[9px] uppercase tracking-wider text-zinc-600">
                  max {SHELL_MAX} e⁻ scale
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
                    <span className="w-9 text-right font-mono text-[10px] text-zinc-400">
                      {n} e⁻
                    </span>
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

            {/* isotopes & decay */}
            <IsotopesSection el={el} accent={accent} onOpen={() => setIsoOpen(true)} />

            {/* nucleosynthesis origin */}
            <OriginsSection el={el} accent={accent} />

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
                  † This element has no standard atomic weight (all isotopes unstable); the value
                  shown is the mass number of the most stable isotope, conventionally bracketed in
                  IUPAC tables.
                </p>
              )}
              <p className="text-[11.5px] leading-relaxed text-zinc-400">{el.summary}</p>
            </Section>
          </div>
        </div>
      </div>

      {/* isotope explorer — stacked overlay above this modal */}
      <IsotopeModal element={el} accent={accent} open={isoOpen} onClose={() => setIsoOpen(false)} />
    </div>
  )
}

function IsotopesSection({
  el,
  accent,
  onOpen,
}: {
  el: ElementData
  accent: string
  onOpen: () => void
}) {
  const rows = ISOTOPES[el.number] ?? []
  const stable = rows.filter((r) => r.abundance != null && !r.halfLife).length
  const chains = chainsForElement(el.number)
  return (
    <Section title="Isotopes & decay" accent={accent}>
      <p className="text-[11px] leading-relaxed text-zinc-400">
        {rows.length} notable nuclides tracked · {stable} stable
        {chains.length > 0 && ` · member of the ${chains.map((c) => c.name).join(', ')}`}
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11.5px] font-medium text-amber-300 transition hover:bg-amber-400/20"
      >
        Open isotope explorer → isotope table & decay chains
      </button>
      <a
        href={`/segre?z=${el.number}`}
        className="mt-1.5 block w-full rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-center text-[11.5px] font-medium text-emerald-300 transition hover:bg-emerald-400/20"
      >
        View all nuclides of {el.symbol} in the Segrè chart →
      </a>
    </Section>
  )
}

function OriginsSection({ el, accent }: { el: ElementData; accent: string }) {
  const pairs = originsFor(el.number)
  const note = ORIGIN_NOTES[el.number]
  const synthetic = pairs[0][0] === 'synthetic'
  return (
    <Section title="Nucleosynthesis origin" accent={accent}>
      {/* stacked share bar */}
      <div className="flex h-3.5 gap-px overflow-hidden rounded-full bg-white/5">
        {pairs.map(([k, v]) => (
          <div
            key={k}
            title={`${ORIGIN_MAP[k].label} ≈${v}%`}
            style={{ width: `${v}%`, background: ORIGIN_MAP[k].color, opacity: 0.85 }}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        {pairs.map(([k, v]) => {
          const m = ORIGIN_MAP[k]
          return (
            <div key={k}>
              <div className="flex items-baseline gap-1.5 text-[10.5px]">
                <span
                  className="inline-block h-2 w-2 shrink-0 translate-y-px rounded-full"
                  style={{ background: m.color }}
                />
                <span className="text-zinc-300">{m.label}</span>
                <span className="font-mono text-zinc-500">· {m.example}</span>
                <span className="ml-auto shrink-0 font-mono text-zinc-400">≈{v}%</span>
              </div>
              <p className="pl-3.5 text-[9.5px] leading-snug text-zinc-500">{m.desc}</p>
            </div>
          )
        })}
      </div>
      {note && (
        <p className="rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1.5 text-[10px] leading-relaxed text-zinc-400">
          {note}
        </p>
      )}
      {synthetic && !note && (
        <p className="rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1.5 text-[10px] leading-relaxed text-zinc-400">
          Every atom of {el.symbol} on Earth was made by humans — none survives from the
          solar system's formation.
        </p>
      )}
      <p className="text-[9px] leading-relaxed text-zinc-600">{ORIGIN_FOOTNOTE}</p>
    </Section>
  )
}
