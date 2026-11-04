import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import RelativityPage from '../app/relativity/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /relativity] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = RelativityPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
