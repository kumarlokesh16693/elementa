'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ElementData } from '@/lib/periodic/types'

interface Bohr3DProps {
  element: ElementData
  accent: string
  /** playback multiplier, 1 = normal */
  speed?: number
  paused?: boolean
}

interface SpinEntry {
  group: THREE.Group
  rate: number
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/**
 * Build nucleon cluster + tilted electron orbit rings into `group`.
 * Nucleons: protons (accent) + neutrons (slate) packed in a golden-spiral ball.
 * Shells: torus rings on deterministic varied planes, each carrying an
 * evenly-spaced electron group that spins about the ring axis
 * (inner shells faster, approximating the Bohr v ∝ 1/n relation).
 */
function buildAtom(
  group: THREE.Group,
  el: ElementData,
  accent: string,
): { spins: SpinEntry[]; maxRing: number } {
  const neutronCount = Math.max(0, Math.round(el.mass) - el.number)
  const total = el.number + neutronCount

  /* ---------- nucleus ---------- */
  const nucleonR = Math.min(0.3, 0.95 / Math.cbrt(total))
  const ballR = Math.max(nucleonR * 1.15, nucleonR * 1.55 * Math.cbrt(total))

  const positions: THREE.Vector3[] = []
  for (let i = 0; i < total; i++) {
    const y = 1 - (2 * (i + 0.5)) / total
    const rad = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = GOLDEN * i
    const r = ballR * Math.cbrt((i + 0.5) / total)
    positions.push(
      new THREE.Vector3(Math.cos(theta) * rad * r, y * r, Math.sin(theta) * rad * r),
    )
  }

  const geo = new THREE.SphereGeometry(1, 12, 10)
  const matP = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accent),
    emissive: new THREE.Color(accent),
    emissiveIntensity: 0.35,
    roughness: 0.35,
    metalness: 0.15,
  })
  const matN = new THREE.MeshStandardMaterial({ color: 0x5b6675, roughness: 0.55, metalness: 0.1 })

  // (i*7919) % total is a permutation for total < 7919 (7919 prime) -> deterministic interleave
  const protons: THREE.Matrix4[] = []
  const neutrons: THREE.Matrix4[] = []
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const sc = new THREE.Vector3(nucleonR, nucleonR, nucleonR)
  for (let i = 0; i < total; i++) {
    const idx = (i * 7919) % total
    m.compose(positions[idx], q, sc)
    if (idx < el.number) protons.push(m.clone())
    else neutrons.push(m.clone())
  }

  const makeInstanced = (mats: THREE.Matrix4[], mat: THREE.Material) => {
    const im = new THREE.InstancedMesh(geo, mat, mats.length)
    mats.forEach((mtx, i) => im.setMatrixAt(i, mtx))
    im.instanceMatrix.needsUpdate = true
    im.frustumCulled = false
    return im
  }
  if (protons.length) group.add(makeInstanced(protons, matP))
  if (neutrons.length) group.add(makeInstanced(neutrons, matN))

  /* ---------- electron shells ---------- */
  const shells = el.shells
  const shellCount = shells.length
  const firstRing = ballR + 1.05
  const gap = shellCount > 1 ? 0.8 : 0
  const electronGeo = new THREE.SphereGeometry(0.085, 10, 8)
  const electronMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
  const spins: SpinEntry[] = []
  let maxRing = firstRing

  for (let i = 0; i < shellCount; i++) {
    const r = firstRing + i * gap
    maxRing = r

    const plane = new THREE.Group()
    plane.rotation.x = ((((i * 47) % 90) - 45) * Math.PI) / 180 * 0.9
    plane.rotation.y = (((i * 61) % 180) * Math.PI) / 180
    plane.rotation.z = ((((i * 23) % 60) - 30) * Math.PI) / 180 * 0.4
    group.add(plane)

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.012, 6, 128),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accent),
        transparent: true,
        opacity: 0.32,
      }),
    )
    plane.add(ring)

    const spin = new THREE.Group()
    plane.add(spin)
    const count = shells[i]
    for (let j = 0; j < count; j++) {
      const a = (2 * Math.PI * j) / count
      const e = new THREE.Mesh(electronGeo, electronMat)
      e.position.set(r * Math.cos(a), r * Math.sin(a), 0)
      spin.add(e)
    }
    const dir = i % 2 === 0 ? 1 : -1
    spins.push({ group: spin, rate: dir * (0.9 / (1 + i * 0.3)) })
  }

  return { spins, maxRing }
}

export default function Bohr3D({ element, accent, speed = 1, paused = false }: Bohr3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef(speed)
  const pausedRef = useRef(paused)
  const rebuildRef = useRef<((el: ElementData, ac: string) => void) | null>(null)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'none'
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5
    controls.minDistance = 4
    controls.maxDistance = 60

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(5, 8, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x88aaff, 0.35)
    rim.position.set(-6, -4, -5)
    scene.add(rim)

    /* starfield backdrop for depth */
    const starCount = 420
    const pos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(60 + Math.random() * 60)
      pos[i * 3] = v.x
      pos[i * 3 + 1] = v.y
      pos[i * 3 + 2] = v.z
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const starMat = new THREE.PointsMaterial({
      color: 0x3b4a63,
      size: 0.55,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    const atomGroup = new THREE.Group()
    scene.add(atomGroup)
    let spins: SpinEntry[] = []

    const disposeGroup = () => {
      atomGroup.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose())
        else mat?.dispose()
      })
      atomGroup.clear()
    }

    const rebuild = (el: ElementData, ac: string) => {
      disposeGroup()
      const res = buildAtom(atomGroup, el, ac)
      spins = res.spins
      const dist = Math.max(6, res.maxRing * 2.3 + 1.6)
      camera.position.set(0, dist * 0.32, dist)
      camera.lookAt(0, 0, 0)
      controls.target.set(0, 0, 0)
      controls.update()
    }
    rebuildRef.current = rebuild

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

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      if (!pausedRef.current) {
        const sp = speedRef.current
        for (const s of spins) s.group.rotation.z += s.rate * sp * dt
      }
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      disposeGroup()
      starGeo.dispose()
      starMat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
      rebuildRef.current = null
    }
  }, [])

  useEffect(() => {
    rebuildRef.current?.(element, accent)
  }, [element, accent])

  return <div ref={mountRef} className="h-full w-full" data-testid="bohr3d-canvas" />
}
