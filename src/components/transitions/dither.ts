/**
 * The chapter-edge dither mask (design.md §13.6).
 *
 * One mask for every band edge: a 4×4 Bayer matrix thresholds a vertical
 * ramp — opaque at the bottom, dissolving to transparent at the top — drawn
 * at 4px cells and exported as a data URL to --dither-edge. Canvas2D, not
 * GL: deterministic, one frame, no asset fetch.
 *
 * (Deviation from §13.6's "@paper-design/shaders bake": Canvas2D does this
 * in ten lines; the pre-rendered fallback in public/assets/dither/ comes
 * from scripts/bake-dither.cjs, like the paper texture.)
 */

const CELL = 4;
const COLS = 16; // 64px wide tile
const ROWS = 12; // 48px tall edge

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Draw the mask into a canvas and return it (exported for the bake script). */
export function drawDither(canvas: HTMLCanvasElement): void {
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  for (let y = 0; y < ROWS; y++) {
    // Bottom opaque: alpha 1 at the last row, dissolving toward the top.
    const t = y / (ROWS - 1); // 0 top → 1 bottom
    for (let x = 0; x < COLS; x++) {
      const threshold = BAYER[y % 4][x % 4] / 16;
      if (t + 0.5 / ROWS >= threshold) {
        ctx.fillStyle = "#000";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }
}

/** Bake once at boot and hand the URL to the custom property. */
export function bakeDitherEdge(): void {
  if (typeof document === "undefined") return;
  try {
    const canvas = document.createElement("canvas");
    drawDither(canvas);
    document.documentElement.style.setProperty(
      "--dither-edge",
      `url("${canvas.toDataURL("image/png")}")`,
    );
  } catch {
    /* the static asset stays the fallback */
  }
}
