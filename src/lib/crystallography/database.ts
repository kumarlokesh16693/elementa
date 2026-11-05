/**
 * Curated Crystal Structure Database
 * Accurately describes unit cell parameters, Wyckoff positions, basis atoms,
 * Bravais lattice classifications, and common Miller planes.
 */

import type { CrystalStructure } from './types'

export const CRYSTAL_STRUCTURES: CrystalStructure[] = [
  // --- 1. IRON (ALPHA-FE) - BCC ---
  {
    id: 'fe-bcc',
    name: 'Iron (α-Ferrite)',
    chemicalFormula: 'Fe',
    system: 'cubic',
    bravais: 'I',
    spaceGroup: 'Im-3m (229)',
    spaceGroupNumber: 229,
    lattice: { a: 2.866, b: 2.866, c: 2.866, alpha: 90, beta: 90, gamma: 90 },
    atomicPackingFactor: 0.68,
    density: 7.874,
    description: 'Prototypical Body-Centered Cubic (BCC) metallic lattice. Thermodynamically stable allotrope of iron below 912°C. Central constituent of structural steel.',
    historicalSignificance: 'Formulated the basis for modern ferrous metallurgy and magnetic domain theories.',
    applications: ['Structural carbon steel', 'Transformer magnetic cores', 'Automotive chassis', 'Permanent magnets'],
    basisAtoms: [
      { element: 'Fe', z: 26, fracPos: [0.0, 0.0, 0.0], color: '#94a3b8', radius: 0.35 },
      { element: 'Fe', z: 26, fracPos: [0.5, 0.5, 0.5], color: '#94a3b8', radius: 0.35 },
    ],
    commonMillerPlanes: [
      { h: 1, k: 1, l: 0 },
      { h: 2, k: 0, l: 0 },
      { h: 2, k: 1, l: 1 },
      { h: 1, k: 1, l: 1 },
    ],
  },

  // --- 2. COPPER - FCC ---
  {
    id: 'cu-fcc',
    name: 'Copper',
    chemicalFormula: 'Cu',
    system: 'cubic',
    bravais: 'F',
    spaceGroup: 'Fm-3m (225)',
    spaceGroupNumber: 225,
    lattice: { a: 3.615, b: 3.615, c: 3.615, alpha: 90, beta: 90, gamma: 90 },
    atomicPackingFactor: 0.74,
    density: 8.96,
    description: 'Face-Centered Cubic (FCC / cubic close-packed) metal with coordination number 12. Displays exceptional electrical and thermal conductivity due to free d-band electron delocalization.',
    applications: ['Electrical transmission wiring', 'Integrated circuit interconnects', 'Heat pipes & sinks', 'Antimicrobial surfaces'],
    basisAtoms: [
      { element: 'Cu', z: 29, fracPos: [0.0, 0.0, 0.0], color: '#f97316', radius: 0.36 },
      { element: 'Cu', z: 29, fracPos: [0.5, 0.5, 0.0], color: '#f97316', radius: 0.36 },
      { element: 'Cu', z: 29, fracPos: [0.5, 0.0, 0.5], color: '#f97316', radius: 0.36 },
      { element: 'Cu', z: 29, fracPos: [0.0, 0.5, 0.5], color: '#f97316', radius: 0.36 },
    ],
    commonMillerPlanes: [
      { h: 1, k: 1, l: 1 },
      { h: 2, k: 0, l: 0 },
      { h: 2, k: 2, l: 0 },
      { h: 3, k: 1, l: 1 },
    ],
  },

  // --- 3. POLONIUM - SIMPLE CUBIC ---
  {
    id: 'po-sc',
    name: 'Polonium (α-Po)',
    chemicalFormula: 'Po',
    system: 'cubic',
    bravais: 'P',
    spaceGroup: 'Pm-3m (221)',
    spaceGroupNumber: 221,
    lattice: { a: 3.359, b: 3.359, c: 3.359, alpha: 90, beta: 90, gamma: 90 },
    atomicPackingFactor: 0.524,
    density: 9.196,
    description: 'The only elemental solid at standard pressure that crystallizes into the simple cubic (primitive) lattice. Extremely low packing fraction (52.4%) leads to high structural porosity.',
    applications: ['Radioisotope thermoelectric generators (RTG)', 'Static eliminators in cleanrooms', 'Neutron initiation sources'],
    basisAtoms: [
      { element: 'Po', z: 84, fracPos: [0.0, 0.0, 0.0], color: '#a855f7', radius: 0.42 },
    ],
    commonMillerPlanes: [
      { h: 1, k: 0, l: 0 },
      { h: 1, k: 1, l: 0 },
      { h: 1, k: 1, l: 1 },
    ],
  },

  // --- 4. SILICON - DIAMOND CUBIC ---
  {
    id: 'si-diamond',
    name: 'Silicon (Diamond Cubic)',
    chemicalFormula: 'Si',
    system: 'cubic',
    bravais: 'F',
    spaceGroup: 'Fd-3m (227)',
    spaceGroupNumber: 227,
    lattice: { a: 5.431, b: 5.431, c: 5.431, alpha: 90, beta: 90, gamma: 90 },
    atomicPackingFactor: 0.34,
    density: 2.329,
    description: 'Two interpenetrating FCC lattices offset by (1/4, 1/4, 1/4). Each silicon atom is sp³ hybridized and tetrahedrally coordinated by 4 neighbors. Foundation of microelectronics.',
    applications: ['Microprocessor wafers (CMOS)', 'Photovoltaic solar panels', 'MEMS sensors', 'Power MOSFETs'],
    basisAtoms: [
      { element: 'Si', z: 14, fracPos: [0.0, 0.0, 0.0], color: '#38bdf8', radius: 0.35 },
      { element: 'Si', z: 14, fracPos: [0.5, 0.5, 0.0], color: '#38bdf8', radius: 0.35 },
      { element: 'Si', z: 14, fracPos: [0.5, 0.0, 0.5], color: '#38bdf8', radius: 0.35 },
      { element: 'Si', z: 14, fracPos: [0.0, 0.5, 0.5], color: '#38bdf8', radius: 0.35 },
      { element: 'Si', z: 14, fracPos: [0.25, 0.25, 0.25], color: '#38bdf8', radius: 0.35 },
      { element: 'Si', z: 14, fracPos: [0.75, 0.75, 0.25], color: '#38bdf8', radius: 0.35 },
      { element: 'Si', z: 14, fracPos: [0.75, 0.25, 0.75], color: '#38bdf8', radius: 0.35 },
      { element: 'Si', z: 14, fracPos: [0.25, 0.75, 0.75], color: '#38bdf8', radius: 0.35 },
    ],
    commonMillerPlanes: [
      { h: 1, k: 1, l: 1 },
      { h: 2, k: 2, l: 0 },
      { h: 3, k: 1, l: 1 },
      { h: 4, k: 0, l: 0 },
    ],
  },

  // --- 5. ROCK SALT (NACL) - FCC HALITE ---
  {
    id: 'nacl-rocksalt',
    name: 'Halite (Sodium Chloride)',
    chemicalFormula: 'NaCl',
    system: 'cubic',
    bravais: 'F',
    spaceGroup: 'Fm-3m (225)',
    spaceGroupNumber: 225,
    lattice: { a: 5.64, b: 5.64, c: 5.64, alpha: 90, beta: 90, gamma: 90 },
    atomicPackingFactor: 0.67,
    density: 2.165,
    description: 'Face-centered cubic array of chloride anions with sodium cations occupying all octahedral interstitial sites. Coordination number 6:6.',
    applications: ['Electrolyte standard', 'Chlor-alkali electrolysis feedstock', 'Infrared optical windows', 'Food preservation'],
    basisAtoms: [
      // Na+ at corners & face centers of sub-lattice
      { element: 'Na', z: 11, fracPos: [0.0, 0.0, 0.0], color: '#a855f7', radius: 0.30 },
      { element: 'Na', z: 11, fracPos: [0.5, 0.5, 0.0], color: '#a855f7', radius: 0.30 },
      { element: 'Na', z: 11, fracPos: [0.5, 0.0, 0.5], color: '#a855f7', radius: 0.30 },
      { element: 'Na', z: 11, fracPos: [0.0, 0.5, 0.5], color: '#a855f7', radius: 0.30 },
      // Cl- at edge centers & body center
      { element: 'Cl', z: 17, fracPos: [0.5, 0.0, 0.0], color: '#22c55e', radius: 0.42 },
      { element: 'Cl', z: 17, fracPos: [0.0, 0.5, 0.0], color: '#22c55e', radius: 0.42 },
      { element: 'Cl', z: 17, fracPos: [0.0, 0.0, 0.5], color: '#22c55e', radius: 0.42 },
      { element: 'Cl', z: 17, fracPos: [0.5, 0.5, 0.5], color: '#22c55e', radius: 0.42 },
    ],
    commonMillerPlanes: [
      { h: 2, k: 0, l: 0 },
      { h: 2, k: 2, l: 0 },
      { h: 1, k: 1, l: 1 },
      { h: 2, k: 2, l: 2 },
    ],
  },

  // --- 6. CESIUM CHLORIDE (CSCL) ---
  {
    id: 'cscl-structure',
    name: 'Cesium Chloride',
    chemicalFormula: 'CsCl',
    system: 'cubic',
    bravais: 'P',
    spaceGroup: 'Pm-3m (221)',
    spaceGroupNumber: 221,
    lattice: { a: 4.123, b: 4.123, c: 4.123, alpha: 90, beta: 90, gamma: 90 },
    atomicPackingFactor: 0.68,
    density: 3.99,
    description: 'Simple cubic chloride lattice with a cesium cation sitting at the exact unit cell center. Coordination number 8:8 due to the high ionic radius ratio (r+/r- = 0.93).',
    applications: ['Ultracentrifugation density gradients (DNA separation)', 'Radioactive source matrix (Cs-137)', 'Scintillation crystals'],
    basisAtoms: [
      { element: 'Cl', z: 17, fracPos: [0.0, 0.0, 0.0], color: '#22c55e', radius: 0.40 },
      { element: 'Cs', z: 55, fracPos: [0.5, 0.5, 0.5], color: '#eab308', radius: 0.46 },
    ],
    commonMillerPlanes: [
      { h: 1, k: 0, l: 0 },
      { h: 1, k: 1, l: 0 },
      { h: 1, k: 1, l: 1 },
      { h: 2, k: 0, l: 0 },
    ],
  },

  // --- 7. PEROVSKITE (CATIO3) ---
  {
    id: 'catio3-perovskite',
    name: 'Perovskite (Calcium Titanate)',
    chemicalFormula: 'CaTiO₃',
    system: 'cubic',
    bravais: 'P',
    spaceGroup: 'Pm-3m (221)',
    spaceGroupNumber: 221,
    lattice: { a: 3.84, b: 3.84, c: 3.84, alpha: 90, beta: 90, gamma: 90 },
    atomicPackingFactor: 0.72,
    density: 4.04,
    description: 'Prototypical ternary oxide ABX3 structure. Calcium sits at cell corners, Titanium at body center, and Oxygen anions at face centers forming corner-sharing TiO6 octahedra.',
    applications: ['Perovskite tandem solar cells', 'Piezoelectric transducers', 'Ferroelectric non-volatile memory', 'Solid oxide fuel cell cathodes'],
    basisAtoms: [
      { element: 'Ca', z: 20, fracPos: [0.0, 0.0, 0.0], color: '#38bdf8', radius: 0.38 },
      { element: 'Ti', z: 22, fracPos: [0.5, 0.5, 0.5], color: '#94a3b8', radius: 0.34 },
      { element: 'O', z: 8, fracPos: [0.5, 0.5, 0.0], color: '#ef4444', radius: 0.28 },
      { element: 'O', z: 8, fracPos: [0.5, 0.0, 0.5], color: '#ef4444', radius: 0.28 },
      { element: 'O', z: 8, fracPos: [0.0, 0.5, 0.5], color: '#ef4444', radius: 0.28 },
    ],
    commonMillerPlanes: [
      { h: 1, k: 0, l: 0 },
      { h: 1, k: 1, l: 0 },
      { h: 1, k: 1, l: 1 },
      { h: 2, k: 0, l: 0 },
    ],
  },

  // --- 8. MAGNESIUM - HCP ---
  {
    id: 'mg-hcp',
    name: 'Magnesium (HCP)',
    chemicalFormula: 'Mg',
    system: 'hexagonal',
    bravais: 'P',
    spaceGroup: 'P6_3/mmc (194)',
    spaceGroupNumber: 194,
    lattice: { a: 3.209, b: 3.209, c: 5.211, alpha: 90, beta: 90, gamma: 120 },
    atomicPackingFactor: 0.74,
    density: 1.738,
    description: 'Hexagonal Close-Packed (HCP) metal with ABABAB stacking sequence. Ideal c/a ratio = 1.624 (close to ideal 1.633). Exceptional strength-to-weight ratio.',
    applications: ['Aerospace structural alloys', 'Lightweight automotive castings', 'Biodegradable orthopedic implants', 'Anodic sacrificial protection'],
    basisAtoms: [
      { element: 'Mg', z: 12, fracPos: [0.0, 0.0, 0.0], color: '#cbd5e1', radius: 0.38 },
      { element: 'Mg', z: 12, fracPos: [1 / 3, 2 / 3, 0.5], color: '#cbd5e1', radius: 0.38 },
    ],
    commonMillerPlanes: [
      { h: 1, k: 0, l: 0 },
      { h: 0, k: 0, l: 2 },
      { h: 1, k: 0, l: 1 },
      { h: 1, k: 0, l: 2 },
    ],
  },

  // --- 9. RUTILE (TIO2) - TETRAGONAL ---
  {
    id: 'tio2-rutile',
    name: 'Rutile (Titanium Dioxide)',
    chemicalFormula: 'TiO₂',
    system: 'tetragonal',
    bravais: 'P',
    spaceGroup: 'P4_2/mnm (136)',
    spaceGroupNumber: 136,
    lattice: { a: 4.594, b: 4.594, c: 2.959, alpha: 90, beta: 90, gamma: 90 },
    atomicPackingFactor: 0.62,
    density: 4.23,
    description: 'Prototypical tetragonal dioxide structure. Features edge-sharing TiO6 octahedra aligned along the c-axis, with highest refractive index (n ≈ 2.7) of any common crystal.',
    applications: ['White pigment in paints and plastics', 'UV photocatalysis for water purification', 'Optical anti-reflection coatings'],
    basisAtoms: [
      { element: 'Ti', z: 22, fracPos: [0.0, 0.0, 0.0], color: '#94a3b8', radius: 0.35 },
      { element: 'Ti', z: 22, fracPos: [0.5, 0.5, 0.5], color: '#94a3b8', radius: 0.35 },
      { element: 'O', z: 8, fracPos: [0.305, 0.305, 0.0], color: '#ef4444', radius: 0.28 },
      { element: 'O', z: 8, fracPos: [0.695, 0.695, 0.0], color: '#ef4444', radius: 0.28 },
      { element: 'O', z: 8, fracPos: [0.805, 0.195, 0.5], color: '#ef4444', radius: 0.28 },
      { element: 'O', z: 8, fracPos: [0.195, 0.805, 0.5], color: '#ef4444', radius: 0.28 },
    ],
    commonMillerPlanes: [
      { h: 1, k: 1, l: 0 },
      { h: 1, k: 0, l: 1 },
      { h: 2, k: 0, l: 0 },
      { h: 2, k: 1, l: 1 },
    ],
  },

  // --- 10. GRAPHITE / GRAPHENE ---
  {
    id: 'c-graphite',
    name: 'Graphite',
    chemicalFormula: 'C',
    system: 'hexagonal',
    bravais: 'P',
    spaceGroup: 'P6_3/mmc (194)',
    spaceGroupNumber: 194,
    lattice: { a: 2.464, b: 2.464, c: 6.711, alpha: 90, beta: 90, gamma: 120 },
    atomicPackingFactor: 0.45,
    density: 2.26,
    description: 'Layered sp² honeycomb graphene sheets bound along c-axis by weak van der Waals dispersion forces. Delocalized π-electrons yield metallic in-plane electrical conductivity.',
    applications: ['Lithium-ion battery anodes', 'Nuclear reactor neutron moderators', 'High-temperature solid lubricants', 'Graphene exfoliation'],
    basisAtoms: [
      { element: 'C', z: 6, fracPos: [0.0, 0.0, 0.25], color: '#475569', radius: 0.30 },
      { element: 'C', z: 6, fracPos: [1 / 3, 2 / 3, 0.25], color: '#475569', radius: 0.30 },
      { element: 'C', z: 6, fracPos: [1 / 3, 2 / 3, 0.75], color: '#475569', radius: 0.30 },
      { element: 'C', z: 6, fracPos: [2 / 3, 1 / 3, 0.75], color: '#475569', radius: 0.30 },
    ],
    commonMillerPlanes: [
      { h: 0, k: 0, l: 2 },
      { h: 1, k: 0, l: 0 },
      { h: 1, k: 0, l: 1 },
      { h: 0, k: 0, l: 4 },
    ],
  },

  // --- 11. GALLIUM ARSENIDE (GAAS) ---
  {
    id: 'gaas-zincblende',
    name: 'Gallium Arsenide',
    chemicalFormula: 'GaAs',
    system: 'cubic',
    bravais: 'F',
    spaceGroup: 'F-43m (216)',
    spaceGroupNumber: 216,
    lattice: { a: 5.653, b: 5.653, c: 5.653, alpha: 90, beta: 90, gamma: 90 },
    atomicPackingFactor: 0.34,
    density: 5.318,
    description: 'Sphalerite (zincblende) structure: interpenetrating FCC lattices of Ga and As. Direct bandgap of 1.42 eV with electron mobility 6x greater than silicon.',
    applications: ['5G / RF Power amplifiers', 'High-efficiency multi-junction space solar cells', 'Semiconductor laser diodes'],
    basisAtoms: [
      { element: 'Ga', z: 31, fracPos: [0.0, 0.0, 0.0], color: '#a855f7', radius: 0.35 },
      { element: 'Ga', z: 31, fracPos: [0.5, 0.5, 0.0], color: '#a855f7', radius: 0.35 },
      { element: 'Ga', z: 31, fracPos: [0.5, 0.0, 0.5], color: '#a855f7', radius: 0.35 },
      { element: 'Ga', z: 31, fracPos: [0.0, 0.5, 0.5], color: '#a855f7', radius: 0.35 },
      { element: 'As', z: 33, fracPos: [0.25, 0.25, 0.25], color: '#22c55e', radius: 0.35 },
      { element: 'As', z: 33, fracPos: [0.75, 0.75, 0.25], color: '#22c55e', radius: 0.35 },
      { element: 'As', z: 33, fracPos: [0.75, 0.25, 0.75], color: '#22c55e', radius: 0.35 },
      { element: 'As', z: 33, fracPos: [0.25, 0.75, 0.75], color: '#22c55e', radius: 0.35 },
    ],
    commonMillerPlanes: [
      { h: 1, k: 1, l: 1 },
      { h: 2, k: 2, l: 0 },
      { h: 3, k: 1, l: 1 },
      { h: 4, k: 0, l: 0 },
    ],
  },
]

export function getAllCrystalStructures(): CrystalStructure[] {
  return CRYSTAL_STRUCTURES
}

export function getCrystalStructureById(id: string): CrystalStructure | undefined {
  return CRYSTAL_STRUCTURES.find((c) => c.id === id)
}
