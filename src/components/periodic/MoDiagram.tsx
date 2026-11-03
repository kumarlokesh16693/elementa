import { h, type VNode } from 'nexus-framework';
import { getElement } from '@/lib/periodic';

/**
 * Molecular-orbital diagram engine for diatomic molecules built from
 * H–Ne (generic second-row MO treatment). Energies are schematic; the
 * σ(2p)/π(2p) ordering switches with s–p mixing at ZA + ZB ≤ 14.
 */

export interface MoLine {
  y: number;
  up: boolean;
  down: boolean;
}

export interface MoSlot {
  key: string;
  label: string;
  type: 'bonding' | 'antibonding';
  y: number;
  /** degenerate π pair line offsets (Hund split), when present */
  pair?: [number, number];
  lines: MoLine[];
  count: number;
}

export interface AtomColumn {
  z: number;
  sym: string;
  chi: number | null;
  cx: number;
  dy: number;
  oneY: number;
  oneE: number;
  twoY?: number;
  twoE?: number;
  pY?: number;
  pE?: number;
}

export interface MoResult {
  valid: boolean;
  reason?: string;
  fullLadder: boolean;
  piBelowSigma: boolean;
  slots: MoSlot[];
  atoms: [AtomColumn, AtomColumn];
  totalElectrons: number;
  bondOrder: number;
  unpaired: number;
  homo: string;
  lumo: string;
  config: string;
}

const SUP: Record<number, string> = { 1: '¹', 2: '²', 3: '³', 4: '⁴' };

export function computeMo(zA: number, zB: number): MoResult {
  const elA = getElement(zA)!;
  const elB = getElement(zB)!;
  const hetero = zA !== zB;
  const maxZ = Math.max(zA, zB);
  const minZ = Math.min(zA, zB);

  if (maxZ >= 3 && minZ <= 2) {
    return {
      valid: false,
      reason:
        'Energy mismatch — the H/He 1s level lies far from the second-row 2s/2p manifold. Pick both atoms from H–He, or both from Li–Ne.',
      fullLadder: false,
      piBelowSigma: false,
      slots: [],
      atoms: [] as unknown as [AtomColumn, AtomColumn],
      totalElectrons: 0,
      bondOrder: 0,
      unpaired: 0,
      homo: '—',
      lumo: '—',
      config: '—',
    };
  }

  const chiA = elA.electronegativity;
  const chiB = elB.electronegativity;
  if (hetero && (chiA == null || chiB == null)) {
    return {
      valid: false,
      reason: `No meaningful MO diagram: ${chiA == null ? elA.name : elB.name} has no defined electronegativity — its AO energy is too far from its partner's for a generic diagram.`,
      fullLadder: false,
      piBelowSigma: false,
      slots: [] as MoSlot[],
      atoms: [] as unknown as [AtomColumn, AtomColumn],
      totalElectrons: 0,
      bondOrder: 0,
      unpaired: 0,
      homo: '—',
      lumo: '—',
      config: '—',
    };
  }

  const fullLadder = maxZ >= 3;
  const total = zA + zB;
  const piBelowSigma = fullLadder && total <= 14; // s–p mixing regime (B₂, C₂, N₂, CO, BF…)

  /* ---- AO columns ---- */
  const dChi = (chiA ?? 0) - (chiB ?? 0);
  const off = hetero ? Math.min(36, Math.round(Math.abs(dChi) * 20)) : 0;
  // the more electronegative atom's levels sit lower (larger y)
  const dyA = hetero && dChi > 0 ? -off / 2 : off / 2;
  const dyB = -dyA;

  const mkAtom = (z: number, cx: number, dy: number): AtomColumn => {
    const el = getElement(z)!;
    if (!fullLadder) {
      return { z, sym: el.symbol, chi: el.electronegativity, cx, dy, oneY: 280 + dy, oneE: z };
    }
    return {
      z,
      sym: el.symbol,
      chi: el.electronegativity,
      cx,
      dy,
      oneY: 504 + dy,
      oneE: 2,
      twoY: 402 + dy,
      twoE: 2,
      pY: 263 + dy,
      pE: z - 4,
    };
  };
  const atoms: [AtomColumn, AtomColumn] = [mkAtom(zA, 150, dyA), mkAtom(zB, 770, dyB)];

  /* ---- MO slots (energy order: array index 0 = LOWEST energy) ---- */
  const raw: { key: string; label: string; type: 'bonding' | 'antibonding'; y: number; pair?: [number, number] }[] =
    fullLadder
      ? [
          { key: 's1s', label: 'σ1s', type: 'bonding', y: 504 },
          { key: 's*1s', label: 'σ*1s', type: 'antibonding', y: 458 },
          { key: 's2s', label: 'σ2s', type: 'bonding', y: 402 },
          { key: 's*2s', label: 'σ*2s', type: 'antibonding', y: 356 },
          ...(piBelowSigma
            ? [
                { key: 'pi2p', label: 'π2p', type: 'bonding' as const, y: 291, pair: [283, 299] as [number, number] },
                { key: 's2p', label: 'σ2p', type: 'bonding' as const, y: 235 },
              ]
            : [
                { key: 's2p', label: 'σ2p', type: 'bonding' as const, y: 291 },
                { key: 'pi2p', label: 'π2p', type: 'bonding' as const, y: 235, pair: [227, 243] as [number, number] },
              ]),
          { key: 'pi*2p', label: 'π*2p', type: 'antibonding', y: 166, pair: [158, 174] as [number, number] },
          { key: 's*2p', label: 'σ*2p', type: 'antibonding', y: 110 },
        ]
      : [
          { key: 's1s', label: 'σ1s', type: 'bonding', y: 360 },
          { key: 's*1s', label: 'σ*1s', type: 'antibonding', y: 220 },
        ];

  /* ---- Aufbau + Hund filling ---- */
  type Cell = { slot: (typeof raw)[number]; lineIdx: number };
  const fillOrder: Cell[] = [];
  for (const slot of raw) {
    if (slot.pair) {
      // Hund across the degenerate pair: e1 → L0↑, e2 → L1↑, e3 → L0↓, e4 → L1↓
      fillOrder.push({ slot, lineIdx: 0 }, { slot, lineIdx: 1 }, { slot, lineIdx: 0 }, { slot, lineIdx: 1 });
    } else {
      fillOrder.push({ slot, lineIdx: 0 }, { slot, lineIdx: 0 });
    }
  }
  const occupied = fillOrder.slice(0, total);

  const slots: MoSlot[] = raw.map((slot) => {
    const lineYs = slot.pair ?? [slot.y];
    const lines: MoLine[] = lineYs.map((y) => ({ y, up: false, down: false }));
    const count = occupied.filter((c) => c.slot === slot).length;
    if (slot.pair) {
      if (count >= 1) lines[0].up = true;
      if (count >= 2) lines[1].up = true;
      if (count >= 3) lines[0].down = true;
      if (count >= 4) lines[1].down = true;
    } else {
      lines[0].up = count >= 1;
      lines[0].down = count >= 2;
    }
    return { ...slot, lines, count };
  });

  /* ---- observables ---- */
  const bondingKeys = ['s1s', 's2s', 'pi2p', 's2p'];
  const bonding = slots.filter((s) => bondingKeys.includes(s.key)).reduce((n, s) => n + s.count, 0);
  const antibonding = slots
    .filter((s) => !bondingKeys.includes(s.key))
    .reduce((n, s) => n + s.count, 0);
  const bondOrder = (bonding - antibonding) / 2;
  const unpaired = slots.reduce(
    (n, s) => n + s.lines.filter((l) => l.up !== l.down).length,
    0,
  );

  const lastFilled = [...slots].reverse().find((s) => s.count > 0);
  const firstUnfilled = slots.find((s) => s.count < (s.pair ? 4 : 2));
  const homo = lastFilled?.label ?? '—';
  let lumo = firstUnfilled?.label ?? '—';
  if (firstUnfilled && firstUnfilled.count > 0) lumo += ' (SOMO)';

  const config = slots
    .filter((s) => s.count > 0)
    .map((s) => `${s.label}${SUP[s.count] ?? s.count}`)
    .join(' ');

  return {
    valid: true,
    fullLadder,
    piBelowSigma,
    slots,
    atoms,
    totalElectrons: total,
    bondOrder,
    unpaired,
    homo,
    lumo,
    config,
  };
}

/* ------------------------------ SVG rendering ------------------------------ */

const BOND = '#34d399';
const ANTI = '#fb7185';
const AO = '#a1a1aa';
const INK = '#f8fafc';

function ElectronArrows({ x, y, line }: { x: number; y: number; line: MoLine }): VNode {
  const children: VNode[] = [];
  if (line.up) {
    children.push(h('text', { x: x - 15, y: y + 4.5, 'text-anchor': 'middle', 'font-size': '14', fill: INK, 'font-weight': '600' }, '↑') as VNode);
  }
  if (line.down) {
    children.push(h('text', { x: x + 15, y: y + 4.5, 'text-anchor': 'middle', 'font-size': '14', fill: INK, 'font-weight': '600' }, '↓') as VNode);
  }
  return h('g', null, ...children) as VNode;
}

function AtomSide({ atom, full }: { atom: AtomColumn; full: boolean }): VNode {
  const stubs = [-22, 0, 22];
  const children: VNode[] = [];
  // 1s
  children.push(h('line', { x1: atom.cx - 55, x2: atom.cx + 55, y1: atom.oneY, y2: atom.oneY, stroke: AO, 'stroke-width': '2.5', 'stroke-linecap': 'round' }) as VNode);
  children.push(h('text', { x: atom.cx - 66, y: atom.oneY + 4, 'text-anchor': 'end', 'font-size': '11', fill: AO, 'font-family': 'monospace' }, '1s') as VNode);
  ElectronArrows({ x: atom.cx, y: atom.oneY, line: { y: 0, up: atom.oneE >= 1, down: atom.oneE >= 2 } });
  if (full && atom.twoY != null) {
    children.push(h('line', { x1: atom.cx - 55, x2: atom.cx + 55, y1: atom.twoY, y2: atom.twoY, stroke: AO, 'stroke-width': '2.5', 'stroke-linecap': 'round' }) as VNode);
    children.push(h('text', { x: atom.cx - 66, y: atom.twoY + 4, 'text-anchor': 'end', 'font-size': '11', fill: AO, 'font-family': 'monospace' }, '2s') as VNode);
    ElectronArrows({ x: atom.cx, y: atom.twoY, line: { y: 0, up: (atom.twoE ?? 0) >= 1, down: (atom.twoE ?? 0) >= 2 } });
  }
  if (full && atom.pY != null) {
    children.push(h('text', { x: atom.cx - 66, y: atom.pY + 4, 'text-anchor': 'end', 'font-size': '11', fill: AO, 'font-family': 'monospace' }, '2p') as VNode);
    for (const dx of stubs) {
      const e = atom.pE ?? 0;
      const up = dx === stubs[0] ? e >= 1 : dx === stubs[1] ? e >= 2 : e >= 3;
      const down = e - 3 > stubs.indexOf(dx);
      const lineChildren: VNode[] = [
        h('line', { x1: atom.cx + dx - 20, x2: atom.cx + dx + 20, y1: atom.pY, y2: atom.pY, stroke: AO, 'stroke-width': '2.5', 'stroke-linecap': 'round' }) as VNode,
      ];
      if (up) lineChildren.push(h('text', { x: atom.cx + dx, y: atom.pY + 4.5, 'text-anchor': 'middle', 'font-size': '13', fill: INK, 'font-weight': '600' }, '↑') as VNode);
      if (down) lineChildren.push(h('text', { x: atom.cx + dx + 12, y: atom.pY + 4.5, 'text-anchor': 'middle', 'font-size': '13', fill: INK, 'font-weight': '600' }, '↓') as VNode);
      children.push(h('g', null, lineChildren) as VNode);
    }
  }
  return h('g', null, children) as VNode;
}

function MoDiagram({ zA, zB }: { zA: number; zB: number }): VNode {
  const res = computeMo(zA, zB);
  if (!res.valid) {
    return h(
      'div',
      { class: 'flex h-[420px] items-center justify-center rounded-lg border border-rose-400/30 bg-rose-400/5 p-6 text-center' },
      h('p', { class: 'max-w-sm text-[12px] leading-relaxed text-rose-200/90' }, res.reason),
    ) as VNode;
  }

  const [A, B] = res.atoms;
  const connectors: { ax: number; ay: number; bx: number; by: number }[] = [];
  for (const slot of res.slots) {
    const lineYs = slot.pair ?? [slot.y];
    for (const y of lineYs) {
      if (slot.key.includes('1s')) {
        connectors.push({ ax: A.cx + 55, ay: A.oneY, bx: 350, by: y });
        connectors.push({ ax: 570, ay: y, bx: B.cx - 55, by: B.oneY });
      } else if (slot.key.includes('2s')) {
        connectors.push({ ax: A.cx + 55, ay: A.twoY!, bx: 350, by: y });
        connectors.push({ ax: 570, ay: y, bx: B.cx - 55, by: B.twoY! });
      } else {
        connectors.push({ ax: A.cx + 22 + 20, ay: A.pY!, bx: 350, by: y });
        connectors.push({ ax: 570, ay: y, bx: B.cx - 42, by: B.pY! });
      }
    }
  }

  const rungs = res.slots.map((slot) => {
    const color = slot.type === 'bonding' ? BOND : ANTI;
    const lineYs = slot.pair ?? [slot.y];
    const groups = lineYs.map((y, i) => {
      const line = slot.lines[i]!;
      const lineChildren: VNode[] = [
        h('line', { key: 'line', x1: 350, x2: 570, y1: y, y2: y, stroke: color, 'stroke-width': '2.5', 'stroke-linecap': 'round' }) as VNode,
      ];
      if (line.up) {
        lineChildren.push(h('text', { key: 'u', x: 445, y: y + 4.5, 'text-anchor': 'middle', 'font-size': '14', fill: INK, 'font-weight': '600' }, '↑') as VNode);
      }
      if (line.down) {
        lineChildren.push(h('text', { key: 'd', x: 475, y: y + 4.5, 'text-anchor': 'middle', 'font-size': '14', fill: INK, 'font-weight': '600' }, '↓') as VNode);
      }
      return h('g', { key: `${slot.key}-${i}` }, lineChildren);
    });
    return h('g', { key: slot.key }, groups);
  });

  return h(
    'svg',
    { viewBox: '0 0 920 580', class: 'h-auto w-full select-none', role: 'img', 'aria-label': 'Molecular orbital diagram' },
    h('g', { stroke: '#334155', 'stroke-width': '1', 'stroke-dasharray': '4 4', opacity: '0.6' }, connectors.map((c, i) => h('line', { key: i, x1: c.ax, y1: c.ay, x2: c.bx, y2: c.by }))),
    h('text', { x: A.cx, y: 36, 'text-anchor': 'middle', 'font-size': '13', 'font-weight': '700', fill: '#e4e4e7' }, A.sym, h('tspan', { 'font-size': '10', fill: '#71717a' }, ` (Z=${A.z}${A.chi != null ? `, χ ${A.chi.toFixed(2)}` : ''})`)),
    h('text', { x: 460, y: 36, 'text-anchor': 'middle', 'font-size': '11', 'letter-spacing': '2', fill: '#71717a' }, 'MOLECULAR ORBITALS'),
    h('text', { x: B.cx, y: 36, 'text-anchor': 'middle', 'font-size': '13', 'font-weight': '700', fill: '#e4e4e7' }, B.sym, h('tspan', { 'font-size': '10', fill: '#71717a' }, ` (Z=${B.z}${B.chi != null ? `, χ ${B.chi.toFixed(2)}` : ''})`)),
    AtomSide({ atom: A, full: res.fullLadder }),
    AtomSide({ atom: B, full: res.fullLadder }),
    h('g', null, rungs),
  ) as VNode;
}

export default MoDiagram;
