import { mount, patch, unmount, effect, reactive, h, type VNode } from 'nexus-framework'
import { getElement } from '@/lib/periodic'
import { Bohr2D } from './Bohr2D'
import './bohr-3d-element'
import './crystal-element'
import './spectra-element'
import IsotopeModal from './IsotopeModal'
import { QMViewerNexus } from '@/components/orbital/QMViewerNexus'

type ViewerKind = '2d' | 'qm' | 'spectra' | '3d' | 'crystal'

class ElementaModelViewElement extends HTMLElement {
  private vnode: VNode | null = null
  private stopEffect: (() => void) | null = null
  private props: {
    z: number
    accent: string
    model: ViewerKind
    paused: boolean
    speed: number
  } | null = null

  static get observedAttributes(): string[] {
    return ['data-z', 'data-accent', 'data-model', 'data-paused', 'data-speed']
  }

  connectedCallback(): void {
    const props = reactive({
      z: Number(this.getAttribute('data-z') ?? 0),
      accent: this.getAttribute('data-accent') ?? '#fbbf24',
      model: (this.getAttribute('data-model') ?? '2d') as ViewerKind,
      paused: this.getAttribute('data-paused') === 'true',
      speed: Number(this.getAttribute('data-speed') ?? 1),
    })
    this.props = props

    const runner = effect(() => {
      this.renderView()
    })
    this.stopEffect = () => runner.stop()
  }

  disconnectedCallback(): void {
    this.stopEffect?.()
    this.stopEffect = null
    this.props = null
    this.teardown()
  }

  attributeChangedCallback(): void {
    if (!this.isConnected || !this.props) return
    this.props.z = Number(this.getAttribute('data-z') ?? 0)
    this.props.accent = this.getAttribute('data-accent') ?? '#fbbf24'
    this.props.model = (this.getAttribute('data-model') ?? '2d') as ViewerKind
    this.props.paused = this.getAttribute('data-paused') === 'true'
    this.props.speed = Number(this.getAttribute('data-speed') ?? 1)
  }

  private teardown(): void {
    if (this.vnode) {
      unmount(this.vnode)
      this.vnode = null
    }
    if (this.childNodes.length > 0) this.replaceChildren()
  }

  private renderView(): void {
    const z = this.props ? this.props.z : Number(this.getAttribute('data-z'))
    const element = getElement(z)
    if (!element) return
    const model = this.props ? this.props.model : ((this.getAttribute('data-model') ?? '2d') as ViewerKind)
    const accent = this.props ? this.props.accent : (this.getAttribute('data-accent') ?? '#fbbf24')
    const paused = this.props ? this.props.paused : (this.getAttribute('data-paused') === 'true')
    const speed = this.props ? this.props.speed : Number(this.getAttribute('data-speed') ?? 1)

    let next: any = null

    if (model === '2d') {
      next = Bohr2D({ element, accent, speed, animated: !paused })
    } else if (model === 'qm') {
      next = QMViewerNexus({ z: element.number, paused, speed })
    } else if (model === '3d') {
      next = h('elementa-bohr-3d', {
        'data-z': element.number,
        'data-accent': accent,
        'data-speed': speed,
        'data-paused': String(paused),
      })
    } else if (model === 'crystal') {
      next = h('elementa-crystal-view', {
        'data-z': element.number,
        'data-speed': speed,
        'data-paused': String(paused),
      })
    } else if (model === 'spectra') {
      next = h('elementa-spectra-view', {
        'data-z': element.number,
        'data-accent': accent,
      })
    }

    if (!next) return

    if (this.vnode) {
      patch(this.vnode, next, this)
    } else {
      this.teardown()
      mount(next, this)
    }
    this.vnode = next
  }
}

class ElementaIsotopeExplorerElement extends HTMLElement {
  private vnode: VNode | null = null
  private stopEffect: (() => void) | null = null
  private props: { z: number; accent: string; open: boolean } | null = null

  static get observedAttributes(): string[] {
    return ['data-z', 'data-accent', 'data-open']
  }

  connectedCallback(): void {
    const props = reactive({
      z: Number(this.getAttribute('data-z') ?? 0),
      accent: this.getAttribute('data-accent') ?? '#fbbf24',
      open: this.getAttribute('data-open') === 'true',
    })
    this.props = props

    const runner = effect(() => {
      const element = getElement(props.z)
      if (!element) return
      const next = IsotopeModal({
        element,
        accent: props.accent,
        open: props.open,
        onClose: () => window.dispatchEvent(new Event('elementa-isotope-close')),
      })
      if (this.vnode) patch(this.vnode, next, this)
      else mount(next, this)
      this.vnode = next
    })
    this.stopEffect = () => runner.stop()
  }

  disconnectedCallback(): void {
    this.stopEffect?.()
    this.stopEffect = null
    this.props = null
    if (this.vnode) {
      unmount(this.vnode)
      this.vnode = null
    }
    if (this.childNodes.length > 0) this.replaceChildren()
  }

  attributeChangedCallback(): void {
    if (!this.isConnected || !this.props) return
    this.props.z = Number(this.getAttribute('data-z') ?? 0)
    this.props.accent = this.getAttribute('data-accent') ?? '#fbbf24'
    this.props.open = this.getAttribute('data-open') === 'true'
  }
}

if (!customElements.get('elementa-model-view')) customElements.define('elementa-model-view', ElementaModelViewElement)
if (!customElements.get('elementa-isotope-explorer')) customElements.define('elementa-isotope-explorer', ElementaIsotopeExplorerElement)
