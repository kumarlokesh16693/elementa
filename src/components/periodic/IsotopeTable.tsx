'use client'

import type { ElementData } from '@/lib/periodic/types'
import { isotopeSummary, isotopesOf } from '@/lib/periodic/isotopes'

export function IsotopeTable({ element }: { element: ElementData }) {
  const list = isotopesOf(element.number)
  const { stable, radioactive } = isotopeSummary(element.number)

  if (list.length === 0) {
    return <p className="text-[13px] text-zinc-400">No curated isotope data for this element.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
          {stable} stable
        </span>
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-300">
          {radioactive} radioisotopes listed
        </span>
        <span className="text-zinc-600">of {list.length} notable nuclides</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/[0.08]">
        <table className="w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03] text-[9.5px] uppercase tracking-[0.12em] text-zinc-500">
              <th className="px-3 py-2 font-medium">Nuclide</th>
              <th className="px-3 py-2 font-medium">Abundance</th>
              <th className="px-3 py-2 font-medium">Half-life</th>
              <th className="px-3 py-2 font-medium">Decay</th>
              <th className="px-3 py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {list.map((iso) => {
              const isStable = iso.halfLife === 'stable'
              const isMain = iso.abundance != null && iso.abundance >= 50
              return (
                <tr
                  key={iso.A}
                  className={`border-b border-white/[0.04] last:border-0 ${
                    isMain ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-1.5">
                    <sup className="text-zinc-500">{iso.A}</sup>
                    <span className="font-semibold text-zinc-100">{element.symbol}</span>
                    {isStable ? (
                      <span
                        className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
                        title="stable"
                      />
                    ) : (
                      <span
                        className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
                        title="radioactive"
                      />
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-zinc-300">
                    {iso.abundance != null ? `${iso.abundance} %` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5">
                    {isStable ? (
                      <span className="text-emerald-300">stable</span>
                    ) : (
                      <span className="text-amber-300/90">{iso.halfLife}</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-zinc-300">{iso.decay || '—'}</td>
                  <td className="max-w-[180px] px-3 py-1.5 text-[10px] leading-snug text-zinc-500">
                    {iso.note || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] leading-relaxed text-zinc-600">
        Natural abundances: IUPAC 2021. Half-lives: NuDat/ENSDF; superheavy values are approximate.
        Some primordial nuclides are observationally stable but theoretically unstable (α or 2β⁻
        predicted) — the decay column shows the predicted mode.
      </p>
    </div>
  )
}
