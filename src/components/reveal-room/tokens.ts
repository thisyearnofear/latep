/**
 * The bridge between the design tokens and the 3D scene.
 *
 * design.md §3 says every colour comes from `tokens.css`. A WebGL scene is the
 * one place where `var(--color-…)` cannot be applied by the browser, so the
 * tokens are read here instead of being retyped as literals: the room renders
 * in exactly the colours the DOM around it uses, and re-tinting the product
 * re-tints the room.
 *
 * Why this reads pixels instead of parsing the string: the tokens are written
 * in `oklch()`, and neither of the two obvious shortcuts handles that.
 * `THREE.Color.setStyle` understands hex, `rgb()` and `hsl()` only, and asks
 * the canvas to normalize the string does not help either — Chrome hands
 * `oklch(97% 0.008 95)` straight back rather than a hex. Filling one pixel and
 * reading it does work, because the canvas has to resolve the colour to sRGB
 * bytes to paint it at all, and it keeps working for whatever colour syntax
 * the tokens adopt next.
 */

import { Color, SRGBColorSpace, Vector3 } from "three";

/** Shown when a token cannot be resolved at all: visible, never black. */
const UNRESOLVED = [0.5, 0.5, 0.5] as const;

const cache = new Map<string, Color>();
let probe: CanvasRenderingContext2D | null | undefined;

function probeContext(): CanvasRenderingContext2D | null {
  if (probe !== undefined) return probe;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext("2d", { willReadFrequently: true });
  } catch {
    probe = null;
  }
  return probe;
}

/** A CSS colour string as `[r, g, b]` in 0–255 sRGB, or null if unreadable. */
function resolveSrgb(css: string): [number, number, number] | null {
  const ctx = probeContext();
  if (!ctx || !css) return null;
  try {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    // An unparseable value leaves fillStyle untouched, so the pixel comes back
    // fully transparent instead of painted.
    if (a === 0) return null;
    return [r, g, b];
  } catch {
    return null;
  }
}

/**
 * A token as a three `Color`, in the renderer's working colour space, ready to
 * hand to a lit material.
 */
export function tokenColor(name: string): Color {
  const hit = cache.get(name);
  if (hit) return hit;

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const srgb = resolveSrgb(raw);

  const color = new Color();
  if (srgb)
    color.setRGB(srgb[0] / 255, srgb[1] / 255, srgb[2] / 255, SRGBColorSpace);
  else color.setRGB(UNRESOLVED[0], UNRESOLVED[1], UNRESOLVED[2]);

  cache.set(name, color);
  return color;
}

/**
 * The same token as a `vec3` uniform.
 *
 * A custom shader writes straight to the framebuffer and gets none of the
 * colour management a built-in material gets, so the value has to be encoded
 * the way the DOM would have been. Converting here keeps the room's paper and
 * ink matching the paper and ink of the receipt beside it.
 */
export function tokenVec3(name: string): Vector3 {
  const srgb = tokenColor(name).clone().convertLinearToSRGB();
  return new Vector3(srgb.r, srgb.g, srgb.b);
}
