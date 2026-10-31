#!/usr/bin/env python3
"""
Digitize nucleosynthesis-origin percentages from Jennifer Johnson's
"The Origin of the Solar System Elements" chart (SDSS, 2019 revision,
3000x2100 PNG downloaded from blog.sdss.org).

Each element tile is flat-filled with 1-3 legend colors split along
deliberate diagonal boundaries; the pixel-area fraction of each color
encodes the estimated percentage contribution of that nucleosynthesis
channel. We classify pixels by nearest legend color, find tile
components, and measure area fractions.

Output: origins_digitized.json  { "Z": [[sourceKey, pct], ...] }
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "/tmp/origins/chart_full.png"
OUT = "/tmp/origins/origins_digitized.json"

# legend box regions in full-res coords (x0, y0, x1, y1) -> source key
LEGEND_BOXES = {
    "bigbang": (580, 420, 1260, 532),      # big bang fusion (blue)
    "cosmicray": (1308, 420, 1996, 532),   # cosmic ray fission (pink)
    "neutronstar": (580, 578, 1260, 686),  # merging neutron stars (vermilion)
    "massive": (1308, 578, 1996, 686),     # exploding massive stars (green)
    "lowmass": (580, 710, 1260, 818),      # dying low mass stars (yellow)
    "whitedwarf": (1308, 710, 1996, 818),  # exploding white dwarfs (light blue)
}

def modal_color(arr: np.ndarray) -> np.ndarray:
    """Modal quantized color of a region (robust to white text / icons)."""
    q = (arr // 8).astype(np.int32)
    flat = q[:, :, 0] * 4096 + q[:, :, 1] * 64 + q[:, :, 2]
    vals, counts = np.unique(flat, return_counts=True)
    top = vals[np.argmax(counts)]
    r = (top // 4096) * 8 + 4
    g = ((top // 64) % 64) * 8 + 4
    b = (top % 64) * 8 + 4
    return np.array([r, g, b], dtype=np.float32)

img = np.asarray(Image.open(SRC).convert("RGB"), dtype=np.float32)
H, W, _ = img.shape
print(f"image {W}x{H}")

legend = {}
for key, (x0, y0, x1, y1) in LEGEND_BOXES.items():
    c = modal_color(img[y0:y1, x0:x1])
    legend[key] = c
    print(f"{key:12s} rgb=({c[0]:.0f},{c[1]:.0f},{c[2]:.0f})")

# classify every pixel by nearest legend color within threshold (memory-safe)
keys = list(legend)
d = np.empty((H, W, len(keys)), dtype=np.float32)
for i, k in enumerate(keys):
    diff = img - legend[k].astype(np.float32)
    d[:, :, i] = np.sqrt((diff * diff).sum(-1))
best = np.argmin(d, axis=2)
mind = np.min(d, axis=2)
del d
TH = 55.0
classmap = np.where(mind < TH, best, -1).astype(np.int8)
mask = classmap >= 0
print(f"classified pixels: {mask.sum()} ({100.0*mask.sum()/(H*W):.1f}% of frame)")

# dilate so multi-color tiles form ONE component (tile gaps ~20px)
dil = ndimage.binary_dilation(mask, iterations=3)
lab, n = ndimage.label(dil)
print(f"components: {n}")

objs = ndimage.find_objects(lab)
tiles = []
for i, sl in enumerate(objs, start=1):
    if sl is None:
        continue
    y0, y1 = sl[0].start, sl[0].stop
    x0, x1 = sl[1].start, sl[1].stop
    w, h = x1 - x0, y1 - y0
    area = int((lab[sl] == i).sum())
    if 5000 < area < 45000 and 90 < w < 200 and 90 < h < 200:
        tiles.append((x0, y0, x1, y1))
print(f"tile-like components: {len(tiles)}")

# cluster rows by y center
centers = [((a + c) / 2, (b + d) / 2) for (a, b, c, d) in tiles]
centers.sort(key=lambda p: p[1])
rows = []
for cx, cy in centers:
    if rows and cy - rows[-1][-1][1] < 65:
        rows[-1].append((cx, cy))
    else:
        rows.append([(cx, cy)])
rows.sort(key=lambda r: sum(p[1] for p in r) / len(r))
print("row signature:", [len(r) for r in rows])

# column pitch from the densest consecutive row (a full 18-tile row)
full = max(rows, key=len)
full = sorted(full, key=lambda p: p[0])
pitch = (full[-1][0] - full[0][0]) / (len(full) - 1)
x_first = full[0][0]
print(f"pitch={pitch:.2f} x_first={x_first:.2f}")

def col_of(cx: float) -> int:
    return int(round((cx - x_first) / pitch)) + 1

# column-based Z mapping (robust to grey Tc/Pm tiles being absent).
# Chart grid: 18 columns aligned across all rows; rows top->bottom:
# 1:(H,He) 2:(3-10) 3:(11-18) 4:(19-36) 5:(37-54, Tc grey) 6:(55,56,72-86)
# 7:(87,88) 8:(57-71 at cols 4-18, Pm grey) 9:(89-92 at cols 4-7)
def z_of_row_col(ri: int, col: int):
    if ri == 1:
        return {1: 1, 18: 2}.get(col)
    if ri == 2:
        return {1: 3, 2: 4}.get(col) if col <= 2 else (col - 8 if col >= 13 else None)
    if ri == 3:
        return {1: 11, 2: 12}.get(col) if col <= 2 else (col if col >= 13 else None)
    if ri == 4:
        return 18 + col
    if ri == 5:
        return 36 + col
    if ri == 6:
        if col == 1:
            return 55
        if col == 2:
            return 56
        return 68 + col if col >= 4 else None
    if ri == 7:
        return 86 + col
    if ri == 8:
        return 53 + col if 4 <= col <= 18 else None
    if ri == 9:
        return 85 + col if 4 <= col <= 7 else None
    return None

result = {}
report = []
for ri, row in enumerate(rows, start=1):
    row = sorted(row, key=lambda p: p[0])
    for (cx, cy) in row:
        z = z_of_row_col(ri, col_of(cx))
        if z is None:
            report.append(f"row {ri}: unmatched tile at cx={cx:.0f}")
            continue
        # bbox from nearest tile record
        best_t = None
        for (a, b, c, d) in tiles:
            if abs((a + c) / 2 - cx) < 2 and abs((b + d) / 2 - cy) < 2:
                best_t = (a, b, c, d)
                break
        if best_t is None:
            report.append(f"Z={z}: tile not found")
            continue
        x0, y0, x1, y1 = best_t
        sub = classmap[y0:y1, x0:x1]
        counts = {k: int((sub == i).sum()) for i, k in enumerate(keys)}
        total = sum(counts.values())
        if total < 3000:
            report.append(f"Z={z}: too few classified pixels ({total}) -> grey/no data")
            continue
        pcts = {k: 100.0 * v / total for k, v in counts.items() if v > 0}
        # round to integers, drop <1%, renormalize by largest remainder
        items = [(k, v) for k, v in pcts.items() if v >= 0.5]
        raw = sum(v for _, v in items)
        fl = [(k, 100.0 * v / raw) for k, v in items]
        ints = [(k, int(v)) for k, v in fl]
        rem = 100 - sum(v for _, v in ints)
        order = sorted(range(len(fl)), key=lambda i: fl[i][1] - ints[i][1], reverse=True)
        for i in range(rem):
            ints[order[i % len(order)]] = (ints[order[i % len(order)]][0],
                                           ints[order[i % len(order)]][1] + 1)
        ints = [(k, v) for k, v in ints if v > 0]
        result[str(z)] = sorted(ints, key=lambda kv: -kv[1])
        report.append(f"Z={z:3d}: " + ", ".join(f"{k}={v}" for k, v in result[str(z)]))

with open(OUT, "w") as f:
    json.dump(result, f, indent=1)
print("\n".join(report))
print(f"\nwrote {OUT} with {len(result)} elements")
