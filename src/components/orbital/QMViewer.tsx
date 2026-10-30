'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { getElement } from '@/lib/periodic'
import {
  combosOf,
  defaultSelection,
  occupancyOf,
  orbitalLabel,
  parseConfig,
  slaterZeff,
  subshellLabel,
  type RealOrbital,
} from '@/lib/orbital'
import OrbitalCanvas, { type OrbitalMode } from './OrbitalCanvas'

interface QMViewerProps {
  z: number
  /** modal-compact chrome vs page-style (reserved) */
  compact?: boolean
  paused?: boolean
  speed?: number
}

/**
 * Element-tied true-QM orbital viewer used inside the element detail modal.
 * Shows hydrogenic ψ with Slater effective nuclear charge scaling; pick any
 * occupied subshell + real Cartesian combination, switch isosurface/cloud.
 */
export default function QMViewer({ z, paused = false, speed = 1 }: QMViewerProps) {
  const el = getElement(z)!
  const occupied = useMemo(() => parseConfig(el.config), [el.config])
  const defSel = useMemo(() => defaultSelection(occupied), [occupied])

  const [sel, setSel] = useState<RealOrbital>(defSel)
  const [lastDef, setLastDef] = useState(defSel)
  if (lastDef !== defSel) {
    /* element changed — reset selection during render (React-recommended) */
    setLastDef(defSel)
    setSel(defSel)
  }

  const [mode, setMode] = useState<OrbitalMode>('surface')
  const [isoT, setIsoT] = useState(0.7) // iso ≈ 0.176 — clean lobe/torus topology
  const iso = 0.03 + Math.pow(isoT, 2.2) * 0.32

  const occ = occupancyOf(occupied, sel.n, sel.l)
  const { zeff, sigma } = slaterZeff(el.number, { n: sel.n, l: sel.l, e: occ }, occupied)
  const combos = combosOf(sel.l)
  const comboIdx = Math.max(
    0,
    combos.findIndex((c) => c.m === sel.m && c.sin === sel.sin),
  )

  const pickSubshell = (n: number, l: number) => {
    const c = combosOf(l)[0]
    setSel({ n, l, m: c.m, sin: c.sin })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <OrbitalCanvas
          orbital={sel}
          zEff={zeff}
          mode={mode}
          iso={iso}
          gridN={60}
          autoRotate={!paused}
          speed={speed}
        />
        <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[9.5px] text-zinc-300 backdrop-blur-sm">
          {orbitalLabel(sel)} · Z<sub>eff</sub> {zeff.toFixed(2)} ·{' '}
          {occ > 0 ? `${occ} e⁻` : 'virtual'}
        </div>
        <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 font-mono text-[9px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> ψ&gt;0
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" /> ψ&lt;0
          </span>
          <span className="hidden sm:inline">· drag to orbit · scroll to zoom</span>
        </div>
      </div>

      <div className="relative z-10 shrink-0 space-y-2 border-t border-white/10 px-3 py-2">
        {/* occupied subshell chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {occupied.map((s, i) => {
            const active = sel.n === s.n && sel.l === s.l
            return (
              <button
                key={`${s.n}-${s.l}-${i}`}
                type="button"
                onClick={() => pickSubshell(s.n, s.l)}
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none transition ${
                  active
                    ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                    : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                }`}
              >
                {subshellLabel(s)}
              </button>
            )
          })}
          <span className="ml-auto font-mono text-[9px] text-zinc-600">
            σ = {sigma.toFixed(2)} · Slater rules
          </span>
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-white/10">
            {(['surface', 'cloud'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-2 py-0.5 text-[10px] lowercase transition ${
                  mode === m ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <select
            value={comboIdx}
            onChange={(e) => {
              const c = combos[parseInt(e.target.value, 10)] ?? combos[0]
              setSel({ ...sel, m: c.m, sin: c.sin })
            }}
            aria-label="Real orbital combination"
            className="rounded-md border border-white/10 bg-[#0c1220] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 focus:outline-none"
          >
            {combos.map((c, i) => (
              <option key={`${c.m}-${c.sin}`} value={i} className="bg-[#0c1220]">
                {sel.n}
                {c.suffix ? `_${c.suffix}` : ''}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-zinc-500">iso</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isoT}
              onChange={(e) => setIsoT(parseFloat(e.target.value))}
              className="w-16"
              aria-label="Isosurface threshold"
            />
          </div>
          <Link
            href={`/orbitals?z=${z}`}
            className="ml-auto rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-300 transition hover:bg-sky-400/20"
          >
            open orbital lab →
          </Link>
        </div>
      </div>
    </div>
  )
}
