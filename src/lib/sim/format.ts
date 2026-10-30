/* display formatting helpers */

export function fmtTime(t: number): string {
  const s = Math.max(0, Math.floor(t))
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return hh > 0 ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`
}

export function fmtFixed(n: number, d: number): string {
  return n.toFixed(d)
}

/** significant-digit formatting for small densities etc. */
export function fmtSig(n: number, sig: number): string {
  if (!isFinite(n)) return '—'
  if (n === 0) return '0'
  const d = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(n))))
  return n.toFixed(d)
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}
