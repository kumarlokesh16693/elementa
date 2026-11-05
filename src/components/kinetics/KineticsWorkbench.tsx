/**
 * Reaction Kinetics & Eyring-Arrhenius Catalysis Workbench
 * Unites Reaction Coordinate, Maxwell-Boltzmann Distribution,
 * Integrated Rate Laws, and Enzyme Catalysis into an interactive suite.
 */

import { h, reactive, effect, type VNode } from 'nexus-framework'
import { KINETICS_REACTIONS, getReactionById } from '@/lib/kinetics/database'
import { computeArrheniusRateConstant, computeEyringRateConstant } from '@/lib/kinetics/physics'
import { ReactionCoordinateCanvas } from './ReactionCoordinateCanvas'
import { MaxwellBoltzmannPlot } from './MaxwellBoltzmannPlot'
import { RateLawsSimulator } from './RateLawsSimulator'
import { MichaelisMentenLab } from './MichaelisMentenLab'
import type { KineticsState } from '@/lib/kinetics/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

// Module-level reactive store ensures state survives re-renders
export const kineticsStore = reactive<KineticsState>({
  activeReactionId: KINETICS_REACTIONS[0].id,
  temperatureK: KINETICS_REACTIONS[0].defaultTempK,
  catalystEnabled: true,
  catalystEfficiency: 1.0,
  order: KINETICS_REACTIONS[0].order,
  initialConcA: 1.0,
  initialConcB: 0.0,
  rateConstantK: 0.25,
  simTime: 0,
  simPlaying: true,
  simSpeed: 1.0,
  activeTab: 'energy-profile',
  enzymeParams: {
    vMax: 50,
    kM: 20,
    inhibitorType: 'none',
    inhibitorConcI: 10,
    kI: 10,
  },
})

// Single global animation timer loop for kinetics rate curves
let kineticsAnimationStarted = false
let lastTimestamp = performance.now()
function initKineticsAnimation() {
  if (kineticsAnimationStarted) return
  kineticsAnimationStarted = true

  function tick(now: number) {
    const dt = (now - lastTimestamp) / 1000
    lastTimestamp = now

    if (kineticsStore.simPlaying && kineticsStore.activeTab === 'rate-curves') {
      kineticsStore.simTime += dt * kineticsStore.simSpeed
      if (kineticsStore.simTime > 30) kineticsStore.simTime = 0
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export function KineticsWorkbench(): VNode {
  const store = kineticsStore
  initKineticsAnimation()

  return H('div', { class: 'flex h-full flex-col overflow-hidden bg-[#070a12]' },
    // Top Control Toolbar
    H('div', { class: 'flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0a0f18] px-4 py-2.5 z-10' },
      // Reaction Selector Dropdown
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-xs text-zinc-400 font-mono font-bold' }, 'REACTION:'),
        H('select', {
          value: store.activeReactionId,
          onChange: (e: any) => {
            const nextReaction = getReactionById(e.target.value)
            store.activeReactionId = nextReaction.id
            store.temperatureK = nextReaction.defaultTempK
            store.order = nextReaction.order
            store.simTime = 0
          },
          onchange: (e: any) => {
            const nextReaction = getReactionById(e.target.value)
            store.activeReactionId = nextReaction.id
            store.temperatureK = nextReaction.defaultTempK
            store.order = nextReaction.order
            store.simTime = 0
          },
          class: 'rounded-md border border-white/15 bg-[#0e1626] px-2.5 py-1 text-xs font-medium text-amber-300 focus:outline-none focus:border-amber-400',
        },
          KINETICS_REACTIONS.map((r) =>
            H('option', { value: r.id, class: 'bg-[#0a0f18] text-zinc-200' }, `${r.name} (${r.category})`)
          ),
        ),
      ),

      // Temperature Controller
      H('div', { class: 'flex items-center gap-2.5 font-mono text-xs' },
        H('span', { class: 'text-zinc-400 font-bold' }, 'TEMP:'),
        H('input', {
          type: 'range',
          min: '150',
          max: '1100',
          step: '10',
          value: String(store.temperatureK),
          onInput: (e: any) => {
            store.temperatureK = parseFloat(e.target.value)
          },
          oninput: (e: any) => {
            store.temperatureK = parseFloat(e.target.value)
          },
          class: 'w-24 sm:w-32 accent-amber-400 h-1 bg-zinc-700 rounded cursor-pointer',
        }),
        H('span', { class: 'text-amber-300 font-bold min-w-[55px]' }, `${store.temperatureK.toFixed(0)} K`),
        H('div', { class: 'hidden sm:flex items-center gap-1' },
          [298, 373, 550, 700].map((t) =>
            H('button', {
              type: 'button',
              onClick: () => { store.temperatureK = t },
              onclick: () => { store.temperatureK = t },
              class: `rounded px-1.5 py-0.5 text-[10px] font-mono transition ${
                Math.abs(store.temperatureK - t) < 5
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
              }`,
            }, `${t}K`)
          ),
        ),
      ),

      // Catalyst Toggle & Efficiency
      H('div', { class: 'flex items-center gap-2' },
        H('button', {
          type: 'button',
          onClick: () => { store.catalystEnabled = !store.catalystEnabled },
          onclick: () => { store.catalystEnabled = !store.catalystEnabled },
          class: `rounded-md px-3 py-1 font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
            store.catalystEnabled
              ? 'bg-emerald-500 text-black shadow-emerald-500/20'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
          }`,
        },
          H('span', null, store.catalystEnabled ? '✓' : '✕'),
          store.catalystEnabled ? 'CATALYST ACTIVE' : 'NO CATALYST',
        ),
      ),
    ),

    // Master Navigation Tabs
    H('div', { class: 'flex items-center gap-1 border-b border-white/10 bg-[#080c14] px-4 py-1.5 overflow-x-auto shrink-0' },
      [
        { id: 'energy-profile', label: '⚡ Potential Energy Profile (Ea & ΔH‡)', icon: '📈' },
        { id: 'maxwell-boltzmann', label: '🔥 Maxwell-Boltzmann Energy Distribution', icon: '📊' },
        { id: 'rate-curves', label: '⏱️ Integrated Rate Laws & Concentration', icon: '⏳' },
        { id: 'enzyme-lab', label: '🧬 Michaelis-Menten & Lineweaver-Burk Lab', icon: '🔬' },
      ].map((tab) => {
        const isActive = store.activeTab === tab.id
        return H('button', {
          key: tab.id,
          type: 'button',
          onClick: () => { store.activeTab = tab.id as any },
          onclick: () => { store.activeTab = tab.id as any },
          class: `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            isActive
              ? 'bg-gradient-to-r from-amber-500/20 to-sky-500/20 text-amber-300 border border-amber-400/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`,
        },
          H('span', null, tab.icon),
          H('span', null, tab.label),
        )
      }),
    ),

    // Main Workspace Layout
    H('div', { class: 'flex flex-1 flex-col lg:flex-row overflow-hidden' },
      // Left / Center Interactive Plot Viewport
      H('div', { class: 'flex-1 p-3 lg:p-4 overflow-y-auto flex flex-col' },
        store.activeTab === 'energy-profile'
          ? ReactionCoordinateCanvas({
              reaction: getReactionById(store.activeReactionId),
              catalystEnabled: store.catalystEnabled,
              catalystEfficiency: store.catalystEfficiency,
              tempK: store.temperatureK,
            })
          : store.activeTab === 'maxwell-boltzmann'
          ? MaxwellBoltzmannPlot({
              reaction: getReactionById(store.activeReactionId),
              catalystEnabled: store.catalystEnabled,
              catalystEfficiency: store.catalystEfficiency,
              tempK: store.temperatureK,
            })
          : store.activeTab === 'rate-curves'
          ? RateLawsSimulator({
              order: store.order,
              rateConstantK: store.rateConstantK,
              initialConcA: store.initialConcA,
              simTime: store.simTime,
              onOrderChange: (ord) => { store.order = ord },
              onRateConstantChange: (k) => { store.rateConstantK = k },
              onInitialConcChange: (a0) => { store.initialConcA = a0 },
            })
          : MichaelisMentenLab({
              params: store.enzymeParams,
              onParamsChange: (p) => { store.enzymeParams = p },
            }),
      ),

      // Right Side Information & Reaction Details Drawer
      (() => {
        const curRxn = getReactionById(store.activeReactionId)
        const effectiveEa = store.catalystEnabled ? curRxn.eaCatalyzed : curRxn.eaUncatalyzed
        const arrheniusK = computeArrheniusRateConstant(curRxn.frequencyFactorA, effectiveEa, store.temperatureK)
        const eyringK = computeEyringRateConstant(effectiveEa, curRxn.deltaS_ddagger, store.temperatureK)

        return H('div', { class: 'w-full lg:w-84 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#090d16] p-3.5 flex flex-col gap-3 overflow-y-auto shrink-0 text-xs' },
          // Header info
          H('div', { class: 'border-b border-white/10 pb-2.5' },
            H('div', { class: 'flex items-center justify-between text-[10px] font-mono' },
              H('span', { class: 'rounded bg-amber-400/20 px-1.5 py-0.5 text-amber-300 font-bold uppercase' }, curRxn.category),
              H('span', { class: 'text-zinc-500' }, curRxn.catalystType),
            ),
            H('h2', { class: 'font-bold text-sm text-zinc-100 mt-1' }, curRxn.name),
            H('div', { class: 'font-mono text-emerald-400 font-bold text-xs mt-0.5 bg-black/40 p-1.5 rounded border border-white/5' }, curRxn.equation),
          ),

          // Activation & Thermodynamic Telemetry
          H('div', { class: 'space-y-1.5 font-mono' },
            H('div', { class: 'text-[10px] font-bold tracking-wider text-zinc-400 uppercase' }, 'Thermodynamic & Activation Telemetry'),
            H('div', { class: 'grid grid-cols-2 gap-1.5 text-[11px]' },
              H('div', { class: 'rounded border border-white/5 bg-black/30 p-2' },
                H('span', { class: 'text-zinc-500 block text-[9.5px]' }, 'ACTIVATION Ea'),
                H('span', { class: 'text-rose-400 font-bold' }, `${effectiveEa.toFixed(1)} kJ/mol`),
                H('span', { class: 'text-zinc-500 block text-[8.5px]' }, store.catalystEnabled ? 'Catalyzed barrier' : 'Uncatalyzed barrier'),
              ),
              H('div', { class: 'rounded border border-white/5 bg-black/30 p-2' },
                H('span', { class: 'text-zinc-500 block text-[9.5px]' }, 'ENTHALPY ΔH°'),
                H('span', { class: `${curRxn.deltaH < 0 ? 'text-sky-400' : 'text-amber-400'} font-bold` },
                  `${curRxn.deltaH > 0 ? '+' : ''}${curRxn.deltaH.toFixed(1)} kJ/mol`
                ),
                H('span', { class: 'text-zinc-500 block text-[8.5px]' }, curRxn.deltaH < 0 ? 'Exothermic' : 'Endothermic'),
              ),
              H('div', { class: 'rounded border border-white/5 bg-black/30 p-2' },
                H('span', { class: 'text-zinc-500 block text-[9.5px]' }, 'ARRHENIUS k(T)'),
                H('span', { class: 'text-amber-300 font-bold' }, arrheniusK.toExponential(3)),
                H('span', { class: 'text-zinc-500 block text-[8.5px]' }, 'k = A·exp(-Ea/RT)'),
              ),
              H('div', { class: 'rounded border border-white/5 bg-black/30 p-2' },
                H('span', { class: 'text-zinc-500 block text-[9.5px]' }, 'EYRING k(TST)'),
                H('span', { class: 'text-emerald-300 font-bold' }, eyringK.toExponential(3)),
                H('span', { class: 'text-zinc-500 block text-[8.5px]' }, 'Transition state theory'),
              ),
            ),
          ),

          // Catalyst Specifications
          H('div', { class: 'rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 font-mono text-[11px] space-y-1' },
            H('span', { class: 'text-emerald-400 font-bold block text-[10px]' }, '⚡ CATALYST SPECIFICATION'),
            H('div', { class: 'text-zinc-200 font-medium' }, curRxn.catalystName),
            H('div', { class: 'text-zinc-400 text-[10px] flex justify-between' },
              H('span', null, `Uncat Ea: ${curRxn.eaUncatalyzed} kJ`),
              H('span', { class: 'text-emerald-300 font-bold' }, `Cat Ea: ${curRxn.eaCatalyzed} kJ`),
            ),
          ),

          // Reaction Mechanism Steps
          H('div', { class: 'space-y-1.5' },
            H('div', { class: 'text-[10px] font-bold tracking-wider text-zinc-400 uppercase font-mono' }, 'Elementary Mechanism Steps'),
            H('ol', { class: 'space-y-1 list-decimal list-inside text-[11px] text-zinc-300 leading-relaxed' },
              curRxn.mechanismSteps.map((step) =>
                H('li', { class: 'font-mono text-[10.5px] bg-white/5 p-1.5 rounded border border-white/5' }, step)
              ),
            ),
          ),

          // Industrial & Biological Context
          H('div', { class: 'rounded border border-white/5 bg-black/40 p-2 text-[10.5px] text-zinc-400 leading-relaxed' },
            H('span', { class: 'text-amber-400 font-bold block font-mono text-[10px] mb-0.5' }, '🏭 INDUSTRIAL / BIOLOGICAL ROLE'),
            curRxn.industrialApplication,
          ),
        )
      })(),
    ),
  )
}
