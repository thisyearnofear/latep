/**
 * Isometric projection for the plates.
 *
 * A plate is a hairline drawing of a small object, drawn in 2:1 dimetric
 * projection — the old game isometric, where the world axes run at 30° to the
 * screen. Everything on a plate is a box, a thread or a note; nothing is
 * imported from an image, so a plate stays crisp at any size and prints as
 * vector on the receipt stock.
 *
 * The projection is deliberately plain maths, no matrix trickery:
 *
 *     screenX = (x - y)
 *     screenY = (x + y) / 2 - z
 *
 * +x runs right and down, +y runs left and down, +z runs up. The viewer
 * therefore sees the top face, the face at y = max (screen-left) and the face
 * at x = max (screen-right) of every box.
 *
 * This file is geometry only. It knows nothing about colour, marks or copy —
 * the plate decides how a shape is inked.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Pt {
  x: number;
  y: number;
}

/**
 * How a shape is inked on the plate.
 *
 * - `faint` — pencil. Nothing is decided here yet.
 * - `ink` — decided, and nobody's.
 * - `you` — your side. Blue, as everywhere in the app.
 * - `partner` — the other side. Amber, as everywhere in the app.
 * - `void` — a hole: the stock showing through, cut by a punch.
 *
 * These are the only five. Colour means "decided", and the two thread colours
 * mean "you" and "your partner" — the same rule the scene and the receipts
 * already follow (design.md §3, §6).
 */
export type Tone = "faint" | "ink" | "you" | "partner" | "void";

export interface Box {
  x: number;
  y: number;
  z: number;
  /** width along +x */
  w: number;
  /** depth along +y */
  d: number;
  /** height along +z */
  h: number;
  tone: Tone;
  /** Fill the faces as well as outlining them. */
  solid?: boolean;
  /** Draw only the silhouette, skip the internal edges. */
  clean?: boolean;
}

/** Project a world point to plate space. */
export function project(p: Vec3): Pt {
  return { x: p.x - p.y, y: (p.x + p.y) * 0.5 - p.z };
}

/** Project a world point and round it for a path command. */
function proj(p: Vec3): Pt {
  const q = project(p);
  return { x: Math.round(q.x * 100) / 100, y: Math.round(q.y * 100) / 100 };
}

/** The three visible faces of a box, in world space, in draw order. */
function facePoints(b: Box) {
  const { x, y, z, w, d, h } = b;
  const zTop = z + h;
  return {
    // the top face
    top: [
      { x, y, z: zTop },
      { x: x + w, y, z: zTop },
      { x: x + w, y: y + d, z: zTop },
      { x, y: y + d, z: zTop },
    ],
    // the screen-left face, at y = max
    left: [
      { x, y: y + d, z },
      { x: x + w, y: y + d, z },
      { x: x + w, y: y + d, z: zTop },
      { x, y: y + d, z: zTop },
    ],
    // the screen-right face, at x = max
    right: [
      { x: x + w, y: y + d, z },
      { x: x + w, y, z },
      { x: x + w, y, z: zTop },
      { x: x + w, y: y + d, z: zTop },
    ],
  };
}

export interface Face {
  points: Pt[];
  tone: Tone;
  solid: boolean;
  /** A face with no edges to draw (the far side of a clean box). */
  hidden: boolean;
}

/**
 * The faces of one box, back to front. The painter's order is the one the
 * projection implies: the top face first, then the two side faces.
 */
export function boxFaces(b: Box): Face[] {
  const f = facePoints(b);
  const map = (pts: Vec3[]): Pt[] => pts.map(proj);
  const sides = b.clean
    ? [
        [f.left[0], f.left[3], f.right[3], f.right[0]],
        [f.right[0], f.right[3], f.left[3], f.left[0]],
      ]
    : [f.left, f.right];

  return [
    { points: map(f.top), tone: b.tone, solid: !!b.solid, hidden: false },
    ...sides.map((pts, i) => ({
      points: map(pts),
      tone: b.tone,
      solid: !!b.solid,
      hidden: !!b.clean && i === 1,
    })),
  ];
}

/**
 * Draw order: back to front. A box is behind another when its far corner is
 * further up the screen, so the sort key is the sum of its footprint plus the
 * height of its back edge — the classic painter's-algorithm approximation
 * that works for a plate of small objects.
 */
export function sortBoxes(boxes: Box[]): Box[] {
  return [...boxes].sort((a, b) => {
    const key = (o: Box) => o.x + o.y + o.w + o.d + o.z * 0.001;
    return key(a) - key(b);
  });
}

/** The outline of a box, as a closed path in plate space. */
export function boxOutline(b: Box): string {
  const f = facePoints(b);
  const pts = [f.top[0], f.top[1], f.top[2], f.top[3]];
  return pts
    .map((p, i) => {
      const q = proj(p);
      return `${i === 0 ? "M" : "L"}${q.x} ${q.y}`;
    })
    .join(" ");
}

/** A line between two world points, as a path command in plate space. */
export function line(a: Vec3, b: Vec3): string {
  const p = proj(a);
  const q = proj(b);
  return `M${p.x} ${p.y} L${q.x} ${q.y}`;
}

/**
 * A braided thread between two world points — the Latep thread, in a plate.
 *
 * The braid is drawn as a pair of strokes crossing `turns` times along the
 * path, so it reads as the same object as the scene's thread at any size.
 */
export function thread(a: Vec3, b: Vec3, turns = 3): { a: string; b: string } {
  const p = proj(a);
  const q = proj(b);
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  // unit vector along the thread, and its normal
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const amp = Math.min(6, len / 6);
  const steps = turns * 8;

  const strand = (phase: number) => {
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const s = Math.sin(t * Math.PI * 2 * turns + phase);
      const x = p.x + dx * t + nx * s * amp;
      const y = p.y + dy * t + ny * s * amp;
      d += `${i === 0 ? "M" : "L"}${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100} `;
    }
    return d.trim();
  };

  return { a: strand(0), b: strand(Math.PI) };
}

/** The bounds of a set of world points, in plate space. */
export function bounds(points: Vec3[]): { min: Pt; max: Pt } {
  const ps = points.map(project);
  const xs = ps.map((p) => p.x);
  const ys = ps.map((p) => p.y);
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
}

/** The eight corners of a box, for working out the plate's extents. */
export function boxCorners(b: Box): Vec3[] {
  const { x, y, z, w, d, h } = b;
  return [
    { x, y, z },
    { x: x + w, y, z },
    { x: x + w, y: y + d, z },
    { x, y: y + d, z },
    { x, y, z: z + h },
    { x: x + w, y, z: z + h },
    { x: x + w, y: y + d, z: z + h },
    { x, y: y + d, z: z + h },
  ];
}
