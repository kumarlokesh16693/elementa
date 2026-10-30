'use client'

import type { RadialStats } from '@/lib/orbital'

const W = 360
const H = 178
const M = { l: 38, r: 14, t: 16, b: 27 }

/**
 * Radial distribution P(r) = r²R² (filled, normalised to its peak) with the
 * signed radial function R(r) overlaid (dashed), radial nodes marked, most
 * probable radius dotted and ⟨r⟩ ticked.
 */
export default function RadialPlot({ stats, accent }: { stats: RadialStats; accent: string }) {
  const { rs, P, R, rMax, rMp, rMean, nodes } = stats
  const iw = W - M.l - M.r
  const ih = H - M.t - M.b
  const x = (r: number) => M.l + (r / rMax) * iw
  const yP = (p: number) => M.t + ih - p * ih
  const midY = M.t + ih * 0.5
  const yR = (rv: number) => midY - rv * ih * 0.36

  let dLine = ''
  for (let i = 0; i < rs.length; i += 2) {
    dLine += `${i === 0 ? 'M' : 'L'}${x(rs[i]).toFixed(1)},${yP(P[i]).toFixed(1)} `
  }
  const dArea = `${dLine}L${x(rMax).toFixed(1)},${yP(0).toFixed(1)} L${x(0).toFixed(1)},${yP(0).toFixed(1)} Z`
  let dR = ''
  for (let i = 0; i < rs.length; i += 2) {
    dR += `${i === 0 ? 'M' : 'L'}${x(rs[i]).toFixed(1)},${yR(R[i]).toFixed(1)} `
  }

  const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50]
  const step = steps.find((s) => rMax / s <= 7) ?? 100
  const ticks: number[] = []
  for (let v = 0; v <= rMax + 1e-9; v += step) ticks.push(v)

  const fmtR = (v: number) => (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Radial distribution plot">
      {/* frame */}
      <rect x={M.l} y={M.t} width={iw} height={ih} fill="none" stroke="#ffffff" strokeOpacity={0.08} />

      {/* x ticks */}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={x(v)} y1={M.t + ih} x2={x(v)} y2={M.t + ih + 3} stroke="#52525b" strokeWidth={1} />
          <text x={x(v)} y={M.t + ih + 12} textAnchor="middle" fontSize={8} fill="#71717a" fontFamily="var(--font-geist-mono), monospace">
            {fmtR(v)}
          </text>
        </g>
      ))}
      <text x={M.l + iw} y={H - 3} textAnchor="end" fontSize={8.5} fill="#a1a1aa" fontFamily="var(--font-geist-mono), monospace">
        r / a₀
      </text>

      {/* radial nodes */}
      {nodes.map((rn, i) => (
        <g key={i}>
          <line x1={x(rn)} y1={M.t} x2={x(rn)} y2={M.t + ih} stroke="#fb7185" strokeOpacity={0.45} strokeDasharray="2 3" strokeWidth={1} />
          {i === 0 && (
            <text x={x(rn) + 3} y={M.t + 8} fontSize={7.5} fill="#fb7185" fontFamily="var(--font-geist-mono), monospace">
              node
            </text>
          )}
        </g>
      ))}

      {/* R(r) zero line + dashed signed curve */}
      <line x1={M.l} y1={midY} x2={M.l + iw} y2={midY} stroke="#ffffff" strokeOpacity={0.1} strokeWidth={1} />
      <path d={dR} fill="none" stroke="#a1a1aa" strokeOpacity={0.7} strokeWidth={0.9} strokeDasharray="3 3" />

      {/* P(r) area + line */}
      <path d={dArea} fill={accent} fillOpacity={0.16} />
      <path d={dLine} fill="none" stroke={accent} strokeWidth={1.5} />

      {/* most probable radius */}
      <circle cx={x(rMp)} cy={yP(1)} r={2.6} fill="#fbbf24" />
      <text x={x(rMp)} y={yP(1) - 5} textAnchor="middle" fontSize={8} fill="#fbbf24" fontFamily="var(--font-geist-mono), monospace">
        {fmtR(rMp)}
      </text>

      {/* ⟨r⟩ tick */}
      {rMean < rMax && (
        <g>
          <line x1={x(rMean)} y1={M.t + ih - 6} x2={x(rMean)} y2={M.t + ih} stroke="#34d399" strokeWidth={2} />
          <text x={x(rMean)} y={M.t + ih - 9} textAnchor="middle" fontSize={7.5} fill="#34d399" fontFamily="var(--font-geist-mono), monospace">
            ⟨r⟩
          </text>
        </g>
      )}

      {/* curve labels */}
      <text x={M.l + 6} y={M.t + 11} fontSize={8.5} fill={accent} fontFamily="var(--font-geist-mono), monospace">
        r²R²
      </text>
      <text x={M.l + 6} y={midY - 5} fontSize={8} fill="#a1a1aa" fontFamily="var(--font-geist-mono), monospace">
        R(r)
      </text>
    </svg>
  )
}
