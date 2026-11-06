/**
 * ELEMENTA — Particle Physics & Feynman Diagram Physics Library
 * Standard Model dataset, Feynman vertex conservation checker,
 * relativistic Breit–Wigner resonance models, and decay branching fractions.
 *
 * Source: Particle Data Group (PDG 2024 / 2026), CERN, SLAC, NIST.
 */

// ----------------------------------------------------------------------------
// 1. Data Types & Interfaces
// ----------------------------------------------------------------------------

export type ParticleKind = 'quark' | 'lepton' | 'gauge_boson' | 'scalar_boson'
export type ColorCharge = 'singlet' | 'triplet' | 'antitriplet' | 'octet'
export type Generation = 1 | 2 | 3 | null

export interface Particle {
  id: string
  name: string
  symbol: string
  kind: ParticleKind
  generation: Generation
  massMeV: number
  massDisplay: string
  charge: number // In units of elementary charge e (+2/3, -1/3, -1, 0, +1)
  spin: number   // 0, 1/2, 1
  color: ColorCharge
  baryonNumber: number // +1/3 for quarks, -1/3 for antiquarks, 0 for leptons/bosons
  leptonE: number      // Le
  leptonMu: number     // Lmu
  leptonTau: number    // Ltau
  weakIsospin3: number // T3
  lifetimeSeconds: number | null // null if stable or virtual
  lifetimeDisplay: string
  decayWidthMeV: number | null   // Total decay width Gamma in MeV (or null)
  antiparticleId: string
  isAntiparticle: boolean
  interactionTypes: Array<'EM' | 'Weak' | 'Strong' | 'Higgs'>
  description: string
  discoveryYear: number
  discoveryLab: string
  dominantDecays?: Array<{ mode: string; fraction: number }>
}

// ----------------------------------------------------------------------------
// 2. Standard Model Fundamental Particles Catalog (PDG Values)
// ----------------------------------------------------------------------------

export const STANDARD_MODEL_PARTICLES: Record<string, Particle> = {
  // --- Quarks (Generation 1) ---
  u: {
    id: 'u',
    name: 'Up Quark',
    symbol: 'u',
    kind: 'quark',
    generation: 1,
    massMeV: 2.16,
    massDisplay: '2.16 MeV/c²',
    charge: 2 / 3,
    spin: 0.5,
    color: 'triplet',
    baryonNumber: 1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable (inside hadrons)',
    decayWidthMeV: null,
    antiparticleId: 'u_bar',
    isAntiparticle: false,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Lightest quark, primary constituent of protons (uud) and neutrons (udd).',
    discoveryYear: 1968,
    discoveryLab: 'SLAC',
  },
  d: {
    id: 'd',
    name: 'Down Quark',
    symbol: 'd',
    kind: 'quark',
    generation: 1,
    massMeV: 4.67,
    massDisplay: '4.67 MeV/c²',
    charge: -1 / 3,
    spin: 0.5,
    color: 'triplet',
    baryonNumber: 1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable / β-decay in free neutron (~879.4 s)',
    decayWidthMeV: null,
    antiparticleId: 'd_bar',
    isAntiparticle: false,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Second-lightest quark; neutron beta decay proceeds via d → u + W⁻.',
    discoveryYear: 1968,
    discoveryLab: 'SLAC',
  },

  // --- Quarks (Generation 2) ---
  c: {
    id: 'c',
    name: 'Charm Quark',
    symbol: 'c',
    kind: 'quark',
    generation: 2,
    massMeV: 1270,
    massDisplay: '1.27 GeV/c²',
    charge: 2 / 3,
    spin: 0.5,
    color: 'triplet',
    baryonNumber: 1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: 1.0e-12,
    lifetimeDisplay: '~1.0 × 10⁻¹² s (D mesons)',
    decayWidthMeV: null,
    antiparticleId: 'c_bar',
    isAntiparticle: false,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Generation 2 up-type quark; discovery in J/ψ (cc̄) confirmed the GIM mechanism in the November Revolution.',
    discoveryYear: 1974,
    discoveryLab: 'BNL / SLAC',
    dominantDecays: [
      { mode: 's + W⁺* (Cabibbo favored)', fraction: 0.95 },
      { mode: 'd + W⁺* (Cabibbo suppressed)', fraction: 0.05 },
    ],
  },
  s: {
    id: 's',
    name: 'Strange Quark',
    symbol: 's',
    kind: 'quark',
    generation: 2,
    massMeV: 93.4,
    massDisplay: '93.4 MeV/c²',
    charge: -1 / 3,
    spin: 0.5,
    color: 'triplet',
    baryonNumber: 1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: 1.2e-8,
    lifetimeDisplay: '~1.2 × 10⁻⁸ s (K mesons)',
    decayWidthMeV: null,
    antiparticleId: 's_bar',
    isAntiparticle: false,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Contains strangeness flavor S = -1; discovered in cosmic ray V-particles (kaons).',
    discoveryYear: 1947,
    discoveryLab: 'Manchester (Cosmic rays)',
    dominantDecays: [
      { mode: 'u + W⁻* (Weak charged current)', fraction: 1.0 },
    ],
  },

  // --- Quarks (Generation 3) ---
  t: {
    id: 't',
    name: 'Top Quark',
    symbol: 't',
    kind: 'quark',
    generation: 3,
    massMeV: 172690,
    massDisplay: '172.69 GeV/c²',
    charge: 2 / 3,
    spin: 0.5,
    color: 'triplet',
    baryonNumber: 1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: 5.0e-25,
    lifetimeDisplay: '5.0 × 10⁻²⁵ s (decays before hadronizing)',
    decayWidthMeV: 1420, // 1.42 GeV
    antiparticleId: 't_bar',
    isAntiparticle: false,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Heaviest known elementary particle, comparable to a gold atom mass; Yukawa coupling y_t ≈ 1.',
    discoveryYear: 1995,
    discoveryLab: 'Fermilab (CDF / D0)',
    dominantDecays: [
      { mode: 'W⁺ + b', fraction: 0.998 },
      { mode: 'W⁺ + s', fraction: 0.0016 },
      { mode: 'W⁺ + d', fraction: 0.00005 },
    ],
  },
  b: {
    id: 'b',
    name: 'Bottom Quark',
    symbol: 'b',
    kind: 'quark',
    generation: 3,
    massMeV: 4180,
    massDisplay: '4.18 GeV/c²',
    charge: -1 / 3,
    spin: 0.5,
    color: 'triplet',
    baryonNumber: 1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: 1.5e-12,
    lifetimeDisplay: '~1.5 × 10⁻¹² s (B mesons)',
    decayWidthMeV: null,
    antiparticleId: 'b_bar',
    isAntiparticle: false,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Third-generation down-type quark; key testing ground for CP violation and CKM matrix unitarity.',
    discoveryYear: 1977,
    discoveryLab: 'Fermilab (E288)',
    dominantDecays: [
      { mode: 'c + W⁻* (V_cb favored)', fraction: 0.985 },
      { mode: 'u + W⁻* (V_ub suppressed)', fraction: 0.015 },
    ],
  },

  // --- Leptons (Generation 1) ---
  e_minus: {
    id: 'e_minus',
    name: 'Electron',
    symbol: 'e⁻',
    kind: 'lepton',
    generation: 1,
    massMeV: 0.51099895,
    massDisplay: '0.511 MeV/c²',
    charge: -1,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 1,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable (> 6.6 × 10²⁸ yr)',
    decayWidthMeV: null,
    antiparticleId: 'e_plus',
    isAntiparticle: false,
    interactionTypes: ['EM', 'Weak'],
    description: 'Fundamental constituent of atomic orbitals, quantum of electrical conduction in condensed matter.',
    discoveryYear: 1897,
    discoveryLab: 'Cambridge (J.J. Thomson)',
  },
  nu_e: {
    id: 'nu_e',
    name: 'Electron Neutrino',
    symbol: 'ν_e',
    kind: 'lepton',
    generation: 1,
    massMeV: 0.0000008, // < 0.8 eV = 8e-7 MeV
    massDisplay: '< 0.8 eV/c²',
    charge: 0,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 1,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable / Oscillates',
    decayWidthMeV: null,
    antiparticleId: 'nu_e_bar',
    isAntiparticle: false,
    interactionTypes: ['Weak'],
    description: 'Left-handed neutral lepton; produced profusely in solar pp-chain fusion and nuclear reactors.',
    discoveryYear: 1956,
    discoveryLab: 'Savannah River (Cowan-Reines)',
  },

  // --- Leptons (Generation 2) ---
  mu_minus: {
    id: 'mu_minus',
    name: 'Muon',
    symbol: 'μ⁻',
    kind: 'lepton',
    generation: 2,
    massMeV: 105.658375,
    massDisplay: '105.66 MeV/c²',
    charge: -1,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 1,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: 2.1969811e-6,
    lifetimeDisplay: '2.197 μs',
    decayWidthMeV: 2.99e-16,
    antiparticleId: 'mu_plus',
    isAntiparticle: false,
    interactionTypes: ['EM', 'Weak'],
    description: 'Heavy electron analog; cosmic ray muons reach sea level due to special relativistic time dilation.',
    discoveryYear: 1936,
    discoveryLab: 'Caltech (Anderson & Neddermeyer)',
    dominantDecays: [
      { mode: 'e⁻ + ν̄_e + ν_μ (Michel decay)', fraction: 0.999999 },
    ],
  },
  nu_mu: {
    id: 'nu_mu',
    name: 'Muon Neutrino',
    symbol: 'ν_μ',
    kind: 'lepton',
    generation: 2,
    massMeV: 0.00017, // < 0.17 MeV
    massDisplay: '< 0.17 MeV/c²',
    charge: 0,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 1,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable / Oscillates',
    decayWidthMeV: null,
    antiparticleId: 'nu_mu_bar',
    isAntiparticle: false,
    interactionTypes: ['Weak'],
    description: 'Second-generation neutrino; demonstrated to be distinct from electron neutrinos by Lederman, Schwartz, Steinberger.',
    discoveryYear: 1962,
    discoveryLab: 'BNL (AGS)',
  },

  // --- Leptons (Generation 3) ---
  tau_minus: {
    id: 'tau_minus',
    name: 'Tau Lepton',
    symbol: 'τ⁻',
    kind: 'lepton',
    generation: 3,
    massMeV: 1776.86,
    massDisplay: '1.777 GeV/c²',
    charge: -1,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 1,
    weakIsospin3: -0.5,
    lifetimeSeconds: 2.903e-13,
    lifetimeDisplay: '2.903 × 10⁻¹³ s',
    decayWidthMeV: 2.27e-9,
    antiparticleId: 'tau_plus',
    isAntiparticle: false,
    interactionTypes: ['EM', 'Weak'],
    description: 'Only lepton heavy enough (1.78 GeV) to decay into hadrons (pions, rhos, kaons).',
    discoveryYear: 1975,
    discoveryLab: 'SLAC (Perl et al.)',
    dominantDecays: [
      { mode: 'Hadrons (pions/rhos) + ν_τ', fraction: 0.6479 },
      { mode: 'e⁻ + ν̄_e + ν_τ', fraction: 0.1782 },
      { mode: 'μ⁻ + ν̄_μ + ν_τ', fraction: 0.1739 },
    ],
  },
  nu_tau: {
    id: 'nu_tau',
    name: 'Tau Neutrino',
    symbol: 'ν_τ',
    kind: 'lepton',
    generation: 3,
    massMeV: 18.2, // < 18.2 MeV
    massDisplay: '< 18.2 MeV/c²',
    charge: 0,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 1,
    weakIsospin3: 0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable / Oscillates',
    decayWidthMeV: null,
    antiparticleId: 'nu_tau_bar',
    isAntiparticle: false,
    interactionTypes: ['Weak'],
    description: 'Final lepton discovered; observed directly via tau tracks in emulsion at the DONUT experiment.',
    discoveryYear: 2000,
    discoveryLab: 'Fermilab (DONUT)',
  },

  // --- Gauge Bosons ---
  gamma: {
    id: 'gamma',
    name: 'Photon',
    symbol: 'γ',
    kind: 'gauge_boson',
    generation: null,
    massMeV: 0,
    massDisplay: '0 (< 10⁻¹⁸ eV)',
    charge: 0,
    spin: 1,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable',
    decayWidthMeV: null,
    antiparticleId: 'gamma',
    isAntiparticle: false,
    interactionTypes: ['EM'],
    description: 'Massless spin-1 gauge boson of Quantum Electrodynamics (QED) with U(1)_EM gauge symmetry.',
    discoveryYear: 1905,
    discoveryLab: 'Einstein (Photoelectric)',
  },
  gluon: {
    id: 'gluon',
    name: 'Gluon',
    symbol: 'g',
    kind: 'gauge_boson',
    generation: null,
    massMeV: 0,
    massDisplay: '0 (theoretical)',
    charge: 0,
    spin: 1,
    color: 'octet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Confined inside hadrons',
    decayWidthMeV: null,
    antiparticleId: 'gluon',
    isAntiparticle: false,
    interactionTypes: ['Strong'],
    description: 'Mediates the strong interaction in SU(3) Quantum Chromodynamics (QCD); carries color and self-interacts.',
    discoveryYear: 1979,
    discoveryLab: 'DESY (PETRA, 3-jet events)',
  },
  w_plus: {
    id: 'w_plus',
    name: 'W⁺ Boson',
    symbol: 'W⁺',
    kind: 'gauge_boson',
    generation: null,
    massMeV: 80377,
    massDisplay: '80.377 GeV/c²',
    charge: 1,
    spin: 1,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 1,
    lifetimeSeconds: 3.16e-25,
    lifetimeDisplay: '3.16 × 10⁻²⁵ s',
    decayWidthMeV: 2085, // 2.085 GeV
    antiparticleId: 'w_minus',
    isAntiparticle: false,
    interactionTypes: ['Weak', 'EM', 'Higgs'],
    description: 'Charged mediator of weak interactions; enables nuclear beta decays and flavor changes.',
    discoveryYear: 1983,
    discoveryLab: 'CERN (UA1 / UA2, Rubbia & van der Meer)',
    dominantDecays: [
      { mode: 'Hadrons (ud̄, cs̄)', fraction: 0.6741 },
      { mode: 'e⁺ + ν_e', fraction: 0.1071 },
      { mode: 'μ⁺ + ν_μ', fraction: 0.1063 },
      { mode: 'τ⁺ + ν_τ', fraction: 0.1125 },
    ],
  },
  w_minus: {
    id: 'w_minus',
    name: 'W⁻ Boson',
    symbol: 'W⁻',
    kind: 'gauge_boson',
    generation: null,
    massMeV: 80377,
    massDisplay: '80.377 GeV/c²',
    charge: -1,
    spin: 1,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -1,
    lifetimeSeconds: 3.16e-25,
    lifetimeDisplay: '3.16 × 10⁻²⁵ s',
    decayWidthMeV: 2085, // 2.085 GeV
    antiparticleId: 'w_plus',
    isAntiparticle: true,
    interactionTypes: ['Weak', 'EM', 'Higgs'],
    description: 'Negatively charged weak gauge boson, antiparticle of W⁺.',
    discoveryYear: 1983,
    discoveryLab: 'CERN (UA1 / UA2)',
    dominantDecays: [
      { mode: 'Hadrons (ūd, c̄s)', fraction: 0.6741 },
      { mode: 'e⁻ + ν̄_e', fraction: 0.1071 },
      { mode: 'μ⁻ + ν̄_μ', fraction: 0.1063 },
      { mode: 'τ⁻ + ν̄_τ', fraction: 0.1125 },
    ],
  },
  z_zero: {
    id: 'z_zero',
    name: 'Z⁰ Boson',
    symbol: 'Z⁰',
    kind: 'gauge_boson',
    generation: null,
    massMeV: 91187.6,
    massDisplay: '91.1876 GeV/c²',
    charge: 0,
    spin: 1,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0,
    lifetimeSeconds: 2.64e-25,
    lifetimeDisplay: '2.64 × 10⁻²⁵ s',
    decayWidthMeV: 2495.2, // 2.4952 GeV
    antiparticleId: 'z_zero',
    isAntiparticle: false,
    interactionTypes: ['Weak', 'Higgs'],
    description: 'Neutral mediator of weak neutral currents; precision LEP measurements established exactly 3 light neutrino generations.',
    discoveryYear: 1983,
    discoveryLab: 'CERN (UA1 / UA2)',
    dominantDecays: [
      { mode: 'Hadrons (qq̄ pairs)', fraction: 0.6991 },
      { mode: 'Invisible (νν̄, 3 generations)', fraction: 0.2000 },
      { mode: 'e⁺ + e⁻', fraction: 0.03363 },
      { mode: 'μ⁺ + μ⁻', fraction: 0.03366 },
      { mode: 'τ⁺ + τ⁻', fraction: 0.03367 },
    ],
  },

  // --- Scalar Boson ---
  higgs: {
    id: 'higgs',
    name: 'Higgs Boson',
    symbol: 'H⁰',
    kind: 'scalar_boson',
    generation: null,
    massMeV: 125250,
    massDisplay: '125.25 GeV/c²',
    charge: 0,
    spin: 0,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: 1.56e-22,
    lifetimeDisplay: '1.56 × 10⁻²² s',
    decayWidthMeV: 4.1, // 4.1 MeV
    antiparticleId: 'higgs',
    isAntiparticle: false,
    interactionTypes: ['Weak', 'Higgs'],
    description: 'Excitation of the Brout–Englert–Higgs field responsible for electroweak symmetry breaking and fermion mass generation via Yukawa couplings.',
    discoveryYear: 2012,
    discoveryLab: 'CERN (LHC ATLAS & CMS)',
    dominantDecays: [
      { mode: 'b + b̄', fraction: 0.582 },
      { mode: 'W⁺ + W⁻*', fraction: 0.214 },
      { mode: 'g + g', fraction: 0.0819 },
      { mode: 'τ⁺ + τ⁻', fraction: 0.0627 },
      { mode: 'c + c̄', fraction: 0.0289 },
      { mode: 'Z⁰ + Z⁰*', fraction: 0.0262 },
      { mode: 'γ + γ (diphoton loop)', fraction: 0.00227 },
      { mode: 'Z⁰ + γ', fraction: 0.00154 },
      { mode: 'μ⁺ + μ⁻', fraction: 0.00022 },
    ],
  },

  // --- Antiparticles with Distinct Properties ---
  u_bar: {
    id: 'u_bar',
    name: 'Anti-up Quark',
    symbol: 'ū',
    kind: 'quark',
    generation: 1,
    massMeV: 2.16,
    massDisplay: '2.16 MeV/c²',
    charge: -2 / 3,
    spin: 0.5,
    color: 'antitriplet',
    baryonNumber: -1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable (inside hadrons)',
    decayWidthMeV: null,
    antiparticleId: 'u',
    isAntiparticle: true,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Antiparticle of up quark, charge -2/3.',
    discoveryYear: 1968,
    discoveryLab: 'SLAC',
  },
  d_bar: {
    id: 'd_bar',
    name: 'Anti-down Quark',
    symbol: 'd̄',
    kind: 'quark',
    generation: 1,
    massMeV: 4.67,
    massDisplay: '4.67 MeV/c²',
    charge: 1 / 3,
    spin: 0.5,
    color: 'antitriplet',
    baryonNumber: -1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable (inside hadrons)',
    decayWidthMeV: null,
    antiparticleId: 'd',
    isAntiparticle: true,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Antiparticle of down quark, charge +1/3.',
    discoveryYear: 1968,
    discoveryLab: 'SLAC',
  },
  c_bar: {
    id: 'c_bar',
    name: 'Anti-charm Quark',
    symbol: 'c̄',
    kind: 'quark',
    generation: 2,
    massMeV: 1270,
    massDisplay: '1.27 GeV/c²',
    charge: -2 / 3,
    spin: 0.5,
    color: 'antitriplet',
    baryonNumber: -1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: 1.0e-12,
    lifetimeDisplay: '~1.0 × 10⁻¹² s',
    decayWidthMeV: null,
    antiparticleId: 'c',
    isAntiparticle: true,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Antiparticle of charm quark.',
    discoveryYear: 1974,
    discoveryLab: 'BNL / SLAC',
  },
  s_bar: {
    id: 's_bar',
    name: 'Anti-strange Quark',
    symbol: 's̄',
    kind: 'quark',
    generation: 2,
    massMeV: 93.4,
    massDisplay: '93.4 MeV/c²',
    charge: 1 / 3,
    spin: 0.5,
    color: 'antitriplet',
    baryonNumber: -1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: 1.2e-8,
    lifetimeDisplay: '~1.2 × 10⁻⁸ s',
    decayWidthMeV: null,
    antiparticleId: 's',
    isAntiparticle: true,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Antiparticle of strange quark, carries strangeness S = +1.',
    discoveryYear: 1947,
    discoveryLab: 'Manchester',
  },
  t_bar: {
    id: 't_bar',
    name: 'Anti-top Quark',
    symbol: 't̄',
    kind: 'quark',
    generation: 3,
    massMeV: 172690,
    massDisplay: '172.69 GeV/c²',
    charge: -2 / 3,
    spin: 0.5,
    color: 'antitriplet',
    baryonNumber: -1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: 5.0e-25,
    lifetimeDisplay: '5.0 × 10⁻²⁵ s',
    decayWidthMeV: 1420,
    antiparticleId: 't',
    isAntiparticle: true,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Antiparticle of top quark.',
    discoveryYear: 1995,
    discoveryLab: 'Fermilab',
  },
  b_bar: {
    id: 'b_bar',
    name: 'Anti-bottom Quark',
    symbol: 'b̄',
    kind: 'quark',
    generation: 3,
    massMeV: 4180,
    massDisplay: '4.18 GeV/c²',
    charge: 1 / 3,
    spin: 0.5,
    color: 'antitriplet',
    baryonNumber: -1 / 3,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: 1.5e-12,
    lifetimeDisplay: '~1.5 × 10⁻¹² s',
    decayWidthMeV: null,
    antiparticleId: 'b',
    isAntiparticle: true,
    interactionTypes: ['EM', 'Weak', 'Strong', 'Higgs'],
    description: 'Antiparticle of bottom quark.',
    discoveryYear: 1977,
    discoveryLab: 'Fermilab',
  },
  e_plus: {
    id: 'e_plus',
    name: 'Positron',
    symbol: 'e⁺',
    kind: 'lepton',
    generation: 1,
    massMeV: 0.51099895,
    massDisplay: '0.511 MeV/c²',
    charge: 1,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: -1,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable in vacuum',
    decayWidthMeV: null,
    antiparticleId: 'e_minus',
    isAntiparticle: true,
    interactionTypes: ['EM', 'Weak'],
    description: 'Antiparticle of electron; predicted by Dirac equation (1928), discovered in cosmic rays.',
    discoveryYear: 1932,
    discoveryLab: 'Caltech (Anderson)',
  },
  nu_e_bar: {
    id: 'nu_e_bar',
    name: 'Electron Antineutrino',
    symbol: 'ν̄_e',
    kind: 'lepton',
    generation: 1,
    massMeV: 0.0000008,
    massDisplay: '< 0.8 eV/c²',
    charge: 0,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: -1,
    leptonMu: 0,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable / Oscillates',
    decayWidthMeV: null,
    antiparticleId: 'nu_e',
    isAntiparticle: true,
    interactionTypes: ['Weak'],
    description: 'Right-handed antineutrino; emitted during nuclear β⁻ decay.',
    discoveryYear: 1956,
    discoveryLab: 'Savannah River',
  },
  mu_plus: {
    id: 'mu_plus',
    name: 'Antimuon',
    symbol: 'μ⁺',
    kind: 'lepton',
    generation: 2,
    massMeV: 105.658375,
    massDisplay: '105.66 MeV/c²',
    charge: 1,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: -1,
    leptonTau: 0,
    weakIsospin3: 0.5,
    lifetimeSeconds: 2.1969811e-6,
    lifetimeDisplay: '2.197 μs',
    decayWidthMeV: 2.99e-16,
    antiparticleId: 'mu_minus',
    isAntiparticle: true,
    interactionTypes: ['EM', 'Weak'],
    description: 'Positively charged antimuon, decays as μ⁺ → e⁺ + ν_e + ν̄_μ.',
    discoveryYear: 1936,
    discoveryLab: 'Caltech',
  },
  nu_mu_bar: {
    id: 'nu_mu_bar',
    name: 'Muon Antineutrino',
    symbol: 'ν̄_μ',
    kind: 'lepton',
    generation: 2,
    massMeV: 0.00017,
    massDisplay: '< 0.17 MeV/c²',
    charge: 0,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: -1,
    leptonTau: 0,
    weakIsospin3: -0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable / Oscillates',
    decayWidthMeV: null,
    antiparticleId: 'nu_mu',
    isAntiparticle: true,
    interactionTypes: ['Weak'],
    description: 'Antiparticle of muon neutrino.',
    discoveryYear: 1962,
    discoveryLab: 'BNL',
  },
  tau_plus: {
    id: 'tau_plus',
    name: 'Antitau',
    symbol: 'τ⁺',
    kind: 'lepton',
    generation: 3,
    massMeV: 1776.86,
    massDisplay: '1.777 GeV/c²',
    charge: 1,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: -1,
    weakIsospin3: 0.5,
    lifetimeSeconds: 2.903e-13,
    lifetimeDisplay: '2.903 × 10⁻¹³ s',
    decayWidthMeV: 2.27e-9,
    antiparticleId: 'tau_minus',
    isAntiparticle: true,
    interactionTypes: ['EM', 'Weak'],
    description: 'Positively charged antitau lepton.',
    discoveryYear: 1975,
    discoveryLab: 'SLAC',
  },
  nu_tau_bar: {
    id: 'nu_tau_bar',
    name: 'Tau Antineutrino',
    symbol: 'ν̄_τ',
    kind: 'lepton',
    generation: 3,
    massMeV: 18.2,
    massDisplay: '< 18.2 MeV/c²',
    charge: 0,
    spin: 0.5,
    color: 'singlet',
    baryonNumber: 0,
    leptonE: 0,
    leptonMu: 0,
    leptonTau: -1,
    weakIsospin3: -0.5,
    lifetimeSeconds: null,
    lifetimeDisplay: 'Stable / Oscillates',
    decayWidthMeV: null,
    antiparticleId: 'nu_tau',
    isAntiparticle: true,
    interactionTypes: ['Weak'],
    description: 'Antiparticle of tau neutrino.',
    discoveryYear: 2000,
    discoveryLab: 'Fermilab',
  },
}

/** Standard Model 17 fundamental particles (6 Quarks, 6 Leptons, 4 Gauge Bosons [W± represented by W⁺], 1 Scalar Higgs) */
export const SM_PRIMARY_KEYS: string[] = [
  // Quarks (6)
  'u', 'd', 'c', 's', 't', 'b',
  // Leptons (6)
  'e_minus', 'nu_e', 'mu_minus', 'nu_mu', 'tau_minus', 'nu_tau',
  // Gauge Bosons (4)
  'gamma', 'gluon', 'w_plus', 'z_zero',
  // Scalar Boson (1)
  'higgs',
]

export function getParticle(id: string): Particle {
  const p = STANDARD_MODEL_PARTICLES[id]
  if (!p) {
    throw new Error(`Unknown particle id: ${id}`)
  }
  return p
}

// ----------------------------------------------------------------------------
// 3. Feynman Diagram Model & Vertex Conservation Engine
// ----------------------------------------------------------------------------

export type InteractionCategory =
  | 'QED'
  | 'WeakCharged'
  | 'WeakNeutral'
  | 'QCD'
  | 'Higgs'

export interface FeynmanLeg {
  id: string
  particleId: string
  label: string
  role: 'incoming' | 'outgoing' | 'propagator'
  fromVertexId?: string
  toVertexId?: string
  startPos?: { x: number; y: number } // 0..1 relative canvas coords
  endPos?: { x: number; y: number }
  style: 'fermion' | 'photon' | 'weak' | 'gluon' | 'higgs'
  arrowForward?: boolean // true = forward in time, false = backward (antiparticle flow)
}

export interface FeynmanVertex {
  id: string
  label: string
  position: { x: number; y: number } // 0..1 relative canvas coords
  interaction: InteractionCategory
  incomingParticles: string[] // particle IDs directed INTO this vertex
  outgoingParticles: string[] // particle IDs directed OUT OF this vertex
  couplingLabel: string
}

export interface VertexConservationResult {
  valid: boolean
  chargeIn: number
  chargeOut: number
  deltaQ: number
  leptonEIn: number
  leptonEOut: number
  deltaLe: number
  leptonMuIn: number
  leptonMuOut: number
  deltaLmu: number
  leptonTauIn: number
  leptonTauOut: number
  deltaLtau: number
  baryonIn: number
  baryonOut: number
  deltaB: number
  colorValid: boolean
  errors: string[]
}

export interface DiagramConservationResult {
  valid: boolean
  vertexResults: Record<string, VertexConservationResult>
  globalValid: boolean
  errors: string[]
}

/**
 * Validates conservation laws at a single Feynman vertex:
 *   - Electric Charge: sum(Q_in) == sum(Q_out)
 *   - Lepton Numbers: sum(Le_in) == sum(Le_out), sum(Lmu_in) == sum(Lmu_out), sum(Ltau_in) == sum(Ltau_out)
 *   - Baryon Number: sum(B_in) == sum(B_out)
 *   - Color Charge balance
 */
export function checkVertexConservation(
  incomingIds: string[],
  outgoingIds: string[],
): VertexConservationResult {
  let chargeIn = 0
  let chargeOut = 0
  let leptonEIn = 0
  let leptonEOut = 0
  let leptonMuIn = 0
  let leptonMuOut = 0
  let leptonTauIn = 0
  let leptonTauOut = 0
  let baryonIn = 0
  let baryonOut = 0

  const errors: string[] = []

  // Color counting
  let quarksIn = 0
  let antiquarksIn = 0
  let quarksOut = 0
  let antiquarksOut = 0
  let gluonsIn = 0
  let gluonsOut = 0

  for (const id of incomingIds) {
    const p = getParticle(id)
    chargeIn += p.charge
    leptonEIn += p.leptonE
    leptonMuIn += p.leptonMu
    leptonTauIn += p.leptonTau
    baryonIn += p.baryonNumber

    if (p.kind === 'quark') {
      if (p.isAntiparticle) antiquarksIn++
      else quarksIn++
    } else if (p.id === 'gluon') {
      gluonsIn++
    }
  }

  for (const id of outgoingIds) {
    const p = getParticle(id)
    chargeOut += p.charge
    leptonEOut += p.leptonE
    leptonMuOut += p.leptonMu
    leptonTauOut += p.leptonTau
    baryonOut += p.baryonNumber

    if (p.kind === 'quark') {
      if (p.isAntiparticle) antiquarksOut++
      else quarksOut++
    } else if (p.id === 'gluon') {
      gluonsOut++
    }
  }

  // Floating point safe comparison
  const EPS = 1e-4
  const deltaQ = chargeIn - chargeOut
  const deltaLe = leptonEIn - leptonEOut
  const deltaLmu = leptonMuIn - leptonMuOut
  const deltaLtau = leptonTauIn - leptonTauOut
  const deltaB = baryonIn - baryonOut

  if (Math.abs(deltaQ) > EPS) {
    errors.push(`Charge conservation violated: Qin = ${chargeIn.toFixed(2)}, Qout = ${chargeOut.toFixed(2)} (ΔQ = ${deltaQ.toFixed(2)})`)
  }
  if (Math.abs(deltaLe) > EPS) {
    errors.push(`Electron lepton number violated: Le,in = ${leptonEIn}, Le,out = ${leptonEOut}`)
  }
  if (Math.abs(deltaLmu) > EPS) {
    errors.push(`Muon lepton number violated: Lμ,in = ${leptonMuIn}, Lμ,out = ${leptonMuOut}`)
  }
  if (Math.abs(deltaLtau) > EPS) {
    errors.push(`Tau lepton number violated: Lτ,in = ${leptonTauIn}, Lτ,out = ${leptonTauOut}`)
  }
  if (Math.abs(deltaB) > EPS) {
    errors.push(`Baryon number violated: Bin = ${baryonIn.toFixed(2)}, Bout = ${baryonOut.toFixed(2)}`)
  }

  // Color check:
  // Quarks must conserve color flow. A quark line entering either emits a gluon or converts to another quark of same net color.
  // Net quark balance (quarks - antiquarks) mod 3 must match (or single quark line with gluon).
  const netTripletsIn = quarksIn - antiquarksIn
  const netTripletsOut = quarksOut - antiquarksOut
  let colorValid = true

  if ((netTripletsIn - netTripletsOut) % 3 !== 0 && gluonsIn === 0 && gluonsOut === 0) {
    colorValid = false
    errors.push('Color charge flow is unbalanced across vertex.')
  }

  const valid = errors.length === 0

  return {
    valid,
    chargeIn: Number(chargeIn.toFixed(4)),
    chargeOut: Number(chargeOut.toFixed(4)),
    deltaQ: Number(deltaQ.toFixed(4)),
    leptonEIn,
    leptonEOut,
    deltaLe,
    leptonMuIn,
    leptonMuOut,
    deltaLmu,
    leptonTauIn,
    leptonTauOut,
    deltaLtau,
    baryonIn: Number(baryonIn.toFixed(4)),
    baryonOut: Number(baryonOut.toFixed(4)),
    deltaB: Number(deltaB.toFixed(4)),
    colorValid,
    errors,
  }
}

export interface FeynmanPreset {
  id: string
  name: string
  category: InteractionCategory
  equation: string
  description: string
  availableChannels: Array<'s-channel' | 't-channel' | 'u-channel' | 'decay'>
  defaultChannel: 's-channel' | 't-channel' | 'u-channel' | 'decay'
  physicsNotes: string
  amplitudeLaTeX: string
  vertices: FeynmanVertex[]
  legs: FeynmanLeg[]
}

// ----------------------------------------------------------------------------
// 4. Feynman Presets Catalog (All Required Fundamental Processes)
// ----------------------------------------------------------------------------

export const FEYNMAN_PRESETS: Record<string, FeynmanPreset> = {
  // 1. e⁻ + e⁺ → μ⁻ + μ⁺ (QED s-channel annihilation)
  ee_to_mumu: {
    id: 'ee_to_mumu',
    name: 'e⁻ + e⁺ → μ⁻ + μ⁺ Annihilation',
    category: 'QED',
    equation: 'e⁻ + e⁺ → γ* / Z⁰ → μ⁻ + μ⁺',
    description: 'Classic leptonic annihilation. Center-of-mass energy produces a virtual timelike photon (or Z⁰) which decays into a muon-antimuon pair.',
    availableChannels: ['s-channel'],
    defaultChannel: 's-channel',
    physicsNotes: 'At low energies (s ≪ M_Z²), cross section σ = (4πα² / 3s). At LEP energies (√s ≈ 91.2 GeV), Z⁰ resonance dominates.',
    amplitudeLaTeX: 'i\\mathcal{M} = \\bar{v}(p_2)(-ie\\gamma^\\mu)u(p_1) \\frac{-i g_{\\mu\\nu}}{q^2 + i\\epsilon} \\bar{u}(p_3)(-ie\\gamma^\\nu)v(p_4)',
    vertices: [
      {
        id: 'V1',
        label: 'V₁ (e⁻e⁺γ)',
        position: { x: 0.38, y: 0.5 },
        interaction: 'QED',
        incomingParticles: ['e_minus', 'e_plus'],
        outgoingParticles: ['gamma'],
        couplingLabel: '-ie γ^μ',
      },
      {
        id: 'V2',
        label: 'V₂ (γμμ)',
        position: { x: 0.62, y: 0.5 },
        interaction: 'QED',
        incomingParticles: ['gamma'],
        outgoingParticles: ['mu_minus', 'mu_plus'],
        couplingLabel: '-ie γ^ν',
      },
    ],
    legs: [
      { id: 'L1', particleId: 'e_minus', label: 'e⁻ (in)', role: 'incoming', startPos: { x: 0.12, y: 0.2 }, endPos: { x: 0.38, y: 0.5 }, style: 'fermion', arrowForward: true },
      { id: 'L2', particleId: 'e_plus', label: 'e⁺ (in)', role: 'incoming', startPos: { x: 0.12, y: 0.8 }, endPos: { x: 0.38, y: 0.5 }, style: 'fermion', arrowForward: false },
      { id: 'L_prop', particleId: 'gamma', label: 'γ* (s-channel, q² = s)', role: 'propagator', startPos: { x: 0.38, y: 0.5 }, endPos: { x: 0.62, y: 0.5 }, style: 'photon' },
      { id: 'L3', particleId: 'mu_minus', label: 'μ⁻ (out)', role: 'outgoing', startPos: { x: 0.62, y: 0.5 }, endPos: { x: 0.88, y: 0.2 }, style: 'fermion', arrowForward: true },
      { id: 'L4', particleId: 'mu_plus', label: 'μ⁺ (out)', role: 'outgoing', startPos: { x: 0.62, y: 0.5 }, endPos: { x: 0.88, y: 0.8 }, style: 'fermion', arrowForward: false },
    ],
  },

  // 2. Beta Minus Decay (d → u + e⁻ + ν̄_e)
  beta_decay: {
    id: 'beta_decay',
    name: 'Nuclear β⁻ Decay (d → u + e⁻ + ν̄_e)',
    category: 'WeakCharged',
    equation: 'd → u + W⁻ → u + e⁻ + ν̄_e',
    description: 'Weak decay of a neutron (udd) into a proton (uud). A down quark flips to an up quark by emitting an off-shell W⁻ boson.',
    availableChannels: ['decay'],
    defaultChannel: 'decay',
    physicsNotes: 'Maximum electron kinetic energy is given by the Q-value Q = m_n - m_p - m_e = 0.782 MeV. Mediated by Cabibbo-favored V_ud ≈ 0.973.',
    amplitudeLaTeX: 'i\\mathcal{M} = \\left[ \\bar{u}_u \\frac{-ig_w}{2\\sqrt{2}} \\gamma^\\mu (1-\\gamma^5) V_{ud} u_d \\right] \\frac{-i(g_{\\mu\\nu} - q_\\mu q_\\nu/M_W^2)}{q^2 - M_W^2} \\left[ \\bar{u}_e \\frac{-ig_w}{2\\sqrt{2}} \\gamma^\\nu (1-\\gamma^5) v_{\\nu_e} \\right]',
    vertices: [
      {
        id: 'V1',
        label: 'V₁ (duW⁻)',
        position: { x: 0.36, y: 0.4 },
        interaction: 'WeakCharged',
        incomingParticles: ['d'],
        outgoingParticles: ['u', 'w_minus'],
        couplingLabel: '-i(g_w/2√2)γ^μ(1-γ⁵)V_ud',
      },
      {
        id: 'V2',
        label: 'V₂ (W⁻e⁻ν̄_e)',
        position: { x: 0.64, y: 0.65 },
        interaction: 'WeakCharged',
        incomingParticles: ['w_minus'],
        outgoingParticles: ['e_minus', 'nu_e_bar'],
        couplingLabel: '-i(g_w/2√2)γ^ν(1-γ⁵)',
      },
    ],
    legs: [
      { id: 'L1', particleId: 'd', label: 'd quark', role: 'incoming', startPos: { x: 0.12, y: 0.4 }, endPos: { x: 0.36, y: 0.4 }, style: 'fermion', arrowForward: true },
      { id: 'L2', particleId: 'u', label: 'u quark', role: 'outgoing', startPos: { x: 0.36, y: 0.4 }, endPos: { x: 0.88, y: 0.2 }, style: 'fermion', arrowForward: true },
      { id: 'L_prop', particleId: 'w_minus', label: 'W⁻ boson', role: 'propagator', startPos: { x: 0.36, y: 0.4 }, endPos: { x: 0.64, y: 0.65 }, style: 'weak' },
      { id: 'L3', particleId: 'e_minus', label: 'e⁻', role: 'outgoing', startPos: { x: 0.64, y: 0.65 }, endPos: { x: 0.88, y: 0.55 }, style: 'fermion', arrowForward: true },
      { id: 'L4', particleId: 'nu_e_bar', label: 'ν̄_e (antineutrino)', role: 'outgoing', startPos: { x: 0.64, y: 0.65 }, endPos: { x: 0.88, y: 0.85 }, style: 'fermion', arrowForward: false },
    ],
  },

  // 3. Muon Decay (μ⁻ → e⁻ + ν̄_e + ν_μ)
  muon_decay: {
    id: 'muon_decay',
    name: 'Muon Michel Decay (μ⁻ → e⁻ + ν̄_e + ν_μ)',
    category: 'WeakCharged',
    equation: 'μ⁻ → ν_μ + W⁻ → ν_μ + e⁻ + ν̄_e',
    description: 'Pure leptonic weak decay. The muon converts to a muon neutrino with intermediate virtual W⁻ materializing an electron and electron antineutrino.',
    availableChannels: ['decay'],
    defaultChannel: 'decay',
    physicsNotes: 'Muon lifetime τ_μ = 192 π³ / (G_F² m_μ⁵). Precision measurement of τ_μ provides the canonical determination of the Fermi constant G_F = 1.1663788 × 10⁻⁵ GeV⁻².',
    amplitudeLaTeX: 'i\\mathcal{M} = \\frac{G_F}{\\sqrt{2}} \\left[ \\bar{u}(\\nu_\\mu)\\gamma^\\mu(1-\\gamma^5)u(\\mu) \\right] \\left[ \\bar{u}(e)\\gamma_\\mu(1-\\gamma^5)v(\\nu_e) \\right]',
    vertices: [
      {
        id: 'V1',
        label: 'V₁ (μν_μW⁻)',
        position: { x: 0.38, y: 0.35 },
        interaction: 'WeakCharged',
        incomingParticles: ['mu_minus'],
        outgoingParticles: ['nu_mu', 'w_minus'],
        couplingLabel: '-i(g_w/2√2)γ^μ(1-γ⁵)',
      },
      {
        id: 'V2',
        label: 'V₂ (W⁻e⁻ν̄_e)',
        position: { x: 0.62, y: 0.65 },
        interaction: 'WeakCharged',
        incomingParticles: ['w_minus'],
        outgoingParticles: ['e_minus', 'nu_e_bar'],
        couplingLabel: '-i(g_w/2√2)γ^ν(1-γ⁵)',
      },
    ],
    legs: [
      { id: 'L1', particleId: 'mu_minus', label: 'μ⁻ (parent)', role: 'incoming', startPos: { x: 0.12, y: 0.35 }, endPos: { x: 0.38, y: 0.35 }, style: 'fermion', arrowForward: true },
      { id: 'L2', particleId: 'nu_mu', label: 'ν_μ', role: 'outgoing', startPos: { x: 0.38, y: 0.35 }, endPos: { x: 0.88, y: 0.18 }, style: 'fermion', arrowForward: true },
      { id: 'L_prop', particleId: 'w_minus', label: 'W⁻ (virtual)', role: 'propagator', startPos: { x: 0.38, y: 0.35 }, endPos: { x: 0.62, y: 0.65 }, style: 'weak' },
      { id: 'L3', particleId: 'e_minus', label: 'e⁻', role: 'outgoing', startPos: { x: 0.62, y: 0.65 }, endPos: { x: 0.88, y: 0.55 }, style: 'fermion', arrowForward: true },
      { id: 'L4', particleId: 'nu_e_bar', label: 'ν̄_e', role: 'outgoing', startPos: { x: 0.62, y: 0.65 }, endPos: { x: 0.88, y: 0.85 }, style: 'fermion', arrowForward: false },
    ],
  },

  // 4. Bhabha Scattering (e⁻ + e⁺ → e⁻ + e⁺)
  bhabha_scattering: {
    id: 'bhabha_scattering',
    name: 'Bhabha Scattering (e⁻ + e⁺ → e⁻ + e⁺)',
    category: 'QED',
    equation: 'e⁻ + e⁺ → e⁻ + e⁺ (s-channel + t-channel)',
    description: 'Relativistic electron-positron elastic scattering with quantum interference between s-channel annihilation and t-channel photon exchange.',
    availableChannels: ['s-channel', 't-channel'],
    defaultChannel: 's-channel',
    physicsNotes: 'Crucial luminosity monitor at e⁺e⁻ colliders (LEP, PEP-II, KEKB). The differential cross section dσ/dΩ diverges forward (θ → 0) due to t-channel pole 1/t².',
    amplitudeLaTeX: '\\mathcal{M} = \\mathcal{M}_s + \\mathcal{M}_t = -e^2 \\left[ \\frac{(\\bar{v}_2 \\gamma^\\mu u_1)(\\bar{u}_3 \\gamma_\\mu v_4)}{s} - \\frac{(\\bar{u}_3 \\gamma^\\mu u_1)(\\bar{v}_2 \\gamma_\\mu v_4)}{t} \\right]',
    vertices: [
      {
        id: 'V1',
        label: 'V₁ (e⁻e⁺γ)',
        position: { x: 0.4, y: 0.5 },
        interaction: 'QED',
        incomingParticles: ['e_minus', 'e_plus'],
        outgoingParticles: ['gamma'],
        couplingLabel: '-ie γ^μ',
      },
      {
        id: 'V2',
        label: 'V₂ (γe⁻e⁺)',
        position: { x: 0.6, y: 0.5 },
        interaction: 'QED',
        incomingParticles: ['gamma'],
        outgoingParticles: ['e_minus', 'e_plus'],
        couplingLabel: '-ie γ^ν',
      },
    ],
    legs: [
      { id: 'L1', particleId: 'e_minus', label: 'e⁻ (in)', role: 'incoming', startPos: { x: 0.12, y: 0.2 }, endPos: { x: 0.4, y: 0.5 }, style: 'fermion', arrowForward: true },
      { id: 'L2', particleId: 'e_plus', label: 'e⁺ (in)', role: 'incoming', startPos: { x: 0.12, y: 0.8 }, endPos: { x: 0.4, y: 0.5 }, style: 'fermion', arrowForward: false },
      { id: 'L_prop', particleId: 'gamma', label: 'γ* (s-channel annihilation)', role: 'propagator', startPos: { x: 0.4, y: 0.5 }, endPos: { x: 0.6, y: 0.5 }, style: 'photon' },
      { id: 'L3', particleId: 'e_minus', label: 'e⁻ (out)', role: 'outgoing', startPos: { x: 0.6, y: 0.5 }, endPos: { x: 0.88, y: 0.2 }, style: 'fermion', arrowForward: true },
      { id: 'L4', particleId: 'e_plus', label: 'e⁺ (out)', role: 'outgoing', startPos: { x: 0.6, y: 0.5 }, endPos: { x: 0.88, y: 0.8 }, style: 'fermion', arrowForward: false },
    ],
  },

  // 5. Gluon Self-Interaction (g → g + g)
  gluon_self_interaction: {
    id: 'gluon_self_interaction',
    name: 'Triple Gluon Vertex (g → g + g)',
    category: 'QCD',
    equation: 'g^a → g^b + g^c (SU(3) gauge non-Abelian)',
    description: 'Fundamental non-Abelian vertex of Quantum Chromodynamics. Because gluons carry color charge, they interact with each other, generating asymptotic freedom.',
    availableChannels: ['decay'],
    defaultChannel: 'decay',
    physicsNotes: 'Governed by structure constants f^{abc} of SU(3). Responsible for the negative beta-function β(g_s) < 0 discovered by Gross, Wilczek, and Politzer (Nobel 2004).',
    amplitudeLaTeX: 'V^{\\mu\\nu\\rho}_{abc}(p,q,k) = -g_s f^{abc} \\left[ g^{\\mu\\nu}(p-q)^\\rho + g^{\\nu\\rho}(q-k)^\\mu + g^{\\rho\\mu}(k-p)^\\nu \\right]',
    vertices: [
      {
        id: 'V1',
        label: 'V₁ (3-gluon)',
        position: { x: 0.5, y: 0.5 },
        interaction: 'QCD',
        incomingParticles: ['gluon'],
        outgoingParticles: ['gluon', 'gluon'],
        couplingLabel: '-g_s f^{abc}',
      },
    ],
    legs: [
      { id: 'L1', particleId: 'gluon', label: 'g^a (in)', role: 'incoming', startPos: { x: 0.15, y: 0.5 }, endPos: { x: 0.5, y: 0.5 }, style: 'gluon' },
      { id: 'L2', particleId: 'gluon', label: 'g^b (out)', role: 'outgoing', startPos: { x: 0.5, y: 0.5 }, endPos: { x: 0.85, y: 0.2 }, style: 'gluon' },
      { id: 'L3', particleId: 'gluon', label: 'g^c (out)', role: 'outgoing', startPos: { x: 0.5, y: 0.5 }, endPos: { x: 0.85, y: 0.8 }, style: 'gluon' },
    ],
  },

  // 6. Higgs Decay (H⁰ → b + b̄ and H⁰ → γ + γ)
  higgs_decay: {
    id: 'higgs_decay',
    name: 'Higgs Boson Decay (H⁰ → b + b̄)',
    category: 'Higgs',
    equation: 'H⁰ → b + b̄ (Yukawa coupling)',
    description: 'Dominant decay channel of the 125 GeV Higgs (BR ≈ 58%). The Higgs couples to fermions with strength proportional to their mass: y_f = √2 m_f / v.',
    availableChannels: ['decay'],
    defaultChannel: 'decay',
    physicsNotes: 'Yukawa coupling to bottom quarks y_b ≈ 0.024. Observed at ATLAS and CMS via associated production (VH) with b-jet taggers.',
    amplitudeLaTeX: 'i\\mathcal{M} = -i \\frac{y_b}{\\sqrt{2}} \\bar{u}(p_1) v(p_2) = -i \\frac{m_b}{v} \\bar{u}(p_1) v(p_2)',
    vertices: [
      {
        id: 'V1',
        label: 'V₁ (H⁰bb̄)',
        position: { x: 0.45, y: 0.5 },
        interaction: 'Higgs',
        incomingParticles: ['higgs'],
        outgoingParticles: ['b', 'b_bar'],
        couplingLabel: '-i m_b / v',
      },
    ],
    legs: [
      { id: 'L1', particleId: 'higgs', label: 'H⁰ (Higgs)', role: 'incoming', startPos: { x: 0.15, y: 0.5 }, endPos: { x: 0.45, y: 0.5 }, style: 'higgs' },
      { id: 'L2', particleId: 'b', label: 'b quark', role: 'outgoing', startPos: { x: 0.45, y: 0.5 }, endPos: { x: 0.85, y: 0.22 }, style: 'fermion', arrowForward: true },
      { id: 'L3', particleId: 'b_bar', label: 'b̄ antiquark', role: 'outgoing', startPos: { x: 0.45, y: 0.5 }, endPos: { x: 0.85, y: 0.78 }, style: 'fermion', arrowForward: false },
    ],
  },

  // 7. Top Quark Decay (t → W⁺ + b)
  top_decay: {
    id: 'top_decay',
    name: 'Top Quark Rapid Decay (t → W⁺ + b)',
    category: 'WeakCharged',
    equation: 't → W⁺ + b (Electroweak prompt decay)',
    description: 'Because m_t > M_W + m_b, the top quark decays via on-shell W⁺ emission before hadronization can bind it into mesons.',
    availableChannels: ['decay'],
    defaultChannel: 'decay',
    physicsNotes: 'Total width Γ_t ≈ 1.42 GeV yields lifetime τ ≈ 5 × 10⁻²⁵ s, shorter than the QCD hadronization timescale (Λ_QCD⁻¹ ≈ 3 × 10⁻²⁴ s). Branching ratio to W⁺b is > 99.8%.',
    amplitudeLaTeX: 'i\\mathcal{M} = \\frac{-ig_w}{2\\sqrt{2}} V_{tb} \\bar{u}(p_b) \\gamma^\\mu (1-\\gamma^5) u(p_t) \\epsilon_\\mu^*(p_W)',
    vertices: [
      {
        id: 'V1',
        label: 'V₁ (tbW⁺)',
        position: { x: 0.45, y: 0.5 },
        interaction: 'WeakCharged',
        incomingParticles: ['t'],
        outgoingParticles: ['b', 'w_plus'],
        couplingLabel: '-i(g_w/2√2)γ^μ(1-γ⁵)V_tb',
      },
    ],
    legs: [
      { id: 'L1', particleId: 't', label: 't quark (in)', role: 'incoming', startPos: { x: 0.15, y: 0.5 }, endPos: { x: 0.45, y: 0.5 }, style: 'fermion', arrowForward: true },
      { id: 'L2', particleId: 'b', label: 'b quark (out)', role: 'outgoing', startPos: { x: 0.45, y: 0.5 }, endPos: { x: 0.85, y: 0.22 }, style: 'fermion', arrowForward: true },
      { id: 'L3', particleId: 'w_plus', label: 'W⁺ boson', role: 'outgoing', startPos: { x: 0.45, y: 0.5 }, endPos: { x: 0.85, y: 0.78 }, style: 'weak' },
    ],
  },

  // 8. Compton Scattering (e⁻ + γ → e⁻ + γ)
  compton_scattering: {
    id: 'compton_scattering',
    name: 'Compton Scattering (e⁻ + γ → e⁻ + γ)',
    category: 'QED',
    equation: 'e⁻ + γ → e⁻* → e⁻ + γ (s-channel & u-channel)',
    description: 'Scattering of a high-energy photon by a free electron. The photon transfers momentum to the electron, causing a wavelength shift Δλ = λ_c (1 - cos θ).',
    availableChannels: ['s-channel', 'u-channel'],
    defaultChannel: 's-channel',
    physicsNotes: 'Klein–Nishina relativistic cross section. In s-channel, an electron absorbs the incoming photon to form an intermediate off-shell electron propagator.',
    amplitudeLaTeX: 'i\\mathcal{M} = -ie^2 \\bar{u}(p\') \\left[ \\frac{\\epsilon\\llap{/}\' (p\\llap{/} + k\\llap{/} + m) \\epsilon\\llap{/}}{s - m^2} + \\frac{\\epsilon\\llap{/} (p\\llap{/} - k\\llap{/}\' + m) \\epsilon\\llap{/}\'}{u - m^2} \\right] u(p)',
    vertices: [
      {
        id: 'V1',
        label: 'V₁ (e⁻γ absorption)',
        position: { x: 0.38, y: 0.5 },
        interaction: 'QED',
        incomingParticles: ['e_minus', 'gamma'],
        outgoingParticles: ['e_minus'],
        couplingLabel: '-ie γ^μ',
      },
      {
        id: 'V2',
        label: 'V₂ (e⁻γ emission)',
        position: { x: 0.62, y: 0.5 },
        interaction: 'QED',
        incomingParticles: ['e_minus'],
        outgoingParticles: ['e_minus', 'gamma'],
        couplingLabel: '-ie γ^ν',
      },
    ],
    legs: [
      { id: 'L1', particleId: 'e_minus', label: 'e⁻ (in)', role: 'incoming', startPos: { x: 0.12, y: 0.25 }, endPos: { x: 0.38, y: 0.5 }, style: 'fermion', arrowForward: true },
      { id: 'L2', particleId: 'gamma', label: 'γ (in)', role: 'incoming', startPos: { x: 0.12, y: 0.75 }, endPos: { x: 0.38, y: 0.5 }, style: 'photon' },
      { id: 'L_prop', particleId: 'e_minus', label: 'e⁻* (propagator)', role: 'propagator', startPos: { x: 0.38, y: 0.5 }, endPos: { x: 0.62, y: 0.5 }, style: 'fermion', arrowForward: true },
      { id: 'L3', particleId: 'e_minus', label: 'e⁻ (out)', role: 'outgoing', startPos: { x: 0.62, y: 0.5 }, endPos: { x: 0.88, y: 0.25 }, style: 'fermion', arrowForward: true },
      { id: 'L4', particleId: 'gamma', label: 'γ (scattered)', role: 'outgoing', startPos: { x: 0.62, y: 0.5 }, endPos: { x: 0.88, y: 0.75 }, style: 'photon' },
    ],
  },
}

/**
 * Checks conservation for an entire diagram
 */
export function checkDiagramConservation(preset: FeynmanPreset): DiagramConservationResult {
  const vertexResults: Record<string, VertexConservationResult> = {}
  let valid = true
  const errors: string[] = []

  for (const v of preset.vertices) {
    const res = checkVertexConservation(v.incomingParticles, v.outgoingParticles)
    vertexResults[v.id] = res
    if (!res.valid) {
      valid = false
      errors.push(`Vertex ${v.label}: ${res.errors.join('; ')}`)
    }
  }

  // Global initial vs final check
  const incomingIds = preset.legs.filter((l) => l.role === 'incoming').map((l) => l.particleId)
  const outgoingIds = preset.legs.filter((l) => l.role === 'outgoing').map((l) => l.particleId)
  const globalCheck = checkVertexConservation(incomingIds, outgoingIds)
  if (!globalCheck.valid) {
    valid = false
    errors.push(`Global Conservation: ${globalCheck.errors.join('; ')}`)
  }

  return {
    valid,
    vertexResults,
    globalValid: globalCheck.valid,
    errors,
  }
}

// ----------------------------------------------------------------------------
// 5. Relativistic Breit–Wigner Resonance & Collider Cross Sections
// ----------------------------------------------------------------------------

export interface ResonanceParameters {
  id: string
  name: string
  symbol: string
  massGeV: number
  widthGeV: number
  gammaInGeV: number
  gammaOutGeV: number
  channelName: string
  collider: string
  discoveryYear: number
  defaultEmin: number
  defaultEmax: number
  notes: string
}

export const RESONANCE_CATALOG: Record<string, ResonanceParameters> = {
  z_zero: {
    id: 'z_zero',
    name: 'Z⁰ Boson Pole',
    symbol: 'Z⁰',
    massGeV: 91.1876,
    widthGeV: 2.4952,
    gammaInGeV: 0.0839, // e+e- partial width
    gammaOutGeV: 1.7444, // hadronic partial width
    channelName: 'e⁺e⁻ → Z⁰ → hadrons',
    collider: 'LEP (CERN) & SLC (SLAC)',
    discoveryYear: 1983,
    defaultEmin: 82,
    defaultEmax: 102,
    notes: 'Precise measurement of line shape at LEP established N_ν = 2.984 ± 0.008 light neutrino species.',
  },
  w_boson: {
    id: 'w_boson',
    name: 'W± Boson Resonance',
    symbol: 'W±',
    massGeV: 80.377,
    widthGeV: 2.085,
    gammaInGeV: 0.226,
    gammaOutGeV: 1.405,
    channelName: 'q q̄\' → W⁺ → ℓ⁺ ν_ℓ',
    collider: 'SPS (UA1/UA2) & Tevatron & LHC',
    discoveryYear: 1983,
    defaultEmin: 72,
    defaultEmax: 92,
    notes: 'Electroweak charged gauge boson with W mass intimately tied to Fermi constant and top quark loop corrections.',
  },
  higgs: {
    id: 'higgs',
    name: 'Higgs Boson (H⁰)',
    symbol: 'H⁰',
    massGeV: 125.25,
    widthGeV: 0.0041, // 4.1 MeV
    gammaInGeV: 0.000336, // gg initial state effective
    gammaOutGeV: 0.00238, // bb partial width
    channelName: 'gg → H⁰ → b b̄',
    collider: 'LHC (ATLAS & CMS)',
    discoveryYear: 2012,
    defaultEmin: 125.23,
    defaultEmax: 125.27,
    notes: 'Extremely narrow resonance (Γ = 4.1 MeV), resolution at LHC is detector-limited (1-2 GeV in diphoton and 4-lepton channels).',
  },
  j_psi: {
    id: 'j_psi',
    name: 'J/ψ Charmonium (cc̄)',
    symbol: 'J/ψ',
    massGeV: 3.0969,
    widthGeV: 0.0000926, // 92.6 keV = 9.26e-5 GeV
    gammaInGeV: 0.00000555,
    gammaOutGeV: 0.0000814,
    channelName: 'e⁺e⁻ → J/ψ → hadrons',
    collider: 'SPEAR (SLAC) & AGS (BNL)',
    discoveryYear: 1974,
    defaultEmin: 3.0964,
    defaultEmax: 3.0974,
    notes: 'November Revolution: dramatic ultra-narrow resonance confirmed the charm quark predicted by Glashow-Iliopoulos-Maiani.',
  },
  upsilon: {
    id: 'upsilon',
    name: 'Υ(1S) Bottomonium (bb̄)',
    symbol: 'Υ(1S)',
    massGeV: 9.4603,
    widthGeV: 0.00005402, // 54.02 keV = 5.402e-5 GeV
    gammaInGeV: 0.00000134,
    gammaOutGeV: 0.0000441,
    channelName: 'e⁺e⁻ → Υ → μ⁺μ⁻ / hadrons',
    collider: 'Fermilab (E288 Lederman)',
    discoveryYear: 1977,
    defaultEmin: 9.4598,
    defaultEmax: 9.4608,
    notes: 'Bound state of bottom and anti-bottom quarks with J^PC = 1⁻⁻.',
  },
}

/**
 * Physical constants in natural/collider units:
 *   ħ*c ≈ 0.197327 GeV * fm
 *   (ħ*c)² ≈ 0.389379 GeV² * mbarn = 3.89379 × 10⁸ GeV² * pb = 3.89379 × 10⁵ GeV² * nb
 *   ħ = 6.582119569 × 10⁻²⁵ GeV·s
 */
export const HBAR_C2_NB_GEV2 = 389379.338 // (hbar*c)^2 in nb * GeV^2
export const HBAR_GEV_S = 6.582119569e-25  // hbar in GeV * s

/**
 * Relativistic Breit–Wigner cross section formula:
 *   σ(E) = [12π (ħc)² / M²] * [ (Γ_in * Γ_out) / ((E² - M²)² + M² Γ²) ]
 *
 * @param E Center of mass energy in GeV
 * @param M Resonance mass in GeV
 * @param Gamma Total decay width in GeV
 * @param GammaIn Partial width to initial state in GeV
 * @param GammaOut Partial width to final state in GeV
 * @returns Cross section σ in nanobarns (nb)
 */
export function relativisticBreitWigner(
  E: number,
  M: number,
  Gamma: number,
  GammaIn: number,
  GammaOut: number,
): number {
  if (E <= 0 || M <= 0 || Gamma <= 0) return 0
  const numerator = 12 * Math.PI * HBAR_C2_NB_GEV2 * GammaIn * GammaOut
  const s = E * E
  const M2 = M * M
  const denominator = M2 * ((s - M2) * (s - M2) + M2 * Gamma * Gamma)
  return numerator / denominator
}

export interface CurvePoint {
  E: number
  sigma: number
}

export interface ResonanceCurveResult {
  params: ResonanceParameters
  points: CurvePoint[]
  peakE: number
  peakSigma: number
  fwhm: number
  halfMax: number
  lifetimeSec: number
}

/**
 * Computes the Breit–Wigner curve across a grid and calculates
 * peak energy, peak cross section, FWHM (Full Width at Half Maximum),
 * and decay lifetime τ = ħ / Γ.
 */
export function computeResonanceCurve(
  paramKey: string,
  numPoints: number = 250,
  userEmin?: number,
  userEmax?: number,
): ResonanceCurveResult {
  const p = RESONANCE_CATALOG[paramKey]
  if (!p) throw new Error(`Unknown resonance key: ${paramKey}`)

  const Emin = userEmin ?? p.defaultEmin
  const Emax = userEmax ?? p.defaultEmax
  const step = (Emax - Emin) / (numPoints - 1)

  const points: CurvePoint[] = []
  let peakE = p.massGeV
  let peakSigma = 0

  for (let i = 0; i < numPoints; i++) {
    const E = Emin + i * step
    const sigma = relativisticBreitWigner(E, p.massGeV, p.widthGeV, p.gammaInGeV, p.gammaOutGeV)
    points.push({ E, sigma })
    if (sigma > peakSigma) {
      peakSigma = sigma
      peakE = E
    }
  }

  // Calculate FWHM
  const halfMax = peakSigma / 2
  let eLow = Emin
  let eHigh = Emax

  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].sigma <= halfMax && points[i + 1].sigma >= halfMax) {
      const frac = (halfMax - points[i].sigma) / (points[i + 1].sigma - points[i].sigma)
      eLow = points[i].E + frac * (points[i + 1].E - points[i].E)
      break
    }
  }

  for (let i = points.length - 1; i > 0; i--) {
    if (points[i].sigma <= halfMax && points[i - 1].sigma >= halfMax) {
      const frac = (halfMax - points[i].sigma) / (points[i - 1].sigma - points[i].sigma)
      eHigh = points[i].E + frac * (points[i - 1].E - points[i].E)
      break
    }
  }

  const fwhm = Math.abs(eHigh - eLow)
  const lifetimeSec = HBAR_GEV_S / p.widthGeV

  return {
    params: p,
    points,
    peakE,
    peakSigma,
    fwhm,
    halfMax,
    lifetimeSec,
  }
}

// ----------------------------------------------------------------------------
// 6. Decay Chains & Branching Fractions Data
// ----------------------------------------------------------------------------

export interface DecayMode {
  channel: string
  branchingFraction: number // 0..1
  fractionDisplay: string
  color: string
  interaction: InteractionCategory
  finalState: string
  physicsDetail: string
}

export interface ParticleDecayProfile {
  id: string
  name: string
  symbol: string
  massDisplay: string
  totalWidthDisplay: string
  lifetimeDisplay: string
  modes: DecayMode[]
}

export const DECAY_PROFILES: Record<string, ParticleDecayProfile> = {
  higgs: {
    id: 'higgs',
    name: 'Higgs Boson (H⁰, 125.25 GeV)',
    symbol: 'H⁰',
    massDisplay: '125.25 GeV/c²',
    totalWidthDisplay: '4.1 MeV',
    lifetimeDisplay: '1.56 × 10⁻²² s',
    modes: [
      { channel: 'b + b̄', branchingFraction: 0.582, fractionDisplay: '58.2%', color: '#38bdf8', interaction: 'Higgs', finalState: 'Bottom quark pair', physicsDetail: 'Largest branching fraction due to m_b (4.18 GeV) being the heaviest kinematically open fermion pair.' },
      { channel: 'W⁺ + W⁻*', branchingFraction: 0.214, fractionDisplay: '21.4%', color: '#818cf8', interaction: 'WeakCharged', finalState: 'W pair (one off-shell)', physicsDetail: 'Gauge coupling g * M_W. Dominates electroweak vector boson modes.' },
      { channel: 'g + g', branchingFraction: 0.0819, fractionDisplay: '8.19%', color: '#f59e0b', interaction: 'QCD', finalState: 'Gluon pair (top quark triangle loop)', physicsDetail: 'Effective dimension-5 loop operator mediated by virtual top quarks.' },
      { channel: 'τ⁺ + τ⁻', branchingFraction: 0.0627, fractionDisplay: '6.27%', color: '#ec4899', interaction: 'Higgs', finalState: 'Tau lepton pair', physicsDetail: 'Heaviest charged lepton; measured via ditau hadronic/leptonic decays.' },
      { channel: 'c + c̄', branchingFraction: 0.0289, fractionDisplay: '2.89%', color: '#10b981', interaction: 'Higgs', finalState: 'Charm quark pair', physicsDetail: 'Second-generation quark Yukawa coupling test.' },
      { channel: 'Z⁰ + Z⁰*', branchingFraction: 0.0262, fractionDisplay: '2.62%', color: '#a855f7', interaction: 'WeakNeutral', finalState: 'Golden 4-lepton channel (e⁺e⁻μ⁺μ⁻)', physicsDetail: 'Cleanest experimental signature; led to the July 2012 discovery.' },
      { channel: 'γ + γ', branchingFraction: 0.00227, fractionDisplay: '0.227%', color: '#eab308', interaction: 'QED', finalState: 'Diphoton resonance', physicsDetail: 'Loop-induced via destructive interference between W boson loop and top loop.' },
      { channel: 'Z⁰ + γ', branchingFraction: 0.00154, fractionDisplay: '0.154%', color: '#06b6d4', interaction: 'WeakNeutral', finalState: 'Z boson + photon', physicsDetail: 'Rare electroweak loop transition.' },
      { channel: 'μ⁺ + μ⁻', branchingFraction: 0.00022, fractionDisplay: '0.022%', color: '#f43f5e', interaction: 'Higgs', finalState: 'Muon pair', physicsDetail: 'First evidence of Higgs coupling to second-generation fermions at the LHC.' },
    ],
  },
  z_zero: {
    id: 'z_zero',
    name: 'Z⁰ Boson (91.19 GeV)',
    symbol: 'Z⁰',
    massDisplay: '91.1876 GeV/c²',
    totalWidthDisplay: '2.4952 GeV',
    lifetimeDisplay: '2.64 × 10⁻²⁵ s',
    modes: [
      { channel: 'Hadrons (q q̄)', branchingFraction: 0.6991, fractionDisplay: '69.91%', color: '#f59e0b', interaction: 'QCD', finalState: 'Quark-antiquark 2-jet & 3-jet events', physicsDetail: 'Sum of u, d, s, c, b quark pairs.' },
      { channel: 'Invisible (ν ν̄)', branchingFraction: 0.2000, fractionDisplay: '20.00%', color: '#94a3b8', interaction: 'WeakNeutral', finalState: 'Three generations of neutrino pairs', physicsDetail: 'Determined by subtracting visible leptonic and hadronic widths from Γ_total.' },
      { channel: 'e⁺ + e⁻', branchingFraction: 0.03363, fractionDisplay: '3.363%', color: '#38bdf8', interaction: 'WeakNeutral', finalState: 'Dielectron', physicsDetail: 'Universal vector/axial-vector neutral current coupling.' },
      { channel: 'μ⁺ + μ⁻', branchingFraction: 0.03366, fractionDisplay: '3.366%', color: '#a855f7', interaction: 'WeakNeutral', finalState: 'Dimuon', physicsDetail: 'Lepton universality test: Γ_μ / Γ_e = 1.0009 ± 0.0028.' },
      { channel: 'τ⁺ + τ⁻', branchingFraction: 0.03367, fractionDisplay: '3.367%', color: '#ec4899', interaction: 'WeakNeutral', finalState: 'Ditau', physicsDetail: 'Lepton universality test: Γ_τ / Γ_e = 1.0019 ± 0.0032.' },
    ],
  },
  w_plus: {
    id: 'w_plus',
    name: 'W⁺ Boson (80.38 GeV)',
    symbol: 'W⁺',
    massDisplay: '80.377 GeV/c²',
    totalWidthDisplay: '2.085 GeV',
    lifetimeDisplay: '3.16 × 10⁻²⁵ s',
    modes: [
      { channel: 'Hadrons (u d̄, c s̄)', branchingFraction: 0.6741, fractionDisplay: '67.41%', color: '#f59e0b', interaction: 'WeakCharged', finalState: 'Quark pairs with color factor N_c = 3', physicsDetail: 'Calculated from 3 * (|V_ud|² + |V_us|² + |V_cd|² + |V_cs|²).' },
      { channel: 'e⁺ + ν_e', branchingFraction: 0.1071, fractionDisplay: '10.71%', color: '#38bdf8', interaction: 'WeakCharged', finalState: 'Positron + electron neutrino', physicsDetail: 'Pure charged current (V-A) decay.' },
      { channel: 'μ⁺ + ν_μ', branchingFraction: 0.1063, fractionDisplay: '10.63%', color: '#a855f7', interaction: 'WeakCharged', finalState: 'Antimuon + muon neutrino', physicsDetail: 'Equal to electron channel within lepton universality.' },
      { channel: 'τ⁺ + ν_τ', branchingFraction: 0.1125, fractionDisplay: '11.25%', color: '#ec4899', interaction: 'WeakCharged', finalState: 'Antitau + tau neutrino', physicsDetail: 'Includes phase-space correction for m_τ.' },
    ],
  },
  tau_minus: {
    id: 'tau_minus',
    name: 'Tau Lepton (τ⁻, 1.777 GeV)',
    symbol: 'τ⁻',
    massDisplay: '1.77686 GeV/c²',
    totalWidthDisplay: '2.27 × 10⁻⁹ MeV',
    lifetimeDisplay: '2.903 × 10⁻¹³ s',
    modes: [
      { channel: 'Hadrons + ν_τ', branchingFraction: 0.6479, fractionDisplay: '64.79%', color: '#f59e0b', interaction: 'WeakCharged', finalState: 'π⁻ ν_τ (10.8%), π⁻ π⁰ ν_τ (25.5%), 3π ν_τ (18.3%)', physicsDetail: 'Only lepton heavy enough to decay hadronically.' },
      { channel: 'e⁻ + ν̄_e + ν_τ', branchingFraction: 0.1782, fractionDisplay: '17.82%', color: '#38bdf8', interaction: 'WeakCharged', finalState: 'Electron + 2 neutrinos', physicsDetail: 'Standard Michel parameter measurement.' },
      { channel: 'μ⁻ + ν̄_μ + ν_τ', branchingFraction: 0.1739, fractionDisplay: '17.39%', color: '#a855f7', interaction: 'WeakCharged', finalState: 'Muon + 2 neutrinos', physicsDetail: 'Slightly lower than electron mode due to muon mass phase space factor 0.973.' },
    ],
  },
  top: {
    id: 'top',
    name: 'Top Quark (t, 172.69 GeV)',
    symbol: 't',
    massDisplay: '172.69 GeV/c²',
    totalWidthDisplay: '1.42 GeV',
    lifetimeDisplay: '5.0 × 10⁻²⁵ s',
    modes: [
      { channel: 'W⁺ + b', branchingFraction: 0.998, fractionDisplay: '99.8%', color: '#818cf8', interaction: 'WeakCharged', finalState: 'On-shell W boson + b quark', physicsDetail: 'Driven by CKM matrix element |V_tb| ≈ 0.999.' },
      { channel: 'W⁺ + s', branchingFraction: 0.0016, fractionDisplay: '0.16%', color: '#10b981', interaction: 'WeakCharged', finalState: 'Cabibbo-suppressed mode', physicsDetail: '|V_ts|² ≈ (0.041)² ≈ 0.0017.' },
      { channel: 'W⁺ + d', branchingFraction: 0.00005, fractionDisplay: '0.005%', color: '#38bdf8', interaction: 'WeakCharged', finalState: 'Doubly Cabibbo-suppressed', physicsDetail: '|V_td|² ≈ (0.0086)² ≈ 0.00007.' },
    ],
  },
  pion_plus: {
    id: 'pion_plus',
    name: 'Charged Pion (π⁺, 139.57 MeV)',
    symbol: 'π⁺',
    massDisplay: '139.57 MeV/c²',
    totalWidthDisplay: '2.53 × 10⁻¹¹ MeV',
    lifetimeDisplay: '2.6033 × 10⁻⁸ s',
    modes: [
      { channel: 'μ⁺ + ν_μ', branchingFraction: 0.999877, fractionDisplay: '99.9877%', color: '#a855f7', interaction: 'WeakCharged', finalState: 'Antimuon + muon neutrino', physicsDetail: 'Dominated by helicity suppression of the positron mode.' },
      { channel: 'e⁺ + ν_e', branchingFraction: 0.000123, fractionDisplay: '0.0123%', color: '#38bdf8', interaction: 'WeakCharged', finalState: 'Positron + electron neutrino', physicsDetail: 'Suppressed by factor (m_e / m_μ)² = 2.3 × 10⁻⁵ due to V-A chiral projection on spin-0 pion.' },
    ],
  },
}
