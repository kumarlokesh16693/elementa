import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import BandsPage from '../app/bands/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /bands] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = BandsPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
