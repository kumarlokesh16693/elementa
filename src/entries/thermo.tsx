import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import ThermoPage from '../app/thermo/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /thermo] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = ThermoPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
