#!/usr/bin/env python3
"""Generate src/lib/periodic/nuclide-data.ts from the IAEA LiveChart ground-states CSV.

Source: IAEA LiveChart (https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=all),
ENSDF-based nuclear data, extraction date 2023-10-18.

Row format (pipe separated, one nuclide per line):
  z|n|hl|d1|d2|d3|jp|ab|me|disc
  hl : 'S' stable | '<x'/'>x' experimental bound | '-1' unknown | '-2' unbound resonance
       | half-life in seconds (e.g. 613.9, 1.41e17)
  di : 'CODE' or 'CODE:percent'  (decay mode, branching % if given)
  jp : spin-parity string, may be empty
  ab : natural abundance % (stable isotopes), may be empty
  me : atomic mass excess in keV (may be empty)
  disc: discovery year, may be empty
"""
import csv, re, sys

SRC = '/tmp/iaea_ground.csv'
OUT = '/home/z/my-project/src/lib/periodic/nuclide-data.ts'

UNBOUND_UNITS = {'keV', 'MeV', 'eV'}

def clean_pct(s: str):
    s = s.strip().replace('%', '')
    if not s:
        return None
    m = re.match(r'([0-9]+(?:\.[0-9]+)?)', s)
    return float(m.group(1)) if m else None

def fmt_hl(row):
    hl = row['half_life_sec'].strip()
    unit = row['unit_hl'].strip()
    op = row['operator_hl'].strip()
    txt = row['half_life'].strip()
    if txt.upper() == 'STABLE':
        return 'S'
    if unit in UNBOUND_UNITS:
        return '-2'  # unbound resonance (width-like quantity)
    if not hl:
        return '-1'  # no measured value
    v = float(hl)
    if v <= 0 or v != v:
        return '-1'
    # significant-digit compact formatting
    if op in ('GT', 'GE', '>'):
        return '>%.4g' % v
    if op in ('LT', 'LE', '<'):
        return '<%.4g' % v
    return '%.4g' % v

def fmt_me(s: str):
    s = s.strip()
    if not s:
        return ''
    try:
        v = float(s)
    except ValueError:
        return ''
    t = ('%.3f' % v).rstrip('0').rstrip('.')
    return t if t not in ('-0', '') else '0'

def main():
    rows = list(csv.DictReader(open(SRC)))
    kept, seen, dupes = [], set(), 0
    for r in rows:
        z, n = int(r['z']), int(r['n'])
        if z == 0 and n != 1:      # bogus resonance rows (0,4), (0,6)
            continue
        key = (z, n)
        if key in seen:
            dupes += 1
            continue
        seen.add(key)
        decays = []
        for i in (1, 2, 3):
            code = r[f'decay_{i}'].strip().upper().replace(' ', '')
            if not code:
                continue
            pct = clean_pct(r[f'decay_{i}_%'])
            decays.append(code if pct is None else f'{code}:{pct:g}')
        jp = r['jp'].strip()
        ab = r['abundance'].strip()
        disc = r['discovery'].strip()
        disc = re.match(r'[0-9]{4}', disc).group(0) if re.match(r'[0-9]{4}', disc) else ''
        fields = [str(z), str(n), fmt_hl(row := r)] + decays[:3] + [''] * (3 - len(decays[:3]))
        fields += [jp, ('%.4g' % float(ab)) if ab else '', fmt_me(r['atomic_mass_excess'] if 'atomic_mass_excess' in r else r['massexcess']), disc]
        kept.append('|'.join(fields))

    body = '\n'.join(kept)
    n_stable = sum(1 for k in kept if k.split('|')[2] == 'S')
    n_unb = sum(1 for k in kept if k.split('|')[2] == '-2')
    n_unk = sum(1 for k in kept if k.split('|')[2] == '-1')

    ts = f'''// GENERATED from IAEA LiveChart ground states (ENSDF-based, extraction 2023-10-18)
// https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=all
// Row: z|n|hl|d1|d2|d3|jp|ab|me|disc  — see scripts/gen_nuclides.py for the exact encoding.

export const NUCLIDE_RAW = `
{body}`
'''
    open(OUT, 'w').write(ts)

    print(f'nuclides: {len(kept)} (dupes dropped: {dupes})')
    print(f'stable: {n_stable}  unbound: {n_unb}  unknown-hl: {n_unk}')
    print(f'file size: {len(ts)/1024:.0f} KB')

    # ---- sanity spot checks ----
    by = {}
    for k in kept:
        f = k.split('|')
        by[(int(f[0]), int(f[1]))] = f
    import math
    def hl_of(zn):
        f = by[zn][2]
        if f in ('S', '-1', '-2') or f[0] in '<>':
            return f
        return float(f)
    checks = [
        ((26, 30), 'Fe-56 stable', lambda v: v == 'S'),
        ((92, 146), 'U-238 ~1.41e17 s', lambda v: isinstance(v, float) and 1.3e17 < v < 1.5e17),
        ((6, 8), 'C-14 ~1.8e11 s', lambda v: isinstance(v, float) and 1.6e11 < v < 2.0e11),
        ((2, 1), 'He-3 stable', lambda v: v == 'S'),
        ((118, 176), 'Og-294 finite hl', lambda v: isinstance(v, float) and v > 0),
        ((0, 1), 'free neutron ~613.9 s', lambda v: isinstance(v, float) and 600 < v < 630),
    ]
    ok = True
    for zn, name, pred in checks:
        v = hl_of(zn)
        good = pred(v)
        ok &= good
        print(('PASS' if good else 'FAIL'), name, '->', v)
    u238 = by[(92, 146)]
    print('U-238 row:', u238)
    fe56 = by[(26, 30)]
    print('Fe-56 row: ab=%s me=%s jp=%s' % (fe56[7], fe56[8], fe56[6]))
    if not ok:
        sys.exit('sanity checks FAILED')
    # decay code inventory after normalization
    codes = {}
    for k in kept:
        for d in k.split('|')[3:6]:
            if d:
                codes[d.split(':')[0]] = codes.get(d.split(':')[0], 0) + 1
    print('decay codes:', sorted(codes.items(), key=lambda x: -x[1]))

if __name__ == '__main__':
    main()
