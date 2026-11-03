import type { SimEngine } from '@/lib/sim/engine'
import { MISSION_ORDER, MISSIONS } from '@/lib/sim/missions'
import { fmtFixed, fmtInt, fmtSig, fmtTime } from '@/lib/sim/format'

const STATUS_STYLE: Record<string, { fg: string; dot: string; pulse: boolean }> = {
  STANDBY: { fg: 'text-zinc-300 border-zinc-500/40', dot: 'bg-zinc-400', pulse: false },
  EXOATMOSPHERIC: { fg: 'text-sky-300 border-sky-500/40', dot: 'bg-sky-400', pulse: false },
  'PLASMA BUILDUP': { fg: 'text-amber-300 border-amber-500/50', dot: 'bg-amber-400', pulse: true },
  'IONIZATION BLACKOUT': { fg: 'text-red-300 border-red-500/60', dot: 'bg-red-500', pulse: true },
  'PLASMA EXIT': { fg: 'text-amber-300 border-amber-500/50', dot: 'bg-amber-400', pulse: true },
  HYPERSONIC: { fg: 'text-cyan-300 border-cyan-500/40', dot: 'bg-cyan-400', pulse: false },
  SUPERSONIC: { fg: 'text-cyan-200 border-cyan-400/30', dot: 'bg-cyan-300', pulse: false },
  TRANSONIC: { fg: 'text-emerald-200 border-emerald-400/30', dot: 'bg-emerald-300', pulse: false },
  SUBSONIC: { fg: 'text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', pulse: false },
  TOUCHDOWN: { fg: 'text-emerald-300 border-emerald-500/60', dot: 'bg-emerald-400', pulse: true },
  CAPTURED: { fg: 'text-emerald-300 border-emerald-500/60', dot: 'bg-emerald-400', pulse: true },
}

export function createControlPanel(container: HTMLElement, engine: SimEngine) {
  const panel = document.createElement('div')
  panel.className = 'flex flex-col gap-4 p-4 select-none'

  panel.innerHTML = `
    <header>
      <h1 class="font-mono text-xl font-black tracking-[0.28em] text-zinc-100">
        <span class="text-amber-500">◤</span> PROJECT DAEDALUS
      </h1>
      <p class="mt-1 font-mono text-[9px] leading-relaxed tracking-[0.18em] text-zinc-500">
        HYPERSONIC REENTRY AEROTHERMODYNAMICS<br />& GNC FLIGHT SUPERVISOR
      </p>
    </header>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">TELEMETRY LINK</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div id="status-badge-wrap"></div>
    </section>

    <div id="warnings-wrap" class="flex flex-col gap-1"></div>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">MISSION PRESET</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="grid grid-cols-2 gap-1.5" id="missions-grid"></div>
      <p class="mt-1.5 px-0.5 font-mono text-[9px] leading-snug text-zinc-500" id="vehicle-blurb"></p>
    </section>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">FLIGHT CONTROLS</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="grid grid-cols-5 gap-1.5" id="controls-row">
        <button type="button" id="btn-ap" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M9 2v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/></svg>
          <span>A/P</span>
        </button>
        <button type="button" id="btn-run" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer">
          <span id="run-icon"></span>
          <span id="run-label">HOLD</span>
        </button>
        <button type="button" id="btn-rst" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200 cursor-pointer">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span>RST</span>
        </button>
        <button type="button" id="btn-csv" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200 cursor-pointer">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
          <span>CSV</span>
        </button>
        <button type="button" id="btn-rec" class="flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
          <span id="rec-label">REC</span>
        </button>
      </div>
    </section>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">GUIDANCE & CONTROL</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="flex flex-col gap-3" id="sliders-wrap">
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>ANGLE OF ATTACK <span id="ap-alpha-tag" class="ml-2 rounded bg-amber-500/20 px-1 text-[8px] text-amber-400">A/P</span></span>
            <span class="font-bold text-amber-400" id="alpha-val">20.0°</span>
          </div>
          <input type="range" id="slider-alpha" min="0" max="40" step="0.5" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>BANK ANGLE (LIFT AXIS) <span id="ap-sigma-tag" class="ml-2 rounded bg-amber-500/20 px-1 text-[8px] text-amber-400">A/P</span></span>
            <span class="font-bold text-amber-400" id="sigma-val">0.0°</span>
          </div>
          <input type="range" id="slider-sigma" min="0" max="180" step="1" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div class="my-1 h-px bg-white/8"></div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>ALTITUDE</span>
            <span class="font-bold text-amber-400" id="alt-val">120.0 km</span>
          </div>
          <input type="range" id="slider-alt" min="0" max="140" step="0.1" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>VELOCITY</span>
            <span class="font-bold text-amber-400" id="vel-val">7.80 km/s</span>
          </div>
          <input type="range" id="slider-vel" min="0.05" max="11.5" step="0.01" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>FLIGHT PATH ANGLE</span>
            <span class="font-bold text-amber-400" id="gamma-val">-1.20°</span>
          </div>
          <input type="range" id="slider-gamma" min="-15" max="15" step="0.05" class="w-full accent-amber-400 cursor-pointer" />
        </div>
        <div class="my-1 h-px bg-white/8"></div>
        <div>
          <div class="mb-1 flex items-baseline justify-between font-mono text-[10px] tracking-widest text-zinc-400">
            <span>SIM TIME</span>
            <span class="font-bold text-amber-400" id="time-val">T+ 00:00</span>
          </div>
          <input type="range" id="slider-time" min="0" max="60" step="0.5" class="w-full accent-amber-400 cursor-pointer" />
        </div>
      </div>
    </section>

    <section>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">AEROTHERMODYNAMICS</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="grid grid-cols-2 gap-1.5" id="metrics-grid"></div>
      <div class="mt-1.5 flex justify-between rounded border border-white/8 bg-white/[0.02] px-2.5 py-1.5 font-mono text-[9px] text-zinc-500" id="sub-metrics-row"></div>
    </section>

    <section class="pb-2">
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-0.5 bg-amber-500"></span>
        <h2 class="font-mono text-[10px] font-bold tracking-[0.25em] text-zinc-400">FLIGHT CARD</h2>
        <span class="h-px flex-1 bg-white/8"></span>
      </div>
      <div class="space-y-1 rounded border border-white/8 bg-white/[0.02] px-3 py-2.5 font-mono text-[10px] text-zinc-400" id="flight-card-wrap"></div>
    </section>
  `

  const statusWrap = panel.querySelector('#status-badge-wrap') as HTMLDivElement
  const warningsWrap = panel.querySelector('#warnings-wrap') as HTMLDivElement
  const missionsGrid = panel.querySelector('#missions-grid') as HTMLDivElement
  const vehicleBlurb = panel.querySelector('#vehicle-blurb') as HTMLParagraphElement

  const btnAp = panel.querySelector('#btn-ap') as HTMLButtonElement
  const btnRun = panel.querySelector('#btn-run') as HTMLButtonElement
  const runIcon = panel.querySelector('#run-icon') as HTMLSpanElement
  const runLabel = panel.querySelector('#run-label') as HTMLSpanElement
  const btnRst = panel.querySelector('#btn-rst') as HTMLButtonElement
  const btnCsv = panel.querySelector('#btn-csv') as HTMLButtonElement
  const btnRec = panel.querySelector('#btn-rec') as HTMLButtonElement
  const recLabel = panel.querySelector('#rec-label') as HTMLSpanElement

  const sliderAlpha = panel.querySelector('#slider-alpha') as HTMLInputElement
  const sliderSigma = panel.querySelector('#slider-sigma') as HTMLInputElement
  const sliderAlt = panel.querySelector('#slider-alt') as HTMLInputElement
  const sliderVel = panel.querySelector('#slider-vel') as HTMLInputElement
  const sliderGamma = panel.querySelector('#slider-gamma') as HTMLInputElement
  const sliderTime = panel.querySelector('#slider-time') as HTMLInputElement

  const alphaVal = panel.querySelector('#alpha-val') as HTMLSpanElement
  const sigmaVal = panel.querySelector('#sigma-val') as HTMLSpanElement
  const altVal = panel.querySelector('#alt-val') as HTMLSpanElement
  const velVal = panel.querySelector('#vel-val') as HTMLSpanElement
  const gammaVal = panel.querySelector('#gamma-val') as HTMLSpanElement
  const timeVal = panel.querySelector('#time-val') as HTMLSpanElement
  const apAlphaTag = panel.querySelector('#ap-alpha-tag') as HTMLSpanElement
  const apSigmaTag = panel.querySelector('#ap-sigma-tag') as HTMLSpanElement

  const metricsGrid = panel.querySelector('#metrics-grid') as HTMLDivElement
  const subMetricsRow = panel.querySelector('#sub-metrics-row') as HTMLDivElement
  const flightCardWrap = panel.querySelector('#flight-card-wrap') as HTMLDivElement

  // Build Mission Buttons
  const missionBtns: HTMLButtonElement[] = []
  MISSION_ORDER.forEach((id) => {
    const m = MISSIONS[id]
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = m.short
    btn.className = `rounded border px-2.5 py-2 text-left font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
      engine.ui.missionId === id
        ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
        : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
    }`
    btn.onclick = () => {
      engine.loadMission(id)
      updateAll()
    }
    missionsGrid.appendChild(btn)
    missionBtns.push(btn)
  })

  // Button Actions
  btnAp.onclick = () => {
    engine.toggleAutopilot()
    updateAll()
  }
  btnRun.onclick = () => {
    engine.togglePause()
    updateAll()
  }
  btnRst.onclick = () => {
    engine.reset()
    updateAll()
  }
  btnCsv.onclick = () => {
    const csv = engine.buildCsv()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daedalus_${engine.ui.missionId}_${fmtTime(engine.ui.t).replace(/:/g, 'm')}_${Math.round(engine.ui.t)}s.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  btnRec.onclick = () => {
    engine.toggleRecording()
    updateAll()
  }

  // Sliders
  sliderAlpha.oninput = (e: any) => engine.setAlpha(parseFloat(e.target.value))
  sliderSigma.oninput = (e: any) => engine.setSigma(parseFloat(e.target.value))
  sliderAlt.oninput = (e: any) => engine.overrideAltitude(parseFloat(e.target.value) * 1000)
  sliderVel.oninput = (e: any) => engine.overrideVelocity(parseFloat(e.target.value) * 1000)
  sliderGamma.oninput = (e: any) => engine.overrideGamma(parseFloat(e.target.value))
  sliderTime.oninput = (e: any) => engine.scrubTo(parseFloat(e.target.value))

  let userScrubbing = false
  sliderTime.addEventListener('mousedown', () => { userScrubbing = true })
  sliderTime.addEventListener('mouseup', () => { userScrubbing = false })

  const updateAll = () => {
    const ui = engine.ui
    const st = STATUS_STYLE[ui.status] ?? STATUS_STYLE.STANDBY
    const sig = Math.round(ui.attenuation * 100)

    // Status Badge
    statusWrap.innerHTML = `
      <div class="flex items-center gap-2.5 rounded-md border bg-black/40 px-3 py-2.5 font-mono text-sm font-bold tracking-[0.2em] ${st.fg}">
        <span class="relative flex h-2.5 w-2.5">
          ${st.pulse ? `<span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${st.dot}"></span>` : ''}
          <span class="relative inline-flex h-2.5 w-2.5 rounded-full ${st.dot}"></span>
        </span>
        ${ui.status}
      </div>
      <div class="mt-1.5 flex justify-between px-1 font-mono text-[10px] text-zinc-500">
        <span>SIG LINK <span class="${sig > 80 ? 'text-red-400' : sig > 40 ? 'text-amber-400' : 'text-emerald-400'}">${sig}%</span> ATTN</span>
        <span>DATA ${(ui.dataRate).toFixed(1)} kbps</span>
        <span>T+ ${fmtTime(ui.t)}</span>
      </div>
    `

    // Warnings
    warningsWrap.innerHTML = ui.warnings
      .map(
        (w) => `
        <div class="animate-pulse rounded border border-red-500/50 bg-red-950/50 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-widest text-red-300">
          ⚠ ${w}
        </div>
      `,
      )
      .join('')

    // Mission buttons active state
    MISSION_ORDER.forEach((id, idx) => {
      const active = ui.missionId === id
      missionBtns[idx].className = `rounded border px-2.5 py-2 text-left font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
        active
          ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
          : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
      }`
    })
    vehicleBlurb.textContent = ui.vehicleBlurb

    // Controls buttons
    btnAp.className = `flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer ${
      ui.autopilot
        ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
        : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
    }`

    const isRunning = !ui.paused && !ui.landed
    btnRun.className = `flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer ${
      isRunning
        ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
        : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
    }`
    runLabel.textContent = ui.paused ? 'RUN' : 'HOLD'
    runIcon.innerHTML = ui.paused
      ? `<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
      : `<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`

    btnRec.className = `flex flex-col items-center gap-1 rounded border px-1 py-2 font-mono text-[9px] font-bold tracking-wider cursor-pointer ${
      ui.recording
        ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
        : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200'
    }`
    recLabel.textContent = ui.recording ? `${(ui.recCount / 1000).toFixed(1)}k` : 'REC'

    // Sliders
    const apBypass = ui.autopilot
    sliderAlpha.disabled = apBypass
    sliderSigma.disabled = apBypass
    apAlphaTag.style.display = apBypass ? 'inline' : 'none'
    apSigmaTag.style.display = apBypass ? 'inline' : 'none'

    sliderAlpha.value = String(ui.alpha)
    alphaVal.textContent = `${fmtFixed(ui.alpha, 1)}°`

    sliderSigma.value = String(ui.sigma)
    sigmaVal.textContent = `${fmtFixed(ui.sigma, 1)}°`

    sliderAlt.value = String(Math.min(ui.h / 1000, 140))
    altVal.textContent = `${fmtFixed(ui.h / 1000, 1)} km`

    sliderVel.value = String(Math.min(ui.v / 1000, 11.5))
    velVal.textContent = `${fmtFixed(ui.v / 1000, 2)} km/s`

    sliderGamma.value = String(ui.gamma)
    gammaVal.textContent = `${ui.gamma >= 0 ? '+' : ''}${fmtFixed(ui.gamma, 2)}°`

    const tMax = Math.max(60, Math.ceil(ui.t / 10) * 10)
    sliderTime.max = String(tMax)
    if (!userScrubbing) {
      sliderTime.value = String(Math.min(ui.t, tMax))
    }
    timeVal.textContent = `T+ ${fmtTime(ui.t)}`

    // Aerothermodynamics Metrics
    metricsGrid.innerHTML = `
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">MACH NUMBER</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-amber-400">${fmtFixed(ui.mach, 1)}</span><span class="font-mono text-[9px] text-zinc-500">M</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">ATM DENSITY</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${fmtSig(ui.rho, 3)}</span><span class="font-mono text-[9px] text-zinc-500">kg/m³</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">DYN PRESSURE</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${fmtFixed(ui.q, 1)}</span><span class="font-mono text-[9px] text-zinc-500">kPa</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">CONV HEAT FLUX</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-amber-400">${fmtFixed(ui.heat, 1)}</span><span class="font-mono text-[9px] text-zinc-500">W/cm²</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">SHOCK LAYER TEMP</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${fmtInt(ui.tShock)}</span><span class="font-mono text-[9px] text-zinc-500">K</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">DECELERATION</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${fmtFixed(ui.g, 2)}</span><span class="font-mono text-[9px] text-zinc-500">G</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">L/D RATIO</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${fmtFixed(ui.ld, 2)}</span></div>
      </div>
      <div class="rounded border border-white/8 bg-white/[0.03] px-2.5 py-2">
        <div class="font-mono text-[8.5px] tracking-widest text-zinc-500">DOWNRANGE</div>
        <div class="mt-0.5 flex items-baseline gap-1"><span class="font-mono text-[15px] font-bold text-zinc-100">${fmtInt(ui.downrange)}</span><span class="font-mono text-[9px] text-zinc-500">km</span></div>
      </div>
    `

    subMetricsRow.innerHTML = `
      <span>RAD HEAT <span class="text-zinc-300">${fmtFixed(ui.heatR, 2)}</span> W/cm²</span>
      <span>INTEGRATED <span class="text-zinc-300">${fmtFixed(ui.heatLoad, 1)}</span> MJ/m²</span>
      <span>BANK <span class="text-zinc-300">${fmtFixed(ui.sigma, 0)}°</span></span>
    `

    // Flight Card
    const peak = engine.peaks()
    flightCardWrap.innerHTML = `
      <div class="flex justify-between gap-2"><span class="text-zinc-600">MISSION</span><span class="text-right text-zinc-300">${ui.missionName}</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">BODY</span><span class="text-right text-zinc-300">${ui.planetName} · R=${(ui.planetId === 'mars' ? 3389.5 : 6371).toFixed(0)} km</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">VEHICLE</span><span class="text-right text-zinc-300">${ui.vehicleName}</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">MODE</span><span class="text-right text-zinc-300">${ui.mode.toUpperCase()}</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">PEAK Q̇ / n</span><span class="text-right text-zinc-300">${fmtFixed(peak.heat, 0)} W/cm² · ${fmtFixed(peak.g, 1)} G</span></div>
      <div class="flex justify-between gap-2"><span class="text-zinc-600">SIG ATTENUATION</span><span class="text-right text-zinc-300">${Math.round(ui.attenuation * 100)} %</span></div>
    `
  }

  updateAll()
  const unsubscribe = engine.subscribe(updateAll)
  container.appendChild(panel)

  return {
    dispose: () => {
      unsubscribe()
      panel.remove()
    },
  }
}
