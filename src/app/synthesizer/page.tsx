/**
 * ELEMENTA — Compound & Chemical Reaction Synthesizer Lab
 * Combines elements into binary and ternary chemical compounds, computes
 * temperature-dependent reaction thermodynamics (ΔH, ΔS, ΔG, Keq),
 * and renders interactive 3D WebGL molecular structures with CPK coloration.
 */

import { h, type VNode } from 'nexus-framework'
import { ElementaLogo } from '@/components/ElementaLogo'
import { GitHubLink } from '@/components/GitHubLink'
import { SynthesizerWorkbench } from '@/components/synthesizer/SynthesizerWorkbench'

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

export default function SynthesizerPage(): VNode {
  const params = new URLSearchParams(window.location.search)
  const zParam = Number(params.get('z') ?? 0)
  const initialZ = zParam >= 1 && zParam <= 118 ? zParam : undefined

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
        '· Compound & Reaction Synthesizer',
      ),
      H('div', { class: 'ml-auto flex items-center gap-1.5 overflow-x-auto max-w-full' },
        navBtn('Periodic table', './index.html'),
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
      SynthesizerWorkbench({ initialZ }),
    ),
  )
}
