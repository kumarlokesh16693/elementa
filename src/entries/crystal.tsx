import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import CrystalPage from '../app/crystal/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /crystal] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = CrystalPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
