import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  Line,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OrbitControls,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer,
} from '@nexus/3d'
import type { SimEngine } from '@/lib/sim/engine'
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

const EXAG = 14
const MAX_TRAJ = 8192
const MAX_PRED = 300

type ViewMode = 'planet' | 'chase'

function makeLineGeometry(pos: number[], col: number[] | null): BufferGeometry {
  const geo = new BufferGeometry()
  if (col) geo.setAttribute('color', { array: new Float32Array(col), itemSize: 3 })
  geo.setAttribute('position', { array: new Float32Array(pos), itemSize: 3 })
  return geo
}

export function createScene3D(mount: HTMLElement, engine: SimEngine) {
  let view: ViewMode = 'planet'
  let warp: 1 | 2 | 5 | 10 = 5

  const canvasContainer = document.createElement('div')
  canvasContainer.className = 'absolute inset-0'
  mount.appendChild(canvasContainer)

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(mount.clientWidth || 800, mount.clientHeight || 600)
  canvasContainer.appendChild(renderer.domElement)

  const scene = new Scene()
  const camera = new PerspectiveCamera(46, (mount.clientWidth || 800) / (mount.clientHeight || 600), 0.05, 30000)
  camera.position.set(96, 62, 235)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 12
  controls.maxDistance = 900
  controls.target.set(0, 0, 0)

  scene.add(new AmbientLight(0x8899bb, 0.35))
  const sun = new DirectionalLight(0xffffff, 2.6)
  sun.position.set(1000, 320, 500)
  scene.add(sun)
  scene.add(makeStarfield(2200, 9000))

  /* ---------- state ---------- */
  let planet: ReturnType<typeof buildPlanet> | null = null
  let vehicleMesh: Mesh | null = null
  let builtCfg = -1

  const glowTex = makeGlowTexture()
  const glow = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({
      color: 0xffffff,
      map: glowTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  )
  const plasmaLight = new PointLight(0xff8844, 0, 30, 0)
  const vehicleGroup = new Object3D()
  vehicleGroup.add(glow)
  vehicleGroup.add(plasmaLight)
  scene.add(vehicleGroup)

  /* trajectory lines */
  const trajLine = new Line(new BufferGeometry(), new MeshBasicMaterial({ transparent: true, opacity: 0.95 }))
  const predLine = new Line(
    new BufferGeometry(),
    new MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.3 }),
  )
  scene.add(trajLine)
  scene.add(predLine)

  const swapLineGeometry = (line: Line, pos: number[], col: number[] | null) => {
    if (line.geometry.getAttribute('position')) renderer.releaseGeometry(line.geometry)
    line.geometry = makeLineGeometry(pos, col)
  }

  const rebuild = () => {
    builtCfg = engine.cfgVersion
    if (planet) {
      scene.remove(planet.group)
      planet.group.traverse((o) => {
        const m = o as Mesh
        if (m.geometry) renderer.releaseGeometry(m.geometry)
      })
    }
    if (vehicleMesh) {
      vehicleGroup.remove(vehicleMesh)
      renderer.releaseGeometry(vehicleMesh.geometry)
      vehicleMesh = null
    }

    const P = PLANETS[engine.cfg.planet]
    planet = buildPlanet(engine.cfg.planet, P.radius / 1e5)
    scene.add(planet.group)

    const kind = VEHICLES[engine.cfg.vehicle].kind
    const geo = kind === 'waverider' ? buildWaveriderGeometry() : buildCapsuleGeometry()
    const mat = new MeshStandardMaterial({
      color: kind === 'waverider' ? 0x9aa4b2 : 0x8a7f72,
      metalness: 0.75,
      roughness: 0.35,
      emissive: 0x1a0e06,
      emissiveIntensity: 0.6,
    })
    vehicleMesh = new Mesh(geo, mat)
    vehicleMesh.scale.setScalar(kind === 'waverider' ? 0.085 : 0.16)
    vehicleGroup.add(vehicleMesh)
  }

  const tmpV = new Vector3()
  const upV = new Vector3()
  const fwdV = new Vector3()
  const rightV = new Vector3()
  const basis = new Matrix4()
  const camGoal = new Vector3()
  const lookGoal = new Vector3()
  let chaseInit = false
  let lastView: ViewMode = 'planet'

  const setRGB = (color: { r: number; g: number; b: number }, r: number, g: number, b: number): void => {
    color.r = r
    color.g = g
    color.b = b
  }

  const updateVehicle = (heatN: number) => {
    const P = PLANETS[engine.cfg.planet]
    const pose = engine.pose()
    const rU = P.radius / 1e5 + ((pose.h / 1000) * EXAG) / 100
    const c = Math.cos(pose.theta)
    const s = Math.sin(pose.theta)
    upV.set(c, 0, -s)
    tmpV.set(-s, 0, -c)
    const cg = Math.cos(pose.gamma)
    const sn = Math.sin(pose.gamma)
    fwdV.copy(tmpV).multiplyScalar(cg).addScaledVector(upV, sn).normalize()
    rightV.copy(fwdV).cross(upV).normalize()

    vehicleGroup.position.set(c * rU, 0, -s * rU)
    basis.set(fwdV.x, fwdV.y, fwdV.z, 0, upV.x, upV.y, upV.z, 0, rightV.x, rightV.y, rightV.z, 0, 0, 0, 0, 1)
    vehicleGroup.quaternion.setFromRotationMatrix(basis)
    glow.quaternion.copy(camera.quaternion)

    const col = heatColorRGB(heatN)
    const glowMat = glow.material as MeshBasicMaterial
    setRGB(glowMat.color, col[0], col[1], col[2])
    glowMat.opacity = clamp(0.12 + heatN * 1.6, 0, 0.95)
    const gs = 1.6 + heatN * 3.6
    glow.scale.set(gs, gs * 0.8, 1)
    plasmaLight.color.setRGB(col[0], col[1], col[2])
    plasmaLight.intensity = heatN * 3.5
    if (vehicleMesh) {
      const m = vehicleMesh.material as MeshStandardMaterial
      m.emissive.setRGB(col[0] * heatN * 0.5, col[1] * heatN * 0.28, col[2] * heatN * 0.12)
    }
    return { pos: vehicleGroup.position, fwd: fwdV, up: upV }
  }

  const updateTrajectory = (scaleMax: number) => {
    const P = PLANETS[engine.cfg.planet]
    const hist = engine.history
    const n = Math.min(hist.length, MAX_TRAJ)
    const start = hist.length - n
    const pos: number[] = []
    const col: number[] = []
    for (let i = 0; i < n; i++) {
      const p = hist[start + i]
      const rU = P.radius / 1e5 + ((p.h / 1000) * EXAG) / 100
      const c = Math.cos(p.theta)
      const s = Math.sin(p.theta)
      const heat = heatColorRGB(clamp(p.heat / scaleMax, 0, 1))
      if (i > 0) {
        pos.push(pos[pos.length - 3], pos[pos.length - 2], pos[pos.length - 1])
        col.push(col[col.length - 3], col[col.length - 2], col[col.length - 1])
      }
      pos.push(c * rU, 0, -s * rU)
      col.push(heat[0], heat[1], heat[2])
    }
    swapLineGeometry(trajLine, pos, col)
  }

  const updatePrediction = () => {
    const P = PLANETS[engine.cfg.planet]
    const path = engine.predictPath(240, MAX_PRED - 1)
    const pos: number[] = []
    for (let i = 0; i < path.length; i++) {
      const rU = P.radius / 1e5 + ((path[i].h / 1000) * EXAG) / 100
      const c = Math.cos(path[i].theta)
      const s = Math.sin(path[i].theta)
      if (i > 0) pos.push(pos[pos.length - 3], pos[pos.length - 2], pos[pos.length - 1])
      pos.push(c * rU, 0, -s * rU)
    }
    swapLineGeometry(predLine, pos, null)
  }

  /* ---------- UI Overlays ---------- */
  const overlay = document.createElement('div')
  overlay.className = 'pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2 select-none'

  const viewGroup = document.createElement('div')
  viewGroup.className = 'flex overflow-hidden rounded-md border border-white/15 bg-black/55 font-mono text-[10px] tracking-widest backdrop-blur-sm'
  const planetBtn = document.createElement('button')
  planetBtn.type = 'button'
  planetBtn.textContent = 'PLANET VIEW'
  planetBtn.className = 'px-3 py-1.5 transition-colors bg-amber-500/90 text-black cursor-pointer'

  const chaseBtn = document.createElement('button')
  chaseBtn.type = 'button'
  chaseBtn.textContent = 'CHASE CAM'
  chaseBtn.className = 'px-3 py-1.5 transition-colors text-zinc-300 hover:bg-white/10 cursor-pointer'

  planetBtn.onclick = () => {
    view = 'planet'
    planetBtn.className = 'px-3 py-1.5 transition-colors bg-amber-500/90 text-black cursor-pointer'
    chaseBtn.className = 'px-3 py-1.5 transition-colors text-zinc-300 hover:bg-white/10 cursor-pointer'
  }
  chaseBtn.onclick = () => {
    view = 'chase'
    chaseBtn.className = 'px-3 py-1.5 transition-colors bg-amber-500/90 text-black cursor-pointer'
    planetBtn.className = 'px-3 py-1.5 transition-colors text-zinc-300 hover:bg-white/10 cursor-pointer'
  }
  viewGroup.appendChild(planetBtn)
  viewGroup.appendChild(chaseBtn)
  overlay.appendChild(viewGroup)

  const warpGroup = document.createElement('div')
  warpGroup.className = 'flex overflow-hidden rounded-md border border-white/15 bg-black/55 font-mono text-[10px] backdrop-blur-sm'
  const warpBtns: HTMLButtonElement[] = []
  ;([1, 2, 5, 10] as const).forEach((w) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = `${w}×`
    btn.className = `px-2.5 py-1.5 transition-colors cursor-pointer ${
      warp === w ? 'bg-cyan-600/80 text-white' : 'text-zinc-300 hover:bg-white/10'
    }`
    btn.onclick = () => {
      warp = w
      engine.setWarp(w)
      warpBtns.forEach((b, idx) => {
        const val = [1, 2, 5, 10][idx]
        b.className = `px-2.5 py-1.5 transition-colors cursor-pointer ${
          warp === val ? 'bg-cyan-600/80 text-white' : 'text-zinc-300 hover:bg-white/10'
        }`
      })
    }
    warpBtns.push(btn)
    warpGroup.appendChild(btn)
  })
  overlay.appendChild(warpGroup)
  mount.appendChild(overlay)

  // Mission tag
  const missionTag = document.createElement('div')
  missionTag.className = 'pointer-events-none absolute left-3 top-3 rounded border border-white/10 bg-black/50 px-2.5 py-1.5 font-mono text-[10px] tracking-widest text-zinc-300 backdrop-blur-sm select-none'
  mount.appendChild(missionTag)

  // Scale note
  const scaleNote = document.createElement('div')
  scaleNote.className = 'pointer-events-none absolute bottom-[76px] left-3 rounded bg-black/40 px-2 py-1 font-mono text-[9px] tracking-wider text-zinc-500 backdrop-blur-sm select-none'
  scaleNote.textContent = `ALTITUDE ×${EXAG} EXAGGERATED · 1 UNIT = 100 KM`
  mount.appendChild(scaleNote)

  // Corner brackets
  const brackets = document.createElement('div')
  brackets.className = 'pointer-events-none absolute inset-2 border border-white/5'
  mount.appendChild(brackets)

  const vignette = document.createElement('div')
  vignette.className = 'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]'
  mount.appendChild(vignette)

  /* ---------- animation loop ---------- */
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

    if (engine.cfgVersion !== builtCfg) {
      rebuild()
      missionTag.textContent = `${engine.ui.missionName} · ${engine.ui.planetName} · ${engine.ui.vehicleName}`
    }

    const scaleMax = engine.ui.colorScaleMax
    const heatN = clamp(engine.ui.heat / 250, 0, 1)
    const vp = updateVehicle(heatN)

    if (frame % 6 === 0) updateTrajectory(scaleMax)
    if (frame % 24 === 0) updatePrediction()

    if (planet) {
      ;(planet.uniforms as PlanetUniforms).uTime.value += dt
      planet.surface.rotation.y += dt * 0.004
      planet.clouds.rotation.y += dt * 0.0052
    }

    if (view === 'chase') {
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
      if (lastView === 'chase') {
        const dir = camera.position.clone()
        if (dir.lengthSq() < 1e-6) dir.set(0.4, 0.25, 1)
        dir.normalize().multiplyScalar(285)
        camera.position.copy(dir)
        controls.target.set(0, 0, 0)
      }
      controls.update()
    }
    lastView = view

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

  missionTag.textContent = `${engine.ui.missionName} · ${engine.ui.planetName} · ${engine.ui.vehicleName}`

  return {
    dispose: () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
      scene.traverse((o) => {
        const m = o as Mesh & { geometry?: BufferGeometry; material?: { dispose?: () => void } }
        if (m.geometry) renderer.releaseGeometry(m.geometry)
        m.material?.dispose?.()
      })
      mount.replaceChildren()
    },
  }
}
