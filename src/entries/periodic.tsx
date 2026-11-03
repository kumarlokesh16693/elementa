import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import PeriodicTablePage from '../app/page'
import '../components/periodic/detail-element'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = PeriodicTablePage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
