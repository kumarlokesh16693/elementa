import { effect, mount, patch, type VNode } from 'nexus-framework'
import SegrePage from '../app/segre/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /segre] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = SegrePage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
