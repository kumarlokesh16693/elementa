import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import ReferencesPage from '../app/references/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /references] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = ReferencesPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
