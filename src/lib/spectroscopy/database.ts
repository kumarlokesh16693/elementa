/**
 * Comprehensive Molecular Spectroscopy Database
 * Includes 3D equilibrium coordinates, authentic FTIR normal modes with 3D displacement vectors,
 * point group symmetries, and UV-Vis absorption chromophores.
 */

import type { SpectroscopyMolecule } from './types'

export const SPECTROSCOPY_MOLECULES: SpectroscopyMolecule[] = [
  // --- 1. WATER (H2O) ---
  {
    id: 'h2o',
    name: 'Water',
    formula: 'H₂O',
    systematicName: 'Oxidane',
    molecularWeight: 18.015,
    pointGroup: 'C₂ᵥ',
    degreesOfFreedom: { translational: 3, rotational: 3, vibrational: 3 }, // 3N - 6 = 3
    atoms3D: [
      { element: 'O', z: 8, position: [0.0, 0.0, 0.117], color: '#ef4444', radius: 0.38 },
      { element: 'H', z: 1, position: [0.0, 0.757, -0.469], color: '#ffffff', radius: 0.24 },
      { element: 'H', z: 1, position: [0.0, -0.757, -0.469], color: '#ffffff', radius: 0.24 },
    ],
    bonds3D: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
    modes: [
      {
        id: 'h2o-v1',
        name: 'Symmetric O-H Stretch (ν₁)',
        type: 'stretch-sym',
        wavenumber: 3657,
        transmittancePercent: 18,
        irActive: true,
        ramanActive: true,
        symmetryLabel: 'A₁',
        displacementVectors: [
          [0.0, 0.0, -0.07],
          [0.0, 0.65, -0.45],
          [0.0, -0.65, -0.45],
        ],
        description: 'Both O-H covalent bonds stretch and compress in phase, maintaining C₂ᵥ molecular symmetry.',
      },
      {
        id: 'h2o-v2',
        name: 'H-O-H Scissoring Bend (ν₂)',
        type: 'bend-scissor',
        wavenumber: 1595,
        transmittancePercent: 12,
        irActive: true,
        ramanActive: true,
        symmetryLabel: 'A₁',
        displacementVectors: [
          [0.0, 0.0, 0.12],
          [0.0, -0.55, -0.35],
          [0.0, 0.55, -0.35],
        ],
        description: 'H-O-H bond angle oscillates between acute and obtuse (scissoring deformation). Key atmospheric greenhouse band.',
      },
      {
        id: 'h2o-v3',
        name: 'Asymmetric O-H Stretch (ν₃)',
        type: 'stretch-asym',
        wavenumber: 3756,
        transmittancePercent: 8,
        irActive: true,
        ramanActive: false,
        symmetryLabel: 'B₂',
        displacementVectors: [
          [0.0, -0.06, 0.0],
          [0.0, 0.70, -0.40],
          [0.0, 0.70, 0.40],
        ],
        description: 'One O-H bond stretches while the opposite O-H bond compresses, creating a large oscillating dynamic dipole moment.',
      },
    ],
    uvVis: {
      lambdaMaxNm: 167, // Vacuum UV
      molarAbsorptivity: 7000,
      transitionType: 'n ➔ σ* (Rydberg)',
      solutionColor: 'rgba(56, 189, 248, 0.12)',
      absorptionColorName: 'Vacuum UV (Transparent in Visible)',
    },
    description: 'Archetypal non-linear triatomic polar molecule. Has 3 non-degenerate normal modes, all of which are infrared active due to strong dynamic dipole moment variations.',
    applications: ['Atmospheric thermal IR absorption', 'Solvation spectroscopy in NMR & FTIR', 'Combustion product thermometry'],
  },

  // --- 2. CARBON DIOXIDE (CO2) ---
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    systematicName: 'Carbon dioxide',
    molecularWeight: 44.009,
    pointGroup: 'D∞ₕ',
    degreesOfFreedom: { translational: 3, rotational: 2, vibrational: 4 }, // 3N - 5 = 4
    atoms3D: [
      { element: 'C', z: 6, position: [0.0, 0.0, 0.0], color: '#475569', radius: 0.35 },
      { element: 'O', z: 8, position: [-1.16, 0.0, 0.0], color: '#ef4444', radius: 0.38 },
      { element: 'O', z: 8, position: [1.16, 0.0, 0.0], color: '#ef4444', radius: 0.38 },
    ],
    bonds3D: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 },
    ],
    modes: [
      {
        id: 'co2-v1',
        name: 'Symmetric C=O Stretch (ν₁)',
        type: 'stretch-sym',
        wavenumber: 1388,
        transmittancePercent: 96,
        irActive: false, // Rule of mutual exclusion: centrosymmetric molecule!
        ramanActive: true,
        symmetryLabel: 'Σg⁺',
        displacementVectors: [
          [0.0, 0.0, 0.0],
          [-0.7, 0.0, 0.0],
          [0.7, 0.0, 0.0],
        ],
        description: 'Both oxygens move radially outward simultaneously. Net dipole moment remains zero at all times: strictly IR inactive by selection rules, but intensely Raman active.',
      },
      {
        id: 'co2-v2',
        name: 'Degenerate Bending (ν₂ - 15 μm Greenhouse Band)',
        type: 'bend-scissor',
        wavenumber: 667,
        transmittancePercent: 4,
        irActive: true,
        ramanActive: false,
        symmetryLabel: 'Πu',
        displacementVectors: [
          [0.0, 0.35, 0.0],
          [0.0, -0.35, 0.0],
          [0.0, -0.35, 0.0],
        ],
        description: 'Centrosymmetry is broken as the linear molecule bends into a V-shape. Generates the paramount 15 μm infrared absorption trough driving Earth’s greenhouse effect.',
      },
      {
        id: 'co2-v3',
        name: 'Asymmetric C=O Stretch (ν₃)',
        type: 'stretch-asym',
        wavenumber: 2349,
        transmittancePercent: 2,
        irActive: true,
        ramanActive: false,
        symmetryLabel: 'Σu⁺',
        displacementVectors: [
          [0.45, 0.0, 0.0],
          [0.35, 0.0, 0.0],
          [0.35, 0.0, 0.0],
        ],
        description: 'Carbon moves opposite to both oxygens. Enormously intense IR peak at 2349 cm⁻¹ commonly observed as the prominent double peak in all atmospheric air background spectra.',
      },
    ],
    uvVis: {
      lambdaMaxNm: 133,
      molarAbsorptivity: 2500,
      transitionType: 'π ➔ π*',
      solutionColor: 'rgba(255, 255, 255, 0.08)',
      absorptionColorName: 'Vacuum Far-UV',
    },
    description: 'Linear centrosymmetric molecule demonstrating the quantum rule of mutual exclusion: no vibrational mode can be simultaneously IR and Raman active.',
    applications: ['Earth climate radiative forcing (15 μm)', 'CO2 laser active medium (10.6 μm)', 'Industrial carbon capture monitoring'],
  },

  // --- 3. ACETONE (CH3COCH3) ---
  {
    id: 'acetone',
    name: 'Acetone (2-Propanone)',
    formula: 'CH₃COCH₃',
    systematicName: 'Propan-2-one',
    molecularWeight: 58.08,
    pointGroup: 'C₂ᵥ',
    degreesOfFreedom: { translational: 3, rotational: 3, vibrational: 24 },
    atoms3D: [
      { element: 'C', z: 6, position: [0.0, 0.18, 0.0], color: '#475569', radius: 0.35 },
      { element: 'O', z: 8, position: [0.0, 1.40, 0.0], color: '#ef4444', radius: 0.38 },
      { element: 'C', z: 6, position: [-1.28, -0.63, 0.0], color: '#475569', radius: 0.35 },
      { element: 'C', z: 6, position: [1.28, -0.63, 0.0], color: '#475569', radius: 0.35 },
      { element: 'H', z: 1, position: [-1.30, -1.27, 0.89], color: '#ffffff', radius: 0.22 },
      { element: 'H', z: 1, position: [-2.15, 0.03, 0.0], color: '#ffffff', radius: 0.22 },
      { element: 'H', z: 1, position: [1.30, -1.27, 0.89], color: '#ffffff', radius: 0.22 },
      { element: 'H', z: 1, position: [2.15, 0.03, 0.0], color: '#ffffff', radius: 0.22 },
    ],
    bonds3D: [
      { from: 0, to: 1, order: 2 }, // C=O
      { from: 0, to: 2, order: 1 }, // C-C
      { from: 0, to: 3, order: 1 }, // C-C
      { from: 2, to: 4, order: 1 },
      { from: 2, to: 5, order: 1 },
      { from: 3, to: 6, order: 1 },
      { from: 3, to: 7, order: 1 },
    ],
    modes: [
      {
        id: 'acetone-co',
        name: 'Carbonyl C=O Stretch (Diagnostic Band)',
        type: 'stretch-sym',
        wavenumber: 1715,
        transmittancePercent: 5,
        irActive: true,
        ramanActive: true,
        symmetryLabel: 'A₁',
        displacementVectors: [
          [0.0, -0.2, 0.0],
          [0.0, 0.65, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
        ],
        description: 'Vigorous stretch of the highly polar C=O double bond. The gold standard diagnostic band for ketone functional groups in organic chemistry.',
      },
      {
        id: 'acetone-ch',
        name: 'Aliphatic C-H Stretch',
        type: 'stretch-asym',
        wavenumber: 2965,
        transmittancePercent: 24,
        irActive: true,
        ramanActive: true,
        symmetryLabel: 'B₁',
        displacementVectors: [
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [-0.4, -0.4, 0.5],
          [-0.5, 0.1, 0.0],
          [0.4, -0.4, 0.5],
          [0.5, 0.1, 0.0],
        ],
        description: 'Symmetric and asymmetric stretching of the six terminal methyl hydrogens.',
      },
      {
        id: 'acetone-cc',
        name: 'Skeletal C-C-C Bending & Stretch',
        type: 'bend-scissor',
        wavenumber: 1222,
        transmittancePercent: 16,
        irActive: true,
        ramanActive: true,
        symmetryLabel: 'A₁',
        displacementVectors: [
          [0.0, 0.3, 0.0],
          [0.0, 0.0, 0.0],
          [0.4, -0.2, 0.0],
          [-0.4, -0.2, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
        ],
        description: 'Coupled C-C-C skeletal bending mode in the molecular plane.',
      },
    ],
    uvVis: {
      lambdaMaxNm: 279,
      molarAbsorptivity: 15,
      transitionType: 'n ➔ π* (Carbonyl lone pair)',
      solutionColor: 'rgba(255, 255, 255, 0.1)',
      absorptionColorName: 'Near-UV (279 nm)',
    },
    description: 'Prototypical aliphatic ketone featuring an exceptionally sharp and intense C=O stretching vibration at 1715 cm⁻¹ and a symmetry-forbidden n ➔ π* UV transition.',
    applications: ['Chemical solvent purity verification', 'Breathalyzer ketoacidosis detection', 'Polymer resin spectroscopy'],
  },

  // --- 4. ETHANOL (C2H5OH) ---
  {
    id: 'ethanol',
    name: 'Ethanol',
    formula: 'C₂H₅OH',
    systematicName: 'Ethanol',
    molecularWeight: 46.069,
    pointGroup: 'Cₛ',
    degreesOfFreedom: { translational: 3, rotational: 3, vibrational: 21 },
    atoms3D: [
      { element: 'C', z: 6, position: [-1.22, -0.25, 0.0], color: '#475569', radius: 0.35 },
      { element: 'C', z: 6, position: [0.0, 0.58, 0.0], color: '#475569', radius: 0.35 },
      { element: 'O', z: 8, position: [1.18, -0.22, 0.0], color: '#ef4444', radius: 0.38 },
      { element: 'H', z: 1, position: [1.95, 0.34, 0.0], color: '#ffffff', radius: 0.22 },
      { element: 'H', z: 1, position: [-2.08, 0.42, 0.0], color: '#ffffff', radius: 0.22 },
      { element: 'H', z: 1, position: [-1.26, -0.89, 0.89], color: '#ffffff', radius: 0.22 },
      { element: 'H', z: 1, position: [-1.26, -0.89, -0.89], color: '#ffffff', radius: 0.22 },
      { element: 'H', z: 1, position: [0.05, 1.22, 0.89], color: '#ffffff', radius: 0.22 },
      { element: 'H', z: 1, position: [0.05, 1.22, -0.89], color: '#ffffff', radius: 0.22 },
    ],
    bonds3D: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
      { from: 1, to: 8, order: 1 },
    ],
    modes: [
      {
        id: 'eth-oh',
        name: 'Hydrogen-Bonded O-H Stretch (Broad Band)',
        type: 'stretch-sym',
        wavenumber: 3350,
        transmittancePercent: 10,
        irActive: true,
        ramanActive: true,
        displacementVectors: [
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [-0.1, 0.05, 0.0],
          [0.65, -0.3, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
        ],
        description: 'Exceptionally broad, rounded absorption trough (~3200-3600 cm⁻¹) resulting from intermolecular hydrogen bonding distributions.',
      },
      {
        id: 'eth-co',
        name: 'C-O Single Bond Stretch',
        type: 'stretch-asym',
        wavenumber: 1050,
        transmittancePercent: 12,
        irActive: true,
        ramanActive: true,
        displacementVectors: [
          [0.0, 0.0, 0.0],
          [-0.3, 0.2, 0.0],
          [0.5, -0.3, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0],
        ],
        description: 'Strong primary alcohol C-O single bond stretching mode in the fingerprint region.',
      },
    ],
    uvVis: {
      lambdaMaxNm: 180,
      molarAbsorptivity: 300,
      transitionType: 'n ➔ σ*',
      solutionColor: 'rgba(255, 255, 255, 0.08)',
      absorptionColorName: 'Far-UV',
    },
    description: 'Archetypal alcohol displaying characteristic broad hydrogen-bonded O-H stretch and aliphatic C-H stretching vibrations.',
    applications: ['Fuel ethanol quality assay', 'Blood alcohol infrared spectrometry', 'Pharmaceutical solvent verification'],
  },

  // --- 5. POTASSIUM PERMANGANATE (KMnO4) - UV-VIS BENCHMARK ---
  {
    id: 'kmno4',
    name: 'Potassium Permanganate',
    formula: 'KMnO₄',
    systematicName: 'Potassium manganate(VII)',
    molecularWeight: 158.034,
    pointGroup: 'T_d (MnO₄⁻)',
    degreesOfFreedom: { translational: 3, rotational: 3, vibrational: 9 },
    atoms3D: [
      { element: 'Mn', z: 25, position: [0.0, 0.0, 0.0], color: '#9333ea', radius: 0.40 },
      { element: 'O', z: 8, position: [0.95, 0.95, 0.95], color: '#ef4444', radius: 0.35 },
      { element: 'O', z: 8, position: [-0.95, -0.95, 0.95], color: '#ef4444', radius: 0.35 },
      { element: 'O', z: 8, position: [-0.95, 0.95, -0.95], color: '#ef4444', radius: 0.35 },
      { element: 'O', z: 8, position: [0.95, -0.95, -0.95], color: '#ef4444', radius: 0.35 },
    ],
    bonds3D: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 },
      { from: 0, to: 3, order: 2 },
      { from: 0, to: 4, order: 2 },
    ],
    modes: [
      {
        id: 'kmno4-mno',
        name: 'Mn-O Tetrahedral Stretch',
        type: 'stretch-sym',
        wavenumber: 902,
        transmittancePercent: 8,
        irActive: true,
        ramanActive: true,
        displacementVectors: [
          [0.0, 0.0, 0.0],
          [0.4, 0.4, 0.4],
          [-0.4, -0.4, 0.4],
          [-0.4, 0.4, -0.4],
          [0.4, -0.4, -0.4],
        ],
        description: 'Vigorous tetrahedral Mn-O stretching mode of the permanganate oxyanion.',
      },
    ],
    uvVis: {
      lambdaMaxNm: 525,
      molarAbsorptivity: 2400, // Very strong!
      transitionType: 'Ligand-to-Metal Charge Transfer (LMCT: O²⁻ ➔ Mn⁷⁺)',
      solutionColor: '#9333ea', // Vivid Purple/Magenta
      absorptionColorName: 'Green Photons (525 nm absorbed -> Purple transmitted)',
    },
    description: 'Gold-standard spectrophotometry calibrator. Exhibits immense visible absorption at 525 nm driven by Laporte-allowed Ligand-to-Metal Charge Transfer (LMCT), imparting an intense purple hue.',
    applications: ['Spectrophotometer photometric calibration', 'Chemical oxygen demand (COD) water testing', 'Redox titrations'],
  },

  // --- 6. COPPER(II) SULFATE (CuSO4) - UV-VIS BENCHMARK ---
  {
    id: 'cuso4',
    name: 'Copper(II) Sulfate',
    formula: 'CuSO₄·5H₂O',
    systematicName: 'Copper(II) sulfate pentahydrate',
    molecularWeight: 249.68,
    pointGroup: 'D₄ₕ (Jahn-Teller)',
    degreesOfFreedom: { translational: 3, rotational: 3, vibrational: 12 },
    atoms3D: [
      { element: 'Cu', z: 29, position: [0.0, 0.0, 0.0], color: '#f97316', radius: 0.38 },
      { element: 'S', z: 16, position: [0.0, 0.0, 2.2], color: '#eab308', radius: 0.36 },
      { element: 'O', z: 8, position: [1.4, 0.0, 0.0], color: '#ef4444', radius: 0.32 },
      { element: 'O', z: 8, position: [-1.4, 0.0, 0.0], color: '#ef4444', radius: 0.32 },
      { element: 'O', z: 8, position: [0.0, 1.4, 0.0], color: '#ef4444', radius: 0.32 },
      { element: 'O', z: 8, position: [0.0, -1.4, 0.0], color: '#ef4444', radius: 0.32 },
    ],
    bonds3D: [
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 },
    ],
    modes: [
      {
        id: 'cuso4-so4',
        name: 'Sulfate Tetrahedral ν₃ Triplet',
        type: 'stretch-asym',
        wavenumber: 1120,
        transmittancePercent: 14,
        irActive: true,
        ramanActive: true,
        displacementVectors: [
          [0.0, 0.0, 0.0],
          [0.0, 0.0, 0.3],
          [0.3, 0.0, 0.0],
          [-0.3, 0.0, 0.0],
          [0.0, 0.3, 0.0],
          [0.0, -0.3, 0.0],
        ],
        description: 'Asymmetric stretching mode of coordinated sulfate anion split by coordination symmetry lowering.',
      },
    ],
    uvVis: {
      lambdaMaxNm: 810,
      molarAbsorptivity: 12.5,
      transitionType: 'd-d Ligand Field Transition (²B₁g ➔ ²B₂g Jahn-Teller)',
      solutionColor: '#0ea5e9', // Vivid Azure Blue
      absorptionColorName: 'Red/Near-IR (810 nm absorbed -> Cyan/Blue transmitted)',
    },
    description: 'Prototypical coordination compound exhibiting Jahn-Teller d⁹ electronic distortion. Absorbs strongly in the red/near-infrared, transmitting iconic sky-blue light.',
    applications: ['Beer-Lambert law educational verification', 'Electroplating bath copper concentration assay', 'Benedict test for reducing sugars'],
  },
]

export function getAllSpectroscopyMolecules(): SpectroscopyMolecule[] {
  return SPECTROSCOPY_MOLECULES
}

export function getSpectroscopyMoleculeById(id: string): SpectroscopyMolecule | undefined {
  return SPECTROSCOPY_MOLECULES.find((m) => m.id === id)
}
