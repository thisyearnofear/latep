import { useEffect, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Howl } from "howler";
// The reveal is staged in the 3D reveal room where the device can run it, and
// in the 2D stage everywhere else. `RevealStage` makes that choice
// (design.md §12); this screen renders one stage either way.
import { RevealStage } from "./visual/RevealStage";
import type { TrustStageState } from "./visual/TrustStage";
import { RoundReceipt } from "./receipt/RoundReceipt";
import { primitiveForRound } from "./receipt/helpers";
import { MOVE_HELPER, MOVE_LABEL } from "../content/vocabulary";
import { calculatePayoff, NC_DEFAULT, type GameMove } from "../util/strategies";
import "../styles/trust-experiment.css";

type Phase = "choose" | "sealed" | "revealing" | "outcome";
type RoundState = {
  phase: Phase;
  round: number;
  move: GameMove | null;
  opponent: GameMove;
  trustAltitude: number;
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
  trustAltitude: 0,
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
        ? {
            ...state,
            phase: "outcome",
            trustAltitude:
              state.move === "C" && state.opponent === "C"
                ? state.trustAltitude + 1
                : 0,
          }
        : state;
    case "again":
      return state.phase === "outcome"
        ? {
            phase: "choose",
            round: state.round + 1,
            move: null,
            opponent: state.move ?? "C",
            trustAltitude: state.trustAltitude,
          }
        : state;
  }
}

/**
 * The result headline, in the locked vocabulary (design.md §7). The words on
 * the receipt are the canonical ones; these are just the sentence above it.
 */
/**
 * A committed move fills its tile with ink — design.md §8.
 *
 * The copy is drawn twice and the second one is clipped to the wipe, because
 * the label has to change from ink-on-stock to stock-on-ink at exactly the
 * moment the ink passes over it. One label would either vanish under the ink
 * or stay legible while the tile inverted. The duplicate is hidden from the
 * accessibility tree, so the button still reads as one word.
 *
 * The wipe is driven entirely by `aria-pressed`, which app state sets: the
 * animation never decides anything.
 */
function MoveTileLabel({ label }: { label: string }) {
  return (
    <>
      <span className="trust-btn-ink" aria-hidden="true">
        {label}
      </span>
      <span className="trust-btn-label">{label}</span>
    </>
  );
}

const RESULT_TITLE: Record<string, string> = {
  CC: "You held each other up.",
  DC: "You took it. They leaned for nothing.",
  CD: "You toppled. They took the reward.",
  DD: "Nobody leaned in.",
};

const points = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero",
  maximumFractionDigits: 0,
});

export function TrustExperiment() {
  const [state, dispatch] = useReducer(roundReducer, initialState);
  const [soundOn, setSoundOn] = useState(false);
  const outcomeRef = useRef<HTMLHeadingElement>(null);
  const cooperateRef = useRef<HTMLButtonElement>(null);
  const revealRef = useRef<HTMLButtonElement>(null);
  const soundsRef = useRef<{
    click: Howl;
    cooperate: Howl;
    lose: Howl;
  } | null>(null);
  const prevPhaseRef = useRef<Phase>("choose");

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
          : "";

  const stageState: TrustStageState =
    state.move && (state.phase === "revealing" || state.phase === "outcome")
      ? {
          phase: state.phase,
          playerMove: state.move,
          opponentMove: state.opponent,
        }
      : { phase: state.phase === "sealed" ? "sealed" : "choose" };

  useEffect(() => {
    if (state.phase !== "revealing") return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 1100;
    const timer = window.setTimeout(() => dispatch({ type: "finish" }), delay);
    return () => window.clearTimeout(timer);
  }, [state.phase]);

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
        src: ["/assets/sounds/button1.webm", "/assets/sounds/button1.mp3"],
        preload: true,
        volume: 0.18,
      }),
      cooperate: new Howl({
        src: ["/assets/sounds/coin_get.webm", "/assets/sounds/coin_get.mp3"],
        preload: true,
        volume: 0.2,
      }),
      lose: new Howl({
        src: ["/assets/sounds/thump.webm", "/assets/sounds/thump.mp3"],
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

      <RevealStage
        state={stageState}
        roundKey={state.round}
        commitmentIllustration
        announce={false}
        trustAltitude={state.trustAltitude}
      />

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
                  <MoveTileLabel label={MOVE_LABEL.C} />
                </button>
                <span className="trust-choice-note">{MOVE_HELPER.C}</span>
              </div>
              <div className="trust-choice">
                <button
                  type="button"
                  className="trust-btn trust-btn-secondary"
                  disabled={state.phase !== "choose"}
                  aria-pressed={state.move === "D"}
                  onClick={() => dispatch({ type: "choose", move: "D" })}
                >
                  <MoveTileLabel label={MOVE_LABEL.D} />
                </button>
                <span className="trust-choice-note">{MOVE_HELPER.D}</span>
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
            {state.move && payoff && (
              <RoundReceipt
                roundNumber={state.round}
                mode="practice"
                you={state.move}
                partner={state.opponent}
                pointsYou={payoff.playerPayout}
                pointsPartner={payoff.aiPayout}
                trustTwists={state.trustAltitude}
                primitiveId={primitiveForRound(state.round, "practice")}
                learnHref="/learn/play"
                feeding
              />
            )}
            <h3 ref={outcomeRef} tabIndex={-1} className="trust-result-title">
              {resultKey ? RESULT_TITLE[resultKey] : ""}
            </h3>
            {payoff && state.move && (
              <p className="trust-result-line">
                You <strong>{MOVE_LABEL[state.move]}</strong> · Partner{" "}
                <strong>{MOVE_LABEL[state.opponent]}</strong> —{" "}
                {points.format(payoff.playerPayout)} :{" "}
                {points.format(payoff.aiPayout)}
              </p>
            )}
            <details className="trust-details">
              <summary>About this partner</summary>
              <p>
                This partner starts by cooperating, then copies your previous
                choice. Try another round to see how trust changes.{" "}
                <Link to="/learn/play">Explore more strategies</Link>
              </p>
            </details>
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
