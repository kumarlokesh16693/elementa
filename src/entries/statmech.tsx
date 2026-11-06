import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import StatMechPage from '../app/statmech/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /statmech] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = StatMechPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
