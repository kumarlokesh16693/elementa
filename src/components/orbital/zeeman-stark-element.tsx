import { effect, mount, patch, unmount, type VNode } from 'nexus-framework'
import { ZeemanStarkLabNexus, initZeemanStarkState } from './ZeemanStarkLabNexus'

export class ElementaZeemanStarkModalElement extends HTMLElement {
  private vnode: VNode | null = null
  private stopEffect: (() => void) | null = null
  public presetId: string = 'cadmium-normal'

  static get observedAttributes(): string[] {
    return ['data-preset']
  }

  connectedCallback(): void {
    this.readAttrs()
    initZeemanStarkState(this.presetId)

    this.classList.add(
      'fixed',
      'inset-0',
      'z-50',
      'flex',
      'items-center',
      'justify-center',
      'p-4',
      'md:p-6',
      'bg-black/80',
      'backdrop-blur-sm',
    )

    const runner = effect(() => {
      const next = ZeemanStarkLabNexus({
        onClose: () => {
          this.dispatchEvent(new CustomEvent('closezeemanstark', { bubbles: true, composed: true }))
          this.dispatchEvent(new CustomEvent('close-zeeman-stark', { bubbles: true, composed: true }))
        },
        onSelectPreset: (preset) => {
          this.dispatchEvent(
            new CustomEvent('selectzeemanpreset', {
              bubbles: true,
              composed: true,
              detail: { preset },
            }),
          )
        },
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
    if (this.vnode) {
      unmount(this.vnode)
      this.vnode = null
    }
    if (this.childNodes.length > 0) this.replaceChildren()
  }

  attributeChangedCallback(): void {
    this.readAttrs()
    if (this.isConnected) {
      initZeemanStarkState(this.presetId)
    }
  }

  private readAttrs(): void {
    if (this.hasAttribute('data-preset')) {
      this.presetId = this.getAttribute('data-preset') || 'cadmium-normal'
    }
  }
}

if (!customElements.get('elementa-zeeman-stark-modal')) {
  customElements.define('elementa-zeeman-stark-modal', ElementaZeemanStarkModalElement)
}
