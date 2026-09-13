import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TrustFallCharacter, type CharacterState } from "../TrustFallCharacter";
import type { GameMove } from "../../util/strategies";
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
}

function outcomeActorState(
  own: GameMove,
  other: GameMove,
): { state: CharacterState; drop: number } {
  if (own === "C" && other === "C") return { state: "caught", drop: 20 };
  if (own === "C" && other === "D") return { state: "impact", drop: 65 };
  if (own === "D" && other === "C") return { state: "celebrating", drop: 0 };
  return { state: "standing", drop: 0 };
}

function WindLines() {
  return (
    <>
      <path d="M80 105 Q200 95 320 105 T560 105 T720 100" />
      <path d="M120 115 Q240 125 360 115 T600 118 T720 112" />
      <path d="M80 125 Q220 118 340 126 T580 124 T700 128" />
    </>
  );
}

function ChoiceCard({ label, locked }: { label: string; locked: boolean }) {
  return (
    <span className="trust-seal-doc">
      {locked ? (
        <svg viewBox="0 0 20 24" className="trust-seal-icon">
          <rect x="3" y="10" width="14" height="12" rx="2" />
          <path d="M6 10 V7 a4 4 0 0 1 8 0 v3" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 24" className="trust-seal-icon">
          <rect x="2" y="1" width="16" height="22" rx="2" />
          <line x1="5" y1="7" x2="15" y2="7" />
          <line x1="5" y1="11" x2="15" y2="11" />
          <line x1="5" y1="15" x2="12" y2="15" />
        </svg>
      )}
      {label}
    </span>
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
}: TrustStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const previousAltitude = useRef(0);

  const revealed = state.phase === "revealing" || state.phase === "outcome";
  const playerMove = revealed ? state.playerMove : undefined;
  const opponentMove = revealed ? state.opponentMove : undefined;

  const altitude = Number.isFinite(trustAltitude)
    ? Math.max(0, Math.floor(trustAltitude!))
    : 0;
  const visualAltitude = Math.min(altitude, 5);
  const windRisk = Number.isFinite(noise)
    ? Math.min(0.5, Math.max(0, noise!))
    : 0;
  const playerFlipped = state.phase === "outcome" && !!noiseEvent?.player;
  const opponentFlipped = state.phase === "outcome" && !!noiseEvent?.opponent;
  const windEvent =
    state.phase === "outcome"
      ? playerFlipped && opponentFlipped
        ? "both"
        : playerFlipped
          ? "player"
          : opponentFlipped
            ? "opponent"
            : "none"
      : "none";

  const motionScale = compact ? 0.5 : 1;
  const youPose =
    state.phase === "outcome" && playerMove && opponentMove
      ? outcomeActorState(playerMove, opponentMove)
      : { state: "standing" as CharacterState, drop: 0 };
  const partnerPose =
    state.phase === "outcome" && playerMove && opponentMove
      ? outcomeActorState(opponentMove, playerMove)
      : { state: "standing" as CharacterState, drop: 0 };

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ctx = gsap.context(() => {});
    const play = () => {
      ctx.revert();
      ctx = gsap.context(() => {
        const actors = gsap.utils.toArray<HTMLElement>(".trust-actor-inner");
        const seals = gsap.utils.toArray<HTMLElement>(".trust-seal");
        const reset = () => {
          gsap.set(actors, { clearProps: "transform" });
          gsap.set(seals, { clearProps: "transform" });
        };
        if (media.matches) {
          reset();
          return;
        }
        if (state.phase === "choose" || state.phase === "idle") {
          reset();
          gsap.from(actors, {
            y: -8 * motionScale,
            duration: 0.35,
            ease: "power2.out",
          });
        } else if (state.phase === "sealed") {
          gsap.set(actors, { clearProps: "transform" });
          gsap.fromTo(
            seals,
            { scale: 0.94 },
            { scale: 1, duration: 0.24, ease: "power2.out" },
          );
        } else if (state.phase === "revealing") {
          const tl = gsap.timeline();
          tl.to(actors[0], { rotation: 12, duration: 0.22 }, 0)
            .to(actors[1], { rotation: -12, duration: 0.22 }, 0)
            .to(
              actors[0],
              { y: 45 * motionScale, rotation: 35, duration: 0.6 },
              0.22,
            )
            .to(
              actors[1],
              { y: 45 * motionScale, rotation: -35, duration: 0.6 },
              0.22,
            );
        } else if (state.phase === "outcome" && playerMove && opponentMove) {
          gsap.set(actors, { clearProps: "transform" });
          const you = outcomeActorState(playerMove, opponentMove);
          const partner = outcomeActorState(opponentMove, playerMove);
          if (you.drop) {
            gsap.to(actors[0], {
              y: you.drop * motionScale,
              duration: 0.5,
              ease: "bounce.out",
            });
          }
          if (partner.drop) {
            gsap.to(actors[1], {
              y: partner.drop * motionScale,
              duration: 0.5,
              ease: "bounce.out",
            });
          }
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
  }, [state.phase, playerMove, opponentMove, roundKey, motionScale]);

  useEffect(() => {
    const root = stageRef.current;
    const from = previousAltitude.current;
    previousAltitude.current = visualAltitude;
    if (!root || from === visualAltitude) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".trust-terrain-motion",
          { y: (from - visualAltitude) * 6 },
          { y: 0, duration: 0.45, ease: "power2.out" },
        );
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [visualAltitude]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root || (!playerFlipped && !opponentFlipped)) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.fromTo(
          ".trust-gust",
          { opacity: 0.6, x: -16 },
          { opacity: 0.35, x: 16, duration: 0.35, ease: "power2.out" },
        ).to(".trust-gust", {
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

  return (
    <div
      className={`trust-stage-surface${compact ? " trust-stage-compact" : ""}`}
      data-stage-phase={state.phase}
      data-trust-height={trustAltitude !== undefined ? altitude : undefined}
      data-wind-event={windEvent}
      ref={stageRef}
    >
      <div className="trust-stage" aria-hidden="true">
        <div className="trust-scene">
          <svg
            className="trust-landscape"
            viewBox="0 0 800 340"
            preserveAspectRatio="xMidYMid meet"
          >
            <g
              className="trust-terrain"
              transform={`translate(0 ${visualAltitude * 6})`}
            >
              <g className="trust-terrain-motion">
                <path
                  className="tl-hill tl-hill-far"
                  d="M-40 245 Q140 85 340 230 T840 160"
                />
                <path
                  className="tl-contour"
                  d="M-40 232 Q140 72 340 217 T840 147"
                />
                <path
                  className="tl-contour"
                  d="M-40 258 Q140 98 340 243 T840 173"
                />
                <path
                  className="tl-hill tl-hill-near"
                  d="M-40 290 Q210 120 460 265 T840 210"
                />
                <path
                  className="tl-contour"
                  d="M-40 277 Q210 107 460 252 T840 197"
                />
                <path
                  className="tl-contour"
                  d="M-40 303 Q210 133 460 278 T840 223"
                />
              </g>
            </g>
            {trustAltitude !== undefined && (
              <g className="trust-height-gauge">
                <line x1="32" y1="240" x2="32" y2="140" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <line
                    key={i}
                    className={
                      i <= visualAltitude
                        ? "trust-height-tick trust-height-tick-lit"
                        : "trust-height-tick"
                    }
                    x1="24"
                    y1={240 - i * 20}
                    x2="40"
                    y2={240 - i * 20}
                  />
                ))}
              </g>
            )}
            <g className="trust-wind" opacity={windRisk > 0 ? 0.12 : 0}>
              <WindLines />
            </g>
            <g className="trust-gust" opacity={0}>
              <WindLines />
            </g>
            <g className="tl-stars">
              <circle cx="90" cy="60" r="1.6" />
              <circle cx="200" cy="38" r="1.2" />
              <circle cx="330" cy="70" r="1.4" />
              <circle cx="470" cy="45" r="1.2" />
              <circle cx="620" cy="66" r="1.6" />
              <circle cx="730" cy="40" r="1.2" />
              <circle cx="520" cy="100" r="1.1" />
              <circle cx="150" cy="120" r="1.1" />
            </g>
            <path
              className="tl-rock"
              d={`M144 245 L190 ${312 + visualAltitude * 6} L278 ${322 + visualAltitude * 6} L336 245 Z`}
            />
            <path
              className="tl-rock"
              d={`M656 245 L610 ${312 + visualAltitude * 6} L522 ${322 + visualAltitude * 6} L464 245 Z`}
            />
            <ellipse
              className="tl-platform"
              cx="240"
              cy="245"
              rx="96"
              ry="15"
            />
            <ellipse
              className="tl-platform"
              cx="560"
              cy="245"
              rx="96"
              ry="15"
            />
          </svg>

          {showChoices && (
            <>
              <div className="trust-seal trust-seal-you">
                {revealed ? (
                  <ChoiceCard
                    label={playerMove === "C" ? "Cooperate" : "Defect"}
                    locked={false}
                  />
                ) : state.phase === "choose" || state.phase === "idle" ? (
                  <ChoiceCard label="Choose a move" locked={false} />
                ) : (
                  <ChoiceCard
                    label="Your choice is sealed"
                    locked={commitmentIllustration}
                  />
                )}
              </div>
              <div className="trust-seal trust-seal-partner">
                {revealed ? (
                  <ChoiceCard
                    label={opponentMove === "C" ? "Cooperate" : "Defect"}
                    locked={false}
                  />
                ) : (
                  <ChoiceCard
                    label={
                      commitmentIllustration ? "Choice sealed" : "Choice hidden"
                    }
                    locked={commitmentIllustration}
                  />
                )}
              </div>
            </>
          )}

          <div
            className="trust-actor trust-actor-you"
            data-wind-affected={
              state.phase === "outcome" && playerFlipped ? true : undefined
            }
          >
            <div className="trust-actor-inner">
              <TrustFallCharacter state={youPose.state} color="you" size="xl" />
            </div>
          </div>
          <div
            className="trust-actor trust-actor-partner"
            data-wind-affected={
              state.phase === "outcome" && opponentFlipped ? true : undefined
            }
          >
            <div className="trust-actor-inner">
              <TrustFallCharacter
                state={partnerPose.state}
                color="opponent"
                size="xl"
              />
            </div>
          </div>
        </div>
        <span className="trust-actor-label trust-actor-label-you">You</span>
        <span className="trust-actor-label trust-actor-label-partner">
          {opponentLabel}
        </span>
      </div>
      {announce && (
        <p className="trust-stage-caption" role="status" aria-live="polite">
          {revealed
            ? `Played moves — You: ${playerMove === "C" ? "Cooperate" : "Defect"}; ${opponentLabel}: ${opponentMove === "C" ? "Cooperate" : "Defect"}.`
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
              {altitude > 5 &&
                " Visual height capped at 5; the streak continues."}
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
