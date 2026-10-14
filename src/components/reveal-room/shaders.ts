/**
 * Two shaders, and no more. design.md §12 allows a shader layer only where it
 * earns its place: the table is litho stock (grain + a printed rule) and the
 * move cards are drawn in pencil, then taken up in ink. Everything else in the
 * room is lit geometry.
 *
 * Both write to the framebuffer directly, so their colours arrive already
 * sRGB-encoded (see `tokens.ts`), and both are driven by uniforms from the GSAP
 * timeline rather than by their own clock: the room must seek, and it must look
 * the same every time.
 */

export const paperVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The table: warm stock with the grain of paper under a light.
 *
 * No vignette and no gradient: the sheet is one flat colour, exactly the
 * receipt token the DOM prints on, and the only variation is the grain. That
 * is what keeps the room looking like the rest of the product rather than like
 * a 3D render (design.md §3 bans gradients, glows and decorative falloff), and
 * it means the paper beside a DOM receipt is the same warm off-white.
 */
export const paperFragment = /* glsl */ `
  uniform vec3 uPaper;
  uniform vec2 uGrainUv;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 cells = vUv * uGrainUv;
    float grain = hash(floor(cells));

    // The sheet runs to the horizon, and out there one grain cell is far
    // smaller than a pixel. Left alone the hash turns into grey moire across
    // the top of the frame, which reads as a smudge on the screen rather than
    // as paper. Fade the grain out once a cell is about a pixel across, and the
    // distance is flat stock instead.
    vec2 footprint = fwidth(cells);
    float fade = 1.0 - smoothstep(0.5, 1.5, max(footprint.x, footprint.y));

    vec3 color = uPaper + (grain - 0.5) * 0.025 * fade;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const cardVertex = paperVertex;

/**
 * A sealed move card: pencil showing through, a ragged ink front sweeping left
 * to right, 26 degrees off horizontal so it reads as a hand, not a wipe.
 */
export const cardFragment = /* glsl */ `
  uniform vec3 uPencil;
  uniform vec3 uInk;
  uniform float uProgress;
  uniform float uInkAmount;
  uniform float uSeed;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    float grain = noise(vUv * vec2(9.0, 24.0) + uSeed);

    // The front is ragged because the noise is added to it, and it travels on
    // a diagonal because vUv.x and vUv.y are both in the term.
    float front = uProgress * 1.25 - 0.12 + (grain - 0.5) * 0.2;
    float diagonal = vUv.x + (1.0 - vUv.y) * 0.22;
    float inked = 1.0 - smoothstep(front, front + 0.06, diagonal);

    // Undecided cards still read as drawn: a faint graphite hatch, no colour.
    float hatch = step(0.72, fract((vUv.x + vUv.y) * 26.0));
    vec3 pencil = uPencil * (0.96 + hatch * 0.08);

    gl_FragColor = vec4(mix(pencil, uInk, inked * uInkAmount), 1.0);
  }
`;
