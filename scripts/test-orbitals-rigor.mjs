import {
  radialR,
  realYlm,
  psiAt,
  assocLegendre,
  laguerre,
  radialNormalization,
  numericalMeanRadius,
  radialStats,
  slaterZeff,
  parseConfig,
  groundTerm,
  combosOf,
} from '../src/lib/orbital.ts'

console.log('================================================================');
console.log('     ELEMENTA ORBITALS LAB — SCIENTIFIC RIGOR TEST SUITE       ');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assertClose(actual, expected, tol, label) {
  const err = Math.abs(actual - expected);
  if (err <= tol) {
    passed++;
    console.log(`  ✓ PASS: ${label.padEnd(42)} = ${actual.toFixed(6)} (exp ${expected.toFixed(6)}, diff ${err.toExponential(2)})`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label.padEnd(42)} = ${actual} (expected ${expected}, diff ${err})`);
  }
}

// -------------------------------------------------------------
// 1. EXACT ANALYTICAL WAVEFUNCTION COMPARISON (a0 = 1, Z = 1)
// -------------------------------------------------------------
console.log('--- 1. EXACT RADIAL WAVEFUNCTIONS R_nl(r) ---');

// R_10(r) = 2 * exp(-r)
const rTest = [0.1, 0.5, 1.0, 2.0, 5.0];
for (const r of rTest) {
  const exact = 2 * Math.exp(-r);
  const comp = radialR(1, 0, r, 1);
  assertClose(comp, exact, 1e-12, `R_1s(r=${r})`);
}

// R_20(r) = (1/sqrt(2)) * (1 - r/2) * exp(-r/2)
for (const r of rTest) {
  const exact = (1 / Math.SQRT2) * (1 - r / 2) * Math.exp(-r / 2);
  const comp = radialR(2, 0, r, 1);
  assertClose(comp, exact, 1e-12, `R_2s(r=${r})`);
}

// R_21(r) = (1/(2*sqrt(6))) * r * exp(-r/2)
for (const r of rTest) {
  const exact = (1 / (2 * Math.sqrt(6))) * r * Math.exp(-r / 2);
  const comp = radialR(2, 1, r, 1);
  assertClose(comp, exact, 1e-12, `R_2p(r=${r})`);
}

// R_30(r) = (2/(3*sqrt(3))) * (1 - 2r/3 + 2r^2/27) * exp(-r/3)
for (const r of rTest) {
  const exact = (2 / (3 * Math.sqrt(3))) * (1 - 2 * r / 3 + 2 * r * r / 27) * Math.exp(-r / 3);
  const comp = radialR(3, 0, r, 1);
  assertClose(comp, exact, 1e-12, `R_3s(r=${r})`);
}

// R_31(r) = (4*sqrt(2)/(27*sqrt(3))) * r * (1 - r/6) * exp(-r/3)
for (const r of rTest) {
  const exact = (4 * Math.SQRT2 / (27 * Math.sqrt(3))) * r * (1 - r / 6) * Math.exp(-r / 3);
  const comp = radialR(3, 1, r, 1);
  assertClose(comp, exact, 1e-12, `R_3p(r=${r})`);
}

// R_32(r) = (4 / (81*sqrt(30))) * r^2 * exp(-r/3)
for (const r of rTest) {
  const exact = (4 / (81 * Math.sqrt(30))) * r * r * Math.exp(-r / 3);
  const comp = radialR(3, 2, r, 1);
  assertClose(comp, exact, 1e-12, `R_3d(r=${r})`);
}

// -------------------------------------------------------------
// 2. RADIAL NORMALIZATION INTEGRAL: \int_0^\infty r^2 |R_nl|^2 dr = 1
// -------------------------------------------------------------
console.log('\n--- 2. RADIAL NORMALIZATION INTEGRALS ---');
const orbitals = [
  [1, 0, '1s'],
  [2, 0, '2s'],
  [2, 1, '2p'],
  [3, 0, '3s'],
  [3, 1, '3p'],
  [3, 2, '3d'],
  [4, 0, '4s'],
  [4, 1, '4p'],
  [4, 2, '4d'],
  [4, 3, '4f'],
  [5, 0, '5s'],
  [5, 2, '5d'],
  [5, 3, '5f'],
];

for (const [n, l, name] of orbitals) {
  const norm = radialNormalization(n, l, 1);
  assertClose(norm, 1.0, 1e-3, `Norm <${name}|${name}> (Z=1)`);
  // Test with Z_eff = 3.5
  const normZ = radialNormalization(n, l, 3.5);
  assertClose(normZ, 1.0, 1e-3, `Norm <${name}|${name}> (Z=3.5)`);
}

// -------------------------------------------------------------
// 3. EXPECTATION VALUES <r> = (3n^2 - l(l+1)) / (2Z)
// -------------------------------------------------------------
console.log('\n--- 3. EXPECTATION VALUE <r> ---');
for (const [n, l, name] of orbitals) {
  const exact = (3 * n * n - l * (l + 1)) / (2 * 1);
  const num = numericalMeanRadius(n, l, 1);
  assertClose(num, exact, 0.05, `<r> for ${name}`);
}

// -------------------------------------------------------------
// 4. RADIAL NODE COUNT & ROOT POSITIONS
// -------------------------------------------------------------
console.log('\n--- 4. RADIAL NODES COUNT AND POSITIONS ---');
// 2s node: 1 - r/2 = 0 => r = 2
const s2s = radialStats(2, 0, 1);
assertClose(s2s.nodes.length, 1, 0, '2s radial node count');
assertClose(s2s.nodes[0], 2.0, 0.02, '2s radial node location (exp 2.0)');

// 3s nodes: roots of 2r^2 - 18r + 27 = 0 => (9 +- 3*sqrt(3))/2 = 1.9019, 7.0981
const s3s = radialStats(3, 0, 1);
assertClose(s3s.nodes.length, 2, 0, '3s radial node count');
assertClose(s3s.nodes[0], (9 - 3 * Math.sqrt(3)) / 2, 0.05, '3s radial node 1 (1.902)');
assertClose(s3s.nodes[1], (9 + 3 * Math.sqrt(3)) / 2, 0.08, '3s radial node 2 (7.098)');

// 3p node: 1 - r/6 = 0 => r = 6
const s3p = radialStats(3, 1, 1);
assertClose(s3p.nodes.length, 1, 0, '3p radial node count');
assertClose(s3p.nodes[0], 6.0, 0.05, '3p radial node location (exp 6.0)');

// 3d nodes: 3 - 2 - 1 = 0
const s3d = radialStats(3, 2, 1);
assertClose(s3d.nodes.length, 0, 0, '3d radial node count (0 nodes)');

// 4f nodes: 4 - 3 - 1 = 0
const s4f = radialStats(4, 3, 1);
assertClose(s4f.nodes.length, 0, 0, '4f radial node count (0 nodes)');

// -------------------------------------------------------------
// 5. REAL SPHERICAL HARMONICS ORTHONORMALITY
// -------------------------------------------------------------
console.log('\n--- 5. SPHERICAL HARMONICS ORTHONORMALITY ---');
function integrateYlm(l1, m1, sin1, l2, m2, sin2) {
  const Ntheta = 180;
  const Nphi = 360;
  const dTheta = Math.PI / Ntheta;
  const dPhi = (2 * Math.PI) / Nphi;
  let sum = 0;
  for (let it = 0; it < Ntheta; it++) {
    const theta = (it + 0.5) * dTheta;
    const sinTheta = Math.sin(theta);
    for (let ip = 0; ip < Nphi; ip++) {
      const phi = (ip + 0.5) * dPhi;
      const y1 = realYlm(l1, m1, sin1, theta, phi);
      const y2 = realYlm(l2, m2, sin2, theta, phi);
      sum += y1 * y2 * sinTheta * dTheta * dPhi;
    }
  }
  return sum;
}

// Norms: <Y|Y> = 1
assertClose(integrateYlm(0, 0, false, 0, 0, false), 1.0, 1e-4, '<Y_s | Y_s>');
assertClose(integrateYlm(1, 0, false, 1, 0, false), 1.0, 1e-4, '<Y_pz | Y_pz>');
assertClose(integrateYlm(1, 1, false, 1, 1, false), 1.0, 1e-4, '<Y_px | Y_px>');
assertClose(integrateYlm(1, -1, true, 1, -1, true), 1.0, 1e-4, '<Y_py | Y_py>');
assertClose(integrateYlm(2, 0, false, 2, 0, false), 1.0, 1e-4, '<Y_dz2 | Y_dz2>');
assertClose(integrateYlm(2, 1, false, 2, 1, false), 1.0, 1e-4, '<Y_dxz | Y_dxz>');
assertClose(integrateYlm(2, -2, true, 2, -2, true), 1.0, 1e-4, '<Y_dxy | Y_dxy>');

// Orthogonality: <Y_i | Y_j> = 0
assertClose(integrateYlm(1, 0, false, 1, 1, false), 0.0, 1e-5, '<Y_pz | Y_px> orthogonal');
assertClose(integrateYlm(1, 1, false, 1, -1, true), 0.0, 1e-5, '<Y_px | Y_py> orthogonal');
assertClose(integrateYlm(2, 0, false, 2, 1, false), 0.0, 1e-5, '<Y_dz2 | Y_dxz> orthogonal');
assertClose(integrateYlm(0, 0, false, 1, 0, false), 0.0, 1e-5, '<Y_s | Y_pz> orthogonal');

// -------------------------------------------------------------
// 6. SLATER'S SCREENING RULES (Z_eff)
// -------------------------------------------------------------
console.log('\n--- 6. SLATER SCREENING RULES Z_eff ---');
// Carbon: [He] 2s2 2p2 (Z=6) => 2p: sigma = 3*0.35 + 2*0.85 = 1.05 + 1.70 = 2.75 => Zeff = 3.25
const cOcc = parseConfig('1s2 2s2 2p2');
const cZ = slaterZeff(6, { n: 2, l: 1, e: 2 }, cOcc);
assertClose(cZ.sigma, 2.75, 1e-2, 'Carbon 2p sigma (exp 2.75)');
assertClose(cZ.zeff, 3.25, 1e-2, 'Carbon 2p Z_eff (exp 3.25)');

// Oxygen: [He] 2s2 2p4 (Z=8) => 2p: sigma = 5*0.35 + 2*0.85 = 1.75 + 1.70 = 3.45 => Zeff = 4.55
const oOcc = parseConfig('1s2 2s2 2p4');
const oZ = slaterZeff(8, { n: 2, l: 1, e: 4 }, oOcc);
assertClose(oZ.sigma, 3.45, 1e-2, 'Oxygen 2p sigma (exp 3.45)');
assertClose(oZ.zeff, 4.55, 1e-2, 'Oxygen 2p Z_eff (exp 4.55)');

// Iron: [Ar] 3d6 4s2 (Z=26)
const feOcc = parseConfig('[Ar] 3d6 4s2');
// 4s: sigma = 1*0.35 + 14*0.85 + 10*1.0 = 0.35 + 11.90 + 10.0 = 22.25 => Zeff = 3.75
const fe4s = slaterZeff(26, { n: 4, l: 0, e: 2 }, feOcc);
assertClose(fe4s.sigma, 22.25, 1e-2, 'Iron 4s sigma (exp 22.25)');
assertClose(fe4s.zeff, 3.75, 1e-2, 'Iron 4s Z_eff (exp 3.75)');
// 3d: sigma = 5*0.35 + 18*1.0 = 1.75 + 18.0 = 19.75 => Zeff = 6.25
const fe3d = slaterZeff(26, { n: 3, l: 2, e: 6 }, feOcc);
assertClose(fe3d.sigma, 19.75, 1e-2, 'Iron 3d sigma (exp 19.75)');
assertClose(fe3d.zeff, 6.25, 1e-2, 'Iron 3d Z_eff (exp 6.25)');

// -------------------------------------------------------------
// 7. HUND'S RULES GROUND STATE TERM SYMBOLS
// -------------------------------------------------------------
console.log('\n--- 7. HUND RULES TERM SYMBOLS ---');
// Carbon 2p2: 3P0
const cTerm = groundTerm(cOcc);
assertClose(cTerm.symbol === '3P0' ? 1 : 0, 1, 0, 'Carbon term symbol = 3P0');
assertClose(cTerm.S, 1, 0, 'Carbon spin S = 1');
assertClose(cTerm.L, 1, 0, 'Carbon orbital L = 1');
assertClose(cTerm.J, 0, 0, 'Carbon total J = 0');

// Nitrogen 2p3: 4S3/2
const nOcc = parseConfig('1s2 2s2 2p3');
const nTerm = groundTerm(nOcc);
assertClose(nTerm.symbol === '4S1½' || nTerm.symbol === '4S3/2' ? 1 : 0, 1, 0, 'Nitrogen term symbol = 4S3/2');

// Oxygen 2p4: 3P2
const oTerm = groundTerm(oOcc);
assertClose(oTerm.symbol === '3P2' ? 1 : 0, 1, 0, 'Oxygen term symbol = 3P2');

// Neon 2p6: 1S0
const neOcc = parseConfig('1s2 2s2 2p6');
const neTerm = groundTerm(neOcc);
assertClose(neTerm.symbol === '1S0' || neTerm.symbol === '¹S₀' ? 1 : 0, 1, 0, 'Neon term symbol = 1S0');

// Iron 3d6: 5D4
const feTerm = groundTerm(feOcc);
assertClose(feTerm.symbol === '5D4' ? 1 : 0, 1, 0, 'Iron term symbol = 5D4');

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================');
if (failed > 0) process.exit(1);
