/**
 * VSEPR (Valence Shell Electron Pair Repulsion) Chemical Geometry Engine
 *
 * Computes:
 * - Steric number SN = (Bonding Pairs BP) + (Lone Pairs LP)
 * - Electron-pair geometry vs. Molecular shape
 * - Orbital hybridization (sp, sp², sp³, sp³d, sp³d²)
 * - Exact 3D coordinates for central atom, ligands, and lone pair lobes
 * - Pauling electronegativity differences and net dipole moment vector (μ)
 * - Ideal and compressed bond angles based on lone-pair repulsion
 */

import { getElement } from './index'

export interface Vector3D {
  x: number
  y: number
  z: number
}

export type MolecularGeometryKey =
  | 'linear'
  | 'trigonal-planar'
  | 'bent-3'
  | 'tetrahedral'
  | 'trigonal-pyramidal'
  | 'bent-4'
  | 'trigonal-bipyramidal'
  | 'seesaw'
  | 't-shaped'
  | 'linear-5'
  | 'octahedral'
  | 'square-pyramidal'
  | 'square-planar'
  | 'pentagonal-bipyramidal'

export interface VseprPreset {
  id: string
  formula: string
  name: string
  centralZ: number
  ligandZ: number
  secondaryLigandZ?: number
  secondaryCount?: number
  bondingPairs: number
  lonePairs: number
  hybridization: string
  electronGeometry: string
  molecularShape: string
  idealAngleDeg: number
  experimentalAngleDeg: number
  dipoleDebye: number
  description: string
}

export interface Molecule3DGeometry {
  centralAtom: { z: number; symbol: string; name: string; position: Vector3D }
  ligands: Array<{ z: number; symbol: string; name: string; position: Vector3D }>
  lonePairs: Array<{ position: Vector3D }>
  stericNumber: number
  electronGeometry: string
  molecularShape: string
  hybridization: string
  idealAngle: number
  actualAngle: number
  netDipole: Vector3D
  dipoleMagnitudeDebye: number
  isPolar: boolean
}

// CPK Element Colors for 3D visualizer
export const CPK_COLORS: Record<number, string> = {
  1: '#f4efe4', // H - white/cream
  2: '#d9f99d', // He - light green
  3: '#a855f7', // Li - violet
  4: '#15803d', // Be - dark green
  5: '#f97316', // B - orange
  6: '#52525b', // C - dark grey / charcoal
  7: '#38bdf8', // N - sky blue
  8: '#ef4444', // O - red
  9: '#22c55e', // F - vibrant green
  10: '#06b6d4', // Ne - cyan
  15: '#ea580c', // P - deep orange
  16: '#eab308', // S - yellow
  17: '#4ade80', // Cl - light green
  35: '#b91c1c', // Br - dark red / brown
  53: '#7e22ce', // I - violet / purple
  54: '#0ea5e9', // Xe - bright blue
}

export function getCpkColor(z: number): string {
  return CPK_COLORS[z] ?? '#94a3b8'
}

// Covalent Radii (in Ångströms) for molecular sizing
export const COVALENT_RADII_ANGSTROM: Record<number, number> = {
  1: 0.31,
  2: 0.28,
  3: 1.28,
  4: 0.96,
  5: 0.84,
  6: 0.76,
  7: 0.71,
  8: 0.66,
  9: 0.57,
  10: 0.58,
  15: 1.07,
  16: 1.05,
  17: 1.02,
  35: 1.2,
  53: 1.39,
  54: 1.4,
}

export function getCovalentRadius(z: number): number {
  return COVALENT_RADII_ANGSTROM[z] ?? 0.9
}

export const VSEPR_PRESETS: VseprPreset[] = [
  {
    id: 'h2o',
    formula: 'H₂O',
    name: 'Water',
    centralZ: 8,
    ligandZ: 1,
    bondingPairs: 2,
    lonePairs: 2,
    hybridization: 'sp³',
    electronGeometry: 'Tetrahedral',
    molecularShape: 'Bent',
    idealAngleDeg: 109.5,
    experimentalAngleDeg: 104.5,
    dipoleDebye: 1.85,
    description:
      'Two bulky lone pairs exert strong mutual repulsion, compressing the H-O-H bond angle from the ideal 109.5° down to 104.5°. The resulting asymmetric charge distribution makes water intensely polar.',
  },
  {
    id: 'co2',
    formula: 'CO₂',
    name: 'Carbon Dioxide',
    centralZ: 6,
    ligandZ: 8,
    bondingPairs: 2,
    lonePairs: 0,
    hybridization: 'sp',
    electronGeometry: 'Linear',
    molecularShape: 'Linear',
    idealAngleDeg: 180,
    experimentalAngleDeg: 180,
    dipoleDebye: 0.0,
    description:
      'Two double bonds orient 180° apart with zero lone pairs on carbon. Equal and opposite C=O bond dipoles cancel out completely, producing a nonpolar molecule with zero net dipole moment.',
  },
  {
    id: 'nh3',
    formula: 'NH₃',
    name: 'Ammonia',
    centralZ: 7,
    ligandZ: 1,
    bondingPairs: 3,
    lonePairs: 1,
    hybridization: 'sp³',
    electronGeometry: 'Tetrahedral',
    molecularShape: 'Trigonal Pyramidal',
    idealAngleDeg: 109.5,
    experimentalAngleDeg: 107.3,
    dipoleDebye: 1.47,
    description:
      'The lone pair at the apex pushes the three N-H bonds downward into an umbrella pyramid, closing the bond angle to 107.3°. Highly polar with a permanent vertical dipole.',
  },
  {
    id: 'ch4',
    formula: 'CH₄',
    name: 'Methane',
    centralZ: 6,
    ligandZ: 1,
    bondingPairs: 4,
    lonePairs: 0,
    hybridization: 'sp³',
    electronGeometry: 'Tetrahedral',
    molecularShape: 'Tetrahedral',
    idealAngleDeg: 109.5,
    experimentalAngleDeg: 109.5,
    dipoleDebye: 0.0,
    description:
      'Perfect tetrahedral symmetry with equal bond angles of arccos(-1/3) ≈ 109.47°. The four identical C-H dipoles symmetrically cancel, leaving methane completely nonpolar.',
  },
  {
    id: 'bf3',
    formula: 'BF₃',
    name: 'Boron Trifluoride',
    centralZ: 5,
    ligandZ: 9,
    bondingPairs: 3,
    lonePairs: 0,
    hybridization: 'sp²',
    electronGeometry: 'Trigonal Planar',
    molecularShape: 'Trigonal Planar',
    idealAngleDeg: 120,
    experimentalAngleDeg: 120,
    dipoleDebye: 0.0,
    description:
      'Electron-deficient boron has 3 bonding pairs and 0 lone pairs. Three fluorine atoms lie in a single plane separated by exactly 120°, cancelling all in-plane dipoles.',
  },
  {
    id: 'so2',
    formula: 'SO₂',
    name: 'Sulfur Dioxide',
    centralZ: 16,
    ligandZ: 8,
    bondingPairs: 2,
    lonePairs: 1,
    hybridization: 'sp²',
    electronGeometry: 'Trigonal Planar',
    molecularShape: 'Bent',
    idealAngleDeg: 120,
    experimentalAngleDeg: 119.5,
    dipoleDebye: 1.63,
    description:
      'One lone pair on sulfur compresses the O-S-O bond angle slightly below 120° (to 119.5°), giving SO₂ a permanent net dipole moment.',
  },
  {
    id: 'pcl5',
    formula: 'PCl₅',
    name: 'Phosphorus Pentachloride',
    centralZ: 15,
    ligandZ: 17,
    bondingPairs: 5,
    lonePairs: 0,
    hybridization: 'sp³d',
    electronGeometry: 'Trigonal Bipyramidal',
    molecularShape: 'Trigonal Bipyramidal',
    idealAngleDeg: 90,
    experimentalAngleDeg: 90,
    dipoleDebye: 0.0,
    description:
      'Hypervalent 10-electron valence shell. Consists of 3 equatorial chlorine atoms at 120° and 2 axial chlorines at 90°/180°. All dipoles cancel symmetrically.',
  },
  {
    id: 'sf4',
    formula: 'SF₄',
    name: 'Sulfur Tetrafluoride',
    centralZ: 16,
    ligandZ: 9,
    bondingPairs: 4,
    lonePairs: 1,
    hybridization: 'sp³d',
    electronGeometry: 'Trigonal Bipyramidal',
    molecularShape: 'See-Saw',
    idealAngleDeg: 90,
    experimentalAngleDeg: 87.0,
    dipoleDebye: 0.63,
    description:
      'The bulky lone pair adopts an equatorial position to minimize 90° repulsions (only two 90° interactions vs three in axial). Compresses axial bonds to 173° and equatorial to 101°.',
  },
  {
    id: 'clf3',
    formula: 'ClF₃',
    name: 'Chlorine Trifluoride',
    centralZ: 17,
    ligandZ: 9,
    bondingPairs: 3,
    lonePairs: 2,
    hybridization: 'sp³d',
    electronGeometry: 'Trigonal Bipyramidal',
    molecularShape: 'T-Shaped',
    idealAngleDeg: 90,
    experimentalAngleDeg: 87.5,
    dipoleDebye: 0.6,
    description:
      'Both lone pairs occupy equatorial positions 120° apart, leaving three fluorines in a distorted T-shape with F-Cl-F bond angles contracted to 87.5°.',
  },
  {
    id: 'xef2',
    formula: 'XeF₂',
    name: 'Xenon Difluoride',
    centralZ: 54,
    ligandZ: 9,
    bondingPairs: 2,
    lonePairs: 3,
    hybridization: 'sp³d',
    electronGeometry: 'Trigonal Bipyramidal',
    molecularShape: 'Linear',
    idealAngleDeg: 180,
    experimentalAngleDeg: 180,
    dipoleDebye: 0.0,
    description:
      'All three lone pairs sit in the equatorial plane separated by 120°. The two fluorine atoms sit axially opposite at 180°, creating a strictly linear nonpolar noble-gas compound.',
  },
  {
    id: 'sf6',
    formula: 'SF₆',
    name: 'Sulfur Hexafluoride',
    centralZ: 16,
    ligandZ: 9,
    bondingPairs: 6,
    lonePairs: 0,
    hybridization: 'sp³d²',
    electronGeometry: 'Octahedral',
    molecularShape: 'Octahedral',
    idealAngleDeg: 90,
    experimentalAngleDeg: 90,
    dipoleDebye: 0.0,
    description:
      'Hypervalent 12-electron shell with perfect Oh symmetry. All six S-F bonds are identical and orthogonal (90°/180°), creating one of the most chemically inert and nonpolar gases known.',
  },
  {
    id: 'brf5',
    formula: 'BrF₅',
    name: 'Bromine Pentafluoride',
    centralZ: 35,
    ligandZ: 9,
    bondingPairs: 5,
    lonePairs: 1,
    hybridization: 'sp³d²',
    electronGeometry: 'Octahedral',
    molecularShape: 'Square Pyramidal',
    idealAngleDeg: 90,
    experimentalAngleDeg: 84.8,
    dipoleDebye: 1.51,
    description:
      'One lone pair occupies one octahedral apex, pushing the basal four fluorine atoms slightly above the equatorial plane (F_ax-Br-F_eq angle = 84.8°). Highly polar.',
  },
  {
    id: 'xef4',
    formula: 'XeF₄',
    name: 'Xenon Tetrafluoride',
    centralZ: 54,
    ligandZ: 9,
    bondingPairs: 4,
    lonePairs: 2,
    hybridization: 'sp³d²',
    electronGeometry: 'Octahedral',
    molecularShape: 'Square Planar',
    idealAngleDeg: 90,
    experimentalAngleDeg: 90,
    dipoleDebye: 0.0,
    description:
      'Two lone pairs occupy trans axial positions 180° apart to maximize separation. The four fluorines form a completely flat square plane with zero net dipole.',
  },
]

/**
 * Generate 3D spatial unit vectors for any combination of bonding pairs and lone pairs.
 */
export function computeVseprCoordinates(
  centralZ: number,
  ligandZ: number,
  bondingPairs: number,
  lonePairs: number,
  customAngle?: number,
): Molecule3DGeometry {
  const centralEl = getElement(centralZ)!
  const ligandEl = getElement(ligandZ)!

  const sn = bondingPairs + lonePairs
  let hybridization = 'sp³'
  let electronGeometry = 'Tetrahedral'
  let molecularShape = 'Tetrahedral'
  let idealAngle = 109.5
  let actualAngle = customAngle ?? 109.5

  const ligandVectors: Vector3D[] = []
  const lonePairVectors: Vector3D[] = []

  const bondDist = (getCovalentRadius(centralZ) + getCovalentRadius(ligandZ)) * 1.3
  const lpDist = getCovalentRadius(centralZ) * 1.1

  if (sn === 2) {
    hybridization = 'sp'
    electronGeometry = 'Linear'
    molecularShape = 'Linear'
    idealAngle = 180
    actualAngle = 180
    ligandVectors.push({ x: 0, y: 0, z: bondDist }, { x: 0, y: 0, z: -bondDist })
  } else if (sn === 3) {
    hybridization = 'sp²'
    electronGeometry = 'Trigonal Planar'
    idealAngle = 120

    if (lonePairs === 0) {
      molecularShape = 'Trigonal Planar'
      actualAngle = 120
      for (let i = 0; i < 3; i++) {
        const rad = (i * 2 * Math.PI) / 3 - Math.PI / 2
        ligandVectors.push({ x: Math.cos(rad) * bondDist, y: Math.sin(rad) * bondDist, z: 0 })
      }
    } else {
      molecularShape = 'Bent'
      actualAngle = customAngle ?? 119.0
      const halfRad = ((actualAngle / 2) * Math.PI) / 180
      lonePairVectors.push({ x: 0, y: lpDist, z: 0 })
      ligandVectors.push(
        { x: -Math.sin(halfRad) * bondDist, y: -Math.cos(halfRad) * bondDist, z: 0 },
        { x: Math.sin(halfRad) * bondDist, y: -Math.cos(halfRad) * bondDist, z: 0 },
      )
    }
  } else if (sn === 4) {
    hybridization = 'sp³'
    electronGeometry = 'Tetrahedral'
    idealAngle = 109.5

    if (lonePairs === 0) {
      molecularShape = 'Tetrahedral'
      actualAngle = 109.5
      const c = 1 / Math.sqrt(3)
      ligandVectors.push(
        { x: c * bondDist, y: c * bondDist, z: c * bondDist },
        { x: -c * bondDist, y: -c * bondDist, z: c * bondDist },
        { x: -c * bondDist, y: c * bondDist, z: -c * bondDist },
        { x: c * bondDist, y: -c * bondDist, z: -c * bondDist },
      )
    } else if (lonePairs === 1) {
      molecularShape = 'Trigonal Pyramidal'
      actualAngle = customAngle ?? 107.3
      const theta = ((actualAngle / 2) * Math.PI) / 180
      const h = Math.cos(theta)
      const r = Math.sin(theta)
      lonePairVectors.push({ x: 0, y: lpDist, z: 0 })
      for (let i = 0; i < 3; i++) {
        const phi = (i * 2 * Math.PI) / 3 - Math.PI / 2
        ligandVectors.push({
          x: Math.cos(phi) * r * bondDist,
          y: -h * bondDist,
          z: Math.sin(phi) * r * bondDist,
        })
      }
    } else {
      molecularShape = 'Bent'
      actualAngle = customAngle ?? 104.5
      const halfTheta = ((actualAngle / 2) * Math.PI) / 180
      ligandVectors.push(
        { x: -Math.sin(halfTheta) * bondDist, y: -Math.cos(halfTheta) * bondDist, z: 0 },
        { x: Math.sin(halfTheta) * bondDist, y: -Math.cos(halfTheta) * bondDist, z: 0 },
      )
      const lpAngle = ((109.5 / 2) * Math.PI) / 180
      lonePairVectors.push(
        { x: 0, y: Math.cos(lpAngle) * lpDist, z: -Math.sin(lpAngle) * lpDist },
        { x: 0, y: Math.cos(lpAngle) * lpDist, z: Math.sin(lpAngle) * lpDist },
      )
    }
  } else if (sn === 5) {
    hybridization = 'sp³d'
    electronGeometry = 'Trigonal Bipyramidal'
    idealAngle = 90

    if (lonePairs === 0) {
      molecularShape = 'Trigonal Bipyramidal'
      actualAngle = 90
      // 2 axial
      ligandVectors.push({ x: 0, y: bondDist, z: 0 }, { x: 0, y: -bondDist, z: 0 })
      // 3 equatorial
      for (let i = 0; i < 3; i++) {
        const rad = (i * 2 * Math.PI) / 3
        ligandVectors.push({ x: Math.cos(rad) * bondDist, y: 0, z: Math.sin(rad) * bondDist })
      }
    } else if (lonePairs === 1) {
      molecularShape = 'See-Saw'
      actualAngle = customAngle ?? 87.0
      // 1 equatorial lone pair
      lonePairVectors.push({ x: lpDist, y: 0, z: 0 })
      // 2 equatorial ligands (compressed)
      const eqRad = ((110 / 2) * Math.PI) / 180
      ligandVectors.push(
        { x: -Math.cos(eqRad) * bondDist, y: 0, z: Math.sin(eqRad) * bondDist },
        { x: -Math.cos(eqRad) * bondDist, y: 0, z: -Math.sin(eqRad) * bondDist },
      )
      // 2 axial ligands (bent backward)
      ligandVectors.push(
        { x: -0.15 * bondDist, y: 0.98 * bondDist, z: 0 },
        { x: -0.15 * bondDist, y: -0.98 * bondDist, z: 0 },
      )
    } else if (lonePairs === 2) {
      molecularShape = 'T-Shaped'
      actualAngle = customAngle ?? 87.5
      // 2 equatorial lone pairs
      lonePairVectors.push(
        { x: Math.cos((2 * Math.PI) / 3) * lpDist, y: 0, z: Math.sin((2 * Math.PI) / 3) * lpDist },
        { x: Math.cos((4 * Math.PI) / 3) * lpDist, y: 0, z: Math.sin((4 * Math.PI) / 3) * lpDist },
      )
      // 1 equatorial ligand + 2 axial ligands
      ligandVectors.push(
        { x: bondDist, y: 0, z: 0 },
        { x: -0.08 * bondDist, y: 0.99 * bondDist, z: 0 },
        { x: -0.08 * bondDist, y: -0.99 * bondDist, z: 0 },
      )
    } else {
      molecularShape = 'Linear'
      actualAngle = 180
      // 3 equatorial lone pairs
      for (let i = 0; i < 3; i++) {
        const rad = (i * 2 * Math.PI) / 3
        lonePairVectors.push({ x: Math.cos(rad) * lpDist, y: 0, z: Math.sin(rad) * lpDist })
      }
      // 2 axial ligands
      ligandVectors.push({ x: 0, y: bondDist, z: 0 }, { x: 0, y: -bondDist, z: 0 })
    }
  } else if (sn === 6) {
    hybridization = 'sp³d²'
    electronGeometry = 'Octahedral'
    idealAngle = 90

    if (lonePairs === 0) {
      molecularShape = 'Octahedral'
      actualAngle = 90
      ligandVectors.push(
        { x: bondDist, y: 0, z: 0 },
        { x: -bondDist, y: 0, z: 0 },
        { x: 0, y: bondDist, z: 0 },
        { x: 0, y: -bondDist, z: 0 },
        { x: 0, y: 0, z: bondDist },
        { x: 0, y: 0, z: -bondDist },
      )
    } else if (lonePairs === 1) {
      molecularShape = 'Square Pyramidal'
      actualAngle = customAngle ?? 84.8
      lonePairVectors.push({ x: 0, y: -lpDist, z: 0 })
      // 1 axial top
      ligandVectors.push({ x: 0, y: bondDist, z: 0 })
      // 4 equatorial pushed slightly upward
      const r = Math.sin((actualAngle * Math.PI) / 180)
      const h = Math.cos((actualAngle * Math.PI) / 180)
      ligandVectors.push(
        { x: r * bondDist, y: -h * bondDist, z: 0 },
        { x: -r * bondDist, y: -h * bondDist, z: 0 },
        { x: 0, y: -h * bondDist, z: r * bondDist },
        { x: 0, y: -h * bondDist, z: -r * bondDist },
      )
    } else {
      molecularShape = 'Square Planar'
      actualAngle = 90
      // 2 trans axial lone pairs
      lonePairVectors.push({ x: 0, y: lpDist, z: 0 }, { x: 0, y: -lpDist, z: 0 })
      // 4 equatorial ligands
      ligandVectors.push(
        { x: bondDist, y: 0, z: 0 },
        { x: -bondDist, y: 0, z: 0 },
        { x: 0, y: 0, z: bondDist },
        { x: 0, y: 0, z: -bondDist },
      )
    }
  }

  // Calculate Net Dipole Moment Vector
  const centralEn = centralEl.electronegativity ?? 2.5
  const ligandEn = ligandEl.electronegativity ?? 2.5
  const enDiff = ligandEn - centralEn

  let dipX = 0
  let dipY = 0
  let dipZ = 0

  for (const v of ligandVectors) {
    const len = Math.hypot(v.x, v.y, v.z) || 1
    dipX += (v.x / len) * enDiff
    dipY += (v.y / len) * enDiff
    dipZ += (v.z / len) * enDiff
  }

  const netDipMag = Math.hypot(dipX, dipY, dipZ)
  const isPolar = netDipMag > 0.08

  return {
    centralAtom: {
      z: centralZ,
      symbol: centralEl.symbol,
      name: centralEl.name,
      position: { x: 0, y: 0, z: 0 },
    },
    ligands: ligandVectors.map((v) => ({
      z: ligandZ,
      symbol: ligandEl.symbol,
      name: ligandEl.name,
      position: v,
    })),
    lonePairs: lonePairVectors.map((v) => ({ position: v })),
    stericNumber: sn,
    electronGeometry,
    molecularShape,
    hybridization,
    idealAngle,
    actualAngle,
    netDipole: { x: dipX, y: dipY, z: dipZ },
    dipoleMagnitudeDebye: Number((netDipMag * 1.2).toFixed(2)),
    isPolar,
  }
}
