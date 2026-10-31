'use client'

import { useMemo, useState } from 'react'
import {
  buildLevels,
  buildTransitions,
  EV_TO_CM1,
  EV_TO_THZ,
  formatEv,
  formatLambda,
  memberLetter,
  N_MAX,
  regionOf,
  REGION_META,
  RYDBERG_EV,
  seriesName,
  wavelengthToRGB,
  type Level,
  type Transition,
} from '@/lib/spectra'

/* ---------------- layout constants (SVG user units) ---------------- */

const W = 560
const H = 420
const PLOT_TOP = 30
const PLOT_H = 300
const PLOT_BOTTOM = PLOT_TOP + PLOT_H
const BAR_L = 70
const BAR_R = 544
/* y position on a log energy axis (standard for Grotrian diagrams — keeps the
   Rydberg ladder readable); the exact eV label printed on every bar makes the
   scale explicit. n = N_MAX sits just below the continuum. */
const yOfLevel = (n: number) =>
  PLOT_TOP + 10 + (PLOT_H - 10) * (1 - Math.log(n) / Math.log(N_MAX))
const BAND_TOP = 366
const BAND_H = 30
const BAND_BOT = BAND_TOP + BAND_H

/* ---------------- small presentational helpers ---------------- */

function lineColor(t: Transition): string {
  return wavelengthToRGB(t.lambdaNm) ?? REGION_META[regionOf(t.lambdaNm)].color
}

function lineOpacity(t: Transition, active: boolean, dimmed: boolean): number {
  if (active) return 1
  if (dimmed) return 0.07
  return wavelengthToRGB(t.lambdaNm) ? 0.85 : 0.5
}

function freqStr(dE: number): string {
  const thz = dE * EV_TO_THZ
  return thz >= 1000 ? `${(thz / 1000).toFixed(thz >= 1e4 ? 0 : 1)} PHz` : `${thz.toFixed(thz >= 100 ? 0 : 1)} THz`
}

/** ṽ as [mantissa, exponent] so the card can render a true superscript */
function wavenumberParts(dE: number): [string, number | null] {
  const cm = dE * EV_TO_CM1
  if (cm < 1e4) return [cm.toFixed(0), null]
  const exp = Math.floor(Math.log10(cm))
  return [(cm / 10 ** exp).toFixed(2), exp]
}

/* ---------------- subcomponents (module scope) ---------------- */

function LevelBar({ lvl, z, accent }: { lvl: Level; z: number; accent: string }) {
  const y = yOfLevel(lvl.n)
  const ground = lvl.n === 1
  return (
    <g>
      <text
        x={BAR_L - 8}
        y={y - 1.5}
        textAnchor="end"
        fontSize="10"
        fill={ground ? accent : '#a1a1aa'}
        className="font-mono"
      >
        n={lvl.n}
      </text>
      <text x={BAR_L - 8} y={y + 7.5} textAnchor="end" fontSize="8.5" fill="#71717a" className="font-mono">
        {formatEv(lvl.E)}
      </text>
      <line
        x1={BAR_L}
        y1={y}
        x2={BAR_R}
        y2={y}
        stroke={ground ? accent : '#3f3f46'}
        strokeWidth={ground ? 1.6 : 1}
      />
      {ground && (
        <text x={BAR_R - 2} y={y - 4} textAnchor="end" fontSize="8" fill={accent} className="font-mono">
          ground state
        </text>
      )}
      <title>{`n=${lvl.n} · ${formatEv(lvl.E)} (Z=${z})`}</title>
    </g>
  )
}

function TransitionLine({
  t,
  x,
  active,
  dimmed,
  onHover,
  onSelect,
}: {
  t: Transition
  x: number
  active: boolean
  dimmed: boolean
  onHover: (t: Transition | null) => void
  onSelect: (t: Transition) => void
}) {
  const yU = yOfLevel(t.upper)
  const yL = yOfLevel(t.lower)
  const color = lineColor(t)
  const visible = wavelengthToRGB(t.lambdaNm) != null
  return (
    <g opacity={lineOpacity(t, active, dimmed)}>
      {active && <line x1={x} y1={yU} x2={x} y2={yL} stroke={color} strokeWidth={5} opacity={0.25} />}
      <line
        x1={x}
        y1={yU}
        x2={x}
        y2={yL + 4}
        stroke={color}
        strokeWidth={active ? 2.2 : 1.3}
        strokeDasharray={visible ? undefined : '3 2'}
      />
      {/* arrowhead at the lower level (emission direction) */}
      <polygon points={`${x},${yL} ${x - 3},${yL - 6} ${x + 3},${yL - 6}`} fill={color} />
      {/* invisible fat hit area */}
      <line
        x1={x - 4}
        y1={yU}
        x2={x - 4}
        y2={yL}
        stroke="transparent"
        strokeWidth={9}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => onHover(t)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(t)}
      />
    </g>
  )
}

function PhotonCard({
  t,
  z,
  symbol,
}: {
  t: Transition
  z: number
  symbol: string
}) {
  const region = REGION_META[regionOf(t.lambdaNm)]
  return (
    <div
      className="pointer-events-none absolute right-2 top-2 w-44 rounded-lg border border-white/10 bg-[#0a0f18]/95 p-2.5 shadow-xl backdrop-blur-sm"
      data-testid="photon-card"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[12px] font-semibold text-zinc-100">
          {t.upper} → {t.lower}
        </span>
        <span className="font-mono text-[9px]" style={{ color: region.color }}>
          {region.label}
        </span>
      </div>
      <div className="mb-1.5 text-[9px] text-zinc-500">
        {seriesName(t.series)}-{memberLetter(t.upper, t.lower)} · H-like {symbol}
        <sup>{z - 1}+</sup>
      </div>
      {[
        ['λ (vac)', formatLambda(t.lambdaNm)],
        ['E photon', formatEv(t.dE)],
        ['ν', freqStr(t.dE)],
      ].map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-2">
          <span className="text-[9px] uppercase tracking-wide text-zinc-600">{k}</span>
          <span className="font-mono text-[10.5px] text-zinc-200">{v}</span>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[9px] uppercase tracking-wide text-zinc-600">ṽ</span>
        <span className="font-mono text-[10.5px] text-zinc-200">
          {wavenumberParts(t.dE)[0]}
          {wavenumberParts(t.dE)[1] != null && (
            <>
              ×10<sup>{wavenumberParts(t.dE)[1]}</sup>
            </>
          )}{" "}
          cm<sup>-1</sup>
        </span>
      </div>
      {/* visible lines show their true colour */}
      <div className="mt-1.5 h-1.5 rounded-full" style={{ background: lineColor(t), opacity: 0.9 }} />
    </div>
  )
}

/* ---------------- main component ---------------- */

export default function GrotrianDiagram({
  z,
  symbol,
  accent,
}: {
  z: number
  symbol: string
  accent: string
}) {
  const levels = useMemo(() => buildLevels(z), [z])
  const transitions = useMemo(() => buildTransitions(z), [z])
  const [sel, setSel] = useState<Transition | null>(null)
  const [hover, setHover] = useState<Transition | null>(null)
  const [series, setSeries] = useState<number | 'all'>('all')

  const shown = sel ?? hover
  const visibleCount = transitions.filter((t) => wavelengthToRGB(t.lambdaNm) != null).length

  /* x slot for every transition: grouped into one column per series */
  const columns = useMemo(() => {
    const map = new Map<number, Transition[]>()
    for (const t of transitions) {
      if (!map.has(t.series)) map.set(t.series, [])
      map.get(t.series)!.push(t)
    }
    const colW = (BAR_R - 4 - (BAR_L + 4)) / (N_MAX - 1)
    const out = new Map<Transition, number>()
    for (const [l, lines] of map) {
      const colLeft = BAR_L + 4 + (l - 1) * colW
      const span = colW - 14
      lines.sort((a, b) => a.upper - b.upper)
      lines.forEach((t, k) => {
        const x = lines.length === 1 ? colLeft + 7 + span / 2 : colLeft + 7 + (k * span) / (lines.length - 1)
        out.set(t, x)
      })
    }
    return out
  }, [transitions])

  return (
    <div className="relative h-full w-full bg-[#070a10]" data-testid="grotrian-diagram">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label={`Grotrian diagram of hydrogen-like ${symbol}, Z = ${z}`}
        onMouseLeave={() => setHover(null)}
      >
        {/* continuum / ionization limit */}
        <line x1={BAR_L} y1={PLOT_TOP} x2={BAR_R} y2={PLOT_TOP} stroke="#52525b" strokeWidth={1} strokeDasharray="4 3" />
        <text x={BAR_L + 2} y={PLOT_TOP - 6} fontSize="8.5" fill="#71717a" className="font-mono">
          continuum · E = 0 (ionization)
        </text>

        {/* level bars */}
        {levels.map((lvl) => (
          <LevelBar key={lvl.n} lvl={lvl} z={z} accent={accent} />
        ))}

        {/* transitions */}
        {transitions.map((t) => (
          <TransitionLine
            key={`${t.upper}-${t.lower}`}
            t={t}
            x={columns.get(t) ?? BAR_L}
            active={shown?.upper === t.upper && shown?.lower === t.lower}
            dimmed={series !== 'all' && t.series !== series}
            onHover={setHover}
            onSelect={(tr) => setSel((prev) => (prev?.upper === tr.upper && prev?.lower === tr.lower ? null : tr))}
          />
        ))}

        {/* series column labels */}
        {Array.from({ length: N_MAX - 1 }, (_, i) => i + 1).map((l) => {
          const colW = (BAR_R - 4 - (BAR_L + 4)) / (N_MAX - 1)
          const cx = BAR_L + 4 + (l - 1) * colW + colW / 2
          const dim = series !== 'all' && series !== l
          return (
            <text
              key={l}
              x={cx}
              y={PLOT_BOTTOM + 14}
              textAnchor="middle"
              fontSize="8.5"
              fill={dim ? '#3f3f46' : '#8f8f98'}
              className="font-mono"
            >
              {seriesName(l)}
            </text>
          )
        })}

        {/* visible-window emission spectrum band */}
        <defs>
          <linearGradient id="visband" x1="0" y1="0" x2="1" y2="0">
            {[380, 420, 460, 490, 510, 550, 580, 620, 645, 700, 780].map((wl) => {
              const x = (wl - 380) / 400
              const c = wavelengthToRGB(wl) ?? '#18181b'
              return <stop key={wl} offset={`${(x * 100).toFixed(1)}%`} stopColor={c} />
            })}
          </linearGradient>
        </defs>
        <text x={BAR_L} y={BAND_TOP - 5} fontSize="8.5" fill="#71717a" className="font-mono">
          visible window · 380–780 nm
          {visibleCount === 0 && ' — no lines fall here for this ion'}
        </text>
        <rect x={BAR_L} y={BAND_TOP} width={BAR_R - BAR_L} height={BAND_H} rx={3} fill="url(#visband)" opacity={0.16} />
        {transitions.map((t) => {
          const c = wavelengthToRGB(t.lambdaNm)
          if (!c) return null
          const x = BAR_L + ((t.lambdaNm - 380) / 400) * (BAR_R - BAR_L)
          const active = shown?.upper === t.upper && shown?.lower === t.lower
          return (
            <rect
              key={`band-${t.upper}-${t.lower}`}
              x={x - 1.2}
              y={BAND_TOP}
              width={2.4}
              height={BAND_H}
              fill={c}
              opacity={active ? 1 : 0.9}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover(t)}
              onClick={() => setSel(t)}
            />
          )
        })}
      </svg>

      {/* series filter chips */}
      <div className="absolute left-2 top-2 flex max-w-[210px] flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setSeries('all')}
          className={`rounded-full border px-1.5 py-0.5 text-[9px] leading-none transition ${
            series === 'all' ? 'border-white/25 bg-white/10 text-zinc-100' : 'border-white/10 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          all
        </button>
        {Array.from({ length: N_MAX - 1 }, (_, i) => i + 1).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setSeries((s) => (s === l ? 'all' : l))}
            className={`rounded-full border px-1.5 py-0.5 text-[9px] leading-none transition ${
              series === l ? 'border-white/25 bg-white/10 text-zinc-100' : 'border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {seriesName(l)}
          </button>
        ))}
      </div>

      {/* photon data card */}
      {shown && <PhotonCard t={shown} z={z} symbol={symbol} />}

      {/* model note */}
      <div className="pointer-events-none absolute bottom-1.5 left-2 font-mono text-[8.5px] text-zinc-600">
        hydrogen-like {symbol}
        <sup>{z - 1}+</sup> · E<sub>n</sub> = −{RYDBERG_EV.toFixed(4)}·Z²/n² eV · E1 transitions ·
        {shown ? '' : ' hover or click any line'}
      </div>
    </div>
  )
}
