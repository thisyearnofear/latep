/**
 * The rig's data — joint angles, geometry, and the hand anchor that `Thread`
 * hangs from.
 *
 * Split out of TrustFallCharacter.tsx so that file exports only a component,
 * and so the pose table can be read or tested without pulling in React.
 * See the lean-pose block below for the angle convention.
 */

export type CharacterState =
  | "standing"
  | "falling"
  | "caught"
  | "impact"
  | "thinking"
  | "celebrating"
  | "waiting"
  // The trust lean (design.md §7). These are the simultaneous-lean poses:
  // both players choose at the same moment, so the picture has to show both
  // leaning or both holding back — a one-way fall can't express that.
  | "leaning"
  | "held"
  | "holding-back"
  | "toppled";

export type CharacterColor =
  | "you"
  | "opponent"
  | "neutral"
  | "cooperator"
  | "defector";

/** Which surface the figure is printed on (design.md §3). */
export type CharacterSurface = "counter" | "receipt";

/** Joint angles in degrees. Arms/legs hang along +y at 0deg. */
export interface Pose {
  body: number; // torso rotation around the hips
  head: number; // head tilt around the neck
  lS: number; // left shoulder
  lE: number; // left elbow
  rS: number;
  rE: number;
  lH: number; // left hip
  lK: number; // left knee
  rH: number;
  rK: number;
}

export const POSES: Record<CharacterState, Pose> = {
  standing: {
    body: 0,
    head: 0,
    lS: -20,
    lE: -8,
    rS: 20,
    rE: 8,
    lH: -10,
    lK: 6,
    rH: 10,
    rK: -6,
  },
  waiting: {
    body: 0,
    head: 0,
    lS: -40,
    lE: -14,
    rS: 40,
    rE: 14,
    lH: -10,
    lK: 6,
    rH: 10,
    rK: -6,
  },
  thinking: {
    body: 0,
    head: 8,
    lS: -20,
    lE: -10,
    rS: 42,
    rE: -88,
    lH: -10,
    lK: 6,
    rH: 10,
    rK: -6,
  },
  falling: {
    body: 82,
    head: -18,
    lS: -150,
    lE: -25,
    rS: 150,
    rE: 25,
    lH: -28,
    lK: 40,
    rH: 12,
    rK: 30,
  },
  caught: {
    body: -6,
    head: -4,
    lS: -70,
    lE: -25,
    rS: 70,
    rE: 25,
    lH: -8,
    lK: 4,
    rH: 8,
    rK: -4,
  },
  celebrating: {
    body: 0,
    head: -4,
    lS: -150,
    lE: -8,
    rS: 150,
    rE: 8,
    lH: -16,
    lK: 8,
    rH: 16,
    rK: -8,
  },
  impact: {
    body: 88,
    head: -24,
    lS: -50,
    lE: 22,
    rS: -70,
    rE: 18,
    lH: -26,
    lK: 18,
    rH: -12,
    rK: 12,
  },
  /* --- the trust lean (design.md §7) -------------------------------------
   *
   * Angles are relative to a rig hanging along +y at 0deg, rotated about the
   * hips at (20,32). A shoulder of -90deg reaches straight forward (+x), so a
   * figure `facing="right"` leans and reaches to the right.
   *
   * These four carry the whole point of the scene: both players lean at the
   * same moment, so the figure has to be able to (a) commit to a lean before
   * the reveal, (b) meet the partner's palm, (c) stay upright and step back,
   * and (d) be on the ground once the lean went nowhere. */

  /** Committing: pitched forward from the feet, both arms reaching out. */
  leaning: {
    body: 20,
    head: 8,
    lS: -30,
    lE: -18,
    rS: -68,
    rE: -12,
    lH: -14,
    lK: 10,
    rH: 6,
    rK: -4,
  },
  /** Palms met: still leaning, but the arms come up to meet the partner. */
  held: {
    body: 14,
    head: 4,
    lS: -46,
    lE: -30,
    rS: -92,
    rE: 14,
    lH: -12,
    lK: 8,
    rH: 8,
    rK: -6,
  },
  /** Upright and a half-step back, arms kept in. The safe choice, drawn. */
  "holding-back": {
    body: -7,
    head: -3,
    lS: 26,
    lE: 34,
    rS: -16,
    rE: 42,
    lH: -4,
    lK: 14,
    rH: 16,
    rK: -22,
  },
  /** Face-down on the ground: the lean went nowhere. */
  toppled: {
    body: 92,
    head: -30,
    lS: -38,
    lE: 16,
    rS: -96,
    rE: 26,
    lH: -30,
    lK: 24,
    rH: -18,
    rK: 16,
  },
};

/**
 * Rig geometry, in viewBox units. Exported so `Thread` and the scene (B3) can
 * attach a thread to a hand instead of guessing where it landed.
 */
export const RIG = {
  /** Hips: the pivot the whole body rotates about. */
  hips: { x: 20, y: 32 },
  /** Shoulders: where both arms are rooted. */
  shoulders: { x: 20, y: 21 },
  upperArm: 6.5,
  foreArm: 6.5,
  upperLeg: 6.5,
  lowerLeg: 5.5,
} as const;

/**
 * Where a hand sits for a given pose, in viewBox coordinates — the anchor
 * `Thread` hangs from.
 *
 * The chain is shoulder angle, then elbow relative to the upper arm, so the
 * hand is the sum of the two rotated segments. `facing` mirrors x about the
 * body's centre line.
 */
export function getHandPosition(
  state: CharacterState,
  which: "left" | "right" = "right",
  facing: "left" | "right" = "right",
): { x: number; y: number } {
  const p = POSES[state];
  const shoulder = which === "left" ? p.lS : p.rS;
  const elbow = which === "left" ? p.lE : p.rE;
  const s = (shoulder * Math.PI) / 180;
  const e = ((shoulder + elbow) * Math.PI) / 180;

  // SVG rotate(θ) maps a segment hanging along +y, (0, L), to
  // (-L·sinθ, L·cosθ). The minus on x is what makes -90deg reach *forward*.
  let x =
    RIG.shoulders.x - Math.sin(s) * RIG.upperArm - Math.sin(e) * RIG.foreArm;
  const y =
    RIG.shoulders.y + Math.cos(s) * RIG.upperArm + Math.cos(e) * RIG.foreArm;

  // The whole body also rotates about the hips.
  const b = (p.body * Math.PI) / 180;
  const dx = x - RIG.hips.x;
  const dy = y - RIG.hips.y;
  x = RIG.hips.x + dx * Math.cos(b) - dy * Math.sin(b);
  const ry = RIG.hips.y + dx * Math.sin(b) + dy * Math.cos(b);

  // Mirroring happens on the wrapper element via scaleX(-1), which reflects x
  // about the body's centre line — mirror here to match, or the thread hangs
  // off the wrong side for a left-facing figure.
  const outX = facing === "left" ? RIG.hips.x - (x - RIG.hips.x) : x;

  return { x: Number(outX.toFixed(2)), y: Number(ry.toFixed(2)) };
}
