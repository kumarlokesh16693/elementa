<div align="center">

<img src="./public/logo.svg" width="96" height="96" alt="ELEMENTA logo" />

# ELEMENTA
### Scientific Visualization & Interactive Teaching Labs

[![Framework](https://img.shields.io/badge/framework-nexus--framework-blue?style=flat-square)](#technology)
[![3D Engine](https://img.shields.io/badge/3D%20engine-%40nexus%2F3d-purple?style=flat-square)](#technology)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

**[Run locally](#run-locally)** · **[Browse the labs](#lab-directory)** · **[Model and data notes](#scientific-scope-and-data)** · **[Feature inventory](./FEATURES.md)**

</div>

---

## What is ELEMENTA?

ELEMENTA is a collection of browser-based interactive labs for exploring physics, chemistry, materials, and nuclear science. It combines reference datasets, calculations derived from those datasets, exact solutions to selected idealized models, and simplified simulations intended for teaching and visualization.

The app is built with TypeScript, `nexus-framework`, Vite, Tailwind CSS, and `@nexus/3d`. Most labs are independent pages and can be opened directly from their route. WebGL views provide interactive 3D scenes; many pages also retain a 2D plot or diagram when a 3D view is unavailable.

> **Scientific scope:** ELEMENTA is a learning and visualization tool. A plotted value may be measured, derived, theoretical, predicted, or illustrative. The app’s References page and model notes describe these distinctions for supported datasets and models. An attractive visualization does not imply experimental validation or engineering-grade predictive accuracy.

## Lab directory

| Page | Lab | What you can explore |
|---|---|---|
| [`/index.html`](./index.html) | Periodic table and element explorer | Element properties, trends, comparisons, atomic models, spectra, isotopes, and provenance |
| [`/orbitals.html`](./orbitals.html) | Atomic orbitals and field effects | Orbital probability densities, effective nuclear charge, Zeeman and Stark splitting |
| [`/mo.html`](./mo.html) | Molecular structure lab | VSEPR geometry, diatomic molecular orbitals, vibrations, and reaction kinetics |
| [`/spectroscopy.html`](./spectroscopy.html) | Molecular spectroscopy | Vibrational modes, simulated FTIR curves, and Beer–Lambert UV–Vis calculations |
| [`/kinetics.html`](./kinetics.html) | Chemical kinetics | Arrhenius and Eyring rates, reaction-coordinate illustrations, rate laws, and enzyme kinetics |
| [`/synthesizer.html`](./synthesizer.html) | Compound and reaction synthesizer | Assemble compounds and inspect formula, stoichiometry, and thermodynamic estimates |
| [`/electrochemistry.html`](./electrochemistry.html) | Electrochemistry and batteries | Redox-cell potentials, reaction quotients, concentration effects, and battery comparisons |
| [`/crystal.html`](./crystal.html) | Crystal structures and powder XRD | Unit cells, Miller planes, d-spacing, structure factors, and synthetic diffraction patterns |
| [`/bands.html`](./bands.html) | Solid-state band theory | Tight-binding dispersions, filling, Fermi level, density of states, and Fermi surfaces |
| [`/optics.html`](./optics.html) | Optics and wave phenomena | Single- and multi-slit Fraunhofer patterns, fringe geometry, and grating behavior |
| [`/em.html`](./em.html) | Electromagnetism | Point charges, dipoles, current loops, plane waves, and Lorentz force |
| [`/thermo.html`](./thermo.html) | Thermodynamics and heat engines | Ideal-gas processes, PV diagrams, ideal cycles, entropy, molecular speeds, and blackbody relations |
| [`/relativity.html`](./relativity.html) | Special relativity | Lorentz transformations, relativistic motion, Doppler shift, and spacetime scenarios |
| [`/quantumwave.html`](./quantumwave.html) | One-dimensional quantum wave lab | Bound states, wave packets, time evolution, uncertainty, and tunnelling in model potentials |
| [`/bec.html`](./bec.html) | Bose–Einstein condensate and vortex lab | A dimensionless 2D Gross–Pitaevskii simulation, condensate density, and vortex behavior |
| [`/statmech.html`](./statmech.html) | Statistical mechanics | Metropolis simulation of the 2D Ising model and comparison with analytic curves |
| [`/particle.html`](./particle.html) | Particle physics | Standard Model reference cards, Feynman-diagram rules, resonances, and decay data |
| [`/segre.html`](./segre.html) | Segrè chart and nuclear labs | Nuclides plus decay, fission energetics, nucleosynthesis, and shielding tools |
| [`/reactor.html`](./reactor.html) | Reactor physics demonstration | Point kinetics, feedback controls, xenon transients, and a generic thermal-cycle display |
| [`/daedalus.html`](./daedalus.html) | Atmospheric-entry flight simulator | Vehicle trajectories, atmospheric drag and lift, heating estimates, and mission telemetry |
| [`/references.html`](./references.html) | References and constants | Dataset registry, model tiers, citations, and constants metadata |
| [`/integrity.html`](./integrity.html) | Data integrity checks | Integrity checks for supported bundled element and nuclear data |

The route names are also the generated static HTML filenames in `dist/` after a production build.

## Labs in detail

### 1. Periodic table and element explorer — `/index.html`

Browse the 118 elements by atomic number, symbol, group, period, chemical family, and selected physical or chemical properties. Search, filter, sort, select elements for side-by-side comparison, and switch trend or property coloring. The detail view exposes available values and their source or model tier; missing values are left unavailable rather than filled with an invented measurement.

Element details include electron configurations, shell populations, common oxidation states, atomic-weight displays, ionization and electron-affinity data where available, and physical-property references. Other views include a pedagogical Bohr-shell diagram, quantum-orbital views, a crystal-structure view, and an emission-spectrum view. Isotope information links to the Segrè chart and Bateman decay tool. A research panel supports data exports, citations, and view-state sharing.

**Interpretation:** a shell diagram is not a quantum orbital picture. The QM view uses a hydrogenic wavefunction with an effective nuclear charge for many-electron atoms; the spectrum fallback is a hydrogen-like Rydberg calculation. The interface marks these as model results. See [data sources and model tiers](#scientific-scope-and-data).

**Key relations:** the shell illustration follows the capacity rule $N_n \leq 2n^2$. Its hydrogen-like spectrum fallback uses $E_n=-RhcZ^2/n^2$ and $\Delta E=hc/\lambda$; these do not generate the measured property values in the table.

### 2. Atomic orbitals and Zeeman/Stark lab — `/orbitals.html`

Choose an element and orbital quantum numbers to inspect radial and angular structure, nodal surfaces, probability-density cross-sections, and 3D isosurfaces. The viewer uses real orbital combinations so the sign of the wavefunction is visible; probability density itself is nonnegative. Controls adjust the selected orbital and display scale.

The field-effects panel explores magnetic Zeeman and electric Stark perturbations, level splitting, and polarization-dependent transitions. Its equations are tied to the selected approximation and field regime; the hydrogen (n=2) linear Stark effect is a special case and should not be generalized to arbitrary atoms or states.

**Interpretation:** one-electron hydrogenic orbitals are exact solutions under the stated Coulomb model. For multi-electron atoms, a single Slater effective nuclear charge is a classroom approximation; radial scales and energies are qualitative rather than precision atomic-structure predictions.

**Key equations:** $\psi_{nlm}=R_{nl}(r;Z_{\rm eff})Y_{lm}(\theta,\phi)$ and the plotted probability density is $|\psi|^2$. The weak-field Zeeman shift is $\Delta E_Z=g_J\mu_BBm_J$. The lab also displays the hydrogen $n=2$ linear Stark shift $\Delta E=\pm3ea_0E$ and a quadratic model $\Delta E=-\tfrac12\alpha E^2$; strong-field splitting uses a simplified uncoupling model.

### 3. Molecular structure lab — `/mo.html`

The page has four views, selected in its tab bar or with `?tab=`:

- **VSEPR geometry (`?tab=vsepr`):** select a central atom and bonded or lone-pair arrangement to inspect common steric-number geometries, idealized bond angles, and vector-summed dipole direction. VSEPR is a qualitative geometry model; real bond angles can differ because of ligand identity, multiple bonding, and electronic structure.
- **Diatomic molecular orbitals (`?tab=diatomic`):** compare second-row homonuclear or heteronuclear diatomic orbital ordering, occupancy, bond order, and magnetism using an elementary MO diagram. This is a generic orbital-filling model, not an ab initio calculation.
- **Vibrations (`?tab=vibrations`):** inspect normal-mode patterns, harmonic frequencies, symmetry labels, and IR/Raman activity for bundled molecular presets. The motion and spectra are model visualizations; anharmonicity, environment, and experimental broadening are not fully represented.
- **Reaction kinetics (`?tab=kinetics`):** explore selected Arrhenius/Eyring presets, reaction-coordinate motion, energy distributions, catalytic comparisons, and integrated rate laws. Preset barriers and coordinates are illustrative unless a source is explicitly given.

**Key equations:** VSEPR counts electron domains with $SN=BP+LP$; the dipole display represents a vector sum $\boldsymbol\mu=\sum_i q_i\mathbf r_i$. Diatomic MO bond order is $BO=(N_{\rm bonding}-N_{\rm antibonding})/2$. The vibration tab illustrates the harmonic-oscillator relation $\tilde\nu=(2\pi c)^{-1}\sqrt{k/\mu}$.

### 4. Molecular spectroscopy — `/spectroscopy.html`

Inspect bundled molecular vibrational modes and animate their normal coordinates. The FTIR plot is a **synthetic teaching spectrum** formed from simplified line profiles around selected mode frequencies; it is not an experimental spectrum or a quantum-chemistry prediction. A separate UV–Vis panel calculates absorbance and transmittance using the Beer–Lambert relation $A=\varepsilon bc$, $T=10^{-A}$, allowing path length, concentration, and extinction coefficient to be explored.

The Beer–Lambert calculation assumes a homogeneous sample and a linear absorbance response. Real instruments and samples can depart from this idealization through scattering, chemical equilibria, stray light, detector limits, and concentration effects.

**Key equations:** the harmonic diatomic reference frequency is $\tilde\nu=(2\pi c)^{-1}\sqrt{k/\mu}$, with reduced mass $\mu=m_1m_2/(m_1+m_2)$. The synthetic FTIR curve uses Lorentzian-shaped lines, $L(\tilde\nu)=[1+4((\tilde\nu-\tilde\nu_0)/\Gamma)^2]^{-1}$.

### 5. Chemical kinetics — `/kinetics.html`

Explore reaction-rate concepts with Arrhenius and Eyring temperature dependence, Maxwell–Boltzmann energy distributions, integrated zero-, first-, and second-order rate laws, reaction-coordinate sketches, and a Michaelis–Menten enzyme panel with inhibitor modes. Presets include representative substitution, catalytic, and enzyme reactions. The controls help show how model parameters affect rates and curves.

**Interpretation:** a rate law or transition-state expression is exact only within its assumptions and chosen parameters. The preset reaction barriers, catalytic changes, and animated molecular coordinates should not be treated as a vetted experimental kinetics database. The Lineweaver–Burk view is a reciprocal plotting transform; it is not a substitute for fitting raw-rate data with an appropriate error model.

**Key equations:** Arrhenius $k=Ae^{-E_a/(RT)}$ and Eyring $k=\kappa(k_BT/h)e^{\Delta S^\ddagger/R}e^{-\Delta H^\ddagger/(RT)}$ relate temperature to a modeled rate constant. The enzyme view uses $v=V_{\max}[S]/(K_m+[S])$; the simple first- and second-order examples use $[A]=[A]_0e^{-kt}$ and $1/[A]=1/[A]_0+kt$.

### 6. Compound and reaction synthesizer — `/synthesizer.html`

Select elements and assemble a compound from the available element catalog. The workbench displays the resulting formula and composition and provides a 3D molecular-style representation and reaction/thermochemistry information supported by the bundled records. The 3D view is a structural illustration; it does not optimize geometry or determine a stable compound from first principles.

Use the output as a way to explore formula construction and stoichiometric relationships. The reaction panel computes $\Delta G(T)=\Delta H-T\Delta S$ and $K=\exp[-\Delta G/(RT)]$ from bundled reaction enthalpy and entropy values, treating those values as constant with temperature and using a standard-state interpretation. It does not solve for activities, heat-capacity corrections, or reaction kinetics, so these are teaching estimates rather than a general-purpose reaction predictor.

**Key equations:** for a reaction $\sum_i\nu_iA_i=0$, the displayed stoichiometric coefficients define the balanced equation. The thermodynamic panel uses $\Delta G^\circ(T)=\Delta H^\circ-T\Delta S^\circ$ and $K=\exp[-\Delta G^\circ/(RT)]$ under the constant-$\Delta H^\circ$, constant-$\Delta S^\circ$ assumption described above.

### 7. Electrochemistry and battery lab — `/electrochemistry.html`

Choose anode and cathode half-reactions, inspect the balanced cell reaction, and vary concentration and temperature to see how standard potential, reaction quotient, Nernst cell voltage, Gibbs free-energy change, and equilibrium constant relate. The battery comparison view summarizes selected battery chemistries and their curated properties.

The Nernst calculation uses concentrations as activity proxies. For non-dilute solutions, activity coefficients and detailed speciation may matter. Battery values and application notes are curated comparison data, not guaranteed specifications for a commercial cell or pack.

**Key equations:** $E_{\rm cell}=E^\circ_{\rm cell}-(RT/nF)\ln Q$, $\Delta G=-nFE_{\rm cell}$, and $K=\exp(nFE^\circ_{\rm cell}/RT)$. In the current calculator, concentrations approximate activities when constructing $Q$.

### 8. Crystal structures and powder XRD — `/crystal.html`

View bundled crystal structures as unit cells, rotate and inspect atomic positions, and explore lattice metrics and Miller-index planes. The diffraction workbench calculates interplanar spacing, Bragg angles, structure factors, reflection multiplicity, and a synthetic powder pattern for selected X-ray wavelengths and structures.

**Interpretation:** the code uses an approximate atomic form factor and simplified intensity corrections. The pattern is a model, not a measured diffractogram, Rietveld refinement, or substitute for instrument-specific analysis. Real patterns also depend on occupancy, thermal motion, texture, strain, crystallite size, instrumental profile, and sample preparation.

**Key equations:** Bragg positions obey $\lambda=2d_{hkl}\sin\theta$. For cubic cells, $d_{hkl}=a/\sqrt{h^2+k^2+l^2}$; general cells use the reciprocal metric. The structure factor is $F_{hkl}=\sum_j f_j e^{2\pi i(hx_j+ky_j+lz_j)}$, with synthetic intensity proportional to $|F_{hkl}|^2$ times multiplicity and a Lorentz-polarization term. Scherrer broadening uses $\beta\approx K\lambda/(L\cos\theta)$.

### 9. Solid-state band theory — `/bands.html`

Compare nearest-neighbor tight-binding models for a one-dimensional chain, the SSH/dimerized chain, a square lattice, and a honeycomb lattice. Adjust hopping, lattice scale, dimerization or gap, filling, temperature, and view. The page plots sampled band dispersion and reports model-derived quantities such as Fermi level, density of states, effective mass near band edges, and Fermi-surface points.

These are lattice-model results, not fitted electronic structures of a specific material. The band shapes are exact for the selected tight-binding Hamiltonian up to numerical sampling; real-material predictions require additional orbitals, interactions, spin-orbit coupling, and material-specific parameters as appropriate.

**Key equations:** the one-dimensional chain uses $E(k)=-2t\cos(ka)$; the dimerized chain uses $E_\pm(k)=\pm\sqrt{t_1^2+t_2^2+2t_1t_2\cos(ka)}$, where $t_{1,2}=t\pm\delta$ and the gap is $4|\delta|$. The square-lattice dispersion is $-2t[\cos(k_xa)+\cos(k_ya)]$. The honeycomb model uses $E_\pm=\pm\sqrt{|f(\mathbf k)|^2+\Delta^2}$ and a gap $2\Delta$.

### 10. Optics and wave phenomena — `/optics.html`

Select a single slit, double slit, or multi-slit grating and adjust wavelength, slit width, slit separation, number of slits, and screen geometry. The 2D far-field intensity uses the scalar Fraunhofer sinc-squared envelope and finite-array interference factor. The page reports principal orders and fringe-related quantities; a 3D scene provides an intuitive view of the aperture setup and wave pattern.

The far-field equation is an ideal scalar-diffraction model for coherent illumination and the stated geometry. The 3D propagation view is qualitative and should not be interpreted as a full near-field electromagnetic solution or vector diffraction calculation.

**Key equation:** $I(\theta)=\operatorname{sinc}^2(\beta)[\sin(N\alpha)/(N\sin\alpha)]^2$, with $\beta=\pi a\sin\theta/\lambda$ and $\alpha=\pi d\sin\theta/\lambda$. Grating orders satisfy $d\sin\theta_m=m\lambda$; the small-angle screen spacing is $\Delta y\approx\lambda L/d$.

### 11. Electromagnetism — `/em.html`

Switch among point-charge, electric-dipole, current-loop/solenoid, plane-wave, and Lorentz-force presets. Inspect field vectors and lines, change source or wave parameters, and compare the displayed configurations with Maxwell’s equations. The underlying point-source, Biot–Savart, plane-wave, and Lorentz-force calculations use SI quantities; the rendered field scale is adjusted for visibility.

The visual arrow density, line placement, and displayed scale are graphics choices. The scenes are selected analytic configurations, not a general numerical solution of Maxwell’s equations for arbitrary boundaries or materials.

**Key equations:** the selected fields include Coulomb’s law $\mathbf E=(1/4\pi\epsilon_0)q\mathbf r/r^3$, the Biot–Savart element $d\mathbf B=(\mu_0/4\pi)I\,d\boldsymbol\ell\times\hat{\mathbf r}/r^2$, a plane wave with $B_0=E_0/c$, and the Lorentz force $\mathbf F=q(\mathbf E+\mathbf v\times\mathbf B)$.

### 12. Thermodynamics and heat engines — `/thermo.html`

Explore ideal-gas state variables and quasi-static isobaric, isochoric, isothermal, and adiabatic processes. Select Carnot, Otto, Diesel, or Stirling cycle models and inspect their PV paths, state values, work, heat, and efficiency. Additional displays calculate ideal-gas entropy changes, Maxwell–Boltzmann characteristic speeds for nitrogen, and blackbody relations such as Wien’s displacement and Stefan–Boltzmann emission.

The engine-cycle comparisons are idealized thermodynamic cycles. They omit real combustion chemistry, friction, heat-transfer limits, pressure losses, material constraints, and practical regeneration or operating details.

**Key equations:** the ideal-gas state relation is $PV=nRT$, the first law is $Q=\Delta U+W$ (with $W$ defined as work done by the gas), and reversible ideal-gas entropy changes use $\Delta S=nC_V\ln(T_2/T_1)+nR\ln(V_2/V_1)$. The blackbody panel uses $P/A=\sigma T^4$ and Wien’s relation $\lambda_{\max}T=b$.

### 13. Special relativity — `/relativity.html`

Use interactive scenarios to compare coordinate frames and explore Lorentz transformations, rapidity, velocity addition, length contraction, time dilation, relativistic momentum and energy, Doppler effects, and selected spacetime examples such as muon lifetime or a twin-paradox narrative. Numerical values use the speed of light and particle constants defined in the source.

The transformations implement special relativity for inertial frames. Scenario animations are explanatory; gravitational effects and general-relativistic motion are outside this lab’s scope.

**Key equations:** $\gamma=(1-v^2/c^2)^{-1/2}$, $\Delta t=\gamma\Delta\tau$, $L=L_0/\gamma$, $E=\gamma mc^2$, and collinear velocity addition $u=(u'+v)/(1+u'v/c^2)$. The Doppler and spacetime tools derive from Lorentz transformations under their stated frame assumptions.

### 14. One-dimensional quantum wave lab — `/quantumwave.html`

Choose an infinite or finite well, harmonic oscillator, or barrier potential. The solver computes finite-difference bound-state eigenvalues and eigenfunctions and evolves wave packets with a Crank–Nicolson time stepper. Textbook reference values are available for selected ideal potentials. Visualizations can show potential energy, energy levels, wavefunction, probability density, and wave-packet propagation.

A dedicated **Momentum Space ($k$-space) Fast Fourier Transform (FFT)** strip computes the conjugate probability distribution $|\phi(p)|^2$ alongside the spatial density $|\psi(x)|^2$ in real time via an in-place $O(N \log N)$ radix-2 Cooley–Tukey transform. This provides live visualization of the Fourier conjugate Heisenberg uncertainty principle ($\Delta x \cdot \Delta p \ge \hbar/2$): wavepackets localized in space broaden in momentum space, while standing eigenstates resolve into conjugate momentum peaks ($\pm k_n$).

The numerical system uses dimensionless internal units and a stated conversion scale based on electron mass and the selected length. Results depend on the finite spatial grid, boundary conditions, time step, and chosen potential. The analytic comparisons apply only to their corresponding ideal models.

**Key equations:** the solver discretizes $i\hbar\partial_t\psi=[-\hbar^2\partial_x^2/(2m)+V(x)]\psi$. Time stepping uses Crank–Nicolson, $(I+i\Delta tH/2)\psi^{n+1}=(I-i\Delta tH/2)\psi^n$. The finite-difference eigenproblem approximates $H\psi=E\psi$ with fixed zero-valued walls.

### 15. Bose–Einstein condensate and vortex lab — `/bec.html`

Explore a two-dimensional Gross–Pitaevskii model with a split-step Fourier method. The page displays condensate density and phase structure while controls vary simulation conditions and timing. Vortex states and density evolution illustrate nonlinear wave behavior and quantized circulation.

The simulation uses dimensionless units, a finite periodic Fourier grid, and a mean-field equation. It is not a prediction for a specific experimental condensate: atom number, trap calibration, finite-temperature effects, losses, and experimental noise are not comprehensively modeled.

**Key equation:** in the app’s dimensionless units, the modeled Gross–Pitaevskii equation is $i\partial_t\psi=[-\tfrac12\nabla^2+V(x,y,t)+g|\psi|^2]\psi$. Rotation or stirring enters through the time-dependent, asymmetric external potential $V(x,y,t)$; the split-step Fourier evolution uses a finite grid with periodic FFT boundaries and a soft edge barrier.

### 16. Statistical mechanics — `/statmech.html`

Run a Metropolis Monte Carlo simulation of a periodic $128\times128$ square-lattice Ising model. Choose temperature, coupling sign and magnitude, external field, update speed, and initial spin patterns; brush or seed domains and track magnetization, energy, fluctuation-based heat capacity and susceptibility estimates, and a field-sweep trace. The analytic comparison curves show the zero-field square-lattice Ising critical temperature and spontaneous magnetization alongside mean-field behavior.

The exact curves refer to the stated infinite-lattice, zero-field model; the live simulation is finite and stochastic. Live fluctuation values are exponentially smoothed estimates from correlated Monte Carlo samples, not converged equilibrium averages or uncertainty-qualified measurements. Finite-size behavior, equilibration, and sampling should be considered when interpreting them.

**Key equations:** the simulated model is $H=-J\sum_{\langle ij\rangle}s_is_j-h\sum_i s_i$, with $s_i\in\{-1,+1\}$. A proposed spin flip is accepted with probability $P=\min(1,e^{-\Delta E/T})$ (the code uses energy units with $k_B=1$). At zero field, the infinite square-lattice reference has $T_c=2|J|/\ln(1+\sqrt2)$ and $M(T)=[1-\sinh^{-4}(2|J|/T)]^{1/8}$ below $T_c$; these analytic results do not describe the finite live lattice exactly.

### 17. Particle physics — `/particle.html`

The page contains four views: a Standard Model particle matrix, a Feynman-vertex/diagram studio, Breit–Wigner resonance and collider examples, and decay chains with branching fractions. Particle properties and selected decay values are curated from reference material; the diagram studio checks selected vertex-conservation rules and visualizes interaction structure.

The diagram builder is a teaching aid, not a general symbolic QFT engine. Resonance curves and cross-section examples use simplified model forms; they do not reproduce detector response, radiative corrections, backgrounds, or full collider event generation. Check the page’s cited data version before using numerical values.

**Key equations:** the resonance view uses $\sigma(E)=12\pi(\hbar c)^2\Gamma_{\rm in}\Gamma_{\rm out}/[(E^2-M^2)^2+M^2\Gamma^2]$, and the width–lifetime relation is $\tau=\hbar/\Gamma$. These are simplified resonance relations; the displayed low-energy electromagnetic example uses $\sigma(e^+e^-\to\mu^+\mu^-)=4\pi\alpha^2/(3s)$ in its stated regime.

### 18. Segrè chart and nuclear labs — `/segre.html`

Explore a chart of nuclides by proton and neutron number, then open the associated tools:

- **Nuclide detail:** available half-life, decay mode, abundance, spin/parity, mass excess, and decay-chain context from the bundled evaluation data.
- **Bateman decay:** evolve linked radioactive-decay chains and inspect populations or activities over time. Evaluated decay constants and branches are used where bundled; missing data or chain truncation can affect results.
- **SEMF/fission/fusion:** compare semi-empirical liquid-drop binding-energy terms and selected reaction energy estimates. The mass formula is a macroscopic approximation and does not reproduce shell, deformation, or detailed fragment-yield physics reliably for every nuclide.
- **Nucleosynthesis:** inspect representative stellar burning and neutron-capture pathways, reaction energetics, Gamow-window illustrations, and curated element-origin shares. Origin percentages are approximate digitizations rather than a primary abundance table.
- **Shielding:** explore simplified attenuation, charged-particle stopping, dose, and material comparisons. These calculations do not replace transport codes, geometry-specific dose calculations, or radiation-protection assessment.

**Key equations:** radioactive decay uses $\lambda=\ln2/t_{1/2}$ and $N(t)=N_0e^{-\lambda t}$; linked populations obey $dN_i/dt=b_{i-1}\lambda_{i-1}N_{i-1}-\lambda_iN_i$ (Bateman-chain equations). The liquid-drop binding-energy estimate is $B=a_vA-a_sA^{2/3}-a_cZ(Z-1)A^{-1/3}-a_a(A-2Z)^2/A+\delta$, and reaction energy follows $Q=(\sum M_{\rm initial}-\sum M_{\rm final})c^2$. Idealized shielding includes $I=I_0e^{-\mu x}$ and inverse-square point-source scaling; the latter does not account for extended geometry or scattering.

### 19. Reactor physics demonstration — `/reactor.html`

Select one of the reactor presets and interact with control-rod position, soluble-boron concentration, flow, and simulation state. The page combines a schematic 3D core, six-group point kinetics, simplified reactivity feedback, a normalized iodine/xenon transient, and a generic power-cycle display.

**Important limitations:** this is an educational lumped-parameter demonstration, not a plant model or safety analysis. The kinetics use U-235 six-group delayed-neutron data as an approximation across presets. Feedback coefficients are preset demonstrations; the thermal response and pressure/steam-cycle values are simplified; the blue core glow is visual. Xenon behavior depends on operating history and reactor-specific data, so the shutdown plot is not operating guidance.

**Key equations:** point kinetics are $dn/dt=[(\rho-\beta)/\Lambda]n+\sum_i\lambda_iC_i$ and $dC_i/dt=\beta_i n/\Lambda-\lambda_iC_i$, where $n$ is neutron population (or proportional power), $C_i$ are delayed-neutron precursors, $\rho$ is reactivity, $\beta=\sum_i\beta_i$, and $\Lambda$ is prompt generation time. The normalized xenon/iodine display evolves $dI/dt=\lambda_I(\phi-I)$ and $dX/dt=R_0[f_d\phi+f_I I-D(\phi)X]$, where $R_0=\lambda_{Xe}+\sigma_{a,Xe}\phi_0$ is the nominal removal rate and $D(\phi)=(\lambda_{Xe}+\sigma_{a,Xe}\phi)/R_0$. Here $\phi$ is normalized flux relative to nominal $\phi_0$, and $f_d,f_I$ are normalized direct-xenon and iodine-production fractions.

### 20. Atmospheric-entry simulator — `/daedalus.html`

Select a mission, planet, and vehicle, then observe a numerically integrated trajectory with altitude, velocity, flight-path angle, dynamic pressure, Mach number, aerodynamic loading, and heating estimates. Controls include angle of attack, bank, autopilot, simulation speed, pause, state overrides, trajectory prediction, and recording/export where available.

The engine integrates a point-mass trajectory with simplified atmosphere profiles and vehicle aerodynamic coefficients. Heating correlations, guidance logic, vehicle limits, and planetary assumptions are scenario models. Results are useful for comparing trends and control effects, not for designing or certifying a flight vehicle.

**Key equations:** dynamic pressure is $q=\tfrac12\rho v^2$, with drag and lift $D=qAC_D$ and $L=qAC_L$. The point-mass model evolves altitude, speed, and flight-path angle under gravity and these forces. Convective heating uses a Sutton–Graves-type scaling, $\dot q_{\rm conv}=k\sqrt{\rho/R_n}\,v^3$; the coefficient and assumptions are empirical and scenario-dependent, so this is an estimate rather than a validated thermal-protection design value.

### 21. References and integrity pages — `/references.html`, `/integrity.html`

The References page lists registered data providers, versions, retrieval metadata, model tiers, and constants. The Integrity page runs browser-side checks for supported bundled datasets. These pages help trace selected records; they do not establish that every value in every lab has been independently reproduced or validated.

**Key checks:** these pages do not solve a physical model. The bundled checks include structural invariants such as $N=A-Z$, valid proton/neutron ranges, and dataset counts or uniqueness constraints. Passing a check establishes only that the tested data satisfy those programmed conditions; it is not a blanket validation of scientific accuracy.

## Scientific scope and data

### Model-result categories

ELEMENTA distinguishes several kinds of displayed results where the interface has metadata for them:

| Category | Meaning in this app |
|---|---|
| **Measured / evaluated** | A value transcribed from a named reference dataset or evaluation. Evaluation status, uncertainty, and measurement conditions may not be available for every field. |
| **Derived** | Calculated from stated inputs or a named dataset. The result inherits input uncertainty and model assumptions. |
| **Theoretical** | A solution or calculation for a specified physical model; this does not mean the model describes every real system. |
| **Pedagogical** | A deliberately simplified analogy or teaching model, intended mainly to show qualitative behavior. |
| **Predicted** | An extrapolation or calculation where direct measurement is unavailable or not represented. |

The model-tier registry is implemented in [`src/lib/provenance.ts`](./src/lib/provenance.ts). Each individual lab may have additional limitations beyond this shared registry.

### Registered reference datasets

The registry currently names these principal data sources:

- **IUPAC CIAAW:** 2021 abridged standard atomic weights, including interval weights where natural isotopic composition varies.
- **NIST Atomic Spectra Database:** version 5.12 for atomic spectral lines/levels and ionization-energy references. The live spectra request depends on the app’s middleware or a deployment proxy/cache.
- **CRC Handbook:** selected chemistry and physical-property reference values. The registry does not carry field-by-field uncertainty and condition metadata for every value.
- **CODATA:** 2022 recommended fundamental constants used by selected calculations.
- **IAEA LiveChart / ENSDF:** the bundled nuclide evaluation is identified with an ENSDF cutoff of 2023-10-18.
- **AME2020:** mass excess inputs used for selected derived nuclear quantities.
- **Solar-system element-origin chart:** approximate 2019 digitization, with reading uncertainty noted by the registry; not a primary abundance table.

The source register is metadata, not a promise that every lab uses every listed source. The References page identifies coverage and model tiers where registered.

## Run locally

### Requirements

- Node.js 18 or later
- npm

### Install and start

From this app directory:

```bash
npm install
npm run dev
```

Vite starts the development server at `http://localhost:3520`. Open the root page or a route such as `/orbitals.html` or `/segre.html` directly.

### Typecheck and production build

```bash
npm run typecheck
npm run build
```

The build script runs the TypeScript check and writes the multi-page static site to `dist/`. It does not run the standalone physics scripts listed below.

## Selected calculation checks

The repository includes standalone checks for selected model calculations, physical identities, and rigorous numerical verification suites.

### Automated physics rigor suites (Node.js 22+ native, zero external dependencies):

```bash
# Statistical Mechanics & 2D Ising model (Onsager exact comparison, detailed balance, boundary wrapping)
node --experimental-strip-types scripts/test-statmech-rigor.mjs

# Particle Physics & Feynman Studio (PDG data, vertex conservation, Breit-Wigner, branching fractions)
node --experimental-strip-types scripts/test-particle-rigor.mjs

# 1D Quantum Wave Mechanics (Sturm bisection, Crank-Nicolson norm conservation, FFT Parseval unitarity)
node --experimental-strip-types scripts/test-quantumwave-rigor.mjs

# 3D Atomic Orbitals (Hydrogenic wavefunctions, Slater rules, spherical harmonics orthonormality)
node --experimental-strip-types scripts/test-orbitals-rigor.mjs
```

### Domain checks (via `tsx` if installed):

```bash
npx tsx scripts/test-kinetics.ts
npx tsx scripts/test-zeeman-stark.ts
npx tsx scripts/test-shielding.ts
npx tsx scripts/test-semf.ts
npx tsx scripts/test-bateman.ts
npx tsx scripts/test-nucleosynthesis.ts
npx tsx scripts/test-vibrations.ts
npx tsx scripts/test-crystallography.ts
npx tsx scripts/test-vsepr.ts
```

These checks cover only the scripts named above. They are not an end-to-end test of every page, a full comparison against experiments, or certification of engineering models. Other focused scripts exist in `scripts/`; inspect each script to see exactly what it checks.

## Technology

- **Application:** TypeScript, Vite multi-page build, and `nexus-framework` virtual DOM/reactivity.
- **3D rendering:** `@nexus/3d` and custom elements encapsulate selected WebGL scenes and their lifecycle.
- **Styling:** Tailwind CSS with native browser controls.
- **Data and calculation layers:** domain libraries under `src/lib/`, UI workbenches under `src/components/`, and page entries under `src/app/`.

## Project layout

```text
apps/workspace-elementa/
├── public/       Static assets and logo
├── src/app/      Multi-page route entries
├── src/components/Interactive workbenches and custom elements
├── src/lib/      Physics, chemistry, datasets, and provenance
├── scripts/      Focused numerical and data checks
├── dist/         Generated production site
├── FEATURES.md   Extended feature inventory
└── README.md     Lab guide, assumptions, and setup
```

## License

ELEMENTA is distributed under the repository’s MIT license. See [`LICENSE`](LICENSE).
