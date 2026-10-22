/**
 * Chapter rail: a fixed nav in the left margin listing the
 * five chapters. The current chapter is the topmost sheet covering ≥50% of
 * the viewport (tracked in homeMotion.useCurrentChapter). Its number rolls
 * up like a till counter; the link gets aria-current + a thread tick.
 * Over the counter sheet (chapter 03) the rail flips to the dark surface
 * colours. Hidden below 1100px.
 */
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CHAPTERS } from "../../content/story";

interface RailApi {
  current: React.RefObject<string | null>;
  subscribe: (fn: (id: string | null) => void) => () => void;
}

export const ChapterRail: React.FC<{ rail: RailApi }> = ({ rail }) => {
  const [current, setCurrent] = useState<string | null>(rail.current.current);
  const [rolling, setRolling] = useState<string | null>(null);
  const prevRef = useRef<string | null>(current);

  useEffect(
    () =>
      rail.subscribe((id) => {
        setRolling(prevRef.current);
        prevRef.current = id;
        setCurrent(id);
      }),
    [rail],
  );

  const index = CHAPTERS.findIndex((c) => c.id === current);
  const onCounter = current === "earn";

  return (
    <nav
      className={`chapter-rail${onCounter ? " chapter-rail--counter" : ""}`}
      data-current={current ?? undefined}
      aria-label="Chapters"
    >
      <span className="chapter-rail-num">
        <span className="chapter-rail-num-mask">
          {rolling !== null && rolling !== current && (
            <span
              key={rolling}
              className="chapter-rail-digit chapter-rail-digit--out"
              onAnimationEnd={() => setRolling(null)}
            >
              {String(CHAPTERS.findIndex((c) => c.id === rolling) + 1).padStart(
                2,
                "0",
              )}
            </span>
          )}
          <span
            key={current}
            className="chapter-rail-digit chapter-rail-digit--in"
          >
            {index >= 0 ? String(index + 1).padStart(2, "0") : "01"}
          </span>
        </span>
      </span>
      <ul className="chapter-rail-list">
        {CHAPTERS.map((c) => (
          <li key={c.id}>
            <Link
              to={`/#${c.id}`}
              className="chapter-rail-link"
              aria-current={c.id === current ? "true" : undefined}
            >
              <span className="chapter-rail-tick" aria-hidden="true" />
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
