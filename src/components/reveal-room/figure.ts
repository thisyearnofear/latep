/**
 * The 2D rig, given depth.
 *
 * `TrustFallCharacter` is the product's one figure, and its geometry lives in
 * `trustFallRig.ts` as joint angles. The room does not draw a new character: it
 * walks the same joints and turns each limb into a tapered tube, so a lean in
 * the room is the lean the receipt already draws. The silhouette matches
 * because the numbers are shared, not copied.
 *
 * Poses interpolate, the same way the 2D figure's CSS transitions blend
 * between poses rather than snapping. That is why this is a small machine with
 * a `setPose` instead of a function that builds one fixed shape: the reveal
 * walks the figure from where it stood to where it ended up, and a lean that
 * teleports reads as a bug.
 *
 * One honest difference: the rig is flat. Both arms root at the same point, as
 * do both legs, and in 2D they simply overlap. Here they are given a few
 * thousandths of a unit of depth so limbs do not z-fight. Nothing moves in x or
 * y to accommodate it.
 */

import {
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { POSES, RIG, type Pose } from "../trustFallRig";

/** World units per rig unit. A standing figure ends up about 1.6 units tall. */
export const RIG_SCALE = 0.039;

/** Head + neck, straight from the SVG: neck at (20,15), head at (20,9) r=6. */
const NECK = { x: 20, y: 15 };
const HEAD = { x: 20, y: 9 };
const HEAD_RADIUS = 6;

/** Radii in rig units, tuned to the SVG's 1.6–2 stroke weight. */
const RADIUS = {
  torso: 1.9,
  upperArm: 1.0,
  foreArm: 0.85,
  upperLeg: 1.05,
  lowerLeg: 0.9,
};

/** Limb depth separations, so the flat rig's overlapping limbs stay readable. */
const DEPTH = {
  leftArm: -0.035,
  rightArm: 0.035,
  leftLeg: -0.05,
  rightLeg: 0.05,
};

// Shared across every figure: the room mounts once per round, and rebuilding
// geometry for each of two figures is waste on a phone.
const LIMB_GEO = new CylinderGeometry(1, 1, 1, 8);
const HEAD_GEO = new SphereGeometry(1, 14, 10);

const UP = new Vector3(0, 1, 0);

export interface RigPoint {
  x: number;
  y: number;
}

interface LimbSpec {
  /** The joint that roots the limb. */
  root: keyof Pose;
  /** The joint that hinges the lower segment, relative to the upper. */
  joint: keyof Pose;
}

const ARMS: readonly (LimbSpec & { depth: number })[] = [
  { root: "lS", joint: "lE", depth: DEPTH.leftArm },
  { root: "rS", joint: "rE", depth: DEPTH.rightArm },
];

const LEGS: readonly (LimbSpec & { depth: number })[] = [
  { root: "lH", joint: "lK", depth: DEPTH.leftLeg },
  { root: "rH", joint: "rK", depth: DEPTH.rightLeg },
];

/** A rig point rotated about an arbitrary pivot, the way SVG `rotate()` does. */
function rotateAbout(
  point: RigPoint,
  pivot: RigPoint,
  degrees: number,
): RigPoint {
  const radians = (degrees * Math.PI) / 180;
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: pivot.y + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}

/** Rig space (y grows downward) to world space (y grows upward, hips at 0). */
function rigToWorld(point: RigPoint, z = 0): Vector3 {
  return new Vector3(
    (point.x - RIG.hips.x) * RIG_SCALE,
    (RIG.hips.y - point.y) * RIG_SCALE,
    z,
  );
}

/** The far end of a limb that hangs along +y at 0deg. */
function limbEnd(root: RigPoint, degrees: number, length: number): RigPoint {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: root.x - Math.sin(radians) * length,
    y: root.y + Math.cos(radians) * length,
  };
}

/** Point a tube between two world points. */
function layoutSegment(
  mesh: Mesh,
  from: Vector3,
  to: Vector3,
  radius: number,
): void {
  const direction = new Vector3().subVectors(to, from);
  const length = direction.length();
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  if (length < 0.0001) {
    mesh.quaternion.identity();
    mesh.scale.set(radius, 0.0001, radius);
    return;
  }
  mesh.quaternion.copy(
    new Quaternion().setFromUnitVectors(UP, direction.divideScalar(length)),
  );
  mesh.scale.set(radius, length, radius);
}

/** Blend two poses, joint by joint. Linear is enough over 0.6s. */
export function lerpPose(from: Pose, to: Pose, t: number): Pose {
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    body: mix(from.body, to.body),
    head: mix(from.head, to.head),
    lS: mix(from.lS, to.lS),
    lE: mix(from.lE, to.lE),
    rS: mix(from.rS, to.rS),
    rE: mix(from.rE, to.rE),
    lH: mix(from.lH, to.lH),
    lK: mix(from.lK, to.lK),
    rH: mix(from.rH, to.rH),
    rK: mix(from.rK, to.rK),
  };
}

/**
 * The lowest y a capped tube between `from` and `to` reaches. Exact rather than
 * approximate: a tube's underside is one radius below its axis, but only in
 * proportion to how far the axis is from vertical, and getting that wrong by a
 * radius is the difference between a foot on the table and a foot floating over
 * it. Cheap enough to run on every frame of the reveal.
 */
function lowestOf(from: Vector3, to: Vector3, radius: number): number {
  const length = from.distanceTo(to);
  const tilt =
    length < 0.0001 ? 1 : Math.sqrt(1 - ((to.y - from.y) / length) ** 2);
  return Math.min(from.y, to.y) - radius * tilt;
}

export interface Figure {
  /**
   * Add this to the scene. Its own y puts the figure's feet on the table, so a
   * caller sets x and z and leaves y alone.
   */
  group: Group;
  /** Re-pose the figure. Also re-seats it on the table. */
  setPose: (pose: Pose) => void;
  /** The reaching hand in the scene, valid for the pose currently applied. */
  handWorld: () => Vector3;
  dispose: () => void;
}

/**
 * Build one figure.
 *
 * `facing: "left"` mirrors the whole group with `scale.x = -1` — the same
 * mechanism the DOM uses (`TrustFallCharacter` mirrors its wrapper), so the two
 * cannot drift apart.
 */
export function buildFigure(facing: "left" | "right", color: Color): Figure {
  const group = new Group();
  if (facing === "left") group.scale.x = -1;

  const material = new MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0,
  });

  // Each entry repositions one mesh for a pose and reports the lowest point of
  // what it placed, so the figure can be re-seated on the table in the same
  // pass. Kept as closures so the figure is described once and re-evaluated
  // cheaply on every frame of the reveal.
  const updates: Array<(pose: Pose) => number> = [];

  /** Rig points for a pose, as world points about the hips. */
  const placer =
    (pose: Pose) =>
    (point: RigPoint, z = 0) =>
      rigToWorld(rotateAbout(point, RIG.hips, pose.body), z);

  /** The hand for a pose: `getHandPosition`'s chain, over a raw pose. */
  const handForPose = (pose: Pose): RigPoint => {
    const shoulder = pose.rS;
    const elbow = limbEnd(RIG.shoulders, shoulder, RIG.upperArm);
    const hand = limbEnd(elbow, shoulder + pose.rE, RIG.foreArm);
    return rotateAbout(hand, RIG.hips, pose.body);
  };

  const add = () => {
    const mesh = new Mesh(LIMB_GEO, material);
    group.add(mesh);
    return mesh;
  };

  // Torso.
  {
    const mesh = add();
    updates.push((pose) => {
      const place = placer(pose);
      const shoulders = place(RIG.shoulders);
      const hips = place(RIG.hips);
      const radius = RADIUS.torso * RIG_SCALE;
      layoutSegment(mesh, shoulders, hips, radius);
      return lowestOf(shoulders, hips, radius);
    });
  }

  // Head, tilting at the neck.
  {
    const mesh = new Mesh(HEAD_GEO, material);
    group.add(mesh);
    const radius = HEAD_RADIUS * RIG_SCALE;
    mesh.scale.setScalar(radius);
    updates.push((pose) => {
      const place = placer(pose);
      mesh.position.copy(place(rotateAbout(HEAD, NECK, pose.head)));
      return mesh.position.y - radius;
    });
  }

  // Arms and legs: an upper segment and a lower one, hinged partway.
  const limbs: ReadonlyArray<LimbSpec & { depth: number; leg: boolean }> = [
    ...ARMS.map((arm) => ({ ...arm, leg: false })),
    ...LEGS.map((leg) => ({ ...leg, leg: true })),
  ];
  for (const limb of limbs) {
    const upper = add();
    const lower = add();
    const upperRadius =
      (limb.leg ? RADIUS.upperLeg : RADIUS.upperArm) * RIG_SCALE;
    const lowerRadius =
      (limb.leg ? RADIUS.lowerLeg : RADIUS.foreArm) * RIG_SCALE;
    const upperLength = limb.leg ? RIG.upperLeg : RIG.upperArm;
    const lowerLength = limb.leg ? RIG.lowerLeg : RIG.foreArm;
    const root = RIG.hips;

    updates.push((pose) => {
      const place = placer(pose);
      const angle = pose[limb.root];
      const joint = limbEnd(root, angle, upperLength);
      const end = limbEnd(joint, angle + pose[limb.joint], lowerLength);
      const upperFrom = place(root, limb.depth);
      const upperTo = place(joint, limb.depth);
      const lowerTo = place(end, limb.depth);
      layoutSegment(upper, upperFrom, upperTo, upperRadius);
      layoutSegment(lower, upperTo, lowerTo, lowerRadius);
      return Math.min(
        lowestOf(upperFrom, upperTo, upperRadius),
        lowestOf(upperTo, lowerTo, lowerRadius),
      );
    });
  }

  let current: Pose = POSES.standing;

  const setPose = (pose: Pose) => {
    current = pose;
    let lowest = Number.POSITIVE_INFINITY;
    for (const update of updates) lowest = Math.min(lowest, update(pose));
    // Re-seat the figure: a lean or a topple changes which point touches the
    // table, and a figure that floats or sinks reads as a bug, not a pose.
    group.position.y = Number.isFinite(lowest) ? -lowest : 0;
  };

  setPose(POSES.standing);

  return {
    group,
    setPose,
    handWorld: () => {
      group.updateMatrixWorld(true);
      const local = rigToWorld(handForPose(current), DEPTH.rightArm);
      return local.applyMatrix4(group.matrixWorld);
    },
    dispose: () => {
      material.dispose();
    },
  };
}
