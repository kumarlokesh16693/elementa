'use client'

import type { ElementData } from '@/lib/periodic/types'
import { CATEGORY_MAP, SHELL_LETTERS } from '@/lib/periodic/types'
import { neutronCount } from '@/lib/periodic'

interface Bohr2DProps {
  element: ElementData
  playing: boolean
  speed: number
  showLabels: boolean
}

const SIZE = 480
const C = SIZE / 2
const OUTER = 228

export function Bohr2D({ element, playing, speed, showLabels }: Bohr2DProps) {
  const color = CATEGORY_MAP[element.category].color
  const nNeutrons = neutronCount(element)
  const A = element.number + nNeutrons

  const nucR = Math.min(34, Math.max(11, 9 + Math.sqrt(A) * 2.6))
  const dotR = Math.max(1.5, Math.min(4, nucR / (Math.sqrt(A) * 1.15)))

  const nucleons: { x: number; y: number; proton: boolean }[] = []
  for (let i = 0; i < A; i++) {
    const r = nucR * Math.sqrt((i + 0.5) / A)
    const th = i * 2.39996 + 0.7
    nucleons.push({
      x: C + r * Math.cos(th),
      y: C + r * Math.sin(th),
      proton: i < element.number,
    })
  }

  const S = element.shells.length
  const inner = nucR + 18
  const shellR = (i: number) => inner + (OUTER - inner) * ((i + 0.5) / S)
  const valenceIdx = S - 1

  const electronGroups = element.shells.map((count, i) => {
    const r = shellR(i)
    const electrons = Array.from({ length: count }, (_, j) => {
      const a = (j / count) * Math.PI * 2 + i * 0.6
      return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
    })
    const duration = (4.5 * Math.pow(i + 1, 1.35)) / Math.max(0.1, speed)
    return { r, electrons, duration, i, count }
  })

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full max-h-[min(58vh,480px)] w-auto max-w-full"
        role="img"
        aria-label={`Bohr model of ${element.name}: ${element.shells.length} shells holding ${element.shells.join(', ')} electrons`}
      >
        <defs>
          <radialGradient id="nucGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="55%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* orbit paths */}
        {element.shells.map((count, i) => {
          const r = shellR(i)
          const isValence = i === valenceIdx
          return (
            <g key={`ring-${i}`}>
              <circle
                cx={C}
                cy={C}
                r={r}
                fill="none"
                stroke={isValence ? color : '#ffffff'}
                strokeOpacity={isValence ? 0.4 : 0.09}
                strokeWidth={isValence ? 1.4 : 1}
                strokeDasharray={isValence ? '5 4' : undefined}
              >
                <title>{`${SHELL_LETTERS[i]} shell — ${count} electron${count === 1 ? '' : 's'}`}</title>
              </circle>
              {showLabels && (
                <text
                  x={C}
                  y={C - r - 5}
                  textAnchor="middle"
                  className="fill-zinc-500 font-mono"
                  style={{ fontSize: 10.5 }}
                >
                  {`${SHELL_LETTERS[i]} · ${count}e⁻`}
                </text>
              )}
            </g>
          )
        })}

        {/* animated electrons */}
        {electronGroups.map(({ r, electrons, duration, i }) => (
          <g
            key={`orb-${element.number}-${i}`}
            style={{
              animation: `orbit ${duration}s linear infinite`,
              animationPlayState: playing ? 'running' : 'paused',
              transformOrigin: `${C}px ${C}px`,
            }}
          >
            <circle cx={C} cy={C} r={r} fill="none" stroke="transparent" pointerEvents="none" />
            {electrons.map((p, j) => (
              <circle
                key={j}
                cx={p.x}
                cy={p.y}
                r={3.4}
                fill={color}
                stroke="#0b0e14"
                strokeWidth="0.8"
              >
                <title>{`${SHELL_LETTERS[i]} electron`}</title>
              </circle>
            ))}
          </g>
        ))}

        {/* nucleus */}
        <circle cx={C} cy={C} r={nucR + 14} fill="url(#nucGlow)">
          <title>{`${element.number} protons, ${nNeutrons} neutrons (≈, most stable isotope)`}</title>
        </circle>
        <circle cx={C} cy={C} r={nucR} fill="#131722" stroke="#ffffff22" strokeWidth="1" />
        {nucleons.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={dotR}
            fill={p.proton ? color : '#8b93a3'}
            fillOpacity={p.proton ? 0.95 : 0.8}
          />
        ))}
      </svg>

      {/* particle legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
          p⁺ {element.number}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#8b93a3]" />
          n⁰ {nNeutrons} <span className="text-zinc-600">(≈)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full border border-zinc-500" />
          e⁻ {element.number}
        </span>
        <span className="text-zinc-600">
          shells {element.shells.join(' · ')}
        </span>
      </div>
    </div>
  )
}
