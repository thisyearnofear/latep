/**
 * TournamentViz — Animated population visualization for tournament mode.
 *
 * Renders a horizontal printed bar for each strategy in the population.
 * Bar widths are proportional to each strategy's count and animate via GSAP
 * whenever the population changes. The current generation is displayed at
 * the top. Strategies are told apart by name plus thread pattern — never
 * nine colours (design.md §6).
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

import "../../styles/tournament.css";

interface PopulationEntry {
  strategyId: string;
  name: string;
  pattern: string;
  /** Index into the chart tints — becomes the `chart-tint-N` class. */
  tint: number;
  count: number;
}

interface TournamentVizProps {
  population: PopulationEntry[];
  generation: number;
  maxCount?: number;
  compact?: boolean;
}

const TournamentViz: React.FC<TournamentVizProps> = ({
  population,
  generation,
  maxCount,
  compact = false,
}) => {
  const barsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const countsRef = useRef<Map<string, HTMLSpanElement>>(new Map());

  const computedMax =
    maxCount ?? Math.max(1, ...population.map((p) => p.count));
  const totalCount = population.reduce((sum, p) => sum + p.count, 0);
  const isEmpty = totalCount === 0 || population.length === 0;

  // Animate bar widths + count numbers whenever population changes.
  useEffect(() => {
    const tl = gsap.timeline();
    population.forEach((entry) => {
      const barEl = barsRef.current.get(entry.strategyId);
      const countEl = countsRef.current.get(entry.strategyId);
      const targetWidth =
        computedMax > 0 ? (entry.count / computedMax) * 100 : 0;

      if (barEl) {
        tl.to(
          barEl,
          { width: `${targetWidth}%`, duration: 0.6, ease: "power3.out" },
          0,
        );
      }
      if (countEl) {
        const obj = { val: parseFloat(countEl.textContent ?? "0") || 0 };
        tl.to(
          obj,
          {
            val: entry.count,
            duration: 0.6,
            ease: "power3.out",
            onUpdate: () => {
              countEl.textContent = String(Math.round(obj.val));
            },
          },
          0,
        );
      }
    });

    return () => {
      tl.kill();
    };
  }, [population, computedMax]);

  const setBarRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) barsRef.current.set(id, el);
    else barsRef.current.delete(id);
  };

  const setCountRef = (id: string) => (el: HTMLSpanElement | null) => {
    if (el) countsRef.current.set(id, el);
    else countsRef.current.delete(id);
  };

  return (
    <div className={compact ? "tournament-viz-compact" : undefined}>
      <div className="till-roll receipt receipt-edge">
        <div className="tviz-head">
          <h4 className="tviz-gen">Generation {generation}</h4>
          <span className="tviz-total">{totalCount} agents</span>
        </div>

        {isEmpty ? (
          <div className="tviz-empty">
            No agents remaining. The population has gone extinct.
          </div>
        ) : (
          <div>
            {population.map((entry) => (
              <div key={entry.strategyId} className="tviz-row">
                <div className="tviz-label">
                  <span
                    className={`thread-key thread-key--${entry.pattern} chart-tint-${entry.tint}`}
                    aria-hidden="true"
                  />
                  <span>{entry.name}</span>
                </div>
                <div className="tviz-track">
                  <div
                    ref={setBarRef(entry.strategyId)}
                    className={`tviz-bar till-roll__fill--${entry.pattern} chart-tint-${entry.tint}`}
                  />
                </div>
                <span
                  ref={setCountRef(entry.strategyId)}
                  className="tviz-count"
                >
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentViz;
