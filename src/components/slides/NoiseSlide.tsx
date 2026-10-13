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
import { LessonLayout } from "../learning/LessonLayout";
import { LessonActions } from "../learning/LessonActions";
import { LessonDetails } from "../learning/LessonDetails";
import { ReceiptLine } from "../receipt";
import "../../styles/slide-noise.css";
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
    <LessonLayout
      title="The Noise"
      description="Even a choice to lean in can be received as holding back."
      visual={
        <>
          <p className="noise-caption">
            {result
              ? "Final round of the 50-round simulation"
              : "Wind risk is a setting, not a guaranteed mistake."}
          </p>
          <TrustStage
            compact
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
        </>
      }
    >
      {/* Noise slider — printed on the lesson receipt, so it is a labelled
          control and a dashed rule, never a panel inside the receipt. */}
      <div className="noise-control">
        <div className="noise-control-head">
          <label htmlFor="lesson-noise" className="noise-label">
            Noise level
          </label>
          <p className="noise-value">{Math.round(noise * 100)}%</p>
        </div>

        <input
          id="lesson-noise"
          type="range"
          className="noise-slider"
          min="0"
          max="0.5"
          step="0.05"
          value={noise}
          aria-label="Noise level"
          onChange={(e) => {
            setNoise(parseFloat(e.target.value));
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setRunning(false);
            setResult(null);
          }}
        />

        <p className="noise-hint">Chance that each move is flipped.</p>
      </div>

      {/* Results */}
      {result && (
        <div className="noise-result">
          <ReceiptLine label="Leaned in" value={`${coopPercent}%`} />
          <ReceiptLine label="Average total points" value={scoreLabel} />

          {/* The bar's one dynamic value, passed as a CSS variable. */}
          <div className="noise-bar">
            <div
              className="noise-bar-fill"
              style={
                { "--bar-scale": coopPercent / 100 } as React.CSSProperties
              }
            />
          </div>

          <p className="noise-summary">
            {`At ${Math.round(result.noise * 100)}% noise risk, this run leaned in on ${coopPercent}% of the 100 moves. Run it again to explore variation.`}
          </p>
        </div>
      )}

      <LessonDetails trigger="Why this matters" title="Why this matters">
        <p>
          The real world is noisy: failed payments, ambiguous data, disputed
          outcomes. That is why settlement rules must be deterministic about
          what counts.
        </p>
      </LessonDetails>

      {/* Submit button */}
      <LessonActions>
        <button
          type="button"
          className={`learning-button ${result ? "" : "learning-button-primary"}`}
          onClick={runSimulation}
          disabled={running}
        >
          {running ? "Running 50 rounds…" : "Simulate 50 rounds"}
        </button>
        {result && (
          <button
            type="button"
            className="learning-button learning-button-primary"
            onClick={onNext}
          >
            Continue
          </button>
        )}
      </LessonActions>
    </LessonLayout>
  );
};
