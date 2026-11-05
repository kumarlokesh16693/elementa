import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import ElectrochemistryPage from '../app/electrochemistry/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /electrochemistry] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = ElectrochemistryPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
