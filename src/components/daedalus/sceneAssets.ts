/* ============================================================
   PROJECT DAEDALUS — @nexus/3d scene assets
   Procedural planet shader (simplex-noise continents, terminator,
   polar caps), atmosphere rim shell, vehicle geometry builders,
   plasma glow texture.

   Ported from three.js to the zero-dependency @nexus/3d engine:
   • ShaderMaterial passes source through verbatim, so each shader
     declares its own attributes (aPosition/aNormal) and precision,
     and uses engine builtins (uModelMatrix, uViewMatrix,
     uProjectionMatrix, uCameraPosition) instead of three's.
   • three's LatheGeometry → procedural indexed lathe.
   • three's ConvexGeometry → brute-force convex hull (8 points).
   • glow Sprite → camera-facing textured quad (the engine's
     WebGLRenderer has no Sprite draw path).
   ============================================================ */

import {
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Texture,
} from '@nexus/3d';
import type { PlanetId } from '@/lib/sim/constants';

/* ---------------- shared GLSL: simplex noise + fbm ---------------- */

export const NOISE_GLSL = `
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0*floor(p*ns.z*ns.z);
  vec4 x_ = floor(j*ns.z);
  vec4 y_ = floor(j - 7.0*x_);
  vec4 x = x_*ns.x + ns.yyyy;
  vec4 y = y_*ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m*m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p){
  float f = 0.0; float a = 0.5;
  for(int i = 0; i < 5; i++){ f += a*snoise(p); p *= 2.03; a *= 0.5; }
  return f;
}
`

/* ---------------- planet surface material ---------------- */

export interface PlanetUniforms {
  uSunDir: { value: number[] }
  uTime: { value: number }
  uOceanDeep: { value: number[] }
  uOceanShallow: { value: number[] }
  uLandLow: { value: number[] }
  uLandHigh: { value: number[] }
  uIce: { value: number[] }
  uAtmo: { value: number[] }
  uHasOcean: { value: number }
}

const PLANET_SKINS: Record<
  PlanetId,
  { deep: string; shallow: string; low: string; high: string; ice: string; atmo: string; ocean: number }
> = {
  earth: {
    deep: '#062a5e',
    shallow: '#1268b8',
    low: '#2e5c28',
    high: '#8a7a4d',
    ice: '#eaf2fb',
    atmo: '#5fa4ff',
    ocean: 1,
  },
  mars: {
    deep: '#4a1d10',
    shallow: '#7a301f',
    low: '#8f3d1f',
    high: '#c97a48',
    ice: '#f4e8dd',
    atmo: '#ff9a6a',
    ocean: 0,
  },
}

/* ShaderMaterial uniform values are dispatched as plain number arrays
   (the engine's typed uniform writer accepts number[], not {r,g,b} objects) */
function rgb(hex: string): number[] {
  const c = new Color(hex)
  return [c.r, c.g, c.b]
}

export function createPlanetUniforms(planet: PlanetId): PlanetUniforms {
  const s = PLANET_SKINS[planet]
  return {
    uSunDir: { value: [0.767, 0.245, 0.384] }, // (1, 0.32, 0.5).normalize()
    uTime: { value: 0 },
    uOceanDeep: { value: rgb(s.deep) },
    uOceanShallow: { value: rgb(s.shallow) },
    uLandLow: { value: rgb(s.low) },
    uLandHigh: { value: rgb(s.high) },
    uIce: { value: rgb(s.ice) },
    uAtmo: { value: rgb(s.atmo) },
    uHasOcean: { value: s.ocean },
  }
}

const PLANET_VERT = /* glsl */ `
precision highp float;
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
varying vec3 vObj;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
void main(){
  vObj = normalize(aPosition);
  vWorldNormal = normalize(mat3(uModelMatrix) * aNormal);
  vec4 wp = uModelMatrix * vec4(aPosition, 1.0);
  vViewDir = normalize(uCameraPosition - wp.xyz);
  gl_Position = uProjectionMatrix * uViewMatrix * wp;
}
`

const PLANET_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uSunDir;
uniform float uTime;
uniform vec3 uOceanDeep;
uniform vec3 uOceanShallow;
uniform vec3 uLandLow;
uniform vec3 uLandHigh;
uniform vec3 uIce;
uniform vec3 uAtmo;
uniform float uHasOcean;
varying vec3 vObj;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
${NOISE_GLSL}
void main(){
  vec3 sp = normalize(vObj);
  float n  = fbm(sp * 2.35 + vec3(7.31, 1.73, 3.17));
  float n2 = fbm(sp * 5.1  + vec3(11.2, 5.9, 1.4));
  float land = smoothstep(0.055, 0.11, n);
  float coast = smoothstep(0.015, 0.055, n);
  vec3 ocean = mix(uOceanDeep, uOceanShallow, coast * 0.85);
  vec3 landCol = mix(uLandLow, uLandHigh, clamp(n2 * 0.6 + 0.5, 0.0, 1.0));
  landCol = mix(landCol, landCol * 0.55 + vec3(0.16, 0.1, 0.02), smoothstep(0.15, 0.6, n2));
  vec3 col = uHasOcean > 0.5 ? mix(ocean, landCol, land) : mix(landCol * 0.75, landCol, smoothstep(0.0, 0.08, n + 0.35));
  float ice = smoothstep(0.74, 0.84, abs(sp.y) + n * 0.05);
  col = mix(col, uIce, ice);
  float dl = dot(sp, normalize(uSunDir));
  float day = smoothstep(-0.14, 0.28, dl);
  col *= 0.055 + 0.945 * day;
  float rim = pow(1.0 - max(dot(vViewDir, vWorldNormal), 0.0), 2.6);
  col += uAtmo * rim * (0.22 + 0.78 * day) * 0.85;
  gl_FragColor = vec4(col, 1.0);
}
`

const ATMO_VERT = /* glsl */ `
precision highp float;
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec3 vNormalV;
void main(){
  // view-space normal: V = uViewMatrix * M * position, R³ part of V = Riy * M
  mat4 mv = uViewMatrix * uModelMatrix;
  vNormalV = normalize(mat3(mv) * aNormal);
  gl_Position = uProjectionMatrix * mv * vec4(aPosition, 1.0);
}
`

const ATMO_FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uAtmo;
varying vec3 vNormalV;
void main(){
  float intensity = pow(0.72 - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 3.0);
  gl_FragColor = vec4(uAtmo, 1.0) * clamp(intensity, 0.0, 1.4);
}
`

export function buildPlanet(planet: PlanetId, radiusUnits: number): {
  group: Object3D
  uniforms: PlanetUniforms
  surface: Mesh
  clouds: Mesh
  atmoShell: Mesh
} {
  const group = new Object3D()
  const uniforms = createPlanetUniforms(planet)

  const surfaceMat = new ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, { value: unknown }>,
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG,
  })
  const surface = new Mesh(new SphereGeometry(1, 96, 64), surfaceMat)
  surface.scale.setScalar(radiusUnits)
  group.add(surface)

  const clouds = new Mesh(
    new SphereGeometry(1.008, 72, 48),
    new ShaderMaterial({
      uniforms: {
        uSunDir: uniforms.uSunDir,
        uTime: uniforms.uTime,
      } as unknown as Record<string, { value: unknown }>,
      vertexShader: PLANET_VERT,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uSunDir;
        uniform float uTime;
        varying vec3 vObj;
        varying vec3 vWorldNormal;
        varying vec3 vViewDir;
        ${NOISE_GLSL}
        void main(){
          vec3 sp = normalize(vObj);
          float c = fbm(sp * 3.4 + vec3(uTime * 0.004, 0.0, uTime * 0.002));
          float alpha = smoothstep(0.18, 0.55, c) * 0.55;
          float dl = dot(sp, normalize(uSunDir));
          float day = smoothstep(-0.1, 0.3, dl);
          gl_FragColor = vec4(vec3(1.0) * (0.25 + 0.75 * day), alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    }),
  )
  clouds.scale.setScalar(radiusUnits)
  clouds.visible = planet === 'earth'
  group.add(clouds)

  const atmoShell = new Mesh(
    new SphereGeometry(1.05, 64, 48),
    new ShaderMaterial({
      uniforms: { uAtmo: uniforms.uAtmo } as unknown as Record<string, { value: unknown }>,
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      // render the shell from inside so the rim glow wraps the limb; the
      // engine has no additive blending so the shader alpha is kept modest
      transparent: true,
      depthWrite: false,
    })
  )
  atmoShell.scale.setScalar(radiusUnits)
  group.add(atmoShell)

  return { group, uniforms, surface, clouds, atmoShell }
}

/* ---------------- vehicle geometry ---------------- */

/* Brute-force convex hull: emit every triangle of the point set that has all
   remaining points strictly on one side. Fine for the 8-point waverider. */
function convexHullGeometry(pts: [number, number, number][]): BufferGeometry {
  const positions: number[] = []
  const EPS = 1e-6
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      for (let k = j + 1; k < pts.length; k++) {
        const A = pts[i], B = pts[j], C = pts[k]
        const n = [
          (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]),
          (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]),
          (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]),
        ]
        const nLen = Math.hypot(n[0], n[1], n[2])
        if (nLen < EPS) continue
        let hasPos = false
        let hasNeg = false
        for (let m = 0; m < pts.length && !(hasPos && hasNeg); m++) {
          if (m === i || m === j || m === k) continue
          const P = pts[m]
          const d =
            n[0] * (P[0] - A[0]) + n[1] * (P[1] - A[1]) + n[2] * (P[2] - A[2])
          if (d > EPS) hasPos = true
          else if (d < -EPS) hasNeg = true
        }
        if (hasPos && hasNeg) continue
        const flip = hasNeg // all strictly on + side → ensure outward winding
        const tri = flip ? [i, k, j] : [i, j, k]
        for (const idx of tri) positions.push(pts[idx][0], pts[idx][1], pts[idx][2])
      }
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', { array: new Float32Array(positions), itemSize: 3 })
  geo.computeVertexNormals()
  return geo
}

/** sharp-edged waverider dart (nose +X, up +Y) */
export function buildWaveriderGeometry(): BufferGeometry {
  return convexHullGeometry([
    [5.2, 0, 0], // nose
    [-0.4, 0.06, 2.9], // leading edge tips
    [-0.4, 0.06, -2.9],
    [-5.0, 0.62, 1.75], // tail top corners
    [-5.0, 0.62, -1.75],
    [-5.0, -0.42, 1.75], // tail bottom corners
    [-5.0, -0.42, -1.75],
    [-2.2, -0.52, 0], // keel
  ])
}

/** blunt-body capsule with heatshield — procedural lathe (engine has no
 *  LatheGeometry). Same profile three used: shield cap arc → shoulder →
 *  backshell cone → apex. */
export function buildCapsuleGeometry(): BufferGeometry {
  const profile: [number, number][] = [] // [radial, y]
  const R = 1.55
  for (let i = 0; i <= 10; i++) {
    const ang = (-40 + (40 * i) / 10) * (Math.PI / 180)
    profile.push([
      R * Math.cos(ang),
      R * Math.sin(ang) - R * Math.sin((-40 * Math.PI) / 180),
    ])
  }
  profile.push([1.5, 0.1])
  profile.push([0.85, 1.45])
  profile.push([0.55, 1.7])
  profile.push([0.0, 1.78])

  const SEG = 40
  const positions = new Float32Array(profile.length * (SEG + 1) * 3)
  let v = 0
  for (let k = 0; k < profile.length; k++) {
    const [r, y] = profile[k]
    for (let i = 0; i <= SEG; i++) {
      const phi = (i / SEG) * Math.PI * 2
      positions[v++] = r * Math.sin(phi)
      positions[v++] = y
      positions[v++] = r * Math.cos(phi)
    }
  }
  const indices: number[] = []
  for (let k = 0; k < profile.length - 1; k++) {
    for (let i = 0; i < SEG; i++) {
      const a = k * (SEG + 1) + i
      const b = (k + 1) * (SEG + 1) + i
      const c = (k + 1) * (SEG + 1) + i + 1
      const d = k * (SEG + 1) + i + 1
      indices.push(a, d, c, a, c, b)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', { array: positions, itemSize: 3 })
  geo.setIndex(indices)
  geo.computeVertexNormals()

  /* three parity transforms: rotateZ(π/2) then translate(-0.55, 0, 0).
     rotateZ(π/2): (x, y) → (-y, x) */
  const pos = geo.getAttribute('position')!
  const arr = pos.array as Float32Array
  for (let i = 0; i < arr.length; i += 3) {
    const x = arr[i], y = arr[i + 1]
    arr[i] = -y - 0.55
    arr[i + 1] = x
  }
  geo.computeVertexNormals()
  return geo
}

/* ---------------- plasma glow texture ---------------- */

export function makeGlowTexture(): Texture {
  const size = 128
  const cv = document.createElement('canvas')
  cv.width = size
  cv.height = size
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,235,200,0.85)')
  g.addColorStop(0.55, 'rgba(255,150,60,0.35)')
  g.addColorStop(1, 'rgba(255,80,20,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new Texture(cv)
  tex.wrapS = 'clamp'
  tex.wrapT = 'clamp'
  tex.magFilter = 'linear'
  tex.minFilter = 'linear'
  tex.generateMipmaps = false
  return tex
}

/* ---------------- starfield ---------------- */

/* Engine renderer has no additive blending and points attenuate with a
   1.5–3.5 px clamp; per-vertex brightness comes through the color attribute
   exactly like the three version. */
export function makeStarfield(count: number, radius: number): Points {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1
    const phi = Math.random() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    pos[i * 3] = radius * s * Math.cos(phi)
    pos[i * 3 + 1] = radius * u
    pos[i * 3 + 2] = radius * s * Math.sin(phi)
    const b = 0.35 + Math.random() * 0.65
    col[i * 3] = b
    col[i * 3 + 1] = b
    col[i * 3 + 2] = b * (0.9 + Math.random() * 0.1)
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', { array: pos, itemSize: 3 })
  geo.setAttribute('color', { array: col, itemSize: 3 })
  // the engine renders Points with the basic shader; size rides on the
  // material (pixel units, attenuated with a 1.5–3.5 px clamp)
  const mat = new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })
  ;(mat as unknown as { size: number }).size = 1.6
  return new Points(geo, mat)
}
