/**
 * The story hero's scene (design.md §13.5) — the lazy chunk behind DeskHero.
 *
 * Raw three.js, no R3F. The sketch look is a literal port of
 * abhishekmill/R3FSketchMaterial (MIT — THIRD-PARTY-NOTICES.md):
 *   - `sketchGLSL` (sk_hash / sk_noise / sk_rot / sk_ellipse / sk_tooth /
 *     sk_scribble / sk_hatch) from `src/sketch/glsl.js`, verbatim
 *   - `sk_reveal` + shared uniforms from `src/sketch/reveal.js`, verbatim
 *   - the material body from `SketchMaterial.jsx` (triplanar faceHatch,
 *     tooth, reveal multiply)
 *   - the outline from `SketchOutline.jsx` (merged-vertex inverted hull
 *     expanded in screen space + wobbly overshooting edge strokes)
 *   - the shadow from `SketchShadow.jsx` (ShadowMaterial + onBeforeCompile
 *     injecting sk_scribble over getShadowMask)
 * Only raw-three wiring differs: uniforms by hand, one GSAP timeline drives
 * the shared `uReveal`, and `uInkMix` does the hero's pencil→ink pass.
 *
 * §13.5 says pencil becomes ink because app state says a move was sealed.
 * The hero is the one exception and it says so here: nothing in this scene
 * is sealed — it draws itself in once (pencil, then ink) as part of the
 * load-in, and that run is presentation, not state.
 *
 * The hero figures are a simplified silhouette built to explicit proportions
 * (see buildHeroFigure) — the game rig in trustFallRig.ts / reveal-room is
 * untouched. After the draw-in the caller snapshots the frame and disposes
 * the renderer; nothing here keeps a clock or an idle loop.
 */

import * as THREE from "three";
import gsap from "gsap";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { tokenColor } from "../reveal-room/tokens";

/* --------------------------------------------------------------------------
 * Upstream GLSL — src/sketch/glsl.js and src/sketch/reveal.js, verbatim.
 * ------------------------------------------------------------------------ */

const SKETCH_GLSL = /* glsl */ `
float sk_hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float sk_noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(sk_hash(i), sk_hash(i + vec2(1, 0)), u.x),
             mix(sk_hash(i + vec2(0, 1)), sk_hash(i + 1.0), u.x), u.y);
}
mat2 sk_rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sk_ellipse(vec2 p, vec2 r) {
  vec2 e = p / r;
  float len = max(length(e), 1e-4);
  return abs(len - 1.0) / max(length(e / r) / len, 1e-4);
}
float sk_tooth(vec2 fragCoord, float dpr, float amount) {
  vec2 p = fragCoord / dpr;
  float g = sk_noise(p * 1.35) * 0.6 + sk_noise(p * 0.45) * 0.4;
  return mix(1.0, smoothstep(0.22, 0.72, g), amount);
}
float sk_scribble(vec2 p, float angle, float stepY, float bandW, float loops, float width, float seed) {
  vec2 q = sk_rot(angle) * p;
  float px = max(length(fwidth(q)) * 0.7071, 1e-6);
  float bx = q.x / bandW + (sk_noise(vec2(q.y / bandW * 3.0, seed)) - 0.5) * 0.9;
  float band = floor(bx);
  float X = fract(bx) * bandW;
  float Y = q.y + sk_hash(vec2(band, seed)) * 2.0 * stepY
                + (sk_noise(vec2(q.x / bandW * 3.0, seed + 3.0)) - 0.5) * stepY * 0.6;
  float d = stepY, d2 = 2.0 * stepY, slope = X / bandW * d;
  float dist = min(abs(fract((Y - slope) / d2 + 0.5) - 0.5),
                   abs(fract((Y + slope) / d2 + 0.5) - 0.5)) * d2;
  vec2 rad = vec2(d * 2.2, d * 0.8) * (0.8 + 0.4 * sk_hash(vec2(band, seed + 2.0)));
  float kr = floor((Y - d) / d2 + 0.5), kl = floor(Y / d2 + 0.5);
  if (sk_hash(vec2(kr + band * 17.0, seed + 5.0)) < loops * 0.5)
    dist = min(dist, sk_ellipse(vec2(X, Y) - vec2(bandW - rad.x, d + d2 * kr - 0.15 * d), rad));
  if (sk_hash(vec2(kl + band * 23.0, seed + 9.0)) < loops * 0.5)
    dist = min(dist, sk_ellipse(vec2(X, Y) - vec2(rad.x, d2 * kl - 0.15 * d), rad));
  float hw = 0.5 * width * (1.0 - 0.25 * sk_noise(vec2(X / bandW * 4.0, Y / d + seed)));
  float a = (1.0 - smoothstep(hw - 0.5, hw + 0.5, dist / px)) * min(1.0, hw * 2.0 + 0.3);
  a *= 1.0 - 0.25 * sk_noise(vec2(X / bandW * 15.0, Y / d + seed));
  a *= smoothstep(0.11, 0.17, sk_noise(vec2(X / bandW * 5.0, Y / d * 0.5 + seed * 3.1)));
  return a;
}
float sk_hatch(vec2 p, float dark, float density, float angle, float loops, float width, float pressure, float seed) {
  float vdark = smoothstep(0.85, 0.95, dark);
  float stepY = 0.84 / (density * mix(0.6, 1.5, smoothstep(0.2, 0.75, dark)) * (1.0 + 0.12 * vdark));
  float bandW = mix(0.45, 0.85, dark) + sk_hash(vec2(seed, 1.0)) * 0.25;
  float a = sk_scribble(p, angle, stepY, bandW, loops, width * (1.0 + 0.15 * vdark), seed);
  a *= smoothstep(0.1, 0.2, dark * 1.1 + (sk_noise(p * 1.7 + seed) - 0.5) * 0.9);
  float need = mix(0.55, 0.3, vdark);
  float cross = smoothstep(0.62, 0.75, dark) * smoothstep(need - 0.05, need + 0.05, sk_noise(p * 1.3 + seed + 11.0));
  float b = sk_scribble(p, angle + 0.8, stepY * 1.55, bandW * 0.75, loops, width, seed + 19.0) * cross;
  float ink = pressure * (0.68 + 0.64 * sk_noise(p * 1.4 + seed + 2.0)) * mix(0.7, 1.0, dark) * (1.0 + 0.2 * vdark);
  return 1.0 - (1.0 - a * ink) * (1.0 - b * ink * 0.64);
}
`;

const REVEAL_GLSL = /* glsl */ `
uniform float uReveal, uRevealScale, uRevealEdge, uRevealSweep, uRevealWet, uRevealShadow, uRevealPaper, uRevealLines;
vec2 sk_reveal(vec3 world) {
  vec2 a = world.xz * uRevealScale, b = world.xy * uRevealScale + 7.3;
  float n = 0.5 * (sk_noise(a) + sk_noise(b)) * 0.7 + 0.5 * (sk_noise(a * 3.1) + sk_noise(b * 3.1)) * 0.3;
  float order = mix(n, clamp(world.y / 2.5, 0.0, 1.0), uRevealSweep);
  float v = smoothstep(order, order + uRevealEdge, uReveal * (1.0 + uRevealEdge));
  return vec2(v, 1.0 + uRevealWet * 4.0 * v * (1.0 - v));
}
`;

/* One shared uniform set, exactly like upstream revealUniforms: animate
   uReveal once and hatching, outlines, shadow and wash move together. */
const reveal = {
  uReveal: { value: 0 },
  uRevealScale: { value: 1.2 },
  uRevealEdge: { value: 0.15 },
  uRevealSweep: { value: 0.35 },
  uRevealWet: { value: 0.6 },
  uRevealShadow: { value: 1 },
  uRevealPaper: { value: 1 },
  uRevealLines: { value: 1 },
};

/* The hero's own addition — pencil becomes ink after the wash completes.
   Upstream has no ink pass; uInkMix lerps the stroke colour, not the GLSL. */
const INKMIX = { uInkMix: { value: 0 } };

/* The material body, ported from SketchMaterial.jsx verbatim apart from
   uInkMix (pencil→ink) and our token-fed colours. */
const SKETCH_VERT = /* glsl */ `
  varying vec3 vObj; varying vec3 vN; varying vec3 vWN; varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    vec3 scale = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
    vObj = position * scale; vN = normal;
    vWN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const SKETCH_FRAG = /* glsl */ `
  uniform vec3 uInk, uPaper, uLight;
  uniform float uDensity, uPressure, uLoops, uWidth, uTooth, uAngle, uDpr, uSeed, uInkMix;
  varying vec3 vObj; varying vec3 vN; varying vec3 vWN; varying vec3 vWorld;
  ${SKETCH_GLSL}
  ${REVEAL_GLSL}
  float faceHatch(vec2 p, float dark, float seed) {
    float angle = uAngle + (sk_hash(vec2(seed, 7.0)) - 0.5) * 0.9;
    return sk_hatch(p, dark, uDensity, angle, uLoops, uWidth * uDpr, uPressure, seed);
  }
  void main() {
    vec3 n = normalize(vN);
    vec3 tw = pow(abs(n), vec3(8.0)); tw /= dot(tw, vec3(1.0));
    float dark = clamp(1.0 - max(dot(normalize(vWN), uLight), 0.0) * 1.05 + 0.08, 0.0, 1.0);
    float ink = tw.x * faceHatch(vObj.zy, dark, uSeed)
              + tw.y * faceHatch(vObj.xz, dark, uSeed + 7.0)
              + tw.z * faceHatch(vObj.xy, dark, uSeed + 13.0);
    ink *= sk_tooth(gl_FragCoord.xy, uDpr, uTooth);
    vec2 rev = sk_reveal(vWorld);
    ink *= rev.x * rev.y;
    // pencil -> ink: the stroke colour lerps from soft grey to the token ink
    vec3 stroke = mix(vec3(0.62), uInk, uInkMix);
    gl_FragColor = vec4(uPaper * mix(vec3(1.0), stroke, clamp(ink, 0.0, 1.0)), 1.0);
    #include <colorspace_fragment>
  }`;

function sketchMaterial(
  ink: THREE.Color,
  paper: THREE.Color,
  light: THREE.Vector3,
  seed: number,
  dpr: number,
  opts: Partial<{
    density: number;
    pressure: number;
    loops: number;
    width: number;
    angle: number;
  }> = {},
) {
  const m = new THREE.ShaderMaterial({
    vertexShader: SKETCH_VERT,
    fragmentShader: SKETCH_FRAG,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    uniforms: {
      uInk: { value: ink },
      uPaper: { value: paper },
      uLight: { value: light },
      uDensity: { value: opts.density ?? 22 },
      uPressure: { value: opts.pressure ?? 0.7 },
      uLoops: { value: opts.loops ?? 0.55 },
      uWidth: { value: opts.width ?? 1 },
      uTooth: { value: 0.25 },
      uAngle: { value: opts.angle ?? 0.6 },
      uDpr: { value: dpr },
      uSeed: { value: seed },
      ...reveal,
      ...INKMIX,
    },
  });
  return m;
}

/* --------------------------------------------------------------------------
 * SketchOutline port — src/sketch/SketchOutline.jsx.
 * ------------------------------------------------------------------------ */

const HULL_VERT = /* glsl */ `
  uniform float uWidth; uniform vec2 uRes;
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec2 dir = normalize((projectionMatrix * vec4(normalMatrix * normal, 0.0)).xy + 1e-6);
    float press = 0.75 + 0.25 * sin(dot(position, vec3(13.1, 17.7, 11.3)));
    clip.xy += dir * uWidth * press / uRes * 2.0 * clip.w;
    gl_Position = clip;
  }`;

const HULL_FRAG = /* glsl */ `
  uniform vec3 uInk; uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(uInk, uOpacity);
    #include <colorspace_fragment>
  }`;

const PASSES = [
  { width: 1.0, opacity: 1.0, wobble: 1.0, overshoot: [0.03, 0.13] as const },
  { width: 0.85, opacity: 0.85, wobble: 1.3, overshoot: [0.0, 0.09] as const },
  { width: 0.75, opacity: 0.7, wobble: 1.6, overshoot: [-0.02, 0.07] as const },
];
const SAMPLES = 28;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildHull(geometry: THREE.BufferGeometry) {
  const g = geometry.clone();
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const merged = mergeVertices(g);
  merged.computeVertexNormals();
  return merged;
}

function buildEdgeStrokes(
  geometry: THREE.BufferGeometry,
  jitter: number,
  seed: number,
) {
  const edges = new THREE.EdgesGeometry(geometry, 30).attributes.position
    .array as Float32Array;
  if (!edges.length)
    return [] as Array<{ pts: number[]; opacity: number; width: number }>;
  geometry.computeBoundingSphere();
  const { center, radius } = geometry.boundingSphere as THREE.Sphere;
  const random = mulberry32(seed * 9973 + 17);
  const between = ([min, max]: readonly number[]) =>
    min + (max - min) * random();

  return PASSES.map((pass) => {
    const pts: number[] = [];
    for (let i = 0; i < edges.length; i += 6) {
      const a = new THREE.Vector3().fromArray(edges, i);
      const b = new THREE.Vector3().fromArray(edges, i + 3);
      const len = a.distanceTo(b);
      const d = b.clone().sub(a).normalize();
      const out = a.clone().add(b).multiplyScalar(0.5).sub(center);
      out.addScaledVector(d, -out.dot(d)).normalize();
      const side = new THREE.Vector3().crossVectors(d, out);
      const start = a
        .clone()
        .addScaledVector(d, -between(pass.overshoot) * len);
      const end = b.clone().addScaledVector(d, between(pass.overshoot) * len);
      const amplitude = jitter * Math.min(len, radius) * 0.8 * pass.wobble;
      const phase = [random(), random(), random()].map((v) => v * Math.PI * 2);
      const bow = (random() - 0.5) * 1.2;
      const shift = random() - 0.5;
      let prev: THREE.Vector3 | null = null;
      for (let k = 0; k < SAMPLES; k++) {
        const t = k / (SAMPLES - 1);
        const w =
          bow * Math.sin(Math.PI * t) +
          0.3 * Math.sin(t * 8.2 + phase[0]) +
          0.12 * Math.sin(t * 19 + phase[1]) +
          shift;
        const lift = 0.2 + 0.15 * Math.sin(t * 7.1 + phase[2]);
        const p = start
          .clone()
          .lerp(end, t)
          .addScaledVector(side, w * amplitude)
          .addScaledVector(out, (Math.abs(w) + lift) * amplitude);
        if (prev) pts.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
        prev = p;
      }
    }
    return { pts, opacity: pass.opacity, width: pass.width };
  });
}

/* --------------------------------------------------------------------------
 * The hero figure — a simplified silhouette (the game rig is untouched):
 *   H = 1.0 head-to-toe. Head sphere d=0.2H sitting on the neck (no gap),
 *   torso capsule 0.33H, legs two capsules 0.45H, arms 0.32H — one forearm
 *   raised toward the counter, holding the thread end.
 * ------------------------------------------------------------------------ */

const ARM_R = 0.035;
const TORSO_R = 0.075;
const LEG_R = 0.04;

/** A limb capsule between two points (world-space, relative to feet). */
function limb(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  castShadow = true,
) {
  const dir = to.clone().sub(from);
  const len = dir.length();
  const geo = new THREE.CapsuleGeometry(radius, len, 4, 10);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(from).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  mesh.castShadow = castShadow;
  return mesh;
}

interface HeroFigure {
  group: THREE.Group;
  hand: THREE.Vector3; // where the raised hand sits, in world space
}

function buildHeroFigure(options: {
  x: number;
  z: number;
  facing: 1 | -1; // +1 faces toward +x (the counter between them)
  material: THREE.Material;
}): HeroFigure {
  const { x, z, facing, material } = options;
  const group = new THREE.Group();

  // Legs: two capsules from hip (y 0.45) down to the ground, slight stance.
  group.add(
    limb(
      new THREE.Vector3(-0.055, 0.45, 0),
      new THREE.Vector3(-0.07, 0.0, 0.015),
      LEG_R,
      material,
    ),
    limb(
      new THREE.Vector3(0.055, 0.45, 0),
      new THREE.Vector3(0.075, 0.0, -0.015),
      LEG_R,
      material,
    ),
    // Torso: hip to neck, 0.33H tall.
    limb(
      new THREE.Vector3(0, 0.45, 0),
      new THREE.Vector3(0, 0.78, 0),
      TORSO_R,
      material,
    ),
  );

  // Head: sphere d=0.2H whose bottom touches the neck top — no gap.
  const headGeo = new THREE.SphereGeometry(0.1, 20, 14);
  const head = new THREE.Mesh(headGeo, material);
  head.position.set(0, 0.88, 0);
  head.castShadow = true;
  group.add(head);

  // Arms 0.32H: the counter-facing arm bends up so the hand holds the thread
  // end at chest height over the counter edge; the far arm hangs relaxed.
  const shoulder = new THREE.Vector3(0, 0.72, 0);
  const nearHand = new THREE.Vector3(facing * 0.17, 0.66, 0);
  const nearElbow = new THREE.Vector3(facing * 0.13, 0.55, 0.02);
  group.add(
    limb(shoulder, nearElbow, ARM_R, material),
    limb(nearElbow, nearHand, ARM_R, material),
    limb(
      shoulder,
      new THREE.Vector3(-facing * 0.09, 0.42, -0.02),
      ARM_R,
      material,
    ),
  );

  group.position.set(x, 0, z);
  group.rotation.y = facing > 0 ? 0 : Math.PI;

  const hand = new THREE.Vector3(x + facing * 0.17, 0.66, z);
  return { group, hand };
}

/* --------------------------------------------------------------------------
 * The watercolour wash behind the drawing — bloom colour is the band colour
 * mixed TOWARD clay or sage, never toward black; the rim is the same hue,
 * lightly saturated and at most ~8% darker. Alpha dies before the frame edge.
 * ------------------------------------------------------------------------ */

const WASH_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const WASH_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uClay;
  uniform vec3 uSage;
  uniform vec3 uBand;
  uniform float uReveal;

  float w_hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float w_noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(w_hash(i), w_hash(i + vec2(1, 0)), u.x),
               mix(w_hash(i + vec2(0, 1)), w_hash(i + 1.0), u.x), u.y);
  }
  float w_fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 3; i++) { v += a * w_noise(p); p *= 2.05; a *= 0.5; }
    return v;
  }

  vec4 bloom(vec2 uv, vec2 c, float r, vec3 tint, float strength, float seed) {
    float ruffle = w_fbm(uv * 4.0 + seed) * 0.35;
    float dist = length(uv - c) / (r * (0.8 + ruffle));
    float fill = 1.0 - smoothstep(0.4, 1.0, dist);
    float rim = smoothstep(0.5, 0.85, dist) * (1.0 - smoothstep(0.85, 1.08, dist));
    float grain = w_fbm(uv * 14.0 + seed * 3.1) * 0.3;
    // Pigment: band -> tint. The rim pools the same hue a little deeper
    // (+sat, max ~8% darker), never toward grey.
    vec3 pigment = mix(uBand, tint, min(1.0, strength * (1.0 + rim * 0.3) + grain * 0.15));
    pigment *= 1.0 - rim * 0.08;
    float a = fill * strength * (0.8 + grain * 0.4);
    return vec4(pigment, a);
  }

  void main() {
    vec3 col = uBand;
    float a = 0.0;
    vec4 b;
    b = bloom(vUv, vec2(0.34, 0.62), 0.26, uClay, 0.8, 1.0);
    col = mix(col, b.rgb, b.a); a = max(a, b.a);
    b = bloom(vUv, vec2(0.66, 0.52), 0.30, uSage, 0.6, 2.0);
    col = mix(col, b.rgb, b.a); a = max(a, b.a);
    b = bloom(vUv, vec2(0.50, 0.22), 0.22, uClay, 0.68, 3.0);
    col = mix(col, b.rgb, b.a); a = max(a, b.a);

    float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    a *= smoothstep(0.02, 0.3, edge) * uReveal;
    if (a <= 0.004) discard;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }`;

/* --------------------------------------------------------------------------
 * Scene
 * ------------------------------------------------------------------------ */

export interface HeroScene {
  canvas: HTMLCanvasElement;
  play: () => Promise<void>;
  renderOnce: () => void;
  dispose: () => void;
  /** Test hook: project a world-space point to canvas pixels. */
  project: (world: { x: number; y: number; z: number }) => {
    x: number;
    y: number;
  };
  /** World-space anchors the checks can project. */
  anchors: Record<string, THREE.Vector3>;
}

export function createHeroScene(width: number, height: number): HeroScene {
  const dpr = Math.min(window.devicePixelRatio, 2);
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const ink = tokenColor("--color-receipt-ink");
  const paper = tokenColor("--color-receipt");
  const you = tokenColor("--color-you-print");
  const partner = tokenColor("--color-partner-print");
  const sage = tokenColor("--color-sage-wash");
  const clay = tokenColor("--color-clay-wash");

  // Upper-left key light — the same direction upstream ships.
  const lightDir = new THREE.Vector3(-0.63, 1, 0.57).normalize();
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.copy(lightDir).multiplyScalar(6);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = -3;
  light.shadow.camera.right = 3;
  light.shadow.camera.top = 3;
  light.shadow.camera.bottom = -2;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 20;
  scene.add(light, new THREE.AmbientLight(0xffffff, 0.4));

  // Orthographic 3/4 view, like the iso plate: yaw 40deg, pitch 32deg.
  const camera = new THREE.OrthographicCamera();
  const target = new THREE.Vector3(0, 0.52, 0);
  const dir = new THREE.Vector3(
    Math.sin((40 * Math.PI) / 180) * Math.cos((32 * Math.PI) / 180),
    Math.sin((32 * Math.PI) / 180),
    Math.cos((40 * Math.PI) / 180) * Math.cos((32 * Math.PI) / 180),
  ).normalize();
  camera.position.copy(target).addScaledVector(dir, 10);
  camera.lookAt(target);

  const aspect = width / height;
  // A figure is H=1.0 world units; the band shows ~2.9 units tall so a
  // figure stands ~35% of the band height at every size.
  const halfH = 1.15;
  camera.left = -halfH * aspect;
  camera.right = halfH * aspect;
  camera.top = halfH;
  camera.bottom = -halfH;
  camera.near = 0.1;
  camera.far = 40;
  camera.updateProjectionMatrix();

  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const lineGeos: THREE.BufferGeometry[] = [];

  const sketch = (seed: number, inkOverride?: THREE.Color) => {
    const m = sketchMaterial(inkOverride ?? ink, paper, lightDir, seed, dpr);
    materials.push(m);
    return m;
  };

  const res2 = new THREE.Vector2(width * dpr, height * dpr);

  /* Hull + edge-stroke outline for one mesh (SketchOutline port). */
  const addOutline = (
    mesh: THREE.Mesh,
    seed: number,
    opts: {
      width?: number;
      opacity?: number;
      jitter?: number;
      edges?: boolean;
    } = {},
  ) => {
    const widthPx = (opts.width ?? 1.4) * dpr;
    const opacity = opts.opacity ?? 0.8;
    const hullGeo = buildHull(mesh.geometry);
    geometries.push(hullGeo);
    const hullMat = new THREE.ShaderMaterial({
      vertexShader: HULL_VERT,
      fragmentShader: HULL_FRAG,
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        uInk: { value: ink },
        uOpacity: { value: opacity },
        uWidth: { value: widthPx },
        uRes: { value: res2 },
      },
    });
    materials.push(hullMat);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.copy(mesh.position);
    hull.quaternion.copy(mesh.quaternion);
    hull.scale.copy(mesh.scale);
    mesh.parent?.add(hull);

    if (opts.edges !== false) {
      for (const s of buildEdgeStrokes(
        mesh.geometry,
        opts.jitter ?? 0.02,
        seed,
      )) {
        if (!s.pts.length) continue;
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(s.pts, 3));
        lineGeos.push(g);
        const lm = new THREE.LineBasicMaterial({
          color: ink,
          transparent: true,
          opacity: opacity * s.opacity,
        });
        materials.push(lm);
        const line = new THREE.LineSegments(g, lm);
        line.position.copy(mesh.position);
        line.quaternion.copy(mesh.quaternion);
        line.scale.copy(mesh.scale);
        mesh.parent?.add(line);
      }
    }
  };

  /** Mesh a primitive with the sketch material + pen outline. */
  const drawn = (
    geo: THREE.BufferGeometry,
    seed: number,
    outlineOpts?: Parameters<typeof addOutline>[2],
    inkOverride?: THREE.Color,
  ) => {
    geometries.push(geo);
    const mesh = new THREE.Mesh(geo, sketch(seed, inkOverride));
    mesh.castShadow = true;
    mesh.userData.outline = { seed, opts: outlineOpts };
    return mesh;
  };

  /* ------------------------------------------------------------------
   * Composition — the Desk plate's layout.
   * ------------------------------------------------------------------ */

  const group = new THREE.Group();
  scene.add(group);

  const COUNTER = { w: 2.2, h: 0.5, d: 0.55 };
  const counter = drawn(
    new THREE.BoxGeometry(COUNTER.w, COUNTER.h, COUNTER.d),
    1,
  );
  counter.position.set(0, COUNTER.h / 2, 0);
  group.add(counter);

  const plinth = drawn(
    new THREE.BoxGeometry(0.2, 0.3, 0.2),
    2,
    undefined,
    partner,
  );
  plinth.position.set(-0.55, COUNTER.h + 0.15, -0.05);
  group.add(plinth);

  const slips = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const slip = drawn(new THREE.BoxGeometry(0.32, 0.018, 0.24), 10 + i);
    slip.position.set(i * 0.008 - 0.012, i * 0.02, -i * 0.006);
    slip.rotation.y = (i - 1.5) * 0.05;
    slips.add(slip);
  }
  slips.position.set(0.55, COUNTER.h + 0.01, 0.02);
  group.add(slips);

  const maria = buildHeroFigure({
    x: -1.25,
    z: 0.42,
    facing: 1,
    material: sketch(20),
  });
  group.add(maria.group);

  const counterparty = buildHeroFigure({
    x: 1.25,
    z: -0.42,
    facing: -1,
    material: sketch(21),
  });
  group.add(counterparty.group);

  // Figure limbs get hull outlines too — thin, no edge strokes on capsules.
  group.updateMatrixWorld(true);
  interface PendingOutline {
    seed: number;
    opts?: Parameters<typeof addOutline>[2];
  }
  const pendingOutlines: Array<{ mesh: THREE.Mesh } & PendingOutline> = [];
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const tag = (o as THREE.Mesh & { userData: { outline?: PendingOutline } })
        .userData.outline;
      if (tag) pendingOutlines.push({ mesh: o as THREE.Mesh, ...tag });
    }
  });
  for (const { mesh, seed, opts } of pendingOutlines)
    addOutline(mesh, seed, opts);
  for (const fig of [maria, counterparty]) {
    let i = 0;
    fig.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        addOutline(o as THREE.Mesh, 40 + i, {
          width: 1.1,
          opacity: 0.7,
          edges: false,
        });
        i++;
      }
    });
  }

  // The thread between the raised hands — two loose strands, you-amber.
  const from = maria.hand;
  const to = counterparty.hand;
  const mid = from.clone().lerp(to, 0.5);
  mid.y -= 0.07; // gentle sag

  for (const [col, dz] of [
    [you, 0.012],
    [partner, -0.012],
  ] as const) {
    const geo = new THREE.TubeGeometry(
      new THREE.QuadraticBezierCurve3(
        from.clone().add(new THREE.Vector3(0, 0, dz)),
        mid.clone().add(new THREE.Vector3(0, -0.01, dz)),
        to.clone().add(new THREE.Vector3(0, 0, dz)),
      ),
      40,
      0.011,
      5,
      false,
    );
    geometries.push(geo);
    const strand = new THREE.Mesh(geo, sketch(col === you ? 30 : 31, col));
    strand.castShadow = false;
    group.add(strand);
  }
  // The invisible ground: a ShadowMaterial plane that shows only the
  // hatched cast shadow (SketchShadow port via onBeforeCompile).
  const shadowMat = new THREE.ShadowMaterial({ color: ink, transparent: true });
  shadowMat.opacity = 0.55;
  shadowMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, reveal, INKMIX);
    shader.vertexShader =
      "varying vec3 vWorld;\n" +
      shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader =
      "varying vec3 vWorld;\nuniform float uInkMix;\n" +
      SKETCH_GLSL +
      REVEAL_GLSL +
      shader.fragmentShader.replace(
        "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );",
        `float shade = 1.0 - getShadowMask();
         float ink = sk_scribble(vWorld.xz, -0.26, 0.6 / 22.0, 0.55, 0.33, ${(dpr * 0.9).toFixed(2)}, 1.0);
         ink *= sk_tooth(gl_FragCoord.xy, ${dpr.toFixed(2)}, 0.25);
         vec2 rev = sk_reveal(vWorld);
         ink *= mix(1.0, rev.x * rev.y, uRevealShadow);
         gl_FragColor = vec4(mix(vec3(0.62), color, uInkMix), opacity * ink * shade);`,
      );
  };
  shadowMat.customProgramCacheKey = () => `sketch-shadow-${dpr}`;
  materials.push(shadowMat);
  const groundGeo = new THREE.PlaneGeometry(20, 20);
  geometries.push(groundGeo);
  const ground = new THREE.Mesh(groundGeo, shadowMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.001;
  ground.receiveShadow = true;
  scene.add(ground);

  // The watercolour wash — a camera-facing quad far behind the drawing.
  const washMat = new THREE.ShaderMaterial({
    vertexShader: WASH_VERT,
    fragmentShader: WASH_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uClay: { value: clay },
      uSage: { value: sage },
      uBand: { value: sage },
      uReveal: reveal.uReveal,
    },
  });
  materials.push(washMat);
  const washGeo = new THREE.PlaneGeometry(1, 1);
  geometries.push(washGeo);
  const wash = new THREE.Mesh(washGeo, washMat);
  wash.scale.set(halfH * aspect * 2.4, halfH * 2.4, 1);
  wash.position.copy(target).addScaledVector(dir, -9);
  wash.lookAt(camera.position);
  scene.add(wash);

  const anchors: Record<string, THREE.Vector3> = {
    mariaHead: new THREE.Vector3(-1.25, 0.88, 0.42),
    mariaNeck: new THREE.Vector3(-1.25, 0.78, 0.42),
    mariaHip: new THREE.Vector3(-1.25, 0.45, 0.42),
    partnerHead: new THREE.Vector3(1.25, 0.88, -0.42),
    partnerNeck: new THREE.Vector3(1.25, 0.78, -0.42),
    partnerHip: new THREE.Vector3(1.25, 0.45, -0.42),
    mariaHand: from,
    partnerHand: to,
  };

  const project = (world: { x: number; y: number; z: number }) => {
    const v = new THREE.Vector3(world.x, world.y, world.z).project(camera);
    return {
      x: ((v.x + 1) / 2) * width,
      y: ((1 - v.y) / 2) * height,
    };
  };

  const renderOnce = () => {
    renderer.render(scene, camera);
  };

  const play = () =>
    new Promise<void>((resolve) => {
      const state = { reveal: 0, ink: 0 };
      const tl = gsap.timeline({
        onUpdate: () => {
          reveal.uReveal.value = state.reveal;
          INKMIX.uInkMix.value = state.ink;
          renderOnce();
        },
        onComplete: () => {
          renderOnce();
          resolve();
        },
      });
      tl.to(state, { reveal: 1, duration: 1.2, ease: "power1.out" });
      tl.to(state, { ink: 1, duration: 0.5, ease: "power1.inOut" });
    });

  const dispose = () => {
    for (const m of materials) m.dispose();
    for (const g of geometries) g.dispose();
    for (const g of lineGeos) g.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };

  renderOnce();
  return { canvas, play, renderOnce, dispose, project, anchors };
}
