import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import OpticsPage from '../app/optics/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /optics] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = OpticsPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
