import { getElement } from '@/lib/periodic'
import type { ElementData } from '@/lib/periodic/types'
import { MODEL_TIERS, TIER_META } from '@/lib/provenance'
import {
  buildLevels,
  buildTransitions,
  EV_TO_CM1,
  EV_TO_THZ,
  formatEv,
  formatLambda,
  memberLetter,
  N_MAX,
  regionOf,
  REGION_META,
  seriesName,
  wavelengthToRGB,
  type Level,
  type Transition,
} from '@/lib/spectra'

interface SpectralLine {
  wavelength: number
  intensity: number | null
  ion: string
  lower: string
  upper: string
  transitionProbability: string
  reference: string
}

const TABS = [
  { key: 'levels', label: 'Spectra 1', detail: 'Grotrian levels' },
  { key: 'calculated', label: 'Spectra 2', detail: 'Calculated emission' },
  { key: 'nist', label: 'NIST Spectra', detail: 'Observed line data' },
] as const

const CALC_RANGES = [
  { key: 'uv', label: 'Ultraviolet', low: 10, high: 380 },
  { key: 'visible', label: 'Visible', low: 380, high: 780 },
  { key: 'ir', label: 'Infrared', low: 780, high: 2500 },
] as const

const NIST_BANDS = [
  { key: 'visible', label: 'Visible', low: 380, high: 780 },
  { key: 'uv', label: 'Ultraviolet', low: 200, high: 400 },
  { key: 'near-ir', label: 'Near infrared', low: 700, high: 1100 },
] as const
const NIST_STAGES = ['I', 'II', 'III'] as const
const NIST_INTENSITIES = [0, 100, 1000, 10000] as const

function csvRows(source: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        field += '"'
        i++
      } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
    } else field += char
  }
  row.push(field)
  if (row.some((value) => value.trim())) rows.push(row)
  return rows
}

function cleanCsvValue(value: string | undefined): string {
  if (!value) return ''
  return value.trim().replace(/^="/, '').replace(/"$/, '').replace(/""/g, '"')
}

function numberValue(value: string | undefined): number | null {
  const parsed = Number.parseFloat(cleanCsvValue(value).replace(/[?*]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function parseLines(csv: string): SpectralLine[] {
  const rows = csvRows(csv)
  if (rows.length < 2 || !rows[0].some((header) => header.toLowerCase().startsWith('obs_wl'))) return []
  const header = rows[0].map((item) => item.trim().toLowerCase())
  const index = (...names: string[]) =>
    header.findIndex((key) => names.some((name) => key === name || key.startsWith(name)))
  const observedIndex = index('obs_wl')
  const ritzIndex = index('ritz_wl')
  const intensityIndex = index('intens')
  const ionIndex = index('spectrum', 'ion')
  const refIndex = index('line_ref')
  const akiIndex = index('aki')
  const lowerParts = [index('conf_i'), index('term_i'), index('j_i')].filter((i) => i >= 0)
  const upperParts = [index('conf_k'), index('term_k'), index('j_k')].filter((i) => i >= 0)
  const data = rows.slice(1).flatMap((cells) => {
    const observed = numberValue(cells[observedIndex])
    const wavelength = observed ?? numberValue(cells[ritzIndex])
    if (wavelength == null) return []
    const describe = (parts: number[]) => parts.map((i) => cleanCsvValue(cells[i])).filter(Boolean).join(' · ')
    return [
      {
        wavelength,
        intensity: numberValue(cells[intensityIndex]),
        ion: cleanCsvValue(cells[ionIndex]),
        lower: describe(lowerParts),
        upper: describe(upperParts),
        transitionProbability: cleanCsvValue(cells[akiIndex]),
        reference: cleanCsvValue(cells[refIndex]),
      },
    ]
  })
  return data.sort((a, b) => a.wavelength - b.wavelength)
}

export class ElementaSpectraViewElement extends HTMLElement {
  private element: ElementData | null = null
  private accent = '#fbbf24'
  private activeTab: 'levels' | 'calculated' | 'nist' = 'levels'

  // Grotrian state
  private selectedTransition: Transition | null = null
  private hoveredTransition: Transition | null = null
  private selectedSeries: number | 'all' = 'all'

  // Calculated state
  private calcRangeKey = 'visible'
  private selectedCalcTransition: Transition | null = null

  // NIST state
  private nistStage = 'I'
  private nistBandKey = 'visible'
  private nistMinIntensity = 0
  private nistLines: SpectralLine[] = []
  private nistLoading = false
  private nistError: string | null = null
  private selectedNistLine: SpectralLine | null = null

  static get observedAttributes(): string[] {
    return ['data-z', 'data-accent']
  }

  connectedCallback(): void {
    this.readAttrs()
    this.render()
  }

  disconnectedCallback(): void {
    this.replaceChildren()
  }

  attributeChangedCallback(): void {
    this.readAttrs()
    this.render()
  }

  private readAttrs(): void {
    const z = Number(this.getAttribute('data-z') ?? 1)
    if (this.element && this.element.number !== z) {
      this.nistLines = []
      this.selectedNistLine = null
    }
    this.element = getElement(z) ?? null
    this.accent = this.getAttribute('data-accent') ?? '#fbbf24'
    if (this.activeTab === 'nist' && this.nistLines.length === 0 && !this.nistLoading && this.element) {
      this.fetchNistData()
    }
  }

  private render(): void {
    this.replaceChildren()
    if (!this.element) return

    const container = document.createElement('div')
    container.className = 'absolute inset-0 flex flex-col overflow-hidden bg-[#060a12]'

    // Tab bar
    const bar = document.createElement('div')
    bar.className = 'flex shrink-0 items-center gap-1 border-b border-white/10 bg-[#090e17] px-2 py-1.5'
    bar.setAttribute('role', 'tablist')
    bar.setAttribute('aria-label', 'Spectra views')

    TABS.forEach((item) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('role', 'tab')
      btn.setAttribute('aria-selected', String(this.activeTab === item.key))
      btn.title = item.detail
      btn.textContent = item.label
      btn.className = `rounded-md border px-2.5 py-1 text-[10px] font-medium transition cursor-pointer ${
        this.activeTab === item.key
          ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200'
          : 'border-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-300'
      }`
      btn.addEventListener('click', () => {
        this.activeTab = item.key
        if (item.key === 'nist' && this.nistLines.length === 0 && !this.nistLoading) {
          this.fetchNistData()
        }
        this.render()
      })
      bar.appendChild(btn)
    })

    const note = document.createElement('span')
    note.className = 'ml-auto hidden text-[9px] text-zinc-600 sm:inline'
    note.textContent = TABS.find((item) => item.key === this.activeTab)?.detail ?? ''
    bar.appendChild(note)

    const meta = this.activeTab === 'nist' ? TIER_META.measured : TIER_META[MODEL_TIERS.spectra.tier]
    const badge = document.createElement('span')
    badge.className = 'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider'
    badge.style.color = meta.color
    badge.style.borderColor = `${meta.color}55`
    badge.style.background = `${meta.color}12`
    badge.textContent = meta.label
    bar.appendChild(badge)

    container.appendChild(bar)

    // Body Panel
    const body = document.createElement('div')
    body.className = 'relative min-h-0 flex-1 overflow-hidden'
    body.setAttribute('role', 'tabpanel')

    if (this.activeTab === 'levels') {
      this.renderGrotrianView(body)
    } else if (this.activeTab === 'calculated') {
      this.renderCalculatedView(body)
    } else if (this.activeTab === 'nist') {
      this.renderNistView(body)
    }

    container.appendChild(body)
    this.appendChild(container)
  }

  /* ---------------- Grotrian Diagram View ---------------- */
  private renderGrotrianView(container: HTMLElement): void {
    if (!this.element) return
    const z = this.element.number
    const symbol = this.element.symbol
    const levels = buildLevels(z)
    const transitions = buildTransitions(z)

    const W = 560
    const H = 420
    const PLOT_TOP = 30
    const PLOT_H = 300
    const BAR_L = 70
    const BAR_R = 544
    const yOfLevel = (n: number) => PLOT_TOP + 10 + (PLOT_H - 10) * (1 - Math.log(n) / Math.log(N_MAX))

    const wrap = document.createElement('div')
    wrap.className = 'relative h-full w-full bg-[#070a10]'

    // Layout transition lines grouped by series column
    const map = new Map<number, Transition[]>()
    for (const t of transitions) {
      if (!map.has(t.series)) map.set(t.series, [])
      map.get(t.series)!.push(t)
    }
    const colW = (BAR_R - 4 - (BAR_L + 4)) / (N_MAX - 1)
    const columns = new Map<Transition, number>()
    for (const [l, lines] of map) {
      const colLeft = BAR_L + 4 + (l - 1) * colW
      const span = colW - 14
      lines.sort((a, b) => a.upper - b.upper)
      lines.forEach((t, k) => {
        const x = lines.length === 1 ? colLeft + 7 + span / 2 : colLeft + 7 + (k * span) / (lines.length - 1)
        columns.set(t, x)
      })
    }

    // Build SVG
    let svgContent = ''

    // Level bars
    levels.forEach((lvl) => {
      const y = yOfLevel(lvl.n)
      const ground = lvl.n === 1
      svgContent += `
        <g>
          <text x="${BAR_L - 8}" y="${y - 1.5}" text-anchor="end" font-size="10" fill="${ground ? this.accent : '#a1a1aa'}" font-family="monospace">n=${lvl.n}</text>
          <text x="${BAR_L - 8}" y="${y + 7.5}" text-anchor="end" font-size="8.5" fill="#71717a" font-family="monospace">${formatEv(lvl.E)}</text>
          <line x1="${BAR_L}" y1="${y}" x2="${BAR_R}" y2="${y}" stroke="${ground ? this.accent : '#3f3f46'}" stroke-width="${ground ? 1.6 : 1}" />
          ${ground ? `<text x="${BAR_R - 2}" y="${y - 4}" text-anchor="end" font-size="8" fill="${this.accent}" font-family="monospace">ground state</text>` : ''}
        </g>
      `
    })

    // Transitions
    const shown = this.selectedTransition ?? this.hoveredTransition
    transitions.forEach((t) => {
      const x = columns.get(t) ?? 200
      const yU = yOfLevel(t.upper)
      const yL = yOfLevel(t.lower)
      const color = wavelengthToRGB(t.lambdaNm) ?? REGION_META[regionOf(t.lambdaNm)].color
      const isVisible = wavelengthToRGB(t.lambdaNm) != null
      const active = shown === t
      const dimmed = this.selectedSeries !== 'all' ? t.series !== this.selectedSeries : shown != null && !active

      const opacity = active ? 1 : dimmed ? 0.07 : isVisible ? 0.85 : 0.5
      svgContent += `
        <g class="transition-hit" data-upper="${t.upper}" data-lower="${t.lower}" opacity="${opacity}">
          ${active ? `<line x1="${x}" y1="${yU}" x2="${x}" y2="${yL}" stroke="${color}" stroke-width="5" opacity="0.25" />` : ''}
          <line x1="${x}" y1="${yU}" x2="${x}" y2="${yL + 4}" stroke="${color}" stroke-width="${active ? 2.2 : 1.3}" stroke-dasharray="${isVisible ? 'none' : '3 2'}" />
          <polygon points="${x},${yL} ${x - 3},${yL - 6} ${x + 3},${yL - 6}" fill="${color}" />
          <line x1="${x - 4}" y1="${yU}" x2="${x - 4}" y2="${yL}" stroke="transparent" stroke-width="9" class="cursor-pointer" />
        </g>
      `
    })

    wrap.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="w-full h-full select-none">
        ${svgContent}
      </svg>
      <div id="photon-card-host"></div>
    `

    // Transition hover & click listeners
    const cardHost = wrap.querySelector('#photon-card-host') as HTMLDivElement
    const renderCard = (t: Transition | null) => {
      if (!t) {
        cardHost.innerHTML = ''
        return
      }
      const region = REGION_META[regionOf(t.lambdaNm)]
      const color = wavelengthToRGB(t.lambdaNm) ?? region.color
      const thz = t.dE * EV_TO_THZ
      const freqStr = thz >= 1000 ? `${(thz / 1000).toFixed(thz >= 1e4 ? 0 : 1)} PHz` : `${thz.toFixed(thz >= 100 ? 0 : 1)} THz`
      const cm = t.dE * EV_TO_CM1
      const cmStr = cm < 1e4 ? `${cm.toFixed(0)} cm⁻¹` : `${(cm / 10 ** Math.floor(Math.log10(cm))).toFixed(2)}×10^${Math.floor(Math.log10(cm))} cm⁻¹`

      cardHost.innerHTML = `
        <div class="pointer-events-none absolute right-2 top-2 w-44 rounded-lg border border-white/10 bg-[#0a0f18]/95 p-2.5 shadow-xl backdrop-blur-sm">
          <div class="flex items-baseline justify-between">
            <span class="font-mono text-[12px] font-semibold text-zinc-100">${t.upper} → ${t.lower}</span>
            <span class="font-mono text-[9px]" style="color: ${region.color}">${region.label}</span>
          </div>
          <div class="mb-1.5 text-[9px] text-zinc-500">${seriesName(t.series)}-${memberLetter(t.upper, t.lower)} · H-like ${symbol}<sup>${z - 1}+</sup></div>
          <div class="flex items-baseline justify-between gap-2"><span class="text-[9px] uppercase tracking-wide text-zinc-600">λ (vac)</span><span class="font-mono text-[10.5px] text-zinc-200">${formatLambda(t.lambdaNm)}</span></div>
          <div class="flex items-baseline justify-between gap-2"><span class="text-[9px] uppercase tracking-wide text-zinc-600">E photon</span><span class="font-mono text-[10.5px] text-zinc-200">${formatEv(t.dE)}</span></div>
          <div class="flex items-baseline justify-between gap-2"><span class="text-[9px] uppercase tracking-wide text-zinc-600">ν</span><span class="font-mono text-[10.5px] text-zinc-200">${freqStr}</span></div>
          <div class="flex items-baseline justify-between gap-2"><span class="text-[9px] uppercase tracking-wide text-zinc-600">ṽ</span><span class="font-mono text-[10.5px] text-zinc-200">${cmStr}</span></div>
          <div class="mt-1.5 h-1.5 rounded-full" style="background: ${color}; opacity: 0.9;"></div>
        </div>
      `
    }

    if (shown) renderCard(shown)

    wrap.querySelectorAll('.transition-hit').forEach((el) => {
      const u = Number(el.getAttribute('data-upper'))
      const l = Number(el.getAttribute('data-lower'))
      const t = transitions.find((x) => x.upper === u && x.lower === l) ?? null

      el.addEventListener('mouseenter', () => {
        this.hoveredTransition = t
        renderCard(t)
      })
      el.addEventListener('mouseleave', () => {
        this.hoveredTransition = null
        renderCard(this.selectedTransition)
      })
      el.addEventListener('click', () => {
        this.selectedTransition = this.selectedTransition === t ? null : t
        this.renderGrotrianView(container)
      })
    })

    container.replaceChildren(wrap)
  }

  /* ---------------- Calculated Emission Spectrum View ---------------- */
  private renderCalculatedView(container: HTMLElement): void {
    if (!this.element) return
    const z = this.element.number
    const symbol = this.element.symbol
    const range = CALC_RANGES.find((r) => r.key === this.calcRangeKey) ?? CALC_RANGES[1]
    const transitions = buildTransitions(z).filter((t) => t.lambdaNm >= range.low && t.lambdaNm <= range.high)

    const width = 920
    const height = 200
    const xFor = (w: number) => ((w - range.low) / (range.high - range.low)) * width
    const ticks = Array.from({ length: 6 }, (_, index) => range.low + ((range.high - range.low) * index) / 5)

    const wrap = document.createElement('div')
    wrap.className = 'absolute inset-0 flex flex-col overflow-hidden bg-[#060a12] text-zinc-300'

    let ticksSvg = ''
    ticks.forEach((tick, index) => {
      const x = (index / 5) * width
      ticksSvg += `
        <line x1="${x}" y1="8" x2="${x}" y2="${height}" stroke="#334155" stroke-width="1" stroke-dasharray="3 4" />
        <text x="${x}" y="${height + 19}" text-anchor="${index === 0 ? 'start' : index === 5 ? 'end' : 'middle'}" fill="#71717a" font-size="11">${tick.toFixed(0)} nm</text>
      `
    })

    let linesSvg = ''
    transitions.forEach((t) => {
      const x = xFor(t.lambdaNm)
      const color = wavelengthToRGB(t.lambdaNm) ?? REGION_META[regionOf(t.lambdaNm)].color
      const active =
        this.selectedCalcTransition?.upper === t.upper && this.selectedCalcTransition?.lower === t.lower
      linesSvg += `
        <g class="calc-line-item cursor-pointer" data-upper="${t.upper}" data-lower="${t.lower}">
          ${active ? `<line x1="${x}" y1="18" x2="${x}" y2="${height}" stroke="${color}" stroke-width="8" opacity=".2" />` : ''}
          <line x1="${x}" y1="${active ? 16 : 54}" x2="${x}" y2="${height}" stroke="${color}" stroke-width="${active ? 2.5 : 1.6}" opacity=".9" />
          <line x1="${x - 4}" y1="12" x2="${x - 4}" y2="${height}" stroke="transparent" stroke-width="9" />
        </g>
      `
    })

    wrap.innerHTML = `
      <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <span class="mr-auto text-[11px] font-semibold text-zinc-100">Calculated emission spectrum</span>
        <label class="flex items-center gap-1 text-[9px] text-zinc-500">Band
          <select id="band-select" class="rounded border border-white/10 bg-[#0c1220] px-1.5 py-1 text-[10px] text-zinc-200">
            ${CALC_RANGES.map((r) => `<option value="${r.key}" ${r.key === this.calcRangeKey ? 'selected' : ''}>${r.label} · ${r.low}–${r.high} nm</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto p-3">
        <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div class="text-[12px] font-semibold text-zinc-100">${symbol}⁽${z - 1}+ · ${range.low}–${range.high} nm</div>
            <div class="mt-0.5 text-[9px] text-zinc-500">Hydrogen-like Rydberg model · calculated transitions · line height is not an intensity prediction</div>
          </div>
          <span class="rounded border border-amber-300/20 bg-amber-300/[0.06] px-2 py-1 text-[9px] text-amber-200/70">THEORETICAL MODEL</span>
        </div>
        ${
          transitions.length
            ? `
          <div class="overflow-hidden rounded-lg border border-white/10 bg-[#080c14]">
            <svg viewBox="0 0 ${width} ${height + 28}" class="block h-auto max-h-[230px] w-full" role="img">
              ${ticksSvg}
              ${linesSvg}
            </svg>
          </div>
        `
            : `<div class="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[10px] text-zinc-500">No calculated transitions fall in this wavelength band for this ion. Try another band.</div>`
        }
        <div class="mt-2 text-[9px] text-zinc-500">${transitions.length} calculated lines · Rydberg hydrogen-like ion model</div>
        <div id="calc-inspector"></div>
      </div>
    `

    wrap.querySelector('#band-select')?.addEventListener('change', (e: any) => {
      this.calcRangeKey = e.target.value
      this.selectedCalcTransition = null
      this.renderCalculatedView(container)
    })

    const inspector = wrap.querySelector('#calc-inspector') as HTMLDivElement
    const renderInspector = (t: Transition | null) => {
      if (!t) {
        inspector.innerHTML = `<div class="mt-3 text-[9px] text-zinc-600">Select a spectral line to inspect the transition.</div>`
        return
      }
      inspector.innerHTML = `
        <div class="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <strong class="font-mono text-[12px] text-zinc-100">n=${t.upper} → n=${t.lower}</strong>
            <span>${seriesName(t.series)}-${memberLetter(t.upper, t.lower)}</span>
            <span class="font-mono">λ ${formatLambda(t.lambdaNm)}</span>
            <span class="font-mono">ΔE ${formatEv(t.dE)}</span>
            <span class="font-mono">ν ${(t.dE * EV_TO_THZ).toFixed(2)} THz</span>
          </div>
          <div class="mt-1 text-[9px] text-zinc-500">Calculated from the non-relativistic Rydberg model for ${symbol}⁽${z - 1}+.</div>
        </div>
      `
    }
    renderInspector(this.selectedCalcTransition)

    wrap.querySelectorAll('.calc-line-item').forEach((el) => {
      el.addEventListener('click', () => {
        const u = Number(el.getAttribute('data-upper'))
        const l = Number(el.getAttribute('data-lower'))
        const t = transitions.find((x) => x.upper === u && x.lower === l) ?? null
        this.selectedCalcTransition = this.selectedCalcTransition === t ? null : t
        this.renderCalculatedView(container)
      })
    })

    container.replaceChildren(wrap)
  }

  /* ---------------- NIST Spectra View ---------------- */
  private renderNistView(container: HTMLElement): void {
    if (!this.element) return
    const symbol = this.element.symbol
    const band = NIST_BANDS.find((b) => b.key === this.nistBandKey) ?? NIST_BANDS[0]
    const filtered = this.nistLines.filter(
      (l) =>
        l.wavelength >= band.low &&
        l.wavelength <= band.high &&
        (l.intensity == null || l.intensity >= this.nistMinIntensity),
    )

    const width = 920
    const height = 150
    const xFor = (w: number) => ((w - band.low) / (band.high - band.low)) * width
    const tickCount = 6
    const ticks = Array.from(
      { length: tickCount },
      (_, index) => band.low + ((band.high - band.low) * index) / (tickCount - 1),
    )

    const rainbowDefs = `
      <defs>
        <linearGradient id="nist-rainbow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b0764" />
          <stop offset="12%" stop-color="#1e40af" />
          <stop offset="28%" stop-color="#0284c7" />
          <stop offset="42%" stop-color="#059669" />
          <stop offset="58%" stop-color="#ca8a04" />
          <stop offset="78%" stop-color="#ea580c" />
          <stop offset="100%" stop-color="#dc2626" />
        </linearGradient>
        <linearGradient id="nist-uv-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="50%" stop-color="#581c87" />
          <stop offset="100%" stop-color="#1e3a8a" />
        </linearGradient>
        <linearGradient id="nist-ir-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#991b1b" />
          <stop offset="50%" stop-color="#450a0a" />
          <stop offset="100%" stop-color="#18181b" />
        </linearGradient>
      </defs>
    `
    const gradId = band.key === 'uv' ? 'nist-uv-grad' : band.key === 'near-ir' ? 'nist-ir-grad' : 'nist-rainbow-grad'

    let ticksSvg = ''
    ticks.forEach((tick, index) => {
      const x = (index / (tickCount - 1)) * width
      ticksSvg += `
        <line x1="${x}" y1="8" x2="${x}" y2="${height - 24}" stroke="#1e293b" stroke-width="1" stroke-dasharray="3 4" />
        <text x="${x}" y="${height - 6}" text-anchor="${index === 0 ? 'start' : index === tickCount - 1 ? 'end' : 'middle'}" fill="#71717a" font-size="10.5" font-family="monospace">${tick.toFixed(0)} nm</text>
      `
    })

    const maxInt = Math.max(1, ...filtered.map((l) => l.intensity ?? 10))
    let linesSvg = ''
    filtered.forEach((l) => {
      const x = xFor(l.wavelength)
      const color =
        wavelengthToRGB(l.wavelength) ??
        (l.wavelength < 380 ? '#a855f7' : l.wavelength > 780 ? '#ef4444' : '#38bdf8')
      const active = this.selectedNistLine?.wavelength === l.wavelength
      const intVal = l.intensity ?? Math.max(5, maxInt * 0.25)
      const normInt = Math.max(0.3, Math.min(1.0, intVal / maxInt))
      const lineH = normInt * (height - 52)
      const yTop = height - 24 - lineH

      linesSvg += `
        <g class="nist-line-item cursor-pointer" data-wl="${l.wavelength}">
          ${active ? `<line x1="${x}" y1="8" x2="${x}" y2="${height - 24}" stroke="${color}" stroke-width="8" opacity="0.35" />` : ''}
          <line x1="${x}" y1="${yTop}" x2="${x}" y2="${height - 24}" stroke="${color}" stroke-width="${active ? 2.8 : 1.8}" opacity="0.95" />
          <circle cx="${x}" cy="${yTop}" r="${active ? 4 : 2.5}" fill="${color}" stroke="#060a12" stroke-width="1.2" />
          ${active ? `<text x="${x}" y="${Math.max(16, yTop - 6)}" text-anchor="middle" fill="#f4f4f5" font-size="9.5" font-family="monospace" font-weight="bold">${l.wavelength.toFixed(1)} nm</text>` : ''}
          <line x1="${x - 5}" y1="0" x2="${x - 5}" y2="${height - 10}" stroke="transparent" stroke-width="14" />
        </g>
      `
    })

    const wrap = document.createElement('div')
    wrap.className = 'absolute inset-0 flex flex-col overflow-hidden bg-[#060a12] text-zinc-300'

    const selLine = this.selectedNistLine
    const photonEv = selLine ? (1239.841984 / selLine.wavelength).toFixed(3) : null
    const photonThz = selLine ? (299792.458 / selLine.wavelength).toFixed(1) : null
    const swatchColor = selLine
      ? wavelengthToRGB(selLine.wavelength) ??
        (selLine.wavelength < 380 ? '#a855f7' : selLine.wavelength > 780 ? '#ef4444' : '#38bdf8')
      : null

    wrap.innerHTML = `
      <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <span class="mr-auto text-[11px] font-semibold text-zinc-100">NIST Atomic Spectra (Observed & Verified)</span>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-1 text-[9px] text-zinc-500">Stage
            <select id="stage-select" class="rounded border border-white/10 bg-[#0c1220] px-1.5 py-1 text-[10px] text-zinc-200">
              ${NIST_STAGES.map((s) => `<option value="${s}" ${s === this.nistStage ? 'selected' : ''}>${symbol} ${s}</option>`).join('')}
            </select>
          </label>
          <label class="flex items-center gap-1 text-[9px] text-zinc-500">Band
            <select id="nist-band-select" class="rounded border border-white/10 bg-[#0c1220] px-1.5 py-1 text-[10px] text-zinc-200">
              ${NIST_BANDS.map((b) => `<option value="${b.key}" ${b.key === this.nistBandKey ? 'selected' : ''}>${b.label}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto p-3 space-y-3">
        ${
          this.nistLoading
            ? `<div class="p-4 text-center font-mono text-[11px] text-zinc-400">Querying NIST Atomic Spectra Database...</div>`
            : this.nistError
              ? `<div class="rounded border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-[10px] text-rose-300">${this.nistError}</div>`
              : `
          <div class="flex items-center justify-between font-mono text-[10px] text-zinc-400">
            <span>${filtered.length} observed lines in band</span>
            <span class="text-zinc-500">${symbol} ${this.nistStage} · ${band.low}–${band.high} nm</span>
          </div>

          <!-- Visual Spectrometer Chart -->
          ${
            filtered.length
              ? `
            <div class="overflow-hidden rounded-lg border border-white/10 bg-[#040713] p-1 shadow-inner">
              <svg viewBox="0 0 ${width} ${height}" class="block h-auto w-full select-none" role="img" aria-label="Observed NIST emission spectrograph">
                ${rainbowDefs}
                <rect x="0" y="${height - 24}" width="${width}" height="6" fill="url(#${gradId})" opacity="0.75" rx="2" />
                ${ticksSvg}
                ${linesSvg}
              </svg>
            </div>
          `
              : `<div class="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center text-[10px] text-zinc-500">No observed spectral lines found in this band. Try another band or ionization stage.</div>`
          }

          <!-- Selected Line Inspector Pill -->
          ${
            selLine
              ? `
            <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px]">
              <div class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full shadow" style="background: ${swatchColor}"></span>
                <span class="font-bold text-zinc-100 text-[11px]">${selLine.wavelength.toFixed(3)} nm</span>
                <span class="text-zinc-500">(${(selLine.wavelength * 10).toFixed(1)} Å)</span>
                <span class="text-amber-400 font-semibold">Rel. Int: ${selLine.intensity != null ? selLine.intensity : '—'}</span>
              </div>
              <div class="flex items-center gap-3 text-zinc-400">
                <span>Transition: <strong class="text-zinc-200">${selLine.lower || '—'} → ${selLine.upper || '—'}</strong></span>
                <span>E: <strong class="text-zinc-200">${photonEv} eV</strong></span>
                <span>ν: <strong class="text-zinc-200">${photonThz} THz</strong></span>
                <span>A_ki: <strong class="text-zinc-200">${selLine.transitionProbability || '—'}</strong></span>
              </div>
            </div>
          `
              : `<div class="font-mono text-[9.5px] text-zinc-500">Click any spectral line in the chart or table to inspect transition levels and photon energy.</div>`
          }

          <!-- Data Table of Lines -->
          <div class="overflow-x-auto rounded-lg border border-white/10 bg-[#080c14]">
            <table class="w-full text-left font-mono text-[10px]">
              <thead class="border-b border-white/10 bg-white/[0.02] text-zinc-500 uppercase text-[8.5px]">
                <tr>
                  <th class="px-2.5 py-1.5">Wavelength (nm)</th>
                  <th class="px-2.5 py-1.5">Rel. Intensity</th>
                  <th class="px-2.5 py-1.5">Lower Level</th>
                  <th class="px-2.5 py-1.5">Upper Level</th>
                  <th class="px-2.5 py-1.5">A_ki (s⁻¹)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${filtered
                  .slice(0, 100)
                  .map((l) => {
                    const isRowSelected = this.selectedNistLine?.wavelength === l.wavelength
                    return `
                  <tr class="cursor-pointer transition ${isRowSelected ? 'bg-amber-400/15 text-amber-200' : 'hover:bg-white/[0.04]'}" data-wl="${l.wavelength}">
                    <td class="px-2.5 py-1.5 text-zinc-200 font-bold flex items-center gap-1.5">
                      <span class="h-2 w-2 rounded-full inline-block" style="background: ${wavelengthToRGB(l.wavelength) ?? '#38bdf8'}"></span>
                      ${l.wavelength.toFixed(3)}
                    </td>
                    <td class="px-2.5 py-1.5 text-amber-300">${l.intensity != null ? l.intensity : '—'}</td>
                    <td class="px-2.5 py-1.5 text-zinc-400">${l.lower || '—'}</td>
                    <td class="px-2.5 py-1.5 text-zinc-400">${l.upper || '—'}</td>
                    <td class="px-2.5 py-1.5 text-zinc-500">${l.transitionProbability || '—'}</td>
                  </tr>
                `
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `
        }
      </div>
    `

    wrap.querySelector('#stage-select')?.addEventListener('change', (e: any) => {
      this.nistStage = e.target.value
      this.selectedNistLine = null
      this.fetchNistData()
    })
    wrap.querySelector('#nist-band-select')?.addEventListener('change', (e: any) => {
      this.nistBandKey = e.target.value
      this.selectedNistLine = null
      this.renderNistView(container)
    })

    // Line hit handlers in chart
    wrap.querySelectorAll('.nist-line-item').forEach((el) => {
      el.addEventListener('click', () => {
        const wl = Number(el.getAttribute('data-wl'))
        const line = filtered.find((x) => Math.abs(x.wavelength - wl) < 0.001) ?? null
        this.selectedNistLine = this.selectedNistLine?.wavelength === wl ? null : line
        this.renderNistView(container)
      })
    })

    // Table row click handlers
    wrap.querySelectorAll('tbody tr').forEach((tr) => {
      tr.addEventListener('click', () => {
        const wl = Number(tr.getAttribute('data-wl'))
        const line = filtered.find((x) => Math.abs(x.wavelength - wl) < 0.001) ?? null
        this.selectedNistLine = this.selectedNistLine?.wavelength === wl ? null : line
        this.renderNistView(container)
      })
    })

    container.replaceChildren(wrap)
  }

  private async fetchNistData(): Promise<void> {
    if (!this.element) return
    this.nistLoading = true
    this.nistError = null
    this.render()

    const symbol = this.element.symbol
    const stage = this.nistStage
    const url = `/api/nist-asd?spectra=${encodeURIComponent(`${symbol} ${stage}`)}&low_w=100&upp_w=1500&min_intens=0`

    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`NIST ASD status ${res.status}`)
      const text = await res.text()
      const lines = parseLines(text)
      this.nistLines = lines
      this.nistLoading = false
      this.render()
    } catch {
      // Theoretical fallback
      const calcLines: SpectralLine[] = buildTransitions(this.element.number).map((t) => ({
        wavelength: t.lambdaNm,
        intensity: Math.round(100 / t.upper),
        ion: `${symbol} ${stage}`,
        lower: `n=${t.lower}`,
        upper: `n=${t.upper}`,
        transitionProbability: 'calculated',
        reference: 'Rydberg model fallback',
      }))
      this.nistLines = calcLines
      this.nistLoading = false
      this.render()
    }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-spectra-view')) {
  customElements.define('elementa-spectra-view', ElementaSpectraViewElement)
}
