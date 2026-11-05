/**
 * Nuclear Fission Reactor Core & Criticality Simulator Workbench
 * Module-level reactive singleton store ensures state persists across re-renders.
 */

import { h, reactive, type VNode } from 'nexus-framework'
import { REACTOR_PRESETS, getPresetById } from '@/lib/reactor/presets'
import {
  DELAYED_GROUPS_U235,
  TOTAL_BETA_U235,
  computeRodReactivityWorth,
  stepPointKinetics,
  stepXenonTransient,
  stepThermalHydraulics,
  computeCherenkovGlow,
} from '@/lib/reactor/physics'
import { XenonPitPlot } from './XenonPitPlot'
import { ThermalHydraulicsPanel } from './ThermalHydraulicsPanel'
import './reactor-3d-element'
import type { ReactorState } from '@/lib/reactor/types'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

// Module-level reactive singleton
export const reactorStore = reactive<ReactorState>({
  presetId: REACTOR_PRESETS[0].id,
  controlRodInsertion: 35.0, // %
  boronConcentrationPpm: 800, // ppm
  manualReactivityPcm: 0,
  scramActive: false,
  neutronFluxNormalized: 1.0,
  thermalPowerMWth: REACTOR_PRESETS[0].thermalPowerMWth,
  electricPowerMWe: REACTOR_PRESETS[0].electricPowerMWe,
  kEff: 1.0000,
  reactivityPcm: 0.0,
  reactivityDollars: 0.0,
  reactorPeriodSeconds: 9999.0,
  precursors: DELAYED_GROUPS_U235.map(
    (g) => (g.fractionBeta_i / (REACTOR_PRESETS[0].promptNeutronLifetimeUs * 1e-6 * g.decayConstantLambda_i)) * 1.0
  ),
  iodine135Rel: 100.0,
  xenon135Rel: 100.0,
  xenonReactivityPcm: -2800.0,
  fuelTempC: 650.0,
  coolantInletTempC: REACTOR_PRESETS[0].inletTempC,
  coolantOutletTempC: REACTOR_PRESETS[0].outletTempC,
  coolantFlowRatePct: 100.0,
  steamPressureMPa: 6.8,
  turbineRpm: 1800,
  cherenkovIntensity: 0.85,
  simTimeSeconds: 0,
  simSpeed: 1.0,
  simPaused: false,
  activeTab: 'core-3d',
})

// Single global physics simulation loop
let reactorLoopStarted = false
let lastTime = performance.now()

function initReactorPhysicsLoop() {
  if (reactorLoopStarted) return
  reactorLoopStarted = true

  function loop(now: number) {
    const rawDt = Math.min(0.1, (now - lastTime) / 1000)
    lastTime = now

    if (!reactorStore.simPaused) {
      const dt = rawDt * reactorStore.simSpeed
      reactorStore.simTimeSeconds += dt

      const preset = getPresetById(reactorStore.presetId)

      // 1. Calculate Total Reactivity
      // Critical baseline at 35% insertion with 800 ppm boron
      const nominalRodPcm = computeRodReactivityWorth(35.0)
      const currentRodPcm = computeRodReactivityWorth(reactorStore.controlRodInsertion)
      const deltaRodPcm = currentRodPcm - nominalRodPcm

      const deltaBoronPcm = -(reactorStore.boronConcentrationPpm - 800) * 7.2
      const deltaDopplerPcm = (reactorStore.fuelTempC - 650.0) * preset.dopplerCoeffPcmPerC
      const deltaMtcPcm = (reactorStore.coolantOutletTempC - preset.outletTempC) * preset.moderatorTempCoeffPcmPerC
      const deltaXePcm = -(reactorStore.xenon135Rel - 100.0) * 28.0

      const totalReactivityPcm =
        deltaRodPcm +
        deltaBoronPcm +
        deltaDopplerPcm +
        deltaMtcPcm +
        deltaXePcm +
        reactorStore.manualReactivityPcm

      reactorStore.reactivityPcm = totalReactivityPcm
      reactorStore.reactivityDollars = totalReactivityPcm / (preset.totalBeta * 1e5)

      // Convert pcm to dimensionless reactivity rho
      const rho = totalReactivityPcm * 1e-5
      // k_eff = 1 / (1 - rho)
      reactorStore.kEff = Math.max(0.5, 1.0 / (1.0 - Math.min(0.009, rho)))

      // 2. Step Point Kinetics
      const { nNext, precursorsNext, period } = stepPointKinetics(
        reactorStore.neutronFluxNormalized,
        reactorStore.precursors,
        rho,
        preset.totalBeta,
        preset.promptNeutronLifetimeUs,
        dt
      )

      reactorStore.neutronFluxNormalized = nNext
      reactorStore.precursors = precursorsNext
      reactorStore.reactorPeriodSeconds = period
      reactorStore.thermalPowerMWth = Math.max(0, preset.thermalPowerMWth * nNext)

      // 3. Step Xenon Transient
      const { I_next, Xe_next, rhoXePcm } = stepXenonTransient(
        reactorStore.neutronFluxNormalized,
        reactorStore.iodine135Rel,
        reactorStore.xenon135Rel,
        dt
      )
      reactorStore.iodine135Rel = I_next
      reactorStore.xenon135Rel = Xe_next
      reactorStore.xenonReactivityPcm = rhoXePcm

      // 4. Step Thermal Hydraulics & Electric Output
      const th = stepThermalHydraulics(
        preset,
        reactorStore.neutronFluxNormalized,
        reactorStore.coolantFlowRatePct,
        reactorStore.fuelTempC,
        reactorStore.coolantOutletTempC,
        dt
      )

      reactorStore.fuelTempC = th.fuelTempC
      reactorStore.coolantInletTempC = th.coolantInC
      reactorStore.coolantOutletTempC = th.coolantOutC
      reactorStore.steamPressureMPa = th.steamPressMPa
      reactorStore.electricPowerMWe = th.electricMWe
      reactorStore.turbineRpm = th.turbineRpm

      // Cherenkov glow
      const ch = computeCherenkovGlow(reactorStore.neutronFluxNormalized)
      reactorStore.cherenkovIntensity = ch.intensity
    }

    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}

export function ReactorWorkbench(): VNode {
  const store = reactorStore
  initReactorPhysicsLoop()
  const preset = getPresetById(store.presetId)

  // Status badge for k_eff
  const isPromptCrit = store.reactivityDollars >= 1.0
  const isDelayedCrit = store.reactivityDollars > 0 && store.reactivityDollars < 1.0
  const isCrit = Math.abs(store.reactivityPcm) <= 1.0
  const isSubcrit = store.reactivityPcm < -1.0

  const statusLabel = isPromptCrit
    ? 'PROMPT CRITICAL (UNCONTROLLED)'
    : isDelayedCrit
    ? 'DELAYED SUPERCRITICAL (RISING)'
    : isCrit
    ? 'STEADY-STATE CRITICAL (k = 1.000)'
    : 'SUBCRITICAL (POWER DECAY)'

  const statusBadgeColor = isPromptCrit
    ? 'bg-rose-600 text-white animate-pulse'
    : isDelayedCrit
    ? 'bg-amber-500 text-black font-bold'
    : isCrit
    ? 'bg-emerald-500 text-black font-bold'
    : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'

  return H('div', { class: 'flex h-full flex-col overflow-hidden bg-[#070a12]' },
    // Top Control Room Toolbar
    H('div', { class: 'flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 bg-[#0a0f18] px-4 py-2 z-10' },
      // Preset Selector
      H('div', { class: 'flex items-center gap-2' },
        H('span', { class: 'text-xs text-zinc-400 font-mono font-bold' }, 'CORE DESIGN:'),
        H('select', {
          value: store.presetId,
          onChange: (e: any) => {
            const p = getPresetById(e.target.value)
            store.presetId = p.id
            store.coolantInletTempC = p.inletTempC
            store.coolantOutletTempC = p.outletTempC
          },
          onchange: (e: any) => {
            const p = getPresetById(e.target.value)
            store.presetId = p.id
            store.coolantInletTempC = p.inletTempC
            store.coolantOutletTempC = p.outletTempC
          },
          class: 'rounded-md border border-white/15 bg-[#0e1626] px-2.5 py-1 text-xs font-medium text-amber-300 focus:outline-none',
        },
          REACTOR_PRESETS.map((p) =>
            H('option', { value: p.id, class: 'bg-[#0a0f18] text-zinc-200' }, `${p.name} (${p.electricPowerMWe} MWe)`)
          ),
        ),
      ),

      // Control Rod Position Slider
      H('div', { class: 'flex items-center gap-2 font-mono text-xs' },
        H('span', { class: 'text-zinc-400 font-bold' }, 'CONTROL RODS:'),
        H('input', {
          type: 'range',
          min: '0',
          max: '100',
          step: '0.5',
          value: String(store.controlRodInsertion),
          onInput: (e: any) => {
            store.controlRodInsertion = parseFloat(e.target.value)
            store.scramActive = false
          },
          oninput: (e: any) => {
            store.controlRodInsertion = parseFloat(e.target.value)
            store.scramActive = false
          },
          class: 'w-28 sm:w-36 accent-rose-500 h-1.5 bg-zinc-700 rounded cursor-pointer',
        }),
        H('span', { class: 'text-rose-400 font-bold min-w-[50px]' }, `${store.controlRodInsertion.toFixed(1)}%`),
      ),

      // Soluble Boron Chemical Shim Slider
      H('div', { class: 'hidden md:flex items-center gap-2 font-mono text-xs' },
        H('span', { class: 'text-zinc-400 font-bold' }, 'BORON:'),
        H('input', {
          type: 'range',
          min: '0',
          max: '1600',
          step: '20',
          value: String(store.boronConcentrationPpm),
          onInput: (e: any) => { store.boronConcentrationPpm = parseFloat(e.target.value) },
          oninput: (e: any) => { store.boronConcentrationPpm = parseFloat(e.target.value) },
          class: 'w-24 accent-amber-400 h-1.5 bg-zinc-700 rounded cursor-pointer',
        }),
        H('span', { class: 'text-amber-300 min-w-[55px]' }, `${store.boronConcentrationPpm.toFixed(0)} ppm`),
      ),

      // Emergency SCRAM Button
      H('div', { class: 'flex items-center gap-2' },
        H('button', {
          type: 'button',
          onClick: () => {
            store.controlRodInsertion = 100.0
            store.scramActive = true
          },
          onclick: () => {
            store.controlRodInsertion = 100.0
            store.scramActive = true
          },
          class: `rounded-md px-3 py-1 font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
            store.scramActive
              ? 'bg-rose-700 text-white animate-pulse border border-rose-400'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
          }`,
        },
          H('span', { class: 'text-sm' }, '🛑'),
          'EMERGENCY SCRAM',
        ),

        // Pause / Resume
        H('button', {
          type: 'button',
          onClick: () => { store.simPaused = !store.simPaused },
          onclick: () => { store.simPaused = !store.simPaused },
          class: 'rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-zinc-300 hover:bg-white/10',
        }, store.simPaused ? '▶ RESUME' : '⏸ PAUSE'),
      ),
    ),

    // Live Criticality & Reactor Telemetry Status Strip
    H('div', { class: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 border-b border-white/10 bg-[#080c14] px-4 py-2 font-mono text-[11px]' },
      // Effective Neutron Multiplication
      H('div', { class: 'rounded border border-white/5 bg-black/40 p-1.5' },
        H('span', { class: 'text-zinc-500 block text-[9px]' }, 'MULTIPLICATION k_eff'),
        H('span', { class: `font-bold text-sm ${isPromptCrit ? 'text-rose-500' : isDelayedCrit ? 'text-amber-400' : isCrit ? 'text-emerald-400' : 'text-sky-300'}` },
          store.kEff.toFixed(4)
        ),
      ),
      // Net Reactivity
      H('div', { class: 'rounded border border-white/5 bg-black/40 p-1.5' },
        H('span', { class: 'text-zinc-500 block text-[9px]' }, 'REACTIVITY ρ'),
        H('span', { class: 'text-zinc-200 font-bold text-sm' }, `${store.reactivityPcm > 0 ? '+' : ''}${store.reactivityPcm.toFixed(1)} pcm`),
        H('span', { class: 'text-zinc-500 text-[8.5px] block' }, `(${store.reactivityDollars > 0 ? '+' : ''}$${store.reactivityDollars.toFixed(2)})`),
      ),
      // Reactor Period
      H('div', { class: 'rounded border border-white/5 bg-black/40 p-1.5' },
        H('span', { class: 'text-zinc-500 block text-[9px]' }, 'REACTOR PERIOD T'),
        H('span', { class: 'text-amber-300 font-bold text-sm' },
          Math.abs(store.reactorPeriodSeconds) > 999 ? '∞ (Stable)' : `${store.reactorPeriodSeconds.toFixed(1)} s`
        ),
      ),
      // Thermal Power
      H('div', { class: 'rounded border border-white/5 bg-black/40 p-1.5' },
        H('span', { class: 'text-zinc-500 block text-[9px]' }, 'THERMAL POWER'),
        H('span', { class: 'text-rose-400 font-bold text-sm' }, `${store.thermalPowerMWth.toFixed(1)} MWth`),
        H('span', { class: 'text-zinc-500 text-[8.5px] block' }, `${(store.neutronFluxNormalized * 100).toFixed(1)}% Rated`),
      ),
      // Electric Grid Output
      H('div', { class: 'rounded border border-white/5 bg-black/40 p-1.5' },
        H('span', { class: 'text-zinc-500 block text-[9px]' }, 'ELECTRIC GENERATOR'),
        H('span', { class: 'text-emerald-300 font-bold text-sm' }, `${store.electricPowerMWe.toFixed(1)} MWe`),
        H('span', { class: 'text-zinc-500 text-[8.5px] block' }, `${store.turbineRpm.toFixed(0)} RPM`),
      ),
      // Criticality Status Badge
      H('div', { class: 'flex flex-col justify-center rounded p-1.5 ' + statusBadgeColor },
        H('span', { class: 'text-[9px] uppercase tracking-wider block opacity-85' }, 'CRITICALITY STATE'),
        H('span', { class: 'font-bold text-[10px] leading-tight' }, statusLabel),
      ),
    ),

    // Navigation Tabs
    H('div', { class: 'flex items-center gap-1 border-b border-white/10 bg-[#080c14] px-4 py-1.5 overflow-x-auto shrink-0' },
      [
        { id: 'core-3d', label: '☢️ 3D Core & Cherenkov Radiation', icon: '🔬' },
        { id: 'kinetics-telemetry', label: '📊 6-Group Delayed Neutron Kinetics', icon: '📈' },
        { id: 'xenon-transient', label: '⚠️ Xenon-135 Poisoning & Iodine Pit', icon: '🧪' },
        { id: 'thermal-loop', label: '♨️ Thermal-Hydraulics & Steam Turbine', icon: '⚡' },
      ].map((tab) => {
        const isActive = store.activeTab === tab.id
        return H('button', {
          key: tab.id,
          type: 'button',
          onClick: () => { store.activeTab = tab.id as any },
          onclick: () => { store.activeTab = tab.id as any },
          class: `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            isActive
              ? 'bg-gradient-to-r from-cyan-500/20 to-rose-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`,
        },
          H('span', null, tab.icon),
          H('span', null, tab.label),
        )
      }),
    ),

    // Main Workspace Body
    H('div', { class: 'flex flex-1 flex-col lg:flex-row overflow-hidden' },
      // Left / Main Content Area
      H('div', { class: 'flex-1 p-3 lg:p-4 overflow-y-auto flex flex-col' },
        store.activeTab === 'core-3d'
          ? H('div', { class: 'relative flex-1 min-h-[340px] rounded-xl border border-white/10 bg-black/50 overflow-hidden' },
              H('elementa-reactor-3d', {
                'data-insertion': String(store.controlRodInsertion),
                'data-flux': String(store.neutronFluxNormalized),
                'data-temp': String(store.fuelTempC),
                'data-scram': String(store.scramActive),
                class: 'h-full w-full block',
              }),
              // Cherenkov HUD overlay badge
              H('div', { class: 'absolute bottom-3 left-3 rounded-lg border border-cyan-400/30 bg-black/70 px-3 py-1.5 font-mono text-[10.5px] backdrop-blur-[2px] flex items-center gap-2' },
                H('span', { class: 'h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping' }),
                H('span', { class: 'text-cyan-300 font-bold' }, 'Cherenkov Luminescence:'),
                H('span', { class: 'text-zinc-300' }, `${(store.cherenkovIntensity * 100).toFixed(0)}% Intensity`),
              ),
            )
          : store.activeTab === 'kinetics-telemetry'
          ? H('div', { class: 'flex-1 flex flex-col gap-3' },
              H('div', { class: 'grid grid-cols-1 md:grid-cols-2 gap-3 flex-1' },
                // Delayed Groups Breakdown
                H('div', { class: 'rounded-xl border border-white/10 bg-[#090d16] p-3' },
                  H('h3', { class: 'text-xs font-bold text-zinc-200 mb-2 font-mono' }, '6-Group Keepin Delayed Neutron Precursors (²³⁵U)'),
                  H('div', { class: 'space-y-1.5 font-mono text-[10.5px]' },
                    DELAYED_GROUPS_U235.map((g, idx) => {
                      const conc = store.precursors[idx] || 0
                      return H('div', { key: g.group, class: 'flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/5' },
                        H('span', { class: 'text-zinc-400' }, `Group ${g.group} (T½ = ${g.halfLifeSeconds}s):`),
                        H('span', { class: 'text-sky-300 font-bold' }, `β_${g.group} = ${(g.fractionBeta_i * 1e5).toFixed(1)} pcm`),
                        H('span', { class: 'text-zinc-500' }, `C_${g.group} = ${conc.toFixed(2)} rel`),
                      )
                    }),
                  ),
                  H('div', { class: 'mt-3 border-t border-white/5 pt-2 text-[10px] text-zinc-500 font-mono flex justify-between' },
                    H('span', null, `Total Delayed Fraction β: ${(TOTAL_BETA_U235 * 1e5).toFixed(0)} pcm`),
                    H('span', { class: 'text-emerald-400 font-bold' }, 'Prompt Margin: 650 pcm ($1.00)'),
                  ),
                ),

                // Reactivity Feedback Balances
                H('div', { class: 'rounded-xl border border-white/10 bg-[#090d16] p-3' },
                  H('h3', { class: 'text-xs font-bold text-zinc-200 mb-2 font-mono' }, 'Reactivity Balance & Inherent Safety Feedback'),
                  H('div', { class: 'space-y-2 font-mono text-[11px]' },
                    H('div', { class: 'flex justify-between p-2 rounded bg-black/40 border border-white/5' },
                      H('span', { class: 'text-zinc-400' }, 'Control Rod Worth Δρ_rod:'),
                      H('span', { class: 'text-rose-400 font-bold' }, `${(computeRodReactivityWorth(store.controlRodInsertion) - computeRodReactivityWorth(35)).toFixed(1)} pcm`),
                    ),
                    H('div', { class: 'flex justify-between p-2 rounded bg-black/40 border border-white/5' },
                      H('span', { class: 'text-zinc-400' }, 'Fuel Doppler Effect (²³⁸U Capture):'),
                      H('span', { class: 'text-sky-300 font-bold' }, `${((store.fuelTempC - 650) * preset.dopplerCoeffPcmPerC).toFixed(1)} pcm`),
                    ),
                    H('div', { class: 'flex justify-between p-2 rounded bg-black/40 border border-white/5' },
                      H('span', { class: 'text-zinc-400' }, 'Moderator Temp Coeff (MTC):'),
                      H('span', { class: 'text-cyan-300 font-bold' }, `${((store.coolantOutletTempC - preset.outletTempC) * preset.moderatorTempCoeffPcmPerC).toFixed(1)} pcm`),
                    ),
                    H('div', { class: 'flex justify-between p-2 rounded bg-black/40 border border-white/5' },
                      H('span', { class: 'text-zinc-400' }, 'Xenon-135 Poison Worth Δρ_Xe:'),
                      H('span', { class: 'text-amber-400 font-bold' }, `${(-(store.xenon135Rel - 100) * 28).toFixed(1)} pcm`),
                    ),
                  ),
                  H('p', { class: 'mt-3 text-[10.5px] text-zinc-400 leading-relaxed' },
                    'Negative temperature coefficients provide inherent passive safety: if core temperature rises, resonance absorption in ²³⁸U immediately removes reactivity, naturally stabilizing the chain reaction without human intervention.',
                  ),
                ),
              ),
            )
          : store.activeTab === 'xenon-transient'
          ? XenonPitPlot({ currentFlux: store.neutronFluxNormalized, simTimeHours: store.simTimeSeconds / 3600 })
          : ThermalHydraulicsPanel({
              preset,
              thermalPowerMWth: store.thermalPowerMWth,
              electricPowerMWe: store.electricPowerMWe,
              fuelTempC: store.fuelTempC,
              coolantInC: store.coolantInletTempC,
              coolantOutC: store.coolantOutletTempC,
              steamPressMPa: store.steamPressureMPa,
              turbineRpm: store.turbineRpm,
              flowRatePct: store.coolantFlowRatePct,
              onFlowRateChange: (flow) => { store.coolantFlowRatePct = flow },
            }),
      ),

      // Right Side Design & Safety Specs Drawer
      H('div', { class: 'w-full lg:w-80 xl:w-88 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#090d16] p-3.5 flex flex-col gap-3 overflow-y-auto shrink-0 text-xs' },
        H('div', { class: 'border-b border-white/10 pb-2' },
          H('div', { class: 'flex items-center justify-between text-[10px] font-mono' },
            H('span', { class: 'rounded bg-cyan-400/20 px-1.5 py-0.5 text-cyan-300 font-bold' }, preset.type),
            H('span', { class: 'text-zinc-500' }, `${preset.operatingPressureMPa} MPa`),
          ),
          H('h2', { class: 'font-bold text-sm text-zinc-100 mt-1' }, preset.name),
          H('p', { class: 'text-[11px] text-zinc-400 mt-1 leading-relaxed' }, preset.description),
        ),

        // Design Specs Grid
        H('div', { class: 'space-y-1.5 font-mono text-[10.5px]' },
          H('div', { class: 'text-[10px] font-bold tracking-wider text-zinc-400 uppercase' }, 'Core Engineering Parameters'),
          H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
            H('span', { class: 'text-zinc-500' }, 'Fuel Enrichment:'),
            H('span', { class: 'text-amber-300 font-bold' }, `${preset.enrichmentPct}% U-235`),
          ),
          H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
            H('span', { class: 'text-zinc-500' }, 'Fuel Cladding:'),
            H('span', { class: 'text-zinc-200' }, preset.fuelType.split(' in ')[1] || 'Zircaloy'),
          ),
          H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
            H('span', { class: 'text-zinc-500' }, 'Prompt Lifetime Λ:'),
            H('span', { class: 'text-sky-300 font-bold' }, `${preset.promptNeutronLifetimeUs} µs`),
          ),
          H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
            H('span', { class: 'text-zinc-500' }, 'Doppler Coeff α_D:'),
            H('span', { class: 'text-rose-400 font-bold' }, `${preset.dopplerCoeffPcmPerC} pcm/°C`),
          ),
          H('div', { class: 'flex justify-between p-1.5 rounded bg-black/40 border border-white/5' },
            H('span', { class: 'text-zinc-500' }, 'Moderator MTC:'),
            H('span', { class: 'text-cyan-300 font-bold' }, `${preset.moderatorTempCoeffPcmPerC} pcm/°C`),
          ),
        ),

        // Safety Architecture
        H('div', { class: 'space-y-1.5' },
          H('div', { class: 'text-[10px] font-bold tracking-wider text-emerald-400 uppercase font-mono' }, '🛡️ Defense-in-Depth Safety Systems'),
          H('ul', { class: 'space-y-1 list-disc list-inside text-[11px] text-zinc-300 leading-relaxed' },
            preset.safetyFeatures.map((feat) =>
              H('li', { class: 'bg-white/5 p-1.5 rounded border border-white/5' }, feat)
            ),
          ),
        ),
      ),
    ),
  )
}
