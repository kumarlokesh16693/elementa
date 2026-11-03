import { effect, mount, patch, unmount, type VNode } from 'nexus-framework'
import { NucleosynthesisModalNexus, initAstroState } from './NucleosynthesisModalNexus'
import { nucAt, type Nuclide } from '@/lib/periodic/nuclides'

export class ElementaNucleosynthesisModalElement extends HTMLElement {
  private vnode: VNode | null = null
  private stopEffect: (() => void) | null = null
  public nuclide: Nuclide | null = null

  static get observedAttributes(): string[] {
    return ['data-z', 'data-n']
  }

  connectedCallback(): void {
    this.readAttrs()
    initAstroState(this.nuclide)
    const runner = effect(() => {
      const next = NucleosynthesisModalNexus({
        initialNuclide: this.nuclide,
        onClose: () => {
          this.dispatchEvent(new CustomEvent('closenucleosynthesis', { bubbles: true, composed: true }))
          this.dispatchEvent(new CustomEvent('close-nucleosynthesis', { bubbles: true, composed: true }))
        },
        onSelectNuclide: (nuc) => {
          this.dispatchEvent(
            new CustomEvent('selectnucleosynthesisnuclide', {
              bubbles: true,
              composed: true,
              detail: { nuclide: nuc },
            }),
          )
          this.dispatchEvent(
            new CustomEvent('select-nucleosynthesis-nuclide', {
              bubbles: true,
              composed: true,
              detail: { nuclide: nuc },
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
    if (this.isConnected && this.nuclide) {
      initAstroState(this.nuclide)
    }
  }

  private readAttrs(): void {
    if (this.hasAttribute('data-z') && this.hasAttribute('data-n')) {
      const z = Number(this.getAttribute('data-z'))
      const n = Number(this.getAttribute('data-n'))
      this.nuclide = nucAt(z, n) ?? null
    }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('elementa-nucleosynthesis-modal')) {
  customElements.define('elementa-nucleosynthesis-modal', ElementaNucleosynthesisModalElement)
}
