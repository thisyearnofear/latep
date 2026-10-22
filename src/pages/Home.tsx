/**
 * Home — the landing page.
 *
 * Stage-led and left-biased (design.md §2). The order matters more than the
 * styling: the visitor should meet the situation first, see the fourth
 * option work, play a round, and only then meet the vocabulary. So —
 *
 *   1. a situation someone is in, and the three dead ends it has
 *   2. the fourth option, as a plate you can operate
 *   3. how the mechanism works, in two lines
 *   4. the first issuer, and the round itself
 *   5. the plates: the primitives, one figure each
 *   6. where it goes, and where next
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
import { prefetchRoute } from "../App";
import { Plate } from "../components/figures/Plate";
import { FigureGallery } from "../components/figures/FigureGallery";
import { GALLERY_PLATES, STORY_PLATE } from "../components/figures/figures";
import {
  DEAD_ENDS,
  DIRECTIONS,
  FIRST_ISSUER,
  FOURTH,
  MECHANIC,
  SCOPE,
  SITUATION,
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
    title: "See the same things in real life",
    line: "The four primitives, as they turn up outside the game.",
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

      {/* 1 — the situation, then the three ways it fails. */}
      <header className="home-opening">
        <h1 className="home-title">{SITUATION.title}</h1>
        <p className="home-situation">{SITUATION.lede}</p>
      </header>

      <section className="home-ways" aria-labelledby="home-ways-h">
        <h2 id="home-ways-h" className="home-section-heading">
          Three ways, and what each one costs
        </h2>
        <ul className="home-way-row">
          {DEAD_ENDS.map((way) => (
            <li key={way.id} className="home-way">
              <span className="home-way-name">{way.name}</span>
              <span className="home-way-line">{way.line}</span>
            </li>
          ))}
        </ul>
        <div className="home-fourth">
          <span className="home-fourth-kicker">{FOURTH.kicker}</span>
          <p className="home-fourth-line">{FOURTH.line}</p>
          <p className="home-fourth-payoff">{FOURTH.payoff}</p>
          <p className="home-fourth-close">{FOURTH.close}</p>
        </div>
      </section>

      {/* 2 — the fourth option, as a plate you can operate. */}
      <section className="home-plate" aria-labelledby="home-plate-h">
        <h2 id="home-plate-h" className="home-section-heading">
          The fourth option
        </h2>
        <Plate definition={STORY_PLATE} size="wide" />
      </section>

      {/* 3 — the mechanism, in two lines. */}
      <section className="home-mechanic" aria-labelledby="home-mechanic-h">
        <h2 id="home-mechanic-h" className="home-section-heading">
          {MECHANIC.kicker}
        </h2>
        <p className="home-mechanic-line">{MECHANIC.line}</p>
        <p className="home-mechanic-line home-mechanic-line--second">
          {MECHANIC.line2}
        </p>
      </section>

      {/* 4 — why a game is the first issuer, then the round itself. */}
      <section className="home-issuer" aria-labelledby="home-issuer-h">
        <h2 id="home-issuer-h" className="home-section-heading">
          {FIRST_ISSUER.kicker}
        </h2>
        <p className="home-issuer-line">{FIRST_ISSUER.line}</p>
        <p className="home-issuer-line home-issuer-line--second">
          {FIRST_ISSUER.line2}
        </p>
      </section>

      <TrustExperiment />

      {/* 5 — the plates: the vocabulary, one figure each. */}
      <section className="home-plates" aria-labelledby="home-plates-h">
        <h2 id="home-plates-h" className="home-section-heading">
          What it&rsquo;s made of
        </h2>
        <FigureGallery plates={GALLERY_PLATES} />
      </section>

      {/* 6 — where it goes, then where next. */}
      <section className="home-directions" aria-labelledby="home-directions-h">
        <h2 id="home-directions-h" className="home-section-heading">
          Where it goes
        </h2>
        <ul className="home-direction-list">
          {DIRECTIONS.map((direction) => (
            <li key={direction.id} className="home-direction">
              <span className="home-direction-title">{direction.title}</span>
              <span className="home-direction-line">{direction.line}</span>
            </li>
          ))}
        </ul>
        <div className="home-scope">
          <span className="home-section-heading">{SCOPE.kicker}</span>
          {SCOPE.lines.map((line) => (
            <p key={line} className="home-scope-line">
              {line}
            </p>
          ))}
        </div>
      </section>

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
