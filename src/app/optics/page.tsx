/**
 * ELEMENTA — Optics & Wave Phenomena Laboratory
 * Fraunhofer diffraction and interference: single slit, Young's double slit and
 * an N-slit grating, an exact intensity-on-screen plot, order ruler, fringe
 * spacing, envelope zeros and grating resolving power.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import '@/components/optics/optics-element'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'
import {
  envelopeZeroSin,
  firstOrderSin,
  fringeSpacingM,
  rayleighDeltaLambdaNm,
  resolvingPower,
  spectralName,
  visibleOrders,
  wavelengthCss,
  type OpticsSystem,
  type SlitParams,
} from '@/lib/optics'

function Htag(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

function StatCard({ label, value, tint }: { label: string; value: string; tint?: string }): VNode {
  return Htag(
    'div',
    { class: 'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2' },
    Htag('div', { class: 'text-[9px] uppercase tracking-wider text-zinc-500' }, label),
    Htag(
      'div',
      { class: 'mt-0.5 font-mono text-[13px] font-semibold', style: { color: tint ?? '#e4e4e7' } },
      value,
    ),
  )
}

function slider(
  label: string,
  min: number,
  max: number,
  step: number,
  get: () => number,
  set: (v: number) => void,
  format?: (v: number) => string,
  unit = '',
  accent = 'accent-lime-400',
): VNode {
  return Htag(
    'div',
    { class: 'space-y-1' },
    Htag('div', { class: 'flex justify-between text-[9.5px] font-medium text-zinc-400' }, label),
    Htag('input', {
      type: 'range', min: String(min), max: String(max), step: String(step),
      value: String(get()),
      oninput: (e: Event) => { set(parseFloat((e.target as HTMLInputElement).value)); syncUrl() },
      class: `w-full ${accent}`,
    }),
    Htag(
      'div',
      { class: 'text-[10px] font-mono text-zinc-200' },
      format ? `${format(get())} ${unit}` : `${get().toFixed(3)} ${unit}`,
    ),
  )
}

function toggle(label: string, active: boolean, onclick: () => void): VNode {
  return Htag(
    'button',
    {
      type: 'button',
      onclick,
      class: `rounded-md border px-2.5 py-1 text-[11px] transition ${
        active
          ? 'border-lime-400/60 bg-lime-400/10 text-lime-300'
          : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-200'
      }`,
    },
    label,
  )
}

function SectionTitle(text: string): VNode {
  return Htag(
    'h2',
    { class: 'mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500' },
    text,
  )
}

const SYSTEMS: { key: OpticsSystem; label: string }[] = [
  { key: 'single', label: 'Single slit' },
  { key: 'double', label: 'Double slit' },
  { key: 'grating', label: 'Grating' },
]

function getInitialParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const k of ['system', 'lambda', 'a', 'd', 'n', 'L', 'speed', 'animate']) {
    const v = params.get(k)
    if (v != null) out[k] = v
  }
  return out
}

const initial = getInitialParams()
const num = (o: Record<string, string>, k: string, d: number): number => {
  const v = Number(o[k])
  return o[k] != null && Number.isFinite(v) ? v : d
}

const state = reactive({
  system: (['single', 'double', 'grating'].includes(initial.system ?? '') ? initial.system : 'double') as OpticsSystem,
  lambdaNm: Math.min(780, Math.max(380, num(initial, 'lambda', 550))),
  aUm: Math.min(6, Math.max(0.05, num(initial, 'a', 0.6))),
  dUm: Math.min(30, Math.max(0.3, num(initial, 'd', 3))),
  nSlits: Math.min(10, Math.max(2, Math.round(num(initial, 'n', 4)))),
  screenL: Math.min(4, Math.max(0.2, num(initial, 'L', 1.5))),
  speed: Math.min(3, Math.max(0, num(initial, 'speed', 1))),
  animate: initial.animate !== 'false' && initial.animate !== '0',
  seed: 0,
})

if (state.system !== 'single' && state.aUm > state.dUm * 0.8) {
  state.aUm = Number((state.dUm * 0.8).toFixed(2))
}

let lastUrl = ''
function syncUrl(): void {
  if (typeof window === 'undefined') return
  const next = new URLSearchParams()
  next.set('system', state.system)
  next.set('lambda', String(Math.round(state.lambdaNm)))
  next.set('a', String(state.aUm))
  next.set('d', String(state.dUm))
  next.set('n', String(state.nSlits))
  next.set('L', String(state.screenL))
  next.set('speed', String(state.speed))
  next.set('animate', String(state.animate))
  const url = `${window.location.pathname}?${next}`
  if (url !== lastUrl) {
    lastUrl = url
    window.history.replaceState(null, '', url)
  }
}

function setSystem(key: OpticsSystem): void {
  state.system = key
  state.seed++
  syncUrl()
}

// A slit cannot be wider than the spacing that separates it from its neighbour.
function setSlitWidth(v: number): void {
  state.aUm = v
  if (state.system !== 'single' && state.aUm > state.dUm * 0.8) {
    state.dUm = Math.min(30, Math.max(0.5, Number((state.aUm / 0.8).toFixed(2))))
  }
}

function setSlitSpacing(v: number): void {
  state.dUm = v
  if (state.aUm > state.dUm * 0.8) {
    state.aUm = Number((state.dUm * 0.8).toFixed(2))
  }
}

const fmt = (v: number, d = 3): string => v.toFixed(d)

export default function OpticsPage(): VNode {
  const nSlits = state.system === 'single' ? 1 : state.system === 'double' ? 2 : state.nSlits
  const p: SlitParams = { lambdaNm: state.lambdaNm, aUm: state.aUm, dUm: state.dUm, nSlits }

  const spacingMm = fringeSpacingM(p, state.screenL) * 1000
  const s1 = firstOrderSin(p)
  const theta1 = s1 != null ? (Math.asin(s1) * 180) / Math.PI : null
  const zeroSin = envelopeZeroSin(p)
  const thetaZero = zeroSin != null ? (Math.asin(zeroSin) * 180) / Math.PI : null
  const orders = visibleOrders(p)
  const mMax = Math.max(...orders.map((m) => Math.abs(m)))
  const R1 = resolvingPower(p, 1)
  const dLam1 = rayleighDeltaLambdaNm(p, 1)
  const RM = resolvingPower(p, Math.max(1, mMax))
  const dLamM = rayleighDeltaLambdaNm(p, Math.max(1, mMax))
  const ratio = (state.dUm * 1000) / state.lambdaNm
  const aOverLambda = (state.aUm * 1000) / state.lambdaNm
  const lobeMm = zeroSin != null ? state.screenL * Math.tan(Math.asin(zeroSin)) * 1000 : null
  const minimaP = zeroSin != null ? Math.min(6, Math.floor(aOverLambda)) : 0
  const swatch = wavelengthCss(state.lambdaNm, 1)
  const swatchSoft = wavelengthCss(state.lambdaNm, 0.18)

  const attrs: Record<string, string> = {
    'data-system': state.system,
    'data-lambda': String(state.lambdaNm),
    'data-a': String(state.aUm),
    'data-d': String(state.dUm),
    'data-n': String(state.nSlits),
    'data-l': String(state.screenL),
    'data-speed': String(state.speed),
    'data-anim': state.animate ? 'true' : 'false',
    'data-reset': String(state.seed),
  }

  return Htag(
    'div',
    { class: 'flex min-h-dvh flex-col bg-[#070a10] text-zinc-200' },
    // Header
    Htag(
      'header',
      {
        class:
          'sticky top-0 z-30 flex h-14 shrink-0 flex-wrap items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur',
      },
      Htag(
        'a',
        {
          href: './index.html',
          class:
            'rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
        },
        '← Periodic table',
      ),
      Htag(
        'div',
        { class: 'flex items-center gap-2' },
        ElementaLogo({ size: 26 }),
        Htag(
          'h1',
          { class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100' },
          Htag('span', { class: 'text-lime-300' }, 'OPTICS'),
          ' LAB',
        ),
      ),
      Htag(
        'span',
        { class: 'hidden font-mono text-[10px] text-zinc-500 lg:inline' },
        'Fraunhofer diffraction · multi-slit interference · fringe geometry · resolving power',
      ),
      GitHubLink(),
    ),

    // Main grid
    Htag(
      'main',
      {
        class:
          'mx-auto grid w-full max-w-[1700px] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:p-6',
      },
      // Left: visualization
      Htag(
        'div',
        { class: 'flex min-h-[560px] flex-col h-[min(78dvh,820px)]' },
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-2 flex-1 relative' },
          Htag('elementa-optics', {
            ...attrs,
            style: 'width: 100%; height: 100%; display: block;',
          }),
          Htag(
            'div',
            {
              class:
                'pointer-events-none absolute bottom-2 right-2 flex flex-wrap items-center gap-2 font-mono text-[9.5px] text-zinc-500',
            },
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', {
                class: 'inline-block h-2 w-2 rounded-full',
                style: { background: swatch },
              }),
              'crest'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-[#5c29a0]' }),
              'trough'),
            Htag('span', { class: 'flex items-center gap-1' },
              Htag('span', { class: 'inline-block h-2 w-2 rounded-full bg-[#0d1526] ring-1 ring-white/20' }),
              'aperture'),
          ),
        ),
        Htag(
          'div',
          { class: 'mt-2 flex flex-wrap items-center gap-2' },
          toggle('Animate', state.animate, () => { state.animate = !state.animate; syncUrl() }),
          Htag(
            'button',
            {
              type: 'button',
              onclick: () => { state.seed++; syncUrl() },
              class: 'rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200',
            },
            '⟲ Reset wave phase',
          ),
          Htag(
            'span',
            { class: 'flex items-center gap-1.5 font-mono text-[10px] text-zinc-600' },
            Htag('span', {
              class: 'inline-block h-3 w-3 rounded-sm border border-white/20',
              style: { background: swatchSoft },
            }),
            `${Math.round(state.lambdaNm)} nm · ${spectralName(state.lambdaNm)}`,
          ),
          Htag(
            'span',
            { class: 'font-mono text-[10px] text-zinc-600' },
            `${nSlits} slit${nSlits > 1 ? 's' : ''} · ${state.system === 'single' ? `a/λ = ${fmt(aOverLambda, 2)}` : `d/λ = ${fmt(ratio, 2)}`}`,
          ),
        ),
      ),

      // Right: controls & physics
      Htag(
        'div',
        { class: 'space-y-3' },
        // Aperture
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Aperture'),
          Htag(
            'div',
            { class: 'mb-3 flex flex-wrap gap-1.5' },
            SYSTEMS.map((s) => toggle(s.label, state.system === s.key, () => setSystem(s.key))),
          ),
          Htag('div', { class: 'space-y-2.5' },
            Htag(
              'div',
              { class: 'flex items-center gap-2' },
              Htag('span', {
                class: 'inline-block h-4 w-8 rounded border border-white/20',
                style: { background: swatch },
              }),
              Htag(
                'span',
                { class: 'font-mono text-[10px] text-zinc-400' },
                `${Math.round(state.lambdaNm)} nm · ${spectralName(state.lambdaNm)}`,
              ),
            ),
            slider('Wavelength λ', 380, 780, 5, () => state.lambdaNm, (v) => { state.lambdaNm = v }, (v) => String(Math.round(v)), 'nm'),
            slider('Slit width a', 0.1, 5, 0.05, () => state.aUm, (v) => { setSlitWidth(v) }, (v) => v.toFixed(2), 'µm'),
            state.system !== 'single'
              ? slider('Slit separation d', 0.5, 20, 0.1, () => state.dUm, (v) => { setSlitSpacing(v) }, (v) => v.toFixed(2), 'µm')
              : Htag('span'),
            state.system === 'grating'
              ? slider('Slits N', 2, 10, 1, () => state.nSlits, (v) => { state.nSlits = v }, (v) => String(Math.round(v)))
              : Htag('span'),
            slider('Screen distance L', 0.5, 3, 0.05, () => state.screenL, (v) => { state.screenL = v }, (v) => v.toFixed(2), 'm'),
            slider('Wave animation speed', 0, 3, 0.1, () => state.speed, (v) => { state.speed = v }, (v) => v.toFixed(1), '×'),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[10px] leading-relaxed text-zinc-500' },
            state.system === 'single'
              ? 'One finite-width slit: the sinc² envelope alone. Wider slit ⇒ narrower central lobe — the first zero sits at a sinθ = λ.'
              : state.system === 'double'
                ? 'Two coherent slits: the N = 2 interference comb multiplied by the single-slit envelope. Fringe spacing grows with L and λ, shrinks with d.'
                : `N = ${state.nSlits} coherent slits: adding slits doesn't move the maxima — it sharpens them. Peak width scales as 1/N while the resolvable wavelength step shrinks as λ/(mN).`,
          ),
        ),

        // Fringe geometry
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Fringe geometry'),
          Htag(
            'div',
            { class: 'grid grid-cols-3 gap-2' },
            state.system === 'single'
              ? [
                  StatCard({ label: 'first zero θ₀', value: thetaZero != null ? `${thetaZero.toFixed(2)}°` : 'none', tint: '#bef264' }),
                  StatCard({ label: 'central lobe', value: lobeMm != null ? `±${lobeMm.toFixed(0)} mm` : 'full screen', tint: '#e4e4e7' }),
                  StatCard({ label: 'envelope minima', value: minimaP === 0 ? 'none' : `±${minimaP}`, tint: '#e4e4e7' }),
                  StatCard({ label: 'a / λ', value: fmt(aOverLambda, 2), tint: '#e4e4e7' }),
                  StatCard({ label: 'λ', value: `${Math.round(state.lambdaNm)} nm`, tint: swatch }),
                  StatCard({ label: 'slit width a', value: `${state.aUm.toFixed(2)} µm`, tint: '#e4e4e7' }),
                ]
              : [
                  StatCard({ label: 'Δy on screen', value: `${spacingMm.toFixed(2)} mm`, tint: '#bef264' }),
                  StatCard({ label: 'first order θ₁', value: theta1 != null ? `${theta1.toFixed(2)}°` : '—', tint: '#e4e4e7' }),
                  StatCard({ label: 'orders', value: `±${mMax}`, tint: '#e4e4e7' }),
                  StatCard({ label: 'first zero θ₀', value: thetaZero != null ? `${thetaZero.toFixed(2)}°` : 'none', tint: '#a1a1aa' }),
                  StatCard({ label: 'd / λ', value: fmt(ratio, 2), tint: '#e4e4e7' }),
                  StatCard({ label: 'slits N', value: String(nSlits), tint: '#e4e4e7' }),
                ],
          ),
          Htag(
            'div',
            { class: 'mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10.5px] leading-relaxed text-zinc-400' },
            state.system !== 'single'
              ? Htag('div', { class: 'font-mono text-[12px] text-lime-300' },
                  `d sinθ = mλ  →  sinθ₁ = ${s1 != null ? fmt(s1, 4) : 'n/a'}`)
              : null,
            Htag('div', { class: 'font-mono text-[12px] text-lime-300/80' },
              `a sinθ = pλ  →  ${zeroSin != null ? `sinθ₀ = ${fmt(zeroSin, 4)}` : 'envelope zero lies past 90°'}`),
            state.system === 'single'
              ? (thetaZero == null
                  ? 'The slit is narrower than one wavelength (a < λ), so the sinc² envelope has no zero on the sphere — the whole screen sits inside the central lobe.'
                  : 'Only the sinc² envelope survives: a single slit produces one broad central lobe, its width set by λ/a, with no interference fringes inside it.')
              : (thetaZero == null
                  ? 'The slit is narrower than one wavelength, so the sinc² envelope never falls to zero — every interference order shares almost the same brightness.'
                  : 'Principal maxima live inside the central envelope lobe; orders outside it are suppressed ("missing orders").'),
          ),
        ),

        // Resolving power (needs at least two slits)
        state.system !== 'single'
          ? Htag(
              'div',
              { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
              SectionTitle('Grating resolving power'),
              Htag(
                'div',
                { class: 'grid grid-cols-3 gap-2' },
                StatCard({ label: 'R = N·m, m=1', value: String(R1), tint: '#22d3ee' }),
                StatCard({ label: 'Δλ at m=1', value: Number.isFinite(dLam1) ? `${dLam1.toFixed(2)} nm` : '—', tint: '#fbbf24' }),
                StatCard({ label: `R at m=${Math.max(1, mMax)}`, value: String(RM), tint: '#22d3ee' }),
              ),
              Htag(
                'p',
                { class: 'mt-2 text-[10px] leading-relaxed text-zinc-500' },
                `Rayleigh criterion: two wavelengths are just resolved when the m-th maximum of one falls on the first minimum of the other, Δλ = λ/(mN)${Number.isFinite(dLamM) ? ` → ${dLamM.toFixed(2)} nm at m = ${Math.max(1, mMax)}` : ''}. A double slit (N = 2) barely resolves anything; a 10-slit grating at high order is a spectrometer.`,
              ),
            )
          : Htag(
              'div',
              { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3 text-[10.5px] leading-relaxed text-zinc-500' },
              SectionTitle('Resolving power'),
              'Resolving power is an interference property: it needs at least two coherent slits. Switch to the double slit or a grating to compare R = mN and Δλ = λ/(mN).',
            ),

        // Intensity physics note
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
          SectionTitle('Physical scales'),
          Htag(
            'div',
            { class: 'grid grid-cols-3 gap-2' },
            StatCard({ label: 'λ', value: `${Math.round(state.lambdaNm)} nm`, tint: swatch }),
            StatCard({ label: 'd', value: `${state.dUm.toFixed(2)} µm`, tint: '#e4e4e7' }),
            StatCard({ label: 'a', value: `${state.aUm.toFixed(2)} µm`, tint: '#e4e4e7' }),
          ),
          Htag(
            'p',
            { class: 'mt-2 text-[10px] leading-relaxed text-zinc-500' },
            'Angles are exact (spherical screen): sinθ = y/√(y²+L²), so the mm readouts remain correct even at wide angles. Visible light runs 380–780 nm; a ≈ 0.6 µm slit is about one wavelength wide.',
          ),
        ),

        // Methodology
        Htag(
          'div',
          { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3 text-[10.5px] leading-relaxed text-zinc-500' },
          Htag('div', { class: 'mb-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400' }, 'Method'),
          'Far field: Fraunhofer scalar diffraction, I(θ) = sinc²(πa sinθ/λ) · [sin(Nπd sinθ/λ) / (N sin …)]², evaluated per screen pixel. The 3D tank is a qualitative near-field view — each slit is a coherent line source, the shared field precomputed as Σ A cos kr / Σ A sin kr so animation costs one multiply-add per vertex.',
        ),
      ),
    ),
  )
}
