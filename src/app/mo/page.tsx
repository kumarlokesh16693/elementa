import { h, reactive, type VNode } from 'nexus-framework'
import { getElement } from '@/lib/periodic'
import MoDiagram, { computeMo, type MoResult } from '@/components/periodic/MoDiagram'
import {
  computeVseprCoordinates,
  VSEPR_PRESETS,
} from '@/lib/periodic/vsepr'
import '@/components/mo/vsepr-element'
import { VibrationsLabNexus } from '@/components/mo/VibrationsLabNexus'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'

export type ModelStyle = 'ball-stick' | 'space-filling' | 'wireframe'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

const PICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const CENTRAL_PICKS = [4, 5, 6, 7, 8, 15, 16, 17, 35, 53, 54]
const LIGAND_PICKS = [1, 6, 7, 8, 9, 17, 35]

const DIATOMIC_PRESETS: { label: string; a: number; b: number }[] = [
  { label: 'H₂', a: 1, b: 1 },
  { label: 'He₂', a: 2, b: 2 },
  { label: 'Li₂', a: 3, b: 3 },
  { label: 'B₂', a: 5, b: 5 },
  { label: 'C₂', a: 6, b: 6 },
  { label: 'N₂', a: 7, b: 7 },
  { label: 'O₂', a: 8, b: 8 },
  { label: 'F₂', a: 9, b: 9 },
  { label: 'Ne₂', a: 10, b: 10 },
  { label: 'CO', a: 6, b: 8 },
  { label: 'NO', a: 7, b: 8 },
  { label: 'CN', a: 6, b: 7 },
  { label: 'BF', a: 5, b: 9 },
  { label: 'BN', a: 5, b: 7 },
  { label: 'LiF', a: 3, b: 9 },
]

function formula(zA: number, zB: number): string {
  const sA = getElement(zA)!.symbol
  const sB = getElement(zB)!.symbol
  return zA === zB ? `${sA}₂` : `${sA}${sB}`
}

function StatCard({ label, value, tint, sub }: { label: string; value: string; tint?: string; sub?: string }): VNode {
  return H(
    'div',
    { class: 'rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center font-mono' },
    H('div', { class: 'text-[9px] uppercase tracking-wider text-zinc-500' }, label),
    H('div', { class: 'mt-0.5 text-[15px] font-bold truncate', style: { color: tint ?? '#e4e4e7' } }, value),
    sub ? H('div', { class: 'text-[8.5px] text-zinc-500 truncate' }, sub) : null,
  )
}

const params = new URLSearchParams(window.location.search)
const initialTab = params.get('tab')

const state = reactive({
  tab: (initialTab === 'diatomic' ? 'diatomic' : initialTab === 'vibrations' ? 'vibrations' : 'vsepr') as 'vsepr' | 'diatomic' | 'vibrations',
  // Diatomic state
  zA: 7,
  zB: 7,
  // VSEPR state
  presetId: 'h2o',
  centralZ: 8,
  ligandZ: 1,
  bp: 2,
  lp: 2,
  angle: 104.5,
  showLonePairs: true,
  showDipole: true,
  showPolyhedron: false,
  modelStyle: 'ball-stick' as ModelStyle,
  autoRotate: true,
})

export default function MoBuilderPage(): VNode {
  return H(
    'div',
    { class: 'flex min-h-dvh flex-col bg-[#070a10] text-zinc-200' },
    // Header
    H(
      'header',
      { class: 'sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur' },
      H('a', { href: './index.html', class: 'rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200' }, '← Periodic table'),
      H(
        'div',
        { class: 'flex items-center gap-2' },
        ElementaLogo({ size: 26 }),
        H('h1', { class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100 uppercase' }, 'MO & ', H('span', { class: 'text-amber-400' }, 'MOLECULAR'), ' LAB'),
      ),
      H('span', { class: 'hidden font-mono text-[10px] text-zinc-500 md:inline' }, '3D VSEPR spatial geometries · Diatomic MO diagrams · Harmonic molecular vibrations & FTIR / Raman spectra'),
      H('div', { class: 'ml-auto flex items-center gap-2' },
        H('a', { href: './orbitals.html', class: 'rounded-md border border-sky-400/40 bg-sky-400/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-300 transition hover:bg-sky-400/20' }, 'Orbital lab ↗'),
        H('a', { href: './segre.html', class: 'rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-300 transition hover:bg-amber-400/20' }, 'Segrè chart ↗'),
        GitHubLink(),
      ),
    ),
    // Sub-Navigation Tab Bar
    H(
      'div',
      { class: 'relative z-20 flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#080c14] px-4' },
      H(
        'div',
        { class: 'flex rounded-md border border-white/10 p-0.5 bg-[#0e1626]' },
        H(
          'button',
          {
            type: 'button',
            onClick: () => {
              state.tab = 'vsepr'
              window.history.replaceState(null, '', '?tab=vsepr')
            },
            class: `flex items-center gap-1.5 rounded px-3 py-1 font-mono text-xs font-semibold transition ${
              state.tab === 'vsepr'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '🌐 3D VSEPR & Geometry',
        ),
        H(
          'button',
          {
            type: 'button',
            onClick: () => {
              state.tab = 'diatomic'
              window.history.replaceState(null, '', '?tab=diatomic')
            },
            class: `flex items-center gap-1.5 rounded px-3 py-1 font-mono text-xs font-semibold transition ${
              state.tab === 'diatomic'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '⚡ Diatomic MO Diagrams',
        ),
        H(
          'button',
          {
            type: 'button',
            onClick: () => {
              state.tab = 'vibrations'
              window.history.replaceState(null, '', '?tab=vibrations')
            },
            class: `flex items-center gap-1.5 rounded px-3 py-1 font-mono text-xs font-semibold transition ${
              state.tab === 'vibrations'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`,
          },
          '〰️ Vibrations & Spectra',
        ),
      ),
      H(
        'div',
        { class: 'font-mono text-[10.5px] text-zinc-500 hidden sm:block' },
        state.tab === 'vsepr'
          ? 'Steric Number (SN) = BP + LP · Net Dipole vectors (μ) · Real bond angles'
          : state.tab === 'diatomic'
          ? 'Generic second-row MO treatment · σ/π orbital ladder · Pauli & Hund rules'
          : '3N - 6 / 3N - 5 Normal Modes · Harmonic coordinates · Rule of Mutual Exclusion · FTIR / Raman',
      ),
    ),
    // Main Body
    H(
      'main',
      { class: 'mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6' },
      state.tab === 'vsepr'
        ? renderVseprView()
        : state.tab === 'diatomic'
        ? renderDiatomicView()
        : VibrationsLabNexus(),
    ),
  )
}

function renderDiatomicView(): VNode {
  const zA = state.zA
  const zB = state.zB
  const res: MoResult = computeMo(zA, zB)
  const boStr = Number.isInteger(res.bondOrder) ? String(res.bondOrder) : res.bondOrder.toFixed(1)

  return H(
    'div',
    { class: 'grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]' },
    // Left Control Column
    H(
      'div',
      { class: 'space-y-4 self-start rounded-xl border border-white/10 bg-[#0a0f18] p-4 text-zinc-200' },
      H(
        'div',
        null,
        H('div', { class: 'mb-1.5 text-[9.5px] uppercase tracking-wider text-zinc-500' }, 'Common diatomics'),
        H(
          'div',
          { class: 'flex flex-wrap gap-1' },
          DIATOMIC_PRESETS.map((p) => {
            const active = p.a === zA && p.b === zB
            return H(
              'button',
              {
                key: p.label,
                type: 'button',
                onClick: () => { state.zA = p.a; state.zB = p.b },
                class: `rounded-full border px-2.5 py-1 font-mono text-[11px] transition ${
                  active ? 'border-amber-400/60 bg-amber-400/15 text-amber-300 font-bold' : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                }`,
              },
              p.label,
            )
          }),
        ),
      ),
      // Atom A Picker
      H(
        'div',
        null,
        H('div', { class: 'mb-1 text-[9.5px] uppercase tracking-wider text-zinc-500' }, 'Atom A'),
        H(
          'div',
          { class: 'grid grid-cols-5 gap-1' },
          PICKS.map((z) => {
            const el = getElement(z)!
            const active = z === zA
            return H(
              'button',
              {
                key: z,
                type: 'button',
                onClick: () => { state.zA = z },
                class: `rounded border py-1.5 text-center transition ${
                  active ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                }`,
              },
              H('div', { class: 'text-[13px] font-bold leading-none' }, el.symbol),
              H('div', { class: 'mt-0.5 font-mono text-[8.5px] opacity-70' }, String(z)),
            )
          }),
        ),
      ),
      // Atom B Picker
      H(
        'div',
        null,
        H('div', { class: 'mb-1 text-[9.5px] uppercase tracking-wider text-zinc-500' }, 'Atom B'),
        H(
          'div',
          { class: 'grid grid-cols-5 gap-1' },
          PICKS.map((z) => {
            const el = getElement(z)!
            const active = z === zB
            return H(
              'button',
              {
                key: z,
                type: 'button',
                onClick: () => { state.zB = z },
                class: `rounded border py-1.5 text-center transition ${
                  active ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                }`,
              },
              H('div', { class: 'text-[13px] font-bold leading-none' }, el.symbol),
              H('div', { class: 'mt-0.5 font-mono text-[8.5px] opacity-70' }, String(z)),
            )
          }),
        ),
      ),
      H(
        'div',
        { class: 'rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11px] text-zinc-400' },
        'molecule: ',
        H('span', { class: 'font-bold text-zinc-100' }, formula(zA, zB)),
        ' · ',
        String(res.totalElectrons || zA + zB),
        ' e⁻',
      ),
      H(
        'p',
        { class: 'text-[9.5px] leading-relaxed text-zinc-500' },
        'Generic second-row MO treatment. s–p mixing puts π(2p) below σ(2p) for Z_total ≤ 14 (B₂/C₂/N₂-like); above that the order flips (O₂/F₂-like). Heteronuclear diagrams offset the more electronegative atom’s atomic orbitals downward.',
      ),
    ),
    // Right Diagram Column
    H(
      'div',
      { class: 'space-y-4' },
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-4' },
        res.valid
          ? H(
              'div',
              { class: 'mb-2 flex flex-wrap items-center gap-2' },
              H('span', { class: 'rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300' }, 'bonding'),
              H('span', { class: 'rounded-full border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 font-mono text-[10px] text-rose-300' }, 'antibonding'),
              H('span', { class: 'ml-auto font-mono text-[10px] text-zinc-500' }, res.piBelowSigma ? 'π(2p) < σ(2p) — s–p mixing regime' : 'σ(2p) < π(2p) — reduced mixing'),
            )
          : null,
        MoDiagram({ zA, zB }),
      ),
      res.valid
        ? H(
            'div',
            { class: 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6' },
            StatCard({ label: 'Electrons', value: String(res.totalElectrons) }),
            StatCard({ label: 'Bond order', value: boStr, tint: res.bondOrder > 0 ? '#34d399' : '#fb7185' }),
            StatCard({ label: 'Magnetism', value: res.unpaired > 0 ? 'Paramagnetic' : 'Diamagnetic', tint: res.unpaired > 0 ? '#fbbf24' : '#38bdf8' }),
            StatCard({ label: 'Unpaired e⁻', value: String(res.unpaired) }),
            StatCard({ label: 'HOMO', value: res.homo }),
            StatCard({ label: 'LUMO', value: res.lumo }),
            H(
              'div',
              { class: 'col-span-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:col-span-3 lg:col-span-6 text-left font-mono' },
              H('div', { class: 'text-[9px] uppercase tracking-wider text-zinc-500' }, `Configuration (${formula(zA, zB)})`),
              H('div', { class: 'mt-0.5 text-[12.5px] leading-relaxed text-zinc-200' }, res.config),
            ),
          )
        : null,
    ),
  )
}

function renderVseprView(): VNode {
  const activePreset = VSEPR_PRESETS.find((p) => p.id === state.presetId) ?? VSEPR_PRESETS[0]
  const geometry = computeVseprCoordinates(state.centralZ, state.ligandZ, state.bp, state.lp, state.angle)

  return H(
    'div',
    { class: 'space-y-4' },
    // Preset Pill Buttons
    H(
      'div',
      { class: 'flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
      H('span', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-500 mr-1' }, 'Common Molecules:'),
      ...VSEPR_PRESETS.map((p) => {
        const active = state.presetId === p.id
        return H(
          'button',
          {
            key: p.id,
            type: 'button',
            onClick: () => {
              state.presetId = p.id
              state.centralZ = p.centralZ
              state.ligandZ = p.ligandZ
              state.bp = p.bondingPairs
              state.lp = p.lonePairs
              state.angle = p.experimentalAngleDeg
            },
            class: `rounded-full border px-2.5 py-1 font-mono text-[11px] transition ${
              active
                ? 'border-amber-400/60 bg-amber-400/15 text-amber-300 font-bold'
                : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
            }`,
          },
          p.formula,
        )
      }),
    ),
    // Main Grid
    H(
      'div',
      { class: 'grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]' },
      // Left Column Controls
      H(
        'div',
        { class: 'space-y-4 rounded-xl border border-white/10 bg-[#0a0f18] p-4 text-zinc-200 self-start' },
        H(
          'div',
          null,
          H('div', { class: 'flex items-center justify-between' },
            H('h3', { class: 'text-lg font-bold text-zinc-100' }, activePreset.name),
            H('span', { class: 'font-mono text-xs text-amber-400 font-semibold' }, activePreset.formula),
          ),
          H('p', { class: 'mt-1 text-[11px] leading-relaxed text-zinc-400' }, activePreset.description),
        ),
        // Central Atom Picker
        H(
          'div',
          null,
          H('div', { class: 'mb-1 text-[9.5px] uppercase tracking-wider text-zinc-500' }, 'Central Atom (A)'),
          H(
            'div',
            { class: 'grid grid-cols-6 gap-1' },
            ...CENTRAL_PICKS.map((z) => {
              const el = getElement(z)!
              const active = z === state.centralZ
              return H(
                'button',
                {
                  key: z,
                  type: 'button',
                  onClick: () => { state.centralZ = z; state.presetId = 'custom' },
                  class: `rounded border py-1 text-center font-mono text-[11px] font-bold transition ${
                    active ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-white/10 text-zinc-400 hover:border-white/30 hover:text-zinc-200'
                  }`,
                },
                el.symbol,
              )
            }),
          ),
        ),
        // Ligand Atom Picker
        H(
          'div',
          null,
          H('div', { class: 'mb-1 text-[9.5px] uppercase tracking-wider text-zinc-500' }, 'Surrounding Ligand Atom (X)'),
          H(
            'div',
            { class: 'grid grid-cols-7 gap-1' },
            ...LIGAND_PICKS.map((z) => {
              const el = getElement(z)!
              const active = z === state.ligandZ
              return H(
                'button',
                {
                  key: z,
                  type: 'button',
                  onClick: () => { state.ligandZ = z; state.presetId = 'custom' },
                  class: `rounded border py-1 text-center font-mono text-[11px] font-bold transition ${
                    active ? 'border-sky-400 bg-sky-400/20 text-sky-300' : 'border-white/10 text-zinc-400 hover:border-white/30 hover:text-zinc-200'
                  }`,
                },
                el.symbol,
              )
            }),
          ),
        ),
        // Bonding & Lone Pairs
        H(
          'div',
          { class: 'grid grid-cols-2 gap-3 border-t border-white/5 pt-3' },
          H(
            'div',
            { class: 'space-y-1' },
            H('div', { class: 'flex items-center justify-between text-[10px] text-zinc-400' },
              H('span', null, 'BONDING PAIRS (BP)'),
              H('span', { class: 'font-mono font-bold text-zinc-200' }, String(state.bp)),
            ),
            H('input', {
              type: 'range',
              min: '2',
              max: '6',
              step: '1',
              value: String(state.bp),
              onInput: (e: any) => { state.bp = Number(e.target.value); state.presetId = 'custom' },
              class: 'w-full accent-amber-400',
            }),
          ),
          H(
            'div',
            { class: 'space-y-1' },
            H('div', { class: 'flex items-center justify-between text-[10px] text-zinc-400' },
              H('span', null, 'LONE PAIRS (LP)'),
              H('span', { class: 'font-mono font-bold text-amber-300' }, String(state.lp)),
            ),
            H('input', {
              type: 'range',
              min: '0',
              max: '3',
              step: '1',
              value: String(state.lp),
              onInput: (e: any) => { state.lp = Number(e.target.value); state.presetId = 'custom' },
              class: 'w-full accent-amber-400',
            }),
          ),
        ),
        // Bond Angle
        H(
          'div',
          { class: 'space-y-1 border-t border-white/5 pt-3' },
          H('div', { class: 'flex items-center justify-between text-[10px] text-zinc-400' },
            H('span', null, 'BOND ANGLE'),
            H('span', { class: 'font-mono font-bold text-sky-300' }, `${state.angle.toFixed(1)}°`),
          ),
          H('input', {
            type: 'range',
            min: '75',
            max: '180',
            step: '0.5',
            value: String(state.angle),
            onInput: (e: any) => { state.angle = Number(e.target.value) },
            class: 'w-full accent-sky-400',
          }),
          H('div', { class: 'flex justify-between font-mono text-[9px] text-zinc-500' },
            H('span', null, `Ideal: ${geometry.idealAngle}°`),
            H('button', {
              type: 'button',
              onClick: () => { state.angle = geometry.idealAngle },
              class: 'hover:text-zinc-300 underline',
            }, 'Reset to Ideal'),
          ),
        ),
        // 3D Visualizer Layer Toggles
        H(
          'div',
          { class: 'space-y-2 border-t border-white/5 pt-3' },
          H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-500' }, '3D Display Options'),
          H(
            'div',
            { class: 'flex flex-wrap gap-2 text-[11px]' },
            H('label', { class: 'flex items-center gap-1.5 cursor-pointer text-zinc-300' },
              H('input', {
                type: 'checkbox',
                checked: state.showLonePairs,
                onChange: (e: any) => { state.showLonePairs = e.target.checked },
                class: 'rounded border-white/20 bg-black/40 text-amber-400 accent-amber-400',
              }),
              'Lone Pairs',
            ),
            H('label', { class: 'flex items-center gap-1.5 cursor-pointer text-zinc-300' },
              H('input', {
                type: 'checkbox',
                checked: state.showDipole,
                onChange: (e: any) => { state.showDipole = e.target.checked },
                class: 'rounded border-white/20 bg-black/40 text-amber-400 accent-amber-400',
              }),
              'Net Dipole (μ)',
            ),
            H('label', { class: 'flex items-center gap-1.5 cursor-pointer text-zinc-300' },
              H('input', {
                type: 'checkbox',
                checked: state.showPolyhedron,
                onChange: (e: any) => { state.showPolyhedron = e.target.checked },
                class: 'rounded border-white/20 bg-black/40 text-sky-400 accent-sky-400',
              }),
              'Polyhedron',
            ),
            H('label', { class: 'flex items-center gap-1.5 cursor-pointer text-zinc-300' },
              H('input', {
                type: 'checkbox',
                checked: state.autoRotate,
                onChange: (e: any) => { state.autoRotate = e.target.checked },
                class: 'rounded border-white/20 bg-black/40 text-amber-400 accent-amber-400',
              }),
              'Rotate',
            ),
          ),
          // Model Style
          H(
            'div',
            { class: 'mt-2 flex rounded-md border border-white/10 p-0.5 bg-[#070b13]' },
            ...(['ball-stick', 'space-filling', 'wireframe'] as ModelStyle[]).map((st) => {
              const label = st === 'ball-stick' ? 'Ball & Stick' : st === 'space-filling' ? 'Space Filling' : 'Wireframe'
              return H(
                'button',
                {
                  key: st,
                  type: 'button',
                  onClick: () => { state.modelStyle = st },
                  class: `flex-1 rounded py-1 text-[10.5px] font-medium transition ${
                    state.modelStyle === st ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
                  }`,
                },
                label,
              )
            }),
          ),
        ),
      ),
      // Right 3D Visualizer & Parameters
      H(
        'div',
        { class: 'space-y-4' },
        // Native custom element <elementa-vsepr-view>
        H(
          'div',
          { class: 'relative h-[440px] w-full overflow-hidden rounded-xl border border-white/10 bg-[#060911]' },
          H('elementa-vsepr-view', {
            class: 'block h-full w-full',
            'data-central': String(state.centralZ),
            'data-ligand': String(state.ligandZ),
            'data-bp': String(state.bp),
            'data-lp': String(state.lp),
            'data-angle': String(state.angle),
            'data-show-lp': String(state.showLonePairs),
            'data-show-dipole': String(state.showDipole),
            'data-show-poly': String(state.showPolyhedron),
            'data-style': state.modelStyle,
            'data-rotate': String(state.autoRotate),
          }),
          H('div', { class: 'pointer-events-none absolute bottom-2.5 left-3 font-mono text-[9px] text-zinc-500 backdrop-blur-sm bg-black/40 px-2 py-1 rounded' }, 'Drag to rotate · Scroll to zoom · Right-click to pan'),
        ),
        // Stat Cards
        H(
          'div',
          { class: 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6' },
          StatCard({ label: 'Steric Number', value: String(geometry.stericNumber), sub: `${state.bp} BP + ${state.lp} LP` }),
          StatCard({ label: 'Shape', value: geometry.molecularShape, tint: '#fde047', sub: geometry.electronGeometry }),
          StatCard({ label: 'Hybridization', value: geometry.hybridization, tint: '#38bdf8', sub: 'valence hybrid' }),
          StatCard({ label: 'Bond Angle', value: `${geometry.actualAngle}°`, sub: `ideal ${geometry.idealAngle}°` }),
          StatCard({ label: 'Net Dipole (μ)', value: `${geometry.dipoleMagnitudeDebye} D`, tint: '#fbbf24', sub: 'Debye units' }),
          StatCard({
            label: 'Polarity',
            value: geometry.isPolar ? 'Polar' : 'Nonpolar',
            tint: geometry.isPolar ? '#fbbf24' : '#34d399',
            sub: geometry.isPolar ? 'Asymmetric dipole' : 'Dipoles cancel',
          }),
        ),
      ),
    ),
  )
}
