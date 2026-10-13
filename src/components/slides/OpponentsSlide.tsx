/**
 * OpponentsSlide — Step 4: "The Opponents"
 *
 * Meet all 9 strategies with personality cards.
 * User can select one and play a quick 3-round match.
 * The key reveal: Tit-for-Tat is the best — simple, nice, provocable, forgiving, clear.
 */

import React, { useState, useRef } from "react";
import { SlideProps } from "../SlideSystem";
import StrategyCard from "../visual/StrategyCard";
import { TrustStage } from "../visual/TrustStage";
import { LessonLayout } from "../learning/LessonLayout";
import { LessonActions } from "../learning/LessonActions";
import { LessonDetails } from "../learning/LessonDetails";
import {
  MOVE_HELPER,
  MOVE_LABEL,
  getOutcome,
  type OutcomeId,
} from "../../content/vocabulary";
import "../../styles/slide-opponents.css";
import {
  createStrategy,
  calculatePayoff,
  getStrategyInfo,
  ALL_STRATEGY_IDS,
  NC_DEFAULT,
  type GameMove,
  type StrategyId,
  type IteratedStrategy,
} from "../../util/strategies";

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

export const OpponentsSlide: React.FC<SlideProps> = ({ onNext }) => {
  const [selected, setSelected] = useState<StrategyId | null>(null);
  const [matchRound, setMatchRound] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [lastResult, setLastResult] = useState<string>("");
  const [lastMoves, setLastMoves] = useState<{
    player: GameMove;
    opponent: GameMove;
  } | null>(null);
  const [trustAltitude, setTrustAltitude] = useState(0);
  const strategyRef = useRef<IteratedStrategy | null>(null);

  const startMatch = (id: StrategyId) => {
    setSelected(id);
    strategyRef.current = createStrategy(id);
    setMatchRound(0);
    setPlayerScore(0);
    setAiScore(0);
    setLastResult("");
    setLastMoves(null);
    setTrustAltitude(0);
  };

  const playMove = (move: GameMove) => {
    if (!strategyRef.current || matchRound >= 3) return;
    const aiMove = strategyRef.current.play();
    const result = calculatePayoff(move, aiMove, 1, NC_DEFAULT);
    strategyRef.current.remember(aiMove, move);

    const newPlayer = playerScore + result.playerPayout;
    const newAi = aiScore + result.aiPayout;
    setPlayerScore(newPlayer);
    setAiScore(newAi);
    setMatchRound(matchRound + 1);
    setLastMoves({ player: move, opponent: aiMove });
    setTrustAltitude((h) => (move === "C" && aiMove === "C" ? h + 1 : 0));

    const outcome = getOutcome(move, aiMove);
    setLastResult(`${outcome.word} — ${OUTCOME_NOTE[outcome.id]}`);
  };

  const matchComplete = matchRound >= 3;

  return (
    <LessonLayout
      title="Meet the Opponents"
      description={
        selected
          ? `Round ${matchRound || 1}/3 against ${getStrategyInfo(selected).name}`
          : "Pick a strategy for a three-round match — each one is a different policy for trusting strangers."
      }
      visual={
        selected ? (
          <TrustStage
            compact
            state={
              lastMoves
                ? {
                    phase: "outcome",
                    playerMove: lastMoves.player,
                    opponentMove: lastMoves.opponent,
                  }
                : { phase: "choose" }
            }
            opponentLabel={getStrategyInfo(selected).name}
            roundKey={matchRound}
            trustAltitude={trustAltitude}
          />
        ) : undefined
      }
    >
      {/* Strategy grid */}
      {!selected && (
        <div className="narrative-strategies">
          {ALL_STRATEGY_IDS.map((id) => {
            const info = getStrategyInfo(id);
            return (
              <StrategyCard
                key={id}
                id={id}
                name={info.name}
                description={info.description}
                pattern={info.pattern}
                tint={info.tint}
                compact
                onClick={() => startMatch(id)}
              />
            );
          })}
        </div>
      )}

      {/* Match view */}
      {selected && (
        <>
          <div className="lesson-scoreboard opponents-scoreboard">
            <div className="opponents-stat opponents-stat--you">
              <p className="opponents-stat-label">You</p>
              <p className="opponents-stat-value">
                {playerScore > 0 ? "+" : ""}
                {playerScore}
              </p>
            </div>
            <div className="opponents-stat">
              <p className="opponents-stat-label">Round {matchRound || 1}/3</p>
              <p className="opponents-stat-value opponents-stat-name">
                {getStrategyInfo(selected).name}
              </p>
            </div>
            <div className="opponents-stat opponents-stat--partner">
              <p className="opponents-stat-label">Them</p>
              <p className="opponents-stat-value">
                {aiScore > 0 ? "+" : ""}
                {aiScore}
              </p>
            </div>
          </div>

          {lastResult && !matchComplete && (
            <p tabIndex={-1} role="status" className="opponents-outcome">
              {lastResult}
            </p>
          )}

          {!matchComplete && (
            <div className="opponents-prompt-block">
              <p className="opponents-prompt">Choose your next move</p>
              <p className="opponents-help">
                <strong>{MOVE_LABEL.C}</strong> — {MOVE_HELPER.C}
              </p>
              <p className="opponents-help">
                <strong>{MOVE_LABEL.D}</strong> — {MOVE_HELPER.D}
              </p>
            </div>
          )}

          {matchComplete && (
            <p tabIndex={-1} role="status" className="opponents-verdict">
              {playerScore > aiScore
                ? "You won this match."
                : playerScore === aiScore
                  ? "A tie."
                  : `${getStrategyInfo(selected).name} won this match.`}
            </p>
          )}

          {/* Strategy description */}
          <p className="opponents-note">
            <strong>{getStrategyInfo(selected).name}:</strong>{" "}
            {getStrategyInfo(selected).description}
          </p>
        </>
      )}

      {/* The reveal + why it matters — paired at the end of the copy */}
      <div className="lesson-detail-row">
        {!selected && (
          <LessonDetails
            trigger="About these strategies"
            title="Strategy guide"
          >
            <p>
              <strong>A strategy to start with: Tit-for-Tat.</strong> It starts
              by cooperating, then mirrors your last move. Its performance
              depends on the other strategies, the payoffs, and the noise level.
            </p>
          </LessonDetails>
        )}
        <LessonDetails trigger="Why this matters" title="Why this matters">
          <p>
            Strategies are policies. Markets, protocols, and agents all run
            policies — some forgiving, some exploitative. Choosing who you play
            with is choosing which rules govern your trust.
          </p>
        </LessonDetails>
      </div>

      {selected && !matchComplete && (
        <LessonActions>
          <button
            type="button"
            className="learning-button learning-button-primary"
            onClick={() => playMove("C")}
          >
            {MOVE_LABEL.C}
          </button>
          <button
            type="button"
            className="learning-button"
            onClick={() => playMove("D")}
          >
            {MOVE_LABEL.D}
          </button>
        </LessonActions>
      )}

      {selected && matchComplete && (
        <LessonActions>
          <button
            type="button"
            className="learning-button"
            onClick={() => setSelected(null)}
          >
            Try another
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
