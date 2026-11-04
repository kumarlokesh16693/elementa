import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import QuantumWavePage from '../app/quantumwave/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /quantumwave] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = QuantumWavePage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
