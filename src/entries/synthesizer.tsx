import { effect, h, mount, patch, type VNode } from 'nexus-framework'
import SynthesizerPage from '../app/synthesizer/page'
import '../index.css'

const root = document.getElementById('root')
if (!root) throw new Error('[ELEMENTA /synthesizer] missing #root container')

let vnode: VNode | null = null
effect(() => {
  const next = SynthesizerPage()
  if (vnode) patch(vnode, next, root)
  else mount(next, root)
  vnode = next
})
