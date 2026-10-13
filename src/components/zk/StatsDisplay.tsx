/**
 * StatsDisplay — counter panel of persistent Latep stats.
 *
 * Renders above the game list in the lobby. Shows total games, W/L/T record,
 * net XLM, and cooperation rate. Falls back to a one-line nudge when no games
 * have been played yet.
 */

import React from "react";
import { useGameStats, type GameStats } from "../../hooks/useGameStats";
import "../../styles/zk.css";

interface StatsDisplayProps {
  /** Optional override (e.g. for testing). Defaults to live localStorage. */
  stats?: GameStats;
}

const formatXLM = (xlm: number): string => {
  const sign = xlm > 0 ? "+" : xlm < 0 ? "" : "";
  return `${sign}${xlm.toFixed(2)} XLM`;
};

const StatTile: React.FC<{
  label: string;
  value: string;
  tone?: "up" | "down";
}> = ({ label, value, tone }) => (
  <div className="zk-stat">
    <div
      className={
        tone === "up"
          ? "zk-stat__num zk-stat__num--up"
          : tone === "down"
            ? "zk-stat__num zk-stat__num--down"
            : "zk-stat__num"
      }
    >
      {value}
    </div>
    <div className="zk-stat__label">{label}</div>
  </div>
);

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
  const { getStats } = useGameStats();
  const live = getStats();
  const s = stats ?? live;

  if (s.totalGames === 0) {
    return (
      <div className="zk-panel zk-panel--centred">
        <p className="zk-section-title">Your stats will appear here</p>
        <p className="zk-status-line">
          Play your first Trustfall to start tracking your wins, losses, and
          lean-in rate.
        </p>
      </div>
    );
  }

  const xlmTone =
    s.totalXlmWon > 0 ? "up" : s.totalXlmWon < 0 ? "down" : undefined;

  return (
    <div className="zk-panel">
      <div className="zk-head">
        <h3 className="zk-title">Your record</h3>
        <p className="zk-row__sub">
          {s.totalGames} game{s.totalGames === 1 ? "" : "s"} played
        </p>
      </div>

      <div className="zk-stats">
        <StatTile label="Total" value={String(s.totalGames)} />
        <StatTile
          label="W / L / T"
          value={`${s.wins} / ${s.losses} / ${s.ties}`}
        />
        <StatTile
          label="Net XLM"
          value={formatXLM(s.totalXlmWon)}
          tone={xlmTone}
        />
        <StatTile
          label="Lean-in rate"
          value={`${s.cooperationRate}%`}
          tone="up"
        />
        <StatTile
          label="Win rate"
          value={
            s.totalGames > 0
              ? `${Math.round((s.wins / s.totalGames) * 100)}%`
              : "—"
          }
        />
      </div>
    </div>
  );
};
