import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import EMLabPage from '../app/em/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /em] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = EMLabPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
