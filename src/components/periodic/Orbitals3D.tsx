'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/* ---------------- hydrogenic wavefunction math (Z = 1, a0 = 1) ---------------- */

const FACT: number[] = [1]
for (let i = 1; i <= 60; i++) FACT[i] = FACT[i - 1] * i

function dfact(n: number): number {
  if (n < 1) return 1
  let r = 1
  for (let i = n; i >= 1; i -= 2) r *= i
  return r
}

/** Associated Legendre P_l^m(x), m >= 0 */
function assocLegendre(l: number, m: number, x: number): number {
  let pmm = 1
  if (m > 0) {
    const somx2 = Math.sqrt(Math.max(0, 1 - x * x))
    const fct = 1
    for (let i = 1; i <= m; i++) {
      pmm *= (-fct) * somx2 * dfact(2 * i - 1)
    }
  }
  if (l === m) return pmm
  let pmmp1 = x * (2 * m + 1) * pmm
  if (l === m + 1) return pmmp1
  let pll = 0
  for (let ll = m + 2; ll <= l; ll++) {
    pll = ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m)
    pmm = pmmp1
    pmmp1 = pll
  }
  return pll
}

/** Real spherical harmonic Y_lm (Condon-Shortley, m<0 → sin|m|φ) */
function realYlm(l: number, m: number, sin: boolean, theta: number, phi: number): number {
  const am = Math.abs(m)
  const nrm =
    Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (FACT[l - am] / FACT[l + am])) *
    (am > 0 ? Math.SQRT2 : 1)
  const p = assocLegendre(l, am, Math.cos(theta))
  const azi = am === 0 ? 1 : sin ? Math.sin(am * phi) : Math.cos(am * phi)
  return nrm * p * azi
}

/** Generalized Laguerre L_k^α(x) via recurrence */
function laguerre(k: number, alpha: number, x: number): number {
  if (k === 0) return 1
  let lm1 = 1
  let l0 = 1 + alpha - x
  if (k === 1) return l0
  let res = l0
  for (let j = 1; j < k; j++) {
    res = ((2 * j + 1 + alpha - x) * l0 - (j + alpha) * lm1) / (j + 1)
    lm1 = l0
    l0 = res
  }
  return res
}

/** Hydrogenic radial function R_nl, Z = 1 */
function radialR(n: number, l: number, r: number): number {
  const rho = (2 * r) / n
  const nrm = Math.sqrt(
    Math.pow(2 / n, 3) * (FACT[n - l - 1] / (2 * n * FACT[n + l])),
  )
  return nrm * Math.exp(-rho / 2) * Math.pow(rho, l) * laguerre(n - l - 1, 2 * l + 1, rho)
}

/* ---------------- orbital catalogue (real orbitals) ---------------- */

interface OrbitalSel {
  l: number
  m: number
  sin: boolean
  label: string
}

const L_LETTER = ['s', 'p', 'd', 'f', 'g']

const REAL_NAMES: Record<number, string[]> = {
  0: [''],
  1: ['z', 'x', 'y'],
  2: ['z²', 'xz', 'yz', 'x²−y²', 'xy'],
  3: ['z³', 'xz²', 'yz²', 'z(x²−y²)', 'xyz', 'x(x²−3y²)', 'y(3x²−y²)'],
  4: ['m0', 'm1c', 'm1s', 'm2c', 'm2s', 'm3c', 'm3s', 'm4c', 'm4s'],
}

function orbitalsForN(n: number): OrbitalSel[] {
  const out: OrbitalSel[] = []
  for (let l = 0; l < n; l++) {
    const names = REAL_NAMES[l] ?? []
    let idx = 0
    for (let m = 0; m <= l; m++) {
      const nm = names[idx]
      out.push({ l, m, sin: false, label: `${n}${L_LETTER[l]}${nm ? '_' + nm : ''}` })
      idx++
      if (m > 0) {
        const nm2 = names[idx]
        out.push({
          l,
          m: -m,
          sin: true,
          label: `${n}${L_LETTER[l]}${nm2 ? '_' + nm2 : ''}`,
        })
        idx++
      }
    }
  }
  return out
}

/* ---------------- component ---------------- */

interface Orbitals3DProps {
  autoRotate: boolean
}

const N_POINTS = 26000
const POS_COLOR = new THREE.Color('#fbbf24')
const NEG_COLOR = new THREE.Color('#2dd4bf')

export function Orbitals3D({ autoRotate }: Orbitals3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const pointsRef = useRef<THREE.Points | null>(null)
  const ctrlRef = useRef({ autoRotate })
  const [n, setN] = useState(2)
  const [selIdx, setSelIdx] = useState(1) // default 2p_z
  const [cutaway, setCutaway] = useState(false)

  const orbitals = useMemo(() => orbitalsForN(n), [n])
  const sel = orbitals[Math.min(selIdx, orbitals.length - 1)]

  useEffect(() => {
    ctrlRef.current.autoRotate = autoRotate
  }, [autoRotate])

  /* scene scaffold (mount) */
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'none'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / Math.max(1, mount.clientHeight),
      0.1,
      2000,
    )
    camera.position.set(0, 14, 42)
    camera.lookAt(0, 0, 0)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.autoRotateSpeed = 1.0

    const axes = new THREE.Group()
    const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 })
    for (const dir of [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
    ]) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        dir.clone().multiplyScalar(-18),
        dir.clone().multiplyScalar(18),
      ])
      axes.add(new THREE.Line(geo, axisMat))
    }
    scene.add(axes)

    sceneRef.current = scene

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      controls.autoRotate = ctrlRef.current.autoRotate
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth
      const h = Math.max(1, mount.clientHeight)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(mount)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      controls.dispose()
      axisMat.dispose()
      for (const child of [...axes.children]) {
        ;(child as THREE.Line).geometry?.dispose()
      }
      if (pointsRef.current) {
        scene.remove(pointsRef.current)
        pointsRef.current.geometry.dispose()
        ;(pointsRef.current.material as THREE.Material).dispose()
        pointsRef.current = null
      }
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
      sceneRef.current = null
    }
  }, [])

  /* rebuild point cloud when the orbital changes */
  useEffect(() => {
    const scene = sceneRef.current
    const mount = mountRef.current
    if (!scene || !mount) return

    const { l, m, sin } = sel

    // radial sampling: CDF over P(r) = r^2 R^2
    const R_MAX = 12 + 9 * n
    const BINS = 4096
    const dr = R_MAX / BINS
    const cdf = new Float64Array(BINS)
    let acc = 0
    for (let i = 0; i < BINS; i++) {
      const r = (i + 0.5) * dr
      const Rv = radialR(n, l, r)
      acc += r * r * Rv * Rv * dr
      cdf[i] = acc
    }
    const total = acc
    const sampleR = () => {
      const u = Math.random() * total
      let lo = 0
      let hi = BINS - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (cdf[mid] < u) lo = mid + 1
        else hi = mid
      }
      return (lo + 0.5) * dr
    }

    // angular rejection bound: max |Y|^2 on a grid
    let maxY2 = 1e-12
    for (let ti = 0; ti <= 180; ti++) {
      const theta = (ti / 180) * Math.PI
      for (let pi2 = 0; pi2 <= 360; pi2++) {
        const phi = (pi2 / 360) * Math.PI
        const y = realYlm(l, m, sin, theta, phi)
        const y2 = y * y
        if (y2 > maxY2) maxY2 = y2
      }
    }

    // estimate max |psi| for brightness normalization
    let maxPsi = 1e-12
    for (let i = 0; i < 4000; i++) {
      const r = sampleR()
      const u = Math.random() * 2 - 1
      const theta = Math.acos(u)
      const phi = Math.random() * Math.PI * 2
      const y = realYlm(l, m, sin, theta, phi)
      const p = Math.abs(radialR(n, l, r) * y)
      if (p > maxPsi) maxPsi = p
    }

    const target = cutaway ? Math.floor(N_POINTS * 1.5) : N_POINTS
    const positions = new Float32Array(target * 3)
    const colors = new Float32Array(target * 3)
    let count = 0
    let psiMaxSeen = maxPsi
    let guard = 0

    while (count < target && guard < target * 60) {
      guard++
      const r = sampleR()
      const uz = Math.random() * 2 - 1
      const phi = Math.random() * Math.PI * 2
      const st = Math.sqrt(1 - uz * uz)
      const dx = st * Math.cos(phi)
      const dy = uz
      const dz = st * Math.sin(phi)
      if (cutaway && dx < 0) continue

      const theta = Math.acos(dy)
      const y = realYlm(l, m, sin, theta, phi)
      if (Math.random() * maxY2 > y * y) continue

      const psi = radialR(n, l, r) * y
      if (Math.abs(psi) > psiMaxSeen) psiMaxSeen = Math.abs(psi)

      const i3 = count * 3
      positions[i3] = dx * r
      positions[i3 + 1] = dy * r
      positions[i3 + 2] = dz * r

      const base = psi >= 0 ? POS_COLOR : NEG_COLOR
      const bright = 0.15 + 0.85 * Math.pow(Math.abs(psi) / psiMaxSeen, 0.55)
      colors[i3] = base.r * bright
      colors[i3 + 1] = base.g * bright
      colors[i3 + 2] = base.b * bright
      count++
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, count * 3), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, count * 3), 3))

    const mat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    if (pointsRef.current) {
      scene.remove(pointsRef.current)
      pointsRef.current.geometry.dispose()
      ;(pointsRef.current.material as THREE.Material).dispose()
    }
    const points = new THREE.Points(geo, mat)
    scene.add(points)
    pointsRef.current = points
  }, [n, sel, cutaway])

  const nodesRadial = n - sel.l - 1
  const nodesAngular = sel.l

  return (
    <div className="flex h-full min-h-[440px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => {
                setN(v)
                setSelIdx(0)
              }}
              className={`h-7 w-7 rounded-md border font-mono text-xs transition ${
                v === n
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                  : 'border-white/10 bg-white/[0.03] text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <select
          value={selIdx}
          onChange={(e) => setSelIdx(parseInt(e.target.value, 10))}
          aria-label="Subshell orbital"
          className="h-7 rounded-md border border-white/10 bg-white/[0.04] px-2 font-mono text-xs text-zinc-200 focus:outline-none"
        >
          {orbitals.map((o, i) => (
            <option key={o.label} value={i} className="bg-[#10141d]">
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setCutaway((c) => !c)}
          className={`rounded-md border px-2.5 py-1 text-[10px] uppercase tracking-widest transition ${
            cutaway
              ? 'border-teal-400/40 bg-teal-400/10 text-teal-300'
              : 'border-white/10 bg-white/[0.03] text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Cutaway
        </button>
        <span className="ml-auto flex items-center gap-3 font-mono text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> ψ &gt; 0
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-400" /> ψ &lt; 0
          </span>
        </span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-white/[0.07] bg-[#070a10]">
        <div ref={mountRef} className="h-full w-full" />
        <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-white/10 bg-black/45 px-3 py-2 font-mono text-[10.5px] leading-relaxed text-zinc-300 backdrop-blur-sm">
          <div className="text-zinc-100">{sel.label}</div>
          <div className="text-zinc-500">
            ℓ = {sel.l} · |m| = {Math.abs(sel.m)} {sel.sin ? '(sin)' : sel.sin === false && sel.m !== 0 ? '(cos)' : ''}
          </div>
          <div className="text-zinc-500">radial nodes: {nodesRadial}</div>
          <div className="text-zinc-500">angular nodes: {nodesAngular}</div>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] tracking-wide text-zinc-600">
          |ψ|² POINT CLOUD · HYDROGENIC (Z = 1)
        </div>
      </div>
    </div>
  )
}
