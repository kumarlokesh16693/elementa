import { h, reactive, type VNode } from 'nexus-framework'
import type { CategoryKey, ColorMode, ElementData } from '@/lib/periodic/types'
import { CATEGORIES, COLOR_MODES, BLOCK_COLORS, PHASE_COLORS } from '@/lib/periodic/types'
import {
  ELEMENTS, getElement, heatLegend, heatGradientCss, originPct, searchElements,
  tileColor, isHeatMode, ORIGINS,
} from '@/lib/periodic'
import type { OriginKey } from '@/lib/periodic'
import { PALETTES, PALETTE_MAP, type PaletteId } from '@/lib/palette'
import { parseStructuredQuery } from '@/lib/query'
import PeriodicTable from '@/components/periodic/PeriodicTable'
import DetailPanel from '@/components/periodic/DetailPanel'
import IonizationChart from '@/components/periodic/IonizationChart'
import CompareElements from '@/components/periodic/CompareElements'
import ResearchPanel from '@/components/periodic/ResearchPanel'
import TemperatureBar from '@/components/periodic/TemperatureBar'
import type { SimulatedPhase, TempUnit } from '@/lib/periodic/temperature'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

type CompareProp = 'mass' | 'electronegativity' | 'ionizationEnergy' | 'electronAffinity' | 'atomicRadius' | 'meltingPoint' | 'boilingPoint' | 'density' | 'valence'
type SavedView = {
  name: string
  at: string
  e: number | null
  mode: ColorMode
  cats: CategoryKey[]
  origin: OriginKey | null
  q: string
  chart: boolean
  cmp: number[]
  prop: CompareProp
  palette: PaletteId
  temp?: number
}

const COMPARE_PROPS: CompareProp[] = ['mass', 'electronegativity', 'ionizationEnergy', 'electronAffinity', 'atomicRadius', 'meltingPoint', 'boilingPoint', 'density', 'valence']
const CATEGORY_KEYS = CATEGORIES.map((category) => category.key)
const ORIGIN_KEYS = ORIGINS.map((origin) => origin.key)
const SAVED_KEY = 'elementa:saved-views'

const params = new URLSearchParams(window.location.search)

function intParam(name: string, min: number, max: number): number | null {
  const value = Number.parseInt(params.get(name) ?? '', 10)
  return Number.isFinite(value) && value >= min && value <= max ? value : null
}

function floatParam(name: string, min: number, max: number): number | null {
  const value = Number.parseFloat(params.get(name) ?? '')
  return Number.isFinite(value) && value >= min && value <= max ? value : null
}

const eParam = intParam('e', 1, 118)
const validDeepLink = eParam != null
const tempParam = floatParam('t', 0, 10000) ?? 298.15

function validMode(value: string | null): ColorMode {
  const found = COLOR_MODES.find((mode) => mode.key === value)
  return (found?.key ?? 'category') as ColorMode
}

function validPalette(value: string | null): PaletteId {
  return value && value in PALETTE_MAP ? (value as PaletteId) : 'default'
}

function catParam(): Set<CategoryKey> | null {
  const raw = params.get('cats')
  if (!raw) return null
  const keys = raw.split(',').filter((key): key is CategoryKey => (CATEGORY_KEYS as string[]).includes(key))
  return keys.length ? new Set(keys) : null
}

function originParam(): OriginKey | null {
  const raw = params.get('origin')
  return raw && (ORIGIN_KEYS as string[]).includes(raw) ? (raw as OriginKey) : null
}

function compareParam(): number[] {
  const raw = params.get('cmp')
  if (!raw) return []
  return [...new Set(raw.split(',').map((part) => Number.parseInt(part, 10)).filter((z) => Number.isFinite(z) && z >= 1 && z <= 118))].slice(0, 4)
}

function propParam(): CompareProp {
  const raw = params.get('prop') as CompareProp | null
  return raw && COMPARE_PROPS.includes(raw) ? raw : 'ionizationEnergy'
}

function loadSaved(): SavedView[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.slice(0, 12) : []
  } catch {
    return []
  }
}

function persistSaved(views: SavedView[]): void {
  try { window.localStorage.setItem(SAVED_KEY, JSON.stringify(views)) } catch { /* storage may be unavailable */ }
}

const state = reactive({
  selectedZ: eParam ?? 6,
  panelOpen: validDeepLink && params.get('open') !== '0',
  colorMode: validMode(params.get('mode')),
  activeCats: catParam(),
  originFilter: originParam(),
  query: params.get('q') ?? '',
  focused: false,
  showIonizationChart: params.get('chart') === '1',
  compared: compareParam(),
  compareOpen: params.get('compare') === '1' && compareParam().length >= 1,
  compareProperty: propParam(),
  palette: validPalette(params.get('palette')),
  researchOpen: false,
  saved: loadSaved(),
  savedOpen: false,
  savedNote: '',
  tempK: tempParam,
  tempUnit: 'K' as TempUnit,
  tempPlaying: false,
  tempPlayDirection: 1 as 1 | -1,
  tempPlaySpeed: 1,
  tempPhaseFilter: null as SimulatedPhase | null,
  tempSimulatorOpen: params.get('sim') !== '0',
})

let tempAnimTimer: number | null = null
function startThermalAnimation(): void {
  if (tempAnimTimer) return
  let lastTime = performance.now()
  const step = () => {
    if (!state.tempPlaying) {
      tempAnimTimer = null
      return
    }
    const now = performance.now()
    const dt = Math.min(0.1, (now - lastTime) / 1000)
    lastTime = now

    const rate = Math.max(15, state.tempK * 0.08) * state.tempPlaySpeed * dt
    let next = state.tempK + state.tempPlayDirection * rate

    if (next >= 6000) {
      next = 6000
      state.tempPlaying = false
    } else if (next <= 0) {
      next = 0
      state.tempPlaying = false
    }

    state.tempK = Math.round(next * 10) / 10
    if (state.tempPlaying) {
      tempAnimTimer = window.requestAnimationFrame(step)
    } else {
      tempAnimTimer = null
    }
  }
  tempAnimTimer = window.requestAnimationFrame(step)
}

function toggleThermalPlay(dir?: 1 | -1): void {
  if (dir !== undefined && (dir !== state.tempPlayDirection || !state.tempPlaying)) {
    state.tempPlayDirection = dir
    state.tempPlaying = true
    startThermalAnimation()
  } else {
    state.tempPlaying = !state.tempPlaying
    if (state.tempPlaying) startThermalAnimation()
  }
}

window.addEventListener('elementa-detail-close', () => { state.panelOpen = false })
window.addEventListener('elementa-open-research', () => { state.researchOpen = true })

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    document.getElementById('elementa-search')?.focus()
  }
})

function select(z: number): void {
  state.selectedZ = z
  state.panelOpen = true
}

function toggleCat(key: CategoryKey): void {
  const next = new Set(state.activeCats ?? [])
  if (next.has(key)) next.delete(key)
  else next.add(key)
  state.activeCats = next.size ? next : null
}

function toggleCompare(atomicNumber: number): void {
  if (state.compared.includes(atomicNumber)) {
    state.compared = state.compared.filter((z) => z !== atomicNumber)
    if (state.compared.length === 0) state.compareOpen = false
  } else if (state.compared.length < 4) {
    state.compared = [...state.compared, atomicNumber]
    if (state.compared.length >= 2) state.compareOpen = true
  }
}

function snapshot(): Record<string, unknown> {
  return {
    element: state.panelOpen ? state.selectedZ : null,
    colorMode: state.colorMode,
    categories: state.activeCats ? [...state.activeCats] : null,
    origin: state.originFilter,
    query: state.query,
    chart: state.showIonizationChart,
    compared: state.compared,
    compareProperty: state.compareProperty,
    palette: state.palette,
    temp: state.tempK,
  }
}

let lastUrl = ''
function writeUrl(): void {
  const next = new URLSearchParams()
  if (state.panelOpen) next.set('e', String(state.selectedZ))
  if (state.colorMode !== 'category') next.set('mode', state.colorMode)
  if (state.activeCats) next.set('cats', [...state.activeCats].join(','))
  if (state.originFilter) next.set('origin', state.originFilter)
  if (state.query.trim()) next.set('q', state.query)
  if (state.showIonizationChart) next.set('chart', '1')
  if (state.compared.length) next.set('cmp', state.compared.join(','))
  if (state.compareOpen) next.set('compare', '1')
  if (state.compareProperty !== 'ionizationEnergy') next.set('prop', state.compareProperty)
  if (state.palette !== 'default') next.set('palette', state.palette)
  if (Math.abs(state.tempK - 298.15) > 0.1) next.set('t', String(state.tempK))
  if (!state.tempSimulatorOpen) next.set('sim', '0')
  const url = `${window.location.pathname}${next.toString() ? `?${next}` : ''}`
  if (url !== lastUrl) {
    lastUrl = url
    window.history.replaceState(null, '', url)
  }
}

function applySaved(view: SavedView): void {
  state.panelOpen = view.e != null
  if (view.e != null) state.selectedZ = view.e
  state.colorMode = view.mode
  state.activeCats = view.cats.length ? new Set(view.cats) : null
  state.originFilter = view.origin
  state.query = view.q
  state.showIonizationChart = view.chart
  state.compared = view.cmp
  state.compareProperty = view.prop
  state.palette = view.palette
  if (view.temp != null) state.tempK = view.temp
  state.savedOpen = false
  state.savedNote = `Restored “${view.name}”`
  window.setTimeout(() => { state.savedNote = '' }, 2200)
}

function saveCurrent(): void {
  const name = `View ${state.saved.length + 1}`
  const view: SavedView = {
    name,
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    e: state.panelOpen ? state.selectedZ : null,
    mode: state.colorMode,
    cats: state.activeCats ? [...state.activeCats] : [],
    origin: state.originFilter,
    q: state.query,
    chart: state.showIonizationChart,
    cmp: state.compared,
    prop: state.compareProperty,
    palette: state.palette,
  }
  const next = [...state.saved, view]
  state.saved = next
  persistSaved(next)
  state.savedNote = `Saved “${name}” in this browser`
  window.setTimeout(() => { state.savedNote = '' }, 2200)
}

function clearSaved(): void {
  state.saved = []
  persistSaved([])
  state.savedNote = 'Saved views cleared'
  window.setTimeout(() => { state.savedNote = '' }, 2200)
}

function actionButton(label: string, href: string, color: string): VNode {
  return H('a', {
    href,
    class: `shrink-0 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition hover:bg-white/10 ${color}`,
  }, label) as VNode
}

function HomePage(): VNode {
  writeUrl()

  const selectedEl = getElement(state.selectedZ) ?? getElement(1)!
  const accent = tileColor(selectedEl, state.colorMode, state.palette).text
  const structured = parseStructuredQuery(state.query)
  const results = structured ? structured.matches : searchElements(state.query)
  const matches = state.query.trim() ? new Set(results.map((el) => el.number)) : null
  const visibleElements = ELEMENTS.filter((el) => {
    if (matches && !matches.has(el.number)) return false
    if (state.activeCats && !state.activeCats.has(el.category)) return false
    if (state.colorMode === 'origins' && state.originFilter && originPct(el.number, state.originFilter) < 5) return false
    return true
  })
  const hasFilters = state.activeCats != null || state.originFilter != null || state.query.trim().length > 0
  const legends: Array<VNode | null> = []

  if (isHeatMode(state.colorMode)) {
    const legend = heatLegend(state.colorMode)
    legends.push(
      H('span', { class: 'shrink-0 text-[10px] uppercase tracking-wider text-zinc-500' }, legend.unit),
      H('span', { class: 'shrink-0 font-mono text-[10px] text-zinc-400' }, legend.lo),
      H('div', { class: 'h-2 w-48 shrink-0 rounded-full md:w-72', style: { background: heatGradientCss(state.palette) } }),
      H('span', { class: 'shrink-0 font-mono text-[10px] text-zinc-400' }, `${legend.hi} ${legend.unit}`),
      H('span', { class: 'shrink-0 text-[10px] text-zinc-600' }, `· grey = no consensus value${state.colorMode === 'density' ? ' · logarithmic scale' : ''}`),
      H('label', { class: 'flex shrink-0 items-center gap-1 text-[10px] text-zinc-600' }, 'ramp',
        H('select', {
          value: state.palette, 'aria-label': 'Heat-map colour palette',
          onChange: (event: Event) => { state.palette = validPalette((event.target as HTMLSelectElement).value) },
          class: 'rounded border border-white/10 bg-[#0c1220] px-1 py-0.5 text-[10px] text-zinc-300',
        }, ...PALETTES.map((palette) => H('option', { key: palette.id, value: palette.id, title: palette.description }, palette.label)))),
    )
  } else if (state.colorMode === 'block') {
    legends.push(...Object.entries(BLOCK_COLORS).map(([key, color]) => H('span', {
      key, class: 'flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px]', style: { color },
    }, H('span', { class: 'h-1.5 w-1.5 rounded-full', style: { background: color } }), `${key}-block`)))
    legends.push(H('span', { class: 'shrink-0 text-[10px] text-zinc-600' }, '· highest-energy occupied orbital'))
  } else if (state.colorMode === 'phase') {
    legends.push(...Object.entries(PHASE_COLORS).map(([key, color]) => H('span', {
      key, class: 'flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] capitalize', style: { color },
    }, H('span', { class: 'h-1.5 w-1.5 rounded-full', style: { background: color } }), key)))
    legends.push(H('span', { class: 'shrink-0 text-[10px] text-zinc-600' }, '· predicted phase for heaviest elements'))
  } else if (state.colorMode === 'origins') {
    legends.push(...ORIGINS.map((origin) => {
      const active = state.originFilter == null || state.originFilter === origin.key
      return H('button', {
        key: origin.key, type: 'button', title: `${origin.desc} — flagship: ${origin.example}`,
        onClick: () => { state.originFilter = state.originFilter === origin.key ? null : origin.key },
        class: `flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] transition ${active ? 'border-white/20 bg-white/[0.05]' : 'border-transparent opacity-35'}`,
        style: { color: active ? origin.color : undefined },
      }, H('span', { class: 'h-1.5 w-1.5 rounded-full', style: { background: origin.color } }), origin.label) as VNode
    }))
    legends.push(H('span', { class: 'shrink-0 text-[10px] text-zinc-600' }, '· shares of solar-system abundance · digitized from J. Johnson (SDSS 2019) · click to highlight'))
  } else {
    legends.push(...CATEGORIES.map((cat) => {
      const active = state.activeCats == null || state.activeCats.has(cat.key)
      return H('button', {
        key: cat.key, type: 'button', title: cat.desc, onClick: () => toggleCat(cat.key),
        class: `flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] transition ${active ? 'border-white/20 bg-white/[0.05]' : 'border-transparent opacity-35'}`,
        style: { color: active ? cat.color : undefined },
      }, H('span', { class: 'h-1.5 w-1.5 rounded-full', style: { background: cat.color } }), cat.label) as VNode
    }))
    if (state.activeCats) legends.push(H('button', { type: 'button', class: 'shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400 transition hover:text-zinc-200', onClick: () => { state.activeCats = null } }, 'clear ×'))
  }

  if (hasFilters) legends.push(H('button', {
    type: 'button', onClick: () => { state.activeCats = null; state.originFilter = null; state.query = '' },
    class: 'ml-auto shrink-0 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300 transition hover:bg-amber-400/20',
  }, `reset filters${matches ? ` · ${visibleElements.length} shown` : ''}`))

  legends.push(H('button', {
    type: 'button', onClick: () => { state.savedOpen = !state.savedOpen },
    class: 'shrink-0 rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400 transition hover:text-zinc-200',
    'aria-expanded': String(state.savedOpen),
  }, `saved views${state.saved.length ? ` (${state.saved.length})` : ''}`))

  legends.push(H('button', {
    type: 'button',
    onClick: () => { state.tempSimulatorOpen = !state.tempSimulatorOpen },
    class: `shrink-0 flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium transition cursor-pointer ${state.tempSimulatorOpen ? 'border-amber-400/50 bg-amber-400/15 text-amber-300' : 'border-white/10 text-zinc-400 hover:text-zinc-200'}`,
    title: 'Toggle Real-Time State of Matter & Thermal Simulator',
  }, '🌡️ Thermal Sim', Math.abs(state.tempK - 298.15) > 0.1 ? H('span', { class: 'rounded px-1 bg-amber-400/20 text-amber-200 text-[9px] font-mono' }, `${state.tempK.toFixed(0)} K`) : null))

  if (state.savedNote) legends.push(H('span', { class: 'shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300', 'aria-live': 'polite' }, state.savedNote))

  const suggestions = state.focused && state.query.trim()
    ? H('div', { class: 'absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[#0c1220] shadow-2xl' },
        structured
          ? H('div', { class: 'border-b border-white/10 bg-sky-400/[0.06] px-2.5 py-1.5 text-[10px] text-sky-300' },
              structured.error
                ? `Query error: ${structured.error}`
                : `Structured query · ${structured.label} · ${results.length} match${results.length === 1 ? '' : 'es'}`)
          : null,
        results.length
          ? H('div', { class: 'max-h-72 overflow-y-auto' }, ...results.slice(0, 12).map((el) => {
              const color = tileColor(el, 'category')
              return H('button', {
                key: el.number, type: 'button', onMouseDown: () => { select(el.number); state.query = '' },
                class: 'flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition hover:bg-white/5',
              }, H('span', { class: 'w-9 text-center font-mono text-[12px] font-bold', style: { color: color.text } }, el.symbol),
              H('span', { class: 'truncate text-[12px] text-zinc-200' }, el.name),
              H('span', { class: 'ml-auto shrink-0 font-mono text-[10px] text-zinc-500' }, `${el.number} · ${el.mass}`))
            }))
          : H('div', { class: 'px-3 py-2 text-[11px] text-zinc-500' },
              structured?.error ? structured.error : `No element matches “${state.query}”.`))
    : null

  const savedPanel = state.savedOpen
    ? H('div', { class: 'fixed right-3 top-[104px] z-[60] w-72 rounded-xl border border-white/15 bg-[#0c1220] p-2 shadow-2xl' },
        H('div', { class: 'mb-1.5 flex items-center gap-2 px-1' },
          H('span', { class: 'text-[10px] font-semibold uppercase tracking-wider text-zinc-400' }, 'Saved views'),
          H('button', { type: 'button', onClick: () => { state.savedOpen = false }, class: 'ml-auto text-[11px] text-zinc-500 hover:text-zinc-200', 'aria-label': 'Close saved views' }, '×')),
        H('button', { type: 'button', onClick: saveCurrent, class: 'w-full rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1.5 text-[10.5px] text-emerald-300 hover:bg-emerald-400/20' }, '＋ Save current view'),
        state.saved.length
          ? H('div', { class: 'mt-1.5 space-y-0.5' }, ...state.saved.map((view) => H('button', {
              key: `${view.name}-${view.at}`, type: 'button', onClick: () => applySaved(view),
              class: 'flex w-full items-baseline gap-2 rounded px-2 py-1 text-left hover:bg-white/5',
            }, H('span', { class: 'text-[10.5px] text-zinc-200' }, view.name), H('span', { class: 'ml-auto font-mono text-[9px] text-zinc-600' }, view.at))))
          : H('p', { class: 'mt-1.5 px-2 text-[9.5px] text-zinc-600' }, 'No saved views yet. A view stores filters, colour mode, comparison set and palette in this browser only.'),
        state.saved.length ? H('button', { type: 'button', onClick: clearSaved, class: 'mt-1.5 w-full rounded border border-white/10 px-2 py-1 text-[9.5px] text-zinc-500 hover:text-zinc-300' }, 'Clear all saved views') : null)
    : null

  return H('div', { class: 'flex h-dvh flex-col bg-[#070a10]' },
    H('header', { class: 'print-hide relative z-20 flex h-14 shrink-0 items-center gap-2.5 border-b border-white/10 bg-[#0a0f18]/95 px-3 md:px-4 backdrop-blur' },
      H('div', { class: 'flex items-center gap-2.5 shrink-0' },
        ElementaLogo({ size: 28 }),
        H('h1', { class: 'text-[17px] font-bold tracking-[0.22em] text-zinc-100 shrink-0 whitespace-nowrap' }, 'ELEM', H('span', { class: 'text-amber-400' }, 'E'), 'NTA'),
        H('span', { class: 'hidden font-mono text-[10px] text-zinc-500 2xl:inline whitespace-nowrap' }, '· 118 elements · ⌘K')),
      H('div', { class: 'relative shrink-0 w-36 sm:w-44 md:w-52' },
        H('input', {
          id: 'elementa-search', type: 'text', value: state.query,
          onInput: (event: Event) => { state.query = (event.target as HTMLInputElement).value },
          onFocus: () => { state.focused = true }, onBlur: () => { window.setTimeout(() => { state.focused = false }, 120) },
          onKeyDown: (event: KeyboardEvent) => {
            if (event.key === 'Escape') state.query = ''
            if (event.key === 'Enter' && results.length) { select(results[0].number); state.query = '' }
          },
          placeholder: 'Search, or Z>50…',
          'aria-label': 'Search elements or run a structured query',
          class: `w-full rounded-md border bg-[#0c1220] px-2.5 py-1.5 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none ${structured?.error ? 'border-rose-400/60' : 'border-white/10 focus:border-amber-400/50'}`,
        }), suggestions),
      H('select', {
        value: state.colorMode, 'aria-label': 'Color mode', onChange: (event: Event) => { state.colorMode = validMode((event.target as HTMLSelectElement).value); state.originFilter = null },
        class: 'shrink-0 rounded-md border border-white/10 bg-[#0c1220] px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none',
      }, COLOR_MODES.map((mode) => H('option', { key: mode.key, value: mode.key, selected: mode.key === state.colorMode }, mode.label))),
      H('button', {
        type: 'button', onClick: () => { state.researchOpen = true },
        class: 'shrink-0 rounded-md border border-sky-400/40 bg-sky-400/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-300 transition hover:bg-sky-400/20 whitespace-nowrap',
        title: 'Dataset provenance, citations, unit converter and exports',
      }, 'Data & cite'),
      H('button', {
        type: 'button',
        onClick: () => {
          if (state.compared.length === 0) {
            state.compared = [selectedEl.number]
          }
          state.compareOpen = true
        },
        class: 'shrink-0 rounded-md border border-emerald-400/30 bg-emerald-400/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-400/10 whitespace-nowrap',
        title: 'Open element comparison lab',
      }, `Compare ${state.compared.length}/4`),
      H('div', { class: 'ml-auto flex items-center gap-1.5 overflow-x-auto max-w-full py-1 shrink min-w-0' },
        actionButton('Reactor', './reactor.html', 'border-rose-400/40 bg-rose-400/10 text-rose-300'),
        actionButton('Kinetics', './kinetics.html', 'border-amber-400/40 bg-amber-400/10 text-amber-300'),
        actionButton('Spectroscopy', './spectroscopy.html', 'border-purple-400/40 bg-purple-400/10 text-purple-300'),
        actionButton('Synthesizer', './synthesizer.html', 'border-rose-400/40 bg-rose-400/10 text-rose-300'),
        actionButton('Electrochem', './electrochemistry.html', 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'),
        actionButton('Crystal & XRD', './crystal.html', 'border-amber-400/40 bg-amber-400/10 text-amber-300'),
        actionButton('MO builder', './mo.html', 'border-amber-400/40 bg-amber-400/10 text-amber-300'),
        actionButton('Orbital lab', './orbitals.html', 'border-sky-400/40 bg-sky-400/10 text-sky-300'),
        actionButton('EM lab', './em.html', 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'),
        actionButton('Thermo lab', './thermo.html', 'border-fbbf24/40 bg-fbbf24/10 text-fbbf24'),
        actionButton('Relativity lab', './relativity.html', 'border-violet-400/40 bg-violet-400/10 text-violet-300'),
        actionButton('Quantum wave lab', './quantumwave.html', 'border-f472b6/40 bg-f472b6/10 text-f472b6'),
        actionButton('Optics lab', './optics.html', 'border-a3e635/40 bg-a3e635/10 text-a3e635'),
        actionButton('Band theory lab', './bands.html', 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'),
        actionButton('Segrè chart', './segre.html', 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'),
        GitHubLink(),
      )),
    H('div', { class: 'print-hide z-10 flex h-10 shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#080c14] px-4' }, legends),
    H('main', { class: 'relative flex-1 overflow-auto' },
      H('div', { class: 'flex min-h-full flex-col items-center p-4 lg:p-6', style: { background: 'radial-gradient(1100px 520px at 50% -8%, rgba(251,191,36,0.05), transparent 70%)' } },
        state.tempSimulatorOpen ? TemperatureBar({
          tempK: state.tempK,
          unit: state.tempUnit,
          isPlaying: state.tempPlaying,
          playDirection: state.tempPlayDirection,
          playSpeed: state.tempPlaySpeed,
          activePhaseFilter: state.tempPhaseFilter,
          onTempChange: (k) => { state.tempK = k },
          onUnitChange: (u) => { state.tempUnit = u },
          onTogglePlay: (dir) => toggleThermalPlay(dir),
          onSpeedChange: (s) => { state.tempPlaySpeed = s },
          onPhaseFilterChange: (p) => { state.tempPhaseFilter = p },
          onReset: () => {
            state.tempK = 298.15
            state.tempPlaying = false
            state.tempPhaseFilter = null
          },
        }) : null,
        PeriodicTable({
          selected: state.selectedZ,
          onSelect: (el) => select(el.number),
          colorMode: state.colorMode,
          palette: state.palette,
          matches,
          activeCategories: state.activeCats,
          originFilter: state.colorMode === 'origins' ? state.originFilter : null,
          simulatedTemp: state.tempK,
          activePhaseFilter: state.tempPhaseFilter,
        }),
        H('button', { type: 'button', onClick: () => { state.showIonizationChart = !state.showIonizationChart }, 'aria-expanded': String(state.showIonizationChart), class: 'print-hide mt-4 rounded-md border border-amber-400/30 bg-amber-400/[0.06] px-3 py-1.5 text-[11px] font-medium text-amber-300 transition hover:bg-amber-400/10' }, state.showIonizationChart ? 'Hide ionization chart ↑' : 'Show ionization chart ↓'),
        state.showIonizationChart ? IonizationChart({ selected: state.selectedZ, onSelect: (el) => select(el.number) }) : null,
        H('p', { class: 'mt-5 max-w-[880px] text-center text-[10px] leading-relaxed text-zinc-600' },
          'Reference values follow IUPAC conventions — Pauling electronegativity, first ionization energy in eV, electron affinity in kJ/mol, empirical radii in pm (calculated for noble gases), temperatures in K, densities at STP. Interval atomic weights are shown as [low–high]; bracketed values apply to Tc, Pm and Z ≥ 84. Radioactive nuclides are flagged with a dot. ',
          H('a', { href: './references.html', class: 'text-sky-500/80 underline decoration-dotted hover:text-sky-300' }, 'Sources, versions and model tiers →')))),
    DetailPanel({ element: selectedEl, accent, open: state.panelOpen, compareSelected: state.compared.includes(selectedEl.number), compareFull: state.compared.length >= 4, simulatedTemp: state.tempK, onToggleCompare: () => toggleCompare(selectedEl.number) }),
    state.compareOpen && state.compared.length >= 1 ? CompareElements({
      elements: state.compared.map((z) => getElement(z)).filter((el): el is ElementData => el != null),
      property: state.compareProperty,
      palette: state.palette,
      onPropertyChange: (property) => { state.compareProperty = property },
      onAdd: (z) => {
        if (!state.compared.includes(z) && state.compared.length < 4) {
          state.compared = [...state.compared, z]
        }
      },
      onRemove: (z) => {
        state.compared = state.compared.filter((item) => item !== z)
        if (state.compared.length === 0) state.compareOpen = false
      },
      onClose: () => { state.compareOpen = false },
    }) : null,
    savedPanel,
    ResearchPanel({ open: state.researchOpen, onClose: () => { state.researchOpen = false }, view: snapshot(), elements: visibleElements }),
  ) as VNode
}

export default HomePage
