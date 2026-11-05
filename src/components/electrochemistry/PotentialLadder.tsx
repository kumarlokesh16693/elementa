/**
 * Standard Reduction Potential (E° vs SHE) Electrochemical Series Ladder
 * Interactive table sorted by oxidizing/reducing strength with 1-click galvanic cell pairing.
 */

import { h, type VNode } from 'nexus-framework'
import { HALF_REACTIONS } from '@/lib/electrochemistry/database'
import type { HalfReaction } from '@/lib/electrochemistry/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

export function PotentialLadder({
  anodeId,
  cathodeId,
  searchQuery = '',
  onSetAnode,
  onSetCathode,
}: {
  anodeId: string
  cathodeId: string
  searchQuery?: string
  onSetAnode: (reaction: HalfReaction) => void
  onSetCathode: (reaction: HalfReaction) => void
}): VNode {
  const filtered = HALF_REACTIONS.filter((rxn) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      rxn.name.toLowerCase().includes(q) ||
      rxn.equation.toLowerCase().includes(q) ||
      rxn.metal.toLowerCase().includes(q) ||
      rxn.ionSpecies.toLowerCase().includes(q)
    )
  })

  return H('div', { class: 'rounded-xl border border-white/10 bg-[#0c1220] p-3 flex flex-col space-y-2' },
    // Ladder Header
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2' },
      H('div', null,
        H('h3', { class: 'text-[14px] font-bold text-zinc-100 flex items-center gap-2' },
          H('span', null, '📊'),
          'Standard Reduction Potential Series (E° vs SHE at 298.15 K)',
        ),
        H('p', { class: 'text-[10px] text-zinc-400 font-mono mt-0.5' },
          'Top: Strongest Oxidizing Agents (Cathodes) · Bottom: Strongest Reducing Agents (Anodes)'
        ),
      ),
      H('div', { class: 'flex items-center gap-2 text-[10px] font-mono' },
        H('span', { class: 'rounded bg-rose-500/20 text-rose-300 px-2 py-0.5' }, 'Active Anode: ' + (HALF_REACTIONS.find(h => h.id === anodeId)?.metal ?? 'Zn')),
        H('span', { class: 'rounded bg-sky-500/20 text-sky-300 px-2 py-0.5' }, 'Active Cathode: ' + (HALF_REACTIONS.find(h => h.id === cathodeId)?.metal ?? 'Cu')),
      ),
    ),

    // Table of Half Reactions
    H('div', { class: 'overflow-x-auto max-h-[500px] overflow-y-auto pr-1' },
      H('table', { class: 'w-full text-left font-mono text-[11px]' },
        H('thead', { class: 'sticky top-0 bg-[#0c1220] border-b border-white/10 text-zinc-400 text-[10px] uppercase z-10' },
          H('tr', null,
            H('th', { class: 'py-2 px-2.5' }, 'Half-Reaction (Reduction)'),
            H('th', { class: 'py-2 px-2.5' }, 'Name & Species'),
            H('th', { class: 'py-2 px-2.5' }, 'Electrons n'),
            H('th', { class: 'py-2 px-2.5' }, 'E° (V vs SHE)'),
            H('th', { class: 'py-2 px-2.5 text-right' }, 'Action Pair'),
          ),
        ),
        H('tbody', { class: 'divide-y divide-white/5' },
          ...filtered.map((rxn) => {
            const isAnode = rxn.id === anodeId
            const isCathode = rxn.id === cathodeId
            const isSHE = rxn.id === 'h2-she'

            const potentialColor =
              rxn.standardPotential > 1.0
                ? 'text-rose-400 font-bold'
                : rxn.standardPotential > 0
                ? 'text-amber-300 font-bold'
                : rxn.standardPotential === 0
                ? 'text-sky-300 font-bold'
                : 'text-violet-300 font-bold'

            return H('tr', {
              key: rxn.id,
              class: `hover:bg-white/[0.04] transition ${
                isAnode
                  ? 'bg-rose-500/10'
                  : isCathode
                  ? 'bg-sky-500/10'
                  : isSHE
                  ? 'bg-white/[0.03]'
                  : ''
              }`,
            },
              // Equation
              H('td', { class: 'py-2 px-2.5 font-bold text-zinc-100' },
                rxn.equation,
                isSHE ? H('span', { class: 'ml-2 rounded bg-sky-400/20 px-1 text-[8.5px] text-sky-300' }, 'REFERENCE') : null,
              ),
              // Name & Metal
              H('td', { class: 'py-2 px-2.5 text-zinc-300' },
                H('div', { class: 'font-sans text-[11px]' }, rxn.name),
                H('div', { class: 'text-[9px] text-zinc-500' }, `Metal: ${rxn.metal} · Ion: ${rxn.ionSpecies}`),
              ),
              // Electrons
              H('td', { class: 'py-2 px-2.5 text-zinc-400' }, `${rxn.electrons} e⁻`),
              // E° Potential
              H('td', { class: `py-2 px-2.5 ${potentialColor}` },
                `${rxn.standardPotential >= 0 ? '+' : ''}${rxn.standardPotential.toFixed(2)} V`
              ),
              // Action Buttons
              H('td', { class: 'py-2 px-2.5 text-right' },
                H('div', { class: 'flex items-center justify-end gap-1.5' },
                  H('button', {
                    type: 'button',
                    onClick: () => onSetAnode(rxn),
                    onclick: () => onSetAnode(rxn),
                    class: `cursor-pointer rounded px-2 py-0.5 text-[9px] transition ${
                      isAnode
                        ? 'bg-rose-500 text-white font-bold'
                        : 'border border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                    }`,
                  }, isAnode ? '✓ ANODE (-)' : 'Set Anode'),
                  H('button', {
                    type: 'button',
                    onClick: () => onSetCathode(rxn),
                    onclick: () => onSetCathode(rxn),
                    class: `cursor-pointer rounded px-2 py-0.5 text-[9px] transition ${
                      isCathode
                        ? 'bg-sky-500 text-white font-bold'
                        : 'border border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
                    }`,
                  }, isCathode ? '✓ CATHODE (+)' : 'Set Cathode'),
                ),
              ),
            )
          }),
        ),
      ),
    ),
  )
}
