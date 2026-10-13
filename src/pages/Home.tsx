/**
 * Home — the landing page.
 *
 * Stage-led and left-biased (design.md §2). The order matters more than the
 * styling: the visitor should meet the situation first, play a round, and only
 * then meet the vocabulary. So —
 *
 *   1. a situation everyone has lived through, and the one question
 *   2. the scene (B3) with the two move tiles under it
 *   3. the round receipt, feeding out after each reveal
 *   4. the four primitives, as a row of stubs — not cards
 *   5. where next, as three text rows
 *
 * The guided deck is at /learn, the sandbox at /learn/play, the tournament at
 * /tournament, and on-chain play at /play.
 */

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { FirstRunWizard, NextStepHint } from "../components/FirstRunWizard";
import {
  PersonalityQuiz,
  getStoredProfile,
} from "../components/PersonalityQuiz";
import { TrustExperiment } from "../components/TrustExperiment";
import { useFirstRun } from "../hooks/useFirstRun";
import { useMascot } from "../components/MascotContext";
import { MARKS } from "../components/marks";
import { PRIMITIVES } from "../content/primitives";
import { prefetchRoute } from "../App";
import "../styles/home.css";

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
] as const;

const Home: React.FC = () => {
  const { address } = useWallet();
  const { unlock, milestones, stage } = useFirstRun();
  const profile = getStoredProfile();
  const { react } = useMascot();
  const greetedRef = useRef(false);
  const [intro, setIntro] = useState<"welcome" | "quiz" | null>(null);

  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const timer = setTimeout(() => {
      if (milestones.first_zk_game) react("welcome_back");
    }, 800);
    return () => clearTimeout(timer);
  }, [react, milestones.first_zk_game]);

  return (
    <div className="home">
      {intro === "welcome" && (
        <FirstRunWizard manual onClose={() => setIntro(null)} />
      )}
      {intro === "quiz" && (
        <PersonalityQuiz manual onClose={() => setIntro(null)} />
      )}

      {/* 1 — the situation, then the question. No eyebrow, nothing centred. */}
      <header className="home-opening">
        <h1 className="home-title">Lean in. Will they?</h1>
        <p className="home-situation">
          You&rsquo;ve paid a stranger before and hoped they&rsquo;d deliver.
          That&rsquo;s the whole game. Play one round.
        </p>
      </header>

      {/* 2 + 3 — the scene, its move tiles, and the round receipt */}
      <TrustExperiment />

      {/* 4 — the four primitives, as stubs rather than cards */}
      <section className="home-primitives" aria-labelledby="home-primitives-h">
        <h2 id="home-primitives-h" className="home-section-heading">
          Four things you&rsquo;ll use
        </h2>
        <ul className="home-primitive-row">
          {PRIMITIVES.map((p) => {
            const Mark = MARKS[p.mark];
            return (
              <li key={p.id}>
                <Link
                  to={p.meetItAt}
                  className="home-primitive"
                  onClick={() => {
                    if (p.meetItAt.startsWith("/learn"))
                      unlock("visited_learn");
                  }}
                >
                  <Mark size={24} className="home-primitive-mark" />
                  <span className="home-primitive-name">{p.name}</span>
                  <span className="home-primitive-line">{p.oneLine}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 5 — where next */}
      <section className="home-next" aria-labelledby="home-next-h">
        <h2 id="home-next-h" className="home-section-heading">
          Where next
        </h2>
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
      </section>

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
            Playing with a friend uses a Stellar wallet — you can connect one in
            the lobby.
          </p>
        )}
      </div>

      <p className="home-credit">
        Based on Nicky Case&rsquo;s &ldquo;The Evolution of Trust&rdquo; —
        enhanced with ZK proofs on Stellar.
      </p>
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
