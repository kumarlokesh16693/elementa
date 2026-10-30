'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gradedAxis, orbitalExtent, psiAt, radialR, realYlm, type RealOrbital } from '@/lib/orbital'
import { surfaceNets } from './surfaceNets'

export type OrbitalMode = 'surface' | 'cloud'

interface OrbitalCanvasProps {
  orbital: RealOrbital
  zEff: number
  mode: OrbitalMode
  /** isosurface cut, as a fraction of max |ψ| (0.02 … 0.4) */
  iso: number
  /** samples per axis for the isosurface grid */
  gridN?: number
  autoRotate?: boolean
  speed?: number
  onComputed?: (info: { verts: number; ms: number; extent: number }) => void
}

const POS_COLOR = new THREE.Color('#fbbf24')
const NEG_COLOR = new THREE.Color('#2dd4bf')

/**
 * True-QM orbital renderer.
 *
 * 'surface' — ψ isosurface extracted with surface nets over a power-graded
 * grid (dense near the nucleus so inner radial nodes survive), lobe colour =
 * sign of ψ. 'cloud' — |ψ|² point cloud via inverse-CDF radial sampling plus
 * angular rejection, brightness ∝ |ψ|.
 *
 * Physics is evaluated in math-convention coordinates and sampled directly in
 * display space (physics z → screen-up) so lobe labels match the axes.
 */
export default function OrbitalCanvas({
  orbital,
  zEff,
  mode,
  iso,
  gridN = 84,
  autoRotate = true,
  speed = 1,
  onComputed,
}: OrbitalCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const camRef = useRef<THREE.PerspectiveCamera | null>(null)
  const ctrlRef = useRef<THREE.OrbitControls | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const rotateRef = useRef({ autoRotate, speed })
  const onComputedRef = useRef(onComputed)
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    rotateRef.current = { autoRotate, speed }
  }, [autoRotate, speed])

  useEffect(() => {
    onComputedRef.current = onComputed
  }, [onComputed])

  /* scene scaffold */
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // pin the canvas CSS box to its mount (works at any devicePixelRatio)
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.inset = '0'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.touchAction = 'none'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 2000)
    camera.position.set(9, 5.5, 10.5)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.autoRotateSpeed = 0.55

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const key = new THREE.DirectionalLight(0xffffff, 1.05)
    key.position.set(6, 9, 7)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x88aaff, 0.3)
    rim.position.set(-7, -5, -6)
    scene.add(rim)

    sceneRef.current = scene
    camRef.current = camera
    ctrlRef.current = controls

    const resize = () => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const { autoRotate: ar, speed: sp } = rotateRef.current
      controls.autoRotate = ar
      controls.autoRotateSpeed = 0.55 * Math.max(0.05, sp)
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
      sceneRef.current = null
      camRef.current = null
      ctrlRef.current = null
    }
  }, [])

  /* rebuild orbital geometry */
  useEffect(() => {
    let cancelled = false
    let inner: ReturnType<typeof setTimeout> | undefined

    const start = () => {
      const scene = sceneRef.current
      const camera = camRef.current
      const controls = ctrlRef.current
      if (!scene || !camera || !controls) return

      const t0 = performance.now()
      const { n, l, m, sin } = orbital
      const extent = orbitalExtent(n, l, zEff)
      const group = new THREE.Group()

      /* faint axes in display space */
      const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })
      const axisGeo: THREE.BufferGeometry[] = []
      for (const dir of [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]) {
        const g = new THREE.BufferGeometry().setFromPoints([
          dir.clone().multiplyScalar(-extent * 0.92),
          dir.clone().multiplyScalar(extent * 0.92),
        ])
        axisGeo.push(g)
        group.add(new THREE.Line(g, axisMat))
      }

      if (mode === 'surface') {
        const N = gridN
        const ax = gradedAxis(N, extent)
        /* field is |ψ| sampled in DISPLAY coordinates so that vertex positions
         * come out as (x, y, z)_display with physics-z on the vertical axis:
         * display (X, Y, Z) ↔ physics (X, Z, Y). Meshing |ψ| captures BOTH
         * level sets {ψ=+c} and {ψ=−c} — lobes and torus alike. */
        const field = new Float32Array(N * N * N)
        let maxAbs = 1e-12
        let idx = 0
        for (let k = 0; k < N; k++) {
          const Zd = ax[k]
          for (let j = 0; j < N; j++) {
            const Yd = ax[j]
            for (let i = 0; i < N; i++) {
              const val = psiAt(n, l, m, sin, zEff, ax[i], Zd, Yd)
              field[idx++] = Math.abs(val)
              const a = Math.abs(val)
              if (a > maxAbs) maxAbs = a
            }
          }
        }

        const res = surfaceNets(field, N, N, N, ax, ax, ax, iso * maxAbs)
        const colors = new Float32Array(res.vertexCount * 3)
        const px = new Float32Array(3)
        for (let vI = 0; vI < res.vertexCount; vI++) {
          px[0] = res.positions[vI * 3]
          px[1] = res.positions[vI * 3 + 1]
          px[2] = res.positions[vI * 3 + 2]
          // invert display→physics mapping for the sign sample
          const psi = psiAt(n, l, m, sin, zEff, px[0], px[2], px[1])
          const base = psi >= 0 ? POS_COLOR : NEG_COLOR
          colors[vI * 3] = base.r
          colors[vI * 3 + 1] = base.g
          colors[vI * 3 + 2] = base.b
        }

        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(res.positions, 3))
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geo.setIndex(new THREE.BufferAttribute(res.indices, 1))
        geo.computeVertexNormals()

        const mat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.42,
          metalness: 0.08,
          side: THREE.DoubleSide,
        })
        group.add(new THREE.Mesh(geo, mat))

        const dist = extent * 2.6 + 0.4
        camera.position.set(dist * 0.62, dist * 0.38, dist * 0.72)
        camera.near = Math.max(0.005, extent * 0.01)
        camera.far = extent * 30
        camera.updateProjectionMatrix()
        onComputedRef.current?.({ verts: res.vertexCount, ms: performance.now() - t0, extent })
      } else {
        /* |ψ|² point cloud — inverse-CDF radial sampling + angular rejection */
        const R_MAX = extent * 1.03
        const BINS = 4096
        const dr = R_MAX / BINS
        const cdf = new Float64Array(BINS)
        let acc = 0
        for (let i = 0; i < BINS; i++) {
          const r = (i + 0.5) * dr
          const rho = (2 * zEff * r) / n
          // unnormalised radial shape — constant factors cancel in the CDF
          const Rv = Math.exp(-rho / 2) * Math.pow(rho, l)
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

        let maxY2 = 1e-12
        for (let ti = 0; ti <= 180; ti++) {
          const theta = (ti / 180) * Math.PI
          for (let p2 = 0; p2 <= 360; p2 += 2) {
            const phi = (p2 / 360) * Math.PI
            const y = realYlm(l, m, sin, theta, phi)
            const y2 = y * y
            if (y2 > maxY2) maxY2 = y2
          }
        }

        const target = gridN >= 96 ? 34000 : 22000
        const positions = new Float32Array(target * 3)
        const colors = new Float32Array(target * 3)
        let count = 0
        let psiMaxSeen = 1e-12
        let guard = 0

        while (count < target && guard < target * 60) {
          guard++
          const r = sampleR()
          const uz = Math.random() * 2 - 1
          const phi = Math.random() * Math.PI * 2
          const st = Math.sqrt(1 - uz * uz)
          const y = realYlm(l, m, sin, Math.acos(uz), phi)
          if (Math.random() * maxY2 > y * y) continue
          const psi = radialR(n, l, r, zEff) * y
          const aPsi = Math.abs(psi)
          if (aPsi > psiMaxSeen) psiMaxSeen = aPsi

          const i3 = count * 3
          positions[i3] = st * Math.cos(phi) * r
          positions[i3 + 1] = uz * r // physics-z → display-up
          positions[i3 + 2] = st * Math.sin(phi) * r
          const base = psi >= 0 ? POS_COLOR : NEG_COLOR
          const bright = 0.15 + 0.85 * Math.pow(aPsi / psiMaxSeen, 0.55)
          colors[i3] = base.r * bright
          colors[i3 + 1] = base.g * bright
          colors[i3 + 2] = base.b * bright
          count++
        }

        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, count * 3), 3))
        geo.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, count * 3), 3))
        const mat = new THREE.PointsMaterial({
          size: extent / 32,
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        })
        group.add(new THREE.Points(geo, mat))

        const dist = extent * 2.6 + 0.4
        camera.position.set(dist * 0.62, dist * 0.38, dist * 0.72)
        camera.near = Math.max(0.005, extent * 0.01)
        camera.far = extent * 30
        camera.updateProjectionMatrix()
        onComputedRef.current?.({ verts: count, ms: performance.now() - t0, extent })
      }

      scene.add(group)
      const old = groupRef.current
      if (old) {
        old.traverse((obj) => {
          const mesh = obj as THREE.Mesh
          mesh.geometry?.dispose()
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
          if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose())
          else mat?.dispose()
        })
        scene.remove(old)
      }
      groupRef.current = group
      controls.target.set(0, 0, 0)
      controls.minDistance = extent * 0.7
      controls.maxDistance = extent * 8
      controls.update()
      setBusy(false)
    }

    /* paint the "computing ψ…" badge first, then run the heavy build async */
    const timer = setTimeout(() => {
      if (cancelled) return
      setBusy(true)
      inner = setTimeout(() => {
        if (!cancelled) start()
      }, 25)
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (inner) clearTimeout(inner)
    }
  }, [orbital.n, orbital.l, orbital.m, orbital.sin, zEff, mode, iso, gridN])

  return (
    <div ref={mountRef} className="relative h-full w-full overflow-hidden" data-testid="orbital-canvas">
      {busy && (
        <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-zinc-400 backdrop-blur-sm">
          computing ψ…
        </div>
      )}
    </div>
  )
}
