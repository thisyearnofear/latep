/**
 * ChoiceSlide — Step 2: "The Choice"
 *
 * Introduces lean in / hold back with a single round against a simple AI.
 * Shows the payoff matrix. No strategy selection, no noise, no advanced features.
 * The user makes one choice and sees the outcome.
 *
 * The payoff matrix is proximity-aware and interactive:
 * - Each cell reads deeper as the cursor approaches (requestAnimationFrame-
 *   driven proximity wash, printed as a flat receipt tint — never a glow).
 * - Hovering a cell shows a line describing that outcome.
 * - Hovering the Lean in / Hold back buttons marks the corresponding matrix
 *   row with a heavier rule and the pressed stock.
 * - Cells fade in with the existing [data-animate] stagger system.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { SlideProps } from "../SlideSystem";
import {
  calculatePayoff,
  NC_DEFAULT,
  type GameMove,
} from "../../util/strategies";
import { unlockAchievement } from "../ui/AchievementBadge";
import { TrustFallCharacter } from "../TrustFallCharacter";
import { TrustStage, type TrustStageState } from "../visual/TrustStage";
import { LessonLayout } from "../learning/LessonLayout";
import { LessonActions } from "../learning/LessonActions";
import { LessonDetails } from "../learning/LessonDetails";
import { Receipt, Stamp } from "../receipt";
import {
  MOVE_LABEL,
  STAMPS,
  getOutcome,
  type StampText,
} from "../../content/vocabulary";
import "../../styles/slide-choice.css";

type Outcome = "caught" | "betrayed" | "exploited" | "mutual-destruction";

/**
 * The outcome wording is the locked vocabulary (design.md §7): the word and
 * the stamp come from `content/vocabulary.ts`, never retyped here.
 */
const VOCAB_OUTCOME: Record<Outcome, { word: string; stamp: StampText }> = {
  caught: { word: getOutcome("C", "C").word, stamp: STAMPS.held },
  betrayed: { word: getOutcome("C", "D").word, stamp: STAMPS.dropped },
  exploited: { word: getOutcome("D", "C").word, stamp: STAMPS.taken },
  "mutual-destruction": {
    word: getOutcome("D", "D").word,
    stamp: STAMPS.standoff,
  },
};

// --- Payoff matrix data -------------------------------------------------

interface MatrixCellData {
  id: string;
  row: "C" | "D";
  payoff: string;
  sub: string;
  description: string;
}

const MATRIX_CELLS: MatrixCellData[] = [
  {
    id: "cc",
    row: "C",
    payoff: "+2 / +2",
    sub: VOCAB_OUTCOME.caught.word,
    description: "You both lean in and catch each other. +2 each.",
  },
  {
    id: "cd",
    row: "C",
    payoff: "-1 / +3",
    sub: VOCAB_OUTCOME.betrayed.word,
    description: "You lean in, they hold back. You: -1, Them: +3.",
  },
  {
    id: "dc",
    row: "D",
    payoff: "+3 / -1",
    sub: VOCAB_OUTCOME.exploited.word,
    description: "You hold back, they lean in. You: +3, Them: -1.",
  },
  {
    id: "dd",
    row: "D",
    payoff: "0 / 0",
    sub: VOCAB_OUTCOME["mutual-destruction"].word,
    description: "You both hold back. Nobody catches anyone. 0 each.",
  },
];

// Distance (in px) within which a cell starts reading deeper from cursor
// proximity.
const PROXIMITY_RADIUS = 150;

interface PayoffMatrixProps {
  hoveredChoice: "C" | "D" | null;
}

const PayoffMatrix: React.FC<PayoffMatrixProps> = ({ hoveredChoice }) => {
  const matrixRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Recompute each cell's proximity wash (--prox, 0–1) from the latest cursor
  // position. It is the dynamic value; slide-choice.css reads it as opacity.
  const updateGlows = useCallback(() => {
    rafRef.current = null;
    const mouse = mousePos.current;
    if (!mouse) return;

    cellRefs.current.forEach((cell) => {
      if (!cell) return;
      const rect = cell.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(mouse.x - cx, mouse.y - cy);
      const intensity =
        dist < PROXIMITY_RADIUS ? 1 - dist / PROXIMITY_RADIUS : 0;
      cell.style.setProperty("--prox", intensity.toFixed(3));
    });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(updateGlows);
      }
    },
    [updateGlows],
  );

  const handleMouseLeave = useCallback(() => {
    mousePos.current = null;
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        cellRefs.current.forEach((cell) => {
          if (cell) cell.style.setProperty("--prox", "0");
        });
      });
    }
  }, []);

  // Cancel any pending animation frame on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const setCellRef = (idx: number) => (el: HTMLDivElement | null) => {
    cellRefs.current[idx] = el;
  };

  const cellClass = (row: "C" | "D") =>
    hoveredChoice === row
      ? "choice-payoff__cell choice-payoff__cell--active"
      : "choice-payoff__cell";

  const hoveredDescription =
    MATRIX_CELLS.find((c) => c.id === hoveredCell)?.description ?? null;

  return (
    <Receipt title="Payoff matrix" className="choice-payoff">
      <div data-animate className="learning-payoff">
        <div
          ref={matrixRef}
          role="group"
          aria-label="Payoff matrix"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="choice-payoff__grid"
        >
          {/* Header row — their move */}
          <div />
          <div className="choice-payoff__col">
            They {MOVE_LABEL.C.toLowerCase()}
          </div>
          <div className="choice-payoff__col">
            They {MOVE_LABEL.D.toLowerCase()}
          </div>

          {/* Row 1: you lean in (cooperate) */}
          <div
            className={
              hoveredChoice === "D"
                ? "choice-payoff__row choice-payoff__row--dim"
                : "choice-payoff__row"
            }
          >
            <span className="choice-payoff__row-label">
              You {MOVE_LABEL.C.toLowerCase()}
            </span>
            <TrustFallCharacter
              state="standing"
              color="cooperator"
              size="sm"
              surface="receipt"
            />
          </div>
          {MATRIX_CELLS.slice(0, 2).map((cell, i) => (
            <div
              key={cell.id}
              ref={setCellRef(i)}
              data-animate
              tabIndex={0}
              aria-label={cell.description}
              onFocus={() => setHoveredCell(cell.id)}
              onBlur={() => setHoveredCell(null)}
              onMouseEnter={() => setHoveredCell(cell.id)}
              onMouseLeave={() => setHoveredCell(null)}
              className={cellClass(cell.row)}
            >
              <div className="choice-payoff__payoff">{cell.payoff}</div>
              <div className="choice-payoff__sub">{cell.sub}</div>
            </div>
          ))}

          {/* Row 2: you hold back (defect) */}
          <div
            className={
              hoveredChoice === "C"
                ? "choice-payoff__row choice-payoff__row--dim"
                : "choice-payoff__row"
            }
          >
            <span className="choice-payoff__row-label">
              You {MOVE_LABEL.D.toLowerCase()}
            </span>
            <TrustFallCharacter
              state="standing"
              color="defector"
              size="sm"
              surface="receipt"
            />
          </div>
          {MATRIX_CELLS.slice(2, 4).map((cell, i) => (
            <div
              key={cell.id}
              ref={setCellRef(i + 2)}
              data-animate
              tabIndex={0}
              aria-label={cell.description}
              onFocus={() => setHoveredCell(cell.id)}
              onBlur={() => setHoveredCell(null)}
              onMouseEnter={() => setHoveredCell(cell.id)}
              onMouseLeave={() => setHoveredCell(null)}
              className={cellClass(cell.row)}
            >
              <div className="choice-payoff__payoff">{cell.payoff}</div>
              <div className="choice-payoff__sub">{cell.sub}</div>
            </div>
          ))}
        </div>

        {/* Hover hint / outcome description */}
        <div
          className={
            hoveredDescription
              ? "choice-payoff__hint choice-payoff__hint--visible"
              : "choice-payoff__hint"
          }
        >
          {hoveredDescription ?? "\u00A0"}
        </div>
      </div>
    </Receipt>
  );
};

// --- Main slide ---------------------------------------------------------

export const ChoiceSlide: React.FC<SlideProps> = ({ onNext }) => {
  const [playerMove, setPlayerMove] = useState<GameMove | null>(null);
  const [aiMove] = useState<GameMove>("C"); // Always cooperates first round
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [payout, setPayout] = useState<{ player: number; ai: number } | null>(
    null,
  );
  const [hoveredChoice, setHoveredChoice] = useState<"C" | "D" | null>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const cooperateRef = useRef<HTMLButtonElement>(null);
  const previousMoveRef = useRef<GameMove | null>(null);

  useEffect(() => {
    if (playerMove) resultRef.current?.focus({ preventScroll: true });
    else if (previousMoveRef.current)
      cooperateRef.current?.focus({ preventScroll: true });
    previousMoveRef.current = playerMove;
  }, [playerMove]);

  const makeChoice = (move: GameMove) => {
    if (playerMove) return; // Already played
    const result = calculatePayoff(move, aiMove, 1, NC_DEFAULT);
    setPlayerMove(move);
    setPayout({ player: result.playerPayout, ai: result.aiPayout });

    let o: Outcome;
    if (move === "C" && aiMove === "C") o = "caught";
    else if (move === "C" && aiMove === "D") o = "betrayed";
    else if (move === "D" && aiMove === "C") o = "exploited";
    else o = "mutual-destruction";
    setOutcome(o);

    // Unlock achievements
    if (o === "caught") unlockAchievement("first_catch");
    else if (o === "betrayed") unlockAchievement("first_betrayal");
    else if (o === "exploited") unlockAchievement("first_exploit");
  };

  const reset = () => {
    setPlayerMove(null);
    setOutcome(null);
    setPayout(null);
  };

  const stageState: TrustStageState =
    playerMove && outcome
      ? { phase: "outcome", playerMove, opponentMove: aiMove }
      : { phase: "choose" };

  return (
    <LessonLayout
      title="The Choice"
      description="Choose without seeing your partner’s move."
      visual={
        <TrustStage
          compact
          state={stageState}
          opponentLabel="Practice partner"
          roundKey={playerMove ?? "none"}
          trustAltitude={outcome === "caught" ? 1 : 0}
        />
      }
    >
      {/* Choice buttons or result */}
      {!playerMove ? (
        <p>
          Lean in (cooperate) to offer a catch, or hold back (defect) to step
          aside. Both choices have consequences.
        </p>
      ) : (
        <>
          <div className="choice-result">
            <p ref={resultRef} tabIndex={-1} className="choice-result__word">
              {VOCAB_OUTCOME[outcome!].word}
            </p>
            <Stamp text={VOCAB_OUTCOME[outcome!].stamp} />
            {payout && (
              <p className="choice-result__payout">
                You: {payout.player > 0 ? "+" : ""}
                {payout.player} points · Them: {payout.ai > 0 ? "+" : ""}
                {payout.ai} points
              </p>
            )}
          </div>

          {outcome === "caught" && (
            <p className="choice-reflection">
              You both gained +2. Trust paid off — this time.
            </p>
          )}
          {outcome === "exploited" && (
            <p className="choice-reflection">
              You gained +3 by holding back. But would you play the same way if
              you had to see them again?
            </p>
          )}
        </>
      )}

      {/* Payoff matrix (proximity-aware & interactive) */}
      <LessonDetails trigger="How the points work" title="Payoff matrix">
        <PayoffMatrix hoveredChoice={hoveredChoice} />
      </LessonDetails>

      <LessonDetails trigger="Why this matters" title="Why this matters">
        <p>
          The sealed choice is real. On-chain, a commitment is binding but
          hidden — the same pattern behind auctions, voting, and protection
          against front-running.
        </p>
      </LessonDetails>

      {!playerMove ? (
        <LessonActions>
          <div
            onMouseEnter={() => setHoveredChoice("C")}
            onMouseLeave={() => setHoveredChoice(null)}
          >
            <button
              type="button"
              ref={cooperateRef}
              className="learning-button learning-button-primary"
              onClick={() => makeChoice("C")}
              onFocus={() => setHoveredChoice("C")}
              onBlur={() => setHoveredChoice(null)}
            >
              {MOVE_LABEL.C}
            </button>
          </div>
          <div
            onMouseEnter={() => setHoveredChoice("D")}
            onMouseLeave={() => setHoveredChoice(null)}
          >
            <button
              type="button"
              className="learning-button"
              onClick={() => makeChoice("D")}
              onFocus={() => setHoveredChoice("D")}
              onBlur={() => setHoveredChoice(null)}
            >
              {MOVE_LABEL.D}
            </button>
          </div>
        </LessonActions>
      ) : (
        <LessonActions>
          <button type="button" className="learning-button" onClick={reset}>
            Try again
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
