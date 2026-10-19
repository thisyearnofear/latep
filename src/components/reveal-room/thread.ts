/**
 * The thread, in the room (design.md §6 and §12).
 *
 * `receipt/Thread.tsx` draws the relationship as a 3px stroke in two
 * dimensions. Here the same four states are the same four shapes, with the sag
 * a real cord would have: loose hangs gently, twisted braids taut as the pair
 * earn trust, snapped leaves two frayed ends with nothing across the middle,
 * slack drops out of both hands.
 *
 * The shape is the only thing that changes between states. The state is passed
 * in; this module never reads the moves, so it cannot leak one.
 */

import {
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { MAX_DRAWN_TWISTS, type ThreadState } from "../../content/vocabulary";

/** Radius in world units. The room's figures stand about 1.6 units tall. */
const RADIUS = 0.022;

/** Samples along the cord. Enough that a braid reads as a braid. */
const SEGMENTS = 40;

interface ThreadLook {
  /** How far the middle of the cord drops. */
  sag: number;
  /** How far apart the two strands sit. */
  spread: number;
  /** Amplitude of the braid, in units, at `twists` turns. */
  braidAmp: number;
  /** Fraction of the middle that is missing, per strand. */
  gap: number;
  /** How far a broken end lifts and splays. */
  fray: number;
}

const LOOKS: Record<ThreadState, ThreadLook> = {
  loose: { sag: 0.14, spread: 0.03, braidAmp: 0, gap: 0, fray: 0 },
  twisted: { sag: 0.05, spread: 0, braidAmp: 0.05, gap: 0, fray: 0 },
  snapped: { sag: 0.04, spread: 0.02, braidAmp: 0, gap: 0.13, fray: 0.08 },
  slack: { sag: 0.46, spread: 0.05, braidAmp: 0, gap: 0, fray: 0 },
};

export interface ThreadBuild {
  group: Group;
  dispose: () => void;
}

/**
 * One strand's points. `strand` is +1 or -1 so the two strands braid about the
 * same path instead of sitting on top of one another.
 */
function strandPoints(
  from: Vector3,
  to: Vector3,
  look: ThreadLook,
  strand: 1 | -1,
  turns: number,
  tStart: number,
  tEnd: number,
  brokenEnd: "none" | "start" | "end",
): Vector3[] {
  const points: Vector3[] = [];
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const t = tStart + ((tEnd - tStart) * i) / SEGMENTS;
    const point = new Vector3().lerpVectors(from, to, t);
    point.y -= look.sag * Math.sin(Math.PI * t);

    if (look.braidAmp > 0) {
      // Two strands 180deg out of phase, plus a vertical component so the braid
      // is not a flat sine seen edge-on.
      const phase = t * Math.PI * 2 * turns * strand;
      point.z += Math.sin(phase) * look.braidAmp;
      point.y += Math.cos(phase) * look.braidAmp * 0.5;
    } else {
      point.z += look.spread * strand;
    }
    points.push(point);
  }

  // A broken end lifts and splays away from its partner, so the two ends read
  // as torn rather than as cut flush.
  if (brokenEnd === "end") {
    const tip = points[points.length - 1].clone();
    tip.y += look.fray;
    tip.z += look.spread * strand + look.fray * 0.5;
    points.push(tip);
  } else if (brokenEnd === "start") {
    const tip = points[0].clone();
    tip.y += look.fray;
    tip.z += look.spread * strand - look.fray * 0.5;
    points.unshift(tip);
  }

  return points;
}

/**
 * Build the thread between two hands.
 *
 * `twists` is the trust height in consecutive Held rounds; it is capped at
 * `MAX_DRAWN_TWISTS` here because the drawing caps there (design.md §4). The
 * exact count belongs to the receipt, never to the drawing.
 */
export function buildThread(options: {
  from: Vector3;
  to: Vector3;
  state: ThreadState;
  twists: number;
  you: Color;
  partner: Color;
}): ThreadBuild {
  const { from, to, state } = options;
  const look = LOOKS[state];
  const turns = Math.min(Math.max(options.twists, 0), MAX_DRAWN_TWISTS) || 1;

  const group = new Group();
  const geometries: TubeGeometry[] = [];
  const materials: MeshStandardMaterial[] = [];

  const strands: Array<{ color: Color; strand: 1 | -1 }> = [
    { color: options.you, strand: 1 },
    { color: options.partner, strand: -1 },
  ];

  for (const { color, strand } of strands) {
    const material = new MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0,
    });
    materials.push(material);

    const pieces: Array<{
      tStart: number;
      tEnd: number;
      broken: "none" | "start" | "end";
    }> =
      look.gap > 0
        ? [
            { tStart: 0, tEnd: 0.5 - look.gap, broken: "end" },
            { tStart: 0.5 + look.gap, tEnd: 1, broken: "start" },
          ]
        : [{ tStart: 0, tEnd: 1, broken: "none" }];

    for (const piece of pieces) {
      const points = strandPoints(
        from,
        to,
        look,
        strand,
        turns,
        piece.tStart,
        piece.tEnd,
        piece.broken,
      );
      const geometry = new TubeGeometry(
        new CatmullRomCurve3(points),
        SEGMENTS,
        RADIUS,
        5,
        false,
      );
      geometries.push(geometry);
      group.add(new Mesh(geometry, material));
    }
  }

  return {
    group,
    dispose: () => {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
