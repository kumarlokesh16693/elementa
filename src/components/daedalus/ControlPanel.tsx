'use client'

import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useSim } from './SimProvider'
import { MISSION_ORDER, MISSIONS } from '@/lib/sim/missions'
import { fmtFixed, fmtInt, fmtSig, fmtTime } from '@/lib/sim/format'
import {
  CircleDot,
  Cpu,
  FileDown,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react'

/* ---------------- status badge ---------------- */

const STATUS_STYLE: Record<string, { fg: string; dot: string; pulse: boolean }> = {
  STANDBY: { fg: 'text-zinc-300 border-zinc-500/40', dot: 'bg-zinc-400', pulse: false },
  EXOATMOSPHERIC: { fg: 'text-sky-300 border-sky-500/40', dot: 'bg-sky-400', pulse: false },
  'PLASMA BUILDUP': { fg: 'text-amber-300 border-amber-500/50', dot: 'bg-amber-400', pulse: true },
  'IONIZATION BLACKOUT': { fg: 'text-red-300 border-red-500/60', dot: 'bg-red-500', pulse: true },
  'PLASMA EXIT': { fg: 'text-amber-300 border-amber-500/50', dot: 'bg-amber-400', pulse: true },
  HYPERSONIC: { fg: 'text-cyan-300 border-cyan-500/40', dot: 'bg-cyan-400', pulse: false },
  SUPERSONIC: { fg: 'text-cyan-200 border-cyan-400/30', dot: 'bg-cyan-300', pulse: false },
  TRANSONIC: { fg: 'text-emerald-200 border-emerald-400/30', dot: 'bg-emerald-300', pulse: false },
  SUBSONIC: { fg: 'text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', pulse: false },
  TOUCHDOWN: { fg: 'text-emerald-300 border-emerald-500/60', dot: 'bg-emerald-400', pulse: true },
  CAPTURED: { fg: 'text-emerald-300 border-emerald-500/60', dot: 'bg-emerald-400', pulse: true },
}

function StatusBadge() {
  const { ui } = useSim()
  const st = STATUS_STYLE[ui.status] ?? STATUS_STYLE.STANDBY
  const sig = Math.round(ui.attenuation * 100)
  return (
    <div>
      <div
        className={`flex items-center gap-2.5 rounded-md border bg-black/40 px-3 py-2.5 font-mono text-sm font-bold tracking-[0.2em] ${st.fg}`}
      >
        <span className="relative flex h-2.5 w-2.5">
          {st.pulse && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${st.dot}`} />
          )}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${st.dot}`} />
        </span>
        {ui.status}
      </div>
      <div className="mt-1.5 flex justify-between px-1 font-mono text-[10px] text-zinc-500">
        <span>
          SIG LINK <span className={sig > 80 ? 'text-red-400' : sig > 40 ? 'text-amber-400' : 'text-emerald-400'}>
            {sig}%
          </span> ATTN
        </span>
        <span>DATA {(ui.dataRate).toFixed(1)} kbps</span>
        <span>T+ {fmtTime(ui.t)}</span>
      </div>
    </div>
  )
}

/* ---------------- slider row ---------------- */

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  disabled,
  tag,
  onChange,
}: {
  label: string
  value: number
  display: string
  min: number
  max: number
  step: number
  disabled?: boolean
  tag?: string
  onChange: (v: number) => void
}) {
  return (
    <div className={disabled ? 'opacity-60' : ''}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-widest text-zinc-400">
          {label}
          {tag && <span className="ml-2 rounded bg-amber-500/20 px-1 text-[8px] text-amber-400">{tag}</span>}
        </span>
        <span className="font-mono text-xs font-bold text-amber-400">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(vals) => onChange(vals[0])}
        className="cursor-pointer"
      />
    </div>
  )
}

/* ---------------- metric tile ---------------- */

function Metric({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string
  unit: string
  accent?: boolean
}) {
  return (
    <div className="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
      <div className="font-mono text-[8.5px] tracking-widest text-zinc-500">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className={`font-mono text-[15px] font-bold leading-none ${
            accent ? 'text-amber-400' : 'text-zinc-100'
          }`}
        >
          {value}
        </span>
        <span className="font-mono text-[9px] text-zinc-500">{unit}</span>
      </div>
    </div>
  )
}

/* ---------------- main panel ---------------- */

export function ControlPanel() {
  const { engine, ui } = useSim()
  const [scrubbing, setScrubbing] = useState(false)

  const loadMission = useCallback(
    (id: (typeof MISSION_ORDER)[number]) => engine.loadMission(id),
    [engine]
  )

  const downloadCsv = useCallback(() => {
    const csv = engine.buildCsv()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daedalus_${ui.missionId}_${fmtTime(ui.t).replace(/:/g, 'm')}_${Math.round(ui.t)}s.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [engine, ui.missionId, ui.t])

  const tMax = useMemo(() => Math.max(60, Math.ceil(ui.t / 10) * 10), [ui.t])
  const peak = useMemo(() => engine.peaks(), [engine, ui.version])

  const apBypass = ui.autopilot

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* header */}
      <header>
        <h1 className="font-mono text-xl font-black tracking-[0.28em] text-zinc-100">
          <span className="text-amber-500">◤</span> PROJECT DAEDALUS
        </h1>
        <p className="mt-1 font-mono text-[9px] leading-relaxed tracking-[0.18em] text-zinc-500">
          HYPERSONIC REENTRY AEROTHERMODYNAMICS
          <br />& GNC FLIGHT SUPERVISOR
        </p>
      </header>

      {/* telemetry status */}
      <section>
        <SectionTitle>TELEMETRY LINK</SectionTitle>
        <StatusBadge />
      </section>

      {/* warnings */}
      {ui.warnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {ui.warnings.map((w) => (
            <div
              key={w}
              className="animate-pulse rounded border border-red-500/50 bg-red-950/50 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-widest text-red-300"
            >
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {/* mission presets */}
      <section>
        <SectionTitle>MISSION PRESET</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {MISSION_ORDER.map((id) => {
            const m = MISSIONS[id]
            const active = ui.missionId === id
            return (
              <button
                key={id}
                onClick={() => loadMission(id)}
                className={`rounded border px-2.5 py-2 text-left font-mono text-[10px] font-bold tracking-wider transition-all ${
                  active
                    ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                }`}
              >
                {m.short}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 px-0.5 font-mono text-[9px] leading-snug text-zinc-500">
          {ui.vehicleBlurb}
        </p>
      </section>

      {/* flight controls */}
      <section>
        <SectionTitle>FLIGHT CONTROLS</SectionTitle>
        <div className="grid grid-cols-5 gap-1.5">
          <CtlButton
            active={ui.autopilot}
            onClick={() => engine.toggleAutopilot()}
            label="A/P"
            title="Autopilot"
          >
            <Cpu className="h-3.5 w-3.5" />
          </CtlButton>
          <CtlButton
            active={!ui.paused && !ui.landed}
            onClick={() => engine.togglePause()}
            label={ui.paused ? 'RUN' : 'HOLD'}
            title="Pause / resume"
          >
            {ui.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </CtlButton>
          <CtlButton onClick={() => engine.reset()} label="RST" title="Reset mission">
            <RotateCcw className="h-3.5 w-3.5" />
          </CtlButton>
          <CtlButton onClick={downloadCsv} label="CSV" title="Export telemetry CSV">
            <FileDown className="h-3.5 w-3.5" />
          </CtlButton>
          <CtlButton
            active={ui.recording}
            onClick={() => engine.toggleRecording()}
            label={ui.recording ? `${(ui.recCount / 1000).toFixed(1)}k` : 'REC'}
            title="Record full-rate telemetry"
          >
            <CircleDot className={`h-3.5 w-3.5 ${ui.recording ? 'animate-pulse text-red-400' : ''}`} />
          </CtlButton>
        </div>
      </section>

      {/* guidance & control sliders */}
      <section>
        <SectionTitle>GUIDANCE & CONTROL</SectionTitle>
        <div className="flex flex-col gap-3">
          <SliderRow
            label="ANGLE OF ATTACK"
            value={ui.alpha}
            display={`${fmtFixed(ui.alpha, 1)}°`}
            min={0}
            max={40}
            step={0.5}
            disabled={apBypass}
            tag={apBypass ? 'A/P' : undefined}
            onChange={(v) => engine.setAlpha(v)}
          />
          <SliderRow
            label="BANK ANGLE (LIFT AXIS)"
            value={ui.sigma}
            display={`${fmtFixed(ui.sigma, 1)}°`}
            min={0}
            max={180}
            step={1}
            disabled={apBypass}
            tag={apBypass ? 'A/P' : undefined}
            onChange={(v) => engine.setSigma(v)}
          />
          <div className="my-1 h-px bg-white/8" />
          <SliderRow
            label="ALTITUDE"
            value={Math.min(ui.h / 1000, 140)}
            display={`${fmtFixed(ui.h / 1000, 1)} km`}
            min={0}
            max={140}
            step={0.1}
            onChange={(v) => engine.overrideAltitude(v * 1000)}
          />
          <SliderRow
            label="VELOCITY"
            value={Math.min(ui.v / 1000, 11.5)}
            display={`${fmtFixed(ui.v / 1000, 2)} km/s`}
            min={0.05}
            max={11.5}
            step={0.01}
            onChange={(v) => engine.overrideVelocity(v * 1000)}
          />
          <SliderRow
            label="FLIGHT PATH ANGLE"
            value={ui.gamma}
            display={`${ui.gamma >= 0 ? '+' : ''}${fmtFixed(ui.gamma, 2)}°`}
            min={-15}
            max={15}
            step={0.05}
            onChange={(v) => engine.overrideGamma(v)}
          />
          <div className="my-1 h-px bg-white/8" />
          <SliderRow
            label="SIM TIME"
            value={Math.min(ui.t, tMax)}
            display={scrubbing ? `T+ ${fmtTime(ui.t)} · HOLD` : `T+ ${fmtTime(ui.t)}`}
            min={0}
            max={tMax}
            step={0.5}
            onChange={(v) => {
              setScrubbing(true)
              engine.scrubTo(v)
            }}
          />
        </div>
      </section>

      {/* aerothermodynamics */}
      <section>
        <SectionTitle>AEROTHERMODYNAMICS</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          <Metric label="MACH NUMBER" value={fmtFixed(ui.mach, 1)} unit="M" accent />
          <Metric label="ATM DENSITY" value={fmtSig(ui.rho, 3)} unit="kg/m³" />
          <Metric label="DYN PRESSURE" value={fmtFixed(ui.q, 1)} unit="kPa" />
          <Metric label="CONV HEAT FLUX" value={fmtFixed(ui.heat, 1)} unit="W/cm²" accent />
          <Metric label="SHOCK LAYER TEMP" value={fmtInt(ui.tShock)} unit="K" />
          <Metric label="DECELERATION" value={fmtFixed(ui.g, 2)} unit="G" />
          <Metric label="L/D RATIO" value={fmtFixed(ui.ld, 2)} unit="" />
          <Metric label="DOWNRANGE" value={fmtInt(ui.downrange)} unit="km" />
        </div>
        <div className="mt-1.5 flex justify-between rounded border border-white/8 bg-white/[0.02] px-2.5 py-1.5 font-mono text-[9px] text-zinc-500">
          <span>
            RAD HEAT <span className="text-zinc-300">{fmtFixed(ui.heatR, 2)}</span> W/cm²
          </span>
          <span>
            INTEGRATED <span className="text-zinc-300">{fmtFixed(ui.heatLoad, 1)}</span> MJ/m²
          </span>
          <span>
            BANK <span className="text-zinc-300">{fmtFixed(ui.sigma, 0)}°</span>
          </span>
        </div>
      </section>

      {/* vehicle summary */}
      <section className="pb-2">
        <SectionTitle>FLIGHT CARD</SectionTitle>
        <div className="space-y-1 rounded border border-white/8 bg-white/[0.02] px-3 py-2.5 font-mono text-[10px] text-zinc-400">
          <Row k="MISSION" v={ui.missionName} />
          <Row k="BODY" v={`${ui.planetName} · R=${(ui.planetId === 'mars' ? 3389.5 : 6371).toFixed(0)} km`} />
          <Row k="VEHICLE" v={ui.vehicleName} />
          <Row k="MODE" v={ui.mode.toUpperCase()} />
          <Row k="PEAK Q̇ / n" v={`${fmtFixed(peak.heat, 0)} W/cm² · ${fmtFixed(peak.g, 1)} G`} />
          <Row k="SIG ATTENUATION" v={`${Math.round(ui.attenuation * 100)} %`} />
        </div>
      </section>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="h-2.5 w-0.5 bg-amber-500" />
      <h2 className="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">{children}</h2>
      <span className="h-px flex-1 bg-white/8" />
    </div>
  )
}

function CtlButton({
  children,
  label,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  title: string
}) {
  return (
    <Button
      variant="outline"
      title={title}
      onClick={onClick}
      className={`flex h-auto flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider ${
        active
          ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
          : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
      }`}
    >
      {children}
      <span>{label}</span>
    </Button>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-600">{k}</span>
      <span className="text-right text-zinc-300">{v}</span>
    </div>
  )
}
