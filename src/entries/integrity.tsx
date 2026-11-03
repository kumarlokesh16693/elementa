import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import IntegrityPage from '../app/integrity/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /integrity] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = IntegrityPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
