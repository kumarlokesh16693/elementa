import type { CategoryKey, Phase } from './types'

/**
 * Research-grade element dataset, part 1: Z = 1-59 (H → Pr).
 * Pipe-delimited rows, fields:
 * Z | symbol | name | mass | category | group | period | xpos | ypos |
 * electron configuration | shells (K,L,M,...) | electronegativity |
 * ionization energy eV | electron affinity kJ/mol | atomic radius pm |
 * melting point K | boiling point K | density g/cm3 | oxidation states |
 * phase | discovery year | discovered by | radioactive flag (R/-) | summary
 * '?' = no accepted / not applicable value.
 */
export const RAW1 = `
1|H|Hydrogen|1.008|nonmetal|1|1|1|1|1s1|1|2.20|13.598|72.8|53|13.99|20.27|0.00009|-1, +1|gas|1766|Henry Cavendish|-|Lightest element; powers stellar nucleosynthesis via proton-proton fusion and forms ~75% of ordinary baryonic matter.
2|He|Helium|4.0026|noble|18|1|18|1|1s2|2|?|24.587|?|31|0.95|4.22|0.00018|0|gas|1868|P. Janssen & N. Lockyer|-|Inert closed-shell gas; the only element that never solidifies at 1 atm, used in cryogenics near absolute zero.
3|Li|Lithium|6.94|alkali|1|2|1|2|[He] 2s1|2-1|0.98|5.392|59.6|145|453.65|1615|0.534|+1|solid|1817|J. A. Arfwedson|-|Least dense metal; cornerstone of rechargeable battery chemistry and light structural alloys.
4|Be|Beryllium|9.0122|alkaline|2|2|2|2|[He] 2s2|2-2|1.57|9.323|?|105|1560|2742|1.85|+2|solid|1798|L. N. Vauquelin|-|Stiff, light, X-ray transparent metal; toxic as dust and vital in aerospace windows and neutron reflectors.
5|B|Boron|10.81|metalloid|13|2|13|2|[He] 2s2 2p1|2-3|2.04|8.298|26.7|85|2349|4200|2.34|+3|solid|1808|H. Davy, J. Gay-Lussac & L. Thenard|-|Electron-deficient metalloid forming covalent networks; borosilicate glass and neutron capture in boron-10.
6|C|Carbon|12.011|nonmetal|14|2|14|2|[He] 2s2 2p2|2-4|2.55|11.260|121.8|70|3823|4098|2.267|+4, +2, -4|solid|?|Known since antiquity|-|Backbone of organic chemistry; diamond, graphite and graphene differ only in bonding geometry.
7|N|Nitrogen|14.007|nonmetal|15|2|15|2|[He] 2s2 2p3|2-5|3.04|14.534|?|65|63.15|77.36|0.00125|+5, +3, -3|gas|1772|D. Rutherford|-|78% of air as inert N2 triple bond; fixed into ammonia for fertilizers via the Haber-Bosch process.
8|O|Oxygen|15.999|nonmetal|16|2|16|2|[He] 2s2 2p4|2-6|3.44|13.618|141.0|60|54.36|90.20|0.00143|-2|gas|1774|J. Priestley & C. W. Scheele|-|Most abundant element in Earth's crust; drives aerobic respiration and combustion chemistry.
9|F|Fluorine|18.998|halogen|17|2|17|2|[He] 2s2 2p5|2-7|3.98|17.423|328.0|35|53.48|85.03|0.0017|-1|gas|1886|H. Moissan|-|Most electronegative and reactive element; attacks nearly every material, including glass and noble gases.
10|Ne|Neon|20.180|noble|18|2|18|2|[He] 2s2 2p6|2-8|?|21.565|?|38|24.56|27.07|0.0009|0|gas|1898|W. Ramsay & M. Travers|-|Chemically inert; characteristic red-orange emission from excited-atom discharge tubes.
11|Na|Sodium|22.990|alkali|1|3|1|3|[Ne] 3s1|2-8-1|0.93|5.139|52.8|180|370.94|1156|0.968|+1|solid|1807|H. Davy|-|Soft, highly reactive metal; essential electrolyte in biology and coolant candidate in fast reactors.
12|Mg|Magnesium|24.305|alkaline|2|3|2|3|[Ne] 3s2|2-8-2|1.31|7.646|?|150|923|1363|1.738|+2|solid|1755|J. Black|-|Light structural metal and the central atom of chlorophyll in photosynthesis.
13|Al|Aluminium|26.982|post|13|3|13|3|[Ne] 3s2 3p1|2-8-3|1.61|5.986|42.5|125|933.47|2792|2.70|+3|solid|1825|H. C. Orsted|-|Most abundant metal in the crust; passive oxide film gives light alloys their corrosion resistance.
14|Si|Silicon|28.085|metalloid|14|3|14|3|[Ne] 3s2 3p2|2-8-4|1.90|8.152|134.1|110|1687|3538|2.329|+4, -4|solid|1824|J. J. Berzelius|-|Semiconductor substrate of the digital age; tetravalent network former in silicate minerals.
15|P|Phosphorus|30.974|nonmetal|15|3|15|3|[Ne] 3s2 3p3|2-8-5|2.19|10.487|72.0|100|317.3|553.7|1.823|+5, +3, -3|solid|1669|H. Brandt|-|Exists as white, red and black allotropes; the phosphate backbone carries genetic information.
16|S|Sulfur|32.06|nonmetal|16|3|16|3|[Ne] 3s2 3p4|2-8-6|2.58|10.360|200.0|100|388.36|717.8|2.07|+6, +4, -2|solid|?|Known since antiquity|-|Vulcanizes rubber and anchors proteins in disulfide bridges; major industrial acid as H2SO4.
17|Cl|Chlorine|35.45|halogen|17|3|17|3|[Ne] 3s2 3p5|2-8-7|3.16|12.968|349.0|100|171.6|239.11|0.0032|+7, +5, +1, -1|gas|1774|C. W. Scheele|-|Powerful oxidant used in water treatment; chloride ions regulate osmotic balance in cells.
18|Ar|Argon|39.95|noble|18|3|18|3|[Ne] 3s2 3p6|2-8-8|?|15.760|?|71|83.80|87.30|0.00178|0|gas|1894|Lord Rayleigh & W. Ramsay|-|Most common noble gas in air; inert shield for welding and arc lamps.
19|K|Potassium|39.098|alkali|1|4|1|4|[Ar] 4s1|2-8-8-1|0.82|4.341|48.4|220|336.53|1032|0.862|+1|solid|1807|H. Davy|-|Essential nerve-signal cation; K-40 decay provides an internal radiogenic heat source in Earth.
20|Ca|Calcium|40.078|alkaline|2|4|2|4|[Ar] 4s2|2-8-8-2|1.00|6.113|2.37|180|1115|1757|1.55|+2|solid|1808|H. Davy|-|Structural mineral of bones and shells; signal ion in muscle contraction cascades.
21|Sc|Scandium|44.956|transition|3|4|3|4|[Ar] 3d1 4s2|2-8-9-2|1.36|6.561|17.7|160|1814|3109|2.985|+3|solid|1879|L. F. Nilson|-|Light transition metal; small scandium additions strengthen aluminium aerospace alloys.
22|Ti|Titanium|47.867|transition|4|4|4|4|[Ar] 3d2 4s2|2-8-10-2|1.54|6.828|7.6|140|1941|3560|4.506|+4, +3|solid|1791|W. Gregor|-|High strength-to-weight metal with outstanding biocompatibility for implants and airframes.
23|V|Vanadium|50.942|transition|5|4|5|4|[Ar] 3d3 4s2|2-8-11-2|1.63|6.746|50.6|135|2183|3680|6.11|+5, +4, +3, +2|solid|1801|A. M. del Rio|-|Multi-oxidation-state metal used in flow batteries and steel microalloying.
24|Cr|Chromium|51.996|transition|6|4|6|4|[Ar] 3d5 4s1|2-8-13-1|1.66|6.767|64.3|140|2180|2944|7.19|+6, +3, +2|solid|1797|L. N. Vauquelin|-|Passivating oxide grants stainless steel its shine and corrosion immunity.
25|Mn|Manganese|54.938|transition|7|4|7|4|[Ar] 3d5 4s2|2-8-13-2|1.55|7.434|?|140|1519|2334|7.21|+7, +4, +2|solid|1774|J. G. Gahn|-|Steel desulfurization workhorse; oxygen-evolving complex of photosystem II contains a Mn4Ca cluster.
26|Fe|Iron|55.845|transition|8|4|8|4|[Ar] 3d6 4s2|2-8-14-2|1.83|7.902|15.7|140|1811|3134|7.874|+3, +2|solid|?|Known since antiquity|-|End point of stellar fusion; ferromagnetic core of Earth and the most used structural metal.
27|Co|Cobalt|58.933|transition|9|4|9|4|[Ar] 3d7 4s2|2-8-15-2|1.88|7.881|63.7|135|1768|3200|8.90|+2, +3|solid|1735|G. Brandt|-|High-energy battery cathode metal; vitamin B12 is a cobalt coordination complex.
28|Ni|Nickel|58.693|transition|10|4|10|4|[Ar] 3d8 4s2|2-8-16-2|1.91|7.640|112.0|135|1728|3186|8.908|+2, +3|solid|1751|A. F. Cronstedt|-|Corrosion-resistant alloy metal; catalyzes hydrogenation and powers NiMH cells.
29|Cu|Copper|63.546|transition|11|4|11|4|[Ar] 3d10 4s1|2-8-18-1|1.90|7.726|118.4|135|1357.77|2835|8.96|+2, +1|solid|?|Known since antiquity|-|Outstanding electrical conductor; antimicrobial surfaces and semiconductor interconnects.
30|Zn|Zinc|65.38|transition|12|4|12|4|[Ar] 3d10 4s2|2-8-18-2|1.65|9.394|?|135|692.68|1180|7.14|+2|solid|?|Known since antiquity|-|Sacrificial galvanic coating; essential catalytic cofactor in hundreds of enzymes.
31|Ga|Gallium|69.723|post|13|4|13|4|[Ar] 3d10 4s2 4p1|2-8-18-3|1.81|5.999|28.9|130|302.91|2673|5.91|+3|solid|1875|P. Lecoq de Boisbaudran|-|Melts in the hand at 29.8 C; GaAs and GaN power LEDs, lasers and RF electronics.
32|Ge|Germanium|72.630|metalloid|14|4|14|4|[Ar] 3d10 4s2 4p2|2-8-18-4|2.01|7.900|119.0|125|1211.4|3106|5.323|+4, +2|solid|1886|C. A. Winkler|-|Original transistor semiconductor; now key in infrared optics and SiGe high-speed devices.
33|As|Arsenic|74.922|metalloid|15|4|15|4|[Ar] 3d10 4s2 4p3|2-8-18-5|2.18|9.815|78.0|115|1090|887|5.727|+5, +3, -3|solid|1250|Albertus Magnus|-|Notorious poison; sublimes below its melting point and dopes GaAs semiconductors.
34|Se|Selenium|78.971|nonmetal|16|4|16|4|[Ar] 3d10 4s2 4p4|2-8-18-6|2.55|9.752|195.0|115|494|958|4.81|+6, +4, -2|solid|1817|J. J. Berzelius|-|Photoconductive element behind early photocopiers; essential trace antioxidant in selenoproteins.
35|Br|Bromine|79.904|halogen|17|4|17|4|[Ar] 3d10 4s2 4p5|2-8-18-7|2.96|11.814|324.6|115|265.8|332.0|3.1028|+5, +1, -1|liquid|1826|A. J. Balard|-|One of only two elements liquid at room temperature; flame retardants and photography chemistry.
36|Kr|Krypton|83.798|noble|18|4|18|4|[Ar] 3d10 4s2 4p6|2-8-18-8|3.00|13.999|?|88|115.79|119.93|0.00375|0, +2|gas|1898|W. Ramsay & M. Travers|-|Defines the historical metre via its 605 nm orange spectral line; used in high-performance lighting.
37|Rb|Rubidium|85.468|alkali|1|5|1|5|[Kr] 5s1|2-8-18-8-1|0.82|4.177|46.9|235|312.46|961|1.532|+1|solid|1861|R. Bunsen & G. R. Kirchhoff|-|Soft alkali metal; Rb-87 spin-exchange enables chip-scale atomic clocks.
38|Sr|Strontium|87.62|alkaline|2|5|2|5|[Kr] 5s2|2-8-18-8-2|0.95|5.695|5.03|200|1050|1655|2.64|+2|solid|1790|A. Crawford|-|Crimson flame colorant in fireworks; Sr-90 is a prominent fission product.
39|Y|Yttrium|88.906|transition|3|5|3|5|[Kr] 4d1 5s2|2-8-18-9-2|1.22|6.217|29.6|180|1799|3609|4.472|+3|solid|1794|J. Gadolin|-|Namesake of the rare-earth cluster; YBCO was the first superconductor above 77 K.
40|Zr|Zirconium|91.224|transition|4|5|4|5|[Kr] 4d2 5s2|2-8-18-10-2|1.33|6.634|41.1|155|2128|4682|6.52|+4|solid|1789|M. H. Klaproth|-|Neutron-transparent cladding for nuclear fuel rods; zirconia ceramics approach diamond hardness.
41|Nb|Niobium|92.906|transition|5|5|5|5|[Kr] 4d4 5s1|2-8-18-12-1|1.60|6.759|86.1|145|2750|5017|8.57|+5|solid|1801|C. Hatchett|-|Type-II superconductor of choice for SRF cavities and the LHC dipole magnets.
42|Mo|Molybdenum|95.95|transition|6|5|6|5|[Kr] 4d5 5s1|2-8-18-13-1|2.16|7.092|71.9|145|2896|4912|10.28|+6, +4, +2|solid|1781|C. W. Scheele & P. J. Hjelm|-|High-temperature alloy strengthener; nitrogenase and xanthine oxidase are molybdoenzymes.
43|Tc|Technetium|98|transition|7|5|7|5|[Kr] 4d5 5s2|2-8-18-13-2|1.90|7.28|53.0|135|2430|4538|11.0|+7, +4|solid|1937|C. Perrier & E. Segre|R|First artificially produced element; Tc-99m is the workhorse radiotracer of nuclear medicine.
44|Ru|Ruthenium|101.07|transition|8|5|8|5|[Kr] 4d7 5s1|2-8-18-15-1|2.20|7.361|101.3|130|2607|4423|12.45|+8, +6, +4, +3|solid|1844|K. E. Klaus|-|Platinum-group catalyst; grain-boundary stabilizer in titanium superalloys.
45|Rh|Rhodium|102.91|transition|9|5|9|5|[Kr] 4d8 5s1|2-8-18-16-1|2.28|7.459|109.7|135|2237|3968|12.41|+3, +1|solid|1803|W. H. Wollaston|-|Scarce PGM; three-way catalytic converters rely on its NOx reduction activity.
46|Pd|Palladium|106.42|transition|10|5|10|5|[Kr] 4d10|2-8-18-18|2.20|8.337|53.7|140|1828.05|3236|12.023|+2, +4|solid|1803|W. H. Wollaston|-|Hydrogen sponge absorbing up to 900 volumes of H2; central to cross-coupling catalysis.
47|Ag|Silver|107.87|transition|11|5|11|5|[Kr] 4d10 5s1|2-8-18-18-1|1.93|7.576|125.6|160|1234.93|2435|10.49|+1|solid|?|Known since antiquity|-|Highest electrical and thermal conductivity of all metals; classic photographic halide.
48|Cd|Cadmium|112.41|transition|12|5|12|5|[Kr] 4d10 5s2|2-8-18-18-2|1.69|8.994|?|155|594.22|1040|8.65|+2|solid|1817|F. Stromeyer|-|Toxic soft metal; CdTe remains a leading thin-film photovoltaic absorber.
49|In|Indium|114.82|post|13|5|13|5|[Kr] 4d10 5s2 5p1|2-8-18-18-3|1.78|5.786|28.9|155|429.75|2345|7.31|+3|solid|1863|F. Reich & T. Richter|-|Indium-tin oxide is the transparent electrode of every touchscreen display.
50|Sn|Tin|118.71|post|14|5|14|5|[Kr] 4d10 5s2 5p2|2-8-18-18-4|1.96|7.344|107.3|145|505.08|2875|7.265|+4, +2|solid|?|Known since antiquity|-|Alloyed with copper since the Bronze Age; cryogenic beta-tin transformation plagues solder joints.
51|Sb|Antimony|121.76|metalloid|15|5|15|5|[Kr] 4d10 5s2 5p3|2-8-18-18-5|2.05|8.608|101.0|145|903.78|1860|6.697|+5, +3, -3|solid|?|Known since antiquity|-|Ancient cosmetic kohl; flame retardants and III-V semiconductor doping.
52|Te|Tellurium|127.60|metalloid|16|5|16|5|[Kr] 4d10 5s2 5p4|2-8-18-18-6|2.10|9.010|190.2|140|722.66|1261|6.24|+6, +4, -2|solid|1782|F. J. Muller von Reichenstein|-|CdTe solar cells and phase-change memory media; rarer than gold in the crust.
53|I|Iodine|126.90|halogen|17|5|17|5|[Kr] 4d10 5s2 5p5|2-8-18-18-7|2.66|10.451|295.2|140|386.85|457.4|4.933|+7, +5, +1, -1|solid|1811|B. Courtois|-|Sublimes to violet vapor; thyroid hormones require it, and iodide protects against radioiodine uptake.
54|Xe|Xenon|131.29|noble|18|5|18|5|[Kr] 4d10 5s2 5p6|2-8-18-18-8|2.60|12.130|?|108|161.4|165.03|0.0059|0, +2, +4, +6, +8|gas|1898|W. Ramsay & M. Travers|-|Forms stable compounds with fluorine; ion drive propellant and clinical anesthetic.
55|Cs|Caesium|132.91|alkali|1|6|1|6|[Xe] 6s1|2-8-18-18-8-1|0.79|3.894|45.5|260|301.59|944|1.93|+1|solid|1860|R. Bunsen & G. R. Kirchhoff|-|Its 9,192,631,770 Hz hyperfine transition defines the SI second in atomic clocks.
56|Ba|Barium|137.33|alkaline|2|6|2|6|[Xe] 6s2|2-8-18-18-8-2|0.89|5.212|13.95|215|1000|2170|3.51|+2|solid|1808|H. Davy|-|Sulfate contrast agent for GI radiography; green firework emitter.
57|La|Lanthanum|138.91|lanthanide|0|6|3|9|[Xe] 5d1 6s2|2-8-18-18-9-2|1.10|5.577|48.0|195|1193|3737|6.162|+3|solid|1839|C. G. Mosander|-|Opens the 4f series; LaNi5 stores hydrogen and La2O3 cracks petroleum.
58|Ce|Cerium|140.12|lanthanide|0|6|4|9|[Xe] 4f1 5d1 6s2|2-8-18-19-9-2|1.12|5.539|50.0|185|1068|3716|6.77|+3, +4|solid|1803|J. J. Berzelius, W. Hisinger & M. Klaproth|-|Most abundant rare earth; ceria polishes glass and buffers oxygen in catalytic converters.
59|Pr|Praseodymium|140.91|lanthanide|0|6|5|9|[Xe] 4f3 6s2|2-8-18-21-8-2|1.13|5.473|50.0|185|1208|3793|6.77|+3|solid|1885|C. A. von Welsbach|-|Strengthens rare-earth magnets and colors welder goggles against intense arc glare.
`
