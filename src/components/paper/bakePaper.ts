/**
 * The shared paper texture (design.md §13.4).
 *
 * One texture for the whole app: the paper shader renders once, offscreen,
 * and the result becomes `--paper-texture` — a background-image every stock
 * and wash blends under. A device that cannot run it gets the pre-rendered
 * fallback in `public/assets/paper/` (written by scripts/bake-paper.cjs), so
 * the surface looks the same either way; it just isn't generated on-device.
 *
 * This module renders the @paper-design/shaders `paperTexture` fragment
 * shader with a minimal WebGL pass of our own: the shader is an exported
 * string, so we compile it onto a quad, set the uniforms, draw and read back
 * in the same task — the drawing buffer is cleared after compositing, so the
 * read must happen inside the same frame the draw does.
 *
 * The texture is NEUTRAL: it renders in near-white greys so it can be
 * multiplied over any stock colour — desk, receipt, or a wash — without
 * shifting the hue underneath.
 */

import { paperTextureFragmentShader } from "@paper-design/shaders";
// The vertex shader the mount uses for its sizing uniforms is small enough
// to write by hand; we need no fit/offset machinery for a flat bake.
import { vertexShaderSource } from "./vertexShader";

/** How often to bake, in seconds since epoch. Bumped when params change. */
const TILE = 512;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(
      "paper bake: shader failed to compile",
      gl.getShaderInfoLog(shader),
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Render the paper texture once and return its data URL, or null when WebGL
 * is unavailable. The caller decides what to do with the URL; this function
 * only produces it, then releases the GL context it borrowed.
 */
export function renderPaperTexture(size = TILE): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  // The shaders are GLSL 300 — WebGL2 only, no fallback pass.
  const gl = canvas.getContext("webgl2", {
    preserveDrawingBuffer: false,
    alpha: false,
    antialias: false,
  });
  if (!gl) return null;

  try {
    const vs = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compile(gl, gl.FRAGMENT_SHADER, paperTextureFragmentShader);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(
        "paper bake: program failed to link",
        gl.getProgramInfoLog(program),
      );
      return null;
    }
    gl.useProgram(program);

    // A full-viewport triangle.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 0, 1, 3, -1, 0, 1, -1, 3, 0, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 4, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, size, size);

    const loc = (name: string) => gl.getUniformLocation(program, name);
    const set1f = (n: string, v: number) => gl.uniform1f(loc(n), v);
    const set4f = (n: string, r: number, g: number, b: number, a: number) =>
      gl.uniform4f(loc(n), r, g, b, a);
    const set2f = (n: string, x: number, y: number) =>
      gl.uniform2f(loc(n), x, y);
    const set1i = (n: string, v: number) => gl.uniform1i(loc(n), v);

    // Neutral stock: near-white paper with a soft grey pattern so multiply
    // keeps the ground colour intact.
    set1i("u_isImage", 0);
    set1i("u_clip", 0);
    set1f("u_imageAspectRatio", 1);
    set1f("u_blending", 0);
    set1f("u_distortion", 0);
    set4f("u_colorBack", 1, 1, 1, 1);
    set4f("u_colorPaper", 0.965, 0.96, 0.955, 1);
    set4f("u_colorShadow", 0.88, 0.875, 0.865, 1);
    set1f("u_angle", 210);
    set1f("u_seed", 7);
    set1f("u_roughness", 0.55);
    set1f("u_roughnessSize", 0.35);
    set1f("u_roughnessRows", 0.2);
    set1f("u_fiber", 0.65);
    set1f("u_fiberSize", 0.4);
    set1f("u_folds", 0.22);
    set1f("u_foldSizeX", 0.6);
    set1f("u_foldSizeY", 0.45);
    set1f("u_foldOffsetX", 0.1);
    set1f("u_foldOffsetY", 0.35);
    set1f("u_wrinkles", 0);
    set1f("u_crumples", 0);
    set1f("u_crumpleCount", 0);
    set1f("u_drops", 0);
    set2f("u_resolution", size, size);
    set1f("u_pixelRatio", 1);
    set1f("u_originX", 0.5);
    set1f("u_originY", 0.5);
    set1f("u_fit", 0);
    set1f("u_scale", 1);
    set1f("u_rotation", 0);
    set1f("u_offsetX", 0);
    set1f("u_offsetY", 0);
    set1f("u_worldWidth", 0);
    set1f("u_worldHeight", 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Read back inside the same task: the buffer is cleared on composite.
    const url = canvas.toDataURL("image/png");
    return url;
  } catch {
    return null;
  } finally {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

function prefersReducedData(): boolean {
  try {
    return (
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData === true
    );
  } catch {
    return false;
  }
}

/**
 * Bake the shared paper texture after first paint, or leave the fallback
 * asset in place. Idempotent: safe to call on every boot.
 */
export function bakePaper(): void {
  if (typeof document === "undefined") return;
  const run = () => {
    if (prefersReducedData()) return;
    const url = renderPaperTexture();
    if (url) {
      document.documentElement.style.setProperty(
        "--paper-texture",
        `url("${url}")`,
      );
    }
  };
  try {
    if ("requestIdleCallback" in window) {
      (
        window as Window & {
          requestIdleCallback: (
            cb: () => void,
            o?: { timeout: number },
          ) => void;
        }
      ).requestIdleCallback(run, { timeout: 3000 });
    } else {
      (window as Window).setTimeout(run, 600);
    }
  } catch {
    /* texture stays at the fallback */
  }
}
