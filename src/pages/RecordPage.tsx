/**
 * RecordPage — /record (design.md §13.7).
 *
 * Your receipts, side by side and joined by the thread, in two strips:
 * on-chain games from the existing stats history, and practice rounds from
 * the practice record. Above the strips the summary prints as receipt lines;
 * below them "Prove it" opens the claim demo over the reader's own record.
 *
 * A story page, so it sits on the desk (§13.2): light warm paper, ink text.
 * The receipts lie on it exactly as they lie on the counter.
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLayoutEffect } from "react";
import gsap from "gsap";
import { takeFlip } from "../components/transitions/flipHandoff";
import { Receipt, ReceiptLine, Stamp } from "../components/receipt";
import { Thread } from "../components/receipt/Thread";
import { ClaimDemo } from "../components/claim/ClaimDemo";
import { useGameStats } from "../hooks/useGameStats";
import { usePracticeRecord } from "../hooks/usePracticeRecord";
import { summarize } from "../reputation/simulated";
import {
  getOutcome,
  MOVE_LABEL,
  STAMPS,
  type ThreadState,
} from "../content/vocabulary";
import { RECORD } from "../content/story";
import "../styles/record.css";

/** One round on the record, whichever store it came from. */
interface RecordRound {
  id: string;
  yourMove: "C" | "D";
  partnerMove: "C" | "D";
  timestamp: number;
}

const RecordPage: React.FC = () => {
  // The receipt carries you here (design.md §13.6): if a Flip stash is
  // waiting and its receipt is on screen, play it into its slot.
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stash = takeFlip();
    if (!stash) return;
    const target = document.querySelector<HTMLElement>(
      `[data-flip-id="${stash.entryId}"]`,
    );
    if (!target) return;
    const box = target.getBoundingClientRect();
    if (box.bottom < 0 || box.top > window.innerHeight) return;
    const dur =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--dur-print",
        ),
      ) / 1000 || 0.7;
    // The recorded rect lives in page coordinates; the target is measured
    // after the route change, so the same scroll frame applies.
    const now = target.getBoundingClientRect();
    const dx = stash.rect.left - (now.left + window.scrollX);
    const dy = stash.rect.top - (now.top + window.scrollY);
    gsap.fromTo(
      target,
      {
        x: dx,
        y: dy,
        scaleX: stash.rect.width / now.width,
        scaleY: stash.rect.height / now.height,
        transformOrigin: "0 0",
      },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: dur, ease: "power2.out" },
    );
  }, []);

  const { getStats } = useGameStats();
  const { getEntries } = usePracticeRecord();

  // Read once per mount: localStorage is synchronous, and the strips below
  // print whatever is in the stores when the page opens.
  const onChain = useMemo(() => getStats().history, [getStats]);
  const practice = useMemo(() => getEntries(), [getEntries]);

  // The record is everything played, on-chain and practice, oldest first —
  // trust height counts the streak at the newest end.
  const rounds: RecordRound[] = useMemo(
    () =>
      [
        ...onChain.map((g) => ({
          id: g.gameId,
          yourMove: g.yourMove,
          partnerMove: g.opponentMove,
          timestamp: g.timestamp,
        })),
        ...practice.map((p) => ({
          id: p.id,
          yourMove: p.yourMove,
          partnerMove: p.partnerMove,
          timestamp: p.timestamp,
        })),
      ].sort((a, b) => a.timestamp - b.timestamp),
    [onChain, practice],
  );

  const summary = useMemo(() => summarize(rounds), [rounds]);
  const trustHeight = useMemo(() => {
    let height = 0;
    for (let i = rounds.length - 1; i >= 0; i--) {
      if (rounds[i].yourMove === "C" && rounds[i].partnerMove === "C") {
        height++;
      } else {
        break;
      }
    }
    return height;
  }, [rounds]);

  /** The thread joining one receipt to the next carries that round's state. */
  const threadFor = (r: RecordRound): ThreadState =>
    getOutcome(r.yourMove, r.partnerMove).thread;

  return (
    <div className="record-page">
      <header className="record-head">
        <h1 className="record-title">
          {RECORD.title} <span className="record-tint">{RECORD.tint}</span>
        </h1>
        <p className="record-lede">{RECORD.lede}</p>
      </header>

      {/* The summary, printed as receipt lines — tabular figures in the
          print face, exactly as a totals row on a slip. */}
      <Receipt title={RECORD.title} className="record-summary">
        <ReceiptLine label={RECORD.recorded} value={summary.recorded} />
        <ReceiptLine label={RECORD.kept} value={summary.kept} />
        <ReceiptLine label={RECORD.keptPct} value={`${summary.keptPct}%`} />
        <ReceiptLine label={RECORD.height} value={trustHeight} total />
      </Receipt>

      <section className="record-strip" aria-labelledby="record-onchain-h">
        <h2 id="record-onchain-h" className="record-strip-title">
          {RECORD.onChain}
        </h2>
        {onChain.length === 0 ? (
          <p className="record-empty">{RECORD.onChainEmpty}</p>
        ) : (
          <div className="record-strip__row">
            {onChain.map((g, i) => (
              <React.Fragment key={g.gameId}>
                {i > 0 && (
                  <Thread
                    surface="receipt"
                    state={threadFor({
                      id: g.gameId,
                      yourMove: g.yourMove,
                      partnerMove: g.opponentMove,
                      timestamp: g.timestamp,
                    })}
                    width={56}
                    height={32}
                    className="record-strip__thread"
                  />
                )}
                <Receipt title={`Game ${g.gameId}`} className="record-slip">
                  <ReceiptLine label="You" value={MOVE_LABEL[g.yourMove]} />
                  <ReceiptLine
                    label="Partner"
                    value={MOVE_LABEL[g.opponentMove]}
                  />
                  <div className="record-slip__stamp">
                    <Stamp
                      text={
                        STAMPS[
                          getOutcome(g.yourMove, g.opponentMove)
                            .id as keyof typeof STAMPS
                        ]
                      }
                    />
                  </div>
                </Receipt>
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      <section className="record-strip" aria-labelledby="record-practice-h">
        <h2 id="record-practice-h" className="record-strip-title">
          {RECORD.practice}
        </h2>
        {practice.length === 0 ? (
          <p className="record-empty">
            {RECORD.practiceEmpty}{" "}
            <Link to="/#earn" className="record-link">
              {RECORD.practiceCta}
            </Link>
          </p>
        ) : (
          <div className="record-strip__row">
            {practice.map((p, i) => (
              <React.Fragment key={p.id}>
                {i > 0 && (
                  <Thread
                    surface="receipt"
                    state={threadFor({
                      id: p.id,
                      yourMove: p.yourMove,
                      partnerMove: p.partnerMove,
                      timestamp: p.timestamp,
                    })}
                    width={56}
                    height={32}
                    className="record-strip__thread"
                  />
                )}
                <Receipt
                  title={`Round ${practice.length - i}`}
                  className="record-slip"
                  data-flip-id={p.id}
                >
                  <ReceiptLine label="You" value={MOVE_LABEL[p.yourMove]} />
                  <ReceiptLine
                    label="Partner"
                    value={MOVE_LABEL[p.partnerMove]}
                  />
                  <div className="record-slip__stamp">
                    <Stamp text={STAMPS.practice} />
                    <Stamp
                      text={
                        STAMPS[
                          getOutcome(p.yourMove, p.partnerMove)
                            .id as keyof typeof STAMPS
                        ]
                      }
                    />
                  </div>
                </Receipt>
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      <section className="record-prove" aria-labelledby="record-prove-h">
        <h2 id="record-prove-h" className="record-strip-title">
          {RECORD.prove}
        </h2>
        <p className="record-prove-line">{RECORD.proveLine}</p>
        <ClaimDemo summary={summary} />
      </section>
    </div>
  );
};

export default RecordPage;
