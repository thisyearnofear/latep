/**
 * RepeatSlide — Step 3: "The Repeat"
 *
 * Now the user plays 5 rounds against Tit-for-Tat.
 * The key insight: when you'll see each other again, behavior changes.
 * Shows running score and a simple round history.
 */

import React, { useState, useRef, useEffect } from "react";
import { SlideProps } from "../SlideSystem";
import { unlockAchievement } from "../ui/AchievementBadge";
import { TrustStage, type TrustStageState } from "../visual/TrustStage";
import { LessonLayout } from "../learning/LessonLayout";
import { LessonActions } from "../learning/LessonActions";
import { LessonDetails } from "../learning/LessonDetails";
import {
  MOVE_HELPER,
  MOVE_LABEL,
  getOutcome,
  type OutcomeId,
} from "../../content/vocabulary";
import "../../styles/slide-repeat.css";
import {
  createStrategy,
  calculatePayoff,
  NC_DEFAULT,
  type GameMove,
  type IteratedStrategy,
} from "../../util/strategies";

interface Round {
  num: number;
  player: GameMove;
  ai: GameMove;
  playerPayout: number;
  aiPayout: number;
}

const MAX_ROUNDS = 5;

/**
 * One plain line per outcome, keyed by the id in content/vocabulary.ts. The
 * word the user reads (`outcome.word`) always comes from the table too, so the
 * outcome is never carried by colour alone (design.md §7).
 */
const OUTCOME_NOTE: Record<OutcomeId, string> = {
  held: "You both leaned in, and the thread twists one turn tighter.",
  dropped: "You leaned in and they held back — you go over.",
  taken: "They leaned in and you held back — the reward is yours.",
  standoff: "You both held back, and nothing moves.",
};

export const RepeatSlide: React.FC<SlideProps> = ({ onNext }) => {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [playerMove, setPlayerMove] = useState<GameMove | null>(null);
  const [lastOutcome, setLastOutcome] = useState<string>("");
  const strategyRef = useRef<IteratedStrategy>(createStrategy("tft"));
  const resultRef = useRef<HTMLParagraphElement>(null);
  const cooperateRef = useRef<HTMLButtonElement>(null);
  const previousMoveRef = useRef<GameMove | null>(null);

  useEffect(() => {
    if (playerMove) resultRef.current?.focus({ preventScroll: true });
    else if (previousMoveRef.current)
      cooperateRef.current?.focus({ preventScroll: true });
    previousMoveRef.current = playerMove;
  }, [playerMove]);

  const playerTotal = rounds.reduce((sum, r) => sum + r.playerPayout, 0);
  const aiTotal = rounds.reduce((sum, r) => sum + r.aiPayout, 0);
  const trustAltitude = rounds.reduce(
    (height, r) => (r.player === "C" && r.ai === "C" ? height + 1 : 0),
    0,
  );
  const roundNum = rounds.length + 1;
  const isComplete = rounds.length >= MAX_ROUNDS;

  const playRound = (move: GameMove) => {
    if (isComplete || playerMove) return;
    const aiMove = strategyRef.current.play();
    const result = calculatePayoff(move, aiMove, 1, NC_DEFAULT);
    strategyRef.current.remember(aiMove, move);

    const round: Round = {
      num: roundNum,
      player: move,
      ai: aiMove,
      playerPayout: result.playerPayout,
      aiPayout: result.aiPayout,
    };

    setRounds([...rounds, round]);
    setPlayerMove(move);

    // Check for trust streak achievement
    const allCoop = [...rounds, round].every(
      (r) => r.player === "C" && r.ai === "C",
    );
    if (allCoop && [...rounds, round].length >= 5) {
      unlockAchievement("trust_streak_5");
    }

    const outcome = getOutcome(move, aiMove);
    setLastOutcome(`${outcome.word} — ${OUTCOME_NOTE[outcome.id]}`);
  };

  const nextRound = () => {
    setPlayerMove(null);
    setLastOutcome("");
  };

  const reset = () => {
    strategyRef.current = createStrategy("tft");
    setRounds([]);
    setPlayerMove(null);
    setLastOutcome("");
  };

  const latestRound = rounds[rounds.length - 1];
  const stageState: TrustStageState =
    playerMove && latestRound
      ? {
          phase: "outcome",
          playerMove: latestRound.player,
          opponentMove: latestRound.ai,
        }
      : { phase: "choose" };

  return (
    <LessonLayout
      title="The Repeat"
      description="Five rounds against Tit-for-Tat: it starts kind, then copies your last move."
      visual={
        <TrustStage
          compact
          state={stageState}
          opponentLabel="Tit-for-Tat"
          roundKey={rounds.length}
          trustAltitude={trustAltitude}
        />
      }
    >
      {/* Score — three printed figures on the lesson receipt */}
      <div className="lesson-scoreboard repeat-scoreboard">
        <div className="repeat-stat repeat-stat--you">
          <p className="repeat-stat-label">You</p>
          <p className="repeat-stat-value">
            {playerTotal > 0 ? "+" : ""}
            {playerTotal}
          </p>
        </div>
        <div className="repeat-stat">
          <p className="repeat-stat-label">Round</p>
          <p className="repeat-stat-value">
            {playerMove
              ? rounds.length
              : Math.min(rounds.length + 1, MAX_ROUNDS)}
            /{MAX_ROUNDS}
          </p>
        </div>
        <div className="repeat-stat repeat-stat--partner">
          <p className="repeat-stat-label">Partner</p>
          <p className="repeat-stat-value">
            {aiTotal > 0 ? "+" : ""}
            {aiTotal}
          </p>
        </div>
      </div>

      {!isComplete && !playerMove && (
        <div className="repeat-prompt-block">
          <p className="repeat-prompt">
            Does knowing you&rsquo;ll meet again change your choice?
          </p>
          <p className="repeat-help">
            <strong>{MOVE_LABEL.C}</strong> — {MOVE_HELPER.C}
          </p>
          <p className="repeat-help">
            <strong>{MOVE_LABEL.D}</strong> — {MOVE_HELPER.D}
          </p>
        </div>
      )}

      {/* Choice or outcome */}
      {playerMove && !isComplete && (
        <p
          ref={resultRef}
          tabIndex={-1}
          role="status"
          className="repeat-outcome"
        >
          {lastOutcome}
        </p>
      )}

      {isComplete && (
        <div className="repeat-result">
          <p ref={resultRef} tabIndex={-1} className="repeat-result-title">
            {playerTotal > aiTotal
              ? "You outscored Tit-for-Tat"
              : playerTotal === aiTotal
                ? "A perfect tie."
                : "Tit-for-Tat outscored you."}
          </p>
          <p className="repeat-result-note">
            {playerTotal === aiTotal && rounds.every((r) => r.player === "C")
              ? "Five rounds of mutual trust. That’s the best outcome for everyone."
              : "When you’ll meet again, holding back has consequences. Tit-for-Tat starts kind and then copies your last move — lean in, and it leans in."}
          </p>
        </div>
      )}

      {/* Round history */}
      {rounds.length > 0 && (
        <LessonDetails trigger="Round history" title="Round history">
          <ul className="repeat-history">
            {rounds.map((r) => (
              <li key={r.num} className="repeat-history-row">
                <span className="repeat-history-round">R{r.num}</span>
                <span className="repeat-history-moves">
                  {MOVE_LABEL[r.player]} · {MOVE_LABEL[r.ai]}
                  <span className="repeat-history-outcome">
                    {" — "}
                    {getOutcome(r.player, r.ai).word}
                  </span>
                </span>
                <span className="repeat-history-score">
                  {r.playerPayout > 0 ? "+" : ""}
                  {r.playerPayout} / {r.aiPayout > 0 ? "+" : ""}
                  {r.aiPayout}
                </span>
              </li>
            ))}
          </ul>
        </LessonDetails>
      )}

      <LessonDetails trigger="Why this matters" title="Why this matters">
        <p>
          Reputation is repeated play. It works — until the interaction is
          one-shot, or your history is locked inside a platform you are leaving.
        </p>
      </LessonDetails>

      {!isComplete && !playerMove && (
        <LessonActions>
          <button
            type="button"
            ref={cooperateRef}
            className="learning-button learning-button-primary"
            onClick={() => playRound("C")}
          >
            {MOVE_LABEL.C}
          </button>
          <button
            type="button"
            className="learning-button"
            onClick={() => playRound("D")}
          >
            {MOVE_LABEL.D}
          </button>
        </LessonActions>
      )}

      {playerMove && !isComplete && (
        <LessonActions>
          <button
            type="button"
            className="learning-button learning-button-primary"
            onClick={nextRound}
          >
            Next round
          </button>
        </LessonActions>
      )}

      {isComplete && (
        <LessonActions>
          <button type="button" className="learning-button" onClick={reset}>
            Play again
          </button>
          <button
            type="button"
            className="learning-button learning-button-primary"
            onClick={onNext}
          >
            Continue
          </button>
        </LessonActions>
      )}
    </LessonLayout>
  );
};
