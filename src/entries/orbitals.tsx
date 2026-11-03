import { effect, mount, patch, type VNode } from 'nexus-framework'
import OrbitalLabPage from '../app/orbitals/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /orbitals] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = OrbitalLabPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
