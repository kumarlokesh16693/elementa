'use client'

import { getElement } from '@/lib/periodic'

/**
 * Molecular-orbital diagram engine for diatomic molecules built from
 * H–Ne (generic second-row MO treatment). Energies are schematic; the
 * σ(2p)/π(2p) ordering switches with s–p mixing at ZA + ZB ≤ 14.
 */

export interface MoLine {
  y: number
  up: boolean
  down: boolean
}

export interface MoSlot {
  key: string
  label: string
  type: 'bonding' | 'antibonding'
  y: number // center y for label placement
  lines: MoLine[]
  count: number
}

export interface AtomColumn {
  z: number
  sym: string
  chi: number | null
  cx: number
  dy: number // heteronuclear energy offset (positive = lower on screen)
  oneY: number
  oneE: number
  twoY?: number
  twoE?: number
  pY?: number
  pE?: number
}

export interface MoResult {
  valid: boolean
  reason?: string
  fullLadder: boolean
  piBelowSigma: boolean
  slots: MoSlot[]
  atoms: [AtomColumn, AtomColumn]
  totalElectrons: number
  bondOrder: number
  unpaired: number
  homo: string
  lumo: string
  config: string
}

const SUP: Record<number, string> = { 1: '¹', 2: '²', 3: '³', 4: '⁴' }

export function computeMo(zA: number, zB: number): MoResult {
  const elA = getElement(zA)!
  const elB = getElement(zB)!
  const hetero = zA !== zB
  const maxZ = Math.max(zA, zB)
  const minZ = Math.min(zA, zB)

  if (maxZ >= 3 && minZ <= 2) {
    return {
      valid: false,
      reason:
        'Energy mismatch — the H/He 1s level lies far from the second-row 2s/2p manifold. Pick both atoms from H–He, or both from Li–Ne.',
      fullLadder: false,
      piBelowSigma: false,
      slots: [],
      atoms: [] as unknown as [AtomColumn, AtomColumn],
      totalElectrons: 0,
      bondOrder: 0,
      unpaired: 0,
      homo: '—',
      lumo: '—',
      config: '—',
    }
  }

  const chiA = elA.electronegativity
  const chiB = elB.electronegativity
  if (hetero && (chiA == null || chiB == null)) {
    return {
      valid: false,
      reason: `No meaningful MO diagram: ${chiA == null ? elA.name : elB.name} has no defined electronegativity — its AO energy is too far from its partner's for a generic diagram.`,
      fullLadder: false,
      piBelowSigma: false,
      slots: [] as MoSlot[],
      atoms: [] as unknown as [AtomColumn, AtomColumn],
      totalElectrons: 0,
      bondOrder: 0,
      unpaired: 0,
      homo: '—',
      lumo: '—',
      config: '—',
    }
  }

  const fullLadder = maxZ >= 3
  const total = zA + zB
  const piBelowSigma = fullLadder && total <= 14 // s–p mixing regime (B₂, C₂, N₂, CO, BF…)

  /* ---- AO columns ---- */
  const dChi = (chiA ?? 0) - (chiB ?? 0)
  const off = hetero ? Math.min(36, Math.round(Math.abs(dChi) * 20)) : 0
  // the more electronegative atom's levels sit lower (larger y)
  const dyA = hetero && dChi > 0 ? -off / 2 : off / 2
  const dyB = -dyA

  const mkAtom = (z: number, cx: number, dy: number): AtomColumn => {
    const el = getElement(z)!
    if (!fullLadder) {
      return { z, sym: el.symbol, chi: el.electronegativity, cx, dy, oneY: 280 + dy, oneE: z }
    }
    return {
      z,
      sym: el.symbol,
      chi: el.electronegativity,
      cx,
      dy,
      oneY: 504 + dy,
      oneE: 2,
      twoY: 402 + dy,
      twoE: 2,
      pY: 263 + dy,
      pE: z - 4,
    }
  }
  const atoms: [AtomColumn, AtomColumn] = [mkAtom(zA, 150, dyA), mkAtom(zB, 770, dyB)]

  /* ---- MO slots (energy order: array index 0 = LOWEST energy) ---- */
  const raw: { key: string; label: string; type: 'bonding' | 'antibonding'; y: number; pair?: [number, number] }[] =
    fullLadder
      ? [
          { key: 's1s', label: 'σ1s', type: 'bonding', y: 504 },
          { key: 's*1s', label: 'σ*1s', type: 'antibonding', y: 458 },
          { key: 's2s', label: 'σ2s', type: 'bonding', y: 402 },
          { key: 's*2s', label: 'σ*2s', type: 'antibonding', y: 356 },
          ...(piBelowSigma
            ? [
                { key: 'pi2p', label: 'π2p', type: 'bonding' as const, y: 291, pair: [283, 299] },
                { key: 's2p', label: 'σ2p', type: 'bonding' as const, y: 235 },
              ]
            : [
                { key: 's2p', label: 'σ2p', type: 'bonding' as const, y: 291 },
                { key: 'pi2p', label: 'π2p', type: 'bonding' as const, y: 235, pair: [227, 243] },
              ]),
          { key: 'pi*2p', label: 'π*2p', type: 'antibonding', y: 166, pair: [158, 174] },
          { key: 's*2p', label: 'σ*2p', type: 'antibonding', y: 110 },
        ]
      : [
          { key: 's1s', label: 'σ1s', type: 'bonding', y: 360 },
          { key: 's*1s', label: 'σ*1s', type: 'antibonding', y: 220 },
        ]

  /* ---- Aufbau + Hund filling ---- */
  type Cell = { slot: (typeof raw)[number]; lineIdx: number }
  const fillOrder: Cell[] = []
  for (const slot of raw) {
    if (slot.pair) {
      // Hund across the degenerate pair: e1 → L0↑, e2 → L1↑, e3 → L0↓, e4 → L1↓
      fillOrder.push({ slot, lineIdx: 0 }, { slot, lineIdx: 1 }, { slot, lineIdx: 0 }, { slot, lineIdx: 1 })
    } else {
      fillOrder.push({ slot, lineIdx: 0 }, { slot, lineIdx: 0 })
    }
  }
  const occupied = fillOrder.slice(0, total)

  const slots: MoSlot[] = raw.map((slot) => {
    const lineYs = slot.pair ?? [slot.y]
    const lines: MoLine[] = lineYs.map((y) => ({ y, up: false, down: false }))
    const count = occupied.filter((c) => c.slot === slot).length
    if (slot.pair) {
      if (count >= 1) lines[0].up = true
      if (count >= 2) lines[1].up = true
      if (count >= 3) lines[0].down = true
      if (count >= 4) lines[1].down = true
    } else {
      lines[0].up = count >= 1
      lines[0].down = count >= 2
    }
    return { ...slot, lines, count }
  })

  /* ---- observables ---- */
  const bondingKeys = ['s1s', 's2s', 'pi2p', 's2p']
  const bonding = slots.filter((s) => bondingKeys.includes(s.key)).reduce((n, s) => n + s.count, 0)
  const antibonding = slots
    .filter((s) => !bondingKeys.includes(s.key))
    .reduce((n, s) => n + s.count, 0)
  const bondOrder = (bonding - antibonding) / 2
  const unpaired = slots.reduce(
    (n, s) => n + s.lines.filter((l) => l.up !== l.down).length,
    0,
  )

  const lastFilled = [...slots].reverse().find((s) => s.count > 0)
  const firstUnfilled = slots.find((s) => s.count < (s.pair ? 4 : 2))
  const homo = lastFilled?.label ?? '—'
  let lumo = firstUnfilled?.label ?? '—'
  if (firstUnfilled && firstUnfilled.count > 0) lumo += ' (SOMO)'

  const config = slots
    .filter((s) => s.count > 0)
    .map((s) => `${s.label}${SUP[s.count] ?? s.count}`)
    .join(' ')

  return {
    valid: true,
    fullLadder,
    piBelowSigma,
    slots,
    atoms,
    totalElectrons: total,
    bondOrder,
    unpaired,
    homo,
    lumo,
    config,
  }
}

/* ------------------------------ SVG rendering ------------------------------ */

const BOND = '#34d399'
const ANTI = '#fb7185'
const AO = '#a1a1aa'
const INK = '#f8fafc'

function ElectronArrows({ x, y, line }: { x: number; y: number; line: MoLine }) {
  return (
    <>
      {line.up && (
        <text x={x - 15} y={y + 4.5} textAnchor="middle" fontSize="14" fill={INK} fontWeight="600">
          ↑
        </text>
      )}
      {line.down && (
        <text x={x + 15} y={y + 4.5} textAnchor="middle" fontSize="14" fill={INK} fontWeight="600">
          ↓
        </text>
      )}
    </>
  )
}

function AtomSide({ atom, full }: { atom: AtomColumn; full: boolean }) {
  const stubs = [-22, 0, 22]
  return (
    <g>
      {/* 1s */}
      <line x1={atom.cx - 55} x2={atom.cx + 55} y1={atom.oneY} y2={atom.oneY} stroke={AO} strokeWidth="2.5" strokeLinecap="round" />
      <text x={atom.cx - 66} y={atom.oneY + 4} textAnchor="end" fontSize="11" fill={AO} fontFamily="monospace">
        1s
      </text>
      <ElectronArrows x={atom.cx} y={atom.oneY} line={{ y: 0, up: atom.oneE >= 1, down: atom.oneE >= 2 }} />
      {full && atom.twoY != null && (
        <>
          <line x1={atom.cx - 55} x2={atom.cx + 55} y1={atom.twoY} y2={atom.twoY} stroke={AO} strokeWidth="2.5" strokeLinecap="round" />
          <text x={atom.cx - 66} y={atom.twoY + 4} textAnchor="end" fontSize="11" fill={AO} fontFamily="monospace">
            2s
          </text>
          <ElectronArrows x={atom.cx} y={atom.twoY} line={{ y: 0, up: (atom.twoE ?? 0) >= 1, down: (atom.twoE ?? 0) >= 2 }} />
        </>
      )}
      {full && atom.pY != null && (
        <>
          {stubs.map((dx, i) => (
            <g key={i}>
              <line
                x1={atom.cx + dx - 20}
                x2={atom.cx + dx + 20}
                y1={atom.pY}
                y2={atom.pY}
                stroke={AO}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* distribute p electrons across the three stubs (Hund) */}
              {(() => {
                const e = atom.pE ?? 0
                const up = i < e
                const down = e - 3 > i
                if (!up && !down) return null
                return (
                  <g>
                    {up && (
                      <text x={atom.cx + dx} y={atom.pY + 4.5} textAnchor="middle" fontSize="13" fill={INK} fontWeight="600">
                        ↑
                      </text>
                    )}
                    {down && (
                      <text x={atom.cx + dx + 12} y={atom.pY + 4.5} textAnchor="middle" fontSize="13" fill={INK} fontWeight="600">
                        ↓
                      </text>
                    )}
                  </g>
                )
              })()}
            </g>
          ))}
          <text x={atom.cx - 66} y={atom.pY + 4} textAnchor="end" fontSize="11" fill={AO} fontFamily="monospace">
            2p
          </text>
        </>
      )}
    </g>
  )
}

export default function MoDiagram({ zA, zB }: { zA: number; zB: number }) {
  const res = computeMo(zA, zB)
  if (!res.valid) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-rose-400/30 bg-rose-400/5 p-6 text-center">
        <p className="max-w-sm text-[12px] leading-relaxed text-rose-200/90">{res.reason}</p>
      </div>
    )
  }

  const [A, B] = res.atoms
  const connectors: { ax: number; ay: number; bx: number; by: number }[] = []
  for (const slot of res.slots) {
    const lineYs = slot.pair ?? [slot.y]
    for (const y of lineYs) {
      if (slot.key.includes('1s')) {
        connectors.push({ ax: A.cx + 55, ay: A.oneY, bx: 350, by: y })
        connectors.push({ ax: 570, ay: y, bx: B.cx - 55, by: B.oneY })
      } else if (slot.key.includes('2s')) {
        connectors.push({ ax: A.cx + 55, ay: A.twoY!, bx: 350, by: y })
        connectors.push({ ax: 570, ay: y, bx: B.cx - 55, by: B.twoY! })
      } else {
        connectors.push({ ax: A.cx + 22 + 20, ay: A.pY!, bx: 350, by: y })
        connectors.push({ ax: 570, ay: y, bx: B.cx - 42, by: B.pY! })
      }
    }
  }

  return (
    <svg viewBox="0 0 920 580" className="h-auto w-full select-none" role="img" aria-label={`Molecular orbital diagram`}>
      {/* connectors */}
      <g stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.6">
        {connectors.map((c, i) => (
          <line key={i} x1={c.ax} y1={c.ay} x2={c.bx} y2={c.by} />
        ))}
      </g>

      {/* headers */}
      <text x={A.cx} y={36} textAnchor="middle" fontSize="13" fontWeight="700" fill="#e4e4e7">
        {A.sym}
        <tspan fontSize="10" fill="#71717a"> (Z={A.z}{A.chi != null ? `, χ ${A.chi.toFixed(2)}` : ''})</tspan>
      </text>
      <text x={460} y={36} textAnchor="middle" fontSize="11" letterSpacing="2" fill="#71717a">
        MOLECULAR ORBITALS
      </text>
      <text x={B.cx} y={36} textAnchor="middle" fontSize="13" fontWeight="700" fill="#e4e4e7">
        {B.sym}
        <tspan fontSize="10" fill="#71717a"> (Z={B.z}{B.chi != null ? `, χ ${B.chi.toFixed(2)}` : ''})</tspan>
      </text>

      {/* atom AOs */}
      <AtomSide atom={A} full={res.fullLadder} />
      <AtomSide atom={B} full={res.fullLadder} />

      {/* MO rungs */}
      {res.slots.map((slot) => {
        const color = slot.type === 'bonding' ? BOND : ANTI
        const lineYs = slot.pair ?? [slot.y]
        return (
          <g key={slot.key}>
            {lineYs.map((y, i) => (
              <line
                key={i}
                x1={350}
                x2={570}
                y1={y}
                y2={y}
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))}
            <text
              x={340}
              y={(slot.pair ? (slot.pair[0] + slot.pair[1]) / 2 : slot.y) + 4}
              textAnchor="end"
              fontSize="12"
              fontFamily="monospace"
              fill={color}
              opacity="0.9"
            >
              {slot.label}
            </text>
            {slot.lines.map((line, i) => (
              <ElectronArrows key={i} x={460} y={line.y} line={line} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
