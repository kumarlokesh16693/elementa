/**
 * Notable-isotope dataset (NOT exhaustive): every element's stable isotopes
 * with IUPAC natural abundances, plus historically / practically significant
 * radionuclides. Superheavy values (Z ≥ 104) are approximate half-lives of the
 * most stable known isotope, reported from few-atom syntheses.
 *
 * Row format: Z | A | abundance % | half-life | decay | note
 * abundance empty → radioactive; decay of α/β⁻/β⁺/EC lets the app derive the daughter.
 */

import { getElement } from './index'

const ISO_RAW = `
1|1|99.985|||
1|2|0.0156|||
1|3||12.32 a|β⁻|tritium; fusion research, self-luminous devices
2|3|0.000134|||
2|4|99.999866|||
3|6|7.59|||
3|7|92.41|||
4|9|100|||
5|10|19.9|||
5|11|80.1|||
6|11||20.34 min|β⁺|PET imaging (¹¹C-radiopharmaceuticals)
6|12|98.93|||
6|13|1.07|||
6|14||5700 a|β⁻|radiocarbon dating of organic remains
7|13||9.965 min|β⁺|PET imaging
7|14|99.636|||
7|15|0.364|||
8|15||122.24 s|β⁺|PET imaging
8|16|99.757|||
8|17|0.038|||
8|18|0.205|||
8|18||109.77 min|β⁺|PET workhorse (¹⁸F-FDG)
9|19|100|||
10|20|90.48|||
10|21|0.27|||
10|22|9.25|||
11|22||2.602 y|β⁺|PET imaging (¹¹Na standard)
11|23|100|||
12|24|78.99|||
12|25|10.00|||
12|26|11.01|||
13|26||717 ka|β⁺/EC|cosmogenic; meteorite exposure dating
13|27|100|||
14|28|92.223|||
14|29|4.685|||
14|30|3.092|||
14|31||2.62 h|β⁻|short-lived tracer
14|32||153 y|β⁻|cosmogenic groundwater tracer
15|31|100|||
15|32||14.268 d|β⁻|biochemical tracer; radiotherapy (³²P)
16|32|94.99|||
16|33|0.75|||
16|34|4.25|||
16|35||87.37 d|β⁻|activation product
16|36|0.01|||
17|35|75.76|||
17|36||301 ka|β⁻|cosmogenic groundwater tracer
17|37|24.24|||
18|36|0.3336|||
18|37||35.04 d|EC|calibration standard
18|38|0.0629|||
18|39||269 y|β⁻|cosmogenic (³⁹Ar) oceanography
18|40|99.6035|||dominated by radiogenic ⁴⁰Ar from ⁴⁰K decay
19|39|93.2581|||
19|40|0.0117|1.248 Ga|β⁻/EC|K–Ar and ⁴⁰Ar/³⁹Ar dating; body-radioactivity source
19|41|6.7302|||
20|40|96.941|||
20|41||99.4 ka|EC|cosmogenic ⁴¹Ca; bone tracer
20|42|0.647|||
20|43|0.135|||
20|44|2.086|||
20|46|0.004|||
20|48|0.187|6.4×10¹⁸ a|2β⁻|double-beta decay observed
21|45|100|||
22|46|8.25|||
22|47|7.44|||
22|48|73.72|||
22|49|5.41|||
22|50|5.18|||
23|50|0.25|2.7×10¹⁷ a|β⁻/EC|quasi-stable
23|51|99.75|||
24|50|4.345|||
24|51||27.70 d|β⁻|neutron-activation product
24|52|83.789|||
24|53|9.501|||
24|54|2.365|||
25|53||3.7 Ma|β⁻|cosmogenic; meteorite exposure ages
25|55|100|||
26|54|5.845|||
26|55||2.737 y|EC|X-ray calibration standard
26|56|91.754|||
26|57|2.119|||
26|58|0.282|||
26|60||2.6 Ma|2β⁻|supernova signature in deep-sea crust
27|59|100|||
27|60||5.2714 a|β⁻|industrial γ-irradiation source
28|58|68.077|||
28|59||76 ka|EC|cosmogenic meteorite chronometer
28|60|26.223|||
28|61|1.140|||
28|62|3.634|||
28|63||100.1 y|β⁻|quasi-stable
28|64|0.926|||
29|63|69.15|||
29|64||12.70 h|β⁻|⁶⁴Cu PET/therapy radioisotope
29|65|30.85|||
29|67||61.83 h|β⁻|medical tracer
30|64|48.63|||
30|65||244 d|EC|activation tracer
30|66|27.90|||
30|67|4.10|||
30|68|18.75|||
30|70|0.62|||
31|67||3.26 d|EC|⁶⁷Ga tumor/inflammation scan
31|68||67.6 min|β⁺|⁶⁸Ge/⁶⁸Ga generator; PET radiopharmaceuticals
31|69|60.108|||
31|71|39.892|||
31|72||14.1 h|β⁻|medical tracer
32|68||270.8 d|EC|⁶⁸Ge parent of ⁶⁸Ga PET generator
32|70|20.84|||
32|71||11.43 d|EC|tracer
32|72|27.54|||
32|73|7.73|||
32|74|36.28|||
32|76|7.61|1.9×10²¹ a|2β⁻|neutrinoless-double-beta searches (GERDA/LEGEND)
33|73||80.3 d|β⁻|tracer
33|75|100|||
34|74|0.89|||
34|75||119.8 d|EC|γ calibration standard
34|76|9.37|||
34|77|7.63|||
34|78|23.77|||
34|79||3.27×10⁵ a|β⁻|fission product
34|80|49.61|||
34|82|8.73|≈10²⁰ a|2β⁻|double-beta decay
35|79|50.69|||
35|81|49.31|||
36|78|0.355|9.2×10²¹ a|2β⁻|double-beta candidate
36|80|2.286|||
36|81|0|2.29×10⁵ a|EC|cosmogenic groundwater dating (trace)
36|82|11.593|||
36|83|11.500|||
36|84|56.987|||
36|85||10.756 a|β⁻|fission product; atmospheric transport tracer
36|86|17.279|||
37|85|72.17|||
37|87|27.83|4.97×10¹⁰ a|β⁻|Rb–Sr chronometer
38|84|0.56|||
38|86|9.86|||
38|87|7.00|||
38|88|82.58|||
38|89||50.53 d|β⁻|fission product
38|90||28.79 a|β⁻|fission product; bone-seeker (Chernobyl marker)
39|89||2.67 d|β⁻|precursor of ⁹⁰Y radiotherapy
39|90|100|||
40|90|51.45|||
40|91|11.22|||
40|92|17.15|||
40|93||1.61 Ma|β⁻|fission product; zircon chronometer
40|94|17.38|||
40|95||64.0 d|β⁻|fission product
40|96|2.80|2.3×10¹⁹ a|2β⁻|double-beta candidate
41|91||680 a|β⁻|fission product
41|92||3.47×10⁷ a|β⁻|extinct radionuclide
41|93|100|||
41|94||2.0×10⁴ a|β⁻|fission product
41|95||34.99 d|β⁻|fission product
42|92|14.65|||
42|93||4.0 ka|β⁻|fission product
42|94|9.19|||
42|95|15.87|||
42|96|16.67|||
42|97|9.58|||
42|98|24.29|||
42|99||65.94 h|β⁻|parent of ⁹⁹ᵐTc (generator)
42|100|9.63|7.1×10¹⁸ a|2β⁻|double-beta decay observed
43|97||2.6 Ma|EC|longest-lived Tc
43|98||4.2 Ma|β⁻|longest-lived ground-state Tc
43|99||6.006 h|IT|⁹⁹ᵐTc — SPECT workhorse (~30 M procedures/yr)
43|99||211 ka|β⁻|⁹⁹Tc fission product
44|96|5.54|||
44|98|1.87|||
44|99|12.76|||
44|100|12.60|||
44|101|17.06|||
44|102|31.55|||
44|103||39.24 d|β⁻|fission product
44|104|18.62|||
44|106||1.02 a|β⁻|fission product (brachytherapy source)
45|101||3.3 y|β⁻|activation product
45|103|100|||
45|105||35.36 h|β⁻|medical tracer
46|102|1.02|||
46|103||16.99 d|β⁻|tracer
46|104|11.14|||
46|105|22.33|||
46|106|27.33|||
46|107||6.5 Ma|β⁻|extinct radionuclide (early solar system)
46|108|26.46|||
46|110|11.72|||
47|107|51.839|||
47|109|48.161|||
48|106|1.25|||
48|108|0.89|||
48|109||461.4 d|EC|γ calibration standard
48|110|12.49|||
48|111|12.80|||
48|112|24.13|||
48|113|12.22|≈9×10¹⁵ a|β⁻|quasi-stable
48|114|28.73|||
48|116|7.49|||
49|111||2.8047 d|EC|SPECT leukocyte/ thrombus imaging
49|113|4.29|||
49|115|95.71|4.41×10¹⁴ a|β⁻|quasi-stable
50|112|0.97|||
50|114|0.66|||
50|115|0.34|||
50|116|14.54|||
50|117|7.68|||
50|118|24.22|||
50|119|8.59|||
50|120|32.58|||
50|124|5.79|||
51|121|57.21|||
51|123|42.79|||
51|125||2.7586 a|β⁻|brachytherapy source
52|120|0.09|||
52|122|2.55|||
52|123|0.89|||
52|124|4.74|||
52|125|7.07|||
52|126|18.84|||
52|128|31.74|>10²⁴ a|2β⁻|quasi-stable
52|130|34.08|7.9×10²⁰ a|2β⁻|double-beta decay observed
53|123||13.22 h|EC|SPECT imaging
53|125||59.4 d|EC|brachytherapy source
53|127|100|||
53|129||15.7 Ma|β⁻|fission product; groundwater tracer
53|131||8.025 d|β⁻|thyroid diagnostics/therapy; fission product
54|124|0.095|1.8×10²² a|2β⁻|double-beta candidate
54|126|0.089|||
54|128|1.91|||
54|129|26.40|||
54|130|4.08|||
54|131|21.23|||
54|132|26.91|||
54|133||5.247 d|β⁻|lung ventilation imaging
54|134|10.44|||
54|136|8.87|2.2×10²¹ a|2β⁻|double-beta searches (nEXO)
55|133|100|||
55|134||2.065 y|β⁻|activation product
55|135||2.3 Ma|β⁻|fission product; reactor poison
55|137||30.05 a|β⁻|fission product; Chernobyl/Fukushima marker
56|130|0.106|≈4×10²¹ a|2β⁻|geologic-scale double-beta candidate
56|132|0.101|||
56|133||10.52 y|EC|γ calibration standard
56|134|2.417|||
56|135|6.592|||
56|136|7.854|||
56|137|11.232|||
56|138|71.698|||
57|138|0.090|1.02×10¹¹ a|EC|geochemical chronometer
57|139|99.910|||
58|136|0.185|||
58|138|0.251|||
58|139||137.6 d|EC|γ calibration standard
58|140|88.450|||
58|142|11.114|||
59|141|100|||
59|143||13.57 d|β⁻|fission product
60|142|27.152|||
60|143|12.174|||
60|144|23.798|2.29×10¹⁵ a|α|quasi-stable
60|145|8.293|||
60|146|17.189|||
60|148|5.756|||
60|150|5.638|6.7×10¹⁸ a|2β⁻|double-beta decay observed
61|145||17.7 a|EC|longest-lived Pm
61|146||5.53 y|β⁻/EC|research isotope
61|147||2.6234 a|β⁻|fission product; historical luminous paint
62|144|3.075|||
62|147|14.99|1.06×10¹¹ a|α|Sm–Nd chronometer
62|148|11.24|7×10¹⁵ a|α|quasi-stable
62|149|13.82|||extremely high neutron-capture cross-section
62|150|7.38|||
62|152|26.75|||
62|154|22.75|||
63|151|47.81|5×10¹⁸ a|α|quasi-stable
63|152||13.537 y|β⁻/EC|calibration isotope
63|153|52.19|||
63|154||8.6 y|β⁻|activation product
63|155||4.76 y|β⁻|fission product
64|152|0.20|1.08×10¹⁴ a|α|quasi-stable
64|153||240.4 d|EC|γ calibration standard
64|154|2.18|||
64|155|14.80|||
64|156|20.47|||
64|157|15.65|||highest thermal-neutron capture σ of any nuclide
64|158|24.84|||
64|160|21.86|||
65|159|100|||
65|160||5.35 d|β⁻|tracer
66|156|0.056|||
66|158|0.095|||
66|160|2.329|||
66|161|18.889|||
66|162|25.475|||
66|163|24.896|||
66|164|28.260|||
67|165|100|||
67|166||26.83 h|β⁻|radiotherapy isotope (Dy/Ho generator)
68|162|0.139|||
68|164|1.601|||
68|166|33.61|||
68|167|22.869|||
68|168|26.978|||
68|169||9.4 d|β⁻|brachytherapy source
68|170|14.910|||
69|168||93.1 d|β⁻|activation product
69|169|100|||
69|170||128.6 d|β⁻|portable brachytherapy
70|168|0.123|||
70|170|3.023|||
70|171|14.216|||
70|172|21.754|||
70|173|16.103|||
70|174|31.896|||
70|175||4.185 d|β⁻|tracer
70|176|12.889|||
71|173||1.37 y|β⁻|research isotope
71|175|97.41|||
71|176|2.59|3.76×10¹⁰ a|β⁻|Lu–Hf chronometer; parent of ¹⁷⁷Lu therapy
71|177||6.647 d|β⁻|¹⁷⁷Lu radiotherapy (PSMA)
72|174|0.16|2×10¹⁵ a|α|quasi-stable
72|176|5.26|||
72|177|18.60|||
72|178|27.28|||
72|179|13.62|||
72|180|35.08|||
73|180|0.012|>10¹⁵ a|IT|all natural ¹⁸⁰Ta is the ¹⁸⁰ᵐTa isomer — rarest natural nuclide
73|181|99.988|||
74|180|0.12|||
74|181||121 d|β⁻|activation product
74|182|26.50|||
74|183|14.31|||
74|184|30.64|||
74|185||75.1 d|β⁻|activation product
74|186|28.43|||
75|185|37.40|||
75|186||3.7185 d|β⁻|¹⁸⁶Re/¹⁸⁸Re radiotherapy
75|187|62.60|4.12×10¹⁰ a|β⁻|Re–Os chronometer
75|188||17.0 h|β⁻|radiotherapy isotope
76|184|0.02|||
76|186|1.59|2×10¹⁵ a|2β⁻|quasi-stable
76|187|1.96|||
76|188|13.24|||
76|189|16.15|||
76|190|26.26|||
76|192|40.78|||
77|191|37.30|||
77|192||73.83 d|β⁻|historical brachytherapy source
77|193|62.70|||
78|190|0.012|6.5×10¹¹ a|α|quasi-stable
78|192|0.782|||
78|194|32.864|||
78|195|33.775|||
78|196|25.211|||
78|197||19.89 h|β⁻|activation product
78|198|7.356|||
79|195||186 d|β⁻|research isotope
79|197|100|||
79|198||2.7 d|β⁻|¹⁹⁸Au calibration; colloid therapy
80|196|0.15|||
80|198|9.97|||
80|199|16.87|||
80|200|23.10|||
80|201|13.18|||
80|202|29.86|||
80|203||46.6 d|β⁻|calibration standard
80|204|6.87|||
81|203|29.52|||
81|204||3.78 y|β⁻/EC|environmental toxicology tracer
81|205|70.48|||
82|204|1.40|||
82|205||1.73×10⁷ a|β⁻|extinct radionuclide (early solar system)
82|206|24.10|||terminal nuclide of the ⁴ⁿ⁺² (uranium) series
82|207|22.10|||terminal nuclide of the ⁴ⁿ⁺³ (actinium) series
82|208|52.40|||terminal nuclide of the ⁴ⁿ (thorium) series
82|210||22.20 y|β⁻|in U-238 chain; parent of ²¹⁰Po
83|207||32.9 y|β⁻|research isotope
83|208||3.68×10⁵ a|β⁻|research isotope
83|209|100|1.9×10¹⁹ a|α|effectively stable — heaviest quasi-stable nuclide
83|210||5.012 d|β⁻|in U-238 chain
83|211||2.14 min|α|in U-235 chain
83|212||60.55 min|β⁻/α|in Th-232 chain (α branch 36%)
83|213||45.59 min|β⁻|in Np-237 chain
83|214||19.9 min|β⁻|in U-238 chain
84|208||2.898 y|α|research isotope
84|209||125.2 y|α|longest-lived Po
84|210||138.376 d|α|in U-238 chain; extremely radiotoxic
84|212||0.299 µs|α|in Th-232 chain
84|214||164.3 µs|α|in U-238 chain
84|215||1.781 ms|α|in U-235 chain
84|216||0.145 s|α|in Th-232 chain
84|218||3.098 min|α|in U-238 chain
85|210||8.1 h|EC|longest-lived At
85|211||7.214 h|α/EC|targeted α-particle therapy research
85|217||32.3 ms|α|in Np-237 chain
86|211||14.6 h|EC|research isotope
86|219||3.96 s|α|in U-235 chain (actinon)
86|220||55.6 s|α|in Th-232 chain (thoron)
86|222||3.8235 d|α|in U-238 chain; indoor radon hazard
87|221||4.9 min|α|in Np-237 chain
87|223||21.8 min|β⁻|in U-235 chain; rarest naturally-occurring element
88|223||11.43 d|α|in U-235 chain
88|224||3.6319 d|α|in Th-232 chain
88|225||14.9 d|α|in Np-237 chain
88|226||1600 a|α|in U-238 chain; the Curies' standard
88|228||5.75 y|β⁻|in Th-232 chain
89|225||10.0 d|α|in Np-237 chain; targeted α therapy
89|227||21.772 y|β⁻|in U-235 chain (α branch 1.4%)
89|228||6.15 h|β⁻|in Th-232 chain
90|227||18.68 d|α|in U-235 chain
90|228||1.9116 y|α|in Th-232 chain
90|229||7.34 ka|α|in Np-237 chain; lowest-known nuclear isomer transition
90|230||75.38 ka|α|in U-238 chain; ²³⁰Th/U dating
90|231||25.52 h|β⁻|in U-235 chain
90|232|100|14.05 Ga|α|primordial; thorium fuel cycle; Th–Pb dating
90|234||24.10 d|β⁻|in U-238 chain
91|231|100|32.76 ka|α|in U-235 chain; Pa-231 dating
91|233||26.975 d|β⁻|in Np-237 chain; parent of ²³³U
91|234||1.16 min (ᵐ)|β⁻|in U-238 chain
92|232||68.9 y|α|neutron-capture product
92|233||1.592×10⁵ a|α|fissile; bred from ²³²Th
92|234|0.0055|245.5 ka|α|in U-238 chain
92|235|0.7204|703.8 Ma|α|primordial fissile; U–Pb dating
92|236||23.42 Ma|α|neutron-capture product
92|238|99.274|4.468 Ga|α|primordial; head of the ⁴ⁿ⁺² uranium series
93|236||154 ka|β⁻|research isotope
93|237|0|2.144 Ma|α|head of the ⁴ⁿ⁺¹ neptunium series; long-lived waste
93|239||2.356 d|β⁻|Pu-239 precursor
94|236||2.858 y|α|research isotope
94|238||87.7 y|α|RTG fuel (spacecraft, pacemakers)
94|239||24.11 ka|α|fissile; weapons/Pu fuel cycle
94|240||6.561 ka|α|reactor product
94|241||14.329 y|α/β⁻|parent of ²⁴¹Am
94|242||3.75×10⁵ a|α|research isotope
94|244||8.08×10⁷ a|α|longest-lived Pu; possible extinct natural nuclide
95|241||432.2 y|α|smoke-detector ionization source
95|242||16.02 h|β⁻|short-lived
95|243||7.37×10³ a|α|longest-lived Am
96|242||162.8 d|α|RHU heat source
96|243||29.1 y|α|research isotope
96|244||18.1 y|α|Curiosity rover APXS/RHU source
96|245||8.5 ka|α|long-lived
96|246||4.73 ka|α|research isotope
96|247||15.6 Ma|α|longest-lived Cm
96|248||3.48×10⁵ a|α|research isotope
97|245||4.94 d|EC|research isotope
97|247||1.38 ka|α|longest-lived Bk
97|249||330.4 d|β⁻|target material; parent of ²⁴⁹Cf
98|249||351 y|α|decay product of ²⁴⁹Bk
98|250||13.08 y|α|research isotope
98|251||900 a|α|longest-lived Cf
98|252||2.645 y|α/SF|intense neutron source (2.3×10¹² n/s·g)
98|253||17.81 d|β⁻|short-lived
98|254||60.5 d|SF|astrophysical r-process interest
99|252||471.7 d|α|longest-lived Es
99|253||20.47 d|α|most commonly produced Es isotope
99|254||275.7 d|α|research isotope
100|253||3.00 d|EC|research isotope
100|255||20.07 h|α|reactor-produced
100|257||100.5 d|α|longest-lived Fm
101|258||51.5 d|α|longest-lived Md
101|260||27.8 d|α|recently measured; long-lived
102|255||3.1 min|α|early No isotope
102|259||58 min|α|longest-lived No
103|262||3.6 h|EC/α|Lr chemistry studies
103|266||11 h|EC|longest-lived Lr known
104|263||~10 min|α|early Rf chemistry isotope
104|267||~1.3 h|α|longest-lived Rf known
105|267||~1.4 h|α|research isotope
105|268||~28 h|α|longest-lived Db known
106|265||~9 s|α|early discovery isotope
106|269||~14 min|α|longest-lived Sg known (approx.)
107|270||~1 min|α|longest-lived Bh known (approx.)
108|269||~16 s|α|longest-lived Hs known (approx.)
108|270||~3.6 s|α|research isotope
109|278||~5 s|α|only known Mt isotope (few atoms)
110|281||~10 s|α|longest-lived Ds known (approx.)
111|282||~2 min|α|longest-lived Rg known (approx.)
112|284||~97 ms|α|research isotope
112|285||~29 s|α|longest-lived Cn known (approx.)
113|286||~10 s|α|longest-lived Nh known (approx.)
114|288||~0.8 s|α|research isotope
114|289||~1.9 s|α|longest-lived Fl known (approx.)
115|289||~0.33 s|α|research isotope
115|290||~0.65 s|α|longest-lived Mc known (approx.)
116|293||~57 ms|α|longest-lived Lv known (approx.)
117|294||~51 ms|α|only known Ts isotope (few atoms)
118|294||~0.69 ms|α|only known Og isotope (few atoms observed)
`

export interface IsoEntry {
  a: number
  abundance?: number
  halfLife?: string
  decay?: string
  note?: string
}

export const ISOTOPES: Record<number, IsoEntry[]> = (() => {
  const map: Record<number, IsoEntry[]> = {}
  for (const line of ISO_RAW.trim().split('\n')) {
    const parts = line.split('|')
    if (parts.length < 6) continue
    const z = parseInt(parts[0], 10)
    if (!Number.isFinite(z)) continue
    const entry: IsoEntry = { a: parseInt(parts[1], 10) }
    const ab = parseFloat(parts[2])
    if (Number.isFinite(ab) && ab > 0) entry.abundance = ab
    if (parts[3]) entry.halfLife = parts[3]
    if (parts[4]) entry.decay = parts[4]
    if (parts[5]) entry.note = parts[5]
    ;(map[z] ??= []).push(entry)
  }
  return map
})()

/** Derive the daughter nuclide label from the decay mode, e.g. α: U-238 → Th-234. */
export function daughterOf(z: number, a: number, decay?: string): string | null {
  if (!decay) return null
  const sym = (zz: number, aa: number) => {
    const el = getElement(zz)
    return el ? `${el.symbol}-${aa}` : null
  }
  if (decay.startsWith('α')) return sym(z - 2, a - 4)
  if (decay === 'β⁻') return sym(z + 1, a)
  if (decay === 'β⁺' || decay === 'EC') return sym(z - 1, a)
  if (decay === 'β⁻/EC') return `${sym(z + 1, a) ?? '?'} / ${sym(z - 1, a) ?? '?'}`
  if (decay === '2β⁻') return sym(z + 2, a)
  if (decay === 'SF') return 'fission'
  return null // IT → same nuclide
}

/* ------------------------------------------------------------------ */
/* Natural radioactive decay series (main paths, single-branch chains) */
/* ------------------------------------------------------------------ */

export interface ChainStep {
  z: number
  a: number
  halfLife: string
  mode: string
}

export interface DecayChain {
  key: string
  name: string
  family: string
  head: string
  terminal: string
  steps: ChainStep[]
}

const chain = (rows: [number, number, string, string][]): ChainStep[] =>
  rows.map(([z, a, halfLife, mode]) => ({ z, a, halfLife, mode }))

export const DECAY_CHAINS: DecayChain[] = [
  {
    key: '4n2',
    name: 'Uranium series',
    family: '4n+2',
    head: 'U-238',
    terminal: 'Pb-206',
    steps: chain([
      [92, 238, '4.468 Ga', 'α'],
      [90, 234, '24.10 d', 'β⁻'],
      [91, 234, '1.16 min (ᵐ)', 'β⁻'],
      [92, 234, '245.5 ka', 'α'],
      [90, 230, '75.38 ka', 'α'],
      [88, 226, '1600 a', 'α'],
      [86, 222, '3.8235 d', 'α'],
      [84, 218, '3.098 min', 'α'],
      [82, 214, '26.8 min', 'β⁻'],
      [83, 214, '19.9 min', 'β⁻'],
      [84, 214, '164.3 µs', 'α'],
      [82, 210, '22.20 a', 'β⁻'],
      [83, 210, '5.012 d', 'β⁻'],
      [84, 210, '138.376 d', 'α'],
      [82, 206, 'stable', ''],
    ]),
  },
  {
    key: '4n',
    name: 'Thorium series',
    family: '4n',
    head: 'Th-232',
    terminal: 'Pb-208',
    steps: chain([
      [90, 232, '14.05 Ga', 'α'],
      [88, 228, '5.75 y', 'β⁻'],
      [89, 228, '6.15 h', 'β⁻'],
      [90, 228, '1.912 y', 'α'],
      [88, 224, '3.632 d', 'α'],
      [86, 220, '55.6 s', 'α'],
      [84, 216, '0.145 s', 'α'],
      [82, 212, '10.64 h', 'β⁻'],
      [83, 212, '60.6 min', 'β⁻'],
      [84, 212, '0.299 µs', 'α'],
      [82, 208, 'stable', ''],
    ]),
  },
  {
    key: '4n3',
    name: 'Actinium series',
    family: '4n+3',
    head: 'U-235',
    terminal: 'Pb-207',
    steps: chain([
      [92, 235, '703.8 Ma', 'α'],
      [90, 231, '25.52 h', 'β⁻'],
      [91, 231, '32.76 ka', 'α'],
      [89, 227, '21.77 y', 'β⁻'],
      [90, 227, '18.68 d', 'α'],
      [88, 223, '11.43 d', 'α'],
      [86, 219, '3.96 s', 'α'],
      [84, 215, '1.781 ms', 'α'],
      [82, 211, '36.1 min', 'β⁻'],
      [83, 211, '2.14 min', 'α'],
      [81, 207, '4.78 min', 'β⁻'],
      [82, 207, 'stable', ''],
    ]),
  },
  {
    key: '4n1',
    name: 'Neptunium series',
    family: '4n+1',
    head: 'Np-237',
    terminal: 'Bi-209',
    steps: chain([
      [93, 237, '2.144 Ma', 'α'],
      [91, 233, '26.98 d', 'β⁻'],
      [92, 233, '1.592 ka', 'α'],
      [90, 229, '7.34 ka', 'α'],
      [88, 225, '14.9 d', 'α'],
      [89, 225, '10.0 d', 'α'],
      [87, 221, '4.9 min', 'α'],
      [85, 217, '32.3 ms', 'α'],
      [83, 213, '45.6 min', 'β⁻'],
      [84, 213, '4.2 µs', 'α'],
      [82, 209, '3.24 h', 'β⁻'],
      [83, 209, 'stable', ''],
    ]),
  },
]

/** Which decay chains contain the given element? */
export function chainsForElement(z: number): DecayChain[] {
  return DECAY_CHAINS.filter((c) => c.steps.some((s) => s.z === z))
}

/** Half-life in seconds for the 4 series heads — not needed by UI, kept for research use. */
export const SERIES_NOTE =
  'a = years · ka = 10³ a · Ma = 10⁶ a · Ga = 10⁹ a · (ᵐ) = nuclear isomer · ≈ approximate'
