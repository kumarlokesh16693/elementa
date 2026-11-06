import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import ParticlePage from '../app/particle/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /particle] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = ParticlePage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
