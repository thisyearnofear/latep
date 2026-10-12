/**
 * Everyday — the collection of everything you've already met.
 *
 * Four receipts, one per primitive, each with its mark, the everyday problem
 * it solves, what the mathematics actually adds, and a link to the round where
 * you already felt it. Rebuilt from `content/primitives.ts` (ticket B5): the
 * primitive list is the single source of truth, so this page can never drift
 * from the marks or the wording used on Home and in the epilogue.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Receipt } from "../components/receipt";
import { PRIMITIVES, type PrimitiveId } from "../content/primitives";
import "../styles/everyday.css";

/**
 * The everyday story attached to each primitive. The copy here is the
 * page's own; the names, marks and one-liners come from `primitives.ts`.
 */
interface Everyday {
  id: PrimitiveId;
  /** The situation someone has actually been in. */
  situation: string;
  /** What goes wrong without it. */
  problem: string;
  /** What the mathematics adds — and, honestly, what it doesn't. */
  adds: string;
  /** Where you already felt this. */
  tryHref: string;
  tryLabel: string;
}

const EVERYDAY: Everyday[] = [
  {
    id: "seal",
    situation: "Class and community votes",
    problem:
      "Once you see who voted what, the popular option snowballs — and people vote to please rather than to choose.",
    adds: "Everyone commits a hash of their ballot first and reveals after voting closes. No vote can be changed, and none can be seen, before the count.",
    tryHref: "/",
    tryLabel: "Play the round again",
  },
  {
    id: "handshake",
    situation: "Deals with strangers online",
    problem:
      "You agree on a price, they deliver, you ghost the payment — or the terms quietly “shift” after you've already committed.",
    adds: "Both sides bind to their move with a proof before revealing it. Once you let go, the arithmetic holds you to it. No take-backs.",
    tryHref: "/learn/play",
    tryLabel: "Practise the handshake",
  },
  {
    id: "net",
    situation: "Group buys and shared deposits",
    problem:
      "Twenty people send money to one organiser for a group order. The order goes wrong — who guarantees the refund?",
    adds: "The contract holds the pot and releases it on agreed conditions. Nobody has to be the trustworthy hero; the settlement is automatic.",
    tryHref: "/play",
    tryLabel: "See it settle on-chain",
  },
  {
    id: "pass",
    situation: "Members-only drops and doors",
    problem:
      "Airdrops, private sales, club lists: proving you belong usually means handing your identity to a stranger on the internet.",
    adds: "A zero-knowledge membership proof says “I'm on the list” without saying which entry is yours. Eligibility without exposure — this is the accreditation panel, running on-chain.",
    tryHref: "/play",
    tryLabel: "See the accreditation panel",
  },
];

export const RealLifePage: React.FC = () => (
  <div className="everyday">
    <header className="everyday-opening">
      <h1 className="everyday-title">That wasn&rsquo;t just a game</h1>
      <p className="everyday-situation">
        Every choice you made — lean in, hold back, held, toppled — is a trust
        problem you already have. Here&rsquo;s where you&rsquo;ll meet these
        four again.
      </p>
    </header>

    <ul className="everyday-list">
      {EVERYDAY.map((item) => {
        const primitive = PRIMITIVES.find((p) => p.id === item.id);
        if (!primitive) return null;
        return (
          <li key={item.id}>
            <Receipt
              wide
              className="everyday-receipt"
              title={primitive.name}
              footer={
                <p className="everyday-try">
                  {primitive.everyday}.{" "}
                  <Link to={item.tryHref}>{item.tryLabel} &rarr;</Link>
                </p>
              }
            >
              <h3 className="everyday-situation-title">{item.situation}</h3>
              <p className="everyday-problem">{item.problem}</p>
              <p className="everyday-adds">{item.adds}</p>
            </Receipt>
          </li>
        );
      })}
    </ul>

    {/* The honest scope, as a small receipt footer. */}
    <div className="everyday-scope">
      <Receipt
        full
        title="Honest scope"
        footer={
          <p className="everyday-scope-text">
            Stellar is a transparent ledger. This demo proves <em>moves</em> and{" "}
            <em>list membership</em> — not balances, and not full identity
            privacy. The stakes are testnet play money; the same commit-reveal
            and proof-checking flow works for real money.
          </p>
        }
      >
        <p className="everyday-scope-text">
          Every claim on this page is one the app can actually show you.
        </p>
      </Receipt>
    </div>

    <div className="everyday-actions">
      <Link to="/play" className="everyday-primary">
        Play it with a friend
      </Link>
      <Link to="/learn" className="everyday-secondary">
        Learn the mechanics
      </Link>
    </div>
  </div>
);

export default RealLifePage;
