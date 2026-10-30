'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useSim } from './SimProvider'
import {
  buildCapsuleGeometry,
  buildPlanet,
  buildWaveriderGeometry,
  makeGlowTexture,
  makeStarfield,
  type PlanetUniforms,
} from './sceneAssets'
import { clamp, heatColorRGB, PLANETS } from '@/lib/sim/constants'
import { VEHICLES } from '@/lib/sim/vehicles'

/* 1 scene unit = 100 km; altitudes are exaggerated ×14 so the 40–120 km
   flight corridor is visible at planetary scale (like a mission-cinema view) */
const EXAG = 14
const MAX_TRAJ = 8192
const MAX_PRED = 300

type ViewMode = 'planet' | 'chase'

export default function Scene3D() {
  const { engine } = useSim()
  const mountRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<ViewMode>('planet')
  const [view, setView] = useState<ViewMode>('planet')
  const [warp, setWarp] = useState<1 | 2 | 5 | 10>(5)

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    /* ---------- renderer / scene / camera ---------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x02040a)

    const camera = new THREE.PerspectiveCamera(46, mount.clientWidth / mount.clientHeight, 0.05, 30000)
    camera.position.set(96, 62, 235)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 12
    controls.maxDistance = 900
    controls.target.set(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x8899bb, 0.35))
    const sun = new THREE.DirectionalLight(0xffffff, 2.6)
    sun.position.set(1000, 320, 500)
    scene.add(sun)

    scene.add(makeStarfield(2200, 9000))

    /* ---------- state ---------- */
    let planet: ReturnType<typeof buildPlanet> | null = null
    let vehicleMesh: THREE.Mesh | null = null
    let builtCfg = -1

    const glowTex = makeGlowTexture()
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    const plasmaLight = new THREE.PointLight(0xff8844, 0, 30, 0)
    const vehicleGroup = new THREE.Group()
    vehicleGroup.add(glow, plasmaLight)
    scene.add(vehicleGroup)

    const trajPos = new Float32Array(MAX_TRAJ * 3)
    const trajCol = new Float32Array(MAX_TRAJ * 3)
    const trajGeo = new THREE.BufferGeometry()
    trajGeo.setAttribute('position', new THREE.BufferAttribute(trajPos, 3))
    trajGeo.setAttribute('color', new THREE.BufferAttribute(trajCol, 3))
    trajGeo.setDrawRange(0, 0)
    const trajLine = new THREE.Line(
      trajGeo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 })
    )
    scene.add(trajLine)

    const predPos = new Float32Array(MAX_PRED * 3)
    const predGeo = new THREE.BufferGeometry()
    predGeo.setAttribute('position', new THREE.BufferAttribute(predPos, 3))
    predGeo.setDrawRange(0, 0)
    const predLine = new THREE.Line(
      predGeo,
      new THREE.LineBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.3 })
    )
    scene.add(predLine)

    /* ---------- builders ---------- */
    const rebuild = () => {
      builtCfg = engine.cfgVersion
      if (planet) {
        scene.remove(planet.group)
        planet.group.traverse((o) => {
          if (o instanceof THREE.Mesh) o.geometry.dispose()
        })
      }
      if (vehicleMesh) {
        vehicleGroup.remove(vehicleMesh)
        vehicleMesh.geometry.dispose()
        ;(vehicleMesh.material as THREE.Material).dispose()
        vehicleMesh = null
      }
      trajGeo.setDrawRange(0, 0)
      predGeo.setDrawRange(0, 0)

      const P = PLANETS[engine.cfg.planet]
      planet = buildPlanet(engine.cfg.planet, P.radius / 1e5)
      scene.add(planet.group)

      const kind = VEHICLES[engine.cfg.vehicle].kind
      const geo = kind === 'waverider' ? buildWaveriderGeometry() : buildCapsuleGeometry()
      const mat = new THREE.MeshStandardMaterial({
        color: kind === 'waverider' ? 0x9aa4b2 : 0x8a7f72,
        metalness: 0.75,
        roughness: 0.35,
        emissive: 0x1a0e06,
        emissiveIntensity: 0.6,
      })
      vehicleMesh = new THREE.Mesh(geo, mat)
      vehicleMesh.scale.setScalar(kind === 'waverider' ? 0.085 : 0.16)
      vehicleGroup.add(vehicleMesh)
    }

    /* ---------- per-frame updates ---------- */
    const tmpV = new THREE.Vector3()
    const upV = new THREE.Vector3()
    const fwdV = new THREE.Vector3()
    const rightV = new THREE.Vector3()
    const basis = new THREE.Matrix4()
    const camGoal = new THREE.Vector3()
    const lookGoal = new THREE.Vector3()
    let chaseInit = false
    let lastView: ViewMode = 'planet'

    const updateVehicle = (heatN: number) => {
      const P = PLANETS[engine.cfg.planet]
      const pose = engine.pose()
      const rU = P.radius / 1e5 + ((pose.h / 1000) * EXAG) / 100
      const c = Math.cos(pose.theta)
      const s = Math.sin(pose.theta)
      // radial (up) and transverse unit vectors in the equatorial plane
      upV.set(c, 0, -s)
      tmpV.set(-s, 0, -c)
      const cg = Math.cos(pose.gamma)
      const sn = Math.sin(pose.gamma)
      fwdV.copy(tmpV).multiplyScalar(cg).addScaledVector(upV, sn).normalize()
      rightV.copy(fwdV).cross(upV).normalize()

      vehicleGroup.position.set(c * rU, 0, -s * rU)
      basis.makeBasis(fwdV, upV, rightV)
      vehicleGroup.quaternion.setFromRotationMatrix(basis)

      // plasma glow + light
      const col = heatColorRGB(heatN)
      glow.material.color.setRGB(col[0], col[1], col[2])
      glow.material.opacity = clamp(0.12 + heatN * 1.6, 0, 0.95)
      const gs = 1.6 + heatN * 3.6
      glow.scale.set(gs, gs * 0.8, 1)
      plasmaLight.color.setRGB(col[0], col[1], col[2])
      plasmaLight.intensity = heatN * 3.5
      if (vehicleMesh) {
        const m = vehicleMesh.material as THREE.MeshStandardMaterial
        m.emissive.setRGB(col[0] * heatN * 0.5, col[1] * heatN * 0.28, col[2] * heatN * 0.12)
      }
      return { pos: vehicleGroup.position, fwd: fwdV, up: upV }
    }

    const updateTrajectory = (scaleMax: number) => {
      const P = PLANETS[engine.cfg.planet]
      const hist = engine.history
      const n = Math.min(hist.length, MAX_TRAJ)
      const start = hist.length - n
      for (let i = 0; i < n; i++) {
        const p = hist[start + i]
        const rU = P.radius / 1e5 + ((p.h / 1000) * EXAG) / 100
        const c = Math.cos(p.theta)
        const s = Math.sin(p.theta)
        trajPos[i * 3] = c * rU
        trajPos[i * 3 + 1] = 0
        trajPos[i * 3 + 2] = -s * rU
        const col = heatColorRGB(clamp(p.heat / scaleMax, 0, 1))
        trajCol[i * 3] = col[0]
        trajCol[i * 3 + 1] = col[1]
        trajCol[i * 3 + 2] = col[2]
      }
      trajGeo.attributes.position.needsUpdate = true
      trajGeo.attributes.color.needsUpdate = true
      trajGeo.setDrawRange(0, n)
    }

    const updatePrediction = () => {
      const P = PLANETS[engine.cfg.planet]
      const path = engine.predictPath(240, MAX_PRED - 1)
      const n = Math.min(path.length, MAX_PRED)
      for (let i = 0; i < n; i++) {
        const rU = P.radius / 1e5 + ((path[i].h / 1000) * EXAG) / 100
        const c = Math.cos(path[i].theta)
        const s = Math.sin(path[i].theta)
        predPos[i * 3] = c * rU
        predPos[i * 3 + 1] = 0
        predPos[i * 3 + 2] = -s * rU
      }
      predGeo.attributes.position.needsUpdate = true
      predGeo.setDrawRange(0, n)
    }

    /* ---------- main loop ---------- */
    let raf = 0
    let last = performance.now()
    let frame = 0

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      frame++

      engine.tick(dt)

      if (engine.cfgVersion !== builtCfg) rebuild()

      const scaleMax = engine.ui.colorScaleMax
      // glow normalized on a fixed physical scale so superorbital entries blaze
      const heatN = clamp(engine.ui.heat / 250, 0, 1)
      const vp = updateVehicle(heatN)

      if (frame % 6 === 0) updateTrajectory(scaleMax)
      if (frame % 24 === 0) updatePrediction()

      if (planet) {
        planet.uniforms.uTime.value += dt
        planet.surface.rotation.y += dt * 0.004
        planet.clouds.rotation.y += dt * 0.0052
      }

      if (viewRef.current === 'chase') {
        controls.enabled = false
        camGoal.copy(vp.pos).addScaledVector(vp.fwd, -3.4).addScaledVector(vp.up, 1.15)
        lookGoal.copy(vp.pos).addScaledVector(vp.fwd, 4)
        if (!chaseInit) {
          camera.position.copy(camGoal)
          chaseInit = true
        } else {
          camera.position.lerp(camGoal, 0.07)
        }
        camera.lookAt(lookGoal)
      } else {
        controls.enabled = true
        chaseInit = false
        // returning from chase: restore a clean planetary orbit position
        if (lastView === 'chase') {
          const dir = camera.position.clone()
          if (dir.lengthSq() < 1e-6) dir.set(0.4, 0.25, 1)
          dir.normalize().multiplyScalar(285)
          camera.position.copy(dir)
          controls.target.set(0, 0, 0)
        }
        controls.update()
      }
      lastView = viewRef.current

      renderer.render(scene, camera)
    }
    animate()

    /* ---------- resize ---------- */
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(mount)

    /* ---------- cleanup ---------- */
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points) {
          o.geometry?.dispose()
          const m = o.material as THREE.Material | THREE.Material[]
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose())
          else m?.dispose()
        }
      })
      glowTex.dispose()
    }
  }, [engine])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

      {/* top-right: camera + time warp */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
        <div className="flex overflow-hidden rounded-md border border-white/15 bg-black/55 font-mono text-[10px] tracking-widest backdrop-blur-sm">
          {(['planet', 'chase'] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setView(m)}
              className={`px-3 py-1.5 transition-colors ${
                view === m ? 'bg-amber-500/90 text-black' : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              {m === 'planet' ? 'PLANET VIEW' : 'CHASE CAM'}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-md border border-white/15 bg-black/55 font-mono text-[10px] backdrop-blur-sm">
          {([1, 2, 5, 10] as const).map((w) => (
            <button
              key={w}
              onClick={() => {
                setWarp(w)
                engine.setWarp(w)
              }}
              className={`px-2.5 py-1.5 transition-colors ${
                warp === w ? 'bg-cyan-600/80 text-white' : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              {w}×
            </button>
          ))}
        </div>
      </div>

      {/* mission tag */}
      <div className="pointer-events-none absolute left-3 top-3 rounded border border-white/10 bg-black/50 px-2.5 py-1.5 font-mono text-[10px] tracking-widest text-zinc-300 backdrop-blur-sm">
        {engine.ui.missionName} · {engine.ui.planetName} · {engine.ui.vehicleName}
      </div>

      {/* scale note */}
      <div className="pointer-events-none absolute bottom-[76px] left-3 rounded bg-black/40 px-2 py-1 font-mono text-[9px] tracking-wider text-zinc-500 backdrop-blur-sm">
        ALTITUDE ×{EXAG} EXAGGERATED · 1 UNIT = 100 KM
      </div>

      {/* corner brackets for the flight-supervisor look */}
      <div className="pointer-events-none absolute inset-2 border border-white/5" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  )
}
