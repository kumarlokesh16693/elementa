/**
 * ELEMENTA — Particle Physics & Feynman Diagram Lab
 * Page Component: /particle
 *
 * Interactive laboratory for Standard Model particle physics:
 *   - Tab 1: Standard Model Particle Matrix (Quarks, Leptons, Gauge Bosons, Higgs)
 *   - Tab 2: Feynman Diagram Studio with Live Vertex Conservation Validator
 *   - Tab 3: Relativistic Breit–Wigner Resonance & Collider Cross Sections
 *   - Tab 4: Decay Chains & Precision Branching Fractions
 */

import { h, reactive, type VNode } from 'nexus-framework'
import '@/components/particle/feynman-element'
import type { ElementaFeynmanElement } from '@/components/particle/feynman-element'
import {
  STANDARD_MODEL_PARTICLES,
  SM_PRIMARY_KEYS,
  getParticle,
  FEYNMAN_PRESETS,
  checkDiagramConservation,
  RESONANCE_CATALOG,
  computeResonanceCurve,
  DECAY_PROFILES,
  type Particle,
  type FeynmanPreset,
  type ParticleKind,
} from '@/lib/particle'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

type TabId = 'matrix' | 'feynman' | 'resonance' | 'decays'

const state = reactive({
  activeTab: 'matrix' as TabId,

  // Tab 1: Particle Matrix State
  selectedParticleId: 'u',
  particleFilter: 'all' as 'all' | ParticleKind,
  showAntiparticles: false,

  // Tab 2: Feynman Studio State
  selectedPresetId: 'ee_to_mumu',
  selectedChannel: 's-channel',
  selectedVertexId: null as string | null,
  animatingFeynman: true,

  // Tab 3: Breit-Wigner State
  selectedResonanceId: 'z_zero',
  energySliderPercent: 50, // 0..100 across the curve

  // Tab 4: Decay Chains State
  selectedDecayProfileId: 'higgs',
})

function getFeynmanElement(): ElementaFeynmanElement | null {
  return typeof document !== 'undefined'
    ? (document.querySelector('elementa-feynman') as ElementaFeynmanElement | null)
    : null
}

function selectPreset(presetId: string): void {
  state.selectedPresetId = presetId
  const preset = FEYNMAN_PRESETS[presetId]
  if (preset) {
    state.selectedChannel = preset.defaultChannel
    state.selectedVertexId = null
    const el = getFeynmanElement()
    if (el) el.setPreset(presetId, preset.defaultChannel)
  }
}

function selectChannel(channel: string): void {
  state.selectedChannel = channel
  const el = getFeynmanElement()
  if (el) el.setChannel(channel)
}

function toggleFeynmanAnimation(): void {
  state.animatingFeynman = !state.animatingFeynman
  const el = getFeynmanElement()
  if (el) el.toggleAnimation(state.animatingFeynman)
}

// ----------------------------------------------------------------------------
// View: Tab 1 — Standard Model Particle Matrix
// ----------------------------------------------------------------------------

function ParticleMatrixView(): VNode {
  const currentParticle = getParticle(
    state.showAntiparticles
      ? STANDARD_MODEL_PARTICLES[state.selectedParticleId]?.antiparticleId || state.selectedParticleId
      : state.selectedParticleId,
  )

  const kinds: Array<{ key: 'all' | ParticleKind; label: string }> = [
    { key: 'all', label: 'All Particles' },
    { key: 'quark', label: 'Quarks' },
    { key: 'lepton', label: 'Leptons' },
    { key: 'gauge_boson', label: 'Gauge Bosons' },
    { key: 'scalar_boson', label: 'Higgs Boson' },
  ]

  // Group primary particles into SM structural sections
  const quarksGen1 = ['u', 'd']
  const quarksGen2 = ['c', 's']
  const quarksGen3 = ['t', 'b']
  const leptonsGen1 = ['e_minus', 'nu_e']
  const leptonsGen2 = ['mu_minus', 'nu_mu']
  const leptonsGen3 = ['tau_minus', 'nu_tau']
  const bosons = ['gamma', 'gluon', 'w_plus', 'w_minus', 'z_zero', 'higgs']

  function renderParticleCard(id: string): VNode {
    const rawP = getParticle(id)
    const p = state.showAntiparticles ? getParticle(rawP.antiparticleId) : rawP
    const isSelected = currentParticle.id === p.id || state.selectedParticleId === rawP.id

    let borderTint = 'border-white/10 hover:border-white/20'
    let bgTint = 'bg-[#0b101b]'
    let textTint = 'text-zinc-200'
    let badgeTint = 'bg-zinc-800 text-zinc-300'

    if (p.kind === 'quark') {
      borderTint = isSelected ? 'border-indigo-400 bg-indigo-500/15' : 'border-indigo-500/25 hover:border-indigo-400/50'
      bgTint = isSelected ? 'bg-indigo-950/40' : 'bg-[#0d1024]'
      textTint = 'text-indigo-200'
      badgeTint = 'bg-indigo-500/20 text-indigo-300'
    } else if (p.kind === 'lepton') {
      borderTint = isSelected ? 'border-emerald-400 bg-emerald-500/15' : 'border-emerald-500/25 hover:border-emerald-400/50'
      bgTint = isSelected ? 'bg-emerald-950/40' : 'bg-[#0a1614]'
      textTint = 'text-emerald-200'
      badgeTint = 'bg-emerald-500/20 text-emerald-300'
    } else if (p.kind === 'gauge_boson') {
      borderTint = isSelected ? 'border-amber-400 bg-amber-500/15' : 'border-amber-500/25 hover:border-amber-400/50'
      bgTint = isSelected ? 'bg-amber-950/40' : 'bg-[#18130a]'
      textTint = 'text-amber-200'
      badgeTint = 'bg-amber-500/20 text-amber-300'
    } else if (p.kind === 'scalar_boson') {
      borderTint = isSelected ? 'border-cyan-400 bg-cyan-500/15' : 'border-cyan-500/25 hover:border-cyan-400/50'
      bgTint = isSelected ? 'bg-cyan-950/40' : 'bg-[#08151b]'
      textTint = 'text-cyan-200'
      badgeTint = 'bg-cyan-500/20 text-cyan-300'
    }

    return H(
      'button',
      {
        key: p.id,
        type: 'button',
        onclick: () => {
          state.selectedParticleId = rawP.id
        },
        class: `relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200 group ${borderTint} ${bgTint} ${
          isSelected ? 'shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-white/20' : ''
        }`,
      },
      // Top Row: Mass & Generation
      H(
        'div',
        { class: 'flex items-center justify-between text-[10px] font-mono' },
        H('span', { class: 'text-zinc-400 truncate max-w-[90px]' }, p.massDisplay),
        p.generation
          ? H('span', { class: `rounded px-1.5 py-0.2 text-[9px] font-semibold ${badgeTint}` }, `Gen ${p.generation}`)
          : H('span', { class: `rounded px-1.5 py-0.2 text-[9px] font-semibold ${badgeTint}` }, p.kind === 'scalar_boson' ? 'Scalar' : 'Gauge'),
      ),
      // Center: Giant Symbol & Name
      H(
        'div',
        { class: 'my-2.5 text-center' },
        H(
          'div',
          { class: `font-serif text-3xl font-bold tracking-tight transition-transform duration-150 group-hover:scale-110 ${textTint}` },
          p.symbol,
        ),
        H('div', { class: 'text-[11px] font-medium text-zinc-300 mt-1 truncate' }, p.name),
      ),
      // Bottom Row: Charge & Spin
      H(
        'div',
        { class: 'flex items-center justify-between border-t border-white/5 pt-1.5 text-[10px] font-mono text-zinc-400' },
        H('span', null, `Q: ${p.charge > 0 ? '+' : ''}${p.charge === 2/3 ? '2/3' : p.charge === -1/3 ? '-1/3' : p.charge === -2/3 ? '-2/3' : p.charge === 1/3 ? '1/3' : p.charge}`),
        H('span', null, `J: ${p.spin === 0.5 ? '½' : p.spin}`),
      ),
    )
  }

  return H(
    'div',
    { class: 'flex flex-1 min-h-0 overflow-hidden' },

    // Left Matrix Area
    H(
      'div',
      { class: 'flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar' },

      // Filter Toolbar
      H(
        'div',
        { class: 'flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#090d16] p-2.5' },
        H(
          'div',
          { class: 'flex flex-wrap items-center gap-1.5' },
          kinds.map((k) =>
            H(
              'button',
              {
                key: k.key,
                type: 'button',
                onclick: () => {
                  state.particleFilter = k.key
                },
                class: `rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                  state.particleFilter === k.key
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`,
              },
              k.label,
            ),
          ),
        ),
        H(
          'button',
          {
            type: 'button',
            onclick: () => {
              state.showAntiparticles = !state.showAntiparticles
            },
            class: `flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${
              state.showAntiparticles
                ? 'border-fuchsia-500/50 bg-fuchsia-500/20 text-fuchsia-200'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
            }`,
          },
          H('span', { class: state.showAntiparticles ? 'text-fuchsia-400 font-bold' : '' }, '☯ Antiparticles Mode'),
          H(
            'span',
            { class: `text-[10px] font-mono px-1 rounded ${state.showAntiparticles ? 'bg-fuchsia-500/30' : 'bg-black/30'}` },
            state.showAntiparticles ? 'ON' : 'OFF',
          ),
        ),
      ),

      // Canonical Standard Model Columns
      H(
        'div',
        { class: 'space-y-4' },

        // Quarks Section
        state.particleFilter === 'all' || state.particleFilter === 'quark'
          ? H(
              'div',
              { class: 'rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3.5 space-y-2' },
              H(
                'div',
                { class: 'flex items-center justify-between' },
                H('div', { class: 'text-[11px] font-bold uppercase tracking-wider text-indigo-300' }, 'Quarks (Spin ½, Color Triplet, Baryon Number B = ⅓)'),
                H('div', { class: 'text-[10px] text-zinc-500 font-mono' }, 'Generations I, II, III'),
              ),
              H(
                'div',
                { class: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5' },
                [...quarksGen1, ...quarksGen2, ...quarksGen3].map((id) => renderParticleCard(id)),
              ),
            )
          : null,

        // Leptons Section
        state.particleFilter === 'all' || state.particleFilter === 'lepton'
          ? H(
              'div',
              { class: 'rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 space-y-2' },
              H(
                'div',
                { class: 'flex items-center justify-between' },
                H('div', { class: 'text-[11px] font-bold uppercase tracking-wider text-emerald-300' }, 'Leptons (Spin ½, Color Singlet, Baryon Number B = 0)'),
                H('div', { class: 'text-[10px] text-zinc-500 font-mono' }, 'Generations I, II, III'),
              ),
              H(
                'div',
                { class: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5' },
                [...leptonsGen1, ...leptonsGen2, ...leptonsGen3].map((id) => renderParticleCard(id)),
              ),
            )
          : null,

        // Gauge & Scalar Bosons Section
        state.particleFilter === 'all' || state.particleFilter === 'gauge_boson' || state.particleFilter === 'scalar_boson'
          ? H(
              'div',
              { class: 'rounded-xl border border-amber-500/20 bg-amber-950/10 p-3.5 space-y-2' },
              H(
                'div',
                { class: 'flex items-center justify-between' },
                H('div', { class: 'text-[11px] font-bold uppercase tracking-wider text-amber-300' }, 'Force Mediators & Higgs (Spin 1 Vector Bosons & Spin 0 Scalar)'),
                H('div', { class: 'text-[10px] text-zinc-500 font-mono' }, 'SU(3) × SU(2)_L × U(1)_Y Gauge Group'),
              ),
              H(
                'div',
                { class: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5' },
                bosons
                  .filter((id) => {
                    const p = getParticle(id)
                    if (state.particleFilter === 'gauge_boson') return p.kind === 'gauge_boson'
                    if (state.particleFilter === 'scalar_boson') return p.kind === 'scalar_boson'
                    return true
                  })
                  .map((id) => renderParticleCard(id)),
              ),
            )
          : null,
      ),
    ),

    // Right Inspector Sidebar (360px)
    H(
      'aside',
      { class: 'w-[360px] shrink-0 border-l border-white/10 bg-[#090d16] p-4 overflow-y-auto space-y-4 custom-scrollbar text-[12px]' },

      // Particle Header Banner
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center' },
        H('div', { class: 'font-serif text-5xl font-bold tracking-tight text-white mb-1' }, currentParticle.symbol),
        H('div', { class: 'text-base font-semibold text-zinc-200' }, currentParticle.name),
        H(
          'div',
          { class: 'flex items-center justify-center gap-1.5 mt-2' },
          H('span', { class: 'rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-zinc-300 capitalize' }, currentParticle.kind.replace('_', ' ')),
          currentParticle.generation
            ? H('span', { class: 'rounded-full border border-indigo-400/30 bg-indigo-400/10 px-2.5 py-0.5 text-[10px] font-mono text-indigo-300' }, `Generation ${currentParticle.generation}`)
            : null,
          currentParticle.isAntiparticle
            ? H('span', { class: 'rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-0.5 text-[10px] font-mono text-fuchsia-300' }, 'Antiparticle')
            : null,
        ),
      ),

      // Quantum Numbers Grid
      H(
        'div',
        { class: 'space-y-2' },
        H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Quantum Numbers & PDG Properties'),
        H(
          'div',
          { class: 'grid grid-cols-2 gap-2' },
          [
            { label: 'PDG Mass', val: currentParticle.massDisplay, tint: '#38bdf8' },
            { label: 'Electric Charge Q', val: `${currentParticle.charge > 0 ? '+' : ''}${currentParticle.charge.toFixed(3)} e`, tint: '#fbbf24' },
            { label: 'Spin J', val: currentParticle.spin === 0.5 ? '½ ħ' : `${currentParticle.spin} ħ`, tint: '#a78bfa' },
            { label: 'Color Charge', val: currentParticle.color, tint: '#fb923c' },
            { label: 'Baryon Number B', val: currentParticle.baryonNumber.toFixed(3), tint: '#e2e8f0' },
            { label: 'Weak Isospin T₃', val: `${currentParticle.weakIsospin3 > 0 ? '+' : ''}${currentParticle.weakIsospin3.toFixed(1)}`, tint: '#34d399' },
            { label: 'Lepton Numbers', val: `(${currentParticle.leptonE}, ${currentParticle.leptonMu}, ${currentParticle.leptonTau})`, tint: '#ec4899' },
            { label: 'Lifetime τ / Width', val: currentParticle.lifetimeDisplay, tint: '#f43f5e' },
          ].map((item) =>
            H(
              'div',
              { key: item.label, class: 'rounded-lg border border-white/5 bg-white/[0.02] p-2' },
              H('div', { class: 'text-[9.5px] uppercase tracking-wider text-zinc-500' }, item.label),
              H('div', { class: 'font-mono text-[12px] font-medium truncate mt-0.5', style: { color: item.tint } }, item.val),
            ),
          ),
        ),
      ),

      // Fundamental Interactions
      H(
        'div',
        { class: 'space-y-1.5' },
        H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Fundamental Gauge Couplings'),
        H(
          'div',
          { class: 'flex flex-wrap gap-1.5' },
          ['EM', 'Weak', 'Strong', 'Higgs'].map((intType) => {
            const has = (currentParticle.interactionTypes as string[]).includes(intType)
            return H(
              'span',
              {
                key: intType,
                class: `rounded-md border px-2 py-1 text-[10.5px] font-medium font-mono ${
                  has
                    ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-300'
                    : 'border-white/5 bg-white/[0.02] text-zinc-600 line-through'
                }`,
              },
              intType === 'EM' ? 'Electromagnetic (γ)' : intType === 'Weak' ? 'Weak SU(2) (W/Z)' : intType === 'Strong' ? 'Strong SU(3) (g)' : 'Higgs Yukawa',
            )
          }),
        ),
      ),

      // Physics Significance Description
      H(
        'div',
        { class: 'rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-1' },
        H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Standard Model Role'),
        H('p', { class: 'text-[11.5px] text-zinc-300 leading-relaxed' }, currentParticle.description),
        H(
          'div',
          { class: 'pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-white/5' },
          H('span', null, `Discovered: ${currentParticle.discoveryYear}`),
          H('span', null, currentParticle.discoveryLab),
        ),
      ),

      // Dominant Decays if applicable
      currentParticle.dominantDecays && currentParticle.dominantDecays.length > 0
        ? H(
            'div',
            { class: 'space-y-2' },
            H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Dominant Decay Modes'),
            H(
              'div',
              { class: 'space-y-1.5' },
              currentParticle.dominantDecays.map((d) =>
                H(
                  'div',
                  { key: d.mode, class: 'rounded-lg border border-white/5 bg-white/[0.02] p-2 flex items-center justify-between font-mono text-[11px]' },
                  H('span', { class: 'text-zinc-300' }, d.mode),
                  H('span', { class: 'text-cyan-300 font-semibold' }, `${(d.fraction * 100).toFixed(1)}%`),
                ),
              ),
            ),
          )
        : null,
    ),
  )
}

// ----------------------------------------------------------------------------
// View: Tab 2 — Feynman Diagram Studio
// ----------------------------------------------------------------------------

function FeynmanStudioView(): VNode {
  const currentPreset = FEYNMAN_PRESETS[state.selectedPresetId] || FEYNMAN_PRESETS.ee_to_mumu
  const diagResult = checkDiagramConservation(currentPreset)
  const selectedVertex = state.selectedVertexId
    ? currentPreset.vertices.find((v) => v.id === state.selectedVertexId)
    : null
  const selectedVertexCons = selectedVertex
    ? diagResult.vertexResults[selectedVertex.id]
    : null

  const presetsList = Object.values(FEYNMAN_PRESETS)

  return H(
    'div',
    { class: 'flex flex-1 min-h-0 overflow-hidden' },

    // Left Presets & Controls Sidebar (280px)
    H(
      'aside',
      { class: 'w-[280px] shrink-0 border-r border-white/10 bg-[#090d16] p-3.5 overflow-y-auto space-y-4 custom-scrollbar text-[11px]' },

      // Presets List
      H(
        'div',
        { class: 'space-y-1.5' },
        H(
          'div',
          { class: 'flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400' },
          'Feynman Presets',
          H('span', { class: 'text-[9px] text-zinc-500 font-mono font-normal' }, `${presetsList.length} processes`),
        ),
        H(
          'div',
          { class: 'grid grid-cols-1 gap-1' },
          presetsList.map((p) =>
            H(
              'button',
              {
                key: p.id,
                type: 'button',
                onclick: () => selectPreset(p.id),
                class: `flex flex-col rounded-lg border p-2 text-left transition ${
                  state.selectedPresetId === p.id
                    ? 'border-indigo-400/60 bg-indigo-500/15 text-indigo-200'
                    : 'border-white/5 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                }`,
              },
              H('div', { class: 'font-medium truncate' }, p.name),
              H('div', { class: 'text-[9.5px] font-mono text-zinc-500 mt-0.5 truncate' }, p.equation),
            ),
          ),
        ),
      ),

      // Channel Selector (if multiple available)
      currentPreset.availableChannels.length > 1
        ? H(
            'div',
            { class: 'space-y-1.5' },
            H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Kinematic Channel'),
            H(
              'div',
              { class: 'grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/30 p-0.5' },
              currentPreset.availableChannels.map((ch) =>
                H(
                  'button',
                  {
                    key: ch,
                    type: 'button',
                    onclick: () => selectChannel(ch),
                    class: `rounded py-1 text-center text-[10.5px] font-medium capitalize transition ${
                      state.selectedChannel === ch
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`,
                  },
                  ch,
                ),
              ),
            ),
          )
        : null,

      // Canvas Animation Toggle
      H(
        'div',
        { class: 'space-y-2 pt-2 border-t border-white/5' },
        H(
          'button',
          {
            type: 'button',
            onclick: toggleFeynmanAnimation,
            class: `w-full rounded-lg border px-3 py-1.5 text-center text-[11px] font-medium transition ${
              state.animatingFeynman
                ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
            }`,
          },
          state.animatingFeynman ? '⏸ Pause Propagator Motion' : '▶ Animate Propagator Flow',
        ),
      ),

      // Physics Notes Card
      H(
        'div',
        { class: 'rounded-lg border border-white/10 bg-white/[0.02] p-2.5 space-y-1' },
        H('div', { class: 'text-[9.5px] font-bold uppercase tracking-wider text-zinc-400' }, 'Process Physics'),
        H('p', { class: 'text-[11px] text-zinc-400 leading-relaxed' }, currentPreset.physicsNotes),
      ),
    ),

    // Center Canvas Area
    H(
      'div',
      { class: 'flex-1 flex flex-col min-w-0 p-4 space-y-3' },

      // Interactive Web Component Canvas
      H(
        'div',
        { class: 'flex-1 min-h-[350px] relative' },
        H('elementa-feynman', {
          preset: state.selectedPresetId,
          channel: state.selectedChannel,
          animating: String(state.animatingFeynman),
          onvertexselect: (e: any) => {
            const v = e.detail?.vertex
            state.selectedVertexId = v ? v.id : null
          },
        }),
      ),

      // Amplitude LaTeX Equation Card
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#090d16] p-3' },
        H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1' }, 'Scattering Amplitude Matrix Element iℳ'),
        H('div', { class: 'font-mono text-[11.5px] text-cyan-300 overflow-x-auto whitespace-pre p-2 rounded bg-black/40 border border-white/5' }, currentPreset.amplitudeLaTeX),
      ),
    ),

    // Right Conservation Validator Sidebar (320px)
    H(
      'aside',
      { class: 'w-[320px] shrink-0 border-l border-white/10 bg-[#090d16] p-4 overflow-y-auto space-y-4 custom-scrollbar text-[12px]' },

      // Global Diagram Conservation Status
      H(
        'div',
        {
          class: `rounded-xl border p-3 ${
            diagResult.valid
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`,
        },
        H(
          'div',
          { class: 'flex items-center gap-2 font-bold text-[12px]' },
          H('span', null, diagResult.valid ? '✓' : '✗'),
          diagResult.valid ? 'All Conservation Laws Satisfied' : 'Conservation Violation Detected',
        ),
        H(
          'div',
          { class: 'mt-1 text-[10.5px] text-zinc-300' },
          diagResult.valid
            ? 'Verified: Electric Charge Q, Lepton Numbers (Le, Lμ, Lτ), Baryon Number B, and Color Flow.'
            : diagResult.errors.join('; '),
        ),
      ),

      // Vertex Detail Inspector
      selectedVertex && selectedVertexCons
        ? H(
            'div',
            { class: 'space-y-3 rounded-xl border border-indigo-400/30 bg-indigo-950/20 p-3' },
            H(
              'div',
              { class: 'flex items-center justify-between' },
              H('div', { class: 'font-bold text-indigo-300' }, `Selected: ${selectedVertex.label}`),
              H('span', { class: 'rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9.5px] font-mono text-indigo-300' }, selectedVertex.interaction),
            ),
            H(
              'div',
              { class: 'text-[11px] font-mono text-zinc-300' },
              `Coupling: ${selectedVertex.couplingLabel}`,
            ),
            // Vertex Balance Breakdown
            H(
              'div',
              { class: 'space-y-1.5 pt-2 border-t border-white/10' },
              [
                { label: 'Charge Conservation', val: `Qin: ${selectedVertexCons.chargeIn.toFixed(2)} = Qout: ${selectedVertexCons.chargeOut.toFixed(2)}`, ok: selectedVertexCons.deltaQ === 0 },
                { label: 'Electron Lepton Le', val: `Le,in: ${selectedVertexCons.leptonEIn} = Le,out: ${selectedVertexCons.leptonEOut}`, ok: selectedVertexCons.deltaLe === 0 },
                { label: 'Muon Lepton Lμ', val: `Lμ,in: ${selectedVertexCons.leptonMuIn} = Lμ,out: ${selectedVertexCons.leptonMuOut}`, ok: selectedVertexCons.deltaLmu === 0 },
                { label: 'Tau Lepton Lτ', val: `Lτ,in: ${selectedVertexCons.leptonTauIn} = Lτ,out: ${selectedVertexCons.leptonTauOut}`, ok: selectedVertexCons.deltaLtau === 0 },
                { label: 'Baryon Number B', val: `Bin: ${selectedVertexCons.baryonIn.toFixed(2)} = Bout: ${selectedVertexCons.baryonOut.toFixed(2)}`, ok: selectedVertexCons.deltaB === 0 },
                { label: 'Color Flow Balance', val: selectedVertexCons.colorValid ? 'Conserved' : 'Unbalanced', ok: selectedVertexCons.colorValid },
              ].map((c) =>
                H(
                  'div',
                  { key: c.label, class: 'flex items-center justify-between rounded bg-black/30 px-2 py-1 text-[10.5px] font-mono' },
                  H('span', { class: 'text-zinc-400' }, c.label),
                  H('span', { class: c.ok ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold' }, `${c.ok ? '✓' : '✗'} ${c.val}`),
                ),
              ),
            ),
          )
        : H(
            'div',
            { class: 'rounded-xl border border-dashed border-white/10 p-3 text-center text-zinc-500 text-[11px]' },
            'Click on any vertex node (V₁, V₂, ...) on the canvas to inspect its balance in detail.',
          ),

      // Feynman Rules Reference
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2' },
        H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Feynman Propagator Rules'),
        H(
          'div',
          { class: 'space-y-1.5 text-[10px] font-mono' },
          H('div', { class: 'p-1.5 rounded bg-black/40 text-sky-300' }, 'Fermion: i(p̸ + m) / (p² - m² + iε)'),
          H('div', { class: 'p-1.5 rounded bg-black/40 text-amber-300' }, 'Photon: -i g_μν / (q² + iε)'),
          H('div', { class: 'p-1.5 rounded bg-black/40 text-purple-300' }, 'W/Z: -i(g_μν - q_μ q_ν / M²) / (q² - M² + iε)'),
          H('div', { class: 'p-1.5 rounded bg-black/40 text-orange-300' }, 'Gluon: -i δ_ab g_μν / (q² + iε)'),
        ),
      ),
    ),
  )
}

// ----------------------------------------------------------------------------
// View: Tab 3 — Breit–Wigner Resonance & Collider Physics
// ----------------------------------------------------------------------------

function BreitWignerResonanceView(): VNode {
  const curveData = computeResonanceCurve(state.selectedResonanceId, 300)
  const p = curveData.params

  const resList = Object.values(RESONANCE_CATALOG)

  // Compute selected energy point based on slider percent
  const Emin = p.defaultEmin
  const Emax = p.defaultEmax
  const currentE = Emin + (state.energySliderPercent / 100) * (Emax - Emin)
  const currentSigma = curveData.points.reduce((prev, curr) =>
    Math.abs(curr.E - currentE) < Math.abs(prev.E - currentE) ? curr : prev,
  ).sigma

  return H(
    'div',
    { class: 'flex flex-1 min-h-0 overflow-hidden' },

    // Left Controls Sidebar (280px)
    H(
      'aside',
      { class: 'w-[280px] shrink-0 border-r border-white/10 bg-[#090d16] p-3.5 overflow-y-auto space-y-4 custom-scrollbar text-[11px]' },

      // Resonance Selector
      H(
        'div',
        { class: 'space-y-1.5' },
        H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Collider Resonances'),
        H(
          'div',
          { class: 'grid grid-cols-1 gap-1' },
          resList.map((r) =>
            H(
              'button',
              {
                key: r.id,
                type: 'button',
                onclick: () => {
                  state.selectedResonanceId = r.id
                  state.energySliderPercent = 50 // Reset to peak center
                },
                class: `flex flex-col rounded-lg border p-2 text-left transition ${
                  state.selectedResonanceId === r.id
                    ? 'border-indigo-400/60 bg-indigo-500/15 text-indigo-200'
                    : 'border-white/5 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                }`,
              },
              H('div', { class: 'font-medium' }, r.name),
              H('div', { class: 'text-[9.5px] font-mono text-zinc-500 mt-0.5' }, `M = ${r.massGeV.toFixed(4)} GeV · Γ = ${(r.widthGeV < 0.01 ? r.widthGeV * 1000 : r.widthGeV).toFixed(2)} ${r.widthGeV < 0.01 ? 'MeV' : 'GeV'}`),
            ),
          ),
        ),
      ),

      // Center-of-Mass Energy Slider
      H(
        'div',
        { class: 'space-y-2 pt-2 border-t border-white/5' },
        H(
          'div',
          { class: 'flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400' },
          H('span', null, 'Center-of-Mass √s'),
          H('span', { class: 'font-mono text-cyan-300 font-semibold' }, `${currentE.toFixed(4)} GeV`),
        ),
        H('input', {
          type: 'range',
          min: '0',
          max: '100',
          step: '0.1',
          value: String(state.energySliderPercent),
          oninput: (e: any) => {
            state.energySliderPercent = Number.parseFloat(e.target.value)
          },
          class: 'w-full accent-cyan-400 cursor-pointer',
        }),
        H(
          'div',
          { class: 'flex justify-between text-[9.5px] font-mono text-zinc-500' },
          H('span', null, `${Emin.toFixed(2)} GeV`),
          H('span', null, `${Emax.toFixed(2)} GeV`),
        ),
      ),

      // Historical Notes
      H(
        'div',
        { class: 'rounded-lg border border-white/10 bg-white/[0.02] p-2.5 space-y-1' },
        H('div', { class: 'text-[9.5px] font-bold uppercase tracking-wider text-zinc-400' }, 'Collider Discovery'),
        H('p', { class: 'text-[11px] text-zinc-400 leading-relaxed' }, p.notes),
        H(
          'div',
          { class: 'pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-white/5' },
          H('span', null, `Facility: ${p.collider}`),
          H('span', null, `Year: ${p.discoveryYear}`),
        ),
      ),
    ),

    // Center Dynamic Relativistic Breit–Wigner Canvas/Plot
    H(
      'div',
      { class: 'flex-1 flex flex-col min-w-0 p-4 space-y-3' },

      // Plot Header
      H(
        'div',
        { class: 'flex items-center justify-between rounded-xl border border-white/10 bg-[#090d16] px-4 py-2.5' },
        H(
          'div',
          null,
          H('div', { class: 'text-[13px] font-bold text-zinc-100' }, `${p.name} Line Shape σ(E)`),
          H('div', { class: 'text-[10px] font-mono text-cyan-400' }, `Channel: ${p.channelName}`),
        ),
        H(
          'div',
          { class: 'text-right font-mono' },
          H('div', { class: 'text-[10px] text-zinc-500' }, 'Current Cross Section'),
          H('div', { class: 'text-[14px] font-bold text-cyan-300' }, `${currentSigma >= 1000 ? (currentSigma / 1000).toFixed(2) + ' μb' : currentSigma.toFixed(2) + ' nb'}`),
        ),
      ),

      // SVG Interactive Curve Plot
      H(
        'div',
        { class: 'flex-1 min-h-[350px] rounded-xl border border-white/10 bg-[#090d16] p-4 flex flex-col justify-center' },
        (() => {
          // Normalize points into SVG viewBox 0 0 800 400
          const maxSigma = curveData.peakSigma * 1.15 || 1
          const pathPoints = curveData.points.map((pt, i) => {
            const x = 50 + (i / (curveData.points.length - 1)) * 700
            const y = 350 - (pt.sigma / maxSigma) * 300
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
          }).join(' ')

          // Peak point x, y
          const peakX = 50 + ((curveData.peakE - Emin) / (Emax - Emin)) * 700
          const peakY = 350 - (curveData.peakSigma / maxSigma) * 300

          // Cursor point x, y
          const cursorX = 50 + (state.energySliderPercent / 100) * 700
          const cursorY = 350 - (currentSigma / maxSigma) * 300

          // Half max line y
          const halfY = 350 - (curveData.halfMax / maxSigma) * 300

          return H(
            'svg',
            {
              viewBox: '0 0 800 400',
              class: 'w-full h-full block select-none',
            },
            // Grid lines
            H('line', { x1: '50', y1: '350', x2: '750', y2: '350', stroke: 'rgba(255,255,255,0.2)', 'stroke-width': '1.5' }),
            H('line', { x1: '50', y1: '50', x2: '50', y2: '350', stroke: 'rgba(255,255,255,0.2)', 'stroke-width': '1.5' }),

            // Horizontal FWHM guideline
            H('line', {
              x1: '50',
              y1: String(halfY),
              x2: '750',
              y2: String(halfY),
              stroke: 'rgba(244, 63, 94, 0.4)',
              'stroke-dasharray': '4 4',
              'stroke-width': '1',
            }),
            H('text', { x: '58', y: String(halfY - 6), fill: '#fb7185', 'font-size': '10', 'font-family': 'monospace' }, `Half Max σ_max / 2 (FWHM = Γ ≈ ${(p.widthGeV < 0.01 ? p.widthGeV * 1000 : p.widthGeV).toFixed(2)} ${p.widthGeV < 0.01 ? 'MeV' : 'GeV'})`),

            // Breit Wigner Filled Gradient Path
            H('path', {
              d: `${pathPoints} L 750 350 L 50 350 Z`,
              fill: 'rgba(56, 189, 248, 0.1)',
            }),

            // Breit Wigner Stroke Line
            H('path', {
              d: pathPoints,
              fill: 'none',
              stroke: '#38bdf8',
              'stroke-width': '2.5',
            }),

            // Invariant Mass Peak Vertical Guideline
            H('line', {
              x1: String(peakX),
              y1: '50',
              x2: String(peakX),
              y2: '350',
              stroke: 'rgba(56, 189, 248, 0.4)',
              'stroke-dasharray': '3 3',
              'stroke-width': '1',
            }),
            H('circle', { cx: String(peakX), cy: String(peakY), r: '5', fill: '#38bdf8' }),
            H('text', { x: String(peakX + 8), y: String(peakY + 4), fill: '#7dd3fc', 'font-size': '11', 'font-weight': 'bold', 'font-family': 'monospace' }, `Peak M = ${p.massGeV.toFixed(4)} GeV`),

            // User Interactive Cursor Marker
            H('line', {
              x1: String(cursorX),
              y1: '50',
              x2: String(cursorX),
              y2: '350',
              stroke: 'rgba(234, 179, 8, 0.8)',
              'stroke-width': '1.5',
            }),
            H('circle', { cx: String(cursorX), cy: String(cursorY), r: '6', fill: '#eab308', stroke: '#ffffff', 'stroke-width': '1.5' }),

            // Axis ticks & labels
            H('text', { x: '50', y: '370', fill: '#94a3b8', 'font-size': '10', 'font-family': 'monospace' }, `${Emin.toFixed(2)} GeV`),
            H('text', { x: '400', y: '385', fill: '#cbd5e1', 'font-size': '11', 'font-weight': 'bold', 'font-family': 'monospace', 'text-anchor': 'middle' }, 'Center of Mass Energy √s (GeV)'),
            H('text', { x: '750', y: '370', fill: '#94a3b8', 'font-size': '10', 'font-family': 'monospace', 'text-anchor': 'end' }, `${Emax.toFixed(2)} GeV`),
            H('text', { x: '45', y: '45', fill: '#94a3b8', 'font-size': '10', 'font-family': 'monospace', 'text-anchor': 'end' }, 'Cross Section σ'),
          )
        })(),
      ),
    ),

    // Right Observables Sidebar (320px)
    H(
      'aside',
      { class: 'w-[320px] shrink-0 border-l border-white/10 bg-[#090d16] p-4 overflow-y-auto space-y-4 custom-scrollbar text-[12px]' },

      H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Resonance Invariant Parameters'),

      H(
        'div',
        { class: 'grid grid-cols-1 gap-2' },
        [
          { label: 'Invariant Pole Mass M', val: `${p.massGeV.toFixed(4)} GeV/c²`, tint: '#38bdf8' },
          { label: 'Total Decay Width Γ', val: `${(p.widthGeV < 0.01 ? p.widthGeV * 1000 : p.widthGeV).toFixed(4)} ${p.widthGeV < 0.01 ? 'MeV' : 'GeV'}`, tint: '#f43f5e' },
          { label: 'Mean Lifetime τ = ħ/Γ', val: `${curveData.lifetimeSec.toExponential(3)} s`, tint: '#fbbf24' },
          { label: 'Peak Cross Section σ₀', val: `${curveData.peakSigma >= 1000 ? (curveData.peakSigma / 1000).toFixed(2) + ' μb' : curveData.peakSigma.toFixed(2) + ' nb'}`, tint: '#34d399' },
          { label: 'Full Width Half Max (FWHM)', val: `${(curveData.fwhm < 0.01 ? curveData.fwhm * 1000 : curveData.fwhm).toFixed(3)} ${curveData.fwhm < 0.01 ? 'MeV' : 'GeV'}`, tint: '#a78bfa' },
        ].map((item) =>
          H(
            'div',
            { key: item.label, class: 'rounded-lg border border-white/5 bg-white/[0.02] p-2.5' },
            H('div', { class: 'text-[9.5px] uppercase tracking-wider text-zinc-500' }, item.label),
            H('div', { class: 'font-mono text-[13px] font-semibold mt-0.5', style: { color: item.tint } }, item.val),
          ),
        ),
      ),

      // Relativistic Breit Wigner Formula Card
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2' },
        H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Relativistic Breit–Wigner Formula'),
        H(
          'div',
          { class: 'font-mono text-[10.5px] text-zinc-300 p-2 rounded bg-black/40 border border-white/5 leading-relaxed' },
          'σ(E) = [12π (ħc)² / M²] ·\n       [ (Γ_in Γ_out) / ((E² - M²)² + M² Γ²) ]',
        ),
        H('p', { class: 'text-[10.5px] text-zinc-400 leading-normal' }, 'Describes unstable particle formation at relativistic colliders where decay width Γ is non-negligible compared to invariant mass M.'),
      ),
    ),
  )
}

// ----------------------------------------------------------------------------
// View: Tab 4 — Decay Chains & Branching Ratios
// ----------------------------------------------------------------------------

function DecayChainsView(): VNode {
  const profile = DECAY_PROFILES[state.selectedDecayProfileId] || DECAY_PROFILES.higgs
  const profilesList = Object.values(DECAY_PROFILES)

  return H(
    'div',
    { class: 'flex flex-1 min-h-0 overflow-hidden' },

    // Left Selector Sidebar (280px)
    H(
      'aside',
      { class: 'w-[280px] shrink-0 border-r border-white/10 bg-[#090d16] p-3.5 overflow-y-auto space-y-4 custom-scrollbar text-[11px]' },

      H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Unstable Particles'),
      H(
        'div',
        { class: 'grid grid-cols-1 gap-1' },
        profilesList.map((pr) =>
          H(
            'button',
            {
              key: pr.id,
              type: 'button',
              onclick: () => {
                state.selectedDecayProfileId = pr.id
              },
              class: `flex flex-col rounded-lg border p-2 text-left transition ${
                state.selectedDecayProfileId === pr.id
                  ? 'border-indigo-400/60 bg-indigo-500/15 text-indigo-200'
                  : 'border-white/5 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
              }`,
            },
            H('div', { class: 'font-medium' }, pr.name),
            H('div', { class: 'text-[9.5px] font-mono text-zinc-500 mt-0.5' }, `Γ = ${pr.totalWidthDisplay} · τ = ${pr.lifetimeDisplay}`),
          ),
        ),
      ),

      // Particle Properties
      H(
        'div',
        { class: 'rounded-lg border border-white/10 bg-white/[0.02] p-2.5 space-y-2 pt-2 border-t border-white/5' },
        H('div', { class: 'text-[9.5px] font-bold uppercase tracking-wider text-zinc-400' }, 'Parent Particle Summary'),
        H('div', { class: 'text-[11px] font-mono text-cyan-300' }, `Mass: ${profile.massDisplay}`),
        H('div', { class: 'text-[11px] font-mono text-rose-300' }, `Total Width: ${profile.totalWidthDisplay}`),
        H('div', { class: 'text-[11px] font-mono text-amber-300' }, `Mean Lifetime: ${profile.lifetimeDisplay}`),
      ),
    ),

    // Main Branching Fractions Breakdown
    H(
      'div',
      { class: 'flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar' },

      // Header Banner
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#090d16] p-4 flex items-center justify-between' },
        H(
          'div',
          null,
          H('div', { class: 'text-base font-bold text-zinc-100' }, `${profile.name} Branching Ratios`),
          H('div', { class: 'text-[11px] text-zinc-400 mt-0.5' }, 'Complete PDG decay channel distribution and partial widths.'),
        ),
        H('div', { class: 'font-mono text-3xl font-serif font-bold text-indigo-300' }, profile.symbol),
      ),

      // Visual Stacked Horizontal Fraction Bar
      H(
        'div',
        { class: 'rounded-xl border border-white/10 bg-[#090d16] p-4 space-y-2' },
        H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Relative Branching Fraction Stack'),
        H(
          'div',
          { class: 'h-8 w-full rounded-lg overflow-hidden flex shadow-inner border border-white/10' },
          profile.modes.map((m) =>
            H(
              'div',
              {
                key: m.channel,
                style: {
                  width: `${Math.max(m.branchingFraction * 100, 1.2)}%`,
                  backgroundColor: m.color,
                },
                class: 'h-full relative group transition-opacity hover:opacity-85',
                title: `${m.channel}: ${m.fractionDisplay}`,
              },
            ),
          ),
        ),
        H(
          'div',
          { class: 'flex flex-wrap gap-2 text-[10px] font-mono text-zinc-400 pt-1' },
          profile.modes.slice(0, 5).map((m) =>
            H(
              'div',
              { key: m.channel, class: 'flex items-center gap-1.5' },
              H('div', { class: 'w-2 h-2 rounded-full', style: { backgroundColor: m.color } }),
              H('span', null, `${m.channel} (${m.fractionDisplay})`),
            ),
          ),
        ),
      ),

      // Ranked List of All Decay Channels
      H(
        'div',
        { class: 'space-y-2' },
        H('div', { class: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400' }, 'Detailed Decay Modes & Signatures'),
        H(
          'div',
          { class: 'grid grid-cols-1 md:grid-cols-2 gap-3' },
          profile.modes.map((m) =>
            H(
              'div',
              {
                key: m.channel,
                class: 'rounded-xl border border-white/10 bg-[#090d16] p-3 space-y-2 hover:border-white/20 transition',
              },
              H(
                'div',
                { class: 'flex items-center justify-between' },
                H(
                  'div',
                  { class: 'flex items-center gap-2' },
                  H('div', { class: 'w-3 h-3 rounded-full', style: { backgroundColor: m.color } }),
                  H('div', { class: 'font-bold font-mono text-[13px] text-zinc-100' }, m.channel),
                ),
                H('div', { class: 'font-mono text-[13px] font-bold text-cyan-300' }, m.fractionDisplay),
              ),
              H(
                'div',
                { class: 'flex items-center justify-between text-[10.5px] font-mono text-zinc-400 border-t border-white/5 pt-1.5' },
                H('span', null, `Final state: ${m.finalState}`),
                H('span', { class: 'rounded bg-white/5 px-1.5 py-0.5 text-[9px]' }, m.interaction),
              ),
              H('p', { class: 'text-[11px] text-zinc-400 leading-relaxed' }, m.physicsDetail),
            ),
          ),
        ),
      ),
    ),
  )
}

// ----------------------------------------------------------------------------
// Main Page Shell
// ----------------------------------------------------------------------------

export default function ParticlePage(): VNode {
  return H(
    'div',
    { class: 'flex h-screen w-screen flex-col bg-[#070a10] text-zinc-200 overflow-hidden font-sans' },

    // Top Header Navigation Bar
    H(
      'header',
      { class: 'flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur z-20' },
      H(
        'div',
        { class: 'flex items-center gap-2.5 shrink-0' },
        ElementaLogo({ size: 28 }),
        H(
          'a',
          {
            href: './index.html',
            class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100 hover:text-indigo-400 transition',
          },
          'ELEM',
          H('span', { class: 'text-indigo-400' }, 'E'),
          'NTA',
        ),
        H('span', { class: 'text-zinc-600 font-mono text-[12px]' }, '/'),
        H('h1', { class: 'text-[13px] font-semibold text-zinc-200 whitespace-nowrap' }, 'Particle Physics & Feynman Diagram Lab'),
        H(
          'span',
          { class: 'hidden sm:inline-flex rounded-full border border-indigo-400/30 bg-indigo-400/10 px-2 py-0.5 text-[9.5px] font-mono font-medium text-indigo-300' },
          'Standard Model · Feynman QFT · PDG 2026',
        ),
      ),
      H(
        'div',
        { class: 'ml-auto flex items-center gap-2 overflow-x-auto min-w-0 py-1' },
        H(
          'a',
          {
            href: './index.html',
            class: 'shrink-0 rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition',
          },
          '← Periodic Table',
        ),
        H(
          'a',
          {
            href: './quantumwave.html',
            class: 'shrink-0 rounded-md border border-fuchsia-400/40 bg-fuchsia-400/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-300 hover:bg-fuchsia-400/20 transition',
          },
          'Quantum wave lab',
        ),
        H(
          'a',
          {
            href: './bec.html',
            class: 'shrink-0 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-400/20 transition',
          },
          'BEC lab',
        ),
        GitHubLink(),
      ),
    ),

    // Sub-Navigation Tabs Bar
    H(
      'nav',
      { class: 'flex h-11 shrink-0 items-center gap-1 border-b border-white/10 bg-[#090d16] px-4 overflow-x-auto' },
      [
        { id: 'matrix', label: 'Standard Model Matrix', icon: '⚛' },
        { id: 'feynman', label: 'Feynman Diagram Studio', icon: '〰' },
        { id: 'resonance', label: 'Breit–Wigner Collider Resonances', icon: '⚡' },
        { id: 'decays', label: 'Decay Chains & Branching Ratios', icon: '⑂' },
      ].map((tab) =>
        H(
          'button',
          {
            key: tab.id,
            type: 'button',
            onclick: () => {
              state.activeTab = tab.id as TabId
            },
            class: `flex items-center gap-2 border-b-2 px-3 py-2 text-[12px] font-medium transition ${
              state.activeTab === tab.id
                ? 'border-indigo-400 text-indigo-300 font-semibold bg-white/[0.03]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`,
          },
          H('span', { class: 'text-indigo-400' }, tab.icon),
          tab.label,
        ),
      ),
    ),

    // Dynamic Tab Workspace
    state.activeTab === 'matrix'
      ? ParticleMatrixView()
      : state.activeTab === 'feynman'
        ? FeynmanStudioView()
        : state.activeTab === 'resonance'
          ? BreitWignerResonanceView()
          : DecayChainsView(),
  )
}
