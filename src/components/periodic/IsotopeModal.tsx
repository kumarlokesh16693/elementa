'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ElementData } from '@/lib/periodic/types'
import { ELEMENTS, getElement } from '@/lib/periodic'
import {
  ISOTOPES,
  DECAY_CHAINS,
  SERIES_NOTE,
  daughterOf,
  type DecayChain,
  type IsoEntry,
} from '@/lib/periodic/isotopes'
import { isTopModal, popModal, pushModal } from '@/lib/modalStack'

interface IsotopeModalProps {
  element: ElementData
  accent: string
  open: boolean
  onClose: () => void
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

const MODE_TINT: Record<string, string> = {
  α: '#fbbf24',
  'β⁻': '#38bdf8',
  'β⁺': '#c084fc',
  EC: '#c084fc',
  '2β⁻': '#38bdf8',
  SF: '#fb7185',
  IT: '#a1a1aa',
}

function modeTint(mode: string): string {
  if (MODE_TINT[mode]) return MODE_TINT[mode]
  if (mode.includes('α')) return '#fbbf24'
  if (mode.includes('β⁻')) return '#38bdf8'
  if (mode.includes('EC')) return '#c084fc'
  return '#a1a1aa'
}

/* ------------------------------ isotope table ------------------------------ */

function IsotopeTable({ el, accent }: { el: ElementData; accent: string }) {
  const rows = ISOTOPES[el.number] ?? []
  if (rows.length === 0) {
    return <p className="text-[11px] text-zinc-500">No isotope data tracked for this element.</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="bg-white/[0.04] text-[9px] uppercase tracking-wider text-zinc-500">
            <th className="px-2.5 py-1.5 font-medium">Nuclide</th>
            <th className="px-2.5 py-1.5 font-medium">Natural abundance</th>
            <th className="px-2.5 py-1.5 font-medium">Half-life</th>
            <th className="px-2.5 py-1.5 font-medium">Decay →</th>
            <th className="px-2.5 py-1.5 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: IsoEntry, i) => {
            const stable = r.abundance != null && !r.halfLife
            const daughter = daughterOf(el.number, r.a, r.decay)
            return (
              <tr
                key={`${r.a}-${i}`}
                className={`border-t border-white/5 text-[11px] ${
                  stable ? 'bg-emerald-400/[0.05]' : i % 2 ? 'bg-white/[0.015]' : ''
                }`}
              >
                <td className="whitespace-nowrap px-2.5 py-1.5 font-mono">
                  <sup className="text-zinc-500">{r.a}</sup>
                  <span className="ml-0.5 font-semibold" style={{ color: accent }}>
                    {el.symbol}
                  </span>
                  {r.note?.includes('(ᵐ)') || r.halfLife?.includes('(ᵐ)') ? (
                    <span className="ml-1 text-[9px] text-zinc-500">isomer</span>
                  ) : null}
                  {stable && (
                    <span className="ml-1.5 rounded bg-emerald-400/15 px-1 py-px text-[8.5px] text-emerald-300">
                      stable
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2.5 py-1.5 font-mono text-zinc-300">
                  {r.abundance != null ? `${r.abundance}%` : '—'}
                </td>
                <td className="whitespace-nowrap px-2.5 py-1.5 font-mono text-zinc-300">
                  {r.halfLife ?? (stable ? '≥ 10¹⁵ a' : '—')}
                </td>
                <td className="whitespace-nowrap px-2.5 py-1.5 font-mono">
                  {r.decay ? (
                    <>
                      <span style={{ color: modeTint(r.decay) }}>{r.decay}</span>
                      {daughter && <span className="text-zinc-500"> → {daughter}</span>}
                    </>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-2.5 py-1.5 text-[10.5px] leading-snug text-zinc-400">
                  {r.note ?? ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------ chain flow ------------------------------ */

function ChainStepBox({
  z,
  a,
  halfLife,
  mode,
  highlight,
}: {
  z: number
  a: number
  halfLife: string
  mode: string
  highlight: boolean
}) {
  const el = getElement(z)
  if (!el) return null
  const stable = halfLife === 'stable'
  return (
    <div
      className={`w-[86px] shrink-0 rounded-lg border px-1 py-1.5 text-center ${
        stable
          ? 'border-emerald-400/60 bg-emerald-400/10'
          : 'border-white/12 bg-white/[0.03]'
      } ${highlight ? 'ring-1 ring-sky-400/70' : ''}`}
    >
      <div className="font-mono text-[9px] leading-none text-zinc-500">{a}</div>
      <div
        className="text-[15px] font-bold leading-tight"
        style={{ color: stable ? '#34d399' : '#e4e4e7' }}
      >
        {el.symbol}
      </div>
      <div className="font-mono text-[8.5px] leading-tight text-zinc-400">
        {stable ? 'stable' : halfLife}
      </div>
      {mode && !stable && (
        <div className="mt-0.5 text-[9px] font-medium leading-none" style={{ color: modeTint(mode) }}>
          {mode}
        </div>
      )}
    </div>
  )
}

function ChainArrow({ mode }: { mode: string }) {
  return (
    <div className="flex w-6 shrink-0 flex-col items-center justify-center">
      <span className="text-[8px] leading-none" style={{ color: modeTint(mode) }}>
        {mode}
      </span>
      <span className="text-[12px] leading-none text-zinc-600">→</span>
    </div>
  )
}

function DecayChainView({ chain, z }: { chain: DecayChain; z: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[12px] font-semibold text-zinc-200">{chain.name}</span>
        <span className="font-mono text-[10px] text-zinc-500">
          {chain.family} family · {chain.head} → {chain.terminal} · {chain.steps.length - 1} decays
        </span>
        <span className="ml-auto font-mono text-[9px] text-zinc-600">
          α = helium nucleus · β⁻ = electron emission
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-y-3">
        {chain.steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <ChainStepBox z={s.z} a={s.a} halfLife={s.halfLife} mode={s.mode} highlight={s.z === z} />
            {i < chain.steps.length - 1 && <ChainArrow mode={chain.steps[i].mode} />}
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[9.5px] leading-relaxed text-zinc-600">
        Main decay path; secondary branches (e.g. ²¹²Bi → ²⁰⁸Tl, ~36% α branch) omitted for
        clarity. Blue outline marks boxes containing the currently selected element.
      </p>
    </div>
  )
}

/* ------------------------------ main modal ------------------------------ */

export default function IsotopeModal({ element, accent, open, onClose }: IsotopeModalProps) {
  const [z, setZ] = useState(element.number)
  const [chainKey, setChainKey] = useState<string>('4n2')

  /* sync when opened for a (possibly different) element */
  useEffect(() => {
    if (open) setZ(element.number)
  }, [open, element.number])

  /* auto-select a chain containing this element when switching */
  useEffect(() => {
    const containing = DECAY_CHAINS.find((c) => c.steps.some((s) => s.z === z))
    if (containing) setChainKey(containing.key)
  }, [z])

  /* close with Escape — only if this overlay is on top of the stack */
  const modalId = useRef(Symbol('isotope-modal'))
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

  const el = useMemo(() => getElement(z) ?? element, [z, element])
  const chain = DECAY_CHAINS.find((c) => c.key === chainKey) ?? DECAY_CHAINS[0]

  if (!open) return null

  const accentEl = accent

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${el.name} isotope explorer`}
    >
      <div
        className="modal-card flex h-full max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0f18] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 px-4 py-3">
          <div
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border"
            style={{
              background: `${accentEl}1f`,
              borderColor: `${accentEl}80`,
            }}
          >
            <span className="font-mono text-[8px] leading-none opacity-75" style={{ color: accentEl }}>
              {el.number}
            </span>
            <span className="text-base font-bold leading-tight" style={{ color: accentEl }}>
              {el.symbol}
            </span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-100">
              {el.name} — isotope explorer
            </div>
            <div className="font-mono text-[10px] text-zinc-500">
              {el.mass} u · {el.radioactive ? 'all isotopes radioactive' : 'stable element'} ·
              data: notable isotopes, not exhaustive
            </div>
          </div>
          <select
            value={z}
            onChange={(e) => setZ(parseInt(e.target.value, 10))}
            aria-label="Pick element"
            className="ml-auto rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none"
          >
            {ELEMENTS.map((e2) => (
              <option key={e2.number} value={e2.number}>
                {e2.number} · {e2.symbol} — {e2.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close isotope explorer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-white/30 hover:text-zinc-100"
          >
            <CloseIcon />
          </button>
        </div>

        {/* body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          {/* isotope table */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              <span className="inline-block h-3 w-[3px] rounded-full" style={{ background: accentEl }} />
              Key isotopes of {el.name}
            </h3>
            <IsotopeTable el={el} accent={accentEl} />
          </section>

          {/* decay chains */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              <span className="inline-block h-3 w-[3px] rounded-full" style={{ background: accentEl }} />
              Natural radioactive decay series
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {DECAY_CHAINS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setChainKey(c.key)}
                  className={`rounded-full border px-2.5 py-1 text-[10.5px] transition ${
                    c.key === chainKey
                      ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                      : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                  }`}
                >
                  {c.name} ({c.family})
                </button>
              ))}
            </div>
            <DecayChainView chain={chain} z={z} />
            <p className="text-[9.5px] leading-relaxed text-zinc-600">{SERIES_NOTE}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
