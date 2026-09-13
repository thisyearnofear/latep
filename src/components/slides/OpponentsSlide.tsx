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
  createStrategy,
  calculatePayoff,
  getStrategyInfo,
  ALL_STRATEGY_IDS,
  NC_DEFAULT,
  type GameMove,
  type StrategyId,
  type IteratedStrategy,
} from "../../util/strategies";

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

    if (move === "C" && aiMove === "C") setLastResult("🤝 Mutual trust");
    else if (move === "C" && aiMove === "D")
      setLastResult("💥 They stepped aside");
    else if (move === "D" && aiMove === "C")
      setLastResult("🏆 You exploited them");
    else setLastResult("💀 Mutual destruction");
  };

  const matchComplete = matchRound >= 3;

  return (
    <LessonLayout
      title="Meet the Opponents"
      description={
        selected
          ? `Round ${matchRound || 1}/3 against ${getStrategyInfo(selected).name}`
          : "Pick a strategy for a three-round match."
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
        <>
          <div className="narrative-strategies">
            {ALL_STRATEGY_IDS.map((id) => {
              const info = getStrategyInfo(id);
              return (
                <StrategyCard
                  key={id}
                  id={id}
                  name={info.name}
                  description={info.description}
                  emoji={info.emoji}
                  color={info.color}
                  compact
                  onClick={() => startMatch(id)}
                />
              );
            })}
          </div>

          {/* The reveal — shown when browsing strategies */}
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
        </>
      )}

      {/* Match view */}
      {selected && (
        <>
          <div
            className="lesson-scoreboard"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "24px",
              minWidth: 0,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-muted)",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                You
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-2xl)",
                  color: "var(--accent-violet)",
                  margin: 0,
                }}
              >
                {playerScore > 0 ? "+" : ""}
                {playerScore}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Round {matchRound || 1}/3
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {getStrategyInfo(selected).emoji}{" "}
                {getStrategyInfo(selected).name}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-muted)",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Them
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-2xl)",
                  color: "var(--accent-warm)",
                  margin: 0,
                }}
              >
                {aiScore > 0 ? "+" : ""}
                {aiScore}
              </p>
            </div>
          </div>

          {lastResult && !matchComplete && (
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                color: "var(--text-secondary)",
              }}
            >
              {lastResult}
            </p>
          )}

          {!matchComplete && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--text-muted)",
              }}
            >
              Choose your next move
            </p>
          )}

          {matchComplete && (
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                color:
                  playerScore > aiScore
                    ? "var(--accent-cooperate)"
                    : playerScore === aiScore
                      ? "var(--text-primary)"
                      : "var(--accent-defect)",
              }}
            >
              {playerScore > aiScore
                ? "You won this match."
                : playerScore === aiScore
                  ? "A tie."
                  : `${getStrategyInfo(selected).name} won this match.`}
            </p>
          )}

          {/* Strategy description */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            <strong style={{ color: "var(--text-primary)" }}>
              {getStrategyInfo(selected).name}:
            </strong>{" "}
            {getStrategyInfo(selected).description}
          </p>
        </>
      )}

      {selected && !matchComplete && (
        <LessonActions>
          <button
            type="button"
            className="learning-button learning-button-primary"
            onClick={() => playMove("C")}
          >
            Cooperate
          </button>
          <button
            type="button"
            className="learning-button"
            onClick={() => playMove("D")}
          >
            Defect
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
