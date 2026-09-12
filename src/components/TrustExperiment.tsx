import { useEffect, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { Howl } from "howler";
import { TrustFallCharacter, type CharacterState } from "./TrustFallCharacter";
import { calculatePayoff, NC_DEFAULT, type GameMove } from "../util/strategies";
import "../styles/trust-experiment.css";

type Phase = "choose" | "sealed" | "revealing" | "outcome";
type RoundState = {
  phase: Phase;
  round: number;
  move: GameMove | null;
  opponent: GameMove;
};
type RoundAction =
  | { type: "choose"; move: GameMove }
  | { type: "reveal" }
  | { type: "finish" }
  | { type: "again" };
const initialState: RoundState = {
  phase: "choose",
  round: 1,
  move: null,
  opponent: "C",
};
function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (action.type) {
    case "choose":
      return state.phase === "choose"
        ? { ...state, phase: "sealed", move: action.move }
        : state;
    case "reveal":
      return state.phase === "sealed"
        ? { ...state, phase: "revealing" }
        : state;
    case "finish":
      return state.phase === "revealing"
        ? { ...state, phase: "outcome" }
        : state;
    case "again":
      return state.phase === "outcome"
        ? {
            phase: "choose",
            round: state.round + 1,
            move: null,
            opponent: state.move ?? "C",
          }
        : state;
  }
}

const RESULT_TITLE: Record<string, string> = {
  CC: "You caught each other.",
  DC: "You stepped aside.",
  CD: "Your partner stepped aside.",
  DD: "Nobody offered a catch.",
};

const RESULT_EXPLANATION: Record<string, string> = {
  CC: "Cooperation gave both of you a reward.",
  DC: "You gained more this round. Your partner paid the price.",
  CD: "You offered trust, but your partner did not return it.",
  DD: "Neither of you gained anything.",
};

const points = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero",
  maximumFractionDigits: 0,
});

function outcomeActorState(
  own: GameMove,
  other: GameMove,
): { state: CharacterState; drop: number } {
  if (own === "C" && other === "C") return { state: "caught", drop: 20 };
  if (own === "C" && other === "D") return { state: "impact", drop: 65 };
  if (own === "D" && other === "C") return { state: "celebrating", drop: 0 };
  return { state: "standing", drop: 0 };
}

export function TrustExperiment() {
  const [state, dispatch] = useReducer(roundReducer, initialState);
  const [soundOn, setSoundOn] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const outcomeRef = useRef<HTMLHeadingElement>(null);
  const cooperateRef = useRef<HTMLButtonElement>(null);
  const revealRef = useRef<HTMLButtonElement>(null);
  const soundsRef = useRef<{
    click: Howl;
    cooperate: Howl;
    lose: Howl;
  } | null>(null);
  const prevPhaseRef = useRef<Phase>("choose");

  const revealed = state.phase === "revealing" || state.phase === "outcome";
  const resultKey =
    state.move && state.opponent ? `${state.move}${state.opponent}` : null;
  const payoff =
    state.move && state.phase === "outcome"
      ? calculatePayoff(state.move, state.opponent, 1, NC_DEFAULT)
      : null;

  const statusText =
    state.phase === "choose"
      ? "Make a choice. Your partner has already chosen."
      : state.phase === "sealed"
        ? "Both choices are sealed. Ready to reveal?"
        : state.phase === "revealing"
          ? "Opening both choices…"
          : resultKey
            ? RESULT_TITLE[resultKey]
            : "";

  const youPose =
    state.phase === "outcome" && state.move
      ? outcomeActorState(state.move, state.opponent)
      : { state: "standing" as CharacterState, drop: 0 };
  const partnerPose =
    state.phase === "outcome" && state.move
      ? outcomeActorState(state.opponent, state.move)
      : { state: "standing" as CharacterState, drop: 0 };

  useEffect(() => {
    if (state.phase !== "revealing") return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 1100;
    const timer = window.setTimeout(() => dispatch({ type: "finish" }), delay);
    return () => window.clearTimeout(timer);
  }, [state.phase]);

  useEffect(() => {
    const root = rootRef.current;
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
        if (state.phase === "choose") {
          reset();
          gsap.from(actors, { y: -8, duration: 0.35, ease: "power2.out" });
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
            .to(actors[0], { y: 45, rotation: 35, duration: 0.6 }, 0.22)
            .to(actors[1], { y: 45, rotation: -35, duration: 0.6 }, 0.22);
        } else if (state.phase === "outcome" && state.move) {
          gsap.set(actors, { clearProps: "transform" });
          const you = outcomeActorState(state.move, state.opponent);
          const partner = outcomeActorState(state.opponent, state.move);
          if (you.drop) {
            gsap.to(actors[0], {
              y: you.drop,
              duration: 0.5,
              ease: "bounce.out",
            });
          }
          if (partner.drop) {
            gsap.to(actors[1], {
              y: partner.drop,
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
  }, [state.phase, state.move, state.opponent]);

  useEffect(() => {
    if (state.phase === "outcome") {
      outcomeRef.current?.focus({ preventScroll: true });
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "sealed") {
      revealRef.current?.focus({ preventScroll: true });
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "choose" && state.round > 1) {
      cooperateRef.current?.focus({ preventScroll: true });
    }
  }, [state.phase, state.round]);

  useEffect(() => {
    if (!soundOn) {
      soundsRef.current = null;
      return;
    }
    const sounds = {
      click: new Howl({
        src: ["/assets/sounds/button1.mp3"],
        preload: true,
        volume: 0.18,
      }),
      cooperate: new Howl({
        src: ["/assets/sounds/coin_get.mp3"],
        preload: true,
        volume: 0.2,
      }),
      lose: new Howl({
        src: ["/assets/sounds/thump.mp3"],
        preload: true,
        volume: 0.15,
      }),
    };
    soundsRef.current = sounds;
    return () => {
      Object.values(sounds).forEach((h) => h.unload());
      soundsRef.current = null;
    };
  }, [soundOn]);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    const sounds = soundsRef.current;
    if (!soundOn || !sounds || prev === state.phase) return;
    try {
      if (state.phase === "sealed") {
        sounds.click.play();
      } else if (state.phase === "outcome") {
        if (state.move === "C" && state.opponent === "C") {
          sounds.cooperate.play();
        } else {
          sounds.lose.play();
        }
      }
    } catch {
      void 0;
    }
  }, [state.phase, state.move, state.opponent, soundOn]);

  return (
    <section
      className="trust-experiment"
      aria-label="Practice trust round"
      data-phase={state.phase}
      ref={rootRef}
    >
      <div className="trust-topbar">
        <span className="trust-chip">Practice round {state.round}</span>
        <span className="trust-chip">
          Local simulation · no wallet or funds
        </span>
        <button
          type="button"
          className="trust-chip trust-sound-toggle"
          aria-pressed={soundOn}
          onClick={() => setSoundOn((v) => !v)}
        >
          Sound {soundOn ? "on" : "off"}
        </button>
      </div>

      <p className="trust-status" role="status" aria-live="polite">
        {statusText}
      </p>
      <p className="trust-disclaimer">
        Illustration only — not a ZK proof or transaction.
      </p>

      <div className="trust-stage" aria-hidden="true">
        <div className="trust-scene">
          <svg
            className="trust-landscape"
            viewBox="0 0 800 340"
            preserveAspectRatio="xMidYMid meet"
          >
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
              d="M144 245 L190 312 L278 322 L336 245 Z"
            />
            <path
              className="tl-rock"
              d="M656 245 L610 312 L522 322 L464 245 Z"
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

          <div className="trust-seal trust-seal-you">
            {revealed ? (
              <span className="trust-seal-doc">
                <svg viewBox="0 0 20 24" className="trust-seal-icon">
                  <rect x="2" y="1" width="16" height="22" rx="2" />
                  <line x1="5" y1="7" x2="15" y2="7" />
                  <line x1="5" y1="11" x2="15" y2="11" />
                  <line x1="5" y1="15" x2="12" y2="15" />
                </svg>
                {state.move === "C" ? "Cooperate" : "Defect"}
              </span>
            ) : state.phase === "choose" ? (
              <span className="trust-seal-doc">
                <svg viewBox="0 0 20 24" className="trust-seal-icon">
                  <rect x="2" y="1" width="16" height="22" rx="2" />
                  <line x1="5" y1="7" x2="15" y2="7" />
                  <line x1="5" y1="11" x2="15" y2="11" />
                  <line x1="5" y1="15" x2="12" y2="15" />
                </svg>
                Choose a move
              </span>
            ) : (
              <span className="trust-seal-doc">
                <svg viewBox="0 0 20 24" className="trust-seal-icon">
                  <rect x="3" y="10" width="14" height="12" rx="2" />
                  <path d="M6 10 V7 a4 4 0 0 1 8 0 v3" />
                </svg>
                Your choice is sealed
              </span>
            )}
          </div>
          <div className="trust-seal trust-seal-partner">
            {revealed ? (
              <span className="trust-seal-doc">
                <svg viewBox="0 0 20 24" className="trust-seal-icon">
                  <rect x="2" y="1" width="16" height="22" rx="2" />
                  <line x1="5" y1="7" x2="15" y2="7" />
                  <line x1="5" y1="11" x2="15" y2="11" />
                  <line x1="5" y1="15" x2="12" y2="15" />
                </svg>
                {state.opponent === "C" ? "Cooperate" : "Defect"}
              </span>
            ) : (
              <span className="trust-seal-doc">
                <svg viewBox="0 0 20 24" className="trust-seal-icon">
                  <rect x="3" y="10" width="14" height="12" rx="2" />
                  <path d="M6 10 V7 a4 4 0 0 1 8 0 v3" />
                </svg>
                Choice sealed
              </span>
            )}
          </div>

          <div className="trust-actor trust-actor-you">
            <div className="trust-actor-inner">
              <TrustFallCharacter state={youPose.state} color="you" size="xl" />
            </div>
          </div>
          <div className="trust-actor trust-actor-partner">
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
          Practice partner
        </span>
      </div>

      <div className="trust-tray">
        {state.phase !== "outcome" ? (
          <>
            <div className="trust-choices">
              <div className="trust-choice">
                <button
                  type="button"
                  ref={cooperateRef}
                  className="trust-btn trust-btn-primary"
                  disabled={state.phase !== "choose"}
                  aria-pressed={state.move === "C"}
                  onClick={() => dispatch({ type: "choose", move: "C" })}
                >
                  Cooperate
                </button>
                <span className="trust-choice-note">Offer a catch</span>
              </div>
              <div className="trust-choice">
                <button
                  type="button"
                  className="trust-btn trust-btn-secondary"
                  disabled={state.phase !== "choose"}
                  aria-pressed={state.move === "D"}
                  onClick={() => dispatch({ type: "choose", move: "D" })}
                >
                  Defect
                </button>
                <span className="trust-choice-note">Step aside</span>
              </div>
            </div>
            {state.phase === "sealed" && (
              <button
                type="button"
                ref={revealRef}
                className="trust-btn trust-btn-primary trust-reveal"
                onClick={() => dispatch({ type: "reveal" })}
              >
                Reveal both choices
              </button>
            )}
            {state.phase === "revealing" && (
              <p className="trust-revealing" role="status">
                Opening both choices…
              </p>
            )}
          </>
        ) : (
          <div className="trust-result">
            <h3 ref={outcomeRef} tabIndex={-1} className="trust-result-title">
              {resultKey ? RESULT_TITLE[resultKey] : ""}
            </h3>
            <p className="trust-result-explanation">
              {resultKey ? RESULT_EXPLANATION[resultKey] : ""}
            </p>
            <p className="trust-result-moves">
              You chose {state.move === "C" ? "Cooperate" : "Defect"}. Your
              partner chose {state.opponent === "C" ? "Cooperate" : "Defect"}.
            </p>
            {payoff && (
              <dl className="trust-score">
                <div className="trust-score-row">
                  <dt>You</dt>
                  <dd>{points.format(payoff.playerPayout)} points</dd>
                </div>
                <div className="trust-score-row">
                  <dt>Partner</dt>
                  <dd>{points.format(payoff.aiPayout)} points</dd>
                </div>
              </dl>
            )}
            <p className="trust-result-strategy">
              This partner starts by cooperating, then copies your previous
              choice. Try another round to see how trust changes.{" "}
              <Link to="/learn/play">Explore more strategies</Link>
            </p>
            <button
              type="button"
              className="trust-btn trust-btn-primary"
              onClick={() => dispatch({ type: "again" })}
            >
              Play another round
            </button>
          </div>
        )}
      </div>

      <details className="trust-details">
        <summary>What does sealing mean?</summary>
        <p>
          Here, sealing is a local illustration. No cryptographic proof is
          generated and nothing is sent to Stellar. In ZK multiplayer, a proof
          verifies that a hidden commitment contains a valid move; it does not
          prove that someone will cooperate.
        </p>
      </details>
    </section>
  );
}
