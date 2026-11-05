import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import SpectroscopyPage from '../app/spectroscopy/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /spectroscopy] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = SpectroscopyPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
