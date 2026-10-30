/**
 * Naive Surface Nets (dual contouring) over a scalar field sampled on a
 * structured grid with per-axis coordinate arrays (supports non-uniform,
 * power-graded spacing). One smooth vertex per straddling cell; quads are
 * emitted across faces whose 4 shared corners change sign.
 *
 * field index: x + nx·(y + ny·z); corner bit layout: i = cx + 2·cy + 4·cz.
 */

const EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7], // along x
  [0, 2], [1, 3], [4, 6], [5, 7], // along y
  [0, 4], [1, 5], [2, 6], [3, 7], // along z
]

const CORNER = new Int8Array(24) // corner → (dx, dy, dz) triples
for (let i = 0; i < 8; i++) {
  CORNER[i * 3] = i & 1
  CORNER[i * 3 + 1] = (i >> 1) & 1
  CORNER[i * 3 + 2] = (i >> 2) & 1
}

export interface SurfaceNetsResult {
  positions: Float32Array
  indices: Uint32Array
  vertexCount: number
}

export function surfaceNets(
  field: Float32Array,
  nx: number,
  ny: number,
  nz: number,
  xs: Float64Array,
  ys: Float64Array,
  zs: Float64Array,
  isolevel: number,
): SurfaceNetsResult {
  const cellsX = nx - 1
  const cellsY = ny - 1
  const cellsZ = nz - 1
  const cellCount = cellsX * cellsY * cellsZ
  const cellVertex = new Int32Array(cellCount).fill(-1)
  const verts: number[] = []

  const cornerIdx = (x: number, y: number, z: number, c: number) =>
    x + CORNER[c * 3] + nx * (y + CORNER[c * 3 + 1]) + nx * ny * (z + CORNER[c * 3 + 2])

  const cornerPos = (x: number, y: number, z: number, c: number, out: number[]) => {
    out[0] = xs[x + CORNER[c * 3]]
    out[1] = ys[y + CORNER[c * 3 + 1]]
    out[2] = zs[z + CORNER[c * 3 + 2]]
  }

  const grid = new Float64Array(8)
  const p0 = [0, 0, 0]
  const p1 = [0, 0, 0]
  const v = [0, 0, 0]

  /* pass 1 — one averaged vertex per straddling cell */
  for (let z = 0; z < cellsZ; z++) {
    for (let y = 0; y < cellsY; y++) {
      for (let x = 0; x < cellsX; x++) {
        let mask = 0
        for (let c = 0; c < 8; c++) {
          const gv = field[cornerIdx(x, y, z, c)] - isolevel
          grid[c] = gv
          if (gv < 0) mask |= 1 << c
        }
        if (mask === 0 || mask === 0xff) continue

        v[0] = 0
        v[1] = 0
        v[2] = 0
        let eCount = 0
        for (let e = 0; e < 12; e++) {
          const c0 = EDGES[e][0]
          const c1 = EDGES[e][1]
          const g0 = grid[c0]
          const g1 = grid[c1]
          if (g0 < 0 === g1 < 0) continue
          const t = g0 / (g0 - g1)
          cornerPos(x, y, z, c0, p0)
          cornerPos(x, y, z, c1, p1)
          v[0] += p0[0] + t * (p1[0] - p0[0])
          v[1] += p0[1] + t * (p1[1] - p0[1])
          v[2] += p0[2] + t * (p1[2] - p0[2])
          eCount++
        }
        if (eCount === 0) continue
        cellVertex[x + cellsX * (y + cellsY * z)] = verts.length / 3
        verts.push(v[0] / eCount, v[1] / eCount, v[2] / eCount)
      }
    }
  }

  /* pass 2 — one quad per crossed primal edge (the corner-0 edge of a cell);
     the quad joins the 4 cells sharing that edge. */
  const idxOut: number[] = []
  const cellAt = (x: number, y: number, z: number) => cellVertex[x + cellsX * (y + cellsY * z)]

  for (let z = 0; z < cellsZ; z++) {
    for (let y = 0; y < cellsY; y++) {
      for (let x = 0; x < cellsX; x++) {
        const cv = cellAt(x, y, z)
        if (cv < 0) continue
        let mask = 0
        for (let c = 0; c < 8; c++) {
          if (field[cornerIdx(x, y, z, c)] - isolevel < 0) mask |= 1 << c
        }
        const c0Inside = mask & 1
        for (let a = 0; a < 3; a++) {
          /* edge from corner 0 along axis a crosses ⇔ sign(corner0) ≠ sign(corner 1<<a) */
          if (c0Inside === ((mask >> (1 << a)) & 1)) continue
          const u = (a + 1) % 3
          const w = (a + 2) % 3
          const cu = [x, y, z]
          if (cu[u] === 0 || cu[w] === 0) continue
          const du = [0, 0, 0]
          const dv = [0, 0, 0]
          du[u] = 1
          dv[w] = 1
          const n0 = cv
          const n1 = cellAt(cu[0] - du[0], cu[1] - du[1], cu[2] - du[2])
          const n2 = cellAt(cu[0] - du[0] - dv[0], cu[1] - du[1] - dv[1], cu[2] - du[2] - dv[2])
          const n3 = cellAt(cu[0] - dv[0], cu[1] - dv[1], cu[2] - dv[2])
          if (n1 < 0 || n2 < 0 || n3 < 0) continue
          if (c0Inside) idxOut.push(n0, n1, n2, n0, n2, n3)
          else idxOut.push(n0, n3, n2, n0, n2, n1)
        }
      }
    }
  }

  return {
    positions: new Float32Array(verts),
    indices: new Uint32Array(idxOut),
    vertexCount: verts.length / 3,
  }
}
