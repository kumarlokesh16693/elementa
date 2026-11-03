import { SimEngine } from '@/lib/sim/engine'
import { createScene3D } from './Scene3DNexus'
import { createColorBar, createTelemetryCharts } from './TelemetryNexus'
import { createControlPanel } from './ControlPanelNexus'

export class ElementaDaedalusSimElement extends HTMLElement {
  private engine: SimEngine | null = null
  private cleanups: Array<() => void> = []

  connectedCallback(): void {
    this.style.display = 'block'
    this.style.width = '100%'
    this.style.height = '100%'
    this.replaceChildren()

    const engine = new SimEngine()
    this.engine = engine

    const root = document.createElement('div')
    root.className = 'flex h-dvh w-full overflow-hidden bg-[#070a10] text-zinc-200'

    // Left Scene & Telemetry container
    const leftPane = document.createElement('div')
    leftPane.className = 'relative min-w-0 flex-1'

    // Scene 3D mount
    const sceneMount = document.createElement('div')
    sceneMount.className = 'absolute inset-0'
    leftPane.appendChild(sceneMount)

    // Back to elementa link
    const backLink = document.createElement('a')
    backLink.href = './index.html'
    backLink.className = 'absolute left-3 top-3 z-10 rounded-md border border-white/15 bg-black/55 px-2.5 py-1.5 font-mono text-[10px] tracking-widest text-zinc-400 backdrop-blur-sm transition hover:border-white/25 hover:text-zinc-200'
    backLink.textContent = '← ELEMENTA'
    leftPane.appendChild(backLink)

    root.appendChild(leftPane)

    // Right aside Control Panel
    const aside = document.createElement('aside')
    aside.className = 'w-[380px] shrink-0 overflow-y-auto border-l border-white/10 bg-[#0a0f18]/95'
    root.appendChild(aside)

    this.appendChild(root)

    // Initialize sub-controllers
    const sceneHandle = createScene3D(sceneMount, engine)
    const colorBarHandle = createColorBar(leftPane, engine)
    const telemetryHandle = createTelemetryCharts(leftPane, engine)
    const panelHandle = createControlPanel(aside, engine)

    this.cleanups.push(
      () => sceneHandle.dispose(),
      () => colorBarHandle.dispose(),
      () => telemetryHandle.dispose(),
      () => panelHandle.dispose(),
    )
  }

  disconnectedCallback(): void {
    this.cleanups.forEach((c) => c())
    this.cleanups = []
    this.engine = null
    this.replaceChildren()
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-daedalus-sim')) {
  customElements.define('elementa-daedalus-sim', ElementaDaedalusSimElement)
}
