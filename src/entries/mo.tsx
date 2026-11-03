import { effect, mount, patch, type VNode } from 'nexus-framework'
import MoBuilderPage from '../app/mo/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /mo] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = MoBuilderPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
