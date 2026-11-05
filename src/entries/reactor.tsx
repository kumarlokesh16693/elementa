import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import ReactorPage from '../app/reactor/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /reactor] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = ReactorPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
