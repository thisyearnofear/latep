import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TrustFallCharacter } from "../TrustFallCharacter";
import { posesFor } from "./outcomePoses";
import { Receipt, ReceiptStub, Stamp } from "../receipt";
import { Thread } from "../receipt/Thread";
import type { GameMove } from "../../util/strategies";
import {
  drawnTwists,
  getOutcome,
  MOVE_LABEL,
  MAX_DRAWN_TWISTS,
  STAMPS,
  type ThreadState,
} from "../../content/vocabulary";
import "../../styles/trust-experiment.css";

export type TrustStageState =
  | {
      phase: "idle" | "choose" | "sealed";
      playerMove?: never;
      opponentMove?: never;
    }
  | {
      phase: "revealing" | "outcome";
      playerMove: GameMove;
      opponentMove: GameMove;
    };

export interface TrustStageProps {
  state: TrustStageState;
  opponentLabel?: string;
  roundKey?: string | number;
  commitmentIllustration?: boolean;
  announce?: boolean;
  trustAltitude?: number;
  noise?: number;
  noiseEvent?: { player: boolean; opponent: boolean };
  showChoices?: boolean;
  compact?: boolean;
  /**
   * Fires once the reveal choreography has finished, so the round receipt can
   * feed out at the right moment. Presentation timing only: nothing about
   * validity, confirmation, or settlement may depend on it (design.md §7).
   */
  onRevealComplete?: () => void;
}

/* The pose table lives in ./outcomePoses.ts so the reveal room can pose the
 * same rig in three dimensions without keeping a second copy (see the notes
 * there for the design.md §7 table). */

/** The stub each figure holds before the reveal. Never carries a move value. */
function SealedStub({
  side,
  label,
}: {
  side: "you" | "partner";
  label: string;
}) {
  return (
    <div className={`trust-seal trust-seal-stub trust-seal-stub-${side}`}>
      <ReceiptStub>
        <Stamp text={STAMPS.sealed} />
        <span className="trust-seal-caption">{label}</span>
      </ReceiptStub>
    </div>
  );
}

export function TrustStage({
  state,
  opponentLabel = "Practice partner",
  roundKey = 0,
  commitmentIllustration = false,
  announce = true,
  trustAltitude,
  noise,
  noiseEvent,
  showChoices = true,
  compact = false,
  onRevealComplete,
}: TrustStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const previousAltitude = useRef(0);
  const revealFired = useRef<string | number | null>(null);

  const revealed = state.phase === "revealing" || state.phase === "outcome";

  /**
   * The phase as far as the choreography is concerned. `outcome` is the same
   * beat as `revealing`: app state merely finishes recording the round a moment
   * after the reveal (TrustExperiment flips the phase 1100ms in, against a
   * 950ms sequence). Keying the animation effect on the raw phase replayed the
   * whole tear/pose/thread/stamp sequence at that moment, under the reader.
   */
  const choreography = state.phase === "outcome" ? "revealing" : state.phase;

  const playerMove = revealed ? state.playerMove : undefined;
  const opponentMove = revealed ? state.opponentMove : undefined;

  const altitude = Number.isFinite(trustAltitude)
    ? Math.max(0, Math.floor(trustAltitude!))
    : 0;
  const visualAltitude = Math.min(altitude, MAX_DRAWN_TWISTS);
  const windRisk = Number.isFinite(noise)
    ? Math.min(0.5, Math.max(0, noise!))
    : 0;
  const playerFlipped = state.phase === "outcome" && !!noiseEvent?.player;
  const opponentFlipped = state.phase === "outcome" && !!noiseEvent?.opponent;

  const poses = posesFor(state.phase, playerMove, opponentMove);

  /**
   * The thread. Before the reveal it is always loose — the scene cannot hint
   * at the outcome through the thread any more than it can through markup.
   */
  const threadState: ThreadState = revealed
    ? getOutcome(playerMove!, opponentMove!).thread
    : "loose";
  // The braid's height comes from the shared rule (content/vocabulary.ts), so
  // the 2D stage and the reveal room cannot disagree about how far the thread
  // has been twisted. During the reveal it draws the height this round is about
  // to earn — and then does not move when app state records it a beat later.
  const threadTwists = drawnTwists(
    threadState,
    altitude,
    state.phase === "outcome",
  );

  // --- Reveal choreography: stubs tear, poses and thread, then the stamp. ---
  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ctx = gsap.context(() => {}, root);

    const play = () => {
      ctx.revert();
      ctx = gsap.context(() => {
        const actors = gsap.utils.toArray<HTMLElement>(".trust-actor-inner");
        const stubs = gsap.utils.toArray<HTMLElement>(".trust-seal-stub");
        const thread = gsap.utils.toArray<HTMLElement>(".trust-thread");

        const reset = () => {
          gsap.set(actors, { clearProps: "transform" });
          gsap.set(stubs, { clearProps: "transform,opacity" });
          gsap.set(thread, { clearProps: "opacity,transform" });
        };

        if (media.matches) {
          // Reduced motion: jump straight to the final state. The flow still
          // works, it just doesn't move (design.md §8).
          reset();
          gsap.set(stubs, { display: "none" });
          return;
        }

        if (choreography === "choose" || choreography === "idle") {
          reset();
          gsap.from(actors, {
            y: -6 * (compact ? 0.5 : 1),
            duration: 0.3,
            ease: "power2.out",
          });
        } else if (choreography === "sealed") {
          reset();
          gsap.from(stubs, {
            scale: 0.94,
            opacity: 0,
            duration: 0.24,
            ease: "power2.out",
          });
        } else if (choreography === "revealing") {
          // The one orchestrated moment. Durations match design.md §8's
          // sequence: tear 200ms, poses + thread 600ms, stamp 150ms.
          const tl = gsap.timeline();
          tl.to(stubs, {
            y: 10,
            opacity: 0,
            rotation: compact ? 6 : 10,
            duration: 0.2,
            ease: "power1.in",
          })
            .fromTo(
              thread,
              { opacity: 0, scaleX: 0.9 },
              { opacity: 1, scaleX: 1, duration: 0.6, ease: "power2.out" },
              0.2,
            )
            .fromTo(
              actors,
              { y: compact ? -4 : -8 },
              { y: 0, duration: 0.6, ease: "power2.out" },
              0.2,
            )
            // The stamp the reveal prints. This selector used to read
            // ".trust-scene-stamp", which matches nothing in the markup — the
            // element is the `.trust-seal-revealed` stub above — so the one
            // press in the sequence was never animated.
            .fromTo(
              ".trust-seal-revealed",
              { opacity: 0, scale: 1.25, rotation: -9 },
              {
                opacity: 1,
                scale: 1,
                rotation: -4,
                duration: 0.15,
                ease: "none", // no bounce (design.md §8)
              },
              0.8,
            );
        }
      }, root);
    };

    play();
    const onChange = () => play();
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      ctx.revert();
    };
  }, [choreography, playerMove, opponentMove, roundKey, compact]);

  /**
   * Tell the caller the reveal has landed. Fires once per round, and never
   * sooner than the choreography — but it carries no authority: a receipt fed
   * by this callback still only prints what app state confirms.
   */
  useEffect(() => {
    if (!onRevealComplete) return;
    if (state.phase !== "revealing") return;
    if (revealFired.current === roundKey) return;
    revealFired.current = roundKey;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const delay = reduced ? 0 : 950;
    const t = window.setTimeout(onRevealComplete, delay);
    return () => window.clearTimeout(t);
  }, [state.phase, roundKey, onRevealComplete]);

  // Trust height still lifts the ground a little; the drawing caps at 5.
  useEffect(() => {
    const root = stageRef.current;
    const from = previousAltitude.current;
    previousAltitude.current = visualAltitude;
    if (!root || from === visualAltitude) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".trust-ground-motion",
          { y: (from - visualAltitude) * 5 },
          { y: 0, duration: 0.45, ease: "power2.out" },
        );
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [visualAltitude]);

  // Wind: only a recorded flip shows a gust (never the configured risk).
  useEffect(() => {
    const root = stageRef.current;
    if (!root || (!playerFlipped && !opponentFlipped)) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap
          .timeline()
          .fromTo(
            ".trust-gust",
            { opacity: 0.6, x: -14 },
            { opacity: 0.3, x: 14, duration: 0.35, ease: "power2.out" },
          )
          .to(".trust-gust", {
            opacity: 0,
            x: 0,
            duration: 0.25,
            ease: "power2.out",
          });
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [roundKey, playerFlipped, opponentFlipped]);

  const outcomeWord = revealed
    ? getOutcome(playerMove!, opponentMove!).word
    : null;
  const outcomeStamp = revealed
    ? STAMPS[getOutcome(playerMove!, opponentMove!).id as keyof typeof STAMPS]
    : null;

  return (
    <div
      className={`trust-stage-surface${compact ? " trust-stage-compact" : ""}`}
      data-stage-phase={state.phase}
      data-trust-height={trustAltitude !== undefined ? altitude : undefined}
      data-thread-state={threadState}
      ref={stageRef}
    >
      <div className="trust-stage">
        {/*
          A wide receipt carries the scene (design.md §2). One containment
          layer: the actors, stubs and thread are content inside it, never
          panels inside a panel.
        */}
        <Receipt
          wide
          className={`trust-scene${compact ? " trust-scene-compact" : ""}`}
        >
          {/* The printed ground the two figures stand on. */}
          <svg
            className="trust-ground"
            viewBox="0 0 800 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g className="trust-ground-motion">
              <line
                className="trust-ground-line"
                x1="40"
                y1="150"
                x2="760"
                y2="150"
              />
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const x = 120 + i * 112;
                const h = 6 + visualAltitude * 2;
                return (
                  <line
                    key={i}
                    className="trust-ground-tick"
                    x1={x}
                    y1={150}
                    x2={x}
                    y2={150 - h}
                  />
                );
              })}
            </g>
            <g className="trust-gust" opacity={0}>
              <path d="M40 108 Q220 98 400 108 T760 102" />
              <path d="M40 120 Q260 130 440 118 T760 124" />
            </g>
          </svg>

          {/* Two figures facing each other across the gap. */}
          <div className="trust-actor trust-actor-you">
            <div className="trust-actor-inner">
              <TrustFallCharacter
                state={poses.you}
                color="you"
                size={compact ? "lg" : "2xl"}
                facing="right"
              />
            </div>
          </div>

          <div className="trust-actor trust-actor-partner">
            <div className="trust-actor-inner">
              <TrustFallCharacter
                state={poses.partner}
                color="opponent"
                size={compact ? "lg" : "2xl"}
                facing="left"
              />
            </div>
          </div>

          {/* Labels are anchored to the scene, not to the figure: a label
              inside the actor box moves with the actor and ends up wherever
              the pose puts it. */}
          <span className="trust-actor-label trust-actor-label-you">You</span>
          <span className="trust-actor-label trust-actor-label-partner">
            {opponentLabel}
          </span>

          {/* The thread between their hands. Loose until the reveal. */}
          <div className="trust-thread">
            <Thread
              state={threadState}
              twists={threadTwists}
              surface="receipt"
              width={400}
              height={compact ? 34 : 46}
            />
          </div>

          {showChoices && (
            <>
              {revealed ? (
                <div className="trust-seal trust-seal-revealed">
                  <Stamp text={outcomeStamp!} />
                  <span className="trust-seal-caption">{outcomeWord}</span>
                </div>
              ) : (
                <>
                  <SealedStub
                    side="you"
                    label={
                      state.phase === "choose" || state.phase === "idle"
                        ? "Choose a move"
                        : commitmentIllustration
                          ? "Your seal"
                          : "Your choice is sealed"
                    }
                  />
                  <SealedStub
                    side="partner"
                    label={
                      commitmentIllustration
                        ? "Their seal"
                        : "Their choice is sealed"
                    }
                  />
                </>
              )}
            </>
          )}
        </Receipt>
      </div>

      {announce && (
        <p className="trust-stage-caption" role="status" aria-live="polite">
          {revealed
            ? `Played — You: ${MOVE_LABEL[playerMove!]}; ${opponentLabel}: ${MOVE_LABEL[opponentMove!]}. ${outcomeWord}.`
            : state.phase === "sealed"
              ? "Both choices are sealed in this local illustration."
              : state.phase === "idle"
                ? "A trust experiment: two people, one shared outcome."
                : "Choose a move. Your opponent’s move stays hidden until the round is played."}
        </p>
      )}
      {(trustAltitude !== undefined || noise !== undefined) && (
        <div className="trust-environment" aria-live="polite">
          {trustAltitude !== undefined && (
            <span>
              Trust height: {altitude} mutual-cooperation round
              {altitude === 1 ? "" : "s"} in a row.
              {altitude > MAX_DRAWN_TWISTS &&
                ` Drawing caps at ${MAX_DRAWN_TWISTS}; the streak continues.`}
            </span>
          )}
          {noise !== undefined && (
            <span>
              Configured wind risk: {Math.round(windRisk * 100)}% per move.
            </span>
          )}
          {playerFlipped && opponentFlipped && (
            <span>Wind changed both moves.</span>
          )}
          {playerFlipped && !opponentFlipped && (
            <span>Wind changed your move.</span>
          )}
          {opponentFlipped && !playerFlipped && (
            <span>Wind changed your opponent’s move.</span>
          )}
        </div>
      )}
    </div>
  );
}
