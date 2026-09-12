/**
 * Home — Landing hub
 *
 * Replaces the 8-slide linear deck as the landing page. Three clear entry
 * points (Learn / Tournament / Play) presented as glass-panel cards, plus
 * a brief hero explaining what Latep is.
 *
 * The guided narrative slide deck is now at /learn.
 * The tutorial sandbox is at /learn/play.
 * The tournament is at /tournament.
 * ZK multiplayer is at /play.
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { FirstRunWizard, NextStepHint } from "../components/FirstRunWizard";
import {
  PersonalityQuiz,
  getStoredProfile,
} from "../components/PersonalityQuiz";
import { TrustExperiment } from "../components/TrustExperiment";
import { useFirstRun } from "../hooks/useFirstRun";
import { useMascot } from "../components/MascotContext";

interface HubCard {
  icon: string;
  title: string;
  description: string;
  cta: string;
  route: string;
  color: string;
  glow: string;
}

const CARDS: HubCard[] = [
  {
    icon: "🤝",
    title: "Practice with strategies",
    description:
      "Play the iterated Prisoner's Dilemma against 9 stateful AI strategies. Adjust noise, payoffs, and watch how trust evolves.",
    cta: "Start learning",
    route: "/learn/play",
    color: "var(--accent-violet)",
    glow: "rgba(102, 126, 234, 0.15)",
  },
  {
    icon: "🏆",
    title: "Watch trust evolve",
    description:
      "Watch all 9 strategies compete in an evolutionary tournament. The weak are eliminated, the strong reproduce. Trust evolves.",
    cta: "Watch it evolve",
    route: "/tournament",
    color: "var(--accent-warm)",
    glow: "rgba(240, 160, 32, 0.15)",
  },
  {
    icon: "🔒",
    title: "Try ZK multiplayer",
    description:
      "Commit moves with zero-knowledge proofs — trust is proven, not promised. Wallet required. Network and stakes are shown in the lobby.",
    cta: "Enter ZK lobby",
    route: "/play",
    color: "var(--accent-cooperate)",
    glow: "rgba(74, 222, 128, 0.12)",
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { unlock, milestones } = useFirstRun();
  const profile = getStoredProfile();
  const { react } = useMascot();
  const greetedRef = useRef(false);
  const [intro, setIntro] = useState<"welcome" | "quiz" | null>(null);

  // Greet the user on arrival (once per session)
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    // Delay slightly so it doesn't fire during page transition
    const timer = setTimeout(() => {
      if (milestones.first_zk_game) {
        react("welcome_back");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [react, milestones.first_zk_game]);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 24px 40px",
      }}
    >
      {intro === "welcome" && (
        <FirstRunWizard manual onClose={() => setIntro(null)} />
      )}
      {intro === "quiz" && (
        <PersonalityQuiz manual onClose={() => setIntro(null)} />
      )}

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            marginBottom: "12px",
            letterSpacing: "0.04em",
          }}
        >
          An interactive experiment in trust.
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-4xl)",
            marginBottom: "16px",
            lineHeight: 1.05,
          }}
        >
          Will you catch me?
        </h1>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
            maxWidth: "560px",
            margin: "0 auto",
            lineHeight: 1.5,
            color: "var(--text-secondary)",
          }}
        >
          One choice. Two people. Find out what happens when trust is returned —
          or broken.
        </p>
      </div>

      {/* Demo round — shows new users what the game looks like */}
      <div style={{ maxWidth: "1000px", width: "100%" }}>
        <TrustExperiment />
      </div>

      {/* Three entry points */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          maxWidth: "880px",
          width: "100%",
          marginTop: "40px",
        }}
      >
        {CARDS.map((card) => (
          <div
            key={card.title}
            className="glass-panel"
            style={{
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              boxShadow: `0 8px 32px ${card.glow}`,
            }}
          >
            <div
              style={{
                fontSize: "2.5rem",
                marginBottom: "16px",
                filter: `drop-shadow(0 0 12px ${card.glow})`,
              }}
            >
              {card.icon}
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-2xl)",
                color: card.color,
                marginBottom: "12px",
              }}
            >
              {card.title}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: "24px",
                flex: 1,
              }}
            >
              {card.description}
            </p>
            <Link
              to={card.route}
              onClick={() => {
                if (card.route === "/learn" || card.route === "/learn/play") {
                  unlock("visited_learn");
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "48px",
                padding: "10px 24px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-glass)",
                background: "var(--bg-glass-light)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {card.cta} →
            </Link>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "24px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setIntro("welcome")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-glass)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
          }}
        >
          Getting started
        </button>
        <button
          type="button"
          onClick={() => setIntro("quiz")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-glass)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
          }}
        >
          Discover your trust style
        </button>
      </div>

      {/* Next step hint for returning users */}
      <div style={{ marginTop: "24px", width: "100%", maxWidth: "640px" }}>
        <NextStepHint />
      </div>

      {/* Wallet hint for Play card */}
      {!address && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          ZK multiplayer uses a Stellar wallet — you can connect one in the
          lobby.
        </p>
      )}

      {/* Trust profile badge (if quiz completed) */}
      {profile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "24px",
            padding: "8px 16px",
            borderRadius: "99px",
            background: "rgba(102, 126, 234, 0.08)",
            border: "1px solid rgba(102, 126, 234, 0.2)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
        >
          <span>Your trust profile:</span>
          <span style={{ fontWeight: 700, color: "var(--accent-violet)" }}>
            {profile === "cooperator"
              ? "🤝 Cooperator"
              : profile === "strategist"
                ? "🧠 Strategist"
                : profile === "survivor"
                  ? "🛡️ Survivor"
                  : "🎲 Wildcard"}
          </span>
        </div>
      )}

      {/* Guided journey link */}
      <button
        type="button"
        onClick={() => void navigate("/learn")}
        style={{
          marginTop: "40px",
          padding: "10px 24px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-glass)",
          background: "transparent",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          cursor: "pointer",
          transition: "all var(--duration-fast) var(--ease-out)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-glass-light)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-secondary)";
        }}
      >
        📖 Prefer the guided narrative? Take the full journey →
      </button>

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-xs)",
          color: "var(--text-muted)",
          marginTop: "40px",
          textAlign: "center",
        }}
      >
        Based on Nicky Case's "The Evolution of Trust" — enhanced with ZK proofs
        on Stellar.
      </p>
    </div>
  );
};

export default Home;
