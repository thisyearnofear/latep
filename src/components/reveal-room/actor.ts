/**
 * A generated character for the reveal room.
 *
 * The procedural `buildFigure` rig is the fallback; this wraps a Meshy GLB
 * whose clips were generated to match the room's pose language (design.md
 * §13.5): `held`, `holding-back`, `toppled`, `standing`. One GLB per
 * character carries all four clips, merged offline by
 * `tools/meshy-lab/merge-clips.mjs` — there is no runtime generation call.
 *
 * Like `Figure`, an `Actor` is added to the scene and driven per frame. The
 * difference is that posing is a clip, not joint angles: `play` starts the
 * clip for a state and the mixer advances it. Each clip is a complete 3s
 * motion from standing to the pose, so the reveal plays it once at a raised
 * time scale and clamps on the end pose — the pose the thread anchors to.
 */

import {
  AnimationAction,
  AnimationMixer,
  Box3,
  Bone,
  Group,
  LoopOnce,
  LoopRepeat,
  Vector3,
  type Object3DEventMap,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CharacterState } from "../trustFallRig";

/** World units tall a standing figure should be — same as `figure.ts`. */
const TARGET_HEIGHT = 1.6;

/** The pose language the clips were generated for. Anything else idles. */
const CLIP: Record<string, string> = {
  held: "held",
  "holding-back": "holding-back",
  toppled: "toppled",
  standing: "standing",
};

export interface Actor {
  group: Group;
  /**
   * Play the clip for a pose state. `seconds` is how long the motion should
   * take on screen (the clip is 3s); the standing idle loops instead.
   */
  play: (state: CharacterState, seconds?: number) => void;
  /** Pose the skeleton at a clip's end, for measuring the thread anchor. */
  holdEnd: (state: CharacterState) => void;
  /** Back to the looping idle. */
  idle: () => void;
  /** World position of the hand nearest `towardX`, for the thread anchor. */
  handWorld: (towardX: number) => Vector3;
  update: (dt: number) => void;
  dispose: () => void;
}

/**
 * Load and normalize one character. Returns null on any failure — the caller
 * falls back to the procedural figure, so a missing asset degrades the room
 * to its previous look rather than breaking the reveal.
 */
export async function loadActor(
  url: string,
  facing: "left" | "right",
): Promise<Actor | null> {
  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync(url);
  } catch {
    return null;
  }

  const model = gltf.scene;
  const mixer = new AnimationMixer(model);
  const clips = new Map(
    gltf.animations.map((clip) => [clip.name, mixer.clipAction(clip)]),
  );

  // Normalise once, from the bind pose: stand ~1.6 units tall, feet on the
  // stock, centred on the figure's mark. The clips' root motion then does the
  // leaning and falling inside that envelope.
  const bounds = new Box3().setFromObject(model);
  const size = bounds.getSize(new Vector3());
  const scale = TARGET_HEIGHT / Math.max(size.y, 0.0001);
  model.scale.setScalar(scale);
  const scaled = new Box3().setFromObject(model);
  model.position.set(
    -(scaled.min.x + scaled.max.x) / 2,
    -scaled.min.y,
    -(scaled.min.z + scaled.max.z) / 2,
  );

  // The models face +Z; the room needs "you" facing +X and the partner -X.
  const group = new Group();
  group.rotation.y = facing === "right" ? Math.PI / 2 : -Math.PI / 2;
  group.add(model);

  const hands: Bone<Object3DEventMap>[] = [];
  model.traverse((o) => {
    if (
      o instanceof Bone &&
      (o.name === "LeftHand" || o.name === "RightHand")
    ) {
      hands.push(o as Bone<Object3DEventMap>);
    }
  });

  const clipName = (state: CharacterState) => CLIP[state] ?? "standing";
  const playClip = (name: string, seconds?: number): AnimationAction | null => {
    const action = clips.get(name);
    if (!action) return null;
    const loop = name === "standing";
    mixer.stopAllAction();
    action.reset();
    action.setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
    action.timeScale =
      loop || !seconds ? 1 : action.getClip().duration / seconds;
    action.play();
    return action;
  };

  // Idle until the reveal assigns a pose.
  playClip("standing");

  return {
    group,
    play: (state, seconds) => {
      playClip(clipName(state), seconds);
    },
    holdEnd: (state) => {
      const action = playClip(clipName(state));
      if (!action) return;
      action.time = action.getClip().duration;
      mixer.update(0);
    },
    idle: () => {
      playClip("standing");
    },
    handWorld: (towardX) => {
      group.updateMatrixWorld(true);
      const v = new Vector3();
      let best: Vector3 | null = null;
      let bestDist = Infinity;
      for (const bone of hands) {
        bone.getWorldPosition(v);
        const dist = Math.abs(v.x - towardX);
        if (dist < bestDist) {
          bestDist = dist;
          best = v.clone();
        }
      }
      return best ?? new Vector3();
    },
    update: (dt) => mixer.update(dt),
    dispose: () => {
      mixer.stopAllAction();
      model.traverse((o) => {
        const mesh = o as {
          isBone?: boolean;
          geometry?: { dispose(): void };
          material?: { dispose(): void } | { dispose(): void }[];
        };
        if (mesh.isBone) return;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
    },
  };
}
