import { getElement } from '@/lib/periodic'
import type { ElementData } from '@/lib/periodic/types'
import {
  CU_K_ALPHA,
  MO_K_ALPHA,
  getCrystallographyDetails,
  type MillerPlane,
  type XrdPeak,
} from '@/lib/periodic/crystallography'

type CrystalKind = 'bcc' | 'fcc' | 'hcp' | 'diamond' | 'simple-cubic' | 'tetragonal' | 'orthorhombic' | 'rhombohedral' | 'molecular'
interface CrystalSpec {
  kind: CrystalKind
  name: string
  system: string
  pearson: string
  spaceGroup: string
  coordination: string
  detail: string
}

type TabMode = 'cell' | 'miller' | 'xrd'

const FCC = new Set([13, 20, 28, 29, 36, 38, 45, 46, 47, 58, 63, 70, 78, 79, 82, 88, 90, 94, 96, 100, 102, 103])
const BCC = new Set([3, 11, 19, 37, 55, 87, 23, 24, 26, 41, 42, 56, 73, 74, 75, 108, 110])
const HCP = new Set([4, 12, 21, 22, 27, 30, 39, 40, 43, 44, 48, 57, 59, 60, 64, 65, 66, 67, 68, 69, 71, 72, 76, 77, 80, 81, 89, 91, 92, 93, 95, 97, 98, 99, 101])
const DIAMOND = new Set([6, 14, 32])
const COMPLEX: Partial<Record<number, Omit<CrystalSpec, 'detail'>>> = {
  1: { kind: 'hcp', name: 'Hexagonal molecular', system: 'Hexagonal', pearson: 'hP4', spaceGroup: 'P6₃/mmc', coordination: 'Molecular solid' },
  2: { kind: 'hcp', name: 'Close-packed helium', system: 'Hexagonal', pearson: 'hP2', spaceGroup: 'P6₃/mmc', coordination: '12 (solid under pressure)' },
  5: { kind: 'rhombohedral', name: 'α-Boron', system: 'Rhombohedral', pearson: 'hR12', spaceGroup: 'R-3m', coordination: 'Icosahedral clusters' },
  7: { kind: 'molecular', name: 'α-Nitrogen', system: 'Orthorhombic', pearson: 'oP8', spaceGroup: 'P2₁2₁2₁', coordination: 'Molecular solid' },
  8: { kind: 'molecular', name: 'α-Oxygen', system: 'Monoclinic', pearson: 'mC16', spaceGroup: 'C2/m', coordination: 'Molecular solid' },
  9: { kind: 'molecular', name: 'Solid fluorine', system: 'Monoclinic', pearson: 'mP', spaceGroup: 'C2/c', coordination: 'Molecular solid' },
  15: { kind: 'orthorhombic', name: 'Black phosphorus', system: 'Orthorhombic', pearson: 'oS8', spaceGroup: 'Cmca', coordination: 'Puckered layers' },
  16: { kind: 'orthorhombic', name: 'α-Sulfur', system: 'Orthorhombic', pearson: 'oP128', spaceGroup: 'Fddd', coordination: 'S₈ molecular rings' },
  17: { kind: 'molecular', name: 'Solid chlorine', system: 'Orthorhombic', pearson: 'oS8', spaceGroup: 'Cmca', coordination: 'Molecular solid' },
  31: { kind: 'orthorhombic', name: 'α-Gallium', system: 'Orthorhombic', pearson: 'oC8', spaceGroup: 'Cmca', coordination: 'Low-coordination pairs' },
  33: { kind: 'rhombohedral', name: 'Grey arsenic', system: 'Rhombohedral', pearson: 'hR2', spaceGroup: 'R-3m', coordination: '3' },
  34: { kind: 'rhombohedral', name: 'Trigonal selenium', system: 'Trigonal', pearson: 'hP3', spaceGroup: 'P3₁21', coordination: 'Helical chains' },
  35: { kind: 'molecular', name: 'Solid bromine', system: 'Orthorhombic', pearson: 'oS8', spaceGroup: 'Cmca', coordination: 'Molecular solid' },
  49: { kind: 'tetragonal', name: 'Indium', system: 'Tetragonal', pearson: 'tI2', spaceGroup: 'I4/mmm', coordination: '4 + 8' },
  50: { kind: 'tetragonal', name: 'β-Tin', system: 'Tetragonal', pearson: 'tI4', spaceGroup: 'I4₁/amd', coordination: '4' },
  51: { kind: 'rhombohedral', name: 'Antimony', system: 'Rhombohedral', pearson: 'hR2', spaceGroup: 'R-3m', coordination: '3 + 3' },
  52: { kind: 'rhombohedral', name: 'Tellurium', system: 'Trigonal', pearson: 'hP3', spaceGroup: 'P3₁21', coordination: 'Helical chains' },
  53: { kind: 'molecular', name: 'Solid iodine', system: 'Orthorhombic', pearson: 'oS8', spaceGroup: 'Cmca', coordination: 'Molecular solid' },
  80: { kind: 'rhombohedral', name: 'Solid mercury', system: 'Rhombohedral', pearson: 'hR1', spaceGroup: 'R-3m', coordination: '6' },
  83: { kind: 'rhombohedral', name: 'Bismuth', system: 'Rhombohedral', pearson: 'hR2', spaceGroup: 'R-3m', coordination: '3 + 3' },
  84: { kind: 'simple-cubic', name: 'α-Polonium', system: 'Cubic', pearson: 'cP1', spaceGroup: 'Pm-3m', coordination: '6' },
}

function baseCrystalSpec(el: ElementData): CrystalSpec {
  const special = COMPLEX[el.number]
  if (special) return { ...special, detail: 'Representative solid-phase structure; schematic unit cell.' }
  if (DIAMOND.has(el.number)) return { kind: 'diamond', name: 'Diamond cubic', system: 'Cubic', pearson: 'cF8', spaceGroup: 'Fd-3m', coordination: '4', detail: 'Tetrahedral covalent network; schematic conventional cell.' }
  if (FCC.has(el.number)) return { kind: 'fcc', name: 'Face-centred cubic', system: 'Cubic', pearson: 'cF4', spaceGroup: 'Fm-3m', coordination: '12', detail: 'Close-packed metallic lattice; schematic conventional cell.' }
  if (BCC.has(el.number)) return { kind: 'bcc', name: 'Body-centred cubic', system: 'Cubic', pearson: 'cI2', spaceGroup: 'Im-3m', coordination: '8', detail: 'Schematic conventional cell; atomic radii are illustrative.' }
  if (HCP.has(el.number)) return { kind: 'hcp', name: 'Hexagonal close-packed', system: 'Hexagonal', pearson: 'hP2', spaceGroup: 'P6₃/mmc', coordination: '12', detail: 'Close-packed hexagonal lattice; schematic conventional cell.' }

  if (el.category === 'noble' || el.category === 'halogen') return {
    kind: 'molecular', name: 'Condensed molecular solid', system: 'Molecular crystal', pearson: '—', spaceGroup: '—', coordination: 'Molecular neighbours',
    detail: 'Illustrative low-temperature solid; molecules are schematic.',
  }
  if (el.category === 'nonmetal') return {
    kind: 'orthorhombic', name: 'Molecular / covalent solid', system: 'Orthorhombic', pearson: '—', spaceGroup: '—', coordination: 'Structure varies by allotrope',
    detail: 'Schematic solid-phase cell; allotropes may have different structures.',
  }
  const kind: CrystalKind = el.category === 'lanthanide' || el.category === 'actinide' || el.category === 'transition' ? 'hcp' : 'bcc'
  const defaults: Record<CrystalKind, Omit<CrystalSpec, 'detail'>> = {
    bcc: { kind, name: 'Body-centred cubic (representative)', system: 'Cubic', pearson: 'cI2*', spaceGroup: 'Im-3m*', coordination: '8 (prototype)' },
    fcc: { kind, name: 'Face-centred cubic (representative)', system: 'Cubic', pearson: 'cF4*', spaceGroup: 'Fm-3m*', coordination: '12 (prototype)' },
    hcp: { kind, name: 'Hexagonal close-packed (representative)', system: 'Hexagonal', pearson: 'hP2*', spaceGroup: 'P6₃/mmc*', coordination: '12 (prototype)' },
    diamond: { kind, name: 'Diamond cubic', system: 'Cubic', pearson: 'cF8', spaceGroup: 'Fd-3m', coordination: '4' },
    'simple-cubic': { kind, name: 'Simple cubic', system: 'Cubic', pearson: 'cP1', spaceGroup: 'Pm-3m', coordination: '6' },
    tetragonal: { kind, name: 'Tetragonal prototype', system: 'Tetragonal', pearson: 'tP*', spaceGroup: '—', coordination: 'Schematic' },
    orthorhombic: { kind, name: 'Orthorhombic prototype', system: 'Orthorhombic', pearson: 'oP*', spaceGroup: '—', coordination: 'Schematic' },
    rhombohedral: { kind, name: 'Rhombohedral prototype', system: 'Rhombohedral', pearson: 'hR*', spaceGroup: '—', coordination: 'Schematic' },
    molecular: { kind, name: 'Molecular solid', system: 'Molecular crystal', pearson: '—', spaceGroup: '—', coordination: 'Schematic' },
  }
  return { ...defaults[kind], detail: 'Representative prototype for visualization only; the actual allotrope or high-pressure phase may differ.' }
}

function getCrystalSpec(el: ElementData): CrystalSpec {
  const base = baseCrystalSpec(el)
  if (el.number > 92) return {
    ...base,
    name: `Predicted ${base.name}`,
    pearson: base.pearson.endsWith('*') ? base.pearson : `${base.pearson}*`,
    spaceGroup: base.spaceGroup.endsWith('*') || base.spaceGroup === '—' ? base.spaceGroup : `${base.spaceGroup}*`,
    detail: 'Predicted or schematic solid-phase prototype; a stable bulk crystal structure is not established for this element.',
  }
  return base
}

type Point = [number, number, number]

function unitCellPoints(kind: CrystalKind, supercell = 1): Point[] {
  if (kind === 'hcp') {
    const points: Point[] = []
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      points.push([Math.cos(a) * 0.5, -0.42, Math.sin(a) * 0.5], [Math.cos(a) * 0.5, 0.42, Math.sin(a) * 0.5])
    }
    points.push([0, -0.42, 0], [0, 0.42, 0], [0.25, 0, 0.14], [-0.25, 0, -0.14])
    return points
  }

  const basePoints: Point[] = []
  for (const x of [-0.5, 0.5]) {
    for (const y of [-0.5, 0.5]) {
      for (const z of [-0.5, 0.5]) {
        basePoints.push([x, y, z])
      }
    }
  }

  if (kind === 'bcc') basePoints.push([0, 0, 0])
  if (kind === 'fcc' || kind === 'diamond') {
    basePoints.push([0, 0.5, 0], [0, -0.5, 0], [0.5, 0, 0], [-0.5, 0, 0], [0, 0, 0.5], [0, 0, -0.5])
  }
  if (kind === 'diamond') {
    basePoints.push([0.25, 0.25, 0.25], [-0.25, -0.25, 0.25], [-0.25, 0.25, -0.25], [0.25, -0.25, -0.25])
  }
  if (kind === 'molecular') {
    basePoints.push([-0.18, -0.08, 0], [0.18, 0.08, 0], [0, 0.23, 0.2], [0, -0.23, -0.2])
  }
  if (kind === 'orthorhombic' || kind === 'tetragonal' || kind === 'rhombohedral') {
    basePoints.push([0, 0, 0])
  }

  if (supercell === 1) return basePoints

  const points: Point[] = []
  const offset = 0.5 * (supercell - 1)
  const scale = 1 / supercell

  for (let sx = 0; sx < supercell; sx++) {
    for (let sy = 0; sy < supercell; sy++) {
      for (let sz = 0; sz < supercell; sz++) {
        const ox = (sx - offset)
        const oy = (sy - offset)
        const oz = (sz - offset)
        for (const bp of basePoints) {
          points.push([(bp[0] + ox) * scale, (bp[1] + oy) * scale, (bp[2] + oz) * scale])
        }
      }
    }
  }

  const uniqueMap = new Map<string, Point>()
  for (const pt of points) {
    const k = `${pt[0].toFixed(3)}:${pt[1].toFixed(3)}:${pt[2].toFixed(3)}`
    if (!uniqueMap.has(k)) uniqueMap.set(k, pt)
  }
  return Array.from(uniqueMap.values())
}

function project(
  point: Point,
  yaw: number,
  pitch: number,
  width: number,
  height: number,
  zoom: number,
): [number, number, number] {
  const [x, y, z] = point
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const rx = x * cy - z * sy
  const rz = x * sy + z * cy
  const ry = y * cp - rz * sp
  const depth = y * sp + rz * cp
  const perspective = 3.2 / (3.2 + depth)
  return [
    width / 2 + rx * width * 0.37 * perspective * zoom,
    height / 2 - ry * height * 0.63 * perspective * zoom,
    depth,
  ]
}

function computePlanePolygon(h: number, k: number, l: number, cVal = 0): Point[] {
  const len = Math.hypot(h, k, l) || 1
  const nx = h / len
  const ny = k / len
  const nz = l / len

  const edges: [Point, Point][] = [
    [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5]],
    [[0.5, -0.5, -0.5], [0.5, 0.5, -0.5]],
    [[0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]],
    [[-0.5, 0.5, -0.5], [-0.5, -0.5, -0.5]],
    [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5]],
    [[0.5, -0.5, 0.5], [0.5, 0.5, 0.5]],
    [[0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]],
    [[-0.5, 0.5, 0.5], [-0.5, -0.5, 0.5]],
    [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5]],
    [[0.5, -0.5, -0.5], [0.5, -0.5, 0.5]],
    [[0.5, 0.5, -0.5], [0.5, 0.5, 0.5]],
    [[-0.5, 0.5, -0.5], [-0.5, 0.5, 0.5]],
  ]

  const intersections: Point[] = []

  for (const [p1, p2] of edges) {
    const d1 = p1[0] * nx + p1[1] * ny + p1[2] * nz - cVal
    const d2 = p2[0] * nx + p2[1] * ny + p2[2] * nz - cVal

    if (Math.abs(d1 - d2) > 1e-6 && ((d1 <= 0 && d2 >= 0) || (d1 >= 0 && d2 <= 0))) {
      const t = d1 / (d1 - d2)
      intersections.push([
        p1[0] + t * (p2[0] - p1[0]),
        p1[1] + t * (p2[1] - p1[1]),
        p1[2] + t * (p2[2] - p1[2]),
      ])
    }
  }

  if (intersections.length < 3) return []

  let cx = 0, cy = 0, cz = 0
  for (const pt of intersections) {
    cx += pt[0]; cy += pt[1]; cz += pt[2]
  }
  cx /= intersections.length; cy /= intersections.length; cz /= intersections.length

  const norm = [nx, ny, nz]
  let ux = 1, uy = 0, uz = 0
  if (Math.abs(nx) > 0.9) { ux = 0; uy = 1; uz = 0 }
  const dot = ux * norm[0] + uy * norm[1] + uz * norm[2]
  ux -= dot * norm[0]; uy -= dot * norm[1]; uz -= dot * norm[2]
  const uLen = Math.hypot(ux, uy, uz) || 1
  ux /= uLen; uy /= uLen; uz /= uLen

  const vx = norm[1] * uz - norm[2] * uy
  const vy = norm[2] * ux - norm[0] * uz
  const vz = norm[0] * uy - norm[1] * ux

  return intersections.sort((pA, pB) => {
    const rAx = pA[0] - cx, rAy = pA[1] - cy, rAz = pA[2] - cz
    const rBx = pB[0] - cx, rBy = pB[1] - cy, rBz = pB[2] - cz

    const uA = rAx * ux + rAy * uy + rAz * uz
    const vA = rAx * vx + rAy * vy + rAz * vz
    const uB = rBx * ux + rBy * uy + rBz * uz
    const vB = rBx * vx + rBy * vy + rBz * vz

    return Math.atan2(vA, uA) - Math.atan2(vB, uB)
  })
}

export class ElementaCrystalViewElement extends HTMLElement {
  private element: ElementData | null = null
  private paused = false
  private speed = 1
  private tab: TabMode = 'cell'
  private supercell = 1
  private selectedPlane: MillerPlane | null = null
  private hoverPeak: XrdPeak | null = null
  private xrdWavelength = CU_K_ALPHA

  private rotation = { yaw: 0.72, pitch: 0.52, zoom: 1, dragging: false, x: 0, y: 0 }
  private raf = 0
  private canvas: HTMLCanvasElement | null = null

  static get observedAttributes(): string[] {
    return ['data-z', 'data-speed', 'data-paused']
  }

  connectedCallback(): void {
    this.readAttrs()
    this.render()
  }

  disconnectedCallback(): void {
    this.stopAnimation()
    this.replaceChildren()
  }

  attributeChangedCallback(): void {
    this.readAttrs()
    this.render()
  }

  private readAttrs(): void {
    const z = Number(this.getAttribute('data-z') ?? 1)
    this.element = getElement(z) ?? null
    this.speed = Number(this.getAttribute('data-speed') ?? 1)
    this.paused = this.getAttribute('data-paused') === 'true'
  }

  private stopAnimation(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    }
  }

  private render(): void {
    this.stopAnimation()
    this.replaceChildren()
    if (!this.element) return

    const spec = getCrystalSpec(this.element)
    const details = getCrystallographyDetails(this.element, spec.kind)
    if (!this.selectedPlane) {
      this.selectedPlane = details.prominentPlanes[0] ?? {
        h: 1, k: 0, l: 0, name: '(100)', dSpacingAngstrom: 2.5, twoThetaDeg: 35.8, relativeIntensity: 100,
      }
    }

    const container = document.createElement('div')
    container.className = 'absolute inset-0 flex flex-col bg-[#060a12] text-zinc-200'

    // Top Header & Sub-Tab Bar
    const header = document.createElement('div')
    header.className = 'flex shrink-0 items-center justify-between border-b border-white/10 bg-[#090e18] px-3 py-1.5'

    const titleGroup = document.createElement('div')
    titleGroup.className = 'flex items-center gap-2'
    titleGroup.innerHTML = `
      <span class="font-mono text-[10px] font-bold text-zinc-100 uppercase">${spec.name}</span>
      <span class="rounded bg-sky-500/10 px-1.5 py-0.2 font-mono text-[9px] text-sky-400">${details.system}</span>
    `
    header.appendChild(titleGroup)

    const tabGroup = document.createElement('div')
    tabGroup.className = 'flex rounded border border-white/10 bg-black/40 p-0.5'
    const tabs: [TabMode, string][] = [
      ['cell', '3D Lattice'],
      ['miller', 'Planes (hkl)'],
      ['xrd', 'Powder XRD'],
    ]
    tabs.forEach(([mode, label]) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = label
      btn.className = `rounded px-2 py-0.5 font-mono text-[9.5px] transition cursor-pointer ${
        this.tab === mode ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'
      }`
      btn.addEventListener('click', () => {
        this.tab = mode
        this.render()
      })
      tabGroup.appendChild(btn)
    })
    header.appendChild(tabGroup)
    container.appendChild(header)

    // Visualizer Area
    const main = document.createElement('div')
    main.className = 'relative min-h-0 flex-1 overflow-hidden'

    if (this.tab === 'xrd') {
      this.renderXrdView(main, details)
    } else {
      this.render3DView(main, spec, details)
    }
    container.appendChild(main)

    // Footer Metrics
    const footer = document.createElement('div')
    footer.className = 'grid shrink-0 grid-cols-4 gap-2 border-t border-white/10 bg-[#090e18] px-3 py-2 text-[9px] font-mono'
    footer.innerHTML = `
      <div><span class="block uppercase tracking-wider text-zinc-500">Lattice (a)</span><span class="text-zinc-200 font-bold">${details.latticeA} Å</span></div>
      <div><span class="block uppercase tracking-wider text-zinc-500">Packing (APF)</span><span class="text-amber-300 font-bold">${details.apfPercent}</span></div>
      <div><span class="block uppercase tracking-wider text-zinc-500">Coordination</span><span class="text-sky-300 font-bold">${details.coordination}</span></div>
      <div><span class="block uppercase tracking-wider text-zinc-500">Space Group</span><span class="text-zinc-300">${details.spaceGroup}</span></div>
    `
    container.appendChild(footer)

    this.appendChild(container)
  }

  private renderXrdView(container: HTMLElement, details: ReturnType<typeof getCrystallographyDetails>): void {
    const wrap = document.createElement('div')
    wrap.className = 'h-full w-full p-3 flex flex-col justify-between'

    const topBar = document.createElement('div')
    topBar.className = 'flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1'
    topBar.innerHTML = `
      <span>Simulated PXRD Spectrum (λ = ${this.xrdWavelength === CU_K_ALPHA ? 'Cu Kα 1.5406 Å' : 'Mo Kα 0.7107 Å'})</span>
      <div class="flex items-center gap-1">
        <button type="button" id="cu-ka-btn" class="px-1.5 py-0.5 rounded border text-[8.5px] cursor-pointer ${
          this.xrdWavelength === CU_K_ALPHA ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 text-zinc-500'
        }">Cu Kα</button>
        <button type="button" id="mo-ka-btn" class="px-1.5 py-0.5 rounded border text-[8.5px] cursor-pointer ${
          this.xrdWavelength === MO_K_ALPHA ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 text-zinc-500'
        }">Mo Kα</button>
      </div>
    `
    wrap.appendChild(topBar)

    topBar.querySelector('#cu-ka-btn')?.addEventListener('click', () => {
      this.xrdWavelength = CU_K_ALPHA
      this.render()
    })
    topBar.querySelector('#mo-ka-btn')?.addEventListener('click', () => {
      this.xrdWavelength = MO_K_ALPHA
      this.render()
    })

    const svgWrap = document.createElement('div')
    svgWrap.className = 'relative flex-1 rounded-lg border border-white/10 bg-[#070b13] p-2'

    let peakElements = ''
    details.xrdPeaks.forEach((peak) => {
      const x = 36 + ((peak.twoThetaDeg - 15) / (90 - 15)) * (445 - 36)
      const peakH = (peak.relativeIntensity / 100) * 115
      const y = 145 - peakH
      peakElements += `
        <g class="cursor-pointer peak-item" data-h="${peak.h}" data-k="${peak.k}" data-l="${peak.l}" data-tt="${peak.twoThetaDeg}" data-d="${peak.dSpacingAngstrom}" data-ri="${peak.relativeIntensity}">
          <path d="M ${x - 5} 145 Q ${x} ${y} ${x + 5} 145" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="1.5" />
          <line x1="${x}" y1="145" x2="${x}" y2="${y}" stroke="#38bdf8" stroke-width="1.5" />
          <text x="${x}" y="${Math.max(16, y - 4)}" text-anchor="middle" class="font-mono text-[6.5px] font-bold fill-zinc-400">(${peak.h}${peak.k}${peak.l})</text>
        </g>
      `
    })

    svgWrap.innerHTML = `
      <svg viewBox="0 0 460 170" class="w-full h-full select-none">
        <line x1="36" y1="145" x2="445" y2="145" stroke="#ffffff1a" stroke-width="1" />
        <line x1="36" y1="20" x2="36" y2="145" stroke="#ffffff1a" stroke-width="1" />
        <text x="14" y="22" class="font-mono text-[7px] fill-zinc-500" text-anchor="start">Intensity (%)</text>
        <text x="32" y="24" class="font-mono text-[7px] fill-zinc-500" text-anchor="end">100%</text>
        <text x="32" y="85" class="font-mono text-[7px] fill-zinc-500" text-anchor="end">50%</text>
        <text x="32" y="145" class="font-mono text-[7px] fill-zinc-500" text-anchor="end">0%</text>
        ${[20, 40, 60, 80]
          .map((deg) => {
            const x = 36 + ((deg - 15) / (90 - 15)) * (445 - 36)
            return `
            <g>
              <line x1="${x}" y1="145" x2="${x}" y2="149" stroke="#ffffff33" stroke-width="1" />
              <text x="${x}" y="${x === 20 ? 159 : 159}" class="font-mono text-[7.5px] fill-zinc-500" text-anchor="middle">${deg}°</text>
            </g>
          `
          })
          .join('')}
        <text x="240" y="167" class="font-mono text-[7.5px] fill-zinc-400" text-anchor="middle">2θ (degrees)</text>
        ${peakElements}
      </svg>
      <div id="peak-tooltip" class="hidden absolute right-3 top-3 rounded border border-amber-400/40 bg-[#0c1220]/95 px-2.5 py-1.5 font-mono text-[9px] text-zinc-300 shadow-xl backdrop-blur"></div>
    `

    const tooltip = svgWrap.querySelector('#peak-tooltip') as HTMLDivElement
    svgWrap.querySelectorAll('.peak-item').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const h = el.getAttribute('data-h')
        const k = el.getAttribute('data-k')
        const l = el.getAttribute('data-l')
        const tt = el.getAttribute('data-tt')
        const d = el.getAttribute('data-d')
        const ri = el.getAttribute('data-ri')
        tooltip.innerHTML = `
          <div class="font-bold text-amber-300">Reflection (${h}${k}${l})</div>
          <div>2θ = ${tt}°</div>
          <div>d = ${d} Å</div>
          <div>Relative Intensity: ${ri}%</div>
        `
        tooltip.classList.remove('hidden')
      })
      el.addEventListener('mouseleave', () => {
        tooltip.classList.add('hidden')
      })
    })

    wrap.appendChild(svgWrap)
    container.appendChild(wrap)
  }

  private render3DView(container: HTMLElement, spec: CrystalSpec, details: ReturnType<typeof getCrystallographyDetails>): void {
    const canvas = document.createElement('canvas')
    canvas.className = 'h-full w-full touch-none select-none'
    canvas.setAttribute('aria-label', `${spec.name} crystal unit cell`)
    this.canvas = canvas
    container.appendChild(canvas)

    // Drag / rotate / zoom listeners
    canvas.addEventListener('pointerdown', (e) => {
      this.rotation.dragging = true
      this.rotation.x = e.clientX
      this.rotation.y = e.clientY
      canvas.setPointerCapture(e.pointerId)
    })
    canvas.addEventListener('pointermove', (e) => {
      if (!this.rotation.dragging) return
      this.rotation.yaw += (e.clientX - this.rotation.x) * 0.008
      this.rotation.pitch = Math.max(-1.25, Math.min(1.25, this.rotation.pitch + (e.clientY - this.rotation.y) * 0.008))
      this.rotation.x = e.clientX
      this.rotation.y = e.clientY
    })
    const stopDrag = () => { this.rotation.dragging = false }
    canvas.addEventListener('pointerup', stopDrag)
    canvas.addEventListener('pointercancel', stopDrag)
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      this.rotation.zoom = Math.max(0.5, Math.min(2.2, this.rotation.zoom - e.deltaY * 0.001))
    }, { passive: false })

    // Miller controls overlay
    if (this.tab === 'miller') {
      const millerBox = document.createElement('div')
      millerBox.className = 'absolute right-2 top-2 rounded border border-white/10 bg-black/60 p-1.5 backdrop-blur-sm space-y-1'
      millerBox.innerHTML = `
        <div class="text-[8.5px] uppercase tracking-wider text-zinc-500 font-mono">Select Plane:</div>
        <div class="grid grid-cols-2 gap-1 font-mono text-[9px]" id="planes-grid"></div>
        <div class="border-t border-white/10 pt-1 text-[8.5px] font-mono text-zinc-400">
          <div>d_${this.selectedPlane?.name} = ${this.selectedPlane?.dSpacingAngstrom} Å</div>
          <div>2θ = ${this.selectedPlane?.twoThetaDeg}°</div>
        </div>
      `
      const grid = millerBox.querySelector('#planes-grid')!
      details.prominentPlanes.forEach((plane) => {
        const active = this.selectedPlane?.h === plane.h && this.selectedPlane?.k === plane.k && this.selectedPlane?.l === plane.l
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.textContent = plane.name
        btn.className = `rounded px-1.5 py-0.5 border text-center transition cursor-pointer ${
          active ? 'border-sky-400 bg-sky-400/20 text-sky-300 font-bold' : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
        }`
        btn.addEventListener('click', () => {
          this.selectedPlane = plane
          this.render()
        })
        grid.appendChild(btn)
      })
      container.appendChild(millerBox)
    }

    // Supercell controls overlay
    if (this.tab === 'cell') {
      const superBox = document.createElement('div')
      superBox.className = 'absolute right-2 top-2 flex items-center gap-1 rounded border border-white/10 bg-black/60 px-1.5 py-1 backdrop-blur-sm'
      superBox.innerHTML = `<span class="font-mono text-[8.5px] text-zinc-400">Stack:</span>`
      ;[1, 2].forEach((s) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.textContent = `${s}×${s}`
        btn.className = `rounded px-1.5 py-0.2 font-mono text-[8.5px] transition cursor-pointer ${
          this.supercell === s ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40' : 'text-zinc-500 hover:text-zinc-300'
        }`
        btn.addEventListener('click', () => {
          this.supercell = s
          this.render()
        })
        superBox.appendChild(btn)
      })
      container.appendChild(superBox)
    }

    const tip = document.createElement('div')
    tip.className = 'absolute bottom-2 left-2 rounded bg-black/45 px-1.5 py-1 text-[8.5px] text-zinc-500'
    tip.textContent = 'Drag to rotate · Wheel to zoom'
    container.appendChild(tip)

    // Start 3D canvas render loop
    const context = canvas.getContext('2d')
    if (!context) return

    let previous = performance.now()
    const points = unitCellPoints(spec.kind, this.supercell)

    const draw = (now: number) => {
      const bounds = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, bounds.width)
      const height = Math.max(1, bounds.height)

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)

      if (!this.paused && !this.rotation.dragging) {
        this.rotation.yaw += Math.min(0.05, (now - previous) / 1000) * 0.18 * this.speed
      }
      previous = now

      const projected = points.map((point) =>
        project(point, this.rotation.yaw, this.rotation.pitch, width, height, this.rotation.zoom),
      )

      // Unit cell wireframe edges
      const edgeSet = new Set<string>()
      const edges: [number, number][] = []
      const tolerance = 1.05 / this.supercell

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i][0] - points[j][0]
          const dy = points[i][1] - points[j][1]
          const dz = points[i][2] - points[j][2]
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
          const key = `${i}:${j}`
          if (distance > 0.01 && distance <= tolerance && !edgeSet.has(key)) {
            edgeSet.add(key)
            edges.push([i, j])
          }
        }
      }

      if (spec.kind === 'hcp' && this.supercell === 1) {
        for (let layer = 0; layer < 2; layer++) {
          for (let i = 0; i < 6; i++) edges.push([layer * 6 + i, layer * 6 + ((i + 1) % 6)])
        }
        for (let i = 0; i < 6; i++) edges.push([i, i + 6])
      }

      // Draw Edges
      context.lineWidth = 1.1
      context.strokeStyle = 'rgba(148,163,184,0.38)'
      for (const [a, b] of edges) {
        if (!projected[a] || !projected[b]) continue
        context.beginPath()
        context.moveTo(projected[a][0], projected[a][1])
        context.lineTo(projected[b][0], projected[b][1])
        context.stroke()
      }

      // If in Miller plane mode: draw cutting plane
      if (this.tab === 'miller' && this.selectedPlane) {
        const polyPoints = computePlanePolygon(this.selectedPlane.h, this.selectedPlane.k, this.selectedPlane.l, 0)
        if (polyPoints.length >= 3) {
          const projectedPoly = polyPoints.map((pt) =>
            project(pt, this.rotation.yaw, this.rotation.pitch, width, height, this.rotation.zoom),
          )

          context.beginPath()
          context.moveTo(projectedPoly[0][0], projectedPoly[0][1])
          for (let i = 1; i < projectedPoly.length; i++) {
            context.lineTo(projectedPoly[i][0], projectedPoly[i][1])
          }
          context.closePath()
          context.fillStyle = 'rgba(56, 189, 248, 0.28)'
          context.fill()
          context.strokeStyle = 'rgba(56, 189, 248, 0.85)'
          context.lineWidth = 1.5
          context.stroke()
        }
      }

      // Sort and draw Atoms
      const atoms = points
        .map((point, index) => ({ p: projected[index], point, index }))
        .sort((a, b) => a.p[2] - b.p[2])

      for (const atom of atoms) {
        const radius = (this.supercell === 1 ? 6.8 : 4.5) * Math.max(0.62, 1 - atom.p[2] * 0.2) * dpr
        context.beginPath()
        context.arc(atom.p[0], atom.p[1], radius / dpr, 0, Math.PI * 2)
        context.fillStyle =
          this.element?.category === 'noble'
            ? '#94a3b8'
            : this.element?.category === 'alkali'
              ? '#fbbf24'
              : '#38bdf8'
        context.globalAlpha = atom.p[2] > 0.42 ? 0.6 : 0.95
        context.fill()
        context.globalAlpha = 1
        context.strokeStyle = 'rgba(255,255,255,0.75)'
        context.lineWidth = 1
        context.stroke()
      }

      this.raf = requestAnimationFrame(draw)
    }

    this.raf = requestAnimationFrame(draw)
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-crystal-view')) {
  customElements.define('elementa-crystal-view', ElementaCrystalViewElement)
}
