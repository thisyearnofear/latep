import React from "react";
import { useWallet } from "../../hooks/useWallet";
import type { MatchState } from "../../hooks/useZKDilemma";
import "../../styles/zk.css";

interface MatchScoreboardProps {
  match: MatchState;
  /** Called when player 1 clicks "Start Next Round". */
  onStartNextRound?: () => void;
}

/**
 * MatchScoreboard — the running match as counter facts: best-of, round number,
 * stake, wins each side, and the win tally as printed dots.
 *
 * Status is a chip with words, never colour alone; the winner line is a
 * dashed-rule banner, not a lifted panel.
 */
export const MatchScoreboard: React.FC<MatchScoreboardProps> = ({
  match,
  onStartNextRound,
}) => {
  const { address } = useWallet();

  const isPlayer1 = address === match.player1;
  const isPlayer2 = match.player2 != null && address === match.player2;

  const stakeXlm = (() => {
    try {
      return (Number(BigInt(match.stake)) / 10_000_000).toFixed(2);
    } catch {
      return "0.00";
    }
  })();

  // Win tally: one printed dot per needed win, inked once won.
  const renderWinDots = (wins: number, target: number) => (
    <div className="zk-dots" aria-label={`${wins} of ${target} wins`}>
      {Array.from({ length: target }, (_, i) => (
        <span
          key={i}
          className={i < wins ? "zk-dot zk-dot--win" : "zk-dot"}
          aria-hidden="true"
        />
      ))}
    </div>
  );

  const statusLabels: Record<string, string> = {
    AwaitingJoin: "Awaiting join",
    InProgress: "In progress",
    AwaitingNextRound: "Next round",
    Completed: "Completed",
    Cancelled: "Cancelled",
  };
  const statusLabel = statusLabels[match.status] ?? match.status;
  const chipClass =
    match.status === "Cancelled"
      ? "zk-chip zk-chip--bad"
      : match.status === "InProgress" || match.status === "AwaitingNextRound"
        ? "zk-chip zk-chip--hot"
        : "zk-chip";

  // Winner determination
  const winner =
    match.status === "Completed"
      ? match.p1_wins >= match.target_wins
        ? "p1"
        : match.p2_wins >= match.target_wins
          ? "p2"
          : null
      : null;

  const youWon =
    winner === "p1" ? isPlayer1 : winner === "p2" ? isPlayer2 : false;

  return (
    <div className="zk-panel">
      {/* Header: Best of X + status chip */}
      <div className="zk-head">
        <h3 className="zk-title">Best of {match.best_of}</h3>
        <span className={chipClass}>{statusLabel}</span>
      </div>

      {/* Round number + stake */}
      <div className="zk-row">
        <span className="zk-row__sub">
          Round <strong>{match.current_round}</strong> / {match.best_of}
        </span>
        <span className="zk-row__sub">
          Stake per round: <strong>{stakeXlm} XLM</strong>
        </span>
      </div>

      {/* Score grid: P1 wins | ties | P2 wins */}
      <div className="zk-score">
        {/* Player 1 */}
        <div className="zk-score__side">
          <p
            className={
              isPlayer1
                ? "zk-score__name zk-score__name--you"
                : "zk-score__name"
            }
          >
            Player 1{isPlayer1 ? " (you)" : ""}
          </p>
          <div className="zk-score__num">{match.p1_wins}</div>
          {renderWinDots(match.p1_wins, match.target_wins)}
        </div>

        {/* Ties */}
        <div className="zk-score__ties">
          <p className="zk-score__ties-label">Ties</p>
          <div className="zk-score__num zk-score__num--dim">{match.ties}</div>
        </div>

        {/* Player 2 */}
        <div className="zk-score__side">
          <p
            className={
              isPlayer2
                ? "zk-score__name zk-score__name--partner"
                : "zk-score__name"
            }
          >
            {match.player2
              ? `Player 2${isPlayer2 ? " (you)" : ""}`
              : "Awaiting…"}
          </p>
          <div className="zk-score__num">{match.p2_wins}</div>
          {renderWinDots(match.p2_wins, match.target_wins)}
        </div>
      </div>

      {/* Winner banner (Completed) */}
      {match.status === "Completed" && winner && (
        <div className="zk-banner tf-fade-in-up">
          <p className="zk-banner__line">
            {youWon
              ? "You won the match."
              : winner === "p1"
                ? `Player 1 won the match ${match.p1_wins}–${match.p2_wins}`
                : `Player 2 won the match ${match.p2_wins}–${match.p1_wins}`}
          </p>
        </div>
      )}

      {/* Cancelled banner */}
      {match.status === "Cancelled" && (
        <div className="zk-banner">
          <p className="zk-banner__line zk-banner__line--bad">
            This match was cancelled.
          </p>
        </div>
      )}

      {/* AwaitingNextRound prompt */}
      {match.status === "AwaitingNextRound" && (
        <div className="zk-banner">
          {isPlayer1 ? (
            <>
              <p className="zk-banner__line">
                It&apos;s your move — start the next round.
              </p>
              {onStartNextRound && (
                <button
                  type="button"
                  onClick={onStartNextRound}
                  className="till-button till-button--primary"
                >
                  Start next round
                </button>
              )}
            </>
          ) : isPlayer2 ? (
            <p className="zk-banner__line">
              Waiting for your opponent to start the next round…
            </p>
          ) : (
            <p className="zk-banner__line">
              Spectating — waiting for player 1 to start the next round.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
