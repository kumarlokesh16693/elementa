/**
 * ELEMENTA — Nuclear Fission Reactor Core & Criticality Simulator Page
 */

import { h, type VNode } from 'nexus-framework'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'
import { ReactorWorkbench } from '@/components/reactor/ReactorWorkbench'

function H(tag: any, props?: any, ...children: any[]): VNode {
  return h(tag, props, ...children) as VNode
}

function navBtn(label: string, href: string, tint = 'border-white/10 text-zinc-300 hover:border-white/25'): VNode {
  return H(
    'a',
    {
      href,
      class: `rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${tint}`,
    },
    label,
  )
}

export default function ReactorPage(): VNode {
  return H(
    'div',
    { class: 'flex h-dvh flex-col bg-[#070a12] text-zinc-100 overflow-hidden' },
    // Global Header
    H(
      'header',
      {
        class:
          'flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur z-20',
      },
      H(
        'a',
        { href: './index.html', class: 'flex items-center gap-2.5 hover:opacity-90 transition' },
        ElementaLogo({ size: 28 }),
        H(
          'span',
          { class: 'text-[17px] font-bold tracking-[0.22em] text-zinc-100' },
          'ELEM',
          H('span', { class: 'text-amber-400' }, 'E'),
          'NTA',
        ),
      ),
      H(
        'span',
        { class: 'hidden font-mono text-[11px] text-zinc-500 md:inline' },
        '· Nuclear Fission Reactor & Criticality Lab',
      ),
      H('div', { class: 'ml-auto flex items-center gap-1.5 overflow-x-auto max-w-full' },
        navBtn('Periodic table', './index.html'),
        navBtn('Kinetics', './kinetics.html', 'border-amber-400/40 bg-amber-400/10 text-amber-300'),
        navBtn('Spectroscopy', './spectroscopy.html', 'border-purple-400/40 bg-purple-400/10 text-purple-300'),
        navBtn('Electrochem', './electrochemistry.html', 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'),
        navBtn('Synthesizer', './synthesizer.html', 'border-rose-400/40 bg-rose-400/10 text-rose-300'),
        navBtn('Crystal & XRD', './crystal.html'),
        navBtn('MO builder', './mo.html'),
        navBtn('Orbital lab', './orbitals.html'),
        navBtn('EM lab', './em.html'),
        navBtn('Thermo lab', './thermo.html'),
        navBtn('Relativity lab', './relativity.html'),
        navBtn('Quantum wave lab', './quantumwave.html'),
        navBtn('Segrè chart', './segre.html'),
        GitHubLink(),
      ),
    ),

    // Main Workbench Content
    H(
      'main',
      { class: 'relative flex-1 overflow-hidden min-h-0' },
      ReactorWorkbench(),
    ),
  )
}
