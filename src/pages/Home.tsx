/**
 * Home — the landing page, told in chapters (design.md §13.7).
 *
 * The page sits on the desk: a story surface, left-biased, in full-bleed
 * bands. The order is the story's order — situation, the fourth option,
 * earn a record, where it goes, underneath — and none skips ahead.
 *
 *   hero   the Desk plate on a sage wash, headline + actions on the desk
 *   01     the problem — Maria's situation and the three dead ends
 *   02     the fourth option — the claim demo, on a sand wash
 *   03     earn a record — the first issuer and the practice round, on the
 *          counter (the stage keeps its own surface)
 *   04     where it goes — the three directions, on a sage wash
 *   05     underneath — the mechanism and the plates, on the desk
 *
 * Copy lives in content/story.ts; components never retype it.
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { FirstRunWizard, NextStepHint } from "../components/FirstRunWizard";
import {
  PersonalityQuiz,
  getStoredProfile,
} from "../components/PersonalityQuiz";
import { TrustExperiment } from "../components/TrustExperiment";
import { useFirstRun } from "../hooks/useFirstRun";
import { useMascot } from "../components/MascotContext";
import { prefetchRoute } from "../App";
import { DeskHero } from "../components/hero/DeskHero";
import {
  useSheetStack,
  useLineReveals,
  useFocusAboveSheets,
  useCurrentChapter,
} from "../components/transitions/homeMotion";
import { ChapterRail } from "../components/hero/ChapterRail";
import { FigureGallery } from "../components/figures/FigureGallery";
import { GALLERY_PLATES } from "../components/figures/figures";
import { ClaimDemo } from "../components/claim/ClaimDemo";
import {
  CHAPTERS,
  CLAIM_DEMO,
  DEAD_ENDS,
  DIRECTIONS,
  EARN,
  FIRST_ISSUER,
  FOURTH,
  HERO,
  HERO_ACTIONS,
  MECHANIC,
  SCOPE,
  SITUATION,
  WHERE_IT_GOES,
} from "../content/story";
import "../styles/home.css";
import "../styles/figures.css";

/**
 * Where next. Three text rows, each a name, a line of explanation, and a
 * route — replacing the three equal emoji cards, which made everything look
 * equally important and none of it did.
 */
const NEXT = [
  {
    to: "/learn/play",
    title: "Practise against strategies",
    line: "Nine opponents that each play differently. See which ones you can hold.",
  },
  {
    to: "/tournament",
    title: "Watch a tournament",
    line: "All nine compete. The weak are eliminated, the strong reproduce.",
  },
  {
    to: "/play",
    title: "Play with a friend",
    line: "Real stakes on Stellar. Every move is sealed and proven before anyone commits.",
  },
  {
    to: "/real-life",
    title: WHERE_IT_GOES.title,
    line: WHERE_IT_GOES.lede,
  },
] as const;

/**
 * The label row that opens a chapter: the print-face number in moss, then
 * the chapter title in body weight. Not a heading — the display h2 carries
 * the headline; this is the wayfinding.
 */
function ChapterLabel({
  number,
  title,
  id,
}: {
  number: string;
  title: string;
  id: string;
}) {
  return (
    <p className="chapter-label">
      <span className="chapter-number">{number}</span>
      <span className="chapter-name" id={id}>
        {title}
      </span>
    </p>
  );
}

const Home: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  // The title variant is read once — ?type=1|2|3, default 1 (no switcher).
  const typeRef = useRef(
    new URLSearchParams(window.location.search).get("type") ?? "1",
  );
  const type = typeRef.current;
  const chapterIds = CHAPTERS.map((c) => c.id);
  const rail = useCurrentChapter(rootRef, chapterIds);
  useSheetStack(rootRef);
  useLineReveals(rootRef);
  useFocusAboveSheets();
  const { address } = useWallet();
  const { unlock, milestones, stage } = useFirstRun();
  const profile = getStoredProfile();
  const { react } = useMascot();
  const greetedRef = useRef(false);
  const [intro, setIntro] = useState<"welcome" | "quiz" | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const timer = setTimeout(() => {
      if (milestones.first_zk_game) react("welcome_back");
    }, 800);
    return () => clearTimeout(timer);
  }, [react, milestones.first_zk_game]);

  /* React Router doesn't scroll to hashes. A link to /#earn or /#underneath
     lands the reader at the chapter and moves focus to its h2 — the same
     contract as a plain anchor. */
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const section = document.getElementById(id);
    if (!section) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    section.scrollIntoView({
      block: "start",
      behavior: reduced ? "auto" : "smooth",
    });
    section.querySelector("h2")?.focus({ preventScroll: true });
  }, [location.hash]);

  return (
    <div className="home" data-type={type} ref={rootRef}>
      {intro === "welcome" && (
        <FirstRunWizard manual onClose={() => setIntro(null)} />
      )}
      {intro === "quiz" && (
        <PersonalityQuiz manual onClose={() => setIntro(null)} />
      )}

      {/* The hero: the Desk plate on a sage wash, decoration around the
          headline. The headline renders first and carries the meaning. */}
      <section
        className="home-hero sheet"
        data-sheet="stack"
        aria-label="Opening"
      >
        <figure
          className="home-hero-figure"
          role="img"
          aria-label={HERO.illustrationLabel}
        >
          <DeskHero />
        </figure>
      </section>

      <header className="home-opening sheet" data-sheet="stack">
        <h1 className="home-title" data-vt-title>
          {HERO.title}
          <br />
          <span className="home-title-tint">{HERO.tint}</span>
        </h1>
        <p className="home-situation">{HERO.lede}</p>
        <div className="home-hero-actions">
          <a href="#earn" className="home-action home-action--primary">
            {HERO_ACTIONS.primary}
          </a>
          <Link to="/real-life" className="home-action home-action--secondary">
            {HERO_ACTIONS.secondary}
          </Link>
        </div>
      </header>

      {/* 01 — the problem */}
      <section
        className="chapter chapter--desk sheet"
        data-sheet="stack"
        id={CHAPTERS[0].id}
        aria-labelledby={`${CHAPTERS[0].id}-h`}
      >
        <div className="chapter-inner">
          <ChapterLabel
            number={CHAPTERS[0].number}
            title={CHAPTERS[0].title}
            id={`${CHAPTERS[0].id}-label`}
          />
          <h2 className="chapter-h" tabIndex={-1} id={`${CHAPTERS[0].id}-h`}>
            {SITUATION.title}
          </h2>
          <p className="chapter-lede">{SITUATION.lede}</p>
          <ul className="home-way-row">
            {DEAD_ENDS.map((way) => (
              <li key={way.id} className="home-way">
                <span className="home-way-name">{way.name}</span>
                <span className="home-way-line">{way.line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 02 — the fourth option */}
      <section
        className="chapter chapter--sand sheet"
        data-sheet="flow"
        id={CHAPTERS[1].id}
        aria-labelledby={`${CHAPTERS[1].id}-h`}
      >
        <div className="chapter-inner">
          <ChapterLabel
            number={CHAPTERS[1].number}
            title={CHAPTERS[1].title}
            id={`${CHAPTERS[1].id}-label`}
          />
          <h2 className="chapter-h" tabIndex={-1} id={`${CHAPTERS[1].id}-h`}>
            {CLAIM_DEMO.heading}
          </h2>
          <p className="chapter-lede">{FOURTH.line}</p>
          <p className="chapter-payoff">{FOURTH.payoff}</p>
          <p className="chapter-close">{FOURTH.close}</p>
          {type === "2" && (
            <p
              className="chapter-figure"
              aria-label={`${CLAIM_DEMO.collateralLabel}`}
            >
              <span className="chapter-figure-num">
                {CLAIM_DEMO.stranger.collateralPct}%
              </span>
              <span className="chapter-figure-arrow" aria-hidden="true">
                →
              </span>
              <span className="chapter-figure-num chapter-figure-num--moss">
                {CLAIM_DEMO.holder.collateralPct}%
              </span>
              <span className="chapter-figure-cap">
                {CLAIM_DEMO.collateralLabel}
              </span>
            </p>
          )}
          <ClaimDemo />
        </div>
      </section>

      {/* 03 — earn a record. The counter band: the stage lives here, so it
          keeps its own dark surface and reads as the workbench it is. */}
      <section
        className="chapter chapter--counter sheet"
        data-sheet="flow"
        id={CHAPTERS[2].id}
        aria-labelledby={`${CHAPTERS[2].id}-h`}
      >
        <div className="chapter-inner">
          <ChapterLabel
            number={CHAPTERS[2].number}
            title={CHAPTERS[2].title}
            id={`${CHAPTERS[2].id}-label`}
          />
          <h2 className="chapter-h" tabIndex={-1} id={`${CHAPTERS[2].id}-h`}>
            {FIRST_ISSUER.kicker}
          </h2>
          <p className="chapter-lede">{FIRST_ISSUER.line}</p>
          <p className="chapter-lede chapter-lede--second">
            {FIRST_ISSUER.line2}
          </p>
          <p className="chapter-close">{EARN.line}</p>
          <TrustExperiment recordLink />
        </div>
      </section>

      {/* 04 — where it goes */}
      <section
        className="chapter chapter--sage sheet"
        data-sheet="stack"
        id={CHAPTERS[3].id}
        aria-labelledby={`${CHAPTERS[3].id}-h`}
      >
        <div className="chapter-inner">
          <ChapterLabel
            number={CHAPTERS[3].number}
            title={CHAPTERS[3].title}
            id={`${CHAPTERS[3].id}-label`}
          />
          <h2 className="chapter-h" tabIndex={-1} id={`${CHAPTERS[3].id}-h`}>
            {WHERE_IT_GOES.tint}
          </h2>
          <ul className="home-direction-list">
            {DIRECTIONS.map((direction) => (
              <li key={direction.id} className="home-direction">
                <span className="home-direction-title">{direction.title}</span>
                <span className="home-direction-line">{direction.line}</span>
              </li>
            ))}
          </ul>
          <p className="chapter-linkrow">
            <Link to="/real-life" className="chapter-link">
              {WHERE_IT_GOES.homeLink}
            </Link>
          </p>
        </div>
      </section>

      {/* 05 — underneath */}
      <section
        className="chapter chapter--desk sheet"
        data-sheet="flow"
        id={CHAPTERS[4].id}
        aria-labelledby={`${CHAPTERS[4].id}-h`}
      >
        <div className="chapter-inner">
          <ChapterLabel
            number={CHAPTERS[4].number}
            title={CHAPTERS[4].title}
            id={`${CHAPTERS[4].id}-label`}
          />
          <h2 className="chapter-h" tabIndex={-1} id={`${CHAPTERS[4].id}-h`}>
            {MECHANIC.kicker}
          </h2>
          <p className="chapter-lede">{MECHANIC.line}</p>
          <p className="chapter-lede chapter-lede--second">{MECHANIC.line2}</p>
          <FigureGallery plates={GALLERY_PLATES} />
          <div className="home-scope">
            <p className="chapter-label">{SCOPE.kicker}</p>
            {SCOPE.lines.map((line) => (
              <p key={line} className="home-scope-line">
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Where next, the nudge and the credit — on the desk. */}
      <section
        className="chapter chapter--desk home-next sheet"
        data-sheet="flow"
      >
        <div className="chapter-inner">
          <h2 className="chapter-h chapter-h--quiet">Where next</h2>
          <ul className="home-next-list">
            {NEXT.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="home-next-row"
                  onMouseEnter={() => prefetchRoute(item.to)}
                  onFocus={() => prefetchRoute(item.to)}
                  onClick={() => {
                    if (item.to.startsWith("/learn")) unlock("visited_learn");
                  }}
                >
                  <span className="home-next-title">{item.title}</span>
                  <span className="home-next-line">{item.line}</span>
                  <span className="home-next-go" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="chapter-inner chapter--desk sheet" data-sheet="flow">
        {/* The stage-aware nudge stays; everything else is quiet. */}
        <div className="home-nudge">
          {stage === "new" || stage === "complete" ? (
            <p className="home-nudge-text">
              {stage === "new"
                ? "New here? Play a practice round above, then take the guided journey."
                : "You've been through it all — take it on-chain with a friend."}
            </p>
          ) : (
            <NextStepHint />
          )}

          {/* The wizard and the quiz are optional actions, not popups. */}
          <div className="home-optional">
            <button
              type="button"
              className="home-quiet-button"
              onClick={() => setIntro("welcome")}
            >
              Getting started
            </button>
            <button
              type="button"
              className="home-quiet-button"
              onClick={() => setIntro("quiz")}
            >
              Discover your trust style
            </button>
            {profile && (
              <span className="home-profile">
                Your trust profile: <strong>{profileLabel(profile)}</strong>
              </span>
            )}
          </div>

          {!address && (
            <p className="home-fineprint">
              Playing with a friend uses a Stellar wallet — you can connect one
              in the lobby.
            </p>
          )}
        </div>

        <p className="home-credit">
          Based on Nicky Case&rsquo;s &ldquo;The Evolution of Trust&rdquo; —
          enhanced with ZK proofs on Stellar.
        </p>
      </div>
      {type !== "3" && <ChapterRail rail={rail} variant={type} />}
    </div>
  );
};

/** Plain words, no emoji: the quiz's four archetypes. */
function profileLabel(profile: string): string {
  switch (profile) {
    case "cooperator":
      return "Cooperator";
    case "strategist":
      return "Strategist";
    case "survivor":
      return "Survivor";
    default:
      return "Wildcard";
  }
}

export default Home;
