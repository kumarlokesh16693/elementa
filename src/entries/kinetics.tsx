import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import KineticsPage from '../app/kinetics/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /kinetics] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = KineticsPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
