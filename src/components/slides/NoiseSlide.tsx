/**
 * NoiseSlide — Step 6: "The Noise"
 *
 * What happens when signals get garbled? A cooperative move might be
 * received as defection. The user adjusts a noise slider and watches
 * how trust collapses.
 *
 * Runs a quick simulation: TFT vs TFT with varying noise levels.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { SlideProps } from "../SlideSystem";
import { unlockAchievement } from "../ui/AchievementBadge";
import { TrustStage } from "../visual/TrustStage";
import {
  createStrategy,
  playRepeatedGame,
  NC_DEFAULT,
  type GameMove,
} from "../../util/strategies";

interface SimResult {
  noise: number;
  avgCooperation: number;
  avgScore: number;
  lastRound: { a: GameMove; b: GameMove } | null;
  trustAltitude: number;
}

function runSim(noise: number, rounds = 50): SimResult {
  const sA = createStrategy("tft");
  const sB = createStrategy("tft");
  const result = playRepeatedGame(sA, sB, rounds, noise, NC_DEFAULT);

  // Count cooperative moves
  let coopCount = 0;
  result.moves.forEach((m) => {
    if (m.a === "C") coopCount++;
    if (m.b === "C") coopCount++;
  });
  const avgCooperation = coopCount / (rounds * 2);
  const avgScore = (result.totalA + result.totalB) / 2;

  return {
    noise,
    avgCooperation,
    avgScore,
    lastRound: result.moves[result.moves.length - 1] ?? null,
    trustAltitude: result.moves.reduce(
      (height, m) => (m.a === "C" && m.b === "C" ? height + 1 : 0),
      0,
    ),
  };
}

export const NoiseSlide: React.FC<SlideProps> = ({ onNext }) => {
  const [noise, setNoise] = useState(0);
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const [simulationNumber, setSimulationNumber] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSimulation = useCallback(() => {
    if (running || timerRef.current !== null) return;
    const requestedNoise = noise;
    setRunning(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const r = runSim(requestedNoise);
      setResult(r);
      setSimulationNumber((n) => n + 1);
      setRunning(false);
      unlockAchievement("noise_master");
    }, 300);
  }, [noise, running]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const coopPercent = result ? Math.round(result.avgCooperation * 100) : 0;
  const scoreLabel = result ? result.avgScore.toFixed(1) : "—";

  return (
    <div
      className="learning-round"
      style={{ margin: "0 auto", textAlign: "center" }}
    >
      <h2
        data-animate
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-3xl)",
          marginBottom: "12px",
        }}
      >
        The Noise
      </h2>

      <p
        data-animate
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-base)",
          color: "var(--text-secondary)",
          marginBottom: "8px",
        }}
      >
        What if a cooperative signal gets garbled? You meant to catch — but they
        thought you stepped aside. Misunderstanding breeds mistrust.
      </p>

      <p
        data-animate
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "var(--text-lg)",
          color: "var(--text-muted)",
          marginBottom: "32px",
        }}
      >
        Two Tit-for-Tat players. Perfect partners. Add noise — watch what
        happens.
      </p>

      {/* Noise slider */}
      <div
        data-animate
        style={{
          padding: "28px",
          marginBottom: "24px",
          background: "rgba(10, 14, 26, 0.85)",
          border: "1px solid var(--border-glass)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--text-muted)",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Noise Level
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              color: "var(--accent-warm)",
              margin: 0,
            }}
          >
            {Math.round(noise * 100)}%
          </p>
        </div>

        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          value={noise}
          onChange={(e) => {
            setNoise(parseFloat(e.target.value));
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setRunning(false);
            setResult(null);
          }}
          style={{
            width: "100%",
            height: "8px",
            borderRadius: "4px",
            background: `linear-gradient(90deg, var(--accent-cooperate) 0%, var(--accent-warm) ${noise * 200}%, rgba(255,255,255,0.12) ${noise * 200}%)`,
            appearance: "none",
            outline: "none",
            cursor: "pointer",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              color: "var(--text-muted)",
            }}
          >
            Perfect signals
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              color: "var(--text-muted)",
            }}
          >
            Chaos
          </span>
        </div>

        {/* Submit button — made prominent so it's easy to find */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background: "rgba(240, 160, 32, 0.08)",
            border: "1px solid rgba(240, 160, 32, 0.2)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Run a 50-round simulation between two Tit-for-Tat strategies
          </p>
          <button
            type="button"
            className="learning-button learning-button-primary"
            onClick={runSimulation}
            disabled={running}
            style={{
              width: "100%",
              maxWidth: "320px",
              fontSize: "var(--text-base)",
              fontWeight: 700,
            }}
          >
            {running ? "Running 50 rounds..." : "Simulate 50 rounds"}
          </button>
        </div>
      </div>

      <div data-animate style={{ marginBottom: "24px" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
            marginBottom: "8px",
          }}
        >
          {result
            ? "Final round of the 50-round simulation"
            : "Wind risk is a setting, not a guaranteed mistake."}
        </p>
        <TrustStage
          state={
            result?.lastRound
              ? {
                  phase: "outcome",
                  playerMove: result.lastRound.a,
                  opponentMove: result.lastRound.b,
                }
              : { phase: "idle" }
          }
          opponentLabel="Tit-for-Tat partner"
          roundKey={simulationNumber}
          showChoices={!!result}
          trustAltitude={result?.trustAltitude}
          noise={result?.noise ?? noise}
        />
      </div>

      {/* Results */}
      {result && (
        <div data-animate>
          <div
            style={{
              padding: "24px",
              marginBottom: "24px",
              background: "rgba(10, 14, 26, 0.85)",
              border: `1px solid ${
                coopPercent > 60
                  ? "rgba(74,222,128,0.3)"
                  : coopPercent > 30
                    ? "rgba(240,160,32,0.3)"
                    : "rgba(248,113,113,0.3)"
              }`,
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                flexWrap: "wrap",
                gap: "16px",
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
                  Cooperation rate
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    color:
                      coopPercent > 60
                        ? "var(--accent-cooperate)"
                        : coopPercent > 30
                          ? "var(--accent-warm)"
                          : "var(--accent-defect)",
                    margin: 0,
                  }}
                >
                  {coopPercent}%
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
                  Average total points
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  {scoreLabel}
                </p>
              </div>
            </div>

            {/* Cooperation bar */}
            <div
              style={{
                marginTop: "16px",
                height: "8px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${coopPercent}%`,
                  background:
                    coopPercent > 60
                      ? "var(--accent-cooperate)"
                      : coopPercent > 30
                        ? "var(--accent-warm)"
                        : "var(--accent-defect)",
                  transition: "width 0.6s var(--ease-out)",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <p
            data-animate
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "var(--text-lg)",
              color: "var(--text-secondary)",
              marginBottom: "24px",
            }}
          >
            {`At ${Math.round(result.noise * 100)}% noise risk, this run produced ${coopPercent}% cooperation. Run it again to explore variation.`}
          </p>
        </div>
      )}

      <div data-animate>
        <button
          type="button"
          className="learning-button learning-button-primary"
          onClick={onNext}
        >
          Ready for real stakes?
        </button>
      </div>
    </div>
  );
};
