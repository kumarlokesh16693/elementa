# ELEMENTA — Complete Feature Specification & Architecture Guide

> **Research-Grade Scientific Visualization & Physics Simulation Suite**  
> Powered by **`nexus-framework`** and **`@nexus/3d`** · **Zero React Dependencies** · **Tailwind CSS**

---

## 🏛️ Application Architecture & Route Index

| Route | Application / Workspace Entry | Primary Physical Domain | Native Nexus Custom Elements |
| :--- | :--- | :--- | :--- |
| **`/index.html`** | Interactive Periodic Table of Elements | Atomic Physics, Solid-State Crystallography, Spectroscopy | `<elementa-bohr-3d>`, `<elementa-crystal-view>`, `<elementa-spectra-view>`, `<elementa-isotope-explorer>` |
| **`/mo.html`** | Molecular Orbital & Vibrational Lab | Molecular Geometry, LCAO-MO Theory, FTIR / Raman Vibrational Spectroscopy | `<elementa-vsepr-view>`, `<elementa-vibration-view>` |
| **`/orbitals.html`** | Quantum Mechanical Orbital Laboratory | Quantum Chemistry, Hydrogen-like Schrödinger Wavefunctions, Zeeman & Stark Splitting | `<elementa-orbital-view>`, `<elementa-zeeman-stark-modal>` |
| **`/segre.html`** | Interactive Segrè Chart of the Nuclides | Nuclear Physics, Bateman Decay, SEMF Fission, Cosmic Nucleosynthesis, Radiation Shielding | `<elementa-segre-view>`, `<elementa-bateman-modal>`, `<elementa-semf-modal>`, `<elementa-nucleosynthesis-modal>`, `<elementa-shielding-modal>` |
| **`/daedalus.html`** | Project Daedalus Flight Simulator | Aerothermodynamics, Hypersonic Spacecraft Atmospheric Re-entry | `<elementa-daedalus-sim>` |
| **`/em.html`** | Electromagnetism & Maxwell's Equations Lab | Electrostatics, Magnetostatics, EM Waves, Lorentz Force | `<elementa-em-field>` |
| **`/thermo.html`** | Thermodynamics & Heat Engines Lab | PV Diagrams, Heat-Engine Cycles, Entropy, Kinetic Theory, Blackbody Radiation | `<elementa-thermo>` |
| **`/relativity.html`** | Special Relativity Lab | Lorentz Boosts, Length Contraction, Time Dilation, Relativistic Doppler, Muon Decay | `<elementa-relativity>` |
| **`/quantumwave.html`** | 1D Quantum Wave Laboratory | Schrödinger Eigenstates, Heisenberg Uncertainty, Crank–Nicolson Wave Packets, Tunnelling | `<elementa-quantumwave>` |
| **`/synthesizer.html`** | Compound & Reaction Synthesizer Lab | Thermochemistry, Stoichiometry, Gibbs Free Energy & Equilibrium, 3D Molecular Structures | `<elementa-compound-3d>` |
| **`/references.html`** | Scientific References & CODATA Constants | Physical Constants, Precision Metrology, SI Base Units | Pure `nexus-framework` virtual DOM |
| **`/integrity.html`** | Cryptographic Data Audit & Provenance | Data Authenticity (NIST, IAEA, CODATA, IUPAC) | Pure `nexus-framework` virtual DOM |

---

## 🔬 1. Interactive Periodic Table (`/index.html`)

### 1.1 Complete IUPAC Element Database (Elements 1 to 118)
- **Standard Properties**: Standard atomic weight, IUPAC name, symbol, atomic number $Z$, standard chemical series, crystal structure.
- **Electron Configurations**: Ground state electronic structures with noble gas cores, term symbols, oxidation states, and valence electron counting.
- **Thermochemical & Physical Properties**: Electronegativity (Pauling scale), first to eighth ionization energies ($\text{kJ/mol}$), electron affinity, atomic radius (empirical & calculated), covalent radius, van der Waals radius, melting point, boiling point, density, molar volume, and thermal conductivity.
- **Periodic Trends & Heatmap**: Live color gradients mapped across the entire table for electronegativity, atomic radius, ionization energy, density, and electron affinity.

### 1.2 2D & 3D Interactive Bohr Atom Visualizer
- **2D Shell Model**: Concentric electron shells ($K, L, M, N, O, P, Q$) populated according to the Pauli principle ($2n^2$) with real-time electronic orbital transitions and photon emission/absorption indications.
- **3D WebGL Bohr Model (`<elementa-bohr-3d>`)**:
  - Nucleus packed with proton and neutron spheres.
  - Tilted 3D electron orbital rings with orbiting electron point masses.
  - Smooth OrbitControls for 3D examination and zoom.

### 1.3 Solid-State Crystallography & Powder XRD (`<elementa-crystal-view>`)
- **Lattice Systems**: Face-Centered Cubic (FCC), Body-Centered Cubic (BCC), Hexagonal Close-Packed (HCP), Simple Cubic, Diamond Cubic, Rock Salt ($\text{NaCl}$), and Zincblende ($\text{ZnS}$).
- **Miller Index Slicing**: Dynamic 3D semi-transparent slicing planes through crystal unit cells for planes $(h, k, l)$ such as $(100), (110), (111), (200), (220), (311)$.
- **Crystallographic Metrics**: Exact lattice parameters ($a, b, c, \alpha, \beta, \gamma$), interplanar $d$-spacing:
  $$\frac{1}{d^2} = \frac{h^2 + k^2 + l^2}{a^2}$$
  Coordination numbers and Atomic Packing Factors (APF: $74.0\%$ for FCC/HCP, $68.0\%$ for BCC, $52.4\%$ for SC, $34.0\%$ for Diamond).
- **Powder X-Ray Diffraction (XRD) Diffractometer**:
  - Bragg's Law: $\lambda = 2d \sin\theta$ for $\text{Cu } K\alpha$ radiation ($\lambda = 1.5406\,\text{\AA}$).
  - Systematic absences determined by structure factor $F_{hkl}$ selection rules (FCC all-odd/all-even, BCC even sum, Diamond $h+k+l = 4n$).
  - Synthetic $2\theta$ diffractogram ($10^\circ \text{ to } 90^\circ$) with Lorentz-polarization factor and multiplicity weighting.

### 1.4 Atomic Emission & Absorption Spectra (`<elementa-spectra-view>`)
- **Optical Fingerprints**: Continuous rainbow spectrometer strip with discrete spectral emission lines from NIST atomic spectra database ($380\,\text{nm} - 750\,\text{nm}$).
- **Grotrian Energy Level Diagrams**: State transitions ($E_i \to E_f$) displaying photon wavelength $\lambda = \frac{hc}{\Delta E}$ and transition probabilities $A_{ki}$.
- **Hydrogen Rydberg Transitions**: Lyman, Balmer, Paschen, Brackett, and Pfund series.

---

## 🧪 2. Molecular Orbital & Vibrational Laboratory (`/mo.html`)

### 2.1 3D VSEPR & Molecular Geometry (`<elementa-vsepr-view>`)
- **Steric Numbers (SN 2 to 6)**:
  - Linear ($AX_2$), Trigonal Planar ($AX_3$, $AX_2E$), Tetrahedral ($AX_4, AX_3E, AX_2E_2$), Trigonal Bipyramidal ($AX_5, AX_4E, AX_3E_2, AX_2E_3$), Octahedral ($AX_6, AX_5E, AX_4E_2$).
- **Lone Pair Repulsion Physics**: Bent angles ($104.5^\circ$ for $\text{H}_2\text{O}$, $107.8^\circ$ for $\text{NH}_3$) reflecting LP-LP > LP-BP > BP-BP repulsion.
- **Dipole Vector Field**: Net dipole moment vectors ($\vec{\mu}$) computed from bond electric dipole vectors and lone-pair centroids.
- **Coordination Polyhedra**: Translucent outer geometric envelopes.
- **Render Modes**: Ball-and-Stick, Space-Filling (van der Waals), and Wireframe.

### 2.2 Diatomic Molecular Orbital Diagrams (LCAO-MO)
- **Second-Row Homonuclear & Heteronuclear Diatomics**:
  - $\text{H}_2, \text{He}_2, \text{Li}_2, \text{Be}_2, \text{B}_2, \text{C}_2, \text{N}_2, \text{O}_2, \text{F}_2, \text{Ne}_2, \text{CO}, \text{NO}, \text{CN}, \text{LiF}$.
- **$s$-$p$ Mixing Phenomenon**: Accurate orbital energy ordering reversal:
  - For $Z < 8$ ($\text{B}_2, \text{C}_2, \text{N}_2$): $\pi_{2p_x, 2p_y} < \sigma_{2p_z}$.
  - For $Z \ge 8$ ($\text{O}_2, \text{F}_2, \text{Ne}_2$): $\sigma_{2p_z} < \pi_{2p_x, 2p_y}$.
- **Quantum Occupation & Magnetism**: Aufbau, Hund's multiplicity, Pauli exclusion principle, bond order computation, and paramagnetic vs diamagnetic character (e.g. triplet oxygen $\text{O}_2$ diradical paramagnetism).

### 2.3 3D Molecular Vibrations & Normal Modes (`<elementa-vibration-view>`)
- **Degrees of Freedom**: Strict $3N - 6$ (nonlinear) and $3N - 5$ (linear) harmonic normal modes.
- **Harmonic Dynamic Coordinates**: Real-time evaluation of:
  $$\mathbf{r}_i(t) = \mathbf{r}_{i,0} + A \cdot \mathbf{e}_{i,k} \cdot \sin(\omega_k t)$$
  with center-of-mass translation invariance ($\sum m_i \mathbf{e}_{i,k} = 0$).
- **Presets**:
  - $\text{H}_2\text{O}$ ($C_{2v}$): $\nu_1 = 3657\,\text{cm}^{-1}$, $\nu_2 = 1595\,\text{cm}^{-1}$ (bend), $\nu_3 = 3756\,\text{cm}^{-1}$.
  - $\text{CO}_2$ ($D_{\infty h}$): $\nu_1 = 1388\,\text{cm}^{-1}$ (Raman only), $\nu_2 = 667\,\text{cm}^{-1}$ ($15\,\mu\text{m}$ greenhouse band), $\nu_3 = 2349\,\text{cm}^{-1}$.
  - $\text{CH}_4$ ($T_d$): $\nu_1 = 2917\,\text{cm}^{-1}, \nu_2 = 1534\,\text{cm}^{-1}, \nu_3 = 3019\,\text{cm}^{-1}, \nu_4 = 1306\,\text{cm}^{-1}$ ($7.7\,\mu\text{m}$ greenhouse).
  - $\text{NH}_3$ ($C_{3v}$): Includes $950\,\text{cm}^{-1}$ umbrella inversion tunneling mode.
  - $\text{SF}_6$ ($O_h$): $\nu_3 = 948\,\text{cm}^{-1}$ (extreme IPCC global warming band, GWP 23,500) and $T_{2u}$ silent mode.
  - $\text{XeF}_4$ ($D_{4h}$): Square planar centrosymmetric geometry.
- **Spectroscopic Selection Rules & Rule of Mutual Exclusion**:
  - Infrared Active: $\left(\frac{\partial \boldsymbol{\mu}}{\partial Q}\right) \neq 0$.
  - Raman Active: $\left(\frac{\partial \boldsymbol{\alpha}}{\partial Q}\right) \neq 0$ with depolarization ratio $\rho$.
  - Centrosymmetric exclusion ($C_i, D_{\infty h}, D_{4h}, O_h$): Modes cannot be simultaneously IR and Raman active.
- **Dynamic 3D Displacement Arrows**: Glowing cyan vector arrows attached to oscillating atoms indicating instantaneous harmonic displacement and velocity.
- **Dual-Mode Interactive Spectrometer**:
  - **FTIR (%T)**: Standard inverted wavenumber ($4000 \to 400\,\text{cm}^{-1}$) with Lorentzian absorption dips.
  - **Raman**: Upright inelastic scattering peaks ($0 \to 4000\,\text{cm}^{-1}$).
  - Interactive peak pins: Clicking any peak in the spectrum immediately focuses and animates that mode in 3D.

### 2.3 Reaction Kinetics & Potential Energy Surface (PES) Transition State Lab (`/mo.html?tab=kinetics`)
- **Arrhenius Law & Eyring Transition State Theory (TST)**:
  - Temperature-dependent rate constant:
    $$k(T) = A \exp\left(-\frac{E_a}{RT}\right)$$
  - Eyring-Polanyi formulation:
    $$k(T) = \kappa \frac{k_B T}{h} \exp\left(-\frac{\Delta G^\ddagger}{RT}\right) = \kappa \frac{k_B T}{h} \exp\left(\frac{\Delta S^\ddagger}{R}\right) \exp\left(-\frac{\Delta H^\ddagger}{RT}\right)$$
    with $\Delta H^\ddagger = E_a - RT$ and Gibbs free energy of activation $\Delta G^\ddagger$.
- **Maxwell-Boltzmann Molecular Collision Distribution**:
  - Energy probability density function:
    $$f(E) = 2 \sqrt{\frac{E}{\pi}} \left(\frac{1}{k_B T}\right)^{3/2} \exp\left(-\frac{E}{k_B T}\right)$$
  - Live shaded energetic tail highlighting the fraction of molecular collisions exceeding the activation threshold ($E \ge E_a$), demonstrating exponential Arrhenius temperature sensitivity.
- **1D Reaction Coordinate Profile $V(s)$ & Barrier Lowering**:
  - Continuous energy curve $V(s)$ along the Intrinsic Reaction Coordinate (IRC) connecting reactants ($s = -1$), the saddle-point transition state ($s = 0, V = E_a$), and products ($s = +1, V = \Delta H_{\text{rxn}}$).
  - Catalytic mechanism toggle demonstrating activation energy reduction ($\Delta E_a$) and massive kinetic acceleration ($>10^5\times$).
- **Molecular Collision Geometry & Walden Inversion**:
  - Dynamic molecular visualization along the reaction coordinate with synchronized trajectory scrubber.
  - Exemplary $S_N2$ Walden inversion ($\text{OH}^- + \text{CH}_3\text{Br} \to [\text{HO}\cdots\text{CH}_3\cdots\text{Br}]^\ddagger \to \text{CH}_3\text{OH} + \text{Br}^-$) exhibiting umbrella inversion through a planar trigonal bipyramidal transition state.
  - Comprehensive reaction presets:
    1. $S_N2$ Nucleophilic Substitution (Walden Inversion)
    2. Hydrogen Atom Abstraction ($\text{H} + \text{H}_2 \to \text{H}_2 + \text{H}$)
    3. Diels-Alder Cycloaddition (1,3-Butadiene + Ethylene)
    4. Heterogeneous Catalysis (Ethylene Hydrogenation over $\text{Pt}$)
    5. Stratospheric Ozone Depletion ($\text{Cl}^\bullet + \text{O}_3 \to \text{ClO}^\bullet + \text{O}_2$)
- **Integrated Concentration Rate Laws**:
  - Integrated rate laws for zeroth, first, and second-order chemical kinetics.
  - Exact half-life calculation: $t_{1/2} = \frac{\ln 2}{k}$ for 1st order; $t_{1/2} = \frac{1}{k [A]_0}$ for 2nd order.
  - Mass conservation validation: $[A](t) + [P](t) = [A]_0$.

---

## ⚛️ 3. Quantum Mechanical Orbital Laboratory (`/orbitals.html`)

### 3.1 Exact Schrödinger Wavefunctions
- **Analytical Solution**:
  $$\psi_{n,l,m}(r, \theta, \phi) = R_{nl}(r) Y_{lm}(\theta, \phi)$$
  incorporating Associated Laguerre Polynomials $L_{n-l-1}^{2l+1}$ and real Spherical Harmonics ($s, p, d, f$ orbitals).
- **Multi-Electron Slater Shielding**: Slater's rules computing effective nuclear charge $Z_{\text{eff}} = Z - \sigma$ across all 118 elements for each orbital subshell.

### 3.2 3D Isosurface Visualization (`<elementa-orbital-view>`)
- **Surface Nets Marching Algorithm**: Real-time 3D voxel grid sampling of $\psi(\mathbf{r})$ extracting smooth isosurfaces at user-controlled threshold $\psi_0$.
- **Phase Boundary Coloring**: Positive wave phase ($+\psi$) rendered in sky-blue, negative wave phase ($-\psi$) in amber-orange, explicitly exposing nodal planes, angular nodes ($l$), and radial nodes ($n - l - 1$).
- **Probability Density Cloud**: Stochastically sampled electron cloud $|\psi(\mathbf{r})|^2$.
- **Radial Probability Density Plot**: Live 2D chart of $P(r) = r^2 |R_{nl}(r)|^2$ with highlighted radial nodes.

### 3.3 Zeeman & Stark Effect Quantum Splitting Lab (`<elementa-zeeman-stark-modal>`)
- **Magnetic Field $B$ Perturbation ($0 \to 10\,\text{Tesla}$)**:
  - Landé $g$-Factor Calculation:
    $$g_J = 1 + \frac{j(j+1) + s(s+1) - l(l+1)}{2j(j+1)}$$
  - **Weak-Field Zeeman Splitting**: $\Delta E = g_J \mu_B B m_j$ ($m_j = -j, \dots, +j$).
  - **Paschen-Back Decoupling Regime**: Transitions at high fields ($B \gg B_{\text{FS}}$) where spin-orbit coupling breaks down and $L, S$ uncouple to precess independently ($\Delta E \to \mu_B B (m_l + 2m_s)$).
- **Electric Field $E$ Perturbation ($0 \to 100\,\text{kV/cm}$)**:
  - **Linear Stark Effect**: First-order degenerate perturbation in hydrogen $n=2$ ($\Delta E = \pm 3 e a_0 E_{\text{ext}}$).
  - **Quadratic Stark Effect**: Second-order polarization shift in non-degenerate terms ($\Delta E = -\frac{1}{2}\alpha E_{\text{ext}}^2$).
  - **Wavefunction Parity Mixing & Electric Dipole Formation**: Real-time 2D cross-section demonstrating $|2s\rangle$ and $|2p_z\rangle$ state mixing, breaking inversion symmetry and forming induced dipole moment $\mathbf{p} = \alpha \mathbf{E}$.
- **Polarized Optical Transitions & Selection Rules**:
  - $\Delta m_j = 0$: $\pi$-polarization (linearly polarized parallel to $\mathbf{B}$).
  - $\Delta m_j = \pm 1$: $\sigma^\pm$-polarization (circularly polarized perpendicular to $\mathbf{B}$).
  - Benchmark presets: Cadmium $643.8\,\text{nm}$ (normal triplet), Sodium D-lines (anomalous 4 & 6 lines), Hydrogen Lyman-$\alpha$ (linear Stark), Lithium $670.8\,\text{nm}$ (Paschen-Back), and Solar Sunspot Fe I $630.2\,\text{nm}$ magnetometry.

---

## 🌌 4. Interactive Segrè Chart of the Nuclides (`/segre.html`)

### 4.1 Segrè Proton-Neutron Canvas (`<elementa-segre-view>`)
- **Comprehensive Nuclear Chart**: Over 3,000 known isotopes arranged by proton number $Z$ (vertical) and neutron number $N$ (horizontal).
- **Color-Coded Decay Modes**:
  - Stable isotopes (black)
  - $\beta^-$ decay / neutron-rich (blue)
  - $\beta^+$ decay / electron capture / proton-rich (orange)
  - $\alpha$ decay (yellow)
  - Spontaneous fission (green)
  - Proton emission (red)
  - Neutron emission (purple)
- **Nuclear Shell Magic Numbers**: Magic proton and neutron numbers highlighted ($2, 8, 20, 28, 50, 82, 126$), marking doubly magic nuclei ($^4\text{He}, {}^{16}\text{O}, {}^{40}\text{Ca}, {}^{48}\text{Ca}, {}^{208}\text{Pb}$).
- **Nuclear Landscapes**: Valley of $\beta$-stability, neutron drip line, proton drip line, and islands of inversion.

### 4.2 Bateman Radioactivity Decay Simulator (`<elementa-bateman-modal>`)
- **Analytical Bateman Solver**: Solves coupled linear differential equations for decay chains:
  $$N_n(t) = \sum_{i=1}^n c_i e^{-\lambda_i t}, \quad c_i = \frac{N_1(0) \prod_{j=1}^{n-1} \lambda_j}{\prod_{j=1, j \ne i}^n (\lambda_j - \lambda_i)}$$
- **Decay Chain Presets**:
  - Transient Equilibrium: $^{140}\text{Ba} \xrightarrow{12.75\,\text{d}} {}^{140}\text{La} \xrightarrow{1.68\,\text{d}} {}^{140}\text{Ce}$ (daughter activity overtakes parent).
  - Secular Equilibrium: $^{90}\text{Sr} \xrightarrow{28.8\,\text{y}} {}^{90}\text{Y} \xrightarrow{64.0\,\text{h}} {}^{90}\text{Zr}$ (daughter locks into exact activity lockstep).
  - 15-Member Uranium Series: $^{238}\text{U} \to \dots \to {}^{206}\text{Pb}$ geological decay over $4.47\,\text{Gyr}$.
  - Medical Isotopes: $^{99}\text{Mo} \to {}^{99\text{m}}\text{Tc}$, $^{222}\text{Rn}$ indoor hazard chain.
- **Dynamic Features**: Log/linear time and activity scales, time scrubber with animation playback ($1\times - 100\times$), live mass ($\text{g}, \text{mg}, \mu\text{g}$) and activity ($\text{Bq}, \text{MBq}, \text{Ci}$) readouts.

### 4.3 Liquid-Drop SEMF & Nuclear Fission Lab (`<elementa-semf-modal>`)
- **Bethe-Weizsäcker Semi-Empirical Mass Formula (SEMF)**:
  $$B(A, Z) = a_v A - a_s A^{2/3} - a_c \frac{Z(Z-1)}{A^{1/3}} - a_a \frac{(A - 2Z)^2}{A} + \delta(A, Z)$$
  - Evaluates Volume ($+a_v$), Surface ($-a_s$), Coulomb ($-a_c$), Asymmetry ($-a_a$), and Pairing ($\pm\delta$) terms individually.
- **Binding Energy per Nucleon Curve ($B/A$ vs $A$)**:
  - Compares theoretical SEMF with experimental IAEA evaluated nuclear data.
  - Peak of nuclear stability at $^{56}\text{Fe}$ and $^{62}\text{Ni}$ ($~8.79\,\text{MeV}/\text{nucleon}$).
  - Explains energy release via fusion ($A < 56$) and fission ($A > 56$).
- **Bohr-Wheeler Nuclear Fissility**:
  $$x = \frac{Z^2 / A}{(Z^2 / A)_{\text{crit}}}, \quad (Z^2/A)_{\text{crit}} \approx 48.5$$
  Computes fission barrier against spontaneous fission ($E_b = 9.59\,\text{MeV}$ for $^{235}\text{U}$).
- **Fission Reaction Laboratory**:
  - Reaction presets for $^{235}\text{U}, {}^{239}\text{Pu}, {}^{233}\text{U}, {}^{252}\text{Cf}$.
  - Fragment mass distributions, prompt $Q$-value ($\sim 173\,\text{MeV}$), Coulomb repulsion barrier of touching fragments ($\sim 239\,\text{MeV}$), prompt neutron count, and total recoverable fission energy ($\sim 200\,\text{MeV}$).
- **Fusion vs Fission Energetics**:
  - Thermonuclear reactions: $\text{D-T } (17.59\,\text{MeV}), \text{D-D } (4.03\,\text{MeV}), \text{D-}^3\text{He } (18.35\,\text{MeV}), p\text{-}^{11}\text{B } (8.68\,\text{MeV})$.
  - Energy density comparison: 1 kg of fusion fuel delivers energy equivalent to $11.6 \times 10^6\text{ kg}$ of coal.

### 4.4 Stellar Nucleosynthesis & Cosmic Origins (`<elementa-nucleosynthesis-modal>`)
- **6 Stellar Burning Stages**:
  1. Hydrogen Burning: Proton-Proton Chain (pp-I, pp-II, pp-III) and CNO Cycle ($Q = 26.73\,\text{MeV}$ with bottleneck $^{14}\text{N}(p,\gamma)^{15}\text{O}$).
  2. Helium Burning: Triple-Alpha process with Hoyle state quantum resonance ($7.654\,\text{MeV}$ excited state of $^{12}\text{C}$) enabling the existence of carbon-based life.
  3. Carbon Burning ($T \approx 0.6 - 1.0\times 10^9\,\text{K}$).
  4. Neon Photodisintegration ($T \approx 1.2 - 1.8\times 10^9\,\text{K}$).
  5. Oxygen Burning ($T \approx 1.5 - 2.5\times 10^9\,\text{K}$).
  6. Silicon Burning ($T \approx 3.0 - 4.5\times 10^9\,\text{K}$): Iron peak equilibrium (NSE).
- **Neutron Capture Processes**:
  - $s$-process (Slow): Asymptotic Giant Branch (AGB) stars synthesizing elements along the valley of stability up to $^{209}\text{Bi}$.
  - $r$-process (Rapid): Kilonova neutron star mergers ($>10^{20}\text{ n/cm}^3$) synthesizing heavy actinides: gold ($\text{Au}$), platinum ($\text{Pt}$), thorium ($\text{Th}$), uranium ($\text{U}$).
- **Solar Core Gamow Peak Calculator**:
  $$E_0 = 1.2204 \left( Z_1^2 Z_2^2 A_{\text{red}} T_6^2 \right)^{1/3}\,\text{keV}$$
  Demonstrates that solar fusion occurs at $E_0 \approx 6.07\,\text{keV}$ through quantum tunneling, well below the classical $1000\,\text{keV}$ Coulomb barrier.
- **Cosmic Elemental Abundances**: Curve of Anders & Grevesse / Lodders illustrating the Oddo-Harkins effect (even $Z$ elements more abundant than odd $Z$).

### 4.5 Radiation Shielding & Particle Attenuation Lab (`<elementa-shielding-modal>`)
- **Exponential Beer-Lambert Attenuation**:
  $$I(x) = I_0 e^{-\mu x} = I_0 e^{-(\mu / \rho) (\rho x)}$$
  Dynamic calculations of Half-Value Layer ($\text{HVL} = \frac{\ln 2}{\mu}$) and Tenth-Value Layer ($\text{TVL} = \frac{\ln 10}{\mu} \approx 3.322 \times \text{HVL}$).
- **Energy-Dependent Interaction Cross-Sections ($\mu = \tau + \sigma_c + \kappa$)**:
  - **Photoelectric Absorption ($\tau$)**: Dominates at low energies ($< 0.2\,\text{MeV}$), scaling sharply with atomic number ($\propto Z^4 / E^{3.2}$).
  - **Compton Inelastic Scattering ($\sigma_c$)**: Klein-Nishina cross-section dominating intermediate gamma energies ($0.3 - 5.0\,\text{MeV}$).
  - **Pair Production ($\kappa$)**: High-energy nuclear Coulomb field interaction strictly emerging above threshold $E > 2 m_e c^2 = 1.022\,\text{MeV}$ and dominating at $> 5.0\,\text{MeV}$.
- **Heavy Charged Particle Stopping Power & Bragg Peak**:
  - Bethe-Bloch electronic stopping power $-\frac{dE}{dx}$ for alpha particles ($^4\text{He}^{2+}$) and protons ($p^+$):
    $$-\frac{dE}{dx} = 4\pi N_A r_e^2 m_e c^2 z^2 \frac{Z}{A} \frac{1}{\beta^2} \left[ \frac{1}{2} \ln \left( \frac{2 m_e c^2 \beta^2 \gamma^2 W_{\max}}{I^2} \right) - \beta^2 \right]$$
  - Bragg Peak profile: High entrance velocity with low initial ionisation, culminating in a sharp, concentrated ionization peak right at end-of-range ($>3\times$ higher stopping power before instantaneous rest), forming the physical basis of modern hadron/proton radiation therapy.
- **Beta Particle Range & Bremsstrahlung Radiation Yield**:
  - Katz-Penfold empirical beta range formula:
    $$R_{\beta} = 0.412\, E_0^{1.265 - 0.0954 \ln E_0} \quad (0.01 \le E_0 \le 2.5\,\text{MeV})$$
  - Bremsstrahlung radiative yield fraction $Y \approx \frac{Z E_{\beta}}{3000\,\text{MeV}}$, explaining why low-$Z$ absorbers (acrylic/aluminum) are required prior to lead shielding to minimize secondary X-ray generation.
- **Fast & Thermal Neutron Attenuation**:
  - High-energy neutron moderation via elastic collisions with hydrogen-rich materials (borated polyethylene, paraffin, light water) followed by thermal neutron capture in $^{10}\text{B}(n,\alpha)^7\text{Li}$ or $^{113}\text{Cd}(n,\gamma)$.
- **ALARA Principle & Health Physics Dosimetry (ICRP 103)**:
  - Inverse-square law distance scaling: $\dot{D}(r) = \dot{D}_0 \left(\frac{r_0}{r}\right)^2$.
  - Equivalent dose rate ($\mu\text{Sv/h}$) with radiation weighting factors $w_R$ ($w_R = 1$ for photons/electrons, $w_R = 20$ for alpha particles).
  - Material presets: Lead ($\text{Pb}$), Standard Concrete, Light Water ($\text{H}_2\text{O}$), Borated Polyethylene (5% B), Aluminum ($\text{Al}$), Iron/Steel ($\text{Fe}$), Air (STP), and Tungsten ($\text{W}$).

---

## 🚀 5. Project Daedalus Re-Entry Flight Simulator (`/daedalus.html`)

- **3D Hypersonic Simulation (`<elementa-daedalus-sim>`)**:
  - Spacecraft dynamic mesh with atmospheric entry orientation (pitch, yaw, roll, angle of attack $\alpha$).
  - Shockwave and plasma blackout visualization based on local air ionization ($M > 10$).
- **Aerothermodynamic Flight Telemetry**:
  - Mach number ($M$), Altitude ($km$), Velocity ($m/s$), Dynamic Pressure ($q = \frac{1}{2}\rho v^2$), G-force loading, and Stagnation Heat Flux ($\text{MW/m}^2$).
  - Lift-to-Drag ratio ($L/D$) aerodynamic trajectory optimization.

---

## ⚡ 6. Electromagnetism & Maxwell's Equations Laboratory (`/em.html`)

- **3D Field Visualization (`<elementa-em-field>`)**:
  - **Point charge**: Coulomb field $\mathbf{E} = kq/r^2\,\hat{\mathbf{r}}$ with field vectors and field lines.
  - **Electric dipole**: Two equal and opposite charges; dipole field pattern.
  - **Solenoid**: Biot–Savart field from $N$ circular current loops, $\mathbf{B}$-field vectors in $yz$ and $xz$ planes.
  - **Electromagnetic wave**: Plane wave $\mathbf{E} = E_0\sin(kz - \omega t)\,\hat{\mathbf{x}}$, $\mathbf{B} = B_0\sin(kz - \omega t)\,\hat{\mathbf{y}}$, $B_0 = E_0/c$.
  - **Lorentz force**: $\mathbf{F} = q(\mathbf{E} + \mathbf{v} \times \mathbf{B})$ — charged particle trajectory in uniform crossed $\mathbf{E}$ (along $y$) and $\mathbf{B}$ (along $z$) fields, integrated with RK4.
- **Maxwell's equations reference**: Gauss ($\nabla\cdot\mathbf{E} = \rho/\varepsilon_0$, $\nabla\cdot\mathbf{B} = 0$), Faraday ($\nabla\times\mathbf{E} = -\partial\mathbf{B}/\partial t$), Ampère–Maxwell ($\nabla\times\mathbf{B} = \mu_0\mathbf{J} + \mu_0\varepsilon_0\partial\mathbf{E}/\partial t$).
- **Constants**: $c = 299{,}792{,}458$ m/s, $\varepsilon_0 = 8.854\times10^{-12}$ F/m, $\mu_0 = 4\pi\times10^{-7}$ N/A².
- **Controls**: Animate/pause time evolution, reset time, field parameter sliders (charge, current, loops, radius, frequency, amplitude, particle charge/mass/initial velocity), color-coded field vectors ($\mathbf{E}$ cyan, $\mathbf{B}$ pink), WebGL renderer with OrbitControls.

---

## 🌡️ 7. Thermodynamics & Heat Engines Laboratory (`/thermo.html`)

- **3D Piston-Cylinder Visualizer (`<elementa-thermo>`)**:
  - Ideal gas in a cylinder with a movable piston; WebGL-rendered gas molecules bounce between piston and walls.
  - Live pressure $P = nRT/V$, temperature, and volume readouts.
  - Overhead P–V diagram tracing the cycle path with per-process colors (isobaric, isochoric, isothermal, adiabatic).
- **Heat-Engine Cycles**: Carnot, Otto, Diesel, Stirling. Computes heat in/out, net work, thermal efficiency $\eta$, and Carnot efficiency $\eta_c = 1 - T_c/T_h$.
- **Cycle parameters**: Hot/cold reservoir temperatures, moles, adiabatic index $\gamma$, Diesel cutoff ratio; state-by-state P/V/T table.
- **Kinetic theory**: Maxwell–Boltzmann most-probable, mean, and RMS molecular speeds for N₂ at the current temperature.
- **Blackbody radiation**: Stefan–Boltzmann law $M = \sigma T^4$ and Wien's displacement law $\lambda_\max = b/T$.
- **Controls**: Animate cycle phase, reset phase, sliders for every state variable, cycle selector.

---

## ⏱️ 8. Special Relativity Laboratory (`/relativity.html`)

- **3D Relativistic Light Clock (`<elementa-relativity>`)**:
  - Photon bouncing between mirrors on a moving carriage; the bounce period stretches by $\gamma = 1/\sqrt{1-\beta^2}$ — time dilation made visible.
  - Contracting rod ($L = L_0/\gamma$) riding the carriage beside a static proper-length reference rod.
  - Rolling photon world-line trail; spacetime diagram overlay with light cone ($x = \pm ct$), rest/moving worldlines, and primed axes ($ct'$, $x'$).
- **Lorentz kinematics**: $\gamma$, velocity $v$ in km/s, length contraction, time dilation ($\Delta t = \gamma\Delta t_0$), proper time, contraction percentage.
- **Relativistic dynamics**: electron/proton kinetic energy ($(\gamma-1)mc^2$), total energy $E = \gamma mc^2$, momentum $pc$, rest energy, classical $\tfrac12 mv^2$ comparison.
- **Relativistic Doppler**: $f/f_0 = \sqrt{(1\pm\beta)/(1\mp\beta)}$ with visible **colour swatches** mapping the shifted wavelength (380–780 nm) to sRGB.
- **Velocity addition**: $u = (u_1+u_2)/(1+u_1u_2/c^2)$ vs the classical sum, with rapidity composition.
- **Muon decay**: survival fraction with and without time dilation over a chosen flight distance — the 1930s cosmic-ray proof.
- **Twin paradox**: Earth vs traveller ages for a round trip at the current $\beta$.
- **Spacetime interval**: $s^2 = (ct)^2 - x^2$ with timelike / spacelike / lightlike classification.
- **Controls**: $\beta$ slider (0–0.999c), proper length, source wavelength, clock pause, photon-trail and rod visibility toggles.

---

## 🌊 9. 1D Quantum Wave Laboratory (`/quantumwave.html`)

- **3D Probability Waterfall (`<elementa-quantumwave>`)**:
  - A surface whose rows are the *history* of the evolving wave: animated Re ψ(x, t) for wave packets, or ψₙ(x)·cos(ωt) for stationary states (display frequency rises monotonically with Eₙ).
  - Positive lobes rendered cyan, negative lobes pink (vertex-coloured grid updated per frame); the potential profile is extruded as an amber ribbon behind the cascade.
  - Full physics-figure overlay: V(x), dashed energy levels, ψₙ anchored at its eigenvalue, |ψ|² strip, and live ⟨E⟩ / Δx / Δp / tunnelling-fraction readouts.
- **Four potential systems**: infinite well (Eₙ = n²π²/W²), finite well (asymmetric PSD eigen solver, bound-state count emerges naturally), harmonic oscillator V = ½κ²x² (Eₙ = (n−½)κ√2), and a rectangular barrier with **no bound states** (interface auto-switches to packet mode).
- **Exact eigen solver**: symmetric tridiagonal finite-difference Hamiltonian solved by LDLᵀ (Sturm-sequence) sign-count bisection at ~1e-12 relative precision; eigenfunctions by guarded inverse iteration (Thomas algorithm, ε-shifted).
- **Heisenberg uncertainty panel**: nodes, ⟨x⟩, Δx, ⟨p⟩, Δp and the product Δx·Δp / (ħ/2) per state — the bound is violated nowhere, equality only for the oscillator's Gaussian ground state.
- **Unitary Crank–Nicolson evolution**: (I + iΔtH/2)ψ⁺ = (I − iΔtH/2)ψ solved with a complex Thomas sweep over the interior; norm conserved to ~1e-9 per step and ⟨E⟩ drift typically <0.05% over hundreds of seconds of simulated time.
- **Gaussian wave packets**: tunable mean energy E₀ and width σ₀ (Δp = ħ/2σ₀); packets spread, reflect and rephase inside the box, and tunnel through the barrier — the live transmitted fraction is compared to the exact analytic T(E₀) = [1 + V₀²sinh²(κW)/(4E₀(V₀−E₀))]⁻¹.
- **Physical units**: internal ħ²/2mₑ = 1 with energy scale ħ²/2mₑL² at an adjustable length scale L (0.2–2.5 nm) — e.g. the well spectrum maps to real electron level spacings in the eV regime.
- **Interactive**: click any spectrum row to display that state, sliders for width / depth / curvature / barrier geometry, evolution-speed and pause controls, packet re-launch.

---

## ⚗️ 10. Compound & Chemical Reaction Synthesizer (`/synthesizer.html`)

- **Interactive Element Combiner Workbench**:
  - Multi-element selection (up to 5 elements simultaneously) to discover and synthesize matching binary and ternary compounds.
  - Curated database spanning oxides, halides, hydrides, mineral acids, caustic bases, salts, hydrocarbons, and wide-bandgap semiconductors.
  - Preset library: Water & Peroxides, Haber-Bosch Ammonia, Goldschmidt Thermite, Rock Salt Halite, Hematite Rusting, 5G Gallium Arsenide, EV Traction Silicon Carbide, Lithium-Ion Cathode materials, Limestone Calcination, Methane Flame.
- **Reaction Thermochemistry & Le Chatelier Crucible**:
  - Live temperature simulation range ($100\,\text{K} \to 2500\,\text{K}$).
  - Temperature-dependent thermodynamic calculations:
    $$\Delta H_{rxn}(T) \approx \sum \nu_p \Delta H_f^\circ(\text{products}) - \sum \nu_r \Delta H_f^\circ(\text{reactants})$$
    $$\Delta S_{rxn}(T) \approx \sum \nu_p S^\circ(\text{products}) - \sum \nu_r S^\circ(\text{reactants})$$
    $$\Delta G_{rxn}(T) = \Delta H_{rxn} - T \Delta S_{rxn}$$
    $$K_{eq}(T) = \exp\left(-\frac{\Delta G_{rxn}}{R \cdot T}\right)$$
  - Thermal rating indicators (Extremely Exothermic, Exothermic, Endothermic) with reactive visual glow and flame/spark styling.
  - Thermodynamic inversion temperature calculation ($T_{\text{inv}} = \Delta H / \Delta S$) identifying exact temperatures where spontaneity reverses.
- **3D Molecular & Crystal Structure Visualizer (`<elementa-compound-3d>`)**:
  - Native WebGL hardware-accelerated 3D rendering with CPK elemental coloration.
  - Multi-order chemical bond rendering (single, double, triple bonds via parallel cylinders).
  - Model rendering modes: Ball-and-Stick, Space-Filling (van der Waals radii), and Wireframe.
  - Full OrbitControls with smooth damping, zoom, and auto-rotation toggle.
  - Bond character metrics: Pauling percent ionic character ($1 - e^{-0.25(\Delta\chi)^2}$) and electronegativity difference $\Delta\chi$.

---

## 🛡️ 11. Cryptographic Integrity & Standards Verification (`/integrity.html`)

- **Dataset Provenance**:
  - NIST Atomic Spectra Database v5.11 (SHA-256 integrity checksums).
  - IAEA Nuclear Data Section & Nubase2020 nuclear evaluation.
  - CODATA 2018/2022 recommended fundamental physical constants.
  - IUPAC Atomic Weights of the Elements 2021.
- **Verification Engine**: Browser-native Web Crypto API verifying SHA-256 hashes of all bundled physical constants and datasets.

---

## ⚡ 11. Technology Stack & Framework Purity

- **Core Engine**: Pure **`nexus-framework`** (`mount`, `patch`, `effect`, `reactive`, `h`, `VNode`).
- **3D Graphics**: **`@nexus/3d`** WebGL hardware-accelerated rendering.
- **Zero Third-Party UI Libraries**: 0 React dependencies, 0 Vue dependencies, 0 Lucide/Radix packages. All styling is plain Tailwind CSS.
- **Custom Elements Architecture**: All imperative 3D engines encapsulated in clean, autonomous Web Components with lifecycle teardown hooks.
- **All 6 Automated Physics Test Suites Passing (0 Failures)**:
  - `test-vibrations.ts`: 44 tests passed
  - `test-nucleosynthesis.ts`: 17 tests passed
  - `test-semf.ts`: 17 tests passed
  - `test-bateman.ts`: 16 tests passed
  - `test-vsepr.ts`: 17 tests passed
  - `test-crystallography.ts`: 21 tests passed
