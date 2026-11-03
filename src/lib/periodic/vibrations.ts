/**
 * Molecular Vibrational Spectroscopy & Normal Modes Physics Engine
 *
 * Implements harmonic vibrational coordinates, normal mode displacement vectors,
 * point group symmetry selection rules, dipole derivative / polarizability tensor
 * activities, and FTIR transmittance & Raman spectra simulation.
 *
 * Pure TypeScript physics engine with zero external dependencies.
 */

export interface AtomVibration {
  symbol: string
  z: number
  mass: number // atomic mass in amu (g/mol)
  x0: number // equilibrium x in Ångström
  y0: number // equilibrium y in Ångström
  z0: number // equilibrium z in Ångström
  color: string // CPK hex color
  radius: number // display radius in Å
}

export interface Vector3D {
  x: number
  y: number
  z: number
}

export interface NormalMode {
  id: number // 1-based mode number
  frequency: number // wavenumber in cm^-1
  symmetry: string // point group Mulliken symbol (e.g. A1, B2, T1u, Sigma_g+)
  description: string // e.g. "Symmetric Stretch", "Scissoring Bend"
  irActive: boolean
  irIntensity: number // relative intensity [0, 100]
  ramanActive: boolean
  ramanIntensity: number // relative intensity [0, 100]
  depolarizationRatio: number // Raman depolarization ratio rho (e.g. 0.05 polarized, 0.75 depolarized)
  displacements: Vector3D[] // displacement vector e_i for each atom i
}

export interface VibrationalMolecule {
  id: string
  name: string
  formula: string
  pointGroup: string
  isLinear: boolean
  numAtoms: number
  degreesOfFreedom: number // 3N - 6 or 3N - 5
  atoms: AtomVibration[]
  bonds: [number, number][] // atom index pairs
  modes: NormalMode[]
  hasInversionCenter: boolean // true => Rule of Mutual Exclusion holds
  description: string
  greenhouseEffect?: string
}

// Helper to normalize and check center of mass
function normalizeDisplacements(atoms: AtomVibration[], vectors: Vector3D[]): Vector3D[] {
  // Center of mass translation correction: sum(m_i * e_i) = 0
  let totalMass = 0
  let comDx = 0
  let comDy = 0
  let comDz = 0

  for (let i = 0; i < atoms.length; i++) {
    const m = atoms[i].mass
    totalMass += m
    comDx += m * vectors[i].x
    comDy += m * vectors[i].y
    comDz += m * vectors[i].z
  }

  const corrected = vectors.map((v) => ({
    x: v.x - comDx / totalMass,
    y: v.y - comDy / totalMass,
    z: v.z - comDz / totalMass,
  }))

  // Max magnitude scaling to approx 0.35 Å standard visual unit
  let maxMag = 0
  for (const v of corrected) {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    if (mag > maxMag) maxMag = mag
  }

  if (maxMag > 1e-6) {
    return corrected.map((v) => ({
      x: (v.x / maxMag) * 0.45,
      y: (v.y / maxMag) * 0.45,
      z: (v.z / maxMag) * 0.45,
    }))
  }

  return corrected
}

/**
 * 1. Water (H2O) - C2v Point Group
 * N = 3, Non-linear -> 3N - 6 = 3 normal modes.
 * All 3 modes are both IR and Raman active.
 */
const H2O_ATOMS: AtomVibration[] = [
  { symbol: 'O', z: 8, mass: 15.999, x0: 0.0, y0: 0.0, z0: 0.1173, color: '#ef4444', radius: 0.66 },
  { symbol: 'H', z: 1, mass: 1.008, x0: 0.0, y0: 0.757, z0: -0.4692, color: '#f4f4f5', radius: 0.38 },
  { symbol: 'H', z: 1, mass: 1.008, x0: 0.0, y0: -0.757, z0: -0.4692, color: '#f4f4f5', radius: 0.38 },
]

const H2O_MODES_RAW: Omit<NormalMode, 'displacements'>[] = [
  {
    id: 1,
    frequency: 3657,
    symmetry: 'A₁',
    description: 'Symmetric O-H Stretch',
    irActive: true,
    irIntensity: 45,
    ramanActive: true,
    ramanIntensity: 90,
    depolarizationRatio: 0.12,
  },
  {
    id: 2,
    frequency: 1595,
    symmetry: 'A₁',
    description: 'H-O-H Scissoring Bending',
    irActive: true,
    irIntensity: 85,
    ramanActive: true,
    ramanIntensity: 25,
    depolarizationRatio: 0.18,
  },
  {
    id: 3,
    frequency: 3756,
    symmetry: 'B₂',
    description: 'Asymmetric O-H Stretch',
    irActive: true,
    irIntensity: 100,
    ramanActive: true,
    ramanIntensity: 40,
    depolarizationRatio: 0.75,
  },
]

const H2O_VECTORS: Vector3D[][] = [
  // nu_1 (Sym stretch): O moves +z, H1 moves +y -z, H2 moves -y -z
  [
    { x: 0, y: 0, z: 0.07 },
    { x: 0, y: 0.55, z: -0.55 },
    { x: 0, y: -0.55, z: -0.55 },
  ],
  // nu_2 (Scissoring): O moves -z, H1 moves -y +z, H2 moves +y +z
  [
    { x: 0, y: 0, z: -0.1 },
    { x: 0, y: -0.7, z: 0.6 },
    { x: 0, y: 0.7, z: 0.6 },
  ],
  // nu_3 (Asym stretch): O moves -y, H1 moves +y -z, H2 moves +y +z
  [
    { x: 0, y: -0.09, z: 0 },
    { x: 0, y: 0.65, z: -0.5 },
    { x: 0, y: 0.65, z: 0.5 },
  ],
]

/**
 * 2. Carbon Dioxide (CO2) - D_inf_h Point Group
 * N = 3, Linear -> 3N - 5 = 4 normal modes (including 1 doubly degenerate bend).
 * Centrosymmetric: Rule of Mutual Exclusion strictly holds!
 * nu_2 is the critical atmospheric greenhouse vibrational mode (~15 um).
 */
const CO2_ATOMS: AtomVibration[] = [
  { symbol: 'C', z: 6, mass: 12.011, x0: 0.0, y0: 0.0, z0: 0.0, color: '#3f3f46', radius: 0.7 },
  { symbol: 'O', z: 8, mass: 15.999, x0: 0.0, y0: 0.0, z0: 1.16, color: '#ef4444', radius: 0.66 },
  { symbol: 'O', z: 8, mass: 15.999, x0: 0.0, y0: 0.0, z0: -1.16, color: '#ef4444', radius: 0.66 },
]

const CO2_MODES_RAW: Omit<NormalMode, 'displacements'>[] = [
  {
    id: 1,
    frequency: 1388,
    symmetry: 'Σg⁺',
    description: 'Symmetric C=O Stretch',
    irActive: false,
    irIntensity: 0,
    ramanActive: true,
    ramanIntensity: 100,
    depolarizationRatio: 0.05,
  },
  {
    id: 2,
    frequency: 667,
    symmetry: 'Πu (x)',
    description: 'Degenerate In-Plane Bending (Greenhouse Band 15 µm)',
    irActive: true,
    irIntensity: 90,
    ramanActive: false,
    ramanIntensity: 0,
    depolarizationRatio: 0.75,
  },
  {
    id: 3,
    frequency: 667,
    symmetry: 'Πu (y)',
    description: 'Degenerate Out-of-Plane Bending',
    irActive: true,
    irIntensity: 90,
    ramanActive: false,
    ramanIntensity: 0,
    depolarizationRatio: 0.75,
  },
  {
    id: 4,
    frequency: 2349,
    symmetry: 'Σu⁺',
    description: 'Antisymmetric C=O Stretch (Atmospheric Absorption 4.26 µm)',
    irActive: true,
    irIntensity: 100,
    ramanActive: false,
    ramanIntensity: 0,
    depolarizationRatio: 0.75,
  },
]

const CO2_VECTORS: Vector3D[][] = [
  // nu_1 (Sym stretch): C stationary, O1 moves +z, O2 moves -z
  [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0.7 },
    { x: 0, y: 0, z: -0.7 },
  ],
  // nu_2 (Bend x): C moves -x, O1 & O2 move +x
  [
    { x: -0.8, y: 0, z: 0 },
    { x: 0.3, y: 0, z: 0 },
    { x: 0.3, y: 0, z: 0 },
  ],
  // nu_3 (Bend y): C moves -y, O1 & O2 move +y
  [
    { x: 0, y: -0.8, z: 0 },
    { x: 0, y: 0.3, z: 0 },
    { x: 0, y: 0.3, z: 0 },
  ],
  // nu_4 (Asym stretch): C moves +z, O1 & O2 move -z
  [
    { x: 0, y: 0, z: 0.8 },
    { x: 0, y: 0, z: -0.3 },
    { x: 0, y: 0, z: -0.3 },
  ],
]

/**
 * 3. Methane (CH4) - Td Point Group
 * N = 5, Non-linear -> 3N - 6 = 9 normal modes: A1 + E (2) + T2 (3) + T2 (3).
 */
const CH4_D = 1.09 / Math.sqrt(3)
const CH4_ATOMS: AtomVibration[] = [
  { symbol: 'C', z: 6, mass: 12.011, x0: 0, y0: 0, z0: 0, color: '#3f3f46', radius: 0.7 },
  { symbol: 'H', z: 1, mass: 1.008, x0: CH4_D, y0: CH4_D, z0: CH4_D, color: '#f4f4f5', radius: 0.38 },
  { symbol: 'H', z: 1, mass: 1.008, x0: CH4_D, y0: -CH4_D, z0: -CH4_D, color: '#f4f4f5', radius: 0.38 },
  { symbol: 'H', z: 1, mass: 1.008, x0: -CH4_D, y0: CH4_D, z0: -CH4_D, color: '#f4f4f5', radius: 0.38 },
  { symbol: 'H', z: 1, mass: 1.008, x0: -CH4_D, y0: -CH4_D, z0: CH4_D, color: '#f4f4f5', radius: 0.38 },
]

const CH4_MODES_RAW: Omit<NormalMode, 'displacements'>[] = [
  {
    id: 1,
    frequency: 2917,
    symmetry: 'A₁',
    description: 'Totally Symmetric C-H Breathing Stretch',
    irActive: false,
    irIntensity: 0,
    ramanActive: true,
    ramanIntensity: 100,
    depolarizationRatio: 0.02,
  },
  {
    id: 2,
    frequency: 1534,
    symmetry: 'E',
    description: 'Doubly Degenerate H-C-H Scissoring / Twisting',
    irActive: false,
    irIntensity: 0,
    ramanActive: true,
    ramanIntensity: 45,
    depolarizationRatio: 0.75,
  },
  {
    id: 3,
    frequency: 3019,
    symmetry: 'T₂',
    description: 'Triply Degenerate Asymmetric C-H Stretch',
    irActive: true,
    irIntensity: 85,
    ramanActive: true,
    ramanIntensity: 65,
    depolarizationRatio: 0.75,
  },
  {
    id: 4,
    frequency: 1306,
    symmetry: 'T₂',
    description: 'Triply Degenerate H-C-H Bending Deformation (Greenhouse Band 7.7 µm)',
    irActive: true,
    irIntensity: 100,
    ramanActive: true,
    ramanIntensity: 25,
    depolarizationRatio: 0.75,
  },
]

const CH4_VECTORS: Vector3D[][] = [
  // nu_1 (A1 breathing): All H atoms expand radially away from C
  [
    { x: 0, y: 0, z: 0 },
    { x: 0.5, y: 0.5, z: 0.5 },
    { x: 0.5, y: -0.5, z: -0.5 },
    { x: -0.5, y: 0.5, z: -0.5 },
    { x: -0.5, y: -0.5, z: 0.5 },
  ],
  // nu_2 (E scissoring): H pairs bend towards each other
  [
    { x: 0, y: 0, z: 0 },
    { x: -0.5, y: 0.5, z: 0 },
    { x: -0.5, y: -0.5, z: 0 },
    { x: 0.5, y: 0.5, z: 0 },
    { x: 0.5, y: -0.5, z: 0 },
  ],
  // nu_3 (T2 asym stretch): C moves against H pairs
  [
    { x: 0.15, y: 0.15, z: 0.15 },
    { x: -0.7, y: -0.7, z: -0.7 },
    { x: 0.35, y: -0.2, z: -0.2 },
    { x: -0.2, y: 0.35, z: -0.2 },
    { x: -0.2, y: -0.2, z: 0.35 },
  ],
  // nu_4 (T2 bending): C moves, H atoms deform asymmetrically
  [
    { x: 0, y: 0, z: 0.25 },
    { x: 0.4, y: 0.4, z: -0.4 },
    { x: 0.4, y: -0.4, z: -0.4 },
    { x: -0.4, y: 0.4, z: -0.4 },
    { x: -0.4, y: -0.4, z: -0.4 },
  ],
]

/**
 * 4. Ammonia (NH3) - C3v Point Group
 * N = 4, Non-linear -> 3N - 6 = 6 normal modes: 2A1 + 2E (each E is doubly degenerate = 6 total).
 * nu_2 is the celebrated "Umbrella" inversion tunneling mode (950 cm^-1).
 */
const NH3_R = 1.012
const NH3_ALPHA = (107 * Math.PI) / 180 / 2
const NH3_Z_H = -NH3_R * Math.cos(NH3_ALPHA)
const NH3_RAD_H = NH3_R * Math.sin(NH3_ALPHA)

const NH3_ATOMS: AtomVibration[] = [
  { symbol: 'N', z: 7, mass: 14.007, x0: 0, y0: 0, z0: 0.12, color: '#3b82f6', radius: 0.7 },
  {
    symbol: 'H',
    z: 1,
    mass: 1.008,
    x0: NH3_RAD_H,
    y0: 0,
    z0: NH3_Z_H,
    color: '#f4f4f5',
    radius: 0.38,
  },
  {
    symbol: 'H',
    z: 1,
    mass: 1.008,
    x0: -NH3_RAD_H / 2,
    y0: (NH3_RAD_H * Math.sqrt(3)) / 2,
    z0: NH3_Z_H,
    color: '#f4f4f5',
    radius: 0.38,
  },
  {
    symbol: 'H',
    z: 1,
    mass: 1.008,
    x0: -NH3_RAD_H / 2,
    y0: (-NH3_RAD_H * Math.sqrt(3)) / 2,
    z0: NH3_Z_H,
    color: '#f4f4f5',
    radius: 0.38,
  },
]

const NH3_MODES_RAW: Omit<NormalMode, 'displacements'>[] = [
  {
    id: 1,
    frequency: 3337,
    symmetry: 'A₁',
    description: 'Symmetric N-H Stretch',
    irActive: true,
    irIntensity: 55,
    ramanActive: true,
    ramanIntensity: 90,
    depolarizationRatio: 0.08,
  },
  {
    id: 2,
    frequency: 950,
    symmetry: 'A₁',
    description: 'Symmetric Inversion / "Umbrella" Tunneling Mode',
    irActive: true,
    irIntensity: 100,
    ramanActive: true,
    ramanIntensity: 40,
    depolarizationRatio: 0.1,
  },
  {
    id: 3,
    frequency: 3444,
    symmetry: 'E',
    description: 'Doubly Degenerate Antisymmetric N-H Stretch',
    irActive: true,
    irIntensity: 60,
    ramanActive: true,
    ramanIntensity: 70,
    depolarizationRatio: 0.75,
  },
  {
    id: 4,
    frequency: 1627,
    symmetry: 'E',
    description: 'Doubly Degenerate H-N-H Bending Deformation',
    irActive: true,
    irIntensity: 80,
    ramanActive: true,
    ramanIntensity: 35,
    depolarizationRatio: 0.75,
  },
]

const NH3_VECTORS: Vector3D[][] = [
  // nu_1 (Sym stretch): N moves +z, 3 H atoms move radially out and -z
  [
    { x: 0, y: 0, z: 0.08 },
    { x: 0.5, y: 0, z: -0.4 },
    { x: -0.25, y: 0.43, z: -0.4 },
    { x: -0.25, y: -0.43, z: -0.4 },
  ],
  // nu_2 (Umbrella): N moves strongly along -z, 3 H atoms move +z
  [
    { x: 0, y: 0, z: -0.3 },
    { x: 0, y: 0, z: 0.75 },
    { x: 0, y: 0, z: 0.75 },
    { x: 0, y: 0, z: 0.75 },
  ],
  // nu_3 (Degenerate asym stretch)
  [
    { x: 0.1, y: 0, z: 0 },
    { x: -0.7, y: 0, z: 0 },
    { x: 0.35, y: -0.4, z: 0 },
    { x: 0.35, y: 0.4, z: 0 },
  ],
  // nu_4 (Degenerate bend)
  [
    { x: 0, y: 0.1, z: 0 },
    { x: 0, y: -0.6, z: 0.2 },
    { x: 0.4, y: 0.3, z: -0.1 },
    { x: -0.4, y: 0.3, z: -0.1 },
  ],
]

/**
 * 5. Sulfur Hexafluoride (SF6) - Oh Point Group
 * N = 7, Non-linear -> 3N - 6 = 15 normal modes: A1g + Eg + 2T1u + T2g + T2u.
 * Centrosymmetric: Rule of Mutual Exclusion applies strictly!
 * nu_3 (948 cm^-1) is an exceptionally intense IR absorber, making SF6 the most potent
 * greenhouse gas known (GWP ~ 23,500 over 100 years).
 */
const SF_BOND = 1.56
const SF6_ATOMS: AtomVibration[] = [
  { symbol: 'S', z: 16, mass: 32.065, x0: 0, y0: 0, z0: 0, color: '#eab308', radius: 0.8 },
  { symbol: 'F', z: 9, mass: 18.998, x0: SF_BOND, y0: 0, z0: 0, color: '#22c55e', radius: 0.55 },
  { symbol: 'F', z: 9, mass: 18.998, x0: -SF_BOND, y0: 0, z0: 0, color: '#22c55e', radius: 0.55 },
  { symbol: 'F', z: 9, mass: 18.998, x0: 0, y0: SF_BOND, z0: 0, color: '#22c55e', radius: 0.55 },
  { symbol: 'F', z: 9, mass: 18.998, x0: 0, y0: -SF_BOND, z0: 0, color: '#22c55e', radius: 0.55 },
  { symbol: 'F', z: 9, mass: 18.998, x0: 0, y0: 0, z0: SF_BOND, color: '#22c55e', radius: 0.55 },
  { symbol: 'F', z: 9, mass: 18.998, x0: 0, y0: 0, z0: -SF_BOND, color: '#22c55e', radius: 0.55 },
]

const SF6_MODES_RAW: Omit<NormalMode, 'displacements'>[] = [
  {
    id: 1,
    frequency: 775,
    symmetry: 'A₁g',
    description: 'Symmetric Octahedral Breathing Stretch',
    irActive: false,
    irIntensity: 0,
    ramanActive: true,
    ramanIntensity: 100,
    depolarizationRatio: 0.01,
  },
  {
    id: 2,
    frequency: 643,
    symmetry: 'Eg',
    description: 'Doubly Degenerate S-F Stretch',
    irActive: false,
    irIntensity: 0,
    ramanActive: true,
    ramanIntensity: 75,
    depolarizationRatio: 0.75,
  },
  {
    id: 3,
    frequency: 948,
    symmetry: 'T₁u',
    description: 'Triply Degenerate Antisymmetric S-F Stretch (Extreme Greenhouse Band, GWP 23,500)',
    irActive: true,
    irIntensity: 100,
    ramanActive: false,
    ramanIntensity: 0,
    depolarizationRatio: 0.75,
  },
  {
    id: 4,
    frequency: 615,
    symmetry: 'T₁u',
    description: 'Triply Degenerate F-S-F Bending',
    irActive: true,
    irIntensity: 85,
    ramanActive: false,
    ramanIntensity: 0,
    depolarizationRatio: 0.75,
  },
  {
    id: 5,
    frequency: 523,
    symmetry: 'T₂g',
    description: 'Triply Degenerate In-Plane F-S-F Deformation',
    irActive: false,
    irIntensity: 0,
    ramanActive: true,
    ramanIntensity: 60,
    depolarizationRatio: 0.75,
  },
  {
    id: 6,
    frequency: 347,
    symmetry: 'T₂u',
    description: 'Triply Degenerate Silent Octahedral Deformation (IR & Raman Inactive)',
    irActive: false,
    irIntensity: 0,
    ramanActive: false,
    ramanIntensity: 0,
    depolarizationRatio: 0.75,
  },
]

const SF6_VECTORS: Vector3D[][] = [
  // nu_1 (A1g breathing): 6 F atoms expand outwards along axes
  [
    { x: 0, y: 0, z: 0 },
    { x: 0.6, y: 0, z: 0 },
    { x: -0.6, y: 0, z: 0 },
    { x: 0, y: 0.6, z: 0 },
    { x: 0, y: -0.6, z: 0 },
    { x: 0, y: 0, z: 0.6 },
    { x: 0, y: 0, z: -0.6 },
  ],
  // nu_2 (Eg): x,y expand while z compresses
  [
    { x: 0, y: 0, z: 0 },
    { x: 0.4, y: 0, z: 0 },
    { x: -0.4, y: 0, z: 0 },
    { x: 0.4, y: 0, z: 0 },
    { x: -0.4, y: 0, z: 0 },
    { x: 0, y: 0, z: -0.8 },
    { x: 0, y: 0, z: 0.8 },
  ],
  // nu_3 (T1u asym stretch along z): S moves +z, F5 & F6 move -z
  [
    { x: 0, y: 0, z: 0.6 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: -0.6 },
    { x: 0, y: 0, z: -0.6 },
  ],
  // nu_4 (T1u bend along y)
  [
    { x: 0, y: 0.5, z: 0 },
    { x: 0, y: -0.4, z: 0 },
    { x: 0, y: -0.4, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: -0.4, z: 0 },
    { x: 0, y: -0.4, z: 0 },
  ],
  // nu_5 (T2g bend): scissors in xy plane
  [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0.5, z: 0 },
    { x: 0, y: -0.5, z: 0 },
    { x: 0.5, y: 0, z: 0 },
    { x: -0.5, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  ],
  // nu_6 (T2u silent)
  [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0.4 },
    { x: 0, y: 0, z: -0.4 },
    { x: 0, y: 0, z: -0.4 },
    { x: 0, y: 0, z: 0.4 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  ],
]

/**
 * 6. Xenon Tetrafluoride (XeF4) - D4h Point Group
 * N = 5, Square Planar -> 3N - 6 = 9 normal modes: A1g + B1g + B2g + A2u + 2Eu + B1u.
 * Centrosymmetric: Rule of Mutual Exclusion applies strictly!
 */
const XEF_BOND = 1.95
const XEF4_ATOMS: AtomVibration[] = [
  { symbol: 'Xe', z: 54, mass: 131.293, x0: 0, y0: 0, z0: 0, color: '#8b5cf6', radius: 0.85 },
  { symbol: 'F', z: 9, mass: 18.998, x0: XEF_BOND, y0: 0, z0: 0, color: '#22c55e', radius: 0.55 },
  { symbol: 'F', z: 9, mass: 18.998, x0: 0, y0: XEF_BOND, z0: 0, color: '#22c55e', radius: 0.55 },
  { symbol: 'F', z: 9, mass: 18.998, x0: -XEF_BOND, y0: 0, z0: 0, color: '#22c55e', radius: 0.55 },
  { symbol: 'F', z: 9, mass: 18.998, x0: 0, y0: -XEF_BOND, z0: 0, color: '#22c55e', radius: 0.55 },
]

const XEF4_MODES_RAW: Omit<NormalMode, 'displacements'>[] = [
  {
    id: 1,
    frequency: 554,
    symmetry: 'A₁g',
    description: 'Symmetric Planar Xe-F Breathing Stretch',
    irActive: false,
    irIntensity: 0,
    ramanActive: true,
    ramanIntensity: 100,
    depolarizationRatio: 0.05,
  },
  {
    id: 2,
    frequency: 291,
    symmetry: 'A₂u',
    description: 'Out-of-Plane Umbrella-like Xe-F Bending',
    irActive: true,
    irIntensity: 90,
    ramanActive: false,
    ramanIntensity: 0,
    depolarizationRatio: 0.75,
  },
  {
    id: 3,
    frequency: 524,
    symmetry: 'B₁g',
    description: 'In-Plane Antisymmetric Xe-F Stretch',
    irActive: false,
    irIntensity: 0,
    ramanActive: true,
    ramanIntensity: 80,
    depolarizationRatio: 0.75,
  },
  {
    id: 4,
    frequency: 218,
    symmetry: 'B₂g',
    description: 'In-Plane F-Xe-F Scissoring Deformation',
    irActive: false,
    irIntensity: 0,
    ramanActive: true,
    ramanIntensity: 65,
    depolarizationRatio: 0.75,
  },
  {
    id: 5,
    frequency: 586,
    symmetry: 'Eu',
    description: 'Doubly Degenerate In-Plane Asymmetric Xe-F Stretch',
    irActive: true,
    irIntensity: 100,
    ramanActive: false,
    ramanIntensity: 0,
    depolarizationRatio: 0.75,
  },
]

const XEF4_VECTORS: Vector3D[][] = [
  // nu_1 (A1g breathing): All 4 F expand outward
  [
    { x: 0, y: 0, z: 0 },
    { x: 0.6, y: 0, z: 0 },
    { x: 0, y: 0.6, z: 0 },
    { x: -0.6, y: 0, z: 0 },
    { x: 0, y: -0.6, z: 0 },
  ],
  // nu_2 (A2u out-of-plane): Xe moves +z, 4 F move -z
  [
    { x: 0, y: 0, z: 0.3 },
    { x: 0, y: 0, z: -0.6 },
    { x: 0, y: 0, z: -0.6 },
    { x: 0, y: 0, z: -0.6 },
    { x: 0, y: 0, z: -0.6 },
  ],
  // nu_3 (B1g): F1, F3 expand while F2, F4 compress
  [
    { x: 0, y: 0, z: 0 },
    { x: 0.6, y: 0, z: 0 },
    { x: 0, y: -0.6, z: 0 },
    { x: -0.6, y: 0, z: 0 },
    { x: 0, y: 0.6, z: 0 },
  ],
  // nu_4 (B2g scissoring): tangential motion in xy plane
  [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0.5, z: 0 },
    { x: -0.5, y: 0, z: 0 },
    { x: 0, y: -0.5, z: 0 },
    { x: 0.5, y: 0, z: 0 },
  ],
  // nu_5 (Eu asym stretch): Xe moves along x, F1 & F3 compress
  [
    { x: -0.4, y: 0, z: 0 },
    { x: 0.6, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0.6, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  ],
]

// Build normal modes with normalized mass-weighted displacements
function buildModes(atoms: AtomVibration[], raw: Omit<NormalMode, 'displacements'>[], vectors: Vector3D[][]): NormalMode[] {
  return raw.map((m, idx) => ({
    ...m,
    displacements: normalizeDisplacements(atoms, vectors[idx]),
  }))
}

export const VIBRATIONAL_MOLECULES: Record<string, VibrationalMolecule> = {
  h2o: {
    id: 'h2o',
    name: 'Water',
    formula: 'H₂O',
    pointGroup: 'C₂v',
    isLinear: false,
    numAtoms: 3,
    degreesOfFreedom: 3,
    atoms: H2O_ATOMS,
    bonds: [
      [0, 1],
      [0, 2],
    ],
    modes: buildModes(H2O_ATOMS, H2O_MODES_RAW, H2O_VECTORS),
    hasInversionCenter: false,
    description: 'Bent triatomic molecule with C2v symmetry. Without an inversion center, all 3 fundamental normal modes are both IR and Raman active.',
    greenhouseEffect: 'Primary natural greenhouse gas on Earth, dominating broad infrared absorption bands across the troposphere.',
  },
  co2: {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    pointGroup: 'D∞h',
    isLinear: true,
    numAtoms: 3,
    degreesOfFreedom: 4,
    atoms: CO2_ATOMS,
    bonds: [
      [0, 1],
      [0, 2],
    ],
    modes: buildModes(CO2_ATOMS, CO2_MODES_RAW, CO2_VECTORS),
    hasInversionCenter: true,
    description: 'Linear centrosymmetric molecule. Under the Rule of Mutual Exclusion, no vibrational mode is simultaneously IR and Raman active.',
    greenhouseEffect: 'The fundamental bending mode at 667 cm⁻¹ (15 µm) sits directly at the peak of Earth thermal blackbody emission, driving anthropogenic climate change.',
  },
  ch4: {
    id: 'ch4',
    name: 'Methane',
    formula: 'CH₄',
    pointGroup: 'Td',
    isLinear: false,
    numAtoms: 5,
    degreesOfFreedom: 9,
    atoms: CH4_ATOMS,
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    modes: buildModes(CH4_ATOMS, CH4_MODES_RAW, CH4_VECTORS),
    hasInversionCenter: false,
    description: 'Tetrahedral molecule with 9 vibrational degrees of freedom (A1 + E + 2T2). The symmetric A1 and E modes are IR-inactive due to spherical symmetry.',
    greenhouseEffect: 'Potent greenhouse gas (~28× CO2 over 100 years); the triply degenerate deformation band ν4 at 1306 cm⁻¹ (7.7 µm) traps escaping planetary heat.',
  },
  nh3: {
    id: 'nh3',
    name: 'Ammonia',
    formula: 'NH₃',
    pointGroup: 'C₃v',
    isLinear: false,
    numAtoms: 4,
    degreesOfFreedom: 6,
    atoms: NH3_ATOMS,
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    modes: buildModes(NH3_ATOMS, NH3_MODES_RAW, NH3_VECTORS),
    hasInversionCenter: false,
    description: 'Trigonal pyramidal molecule featuring quantum mechanical umbrella inversion tunneling. The nitrogen atom tunnels through the hydrogen plane at 24 GHz.',
    greenhouseEffect: 'Strong IR features at 950 cm⁻¹ and 1627 cm⁻¹; vital atmospheric component in planetary atmospheres (Jupiter, Saturn).',
  },
  sf6: {
    id: 'sf6',
    name: 'Sulfur Hexafluoride',
    formula: 'SF₆',
    pointGroup: 'Oh',
    isLinear: false,
    numAtoms: 7,
    degreesOfFreedom: 15,
    atoms: SF6_ATOMS,
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
    ],
    modes: buildModes(SF6_ATOMS, SF6_MODES_RAW, SF6_VECTORS),
    hasInversionCenter: true,
    description: 'Perfect centrosymmetric octahedron (Oh). Follows Rule of Mutual Exclusion: "g" (gerade) modes are Raman active, while "u" (ungerade) modes are IR active.',
    greenhouseEffect: 'The most potent greenhouse gas evaluated by the IPCC (GWP ~ 23,500). The ν3 asymmetric stretch at 948 cm⁻¹ has colossal infrared absorption in the atmospheric window.',
  },
  xef4: {
    id: 'xef4',
    name: 'Xenon Tetrafluoride',
    formula: 'XeF₄',
    pointGroup: 'D₄h',
    isLinear: false,
    numAtoms: 5,
    degreesOfFreedom: 9,
    atoms: XEF4_ATOMS,
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    modes: buildModes(XEF4_ATOMS, XEF4_MODES_RAW, XEF4_VECTORS),
    hasInversionCenter: true,
    description: 'Square planar noble-gas compound with two axial lone pairs. Centrosymmetric D4h point group strictly demonstrates the Rule of Mutual Exclusion.',
    greenhouseEffect: 'Synthetic noble gas halide; historical proof of chemical bonding in noble gases discovered by Bartlett & Hoppe (1962).',
  },
}

/**
 * Computes instantaneous 3D atom position under harmonic normal mode oscillation:
 * r_i(t) = r_{i,0} + A * e_{i,k} * sin(omega * t + phase)
 */
export function computeHarmonicPosition(
  atom: AtomVibration,
  displacement: Vector3D,
  amplitude: number,
  phaseRad: number,
): Vector3D {
  const factor = amplitude * Math.sin(phaseRad)
  return {
    x: atom.x0 + displacement.x * factor,
    y: atom.y0 + displacement.y * factor,
    z: atom.z0 + displacement.z * factor,
  }
}

/**
 * Generates continuous synthetic FTIR Transmittance spectrum (%T)
 * using Lorentzian peak absorption profiles:
 * Absorbance A(nu) = sum_k [ I_k * (gamma/2)^2 / ((nu - nu_k)^2 + (gamma/2)^2) ]
 * Transmittance %T(nu) = 100 * 10^(-c * A(nu))
 */
export interface SpectrumPoint {
  wavenumber: number // cm^-1
  intensity: number // %T for FTIR (0 to 100), or relative arbitrary units for Raman (0 to 100)
}

export function generateFtIrSpectrum(
  modes: NormalMode[],
  minWn: number = 400,
  maxWn: number = 4000,
  stepWn: number = 5,
  gamma: number = 28, // FWHM linewidth in cm^-1
): SpectrumPoint[] {
  const points: SpectrumPoint[] = []
  const irModes = modes.filter((m) => m.irActive && m.irIntensity > 0)

  for (let wn = minWn; wn <= maxWn; wn += stepWn) {
    let absorbance = 0
    for (const mode of irModes) {
      const delta = wn - mode.frequency
      const hwhm = gamma / 2
      const lorentzian = (hwhm * hwhm) / (delta * delta + hwhm * hwhm)
      absorbance += (mode.irIntensity / 100) * lorentzian * 1.5
    }
    // Beer-Lambert transmittance: %T = 100 * 10^(-A)
    const t = 100 * Math.pow(10, -absorbance)
    points.push({ wavenumber: wn, intensity: Math.max(2, Math.min(100, t)) })
  }

  return points
}

/**
 * Generates continuous synthetic Raman Intensity spectrum
 * using Lorentzian peak emission profiles:
 * I(nu) = sum_k [ S_k * (gamma/2)^2 / ((nu - nu_k)^2 + (gamma/2)^2) ]
 */
export function generateRamanSpectrum(
  modes: NormalMode[],
  minWn: number = 100,
  maxWn: number = 4000,
  stepWn: number = 5,
  gamma: number = 24, // FWHM linewidth in cm^-1
): SpectrumPoint[] {
  const points: SpectrumPoint[] = []
  const ramanModes = modes.filter((m) => m.ramanActive && m.ramanIntensity > 0)

  for (let wn = minWn; wn <= maxWn; wn += stepWn) {
    let intensity = 0
    for (const mode of ramanModes) {
      const delta = wn - mode.frequency
      const hwhm = gamma / 2
      const lorentzian = (hwhm * hwhm) / (delta * delta + hwhm * hwhm)
      intensity += mode.ramanIntensity * lorentzian
    }
    points.push({ wavenumber: wn, intensity: Math.max(0, Math.min(100, intensity)) })
  }

  return points
}
