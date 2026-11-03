/**
 * Stellar Nucleosynthesis & Cosmic Origins Engine
 *
 * Models:
 * 1. Big Bang Nucleosynthesis (BBN)
 * 2. Thermonuclear Burning Stages: pp-chain, CNO cycle, Triple-Alpha, C/Ne/O/Si burning
 * 3. Neutron Capture Processes: s-process (slow) vs. r-process (rapid kilonovae)
 * 4. Cosmic Elemental Abundances (Lodders 2009 / Solar System standard Si = 10^6)
 * 5. Gamow Peak & Thermonuclear Penetration Probabilities
 * 6. Astronomical Origin Decomposition for Elements Z = 1 to 94
 */

export type BurningStageId =
  | 'bbn'
  | 'pp_chain'
  | 'cno_cycle'
  | 'triple_alpha'
  | 'carbon_burning'
  | 'neon_burning'
  | 'oxygen_burning'
  | 'silicon_burning'

export interface NuclearReactionStep {
  equation: string
  reactants: string
  products: string
  qMev: number
  notes?: string
}

export interface BurningStage {
  id: BurningStageId
  name: string
  short: string
  site: string
  temperatureMK: number // Million Kelvin (10^6 K)
  densityGcm3: number // g / cm^3
  primaryFuel: string
  ash: string
  qNetMev: number
  neutrinoLossMev: number
  powerLawT: string // e.g. "T^4" or "T^17"
  typicalDuration: string
  description: string
  reactions: NuclearReactionStep[]
}

export const BURNING_STAGES: BurningStage[] = [
  {
    id: 'bbn',
    name: 'Big Bang Nucleosynthesis',
    short: 'BBN',
    site: 'Expanding Early Universe (t = 10s to 20m after Big Bang)',
    temperatureMK: 1000,
    densityGcm3: 0.0001,
    primaryFuel: 'Free Protons & Neutrons',
    ash: '⁴He (25% mass), ²H (0.01%), ³He, ⁷Li (trace)',
    qNetMev: 28.3,
    neutrinoLossMev: 0,
    powerLawT: 'T³ (Hubble expansion)',
    typicalDuration: '~20 minutes (freeze-out)',
    description:
      'In the first twenty minutes of the universe, cosmic expansion cooled the plasma enough for deuterons to survive photodisintegration ("deuterium bottleneck" at T ~ 0.8 GK). Nearly all free neutrons bound into helium-4 nuclei, creating the primordial 75% H / 25% ⁴He cosmic baseline with trace deuterium and lithium-7.',
    reactions: [
      { equation: 'n + p → ²H + γ', reactants: 'n, p', products: '²H', qMev: 2.225, notes: 'Deuterium formation bottleneck' },
      { equation: '²H + p → ³He + γ', reactants: '²H, p', products: '³He', qMev: 5.493, notes: 'Helium-3 radiative capture' },
      { equation: '²H + ²H → ³H + p', reactants: '²H, ²H', products: '³H, p', qMev: 4.033, notes: 'Tritium formation' },
      { equation: '³H + ²H → ⁴He + n', reactants: '³H, ²H', products: '⁴He, n', qMev: 17.589, notes: 'Main helium-4 synthesis' },
      { equation: '³He + ⁴He → ⁷Be + γ', reactants: '³He, ⁴He', products: '⁷Be', qMev: 1.586, notes: 'Beryllium-7 pathway' },
      { equation: '⁷Be + e⁻ → ⁷Li + νₑ', reactants: '⁷Be, e⁻', products: '⁷Li, νₑ', qMev: 0.862, notes: 'Primordial Lithium-7' },
    ],
  },
  {
    id: 'pp_chain',
    name: 'Proton-Proton Chain (pp-I, pp-II, pp-III)',
    short: 'pp-Chain',
    site: 'Low-Mass Main Sequence Stars (M ≤ 1.3 M☉, e.g. Sun)',
    temperatureMK: 15.7,
    densityGcm3: 150,
    primaryFuel: '¹H (Protons)',
    ash: '⁴He + 2e⁺ + 2νₑ',
    qNetMev: 26.73,
    neutrinoLossMev: 0.52,
    powerLawT: 'T⁴',
    typicalDuration: '~10 billion years',
    description:
      'Primary hydrogen fusion engine for solar-type stars. Begins with the extremely rare weak-force diproton beta decay into deuterium. The three branches (pp-I, pp-II, pp-III) all convert 4 protons into 1 helium-4 nucleus, yielding 26.73 MeV of nuclear binding energy with mild temperature sensitivity.',
    reactions: [
      { equation: 'p + p → ²H + e⁺ + νₑ', reactants: 'p, p', products: '²H, e⁺, νₑ', qMev: 1.442, notes: 'Weak-force rate bottleneck (~10¹⁰ yr per proton)' },
      { equation: '²H + p → ³He + γ', reactants: '²H, p', products: '³He, γ', qMev: 5.493, notes: 'Occurs within ~1 second of deuteration' },
      { equation: '³He + ³He → ⁴He + 2p', reactants: '³He, ³He', products: '⁴He, 2p', qMev: 12.86, notes: 'pp-I branch (~85% solar frequency)' },
      { equation: '³He + ⁴He → ⁷Be + γ', reactants: '³He, ⁴He', products: '⁷Be', qMev: 1.586, notes: 'pp-II / pp-III branch point (~15%)' },
      { equation: '⁷Be + e⁻ → ⁷Li + νₑ', reactants: '⁷Be, e⁻', products: '⁷Li, νₑ', qMev: 0.862, notes: 'pp-II electron capture (0.86 MeV monoenergetic ν)' },
      { equation: '⁷Li + p → 2 ⁴He', reactants: '⁷Li, p', products: '2 ⁴He', qMev: 17.348, notes: 'pp-II terminal alpha break' },
      { equation: '⁷Be + p → ⁸B + γ', reactants: '⁷Be, p', products: '⁸B', qMev: 0.137, notes: 'pp-III branch (0.02% solar frequency)' },
      { equation: '⁸B → ⁸Be* + e⁺ + νₑ → 2 ⁴He', reactants: '⁸B', products: '2 ⁴He, e⁺, νₑ', qMev: 18.074, notes: 'High-energy solar neutrinos (up to 14 MeV)' },
    ],
  },
  {
    id: 'cno_cycle',
    name: 'CNO Catalytic Cycle',
    short: 'CNO Cycle',
    site: 'Intermediate & Massive Stars (M > 1.3 M☉, Sirius, Vega)',
    temperatureMK: 28,
    densityGcm3: 60,
    primaryFuel: '¹H (Protons)',
    ash: '⁴He (Catalysts: ¹²C, ¹³C, ¹⁴N, ¹⁵N)',
    qNetMev: 26.73,
    neutrinoLossMev: 1.71,
    powerLawT: 'T¹⁷',
    typicalDuration: '100 million – 1 billion years',
    description:
      'Catalytic hydrogen fusion dominating above 16 MK. Carbon, nitrogen, and oxygen isotopes act as nuclear catalysts that absorb 4 protons and spit out an alpha particle. Because of the higher Coulomb barrier of Z=6 and Z=7, the cycle has steep temperature dependence (ε ∝ T¹⁷), leading to convective stellar cores.',
    reactions: [
      { equation: '¹²C + p → ¹³N + γ', reactants: '¹²C, p', products: '¹³N', qMev: 1.944, notes: 'Initial proton capture on carbon-12' },
      { equation: '¹³N → ¹³C + e⁺ + νₑ', reactants: '¹³N', products: '¹³C, e⁺, νₑ', qMev: 2.221, notes: 'Beta decay (t½ = 9.965 min)' },
      { equation: '¹³C + p → ¹⁴N + γ', reactants: '¹³C, p', products: '¹⁴N', qMev: 7.551, notes: 'Production of abundant nitrogen-14' },
      { equation: '¹⁴N + p → ¹⁵O + γ', reactants: '¹⁴N, p', products: '¹⁵O', qMev: 7.297, notes: 'Slowest reaction rate — CNO bottleneck!' },
      { equation: '¹⁵O → ¹⁵N + e⁺ + νₑ', reactants: '¹⁵O', products: '¹⁵N, e⁺, νₑ', qMev: 2.754, notes: 'Beta decay (t½ = 122 seconds)' },
      { equation: '¹⁵N + p → ¹²C + ⁴He', reactants: '¹⁵N, p', products: '¹²C, ⁴He', qMev: 4.966, notes: 'Alpha emission restores ¹²C catalyst (99.96%)' },
    ],
  },
  {
    id: 'triple_alpha',
    name: 'Triple-Alpha & Alpha-Capture',
    short: 'Triple-α',
    site: 'Red Giant Helium Core Burning & Horizontal Branch',
    temperatureMK: 120,
    densityGcm3: 100000,
    primaryFuel: '⁴He (Alpha Particles)',
    ash: '¹²C, ¹⁶O',
    qNetMev: 7.275,
    neutrinoLossMev: 0,
    powerLawT: 'T⁴⁰',
    typicalDuration: '10 – 100 million years',
    description:
      'Solves the "mass-5 and mass-8 gap" in nucleosynthesis. Two alpha particles fuse into unbound ⁸Be (half-life 8×10⁻¹⁷ s). Before it disintegrates, a third alpha strikes it, populating the 7.654 MeV excited 0⁺ "Hoyle State" resonance in ¹²C, which de-excites to the ground state. Subsequent alpha capture produces oxygen-16.',
    reactions: [
      { equation: '2 ⁴He ⇌ ⁸Be', reactants: '2 ⁴He', products: '⁸Be', qMev: -0.0918, notes: 'Unstable endothermic resonance (t½ = 8.19×10⁻¹⁷ s)' },
      { equation: '⁸Be + ⁴He ⇌ ¹²C*(7.65 MeV) → ¹²C + 2γ', reactants: '⁸Be, ⁴He', products: '¹²C', qMev: 7.367, notes: 'Fred Hoyle anthropic resonance state' },
      { equation: '¹²C + ⁴He → ¹⁶O + γ', reactants: '¹²C, ⁴He', products: '¹⁶O', qMev: 7.162, notes: 'Secondary alpha capture yielding cosmic oxygen' },
    ],
  },
  {
    id: 'carbon_burning',
    name: 'Carbon Core Burning',
    short: 'C-Burning',
    site: 'Massive Star Cores (M > 8 M☉)',
    temperatureMK: 700,
    densityGcm3: 200000,
    primaryFuel: '¹²C',
    ash: '²⁰Ne, ²⁴Mg, ²³Na, ²³Mg',
    qNetMev: 4.62,
    neutrinoLossMev: 0.1,
    powerLawT: 'T²⁶',
    typicalDuration: '~1,000 years',
    description:
      'Occurs after helium core exhaustion when gravity contracts the carbon-oxygen core to 700 million Kelvin. Coulomb barrier between Z=6 carbon nuclei requires enormous kinetic energies, producing neon, sodium, and magnesium with prompt proton and alpha emission.',
    reactions: [
      { equation: '¹²C + ¹²C → ²⁰Ne + ⁴He', reactants: '2 ¹²C', products: '²⁰Ne, ⁴He', qMev: 4.617, notes: 'Alpha branch (~50% branching ratio)' },
      { equation: '¹²C + ¹²C → ²³Na + p', reactants: '2 ¹²C', products: '²³Na, p', qMev: 2.241, notes: 'Proton branch (~50% branching ratio)' },
      { equation: '¹²C + ¹²C → ²³Mg + n', reactants: '2 ¹²C', products: '²³Mg, n', qMev: -2.599, notes: 'Endothermic neutron source for s-process' },
    ],
  },
  {
    id: 'neon_burning',
    name: 'Neon Photodisintegration & Burning',
    short: 'Ne-Burning',
    site: 'Massive Star Cores (M > 8 M☉)',
    temperatureMK: 1400,
    densityGcm3: 4000000,
    primaryFuel: '²⁰Ne',
    ash: '¹⁶O, ²⁴Mg, ²⁸Si',
    qNetMev: 4.58,
    neutrinoLossMev: 0.2,
    powerLawT: 'T²⁸',
    typicalDuration: '~3 years',
    description:
      'High-energy Planck thermal photons at 1.4 billion Kelvin begin tearing apart ²⁰Ne nuclei by photodisintegration (²⁰Ne + γ → ¹⁶O + α). The released alpha particles immediately fuse with remaining ²⁰Ne to form ²⁴Mg, followed by ²⁴Mg(α,γ)²⁸Si.',
    reactions: [
      { equation: '²⁰Ne + γ → ¹⁶O + ⁴He', reactants: '²⁰Ne, γ', products: '¹⁶O, ⁴He', qMev: -4.73, notes: 'Endothermic photodisintegration' },
      { equation: '²⁰Ne + ⁴He → ²⁴Mg + γ', reactants: '²⁰Ne, ⁴He', products: '²⁴Mg', qMev: 9.317, notes: 'Exothermic capture of liberated alpha' },
      { equation: '²⁴Mg + ⁴He → ²⁸Si + γ', reactants: '²⁴Mg, ⁴He', products: '²⁸Si', qMev: 9.984, notes: 'Production of silicon core seed' },
    ],
  },
  {
    id: 'oxygen_burning',
    name: 'Oxygen Core Burning',
    short: 'O-Burning',
    site: 'Massive Star Cores (M > 8 M☉)',
    temperatureMK: 2000,
    densityGcm3: 10000000,
    primaryFuel: '¹⁶O',
    ash: '²⁸Si, ³²S, ³¹P',
    qNetMev: 16.54,
    neutrinoLossMev: 1.2,
    powerLawT: 'T³²',
    typicalDuration: '~6 months',
    description:
      'Two oxygen-16 nuclei fuse at 2 billion Kelvin. Pair-production neutrino cooling begins draining enormous thermal energy directly from the core, accelerating the stellar life cycle toward catastrophic collapse.',
    reactions: [
      { equation: '¹⁶O + ¹⁶O → ²⁸Si + ⁴He', reactants: '2 ¹⁶O', products: '²⁸Si, ⁴He', qMev: 9.594, notes: 'Dominant silicon channel (~60%)' },
      { equation: '¹⁶O + ¹⁶O → ³¹P + p', reactants: '2 ¹⁶O', products: '³¹P, p', qMev: 7.678, notes: 'Phosphorus channel (~35%)' },
      { equation: '¹⁶O + ¹⁶O → ³²S + γ', reactants: '2 ¹⁶O', products: '³²S', qMev: 16.54, notes: 'Direct sulfur radiative capture' },
    ],
  },
  {
    id: 'silicon_burning',
    name: 'Silicon Burning & Nuclear Statistical Equilibrium',
    short: 'Si-Burning',
    site: 'Pre-Supernova Onion Core (M > 8 M☉)',
    temperatureMK: 3600,
    densityGcm3: 30000000,
    primaryFuel: '²⁸Si',
    ash: '⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe (Iron Peak)',
    qNetMev: 10.92,
    neutrinoLossMev: 4.5,
    powerLawT: 'T⁴⁵',
    typicalDuration: '~1 day',
    description:
      'The final stage before core collapse. At 3.6 billion Kelvin, photodisintegration dismantles some ²⁸Si into free nucleons and alphas, which are captured by other silicon nuclei in an alpha-ladder sequence: ²⁸Si → ³²S → ³⁶Ar → ⁴⁰Ca → ⁴⁴Ti → ⁴⁸Cr → ⁵²Fe → ⁵⁶Ni. Nickel-56 has the highest binding energy per nucleon compatible with alpha balance, terminating fusion.',
    reactions: [
      { equation: '²⁸Si + γ ⇌ 7 ⁴He', reactants: '²⁸Si, γ', products: '7 ⁴He', qMev: -38.0, notes: 'Alpha pool generation' },
      { equation: '²⁸Si + ⁴He → ³²S + γ', reactants: '²⁸Si, ⁴He', products: '³²S', qMev: 6.948, notes: 'Alpha ladder step 1' },
      { equation: '³²S + ⁴He → ³⁶Ar + γ', reactants: '³²S, ⁴He', products: '³⁶Ar', qMev: 6.641, notes: 'Alpha ladder step 2' },
      { equation: '³⁶Ar + ⁴He → ⁴⁰Ca + γ', reactants: '³⁶Ar, ⁴He', products: '⁴⁰Ca', qMev: 7.04, notes: 'Doubly magic Calcium-40' },
      { equation: '⁴⁰Ca + ⁴He → ⁴⁴Ti + γ', reactants: '⁴⁰Ca, ⁴He', products: '⁴⁴Ti', qMev: 5.127, notes: 'Titanium-44 synthesis' },
      { equation: '⁴⁴Ti + ⁴He → ⁴⁸Cr + γ', reactants: '⁴⁴Ti, ⁴He', products: '⁴⁸Cr', qMev: 7.7, notes: 'Chromium-48 synthesis' },
      { equation: '⁴⁸Cr + ⁴He → ⁵²Fe + γ', reactants: '⁴⁸Cr, ⁴He', products: '⁵²Fe', qMev: 7.94, notes: 'Iron-52 synthesis' },
      { equation: '⁵²Fe + ⁴He → ⁵⁶Ni + γ', reactants: '⁵²Fe, ⁴He', products: '⁵⁶Ni', qMev: 8.001, notes: 'Doubly magic Nickel-56 (t½ 6.07d → ⁵⁶Co → ⁵⁶Fe)' },
    ],
  },
]

export interface NeutronCaptureProcess {
  id: 's_process' | 'r_process' | 'p_process'
  name: string
  timescaleRelation: string
  neutronDensityCm3: string
  sites: string[]
  keyPeaksA: number[]
  terminalElement: string
  description: string
  characteristicNuclides: string[]
}

export const NEUTRON_CAPTURE_PROCESSES: NeutronCaptureProcess[] = [
  {
    id: 's_process',
    name: 's-Process (Slow Neutron Capture)',
    timescaleRelation: 'τ_n (years) >> τ_β (days)',
    neutronDensityCm3: '10⁷ – 10¹¹ cm⁻³',
    sites: [
      'Thermal pulses in Asymptotic Giant Branch (AGB) stars (¹³C(α,n)¹⁶O pocket)',
      'Core helium / carbon burning in massive stars (²²Ne(α,n)²⁵Mg)',
    ],
    keyPeaksA: [88, 138, 208],
    terminalElement: '²⁰⁹Bi (Bismuth-209)',
    description:
      'Because neutron captures take decades to millennia per nucleus, any beta-unstable isotope decays before capturing another neutron. The s-process strictly adheres to the "valley of beta stability". It builds up large abundance peaks at closed neutron shells (N = 50, 82, 126: Sr, Ba, Pb). It terminates at ²⁰⁹Bi because ²¹⁰Bi decays to ²¹⁰Po, which alpha-decays back to ²⁰⁶Pb.',
    characteristicNuclides: ['⁸⁸Sr', '⁸⁹Y', '⁹⁰Zr', '¹³⁸Ba', '¹³⁹La', '¹⁴⁰Ce', '²⁰⁸Pb', '²⁰⁹Bi'],
  },
  {
    id: 'r_process',
    name: 'r-Process (Rapid Neutron Capture)',
    timescaleRelation: 'τ_n (ms) << τ_β (seconds)',
    neutronDensityCm3: '10²⁰ – 10²⁴ cm⁻³',
    sites: [
      'Binary Neutron Star Mergers (Kilonovae, e.g. GW170817)',
      'Magneto-rotational Core-Collapse Supernovae (Collapsars)',
    ],
    keyPeaksA: [80, 130, 195],
    terminalElement: 'Actinides (²³²Th, ²³⁵U, ²³⁸U) up to A ~ 270 (Fission Recycling)',
    description:
      'Neutron capture occurs in milliseconds, much faster than beta decay. An intense neutron flood pushes nuclei all the way out to the neutron drip line until an (n,γ) ⇌ (γ,n) equilibrium halts capture. When the neutron flux ceases, the hyper-neutron-rich matter undergoes cascades of beta decays back toward stability, producing characteristic peaks at A ~ 80, 130, and 195 (Gold, Platinum), as well as all cosmic Thorium and Uranium.',
    characteristicNuclides: ['⁸⁰Se', '¹²⁹Xe', '¹³⁰Te', '¹⁵³Eu', '¹⁹⁵Pt', '¹⁹⁷Au', '²³²Th', '²³⁵U', '²³⁸U'],
  },
  {
    id: 'p_process',
    name: 'p-Process (Photodisintegration / γ-Process)',
    timescaleRelation: 'Photodisintegration in seconds',
    neutronDensityCm3: 'Negligible (Photon flux dominant)',
    sites: ['Shocked O/Ne shells in Type II Supernovae', 'Type Ia Supernova explosions'],
    keyPeaksA: [92, 144, 180],
    terminalElement: '¹⁹⁶Hg',
    description:
      'Synthesizes rare proton-rich stable nuclides shielded from s- and r-process beta decays by stable isobars. Intense gamma-ray baths at 2–3 GK knock neutrons out of pre-existing heavy seed nuclei via (γ,n), (γ,p), and (γ,α) reactions.',
    characteristicNuclides: ['⁷⁴Se', '⁷⁸Kr', '⁸⁴Sr', '⁹²Mo', '⁹⁶Ru', '¹⁴⁴Sm', '¹⁸⁰ᵐTa', '¹⁹⁶Hg'],
  },
]

export interface CosmicAbundanceEntry {
  z: number
  symbol: string
  name: string
  logAbundance: number // log10(N), normalized to log10(N_Si) = 6.00
  linearPer10kSi: number
  primaryOrigin: string
  origins: {
    bbn: number // Big Bang %
    spallation: number // Cosmic ray spallation %
    lowMassStars: number // AGB / s-process %
    explodingMassive: number // Core collapse SN Type II %
    explodingWhiteDwarf: number // Type Ia SN %
    neutronStarMergers: number // r-process kilonovae %
  }
}

/**
 * Solar System Cosmic Abundances (Lodders 2009 & Asplund et al.)
 * Normalized to log10(N_Si) = 6.00 (i.e. Si = 1,000,000 atoms).
 * Includes elemental astrophysical origin decomposition (Johnson 2019 / ESA / NASA consensus).
 */
export const COSMIC_ABUNDANCES: Record<number, CosmicAbundanceEntry> = {
  1: {
    z: 1,
    symbol: 'H',
    name: 'Hydrogen',
    logAbundance: 10.45,
    linearPer10kSi: 2.8e8,
    primaryOrigin: 'Big Bang Nucleosynthesis (100%)',
    origins: { bbn: 100, spallation: 0, lowMassStars: 0, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  2: {
    z: 2,
    symbol: 'He',
    name: 'Helium',
    logAbundance: 9.47,
    linearPer10kSi: 2.95e7,
    primaryOrigin: 'Big Bang (85%) / Low-Mass Stars (15%)',
    origins: { bbn: 85, spallation: 0, lowMassStars: 15, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  3: {
    z: 3,
    symbol: 'Li',
    name: 'Lithium',
    logAbundance: 1.54,
    linearPer10kSi: 3.5e-1,
    primaryOrigin: 'Cosmic Ray Spallation (70%) / BBN (15%) / Low-Mass (15%)',
    origins: { bbn: 15, spallation: 70, lowMassStars: 15, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  4: {
    z: 4,
    symbol: 'Be',
    name: 'Beryllium',
    logAbundance: 0.18,
    linearPer10kSi: 1.5e-2,
    primaryOrigin: 'Cosmic Ray Spallation (100%)',
    origins: { bbn: 0, spallation: 100, lowMassStars: 0, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  5: {
    z: 5,
    symbol: 'B',
    name: 'Boron',
    logAbundance: 0.88,
    linearPer10kSi: 7.6e-2,
    primaryOrigin: 'Cosmic Ray Spallation (100%)',
    origins: { bbn: 0, spallation: 100, lowMassStars: 0, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  6: {
    z: 6,
    symbol: 'C',
    name: 'Carbon',
    logAbundance: 7.39,
    linearPer10kSi: 245000,
    primaryOrigin: 'Dying Low-Mass Stars (55%) / Massive Stars (45%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 55, explodingMassive: 45, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  7: {
    z: 7,
    symbol: 'N',
    name: 'Nitrogen',
    logAbundance: 6.83,
    linearPer10kSi: 67600,
    primaryOrigin: 'Dying Low-Mass Stars (85%) / Massive Stars (15%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 85, explodingMassive: 15, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  8: {
    z: 8,
    symbol: 'O',
    name: 'Oxygen',
    logAbundance: 7.69,
    linearPer10kSi: 490000,
    primaryOrigin: 'Exploding Massive Stars (90%) / Low-Mass (10%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 10, explodingMassive: 90, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  9: {
    z: 9,
    symbol: 'F',
    name: 'Fluorine',
    logAbundance: 3.48,
    linearPer10kSi: 30.2,
    primaryOrigin: 'Dying Low-Mass Stars (60%) / Massive Stars (40%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 60, explodingMassive: 40, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  10: {
    z: 10,
    symbol: 'Ne',
    name: 'Neon',
    logAbundance: 6.95,
    linearPer10kSi: 89100,
    primaryOrigin: 'Exploding Massive Stars (85%) / White Dwarfs (15%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 85, explodingWhiteDwarf: 15, neutronStarMergers: 0 },
  },
  11: {
    z: 11,
    symbol: 'Na',
    name: 'Sodium',
    logAbundance: 5.31,
    linearPer10kSi: 2040,
    primaryOrigin: 'Exploding Massive Stars (70%) / Dying Low-Mass (30%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 30, explodingMassive: 70, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  12: {
    z: 12,
    symbol: 'Mg',
    name: 'Magnesium',
    logAbundance: 6.55,
    linearPer10kSi: 35500,
    primaryOrigin: 'Exploding Massive Stars (85%) / White Dwarfs (15%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 85, explodingWhiteDwarf: 15, neutronStarMergers: 0 },
  },
  13: {
    z: 13,
    symbol: 'Al',
    name: 'Aluminum',
    logAbundance: 5.43,
    linearPer10kSi: 2690,
    primaryOrigin: 'Exploding Massive Stars (85%) / Dying Low-Mass (15%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 15, explodingMassive: 85, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  14: {
    z: 14,
    symbol: 'Si',
    name: 'Silicon',
    logAbundance: 6.00,
    linearPer10kSi: 10000,
    primaryOrigin: 'Exploding Massive Stars (65%) / Exploding White Dwarfs (35%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 65, explodingWhiteDwarf: 35, neutronStarMergers: 0 },
  },
  15: {
    z: 15,
    symbol: 'P',
    name: 'Phosphorus',
    logAbundance: 4.41,
    linearPer10kSi: 257,
    primaryOrigin: 'Exploding Massive Stars (75%) / Exploding White Dwarfs (25%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 75, explodingWhiteDwarf: 25, neutronStarMergers: 0 },
  },
  16: {
    z: 16,
    symbol: 'S',
    name: 'Sulfur',
    logAbundance: 5.67,
    linearPer10kSi: 4680,
    primaryOrigin: 'Exploding Massive Stars (60%) / Exploding White Dwarfs (40%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 60, explodingWhiteDwarf: 40, neutronStarMergers: 0 },
  },
  17: {
    z: 17,
    symbol: 'Cl',
    name: 'Chlorine',
    logAbundance: 3.72,
    linearPer10kSi: 52.5,
    primaryOrigin: 'Exploding Massive Stars (75%) / Exploding White Dwarfs (25%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 75, explodingWhiteDwarf: 25, neutronStarMergers: 0 },
  },
  18: {
    z: 18,
    symbol: 'Ar',
    name: 'Argon',
    logAbundance: 5.01,
    linearPer10kSi: 1020,
    primaryOrigin: 'Exploding Massive Stars (55%) / Exploding White Dwarfs (45%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 55, explodingWhiteDwarf: 45, neutronStarMergers: 0 },
  },
  19: {
    z: 19,
    symbol: 'K',
    name: 'Potassium',
    logAbundance: 3.77,
    linearPer10kSi: 58.9,
    primaryOrigin: 'Exploding Massive Stars (65%) / Exploding White Dwarfs (35%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 65, explodingWhiteDwarf: 35, neutronStarMergers: 0 },
  },
  20: {
    z: 20,
    symbol: 'Ca',
    name: 'Calcium',
    logAbundance: 4.81,
    linearPer10kSi: 646,
    primaryOrigin: 'Exploding Massive Stars (60%) / Exploding White Dwarfs (40%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 60, explodingWhiteDwarf: 40, neutronStarMergers: 0 },
  },
  21: {
    z: 21,
    symbol: 'Sc',
    name: 'Scandium',
    logAbundance: 1.58,
    linearPer10kSi: 0.38,
    primaryOrigin: 'Exploding Massive Stars (60%) / Exploding White Dwarfs (40%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 60, explodingWhiteDwarf: 40, neutronStarMergers: 0 },
  },
  22: {
    z: 22,
    symbol: 'Ti',
    name: 'Titanium',
    logAbundance: 3.48,
    linearPer10kSi: 30.2,
    primaryOrigin: 'Exploding White Dwarfs (55%) / Massive Stars (45%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 45, explodingWhiteDwarf: 55, neutronStarMergers: 0 },
  },
  23: {
    z: 23,
    symbol: 'V',
    name: 'Vanadium',
    logAbundance: 2.47,
    linearPer10kSi: 2.95,
    primaryOrigin: 'Exploding White Dwarfs (60%) / Massive Stars (40%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 40, explodingWhiteDwarf: 60, neutronStarMergers: 0 },
  },
  24: {
    z: 24,
    symbol: 'Cr',
    name: 'Chromium',
    logAbundance: 4.13,
    linearPer10kSi: 135,
    primaryOrigin: 'Exploding White Dwarfs (65%) / Massive Stars (35%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 35, explodingWhiteDwarf: 65, neutronStarMergers: 0 },
  },
  25: {
    z: 25,
    symbol: 'Mn',
    name: 'Manganese',
    logAbundance: 3.98,
    linearPer10kSi: 95.5,
    primaryOrigin: 'Exploding White Dwarfs (70%) / Massive Stars (30%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 30, explodingWhiteDwarf: 70, neutronStarMergers: 0 },
  },
  26: {
    z: 26,
    symbol: 'Fe',
    name: 'Iron',
    logAbundance: 5.95,
    linearPer10kSi: 8910,
    primaryOrigin: 'Exploding White Dwarfs (60%) / Massive Stars (40%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 40, explodingWhiteDwarf: 60, neutronStarMergers: 0 },
  },
  27: {
    z: 27,
    symbol: 'Co',
    name: 'Cobalt',
    logAbundance: 3.36,
    linearPer10kSi: 22.9,
    primaryOrigin: 'Exploding White Dwarfs (60%) / Massive Stars (40%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 40, explodingWhiteDwarf: 60, neutronStarMergers: 0 },
  },
  28: {
    z: 28,
    symbol: 'Ni',
    name: 'Nickel',
    logAbundance: 4.70,
    linearPer10kSi: 501,
    primaryOrigin: 'Exploding White Dwarfs (70%) / Massive Stars (30%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 30, explodingWhiteDwarf: 70, neutronStarMergers: 0 },
  },
  29: {
    z: 29,
    symbol: 'Cu',
    name: 'Copper',
    logAbundance: 2.72,
    linearPer10kSi: 5.25,
    primaryOrigin: 'Dying Low-Mass Stars (60%) / Massive Stars (40%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 60, explodingMassive: 40, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  30: {
    z: 30,
    symbol: 'Zn',
    name: 'Zinc',
    logAbundance: 3.10,
    linearPer10kSi: 12.6,
    primaryOrigin: 'Exploding Massive Stars (65%) / Dying Low-Mass (35%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 35, explodingMassive: 65, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  31: {
    z: 31,
    symbol: 'Ga',
    name: 'Gallium',
    logAbundance: 1.58,
    linearPer10kSi: 0.38,
    primaryOrigin: 'Dying Low-Mass Stars (60%) / Massive Stars (40%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 60, explodingMassive: 40, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  32: {
    z: 32,
    symbol: 'Ge',
    name: 'Germanium',
    logAbundance: 2.08,
    linearPer10kSi: 1.20,
    primaryOrigin: 'Dying Low-Mass Stars (50%) / Massive Stars (50%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 50, explodingMassive: 50, explodingWhiteDwarf: 0, neutronStarMergers: 0 },
  },
  38: {
    z: 38,
    symbol: 'Sr',
    name: 'Strontium',
    logAbundance: 1.37,
    linearPer10kSi: 0.23,
    primaryOrigin: 'Dying Low-Mass Stars (s-process 70%) / Mergers (30%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 70, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 30 },
  },
  47: {
    z: 47,
    symbol: 'Ag',
    name: 'Silver',
    logAbundance: -0.32,
    linearPer10kSi: 0.0048,
    primaryOrigin: 'Merging Neutron Stars (r-process 80%) / Low-Mass (20%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 20, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 80 },
  },
  56: {
    z: 56,
    symbol: 'Ba',
    name: 'Barium',
    logAbundance: 0.65,
    linearPer10kSi: 0.045,
    primaryOrigin: 'Dying Low-Mass Stars (s-process 85%) / Mergers (15%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 85, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 15 },
  },
  78: {
    z: 78,
    symbol: 'Pt',
    name: 'Platinum',
    logAbundance: -0.25,
    linearPer10kSi: 0.0056,
    primaryOrigin: 'Merging Neutron Stars (r-process 95%) / Low-Mass (5%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 5, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 95 },
  },
  79: {
    z: 79,
    symbol: 'Au',
    name: 'Gold',
    logAbundance: -1.02,
    linearPer10kSi: 0.00095,
    primaryOrigin: 'Merging Neutron Stars (r-process 95%) / Low-Mass (5%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 5, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 95 },
  },
  82: {
    z: 82,
    symbol: 'Pb',
    name: 'Lead',
    logAbundance: 0.52,
    linearPer10kSi: 0.033,
    primaryOrigin: 'Dying Low-Mass Stars (s-process 65%) / Mergers (35%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 65, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 35 },
  },
  90: {
    z: 90,
    symbol: 'Th',
    name: 'Thorium',
    logAbundance: -1.45,
    linearPer10kSi: 0.00035,
    primaryOrigin: 'Merging Neutron Stars (r-process 100%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 100 },
  },
  92: {
    z: 92,
    symbol: 'U',
    name: 'Uranium',
    logAbundance: -1.96,
    linearPer10kSi: 0.00011,
    primaryOrigin: 'Merging Neutron Stars (r-process 100%)',
    origins: { bbn: 0, spallation: 0, lowMassStars: 0, explodingMassive: 0, explodingWhiteDwarf: 0, neutronStarMergers: 100 },
  },
}

/**
 * Fallback generator for all Z up to 94 to ensure continuous data for the curve.
 */
export function getCosmicAbundance(z: number): CosmicAbundanceEntry {
  const direct = COSMIC_ABUNDANCES[z]
  if (direct) return direct

  // Empirical Oddo-Harkins & broad s/r envelope approximation
  let baseLog = 0
  if (z <= 30) baseLog = 6.0 - 0.15 * z
  else if (z <= 56) baseLog = 2.5 - 0.08 * (z - 30)
  else if (z <= 83) baseLog = 0.5 - 0.04 * (z - 56)
  else baseLog = -1.2 - 0.05 * (z - 83)

  // Odd-even pairing oscillation (Oddo-Harkins rule)
  if (z % 2 !== 0) baseLog -= 0.65

  return {
    z,
    symbol: `Z=${z}`,
    name: `Element ${z}`,
    logAbundance: parseFloat(baseLog.toFixed(2)),
    linearPer10kSi: Math.pow(10, baseLog),
    primaryOrigin: z > 56 ? 'Merging Neutron Stars (r-process)' : 'Exploding Massive Stars (SN II)',
    origins: {
      bbn: 0,
      spallation: 0,
      lowMassStars: z <= 56 ? 30 : 15,
      explodingMassive: z <= 56 ? 50 : 15,
      explodingWhiteDwarf: z <= 30 ? 20 : 0,
      neutronStarMergers: z > 56 ? 70 : 0,
    },
  }
}

/**
 * Calculate the Gamow window energy E_0 and width Delta_E for thermonuclear reactions:
 * E_0 = 1.220 * (Z1^2 * Z2^2 * A_red * T_9^2)^(1/3) [keV]
 * Delta_E = 0.981 * (Z1^2 * Z2^2 * A_red * T_9^5)^(1/6) [keV]
 */
export function calculateGamowPeak(
  z1: number,
  z2: number,
  a1: number,
  a2: number,
  tempMillionK: number,
): { e0Kev: number; deltaEKev: number; e0Mev: number; tunnelingProb: number } {
  const aRed = (a1 * a2) / (a1 + a2)
  const t6 = Math.max(0.1, tempMillionK) // T in 10^6 K

  const factor = z1 * z1 * z2 * z2 * aRed
  // E_0 = 1.2204 * (Z1^2 * Z2^2 * A_red * T_6^2)^(1/3) [keV]
  const e0Kev = 1.2204 * Math.cbrt(factor * t6 * t6)
  // Delta_E = 0.9816 * (Z1^2 * Z2^2 * A_red * T_6^5)^(1/6) [keV]
  const deltaEKev = 0.9816 * Math.pow(factor * Math.pow(t6, 5), 1 / 6)

  // Gamow energy factor b = 31.291 * Z1 * Z2 * sqrt(A_red) [keV^(1/2)]
  const bFactor = 31.291 * z1 * z2 * Math.sqrt(aRed)
  const tunnelingProb = Math.exp(-bFactor / Math.sqrt(Math.max(1e-3, e0Kev)))

  return {
    e0Kev: parseFloat(e0Kev.toFixed(2)),
    deltaEKev: parseFloat(deltaEKev.toFixed(2)),
    e0Mev: parseFloat((e0Kev / 1000).toFixed(5)),
    tunnelingProb,
  }
}
