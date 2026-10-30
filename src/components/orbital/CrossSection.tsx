'use client'

import { useEffect, useRef } from 'react'
import { psiAt, type RealOrbital } from '@/lib/orbital'

const S = 288

/**
 * Heatmap of ψ² in the physics xz-plane (y = 0) with the sign of ψ modulating
 * hue (amber = ψ>0, teal = ψ<0, white-hot core). Nodal surfaces appear as the
 * dark seams between opposite-coloured lobes.
 */
export default function CrossSection({
  orbital,
  zEff,
  extent,
}: {
  orbital: RealOrbital
  zEff: number
  extent: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const { n, l, m, sin } = orbital
    const vals = new Float32Array(S * S)
    let maxAbs = 1e-12
    for (let iy = 0; iy < S; iy++) {
      const z = extent * (1 - (2 * (iy + 0.5)) / S) // top row = +z
      for (let ix = 0; ix < S; ix++) {
        const x = extent * ((2 * (ix + 0.5)) / S - 1)
        const psi = psiAt(n, l, m, sin, zEff, x, 0, z)
        const i2 = iy * S + ix
        vals[i2] = psi
        const a = Math.abs(psi)
        if (a > maxAbs) maxAbs = a
      }
    }

    const img = ctx.createImageData(S, S)
    const bg = [8, 11, 18]
    const pos = [251, 191, 36]
    const neg = [45, 212, 191]
    for (let i = 0; i < S * S; i++) {
      const t = Math.pow(Math.min(1, Math.abs(vals[i]) / maxAbs), 0.55)
      const c = vals[i] >= 0 ? pos : neg
      const w = t > 0.85 ? ((t - 0.85) / 0.15) * 0.85 : 0
      const o = i * 4
      img.data[o] = bg[0] + (c[0] - bg[0]) * t + (255 - c[0]) * w
      img.data[o + 1] = bg[1] + (c[1] - bg[1]) * t + (255 - c[1]) * w
      img.data[o + 2] = bg[2] + (c[2] - bg[2]) * t + (255 - c[2]) * w
      img.data[o + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }, [orbital, zEff, extent])

  return (
    <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-lg border border-white/10 bg-[#080b12]">
      <canvas ref={ref} width={S} height={S} className="block h-auto w-full" role="img" aria-label="ψ² cross-section in the xz plane" />
      <span className="pointer-events-none absolute left-2 top-1.5 font-mono text-[8.5px] text-zinc-500">
        xz-plane · y = 0
      </span>
      <span className="pointer-events-none absolute right-2 top-1.5 font-mono text-[8.5px] text-zinc-500">↑ z / a₀</span>
      <span className="pointer-events-none absolute bottom-1.5 right-2 font-mono text-[8.5px] text-zinc-500">x / a₀ →</span>
      <span className="pointer-events-none absolute bottom-1.5 left-2 flex items-center gap-2 font-mono text-[8.5px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> ψ&gt;0
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" /> ψ&lt;0
        </span>
      </span>
    </div>
  )
}
