'use client'

import { memo } from 'react'
import type { ElementData } from '@/lib/periodic/types'
import { SHELL_LETTERS } from '@/lib/periodic/types'

interface Bohr2DProps {
  element: ElementData
  accent: string
  /** playback multiplier, 1 = normal */
  speed?: number
  animated?: boolean
}

const SIZE = 400
const C = SIZE / 2

function shellRadii(n: number): number[] {
  if (n === 1) return [112]
  const minR = 64
  const maxR = 184
  const step = (maxR - minR) / (n - 1)
  return Array.from({ length: n }, (_, i) => minR + i * step)
}

/**
 * Research-style 2D Bohr model.
 * Concentric quantized shells (K..Q), evenly distributed electrons per shell,
 * each shell rotating as a rigid orbital group with inner shells faster
 * (approximating v ∝ 1/n of the Bohr atom).
 */
export const Bohr2D = memo(function Bohr2D({
  element,
  accent,
  speed = 1,
  animated = true,
}: Bohr2DProps) {
  const shells = element.shells
  const radii = shellRadii(shells.length)
  const neutrons = Math.max(0, Math.round(element.mass) - element.number)

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-full w-full"
      role="img"
      aria-label={`2D Bohr model of ${element.name}`}
    >
      <defs>
        <radialGradient id="bohr2d-nucleus" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.22" />
        </radialGradient>
      </defs>

      {/* quantized orbit rings */}
      {radii.map((r, i) => (
        <circle
          key={`ring-${i}`}
          cx={C}
          cy={C}
          r={r}
          fill="none"
          stroke={accent}
          strokeOpacity={0.3}
          strokeWidth={1}
          strokeDasharray="3 4"
        />
      ))}

      {/* electrons — one rigid rotating group per shell */}
      {shells.map((count, i) => {
        const r = radii[i]
        const duration = animated ? (3.4 + i * 2.1) / Math.max(speed, 0.05) : 0
        const offset = i * 17
        return (
          <g
            key={`orb-${i}`}
            style={
              animated
                ? {
                    animation: `orbit ${duration.toFixed(2)}s linear infinite`,
                    transformOrigin: '200px 200px',
                    transformBox: 'view-box',
                  }
                : undefined
            }
          >
            {Array.from({ length: count }, (_, j) => {
              const a = ((offset + (360 / count) * j) * Math.PI) / 180
              const x = C + r * Math.cos(a)
              const y = C + r * Math.sin(a)
              return (
                <circle
                  key={j}
                  cx={x.toFixed(2)}
                  cy={y.toFixed(2)}
                  r={3.4}
                  fill={accent}
                  stroke="#05080f"
                  strokeWidth={0.6}
                />
              )
            })}
          </g>
        )
      })}

      {/* shell badges K·n */}
      {shells.map((count, i) => {
        const r = radii[i]
        const label = SHELL_LETTERS[i] ?? `n${i + 1}`
        return (
          <g key={`badge-${i}`}>
            <rect
              x={C - 21}
              y={C - r - 8}
              width={42}
              height={16}
              rx={8}
              fill="#0b1220"
              fillOpacity={0.92}
              stroke={accent}
              strokeOpacity={0.45}
              strokeWidth={1}
            />
            <text
              x={C}
              y={C - r + 4}
              textAnchor="middle"
              fontSize={9.5}
              fontFamily="var(--font-geist-mono), monospace"
              fill={accent}
            >
              {label}·{count}
            </text>
          </g>
        )
      })}

      {/* nucleus */}
      <circle
        cx={C}
        cy={C}
        r={30}
        fill="url(#bohr2d-nucleus)"
        stroke={accent}
        strokeOpacity={0.85}
        strokeWidth={1.2}
      />
      <text
        x={C}
        y={C - 1}
        textAnchor="middle"
        fontSize={17}
        fontWeight={700}
        fill="#ffffff"
        fontFamily="var(--font-geist-sans), sans-serif"
      >
        {element.symbol}
      </text>
      <text
        x={C}
        y={C + 14}
        textAnchor="middle"
        fontSize={8}
        fill="#ffffff"
        fillOpacity={0.78}
        fontFamily="var(--font-geist-mono), monospace"
      >
        {element.number}p⁺ {neutrons}n⁰
      </text>

      {/* caption */}
      <text
        x={C}
        y={SIZE - 6}
        textAnchor="middle"
        fontSize={9}
        fill="#7d8596"
        fontFamily="var(--font-geist-mono), monospace"
      >
        {`Bohr shell model · ${shells.length} shell${shells.length > 1 ? 's' : ''} · ${element.number} e⁻`}
      </text>
    </svg>
  )
})
