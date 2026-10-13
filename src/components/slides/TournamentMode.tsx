import "../../styles/tournament.css";
import React, { useState, useCallback, useMemo } from "react";
import AudioManager from "../AudioManager";
import {
  type PopulationEntry,
  type EvolutionConfig,
  type StrategyScore,
  runTournament,
  evolvePopulation,
  DEFAULT_POPULATION,
  DEFAULT_CONFIG,
} from "../../util/tournament";
import {
  getStrategyInfo,
  type StrategyId,
  type PayoffMatrix,
} from "../../util/strategies";
import { PayoffMatrixEditor } from "./PayoffMatrixEditor";

type Stage = "rest" | "playing" | "eliminating" | "reproducing";

export const TournamentMode: React.FC = () => {
  const [population, setPopulation] = useState<PopulationEntry[]>(() =>
    DEFAULT_POPULATION.map((e) => ({ ...e })),
  );
  const [config, setConfig] = useState<EvolutionConfig>(DEFAULT_CONFIG);
  const [generation, setGeneration] = useState(0);
  const [stage, setStage] = useState<Stage>("rest");
  const [scores, setScores] = useState<StrategyScore[]>([]);
  const [autoPlay, setAutoPlay] = useState(false);
  const [history, setHistory] = useState<
    Array<{ gen: number; pop: Record<string, number> }>
  >([]);
  const [winner, setWinner] = useState<string | null>(null);

  const audioManager = AudioManager.getInstance();

  const totalPopulation = useMemo(
    () => population.reduce((sum, e) => sum + e.count, 0),
    [population],
  );

  const buildScores = useCallback(
    (
      pop: PopulationEntry[],
      rawScores: Map<StrategyId, { total: number; count: number }>,
    ): StrategyScore[] => {
      return pop
        .map((entry) => {
          const s = rawScores.get(entry.strategyId);
          const info = getStrategyInfo(entry.strategyId);
          const total = s?.total ?? 0;
          const count = s?.count ?? 0;
          return {
            strategyId: entry.strategyId,
            name: info.name,
            pattern: info.pattern,
            color: info.barColor,
            totalScore: total,
            avgScore: count > 0 ? total / count : 0,
            population: entry.count,
          };
        })
        .sort((a, b) => b.avgScore - a.avgScore);
    },
    [],
  );

  const playTournament = useCallback(() => {
    if (stage !== "rest") return;
    setStage("playing");
    audioManager.playSound("click");

    // Run the tournament (synchronous, but we set stage for visual feedback)
    setTimeout(() => {
      const rawScores = runTournament(population, config);
      const scored = buildScores(population, rawScores);
      setScores(scored);
      setStage("rest");
      audioManager.playSound("coin");
    }, 600);
  }, [stage, population, config, buildScores, audioManager]);

  const evolve = useCallback(() => {
    if (stage !== "rest" || scores.length === 0) return;
    setStage("eliminating");
    audioManager.playSound("defect");

    setTimeout(() => {
      const rawScores = new Map<StrategyId, { total: number; count: number }>();
      scores.forEach((s) => {
        rawScores.set(s.strategyId, {
          total: s.totalScore,
          count: s.population,
        });
      });
      const newPop = evolvePopulation(
        population,
        rawScores,
        config.selectionSize,
      );

      // Record history
      const popRecord: Record<string, number> = {};
      newPop.forEach((e) => {
        popRecord[e.strategyId] = e.count;
      });
      setHistory([...history, { gen: generation + 1, pop: popRecord }]);

      setPopulation(newPop);
      setGeneration(generation + 1);
      setStage("reproducing");
      audioManager.playSound("cooperate");

      setTimeout(() => {
        setStage("rest");

        // Check for winner (one strategy has >= 80% of population)
        const total = newPop.reduce((sum, e) => sum + e.count, 0);
        const dominant = newPop.find((e) => e.count / total >= 0.8);
        if (dominant) {
          const info = getStrategyInfo(dominant.strategyId);
          setWinner(info.name);
          setAutoPlay(false);
          audioManager.playSound("win");
        }
      }, 500);
    }, 600);
  }, [stage, scores, population, config, generation, history, audioManager]);

  // Auto-play loop
  React.useEffect(() => {
    if (!autoPlay || stage !== "rest") return;
    if (winner) {
      setAutoPlay(false);
      return;
    }

    const timer = setTimeout(() => {
      if (scores.length === 0) {
        playTournament();
      } else {
        evolve();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [autoPlay, stage, scores, winner, playTournament, evolve]);

  const reset = useCallback(() => {
    setPopulation(DEFAULT_POPULATION.map((e) => ({ ...e })));
    setGeneration(0);
    setStage("rest");
    setScores([]);
    setHistory([]);
    setWinner(null);
    setAutoPlay(false);
    audioManager.playSound("click");
  }, [audioManager]);

  const maxPop = useMemo(
    () => Math.max(...population.map((e) => e.count), 1),
    [population],
  );

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      {/*
        No heading of its own: the page already says "The Tournament", and two
        headings and two trophy emoji said the same thing twice.
      */}
      <p className="till-intro">
        All strategies play each other. The weak die. The strong reproduce.
        Watch trust evolve over generations.
      </p>

      {/* Winner banner — a finished tournament prints its own receipt. */}
      {winner && (
        <div className="till-winner receipt receipt-edge tf-fade-in-up">
          <p className="till-winner__line">
            {winner} dominates after {generation} generations.
          </p>
          <button type="button" onClick={reset} className="till-button">
            Start a new tournament
          </button>
        </div>
      )}

      {/* Generation + stage indicator */}
      <div className="till-stats">
        <div className="till-stat">
          <p className="till-stat__label">Generation</p>
          <p className="till-stat__value">{generation}</p>
        </div>
        <div className="till-stat">
          <p className="till-stat__label">Population</p>
          <p className="till-stat__value">{totalPopulation}</p>
        </div>
        <div className="till-stat">
          <p className="till-stat__label">Stage</p>
          <p
            className={
              stage === "eliminating"
                ? "till-stat__value till-stat__value--stamp"
                : "till-stat__value"
            }
          >
            {stage === "playing"
              ? "Playing…"
              : stage === "eliminating"
                ? "Eliminating…"
                : stage === "reproducing"
                  ? "Reproducing…"
                  : "Ready"}
          </p>
        </div>
      </div>

      {/*
        The till roll. Each generation prints as a section of a receipt:
        receipt ink, one of four tints, and a THREAD PATTERN per strategy, so
        the bars are told apart without nine colours (design.md §6). The
        legend always shows names.
      */}
      <div className="till-roll receipt receipt-edge">
        {population.map((entry) => {
          const info = getStrategyInfo(entry.strategyId);
          const barWidth = (entry.count / maxPop) * 100;
          const isEliminated = entry.count === 0;
          const score = scores.find((s) => s.strategyId === entry.strategyId);

          return (
            <div key={entry.strategyId}>
              <div
                className={
                  isEliminated
                    ? "till-roll__row till-roll__row--extinct"
                    : "till-roll__row"
                }
              >
                <span
                  className={`thread-key thread-key--${info.pattern} chart-tint-${info.tint}`}
                  aria-hidden="true"
                />
                <span className="till-roll__name">
                  {info.name}
                  {isEliminated && " (extinct)"}
                </span>
                <span className="till-roll__count">
                  {entry.count}
                  {score ? ` · avg ${score.avgScore.toFixed(1)}` : ""}
                </span>
              </div>
              <div className="till-roll__track">
                <div
                  className={`till-roll__fill till-roll__fill--${info.pattern} chart-tint-${info.tint}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* The legend names every strategy; a reader never has to match a
            colour. */}
        <div className="till-roll__legend">
          {population.map((entry) => {
            const info = getStrategyInfo(entry.strategyId);
            return (
              <span key={entry.strategyId} className="till-roll__legend-item">
                <span
                  className={`thread-key thread-key--${info.pattern} chart-tint-${info.tint}`}
                  style={{ width: 18 }}
                  aria-hidden="true"
                />
                {info.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="till-controls">
        <button
          type="button"
          onClick={playTournament}
          disabled={stage !== "rest" || !!winner}
          className="till-button till-button--primary"
        >
          {stage === "playing" ? "Playing…" : "Play a tournament"}
        </button>
        <button
          type="button"
          onClick={evolve}
          disabled={stage !== "rest" || scores.length === 0 || !!winner}
          className="till-button"
        >
          {stage === "eliminating"
            ? "Eliminating…"
            : stage === "reproducing"
              ? "Reproducing…"
              : "Evolve"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (autoPlay) {
              setAutoPlay(false);
            } else {
              setAutoPlay(true);
              // If no scores yet, start by playing
              if (scores.length === 0 && stage === "rest") {
                playTournament();
              }
            }
          }}
          disabled={!!winner}
          aria-pressed={autoPlay}
          className={
            autoPlay ? "till-button till-button--active" : "till-button"
          }
        >
          {autoPlay ? "Stop" : "Auto-play"}
        </button>
        <button type="button" onClick={reset} className="till-button">
          Reset
        </button>
      </div>

      {/* Settings: noise + turns sliders. A form is read closely, so it
          prints on stock. */}
      <div className="till-settings receipt receipt-edge">
        <p className="till-settings__title">Tournament settings</p>

        {/* Noise slider */}
        <div className="till-field">
          <div className="till-field__row">
            <span className="till-field__label">
              Noise (mistake probability)
            </span>
            <span
              className={
                config.noise > 0.1
                  ? "till-field__value till-field__value--loud"
                  : "till-field__value"
              }
            >
              {(config.noise * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={config.noise}
            onChange={(e) => {
              setConfig({ ...config, noise: parseFloat(e.target.value) });
              setScores([]); // Clear stale scores
            }}
            disabled={stage !== "rest"}
          />
          <p className="till-field__hint">
            {config.noise === 0
              ? "Perfect communication — no mistakes"
              : config.noise < 0.05
                ? "Rare slips — forgiving strategies still thrive"
                : config.noise < 0.15
                  ? "Frequent mistakes — TFT struggles, TF2T and Generous TFT take over"
                  : "Chaos — noise drowns out strategy. Nobody dominates."}
          </p>
        </div>

        {/* Turns per match slider */}
        <div className="till-field">
          <div className="till-field__row">
            <span className="till-field__label">Rounds per match</span>
            <span className="till-field__value">{config.turnsPerMatch}</span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={config.turnsPerMatch}
            onChange={(e) => {
              setConfig({ ...config, turnsPerMatch: parseInt(e.target.value) });
              setScores([]);
            }}
            disabled={stage !== "rest"}
          />
        </div>

        {/* Selection size */}
        <div className="till-field">
          <div className="till-field__row">
            <span className="till-field__label">
              Selection pressure (eliminate / reproduce)
            </span>
            <span className="till-field__value">{config.selectionSize}</span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={config.selectionSize}
            onChange={(e) => {
              setConfig({ ...config, selectionSize: parseInt(e.target.value) });
              setScores([]);
            }}
            disabled={stage !== "rest"}
          />
        </div>

        {/* Payoff matrix editor */}
        <div className="till-field">
          <PayoffMatrixEditor
            payoffs={config.payoffs}
            onChange={(payoffs: PayoffMatrix) => {
              setConfig({ ...config, payoffs });
              setScores([]);
            }}
            compact
          />
        </div>
      </div>

      {/* Score table (after tournament played) — a section of the roll. */}
      {scores.length > 0 && (
        <div className="till-results receipt receipt-edge tf-fade-in-up">
          <h4 className="till-results__title">
            Generation {generation} — results
          </h4>
          <table className="till-results__table">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Pop</th>
                <th>Avg score</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr
                  key={s.strategyId}
                  className={i === 0 ? "till-results__row--leader" : undefined}
                >
                  <td>{s.name}</td>
                  <td>{s.population}</td>
                  <td>{s.avgScore.toFixed(1)}</td>
                  <td>{s.totalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Evolution history mini-chart — a section of the roll. Heights and
          tints are per-strategy data, so they stay inline. */}
      {history.length > 0 && (
        <div className="till-results receipt receipt-edge">
          <h4 className="till-results__title">Population over generations</h4>
          <div className="till-history__chart">
            {/* Generation 0 (initial) */}
            <div className="till-history__col" title="Gen 0">
              {DEFAULT_POPULATION.map((e) => {
                const info = getStrategyInfo(e.strategyId);
                return (
                  <div
                    key={e.strategyId}
                    className={`tint-fill chart-tint-${info.tint}`}
                    style={{ height: `${(e.count / 25) * 100}%` }}
                    title={`${info.name}: ${e.count}`}
                  />
                );
              })}
            </div>
            {history.map((h) => {
              const total =
                Object.values(h.pop).reduce((a, b) => a + b, 0) || 1;
              return (
                <div
                  key={h.gen}
                  className="till-history__col"
                  title={`Gen ${h.gen}`}
                >
                  {Object.entries(h.pop).map(([id, count]) => {
                    const info = getStrategyInfo(id as StrategyId);
                    return (
                      <div
                        key={id}
                        className={`tint-fill chart-tint-${info.tint}`}
                        style={{
                          height: `${(count / total) * 100}%`,
                          minHeight: count > 0 ? "2px" : "0",
                        }}
                        title={`${info.name}: ${count}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="till-history__axis">
            <span>Gen 0</span>
            <span>Gen {generation}</span>
          </div>
        </div>
      )}

      {/*
        No separate legend here: the till roll above always names every
        strategy next to its pattern key, so a second legend would print the
        same information twice.
      */}
    </div>
  );
};
