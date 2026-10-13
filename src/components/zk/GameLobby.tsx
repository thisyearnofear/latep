import React, { useEffect, useCallback, useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { useZKDilemma, type GameListItem } from "../../hooks/useZKDilemma";
import { useGameStats, type GameRecord } from "../../hooks/useGameStats";
import { useFirstRun } from "../../hooks/useFirstRun";
import { StatsDisplay } from "./StatsDisplay";
import "../../styles/tournament.css";
import "../../styles/zk.css";

type StakeFilter = "all" | "le1" | "1to5" | "gt5";

const STAKE_FILTERS: { key: StakeFilter; label: string }[] = [
  { key: "all", label: "All stakes" },
  { key: "le1", label: "≤1 XLM" },
  { key: "1to5", label: "1-5 XLM" },
  { key: "gt5", label: "5+ XLM" },
];

/** Returns the stake in XLM as a number from stroops string. */
const stakeToXlm = (stake: string): number => {
  try {
    return Number(BigInt(stake)) / 10_000_000;
  } catch {
    return 0;
  }
};

const matchesFilter = (stake: string, filter: StakeFilter): boolean => {
  if (filter === "all") return true;
  const xlm = stakeToXlm(stake);
  if (filter === "le1") return xlm <= 1;
  if (filter === "1to5") return xlm > 1 && xlm <= 5;
  if (filter === "gt5") return xlm > 5;
  return true;
};

interface GameLobbyProps {
  onSelectGame: (gameId: number) => void;
  onCreateGame: () => void;
  onCreateMatch?: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  onSelectGame,
  onCreateGame,
  onCreateMatch,
}) => {
  const { address } = useWallet();
  const { games, isLoading, error, fetchGames, clearError } = useZKDilemma();
  const { getStats } = useGameStats();
  const { milestones } = useFirstRun();
  const [stakeFilter, setStakeFilter] = useState<StakeFilter>("all");

  // First-time users see a simplified lobby — no stats, no history, no filters
  // Once they've played their first ZK game, show the full lobby
  const isFirstTime = !milestones.first_zk_game;

  const refresh = useCallback(() => {
    clearError();
    void fetchGames();
  }, [fetchGames, clearError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openGames = games.filter(
    (g) =>
      g.status === "AwaitingPlayer2" && matchesFilter(g.stake, stakeFilter),
  );
  const myActiveGames = games.filter(
    (g) =>
      (g.player1 === address || g.status === "BothCommitted") &&
      g.status !== "Resolved" &&
      g.status !== "Forfeited",
  );

  const formatStake = (stake: string): string => {
    const stroops = BigInt(stake);
    const xlm = Number(stroops) / 10_000_000;
    return `${xlm.toFixed(2)} XLM`;
  };

  const formatDate = (timestamp: string): string => {
    const ts = Number(timestamp);
    if (ts === 0) return "N/A";
    return new Date(ts * 1000).toLocaleString();
  };

  const isMyGame = (game: GameListItem): boolean => game.player1 === address;

  return (
    <div className="zk-page">
      {/* Header */}
      <header className="zk-head">
        <div>
          <h2 className="zk-title">The lobby</h2>
          <p className="zk-lede">
            Play a sealed-move round on-chain — your move is proven without
            being shown until the reveal.
          </p>
        </div>

        <div className="zk-actions">
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="till-button"
          >
            Refresh
          </button>
          {onCreateMatch && !isFirstTime && (
            <button
              type="button"
              onClick={onCreateMatch}
              disabled={!address}
              className="till-button"
            >
              Create a match
            </button>
          )}
          <button
            type="button"
            onClick={onCreateGame}
            disabled={!address}
            className="till-button till-button--primary"
          >
            Start a round
          </button>
        </div>
      </header>

      {error && (
        <p className="zk-error" role="alert">
          {error}
        </p>
      )}

      {/* Persistent stats panel — hidden for first-time users */}
      {!isFirstTime && <StatsDisplay stats={getStats()} />}

      {/* First-time welcome */}
      {isFirstTime && address && (
        <div className="zk-panel zk-panel--centred">
          <h3 className="zk-title">Ready when you are.</h3>
          <p className="zk-lede">
            Create a round and invite a friend, or join an open one below. Your
            move is proven with a zero-knowledge proof — your opponent can't see
            it until reveal time.
          </p>
        </div>
      )}

      {/* My Active Games */}
      {myActiveGames.length > 0 && (
        <section aria-label="Your active games">
          <h3 className="zk-section-title">Your active games</h3>
          <div className="zk-list">
            {myActiveGames.map((game) => (
              <button
                key={game.id}
                type="button"
                className="zk-row zk-row--click"
                onClick={() => onSelectGame(game.id)}
              >
                <div>
                  <p className="zk-row__name">Game #{game.id}</p>
                  <p className="zk-row__sub">
                    {isMyGame(game) ? "You" : game.player1.slice(0, 8)}… vs ?
                  </p>
                </div>
                <div className="zk-row__right">
                  <p className="zk-row__stake">{formatStake(game.stake)}</p>
                  <StatusBadge status={game.status} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Open Games (available to join) */}
      <section aria-label="Open games">
        <h3 className="zk-section-title">Open rounds to join</h3>

        {/* Stake range filter pills — hidden for first-time users */}
        {!isFirstTime && (
          <div className="zk-pills" role="group" aria-label="Filter by stake">
            {STAKE_FILTERS.map((f) => {
              const active = stakeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStakeFilter(f.key)}
                  aria-pressed={active}
                  className={active ? "zk-pill zk-pill--active" : "zk-pill"}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="zk-loading">
            <p>Loading games…</p>
          </div>
        ) : openGames.length === 0 ? (
          <div className="zk-panel zk-panel--centred">
            <p className="zk-row__name">
              {stakeFilter === "all"
                ? "No open rounds right now"
                : "No open rounds in this stake range"}
            </p>
            <p className="zk-row__sub">
              {stakeFilter === "all"
                ? "Start one and someone can join you."
                : "Try a different filter, or start a new round."}
            </p>
          </div>
        ) : (
          <div className="zk-list">
            {openGames.map((game) => (
              <div key={game.id} className="zk-row">
                <div>
                  <p className="zk-row__name">Game #{game.id}</p>
                  <p className="zk-row__sub">
                    Host: {game.player1.slice(0, 8)}…{game.player1.slice(-4)}
                  </p>
                  <p className="zk-row__sub">
                    Created: {formatDate(game.created_at)}
                  </p>
                </div>
                <div className="zk-row__right">
                  <p className="zk-row__stake">{formatStake(game.stake)}</p>
                  <button
                    type="button"
                    onClick={() => onSelectGame(game.id)}
                    disabled={!address}
                    className="till-button till-button--primary zk-row__btn"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent game history — hidden for first-time users */}
      {!isFirstTime && <RecentHistory history={getStats().history} />}

      {/* How it works */}
      <p className="zk-note">
        <strong>The sealed-move flow:</strong> commit your move as a hash with a
        proof → wait for your opponent → reveal your move → the contract
        verifies it matches the commitment → the escrow settles itself.
      </p>
    </div>
  );
};

/** Status badge for game state — a word, never colour alone. */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const labels: Record<string, string> = {
    AwaitingPlayer2: "Waiting for player 2",
    BothCommitted: "Both sealed — reveal now",
    Resolved: "Resolved",
    Forfeited: "Forfeited",
  };

  return <span className="zk-status">{labels[status] ?? status}</span>;
};

/** Recent game history panel (last few resolved games). */
const RecentHistory: React.FC<{ history: GameRecord[] }> = ({ history }) => {
  if (history.length === 0) return null;

  const recent = history.slice(0, 8);

  const formatOpponent = (addr: string): string => {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  const formatTime = (ts: number): string => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const outcomeLabel: Record<GameRecord["outcome"], string> = {
    win: "Win",
    lose: "Loss",
    tie: "Tie",
  };

  return (
    <section aria-label="Recent games">
      <h3 className="zk-section-title">Recent games</h3>
      <div className="zk-list">
        {recent.map((rec) => {
          const payoutSign = rec.payout > 0 ? "+" : "";
          return (
            <div key={`${rec.gameId}-${rec.timestamp}`} className="zk-row">
              <div>
                <p className="zk-row__name">
                  vs {formatOpponent(rec.opponent)}
                </p>
                <p className="zk-row__sub">
                  You {rec.yourMove === "C" ? "leaned in" : "held back"} ·{" "}
                  {formatTime(rec.timestamp)}
                </p>
              </div>
              <div className="zk-row__right">
                <p className="zk-row__stake">{outcomeLabel[rec.outcome]}</p>
                <p className="zk-row__sub">
                  {payoutSign}
                  {rec.payout.toFixed(2)} XLM
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
