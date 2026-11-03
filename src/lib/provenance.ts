/**
 * Provenance registry for ELEMENTA.
 *
 * Every dataset the app displays is registered here with publisher, version,
 * retrieval date, canonical URL and licence. Field-level provenance maps a
 * displayed value back to the dataset that produced it, so a reader can tell
 * a measured number from a derived one and cite the primary source.
 *
 * This file contains no physics: it is metadata only.
 */

export interface Dataset {
  id: string
  title: string
  publisher: string
  version: string
  retrieved: string
  url: string
  license: string
  note: string
}

export const APP_VERSION = '1.1.0'
export const DATA_RETRIEVED = '2026-11-03'

export const DATASETS: Dataset[] = [
  {
    id: 'iupac-aw',
    title: 'Standard atomic weights (abridged)',
    publisher: 'IUPAC Commission on Isotopic Abundances and Atomic Weights (CIAAW)',
    version: '2021 abridged table',
    retrieved: DATA_RETRIEVED,
    url: 'https://ciaaw.org/atomic-weights.htm',
    license: 'IUPAC terms of use - attribution requested',
    note: 'Interval values are retained for elements whose isotopic composition varies in nature. Elements with no stable isotope use the mass number of the longest-lived isotope in brackets.',
  },
  {
    id: 'nist-asd',
    title: 'Atomic Spectra Database (ASD) - lines and levels',
    publisher: 'National Institute of Standards and Technology (NIST)',
    version: 'ASD 5.12',
    retrieved: DATA_RETRIEVED,
    url: 'https://physics.nist.gov/asd',
    license: 'US Government work - public domain',
    note: 'The NIST tab is fetched live. In this repository the request is served by a Vite dev/preview middleware; a static deployment must provide its own reverse proxy or a cached snapshot.',
  },
  {
    id: 'nist-ion',
    title: 'Ionization energies',
    publisher: 'National Institute of Standards and Technology (NIST)',
    version: 'ASD 5.12',
    retrieved: DATA_RETRIEVED,
    url: 'https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html',
    license: 'US Government work - public domain',
    note: 'First ionization energies in eV. Values for superheavy elements are predictions.',
  },
  {
    id: 'crc',
    title: 'CRC Handbook of Chemistry and Physics',
    publisher: 'CRC Press',
    version: '104th edition (2023)',
    retrieved: DATA_RETRIEVED,
    url: 'https://hbcp.chemnetbase.com/',
    license: 'Reference use - individual values reproduced for identification',
    note: 'Pauling electronegativity, empirical atomic radii, phase-change temperatures, density at STP and common oxidation states.',
  },
  {
    id: 'codata',
    title: 'CODATA 2022 recommended values of the fundamental physical constants',
    publisher: 'NIST / CODATA Task Group on Fundamental Constants',
    version: '2022 adjustment',
    retrieved: DATA_RETRIEVED,
    url: 'https://physics.nist.gov/cuu/Constants/',
    license: 'US Government work - public domain',
    note: 'Used for the Rydberg constant, hc conversion, Hartree energy and the unit conversions shown in the constants panel.',
  },
  {
    id: 'iaea',
    title: 'LiveChart of Nuclides - ground states (ENSDF)',
    publisher: 'IAEA Nuclear Data Services',
    version: 'ENSDF cut-off 2023-10-18',
    retrieved: DATA_RETRIEVED,
    url: 'https://nds.iaea.org/relnsd/vcharthtml/VChartHTML.html',
    license: 'IAEA terms of use - attribution requested',
    note: 'Half-lives, decay modes and branches, natural abundances, spin-parity and discovery years for 3000+ ground states.',
  },
  {
    id: 'ame',
    title: 'Atomic Mass Evaluation 2020 (AME2020)',
    publisher: 'Atomic Mass Data Center (AMDC)',
    version: 'AME2020',
    retrieved: DATA_RETRIEVED,
    url: 'https://amdc.impcas.ac.cn/',
    license: 'Academic citation requested',
    note: 'Atomic mass excesses in keV, used to recompute decay Q values and atomic masses on the fly.',
  },
  {
    id: 'origins',
    title: 'Solar-system nucleosynthesis shares',
    publisher: 'J. Johnson (SDSS), digitised for ELEMENTA',
    version: '2019 chart digitisation',
    retrieved: DATA_RETRIEVED,
    url: 'https://www.sdss.org/',
    license: 'Digitised shares - reading uncertainty of a few percent',
    note: 'Percentages by nucleosynthesis channel are approximate readings of the published chart, not a primary abundance table.',
  },
  {
    id: 'elementa',
    title: 'ELEMENTA derived fields',
    publisher: 'ELEMENTA',
    version: APP_VERSION,
    retrieved: DATA_RETRIEVED,
    url: './references.html',
    license: 'Application code and derived values - see repository licence',
    note: 'Shell populations, Bohr valence counts, trend percentiles, summaries, view hashes and model-tier labels are computed or curated by this application. They are not primary measurements.',
  },
]

export const DATASET_MAP: Record<string, Dataset> = Object.fromEntries(
  DATASETS.map((dataset) => [dataset.id, dataset]),
)

/**
 * Field -> dataset mapping. `method` states what was actually measured or how
 * the displayed quantity was derived.
 */
export const FIELD_SOURCES: Record<string, { dataset: string; method: string }> = {
  mass: { dataset: 'iupac-aw', method: 'standard atomic weight (interval values preserved)' },
  config: { dataset: 'iupac-aw', method: 'experimental ground-state electron configuration, noble-gas shorthand' },
  shells: { dataset: 'elementa', method: 'electron count per shell derived from the configuration' },
  electronegativity: { dataset: 'crc', method: 'Pauling scale' },
  ionizationEnergy: { dataset: 'nist-ion', method: 'first ionization energy' },
  electronAffinity: { dataset: 'crc', method: 'electron affinity' },
  atomicRadius: { dataset: 'crc', method: 'empirical radius (calculated for noble gases)' },
  meltingPoint: { dataset: 'crc', method: 'melting point at standard pressure' },
  boilingPoint: { dataset: 'crc', method: 'boiling point at standard pressure' },
  density: { dataset: 'crc', method: 'density at STP' },
  oxidationStates: { dataset: 'crc', method: 'common oxidation states' },
  phase: { dataset: 'crc', method: 'phase at 298.15 K and 100 kPa; predicted for superheavy elements' },
  discoveredYear: { dataset: 'iupac-aw', method: 'year of first reported discovery' },
  discoveredBy: { dataset: 'iupac-aw', method: 'credited discoverer(s)' },
  summary: { dataset: 'elementa', method: 'curated editorial summary' },
  halfLife: { dataset: 'iaea', method: 'evaluated ground-state half-life' },
  decayModes: { dataset: 'iaea', method: 'evaluated decay modes and branching percentages' },
  abundance: { dataset: 'iaea', method: 'natural isotopic abundance' },
  spinParity: { dataset: 'iaea', method: 'ground-state spin-parity' },
  qValue: { dataset: 'ame', method: 'recomputed from atomic mass excesses (daughter must be known)' },
  origin: { dataset: 'origins', method: 'digitised solar-system abundance share by channel' },
  spectrum: { dataset: 'nist-asd', method: 'observed wavelengths and relative intensities' },
  constants: { dataset: 'codata', method: 'CODATA 2022 recommended value' },
}

export function datasetFor(field: string): Dataset | undefined {
  const entry = FIELD_SOURCES[field]
  return entry ? DATASET_MAP[entry.dataset] : undefined
}

export function methodFor(field: string): string {
  return FIELD_SOURCES[field]?.method ?? 'no method recorded'
}

/** One-line source string for a native tooltip. */
export function sourceLine(field: string): string {
  const dataset = datasetFor(field)
  if (!dataset) return 'Source not recorded'
  return `${dataset.publisher} - ${dataset.title} (${dataset.version}) - retrieved ${dataset.retrieved} - ${dataset.url}`
}

/* ------------------------------------------------------------------ */
/* Uncertainties                                                       */
/* ------------------------------------------------------------------ */

/**
 * IUPAC CIAAW 2021 interval atomic weights (u). Elements whose isotopic
 * composition varies in natural materials have no single standard atomic
 * weight; displaying one number would be false precision.
 */
export const MASS_INTERVALS: Record<number, [number, number]> = {
  1: [1.00784, 1.00811],
  3: [6.938, 6.997],
  5: [10.806, 10.821],
  6: [12.0096, 12.0116],
  7: [14.00643, 14.00728],
  8: [15.99903, 15.99977],
  17: [35.446, 35.457],
  35: [79.901, 79.907],
  81: [204.382, 204.385],
}

export function massInterval(z: number): [number, number] | null {
  return MASS_INTERVALS[z] ?? null
}

/** Display label for the atomic mass, preserving interval weights. */
export function massLabel(z: number, fallback: number): string {
  const interval = MASS_INTERVALS[z]
  if (!interval) return `${fallback} u`
  const low = interval[0]
  const high = interval[1]
  return `[${low}-${high}] u`
}

/** Source-specific uncertainty note for a value shown in the UI. */
export function uncertaintyNote(field: string): string | null {
  if (field === 'mass') {
    return 'Interval weights (IUPAC) are shown as [low-high]; a single number would be false precision.'
  }
  if (field === 'halfLife') {
    return 'Half-lives carry asymmetric experimental uncertainties; values quoted with < or > are limits, not measurements.'
  }
  if (field === 'ionizationEnergy' || field === 'electronAffinity') {
    return 'Experimental uncertainties are typically 1e-3 to 1e-2 eV (or a few kJ/mol) and are not shown individually.'
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Model tiers                                                         */
/* ------------------------------------------------------------------ */

export type ModelTier = 'measured' | 'derived' | 'theoretical' | 'pedagogical' | 'predicted'

export interface TierMeta {
  label: string
  color: string
  description: string
}

export const TIER_META: Record<ModelTier, TierMeta> = {
  measured: { label: 'measured', color: '#34d399', description: 'Direct experimental measurement from an evaluated primary dataset.' },
  derived: { label: 'derived', color: '#38bdf8', description: 'Computed from measured values; the model and its inputs are stated.' },
  theoretical: { label: 'theoretical', color: '#a78bfa', description: 'Exact solution of a stated physical model. Not a measurement.' },
  pedagogical: { label: 'pedagogical', color: '#fbbf24', description: 'Simplified teaching model - qualitatively useful, not quantitatively reliable.' },
  predicted: { label: 'predicted', color: '#fb7185', description: 'Extrapolated or calculated without a direct measurement.' },
}

export type ModelKey = '2d' | '3d' | 'qm' | 'spectra' | 'crystal' | 'isotope' | 'bohr-shells'

export const MODEL_TIERS: Record<ModelKey, { tier: ModelTier; note: string }> = {
  '2d': { tier: 'pedagogical', note: 'Bohr shell diagram: fixed circular orbits and shell populations from the configuration. Not a quantum-mechanical orbital picture.' },
  '3d': { tier: 'pedagogical', note: '3D Bohr shell animation - the same caveats as the 2D diagram.' },
  qm: { tier: 'pedagogical', note: 'Hydrogenic |psi|^2 isosurface with a single Slater Zeff. Exact for one-electron ions; qualitative for many-electron atoms.' },
  spectra: { tier: 'theoretical', note: 'Non-relativistic Rydberg model for the hydrogen-like ion X^(Z-1)+. No fine structure, no multi-electron screening - compare with NIST only for H I, He II and Li III.' },
  crystal: { tier: 'pedagogical', note: 'Idealised unit cell drawn from lattice parameters. Not a relaxed structure and not a diffraction refinement.' },
  isotope: { tier: 'measured', note: 'ENSDF ground-state evaluations via IAEA LiveChart. Q values are recomputed from AME2020 mass excesses.' },
  'bohr-shells': { tier: 'derived', note: 'Shell electron counts are derived from the experimental configuration; the drawing style is pedagogical.' },
}

/** Superheavy elements (Z >= 104) have largely predicted chemistry. */
export function elementTier(z: number): ModelTier {
  return z >= 104 ? 'predicted' : 'measured'
}
