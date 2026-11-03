import { h, type VNode } from 'nexus-framework'
import { runElementChecks, type CheckStatus, type IntegrityReport } from '@/lib/integrity'
import { runNuclearChecks } from '@/lib/integrity-nuclear'
import { ElementaLogo } from '@/components/ElementaLogo'

function H(tag: any, props?: any, ...children: any[]): VNode { return h(tag, props, ...children) as VNode }

function StatusBadge({ status }: { status: CheckStatus }): VNode {
  const colors = status === 'pass'
    ? { color: '#34d399', label: 'pass' }
    : status === 'warn'
      ? { color: '#fbbf24', label: 'warn' }
      : { color: '#fb7185', label: 'fail' }
  return H('span', {
    class: 'rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider',
    style: { color: colors.color, borderColor: colors.color + '66', background: colors.color + '14' },
  }, colors.label)
}

function CheckRow({ status, label, detail }: { status: CheckStatus; label: string; detail: string }): VNode {
  const color = status === 'pass' ? '#34d399' : status === 'warn' ? '#fbbf24' : '#fb7185'
  return H('div', { class: 'flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2' },
    H('span', { class: 'mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full', style: { background: color } }),
    H('div', null,
      H('div', { class: 'text-[11px] font-medium text-zinc-200' }, label),
      H('div', { class: 'mt-0.5 text-[9.5px] leading-relaxed text-zinc-500' }, detail)))
}

function StatCard({ report }: { report: IntegrityReport }): VNode {
  const failed = report.fail > 0
  const warned = report.warn > 0
  const ok = report.pass > 0 && !failed && !warned
  return H('div', { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
    H('div', { class: 'text-[9px] uppercase tracking-wider text-zinc-500' }, report.scope),
    H('div', { class: 'mt-1.5 flex items-baseline gap-2' },
      H('span', { class: 'text-2xl font-bold', style: { color: failed ? '#fb7185' : warned ? '#fbbf24' : '#34d399' } }, report.pass),
      H('span', { class: 'text-[10px] text-zinc-500' }, 'of ' + report.checks.length + ' checks pass - ' + report.warn + ' warn - ' + report.fail + ' fail')),
    H('div', { class: 'mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]' },
      H('div', { style: { width: (report.pass / report.checks.length) * 100 + '%', height: '100%', background: failed ? '#fb7185' : warned ? '#fbbf24' : '#34d399' } })))
}

export default function IntegrityPage(): VNode {
  const elementReport = runElementChecks()
  const nuclearReport = runNuclearChecks()

  const elementChecks = H('div', { class: 'space-y-1.5' },
    ...elementReport.checks.map((check) => H(CheckRow, { key: check.id, status: check.status, label: check.label, detail: check.detail })))

  const nuclearChecks = H('div', { class: 'space-y-1.5' },
    ...nuclearReport.checks.map((check) => H(CheckRow, { key: check.id, status: check.status, label: check.label, detail: check.detail })))

  const back = H('a', { href: './index.html', class: 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-300 transition hover:bg-white/5' }, 'Back to the periodic table')

  const referencesLink = H('a', { href: './references.html', class: 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-300 transition hover:bg-white/5' }, 'References')

  const checksHeading = (title: string, children: VNode) => H('div', { class: 'rounded-xl border border-white/10 bg-[#0a0f18] p-3' },
    H('h2', { class: 'text-[12px] font-semibold text-zinc-100' }, title),
    children)

  return H('div', { class: 'min-h-dvh bg-[#070a10] text-zinc-200' },
    H('header', { class: 'sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0a0f18]/95 px-4 backdrop-blur' },
      H('div', { class: 'flex items-center gap-2.5' },
        ElementaLogo({ size: 26 }),
        H('h1', { class: 'text-[15px] font-bold tracking-[0.2em] text-zinc-100' }, 'ELEM', H('span', { class: 'text-amber-400' }, 'E'), 'NTA'),
      ),
      H('span', { class: 'hidden font-mono text-[10px] text-zinc-500 lg:inline' }, 'data integrity'),
      H('a', { href: './index.html', class: 'ml-auto shrink-0 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/25 hover:text-zinc-200' }, 'Back to the periodic table')),
    H('main', { class: 'mx-auto max-w-5xl space-y-5 p-4 lg:p-6 lg:space-y-6' },
      H('div', { class: 'grid gap-3 sm:grid-cols-2' }, H(StatCard, { report: elementReport }), H(StatCard, { report: nuclearReport })),
      checksHeading('Element-table checks', H('div', { class: 'mt-2 space-y-1.5' }, elementChecks, H('div', { class: 'mt-3 flex flex-wrap gap-2' }, referencesLink, back))),
      checksHeading('Nuclear-dataset checks', H('div', { class: 'mt-2 space-y-1.5' }, nuclearChecks, H('div', { class: 'mt-3 flex flex-wrap gap-2' }, referencesLink, back)))))
}
