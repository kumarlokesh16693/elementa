'use client'

// Detail panel for a selected nuclide: half-life, decay modes with computed
// Q values (from atomic mass excesses), decay chain, nuclear properties and
// ENSDF provenance.

import Link from 'next/link'
import {
  catOf,
  catColor,
  CATS,
  formatHl,
  formatHlSci,
  atomicMassU,
  qFor,
  chainOf,
  decayLabel,
  type Nuclide,
} from '@/lib/periodic/nuclides'

interface Props {
  nuc: Nuclide
  showPath: boolean
  onTogglePath: () => void
  onClose: () => void
  onSelect: (n: Nuclide) => void
}

function fmtQ(q: number): string {
  const a = Math.abs(q)
  if (a >= 1000) return `${(q / 1000).toFixed(2)} MeV`
  if (a >= 100) return `${q.toFixed(0)} keV`
  if (a >= 10) return `${q.toFixed(1)} keV`
  return `${q.toFixed(2)} keV`
}

export default function NuclidePanel({ nuc, showPath, onTogglePath, onClose, onSelect }: Props) {
  const cat = catOf(nuc)
  const catInfo = CATS.find((c) => c.key === cat)!
  const chain = chainOf(nuc)
  const mass = atomicMassU(nuc)

  return (
    <aside
      className="pointer-events-auto flex max-h-[52dvh] w-full flex-col overflow-hidden rounded-t-xl border border-white/10 bg-[#0a0f18]/97 shadow-2xl backdrop-blur md:max-h-none md:w-[342px] md:rounded-none md:border-y-0 md:border-r-0"
      data-testid="nuclide-panel"
    >
      {/* header */}
      <div className="flex shrink-0 items-start gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-semibold text-zinc-400">{sup(nuc.a)}</span>
            <span className="truncate text-[26px] font-bold leading-none text-zinc-50">{nuc.sym}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: `${catInfo.color}22`, color: catInfo.color }}
            >
              {catInfo.label}
            </span>
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-zinc-500">
            Z {nuc.z} · N {nuc.n} · A {nuc.a}
            {nuc.z === 0 && ' · free neutron'}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close nuclide details"
          onClick={onClose}
          className="ml-auto shrink-0 rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-white/30 hover:text-zinc-100"
        >
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-3">
        {/* half-life */}
        <section>
          <div className="mb-1 text-[9px] uppercase tracking-wider text-zinc-500">Half-life</div>
          <div className="font-mono text-[15px] font-semibold text-amber-300">
            {formatHl(nuc)}
          </div>
          {formatHlSci(nuc) && (
            <div className="font-mono text-[10.5px] text-zinc-500">
              {formatHlSci(nuc)}
              {nuc.hlOp !== '' && ' (experimental bound)'}
            </div>
          )}
          {nuc.unbound && (
            <p className="mt-1 text-[10.5px] leading-relaxed text-zinc-500">
              This nuclide is particle-unbound — observed only as a resonance; the value quoted is
              its width, not a lifetime.
            </p>
          )}
        </section>

        {/* decay modes + Q values */}
        {nuc.decays.length > 0 && (
          <section>
            <div className="mb-1.5 text-[9px] uppercase tracking-wider text-zinc-500">
              Decay modes & Q values
            </div>
            <div className="space-y-1">
              {nuc.decays.map((d) => {
                const q = qFor(nuc, d.code)
                return (
                  <div
                    key={d.code}
                    className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px]"
                  >
                    <span className="font-semibold text-zinc-100">{decayLabel(d.code)}</span>
                    <span className="text-zinc-500">{d.pct != null ? `${d.pct}%` : 'branch % not given'}</span>
                    <span className="ml-auto text-[10.5px] text-sky-300/90">
                      {q != null ? `Q ${fmtQ(q)}` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-1 text-[9.5px] leading-relaxed text-zinc-600">
              Q computed on the fly from ground-state atomic mass excesses (daughter must be known).
            </p>
          </section>
        )}

        {/* decay chain */}
        {chain.length > 1 && (
          <section>
            <div className="mb-1.5 text-[9px] uppercase tracking-wider text-zinc-500">
              Dominant decay chain ({chain.length} steps)
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {chain.map((c, i) => (
                <span key={`${c.z}:${c.n}`} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="text-[9.5px] text-zinc-600">
                      {decayLabel(chain[i - 1].decays[0]?.code ?? '')} →
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect(c)}
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10.5px] transition hover:brightness-125 ${
                      c.stable
                        ? 'border-white/40 bg-white/10 font-semibold text-white'
                        : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/30'
                    }`}
                  >
                    {c.sym}-{c.a}
                  </button>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* properties */}
        <section>
          <div className="mb-1.5 text-[9px] uppercase tracking-wider text-zinc-500">Properties</div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-zinc-500">Spin-parity</dt>
            <dd className="text-right text-zinc-200">{nuc.jp || '—'}</dd>
            <dt className="text-zinc-500">Nat. abundance</dt>
            <dd className="text-right text-zinc-200">{nuc.abundance != null ? `${nuc.abundance}%` : '—'}</dd>
            <dt className="text-zinc-500">Atomic mass</dt>
            <dd className="text-right text-zinc-200">{mass != null ? `${mass.toFixed(5)} u` : '—'}</dd>
            <dt className="text-zinc-500">Mass excess</dt>
            <dd className="text-right text-zinc-200">{nuc.me != null ? `${nuc.me.toLocaleString()} keV` : '—'}</dd>
            <dt className="text-zinc-500">Discovered</dt>
            <dd className="text-right text-zinc-200">{nuc.discovery ?? '—'}</dd>
            <dt className="text-zinc-500">Nucleus</dt>
            <dd className="text-right text-zinc-200">
              {nuc.z}p {nuc.n}n
            </dd>
          </dl>
        </section>

        {/* actions */}
        <section className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={onTogglePath}
            className={`rounded-md border px-2.5 py-1.5 text-[10.5px] font-medium transition ${
              showPath
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/30'
            }`}
          >
            Decay arrows {showPath ? 'on' : 'off'}
          </button>
          {nuc.z > 0 && (
            <Link
              href={`/?e=${nuc.z}`}
              className="rounded-md border border-sky-400/40 bg-sky-400/10 px-2.5 py-1.5 text-[10.5px] font-medium text-sky-300 transition hover:bg-sky-400/20"
            >
              Element {nuc.sym} ↗
            </Link>
          )}
        </section>

        <p className="border-t border-white/5 pt-2.5 text-[9px] leading-relaxed text-zinc-600">
          Ground-state nuclear data: IAEA LiveChart (ENSDF cut-off 2023-10-18). Branching %, Q
          values and masses as evaluated by ENSDF; half-life bounds (&lt;/&gt;) reflect the
          experimental limit where no direct measurement exists.
        </p>
      </div>
    </aside>
  )
}

/* superscript mass number for the header (e.g. ²³⁸) */
const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
function sup(v: number): string {
  return String(v)
    .split('')
    .map((ch) => SUPS[+ch] ?? ch)
    .join('')
}
