/** Motion tokens → JS values. Read once per transition; tokens are the source. */

export function cssToken(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export function tokenMs(name: string): number {
  const v = cssToken(name);
  const n = parseFloat(v);
  return v.endsWith("ms") ? n : n * 1000;
}

/** cubic-bezier(...) token → easing function (GSAP can't take the string). */
export function cubicBezier(spec: string): (t: number) => number {
  const m = spec.match(/cubic-bezier\(([^)]+)\)/);
  if (!m) return (t) => t;
  const [x1, y1, x2, y2] = m[1].split(",").map(Number);
  const cx = (t: number) =>
    3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t;
  const cy = (t: number) =>
    3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
  return (t: number) => {
    let lo = 0,
      hi = 1,
      mid = t;
    for (let i = 0; i < 8; i++) {
      mid = (lo + hi) / 2;
      if (cx(mid) < t) lo = mid;
      else hi = mid;
    }
    return cy(mid);
  };
}

/** Preferred GSAP ease name for a token, or the cubic-bezier fallback. */
export function easeFromToken(name: string): (t: number) => number {
  return cubicBezier(cssToken(name));
}

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export const prefersReducedMotion = () =>
  window.matchMedia(REDUCED_MOTION).matches;
