/**
 * ZKStepIndicator — a unified game header + step progress bar.
 *
 * Instead of a separate "Game #N" title and a disconnected step bar,
 * this component merges them into one cohesive header strip:
 *
 *   ← Lobby  |  Commit — Wait — Reveal — Resolve  |  Game #42
 *
 * Steps are words in a row on the counter: a done step is ruled through
 * and reads "done", the current step is inked and underlined and reads
 * "now". No step is carried by colour alone.
 *
 * An optional detail line sits below the bar, and an explicit "Next —"
 * line answers "what do I click now?".
 */
import React from "react";
import "../../styles/zk.css";

export type ZKStep = "commit" | "waiting" | "reveal" | "resolve";

interface ZKStepIndicatorProps {
  step: ZKStep;
  /** Optional sub-label shown under the step name */
  detail?: string;
  /** Game ID to display on the right side (optional) */
  gameId?: number;
  /** Back button handler (optional — if provided, shows ← Lobby) */
  onBack?: () => void;
  /** The concrete action the user should take now, e.g. "press Show My Hand" */
  nextAction?: string;
}

const STEPS: { key: ZKStep; label: string }[] = [
  { key: "commit", label: "Commit" },
  { key: "waiting", label: "Wait" },
  { key: "reveal", label: "Reveal" },
  { key: "resolve", label: "Resolve" },
];

export const ZKStepIndicator: React.FC<ZKStepIndicatorProps> = ({
  step,
  detail,
  gameId,
  onBack,
  nextAction,
}) => {
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="zk-steps">
      <div className="zk-steps__bar">
        {onBack && (
          <button type="button" onClick={onBack} className="zk-back">
            ← Lobby
          </button>
        )}
        {onBack && <div className="zk-steps__rule" aria-hidden="true" />}

        <ol className="zk-steps__list" aria-label="Round progress">
          {STEPS.map((s, i) => {
            const isDone = i < currentIndex;
            const isActive = i === currentIndex;
            const state = isDone
              ? "zk-step zk-step--done"
              : isActive
                ? "zk-step zk-step--active"
                : "zk-step";
            return (
              <React.Fragment key={s.key}>
                <li
                  className={state}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span className="zk-step__name">{s.label}</span>
                  <span className="zk-step__state">
                    {isDone ? "done" : isActive ? "now" : ""}
                  </span>
                </li>
                {i < STEPS.length - 1 && (
                  <li
                    className={
                      i < currentIndex
                        ? "zk-step__conn zk-step__conn--done"
                        : "zk-step__conn"
                    }
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>

        {gameId !== undefined && (
          <>
            <div className="zk-steps__rule" aria-hidden="true" />
            <span className="zk-steps__id">#{gameId}</span>
          </>
        )}
      </div>

      {detail && <p className="zk-steps__detail">{detail}</p>}

      {nextAction && (
        <p className="zk-steps__next">
          <strong>Next — </strong>
          {nextAction}
        </p>
      )}
    </div>
  );
};

/**
 * Derive the current ZK step from game status.
 */
export const deriveZKStep = (
  status: string,
  isMyCommitDone: boolean,
  bothRevealed: boolean,
): ZKStep => {
  if (
    status === "Resolved" ||
    status === "Forfeited" ||
    status === "Cancelled"
  ) {
    return "resolve";
  }
  if (bothRevealed) return "resolve";
  if (status === "BothCommitted") return "reveal";
  if (status === "AwaitingPlayer2" && isMyCommitDone) return "waiting";
  return "commit";
};
