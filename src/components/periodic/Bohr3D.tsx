'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ElementData } from '@/lib/periodic/types'
import { CATEGORY_MAP, SHELL_LETTERS } from '@/lib/periodic/types'
import { neutronCount } from '@/lib/periodic'

interface Bohr3DProps {
  element: ElementData
  playing: boolean
  speed: number
  autoRotate: boolean
}

interface ShellRig {
  group: THREE.Group
  ring: THREE.Mesh
  electrons: THREE.InstancedMesh
  radius: number
  count: number
  index: number
}

function makeHaloTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.25, 'rgba(255,255,255,0.35)')
  grad.addColorStop(0.6, 'rgba(255,255,255,0.08)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function Bohr3D({ element, playing, speed, autoRotate }: Bohr3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const ctrlRef = useRef({ playing, speed, autoRotate })
  const shellsRef = useRef<ShellRig[]>([])
  const nucleusRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    ctrlRef.current = { playing, speed, autoRotate }
  }, [playing, speed, autoRotate])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const color = new THREE.Color(CATEGORY_MAP[element.category].color)
    const nNeutrons = neutronCount(element)
    const A = element.number + nNeutrons

    /* ---------- renderer / scene / camera ---------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'none'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / Math.max(1, mount.clientHeight),
      0.1,
      300,
    )

    /* ---------- dimensions ---------- */
    const nucR = Math.max(1.0, 1.15 * Math.cbrt(A))
    const shellCount = element.shells.length
    const step = (17.5 - nucR - 2.2) / Math.max(1, shellCount)
    const maxR = nucR + 2.2 + step * shellCount
    camera.position.set(0, maxR * 0.95, maxR * 2.55)
    camera.lookAt(0, 0, 0)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = maxR * 0.8
    controls.maxDistance = maxR * 6
    controls.autoRotateSpeed = 1.1

    /* ---------- lights ---------- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const centerLight = new THREE.PointLight(color, 260, 0, 1.8)
    centerLight.position.set(0, 0, 0)
    scene.add(centerLight)
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(12, 22, 16)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x8899aa, 0.5)
    rim.position.set(-14, -8, -12)
    scene.add(rim)

    /* ---------- nucleus ---------- */
    const nucleus = new THREE.Group()
    const sphereGeo = new THREE.SphereGeometry(1, 14, 14)
    const nucMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 })
    const nucMesh = new THREE.InstancedMesh(sphereGeo, nucMat, A)
    const dotR = Math.max(0.3, (0.78 * nucR) / Math.cbrt(A))
    const m4 = new THREE.Matrix4()
    const neutronColor = new THREE.Color('#8b93a3')
    for (let i = 0; i < A; i++) {
      const r = nucR * Math.cbrt((i + 0.5) / A)
      const th = i * 2.39996 + 0.7
      const ph = Math.acos(1 - (2 * (i + 0.5)) / A)
      m4.makeScale(dotR, dotR, dotR)
      m4.setPosition(
        r * Math.sin(ph) * Math.cos(th),
        r * Math.cos(ph),
        r * Math.sin(ph) * Math.sin(th),
      )
      nucMesh.setMatrixAt(i, m4)
      nucMesh.setColorAt(i, i < element.number ? color : neutronColor)
    }
    nucMesh.instanceMatrix.needsUpdate = true
    if (nucMesh.instanceColor) nucMesh.instanceColor.needsUpdate = true
    nucleus.add(nucMesh)

    const haloTex = makeHaloTexture()
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const halo = new THREE.Sprite(haloMat)
    halo.scale.setScalar(nucR * 7)
    nucleus.add(halo)
    scene.add(nucleus)

    /* ---------- shells & electrons ---------- */
    const electronGeo = new THREE.SphereGeometry(1, 10, 10)
    const ringGeo = new THREE.TorusGeometry(1, 0.045, 8, 150)
    const electronMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: color,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    })
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.14,
    })
    const valenceRingMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
    })

    const rigs: ShellRig[] = []
    for (let i = 0; i < shellCount; i++) {
      const R = nucR + 2.2 + step * (i + 0.5)
      const group = new THREE.Group()
      // deterministic, distinct orbital plane per shell
      group.rotation.x = (Math.PI / 12) * ((i * 5) % 12)
      group.rotation.z = (Math.PI / 12) * ((i * 7) % 12)

      const ring = new THREE.Mesh(ringGeo, i === shellCount - 1 ? valenceRingMat : ringMat)
      ring.scale.setScalar(R)
      group.add(ring)

      const count = element.shells[i]
      const electrons = new THREE.InstancedMesh(
        electronGeo,
        electronMat,
        count,
      )
      const er = (i === shellCount - 1 ? 0.34 : 0.28) * Math.max(0.85, 1 - i * 0.04)
      electrons.userData.er = er
      group.add(electrons)
      scene.add(group)
      rigs.push({ group, ring, electrons, radius: R, count, index: i })
    }
    shellsRef.current = rigs
    nucleusRef.current = nucleus

    /* ---------- animation loop ---------- */
    const clock = new THREE.Clock()
    const angles = rigs.map((_, i) => i * 0.9)
    const tmpM = new THREE.Matrix4()
    const tmpQ = new THREE.Quaternion()
    const tmpP = new THREE.Vector3()
    const tmpS = new THREE.Vector3()
    let raf = 0

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      const { playing: play, speed: spd } = ctrlRef.current

      if (play) {
        nucleus.rotation.y += dt * 0.22
        for (const rig of rigs) {
          angles[rig.index] +=
            dt * spd * (2.7 / Math.pow(rig.index + 1, 1.12))
          const a0 = angles[rig.index]
          const er = rig.electrons.userData.er as number
          tmpS.setScalar(er)
          for (let j = 0; j < rig.count; j++) {
            const a = a0 + (j / rig.count) * Math.PI * 2
            tmpP.set(
              rig.radius * Math.cos(a),
              0,
              rig.radius * Math.sin(a),
            )
            tmpQ.identity()
            tmpM.compose(tmpP, tmpQ, tmpS)
            rig.electrons.setMatrixAt(j, tmpM)
          }
          rig.electrons.instanceMatrix.needsUpdate = true
        }
      }

      controls.autoRotate = ctrlRef.current.autoRotate
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    /* ---------- resize ---------- */
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth
      const h = Math.max(1, mount.clientHeight)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(mount)

    /* ---------- cleanup ---------- */
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      controls.dispose()
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else if (mat) mat.dispose()
      })
      sphereGeo.dispose()
      electronGeo.dispose()
      ringGeo.dispose()
      haloTex.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement)
      }
      shellsRef.current = []
      nucleusRef.current = null
    }
  }, [element])

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-white/10 bg-black/45 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-300 backdrop-blur-sm">
        {element.shells.map((c, i) => (
          <div key={i} className="flex justify-between gap-3">
            <span className="text-zinc-500">{SHELL_LETTERS[i]}</span>
            <span>{c} e⁻</span>
          </div>
        ))}
        <div className="mt-1 border-t border-white/10 pt-1 text-[10px] text-zinc-500">
          {element.shells.length} shell{element.shells.length === 1 ? '' : 's'}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] tracking-wide text-zinc-600">
        DRAG TO ORBIT · SCROLL TO ZOOM
      </div>
    </div>
  )
}
