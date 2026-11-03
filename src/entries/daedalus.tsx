import { effect, mount, patch, type VNode } from 'nexus-framework'
import DaedalusPage from '../app/daedalus/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /daedalus] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = DaedalusPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
