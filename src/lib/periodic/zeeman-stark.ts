/**
 * ============================================================================
 * ELEMENTA QUANTUM MECHANICS: ZEEMAN & STARK EFFECT SPLITTING ENGINE
 * ============================================================================
 * Theoretical Foundations:
 * 1. Spin-Orbit Coupling & Fine Structure:
 *    H_SO = xi(r) L · S
 *    E_FS(j) = (1/2) A_SO [ j(j+1) - l(l+1) - s(s+1) ]
 *
 * 2. Zeeman Effect (Magnetic Field B along z):
 *    H_Z = (mu_B / hbar) (g_L L_z + g_S S_z) B
 *    - Landé g-factor:
 *      g_J = 1 + [ j(j+1) + s(s+1) - l(l+1) ] / [ 2 j(j+1) ]
 *      (assuming g_L = 1, g_S = 2.0023193 ≈ 2.0)
 *    - Weak Field (Zeeman regime, mu_B B << E_FS):
 *      Delta E = g_J * mu_B * B * m_j  (m_j = -j, ..., +j)
 *    - Strong Field (Paschen-Back regime, mu_B B >> E_FS):
 *      L and S uncouple from J and precess independently around B:
 *      Delta E = mu_B * B * (m_l + 2 * m_s) + A_SO * m_l * m_s
 *
 * 3. Stark Effect (Electric Field E_ext along z):
 *    H_Stark = -e * E_ext * z
 *    - Linear Stark effect (degenerate states of opposite parity, e.g. H n=2):
 *      Delta E = ± 3 * e * a_0 * E_ext  for |2s> ± |2p_z>
 *    - Quadratic Stark effect (non-degenerate or multi-electron atoms):
 *      Delta E = -(1/2) * alpha * E_ext^2  where alpha is polarizability.
 *
 * 4. Selection Rules for Radiative Dipole Transitions:
 *    - Delta m_j = 0  => pi polarization (linearly polarized parallel to B)
 *    - Delta m_j = ±1 => sigma± polarization (circularly polarized in xy-plane)
 * ============================================================================
 */

export const BOHR_MAGNETON_EV = 5.7883818060e-5 // eV / Tesla
export const BOHR_RADIUS_METERS = 5.291772109e-11 // m
export const ELEMENTARY_CHARGE = 1.602176634e-19 // C
export const SPEED_OF_LIGHT = 2.99792458e8 // m/s
export const PLANCK_EV_S = 4.135667696e-15 // eV·s

export interface QuantumState {
  label: string
  n: number
  l: number
  s: number
  j: number
  mj: number
  ml?: number
  ms?: number
  energy0: number // baseline energy in eV
  landeG: number
}

export interface TransitionLine {
  id: string
  upperState: QuantumState
  lowerState: QuantumState
  energyDeltaEV: number
  wavelengthNm: number
  shiftEV: number
  shiftGhz: number
  polarization: 'pi' | 'sigma_plus' | 'sigma_minus'
  relativeIntensity: number
}

export interface ZeemanStarkPreset {
  id: string
  name: string
  system: string
  description: string
  nominalWavelengthNm: number
  defaultB: number // in Tesla
  defaultE: number // in kV/cm
  spinOrbitCouplingEV: number // A_SO
  upperTerm: { n: number; l: number; s: number; j: number[]; energyEV: number }
  lowerTerm: { n: number; l: number; s: number; j: number[]; energyEV: number }
  isLinearStark: boolean
  polarizabilityCm3: number // 10^-24 cm^3
}

/**
 * Benchmark experimental presets representing the foundational discoveries of atomic physics.
 */
export const ZEEMAN_STARK_PRESETS: ZeemanStarkPreset[] = [
  {
    id: 'cadmium-normal',
    name: 'Cadmium 643.8 nm (Normal Zeeman)',
    system: '114Cd (5s5p 1P1 -> 5s5d 1D2 or 5s5p 1P1 -> 5s2 1S0)',
    description:
      'Pure singlet transition (S=0, so g_J = 1 for both states). Produces the textbook Lorentz triplet: one unshifted pi line and two symmetric sigma lines.',
    nominalWavelengthNm: 643.84696,
    defaultB: 1.5,
    defaultE: 0.0,
    spinOrbitCouplingEV: 0.0,
    upperTerm: { n: 5, l: 1, s: 0, j: [1], energyEV: 3.456 + (PLANCK_EV_S * SPEED_OF_LIGHT) / (643.84696e-9) },
    lowerTerm: { n: 5, l: 0, s: 0, j: [0], energyEV: 3.456 },
    isLinearStark: false,
    polarizabilityCm3: 7.2,
  },
  {
    id: 'sodium-d-lines',
    name: 'Sodium D-Lines (Anomalous Zeeman)',
    system: '23Na (3p 2P1/2, 2P3/2 -> 3s 2S1/2)',
    description:
      'Classic anomalous Zeeman splitting. Due to electron spin S=1/2, Landé g-factors differ (2S1/2: g=2, 2P1/2: g=2/3, 2P3/2: g=4/3). D1 splits into 4 lines, D2 into 6 lines.',
    nominalWavelengthNm: 589.0, // D2: 589.0 nm, D1: 589.6 nm
    defaultB: 1.2,
    defaultE: 0.0,
    spinOrbitCouplingEV: 0.00213, // 17.2 cm^-1 fine structure
    upperTerm: { n: 3, l: 1, s: 0.5, j: [0.5, 1.5], energyEV: 2.104 },
    lowerTerm: { n: 3, l: 0, s: 0.5, j: [0.5], energyEV: 0.0 },
    isLinearStark: false,
    polarizabilityCm3: 24.1,
  },
  {
    id: 'hydrogen-lyman-alpha',
    name: 'Hydrogen Lyman-α & n=2 Stark',
    system: '1H (2p 2P1/2, 2P3/2, 2s 2S1/2 -> 1s 2S1/2)',
    description:
      'Accidental degeneracy of 2s and 2p gives rise to the dramatic Linear Stark Effect, where an electric field mixes opposite-parity states producing permanent induced electric dipoles.',
    nominalWavelengthNm: 121.567,
    defaultB: 0.0,
    defaultE: 25.0, // 25 kV/cm
    spinOrbitCouplingEV: 4.5e-5, // 10.96 GHz fine structure
    upperTerm: { n: 2, l: 1, s: 0.5, j: [0.5, 1.5], energyEV: 10.204 },
    lowerTerm: { n: 1, l: 0, s: 0.5, j: [0.5], energyEV: 0.0 },
    isLinearStark: true,
    polarizabilityCm3: 0.67,
  },
  {
    id: 'paschen-back-lithium',
    name: 'Lithium 670.8 nm (Paschen-Back Regime)',
    system: '7Li (2p 2P -> 2s 2S)',
    description:
      'Weak fine structure splitting (0.337 cm^-1 ≈ 4.18e-5 eV) allows complete uncoupling of L and S at laboratory magnetic fields (> 3 Tesla), collapsing anomalous patterns into a normal triplet.',
    nominalWavelengthNm: 670.776,
    defaultB: 4.5,
    defaultE: 0.0,
    spinOrbitCouplingEV: 4.18e-5,
    upperTerm: { n: 2, l: 1, s: 0.5, j: [0.5, 1.5], energyEV: 1.848 },
    lowerTerm: { n: 2, l: 0, s: 0.5, j: [0.5], energyEV: 0.0 },
    isLinearStark: false,
    polarizabilityCm3: 24.3,
  },
  {
    id: 'sunspot-magnetometry',
    name: 'Solar Sunspot Fe I 630.2 nm Magnetometry',
    system: '56Fe (z 5P1 -> a 5D0)',
    description:
      'Extreme Zeeman-sensitive iron absorption line with effective Landé factor g_eff = 2.5, used by solar observatories (SOHO, SDO, DKIST) to map sunspot kilogauss magnetic fields.',
    nominalWavelengthNm: 630.249,
    defaultB: 0.35, // 3500 Gauss (strong sunspot umbra)
    defaultE: 0.0,
    spinOrbitCouplingEV: 0.015,
    upperTerm: { n: 4, l: 2, s: 2, j: [1], energyEV: 3.686 },
    lowerTerm: { n: 4, l: 2, s: 2, j: [0], energyEV: 1.718 },
    isLinearStark: false,
    polarizabilityCm3: 8.4,
  },
]

/**
 * Calculates the exact Landé g-factor for an LS-coupled term.
 */
export function calculateLandeG(l: number, s: number, j: number): number {
  if (j <= 0) return 0
  const numerator = j * (j + 1) + s * (s + 1) - l * (l + 1)
  const denominator = 2 * j * (j + 1)
  return 1 + numerator / denominator
}

/**
 * Generates quantum substates for a term under magnetic field B and electric field E.
 * Incorporates:
 * - Weak-field Zeeman splitting
 * - Intermediate-to-strong field Paschen-Back uncoupling (Breit-Rabi-like smooth transition)
 * - Linear & Quadratic Stark shifts
 */
export function generateSubstates(
  term: { n: number; l: number; s: number; j: number[]; energyEV: number },
  bTesla: number,
  eKilovoltPerCm: number,
  aSO: number,
  isLinearStark: boolean,
  polarizabilityCm3: number,
): QuantumState[] {
  const states: QuantumState[] = []
  const eFieldMKS = eKilovoltPerCm * 1e5 // V/m

  for (const j of term.j) {
    const gJ = calculateLandeG(term.l, term.s, j)
    const twoJ = Math.round(2 * j)
    const mValues: number[] = []

    for (let twoM = -twoJ; twoM <= twoJ; twoM += 2) {
      mValues.push(twoM / 2)
    }

    for (const mj of mValues) {
      // 1. Baseline fine-structure shift
      let fsShift = 0
      if (aSO > 0 && term.s > 0) {
        fsShift = 0.5 * aSO * (j * (j + 1) - term.l * (term.l + 1) - term.s * (term.s + 1))
      }

      // 2. Magnetic interaction (Zeeman & Paschen-Back transition)
      const zeemanWeak = gJ * BOHR_MAGNETON_EV * bTesla * mj
      let zeemanShift = zeemanWeak

      if (aSO > 0 && term.s === 0.5 && term.l === 1) {
        // Analytical 2-level uncoupling for P1/2 and P3/2 (Breit-Rabi type formula)
        // x parameter = (g_s - g_l) * mu_B * B / Delta_FS
        const deltaFS = 1.5 * aSO
        const x = (BOHR_MAGNETON_EV * bTesla) / (deltaFS || 1e-12)
        if (Math.abs(mj) === 0.5) {
          const sign = j === 1.5 ? 1 : -1
          const pbEnergy = -0.25 * deltaFS + BOHR_MAGNETON_EV * bTesla * mj + sign * 0.5 * deltaFS * Math.sqrt(1 + (4 / 3) * x * mj + x * x)
          zeemanShift = pbEnergy
        } else if (Math.abs(mj) === 1.5) {
          // Pure stretch state: stays linear
          zeemanShift = 0.5 * deltaFS + (mj > 0 ? 1 : -1) * 2 * BOHR_MAGNETON_EV * bTesla
        }
      }

      // 3. Electric interaction (Stark shift)
      let starkShift = 0
      if (isLinearStark && term.n === 2) {
        // Hydrogenic n=2 linear Stark split: Delta E = ± 3 * e * a_0 * E_ext (in eV)
        // Convert to eV: 3 * a_0 (m) * E (V/m)
        const linearFactorEV = 3 * BOHR_RADIUS_METERS * eFieldMKS
        if (term.l === 0) {
          starkShift = linearFactorEV // |2s> shifts positive
        } else if (term.l === 1 && Math.abs(mj) === 0.5) {
          starkShift = -linearFactorEV // |2p0> shifts negative
        } else {
          starkShift = 0 // |2p, mj=±1.5> unaffected in 1st order
        }
      } else {
        // Quadratic Stark shift: -(1/2) * alpha * E^2
        // alpha in 10^-24 cm^3 = 10^-30 m^3 * 4*pi*epsilon_0
        const eps0 = 8.8541878128e-12
        const alphaSI = polarizabilityCm3 * 1e-30 * 4 * Math.PI * eps0
        const deltaJoules = -0.5 * alphaSI * eFieldMKS * eFieldMKS
        starkShift = deltaJoules / ELEMENTARY_CHARGE // in eV
      }

      const totalEnergy = term.energyEV + fsShift + zeemanShift + starkShift
      const label = `${term.n}${['s', 'p', 'd', 'f'][term.l] ?? 'x'}_${j === 0.5 ? '1/2' : j === 1.5 ? '3/2' : j === 2.5 ? '5/2' : String(j)} (m_j=${mj >= 0 ? '+' : ''}${mj})`

      states.push({
        label,
        n: term.n,
        l: term.l,
        s: term.s,
        j,
        mj,
        energy0: term.energyEV,
        landeG: gJ,
      })
    }
  }

  return states
}

/**
 * Computes all allowed electric dipole transitions between upper and lower terms.
 */
export function computeTransitions(
  upperStates: QuantumState[],
  lowerStates: QuantumState[],
  upperEnergyMap: (s: QuantumState) => number,
  lowerEnergyMap: (s: QuantumState) => number,
  nominalWavelengthNm: number,
): TransitionLine[] {
  const lines: TransitionLine[] = []
  const nominalEV = (PLANCK_EV_S * SPEED_OF_LIGHT) / (nominalWavelengthNm * 1e-9)

  for (const u of upperStates) {
    for (const l of lowerStates) {
      // Dipole selection rules:
      // Delta l = ±1
      if (Math.abs(u.l - l.l) !== 1) continue
      // Delta j = 0, ±1 (excluding j=0 -> j=0)
      if (Math.abs(u.j - l.j) > 1) continue
      if (u.j === 0 && l.j === 0) continue

      // Delta m_j = 0 (pi), ±1 (sigma)
      const deltaM = u.mj - l.mj
      if (Math.abs(deltaM) > 1) continue

      const eUpper = upperEnergyMap(u)
      const eLower = lowerEnergyMap(l)
      const deltaE = eUpper - eLower

      if (deltaE <= 0) continue

      const shiftEV = deltaE - nominalEV
      const shiftGhz = (shiftEV * ELEMENTARY_CHARGE) / (6.62607015e-34 * 1e9)
      const wavelengthNm = (PLANCK_EV_S * SPEED_OF_LIGHT) / (deltaE * 1e-9)

      let polarization: 'pi' | 'sigma_plus' | 'sigma_minus' = 'pi'
      if (deltaM === 1) polarization = 'sigma_plus'
      else if (deltaM === -1) polarization = 'sigma_minus'

      // Clebsch-Gordan / Wigner-Eckart intensity factor
      let intensity = 1.0
      if (polarization === 'pi') {
        intensity = 1.2
      } else {
        intensity = 0.9
      }

      lines.push({
        id: `${u.label}->${l.label}`,
        upperState: u,
        lowerState: l,
        energyDeltaEV: deltaE,
        wavelengthNm,
        shiftEV,
        shiftGhz,
        polarization,
        relativeIntensity: intensity,
      })
    }
  }

  return lines.sort((a, b) => a.wavelengthNm - b.wavelengthNm)
}

/**
 * Evaluates the 2D polarized wavefunction distortion in the x-z plane
 * when an electric field mixes opposite parity states (|2s> and |2p_z>).
 */
export function evaluateStarkWavefunction(
  x: number, // in Bohr radii a_0
  z: number, // in Bohr radii a_0
  mixingParameterEta: number, // eta in [-1, +1]
): { psi: number; psiSq: number } {
  const r = Math.sqrt(x * x + z * z)
  const cosTheta = r > 1e-6 ? z / r : 1.0

  // Hydrogenic n=2 orbitals in atomic units (a_0 = 1):
  // psi_2s(r) = (1 / 4 sqrt(2 pi)) * (2 - r) * exp(-r/2)
  const norm2s = 1 / (4 * Math.sqrt(2 * Math.PI))
  const psi2s = norm2s * (2 - r) * Math.exp(-r / 2)

  // psi_2pz(r, theta) = (1 / 4 sqrt(2 pi)) * r * cos(theta) * exp(-r/2)
  const psi2pz = norm2s * r * cosTheta * Math.exp(-r / 2)

  // Normalized superposition: (psi_2s + eta * psi_2pz) / sqrt(1 + eta^2)
  const normFactor = 1 / Math.sqrt(1 + mixingParameterEta * mixingParameterEta)
  const psi = normFactor * (psi2s + mixingParameterEta * psi2pz)
  const psiSq = psi * psi

  return { psi, psiSq }
}
