/* ============================================================
   PROJECT DAEDALUS — three.js scene assets
   Procedural planet shader (simplex-noise continents, terminator,
   polar caps), atmosphere rim shell, vehicle geometry builders,
   plasma glow sprite texture.
   ============================================================ */

import * as THREE from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import type { PlanetId } from '@/lib/sim/constants'

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
  uSunDir: { value: THREE.Vector3 }
  uTime: { value: number }
  uOceanDeep: { value: THREE.Color }
  uOceanShallow: { value: THREE.Color }
  uLandLow: { value: THREE.Color }
  uLandHigh: { value: THREE.Color }
  uIce: { value: THREE.Color }
  uAtmo: { value: THREE.Color }
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

export function createPlanetUniforms(planet: PlanetId): PlanetUniforms {
  const s = PLANET_SKINS[planet]
  return {
    uSunDir: { value: new THREE.Vector3(1, 0.32, 0.5).normalize() },
    uTime: { value: 0 },
    uOceanDeep: { value: new THREE.Color(s.deep) },
    uOceanShallow: { value: new THREE.Color(s.shallow) },
    uLandLow: { value: new THREE.Color(s.low) },
    uLandHigh: { value: new THREE.Color(s.high) },
    uIce: { value: new THREE.Color(s.ice) },
    uAtmo: { value: new THREE.Color(s.atmo) },
    uHasOcean: { value: s.ocean },
  }
}

const PLANET_VERT = /* glsl */ `
varying vec3 vObj;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
void main(){
  vObj = normalize(position);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const PLANET_FRAG = /* glsl */ `
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
varying vec3 vNormalV;
void main(){
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const ATMO_FRAG = /* glsl */ `
uniform vec3 uAtmo;
varying vec3 vNormalV;
void main(){
  float intensity = pow(0.72 - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 3.0);
  gl_FragColor = vec4(uAtmo, 1.0) * clamp(intensity, 0.0, 1.4);
}
`

export function buildPlanet(planet: PlanetId, radiusUnits: number): {
  group: THREE.Group
  uniforms: PlanetUniforms
  surface: THREE.Mesh
  clouds: THREE.Mesh
  atmoShell: THREE.Mesh
} {
  const group = new THREE.Group()
  const uniforms = createPlanetUniforms(planet)

  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 64),
    new THREE.ShaderMaterial({
      uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
    })
  )
  surface.scale.setScalar(radiusUnits)
  group.add(surface)

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.008, 72, 48),
    new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: uniforms.uSunDir,
        uTime: uniforms.uTime,
      } as unknown as Record<string, THREE.IUniform>,
      vertexShader: PLANET_VERT.replace('vObj = normalize(position);', 'vObj = normalize(position);'),
      fragmentShader: /* glsl */ `
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
    })
  )
  clouds.scale.setScalar(radiusUnits)
  clouds.visible = planet === 'earth'
  group.add(clouds)

  const atmoShell = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 64, 48),
    new THREE.ShaderMaterial({
      uniforms: { uAtmo: uniforms.uAtmo } as unknown as Record<string, THREE.IUniform>,
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  )
  atmoShell.scale.setScalar(radiusUnits)
  group.add(atmoShell)

  return { group, uniforms, surface, clouds, atmoShell }
}

/* ---------------- vehicle geometry ---------------- */

/** sharp-edged waverider dart (nose +X, up +Y) */
export function buildWaveriderGeometry(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector3(5.2, 0, 0), // nose
    new THREE.Vector3(-0.4, 0.06, 2.9), // leading edge tips
    new THREE.Vector3(-0.4, 0.06, -2.9),
    new THREE.Vector3(-5.0, 0.62, 1.75), // tail top corners
    new THREE.Vector3(-5.0, 0.62, -1.75),
    new THREE.Vector3(-5.0, -0.42, 1.75), // tail bottom corners
    new THREE.Vector3(-5.0, -0.42, -1.75),
    new THREE.Vector3(-2.2, -0.52, 0), // keel
    new THREE.Vector3(-5.0, -0.2, 0), // tail center
  ]
  return new ConvexGeometry(pts)
}

/** blunt-body capsule with heatshield (nose +X: heatshield faces −X... we
 *  actually orient the vehicle with velocity along +X, so the shield is at −X,
 *  the backshell toward +X) */
export function buildCapsuleGeometry(): THREE.BufferGeometry {
  // lathe profile around Y then rotate so axis = X; profile from shield edge to apex
  const profile: THREE.Vector2[] = []
  const R = 1.55
  // heatshield spherical cap (40°)
  for (let i = 0; i <= 10; i++) {
    const ang = (-40 + (40 * i) / 10) * (Math.PI / 180)
    profile.push(new THREE.Vector2(R * Math.cos(ang), R * Math.sin(ang) - R * Math.sin((-40 * Math.PI) / 180)))
  }
  // shoulder + backshell cone
  profile.push(new THREE.Vector2(1.5, 0.1))
  profile.push(new THREE.Vector2(0.85, 1.45))
  profile.push(new THREE.Vector2(0.55, 1.7))
  profile.push(new THREE.Vector2(0.0, 1.78))
  const geo = new THREE.LatheGeometry(profile, 40)
  geo.rotateZ(Math.PI / 2) // axis Y → X (apex toward +X)
  geo.translate(-0.55, 0, 0) // center roughly
  return geo
}

/* ---------------- glow sprite texture ---------------- */

export function makeGlowTexture(): THREE.CanvasTexture {
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
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function makeStarfield(count: number, radius: number): THREE.Points {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    // random direction
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
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const mat = new THREE.PointsMaterial({
    size: 1.6,
    vertexColors: true,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.85,
  })
  return new THREE.Points(geo, mat)
}
