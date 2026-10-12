/**
 * RealLifePage — the bridge between the game and the player's life.
 *
 * Every mechanic the player just experienced maps to an everyday trust
 * problem: sealed votes, group-buy deposits, members-only access, and
 * agreements that can't be quietly rewritten. Copy is grounded in the
 * same honest scope as the epilogue lesson (moves + membership, not
 * balances or full identity privacy).
 */
import React from "react";
import { Link } from "react-router-dom";
import { TrustFallCharacter } from "../components/TrustFallCharacter";

interface Scenario {
  emoji: string;
  title: string;
  problem: string;
  mechanic: string;
  how: string;
  state: "standing" | "caught" | "thinking" | "celebrating";
  color: "you" | "opponent";
}

const SCENARIOS: Scenario[] = [
  {
    emoji: "🗳️",
    title: "Class & community votes",
    problem:
      "Once you see who voted what, the popular option snowballs — and people vote to please, not to choose.",
    mechanic: "The sealed choice",
    how: "Everyone commits a hash of their ballot first, reveals after voting closes. No one can see — or change — a vote before the count.",
    state: "thinking",
    color: "opponent",
  },
  {
    emoji: "🛒",
    title: "Group buys & shared deposits",
    problem:
      "Twenty people send money to one organizer for a group order. The order goes wrong; who guarantees the refund?",
    mechanic: "The enforced catch",
    how: "The contract holds the pot and releases it only on agreed conditions. Nobody has to be the trustworthy hero — the settlement is automatic.",
    state: "caught",
    color: "you",
  },
  {
    emoji: "🎟️",
    title: "Members-only drops & doors",
    problem:
      "Airdrops, private sales, club lists: proving you belong usually means doxxing yourself to a stranger on the internet.",
    mechanic: "Proven membership",
    how: "A ZK membership proof says \"I'm on the list\" without saying which entry is mine. Eligibility without exposure — this app's accreditation panel already runs it on-chain.",
    state: "standing",
    color: "you",
  },
  {
    emoji: "🤝",
    title: "Deals with strangers online",
    problem:
      'You agree on a price, they deliver, you ghost the payment — or the terms "shift" after you\'ve already committed.',
    mechanic: "No take-backs",
    how: "Both sides bind to their move with a proof before revealing it. The fall you just played is the deal: once you let go, the math holds you to it.",
    state: "celebrating",
    color: "opponent",
  },
];

const Card: React.FC<{ scenario: Scenario }> = ({ scenario: s }) => (
  <div
    className="glass-panel"
    style={{
      padding: "24px",
      borderRadius: "var(--radius-lg, 16px)",
      display: "flex",
      gap: "18px",
      alignItems: "flex-start",
    }}
  >
    <div style={{ flexShrink: 0, paddingTop: "4px" }}>
      <TrustFallCharacter state={s.state} color={s.color} size="lg" />
    </div>
    <div>
      <h3
        style={{
          margin: "0 0 4px",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg, 20px)",
          color: "var(--text-primary)",
        }}
      >
        {s.emoji} {s.title}
      </h3>
      <div
        style={{
          display: "inline-block",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--accent-violet)",
          margin: "0 0 10px",
        }}
      >
        You already played: {s.mechanic}
      </div>
      <p
        style={{
          margin: "0 0 8px",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--text-primary)" }}>The problem — </strong>
        {s.problem}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--accent-cooperate)" }}>
          What the math adds —{" "}
        </strong>
        {s.how}
      </p>
    </div>
  </div>
);

export const RealLifePage: React.FC = () => (
  <div
    className="tf-fade-in-up"
    style={{
      maxWidth: "760px",
      margin: "0 auto",
      padding: "32px 24px 56px",
    }}
  >
    <div style={{ textAlign: "center", marginBottom: "32px" }}>
      <div style={{ marginBottom: "12px" }}>
        <TrustFallCharacter state="caught" color="you" size="xl" />
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-3xl, 30px)",
          margin: "0 0 10px",
          color: "var(--text-primary)",
        }}
      >
        That wasn&apos;t just a game
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-base, 16px)",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          margin: "0 auto",
          maxWidth: "560px",
        }}
      >
        Every choice you made — seal it, let go, catch or get caught — is a
        trust problem you already have in real life. Here&apos;s where
        you&apos;ll meet this again.
      </p>
    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        marginBottom: "32px",
      }}
    >
      {SCENARIOS.map((s) => (
        <Card key={s.title} scenario={s} />
      ))}
    </div>

    <div
      className="glass-panel"
      style={{
        padding: "18px 24px",
        borderRadius: "var(--radius-lg, 16px)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-xs, 12px)",
        color: "var(--text-muted)",
        lineHeight: 1.6,
        marginBottom: "28px",
      }}
    >
      Honest scope: this demo proves <em>moves</em> and <em>list membership</em>{" "}
      — not balances or full identity privacy. Stellar is a transparent ledger;
      the stakes here are testnet play money, but the same commit-reveal and
      proof-checking flow works for real coffee-money or contract money.
    </div>

    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
      <Link
        to="/play"
        style={{
          background: "var(--accent-violet)",
          color: "white",
          border: "none",
          borderRadius: "var(--radius-sm)",
          padding: "10px 20px",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Play it with a friend →
      </Link>
      <Link
        to="/learn"
        style={{
          background: "transparent",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-glass)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 20px",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          textDecoration: "none",
        }}
      >
        Learn the mechanics
      </Link>
    </div>
  </div>
);

export default RealLifePage;
