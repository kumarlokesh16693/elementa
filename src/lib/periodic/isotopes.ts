/**
 * Curated isotope dataset — notable isotopes per element (stable + key radioisotopes).
 * Row format: Z | A (mass number, 'm' suffix = metastable) | natural abundance % ('?' = none/trace)
 *             | half-life ('stable' = observationally stable) | decay modes | note
 * Half-lives use y = year, d = day, h = hour, m = minute, s = second, ms; '~' prefix = approximate.
 * Sources: IUPAC abundances (2021), NuDat/ENSDF half-lives.
 */
export interface Isotope {
  A: string
  abundance: number | null
  halfLife: string
  decay: string
  note: string
}

const RAW = `
1|1|99.985|stable||protium
1|2|0.0156|stable||deuterium
1|3|?|12.32 y|β⁻|tritium
2|3|0.0002|stable||
2|4|99.9998|stable||alpha particle
3|6|7.59|stable||
3|7|92.41|stable||
4|9|100|stable||
4|10|?|1.39 Ma|β⁻|cosmogenic tracer
5|10|19.9|stable||neutron absorber
5|11|80.1|stable||
6|12|98.93|stable||defines the atomic mass scale
6|13|1.07|stable||NMR / paleoclimate proxy
6|14|?|5700 y|β⁻|radiocarbon dating
7|14|99.64|stable||
7|15|0.36|stable||
8|16|99.757|stable||
8|17|0.038|stable||
8|18|0.205|stable||paleoclimate proxy
9|19|100|stable||
10|20|90.48|stable||
10|21|0.27|stable||
10|22|9.25|stable||
11|23|100|stable||
11|24|?|15.0 h|β⁻|medical tracer
12|24|78.99|stable||
12|25|10.00|stable||NMR active
12|26|11.01|stable||Al-Mg chronometer
13|27|100|stable||
13|26|?|0.72 Ma|β⁺/EC|cosmogenic dating
14|28|92.23|stable||
14|29|4.67|stable||
14|30|3.10|stable||
14|32|?|~150 y|β⁻|cosmogenic
15|31|100|stable||
15|32|?|14.27 d|β⁻|DNA labeling
16|32|94.99|stable||
16|33|0.75|stable||
16|34|4.25|stable||
16|36|0.01|stable||
17|35|75.76|stable||
17|37|24.24|stable||
17|36|?|0.30 Ma|β⁻/EC|groundwater tracer
18|36|0.334|stable||
18|38|0.063|stable||
18|40|99.60|stable||K-40 decay product
19|39|93.258|stable||
19|40|0.0117|1.25 Ga|β⁻/EC|K-Ar / K-Ar dating
19|41|6.730|stable||
20|40|96.941|stable||doubly magic
20|42|0.647|stable||
20|43|0.135|stable||
20|44|2.086|stable||
20|48|0.187|6.4e18 y|2α|doubly magic
21|45|100|stable||
22|46|8.25|stable||
22|47|7.44|stable||
22|48|73.72|stable||
22|49|5.41|stable||
22|50|5.18|stable||
23|50|0.250|~2.6e17 y|β⁻/EC|meta-stable at best
23|51|99.750|stable||NMR active
24|50|4.345|stable||
24|52|83.789|stable||
24|53|9.501|stable||Mn-Cr chronometer
24|54|2.365|stable||
25|55|100|stable||
25|54|?|312 d|EC|calibration source
26|54|5.845|stable||
26|56|91.754|stable||peak of the binding-energy curve
26|57|2.119|stable||Mössbauer spectroscopy
26|58|0.282|stable||
27|59|100|stable||
27|60|?|5.27 y|β⁻|gamma irradiation source
28|58|68.077|stable||
28|60|26.223|stable||
28|61|1.140|stable||
28|62|3.635|stable||
28|64|0.926|stable||
29|63|69.15|stable||
29|65|30.85|stable||
30|64|48.63|stable||
30|66|27.90|stable||
30|67|4.10|stable||
30|68|18.75|stable||
30|70|0.62|stable||
31|69|60.11|stable||
31|71|39.89|stable||
31|67|?|3.26 d|EC|soft-tissue imaging
32|70|20.84|stable||
32|72|27.54|stable||
32|73|7.73|stable||
32|74|36.28|stable||
32|76|7.61|~1.8e21 y|2β⁻|neutrinoless-2β candidate
33|75|100|stable||
34|74|0.89|stable||
34|76|9.37|stable||
34|77|7.63|stable||
34|78|23.77|stable||
34|80|49.61|stable||
34|82|8.73|1.1e20 y|2β⁻|2νββ observed
35|79|50.69|stable||
35|81|49.31|stable||
36|78|0.355|stable||
36|80|2.286|stable||
36|82|11.593|stable||
36|83|11.500|stable||NMR standard
36|84|56.987|stable||
36|86|17.279|stable|2β⁻|predictably 2β-unstable
37|85|72.17|stable||
37|87|27.83|4.9e10 y|β⁻|Rb-Sr dating
38|84|0.56|stable||
38|86|9.86|stable||
38|87|7.00|stable||Sr-87/86 stratigraphy
38|88|82.58|stable||
38|90|?|28.8 y|β⁻|fission product
39|89|100|stable||
40|90|51.45|stable||
40|91|11.22|stable||
40|92|17.15|stable||
40|94|17.38|stable||
40|96|2.80|2.0e19 y|2β⁻|2νββ observed
41|93|100|stable||SRF cavity material
42|92|14.65|stable||
42|95|15.87|stable||
42|96|16.67|stable||
42|98|24.29|stable||
42|100|9.63|7.1e18 y|2β⁻|2νββ observed
43|98|?|4.2 Ma|β⁻|most stable Tc
43|99|?|0.211 Ma|β⁻|99mTc: 6.0 h IT, nuclear medicine
44|96|5.54|stable||
44|99|12.76|stable||
44|101|17.06|stable||
44|102|31.55|stable||
44|104|18.62|stable||
45|103|100|stable||
46|102|1.02|stable||
46|105|22.33|stable||
46|106|27.33|stable||
46|108|26.46|stable||
46|110|11.72|stable||
47|107|51.84|stable||
47|109|48.16|stable||
48|110|12.47|stable||
48|111|12.80|stable||Cd-111 NMR probe
48|112|24.11|stable||
48|113|12.23|8.0e15 y|β⁻|2β candidate
48|114|28.73|stable||
48|116|7.51|2.9e19 y|2β⁻|
49|113|4.29|stable||
49|115|95.71|4.4e14 y|β⁻|observationally stable
50|112|0.97|stable||
50|116|14.54|stable||
50|118|24.22|stable||Mössbauer isotope
50|119|8.59|stable||Mössbauer spectroscopy
50|120|32.58|stable||
50|124|5.64|~1e17 y|2β⁻|2νββ observed
51|121|57.21|stable||
51|123|42.79|stable||NMR active
52|125|7.07|stable||Mössbauer isotope
52|126|18.84|stable||
52|128|31.74|2.2e24 y|2β⁻|longest measured 2β half-life
52|130|34.08|7.9e20 y|2β⁻|2νββ observed
53|127|100|stable||
53|129|?|16.1 Ma|β⁻|I-Xe chronometer
53|131|?|8.0 d|β⁻|thyroid diagnostics/therapy
54|129|26.41|stable||
54|131|21.23|stable||
54|132|26.91|stable||
54|134|10.44|stable||
54|136|8.87|2.2e21 y|2β⁻|2νββ observed
55|133|100|stable||defines the SI second
55|137|?|30.1 y|β⁻|fission product fallout
56|135|6.59|stable||
56|136|7.85|stable|2β⁻|predictably 2β-unstable
56|137|11.23|stable||
56|138|71.70|stable||
57|138|0.090|1.05e11 y|EC|La-Ce / La-Ba chronometry
57|139|99.910|stable||
58|136|0.19|stable|2β⁻|predictably 2β-unstable
58|140|88.45|stable||
58|142|11.11|>5e16 y|α|theoretically α-unstable
59|141|100|stable||
60|142|27.15|stable||
60|144|23.80|2.3e15 y|α|
60|146|17.19|>1e14 y|α|theoretically α-unstable
60|150|5.64|~7e18 y|2β⁻|2νββ observed
61|145|?|17.7 y|EC|most stable Pm
61|147|?|2.62 y|β⁻|luminous paint (historic)
62|147|15.00|1.06e11 y|α|Sm-Nd dating
62|149|13.82|stable||highest n-capture of stable nuclides
62|152|26.75|>1e18 y|α|theoretically α-unstable
62|154|22.75|stable||
63|151|47.81|~5e18 y|α|α-decay observed
63|153|52.19|stable||Mössbauer isotope
64|155|14.80|stable||
64|157|15.65|stable||record thermal n cross-section
64|158|24.84|stable||
64|160|21.86|stable||
65|159|100|stable||
66|161|18.91|stable||
66|162|25.51|stable||
66|163|24.90|stable||
66|164|28.18|stable||
67|165|100|stable||
67|166|?|26.8 h|β⁻|radiotheranostics
68|166|33.50|stable||
68|167|22.87|stable||
68|168|26.98|stable||
68|170|14.91|stable||
69|169|100|stable||
69|170|?|128.6 d|β⁻|portable X-ray source
70|172|21.83|stable||
70|173|16.13|stable||
70|174|31.83|stable|α|theoretically α-unstable
70|176|12.76|stable|2β⁻|predictably 2β-unstable
71|175|97.41|stable||
71|176|2.59|3.7e10 y|β⁻|Lu-Hf dating
72|177|18.60|stable||
72|178|27.28|stable||
72|179|13.62|stable||
72|180|35.08|stable||
73|180m|0.012|stable||longest-lived metastable nuclear state
73|181|99.988|stable||
74|182|26.50|stable||
74|183|14.31|stable||
74|184|30.64|stable||
74|186|28.43|~1.8e18 y|α|theoretically α-unstable
75|185|37.40|stable||
75|187|62.60|4.1e10 y|β⁻|Re-Os chronometer
76|188|13.24|stable||
76|189|16.15|stable||
76|190|26.26|stable||
76|192|40.78|stable|α|theoretically α-unstable
77|191|37.30|stable||Mössbauer isotope
77|193|62.70|stable||
78|194|32.86|stable||
78|195|33.78|stable||NMR active
78|196|25.21|stable||
78|198|7.36|stable|2α|theoretically 2α-unstable
79|197|100|stable||Mössbauer isotope
79|198|?|2.70 d|β⁻|gold-198 tracer
80|199|16.94|stable||
80|200|23.14|stable||
80|202|29.74|stable||
80|204|6.82|stable||
81|203|29.52|stable||
81|205|70.48|stable||
82|204|1.4|stable||
82|206|24.1|stable||U-series end member
82|207|22.1|stable||Actinium-series end member
82|208|52.4|stable||doubly magic; Th-series end member
83|209|100|2.0e19 y|α|heaviest primordial nuclide
84|209|?|125 y|α|most stable Po
84|210|?|138 d|α|RTG heat source
85|210|?|8.1 h|EC/α|most stable At
85|211|?|7.21 h|α/EC|targeted alpha therapy
86|220|?|55.6 s|α|thoron
86|222|?|3.82 d|α|indoor radon hazard
87|223|?|22.0 m|β⁻|most stable Fr
88|226|?|1600 y|α|historic Curie standard
88|228|?|5.75 y|β⁻|Th-series daughter
89|227|?|21.8 y|β⁻/α|most stable Ac
89|228|?|6.15 h|β⁻|
90|230|?|75.4 ka|α|U-series member
90|232|100|1.41e10 y|α|fertile; breeds fissile U-233
91|231|?|32760 y|α|U-235 series member
92|234|0.0055|2.46e5 y|α|U-series member
92|235|0.7204|7.04e8 y|α|fissile; U-Pb geochronology
92|238|99.274|4.47e9 y|α|depleted uranium
93|237|?|2.14 Ma|α|most stable Np
94|238|?|87.7 y|α|RTG / deep-space power
94|239|?|24110 y|α|fissile
94|240|?|6561 y|α|spontaneous-fission concern
94|241|?|14.3 y|β⁻|breeds Am-241
94|242|?|0.375 Ma|α|most stable Pu
95|241|?|432.2 y|α|smoke-detector ionization
95|243|?|7370 y|α|most stable Am
96|244|?|18.1 y|α|lunar surface alpha instruments
96|247|?|15.6 Ma|α|most stable Cm
97|247|?|1380 y|α|most stable Bk
97|249|?|330 d|β⁻|Cf/Bk target material
98|249|?|351 y|α|most stable Cf
98|251|?|900 y|α|
98|252|?|2.645 y|α/SF|compact neutron source
99|252|?|471.7 d|α|most stable Es
99|253|?|20.47 d|α/SF|
100|257|?|100.5 d|α/SF|most stable Fm
101|258|?|51.5 d|α/EC|most stable Md
102|259|?|58 m|α/SF|most stable No
103|262|?|3.6 h|α/EC|most stable Lr
103|266|?|~1.1 h|α|longest-lived confirmed Lr
104|267|?|1.3 h|α/SF|most stable Rf
105|268|?|1.2 d|α/SF|most stable Db
106|269|?|~14 m|α/SF|most stable Sg
107|270|?|61 s|α|most stable Bh
108|269|?|16 s|α/SF|most stable Hs
109|278|?|4.5 s|α|most stable Mt
110|281|?|12.7 s|α/SF|most stable Ds
111|282|?|~2 m|α|most stable Rg
112|285|?|28 s|α|most stable Cn
112|284|?|97 ms|α|
113|286|?|~10 s|α|most stable Nh
114|289|?|1.9 s|α/SF|most stable Fl
115|290|?|0.65 s|α|most stable Mc
116|293|?|57 ms|α|most stable Lv
117|294|?|51 ms|α|most stable Ts
118|294|?|0.69 ms|α|heaviest atom synthesized
`

export const ISOTOPES: Isotope[] = RAW.trim()
  .split('\n')
  .map((line) => {
    const f = line.split('|')
    if (f.length < 5) throw new Error(`Bad isotope row: ${line.slice(0, 40)}`)
    return {
      A: f[1],
      abundance: f[2] === '?' ? null : parseFloat(f[2]),
      halfLife: f[3],
      decay: f[4] ?? '',
      note: f[5] ?? '',
    }
  })

const BY_Z = new Map<number, Isotope[]>()
for (const line of RAW.trim().split('\n')) {
  const f = line.split('|')
  const z = parseInt(f[0], 10)
  if (!BY_Z.has(z)) BY_Z.set(z, [])
  BY_Z.get(z)!.push({
    A: f[1],
    abundance: f[2] === '?' ? null : parseFloat(f[2]),
    halfLife: f[3],
    decay: f[4] ?? '',
    note: f[5] ?? '',
  })
}

export function isotopesOf(z: number): Isotope[] {
  return BY_Z.get(z) ?? []
}

export function isotopeSummary(z: number): { stable: number; radioactive: number } {
  const list = isotopesOf(z)
  return {
    stable: list.filter((i) => i.halfLife === 'stable' && !/theoretically|predictably/.test(i.note)).length,
    radioactive: list.filter((i) => i.halfLife !== 'stable').length,
  }
}
