/**
 * The reveal room — design.md §12.
 *
 * The stage, for the length of one reveal, becomes a lit paper table. Two
 * figures stand on it, each holding a sealed card. The commit ink lands on both
 * cards together, the figures settle into the pose the round earned them, and
 * the thread drops between their hands — twisted, slack, or snapped.
 *
 * Three rules shape everything here:
 *
 * 1. **Same props as the 2D stage.** It renders only in `revealing`/`outcome`,
 *    so it can never show a card that was not sealed, and it never computes an
 *    outcome of its own.
 * 2. **The lettering stays in the DOM.** The stamp and the outcome word are
 *    printed markup beside the canvas, not pixels in it, so the outcome is
 *    readable, selectable and announced exactly as it is on the 2D stage. The
 *    canvas is `aria-hidden`.
 * 3. **GSAP drives every value.** No shader reads a clock, so the room can be
 *    paused and every run looks the same.
 *
 * The 2D stage is not a lesser sibling: it is what renders on a phone that
 * fails the capability probe, under reduced motion, and on any browser without
 * WebGL. See `RevealStage`.
 */

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import {
  AmbientLight,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { POSES } from "../trustFallRig";
import { posesFor } from "../visual/outcomePoses";
import { Stamp } from "../receipt";
import {
  drawnTwists,
  getOutcome,
  MAX_DRAWN_TWISTS,
  MOVE_LABEL,
  STAMPS,
} from "../../content/vocabulary";
import type { TrustStageProps } from "../visual/TrustStage";
import { buildFigure, lerpPose } from "./figure";
import { buildThread } from "./thread";
import {
  cardFragment,
  cardVertex,
  paperFragment,
  paperVertex,
} from "./shaders";
import { tokenColor, tokenVec3 } from "./tokens";
import "./reveal-room.css";

/**
 * Where the two figures stand. At this separation the `held` pose leaves the
 * two hands about a tenth of a unit apart, so the braid has something real to
 * join instead of floating in the gap.
 */
const FIGURE_X = 0.62;

/** What the camera must keep in frame, in world units. */
const FRAME = { width: 2.9, height: 1.9 };

/**
 * Where the camera looks, and how far above the horizon it points.
 *
 * The pitch is the whole reason the frame is paper. From a shallow angle the
 * horizon — the highest point a flat sheet reaches, no matter how large it is —
 * falls inside the shot, and everything above it is empty: the table's far edge
 * with nothing behind it, and two figures in dark ink silhouetted against it.
 * Past the camera's own half-angle (15deg) the horizon is off the top of the
 * frame and every pixel is stock. The distance sets the crop; the pitch keeps
 * the composition.
 */
const LOOK_AT = new Vector3(0, 0.62, 0);
const PITCH = (19 * Math.PI) / 180;

/** How far the sheet runs past what the camera can see, in world units. */
const PAPER_MARGIN = 4;

/** Extra width, as a multiple of the widest visible line. */
const PAPER_SIDE_MARGIN = 1.5;

/** Grain cells per world unit. */
const GRAIN_PER_UNIT = 40;

function setGroupOpacity(group: Group, value: number): void {
  group.traverse((child) => {
    if (
      child instanceof Mesh &&
      child.material instanceof MeshStandardMaterial
    ) {
      child.material.transparent = true;
      child.material.opacity = value;
    }
  });
}

export function RevealRoom({
  state,
  opponentLabel = "Practice partner",
  roundKey = 0,
  announce = true,
  trustAltitude,
  compact = false,
  onRevealComplete,
}: TrustStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);

  const revealed = state.phase === "revealing" || state.phase === "outcome";
  const playerMove = revealed ? state.playerMove : undefined;
  const opponentMove = revealed ? state.opponentMove : undefined;

  const altitude = Number.isFinite(trustAltitude)
    ? Math.max(0, Math.floor(trustAltitude ?? 0))
    : 0;

  // The reveal is frozen when it starts, so the scene is keyed to the round and
  // not to the phase. `roundKey` is in the dependencies so a second round with
  // the same move pair still rebuilds.
  const reveal = useMemo(() => {
    if (!playerMove || !opponentMove) return null;
    return {
      round: roundKey,
      outcome: getOutcome(playerMove, opponentMove),
      poses: posesFor("revealing", playerMove, opponentMove),
    };
  }, [roundKey, playerMove, opponentMove]);

  /**
   * The state the reveal is frozen in: the trust height, and whether that height
   * already includes this round.
   *
   * App state records a round's height when it flips to `outcome`, a beat after
   * the reveal begins, and rebuilding the scene then would restart the animation
   * under the reader. The scene effect therefore reads these once, at mount —
   * which is why they are refs and not dependencies. Declared before that effect
   * so they hold the mount-time values by the time it runs.
   */
  const mountState = useRef({
    altitude,
    settled: state.phase === "outcome",
  });
  useEffect(() => {
    mountState.current = { altitude, settled: state.phase === "outcome" };
  }, [altitude, state.phase]);

  // Latest-callback ref: a new closure from the parent must not rebuild the
  // scene mid-reveal.
  const onRevealCompleteRef = useRef(onRevealComplete);
  onRevealCompleteRef.current = onRevealComplete;

  useEffect(() => {
    const host = hostRef.current;
    const plate = plateRef.current;
    if (!host || !plate || !reveal) return;

    const { outcome, poses } = reveal;
    // This round's braid height, from the same rule the 2D stage uses: the room
    // mounts as the reveal starts, one beat before app state records the round,
    // so the thread is drawn at the height the round is about to earn.
    const twists = drawnTwists(
      outcome.thread,
      mountState.current.altitude,
      mountState.current.settled,
    );
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /* --- renderer ------------------------------------------------------- */

    const renderer = new WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // Cleared to stock, not to the counter: whatever the camera fails to cover
    // should still be paper. The room's world is a sheet of it.
    renderer.setClearColor(tokenColor("--color-receipt"), 1);
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(30, 1, 0.1, 60);
    const disposables: Array<{ dispose: () => void }> = [];

    scene.add(new AmbientLight(tokenColor("--color-receipt"), 0.78));
    const lamp = new DirectionalLight(tokenColor("--color-receipt-2"), 1.5);
    lamp.position.set(1.4, 3.2, 2.2);
    scene.add(lamp);

    /* --- the table ------------------------------------------------------- */

    // A table sized to the figures would put its far edge inside the shot, and
    // everything above that edge is empty space — which silhouettes two dark
    // figures against a dark void. The sheet is instead sized to the frame on
    // every resize (see `fitPaper`), so the figures are on paper wherever the
    // camera looks, exactly as the 2D stage prints them.
    const paperGeometry = new PlaneGeometry(1, 1);
    // Held directly rather than reached through `material.uniforms`: the
    // uniforms map is indexed by string and comes back untyped.
    const grainUv = new Vector2(1, 1);
    const paperMaterial = new ShaderMaterial({
      vertexShader: paperVertex,
      fragmentShader: paperFragment,
      uniforms: {
        uPaper: { value: tokenVec3("--color-receipt") },
        uGrainUv: { value: grainUv },
      },
    });
    disposables.push(paperGeometry, paperMaterial);
    const table = new Mesh(paperGeometry, paperMaterial);
    table.rotation.x = -Math.PI / 2;
    scene.add(table);

    /* --- the two sealed cards -------------------------------------------- */

    const cardGeometry = new PlaneGeometry(0.62, 0.86);
    disposables.push(cardGeometry);

    const cardMaterial = (ink: Vector3, seed: number) => {
      const material = new ShaderMaterial({
        vertexShader: cardVertex,
        fragmentShader: cardFragment,
        // A card lies flat, and the partner's is mirrored to ink outwards.
        side: DoubleSide,
        uniforms: {
          uPencil: { value: tokenVec3("--color-receipt-faded") },
          uInk: { value: ink },
          uProgress: { value: 0 },
          uInkAmount: { value: 1 },
          uSeed: { value: seed },
        },
      });
      disposables.push(material);
      return material;
    };

    // Colour means "decided" (design.md §1): the ink on a card is that
    // player's colour, the same blue and amber as their end of the thread.
    const youCard = cardMaterial(tokenVec3("--color-you-print"), 3.1);
    const partnerCard = cardMaterial(tokenVec3("--color-partner-print"), 7.4);

    const placeCard = (
      material: ShaderMaterial,
      x: number,
      mirrored: boolean,
    ) => {
      const card = new Mesh(cardGeometry, material);
      card.rotation.set(-Math.PI / 2, 0, 0);
      card.position.set(x, 0.004, 0.42);
      card.scale.x = mirrored ? -1 : 1;
      scene.add(card);
    };
    placeCard(youCard, -FIGURE_X, false);
    placeCard(partnerCard, FIGURE_X, true);

    /* --- the two figures -------------------------------------------------- */

    const youFigure = buildFigure("right", tokenColor("--color-you-print"));
    youFigure.group.position.x = -FIGURE_X;
    scene.add(youFigure.group);

    const partnerFigure = buildFigure(
      "left",
      tokenColor("--color-partner-print"),
    );
    partnerFigure.group.position.x = FIGURE_X;
    scene.add(partnerFigure.group);

    const startPose = POSES.standing;
    const applySettled = (t: number) => {
      youFigure.setPose(lerpPose(startPose, POSES[poses.you], t));
      partnerFigure.setPose(lerpPose(startPose, POSES[poses.partner], t));
    };
    applySettled(0);

    /* --- the thread ------------------------------------------------------- */

    // One thread, in the outcome state, anchored to where the hands end up. The
    // rope is the payoff, so it arrives last.
    applySettled(1);
    const thread = buildThread({
      from: youFigure.handWorld(),
      to: partnerFigure.handWorld(),
      state: outcome.thread,
      twists,
      you: tokenColor("--color-you"),
      partner: tokenColor("--color-partner"),
    });
    scene.add(thread.group);
    const threadFade = { opacity: reduced ? 1 : 0 };
    setGroupOpacity(thread.group, threadFade.opacity);
    applySettled(0);

    /* --- framing and the loop --------------------------------------------- */

    const view = { distance: 4 };
    const dolly = { extra: 0.45 };

    /**
     * Cut the sheet to the frame. The two edges that matter are the ones the
     * camera can see: the near edge (below the frame, so the shot is not sitting
     * on a table with a floor beyond it) and the far edge (beyond the faintest
     * ground ray, so the shot is never above the paper). Both are computed from
     * the same camera geometry that frames the figures.
     */
    const fitPaper = () => {
      const halfFov = (camera.fov * Math.PI) / 360;
      const eye = LOOK_AT.y + view.distance * Math.tan(PITCH);
      // Angle below horizontal of the frame's top ray. Kept off zero: if the
      // pitch ever drops under the half-angle the horizon comes back into the
      // frame, and the sheet simply has to run a long way instead.
      const topAngle = Math.max(PITCH - halfFov, (0.5 * Math.PI) / 180);
      const far = view.distance - eye / Math.tan(topAngle);
      const near = view.distance - eye / Math.tan(PITCH + halfFov);
      // The width has to cover the frame's TOP edge, which is the widest thing
      // the camera sees: a rectangle of fixed width loses the top corners of
      // the shot, because the frame gets wider the further it looks.
      const farRadius = eye / Math.sin(topAngle);
      const halfWidth =
        Math.tan(halfFov) * camera.aspect * farRadius * Math.cos(halfFov);

      const depth = near - far + PAPER_MARGIN * 2;
      const width = halfWidth * 2 * PAPER_SIDE_MARGIN;
      table.scale.set(width, depth, 1);
      table.position.z = (near + far) / 2;
      // Cells per world unit, so the grain stays the same size on screen no
      // matter how far the sheet has been extended.
      grainUv.set(width * GRAIN_PER_UNIT, depth * GRAIN_PER_UNIT);
    };

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Keep the whole scene in frame at any aspect: portrait pushes the camera
      // back rather than cropping the figures.
      const halfFov = Math.tan((camera.fov * Math.PI) / 360);
      view.distance = Math.max(
        FRAME.height / 2 / halfFov,
        FRAME.width / 2 / (halfFov * Math.max(camera.aspect, 0.35)),
      );
      camera.updateProjectionMatrix();
      fitPaper();
    };
    resize();

    let frame = 0;
    const render = () => {
      frame = window.requestAnimationFrame(render);
      if (document.hidden) return;
      const distance = view.distance + dolly.extra;
      camera.position.set(0, LOOK_AT.y + distance * Math.tan(PITCH), distance);
      camera.lookAt(LOOK_AT);
      renderer.render(scene, camera);
    };
    frame = window.requestAnimationFrame(render);

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    /* --- the reveal -------------------------------------------------------- */

    let timeline: gsap.core.Timeline | null = null;

    if (reduced) {
      // The room is gated off under reduced motion, so this path only runs when
      // a reviewer forces it with `?room=on`. It must still show the end state
      // without a transition (design.md §8).
      youCard.uniforms.uProgress.value = 1;
      partnerCard.uniforms.uProgress.value = 1;
      dolly.extra = 0;
      onRevealCompleteRef.current?.();
    } else {
      const tween = { t: 0 };
      gsap.set(plate, { opacity: 0 });
      timeline = gsap.timeline({
        onComplete: () => onRevealCompleteRef.current?.(),
      });
      timeline
        // The commit lands on both cards together (design.md §8).
        .to(
          youCard.uniforms.uProgress,
          { value: 1, duration: 0.55, ease: "power1.inOut" },
          0.05,
        )
        .to(
          partnerCard.uniforms.uProgress,
          { value: 1, duration: 0.55, ease: "power1.inOut" },
          0.12,
        )
        // The figures settle into the pose the round earned them.
        .to(
          tween,
          {
            t: 1,
            duration: 0.6,
            ease: "power2.out",
            onUpdate: () => applySettled(tween.t),
          },
          0.2,
        )
        .to(dolly, { extra: 0, duration: 0.6, ease: "power2.out" }, 0.2)
        // The rope drops into their hands as they finish settling.
        .to(
          threadFade,
          {
            opacity: 1,
            duration: 0.2,
            ease: "power2.out",
            onUpdate: () => setGroupOpacity(thread.group, threadFade.opacity),
          },
          0.6,
        )
        // No bounce: the stamp is pressed, not dropped. 0.8 + 0.15 = 0.95s,
        // which is the same beat the 2D stage finishes on.
        .fromTo(
          plate,
          { opacity: 0, scale: 1.25, rotation: -9 },
          { opacity: 1, scale: 1, rotation: -4, duration: 0.15, ease: "none" },
          0.8,
        );
    }

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      timeline?.kill();
      gsap.killTweensOf(plate);
      youFigure.dispose();
      partnerFigure.dispose();
      thread.dispose();
      for (const disposable of disposables) disposable.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [reveal]);

  if (!reveal || !playerMove || !opponentMove) return null;

  const { outcome } = reveal;
  const altitudeText =
    trustAltitude !== undefined ? (
      <div className="trust-environment" aria-live="polite">
        <span>
          Trust height: {altitude} mutual-cooperation round
          {altitude === 1 ? "" : "s"} in a row.
          {altitude > MAX_DRAWN_TWISTS &&
            ` Drawing caps at ${MAX_DRAWN_TWISTS}; the streak continues.`}
        </span>
      </div>
    ) : null;

  return (
    <div
      className={`trust-stage-surface reveal-room${compact ? " trust-stage-compact" : ""}`}
      data-stage-phase={state.phase}
      data-trust-height={trustAltitude !== undefined ? altitude : undefined}
      data-thread-state={outcome.thread}
      data-room="on"
      data-room-round={reveal.round}
    >
      <div className="reveal-room-scene">
        <div className="reveal-room-canvas" ref={hostRef} aria-hidden="true" />

        <span className="reveal-room-label reveal-room-label-you">You</span>
        <span className="reveal-room-label reveal-room-label-partner">
          {opponentLabel}
        </span>

        <div className="reveal-room-plate" ref={plateRef}>
          <Stamp text={STAMPS[outcome.id]} />
          <span className="reveal-room-word">{outcome.word}</span>
        </div>
      </div>

      {announce && (
        <p className="trust-stage-caption" role="status" aria-live="polite">
          Played — You: {MOVE_LABEL[playerMove]}; {opponentLabel}:{" "}
          {MOVE_LABEL[opponentMove]}. {outcome.word}.
        </p>
      )}

      {altitudeText}
    </div>
  );
}

export default RevealRoom;
